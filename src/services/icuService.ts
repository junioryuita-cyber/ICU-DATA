import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  DailyMedicationRecord,
  DailyEmergencyCartRecord,
  DailyEmergencyBoxRecord,
  DailyFridgeTempRecord,
  DailyHumidityRecord,
  StaffRecorder,
  ShiftType,
  ICU_MEDICATION_CATALOG,
  EMERGENCY_CART_CATALOG,
  EMERGENCY_BOX_CATALOG,
  MedicationItemRecord,
} from '../types/icu';

// Firestore collection names for ICU-DATA
export const COLL_MEDICATIONS = 'icu_medications';
export const COLL_EMERGENCY_CART = 'icu_emergency_cart';
export const COLL_EMERGENCY_BOX = 'icu_emergency_box';
export const COLL_FRIDGE_TEMP = 'icu_fridge_temp';
export const COLL_HUMIDITY = 'icu_humidity';
export const COLL_STAFF = 'icu_staff';

// Helper to calculate days in month
export function getDaysInMonth(yearCE: number, month: number): number {
  return new Date(yearCE, month, 0).getDate();
}

// Check expiry status against today (warn if within 90 days / 3 months)
export function checkExpiryAlert(expiryDateStr?: string): {
  status: 'normal' | 'warning_3months' | 'expired';
  daysRemaining: number;
} {
  if (!expiryDateStr) return { status: 'normal', daysRemaining: 999 };

  const exp = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', daysRemaining: diffDays };
  } else if (diffDays <= 90) {
    return { status: 'warning_3months', daysRemaining: diffDays };
  }
  return { status: 'normal', daysRemaining: diffDays };
}

// Document ID generator e.g. "2026_08_day15"
function makeDocId(yearCE: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${yearCE}_${m}_${d}`;
}

// LocalStorage helpers for zero-loss offline and instant optimistic UI
function getLocalCache<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(`icu_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalCache<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`icu_${key}`, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage cache error:', e);
  }
}

// Check Firebase Firestore connectivity
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const testDocRef = doc(db, '_health_check', 'ping');
    await setDoc(testDocRef, { timestamp: new Date().toISOString(), status: 'online' }, { merge: true });
    return { success: true, message: 'เชื่อมต่อ Firestore (ICU-DATA) สำเร็จ' };
  } catch (err: any) {
    console.warn('Firestore connection test warning:', err);
    return { success: false, message: err?.message || 'ไม่สามารถติดต่อฐานข้อมูลได้' };
  }
}

// 1. Staff Recorders Service (Cleared for real production use)
const MOCK_NAMES_TO_PURGE = [
  'พว. กานดา รัตนวิชัย',
  'พว. สมชาย ทรงคุณ',
  'พว. ณภัทร สุขสมบูรณ์',
  'พว. วรรณภา มั่นคง',
  'พว. ปิยะวัฒน์ เจริญสุข',
];

export async function getStaffList(): Promise<StaffRecorder[]> {
  const localStaff = getLocalCache<StaffRecorder[]>('staff', []);
  // Clean mock names if found in local cache
  const cleanLocal = localStaff.filter((s) => !MOCK_NAMES_TO_PURGE.includes(s.name));
  if (cleanLocal.length !== localStaff.length) {
    setLocalCache('staff', cleanLocal);
  }

  try {
    const snap = await getDocs(collection(db, COLL_STAFF));
    if (snap.empty) {
      return cleanLocal;
    }
    const staffList = snap.docs
      .map((d) => d.data() as StaffRecorder)
      .filter((s) => !MOCK_NAMES_TO_PURGE.includes(s.name));

    // Also purge mock documents from firestore if any exist
    for (const d of snap.docs) {
      const data = d.data() as StaffRecorder;
      if (MOCK_NAMES_TO_PURGE.includes(data?.name)) {
        deleteDoc(d.ref).catch(() => {});
      }
    }

    setLocalCache('staff', staffList);
    return staffList;
  } catch (err) {
    console.warn('Firebase staff read error, using cached data:', err);
    return cleanLocal;
  }
}

