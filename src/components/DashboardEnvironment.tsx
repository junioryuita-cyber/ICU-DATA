import React, { useMemo, useState } from 'react';
import {
  DailyFridgeTempRecord,
  DailyHumidityRecord,
  THAI_MONTHS,
  THAI_YEARS,
} from '../types/icu';
import { getDaysInMonth } from '../services/icuService';
import {
  Activity,
  Thermometer,
  Droplets,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
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
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

interface DashboardEnvironmentProps {
  selectedYearCE: number;
  selectedMonth: number;
  tempRecords: Record<number, DailyFridgeTempRecord>;
  humidityRecords: Record<number, DailyHumidityRecord>;
  onOpenPrintModal: () => void;
}

export const DashboardEnvironment: React.FC<DashboardEnvironmentProps> = ({
  selectedYearCE,
  selectedMonth,
  tempRecords,
  humidityRecords,
  onOpenPrintModal,
}) => {
  const daysInMonth = getDaysInMonth(selectedYearCE, selectedMonth);
  const thaiYear = THAI_YEARS.find((y) => y.ceYear === selectedYearCE)?.thaiYear || selectedYearCE + 543;
  const monthObj = THAI_MONTHS.find((m) => m.value === selectedMonth) || THAI_MONTHS[0];

  const [activeView, setActiveView] = useState<'both' | 'temp' | 'humidity'>('both');

  // Combined Chart Dataset
  const chartData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const t = tempRecords[d];
      const h = humidityRecords[d];

      return {
        day: `วันที่ ${d}`,
        dayNum: d,
        // Temp (Blue)
        temp14: t?.morning_14?.temp ?? null,
        temp22: t?.afternoon_22?.temp ?? null,
        temp06: t?.night_06?.temp ?? null,
        // Humidity (Red)
        hum14: h?.morning_14?.humidity ?? null,
        hum22: h?.afternoon_22?.humidity ?? null,
        hum06: h?.night_06?.humidity ?? null,
      };
    });
  }, [daysInMonth, tempRecords, humidityRecords]);

  // Statistics calculation
  const stats = useMemo(() => {
    let tempCount = 0;
    let tempNormal = 0;
    let humCount = 0;
    let humNormal = 0;

    (Object.values(tempRecords) as DailyFridgeTempRecord[]).forEach((r) => {
      [r.morning_14?.temp, r.afternoon_22?.temp, r.night_06?.temp].forEach((t) => {
        if (typeof t === 'number' && !isNaN(t)) {
          tempCount++;
          if (t >= 2 && t <= 8) tempNormal++;
        }
      });
    });

    (Object.values(humidityRecords) as DailyHumidityRecord[]).forEach((r) => {
      [r.morning_14?.humidity, r.afternoon_22?.humidity, r.night_06?.humidity].forEach((h) => {
        if (typeof h === 'number' && !isNaN(h)) {
          humCount++;
          if (h >= 40 && h <= 75) humNormal++;
        }
      });
    });

    const tempCompliance = tempCount > 0 ? Math.round((tempNormal / tempCount) * 100) : 100;
    const humCompliance = humCount > 0 ? Math.round((humNormal / humCount) * 100) : 100;

    return {
      tempCount,
      tempCompliance,
      tempAbnormal: tempCount - tempNormal,
      humCount,
      humCompliance,
      humAbnormal: humCount - humNormal,
    };
  }, [tempRecords, humidityRecords]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['ICU-DATA สรุปการบันทึกอุณหภูมิและความชื้นสัมพัทธ์', `${monthObj.name} พ.ศ. ${thaiYear}`],
      ['วันที่', 'Temp 14.00 (°C)', 'Temp 22.00 (°C)', 'Temp 06.00 (°C)', 'Hum 14.00 (%RH)', 'Hum 22.00 (%RH)', 'Hum 06.00 (%RH)'],
    ];

    for (let d = 1; d <= daysInMonth; d++) {
      const t = tempRecords[d];
      const h = humidityRecords[d];
      rows.push([
        `${d}/${selectedMonth}/${thaiYear}`,
        String(t?.morning_14?.temp ?? '-'),
        String(t?.afternoon_22?.temp ?? '-'),
        String(t?.night_06?.temp ?? '-'),
        String(h?.morning_14?.humidity ?? '-'),
        String(h?.afternoon_22?.humidity ?? '-'),
        String(h?.night_06?.humidity ?? '-'),
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ICU_Temp_Humidity_${selectedYearCE}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-1">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>งานที่ 8: Dashboard สรุปการบันทึกอุณหภูมิตู้เย็นยา และความชื้นสัมพัทธ์</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            รายงานและกราฟสรุปอุณหภูมิ & ความชื้น — {monthObj.name} พ.ศ. {thaiYear}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            กราฟอุณหภูมิตู้เย็น (สีน้ำเงิน 2-8°C) และกราฟความชื้นสัมพัทธ์ (สีแดง 40-75%RH) บันทึก 3 กะต่อวัน
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">อุณหภูมิปกติ (2-8°C)</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats.tempCompliance}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.tempAbnormal === 0 ? 'อยู่ในเกณฑ์ 100%' : `ผิดปกติ ${stats.tempAbnormal} ครั้ง`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">ความชื้นปกติ (40-75%)</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.humCompliance}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.humAbnormal === 0 ? 'อยู่ในเกณฑ์ 100%' : `ผิดปกติ ${stats.humAbnormal} ครั้ง`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">บันทึกอุณหภูมิตู้เย็น</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {stats.tempCount} <span className="text-xs font-normal text-slate-500">/ {daysInMonth * 3} รอบ</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">14.00, 22.00, 06.00 น.</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400">บันทึกความชื้นสัมพัทธ์</div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {stats.humCount} <span className="text-xs font-normal text-slate-500">/ {daysInMonth * 3} รอบ</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">ห้องเตรียมยาและตู้เย็น</div>
        </div>
      </div>

      {/* Dual Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Blue Fridge Temperature */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  1. กราฟอุณหภูมิตู้เย็นยา (°C) — สีน้ำเงิน
                </h3>
                <p className="text-[11px] text-slate-500">เกณฑ์มาตรฐาน 2.0 - 8.0 °C</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-bold">
              Blue Curve
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dayNum" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} unit="°" />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${val} °C`,
                    name === 'temp14'
                      ? 'เช้า 14.00'
                      : name === 'temp22'
                      ? 'บ่าย 22.00'
                      : 'ดึก 06.00',
                  ]}
                />
                <Legend verticalAlign="top" height={32} />
                <ReferenceArea y1={2} y2={8} {...({ fill: '#dcfce7', fillOpacity: 0.6 } as any)} />
                <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="2 2" />
                <ReferenceLine y={2} stroke="#3b82f6" strokeDasharray="2 2" />
                <Line type="monotone" dataKey="temp14" name="เช้า 14.00" stroke="#1d4ed8" strokeWidth={2.2} dot={{ r: 3.5 }} connectNulls />
                <Line type="monotone" dataKey="temp22" name="บ่าย 22.00" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="temp06" name="ดึก 06.00" stroke="#60a5fa" strokeWidth={1.8} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Red Humidity Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  2. กราฟความชื้นสัมพัทธ์ (%RH) — สีแดง
                </h3>
                <p className="text-[11px] text-slate-500">เกณฑ์มาตรฐาน 40 - 75 %RH</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-full font-bold">
              Red Curve
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dayNum" tick={{ fontSize: 10 }} />
                <YAxis domain={[20, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${val} %RH`,
                    name === 'hum14'
                      ? 'เช้า 14.00'
                      : name === 'hum22'
                      ? 'บ่าย 22.00'
                      : 'ดึก 06.00',
                  ]}
                />
                <Legend verticalAlign="top" height={32} />
                <ReferenceArea y1={40} y2={75} {...({ fill: '#fee2e2', fillOpacity: 0.5 } as any)} />
                <ReferenceLine y={75} stroke="#dc2626" strokeDasharray="2 2" />
                <ReferenceLine y={40} stroke="#ea580c" strokeDasharray="2 2" />
                <Line type="monotone" dataKey="hum14" name="เช้า 14.00" stroke="#dc2626" strokeWidth={2.2} dot={{ r: 3.5 }} connectNulls />
                <Line type="monotone" dataKey="hum22" name="บ่าย 22.00" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="hum06" name="ดึก 06.00" stroke="#fb7185" strokeWidth={1.8} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Combined 31-Day Environment Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>ตารางบันทึกประจำวัน 3 กะ: อุณหภูมิและ ความชื้นสัมพัทธ์ (ครบ 31 วัน)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-center">
                <th rowSpan={2} className="py-3 px-3 border-b border-slate-800 font-bold sticky left-0 bg-slate-900 z-10 w-20">
                  วันที่
                </th>
                <th colSpan={3} className="py-2 px-3 border-b border-slate-800 font-bold bg-blue-950 border-l border-slate-800 text-blue-200">
                  อุณหภูมิตู้เย็นยา (°C) [เกณฑ์ 2.0 - 8.0 °C]
                </th>
                <th colSpan={3} className="py-2 px-3 border-b border-slate-800 font-bold bg-rose-950 border-l border-slate-800 text-rose-200">
                  ความชื้นสัมพัทธ์ (%RH) [เกณฑ์ 40 - 75 %RH]
                </th>
                <th rowSpan={2} className="py-3 px-3 border-b border-slate-800 font-bold border-l border-slate-800 w-28">
                  สถานะ
                </th>
              </tr>
              <tr className="bg-slate-800 text-slate-300 text-center text-[11px]">
                <th className="py-2 px-2 border-l border-slate-700">14.00 (เช้า)</th>
                <th className="py-2 px-2 border-l border-slate-700">22.00 (บ่าย)</th>
                <th className="py-2 px-2 border-l border-slate-700">06.00 (ดึก)</th>

                <th className="py-2 px-2 border-l border-slate-700">14.00 (เช้า)</th>
                <th className="py-2 px-2 border-l border-slate-700">22.00 (บ่าย)</th>
                <th className="py-2 px-2 border-l border-slate-700">06.00 (ดึก)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-center">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const t = tempRecords[d];
                const h = humidityRecords[d];

                const t14 = t?.morning_14?.temp;
                const t22 = t?.afternoon_22?.temp;
                const t06 = t?.night_06?.temp;

                const h14 = h?.morning_14?.humidity;
                const h22 = h?.afternoon_22?.humidity;
                const h06 = h?.night_06?.humidity;

                const hasAnyData = t14 !== undefined || t22 !== undefined || t06 !== undefined || h14 !== undefined;

                const isTempAbnormal =
                  (t14 !== undefined && t14 !== null && (t14 < 2 || t14 > 8)) ||
                  (t22 !== undefined && t22 !== null && (t22 < 2 || t22 > 8)) ||
                  (t06 !== undefined && t06 !== null && (t06 < 2 || t06 > 8));

                const isHumAbnormal =
                  (h14 !== undefined && h14 !== null && (h14 < 40 || h14 > 75)) ||
                  (h22 !== undefined && h22 !== null && (h22 < 40 || h22 > 75)) ||
                  (h06 !== undefined && h06 !== null && (h06 < 40 || h06 > 75));

                return (
                  <tr key={d} className="hover:bg-slate-50 transition-colors">
                    {/* Date */}
                    <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-0 bg-white shadow-xs">
                      วันที่ {d}
                    </td>

                    {/* Temp 14.00 */}
                    <td className="py-2.5 px-2 border-l border-slate-100 font-medium">
                      {t14 !== undefined && t14 !== null ? (
                        <span className={t14 < 2 || t14 > 8 ? 'text-rose-600 font-bold' : 'text-blue-700'}>
                          {t14} °C
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Temp 22.00 */}
                    <td className="py-2.5 px-2 border-l border-slate-100 font-medium">
                      {t22 !== undefined && t22 !== null ? (
                        <span className={t22 < 2 || t22 > 8 ? 'text-rose-600 font-bold' : 'text-blue-700'}>
                          {t22} °C
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Temp 06.00 */}
                    <td className="py-2.5 px-2 border-l border-slate-100 font-medium">
                      {t06 !== undefined && t06 !== null ? (
                        <span className={t06 < 2 || t06 > 8 ? 'text-rose-600 font-bold' : 'text-blue-700'}>
                          {t06} °C
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Hum 14.00 */}
                    <td className="py-2.5 px-2 border-l border-slate-100 font-medium">
                      {h14 !== undefined && h14 !== null ? (
                        <span className={h14 < 40 || h14 > 75 ? 'text-rose-600 font-bold' : 'text-rose-700'}>
                          {h14}%
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Hum 22.00 */}
                    <td className="py-2.5 px-2 border-l border-slate-100 font-medium">
                      {h22 !== undefined && h22 !== null ? (
                        <span className={h22 < 40 || h22 > 75 ? 'text-rose-600 font-bold' : 'text-rose-700'}>
                          {h22}%
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Hum 06.00 */}
                    <td className="py-2.5 px-2 border-l border-slate-100 font-medium">
                      {h06 !== undefined && h06 !== null ? (
                        <span className={h06 < 40 || h06 > 75 ? 'text-rose-600 font-bold' : 'text-rose-700'}>
                          {h06}%
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2 border-l border-slate-100">
                      {isTempAbnormal || isHumAbnormal ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> ผิดปกติ
                        </span>
                      ) : hasAnyData ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ปกติ
                        </span>
                      ) : (
                        <span className="text-slate-300 italic text-[10px]">ยังไม่บันทึก</span>
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
