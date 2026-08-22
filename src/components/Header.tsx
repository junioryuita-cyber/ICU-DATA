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
} from 'lucide-react';

interface HeaderProps {
  selectedYearCE: number;
  selectedMonth: number;
  onYearChange: (yearCE: number) => void;
  onMonthChange: (month: number) => void;
  currentStaff: StaffRecorder;
  onOpenStaffModal: () => void;
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

  const navItems = [
    { id: 'dashboard_supplies', label: '1. แดชบอร์ดสรุปยาและเวชภัณฑ์', icon: '📊' },
    { id: 'dashboard_env', label: '2. แดชบอร์ดอุณหภูมิ & ความชื้น', icon: '📈' },
    { id: 'check_med', label: '3. บันทึกยา & เวชภัณฑ์ (3 เวร)', icon: '💊' },
    { id: 'check_cart', label: '4. บันทึกรถ Emergency (3 เวร)', icon: '🚑' },
    { id: 'check_box', label: '5. บันทึก Emergency Box (เวรดึก)', icon: '🧰' },
    { id: 'check_temp', label: '6. บันทึกอุณหภูมิตู้เย็นยา', icon: '❄️' },
    { id: 'check_hum', label: '7. บันทึกความชื้นสัมพัทธ์ %RH', icon: '💧' },
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
                <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Database className="w-3 h-3" />
                  <span>Firebase: ICU-DATA</span>
                </div>
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

            {/* Recorder Profile (ชื่อ-นามสกุล ผู้บันทึก) */}
            <button
              type="button"
              onClick={onOpenStaffModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 transition-all hover:border-slate-300 shadow-2xs group"
              title="คลิกเพื่อเปลี่ยนหรือแก้ไขชื่อผู้บันทึกข้อมูล"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-medium leading-none">ผู้บันทึกปัจจุบัน</div>
                <div className="font-semibold text-slate-800 group-hover:text-blue-600 leading-tight">
                  {currentStaff.name}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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

            {/* Actions: Print & Sample Data */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenPrintModal}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                title="พิมพ์แบบฟอร์มรายงานสรุปประจำเดือน"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onGenerateSampleData}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
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

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none pt-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
