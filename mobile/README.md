# تطبيق دكان سليم

تطبيق Flutter عربي للمتجر المحلي، مع جلسات زائر، وكتالوج، وسلة، وعناوين، ومفضلة، وطلبات نقدًا عند الاستلام، وصيانة، وإشعارات داخل التطبيق. لا يستخدم SMS أو تحقق WhatsApp. يتصل التطبيق بخادم HTTP محلي؛ يجب أن يكون الهاتف وخادم المتجر على شبكة Wi-Fi نفسها.

## تشغيل خادم المتجر

قاعدة SQL Server Express ومخططها الأولي وبذورها موجودة في `backend/`. راجع [دليل الخادم](../backend/README.md) قبل تعريض API على شبكة المتجر. استخدم حساب Windows مخصصًا غير مسؤول لتشغيل الخادم، وامنح الحساب صلاحيات القراءة والكتابة المطلوبة على قاعدة `DokanSaleem` فقط. لا تشغّل الخادم الشبكي بحساب SQL مسؤول.

احتفظ بنسخة احتياطية من قاعدة SQL Server ومجلد `backend/data/images/`. لا تحذف Supabase القديمة: لم تُنقل كل بياناتها ولم تُحذف؛ أبقها مصدر رجوع حتى إكمال التحقق التشغيلي.

## إعداد التطبيق وتشغيله

مرّر عنوان خادم المتجر ومنفذ API وقت التشغيل أو البناء. العنوان المحجوز حاليًا هو `192.168.68.107:4176`. من مجلد `mobile/`:

```powershell
flutter pub get
flutter run --dart-define=API_BASE_URL=http://192.168.68.107:4176
```

لبناء APK تجريبي للتثبيت على Android:

```powershell
flutter build apk --debug --dart-define=API_BASE_URL=http://192.168.68.107:4176
```

ينتج الملف في `build/app/outputs/flutter-apk/app-debug.apk`. هذا APK للتطوير والاختبار وليس صالحًا للنشر في Google Play. يجب أن يعمل API على الخادم وأن يكون الهاتف على شبكة المتجر. الاتصال المحلي الحالي يستخدم HTTP؛ لا تستخدمه عبر الإنترنت العام أو شبكة Wi-Fi عامة.

الشعار في التطبيق وأيقونة Android مأخوذان من `assets/images/dokan_logo.jpg`، وهي نسخة من `01-design-system/00 · Cover, brand & quality gate-html/assets/logo.jpg`.

## حالة بيانات المتجر

قاعدة البيانات المحلية تحتوي على أربعة أقسام مسودة وثمانية منتجات توضيحية غير منشورة، و19 منطقة توصيل نشطة (كل محافظات العراق) برسوم 5,000 د.ع. الصور رسومات توضيحية والأسعار تقديرية غير موثقة. أُنشئ حساب مدير واحد، لكن لا توجد فروع أو مخزونات ولم تُنقل بيانات Supabase. لن تظهر المنتجات للزبائن حتى تُراجع معلوماتها وتنشرها ويُضاف مخزونها إلى فرع نشط.

أدخل الأسعار والعلامات التجارية وأرقام القطع والتوافق ومعلومات المخزون الفعلية، ثم اختبر إنشاء طلب وإلغاءه وتحديث حالته. أرقام الهاتف معلومات تواصل فقط ولا تثبت ملكية الرقم. جلسات الزائر على الجهاز مؤقتة وقد تفقد بياناتها عند حذف التطبيق. الإشعارات داخل التطبيق فقط؛ لم يُربط FCM أو APNs أو WhatsApp.

## إصدار Android للنشر

لا تُوقّع نسخة النشر بمفتاح debug. أنشئ مفتاح رفع مملوكًا للناشر واحفظ نسخة احتياطية آمنة خارج المستودع:

```powershell
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

ضع ملف المفتاح في `mobile/android/`، وأنشئ `mobile/android/key.properties` (مستثنى من Git) بالقيم المحلية:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upload
storeFile=upload-keystore.jks
```

بعد إعداد مفتاح الرفع وقبول تراخيص Android SDK:

```powershell
flutter build appbundle --release --dart-define=API_BASE_URL=https://YOUR_API_HOST
```

ينتج ملف AAB في `build/app/outputs/bundle/release/app-release.aab`. إذا لم يوجد `key.properties`، فقد ينشئ Gradle إصدارًا غير موقع؛ لا ترفعه إلى Google Play. لا تحفظ المفاتيح أو كلمات المرور في Git.

## إصدار iOS

إصدار iOS يحتاج إلى macOS وXcode وحساب Apple Developer صالحًا. افتح `mobile/ios/Runner.xcworkspace` على جهاز Mac، واضبط Team وBundle ID وشهادات التوقيع، ثم أنشئ Archive وارفعه عبر Xcode Organizer. لم يُنشأ أو يُختبر ملف IPA على Windows. يجب اختبار إذن الشبكة المحلية وعنوان الخادم على أجهزة فعلية.

## التحقق

```powershell
dart format lib test
flutter analyze
flutter test
```

تتطلب إتاحة الخدمة خارج شبكة المتجر نشرًا مختلفًا وآمنًا بخدمة API على HTTPS، وسياسات خصوصية وشروط استخدام، ونسخًا احتياطية وخطة استعادة، واختبارًا شاملًا قبل الإطلاق.
