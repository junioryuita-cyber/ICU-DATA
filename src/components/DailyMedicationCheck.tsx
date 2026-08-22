import React, { useState } from 'react';
import {
  DailyMedicationRecord,
  StaffRecorder,
  ShiftType,
  ICU_SHIFTS,
  THAI_MONTHS,
  THAI_YEARS,
  ShiftMedicationCheck,
} from '../types/icu';
import { saveShiftMedication, getDaysInMonth } from '../services/icuService';
import {
  Pill,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Zap,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface DailyMedicationCheckProps {
  selectedYearCE: number;
  selectedMonth: number;
  currentStaff: StaffRecorder;
  records: Record<number, DailyMedicationRecord>;
  onRefresh?: () => void;
}

export const DailyMedicationCheck: React.FC<DailyMedicationCheckProps> = ({
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

  // Current day record from props
  const currentDayRecord = records[selectedDay];
  const currentShiftData = currentDayRecord?.shifts?.[activeShift];

  // Local state for editing the active shift
  const [adenosineCount, setAdenosineCount] = useState<number | ''>(
    currentShiftData?.adenosine?.remainingCount ?? 5
  );
  const [adenosineNotes, setAdenosineNotes] = useState<string>(
    currentShiftData?.adenosine?.notes ?? 'สภาพสมบูรณ์ พร้อมใช้งาน'
  );

  const [adrenalineCount, setAdrenalineCount] = useState<number | ''>(
    currentShiftData?.adrenaline?.remainingCount ?? 10
  );
  const [adrenalineNotes, setAdrenalineNotes] = useState<string>(
    currentShiftData?.adrenaline?.notes ?? 'ตรวจสอบสต็อกแล้ว ครบตามเกณฑ์'
  );

  const [recorderName, setRecorderName] = useState<string>(
    currentShiftData?.recorderName || currentStaff.name
  );
  const [overallNotes, setOverallNotes] = useState<string>(
    currentShiftData?.overallNotes ?? ''
  );

  // Sync state when day or shift changes
  React.useEffect(() => {
    const shiftData = records[selectedDay]?.shifts?.[activeShift];
    if (shiftData) {
      setAdenosineCount(shiftData.adenosine?.remainingCount ?? 5);
      setAdenosineNotes(shiftData.adenosine?.notes ?? '');
      setAdrenalineCount(shiftData.adrenaline?.remainingCount ?? 10);
      setAdrenalineNotes(shiftData.adrenaline?.notes ?? '');
      setRecorderName(shiftData.recorderName || currentStaff.name);
      setOverallNotes(shiftData.overallNotes || '');
    } else {
      setAdenosineCount(5);
      setAdenosineNotes('สภาพสมบูรณ์ พร้อมใช้');
      setAdrenalineCount(10);
      setAdrenalineNotes('ครบตามเกณฑ์มาตรฐาน');
      setRecorderName(currentStaff.name);
      setOverallNotes('');
    }
    setSaveSuccess(false);
  }, [selectedDay, activeShift, records, currentStaff.name]);

  const handleFillFull = () => {
    setAdenosineCount(5);
    setAdenosineNotes('ครบ 5 amp สภาพสมบูรณ์');
    setAdrenalineCount(10);
    setAdrenalineNotes('ครบ 10 amp สภาพสมบูรณ์');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const adenoNum = typeof adenosineCount === 'number' ? adenosineCount : Number(adenosineCount) || 0;
      const adrenNum = typeof adrenalineCount === 'number' ? adrenalineCount : Number(adrenalineCount) || 0;

      const shiftDataToSave: ShiftMedicationCheck = {
        recorderName: recorderName.trim() || currentStaff.name,
        recorderRole: currentStaff.role,
        checkedAt: new Date().toISOString(),
        adenosine: {
          remainingCount: adenoNum,
          targetCount: 5,
          unit: 'amp',
          notes: adenosineNotes.trim(),
          status: adenoNum >= 5 ? 'complete' : adenoNum > 0 ? 'low' : 'empty',
        },
        adrenaline: {
          remainingCount: adrenNum,
          targetCount: 10,
          unit: 'amp',
          notes: adrenalineNotes.trim(),
          status: adrenNum >= 10 ? 'complete' : adrenNum > 0 ? 'low' : 'empty',
        },
        overallNotes: overallNotes.trim(),
        isComplete: true,
      };

      await saveShiftMedication(
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
      console.error('Error saving medication check:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-1">
            <Pill className="w-4 h-4" />
            <span>งานที่ 2: ตรวจสอบยาและเวชภัณฑ์ประจำเดือน</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            บันทึกการตรวจเช็คยาและเวชภัณฑ์ ICU — เดือน {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจเช็คทุกวัน แบ่งออกเป็น 3 กะ (เช้า 08.30-16.30, บ่าย 16.30-00.30, ดึก 00.30-08.30)
          </p>
        </div>

        {/* Day Selector Navigation */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setSelectedDay((prev) => Math.max(1, prev - 1))}
            disabled={selectedDay <= 1}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-bold text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
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

      {/* Day quick picker pills */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-xs font-semibold text-slate-400 px-2">วันที่ในเดือน:</span>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const isSelected = d === selectedDay;
            const rec = records[d];
            const hasMorning = !!rec?.shifts?.morning?.isComplete;
            const hasAfternoon = !!rec?.shifts?.afternoon?.isComplete;
            const hasNight = !!rec?.shifts?.night?.isComplete;
            const completeCount = (hasMorning ? 1 : 0) + (hasAfternoon ? 1 : 0) + (hasNight ? 1 : 0);

            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`w-9 h-11 rounded-xl flex flex-col items-center justify-center text-xs transition-all relative ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{d}</span>
                <div className="flex gap-0.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      hasMorning
                        ? isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                        : isSelected ? 'bg-blue-400' : 'bg-slate-300'
                    }`}
                    title="เช้า"
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      hasAfternoon
                        ? isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                        : isSelected ? 'bg-blue-400' : 'bg-slate-300'
                    }`}
                    title="บ่าย"
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      hasNight
                        ? isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                        : isSelected ? 'bg-blue-400' : 'bg-slate-300'
                    }`}
                    title="ดึก"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main shift editor form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Shift Selection & Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shift Tabs */}
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
                      ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs'
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

          {/* Form */}
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {activeShift === 'morning' ? 'เช้า' : activeShift === 'afternoon' ? 'บ่าย' : 'ดึก'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    บันทึก {ICU_SHIFTS[activeShift].nameThai} ({ICU_SHIFTS[activeShift].timeRange})
                  </h3>
                  <p className="text-xs text-slate-500">
                    วันที่ {selectedDay} {monthObj.name} พ.ศ. {thaiYear}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFillFull}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold transition-colors"
                title="ใส่ค่ายาครบตามเกณฑ์มาตรฐานอัตโนมัติ"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>เติมยาครบตามเกณฑ์</span>
              </button>
            </div>

            {/* Item 1: Adenosine 6 mg/ml inj (เกณฑ์: 5 amp) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">1. Adenosine 6 mg/ml inj</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                      เกณฑ์มาตรฐาน: 5 amp
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">ยาต้านหัวใจเต้นผิดจังหวะ (Antiarrhythmic drug)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">คงเหลือ:</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={adenosineCount}
                    onChange={(e) => setAdenosineCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-3 py-1.5 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-xs font-medium text-slate-600">amp</span>
                  
                  {typeof adenosineCount === 'number' && (
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-semibold ${
                        adenosineCount >= 5
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {adenosineCount >= 5 ? 'ครบถ้วน' : `ขาด ${5 - adenosineCount}`}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  หมายเหตุ (เช่น สภาพยา, การเบิกชดเชย, วันหมดอายุ):
                </label>
                <input
                  type="text"
                  placeholder="ระบุหมายเหตุ เช่น เบิกชดเชยครบแล้ว หรือ สภาพสมบูรณ์"
                  value={adenosineNotes}
                  onChange={(e) => setAdenosineNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Item 2: Adrenaline 1 mg/ml inj (เกณฑ์: 10 amp) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">2. Adrenaline 1 mg/ml inj (Epinephrine)</span>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-medium">
                      เกณฑ์มาตรฐาน: 10 amp
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">ยาช่วยชีวิตฉุกเฉินสำหรับ CPR / Anaphylaxis</span>
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
                    className="w-20 px-3 py-1.5 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-xs font-medium text-slate-600">amp</span>

                  {typeof adrenalineCount === 'number' && (
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-semibold ${
                        adrenalineCount >= 10
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {adrenalineCount >= 10 ? 'ครบถ้วน' : `ขาด ${10 - adrenalineCount}`}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  หมายเหตุ (เช่น เลข Lot, การใช้ใน CPR, สภาพแอมพูล):
                </label>
                <input
                  type="text"
                  placeholder="ระบุหมายเหตุ เช่น ตรวจสอบแล้วพร้อมใช้ หรือ เบิกชดเชยจากห้องยา"
                  value={adrenalineNotes}
                  onChange={(e) => setAdrenalineNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Recorder Name & Overall Notes */}
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
                    placeholder="เช่น พว. สมชาย ทรงคุณ"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุภาพรวมประจำเวร</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    placeholder="เช่น ส่งเวรเรียบร้อย ตู้ล็อกเรียบร้อย"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกข้อมูล {ICU_SHIFTS[activeShift].nameThai} ลง Firebase เรียบร้อยแล้ว!</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">ระบบจะอัปเดตข้อมูลทันทีแบบ Real-time</span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : `บันทึก${ICU_SHIFTS[activeShift].nameThai}`}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Daily Shift Status Summary Cards */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>สรุปการตรวจเช็ค วันที่ {selectedDay} (ครบ 3 เวร)</span>
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
                        ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800">{info.nameThai}</span>
                        <span className="text-[10px] text-slate-400">{info.timeRange}</span>
                      </div>
                      {shiftData?.isComplete ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          ครบถ้วน
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                          รอดำเนินการ
                        </span>
                      )}
                    </div>

                    {shiftData?.isComplete ? (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Adenosine (5 amp):</span>
                          <span className={`font-semibold ${shiftData.adenosine.remainingCount >= 5 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {shiftData.adenosine.remainingCount} / 5 amp
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Adrenaline (10 amp):</span>
                          <span className={`font-semibold ${shiftData.adrenaline.remainingCount >= 10 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {shiftData.adrenaline.remainingCount} / 10 amp
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          ผู้บันทึก: <strong className="text-slate-700">{shiftData.recorderName}</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">ยังไม่มีการบันทึกข้อมูลในเวรนี้</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standard Guidelines Box */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs space-y-2 shadow-xs">
            <div className="font-bold text-white flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span>เกณฑ์มาตรฐานยาช่วยชีวิต ICU</span>
            </div>
            <ul className="space-y-1 text-slate-300 list-disc list-inside">
              <li>Adenosine 6 mg/ml: เกณฑ์สต็อก <strong>5 amp</strong></li>
              <li>Adrenaline 1 mg/ml: เกณฑ์สต็อก <strong>10 amp</strong></li>
              <li>หากใช้ในเหตุฉุกเฉิน/CPR ต้องลงบันทึกในช่องหมายเหตุและดำเนินการเบิกชดเชยทันที</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
