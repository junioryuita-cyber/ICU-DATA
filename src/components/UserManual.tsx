import React, { useState } from 'react';
import {
  BookOpen,
  UserCheck,
  Pill,
  Truck,
  Box,
  Thermometer,
  Droplets,
  BarChart3,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Database,
  HelpCircle,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';

interface UserManualProps {
  onSelectTab: (tabId: string) => void;
  onOpenPrintModal?: () => void;
}

export const UserManual: React.FC<UserManualProps> = ({
  onSelectTab,
  onOpenPrintModal,
}) => {
  const [activeSection, setActiveSection] = useState<string>('all');

  const sections = [
    { id: 'start', title: '1. เริ่มต้นใช้งาน & ระบุชื่อ', icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'med', title: '2. ตรวจนับสต็อกยา (29 รายการ)', icon: Pill, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'cart', title: '3. รถ Emergency & Box', icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'temp', title: '4. ตู้เย็นยา & ความชื้นสัมพัทธ์', icon: Thermometer, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'dashboard', title: '5. แดชบอร์ด & วิเคราะห์ผล', icon: BarChart3, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'print', title: '6. พิมพ์รายงานประจำเดือน', icon: Printer, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'faq', title: '7. ปัญหาที่พบบ่อย (FAQ)', icon: HelpCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs tracking-wider uppercase">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>คู่มือการใช้งานระบบอย่างเป็นทางการ (Official Standard Operating Procedure)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              คู่มือการบันทึกข้อมูลระบบ ICU-DATA
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              สรุปขั้นตอนการเข้าใช้งาน การตรวจเช็คสต็อกยาและเวชภัณฑ์ฉุกเฉิน การควบคุมอุณหภูมิตู้เย็นยา การตรวจความชื้นสัมพัทธ์ ตลอดจนการเรียกดูแดชบอร์ดและพิมพ์รายงานราชการประจำเดือน
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-full text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> มาตรฐาน HA / JCI
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/40 text-blue-300 rounded-full text-xs font-medium">
                <Database className="w-3.5 h-3.5" /> ซิงค์ Cloud Firestore อัตโนมัติ
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 rounded-full text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> รองรับการทำงาน Offline
              </span>
            </div>
          </div>

          {/* Quick Stats or Actions */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-2 shrink-0">
            <div className="text-xs text-slate-300 font-medium">งานตรวจสอบหลัก 5 หมวด:</div>
            <div className="text-xs font-semibold text-white space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <span>✓</span> ยาและเวชภัณฑ์ 29 รายการ (เวรเช้า)
              </div>
              <div className="flex items-center gap-1.5 text-blue-300">
                <span>✓</span> รถ Emergency Cart 45 รายการ (3 เวร)
              </div>
              <div className="flex items-center gap-1.5 text-indigo-300">
                <span>✓</span> กล่อง Emergency Box 26 รายการ (เวรดึก)
              </div>
              <div className="flex items-center gap-1.5 text-sky-300">
                <span>✓</span> ตู้เย็นยา 2.0 - 8.0 °C (3 รอบเวลา)
              </div>
              <div className="flex items-center gap-1.5 text-rose-300">
                <span>✓</span> ความชื้นสัมพัทธ์ 40 - 75 %RH (3 รอบเวลา)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          ทั้งหมด (ทุกหมวดหมู่)
        </button>
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isAct = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isAct
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.title}</span>
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="space-y-6">

        {/* 1. เริ่มต้นเข้าใช้งาน & การระบุชื่อผู้บันทึก */}
        {(activeSection === 'all' || activeSection === 'start') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    การเริ่มต้นเข้าใช้งาน & การระบุชื่อผู้บันทึก (Login & Staff Selection)
                  </h2>
                  <p className="text-xs text-slate-500">
                    ขั้นตอนแรกก่อนเริ่มการบันทึกข้อมูลในแต่ละเวร
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-blue-200">
                สำคัญมาก
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>1. เลือกปี พ.ศ. และเดือน</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ตรวจสอบแถบเมนูด้านบน เลือกรอบเดือนและปี พ.ศ. ที่กำลังปฏิบัติงานให้ถูกต้อง โดยระบบรองรับ พ.ศ. 2569 ถึง 2580
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                  <span>2. ระบุชื่อพยาบาลผู้บันทึก</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  คลิกที่กล่อง <strong>"ผู้บันทึกเวร"</strong> มุมขวาบน เพื่อเลือกรายชื่อพยาบาล หรือคลิก <strong>"+ เพิ่มเจ้าหน้าที่ใหม่"</strong> เพื่อใส่ชื่อ-สกุล และตำแหน่ง
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>3. ตรวจสอบสถานะ Cloud Firestore</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  สังเกตสัญลักษณ์ <strong>จุดสีเขียวกะพริบ</strong> แสดงว่าระบบเชื่อมต่อฐานข้อมูล Cloud เรียบร้อย ข้อมูลจะถูกซิงค์แบบเรียลไทม์
                </p>
              </div>
            </div>

            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>คำแนะนำ:</strong> เมื่อเลือกชื่อพยาบาลแล้ว ระบบจะจำชื่อไว้ในเครื่องโดยอัตโนมัติ ทำให้เวลาไปกรอกฟอร์มในแต่ละหน้า ไม่ต้องพิมพ์ชื่อซ้ำ
              </div>
            </div>
          </div>
        )}

        {/* 2. ตรวจสอบยาและเวชภัณฑ์ประจำวัน (29 รายการ) */}
        {(activeSection === 'all' || activeSection === 'med') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    หมวดที่ 1: การตรวจนับสต็อกยาและเวชภัณฑ์ประจำวัน (29 รายการ)
                  </h2>
                  <p className="text-xs text-slate-500">
                    รอบเวลา: <strong>เวรเช้า (เวลา 08.30 - 16.30 น.)</strong> | ตรวจเช็คยอดคงคลังและวันหมดอายุ
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectTab('check_med')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>เปิดหน้าบันทึกยานี้</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ขั้นตอนการบันทึก</span>
                </h3>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                  <li>เลือกวันที่ต้องการบันทึกข้อมูล (กดลูกศรเลื่อนวัน หรือเลือกวันปัจจุบัน)</li>
                  <li>ตรวจนับจำนวนยาและเวชภัณฑ์แต่ละรายการเทียบกับ <strong>ยอดมาตรฐาน (Target Stock)</strong></li>
                  <li>กรอก <strong>จำนวนคงเหลือจริง</strong> ในช่องตัวเลข หากยอดครบถ้วนจะแสดงสถานะสีเขียว</li>
                  <li>กรอก <strong>วันหมดอายุ (Expiry Date)</strong> ของยาล็อตที่ใกล้หมดอายุที่สุด</li>
                  <li>ตรวจสอบชื่อผู้บันทึก และคลิกปุ่ม <strong>"บันทึกข้อมูลยาประจำวัน"</strong></li>
                </ol>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-2.5 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>ระบบแจ้งเตือนยาใกล้หมดอายุ 3 เดือน (Expiry Alert):</span>
                </div>
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                    <span><strong>แถบสีเหลือง (Warning 3 Months):</strong> ยาที่จะหมดอายุภายใน 90 วัน ให้เตรียมส่งแลกเปลี่ยนกับห้องยา (Stock Rotation)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                    <span><strong>แถบสีแดง (Expired):</strong> ยาที่หมดอายุแล้ว ห้ามนำไปใช้กับผู้ป่วย ให้แยกออกจากตู้ทันที</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. รถ Emergency Cart และ Emergency Box */}
        {(activeSection === 'all' || activeSection === 'cart') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    หมวดที่ 2: การตรวจสอบรถ Emergency Cart & กล่อง Emergency Box
                  </h2>
                  <p className="text-xs text-slate-500">
                    ตรวจเช็คอุปกรณ์ช่วยฟื้นคืนชีพ ยาฉุกเฉิน และซีลล็อคตามมาตรฐานห้อง ICU
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => onSelectTab('check_cart')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>รถ Cart</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onSelectTab('check_box')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>กล่อง Box</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>รถ Emergency Cart (45 รายการ)</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-800 font-semibold rounded-full">
                    ตรวจครบ 3 เวร
                  </span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li><strong>รอบเวร:</strong> เช้า (08.00-16.00), บ่าย (16.00-24.00), ดึก (24.00-08.00)</li>
                  <li><strong>เลขซีลล็อค (Lock Seal No.):</strong> ตรวจสอบหมายเลขซีลพลาสติกล็อครถว่าอยู่ในสภาพสมบูรณ์ ไม่มีการถูกเปิดใช้โดยมิได้รับอนุญาต</li>
                  <li><strong>ชั้นที่ 1:</strong> ยาฉุกเฉินช่วยชีวิต (Adrenaline, Atropine, Cordarone ฯลฯ)</li>
                  <li><strong>ชั้นที่ 2:</strong> อุปกรณ์ทางเดินหายใจ (ET-Tube, Laryngoscope Blade, Suction)</li>
                  <li><strong>ชั้นที่ 3:</strong> สารน้ำ & ชุดให้สารน้ำ (NSS, D5W, IV Catheter)</li>
                  <li><strong>ชั้นที่ 4 & อุปกรณ์รอบรถ:</strong> แอมบูแบ็ก (Ambu Bag), ถังออกซิเจนฉุกเฉิน และเครื่อง Defibrillator</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-indigo-600" />
                    <span>กล่อง Emergency Box (26 รายการ)</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-800 font-semibold rounded-full">
                    ตรวจเวรดึก (Night)
                  </span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li><strong>รอบเวร:</strong> ตรวจเช็คความสมบูรณ์ประจำ <strong>เวรดึก</strong> ทุกวัน</li>
                  <li><strong>เลขซีลล็อคกล่อง:</strong> ตรวจสอบซีลล็อคกล่องฉุกเฉิน และบันทึกหมายเลขประจำวัน</li>
                  <li><strong>รายการยาและเวชภัณฑ์:</strong> ตรวจนับจำนวนยาฉุกเฉิน 26 รายการให้ครบถ้วนพร้อมใช้งานตลอด 24 ชั่วโมง</li>
                  <li><strong>วันหมดอายุสำลี 5 ก้อน:</strong> ตรวจเช็ควันหมดอายุของสำลีปลอดเชื้อและยาที่ต้องระวังวันหมดอายุ</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 4. ตู้เย็นยา & ความชื้นสัมพัทธ์ */}
        {(activeSection === 'all' || activeSection === 'temp') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    หมวดที่ 3: การบันทึกอุณหภูมิตู้เย็นยา (2-8°C) และความชื้นสัมพัทธ์ (40-75%RH)
                  </h2>
                  <p className="text-xs text-slate-500">
                    การควบคุมสภาวะแวดล้อมเพื่อรักษาคุณภาพวัคซีน ยาชีววัตถุ และการป้องกันการติดเชื้อ
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => onSelectTab('check_temp')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>ตู้เย็น 2-8°C</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onSelectTab('check_hum')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>ความชื้น RH%</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ตู้เย็นยา */}
              <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-blue-600" />
                    <span>การบันทึกอุณหภูมิตู้เย็นยา (2.0 - 8.0 °C)</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded-full">
                    3 รอบเวลา
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                  <div><strong>รอบเวลาที่บันทึก:</strong></div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-semibold">
                    <div className="bg-white p-1.5 rounded-lg border border-blue-200">1. เช้า (14.00 น.)</div>
                    <div className="bg-white p-1.5 rounded-lg border border-blue-200">2. บ่าย (22.00 น.)</div>
                    <div className="bg-white p-1.5 rounded-lg border border-blue-200">3. ดึก (06.00 น.)</div>
                  </div>
                  <p className="pt-1">
                    • <strong>การอ่านค่า:</strong> อ่านจากเทอร์โมมิเตอร์ดิจิทัล กรอกทศนิยม 1 ตำแหน่ง (เช่น 4.2)<br />
                    • <strong>กราฟเส้นสีน้ำเงิน:</strong> ระบบจะจุดและลากเส้นกราฟให้อัตโนมัติ โดยมีแถบสีเขียวอ่อน 2 - 8 °C เป็นกรอบอ้างอิง<br />
                    • <strong>กรณีผิดปกติ:</strong> หากอุณหภูมิ &lt; 2.0 °C หรือ &gt; 8.0 °C จะขึ้นตัวเลขสีแดง ให้ตรวจสอบการปิดประตูตู้เย็นและแจ้งซ่อมบำรุงทันที
                  </p>
                </div>
              </div>

              {/* ความชื้นสัมพัทธ์ */}
              <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-rose-600" />
                    <span>การบันทึกความชื้นสัมพัทธ์ (40 - 75 %RH)</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-rose-100 text-rose-800 font-semibold rounded-full">
                    3 รอบเวลา
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                  <div><strong>รอบเวลาที่บันทึก:</strong></div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-semibold">
                    <div className="bg-white p-1.5 rounded-lg border border-rose-200">1. เช้า (14.00 น.)</div>
                    <div className="bg-white p-1.5 rounded-lg border border-rose-200">2. บ่าย (22.00 น.)</div>
                    <div className="bg-white p-1.5 rounded-lg border border-rose-200">3. ดึก (06.00 น.)</div>
                  </div>
                  <p className="pt-1">
                    • <strong>การอ่านค่า:</strong> อ่านจากเครื่อง Hygrometer ประจำหอผู้ป่วย<br />
                    • <strong>กราฟเส้นสีแดง/ชมพู:</strong> ระบบจะพลอตเส้นกราฟรายเดือน พร้อมแสดงเปอร์เซ็นต์ความชื้นในห้อง<br />
                    • <strong>เกณฑ์มาตรฐาน:</strong> 40 - 75 %RH หากสูงหรือต่ำเกินไปจะเพิ่มความเสี่ยงต่อการเจริญเติบโตของเชื้อโรคและการเกิดไฟฟ้าสถิต
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. แดชบอร์ด & วิเคราะห์ผล */}
        {(activeSection === 'all' || activeSection === 'dashboard') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    หมวดที่ 4: การเรียกดูแดชบอร์ดสรุปภาพรวมและการวิเคราะห์ (Dashboards)
                  </h2>
                  <p className="text-xs text-slate-500">
                    ติดตามสถานะความครบถ้วน แนวโน้มสถิติ และการส่งออกข้อมูล Excel (CSV)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => onSelectTab('dashboard_supplies')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>แดชบอร์ด 1: ยา</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onSelectTab('dashboard_env')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>แดชบอร์ด 2: สิ่งแวดล้อม</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 text-blue-800">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>แดชบอร์ดที่ 1: สรุปยาและเวชภัณฑ์</span>
                </div>
                <p className="leading-relaxed">
                  • <strong>การสรุปสต็อก:</strong> แสดงจำนวนรายการยาที่สต็อกครบถ้วน และรายการที่ถูกเบิกใช้<br />
                  • <strong>ความพร้อมใช้ของรถ Emergency:</strong> อัตรา % ความสมบูรณ์ของซีลล็อคและการตรวจครบทุกเวร<br />
                  • <strong>แจ้งเตือนวันหมดอายุ:</strong> รายการยาที่ใกล้หมดอายุใน 3 เดือน เพื่อเตรียมส่งคืนหรือหมุนเวียนคลัง
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 text-indigo-800">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>แดชบอร์ดที่ 2: สรุปอุณหภูมิและความชื้นสัมพัทธ์</span>
                </div>
                <p className="leading-relaxed">
                  • <strong>กราฟวิเคราะห์แนวโน้ม:</strong> เปรียบเทียบอุณหภูมิและความชื้นทั้ง 31 วันในเดือน<br />
                  • <strong>อัตรา Compliance Rate:</strong> ร้อยละของจำนวนครั้งที่ค่าอยู่ในเกณฑ์มาตรฐาน<br />
                  • <strong>ปุ่ม "ส่งออกไฟล์ CSV":</strong> สามารถกดดาวน์โหลดไฟล์ข้อมูลรายวันไปเปิดใช้งานในโปรแกรม Microsoft Excel ได้ทันที
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. พิมพ์รายงานประจำเดือน */}
        {(activeSection === 'all' || activeSection === 'print') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  6
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    หมวดที่ 5: การพิมพ์รายงานราชการประจำเดือน (Print & Export PDF)
                  </h2>
                  <p className="text-xs text-slate-500">
                    การจัดพิมพ์เอกสารรายงาน 31 วันตามรูปแบบมาตรฐานโรงพยาบาล พร้อมช่องลงนาม
                  </p>
                </div>
              </div>
              {onOpenPrintModal && (
                <button
                  onClick={onOpenPrintModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>เปิดหน้าต่างพิมพ์รายงาน</span>
                </button>
              )}
            </div>

            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 space-y-3 text-xs text-purple-950">
              <div className="font-bold text-sm text-purple-900">ขั้นตอนการพิมพ์รายงานประจำเดือน:</div>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-slate-700">
                <li>คลิกที่ไอคอน <strong>"เครื่องพิมพ์ (Printer)"</strong> ที่มุมขวาบนของหน้าจอ</li>
                <li>ระบบจะประมวลผลข้อมูลทั้งเดือนออกมาเป็นตาราง 31 วัน แบ่งตามหมวดหมู่:
                  <ul className="list-disc list-inside pl-4 text-slate-600 pt-1">
                    <li>รายงานอุณหภูมิตู้เย็นยา (14.00, 22.00, 06.00 น.)</li>
                    <li>รายงานความชื้นสัมพัทธ์ (14.00, 22.00, 06.00 น.)</li>
                    <li>สถานะการตรวจเช็ครถ Emergency Cart และ Emergency Box</li>
                  </ul>
                </li>
                <li>ด้านล่างเอกสารมีช่องลงลายมือชื่อสำหรับ <strong>พยาบาลผู้ตรวจการประจำวัน</strong> และ <strong>หัวหน้าหอผู้ป่วย (Head Nurse)</strong></li>
                <li>คลิกปุ่ม <strong>"พิมพ์เอกสาร / บันทึกเป็น PDF"</strong> ในหน้าต่างป๊อปอัปเพื่อสั่งพิมพ์หรือเก็บเป็นหลักฐานการประเมินคุณภาพ</li>
              </ol>
            </div>
          </div>
        )}

        {/* 7. ปัญหาที่พบบ่อย (FAQ) */}
        {(activeSection === 'all' || activeSection === 'faq') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                7
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  คำถามและข้อสงสัยที่พบบ่อย (FAQ & Troubleshooting)
                </h2>
                <p className="text-xs text-slate-500">
                  แนวทางการแก้ปัญหาเมื่อเกิดเหตุขัดข้องในการปฏิบัติงาน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-blue-700">
                  <HelpCircle className="w-4 h-4" />
                  <span>Q: หากอินเทอร์เน็ตหลุด จะบันทึกข้อมูลได้หรือไม่?</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>A: บันทึกได้ตามปกติ</strong> ระบบมีเทคโนโลยี Local Cache ข้อมูลจะถูกบันทึกลงในหน่วยความจำของอุปกรณ์ทันที และเมื่ออุปกรณ์เชื่อมต่ออินเทอร์เน็ตได้ ระบบจะทำการอัปโหลด (Auto Sync) ขึ้น Cloud Firestore ให้โดยอัตโนมัติ
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-blue-700">
                  <HelpCircle className="w-4 h-4" />
                  <span>Q: สามารถแก้ไขข้อมูลย้อนหลังได้หรือไม่?</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>A: แก้ไขได้ตลอดเวลา</strong> เพียงเลือกวันที่ที่ต้องการแก้ไข กรอกข้อมูลที่ถูกต้องลงไป แล้วกดปุ่ม <strong>"บันทึก"</strong> อีกครั้ง ระบบจะอัปเดตข้อมูลทับของเดิมพร้อมประทับเวลาแก้ไขล่าสุด
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-rose-700">
                  <HelpCircle className="w-4 h-4" />
                  <span>Q: หากอุณหภูมิตู้เย็นยาหลุดเกณฑ์ 2-8°C ต้องทำอย่างไร?</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>A:</strong> 1. บันทึกค่าจริงที่วัดได้ลงระบบ 2. ตรวจสอบการปิดสนิทของประตูตู้เย็นและปลั๊กไฟ 3. หากอุณหภูมิยังไม่ลดลงภายใน 2 ชม. ให้ย้ายวัคซีน/ยาชีววัตถุไปยังตู้เย็นสำรองและแจ้งหัวหน้าเวร/ช่างทันที
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-emerald-700">
                  <HelpCircle className="w-4 h-4" />
                  <span>Q: ปุ่ม "จำลองข้อมูล" มีไว้ทำอะไร?</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>A: สำหรับทดสอบระบบ</strong> ปุ่มนี้จะสร้างข้อมูลตัวอย่างของเดือนนั้นๆ ทั้ง 31 วัน เพื่อให้พยาบาลหรือผู้ตรวจประเมินได้เห็นตัวอย่างกราฟและรายงานสรุปที่สมบูรณ์ โดยสามารถกดล้างหรือเขียนทับได้
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
