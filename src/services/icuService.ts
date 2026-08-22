import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
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
  ExpiryAlertInfo,
  ShiftType,
} from '../types/icu';

// Firestore collection names for ICU-DATA
const COLL_MEDICATIONS = 'icu_medications';
const COLL_EMERGENCY_CART = 'icu_emergency_cart';
const COLL_EMERGENCY_BOX = 'icu_emergency_box';
const COLL_FRIDGE_TEMP = 'icu_fridge_temp';
const COLL_HUMIDITY = 'icu_humidity';
const COLL_STAFF = 'icu_staff';

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

// 1. Staff Recorders Service
const DEFAULT_STAFF: StaffRecorder[] = [
  { id: '1', name: 'พว. กานดา รัตนวิชัย', role: 'พยาบาลวิชาชีพชำนาญการ (ICU หัวหน้าเวร)' },
  { id: '2', name: 'พว. สมชาย ทรงคุณ', role: 'พยาบาลวิชาชีพ (ICU Nurse)' },
  { id: '3', name: 'พว. ณภัทร สุขสมบูรณ์', role: 'พยาบาลวิชาชีพ (ICU Nurse)' },
  { id: '4', name: 'พว. วรรณภา มั่นคง', role: 'พยาบาลวิชาชีพ (ICU Nurse)' },
  { id: '5', name: 'พว. ปิยะวัฒน์ เจริญสุข', role: 'พยาบาลวิชาชีพ (ICU Nurse)' },
];

export async function getStaffList(): Promise<StaffRecorder[]> {
  try {
    const snap = await getDocs(collection(db, COLL_STAFF));
    if (snap.empty) {
      // Seed default staff
      for (const st of DEFAULT_STAFF) {
        await setDoc(doc(db, COLL_STAFF, st.id), st);
      }
      return DEFAULT_STAFF;
    }
    return snap.docs.map((d) => d.data() as StaffRecorder);
  } catch (err) {
    console.warn('Firebase staff read error, using local defaults:', err);
    return DEFAULT_STAFF;
  }
}

export async function saveStaffMember(staff: StaffRecorder): Promise<void> {
  try {
    await setDoc(doc(db, COLL_STAFF, staff.id), staff);
  } catch (err) {
    console.warn('Staff save error:', err);
  }
}

// 2. Daily Medication & Supplies (Adenosine 5 amp, Adrenaline 10 amp)
export function subscribeMonthMedications(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyMedicationRecord>) => void
) {
  const collRef = collection(db, COLL_MEDICATIONS);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyMedicationRecord> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyMedicationRecord;
        map[data.day] = data;
      });
      onUpdate(map);
    },
    (err) => {
      console.warn('Medications listener error:', err);
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
  const docId = makeDocId(yearCE, month, day);
  const docRef = doc(db, COLL_MEDICATIONS, docId);

  // Fetch existing or initialize
  const existingSnap = await getDoc(docRef);
  let existingData: DailyMedicationRecord = existingSnap.exists()
    ? (existingSnap.data() as DailyMedicationRecord)
    : {
        day,
        month,
        yearCE,
        yearThai,
        shifts: {},
      };

  existingData.shifts[shift] = shiftData;
  existingData.updatedAt = new Date().toISOString();

  await setDoc(docRef, existingData, { merge: true });
}

// 3. Emergency Cart (Alcohol 10 pcs, Adrenaline 5 amp, Cotton 2 packs + 3-month expiry alert)
export function subscribeMonthEmergencyCart(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyEmergencyCartRecord>) => void
) {
  const collRef = collection(db, COLL_EMERGENCY_CART);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyEmergencyCartRecord> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyEmergencyCartRecord;
        map[data.day] = data;
      });
      onUpdate(map);
    },
    (err) => {
      console.warn('Emergency Cart listener error:', err);
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
  const docId = makeDocId(yearCE, month, day);
  const docRef = doc(db, COLL_EMERGENCY_CART, docId);

  const existingSnap = await getDoc(docRef);
  let existingData: DailyEmergencyCartRecord = existingSnap.exists()
    ? (existingSnap.data() as DailyEmergencyCartRecord)
    : {
        day,
        month,
        yearCE,
        yearThai,
        shifts: {},
      };

  existingData.shifts[shift] = shiftData;
  existingData.updatedAt = new Date().toISOString();

  await setDoc(docRef, existingData, { merge: true });
}

// 4. Emergency Box (Daily once in Night shift 00.30-08.30)
export function subscribeMonthEmergencyBox(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyEmergencyBoxRecord>) => void
) {
  const collRef = collection(db, COLL_EMERGENCY_BOX);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyEmergencyBoxRecord> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyEmergencyBoxRecord;
        map[data.day] = data;
      });
      onUpdate(map);
    },
    (err) => {
      console.warn('Emergency Box listener error:', err);
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
  const docId = makeDocId(yearCE, month, day);
  const docRef = doc(db, COLL_EMERGENCY_BOX, docId);

  const record: DailyEmergencyBoxRecord = {
    day,
    month,
    yearCE,
    yearThai,
    nightShift: nightShiftData,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, record, { merge: true });
}

