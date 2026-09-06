/**
 * ICU-DATA - ระบบงานและแดชบอร์ด ICU
 * Firebase Firestore Database Integration (Project: ICU-DATA)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StaffRecorder,
  DailyMedicationRecord,
  DailyEmergencyCartRecord,
  DailyEmergencyBoxRecord,
  DailyFridgeTempRecord,
  DailyHumidityRecord,
  ExpiryAlertInfo,
  THAI_YEARS,
  THAI_MONTHS,
  ShiftType,
} from './types/icu';
import {
  getStaffList,
  saveStaffMember,
  subscribeMonthMedications,
  subscribeMonthEmergencyCart,
  subscribeMonthEmergencyBox,
  subscribeMonthFridgeTemp,
  subscribeMonthHumidity,
  generateSampleMonthData,
  checkExpiryAlert,
} from './services/icuService';
import { Header } from './components/Header';
import { StaffModal } from './components/StaffModal';
import { DailyMedicationCheck } from './components/DailyMedicationCheck';
import { EmergencyCartCheck } from './components/EmergencyCartCheck';
import { EmergencyBoxCheck } from './components/EmergencyBoxCheck';
import { FridgeTempCheck } from './components/FridgeTempCheck';
import { HumidityCheck } from './components/HumidityCheck';
import { DashboardSupplies } from './components/DashboardSupplies';
import { DashboardEnvironment } from './components/DashboardEnvironment';
import { PrintReportModal } from './components/PrintReportModal';
import { ExpiryAlertBanner } from './components/ExpiryAlertBanner';
import { DbStatusModal } from './components/DbStatusModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import confetti from 'canvas-confetti';
import { Activity, Sparkles, CheckCircle2, ShieldCheck, Database } from 'lucide-react';

const DEFAULT_STAFF: StaffRecorder = {
  id: '1',
  name: 'พว. กานดา รัตนวิชัย',
  role: 'พยาบาลวิชาชีพชำนาญการ (ICU หัวหน้าเวร)',
};

export default function App() {
  // Current time / default date settings
  const today = new Date();
  const currentCEYear = today.getFullYear() >= 2026 && today.getFullYear() <= 2037 ? today.getFullYear() : 2026;
  const currentMonthNum = today.getMonth() + 1;

  const [selectedYearCE, setSelectedYearCE] = useState<number>(currentCEYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [activeTab, setActiveTab] = useState<string>('dashboard_supplies');

  // Staff state
  const [staffList, setStaffList] = useState<StaffRecorder[]>([]);
  const [currentStaff, setCurrentStaff] = useState<StaffRecorder>(() => {
    const saved = localStorage.getItem('icu_current_staff');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_STAFF;
      }
    }
    return DEFAULT_STAFF;
  });
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Expiry Alert Drawer
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);

  // Db Status Modal
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Firestore Data State
  const [medRecords, setMedRecords] = useState<Record<number, DailyMedicationRecord>>({});
  const [cartRecords, setCartRecords] = useState<Record<number, DailyEmergencyCartRecord>>({});
  const [boxRecords, setBoxRecords] = useState<Record<number, DailyEmergencyBoxRecord>>({});
  const [tempRecords, setTempRecords] = useState<Record<number, DailyFridgeTempRecord>>({});
  const [humidityRecords, setHumidityRecords] = useState<Record<number, DailyHumidityRecord>>({});

  // Load Staff on Mount
  useEffect(() => {
    getStaffList().then((list) => {
      setStaffList(list);
      if (!list.some((s) => s.name === currentStaff.name)) {
        if (list.length > 0) setCurrentStaff(list[0]);
      }
    });
  }, []);

  // Save current staff to localStorage
  const handleSelectStaff = (staff: StaffRecorder) => {
    setCurrentStaff(staff);
    localStorage.setItem('icu_current_staff', JSON.stringify(staff));
  };

  const handleAddNewStaff = async (name: string, role: string) => {
    const newStaff: StaffRecorder = {
      id: Date.now().toString(),
      name,
      role,
      lastUsedAt: new Date().toISOString(),
    };
    await saveStaffMember(newStaff);
    const updated = [...staffList, newStaff];
    setStaffList(updated);
    handleSelectStaff(newStaff);
  };

  // Subscribe to Realtime Firestore collections for the selected Year & Month
  useEffect(() => {
    const unsubMed = subscribeMonthMedications(selectedYearCE, selectedMonth, (data) => {
      setMedRecords(data);
    });

    const unsubCart = subscribeMonthEmergencyCart(selectedYearCE, selectedMonth, (data) => {
      setCartRecords(data);
    });

    const unsubBox = subscribeMonthEmergencyBox(selectedYearCE, selectedMonth, (data) => {
      setBoxRecords(data);
    });

    const unsubTemp = subscribeMonthFridgeTemp(selectedYearCE, selectedMonth, (data) => {
      setTempRecords(data);
    });

    const unsubHum = subscribeMonthHumidity(selectedYearCE, selectedMonth, (data) => {
      setHumidityRecords(data);
    });

    return () => {
      unsubMed();
      unsubCart();
      unsubBox();
      unsubTemp();
      unsubHum();
    };
  }, [selectedYearCE, selectedMonth]);

  // Aggregate 3-Month Expiry Alerts across Cart and Box for this month
  const expiryAlerts: ExpiryAlertInfo[] = useMemo(() => {
    const alerts: ExpiryAlertInfo[] = [];
    const thaiYear = THAI_YEARS.find((y) => y.ceYear === selectedYearCE)?.thaiYear || selectedYearCE + 543;

    // From Cart
    (Object.values(cartRecords) as DailyEmergencyCartRecord[]).forEach((rec) => {
      (['morning', 'afternoon', 'night'] as ShiftType[]).forEach((sh) => {
        const item = rec.shifts?.[sh]?.cottonBall;
        if (item?.expiryDate) {
          const res = checkExpiryAlert(item.expiryDate);
          if (res.status === 'warning_3months' || res.status === 'expired') {
            alerts.push({
              id: `cart_${rec.day}_${sh}`,
              source: 'cart',
              day: rec.day,
              month: selectedMonth,
              yearThai: thaiYear,
              shift: sh,
              itemName: 'สำลี 5 ก้อน (2 ห่อ)',
              expiryDate: item.expiryDate,
              daysRemaining: res.daysRemaining,
              status: res.status,
            });
          }
        }
      });
    });

    // From Box
    (Object.values(boxRecords) as DailyEmergencyBoxRecord[]).forEach((rec) => {
      const item = rec.nightShift?.cottonBall;
      if (item?.expiryDate) {
        const res = checkExpiryAlert(item.expiryDate);
        if (res.status === 'warning_3months' || res.status === 'expired') {
          alerts.push({
            id: `box_${rec.day}`,
            source: 'box',
            day: rec.day,
            month: selectedMonth,
            yearThai: thaiYear,
            shift: 'night',
            itemName: 'สำลี 5 ก้อน (2 ห่อ)',
            expiryDate: item.expiryDate,
            daysRemaining: res.daysRemaining,
            status: res.status,
          });
        }
      }
    });

    return alerts;
  }, [cartRecords, boxRecords, selectedYearCE, selectedMonth]);

  // Sample mock data generator
  const handleGenerateSampleData = async () => {
    setIsSyncing(true);
    try {
      const thaiYear = THAI_YEARS.find((y) => y.ceYear === selectedYearCE)?.thaiYear || selectedYearCE + 543;
      await generateSampleMonthData(
        selectedYearCE,
        thaiYear,
        selectedMonth,
        staffList.map((s) => s.name)
      );
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } catch (err) {
      console.error('Sample data gen error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Header Bar */}
      <Header
        selectedYearCE={selectedYearCE}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYearCE}
        onMonthChange={setSelectedMonth}
        currentStaff={currentStaff}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onGenerateSampleData={handleGenerateSampleData}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        isSyncing={isSyncing}
        expiryAlertCount={expiryAlerts.length}
        onOpenAlertDrawer={() => setIsAlertDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard_supplies' && (
          <DashboardSupplies
            selectedYearCE={selectedYearCE}
            selectedMonth={selectedMonth}
            medRecords={medRecords}
            cartRecords={cartRecords}
            boxRecords={boxRecords}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
          />
        )}

        {activeTab === 'dashboard_env' && (
          <DashboardEnvironment
            selectedYearCE={selectedYearCE}
            selectedMonth={selectedMonth}
            tempRecords={tempRecords}
            humidityRecords={humidityRecords}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
          />
        )}

        {activeTab === 'check_med' && (
          <DailyMedicationCheck
            selectedYearCE={selectedYearCE}
            selectedMonth={selectedMonth}
            currentStaff={currentStaff}
            records={medRecords}
            onToast={showToast}
          />
        )}

        {activeTab === 'check_cart' && (
          <EmergencyCartCheck
            selectedYearCE={selectedYearCE}
            selectedMonth={selectedMonth}
            currentStaff={currentStaff}
            records={cartRecords}
            onToast={showToast}
          />
        )}

        {activeTab === 'check_box' && (
          <EmergencyBoxCheck
            selectedYearCE={selectedYearCE}
            selectedMonth={selectedMonth}
            currentStaff={currentStaff}
            records={boxRecords}
            onToast={showToast}
          />
        )}

        {activeTab === 'check_temp' && (
          <FridgeTempCheck
            selectedYearCE={selectedYearCE}
            selectedMonth={selectedMonth}
            currentStaff={currentStaff}
            records={tempRecords}
            onToast={showToast}
          />
        )}

        {activeTab === 'check_hum' && (
          <HumidityCheck
            selectedYearCE={selectedYearCE}
            selectedMonth={selectedMonth}
            currentStaff={currentStaff}
            records={humidityRecords}
            onToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">ICU-DATA Hospital System</span>
            <span>— ระบบตรวจสอบยาและเวชภัณฑ์ หอผู้ป่วยหนัก ICU</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">พ.ศ. 2569 – 2580 (2026 - 2037)</span>
            <button
              onClick={() => setIsDbModalOpen(true)}
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer transition-colors"
            >
              <Database className="w-3 h-3" />
              <span>Firebase Firestore Connected</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Database Status & Health Modal */}
      <DbStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        medsCount={Object.keys(medRecords).length}
        cartCount={Object.keys(cartRecords).length}
        boxCount={Object.keys(boxRecords).length}
        tempCount={Object.keys(tempRecords).length}
        humCount={Object.keys(humidityRecords).length}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Staff / Recorder Management Modal */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        currentStaff={currentStaff}
        staffList={staffList}
        onSelectStaff={handleSelectStaff}
        onAddNewStaff={handleAddNewStaff}
      />

      {/* Printable Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        selectedYearCE={selectedYearCE}
        selectedMonth={selectedMonth}
        medRecords={medRecords}
        cartRecords={cartRecords}
        boxRecords={boxRecords}
        tempRecords={tempRecords}
        humidityRecords={humidityRecords}
      />

      {/* Expiry Alert Drawer */}
      <ExpiryAlertBanner
        alerts={expiryAlerts}
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        onNavigateToItem={(al) => {
          if (al.source === 'cart') setActiveTab('check_cart');
          else setActiveTab('check_box');
        }}
      />
    </div>
  );
}
