/**
 * ICU-DATA TypeScript definitions
 * System for ICU Medication (29 items), Emergency Cart, Emergency Box, Refrigerator Temperature & Humidity Logs
 */

export type ShiftType = 'morning' | 'afternoon' | 'night';

export interface ShiftInfo {
  id: ShiftType;
  nameThai: string;
  timeRange: string;
  color: string;
  badgeBg: string;
}

export const ICU_SHIFTS: Record<ShiftType, ShiftInfo> = {
  morning: {
    id: 'morning',
    nameThai: 'เวรเช้า',
    timeRange: '08.30 - 16.30 น.',
    color: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  afternoon: {
    id: 'afternoon',
    nameThai: 'เวรบ่าย',
    timeRange: '16.30 - 00.30 น.',
    color: 'text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  night: {
    id: 'night',
    nameThai: 'เวรดึก',
    timeRange: '00.30 - 08.30 น.',
    color: 'text-indigo-700',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
};

export const THAI_MONTHS = [
  { value: 1, name: 'มกราคม', short: 'ม.ค.' },
  { value: 2, name: 'กุมภาพันธ์', short: 'ก.พ.' },
  { value: 3, name: 'มีนาคม', short: 'มี.ค.' },
  { value: 4, name: 'เมษายน', short: 'เม.ย.' },
  { value: 5, name: 'พฤษภาคม', short: 'พ.ค.' },
  { value: 6, name: 'มิถุนายน', short: 'มิ.ย.' },
  { value: 7, name: 'กรกฎาคม', short: 'ก.ค.' },
  { value: 8, name: 'สิงหาคม', short: 'ส.ค.' },
  { value: 9, name: 'กันยายน', short: 'ก.ย.' },
  { value: 10, name: 'ตุลาคม', short: 'ต.ค.' },
  { value: 11, name: 'พฤศจิกายน', short: 'พ.ย.' },
  { value: 12, name: 'ธันวาคม', short: 'ธ.ค.' },
];

// Years from พ.ศ. 2569 to 2580 (2026 to 2037)
export const THAI_YEARS = Array.from({ length: 12 }, (_, i) => {
  const thaiYear = 2569 + i;
  const ceYear = 2026 + i;
  return { thaiYear, ceYear, label: `พ.ศ. ${thaiYear} (${ceYear})` };
});

export interface StaffRecorder {
  id: string;
  name: string;
  role: string;
  licenseNo?: string;
  lastUsedAt?: string;
}

// 29 Specific Medication & Supplies Catalog for ICU
export interface MedicationDef {
  id: string;
  name: string;
  targetCount: number;
  unit: string;
  category: string;
}

export const ICU_MEDICATION_CATALOG: MedicationDef[] = [
  { id: 'adenosine', name: 'Adenosine 6 mg/ml inj', targetCount: 5, unit: 'amp', category: 'ยาระบบหัวใจและหลอดเลือด' },
  { id: 'adrenaline', name: 'Adrenaline 1 mg/ml inj', targetCount: 10, unit: 'amp', category: 'ยาช่วยชีวิตฉุกเฉิน (CPR)' },
  { id: 'alteplase', name: 'Alteplase inj. 50 mg', targetCount: 2, unit: 'กล่อง', category: 'ยาละลายลิ่มเลือด (Thrombolytic)' },
  { id: 'albumin5', name: '5%Albumin 250 ml', targetCount: 2, unit: 'vial', category: 'สารน้ำและโปรตีนทดแทน' },
  { id: 'amiodarone', name: 'Amiodarone 150 mg/3ml', targetCount: 6, unit: 'amp', category: 'ยาระบบหัวใจและหลอดเลือด' },
  { id: 'calcium_gluconate', name: '10% Calcium Gluconate 10 ml', targetCount: 2, unit: 'amp', category: 'เกลือแร่และสารจำเป็น' },
  { id: 'chlorpheniramine', name: 'Chlorpheniramine 10 mg', targetCount: 2, unit: 'amp', category: 'ยาแก้แพ้และแอนติฮิสตามีน' },
  { id: 'cisatracurium_150', name: 'Cisatracurium 150mg/30 ml', targetCount: 5, unit: 'vial', category: 'ยาหย่อนกล้ามเนื้อ (Neuromuscular blocker)' },
  { id: 'cisatracurium_10', name: 'Cisatracurium 10mg/5 ml', targetCount: 25, unit: 'vial', category: 'ยาหย่อนกล้ามเนื้อ (Neuromuscular blocker)' },
  { id: 'dexamethasone', name: 'Dexamathasone 5 mg/ml', targetCount: 2, unit: 'amp', category: 'ยาสเตียรอยด์ (Steroids)' },
  { id: 'digoxin', name: 'Digoxin 0.5 mg/2ml', targetCount: 1, unit: 'amp', category: 'ยาระบบหัวใจและหลอดเลือด' },
  { id: 'dobutamine', name: 'Dobutamine 250mg', targetCount: 2, unit: 'amp', category: 'ยากระตุ้นหัวใจ (Inotropic)' },
  { id: 'dopamine', name: 'Dopamine 250mg/10 ml', targetCount: 2, unit: 'amp', category: 'ยากระตุ้นความดัน (Vasopressor)' },
  { id: 'furosemide_20', name: 'Furosemide 20 mg/2ml', targetCount: 4, unit: 'amp', category: 'ยาขับปัสสาวะ (Diuretics)' },
  { id: 'furosemide_250', name: 'Furosemide 250 mg/10ml', targetCount: 2, unit: 'amp', category: 'ยาขับปัสสาวะ (Diuretics)' },
  { id: 'glucose_50', name: '50%Glucose 50 ml', targetCount: 3, unit: 'vial', category: 'เกลือแร่และสารจำเป็น' },
  { id: 'haloperidol', name: 'Haloperidol 5 mg', targetCount: 2, unit: 'amp', category: 'ยาระงับประสาทและจิตเวช' },
  { id: 'hydrocortisone', name: 'Hydrocortisone 100 mg', targetCount: 3, unit: 'vial', category: 'ยาสเตียรอยด์ (Steroids)' },
  { id: 'nicardipine', name: 'Nicardipine 10 mg', targetCount: 2, unit: 'amp', category: 'ยาลดความดันโลหิต' },
  { id: 'nitroglycerine', name: 'Nitroglycerine 50 mg', targetCount: 2, unit: 'amp', category: 'ยาขยายหลอดเลือดหัวใจ' },
  { id: 'norepinephrine', name: 'Norepipinephrine 4 mg/4 ml', targetCount: 8, unit: 'amp', category: 'ยากระตุ้นความดัน (Vasopressor)' },
  { id: 'propofol', name: 'Propofol 200 mg/10 ml', targetCount: 5, unit: 'amp', category: 'ยาระงับความรู้สึกและยานอนหลับ' },
  { id: 'sodium_bicarbonate', name: '7.5%Soduim bicarbonate 50 ml', targetCount: 2, unit: 'amp', category: 'สารปรับสมดุลกรดด่าง' },
  { id: 'diazepam', name: 'Diazepam 10 mg', targetCount: 2, unit: 'amp', category: 'ยากันชักและสงบประสาท' },
  { id: 'berodual_nb', name: 'Berodual NB 4 ml', targetCount: 10, unit: 'neb', category: 'ยาพ่นขยายหลอดลม' },
  { id: 'berodual_mdi', name: 'Berodual MDI', targetCount: 4, unit: 'กล่อง', category: 'ยาพ่นขยายหลอดลม' },
  { id: 'salbutamol_nb', name: 'Sulbutamol NB 2.5 ml', targetCount: 10, unit: 'neb', category: 'ยาพ่นขยายหลอดลม' },
  { id: 'lidocaine_2', name: '2% Lidocaine', targetCount: 2, unit: 'amp', category: 'ยาชาและรักษาหัวใจเต้นผิดจังหวะ' },
  { id: 'heparin', name: 'Heparine 25000 Units/5 ml', targetCount: 2, unit: 'amp', category: 'ยาต้านการแข็งตัวของเลือด' },
];

export interface MedicationItemRecord {
  remainingCount: number | null;
  targetCount: number;
  unit: string;
  notes: string;
  status: 'complete' | 'low' | 'empty' | 'unrecorded';
}

export interface ShiftMedicationCheck {
  recorderName: string;
  recorderRole?: string;
  checkedAt?: string;
  items: Record<string, MedicationItemRecord>;
  overallNotes?: string;
  isComplete: boolean;
}

export interface DailyMedicationRecord {
  day: number; // 1 - 31
  month: number; // 1 - 12
  yearCE: number; // 2026 - 2037
  yearThai: number; // 2569 - 2580
  shifts: {
    morning?: ShiftMedicationCheck;
    afternoon?: ShiftMedicationCheck;
    night?: ShiftMedicationCheck;
  };
  updatedAt?: string;
}

// 2. รถ Emergency (Crash Cart)
export interface SupplyExpiryItemRecord extends MedicationItemRecord {
  expiryDate?: string; // YYYY-MM-DD
  expiryAlert?: 'normal' | 'warning_3months' | 'expired';
}

export interface ShiftEmergencyCartCheck {
  recorderName: string;
  recorderRole?: string;
  checkedAt?: string;
  alcohol70: MedicationItemRecord; // 10 แผ่น
  adrenaline: MedicationItemRecord; // 5 amp
  cottonBall: SupplyExpiryItemRecord; // 2 ห่อ + วันหมดอายุ
  overallNotes?: string;
  isComplete: boolean;
}

export interface DailyEmergencyCartRecord {
  day: number;
  month: number;
  yearCE: number;
  yearThai: number;
  shifts: {
    morning?: ShiftEmergencyCartCheck;
    afternoon?: ShiftEmergencyCartCheck;
    night?: ShiftEmergencyCartCheck;
  };
  updatedAt?: string;
}

// 3. Emergency Box (วันละ 1 ครั้ง ในเวรดึก 00.30-08.30)
export interface DailyEmergencyBoxRecord {
  day: number;
  month: number;
  yearCE: number;
  yearThai: number;
  nightShift?: {
    recorderName: string;
    recorderRole?: string;
    checkedAt?: string;
    alcohol70: MedicationItemRecord; // 10 แผ่น
    adrenaline: MedicationItemRecord; // 5 amp
    cottonBall: SupplyExpiryItemRecord; // 2 ห่อ
    overallNotes?: string;
    isComplete: boolean;
  };
  updatedAt?: string;
}

// 4. การบันทึกอุณหภูมิตู้เย็นยา (2 - 8 C)
export interface SingleTempReading {
  temp: number | null;
  recorderName: string;
  recordedAt?: string;
  notes?: string;
  status?: 'normal' | 'low' | 'high' | 'unrecorded';
}

export interface DailyFridgeTempRecord {
  day: number;
  month: number;
  yearCE: number;
  yearThai: number;
  morning_14?: SingleTempReading;
  afternoon_22?: SingleTempReading;
  night_06?: SingleTempReading;
  dailyMax_09?: { temp: number | null; recorderName: string; recordedAt?: string; notes?: string };
  dailyMin_09?: { temp: number | null; recorderName: string; recordedAt?: string; notes?: string };
  updatedAt?: string;
}

// 5. การบันทึกความชื้นสัมพัทธ์ %RH (40 - 75 %RH)
export interface SingleHumidityReading {
  humidity: number | null;
  recorderName: string;
  recordedAt?: string;
  notes?: string;
  status?: 'normal' | 'low' | 'high' | 'unrecorded';
}

export interface DailyHumidityRecord {
  day: number;
  month: number;
  yearCE: number;
  yearThai: number;
  morning_14?: SingleHumidityReading;
  afternoon_22?: SingleHumidityReading;
  night_06?: SingleHumidityReading;
  updatedAt?: string;
}

export interface ExpiryAlertInfo {
  id: string;
  source: 'cart' | 'box';
  day: number;
  month: number;
  yearThai: number;
  shift?: ShiftType;
  itemName: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'warning_3months' | 'expired';
}