// 5. Medication Fridge Temperature (14.00, 22.00, 06.00, Max/Min 09.00)
export function subscribeMonthFridgeTemp(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyFridgeTempRecord>) => void
) {
  const collRef = collection(db, COLL_FRIDGE_TEMP);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyFridgeTempRecord> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyFridgeTempRecord;
        map[data.day] = data;
      });
      onUpdate(map);
    },
    (err) => {
      console.warn('Fridge Temp listener error:', err);
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
  const docId = makeDocId(yearCE, month, day);
  const docRef = doc(db, COLL_FRIDGE_TEMP, docId);

  const existingSnap = await getDoc(docRef);
  const baseData: DailyFridgeTempRecord = existingSnap.exists()
    ? (existingSnap.data() as DailyFridgeTempRecord)
    : {
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

  await setDoc(docRef, merged, { merge: true });
}

// 6. Humidity Monitoring (%RH: 14.00, 22.00, 06.00)
export function subscribeMonthHumidity(
  yearCE: number,
  month: number,
  onUpdate: (records: Record<number, DailyHumidityRecord>) => void
) {
  const collRef = collection(db, COLL_HUMIDITY);
  const q = query(collRef, where('yearCE', '==', yearCE), where('month', '==', month));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<number, DailyHumidityRecord> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DailyHumidityRecord;
        map[data.day] = data;
      });
      onUpdate(map);
    },
    (err) => {
      console.warn('Humidity listener error:', err);
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
  const docId = makeDocId(yearCE, month, day);
  const docRef = doc(db, COLL_HUMIDITY, docId);

  const existingSnap = await getDoc(docRef);
  const baseData: DailyHumidityRecord = existingSnap.exists()
    ? (existingSnap.data() as DailyHumidityRecord)
    : {
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

  await setDoc(docRef, merged, { merge: true });
}

// Sample Data Generator to populate current or chosen month for immediate evaluation
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

  for (let day = 1; day <= daysToFill; day++) {
    const docId = makeDocId(yearCE, month, day);
    const nurse1 = names[(day + 0) % names.length];
    const nurse2 = names[(day + 1) % names.length];
    const nurse3 = names[(day + 2) % names.length];

    // 1. Medication
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
          adenosine: {
            remainingCount: 5,
            targetCount: 5,
            unit: 'amp',
            notes: 'สภาพสมบูรณ์ พร้อมใช้',
            status: 'complete',
          },
          adrenaline: {
            remainingCount: 10,
            targetCount: 10,
            unit: 'amp',
            notes: 'ตรวจสอบแล้ว ครบตามเกณฑ์',
            status: 'complete',
          },
          isComplete: true,
        },
        afternoon: {
          recorderName: nurse2,
          recorderRole: 'พยาบาลวิชาชีพ',
          checkedAt: `${yearCE}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 17:00:00`,
          adenosine: {
            remainingCount: 5,
            targetCount: 5,
            unit: 'amp',
            notes: 'ปกติ',
            status: 'complete',
          },
          adrenaline: {
            remainingCount: day === 3 ? 9 : 10,
            targetCount: 10,
            unit: 'amp',
            notes: day === 3 ? 'ใช้ 1 amp ใน CPR เบิกชดเชยแล้ว' : 'ปกติ',
            status: day === 3 ? 'low' : 'complete',
          },
          isComplete: true,
        },
        night: {
          recorderName: nurse3,
          recorderRole: 'พยาบาลวิชาชีพ',
          checkedAt: `${yearCE}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 01:20:00`,
          adenosine: {
            remainingCount: 5,
            targetCount: 5,
            unit: 'amp',
            notes: 'พร้อมใช้งาน',
            status: 'complete',
          },
          adrenaline: {
            remainingCount: 10,
            targetCount: 10,
            unit: 'amp',
            notes: 'เบิกเติมครบ 10 amp แล้ว',
            status: 'complete',
          },
          isComplete: true,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COLL_MEDICATIONS, docId), medRecord);

    // 2. Emergency Cart
    const cartRecord: DailyEmergencyCartRecord = {
      day,
      month,
      yearCE,
      yearThai,
      shifts: {
        morning: {
          recorderName: nurse1,
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
    await setDoc(doc(db, COLL_EMERGENCY_CART, docId), cartRecord);

    // 3. Emergency Box (Daily once in Night shift)
    const boxRecord: DailyEmergencyBoxRecord = {
      day,
      month,
      yearCE,
      yearThai,
      nightShift: {
        recorderName: nurse3,
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
    await setDoc(doc(db, COLL_EMERGENCY_BOX, docId), boxRecord);

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
    await setDoc(doc(db, COLL_FRIDGE_TEMP, docId), tempRecord);

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
    await setDoc(doc(db, COLL_HUMIDITY, docId), humRecord);
  }
}