export async function saveStaffMember(staff: StaffRecorder): Promise<void> {
  const current = getLocalCache<StaffRecorder[]>('staff', []);
  const updated = [...current.filter((s) => s.id !== staff.id), staff];
  setLocalCache('staff', updated);

  try {
    await setDoc(doc(db, COLL_STAFF, staff.id), staff);
  } catch (err) {
    console.warn('Staff save error in Firestore:', err);
  }
}

export async function deleteStaffMember(staffId: string): Promise<void> {
  const current = getLocalCache<StaffRecorder[]>('staff', []);
  const updated = current.filter((s) => s.id !== staffId);
  setLocalCache('staff', updated);

  try {
    await deleteDoc(doc(db, COLL_STAFF, staffId));
  } catch (err) {
    console.warn('Staff delete error in Firestore:', err);
  }
}

// 2. Daily Medication & Supplies (Adenosine 5 amp, Adrenaline 10 amp)
export function subscribeMonthMedications(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyMedicationRecord>) => void
) {
  const cacheKey = `meds_${yearCE}_${month}`;
  const initialData = getLocalCache<Record<number, DailyMedicationRecord>>(cacheKey, {});
  if (Object.keys(initialData).length > 0) {
    onUpdate(initialData);
  }

  const collRef = collection(db, COLL_MEDICATIONS);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyMedicationRecord> = { ...initialData };
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyMedicationRecord;
        map[data.day] = data;
      });
      setLocalCache(cacheKey, map);
      onUpdate(map);
    },
    (err) => {
      console.warn('Medications listener warning, using local cache:', err);
      onUpdate(initialData);
    }
  );
}

export async function saveShiftMedication(
  yearCE: number,
  yearThai: number,
  month: number,
  day: number,
  shift: ShiftType,
  shiftData: any
): Promise<void> {
  const cacheKey = `meds_${yearCE}_${month}`;
  const currentMap = getLocalCache<Record<number, DailyMedicationRecord>>(cacheKey, {});
  
  const existingRecord: DailyMedicationRecord = currentMap[day] || {
    day,
    month,
    yearCE,
    yearThai,
    shifts: {},
  };

  existingRecord.shifts[shift] = shiftData;
  existingRecord.updatedAt = new Date().toISOString();
  currentMap[day] = existingRecord;
  setLocalCache(cacheKey, currentMap);

  // Sync to Firestore
  try {
    const docId = makeDocId(yearCE, month, day);
    const docRef = doc(db, COLL_MEDICATIONS, docId);
    await setDoc(docRef, existingRecord, { merge: true });
  } catch (err) {
    console.error('Firestore saveShiftMedication error:', err);
    throw err;
  }
}

// 3. Emergency Cart (Alcohol 10 pcs, Adrenaline 5 amp, Cotton 2 packs + 3-month expiry alert)
export function subscribeMonthEmergencyCart(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyEmergencyCartRecord>) => void
) {
  const cacheKey = `cart_${yearCE}_${month}`;
  const initialData = getLocalCache<Record<number, DailyEmergencyCartRecord>>(cacheKey, {});
  if (Object.keys(initialData).length > 0) {
    onUpdate(initialData);
  }

  const collRef = collection(db, COLL_EMERGENCY_CART);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyEmergencyCartRecord> = { ...initialData };
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyEmergencyCartRecord;
        map[data.day] = data;
      });
      setLocalCache(cacheKey, map);
      onUpdate(map);
    },
    (err) => {
      console.warn('Emergency Cart listener warning, using local cache:', err);
      onUpdate(initialData);
    }
  );
}

export async function saveShiftEmergencyCart(
  yearCE: number,
  yearThai: number,
  month: number,
  day: number,
  shift: ShiftType,
  shiftData: any
): Promise<void> {
  const cacheKey = `cart_${yearCE}_${month}`;
  const currentMap = getLocalCache<Record<number, DailyEmergencyCartRecord>>(cacheKey, {});
  
  const existingRecord: DailyEmergencyCartRecord = currentMap[day] || {
    day,
    month,
    yearCE,
    yearThai,
    shifts: {},
  };

  existingRecord.shifts[shift] = shiftData;
  existingRecord.updatedAt = new Date().toISOString();
  currentMap[day] = existingRecord;
  setLocalCache(cacheKey, currentMap);

  try {
    const docId = makeDocId(yearCE, month, day);
    const docRef = doc(db, COLL_EMERGENCY_CART, docId);
    await setDoc(docRef, existingRecord, { merge: true });
  } catch (err) {
    console.error('Firestore saveShiftEmergencyCart error:', err);
    throw err;
  }
}

