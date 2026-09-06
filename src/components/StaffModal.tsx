import React, { useState, useEffect } from 'react';
import { StaffRecorder } from '../types/icu';
import { UserCheck, UserPlus, X, Check, Trash2, AlertCircle } from 'lucide-react';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: StaffRecorder;
  staffList: StaffRecorder[];
  onSelectStaff: (staff: StaffRecorder) => void;
  onAddNewStaff: (name: string, role: string) => Promise<void>;
  onDeleteStaff?: (staffId: string) => Promise<void>;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  currentStaff,
  staffList,
  onSelectStaff,
  onAddNewStaff,
  onDeleteStaff,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('พยาบาลวิชาชีพ (ICU Nurse)');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && staffList.length === 0) {
      setIsAddingNew(true);
    }
  }, [isOpen, staffList.length]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await onAddNewStaff(newName.trim(), newRole);
      setNewName('');
      setIsAddingNew(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, staffId: string) => {
    e.stopPropagation();
    if (!onDeleteStaff) return;
    if (window.confirm('คุณต้องการลบรายชื่อผู้บันทึกนี้ออกจากระบบหรือไม่?')) {
      setDeletingId(staffId);
      try {
        await onDeleteStaff(staffId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-lg">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">ระบุชื่อ-นามสกุล พยาบาลผู้บันทึก</h3>
              <p className="text-xs text-blue-100">ระบบจะประทับชื่อนี้ลงในรายการบันทึกเวร ICU ทุกรายการ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Active Staff */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">ผู้บันทึกปัจจุบัน</span>
              {currentStaff.name ? (
                <>
                  <p className="text-base font-bold text-slate-800">{currentStaff.name}</p>
                  <p className="text-xs text-slate-500">{currentStaff.role}</p>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-700 text-sm font-semibold mt-0.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>ยังไม่ได้ระบุชื่อผู้บันทึก</span>
                </div>
              )}
            </div>
            {currentStaff.name ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                <Check className="w-3.5 h-3.5" /> ใช้งานอยู่
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-300">
                รอกำหนดชื่อ
              </span>
            )}
          </div>

          {/* List of Known Staff */}
          {!isAddingNew ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">เลือกจากรายชื่อบุคลากร ICU:</label>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + เพิ่มผู้บันทึกใหม่
                </button>
              </div>

              {staffList.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                  <p className="text-sm font-medium text-slate-600">ยังไม่มีรายชื่อผู้บันทึกในระบบ</p>
                  <p className="text-xs text-slate-400">กรุณาเพิ่มชื่อ-นามสกุลพยาบาลเพื่อเริ่มต้นใช้งานจริง</p>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> เพิ่มชื่อผู้บันทึกเดี๋ยวนี้
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {staffList.map((st) => {
                    const isSelected = currentStaff.id === st.id || currentStaff.name === st.name;
                    return (
                      <div
                        key={st.id}
                        onClick={() => {
                          onSelectStaff(st);
                          onClose();
                        }}
                        className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{st.name}</div>
                          <div className="text-xs text-slate-500">{st.role}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                          {onDeleteStaff && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, st.id)}
                              disabled={deletingId === st.id}
                              title="ลบรายชื่อนี้"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 border border-blue-200 rounded-xl p-4 bg-blue-50/40">
              <div className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-blue-600" /> กรอกข้อมูลผู้บันทึกท่านใหม่ (เพื่อใช้งานจริง)
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อ - นามสกุล (พร้อมคำนำหน้า เช่น พว., นพ., ภก.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น พว. วิภาดา เจริญพร"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ตำแหน่ง / หน้าที่</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="พยาบาลวิชาชีพ (ICU Nurse)">พยาบาลวิชาชีพ (ICU Nurse)</option>
                  <option value="พยาบาลวิชาชีพชำนาญการ (ICU หัวหน้าเวร)">พยาบาลวิชาชีพชำนาญการ (ICU หัวหน้าเวร)</option>
                  <option value="พยาบาลวิชาชีพปฏิบัติการ">พยาบาลวิชาชีพปฏิบัติการ</option>
                  <option value="พยาบาลหัวหน้าหอผู้ป่วย (In-Charge)">พยาบาลหัวหน้าหอผู้ป่วย (In-Charge)</option>
                  <option value="เจ้าหน้าที่ผู้ช่วยพยาบาล (PN)">เจ้าหน้าที่ผู้ช่วยพยาบาล (PN)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {staffList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกและเลือกใช้'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex justify-between items-center">
          <span className="text-xs text-slate-400">บันทึกลงระบบคลังรายชื่อ ICU อัตโนมัติ</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
