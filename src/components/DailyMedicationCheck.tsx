import React, { useState, useEffect, useMemo } from 'react';
import {
  DailyMedicationRecord,
  StaffRecorder,
  ShiftType,
  ICU_SHIFTS,
  THAI_MONTHS,
  THAI_YEARS,
  ICU_MEDICATION_CATALOG,
  MedicationItemRecord,
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
  Search,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface DailyMedicationCheckProps {
  selectedYearCE: number;
  selectedMonth: number;
  currentStaff: StaffRecorder;
  records: Record<number, DailyMedicationRecord>;
  onToast?: (toast: any) => void;
}

export const DailyMedicationCheck: React.FC<DailyMedicationCheckProps> = ({
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

  const [activeShift, setActiveShift] = useState<ShiftType>('morning');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State: 29 items map
  const [itemsState, setItemsState] = useState<Record<string, { count: number | ''; notes: string }>>(() => {
    const initial: Record<string, { count: number | ''; notes: string }> = {};
    ICU_MEDICATION_CATALOG.forEach((med) => {
      initial[med.id] = { count: med.targetCount, notes: 'ปกติ ครบตามเกณฑ์' };
    });
    return initial;
  });

  const [recorderName, setRecorderName] = useState<string>(currentStaff.name);
  const [overallNotes, setOverallNotes] = useState<string>('');

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set(ICU_MEDICATION_CATALOG.map((m) => m.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    return ICU_MEDICATION_CATALOG.filter((med) => {
      const matchSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'all' || med.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchTerm, selectedCategory]);

  // Sync state when selected day, month, or shift changes
  useEffect(() => {
    const dayRecord = records[selectedDay];
    const shiftData = dayRecord?.shifts?.[activeShift];

    if (shiftData && shiftData.items) {
      const nextState: Record<string, { count: number | ''; notes: string }> = {};
      ICU_MEDICATION_CATALOG.forEach((med) => {
        const saved = shiftData.items[med.id];
        if (saved) {
          nextState[med.id] = {
            count: saved.remainingCount !== null ? saved.remainingCount : '',
            notes: saved.notes || '',
          };
        } else {
          nextState[med.id] = { count: med.targetCount, notes: 'ปกติ' };
        }
      });
      setItemsState(nextState);
      setRecorderName(shiftData.recorderName || currentStaff.name);
      setOverallNotes(shiftData.overallNotes || '');
    } else {
      // Initialize with target standard values
      const defaultState: Record<string, { count: number | ''; notes: string }> = {};
      ICU_MEDICATION_CATALOG.forEach((med) => {
        defaultState[med.id] = { count: med.targetCount, notes: 'ครบถ้วน พร้อมใช้' };
      });
      setItemsState(defaultState);
      setRecorderName(currentStaff.name);
      setOverallNotes('ตรวจสอบสต็อกยาและเวชภัณฑ์ครบถ้วนตามเกณฑ์ ICU');
    }
    setSaveSuccess(false);
  }, [selectedDay, activeShift, records, currentStaff.name]);

  const handleItemCountChange = (medId: string, value: string) => {
    setItemsState((prev) => ({
      ...prev,
      [medId]: {
        ...prev[medId],
        count: value === '' ? '' : Number(value),
      },
    }));
  };

  const handleItemNotesChange = (medId: string, notes: string) => {
    setItemsState((prev) => ({
      ...prev,
      [medId]: {
        ...prev[medId],
        notes,
      },
    }));
  };

  // Quick action: Fill all 29 items to 100% full standard stock
  const handleFillAllFull = () => {
    const fullState: Record<string, { count: number | ''; notes: string }> = {};
    ICU_MEDICATION_CATALOG.forEach((med) => {
      fullState[med.id] = {
        count: med.targetCount,
        notes: `ครบ ${med.targetCount} ${med.unit} พร้อมใช้งาน`,
      };
    });
    setItemsState(fullState);
    setOverallNotes('ตรวจสอบครบ 29 รายการ สภาพสมบูรณ์และพร้อมใช้ 100%');
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const itemsMap: Record<string, MedicationItemRecord> = {};
      ICU_MEDICATION_CATALOG.forEach((med) => {
        const itemVal = itemsState[med.id];
        const val = itemVal?.count !== '' ? Number(itemVal?.count) : null;
        const status =
          val === null
            ? 'unrecorded'
            : val >= med.targetCount
            ? 'complete'
            : val > 0
            ? 'low'
            : 'empty';

        itemsMap[med.id] = {
          remainingCount: val,
          targetCount: med.targetCount,
          unit: med.unit,
          notes: itemVal?.notes?.trim() || '',
          status,
        };
      });

      const shiftDataToSave: ShiftMedicationCheck = {
        recorderName: recorderName.trim() || currentStaff.name,
        recorderRole: currentStaff.role,
        checkedAt: new Date().toISOString(),
        items: itemsMap,
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
      if (onToast) {
        onToast({
          type: 'success',
          title: `บันทึกข้อมูลยาและเวชภัณฑ์ (${ICU_SHIFTS[activeShift].nameThai}) สำเร็จ`,
          message: `บันทึก 29 รายการ วันที่ ${selectedDay} ${monthObj.name} พ.ศ. ${thaiYear} โดย ${recorderName} ลง Firebase Firestore เรียบร้อยแล้ว`,
          collection: 'icu_medications',
          docId: `${selectedYearCE}_${String(selectedMonth).padStart(2, '0')}_day${String(selectedDay).padStart(2, '0')}`,
        });
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving medication check:', err);
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

  // Stats for the active shift form
  const formStats = useMemo(() => {
    let completed = 0;
    let low = 0;
    let empty = 0;
    ICU_MEDICATION_CATALOG.forEach((med) => {
      const val = itemsState[med.id]?.count;
      if (typeof val === 'number') {
        if (val >= med.targetCount) completed++;
        else if (val > 0) low++;
        else empty++;
      }
    });
    return { completed, low, empty, total: ICU_MEDICATION_CATALOG.length };
  }, [itemsState]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-1">
            <Pill className="w-4 h-4 text-blue-600" />
            <span>งานที่ 2: ตรวจสอบยาและเวชภัณฑ์ประจำเดือน (29 รายการ)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            ตรวจเช็คยาและเวชภัณฑ์ ICU — เดือน {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกครบ 29 รายการ แยก 3 กะ: เช้า (08.30-16.30), บ่าย (16.30-00.30), ดึก (00.30-08.30)
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
          <span className="text-xs font-semibold text-slate-400 px-2">เลือกวันที่:</span>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const isSelected = d === selectedDay;
            const rec = records[d];
            const hasMorning = !!rec?.shifts?.morning?.isComplete;
            const hasAfternoon = !!rec?.shifts?.afternoon?.isComplete;
            const hasNight = !!rec?.shifts?.night?.isComplete;

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

      {/* Shift Switcher Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(ICU_SHIFTS) as ShiftType[]).map((sh) => {
          const info = ICU_SHIFTS[sh];
          const isCurrentActive = activeShift === sh;
          const shiftData = records[selectedDay]?.shifts?.[sh];
          const isDone = shiftData?.isComplete;

          return (
            <button
              key={sh}
              onClick={() => setActiveShift(sh)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isCurrentActive
                  ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white/80 hover:bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 text-sm">{info.nameThai}</span>
                {isDone ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>บันทึกแล้ว</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    ยังไม่บันทึก
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{info.timeRange}</span>
              </div>
              {shiftData && (
                <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                  ผู้บันทึก: <span className="font-medium text-slate-900">{shiftData.recorderName}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Form Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>บันทึกรายการยาและเวชภัณฑ์ 29 รายการ — {ICU_SHIFTS[activeShift].nameThai}</span>
              <span className="text-xs font-normal text-slate-500">
                (วันที่ {selectedDay} {monthObj.name} พ.ศ. {thaiYear})
              </span>
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="text-emerald-700 font-semibold">ครบ: {formStats.completed}</span>
              <span>•</span>
              <span className="text-amber-700 font-semibold">ขาด: {formStats.low}</span>
              <span>•</span>
              <span className="text-rose-700 font-semibold">หมด: {formStats.empty}</span>
              <span>•</span>
              <span>ทั้งหมด {formStats.total} รายการ</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillAllFull}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>เติมเต็มครบทุกรายการ</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อยา เช่น Adenosine, Adrenaline, Albumin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="all">ทุกกลุ่มยา ({ICU_MEDICATION_CATALOG.length} รายการ)</option>
            {categories.filter((c) => c !== 'all').map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 29 Items Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
          {filteredCatalog.map((med, idx) => {
            const itemVal = itemsState[med.id] || { count: med.targetCount, notes: '' };
            const countNum = typeof itemVal.count === 'number' ? itemVal.count : Number(itemVal.count) || 0;
            const isComplete = countNum >= med.targetCount;
            const isLow = countNum > 0 && countNum < med.targetCount;

            return (
              <div
                key={med.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isComplete
                    ? 'bg-slate-50/70 border-slate-200'
                    : isLow
                    ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                    : 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-400 w-5">
                        {ICU_MEDICATION_CATALOG.findIndex((m) => m.id === med.id) + 1}.
                      </span>
                      <span className="text-xs font-bold text-slate-900">{med.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 ml-6">
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                        เกณฑ์: {med.targetCount} {med.unit}
                      </span>
                      <span className="text-[10px] text-slate-500">{med.category}</span>
                    </div>
                  </div>

                  {/* Stock Input */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-slate-500 font-medium">คงเหลือ:</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={itemVal.count}
                      onChange={(e) => handleItemCountChange(med.id, e.target.value)}
                      className={`w-16 px-2 py-1 text-center font-bold rounded-lg border text-xs focus:outline-none focus:ring-2 ${
                        isComplete
                          ? 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                          : isLow
                          ? 'bg-amber-100 border-amber-400 text-amber-900 focus:ring-amber-500'
                          : 'bg-rose-100 border-rose-400 text-rose-900 focus:ring-rose-500'
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-600">{med.unit}</span>
                  </div>
                </div>

                {/* Notes for this drug */}
                <div className="mt-2 ml-6">
                  <input
                    type="text"
                    placeholder="หมายเหตุ เช่น เบิกชดเชยแล้ว, กล่องสมบูรณ์..."
                    value={itemVal.notes}
                    onChange={(e) => handleItemNotesChange(med.id, e.target.value)}
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 placeholder:text-slate-400"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recorder Profile & Shift Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ชื่อ-นามสกุล ผู้บันทึก ({ICU_SHIFTS[activeShift].nameThai}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={recorderName}
                onChange={(e) => setRecorderName(e.target.value)}
                placeholder="เช่น พว. กานดา รัตนวิชัย"
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
                placeholder="ระบุหมายเหตุภาพรวม เช่น ส่งเวรเรียบร้อย ตรวจนับครบ"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>บันทึกยาและเวชภัณฑ์ 29 รายการ ({ICU_SHIFTS[activeShift].nameThai}) เรียบร้อยแล้ว!</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">บันทึกแยกลงฐานข้อมูล Firebase Firestore (ICU-DATA) ทันที</span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'กำลังบันทึก...' : `บันทึกเวร${ICU_SHIFTS[activeShift].nameThai.replace('เวร', '')}`}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