// 4. Emergency Box (Daily once in Night shift 00.30-08.30)
export function subscribeMonthEmergencyBox(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyEmergencyBoxRecord>) => void
) {
  const cacheKey = `box_${yearCE}_${month}`;
  const initialData = getLocalCache<Record<number, DailyEmergencyBoxRecord>>(cacheKey, {});
  if (Object.keys(initialData).length > 0) {
    onUpdate(initialData);
  }

  const collRef = collection(db, COLL_EMERGENCY_BOX);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyEmergencyBoxRecord> = { ...initialData };
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyEmergencyBoxRecord;
        map[data.day] = data;
      });
      setLocalCache(cacheKey, map);
      onUpdate(map);
    },
    (err) => {
      console.warn('Emergency Box listener warning, using local cache:', err);
      onUpdate(initialData);
    }
  );
}

export async function saveEmergencyBoxRecord(
  yearCE: number,
  yearThai: number,
  month: number,
  day: number,
  nightShiftData: any
): Promise<void> {
  const cacheKey = `box_${yearCE}_${month}`;
  const currentMap = getLocalCache<Record<number, DailyEmergencyBoxRecord>>(cacheKey, {});

  const record: DailyEmergencyBoxRecord = {
    day,
    month,
    yearCE,
    yearThai,
    nightShift: nightShiftData,
    updatedAt: new Date().toISOString(),
  };

  currentMap[day] = record;
  setLocalCache(cacheKey, currentMap);

  try {
    const docId = makeDocId(yearCE, month, day);
    const docRef = doc(db, COLL_EMERGENCY_BOX, docId);
    await setDoc(docRef, record, { merge: true });
  } catch (err) {
    console.error('Firestore saveEmergencyBoxRecord error:', err);
    throw err;
  }
}

// 5. Medication Fridge Temperature (14.00, 22.00, 06.00, Max/Min 09.00)
export function subscribeMonthFridgeTemp(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyFridgeTempRecord>) => void
) {
  const cacheKey = `fridge_${yearCE}_${month}`;
  const initialData = getLocalCache<Record<number, DailyFridgeTempRecord>>(cacheKey, {});
  if (Object.keys(initialData).length > 0) {
    onUpdate(initialData);
  }

  const collRef = collection(db, COLL_FRIDGE_TEMP);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyFridgeTempRecord> = { ...initialData };
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyFridgeTempRecord;
        map[data.day] = data;
      });
      setLocalCache(cacheKey, map);
      onUpdate(map);
    },
    (err) => {
      console.warn('Fridge Temp listener warning, using local cache:', err);
      onUpdate(initialData);
    }
  );
}

export async function saveFridgeTempRecord(
  yearCE: number,
  yearThai: number,
  month: number,
  day: number,
  partialData: Partial<DailyFridgeTempRecord>
): Promise<void> {
  const cacheKey = `fridge_${yearCE}_${month}`;
  const currentMap = getLocalCache<Record<number, DailyFridgeTempRecord>>(cacheKey, {});

  const baseData: DailyFridgeTempRecord = currentMap[day] || {
    day,
    month,
    yearCE,
    yearThai,
    morning_14: { temp: null, recorderName: '', status: 'unrecorded' },
    afternoon_22: { temp: null, recorderName: '', status: 'unrecorded' },
    night_06: { temp: null, recorderName: '', status: 'unrecorded' },
    dailyMax_09: { temp: null, recorderName: '' },
    dailyMin_09: { temp: null, recorderName: '' },
  };

  const merged: DailyFridgeTempRecord = {
    ...baseData,
    ...partialData,
    day,
    month,
    yearCE,
    yearThai,
    updatedAt: new Date().toISOString(),
  };

  currentMap[day] = merged;
  setLocalCache(cacheKey, currentMap);

  try {
    const docId = makeDocId(yearCE, month, day);
    const docRef = doc(db, COLL_FRIDGE_TEMP, docId);
    await setDoc(docRef, merged, { merge: true });
  } catch (err) {
    console.error('Firestore saveFridgeTempRecord error:', err);
    throw err;
  }
}

