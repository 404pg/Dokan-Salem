import 'package:dokan_saleem/main.dart';
import 'package:dokan_saleem/src/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Iraqi phone numbers are normalized and validated', () {
    expect(validateIraqiPhone('770 123 4567'), isNull);
    expect(validateIraqiPhone('+964 770 123 4567'), isNull);
    expect(validateIraqiPhone('0750 123 4567'), isNotNull);
    expect(toIraqiE164('770 123 4567'), '+9647701234567');
  });

  test('IQD amounts use unambiguous thousands separators', () {
    expect(formatIqd(0), '0 د.ع');
    expect(formatIqd(39000), '39,000 د.ع');
    expect(formatIqd(-1200000), '-1,200,000 د.ع');
  });

  testWidgets('unconfigured project explains local API setup without crashing', (
    tester,
  ) async {
    await tester.pumpWidget(const DokanApp());

    expect(find.text('أكمل إعداد المتجر للبدء'), findsOneWidget);
    expect(find.textContaining('API_BASE_URL'), findsOneWidget);
  });
}
