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
import { saveShiftMedication, getDaysInMonth, checkExpiryAlert } from '../services/icuService';
import {
  Pill,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
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
  Table as TableIcon,
  Sun,
  Filter,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface DailyMedicationCheckProps {
  selectedYearCE: number;
  selectedMonth: number;
  onYearChange?: (yearCE: number) => void;
  onMonthChange?: (month: number) => void;
  currentStaff: StaffRecorder;
  records: Record<number, DailyMedicationRecord>;
  onToast?: (toast: any) => void;
}

export const DailyMedicationCheck: React.FC<DailyMedicationCheckProps> = ({
  selectedYearCE,
  selectedMonth,
  onYearChange,
  onMonthChange,
  currentStaff,
  records,
  onToast,
}) => {
  const daysInMonth = getDaysInMonth(selectedYearCE, selectedMonth);
  const thaiYear = THAI_YEARS.find((y) => y.ceYear === selectedYearCE)?.thaiYear || selectedYearCE + 543;
  const monthObj = THAI_MONTHS.find((m) => m.value === selectedMonth) || THAI_MONTHS[0];

  // Selected Day (1..daysInMonth)
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date();
    return today.getMonth() + 1 === selectedMonth && today.getFullYear() === selectedYearCE
      ? today.getDate()
      : 1;
  });

  // Keep selectedDay valid if month changes and daysInMonth is smaller
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  // Mode: 'form' for daily entry, 'table' for monthly matrix view
  const [viewMode, setViewMode] = useState<'form' | 'table'>('form');

  // Search and Category filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State for the 29 medication items with expiry tracking
  const [itemsState, setItemsState] = useState<
    Record<string, { count: number | ''; notes: string; expiryDate: string }>
  >(() => {
    const initial: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
    ICU_MEDICATION_CATALOG.forEach((med) => {
      initial[med.id] = { count: med.targetCount, notes: 'ปกติ ครบตามเกณฑ์', expiryDate: '' };
    });
    return initial;
  });

  const [recorderName, setRecorderName] = useState<string>(currentStaff.name || '');
  const [overallNotes, setOverallNotes] = useState<string>('');

  // Extract distinct drug categories
  const categories = useMemo(() => {
    const set = new Set(ICU_MEDICATION_CATALOG.map((m) => m.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Filtered drug catalog
  const filteredCatalog = useMemo(() => {
    return ICU_MEDICATION_CATALOG.filter((med) => {
      const matchSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'all' || med.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchTerm, selectedCategory]);

  // Daily Medication Check is strictly Morning Shift: 'เช้า (08.30-16.30)'
  const morningShiftType: ShiftType = 'morning';

  // Synchronize form when selected day, month, year, or records change
  useEffect(() => {
    const dayRecord = records[selectedDay];
    const morningData = dayRecord?.shifts?.morning;

    if (morningData && morningData.items) {
      const nextState: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
      ICU_MEDICATION_CATALOG.forEach((med) => {
        const saved = morningData.items[med.id];
        if (saved) {
          nextState[med.id] = {
            count: saved.remainingCount !== null ? saved.remainingCount : '',
            notes: saved.notes || '',
            expiryDate: saved.expiryDate || '',
          };
        } else {
          nextState[med.id] = { count: med.targetCount, notes: 'ปกติ', expiryDate: '' };
        }
      });
      setItemsState(nextState);
      setRecorderName(morningData.recorderName || currentStaff.name || '');
      setOverallNotes(morningData.overallNotes || '');
    } else {
      // Default to standard stock
      const defaultState: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
      ICU_MEDICATION_CATALOG.forEach((med) => {
        defaultState[med.id] = { count: med.targetCount, notes: 'ครบถ้วน พร้อมใช้', expiryDate: '' };
      });
      setItemsState(defaultState);
      setRecorderName(currentStaff.name || '');
      setOverallNotes('ตรวจสอบสต็อกยาและเวชภัณฑ์เวรเช้า ครบถ้วนตามเกณฑ์ ICU');
    }
    setSaveSuccess(false);
  }, [selectedDay, selectedMonth, selectedYearCE, records, currentStaff.name]);

  // Handle count change
  const handleItemCountChange = (medId: string, value: string) => {
    setItemsState((prev) => ({
      ...prev,
      [medId]: {
        ...prev[medId],
        count: value === '' ? '' : Math.max(0, Number(value)),
      },
    }));
  };

  const handleExpiryDateChange = (medId: string, expiryDate: string) => {
    setItemsState((prev) => ({
      ...prev,
      [medId]: {
        ...prev[medId],
        expiryDate,
      },
    }));
  };

  // Quick adjust count (+1 / -1 / set standard)
  const handleAdjustCount = (medId: string, delta: number) => {
    setItemsState((prev) => {
      const current = typeof prev[medId]?.count === 'number' ? (prev[medId].count as number) : 0;
      return {
        ...prev,
        [medId]: {
          ...prev[medId],
          count: Math.max(0, current + delta),
        },
      };
    });
  };

  const handleSetStandardCount = (medId: string, targetCount: number) => {
    setItemsState((prev) => ({
      ...prev,
      [medId]: {
        ...prev[medId],
        count: targetCount,
        notes: 'ครบตามเกณฑ์',
      },
    }));
  };

  // Handle item notes change
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
    const fullState: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
    ICU_MEDICATION_CATALOG.forEach((med) => {
      fullState[med.id] = {
        count: med.targetCount,
        notes: `ครบ ${med.targetCount} ${med.unit} พร้อมใช้งาน`,
        expiryDate: itemsState[med.id]?.expiryDate || '',
      };
    });
    setItemsState(fullState);
    setOverallNotes('ตรวจสอบครบ 29 รายการ เวรเช้า สภาพสมบูรณ์และพร้อมใช้ 100%');
  };

  // Save handler for morning shift
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

        const expAlert = itemVal?.expiryDate ? checkExpiryAlert(itemVal.expiryDate).status : 'normal';

        itemsMap[med.id] = {
          remainingCount: val,
          targetCount: med.targetCount,
          unit: med.unit,
          notes: itemVal?.notes?.trim() || '',
          status,
          expiryDate: itemVal?.expiryDate || '',
          expiryAlert: expAlert,
        };
      });

      const shiftDataToSave: ShiftMedicationCheck = {
        recorderName: (recorderName.trim() || currentStaff.name || 'พยาบาลวิชาชีพ ICU').trim(),
        recorderRole: currentStaff.role || 'พยาบาลวิชาชีพ',
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
        morningShiftType,
        shiftDataToSave
      );

      setSaveSuccess(true);
      if (onToast) {
        onToast({
          type: 'success',
          title: `บันทึกข้อมูลยาและเวชภัณฑ์ประจำวัน (เวรเช้า) สำเร็จ`,
          message: `บันทึก 29 รายการ วันที่ ${selectedDay} ${monthObj.name} พ.ศ. ${thaiYear} (เช้า 08.30-16.30 น.) ลง Firebase Firestore เรียบร้อยแล้ว`,
          collection: 'icu_medications',
          docId: `${selectedYearCE}_${String(selectedMonth).padStart(2, '0')}_${String(selectedDay).padStart(2, '0')}`,
        });
      }
      setTimeout(() => setSaveSuccess(false), 4500);
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

  // Month-wide stats
  const monthlyStats = useMemo(() => {
    let recordedDays = 0;
    let fullStockDays = 0;
    let lowStockCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const rec = records[d];
      const morning = rec?.shifts?.morning;
      if (morning?.isComplete) {
        recordedDays++;
        let hasLow = false;
        if (morning.items) {
          (Object.values(morning.items) as MedicationItemRecord[]).forEach((item) => {
            if (item.remainingCount !== null && item.remainingCount < item.targetCount) {
              hasLow = true;
              lowStockCount++;
            }
          });
        }
        if (!hasLow) fullStockDays++;
      }
    }

    const percent = Math.round((recordedDays / daysInMonth) * 100);
    return {
      daysInMonth,
      recordedDays,
      pendingDays: daysInMonth - recordedDays,
      percent,
      fullStockDays,
      lowStockCount,
    };
  }, [daysInMonth, records]);

  // Current day form stats
  const formStats = useMemo(() => {
    let completed = 0;
    let low = 0;
    let empty = 0;
    let expiringWarning = 0;
    ICU_MEDICATION_CATALOG.forEach((med) => {
      const state = itemsState[med.id];
      const val = state?.count;
      if (typeof val === 'number') {
        if (val >= med.targetCount) completed++;
        else if (val > 0) low++;
        else empty++;
      }
      if (state?.expiryDate) {
        const al = checkExpiryAlert(state.expiryDate);
        if (al.status === 'warning_3months' || al.status === 'expired') {
          expiringWarning++;
        }
      }
    });
    return { completed, low, empty, expiringWarning, total: ICU_MEDICATION_CATALOG.length };
  }, [itemsState]);

  // Day of week helper for Thai
  const getDayOfWeekThai = (day: number) => {
    const d = new Date(selectedYearCE, selectedMonth - 1, day);
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return dayNames[d.getDay()];
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-blue-700 font-semibold text-xs mb-1.5">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold border border-blue-200">
              งานหลัก: ตรวจสอบยาและเวชภัณฑ์ ประจำเดือน
            </span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full font-bold border border-amber-300">
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>รอบตรวจประจำวัน: เช้า (08.30 - 16.30 น.)</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ตรวจสอบยาและเวชภัณฑ์ ประจำเดือน — {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ระบบตรวจสอบยา 29 รายการ ครอบคลุมตั้งแต่ มกราคม – ธันวาคม พ.ศ. 2569 – 2580 แยกเป็นรายเดือน โดยในแต่ละวันบันทึกรอบเช้า (08.30-16.30 น.)
          </p>
        </div>

        {/* View Mode Switcher: Form vs Table */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'form'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>แบบบันทึกรายวัน (เช้า)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>ตารางสรุปทั้งเดือน (1-31)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Month & Year Selector (แยกเป็นรายเดือน มกราคม – ธันวาคม พ.ศ. 2569 – 2580) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              เลือกรอบปีและเดือน (พ.ศ. 2569 - 2580):
            </span>
          </div>

          {/* Year Dropdown Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">ปี พ.ศ.:</span>
            <select
              value={selectedYearCE}
              onChange={(e) => onYearChange && onYearChange(Number(e.target.value))}
              aria-label="เลือกปี พ.ศ. (2569 - 2580)"
              className="px-3 py-1.5 bg-blue-50 border border-blue-300 text-blue-900 font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {THAI_YEARS.map((y) => (
                <option key={y.ceYear} value={y.ceYear}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 12-Month Bar (มกราคม ถึง ธันวาคม) */}
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {THAI_MONTHS.map((m) => {
              const isSelected = selectedMonth === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => onMonthChange && onMonthChange(m.value)}
                  className={`px-2 py-2 rounded-xl text-center text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-700 text-white font-bold shadow-xs ring-2 ring-blue-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-blue-700'
                  }`}
                  title={`ดูและตรวจสอบยาประจำเดือน ${m.name} พ.ศ. ${thaiYear}`}
                >
                  <div className="font-semibold text-xs leading-none">{m.short}</div>
                  <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {m.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Monthly Metrics & Shift Summary Pill */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>ตรวจครบถ้วนในเดือนนี้</span>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">{monthlyStats.percent}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            ตรวจแล้ว {monthlyStats.recordedDays} จาก {monthlyStats.daysInMonth} วัน (เวรเช้า)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>รอบเวลาตรวจประจำวัน</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-amber-700 mt-1">เช้า (08.30-16.30)</div>
          <div className="text-[11px] text-slate-500 mt-0.5">ตรวจวันละ 1 ครั้งทุกวัน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>สต็อกยา 29 รายการ</span>
            <Pill className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">29 รายการ</div>
          <div className="text-[11px] text-slate-500 mt-0.5">ครบเกณฑ์มาตรฐาน ICU</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>สต็อกพร้อมใช้ 100%</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{monthlyStats.fullStockDays} วัน</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {monthlyStats.lowStockCount > 0 ? `พบรายงานยาพร่อง ${monthlyStats.lowStockCount} ครั้ง` : 'พร้อมใช้สมบูรณ์ทุกวัน'}
          </div>
        </div>
      </div>

      {/* VIEW 1: DAILY FORM (แบบบันทึกรายวัน เวรเช้า 08.30-16.30) */}
      {viewMode === 'form' && (
        <div className="space-y-6">
          {/* Day Selector Pills for the Month */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-slate-700">
                เลือกวันที่ต้องการบันทึก/ตรวจเช็ค (เดือน {monthObj.name} พ.ศ. {thaiYear}):
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> บันทึกแล้ว
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span> ยังไม่บันทึก
                </span>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-none pb-1">
              <div className="flex items-center gap-1.5 min-w-max">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const isSelected = d === selectedDay;
                  const rec = records[d];
                  const hasMorning = !!rec?.shifts?.morning?.isComplete;

                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className={`w-10 h-12 rounded-xl flex flex-col items-center justify-center text-xs transition-all relative cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-700 text-white font-black shadow-md ring-2 ring-blue-300'
                          : hasMorning
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-xs">{d}</span>
                      <div className="mt-0.5">
                        {hasMorning ? (
                          <Check className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-blue-300' : 'bg-slate-300'
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            {/* Form Top Bar: Selected Date & Shift Information */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <span>เวรเช้า (08.30 - 16.30 น.)</span>
                  </span>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs font-semibold text-slate-600">
                    วัน{getDayOfWeekThai(selectedDay)}ที่ {selectedDay} {monthObj.name} พ.ศ. {thaiYear}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  บันทึกการตรวจสอบยาและเวชภัณฑ์ (29 รายการ)
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ครบถ้วน: {formStats.completed}
                  </span>
                  <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    พร่อง: {formStats.low}
                  </span>
                  <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    หมด: {formStats.empty}
                  </span>
                  <span>•</span>
                  <span>รวมทั้งหมด {formStats.total} รายการมาตรฐาน ICU</span>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillAllFull}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  title="ใส่จำนวนครบเต็มเกณฑ์ 100% ให้ทั้ง 29 รายการทันที"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เติมสต็อกครบเกณฑ์ 29 รายการ (100%)</span>
                </button>
              </div>
            </div>

            {/* Recorder Name & Shift Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>ชื่อ-นามสกุล พยาบาลผู้ตรวจสอบ (เวรเช้า 08.30-16.30 น.) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น พว. สุดารัตน์ มณีฉาย"
                  value={recorderName}
                  onChange={(e) => setRecorderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ชื่อนี้จะถูกประทับลงในฐานข้อมูล Firestore เพื่อเป็นหลักฐานการตรวจเช็คเวร
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมายเหตุภาพรวมการตรวจเวรเช้า
                </label>
                <input
                  type="text"
                  placeholder="เช่น สภาพยาปกติ ไม่มีความชื้นหรือยาชำรุด พร้อมใช้งาน"
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
                <span className="text-xs font-semibold text-slate-400 px-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> หมวด:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat === 'all' ? 'ทั้งหมด (29)' : cat}
                  </button>
                ))}
              </div>

              {/* Search Drug Name */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อยา..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
                />
              </div>
            </div>

            {/* 29 Medication Items Form Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                      <th className="py-2.5 px-3 min-w-[200px]">ชื่อยา / เวชภัณฑ์ ICU</th>
                      <th className="py-2.5 px-3 w-28 text-center">เกณฑ์มาตรฐาน</th>
                      <th className="py-2.5 px-3 w-44 text-center">จำนวนคงเหลือจริง</th>
                      <th className="py-2.5 px-3 w-28 text-center">สถานะ</th>
                      <th className="py-2.5 px-3 w-40">วันหมดอายุ (เตือน 3 ด.)</th>
                      <th className="py-2.5 px-3 min-w-[180px]">หมายเหตุ / ผลการตรวจ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCatalog.map((med, idx) => {
                      const itemVal = itemsState[med.id];
                      const countVal = itemVal?.count;
                      const hasCount = typeof countVal === 'number';
                      const isComplete = hasCount && countVal >= med.targetCount;
                      const isLow = hasCount && countVal > 0 && countVal < med.targetCount;
                      const isEmpty = hasCount && countVal === 0;

                      const expAlert = itemVal?.expiryDate ? checkExpiryAlert(itemVal.expiryDate) : null;
                      const isWarning = expAlert?.status === 'warning_3months';
                      const isExpired = expAlert?.status === 'expired';

                      return (
                        <tr
                          key={med.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isExpired
                              ? 'bg-rose-100/50'
                              : isWarning
                              ? 'bg-amber-50/60'
                              : isLow
                              ? 'bg-amber-50/40'
                              : isEmpty
                              ? 'bg-rose-50/40'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{med.name}</div>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                              {med.category}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                            {med.targetCount} <span className="text-slate-400 font-normal">{med.unit}</span>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustCount(med.id, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-colors cursor-pointer"
                                title="ลด 1"
                              >
                                -
                              </button>

                              <input
                                type="number"
                                min="0"
                                value={countVal}
                                onChange={(e) => handleItemCountChange(med.id, e.target.value)}
                                className={`w-16 px-2 py-1 text-center font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs ${
                                  isComplete
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                    : isLow
                                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                                    : isEmpty
                                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                                    : 'border-slate-300 bg-white text-slate-800'
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() => handleAdjustCount(med.id, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-colors cursor-pointer"
                                title="เพิ่ม 1"
                              >
                                +
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetStandardCount(med.id, med.targetCount)}
                                className="px-1.5 py-1 text-[10px] rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 border border-slate-200 font-medium transition-colors cursor-pointer"
                                title="ตั้งค่าครบตามเกณฑ์"
                              >
                                ครบ
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            {isComplete && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>ครบ</span>
                              </span>
                            )}
                            {isLow && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>ขาด {med.targetCount - (countVal as number)}</span>
                              </span>
                            )}
                            {isEmpty && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <span>หมดสต็อก</span>
                              </span>
                            )}
                            {!hasCount && (
                              <span className="text-[11px] text-slate-400">ยังไม่ระบุ</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <input
                              type="date"
                              value={itemVal?.expiryDate || ''}
                              onChange={(e) => handleExpiryDateChange(med.id, e.target.value)}
                              className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                isExpired
                                  ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold'
                                  : isWarning
                                  ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            />
                            {isWarning && (
                              <div className="text-[10px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>เหลือ {expAlert.daysRemaining} วัน (&le; 3 ด.)</span>
                              </div>
                            )}
                            {isExpired && (
                              <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                                หมดอายุแล้ว!
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              placeholder="หมายเหตุเพิ่มเติม..."
                              value={itemVal?.notes || ''}
                              onChange={(e) => handleItemNotesChange(med.id, e.target.value)}
                              className="w-full px-2.5 py-1 bg-transparent border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-slate-700"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {saveSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>บันทึกเวรเช้า (08.30-16.30) สำเร็จแล้ว</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    ข้อมูลจะถูกบันทึกและซิงค์ทันทีกับ Firebase Firestore
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? 'กำลังบันทึกลง Cloud...'
                      : `บันทึกเวรเช้า วันที่ ${selectedDay} ${monthObj.short} (08.30-16.30 น.)`}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 2: FULL MONTH MATRIX TABLE (ตารางสรุปทั้งเดือน มกราคม – ธันวาคม พ.ศ. 2569 – 2580) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-blue-600" />
                <span>ตารางสรุปการตรวจสอบยา 29 รายการ ประจำเดือน {monthObj.name} พ.ศ. {thaiYear}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                แสดงสถานะการตรวจเช็ครอบเช้า (08.30 - 16.30 น.) รายวัน ตั้งแต่วันที่ 1 ถึง {daysInMonth}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                บันทึกแล้ว {monthlyStats.recordedDays} / {daysInMonth} วัน
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-3 px-3 w-16 text-center">วันที่</th>
                  <th className="py-3 px-3 w-28">วันในสัปดาห์</th>
                  <th className="py-3 px-3 w-44">รอบเวลา</th>
                  <th className="py-3 px-3 w-40 text-center">สถานะการตรวจ</th>
                  <th className="py-3 px-3 min-w-[160px]">ชื่อพยาบาลผู้ตรวจ</th>
                  <th className="py-3 px-3 min-w-[200px]">หมายเหตุ / การดำเนินการ</th>
                  <th className="py-3 px-3 w-24 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const rec = records[d];
                  const morning = rec?.shifts?.morning;
                  const isDone = morning?.isComplete;
                  const dayName = getDayOfWeekThai(d);

                  // Count how many items complete
                  let completeCount = 0;
                  if (morning?.items) {
                    ICU_MEDICATION_CATALOG.forEach((item) => {
                      const m = morning.items[item.id];
                      if (m && m.remainingCount !== null && m.remainingCount >= item.targetCount) {
                        completeCount++;
                      }
                    });
                  }

                  return (
                    <tr
                      key={d}
                      className={`hover:bg-slate-50 transition-colors ${
                        d === selectedDay ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {d}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        วัน{dayName}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Sun className="w-3 h-3 text-amber-600" />
                          <span>เช้า (08.30-16.30)</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ตรวจครบ ({completeCount}/29)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            <span>ยังไม่บันทึก</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {morning?.recorderName ? (
                          <span className="font-semibold text-slate-800">
                            {morning.recorderName}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500">
                        {morning?.overallNotes || (isDone ? 'เรียบร้อย ครบตามเกณฑ์' : '-')}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDay(d);
                            setViewMode('form');
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          {isDone ? 'แก้ไข' : 'บันทึก'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
