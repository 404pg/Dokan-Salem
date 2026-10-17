import React, { useState } from 'react';
import { FlutterAppModule } from '../../types/adminTypes';

export const FLUTTER_APPS: FlutterAppModule[] = [
  {
    id: 'customer-app',
    name: 'تطبيق زبائن دكان سليم (Customer Storefront)',
    packageName: 'iq.dokansaleem.customer',
    version: 'v2.8.4',
    buildNumber: 142,
    flutterVersion: 'Flutter 3.24.3 (Channel stable, Dart 3.5.3)',
    targetPlatform: 'Android (APK/AAB) & iOS (IPA)',
    activeUsersBaghdad: 4820,
    crashFreeRate: '99.8%',
    status: 'production',
    description: 'التطبيق الرسمي للمشترين وأصحاب الدراجات النارية في بغداد والمحافظات.',
    lastRelease: 'منذ يومين (Google Play & TestFlight)',
  },
  {
    id: 'mechanic-app',
    name: 'تطبيق الفيتر المعتمد (Mechanic Companion)',
    packageName: 'iq.dokansaleem.mechanic',
    version: 'v2.1.0',
    buildNumber: 68,
    flutterVersion: 'Flutter 3.24.3 (Dart 3.5.3)',
    targetPlatform: 'Android Rugged Devices & iOS',
    activeUsersBaghdad: 18,
    crashFreeRate: '100%',
    status: 'production',
    description: 'تطبيق خاص بفيترية الورشات والفيتر الجوال لتلقي إشعارات الطوارئ، فحص الأكواد، ومسح قطع الغيار.',
    lastRelease: 'منذ 5 أيام',
  },
  {
    id: 'courier-app',
    name: 'تطبيق كابتن التوصيل (Courier Delivery & COD)',
    packageName: 'iq.dokansaleem.courier',
    version: 'v1.9.2',
    buildNumber: 45,
    flutterVersion: 'Flutter 3.24.3 (Dart 3.5.3)',
    targetPlatform: 'Android & iOS',
    activeUsersBaghdad: 24,
    crashFreeRate: '99.4%',
    status: 'production',
    description: 'تطبيق لمناديب التوصيل في بغداد لحساب المبالغ نقدًا عند الاستلام وإثبات التسليم للزبون.',
    lastRelease: 'منذ أسبوع',
  },
];