// 6. Humidity Monitoring (%RH: 14.00, 22.00, 06.00)
export function subscribeMonthHumidity(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyHumidityRecord>) => void
) {
  const cacheKey = `humidity_${yearCE}_${month}`;
  const initialData = getLocalCache<Record<number, DailyHumidityRecord>>(cacheKey, {});
  if (Object.keys(initialData).length > 0) {
    onUpdate(initialData);
  }

  const collRef = collection(db, COLL_HUMIDITY);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyHumidityRecord> = { ...initialData };
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyHumidityRecord;
        map[data.day] = data;
      });
      setLocalCache(cacheKey, map);
      onUpdate(map);
    },
    (err) => {
      console.warn('Humidity listener warning, using local cache:', err);
      onUpdate(initialData);
    }
  );
}

export async function saveHumidityRecord(
  yearCE: number,
  yearThai: number,
  month: number,
  day: number,
  partialData: Partial<DailyHumidityRecord>
): Promise<void> {
  const cacheKey = `humidity_${yearCE}_${month}`;
  const currentMap = getLocalCache<Record<number, DailyHumidityRecord>>(cacheKey, {});

  const baseData: DailyHumidityRecord = currentMap[day] || {
    day,
    month,
    yearCE,
    yearThai,
    morning_14: { humidity: null, recorderName: '', status: 'unrecorded' },
    afternoon_22: { humidity: null, recorderName: '', status: 'unrecorded' },
    night_06: { humidity: null, recorderName: '', status: 'unrecorded' },
  };

  const merged: DailyHumidityRecord = {
    ...baseData,
    ...partialData,
    day,
    month,
    yearCE,
    yearThai,
    updatedAt: new Date().toISOString(),
  };

  currentMap[day] = merged;
  setLocalCache(cacheKey, currentMap);

  try {
    const docId = makeDocId(yearCE, month, day);
    const docRef = doc(db, COLL_HUMIDITY, docId);
    await setDoc(docRef, merged, { merge: true });
  } catch (err) {
    console.error('Firestore saveHumidityRecord error:', err);
    throw err;
  }
}

// Clear/Reset data for a specific month (allows user to purge any test/sample data to start 100% clean)
export async function clearMonthData(yearCE: number, month: number): Promise<void> {
  const daysInMonth = getDaysInMonth(yearCE, month);

  // Clear local caches for this month
  localStorage.removeItem(`icu_meds_${yearCE}_${month}`);
  localStorage.removeItem(`icu_cart_${yearCE}_${month}`);
  localStorage.removeItem(`icu_box_${yearCE}_${month}`);
  localStorage.removeItem(`icu_fridge_${yearCE}_${month}`);
  localStorage.removeItem(`icu_humidity_${yearCE}_${month}`);

  // Collections to clear
  const collections = [
    COLL_MEDICATIONS,
    COLL_EMERGENCY_CART,
    COLL_EMERGENCY_BOX,
    COLL_FRIDGE_TEMP,
    COLL_HUMIDITY,
  ];

  const deletePromises: Promise<void>[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const docId = makeDocId(yearCE, month, day);
    for (const coll of collections) {
      deletePromises.push(
        deleteDoc(doc(db, coll, docId)).catch(() => {})
      );
    }
  }

  await Promise.all(deletePromises);
}

