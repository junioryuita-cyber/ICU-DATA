/**
 * ICU-DATA TypeScript definitions
 * System for ICU Medication, Emergency Cart, Emergency Box, Refrigerator Temperature & Humidity Logs
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

// 1. ตรวจสอบยาและเวชภัณฑ์ ประจำเดือน
// - Adenosine 6 mg/ml inj (5 amp)
// - Adrenaline 1 mg/ml inj (10 amp)
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
  adenosine: MedicationItemRecord;
  adrenaline: MedicationItemRecord;
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
// - 70% Alcohol (10 แผ่น) มีช่องหมายเหตุ
// - Adrenaline 1 mg/ml inj (5 amp) มีช่องหมายเหตุ
// - สำลี 5 ก้อน (2 ห่อ) มีช่องระบุวันหมดอายุ และเตือนก่อนวันหมดอายุจริง 3 เดือน + หมายเหตุ
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
// - 70% Alcohol (10 แผ่น)
// - Adrenaline 1 mg/ml inj (5 amp)
// - สำลี 5 ก้อน (2 ห่อ + เตือนหมดอายุ 3 เดือน)
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

// 4. การบันทึกอุณหภูมิตู้เย็นยา
// 3 กะ: เช้า (14.00), บ่าย (22.00), ดึก (06.00)
// บันทึกค่า สูงสุด และ ต่ำสุด ในเวลา 09.00 ของทุกวัน
// เกณฑ์ปกติ: 2 - 8 °C (กราฟสีน้ำเงิน)
export interface ShiftTempPoint {
  temp: number | null; // in Celsius
  recorderName: string;
  recordedAt?: string;
  notes?: string;
  status: 'normal' | 'low' | 'high' | 'unrecorded';
}

export interface DailyFridgeTempRecord {
  day: number;
  month: number;
  yearCE: number;
  yearThai: number;
  morning_14: ShiftTempPoint; // 14.00 น.
  afternoon_22: ShiftTempPoint; // 22.00 น.
  night_06: ShiftTempPoint; // 06.00 น.
  dailyMax_09: {
    temp: number | null;
    recorderName: string;
    recordedAt?: string;
    notes?: string;
  };
  dailyMin_09: {
    temp: number | null;
    recorderName: string;
    recordedAt?: string;
    notes?: string;
  };
  updatedAt?: string;
}

// 5. ความชื้นสัมพัทธ์ของตู้เย็นยาและห้องเตรียมยา
// 3 กะ: เช้า (14.00), บ่าย (22.00), ดึก (06.00)
// เกณฑ์ปกติ: 40 - 75 %RH (กราฟสีแดง)
export interface ShiftHumidityPoint {
  humidity: number | null; // in %RH
  recorderName: string;
  recordedAt?: string;
  location?: 'fridge_room' | 'prep_room' | 'both';
  notes?: string;
  status: 'normal' | 'low' | 'high' | 'unrecorded';
}

export interface DailyHumidityRecord {
  day: number;
  month: number;
  yearCE: number;
  yearThai: number;
  morning_14: ShiftHumidityPoint; // 14.00 น.
  afternoon_22: ShiftHumidityPoint; // 22.00 น.
  night_06: ShiftHumidityPoint; // 06.00 น.
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
  status: 'expired' | 'warning_3months' | 'normal';
}