export const FlutterEcosystemTab: React.FC = () => {
  const [apps, setApps] = useState<FlutterAppModule[]>(FLUTTER_APPS);
  const [selectedApp, setSelectedApp] = useState<FlutterAppModule>(FLUTTER_APPS[0]);
  const [fcmTitle, setFcmTitle] = useState('عرض خاص: سفايف بريمبو أصلية متوفرة الآن في فرع الدورة!');
  const [fcmBody, setFcmBody] = useState('احصل على خصم 16% وشحن فوري داخل بغداد قبل نفاد الكمية.');
  const [fcmTopic, setFcmTopic] = useState('all_baghdad_riders');
  const [isSendingFcm, setIsSendingFcm] = useState(false);
  const [fcmSuccess, setFcmSuccess] = useState(false);

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingFcm(true);
    setFcmSuccess(false);
    setTimeout(() => {
      setIsSendingFcm(false);
      setFcmSuccess(true);
      setTimeout(() => setFcmSuccess(false), 3500);
    }, 700);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-[#0d0a0b] border border-[#332f30] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-[#02569B] text-white flex items-center justify-center font-bold font-mono">
              ⚡
            </span>
            <h2 className="text-[1.5rem] font-bold text-white tracking-tight">
              منظومة تطبيقات فلاتر (Flutter Mobile Ecosystem)
            </h2>
            <span className="text-[12px] bg-[#02569B]/30 text-[#40C4FF] px-2.5 py-0.5 rounded font-mono font-bold border border-[#02569B]">
              Flutter 3.24.3
            </span>
          </div>
          <p className="text-[0.875rem] text-[#c3c6d5] leading-relaxed">
            إدارة ومتابعة تطبيقات الهواتف المحمولة الثلاثة المبنية بتقنية Flutter لزبائن دكان سليم، الفيترية، ومناديب التوصيل في بغداد.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-[#2c690b]/20 text-[#aff589] font-mono text-[12px] font-bold border border-[#2c690b]">
            ● CI/CD Pipelines Healthy
          </span>
        </div>
      </div>

      {/* 3 Flutter Apps Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {apps.map((app) => {
          const isSelected = selectedApp.id === app.id;
          return (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`p-5 rounded-2xl bg-[#0d0a0b] border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-[#02569B] shadow-[0_0_20px_rgba(2,86,155,0.25)] ring-1 ring-[#02569B]'
                  : 'border-[#332f30] hover:border-[#574337]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#02569B]/20 text-[#40C4FF] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[24px]">phone_android</span>
                  </div>
                  <span className="text-[11px] bg-[#2c690b]/20 text-[#aff589] font-bold px-2 py-0.5 rounded-full font-mono">
                    {app.version} ({app.buildNumber})
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-[1rem]">{app.name}</h3>
                  <span className="text-[11px] font-mono text-[#ffb68b]">{app.packageName}</span>
                </div>

                <p className="text-[0.8125rem] text-[#c3c6d5] leading-relaxed line-clamp-2">
                  {app.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#332f30] flex items-center justify-between text-[0.75rem] text-[#c3c6d5]">
                <span>المستخدمين النشطين: <strong className="text-white font-mono">{app.activeUsersBaghdad}</strong></span>
                <span className="text-[#aff589] font-bold font-mono">استقرار {app.crashFreeRate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected App Deep Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Build & Release Details */}
        <div className="lg:col-span-2 bg-[#0d0a0b] border border-[#332f30] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#332f30] pb-3">
            <h3 className="font-bold text-white text-[1.125rem] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#40C4FF]">verified</span>
              <span>تفاصيل وحزم إصدار: {selectedApp.name}</span>
            </h3>
            <span className="text-[12px] bg-[#332f30] text-[#c3c6d5] px-2.5 py-1 rounded font-mono">
              {selectedApp.targetPlatform}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#1e1b1c] p-3 rounded-xl border border-[#332f30]">
              <span className="text-[11px] text-[#c3c6d5] block">إصدار فلاتر و Dart:</span>
              <span className="text-[12px] font-mono font-bold text-white">{selectedApp.flutterVersion}</span>
            </div>
            <div className="bg-[#1e1b1c] p-3 rounded-xl border border-[#332f30]">
              <span className="text-[11px] text-[#c3c6d5] block">معدل خلو الجلسات من الانهيار:</span>
              <span className="text-[14px] font-mono font-bold text-[#aff589]">{selectedApp.crashFreeRate}</span>
            </div>
            <div className="bg-[#1e1b1c] p-3 rounded-xl border border-[#332f30]">
              <span className="text-[11px] text-[#c3c6d5] block">آخر نشر للإنتاج:</span>
              <span className="text-[12px] font-medium text-white">{selectedApp.lastRelease}</span>
            </div>
          </div>

          {/* Flutter Architecture Stack */}
          <div className="p-4 bg-[#121013] rounded-xl border border-[#332f30] space-y-2">
            <h4 className="font-bold text-white text-[0.875rem]">المكتبات الأساسية (Core Dependencies in pubspec.yaml):</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <span className="bg-[#1e1b1c] p-2 rounded text-[#ffb68b]">flutter_bloc: ^8.1.3</span>
              <span className="bg-[#1e1b1c] p-2 rounded text-[#ffb68b]">dio: ^5.4.0</span>
              <span className="bg-[#1e1b1c] p-2 rounded text-[#ffb68b]">google_maps_flutter</span>
              <span className="bg-[#1e1b1c] p-2 rounded text-[#ffb68b]">firebase_messaging</span>
              <span className="bg-[#1e1b1c] p-2 rounded text-[#ffb68b]">qr_code_scanner</span>
              <span className="bg-[#1e1b1c] p-2 rounded text-[#ffb68b]">intl (العراق د.ع)</span>
              <span className="bg-[#1e1b1c] p-2 rounded text-[#ffb68b]">hive_flutter: ^1.1.0</span>
              <span className="bg-[#1e1b1c] p-2 rounded text-[#ffb68b]">geolocator: ^10.1.0</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => alert(`جاري تنزيل ملف APK التجريبي: ${selectedApp.packageName}_${selectedApp.version}.apk`)}
              className="px-4 py-2.5 bg-[#02569B] hover:bg-[#02569B]/80 text-white rounded-lg font-bold text-[0.8125rem] flex items-center gap-2 transition-all active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>تحميل حزمة Android APK</span>
            </button>
            <button
              onClick={() => alert('تم إرسال إشعار التحديث الفوري (In-App Update) لجميع الأجهزة النشطة في بغداد')}
              className="px-4 py-2.5 bg-[#1e1b1c] hover:bg-[#332f30] text-white border border-[#332f30] rounded-lg font-bold text-[0.8125rem] flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">update</span>
              <span>طلب تحديث إجباري للأجهزة</span>
            </button>
          </div>
        </div>

        {/* Push Notifications Simulator (FCM) */}
        <div className="bg-[#0d0a0b] border border-[#332f30] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#332f30] pb-3">
            <span className="material-symbols-outlined text-[#ffb68b] text-[22px]">notifications_active</span>
            <h3 className="font-bold text-white text-[1.125rem]">إرسال إشعار فوري (FCM)</h3>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#c3c6d5]">مجموعة الاستهداف (Topic):</label>
              <select
                value={fcmTopic}
                onChange={(e) => setFcmTopic(e.target.value)}
                className="w-full h-10 px-3 bg-[#1e1b1c] text-white border border-[#332f30] rounded-lg text-[0.8125rem] outline-none"
              >
                <option value="all_baghdad_riders">جميع أصحاب الدراجات في بغداد (4,820 مستخدم)</option>
                <option value="dora_riders">أصحاب دراجات الدورة وحي الميكانيك (1,240)</option>
                <option value="cairo_riders">أصحاب دراجات حي القاهرة والشعب (980)</option>
                <option value="mechanics_only">كادر الفيترية فقط (18 فيتر)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#c3c6d5]">عنوان الإشعار:</label>
              <input
                type="text"
                value={fcmTitle}
                onChange={(e) => setFcmTitle(e.target.value)}
                className="w-full h-10 px-3 bg-[#1e1b1c] text-white border border-[#332f30] rounded-lg text-[0.8125rem] outline-none focus:border-[#954500]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#c3c6d5]">نص الرسالة:</label>
              <textarea
                value={fcmBody}
                onChange={(e) => setFcmBody(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-[#1e1b1c] text-white border border-[#332f30] rounded-lg text-[0.8125rem] outline-none focus:border-[#954500] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingFcm}
              className="w-full py-2.5 bg-[#954500] hover:bg-[#bb5800] text-white font-bold rounded-lg text-[0.8125rem] flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
            >
              {isSendingFcm ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[18px]">sync</span>
                  <span>جاري الإرسال عبر Firebase...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>بث الإشعار لتطبيق فلاتر</span>
                </>
              )}
            </button>

            {fcmSuccess && (
              <div className="p-2.5 bg-[#2c690b]/20 border border-[#2c690b] text-[#aff589] rounded-lg text-[0.75rem] text-center font-bold">
                ✓ تم بث الإشعار بنجاح لـ 4,820 جهاز دراجة في بغداد!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
