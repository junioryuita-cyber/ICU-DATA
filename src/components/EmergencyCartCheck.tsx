import React, { useState } from 'react';
import {
  DailyEmergencyCartRecord,
  StaffRecorder,
  ShiftType,
  ICU_SHIFTS,
  THAI_MONTHS,
  THAI_YEARS,
  ShiftEmergencyCartCheck,
} from '../types/icu';
import {
  saveShiftEmergencyCart,
  getDaysInMonth,
  checkExpiryAlert,
} from '../services/icuService';
import {
  Ambulance,
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
  Package,
} from 'lucide-react';

interface EmergencyCartCheckProps {
  selectedYearCE: number;
  selectedMonth: number;
  currentStaff: StaffRecorder;
  records: Record<number, DailyEmergencyCartRecord>;
}

export const EmergencyCartCheck: React.FC<EmergencyCartCheckProps> = ({
  selectedYearCE,
  selectedMonth,
  currentStaff,
  records,
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

  const [activeShift, setActiveShift] = useState<ShiftType>('morning');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentDayRecord = records[selectedDay];
  const currentShiftData = currentDayRecord?.shifts?.[activeShift];

  // Form states
  const [alcoholCount, setAlcoholCount] = useState<number | ''>(
    currentShiftData?.alcohol70?.remainingCount ?? 10
  );
  const [alcoholNotes, setAlcoholNotes] = useState<string>(
    currentShiftData?.alcohol70?.notes ?? 'แผ่นแอลกอฮอล์ครบ 10 แผ่น ซองปิดสนิท'
  );

  const [adrenalineCount, setAdrenalineCount] = useState<number | ''>(
    currentShiftData?.adrenaline?.remainingCount ?? 5
  );
  const [adrenalineNotes, setAdrenalineNotes] = useState<string>(
    currentShiftData?.adrenaline?.notes ?? 'Adrenaline รถฉุกเฉิน ครบ 5 amp'
  );

  const [cottonCount, setCottonCount] = useState<number | ''>(
    currentShiftData?.cottonBall?.remainingCount ?? 2
  );
  const [cottonExpiryDate, setCottonExpiryDate] = useState<string>(() => {
    if (currentShiftData?.cottonBall?.expiryDate) return currentShiftData.cottonBall.expiryDate;
    // Default 6 months ahead
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [cottonNotes, setCottonNotes] = useState<string>(
    currentShiftData?.cottonBall?.notes ?? 'ซองปลอดเชื้อสมบูรณ์'
  );

  const [recorderName, setRecorderName] = useState<string>(
    currentShiftData?.recorderName || currentStaff.name
  );
  const [overallNotes, setOverallNotes] = useState<string>(
    currentShiftData?.overallNotes ?? ''
  );

  // Sync state when day/shift changes
  React.useEffect(() => {
    const shiftData = records[selectedDay]?.shifts?.[activeShift];
    if (shiftData) {
      setAlcoholCount(shiftData.alcohol70?.remainingCount ?? 10);
      setAlcoholNotes(shiftData.alcohol70?.notes ?? '');
      setAdrenalineCount(shiftData.adrenaline?.remainingCount ?? 5);
      setAdrenalineNotes(shiftData.adrenaline?.notes ?? '');
      setCottonCount(shiftData.cottonBall?.remainingCount ?? 2);
      setCottonExpiryDate(shiftData.cottonBall?.expiryDate || '');
      setCottonNotes(shiftData.cottonBall?.notes ?? '');
      setRecorderName(shiftData.recorderName || currentStaff.name);
      setOverallNotes(shiftData.overallNotes || '');
    } else {
      setAlcoholCount(10);
      setAlcoholNotes('ครบ 10 แผ่น พร้อมใช้');
      setAdrenalineCount(5);
      setAdrenalineNotes('ครบ 5 amp สภาพสมบูรณ์');
      setCottonCount(2);
      // Default 6 months ahead
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      setCottonExpiryDate(d.toISOString().split('T')[0]);
      setCottonNotes('ซองปลอดเชื้อสมบูรณ์');
      setRecorderName(currentStaff.name);
      setOverallNotes('');
    }
    setSaveSuccess(false);
  }, [selectedDay, activeShift, records, currentStaff.name]);

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

      const shiftDataToSave: ShiftEmergencyCartCheck = {
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

      await saveShiftEmergencyCart(
        selectedYearCE,
        thaiYear,
        selectedMonth,
        selectedDay,
        activeShift,
        shiftDataToSave
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving emergency cart:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-1">
            <Ambulance className="w-4 h-4" />
            <span>งานที่ 3: ตรวจสอบรถ Emergency ประจำเดือน</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            ตรวจเช็ครถ Emergency (Crash Cart) — เดือน {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจเช็คทุกวัน 3 กะ: เช้า (08.30-16.30), บ่าย (16.30-00.30), ดึก (00.30-08.30) พร้อมระบบแจ้งเตือนวันหมดอายุสำลีล่วงหน้า 3 เดือน
          </p>
        </div>

        {/* Day Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setSelectedDay((prev) => Math.max(1, prev - 1))}
            disabled={selectedDay <= 1}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-bold text-sm">
            <Calendar className="w-4 h-4 text-rose-600" />
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

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shift Selection */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex gap-2">
            {(['morning', 'afternoon', 'night'] as ShiftType[]).map((sh) => {
              const info = ICU_SHIFTS[sh];
              const isActive = activeShift === sh;
              const hasData = !!currentDayRecord?.shifts?.[sh]?.isComplete;
              return (
                <button
                  key={sh}
                  onClick={() => setActiveShift(sh)}
                  className={`flex-1 py-3 px-4 rounded-xl text-left transition-all border ${
                    isActive
                      ? 'bg-rose-50/70 border-rose-500 text-rose-900 shadow-2xs'
                      : 'bg-slate-50/60 hover:bg-slate-100 border-transparent text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{info.nameThai}</span>
                    {hasData ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> บันทึกแล้ว
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">ยังไม่บันทึก</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{info.timeRange}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  {activeShift === 'morning' ? 'เช้า' : activeShift === 'afternoon' ? 'บ่าย' : 'ดึก'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    ตรวจเช็ครถ Emergency — {ICU_SHIFTS[activeShift].nameThai}
                  </h3>
                  <p className="text-xs text-slate-500">
                    เวลา {ICU_SHIFTS[activeShift].timeRange} | วันที่ {selectedDay} {monthObj.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFillFull}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-rose-600" />
                <span>เติมสต็อกรถฉุกเฉินครบ</span>
              </button>
            </div>

            {/* 1. 70% Alcohol (10 แผ่น) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">1. 70% Alcohol pad</span>
                    <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-medium">
                      เกณฑ์มาตรฐาน: 10 แผ่น
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">แผ่นชุบแอลกอฮอล์สำหรับทำความสะอาดและฆ่าเชื้อ</span>
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
                    className="w-20 px-3 py-1.5 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  placeholder="ระบุหมายเหตุ เช่น ซองปิดสนิท หรือเบิกเติมแล้ว"
                  value={alcoholNotes}
                  onChange={(e) => setAlcoholNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Adrenaline 1 mg/ml inj (5 amp) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">2. Adrenaline 1 mg/ml inj (รถฉุกเฉิน)</span>
                    <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-medium">
                      เกณฑ์มาตรฐาน: 5 amp
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">ยาช่วยชีวิตฉุกเฉินประจำรถ Emergency Crash Cart</span>
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
                    className="w-20 px-3 py-1.5 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  placeholder="ระบุหมายเหตุ เช่น ยาพร้อมใช้ สภาพหลอดสมบูรณ์"
                  value={adrenalineNotes}
                  onChange={(e) => setAdrenalineNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                    <span className="font-bold text-slate-800 text-sm">3. สำลี 5 ก้อน (Cotton Balls)</span>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-medium">
                      เกณฑ์มาตรฐาน: 2 ห่อ
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">สำลีก้อนปลอดเชื้อ สำหรับทำหัตถการฉุกเฉิน</span>
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
                    className="w-20 px-3 py-1.5 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
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

              {/* Expiry Date input + 3-month automatic alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>ระบุวันหมดอายุสำลี (EXP Date):</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={cottonExpiryDate}
                    onChange={(e) => setCottonExpiryDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <div className="text-[11px] font-medium text-slate-500 mb-1">สถานะการแจ้งเตือนวันหมดอายุ:</div>
                  {cottonExpiryCheck.status === 'warning_3months' ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>ใกล้หมดอายุใน 3 เดือน (เหลือ {cottonExpiryCheck.daysRemaining} วัน) - ควรเบิกเปลี่ยน!</span>
                    </div>
                  ) : cottonExpiryCheck.status === 'expired' ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>หมดอายุแล้ว ({Math.abs(cottonExpiryCheck.daysRemaining)} วัน) - ห้ามใช้!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>วันหมดอายุยังอยู่ในเกณฑ์ปลอดภัย (เหลือ {cottonExpiryCheck.daysRemaining} วัน)</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  หมายเหตุเพื่อแจ้งเตือนวันหมดอายุ / รายละเอียดห่อ:
                </label>
                <input
                  type="text"
                  placeholder="ระบุหมายเหตุ เช่น แจ้งห้องจ่ายกลางเพื่อเปลี่ยนห่อสำลีใหม่ก่อนหมดอายุ 3 เดือน"
                  value={cottonNotes}
                  onChange={(e) => setCottonNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Recorder & Overall Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อ-นามสกุล ผู้บันทึกเวรนี้ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={recorderName}
                    onChange={(e) => setRecorderName(e.target.value)}
                    placeholder="เช่น พว. กานดา รัตนวิชัย"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุภาพรวมรถ Emergency</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    placeholder="เช่น ซีลล็อกรถฉุกเฉินเบอร์ ICU-EM-01 ปกติ"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกตรวจรถ Emergency {ICU_SHIFTS[activeShift].nameThai} เรียบร้อยแล้ว!</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">บันทึกข้อมูลรถ Emergency แบบ 3 เวร</span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : `บันทึกรถ Emergency (${ICU_SHIFTS[activeShift].nameThai})`}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Summary */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-rose-600" />
              <span>สรุปรถ Emergency วันที่ {selectedDay} (3 เวร)</span>
            </h3>

            <div className="space-y-3">
              {(['morning', 'afternoon', 'night'] as ShiftType[]).map((sh) => {
                const info = ICU_SHIFTS[sh];
                const shiftData = currentDayRecord?.shifts?.[sh];
                const isCurrentActive = activeShift === sh;

                return (
                  <div
                    key={sh}
                    onClick={() => setActiveShift(sh)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isCurrentActive
                        ? 'border-rose-500 bg-rose-50/40 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-800">{info.nameThai}</span>
                      {shiftData?.isComplete ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          ตรวจแล้ว
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                          รอดำเนินการ
                        </span>
                      )}
                    </div>

                    {shiftData?.isComplete ? (
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>70% Alcohol (10 แผ่น):</span>
                          <span className="font-semibold text-slate-800">{shiftData.alcohol70.remainingCount} แผ่น</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Adrenaline (5 amp):</span>
                          <span className="font-semibold text-slate-800">{shiftData.adrenaline.remainingCount} amp</span>
                        </div>
                        <div className="flex justify-between">
                          <span>สำลี 5 ก้อน (2 ห่อ):</span>
                          <span className="font-semibold text-slate-800">{shiftData.cottonBall.remainingCount} ห่อ</span>
                        </div>
                        {shiftData.cottonBall.expiryDate && (
                          <div className="text-[11px] text-amber-700 pt-0.5">
                            EXP สำลี: {shiftData.cottonBall.expiryDate}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          ผู้ตรวจ: <strong>{shiftData.recorderName}</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">ยังไม่มีการตรวจเช็คในเวรนี้</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs space-y-2">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>กฎการแจ้งเตือนวันหมดอายุ 3 เดือน</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              สำหรับ <strong>สำลี 5 ก้อน (2 ห่อ)</strong> ระบบจะคำนวณวันหมดอายุอัตโนมัติ และแสดงสถานะเตือนสีส้มทันทีเมื่อเหลือเวลา &le; 90 วัน เพื่อให้พยาบาลเบิกเปลี่ยนห่อใหม่จากหน่วยจ่ายกลางล่วงหน้า
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
