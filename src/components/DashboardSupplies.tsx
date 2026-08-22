import React, { useState, useMemo } from 'react';
import {
  DailyMedicationRecord,
  DailyEmergencyCartRecord,
  DailyEmergencyBoxRecord,
  THAI_MONTHS,
  THAI_YEARS,
  ICU_SHIFTS,
  ShiftType,
} from '../types/icu';
import { getDaysInMonth, checkExpiryAlert } from '../services/icuService';
import {
  Table,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  CheckSquare,
  ShieldCheck,
  Package,
  Ambulance,
  Briefcase,
  Pill,
} from 'lucide-react';

interface DashboardSuppliesProps {
  selectedYearCE: number;
  selectedMonth: number;
  medRecords: Record<number, DailyMedicationRecord>;
  cartRecords: Record<number, DailyEmergencyCartRecord>;
  boxRecords: Record<number, DailyEmergencyBoxRecord>;
  onSelectDayForEdit?: (day: number, tabId: string) => void;
  onOpenPrintModal: () => void;
}

export const DashboardSupplies: React.FC<DashboardSuppliesProps> = ({
  selectedYearCE,
  selectedMonth,
  medRecords,
  cartRecords,
  boxRecords,
  onSelectDayForEdit,
  onOpenPrintModal,
}) => {
  const daysInMonth = getDaysInMonth(selectedYearCE, selectedMonth);
  const thaiYear = THAI_YEARS.find((y) => y.ceYear === selectedYearCE)?.thaiYear || selectedYearCE + 543;
  const monthObj = THAI_MONTHS.find((m) => m.value === selectedMonth) || THAI_MONTHS[0];

  const [activeFilter, setActiveFilter] = useState<'all' | 'med' | 'cart' | 'box'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate Monthly Metrics
  const metrics = useMemo(() => {
    let totalShiftsPossible = daysInMonth * 3; // morning, afternoon, night
    let medCompletedShifts = 0;
    let cartCompletedShifts = 0;
    let boxCompletedDays = 0;
    let lowStockCount = 0;
    let expiringItemsCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const med = medRecords[d];
      const cart = cartRecords[d];
      const box = boxRecords[d];

      // Med checks
      ['morning', 'afternoon', 'night'].forEach((sh) => {
        const mShift = med?.shifts?.[sh as ShiftType];
        if (mShift?.isComplete) {
          medCompletedShifts++;
          if (mShift.adenosine?.remainingCount !== null && mShift.adenosine.remainingCount < 5) lowStockCount++;
          if (mShift.adrenaline?.remainingCount !== null && mShift.adrenaline.remainingCount < 10) lowStockCount++;
        }

        const cShift = cart?.shifts?.[sh as ShiftType];
        if (cShift?.isComplete) {
          cartCompletedShifts++;
          if (cShift.alcohol70?.remainingCount !== null && cShift.alcohol70.remainingCount < 10) lowStockCount++;
          if (cShift.adrenaline?.remainingCount !== null && cShift.adrenaline.remainingCount < 5) lowStockCount++;
          if (cShift.cottonBall?.remainingCount !== null && cShift.cottonBall.remainingCount < 2) lowStockCount++;
          
          if (cShift.cottonBall?.expiryDate) {
            const exp = checkExpiryAlert(cShift.cottonBall.expiryDate);
            if (exp.status === 'warning_3months' || exp.status === 'expired') {
              expiringItemsCount++;
            }
          }
        }
      });

      // Box check (Night shift)
      if (box?.nightShift?.isComplete) {
        boxCompletedDays++;
        if (box.nightShift.cottonBall?.expiryDate) {
          const exp = checkExpiryAlert(box.nightShift.cottonBall.expiryDate);
          if (exp.status === 'warning_3months' || exp.status === 'expired') {
            expiringItemsCount++;
          }
        }
      }
    }

    const overallRate = Math.round(
      ((medCompletedShifts + cartCompletedShifts + boxCompletedDays) / (totalShiftsPossible * 2 + daysInMonth)) * 100
    );

    return {
      totalShiftsPossible,
      medCompletedShifts,
      cartCompletedShifts,
      boxCompletedDays,
      lowStockCount,
      expiringItemsCount,
      overallRate: isNaN(overallRate) ? 0 : overallRate,
    };
  }, [daysInMonth, medRecords, cartRecords, boxRecords]);

  // Export to CSV helper
  const handleExportCSV = () => {
    const rows = [
      ['ICU-DATA สรุปยา เวชภัณฑ์ รถ Emergency และ Emergency Box ประจำเดือน', `${monthObj.name} พ.ศ. ${thaiYear}`],
      ['วันที่', 'เวร', 'งาน', 'รายการ', 'เกณฑ์', 'คงเหลือ', 'หน่วย', 'สถานะ', 'ผู้บันทึก', 'หมายเหตุ'],
    ];

    for (let d = 1; d <= daysInMonth; d++) {
      const med = medRecords[d];
      const cart = cartRecords[d];
      const box = boxRecords[d];

      ['morning', 'afternoon', 'night'].forEach((sh) => {
        const shName = ICU_SHIFTS[sh as ShiftType].nameThai;
        const m = med?.shifts?.[sh as ShiftType];
        if (m) {
          rows.push([`${d}/${selectedMonth}/${thaiYear}`, shName, 'ยาและเวชภัณฑ์', 'Adenosine 6mg/ml', '5', String(m.adenosine.remainingCount ?? '-'), 'amp', m.adenosine.status, m.recorderName, m.adenosine.notes || '']);
          rows.push([`${d}/${selectedMonth}/${thaiYear}`, shName, 'ยาและเวชภัณฑ์', 'Adrenaline 1mg/ml', '10', String(m.adrenaline.remainingCount ?? '-'), 'amp', m.adrenaline.status, m.recorderName, m.adrenaline.notes || '']);
        }
        const c = cart?.shifts?.[sh as ShiftType];
        if (c) {
          rows.push([`${d}/${selectedMonth}/${thaiYear}`, shName, 'รถ Emergency', '70% Alcohol', '10', String(c.alcohol70.remainingCount ?? '-'), 'แผ่น', c.alcohol70.status, c.recorderName, c.alcohol70.notes || '']);
          rows.push([`${d}/${selectedMonth}/${thaiYear}`, shName, 'รถ Emergency', 'Adrenaline 1mg/ml', '5', String(c.adrenaline.remainingCount ?? '-'), 'amp', c.adrenaline.status, c.recorderName, c.adrenaline.notes || '']);
          rows.push([`${d}/${selectedMonth}/${thaiYear}`, shName, 'รถ Emergency', `สำลี 5 ก้อน (EXP: ${c.cottonBall.expiryDate || '-'})`, '2', String(c.cottonBall.remainingCount ?? '-'), 'ห่อ', c.cottonBall.status, c.recorderName, c.cottonBall.notes || '']);
        }
      });

      const b = box?.nightShift;
      if (b) {
        rows.push([`${d}/${selectedMonth}/${thaiYear}`, 'เวรดึก', 'Emergency Box', '70% Alcohol', '10', String(b.alcohol70.remainingCount ?? '-'), 'แผ่น', b.alcohol70.status, b.recorderName, b.alcohol70.notes || '']);
        rows.push([`${d}/${selectedMonth}/${thaiYear}`, 'เวรดึก', 'Emergency Box', 'Adrenaline 1mg/ml', '5', String(b.adrenaline.remainingCount ?? '-'), 'amp', b.adrenaline.status, b.recorderName, b.adrenaline.notes || '']);
        rows.push([`${d}/${selectedMonth}/${thaiYear}`, 'เวรดึก', 'Emergency Box', `สำลี 5 ก้อน (EXP: ${b.cottonBall.expiryDate || '-'})`, '2', String(b.cottonBall.remainingCount ?? '-'), 'ห่อ', b.cottonBall.status, b.recorderName, b.cottonBall.notes || '']);
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ICU_Supplies_Summary_${selectedYearCE}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-1">
            <Table className="w-4 h-4 text-blue-600" />
            <span>งานที่ 7: Dashboard สรุป ตรวจสอบยาและเวชภัณฑ์, รถ Emergency, Emergency Box</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            ตารางสรุปการตรวจเช็คประจำเดือน — {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปข้อมูลรายวัน 3 กะ: เช้า (08.30-16.30), บ่าย (16.30-00.30), ดึก (00.30-08.30) และ Emergency Box
          </p>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors"
            title="ส่งออกรายงานตารางเป็นไฟล์ CSV/Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงานสรุป</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">อัตราการบันทึกครบถ้วน</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{metrics.overallRate}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">ครอบคลุมทุกเวรตลอดเดือน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">บันทึกยาและเวชภัณฑ์</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {metrics.medCompletedShifts} <span className="text-xs font-normal text-slate-500">/ {metrics.totalShiftsPossible} กะ</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">เช้า, บ่าย, ดึก</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">บันทึกรถ Emergency</div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {metrics.cartCompletedShifts} <span className="text-xs font-normal text-slate-500">/ {metrics.totalShiftsPossible} กะ</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">เช้า, บ่าย, ดึก</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">เตือนวันหมดอายุ (&le; 3 ด.)</div>
          <div className={`text-2xl font-black mt-1 ${metrics.expiringItemsCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {metrics.expiringItemsCount} <span className="text-xs font-normal text-slate-500">รายการ</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">สำลี 5 ก้อน ในรถ/กล่องฉุกเฉิน</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 px-1">
            <Filter className="w-3.5 h-3.5" /> มุมมอง:
          </span>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              activeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ตารางรวม 3 งาน (ครบวงจร)
          </button>
          <button
            onClick={() => setActiveFilter('med')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              activeFilter === 'med' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            💊 เฉพาะยาและเวชภัณฑ์
          </button>
          <button
            onClick={() => setActiveFilter('cart')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              activeFilter === 'cart' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🚑 เฉพาะรถ Emergency
          </button>
          <button
            onClick={() => setActiveFilter('box')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              activeFilter === 'box' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🧰 เฉพาะ Emergency Box
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหาวันที่ หรือชื่อผู้บันทึก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
      </div>

      {/* The Master 31-Day Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-3 px-3 border-b border-slate-800 font-bold sticky left-0 bg-slate-900 z-10 w-24">
                  วันที่
                </th>
                <th className="py-3 px-3 border-b border-slate-800 font-bold border-l border-slate-800 min-w-[200px]">
                  เวรเช้า (08.30-16.30 น.)
                </th>
                <th className="py-3 px-3 border-b border-slate-800 font-bold border-l border-slate-800 min-w-[200px]">
                  เวรบ่าย (16.30-00.30 น.)
                </th>
                <th className="py-3 px-3 border-b border-slate-800 font-bold border-l border-slate-800 min-w-[200px]">
                  เวรดึก (00.30-08.30 น.)
                </th>
                <th className="py-3 px-3 border-b border-slate-800 font-bold border-l border-slate-800 min-w-[180px]">
                  Emergency Box (ดึก 1 ครั้ง)
                </th>
                <th className="py-3 px-3 border-b border-slate-800 font-bold border-l border-slate-800 text-center w-28">
                  สถานะความพร้อม
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1)
                .filter((d) => {
                  if (!searchQuery) return true;
                  const dayStr = `วันที่ ${d}`;
                  const med = medRecords[d];
                  const cart = cartRecords[d];
                  const box = boxRecords[d];
                  const nurses = [
                    med?.shifts?.morning?.recorderName,
                    med?.shifts?.afternoon?.recorderName,
                    med?.shifts?.night?.recorderName,
                    cart?.shifts?.morning?.recorderName,
                    cart?.shifts?.afternoon?.recorderName,
                    cart?.shifts?.night?.recorderName,
                    box?.nightShift?.recorderName,
                  ].filter(Boolean).join(' ');
                  return dayStr.includes(searchQuery) || nurses.includes(searchQuery);
                })
                .map((d) => {
                  const med = medRecords[d];
                  const cart = cartRecords[d];
                  const box = boxRecords[d];

                  // Count completion
                  const medMorning = med?.shifts?.morning;
                  const medAfternoon = med?.shifts?.afternoon;
                  const medNight = med?.shifts?.night;

                  const cartMorning = cart?.shifts?.morning;
                  const cartAfternoon = cart?.shifts?.afternoon;
                  const cartNight = cart?.shifts?.night;

                  const boxNight = box?.nightShift;

                  const allComplete =
                    medMorning?.isComplete &&
                    medAfternoon?.isComplete &&
                    medNight?.isComplete &&
                    cartMorning?.isComplete &&
                    cartAfternoon?.isComplete &&
                    cartNight?.isComplete &&
                    boxNight?.isComplete;

                  const partialComplete =
                    medMorning?.isComplete ||
                    medAfternoon?.isComplete ||
                    medNight?.isComplete ||
                    cartMorning?.isComplete ||
                    cartAfternoon?.isComplete ||
                    cartNight?.isComplete ||
                    boxNight?.isComplete;

                  return (
                    <tr key={d} className="hover:bg-slate-50/80 transition-colors">
                      {/* Sticky Date */}
                      <td className="py-3 px-3 font-bold text-slate-900 sticky left-0 bg-white shadow-xs">
                        <div className="flex flex-col">
                          <span className="text-sm font-extrabold text-blue-700">วันที่ {d}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{monthObj.short} {thaiYear}</span>
                        </div>
                      </td>

                      {/* Morning Shift */}
                      <td className="py-2.5 px-3 border-l border-slate-100 align-top">
                        {(activeFilter === 'all' || activeFilter === 'med') && medMorning && (
                          <div className="bg-blue-50/60 p-2 rounded-lg border border-blue-200/60 mb-1.5">
                            <div className="flex items-center justify-between font-semibold text-blue-900 text-[11px]">
                              <span>💊 ยา: {medMorning.adenosine.remainingCount}/5 | {medMorning.adrenaline.remainingCount}/10</span>
                              <span className="text-emerald-700">ครบ</span>
                            </div>
                            <div className="text-[10px] text-slate-500">ผู้ตรวจ: {medMorning.recorderName}</div>
                          </div>
                        )}

                        {(activeFilter === 'all' || activeFilter === 'cart') && cartMorning && (
                          <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-200/60">
                            <div className="flex items-center justify-between font-semibold text-rose-900 text-[11px]">
                              <span>🚑 Cart: Alc 10 | Adr 5 | สำลี 2</span>
                              {cartMorning.cottonBall.expiryAlert === 'warning_3months' && (
                                <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1 rounded">
                                  เตือน EXP
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">ผู้ตรวจ: {cartMorning.recorderName}</div>
                          </div>
                        )}

                        {!medMorning && !cartMorning && (
                          <span className="text-slate-300 italic text-[11px]">- รอดำเนินการ -</span>
                        )}
                      </td>

                      {/* Afternoon Shift */}
                      <td className="py-2.5 px-3 border-l border-slate-100 align-top">
                        {(activeFilter === 'all' || activeFilter === 'med') && medAfternoon && (
                          <div className="bg-blue-50/60 p-2 rounded-lg border border-blue-200/60 mb-1.5">
                            <div className="flex items-center justify-between font-semibold text-blue-900 text-[11px]">
                              <span>💊 ยา: {medAfternoon.adenosine.remainingCount}/5 | {medAfternoon.adrenaline.remainingCount}/10</span>
                              <span className="text-emerald-700">ครบ</span>
                            </div>
                            <div className="text-[10px] text-slate-500">ผู้ตรวจ: {medAfternoon.recorderName}</div>
                          </div>
                        )}

                        {(activeFilter === 'all' || activeFilter === 'cart') && cartAfternoon && (
                          <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-200/60">
                            <div className="flex items-center justify-between font-semibold text-rose-900 text-[11px]">
                              <span>🚑 Cart: Alc 10 | Adr 5 | สำลี 2</span>
                            </div>
                            <div className="text-[10px] text-slate-500">ผู้ตรวจ: {cartAfternoon.recorderName}</div>
                          </div>
                        )}

                        {!medAfternoon && !cartAfternoon && (
                          <span className="text-slate-300 italic text-[11px]">- รอดำเนินการ -</span>
                        )}
                      </td>

                      {/* Night Shift */}
                      <td className="py-2.5 px-3 border-l border-slate-100 align-top">
                        {(activeFilter === 'all' || activeFilter === 'med') && medNight && (
                          <div className="bg-blue-50/60 p-2 rounded-lg border border-blue-200/60 mb-1.5">
                            <div className="flex items-center justify-between font-semibold text-blue-900 text-[11px]">
                              <span>💊 ยา: {medNight.adenosine.remainingCount}/5 | {medNight.adrenaline.remainingCount}/10</span>
                              <span className="text-emerald-700">ครบ</span>
                            </div>
                            <div className="text-[10px] text-slate-500">ผู้ตรวจ: {medNight.recorderName}</div>
                          </div>
                        )}

                        {(activeFilter === 'all' || activeFilter === 'cart') && cartNight && (
                          <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-200/60">
                            <div className="flex items-center justify-between font-semibold text-rose-900 text-[11px]">
                              <span>🚑 Cart: Alc 10 | Adr 5 | สำลี 2</span>
                            </div>
                            <div className="text-[10px] text-slate-500">ผู้ตรวจ: {cartNight.recorderName}</div>
                          </div>
                        )}

                        {!medNight && !cartNight && (
                          <span className="text-slate-300 italic text-[11px]">- รอดำเนินการ -</span>
                        )}
                      </td>

                      {/* Emergency Box (Night Shift) */}
                      <td className="py-2.5 px-3 border-l border-slate-100 align-top">
                        {(activeFilter === 'all' || activeFilter === 'box') && boxNight ? (
                          <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-200/70">
                            <div className="flex items-center justify-between font-semibold text-indigo-900 text-[11px]">
                              <span>🧰 Alc 10 | Adr 5 | สำลี 2</span>
                              <span className="text-emerald-700 font-bold">ตรวจแล้ว</span>
                            </div>
                            <div className="text-[10px] text-slate-500">ผู้ตรวจ: {boxNight.recorderName}</div>
                            {boxNight.cottonBall.expiryDate && (
                              <div className="text-[9px] text-amber-800">EXP: {boxNight.cottonBall.expiryDate}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">- รอดำเนินการ -</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 border-l border-slate-100 text-center align-middle">
                        {allComplete ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ครบทุกเวร
                          </span>
                        ) : partialComplete ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 font-semibold text-[11px] rounded-full">
                            กำลังบันทึก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 font-medium text-[11px] rounded-full">
                            ยังไม่บันทึก
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
