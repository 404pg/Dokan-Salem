import 'package:flutter/material.dart';

const String appName = String.fromEnvironment(
  'APP_NAME',
  defaultValue: 'دكان سليم',
);
const String primaryColorHex = String.fromEnvironment(
  'PRIMARY_COLOR',
  defaultValue: 'FFD66910',
);

abstract final class DokanColors {
  static const onyx = Color(0xFF0D0A0B);
  static const charcoal = Color(0xFF454955);
  static const surface = Color(0xFFFFFFFF);
  static const background = Color(0xFFF3EFF5);
  static final orange = Color(int.parse(primaryColorHex, radix: 16));
  static const orangeInk = Color(0xFFA6500A);
  static const orangeTint = Color(0xFFFBEBDB);
  static const green = Color(0xFF2F6016);
  static const greenTint = Color(0xFFE7F1E0);
  static const red = Color(0xFFB3261E);
  static const line = Color(0xFFDDD7E0);
  static const muted = Color(0xFF6E6872);
}

ThemeData buildDokanTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: DokanColors.orange,
    primary: DokanColors.orange,
    onPrimary: DokanColors.onyx,
    secondary: DokanColors.charcoal,
    surface: DokanColors.surface,
    error: DokanColors.red,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: DokanColors.background,
    appBarTheme: const AppBarTheme(
      backgroundColor: DokanColors.surface,
      foregroundColor: DokanColors.onyx,
      elevation: 0,
      centerTitle: false,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      color: DokanColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: DokanColors.line),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: DokanColors.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: DokanColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: DokanColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: DokanColors.onyx, width: 1.5),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 48),
        backgroundColor: DokanColors.orange,
        foregroundColor: DokanColors.onyx,
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(46, 46),
        foregroundColor: DokanColors.onyx,
        side: const BorderSide(color: DokanColors.charcoal),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)),
      ),
    ),
    textTheme: const TextTheme(
      headlineSmall: TextStyle(
        color: DokanColors.onyx,
        fontSize: 22,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: TextStyle(
        color: DokanColors.onyx,
        fontSize: 18,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: TextStyle(
        color: DokanColors.onyx,
        fontSize: 15,
        fontWeight: FontWeight.w600,
      ),
      bodyMedium: TextStyle(color: DokanColors.onyx, fontSize: 14),
      bodySmall: TextStyle(color: DokanColors.muted, fontSize: 12),
    ),
  );
}
