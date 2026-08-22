import React from 'react';
import { ExpiryAlertInfo, THAI_MONTHS, ICU_SHIFTS } from '../types/icu';
import { AlertTriangle, X, Calendar, PackageCheck, AlertCircle } from 'lucide-react';

interface ExpiryAlertBannerProps {
  alerts: ExpiryAlertInfo[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToItem: (alert: ExpiryAlertInfo) => void;
}

export const ExpiryAlertBanner: React.FC<ExpiryAlertBannerProps> = ({
  alerts,
  isOpen,
  onClose,
  onNavigateToItem,
}) => {
  if (!isOpen || alerts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-100" />
            <h3 className="font-bold text-base">
              รายการแจ้งเตือนวันหมดอายุ (&le; 3 เดือน หรือหมดอายุแล้ว)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-slate-600">
            ระบบตรวจพบรายการ <strong>สำลี 5 ก้อน</strong> ที่มีกำหนดวันหมดอายุภายใน 90 วัน (3 เดือน) หรือเกินกำหนด กรุณาประสานงานเบิกเปลี่ยนห่อใหม่:
          </p>

          <div className="space-y-3">
            {alerts.map((al) => {
              const monthName = THAI_MONTHS.find((m) => m.value === al.month)?.name || '';
              const shiftLabel = al.shift ? ICU_SHIFTS[al.shift].nameThai : 'เวรดึก';

              return (
                <div
                  key={al.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    al.status === 'expired'
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <PackageCheck className="w-4 h-4" />
                      <span>{al.itemName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-white/70">
                        {al.source === 'cart' ? 'รถ Emergency' : 'Emergency Box'}
                      </span>
                    </div>

                    <div className="text-xs opacity-90 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        บันทึกวันที่ {al.day} {monthName} พ.ศ. {al.yearThai} ({shiftLabel})
                      </span>
                    </div>

                    <div className="text-xs font-semibold">
                      วันหมดอายุ: <span className="underline">{al.expiryDate}</span>{' '}
                      {al.status === 'expired' ? (
                        <span className="text-rose-700 font-bold">(หมดอายุแล้ว {Math.abs(al.daysRemaining)} วัน)</span>
                      ) : (
                        <span className="text-amber-800 font-bold">(เหลืออีก {al.daysRemaining} วัน)</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onNavigateToItem(al);
                      onClose();
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto ${
                      al.status === 'expired'
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`}
                  >
                    ไปที่รายการนี้
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
          >
            ปิดหน้าต่างแจ้งเตือน
          </button>
        </div>
      </div>
    </div>
  );
};
