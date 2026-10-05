import React, { useState, useEffect, useMemo } from 'react';
import {
  DailyEmergencyBoxRecord,
  StaffRecorder,
  THAI_MONTHS,
  THAI_YEARS,
  EMERGENCY_BOX_CATALOG,
  BoxItemDef,
  MedicationItemRecord,
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
  Sparkles,
  Search,
  Filter,
  Check,
  RotateCcw,
  Moon,
  ShieldCheck,
} from 'lucide-react';

interface EmergencyBoxCheckProps {
  selectedYearCE: number;
  selectedMonth: number;
  onYearChange?: (yearCE: number) => void;
  onMonthChange?: (month: number) => void;
  currentStaff: StaffRecorder;
  records: Record<number, DailyEmergencyBoxRecord>;
  onToast?: (toast: any) => void;
}

export const EmergencyBoxCheck: React.FC<EmergencyBoxCheckProps> = ({
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

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date();
    return today.getMonth() + 1 === selectedMonth && today.getFullYear() === selectedYearCE
      ? today.getDate()
      : 1;
  });

  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states for the 26 items in Emergency Box
  const [itemsState, setItemsState] = useState<
    Record<string, { count: number | ''; notes: string; expiryDate: string }>
  >(() => {
    const initial: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
    EMERGENCY_BOX_CATALOG.forEach((item) => {
      initial[item.id] = {
        count: item.targetCount,
        notes: 'กล่องซีลเรียบร้อย',
        expiryDate: '',
      };
    });
    return initial;
  });

  const [recorderName, setRecorderName] = useState<string>(currentStaff.name || '');
  const [overallNotes, setOverallNotes] = useState<string>('กล่อง Emergency Box ซีลล็อกสภาพสมบูรณ์ ไม่มีการแกะใช้');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(EMERGENCY_BOX_CATALOG.map((i) => i.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    return EMERGENCY_BOX_CATALOG.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Synchronize state when selected day, month, year, or records change
  useEffect(() => {
    const dayRecord = records[selectedDay];
    const nightData = dayRecord?.nightShift;

    if (nightData && nightData.items) {
      const nextState: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
      EMERGENCY_BOX_CATALOG.forEach((item) => {
        const saved = nightData.items?.[item.id];
        if (saved) {
          nextState[item.id] = {
            count: saved.remainingCount !== null ? saved.remainingCount : '',
            notes: saved.notes || '',
            expiryDate: saved.expiryDate || '',
          };
        } else {
          // Backward compatibility check
          if (item.id === 'box_alcohol_70' && nightData.alcohol70) {
            nextState[item.id] = {
              count: nightData.alcohol70.remainingCount ?? item.targetCount,
              notes: nightData.alcohol70.notes || '',
              expiryDate: '',
            };
          } else if (item.id === 'box_adrenaline' && nightData.adrenaline) {
            nextState[item.id] = {
              count: nightData.adrenaline.remainingCount ?? item.targetCount,
              notes: nightData.adrenaline.notes || '',
              expiryDate: '',
            };
          } else if (item.id === 'box_cotton_5' && nightData.cottonBall) {
            nextState[item.id] = {
              count: nightData.cottonBall.remainingCount ?? item.targetCount,
              notes: nightData.cottonBall.notes || '',
              expiryDate: nightData.cottonBall.expiryDate || '',
            };
          } else {
            nextState[item.id] = { count: item.targetCount, notes: 'ครบตามเกณฑ์', expiryDate: '' };
          }
        }
      });
      setItemsState(nextState);
      setRecorderName(nightData.recorderName || currentStaff.name || '');
      setOverallNotes(nightData.overallNotes || 'กล่อง Emergency Box ซีลล็อกสภาพสมบูรณ์');
    } else {
      // Default standard stock
      const defaultState: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
      EMERGENCY_BOX_CATALOG.forEach((item) => {
        defaultState[item.id] = {
          count: item.targetCount,
          notes: 'ครบตามเกณฑ์ พร้อมใช้',
          expiryDate: '',
        };
      });
      setItemsState(defaultState);
      setRecorderName(currentStaff.name || '');
      setOverallNotes('ตรวจเช็คอุปกรณ์กล่องฉุกเฉินครบ 26 รายการ ซีลล็อกเรียบร้อย');
    }
    setSaveSuccess(false);
  }, [selectedDay, selectedMonth, selectedYearCE, records, currentStaff.name]);

  const handleCountChange = (id: string, value: string) => {
    setItemsState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        count: value === '' ? '' : Math.max(0, Number(value)),
      },
    }));
  };

  const handleAdjustCount = (id: string, delta: number) => {
    setItemsState((prev) => {
      const current = typeof prev[id]?.count === 'number' ? (prev[id].count as number) : 0;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          count: Math.max(0, current + delta),
        },
      };
    });
  };

  const handleSetStandard = (id: string, targetCount: number) => {
    setItemsState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        count: targetCount,
        notes: 'ครบตามเกณฑ์',
      },
    }));
  };

  const handleExpiryDateChange = (id: string, expiryDate: string) => {
    setItemsState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        expiryDate,
      },
    }));
  };

  const handleNotesChange = (id: string, notes: string) => {
    setItemsState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        notes,
      },
    }));
  };

  // Quick fill 100% full
  const handleFillAllFull = () => {
    const fullState: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
    EMERGENCY_BOX_CATALOG.forEach((item) => {
      fullState[item.id] = {
        count: item.targetCount,
        notes: `ครบ ${item.targetCount} ${item.unit} ในกล่องฉุกเฉิน`,
        expiryDate: itemsState[item.id]?.expiryDate || '',
      };
    });
    setItemsState(fullState);
    setOverallNotes('ตรวจสอบครบ 26 รายการ ซีลกล่องสมบูรณ์พร้อมใช้งาน 100%');
  };

  // Save handler for night shift (00.30 - 08.30)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const itemsMap: Record<string, MedicationItemRecord> = {};
      EMERGENCY_BOX_CATALOG.forEach((item) => {
        const itemVal = itemsState[item.id];
        const val = itemVal?.count !== '' ? Number(itemVal?.count) : null;
        const status =
          val === null
            ? 'unrecorded'
            : val >= item.targetCount
            ? 'complete'
            : val > 0
            ? 'low'
            : 'empty';

        const expAlert = itemVal?.expiryDate ? checkExpiryAlert(itemVal.expiryDate).status : 'normal';

        itemsMap[item.id] = {
          remainingCount: val,
          targetCount: item.targetCount,
          unit: item.unit,
          notes: itemVal?.notes?.trim() || '',
          status,
          expiryDate: itemVal?.expiryDate || '',
          expiryAlert: expAlert,
        };
      });

      const nightShiftData = {
        recorderName: (recorderName.trim() || currentStaff.name || 'พยาบาลวิชาชีพ ICU').trim(),
        recorderRole: currentStaff.role || 'พยาบาลวิชาชีพ',
        checkedAt: new Date().toISOString(),
        items: itemsMap,
        alcohol70: itemsMap['box_alcohol_70'] || { remainingCount: 10, targetCount: 10, unit: 'แผ่น', notes: 'ครบ', status: 'complete' },
        adrenaline: itemsMap['box_adrenaline'] || { remainingCount: 5, targetCount: 5, unit: 'amp', notes: 'ครบ', status: 'complete' },
        cottonBall: {
          remainingCount: itemsMap['box_cotton_5']?.remainingCount ?? 2,
          targetCount: 2,
          unit: 'ห่อ',
          notes: itemsMap['box_cotton_5']?.notes || 'ปกติ',
          status: 'complete',
          expiryDate: itemsMap['box_cotton_5']?.expiryDate || '',
          expiryAlert: itemsMap['box_cotton_5']?.expiryAlert || 'normal',
        },
        overallNotes: overallNotes.trim(),
        isComplete: true,
      };

      await saveEmergencyBoxRecord(
        selectedYearCE,
        thaiYear,
        selectedMonth,
        selectedDay,
        nightShiftData
      );

      setSaveSuccess(true);
      if (onToast) {
        onToast({
          type: 'success',
          title: `บันทึก Emergency Box (เวรดึก) สำเร็จ`,
          message: `บันทึกอุปกรณ์กล่องฉุกเฉิน 26 รายการ วันที่ ${selectedDay} ${monthObj.name} พ.ศ. ${thaiYear} ลง Firebase Firestore เรียบร้อยแล้ว`,
          collection: 'icu_emergency_box',
          docId: `${selectedYearCE}_${String(selectedMonth).padStart(2, '0')}_${String(selectedDay).padStart(2, '0')}`,
        });
      }
      setTimeout(() => setSaveSuccess(false), 4500);
    } catch (err: any) {
      console.error('Error saving emergency box check:', err);
      if (onToast) {
        onToast({
          type: 'error',
          title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
          message: err?.message || 'ไม่สามารถเชื่อมต่อ Firestore ได้ในขณะนี้',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Form stats
  const formStats = useMemo(() => {
    let completed = 0;
    let low = 0;
    let empty = 0;
    let expiringWarning = 0;

    EMERGENCY_BOX_CATALOG.forEach((item) => {
      const state = itemsState[item.id];
      const val = state?.count;
      if (typeof val === 'number') {
        if (val >= item.targetCount) completed++;
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

    return { completed, low, empty, expiringWarning, total: EMERGENCY_BOX_CATALOG.length };
  }, [itemsState]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-indigo-700 font-semibold text-xs mb-1.5">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold border border-indigo-200 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              <span>งานหลัก: ตรวจสอบ Emergency Box ประจำเดือน (26 รายการ)</span>
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold border border-indigo-200 flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-600" />
              <span>ตรวจวันละ 1 ครั้ง ในเวรดึก (00.30 - 08.30 น.)</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Emergency Box ประจำเดือน — {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกอุปกรณ์ช่วยชีวิตฉุกเฉิน 26 รายการ พร้อมตรวจสอบวันหมดอายุล่วงหน้า 3 เดือน และลงชื่อผู้ตรวจบันทึกทุกเวรดึก
          </p>
        </div>

        {/* Year Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedYearCE}
            onChange={(e) => onYearChange && onYearChange(Number(e.target.value))}
            aria-label="เลือกปี พ.ศ."
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {THAI_YEARS.map((y) => (
              <option key={y.ceYear} value={y.ceYear}>
                {y.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. 12-Month Selector Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
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
                    ? 'bg-indigo-600 border-indigo-700 text-white font-bold shadow-xs ring-2 ring-indigo-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-indigo-700'
                }`}
              >
                <div className="font-semibold text-xs leading-none">{m.short}</div>
                <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {m.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Day Picker Pills */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-slate-700">
            เลือกวันที่ตรวจเช็ค (เวรดึก 00.30 - 08.30 น.):
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ตรวจแล้ว
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span> ยังไม่ตรวจ
            </span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-center gap-1.5 min-w-max">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const isSelected = d === selectedDay;
              const rec = records[d];
              const isDone = !!rec?.nightShift?.isComplete;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`w-10 h-12 rounded-xl flex flex-col items-center justify-center text-xs transition-all relative cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-700 text-white font-black shadow-md ring-2 ring-indigo-300'
                      : isDone
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-xs">{d}</span>
                  <div className="mt-0.5">
                    {isDone ? (
                      <Check className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-slate-300'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Form Container */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Form Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>เวรดึก (00.30 - 08.30 น.) — วันละ 1 ครั้ง</span>
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-600">
                วันที่ {selectedDay} {monthObj.name} พ.ศ. {thaiYear}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              บันทึกรายการอุปกรณ์ Emergency Box (26 รายการ)
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ครบ: {formStats.completed}
              </span>
              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                ขาด: {formStats.low}
              </span>
              <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                หมด: {formStats.empty}
              </span>
              {formStats.expiringWarning > 0 && (
                <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>ใกล้หมดอายุใน 3 เดือน ({formStats.expiringWarning})</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillAllFull}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>เติมสต็อกครบเกณฑ์ 26 รายการ (100%)</span>
            </button>
          </div>
        </div>

        {/* Recorder Profile & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>ชื่อ-นามสกุล พยาบาลผู้ตรวจ (เวรดึก) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น พว. ปิยะวัฒน์ เจริญสุข"
              value={recorderName}
              onChange={(e) => setRecorderName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุภาพรวม Emergency Box
            </label>
            <input
              type="text"
              placeholder="เช่น หมายเลขซีล ICU-BOX-02 ล็อกแน่นหนา ไม่มีการฉีกขาด"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Category Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs font-semibold text-slate-400 px-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> หมวด:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat === 'all' ? 'ทั้งหมด (26)' : cat}
              </button>
            ))}
          </div>

          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาอุปกรณ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56"
            />
          </div>
        </div>

        {/* 26 Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3 min-w-[200px]">รายการอุปกรณ์ Emergency Box</th>
                  <th className="py-2.5 px-3 w-32">หมวดหมู่</th>
                  <th className="py-2.5 px-3 w-24 text-center">เกณฑ์มาตรฐาน</th>
                  <th className="py-2.5 px-3 w-44 text-center">คงเหลือจริง</th>
                  <th className="py-2.5 px-3 w-24 text-center">สถานะ</th>
                  <th className="py-2.5 px-3 w-40">วันหมดอายุ (เตือน 3 ด.)</th>
                  <th className="py-2.5 px-3 min-w-[150px]">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const state = itemsState[item.id];
                  const countVal = state?.count;
                  const hasCount = typeof countVal === 'number';
                  const isComplete = hasCount && countVal >= item.targetCount;
                  const isLow = hasCount && countVal > 0 && countVal < item.targetCount;
                  const isEmpty = hasCount && countVal === 0;

                  const expAlert = state?.expiryDate ? checkExpiryAlert(state.expiryDate) : null;
                  const isWarning = expAlert?.status === 'warning_3months';
                  const isExpired = expAlert?.status === 'expired';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExpired
                          ? 'bg-rose-100/50'
                          : isWarning
                          ? 'bg-amber-50/60'
                          : isLow
                          ? 'bg-amber-50/40'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{item.name}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {item.targetCount} <span className="text-slate-400 font-normal">{item.unit}</span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustCount(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={countVal}
                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                            className={`w-16 px-2 py-1 text-center font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs ${
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
                            onClick={() => handleAdjustCount(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStandard(item.id, item.targetCount)}
                            className="px-1.5 py-1 text-[10px] rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 border border-slate-200 font-medium cursor-pointer"
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
                            <span>ขาด {item.targetCount - (countVal as number)}</span>
                          </span>
                        )}
                        {isEmpty && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span>หมด</span>
                          </span>
                        )}
                        {!hasCount && <span className="text-slate-400">-</span>}
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="date"
                          value={state?.expiryDate || ''}
                          onChange={(e) => handleExpiryDateChange(item.id, e.target.value)}
                          className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isExpired
                              ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold'
                              : isWarning
                              ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        />
                        {isWarning && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
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
                          placeholder="หมายเหตุ..."
                          value={state?.notes || ''}
                          onChange={(e) => handleNotesChange(item.id, e.target.value)}
                          className="w-full px-2 py-1 bg-transparent border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg focus:outline-none text-xs text-slate-700"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div>
            {saveSuccess ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึก Emergency Box (เวรดึก) สำเร็จแล้ว</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                ข้อมูลบันทึกลง Cloud (Firestore: icu_emergency_box)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? 'กำลังบันทึกลง Cloud...'
                : `บันทึก Emergency Box (เวรดึก) วันที่ ${selectedDay} ${monthObj.short}`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
