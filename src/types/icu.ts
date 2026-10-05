/**
 * ICU-DATA TypeScript definitions
 * System for ICU Medication (29 items), Emergency Cart (5 shelves, 45 items), Emergency Box (26 items),
 * Refrigerator Temperature (2-8 C) & Humidity (40-75 %RH) Logs
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

// 1. 29 Specific Medication & Supplies Catalog for ICU
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
  expiryDate?: string;
  expiryAlert?: 'normal' | 'warning_3months' | 'expired';
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
  day: number;
  month: number;
  yearCE: number;
  yearThai: number;
  shifts: {
    morning?: ShiftMedicationCheck;
    afternoon?: ShiftMedicationCheck;
    night?: ShiftMedicationCheck;
  };
  updatedAt?: string;
}

// 2. Emergency Cart (Crash Cart) - 5 Shelves / 45 Items
export interface CartItemDef {
  id: string;
  name: string;
  targetCount: number;
  unit: string;
  shelf: 'shelf_top' | 'shelf_1' | 'shelf_2' | 'shelf_3' | 'shelf_4' | 'shelf_5';
  shelfName: string;
}

export const EMERGENCY_CART_CATALOG: CartItemDef[] = [
  // ชั้นบนสุด
  { id: 'cart_laryngoscope', name: 'Laryngoscope', targetCount: 3, unit: 'อัน', shelf: 'shelf_top', shelfName: 'ชั้นบนสุด' },
  { id: 'cart_handle', name: 'Handle', targetCount: 2, unit: 'อัน', shelf: 'shelf_top', shelfName: 'ชั้นบนสุด' },
  { id: 'cart_battery', name: 'ถ่านไฟฉาย', targetCount: 2, unit: 'ก้อน', shelf: 'shelf_top', shelfName: 'ชั้นบนสุด' },

  // ชั้นที่ 1
  { id: 'cart_box_1', name: 'Emergency Box 1', targetCount: 1, unit: 'กล่อง', shelf: 'shelf_1', shelfName: 'ชั้นที่ 1' },
  { id: 'cart_box_2', name: 'Emergency Box 2', targetCount: 1, unit: 'กล่อง', shelf: 'shelf_1', shelfName: 'ชั้นที่ 1' },

  // ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT
  { id: 'cart_gloves_6', name: 'ถุงมือ no.6', targetCount: 1, unit: 'คู่', shelf: 'shelf_2', shelfName: 'ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT' },
  { id: 'cart_gloves_6_5', name: 'ถุงมือ no.6.5', targetCount: 1, unit: 'คู่', shelf: 'shelf_2', shelfName: 'ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT' },
  { id: 'cart_gloves_7', name: 'ถุงมือ no.7', targetCount: 3, unit: 'คู่', shelf: 'shelf_2', shelfName: 'ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT' },
  { id: 'cart_gloves_7_5', name: 'ถุงมือ no.7.5', targetCount: 3, unit: 'คู่', shelf: 'shelf_2', shelfName: 'ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT' },
  { id: 'cart_gloves_8', name: 'ถุงมือ no.8', targetCount: 3, unit: 'คู่', shelf: 'shelf_2', shelfName: 'ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT' },
  { id: 'cart_stylet', name: 'Stylet', targetCount: 5, unit: 'อัน', shelf: 'shelf_2', shelfName: 'ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT' },
  { id: 'cart_sterile_gel', name: 'Sterile gel', targetCount: 5, unit: 'ซอง', shelf: 'shelf_2', shelfName: 'ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT' },
  { id: 'cart_tongue_depressor', name: 'ไม้กดลิ้น', targetCount: 2, unit: 'อัน', shelf: 'shelf_2', shelfName: 'ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT' },
  { id: 'cart_flashlight', name: 'ไฟฉาย', targetCount: 2, unit: 'อัน', shelf: 'shelf_2', shelfName: 'ชั้นที่ 2 อุปกรณ์เตรียมใส่ ETT' },

  // ชั้นที่ 3 ฉีดยา/เปิด IV
  { id: 'cart_syringe_5', name: 'Syringe 5 ml', targetCount: 10, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_syringe_10', name: 'Syringe 10 ml', targetCount: 10, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_syringe_20', name: 'Syringe 20 ml', targetCount: 10, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_syringe_50', name: 'Syringe 50 ml', targetCount: 10, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_set_iv', name: 'Set IV', targetCount: 10, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_tway', name: 'T-way stopcock', targetCount: 5, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_extension_6', name: 'Extension 6 นิ้ว', targetCount: 5, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_needle_18', name: 'Needle no.18', targetCount: 10, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_needle_21', name: 'Needle no.21', targetCount: 10, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_needle_24', name: 'Needle no.24', targetCount: 10, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_needle_25', name: 'Needle no.25', targetCount: 10, unit: 'อัน', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },
  { id: 'cart_alcohol_pad', name: '70% Alcohol pad', targetCount: 10, unit: 'แผ่น', shelf: 'shelf_3', shelfName: 'ชั้นที่ 3 ฉีดยา/เปิด IV' },

  // ชั้นที่ 4 อุปกรณ์ใส่ ETT
  { id: 'cart_ett_5_5', name: 'ETT no.5.5', targetCount: 1, unit: 'อัน', shelf: 'shelf_4', shelfName: 'ชั้นที่ 4 อุปกรณ์ใส่ ETT' },
  { id: 'cart_ett_6_0', name: 'ETT no.6', targetCount: 1, unit: 'อัน', shelf: 'shelf_4', shelfName: 'ชั้นที่ 4 อุปกรณ์ใส่ ETT' },
  { id: 'cart_ett_6_5', name: 'ETT no.6.5', targetCount: 3, unit: 'อัน', shelf: 'shelf_4', shelfName: 'ชั้นที่ 4 อุปกรณ์ใส่ ETT' },
  { id: 'cart_ett_7_0', name: 'ETT no.7', targetCount: 3, unit: 'อัน', shelf: 'shelf_4', shelfName: 'ชั้นที่ 4 อุปกรณ์ใส่ ETT' },
  { id: 'cart_ett_7_5', name: 'ETT no.7.5', targetCount: 3, unit: 'อัน', shelf: 'shelf_4', shelfName: 'ชั้นที่ 4 อุปกรณ์ใส่ ETT' },
  { id: 'cart_ett_8_0', name: 'ETT no.8', targetCount: 3, unit: 'อัน', shelf: 'shelf_4', shelfName: 'ชั้นที่ 4 อุปกรณ์ใส่ ETT' },
  { id: 'cart_magill', name: 'Magill Forceps', targetCount: 1, unit: 'อัน', shelf: 'shelf_4', shelfName: 'ชั้นที่ 4 อุปกรณ์ใส่ ETT' },
  { id: 'cart_opa', name: 'oropharyngeal airway', targetCount: 10, unit: 'อัน', shelf: 'shelf_4', shelfName: 'ชั้นที่ 4 อุปกรณ์ใส่ ETT' },

  // ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำและอุปกรณ์ช่วยหายใจ
  { id: 'cart_mask_large', name: 'Face mask ใหญ่', targetCount: 2, unit: 'อัน', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_mask_small', name: 'Face mask เล็ก', targetCount: 2, unit: 'อัน', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_o2_mask', name: 'O2 Mask', targetCount: 1, unit: 'อัน', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_o2_mask_bag', name: 'O2 Mask with bag', targetCount: 1, unit: 'อัน', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_ambu_bag', name: 'Ambu bag', targetCount: 1, unit: 'อัน', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_o2_tubing', name: 'สาย O2', targetCount: 1, unit: 'อัน', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_mdi_conn', name: 'ข้อต่อพ่นยา MDI', targetCount: 1, unit: 'อัน', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_nb_ett_conn', name: 'ข้อต่อพ่นยา NB via ETT', targetCount: 1, unit: 'อัน', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_mask_neb', name: 'Mask พ่นยา', targetCount: 1, unit: 'อัน', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_acetar', name: 'Acetar 1000 ml', targetCount: 1, unit: 'ขวด', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
  { id: 'cart_nacl_1000', name: '0.9%NaCl 1000 ml', targetCount: 1, unit: 'ขวด', shelf: 'shelf_5', shelfName: 'ชั้นที่ 5 อุปกรณ์ใส่ ETT / สารน้ำ' },
];

export interface SupplyExpiryItemRecord extends MedicationItemRecord {
  expiryDate?: string;
  expiryAlert?: 'normal' | 'warning_3months' | 'expired';
}

export interface ShiftEmergencyCartCheck {
  recorderName: string;
  recorderRole?: string;
  checkedAt?: string;
  items?: Record<string, MedicationItemRecord>;
  alcohol70?: MedicationItemRecord;
  adrenaline?: MedicationItemRecord;
  cottonBall?: SupplyExpiryItemRecord;
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

// 3. Emergency Box Catalog - 26 Items (ตรวจวันละ 1 ครั้ง ในเวรดึก 00.30-08.30)
export interface BoxItemDef {
  id: string;
  name: string;
  targetCount: number;
  unit: string;
  category: string;
}

export const EMERGENCY_BOX_CATALOG: BoxItemDef[] = [
  { id: 'box_alcohol_70', name: '70% Alcohol pad', targetCount: 10, unit: 'แผ่น', category: 'น้ำยาฆ่าเชื้อ' },
  { id: 'box_medicut_18', name: 'Medicut no.18', targetCount: 10, unit: 'อัน', category: 'เข็มเปิดเส้น IV' },
  { id: 'box_medicut_20', name: 'Medicut no.20', targetCount: 5, unit: 'อัน', category: 'เข็มเปิดเส้น IV' },
  { id: 'box_medicut_22', name: 'Medicut no.22', targetCount: 5, unit: 'อัน', category: 'เข็มเปิดเส้น IV' },
  { id: 'box_medicut_24', name: 'Medicut no.24', targetCount: 2, unit: 'อัน', category: 'เข็มเปิดเส้น IV' },
  { id: 'box_tourniquet', name: 'Tunique (สายรัดแขน)', targetCount: 2, unit: 'อัน', category: 'อุปกรณ์เปิดเส้น' },
  { id: 'box_syringe_10', name: 'Syringe 10 ml', targetCount: 5, unit: 'อัน', category: 'กระบอกฉีดยา' },
  { id: 'box_syringe_5', name: 'Syringe 5 ml', targetCount: 3, unit: 'อัน', category: 'กระบอกฉีดยา' },
  { id: 'box_syringe_3', name: 'Syringe 3 ml', targetCount: 1, unit: 'อัน', category: 'กระบอกฉีดยา' },
  { id: 'box_extension_6', name: 'Extension 6 นิ้ว', targetCount: 2, unit: 'อัน', category: 'สายต่อ IV' },
  { id: 'box_tway', name: 'T-way stopcock', targetCount: 2, unit: 'อัน', category: 'ข้อต่อ 3 ทาง' },
  { id: 'box_needle_18', name: 'Needle no.18', targetCount: 5, unit: 'อัน', category: 'เข็มฉีดยา' },
  { id: 'box_needle_21', name: 'Needle no.21', targetCount: 5, unit: 'อัน', category: 'เข็มฉีดยา' },
  { id: 'box_needle_24_half', name: 'Needle no.24 ½', targetCount: 2, unit: 'อัน', category: 'เข็มฉีดยา' },
  { id: 'box_opa_3', name: 'oropharyngeal airway no.3', targetCount: 1, unit: 'อัน', category: 'อุปกรณ์ทางเดินหายใจ' },
  { id: 'box_opa_2', name: 'oropharyngeal airway no.2', targetCount: 1, unit: 'อัน', category: 'อุปกรณ์ทางเดินหายใจ' },
  { id: 'box_fixomull_small', name: 'Fixomull IV เล็ก', targetCount: 5, unit: 'อัน', category: 'พลาสเตอร์ติดแผล' },
  { id: 'box_fixomull_large', name: 'Fixomull IV ใหญ่', targetCount: 10, unit: 'อัน', category: 'พลาสเตอร์ติดแผล' },
  { id: 'box_face_mask', name: 'Face mask', targetCount: 1, unit: 'อัน', category: 'หน้ากากออกซิเจน' },
  { id: 'box_nacl_100', name: '0.9% NaCl 100 ml', targetCount: 1, unit: 'ขวด', category: 'สารน้ำ IV' },
  { id: 'box_dw5_100', name: '5%DW 100 ml', targetCount: 1, unit: 'ขวด', category: 'สารน้ำ IV' },
  { id: 'box_cotton_5', name: 'สำลี 5 ก้อน', targetCount: 2, unit: 'ห่อ', category: 'เวชภัณฑ์ปลอดเชื้อ' },
  { id: 'box_adrenaline', name: 'Adrenaline 1 mg/ml inj', targetCount: 5, unit: 'amp', category: 'ยาช่วยชีวิตฉุกเฉิน (CPR)' },
  { id: 'box_diazepam', name: 'Diazepam 10 mg', targetCount: 2, unit: 'amp', category: 'ยากันชัก/สงบประสาท' },
  { id: 'box_gloves', name: 'ถุงมือ', targetCount: 2, unit: 'คู่', category: 'ถุงมือตรวจโรค' },
  { id: 'box_tegaderm_iv', name: 'Tegaderm Film IV', targetCount: 5, unit: 'อัน', category: 'ฟิล์มใสปิดแผล' },
];

export interface DailyEmergencyBoxRecord {
  day: number;
  month: number;
  yearCE: number;
  yearThai: number;
  nightShift?: {
    recorderName: string;
    recorderRole?: string;
    checkedAt?: string;
    items?: Record<string, MedicationItemRecord>;
    alcohol70?: MedicationItemRecord;
    adrenaline?: MedicationItemRecord;
    cottonBall?: SupplyExpiryItemRecord;
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
  source: 'medication' | 'cart' | 'box';
  day: number;
  month: number;
  yearThai: number;
  shift?: ShiftType;
  itemName: string;
  categoryOrShelf?: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'warning_3months' | 'expired';
}
