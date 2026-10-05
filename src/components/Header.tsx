import React from 'react';
import {
  THAI_MONTHS,
  THAI_YEARS,
  StaffRecorder,
} from '../types/icu';
import {
  Calendar,
  User,
  Database,
  Printer,
  Sparkles,
  Activity,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  selectedYearCE: number;
  selectedMonth: number;
  onYearChange: (yearCE: number) => void;
  onMonthChange: (month: number) => void;
  currentStaff: StaffRecorder;
  onOpenStaffModal: () => void;
  onOpenDbModal: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onGenerateSampleData: () => void;
  onOpenPrintModal: () => void;
  isSyncing: boolean;
  expiryAlertCount: number;
  onOpenAlertDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedYearCE,
  selectedMonth,
  onYearChange,
  onMonthChange,
  currentStaff,
  onOpenStaffModal,
  onOpenDbModal,
  activeTab,
  onSelectTab,
  onGenerateSampleData,
  onOpenPrintModal,
  isSyncing,
  expiryAlertCount,
  onOpenAlertDrawer,
}) => {
  const currentThaiYearObj = THAI_YEARS.find((y) => y.ceYear === selectedYearCE) || THAI_YEARS[0];
  const currentMonthObj = THAI_MONTHS.find((m) => m.value === selectedMonth) || THAI_MONTHS[0];

  // Two rows of menu navigation
  const dashboardNavItems = [
    { id: 'dashboard_supplies', label: '1. แดชบอร์ดสรุปยาและเวชภัณฑ์', icon: '📊', desc: 'สรุปสต็อกยา 29 รายการ & รายการฉุกเฉิน' },
    { id: 'dashboard_env', label: '2. แดชบอร์ดอุณหภูมิ & ความชื้น', icon: '📈', desc: 'กราฟวิเคราะห์ตู้เย็น 2-8°C และความชื้น RH%' },
    { id: 'user_manual', label: '📖 คู่มือการใช้งานระบบ', icon: '📖', desc: 'ขั้นตอนการบันทึกข้อมูลและพิมพ์รายงาน' },
  ];

  const checkNavItems = [
    { id: 'check_med', label: '3. ตรวจสอบยาและเวชภัณฑ์ ประจำเดือน (เช้า)', icon: '💊', short: 'ยา 29 รายการ (เช้า 08.30-16.30)' },
    { id: 'check_cart', label: '4. บันทึกรถ Emergency (3 เวร)', icon: '🚑', short: 'รถ Crash Cart' },
    { id: 'check_box', label: '5. บันทึก Emergency Box (เวรดึก)', icon: '🧰', short: 'กล่องฉุกเฉิน' },
    { id: 'check_temp', label: '6. บันทึกอุณหภูมิตู้เย็นยา', icon: '❄️', short: 'ตู้เย็น 2-8°C' },
    { id: 'check_hum', label: '7. บันทึกความชื้นสัมพัทธ์ %RH', icon: '💧', short: 'ความชื้น 40-75%' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner with Hospital Title & System Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 gap-3">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">ICU-DATA</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                  ระบบงานและแดชบอร์ด ICU
                </span>
                <button
                  type="button"
                  onClick={onOpenDbModal}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                  title="คลิกเพื่อดูสถานะการเชื่อมต่อและการบันทึก Firestore"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บันทึกลง Cloud (Firestore): ออนไลน์</span>
                </button>
              </div>
              <p className="text-xs text-slate-500">
                ระบบตรวจเช็คสต็อกยา เวชภัณฑ์ รถ Emergency อุณหภูมิ และความชื้นสัมพัทธ์
              </p>
            </div>
          </div>

          {/* Right Controls: Staff Profile + Month/Year Selector + Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Expiry Alerts Pill */}
            {expiryAlertCount > 0 && (
              <button
                type="button"
                onClick={onOpenAlertDrawer}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold transition-colors animate-pulse"
                title="รายการสำลี/ยาที่ใกล้หมดอายุใน 3 เดือน"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>เตือนหมดอายุ ({expiryAlertCount})</span>
              </button>
            )}

            {/* Recorder Profile (ชื่อ-นามสกุล พยาบาลผู้บันทึก) */}
            <button
              type="button"
              onClick={onOpenStaffModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-2xs group ${
                currentStaff.name
                  ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:border-slate-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 animate-pulse font-medium'
              }`}
              title={currentStaff.name ? 'คลิกเพื่อเปลี่ยนหรือจัดการรายชื่อผู้บันทึก' : 'คลิกเพื่อระบุชื่อ-นามสกุล พยาบาลผู้บันทึกข้อมูล'}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStaff.name ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div
                  className={`text-[10px] font-medium leading-none ${
                    currentStaff.name ? 'text-slate-400' : 'text-blue-100'
                  }`}
                >
                  {currentStaff.name ? 'ผู้บันทึกเวร' : 'ยังไม่ได้ระบุชื่อ'}
                </div>
                <div
                  className={`font-semibold leading-tight ${
                    currentStaff.name
                      ? 'text-slate-800 group-hover:text-blue-600'
                      : 'text-white underline underline-offset-2'
                  }`}
                >
                  {currentStaff.name || '+ ระบุชื่อพยาบาล'}
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 ${currentStaff.name ? 'text-slate-400' : 'text-blue-200'}`}
              />
            </button>

            {/* Year Selector (พ.ศ. 2569 - 2580) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                aria-label="เลือกเดือนประจำรอบการบันทึก"
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer py-1 px-1"
              >
                {THAI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>

              <span className="text-slate-300">|</span>

              <select
                value={selectedYearCE}
                onChange={(e) => onYearChange(Number(e.target.value))}
                aria-label="เลือกปี พ.ศ. ประจำรอบการบันทึก"
                className="bg-transparent font-semibold text-blue-700 focus:outline-none cursor-pointer py-1 px-1"
              >
                {THAI_YEARS.map((y) => (
                  <option key={y.ceYear} value={y.ceYear}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions: Manual, Print & Sample Data */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectTab('user_manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'user_manual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
                title="เปิดคู่มือการใช้งานระบบ ICU-DATA"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>คู่มือการใช้งาน</span>
              </button>

              <button
                type="button"
                onClick={onOpenPrintModal}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                title="พิมพ์แบบฟอร์มรายงานสรุปประจำเดือน"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onGenerateSampleData}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="สร้างข้อมูลตัวอย่างจำลองสำหรับเดือนนี้เพื่อทดสอบระบบ"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span className="hidden sm:inline">จำลองข้อมูล</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-ROW NAVIGATION MENU (แถบเมนู 2 บรรทัด) */}
        <div className="border-t border-slate-100 py-1.5 space-y-1.5">
          {/* บรรทัดที่ 1: แดชบอร์ดภาพรวม & การวิเคราะห์ */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-100 rounded-lg shrink-0 flex items-center gap-1">
              <span>แดชบอร์ด</span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {dashboardNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:text-blue-700'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* บรรทัดที่ 2: เมนูบันทึกข้อมูลประจำเวร ICU */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider px-2 py-1 bg-blue-100 rounded-lg shrink-0 flex items-center gap-1">
              <span>บันทึกเวร</span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {checkNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold ring-2 ring-indigo-300'
                        : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 hover:text-indigo-700'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
