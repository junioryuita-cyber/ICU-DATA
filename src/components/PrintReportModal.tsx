import React, { useRef } from 'react';
import {
  DailyMedicationRecord,
  DailyEmergencyCartRecord,
  DailyEmergencyBoxRecord,
  DailyFridgeTempRecord,
  DailyHumidityRecord,
  THAI_MONTHS,
  THAI_YEARS,
} from '../types/icu';
import { getDaysInMonth } from '../services/icuService';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYearCE: number;
  selectedMonth: number;
  medRecords: Record<number, DailyMedicationRecord>;
  cartRecords: Record<number, DailyEmergencyCartRecord>;
  boxRecords: Record<number, DailyEmergencyBoxRecord>;
  tempRecords: Record<number, DailyFridgeTempRecord>;
  humidityRecords: Record<number, DailyHumidityRecord>;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  selectedYearCE,
  selectedMonth,
  medRecords,
  cartRecords,
  boxRecords,
  tempRecords,
  humidityRecords,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const daysInMonth = getDaysInMonth(selectedYearCE, selectedMonth);
  const thaiYear = THAI_YEARS.find((y) => y.ceYear === selectedYearCE)?.thaiYear || selectedYearCE + 543;
  const monthObj = THAI_MONTHS.find((m) => m.value === selectedMonth) || THAI_MONTHS[0];

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">
              แบบฟอร์มรายงานสรุปประจำเดือน ICU-DATA (สำหรับพิมพ์ / พิมพ์เป็น PDF)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสารนี้ (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto space-y-8 print:p-0" ref={printRef}>
          {/* Header Paper */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              หอผู้ป่วยหนัก (INTENSIVE CARE UNIT - ICU) โรงพยาบาล
            </div>
            <h1 className="text-xl font-black text-slate-900">
              แบบบันทึกและตรวจสอบยา เวชภัณฑ์ รถฉุกเฉิน อุณหภูมิ และความชื้นสัมพัทธ์
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              ประจำเดือน {monthObj.name} พ.ศ. {thaiYear} (ค.ศ. {selectedYearCE})
            </p>
          </div>

          {/* Section 1: Medication & Supplies */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 bg-slate-100 p-2 rounded-md">
              1. สรุปการตรวจสอบยาและเวชภัณฑ์ ประจำเดือน (Adenosine 5 amp, Adrenaline 10 amp)
            </h2>
            <table className="w-full text-[11px] border border-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-200 border border-slate-400 text-center font-bold">
                  <th className="border border-slate-400 p-1 w-12">วันที่</th>
                  <th className="border border-slate-400 p-1">เวรเช้า (08.30-16.30)</th>
                  <th className="border border-slate-400 p-1">เวรบ่าย (16.30-00.30)</th>
                  <th className="border border-slate-400 p-1">เวรดึก (00.30-08.30)</th>
                  <th className="border border-slate-400 p-1">Emergency Box (ดึก)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const m = medRecords[d];
                  const b = boxRecords[d]?.nightShift;
                  return (
                    <tr key={d} className="border border-slate-300">
                      <td className="border border-slate-300 p-1 font-bold text-center">{d}</td>
                      <td className="border border-slate-300 p-1">
                        {m?.shifts?.morning ? (
                          <div>
                            Ade: {m.shifts.morning.adenosine.remainingCount}/5 | Adr: {m.shifts.morning.adrenaline.remainingCount}/10 ({m.shifts.morning.recorderName})
                          </div>
                        ) : '-'}
                      </td>
                      <td className="border border-slate-300 p-1">
                        {m?.shifts?.afternoon ? (
                          <div>
                            Ade: {m.shifts.afternoon.adenosine.remainingCount}/5 | Adr: {m.shifts.afternoon.adrenaline.remainingCount}/10 ({m.shifts.afternoon.recorderName})
                          </div>
                        ) : '-'}
                      </td>
                      <td className="border border-slate-300 p-1">
                        {m?.shifts?.night ? (
                          <div>
                            Ade: {m.shifts.night.adenosine.remainingCount}/5 | Adr: {m.shifts.night.adrenaline.remainingCount}/10 ({m.shifts.night.recorderName})
                          </div>
                        ) : '-'}
                      </td>
                      <td className="border border-slate-300 p-1">
                        {b ? (
                          <div>
                            Alc: {b.alcohol70.remainingCount} | Adr: {b.adrenaline.remainingCount} | สำลี: {b.cottonBall.remainingCount} ({b.recorderName})
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 2: Refrigerator Temp & Humidity */}
          <div className="space-y-2 page-break-before">
            <h2 className="text-sm font-bold text-slate-900 bg-slate-100 p-2 rounded-md">
              2. สรุปอุณหภูมิตู้เย็นยา (2.0 - 8.0 °C) และความชื้นสัมพัทธ์ (40 - 75 %RH)
            </h2>
            <table className="w-full text-[11px] border border-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-200 border border-slate-400 text-center font-bold">
                  <th rowSpan={2} className="border border-slate-400 p-1 w-12">วันที่</th>
                  <th colSpan={4} className="border border-slate-400 p-1">อุณหภูมิตู้เย็นยา (°C)</th>
                  <th colSpan={3} className="border border-slate-400 p-1">ความชื้นสัมพัทธ์ (%RH)</th>
                </tr>
                <tr className="bg-slate-100 border border-slate-400 text-center text-[10px]">
                  <th className="border border-slate-400 p-1">14.00</th>
                  <th className="border border-slate-400 p-1">22.00</th>
                  <th className="border border-slate-400 p-1">06.00</th>
                  <th className="border border-slate-400 p-1">Max/Min 09.00</th>
                  <th className="border border-slate-400 p-1">14.00</th>
                  <th className="border border-slate-400 p-1">22.00</th>
                  <th className="border border-slate-400 p-1">06.00</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const t = tempRecords[d];
                  const h = humidityRecords[d];
                  return (
                    <tr key={d} className="border border-slate-300 text-center">
                      <td className="border border-slate-300 p-1 font-bold">{d}</td>
                      <td className="border border-slate-300 p-1">{t?.morning_14?.temp ?? '-'}</td>
                      <td className="border border-slate-300 p-1">{t?.afternoon_22?.temp ?? '-'}</td>
                      <td className="border border-slate-300 p-1">{t?.night_06?.temp ?? '-'}</td>
                      <td className="border border-slate-300 p-1 text-[10px]">
                        {t?.dailyMax_09?.temp ?? '-'}/{t?.dailyMin_09?.temp ?? '-'}
                      </td>
                      <td className="border border-slate-300 p-1">{h?.morning_14?.humidity ?? '-'}</td>
                      <td className="border border-slate-300 p-1">{h?.afternoon_22?.humidity ?? '-'}</td>
                      <td className="border border-slate-300 p-1">{h?.night_06?.humidity ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures Area */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-800">
            <div className="space-y-8">
              <div>ลงชื่อ ....................................................................</div>
              <div>( .................................................................... )</div>
              <div className="font-semibold">พยาบาลหัวหน้าเวร / ผู้ตรวจสอบประจำเดือน</div>
              <div>วันที่ ...... / ............ / พ.ศ. {thaiYear}</div>
            </div>

            <div className="space-y-8">
              <div>ลงชื่อ ....................................................................</div>
              <div>( .................................................................... )</div>
              <div className="font-semibold">พยาบาลหัวหน้าหอผู้ป่วยหนัก (In-Charge ICU)</div>
              <div>วันที่ ...... / ............ / พ.ศ. {thaiYear}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
