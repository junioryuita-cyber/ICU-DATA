import React, { useState, useEffect, useMemo } from 'react';
import {
  DailyEmergencyCartRecord,
  StaffRecorder,
  ShiftType,
  ICU_SHIFTS,
  THAI_MONTHS,
  THAI_YEARS,
  EMERGENCY_CART_CATALOG,
  CartItemDef,
  MedicationItemRecord,
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
  Sparkles,
  Layers,
  Search,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';

interface EmergencyCartCheckProps {
  selectedYearCE: number;
  selectedMonth: number;
  onYearChange?: (yearCE: number) => void;
  onMonthChange?: (month: number) => void;
  currentStaff: StaffRecorder;
  records: Record<number, DailyEmergencyCartRecord>;
  onToast?: (toast: any) => void;
}

export const EmergencyCartCheck: React.FC<EmergencyCartCheckProps> = ({
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

  const [activeShift, setActiveShift] = useState<ShiftType>('morning');
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states for the 45 cart items
  const [itemsState, setItemsState] = useState<
    Record<string, { count: number | ''; notes: string; expiryDate: string }>
  >(() => {
    const initial: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
    EMERGENCY_CART_CATALOG.forEach((item) => {
      initial[item.id] = {
        count: item.targetCount,
        notes: 'พร้อมใช้',
        expiryDate: '',
      };
    });
    return initial;
  });

  const [recorderName, setRecorderName] = useState<string>(currentStaff.name || '');
  const [overallNotes, setOverallNotes] = useState<string>('');

  // Shelves list for filtering
  const shelves = [
    { id: 'all', label: 'ทั้งหมด (45 รายการ)' },
    { id: 'shelf_top', label: 'ชั้นบนสุด (3)' },
    { id: 'shelf_1', label: 'ชั้นที่ 1 (2)' },
    { id: 'shelf_2', label: 'ชั้นที่ 2 ETT (9)' },
    { id: 'shelf_3', label: 'ชั้นที่ 3 ฉีดยา/IV (12)' },
    { id: 'shelf_4', label: 'ชั้นที่ 4 ใส่ ETT (8)' },
    { id: 'shelf_5', label: 'ชั้นที่ 5 ช่วยหายใจ/สารน้ำ (11)' },
  ];

  // Filtered list
  const filteredItems = useMemo(() => {
    return EMERGENCY_CART_CATALOG.filter((item) => {
      const matchShelf = selectedShelf === 'all' || item.shelf === selectedShelf;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.shelfName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchShelf && matchSearch;
    });
  }, [selectedShelf, searchTerm]);

  // Synchronize form when selected day, shift, month, year, or records change
  useEffect(() => {
    const dayRecord = records[selectedDay];
    const shiftData = dayRecord?.shifts?.[activeShift];

    if (shiftData && shiftData.items) {
      const nextState: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
      EMERGENCY_CART_CATALOG.forEach((item) => {
        const saved = shiftData.items?.[item.id];
        if (saved) {
          nextState[item.id] = {
            count: saved.remainingCount !== null ? saved.remainingCount : '',
            notes: saved.notes || '',
            expiryDate: saved.expiryDate || '',
          };
        } else {
          // Backward compatibility check for 3 legacy mock items
          if (item.id === 'cart_alcohol_pad' && shiftData.alcohol70) {
            nextState[item.id] = {
              count: shiftData.alcohol70.remainingCount ?? item.targetCount,
              notes: shiftData.alcohol70.notes || '',
              expiryDate: '',
            };
          } else if (item.id === 'cart_needle_18' && shiftData.adrenaline) {
            nextState[item.id] = { count: item.targetCount, notes: '', expiryDate: '' };
          } else {
            nextState[item.id] = { count: item.targetCount, notes: 'พร้อมใช้', expiryDate: '' };
          }
        }
      });
      setItemsState(nextState);
      setRecorderName(shiftData.recorderName || currentStaff.name || '');
      setOverallNotes(shiftData.overallNotes || '');
    } else {
      // Default to 100% standard stock
      const defaultState: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
      EMERGENCY_CART_CATALOG.forEach((item) => {
        defaultState[item.id] = {
          count: item.targetCount,
          notes: 'พร้อมใช้ ครบตามเกณฑ์',
          expiryDate: '',
        };
      });
      setItemsState(defaultState);
      setRecorderName(currentStaff.name || '');
      setOverallNotes('ตรวจเช็ครถฉุกเฉินและอุปกรณ์ช่วยชีวิตครบถ้วนตามเกณฑ์ ICU');
    }
    setSaveSuccess(false);
  }, [selectedDay, activeShift, selectedMonth, selectedYearCE, records, currentStaff.name]);

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

  // Quick action: Fill all 45 items to 100% full standard stock
  const handleFillAllFull = () => {
    const fullState: Record<string, { count: number | ''; notes: string; expiryDate: string }> = {};
    EMERGENCY_CART_CATALOG.forEach((item) => {
      fullState[item.id] = {
        count: item.targetCount,
        notes: `ครบ ${item.targetCount} ${item.unit} พร้อมใช้งาน`,
        expiryDate: itemsState[item.id]?.expiryDate || '',
      };
    });
    setItemsState(fullState);
    setOverallNotes('ตรวจสอบครบทั้ง 5 ชั้น สภาพสมบูรณ์และพร้อมใช้ 100%');
  };

  // Save handler for current shift
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const itemsMap: Record<string, MedicationItemRecord> = {};
      EMERGENCY_CART_CATALOG.forEach((item) => {
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

      const shiftDataToSave: ShiftEmergencyCartCheck = {
        recorderName: (recorderName.trim() || currentStaff.name || 'พยาบาลวิชาชีพ ICU').trim(),
        recorderRole: currentStaff.role || 'พยาบาลวิชาชีพ',
        checkedAt: new Date().toISOString(),
        items: itemsMap,
        alcohol70: itemsMap['cart_alcohol_pad'] || { remainingCount: 10, targetCount: 10, unit: 'แผ่น', notes: 'ครบ', status: 'complete' },
        adrenaline: { remainingCount: 5, targetCount: 5, unit: 'amp', notes: 'ครบ', status: 'complete' },
        cottonBall: {
          remainingCount: 2,
          targetCount: 2,
          unit: 'ห่อ',
          notes: 'ปกติ',
          status: 'complete',
          expiryDate: itemsMap['cart_sterile_gel']?.expiryDate || '',
          expiryAlert: itemsMap['cart_sterile_gel']?.expiryAlert || 'normal',
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
      if (onToast) {
        onToast({
          type: 'success',
          title: `บันทึกรถ Emergency (${ICU_SHIFTS[activeShift].nameThai}) สำเร็จ`,
          message: `บันทึกอุปกรณ์ 45 รายการ (5 ชั้น) วันที่ ${selectedDay} ${monthObj.name} พ.ศ. ${thaiYear} ลง Firebase Firestore เรียบร้อยแล้ว`,
          collection: 'icu_emergency_cart',
          docId: `${selectedYearCE}_${String(selectedMonth).padStart(2, '0')}_${String(selectedDay).padStart(2, '0')}`,
        });
      }
      setTimeout(() => setSaveSuccess(false), 4500);
    } catch (err: any) {
      console.error('Error saving emergency cart check:', err);
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

  // Form statistics
  const formStats = useMemo(() => {
    let completed = 0;
    let low = 0;
    let empty = 0;
    let expiringWarning = 0;

    EMERGENCY_CART_CATALOG.forEach((item) => {
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

    return { completed, low, empty, expiringWarning, total: EMERGENCY_CART_CATALOG.length };
  }, [itemsState]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-rose-700 font-semibold text-xs mb-1.5">
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold border border-rose-200 flex items-center gap-1">
              <Ambulance className="w-3.5 h-3.5" />
              <span>งานหลัก: ตรวจสอบรถ Emergency (Crash Cart) ประจำเดือน</span>
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold border border-slate-200">
              บันทึก 3 กะ: เช้า (08.30-16.30), บ่าย (16.30-00.30), ดึก (00.30-08.30)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            รถ Emergency ประจำเดือน — {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจเช็คอุปกรณ์ 45 รายการ แยก 5 ชั้น (ชั้นบนสุด, ชั้น 1, ชั้น 2 ETT, ชั้น 3 ฉีดยา/IV, ชั้น 4 ใส่ ETT, ชั้น 5 ช่วยหายใจ) พร้อมแจ้งเตือนวันหมดอายุล่วงหน้า 3 เดือน
          </p>
        </div>

        {/* Quick Month / Year Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedYearCE}
            onChange={(e) => onYearChange && onYearChange(Number(e.target.value))}
            aria-label="เลือกปี พ.ศ."
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
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
                    ? 'bg-rose-600 border-rose-700 text-white font-bold shadow-xs ring-2 ring-rose-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-rose-700'
                }`}
              >
                <div className="font-semibold text-xs leading-none">{m.short}</div>
                <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
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
            เลือกวันที่ตรวจเช็ค (เดือน {monthObj.name} พ.ศ. {thaiYear}):
          </span>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> เช้า
            <span className="w-2 h-2 rounded-full bg-blue-500 ml-1"></span> บ่าย
            <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></span> ดึก
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-center gap-1.5 min-w-max">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const isSelected = d === selectedDay;
              const rec = records[d];
              const hasM = !!rec?.shifts?.morning?.isComplete;
              const hasA = !!rec?.shifts?.afternoon?.isComplete;
              const hasN = !!rec?.shifts?.night?.isComplete;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`w-10 h-12 rounded-xl flex flex-col items-center justify-center text-xs transition-all relative cursor-pointer border ${
                    isSelected
                      ? 'bg-rose-600 border-rose-700 text-white font-black shadow-md ring-2 ring-rose-300'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-xs">{d}</span>
                  <div className="flex gap-0.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasM ? (isSelected ? 'bg-white' : 'bg-emerald-500') : 'bg-slate-300'}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${hasA ? (isSelected ? 'bg-white' : 'bg-blue-500') : 'bg-slate-300'}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${hasN ? (isSelected ? 'bg-white' : 'bg-indigo-500') : 'bg-slate-300'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Shift Switcher Tabs (3 กะ: เช้า, บ่าย, ดึก) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(ICU_SHIFTS) as ShiftType[]).map((sh) => {
          const info = ICU_SHIFTS[sh];
          const isCurrentActive = activeShift === sh;
          const shiftData = records[selectedDay]?.shifts?.[sh];
          const isDone = shiftData?.isComplete;

          return (
            <button
              key={sh}
              type="button"
              onClick={() => setActiveShift(sh)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isCurrentActive
                  ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20'
                  : 'bg-white/80 hover:bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>{info.nameThai}</span>
                </span>
                {isDone ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ตรวจแล้ว</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    ยังไม่บันทึก
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                รอบเวลา: <span className="font-semibold text-slate-700">{info.timeRange}</span>
              </div>
              {shiftData?.recorderName && (
                <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                  ผู้ตรวจ: <span className="font-semibold text-slate-900">{shiftData.recorderName}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Form Container */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Form Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1">
                <Ambulance className="w-3.5 h-3.5 text-rose-600" />
                <span>{ICU_SHIFTS[activeShift].nameThai} ({ICU_SHIFTS[activeShift].timeRange})</span>
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-600">
                วันที่ {selectedDay} {monthObj.name} พ.ศ. {thaiYear}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              บันทึกรายการอุปกรณ์ รถ Emergency (Crash Cart) 45 รายการ
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
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>เติมสต็อกครบเกณฑ์ 45 รายการ (100%)</span>
            </button>
          </div>
        </div>

        {/* Recorder Profile & Overall Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-600" />
              <span>ชื่อ-นามสกุล พยาบาลผู้ตรวจ ({ICU_SHIFTS[activeShift].nameThai}) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น พว. วรรณภา มั่นคง"
              value={recorderName}
              onChange={(e) => setRecorderName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุภาพรวมรถฉุกเฉิน
            </label>
            <input
              type="text"
              placeholder="เช่น อุปกรณ์พร้อมใช้ ไฟฉายติดสว่าง สาย O2 ไม่หักงอ"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            />
          </div>
        </div>

        {/* Shelf Tabs & Search Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs font-semibold text-slate-400 px-1 shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> ชั้น:
            </span>
            {shelves.map((sh) => (
              <button
                key={sh.id}
                type="button"
                onClick={() => setSelectedShelf(sh.id)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  selectedShelf === sh.id
                    ? 'bg-rose-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {sh.label}
              </button>
            ))}
          </div>

          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาอุปกรณ์ / เบอร์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 w-full sm:w-56"
            />
          </div>
        </div>

        {/* 45 Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3 min-w-[200px]">รายการอุปกรณ์ รถ Emergency</th>
                  <th className="py-2.5 px-3 w-32">ชั้นจัดวาง</th>
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
                          {item.shelfName}
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
                            className={`w-16 px-2 py-1 text-center font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs ${
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
                            className="px-1.5 py-1 text-[10px] rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 border border-slate-200 font-medium cursor-pointer"
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
                          className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 ${
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
                <span>บันทึก {ICU_SHIFTS[activeShift].nameThai} สำเร็จแล้ว</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                ข้อมูลบันทึกลง Cloud (Firestore: icu_emergency_cart)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? 'กำลังบันทึกลง Cloud...'
                : `บันทึกรถ Emergency (${ICU_SHIFTS[activeShift].nameThai}) วันที่ ${selectedDay} ${monthObj.short}`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