// Sample Data Generator (deprecated - kept for backwards compatibility)
export async function generateSampleMonthData(
  yearCE: number,
  yearThai: number,
  month: number,
  staffNames: string[]
): Promise<void> {
  const daysInMonth = getDaysInMonth(yearCE, month);
  const today = new Date();
  const currentDay = yearCE === today.getFullYear() && month === today.getMonth() + 1 ? today.getDate() : 15;
  const daysToFill = Math.min(daysInMonth, Math.max(7, currentDay));

  const names = staffNames.length > 0 ? staffNames : ['พว. กานดา รัตนวิชัย', 'พว. สมชาย ทรงคุณ', 'พว. ณภัทร สุขสมบูรณ์'];

  // Calculate future expiry dates for cotton (e.g. 60 days ahead = 3-month warning, 180 days = normal)
  const warningExpiry = new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const normalExpiry = new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const medsMap: Record<number, DailyMedicationRecord> = {};
  const cartMap: Record<number, DailyEmergencyCartRecord> = {};
  const boxMap: Record<number, DailyEmergencyBoxRecord> = {};
  const fridgeMap: Record<number, DailyFridgeTempRecord> = {};
  const humMap: Record<number, DailyHumidityRecord> = {};

  for (let day = 1; day <= daysToFill; day++) {
    const docId = makeDocId(yearCE, month, day);
    const nurse1 = names[(day + 0) % names.length];
    const nurse2 = names[(day + 1) % names.length];
    const nurse3 = names[(day + 2) % names.length];

    // 1. Medication (29 items with expiry dates)
    const generateShiftItems = (isAfternoonDay3: boolean): Record<string, MedicationItemRecord> => {
      const itemsMap: Record<string, MedicationItemRecord> = {};
      ICU_MEDICATION_CATALOG.forEach((med, idx) => {
        let count = med.targetCount;
        let notes = 'ปกติ ครบตามเกณฑ์';
        let status: 'complete' | 'low' | 'empty' = 'complete';

        if (isAfternoonDay3 && med.id === 'adrenaline') {
          count = 9;
          notes = 'ใช้ 1 amp ใน CPR เบิกชดเชยแล้ว';
          status = 'low';
        }

        // Add sample expiry dates (some warning < 90 days, others safe)
        const expDate = idx === 1 || idx === 8 || idx === 15 ? warningExpiry : normalExpiry;
        const expAlert = idx === 1 || idx === 8 || idx === 15 ? 'warning_3months' : 'normal';

        itemsMap[med.id] = {
          remainingCount: count,
          targetCount: med.targetCount,
          unit: med.unit,
          notes,
          status,
          expiryDate: expDate,
          expiryAlert: expAlert,
        };
      });
      return itemsMap;
    };

    const medRecord: DailyMedicationRecord = {
      day,
      month,
      yearCE,
      yearThai,
      shifts: {
        morning: {
          recorderName: nurse1,
          recorderRole: 'พยาบาลวิชาชีพ',
          checkedAt: `${yearCE}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 09:15:00`,
          items: generateShiftItems(false),
          overallNotes: 'ตรวจสอบครบ 29 รายการ สภาพสมบูรณ์',
          isComplete: true,
        },
        afternoon: {
          recorderName: nurse2,
          recorderRole: 'พยาบาลวิชาชีพ',
          checkedAt: `${yearCE}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 17:00:00`,
          items: generateShiftItems(day === 3),
          overallNotes: day === 3 ? 'มีการใช้ยา CPR ระหว่างเวร' : 'ส่งเวรเรียบร้อย',
          isComplete: true,
        },
        night: {
          recorderName: nurse3,
          recorderRole: 'พยาบาลวิชาชีพ',
          checkedAt: `${yearCE}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 01:20:00`,
          items: generateShiftItems(false),
          overallNotes: 'พร้อมใช้งานตลอด 24 ชั่วโมง',
          isComplete: true,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    medsMap[day] = medRecord;

    // 2. Emergency Cart (45 items across 5 shelves)
    const generateCartItems = (): Record<string, MedicationItemRecord> => {
      const itemsMap: Record<string, MedicationItemRecord> = {};
      EMERGENCY_CART_CATALOG.forEach((item, idx) => {
        const expDate = idx === 12 || idx === 25 ? warningExpiry : normalExpiry;
        const expAlert = idx === 12 || idx === 25 ? 'warning_3months' : 'normal';
        itemsMap[item.id] = {
          remainingCount: item.targetCount,
          targetCount: item.targetCount,
          unit: item.unit,
          notes: 'พร้อมใช้งาน',
          status: 'complete',
          expiryDate: expDate,
          expiryAlert: expAlert,
        };
      });
      return itemsMap;
    };

    const cartRecord: DailyEmergencyCartRecord = {
      day,
      month,
      yearCE,
      yearThai,
      shifts: {
        morning: {
          recorderName: nurse1,
          items: generateCartItems(),
          alcohol70: { remainingCount: 10, targetCount: 10, unit: 'แผ่น', notes: 'พร้อมใช้', status: 'complete' },
          adrenaline: { remainingCount: 5, targetCount: 5, unit: 'amp', notes: 'พร้อมใช้', status: 'complete' },
          cottonBall: {
            remainingCount: 2,
            targetCount: 2,
            unit: 'ห่อ',
            notes: 'ซองปิดผนึกเรียบร้อย',
            status: 'complete',
            expiryDate: day % 2 === 0 ? warningExpiry : normalExpiry,
            expiryAlert: day % 2 === 0 ? 'warning_3months' : 'normal',
          },
          isComplete: true,
        },
        afternoon: {
          recorderName: nurse2,
          items: generateCartItems(),
          alcohol70: { remainingCount: 10, targetCount: 10, unit: 'แผ่น', notes: 'ครบ', status: 'complete' },
          adrenaline: { remainingCount: 5, targetCount: 5, unit: 'amp', notes: 'ครบ', status: 'complete' },
          cottonBall: {
            remainingCount: 2,
            targetCount: 2,
            unit: 'ห่อ',
            notes: 'ปกติ',
            status: 'complete',
            expiryDate: day % 2 === 0 ? warningExpiry : normalExpiry,
            expiryAlert: day % 2 === 0 ? 'warning_3months' : 'normal',
          },
          isComplete: true,
        },
        night: {
          recorderName: nurse3,
          items: generateCartItems(),
          alcohol70: { remainingCount: 10, targetCount: 10, unit: 'แผ่น', notes: 'ครบ', status: 'complete' },
          adrenaline: { remainingCount: 5, targetCount: 5, unit: 'amp', notes: 'ครบ', status: 'complete' },
          cottonBall: {
            remainingCount: 2,
            targetCount: 2,
            unit: 'ห่อ',
            notes: 'ตรวจเรียบร้อย',
            status: 'complete',
            expiryDate: day % 2 === 0 ? warningExpiry : normalExpiry,
            expiryAlert: day % 2 === 0 ? 'warning_3months' : 'normal',
          },
          isComplete: true,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    cartMap[day] = cartRecord;

    // 3. Emergency Box (26 items, Daily once in Night shift)
    const generateBoxItems = (): Record<string, MedicationItemRecord> => {
      const itemsMap: Record<string, MedicationItemRecord> = {};
      EMERGENCY_BOX_CATALOG.forEach((item, idx) => {
        const expDate = idx === 0 || idx === 21 || idx === 22 ? warningExpiry : normalExpiry;
        const expAlert = idx === 0 || idx === 21 || idx === 22 ? 'warning_3months' : 'normal';
        itemsMap[item.id] = {
          remainingCount: item.targetCount,
          targetCount: item.targetCount,
          unit: item.unit,
          notes: 'ตรวจสภาพและวันหมดอายุเรียบร้อย',
          status: 'complete',
          expiryDate: expDate,
          expiryAlert: expAlert,
        };
      });
      return itemsMap;
    };

    const boxRecord: DailyEmergencyBoxRecord = {
      day,
      month,
      yearCE,
      yearThai,
      nightShift: {
        recorderName: nurse3,
        items: generateBoxItems(),
        alcohol70: { remainingCount: 10, targetCount: 10, unit: 'แผ่น', notes: 'กล่องล็อกซีลเรียบร้อย', status: 'complete' },
        adrenaline: { remainingCount: 5, targetCount: 5, unit: 'amp', notes: 'ครบตามเกณฑ์', status: 'complete' },
        cottonBall: {
          remainingCount: 2,
          targetCount: 2,
          unit: 'ห่อ',
          notes: 'ตรวจวันหมดอายุแล้ว',
          status: 'complete',
          expiryDate: warningExpiry,
          expiryAlert: 'warning_3months',
        },
        overallNotes: 'ซีลล็อกหมายเลข ICU-BOX-04 สภาพสมบูรณ์',
        isComplete: true,
      },
      updatedAt: new Date().toISOString(),
    };
    boxMap[day] = boxRecord;

    // 4. Fridge Temp (Range 2 - 8 °C, Recorded at 14.00, 22.00, 06.00 + Max/Min 09.00)
    const baseT = 4.2 + Math.sin(day * 0.7) * 1.5;
    const temp14 = Number((baseT + (Math.random() * 0.8 - 0.4)).toFixed(1));
    const temp22 = Number((baseT - 0.3 + (Math.random() * 0.6 - 0.3)).toFixed(1));
    const temp06 = Number((baseT - 0.6 + (Math.random() * 0.6 - 0.3)).toFixed(1));
    const max09 = Number((Math.max(temp14, temp22, temp06) + 0.6).toFixed(1));
    const min09 = Number((Math.min(temp14, temp22, temp06) - 0.5).toFixed(1));

    const tempRecord: DailyFridgeTempRecord = {
      day,
      month,
      yearCE,
      yearThai,
      morning_14: {
        temp: temp14,
        recorderName: nurse1,
        status: temp14 >= 2 && temp14 <= 8 ? 'normal' : temp14 < 2 ? 'low' : 'high',
        notes: 'อุณหภูมิอยู่ในเกณฑ์มาตรฐาน',
      },
      afternoon_22: {
        temp: temp22,
        recorderName: nurse2,
        status: temp22 >= 2 && temp22 <= 8 ? 'normal' : temp22 < 2 ? 'low' : 'high',
        notes: 'ปกติ',
      },
      night_06: {
        temp: temp06,
        recorderName: nurse3,
        status: temp06 >= 2 && temp06 <= 8 ? 'normal' : temp06 < 2 ? 'low' : 'high',
        notes: 'ปกติ',
      },
      dailyMax_09: {
        temp: max09,
        recorderName: nurse1,
        notes: 'อ่านค่า Max Thermometer 09.00',
      },
      dailyMin_09: {
        temp: min09,
        recorderName: nurse1,
        notes: 'อ่านค่า Min Thermometer 09.00',
      },
      updatedAt: new Date().toISOString(),
    };
    fridgeMap[day] = tempRecord;

    // 5. Humidity (Range 40 - 75 %RH, Recorded at 14.00, 22.00, 06.00)
    const baseH = 55 + Math.cos(day * 0.5) * 8;
    const hum14 = Number((baseH + (Math.random() * 6 - 3)).toFixed(0));
    const hum22 = Number((baseH + 3 + (Math.random() * 4 - 2)).toFixed(0));
    const hum06 = Number((baseH + 5 + (Math.random() * 4 - 2)).toFixed(0));

    const humRecord: DailyHumidityRecord = {
      day,
      month,
      yearCE,
      yearThai,
      morning_14: {
        humidity: hum14,
        recorderName: nurse1,
        status: hum14 >= 40 && hum14 <= 75 ? 'normal' : hum14 < 40 ? 'low' : 'high',
        notes: 'ความชื้นห้องเตรียมยาและตู้เย็นปกติ',
      },
      afternoon_22: {
        humidity: hum22,
        recorderName: nurse2,
        status: hum22 >= 40 && hum22 <= 75 ? 'normal' : hum22 < 40 ? 'low' : 'high',
        notes: 'ปกติ',
      },
      night_06: {
        humidity: hum06,
        recorderName: nurse3,
        status: hum06 >= 40 && hum06 <= 75 ? 'normal' : hum06 < 40 ? 'low' : 'high',
        notes: 'ปกติ',
      },
      updatedAt: new Date().toISOString(),
    };
    humMap[day] = humRecord;

    // Async push to firestore with silent error handling
    try {
      await setDoc(doc(db, COLL_MEDICATIONS, docId), medRecord);
      await setDoc(doc(db, COLL_EMERGENCY_CART, docId), cartRecord);
      await setDoc(doc(db, COLL_EMERGENCY_BOX, docId), boxRecord);
      await setDoc(doc(db, COLL_FRIDGE_TEMP, docId), tempRecord);
      await setDoc(doc(db, COLL_HUMIDITY, docId), humRecord);
    } catch (e) {
      console.warn('Sample data doc write warning:', e);
    }
  }

  // Save full maps to cache
  setLocalCache(`meds_${yearCE}_${month}`, medsMap);
  setLocalCache(`cart_${yearCE}_${month}`, cartMap);
  setLocalCache(`box_${yearCE}_${month}`, boxMap);
  setLocalCache(`fridge_${yearCE}_${month}`, fridgeMap);
  setLocalCache(`humidity_${yearCE}_${month}`, humMap);
}
