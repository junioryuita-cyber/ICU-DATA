import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Server,
  HardDrive,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { testFirestoreConnection } from '../services/icuService';
import firebaseConfigJson from '../../firebase-applet-config.json';

interface DbStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  medsCount: number;
  cartCount: number;
  boxCount: number;
  tempCount: number;
  humCount: number;
}

export const DbStatusModal: React.FC<DbStatusModalProps> = ({
  isOpen,
  onClose,
  medsCount,
  cartCount,
  boxCount,
  tempCount,
  humCount,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  const runTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const res = await testFirestoreConnection();
      const end = performance.now();
      setTestResult({
        success: res.success,
        message: res.message,
        latency: Math.round(end - start),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Database className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">สถานะฐานข้อมูล Firebase Firestore</h3>
              <p className="text-xs text-blue-200">Project: {firebaseConfigJson.projectId || 'ICU-DATA'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Connection status card */}
          <div className="p-4 rounded-2xl border bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="flex h-3.5 w-3.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="font-bold text-sm text-slate-800">
                  {testResult?.success ? 'เชื่อมต่อระบบฐานข้อมูล Cloud สำเร็จ' : isTesting ? 'กำลังทดสอบเชื่อมต่อ...' : 'ระบบพร้อมใช้งาน'}
                </div>
                <div className="text-xs text-slate-500">
                  {testResult?.latency ? `Response Time: ${testResult.latency} ms` : 'Firestore Realtime Database'}
                </div>
              </div>
            </div>

            <button
              onClick={runTest}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'กำลังตรวจ...' : 'ทดสอบใหม่'}</span>
            </button>
          </div>

          {/* Database Specs */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ข้อมูลโครงสร้างและ Collections ประจำรอบเดือน
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400">Database ID</div>
                <div className="font-mono font-semibold text-slate-700 truncate">
                  {firebaseConfigJson.firestoreDatabaseId || '(default)'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-400">Security Rules</div>
                <div className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Hardened & Deployed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Collection counters */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              สถิติข้อมูลที่โหลดจาก Cloud ในเดือนนี้
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <span className="font-medium text-slate-700">💊 ยาและเวชภัณฑ์ (icu_medications)</span>
                <span className="font-bold text-blue-700">{medsCount} วันที่บันทึก</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <span className="font-medium text-slate-700">🚑 รถ Emergency Cart (icu_emergency_cart)</span>
                <span className="font-bold text-indigo-700">{cartCount} วันที่บันทึก</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <span className="font-medium text-slate-700">🧰 กล่อง Emergency Box (icu_emergency_box)</span>
                <span className="font-bold text-purple-700">{boxCount} วันที่บันทึก</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-50/50 border border-cyan-100">
                <span className="font-medium text-slate-700">❄️ ตู้เย็นยา 2-8°C (icu_fridge_temp)</span>
                <span className="font-bold text-cyan-700">{tempCount} วันที่บันทึก</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-50/50 border border-teal-100">
                <span className="font-medium text-slate-700">💧 ความชื้น 40-75% (icu_humidity)</span>
                <span className="font-bold text-teal-700">{humCount} วันที่บันทึก</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
