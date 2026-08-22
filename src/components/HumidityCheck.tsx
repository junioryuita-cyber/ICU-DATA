import React, { useState, useMemo } from 'react';
import {
  DailyHumidityRecord,
  StaffRecorder,
  THAI_MONTHS,
  THAI_YEARS,
} from '../types/icu';
import { saveHumidityRecord, getDaysInMonth } from '../services/icuService';
import {
  Droplets,
  Save,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
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

interface HumidityCheckProps {
  selectedYearCE: number;
  selectedMonth: number;
  currentStaff: StaffRecorder;
  records: Record<number, DailyHumidityRecord>;
}

export const HumidityCheck: React.FC<HumidityCheckProps> = ({
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

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentDayRecord = records[selectedDay];

  // Shift 1: 14.00 (เช้า)
  const [hum14, setHum14] = useState<number | ''>(currentDayRecord?.morning_14?.humidity ?? 55);
  const [rec14, setRec14] = useState<string>(currentDayRecord?.morning_14?.recorderName || currentStaff.name);
  const [note14, setNote14] = useState<string>(currentDayRecord?.morning_14?.notes ?? 'ความชื้นห้องเตรียมยาปกติ');

  // Shift 2: 22.00 (บ่าย)
  const [hum22, setHum22] = useState<number | ''>(currentDayRecord?.afternoon_22?.humidity ?? 58);
  const [rec22, setRec22] = useState<string>(currentDayRecord?.afternoon_22?.recorderName || currentStaff.name);
  const [note22, setNote22] = useState<string>(currentDayRecord?.afternoon_22?.notes ?? 'ปกติ');

  // Shift 3: 06.00 (ดึก)
  const [hum06, setHum06] = useState<number | ''>(currentDayRecord?.night_06?.humidity ?? 60);
  const [rec06, setRec06] = useState<string>(currentDayRecord?.night_06?.recorderName || currentStaff.name);
  const [note06, setNote06] = useState<string>(currentDayRecord?.night_06?.notes ?? 'ปกติ');

  // Sync state on day switch
  React.useEffect(() => {
    const data = records[selectedDay];
    if (data) {
      setHum14(data.morning_14?.humidity ?? '');
      setRec14(data.morning_14?.recorderName || currentStaff.name);
      setNote14(data.morning_14?.notes ?? '');

      setHum22(data.afternoon_22?.humidity ?? '');
      setRec22(data.afternoon_22?.recorderName || currentStaff.name);
      setNote22(data.afternoon_22?.notes ?? '');

      setHum06(data.night_06?.humidity ?? '');
      setRec06(data.night_06?.recorderName || currentStaff.name);
      setNote06(data.night_06?.notes ?? '');
    } else {
      setHum14('');
      setRec14(currentStaff.name);
      setNote14('');

      setHum22('');
      setRec22(currentStaff.name);
      setNote22('');

      setHum06('');
      setRec06(currentStaff.name);
      setNote06('');
    }
    setSaveSuccess(false);
  }, [selectedDay, records, currentStaff.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const val14 = hum14 !== '' ? Number(hum14) : null;
      const val22 = hum22 !== '' ? Number(hum22) : null;
      const val06 = hum06 !== '' ? Number(hum06) : null;

      const recordToSave: Partial<DailyHumidityRecord> = {
        morning_14: {
          humidity: val14,
          recorderName: rec14.trim() || currentStaff.name,
          recordedAt: new Date().toISOString(),
          notes: note14.trim(),
          status: val14 === null ? 'unrecorded' : val14 >= 40 && val14 <= 75 ? 'normal' : val14 < 40 ? 'low' : 'high',
        },
        afternoon_22: {
          humidity: val22,
          recorderName: rec22.trim() || currentStaff.name,
          recordedAt: new Date().toISOString(),
          notes: note22.trim(),
          status: val22 === null ? 'unrecorded' : val22 >= 40 && val22 <= 75 ? 'normal' : val22 < 40 ? 'low' : 'high',
        },
        night_06: {
          humidity: val06,
          recorderName: rec06.trim() || currentStaff.name,
          recordedAt: new Date().toISOString(),
          notes: note06.trim(),
          status: val06 === null ? 'unrecorded' : val06 >= 40 && val06 <= 75 ? 'normal' : val06 < 40 ? 'low' : 'high',
        },
      };

      await saveHumidityRecord(selectedYearCE, thaiYear, selectedMonth, selectedDay, recordToSave);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving humidity:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare chart data for Red line chart
  const chartData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const rec = records[d];
      return {
        day: `วันที่ ${d}`,
        dayNum: d,
        hum14: rec?.morning_14?.humidity ?? null,
        hum22: rec?.afternoon_22?.humidity ?? null,
        hum06: rec?.night_06?.humidity ?? null,
      };
    });
  }, [records, daysInMonth]);

  // Statistics
  const stats = useMemo(() => {
    const allHums: number[] = [];
    let abnormalCount = 0;

    (Object.values(records) as DailyHumidityRecord[]).forEach((r) => {
      [r.morning_14?.humidity, r.afternoon_22?.humidity, r.night_06?.humidity].forEach((h) => {
        if (typeof h === 'number' && !isNaN(h)) {
          allHums.push(h);
          if (h < 40 || h > 75) abnormalCount++;
        }
      });
    });

    const avg = allHums.length > 0 ? (allHums.reduce((a, b) => a + b, 0) / allHums.length).toFixed(1) : '-';
    const max = allHums.length > 0 ? Math.max(...allHums) : '-';
    const min = allHums.length > 0 ? Math.min(...allHums) : '-';

    return { avg, max, min, abnormalCount, totalEntries: allHums.length };
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-1">
            <Droplets className="w-4 h-4 text-rose-600" />
            <span>งานที่ 6: การบันทึกความชื้นสัมพัทธ์ของตู้เย็นยาและห้องเตรียมยา</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            บันทึกและกราฟความชื้นสัมพัทธ์ (%RH) — เดือน {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เกณฑ์ปกติ: <strong>40 - 75 %RH</strong> | บันทึก 3 กะ: เช้า (14.00), บ่าย (22.00), ดึก (06.00) เชื่อมโยงเป็นกราฟด้วย <strong>สีแดง</strong>
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

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">ความชื้นเฉลี่ย</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.avg} <span className="text-sm font-normal text-slate-500">%RH</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">เกณฑ์ปกติ 40 - 75 %RH</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">ความชื้นต่ำสุด (Min)</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.min} <span className="text-sm font-normal text-slate-500">%RH</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">บันทึกทั้งเดือน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">ความชื้นสูงสุด (Max)</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{stats.max} <span className="text-sm font-normal text-slate-500">%RH</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">บันทึกทั้งเดือน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">ครั้งที่ความชื้นผิดปกติ</div>
          <div className={`text-2xl font-black mt-1 ${stats.abnormalCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {stats.abnormalCount} <span className="text-sm font-normal text-slate-500">ครั้ง</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.abnormalCount === 0 ? 'อยู่ในเกณฑ์ปกติ 100%' : 'ต้องควบคุมความชื้น'}
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left + Red Recharts Graph on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Droplets className="w-5 h-5 text-rose-600" />
                <span>บันทึกความชื้น วันที่ {selectedDay} {monthObj.name}</span>
              </h3>
              <p className="text-xs text-slate-500">
                ตู้เย็นยาและห้องเตรียมยา รอบ 14.00, 22.00, 06.00 น.
              </p>
            </div>

            {/* 1. รอบ 14.00 น. (เวรเช้า) */}
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>1. รอบเช้า (เวลา 14.00 น.)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="%RH"
                    min="0"
                    max="100"
                    value={hum14}
                    onChange={(e) => setHum14(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-2.5 py-1 text-center font-bold text-slate-800 bg-white border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm"
                  />
                  <span className="text-xs font-semibold text-slate-700">%RH</span>
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
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>2. รอบบ่าย (เวลา 22.00 น.)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="%RH"
                    min="0"
                    max="100"
                    value={hum22}
                    onChange={(e) => setHum22(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-2.5 py-1 text-center font-bold text-slate-800 bg-white border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm"
                  />
                  <span className="text-xs font-semibold text-slate-700">%RH</span>
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
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>3. รอบดึก (เวลา 06.00 น.)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="%RH"
                    min="0"
                    max="100"
                    value={hum06}
                    onChange={(e) => setHum06(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-2.5 py-1 text-center font-bold text-slate-800 bg-white border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm"
                  />
                  <span className="text-xs font-semibold text-slate-700">%RH</span>
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
                  <span>บันทึกความชื้นสัมพัทธ์เรียบร้อย!</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">ระบบจุดกราฟสีแดงอัตโนมัติ</span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกความชื้น'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Graph Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-600 shadow-xs" />
                <h3 className="font-bold text-slate-800 text-sm">
                  กราฟแสดงความชื้นสัมพัทธ์ (%RH) — เชื่อมโยงเส้นกราฟด้วยสีแดง
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-semibold">
                ช่วงปกติ: 40 - 75 %RH
              </span>
            </div>

            {/* Recharts Red Chart */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dayNum" tick={{ fontSize: 11 }} label={{ value: 'วันที่ในเดือน', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                  <YAxis domain={[20, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(val: any, name: string) => [
                      `${val} %RH`,
                      name === 'hum14'
                        ? 'เช้า 14.00 น.'
                        : name === 'hum22'
                        ? 'บ่าย 22.00 น.'
                        : 'ดึก 06.00 น.',
                    ]}
                    labelFormatter={(label) => `วันที่ ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => {
                      if (value === 'hum14') return 'เช้า 14.00 น.';
                      if (value === 'hum22') return 'บ่าย 22.00 น.';
                      if (value === 'hum06') return 'ดึก 06.00 น.';
                      return value;
                    }}
                  />

                  {/* Standard Safe Zone 40 - 75 %RH highlight */}
                  <ReferenceArea y1={40} y2={75} {...({ fill: '#fee2e2', fillOpacity: 0.4 } as any)} />
                  <ReferenceLine y={75} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Max 75%RH', fill: '#dc2626', fontSize: 10 }} />
                  <ReferenceLine y={40} stroke="#ea580c" strokeDasharray="3 3" label={{ value: 'Min 40%RH', fill: '#ea580c', fontSize: 10 }} />

                  {/* 3 Shift Lines in Red Palette */}
                  <Line
                    type="monotone"
                    dataKey="hum14"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#dc2626', stroke: '#fff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="hum22"
                    stroke="#e11d48"
                    strokeWidth={2}
                    dot={{ r: 3.5, fill: '#e11d48', stroke: '#fff' }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="hum06"
                    stroke="#f43f5e"
                    strokeWidth={1.8}
                    dot={{ r: 3, fill: '#f43f5e', stroke: '#fff' }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 text-xs text-rose-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>ข้อกำหนดความชื้นสัมพัทธ์:</strong> ความชื้นสัมพัทธ์ที่เหมาะสมของห้องเตรียมยาและบริเวณตู้เย็นยาต้องควบคุมให้อยู่ระหว่าง 40 - 75 %RH เพื่อป้องกันการเสื่อมสภาพของบรรจุภัณฑ์เวชภัณฑ์และป้องกันการควบแน่นของหยดน้ำ
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
