import React, { useState, useMemo } from 'react';
import {
  DailyFridgeTempRecord,
  StaffRecorder,
  THAI_MONTHS,
  THAI_YEARS,
} from '../types/icu';
import { saveFridgeTempRecord, getDaysInMonth } from '../services/icuService';
import {
  Thermometer,
  Save,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

interface FridgeTempCheckProps {
  selectedYearCE: number;
  selectedMonth: number;
  currentStaff: StaffRecorder;
  records: Record<number, DailyFridgeTempRecord>;
  onToast?: (toast: any) => void;
}

export const FridgeTempCheck: React.FC<FridgeTempCheckProps> = ({
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

  // Shift 1: 14.00 (เช้า)
  const [temp14, setTemp14] = useState<number | ''>(currentDayRecord?.morning_14?.temp ?? 4.5);
  const [rec14, setRec14] = useState<string>(currentDayRecord?.morning_14?.recorderName || currentStaff.name);
  const [note14, setNote14] = useState<string>(currentDayRecord?.morning_14?.notes ?? 'ปกติ');

  // Shift 2: 22.00 (บ่าย)
  const [temp22, setTemp22] = useState<number | ''>(currentDayRecord?.afternoon_22?.temp ?? 4.2);
  const [rec22, setRec22] = useState<string>(currentDayRecord?.afternoon_22?.recorderName || currentStaff.name);
  const [note22, setNote22] = useState<string>(currentDayRecord?.afternoon_22?.notes ?? 'ปกติ');

  // Shift 3: 06.00 (ดึก)
  const [temp06, setTemp06] = useState<number | ''>(currentDayRecord?.night_06?.temp ?? 4.0);
  const [rec06, setRec06] = useState<string>(currentDayRecord?.night_06?.recorderName || currentStaff.name);
  const [note06, setNote06] = useState<string>(currentDayRecord?.night_06?.notes ?? 'ปกติ');

  // Sync state when day changes
  React.useEffect(() => {
    const data = records[selectedDay];
    if (data) {
      setTemp14(data.morning_14?.temp ?? '');
      setRec14(data.morning_14?.recorderName || currentStaff.name);
      setNote14(data.morning_14?.notes ?? '');

      setTemp22(data.afternoon_22?.temp ?? '');
      setRec22(data.afternoon_22?.recorderName || currentStaff.name);
      setNote22(data.afternoon_22?.notes ?? '');

      setTemp06(data.night_06?.temp ?? '');
      setRec06(data.night_06?.recorderName || currentStaff.name);
      setNote06(data.night_06?.notes ?? '');
    } else {
      setTemp14('');
      setRec14(currentStaff.name);
      setNote14('');

      setTemp22('');
      setRec22(currentStaff.name);
      setNote22('');

      setTemp06('');
      setRec06(currentStaff.name);
      setNote06('');
    }
    setSaveSuccess(false);
  }, [selectedDay, records, currentStaff.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const val14 = temp14 !== '' ? Number(temp14) : null;
      const val22 = temp22 !== '' ? Number(temp22) : null;
      const val06 = temp06 !== '' ? Number(temp06) : null;

      const recordToSave: Partial<DailyFridgeTempRecord> = {
        morning_14: {
          temp: val14,
          recorderName: rec14.trim() || currentStaff.name,
          recordedAt: new Date().toISOString(),
          notes: note14.trim(),
          status: val14 === null ? 'unrecorded' : val14 >= 2 && val14 <= 8 ? 'normal' : val14 < 2 ? 'low' : 'high',
        },
        afternoon_22: {
          temp: val22,
          recorderName: rec22.trim() || currentStaff.name,
          recordedAt: new Date().toISOString(),
          notes: note22.trim(),
          status: val22 === null ? 'unrecorded' : val22 >= 2 && val22 <= 8 ? 'normal' : val22 < 2 ? 'low' : 'high',
        },
        night_06: {
          temp: val06,
          recorderName: rec06.trim() || currentStaff.name,
          recordedAt: new Date().toISOString(),
          notes: note06.trim(),
          status: val06 === null ? 'unrecorded' : val06 >= 2 && val06 <= 8 ? 'normal' : val06 < 2 ? 'low' : 'high',
        },
      };

      await saveFridgeTempRecord(selectedYearCE, thaiYear, selectedMonth, selectedDay, recordToSave);
      setSaveSuccess(true);
      if (onToast) {
        onToast({
          type: 'success',
          title: 'บันทึกอุณหภูมิตู้เย็นยา (2-8°C) สำเร็จ',
          message: `บันทึกค่าอุณหภูมิ 14.00, 22.00, 06.00 วันที่ ${selectedDay} ${monthObj.name} พ.ศ. ${thaiYear} ลง Firebase Firestore เรียบร้อยแล้ว`,
          collection: 'icu_fridge_temp',
          docId: `${selectedYearCE}_${String(selectedMonth).padStart(2, '0')}_day${String(selectedDay).padStart(2, '0')}`,
        });
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving fridge temp:', err);
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

  // Prepare chart data across the entire month
  const chartData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const rec = records[d];
      return {
        day: `วันที่ ${d}`,
        dayNum: d,
        temp14: rec?.morning_14?.temp ?? null,
        temp22: rec?.afternoon_22?.temp ?? null,
        temp06: rec?.night_06?.temp ?? null,
      };
    });
  }, [records, daysInMonth]);

  // Calculate statistics
  const stats = useMemo(() => {
    const allTemps: number[] = [];
    let abnormalCount = 0;
    let totalEntries = 0;

    (Object.values(records) as DailyFridgeTempRecord[]).forEach((r) => {
      [r.morning_14?.temp, r.afternoon_22?.temp, r.night_06?.temp].forEach((t) => {
        if (typeof t === 'number' && !isNaN(t)) {
          allTemps.push(t);
          totalEntries++;
          if (t < 2 || t > 8) abnormalCount++;
        }
      });
    });

    const avg = allTemps.length > 0 ? (allTemps.reduce((a, b) => a + b, 0) / allTemps.length).toFixed(1) : '-';
    const max = allTemps.length > 0 ? Math.max(...allTemps).toFixed(1) : '-';
    const min = allTemps.length > 0 ? Math.min(...allTemps).toFixed(1) : '-';

    return { avg, max, min, abnormalCount, totalEntries };
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-1">
            <Thermometer className="w-4 h-4 text-blue-600" />
            <span>งานที่ 5: การบันทึกอุณหภูมิตู้เย็นยา</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            บันทึกและกราฟอุณหภูมิตู้เย็นยา — เดือน {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เกณฑ์ปกติ: <strong>2.0 - 8.0 °C</strong> | บันทึก 3 กะ: เช้า (14.00 น.), บ่าย (22.00 น.), ดึก (06.00 น.)
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

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">อุณหภูมิเฉลี่ย</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats.avg} <span className="text-sm font-normal text-slate-500">°C</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">เกณฑ์ปกติ 2.0 - 8.0 °C</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">อุณหภูมิต่ำสุด (Min)</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{stats.min} <span className="text-sm font-normal text-slate-500">°C</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">บันทึกทั้งเดือน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">อุณหภูมิสูงสุด (Max)</div>
          <div className="text-2xl font-black text-sky-700 mt-1">{stats.max} <span className="text-sm font-normal text-slate-500">°C</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">บันทึกทั้งเดือน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">ครั้งที่อุณหภูมิผิดปกติ</div>
          <div className={`text-2xl font-black mt-1 ${stats.abnormalCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {stats.abnormalCount} <span className="text-sm font-normal text-slate-500">ครั้ง</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.abnormalCount === 0 ? 'อยู่ในเกณฑ์ปกติ 100%' : 'ต้องตรวจสอบตู้เย็น'}
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left + Blue Recharts Graph on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-blue-600" />
                <span>บันทึกอุณหภูมิ วันที่ {selectedDay} {monthObj.name}</span>
              </h3>
              <p className="text-xs text-slate-500">
                รอบเวลา 14.00 น., 22.00 น., 06.00 น.
              </p>
            </div>

            {/* 1. รอบ 14.00 น. (เวรเช้า) */}
            <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. รอบเช้า (เวลา 14.00 น.)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="°C"
                    value={temp14}
                    onChange={(e) => setTemp14(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-2.5 py-1 text-center font-bold text-slate-800 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                  <span className="text-xs font-semibold text-slate-700">°C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="ชื่อผู้บันทึก 14.00"
                  value={rec14}
                  onChange={(e) => setRec14(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="หมายเหตุ"
                  value={note14}
                  onChange={(e) => setNote14(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* 2. รอบ 22.00 น. (เวรบ่าย) */}
            <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. รอบบ่าย (เวลา 22.00 น.)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="°C"
                    value={temp22}
                    onChange={(e) => setTemp22(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-2.5 py-1 text-center font-bold text-slate-800 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                  <span className="text-xs font-semibold text-slate-700">°C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="ชื่อผู้บันทึก 22.00"
                  value={rec22}
                  onChange={(e) => setRec22(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="หมายเหตุ"
                  value={note22}
                  onChange={(e) => setNote22(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* 3. รอบ 06.00 น. (เวรดึก) */}
            <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. รอบดึก (เวลา 06.00 น.)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="°C"
                    value={temp06}
                    onChange={(e) => setTemp06(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-2.5 py-1 text-center font-bold text-slate-800 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                  <span className="text-xs font-semibold text-slate-700">°C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="ชื่อผู้บันทึก 06.00"
                  value={rec06}
                  onChange={(e) => setRec06(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="หมายเหตุ"
                  value={note06}
                  onChange={(e) => setNote06(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกอุณหภูมิตู้เย็นเรียบร้อย!</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">ระบบจุดกราฟสีน้ำเงินอัตโนมัติ</span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกอุณหภูมิ'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Graph Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-xs" />
                <h3 className="font-bold text-slate-800 text-sm">
                  กราฟแสดงอุณหภูมิตู้เย็นยา (°C) — เชื่อมโยงเส้นกราฟด้วยสีน้ำเงิน
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-semibold">
                ช่วงปกติ: 2.0 - 8.0 °C
              </span>
            </div>

            {/* Recharts Chart */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dayNum" tick={{ fontSize: 11 }} label={{ value: 'วันที่ในเดือน', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} unit="°" />
                  <Tooltip
                    formatter={(val: any, name: string) => [
                      `${val} °C`,
                      name === 'temp14'
                        ? 'เช้า 14.00 น.'
                        : name === 'temp22'
                        ? 'บ่าย 22.00 น.'
                        : 'ดึก 06.00 น.',
                    ]}
                    labelFormatter={(label) => `วันที่ ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => {
                      if (value === 'temp14') return 'เช้า 14.00 น.';
                      if (value === 'temp22') return 'บ่าย 22.00 น.';
                      if (value === 'temp06') return 'ดึก 06.00 น.';
                      return value;
                    }}
                  />

                  {/* Standard Range 2 - 8 C highlight */}
                  <ReferenceArea y1={2} y2={8} {...({ fill: '#dcfce7', fillOpacity: 0.5 } as any)} />
                  <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Max 8°C', fill: '#ef4444', fontSize: 10 }} />
                  <ReferenceLine y={2} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Min 2°C', fill: '#3b82f6', fontSize: 10 }} />

                  {/* 3 Shift Lines in Blue palette */}
                  <Line
                    type="monotone"
                    dataKey="temp14"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="temp22"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3.5, fill: '#2563eb', stroke: '#fff' }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="temp06"
                    stroke="#3b82f6"
                    strokeWidth={1.8}
                    dot={{ r: 3, fill: '#3b82f6', stroke: '#fff' }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>คำแนะนำมาตรฐาน:</strong> แถบสีเขียวอ่อนคือช่วงอุณหภูมิปกติ 2 - 8 °C สำหรับเก็บรักษาวัคซีนและยาชีววัตถุ หากเส้นกราฟสีน้ำเงินออกนอกแถบสีเขียว ให้รีบตรวจสอบระบบระบายความร้อนของตู้เย็นและรายงานทันที
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
