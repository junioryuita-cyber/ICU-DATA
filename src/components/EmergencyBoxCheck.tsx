import React, { useState } from 'react';
import {
  DailyEmergencyBoxRecord,
  StaffRecorder,
  THAI_MONTHS,
  THAI_YEARS,
} from '../types/icu';
import {
  saveEmergencyBoxRecord,
  getDaysInMonth,
  checkExpiryAlert,
} from '../services/icuService';
import {
  Briefcase,
  Save,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Zap,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface EmergencyBoxCheckProps {
  selectedYearCE: number;
  selectedMonth: number;
  currentStaff: StaffRecorder;
  records: Record<number, DailyEmergencyBoxRecord>;
  onToast?: (toast: any) => void;
}

export const EmergencyBoxCheck: React.FC<EmergencyBoxCheckProps> = ({
  selectedYearCE,
  selectedMonth,
  currentStaff,
  records,
  onToast,
}) => {
  const daysInMonth = getDaysInMonth(selectedYearCE, selectedMonth);
  const thaiYear = THAI_YEARS.find((y) => y.ceYear === selectedYearCE)?.thaiYear || selectedYearCE + 543;
  const monthObj = THAI_MONTHS.find((m) => m.value === selectedMonth) || THAI_MONTHS[0];

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date();
    return today.getMonth() + 1 === selectedMonth && today.getFullYear() === selectedYearCE
      ? today.getDate()
      : 1;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentDayRecord = records[selectedDay];
  const nightData = currentDayRecord?.nightShift;

  // Local Form state (Only Night Shift: 00.30 - 08.30)
  const [alcoholCount, setAlcoholCount] = useState<number | ''>(
    nightData?.alcohol70?.remainingCount ?? 10
  );
  const [alcoholNotes, setAlcoholNotes] = useState<string>(
    nightData?.alcohol70?.notes ?? 'แผ่นแอลกอฮอล์ครบ 10 แผ่น ในกล่องฉุกเฉิน'
  );

  const [adrenalineCount, setAdrenalineCount] = useState<number | ''>(
    nightData?.adrenaline?.remainingCount ?? 5
  );
  const [adrenalineNotes, setAdrenalineNotes] = useState<string>(
    nightData?.adrenaline?.notes ?? 'Adrenaline ใน Emergency Box ครบ 5 amp'
  );

  const [cottonCount, setCottonCount] = useState<number | ''>(
    nightData?.cottonBall?.remainingCount ?? 2
  );
  const [cottonExpiryDate, setCottonExpiryDate] = useState<string>(() => {
    if (nightData?.cottonBall?.expiryDate) return nightData.cottonBall.expiryDate;
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [cottonNotes, setCottonNotes] = useState<string>(
    nightData?.cottonBall?.notes ?? 'ตรวจสภาพซองสำลีและวันหมดอายุเรียบร้อย'
  );

  const [recorderName, setRecorderName] = useState<string>(
    nightData?.recorderName || currentStaff.name
  );
  const [overallNotes, setOverallNotes] = useState<string>(
    nightData?.overallNotes ?? 'กล่อง Emergency Box ซีลแน่นหนา ไม่มีการแกะใช้'
  );

  // Sync state on day change
  React.useEffect(() => {
    const data = records[selectedDay]?.nightShift;
    if (data) {
      setAlcoholCount(data.alcohol70?.remainingCount ?? 10);
      setAlcoholNotes(data.alcohol70?.notes ?? '');
      setAdrenalineCount(data.adrenaline?.remainingCount ?? 5);
      setAdrenalineNotes(data.adrenaline?.notes ?? '');
      setCottonCount(data.cottonBall?.remainingCount ?? 2);
      setCottonExpiryDate(data.cottonBall?.expiryDate || '');
      setCottonNotes(data.cottonBall?.notes ?? '');
      setRecorderName(data.recorderName || currentStaff.name);
      setOverallNotes(data.overallNotes || '');
    } else {
      setAlcoholCount(10);
      setAlcoholNotes('ครบ 10 แผ่น พร้อมใช้');
      setAdrenalineCount(5);
      setAdrenalineNotes('ครบ 5 amp สภาพสมบูรณ์');
      setCottonCount(2);
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      setCottonExpiryDate(d.toISOString().split('T')[0]);
      setCottonNotes('ซองปลอดเชื้อสมบูรณ์');
      setRecorderName(currentStaff.name);
      setOverallNotes('ซีลล็อกกล่องฉุกเฉินเรียบร้อย');
    }
    setSaveSuccess(false);
  }, [selectedDay, records, currentStaff.name]);

  const cottonExpiryCheck = checkExpiryAlert(cottonExpiryDate);

  const handleFillFull = () => {
    setAlcoholCount(10);
    setAlcoholNotes('70% Alcohol ครบ 10 แผ่น');
    setAdrenalineCount(5);
    setAdrenalineNotes('Adrenaline ครบ 5 amp');
    setCottonCount(2);
    setCottonNotes('สำลี 5 ก้อน ครบ 2 ห่อ');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const alcNum = typeof alcoholCount === 'number' ? alcoholCount : Number(alcoholCount) || 0;
      const adrNum = typeof adrenalineCount === 'number' ? adrenalineCount : Number(adrenalineCount) || 0;
      const cotNum = typeof cottonCount === 'number' ? cottonCount : Number(cottonCount) || 0;

      const expiryRes = checkExpiryAlert(cottonExpiryDate);

      const nightShiftDataToSave = {
        recorderName: recorderName.trim() || currentStaff.name,
        recorderRole: currentStaff.role,
        checkedAt: new Date().toISOString(),
        alcohol70: {
          remainingCount: alcNum,
          targetCount: 10,
          unit: 'แผ่น',
          notes: alcoholNotes.trim(),
          status: alcNum >= 10 ? 'complete' : alcNum > 0 ? 'low' : 'empty',
        },
        adrenaline: {
          remainingCount: adrNum,
          targetCount: 5,
          unit: 'amp',
          notes: adrenalineNotes.trim(),
          status: adrNum >= 5 ? 'complete' : adrNum > 0 ? 'low' : 'empty',
        },
        cottonBall: {
          remainingCount: cotNum,
          targetCount: 2,
          unit: 'ห่อ',
          notes: cottonNotes.trim(),
          status: cotNum >= 2 ? 'complete' : cotNum > 0 ? 'low' : 'empty',
          expiryDate: cottonExpiryDate,
          expiryAlert: expiryRes.status,
        },
        overallNotes: overallNotes.trim(),
        isComplete: true,
      };

      await saveEmergencyBoxRecord(
        selectedYearCE,
        thaiYear,
        selectedMonth,
        selectedDay,
        nightShiftDataToSave
      );

      setSaveSuccess(true);
      if (onToast) {
        onToast({
          type: 'success',
          title: 'บันทึก Emergency Box (เวรดึก) สำเร็จ',
          message: `บันทึกข้อมูลกล่องฉุกเฉิน วันที่ ${selectedDay} ${monthObj.name} พ.ศ. ${thaiYear} ลง Firebase Firestore เรียบร้อยแล้ว`,
          collection: 'icu_emergency_box',
          docId: `${selectedYearCE}_${String(selectedMonth).padStart(2, '0')}_day${String(selectedDay).padStart(2, '0')}`,
        });
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving emergency box:', err);
      if (onToast) {
        onToast({
          type: 'error',
          title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
          message: err?.message || 'ไม่สามารถเชื่อมต่อ Firestore ได้ในขณะนี้ ข้อมูลถูกบันทึกลงแคชอุปกรณ์แทน',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-1">
            <Briefcase className="w-4 h-4" />
            <span>งานที่ 4: ตรวจสอบ Emergency Box ประจำเดือน</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            ตรวจเช็ค Emergency Box — เดือน {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ความถี่: <strong>วันละ 1 ครั้ง เฉพาะเวรดึก (00.30 - 08.30 น.)</strong> พร้อมระบบแจ้งเตือนวันหมดอายุสำลีล่วงหน้า 3 เดือน
          </p>
        </div>

        {/* Day Nav */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setSelectedDay((prev) => Math.max(1, prev - 1))}
            disabled={selectedDay <= 1}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 font-bold text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>วันที่ {selectedDay} {monthObj.short}</span>
          </div>

          <button
            onClick={() => setSelectedDay((prev) => Math.min(daysInMonth, prev + 1))}
            disabled={selectedDay >= daysInMonth}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Night Shift Single Daily Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-xs">
                  เวรดึก
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <span>การตรวจเช็คประจำเวรดึก (00.30 - 08.30 น.)</span>
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                      วันละ 1 ครั้ง
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    วันที่ {selectedDay} {monthObj.name} พ.ศ. {thaiYear}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFillFull}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 rounded-xl text-xs font-semibold transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>เติมสต็อกกล่องฉุกเฉินครบ</span>
              </button>
            </div>

            {/* 1. 70% Alcohol (10 แผ่น) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">1. 70% Alcohol pad (Emergency Box)</span>
                    <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-medium">
                      เกณฑ์มาตรฐาน: 10 แผ่น
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">แผ่นแอลกอฮอล์สำหรับฆ่าเชื้อในกล่องฉุกเฉิน</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">คงเหลือ:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={alcoholCount}
                    onChange={(e) => setAlcoholCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-3 py-1.5 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs font-medium text-slate-600">แผ่น</span>
                  {typeof alcoholCount === 'number' && (
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-semibold ${
                        alcoholCount >= 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {alcoholCount >= 10 ? 'ครบถ้วน' : `ขาด ${10 - alcoholCount}`}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">หมายเหตุ:</label>
                <input
                  type="text"
                  placeholder="ระบุหมายเหตุ เช่น ซองอยู่ในสภาพดี ปิดผนึกเรียบร้อย"
                  value={alcoholNotes}
                  onChange={(e) => setAlcoholNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Adrenaline 1 mg/ml inj (5 amp) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">2. Adrenaline 1 mg/ml inj (Emergency Box)</span>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-medium">
                      เกณฑ์มาตรฐาน: 5 amp
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">ยาช่วยชีวิตฉุกเฉินในกล่องฉุกเฉิน ICU Box</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">คงเหลือ:</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={adrenalineCount}
                    onChange={(e) => setAdrenalineCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-3 py-1.5 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs font-medium text-slate-600">amp</span>
                  {typeof adrenalineCount === 'number' && (
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-semibold ${
                        adrenalineCount >= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {adrenalineCount >= 5 ? 'ครบถ้วน' : `ขาด ${5 - adrenalineCount}`}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">หมายเหตุ:</label>
                <input
                  type="text"
                  placeholder="ระบุหมายเหตุ เช่น ยาพร้อมใช้ ตรวจสอบวันหมดอายุแล้ว"
                  value={adrenalineNotes}
                  onChange={(e) => setAdrenalineNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 3. สำลี 5 ก้อน (2 ห่อ) + วันหมดอายุ + แจ้งเตือน 3 เดือน */}
            <div className={`border rounded-xl p-4 space-y-3 transition-colors ${
              cottonExpiryCheck.status === 'warning_3months'
                ? 'bg-amber-50/80 border-amber-300'
                : cottonExpiryCheck.status === 'expired'
                ? 'bg-rose-50/80 border-rose-300'
                : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">3. สำลี 5 ก้อน (Emergency Box)</span>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-medium">
                      เกณฑ์มาตรฐาน: 2 ห่อ
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">สำลีก้อนปลอดเชื้อในกล่องช่วยชีวิตฉุกเฉิน</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">คงเหลือ:</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    required
                    value={cottonCount}
                    onChange={(e) => setCottonCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-3 py-1.5 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-xs font-medium text-slate-600">ห่อ</span>
                  {typeof cottonCount === 'number' && (
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-semibold ${
                        cottonCount >= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cottonCount >= 2 ? 'ครบถ้วน' : `ขาด ${2 - cottonCount}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Expiry date input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ระบุวันหมดอายุสำลีในกล่อง (EXP Date):</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={cottonExpiryDate}
                    onChange={(e) => setCottonExpiryDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <div className="text-[11px] font-medium text-slate-500 mb-1">การแจ้งเตือนวันหมดอายุ:</div>
                  {cottonExpiryCheck.status === 'warning_3months' ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>แจ้งเตือน: ใกล้หมดอายุใน 3 เดือน (เหลือ {cottonExpiryCheck.daysRemaining} วัน)</span>
                    </div>
                  ) : cottonExpiryCheck.status === 'expired' ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>หมดอายุแล้ว ({Math.abs(cottonExpiryCheck.daysRemaining)} วัน) - กรุณาเปลี่ยนทันที!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>ยังไม่หมดอายุ (เหลือ {cottonExpiryCheck.daysRemaining} วัน)</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  หมายเหตุเพื่อแจ้งเตือนวันหมดอายุ / สถานะกล่อง:
                </label>
                <input
                  type="text"
                  placeholder="ระบุหมายเหตุ เช่น แจ้งเตือนเปลี่ยนสำลีก่อน 3 เดือนเพื่อความพร้อม"
                  value={cottonNotes}
                  onChange={(e) => setCottonNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Recorder & Overall Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อ-นามสกุล ผู้บันทึกเวรดึก <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={recorderName}
                    onChange={(e) => setRecorderName(e.target.value)}
                    placeholder="เช่น พว. ณภัทร สุขสมบูรณ์"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุสภาพกล่อง Emergency Box</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    placeholder="เช่น ซีลล็อกเลขที่ ICU-BOX-02 สมบูรณ์"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกตรวจเช็ค Emergency Box ประจำเวรดึกเรียบร้อยแล้ว!</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">บันทึกตรวจเช็ค 1 ครั้งต่อวันในเวรดึก</span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก Emergency Box (เวรดึก)'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Info */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>สถานะ Emergency Box วันที่ {selectedDay}</span>
            </h3>

            {nightData?.isComplete ? (
              <div className="space-y-2.5 text-xs text-slate-700 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100">
                <div className="flex justify-between font-bold text-indigo-900 border-b border-indigo-200 pb-1.5">
                  <span>ตรวจเช็คเวรดึก (00.30 - 08.30)</span>
                  <span className="text-emerald-700">ตรวจแล้ว</span>
                </div>
                <div className="flex justify-between">
                  <span>70% Alcohol (10 แผ่น):</span>
                  <span className="font-semibold">{nightData.alcohol70.remainingCount} แผ่น</span>
                </div>
                <div className="flex justify-between">
                  <span>Adrenaline (5 amp):</span>
                  <span className="font-semibold">{nightData.adrenaline.remainingCount} amp</span>
                </div>
                <div className="flex justify-between">
                  <span>สำลี 5 ก้อน (2 ห่อ):</span>
                  <span className="font-semibold">{nightData.cottonBall.remainingCount} ห่อ</span>
                </div>
                {nightData.cottonBall.expiryDate && (
                  <div className="text-[11px] text-amber-800">
                    วันหมดอายุสำลี: {nightData.cottonBall.expiryDate}
                  </div>
                )}
                <div className="pt-2 border-t border-indigo-100 text-[11px] text-slate-500">
                  ผู้บันทึก: <strong className="text-slate-800">{nightData.recorderName}</strong>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                ยังไม่มีการบันทึกตรวจ Emergency Box ในวันที่ {selectedDay}
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>ข้อกำหนด Emergency Box ใน ICU</span>
            </div>
            <ul className="space-y-1 text-slate-300 list-disc list-inside">
              <li>ตรวจเช็คความพร้อมทุกคืนใน <strong>เวรดึก (00.30 - 08.30 น.)</strong></li>
              <li>ตรวจสอบสภาพกล่อง หมายเลขซีล และความครบถ้วนของยาและเวชภัณฑ์</li>
              <li>หากมีการใช้ยาหรือสำลี ให้ลงบันทึกและส่งคืนห้องยาเพื่อซีลใหม่ทันที</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
