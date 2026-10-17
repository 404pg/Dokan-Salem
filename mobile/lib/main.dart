import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/app_state.dart';
import 'src/screens.dart';
import 'src/theme.dart';

final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

const _apiBaseUrl = String.fromEnvironment('API_BASE_URL');
const _dataBackend = String.fromEnvironment(
  'DATA_BACKEND',
  defaultValue: 'api',
);
const _supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const _supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final preferences = await SharedPreferences.getInstance();

  final backendIsSupabase = _dataBackend == 'supabase';
  final hasApiUrl = _apiBaseUrl.trim().isNotEmpty;
  Uri? apiUri = hasApiUrl ? Uri.tryParse(_apiBaseUrl.trim()) : null;

  String? configurationMessage;

  if (backendIsSupabase) {
    final supabaseUrlTrimmed = _supabaseUrl.trim();
    final supabaseKeyTrimmed = _supabaseAnonKey.trim();
    if (supabaseUrlTrimmed.isEmpty || supabaseKeyTrimmed.isEmpty) {
      configurationMessage =
          'مطلوب توفير SUPABASE_URL وSUPABASE_ANON_KEY عند استخدام DATA_BACKEND=supabase.';
    } else {
      final parsedSupabase = Uri.tryParse(supabaseUrlTrimmed);
      if (parsedSupabase == null ||
          parsedSupabase.host.isEmpty ||
          !const {'http', 'https'}.contains(parsedSupabase.scheme) ||
          parsedSupabase.userInfo.isNotEmpty ||
          parsedSupabase.query.isNotEmpty ||
          parsedSupabase.fragment.isNotEmpty ||
          (parsedSupabase.path.isNotEmpty && parsedSupabase.path != '/')) {
        configurationMessage =
            'عنوان Supabase غير صالح. أدخل عنوان المشروع مع المنفذ فقط (بدون مسار).';
      } else {
        try {
          await Supabase.initialize(
            url: supabaseUrlTrimmed,
            publishableKey: supabaseKeyTrimmed,
          );
          apiUri = null;
          try {
            await Firebase.initializeApp();
            FirebaseMessaging.onMessage.listen((message) {
              final notification = message.notification;
              if (notification == null) return;
              scaffoldMessengerKey.currentState?.showSnackBar(
                SnackBar(
                  content: Text(
                    '${notification.title ?? ''}\n${notification.body ?? ''}',
                  ),
                ),
              );
            });
          } catch (error) {
            debugPrint('Firebase init failed: $error');
          }
        } catch (error) {
          configurationMessage =
              'تعذّر تهيئة الاتصال بـ Supabase. تحقّق من الإعدادات.';
        }
      }
    }
  } else {
    if (hasApiUrl) {
      if (apiUri == null ||
          apiUri.host.isEmpty ||
          !const {'http', 'https'}.contains(apiUri.scheme) ||
          apiUri.userInfo.isNotEmpty ||
          apiUri.query.isNotEmpty ||
          apiUri.fragment.isNotEmpty ||
          (apiUri.path.isNotEmpty && apiUri.path != '/')) {
        configurationMessage =
            'عنوان خادم المتجر غير صالح. أدخل عنوان الخادم مع المنفذ فقط.';
      }
    } else {
      configurationMessage =
          'مطلوب تحديد عنوان خادم المتجر (API_BASE_URL).';
    }
  }

  if (configurationMessage != null) {
    runApp(
      DokanApp(
        configurationError: true,
        configurationMessage: configurationMessage,
      ),
    );
    return;
  }

  final state = await AppState.create(
    preferences: preferences,
    apiBaseUri: apiUri,
  );
  runApp(DokanApp(state: state));
}

class DokanApp extends StatelessWidget {
  const DokanApp({
    super.key,
    this.state,
    this.configurationError = false,
    this.configurationMessage,
  });

  final AppState? state;
  final bool configurationError;
  final String? configurationMessage;

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'دكان سليم',
    scaffoldMessengerKey: scaffoldMessengerKey,
    debugShowCheckedModeBanner: false,
    locale: const Locale('ar'),
    supportedLocales: const [Locale('ar'), Locale('en')],
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    theme: buildDokanTheme(),
    home: configurationError
        ? ConfigurationScreen(message: configurationMessage)
        : state == null
        ? const ConfigurationScreen()
        : DokanHome(state: state!),
  );
}
