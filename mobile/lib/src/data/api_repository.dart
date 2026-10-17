import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:shared_preferences/shared_preferences.dart';

import '../models.dart';
import 'store_repository.dart';

class ApiRepository implements StoreRepository {
  ApiRepository({
    required this.baseUri,
    required this.preferences,
  }) {
    _httpClient.connectionTimeout = const Duration(seconds: 15);
    _httpClient.idleTimeout = const Duration(seconds: 30);
  }

  static const _tokenKey = 'dokan.api.token.v1';
  static const _userIdKey = 'dokan.api.user-id.v1';
  static const _userRoleKey = 'dokan.api.user-role.v1';
  static const _userEmailKey = 'dokan.api.user-email.v1';

  final Uri baseUri;
  final SharedPreferences preferences;
  final HttpClient _httpClient = HttpClient();
  String? _token;
  StoreUser? _currentUser;

  @override
  StoreUser? get currentUser => _currentUser;

  @override
  Future<StoreUser?> fetchProfile() async => _currentUser;

  @override
  Future<void> saveProfile({
    required String name,
    required String phone,
  }) async {
    throw const StoreApiException(
      501,
      'حفظ بيانات الحساب غير متاح في وضع الخادم المحلي.',
    );
  }

  @override
  Future<StoreUser?> restoreSession() async {
    _token = preferences.getString(_tokenKey);
    if (_token == null) return null;
    try {
      final response = await _request(
        'GET',
        '/api/auth/session',
        authenticated: true,
      );
      final userData = (response as Map<String, dynamic>)['user'];
      _currentUser = StoreUser.fromJson(userData as Map<String, dynamic>);
      await _saveUser(_currentUser!);
      return _currentUser;
    } on StoreApiException catch (error) {
      if (error.statusCode != HttpStatus.unauthorized) rethrow;
      await signOut();
      return null;
    }
  }

  @override
  Future<StoreUser> signInAnonymously() async {
    final response = await _request('POST', '/api/auth/guest');
    final data = response as Map<String, dynamic>;
    _token = data['token'] as String;
    _currentUser = StoreUser.fromJson(data['user'] as Map<String, dynamic>);
    await _saveUser(_currentUser!);
    return _currentUser!;
  }

  @override
  Future<void> signOut() async {
    _token = null;
    _currentUser = null;
    final removed = await Future.wait([
      preferences.remove(_tokenKey),
      preferences.remove(_userIdKey),
      preferences.remove(_userRoleKey),
      preferences.remove(_userEmailKey),
    ]);
    if (removed.any((result) => !result)) {
      throw StateError('تعذّر إنهاء جلسة الزائر على هذا الجهاز.');
    }
  }

  @override
  bool get isGoogleLinked => false;

  @override
  Future<void> linkGoogleIdentity() async {
    throw const StoreApiException(
      501,
      'ربط حساب Google غير مدعوم في وضع الخادم المحلي.',
    );
  }

  @override
  Future<void> saveFcmToken(String token, {required String platform}) async {
    throw const StoreApiException(
      501,
      'الإشعارات غير مدعومة في وضع الخادم المحلي.',
    );
  }

  @override
  Future<void> deleteFcmToken(String token) async {
    throw const StoreApiException(
      501,
      'الإشعارات غير مدعومة في وضع الخادم المحلي.',
    );
  }

  Future<void> _saveUser(StoreUser user) async {
    final saved = await Future.wait([
      preferences.setString(_tokenKey, _token!),
      preferences.setString(_userIdKey, user.id),
      preferences.setString(_userRoleKey, user.role),
      if (user.email case final email?)
        preferences.setString(_userEmailKey, email),
      if (user.email == null) preferences.remove(_userEmailKey),
    ]);
    if (saved.any((result) => !result)) {
      throw StateError('تعذّر حفظ جلسة الزائر على هذا الجهاز.');
    }
  }

  Future<Object?> _request(
    String method,
    String path, {
    Object? body,
    bool authenticated = false,
    Map<String, String>? queryParameters,
  }) async {
    final requestUri = baseUri
        .resolve(path)
        .replace(queryParameters: queryParameters);
    try {
      final request = await _httpClient.openUrl(method, requestUri);
      request.followRedirects = false;
      request.headers.set(HttpHeaders.acceptHeader, 'application/json');
      if (body != null) {
        request.headers.contentType = ContentType.json;
        request.add(utf8.encode(jsonEncode(body)));
      }
      if (authenticated && _token != null) {
        request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $_token');
      }
      final response = await request.close().timeout(
        const Duration(seconds: 20),
      );
      final responseText = await utf8.decoder
          .bind(response)
          .join()
          .timeout(const Duration(seconds: 20));
      Object? decoded;
      if (responseText.isNotEmpty) {
        try {
          decoded = jsonDecode(responseText);
        } on FormatException {
          throw const FormatException('وصلت استجابة غير صالحة من خادم المتجر.');
        }
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final message = decoded is Map<String, dynamic>
            ? decoded['error'] as String? ?? 'تعذّر إكمال الطلب.'
            : 'تعذّر إكمال الطلب.';
        throw StoreApiException(response.statusCode, message);
      }
      return decoded;
    } on StoreApiException {
      rethrow;
    } on FormatException {
      rethrow;
    } on TimeoutException {
      throw const StoreApiException(
        0,
        'انتهت مهلة الاتصال بخادم المتجر. تحقق من شبكة المتجر ثم أعد المحاولة.',
      );
    } on SocketException {
      throw const StoreApiException(
        0,
        'تعذّر الاتصال بخادم المتجر. اتصل بشبكة المتجر ثم أعد المحاولة.',
      );
    } on HttpException {
      throw const StoreApiException(0, 'تعذّر الاتصال بخادم المتجر.');
    }
  }

  List<Map<String, dynamic>> _rows(Object? response) {
    if (response is! List<dynamic>) {
      throw const FormatException('استجابة قائمة المتجر غير صالحة.');
    }
    return response
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList(growable: false);
  }

  @override
  Future<List<ProductCategory>> fetchCategories() async =>
      _rows(await _request('GET', '/api/catalog/categories'))
          .map(ProductCategory.fromJson)
          .toList(growable: false);

  @override
  Future<List<StoreProduct>> fetchProducts({
    String? categoryId,
    String query = '',
  }) async {
    final parameters = <String, String>{};
    if (categoryId != null) parameters['categoryId'] = categoryId;
    if (query.trim().isNotEmpty) parameters['search'] = query.trim();
    return _rows(
      await _request(
        'GET',
        '/api/catalog/products',
        queryParameters: parameters,
      ),
    ).map(StoreProduct.fromJson).toList(growable: false);
  }

  @override
  Future<List<StorePromotion>> fetchPromotions() async =>
      _rows(await _request('GET', '/api/catalog/promotions'))
          .map(StorePromotion.fromJson)
          .toList(growable: false);

  @override
  Future<List<DeliveryRegion>> fetchDeliveryRegions() async =>
      _rows(await _request('GET', '/api/catalog/regions'))
          .map(DeliveryRegion.fromJson)
          .toList(growable: false);

  @override
  Future<List<CustomerAddress>> fetchAddresses() async => _rows(
    await _request('GET', '/api/customer/addresses', authenticated: true),
  ).map(CustomerAddress.fromJson).toList(growable: false);

  @override
  Future<void> saveAddress({
    required String recipientName,
    required String phone,
    required DeliveryRegion region,
    required String details,
    String? deliveryNote,
    String? addressId,
    bool isDefault = false,
  }) async {
    final body = {
      'recipientName': recipientName.trim(),
      'phone': phone.trim(),
      'regionId': region.id,
      'addressDetails': details.trim(),
      'deliveryNote': deliveryNote?.trim() ?? '',
      'isDefault': isDefault,
    };
    await _request(
      addressId == null ? 'POST' : 'PUT',
      addressId == null
          ? '/api/customer/addresses'
          : '/api/customer/addresses/$addressId',
      body: body,
      authenticated: true,
    );
  }

  @override
  Future<void> deleteAddress(String id) async {
    await _request(
      'DELETE',
      '/api/customer/addresses/$id',
      authenticated: true,
    );
  }

  @override
  Future<void> toggleFavorite(String productId) async {
    final favorites = await fetchFavorites();
    final isFavorite = favorites.contains(productId);
    await _request(
      isFavorite ? 'DELETE' : 'PUT',
      '/api/customer/favorites/$productId',
      authenticated: true,
    );
  }

  @override
  Future<Set<String>> fetchFavorites() async {
    final response = await _request(
      'GET',
      '/api/customer/favorites',
      authenticated: true,
    );
    if (response is! List<dynamic>) {
      throw const FormatException('استجابة المفضلة غير صالحة.');
    }
    return response.map((id) => id as String).toSet();
  }

  @override
  Future<String> placeCashOrder({
    required String idempotencyKey,
    required String customerName,
    required String phone,
    required DeliveryRegion region,
    required String addressDetails,
    required String deliveryNote,
    required int expectedDeliveryFeeIqd,
    required List<CartLine> lines,
    bool saveAddress = false,
  }) async {
    final response = await _request(
      'POST',
      '/api/customer/orders',
      authenticated: true,
      body: {
        'customerName': customerName.trim(),
        'phone': phone.trim(),
        'regionId': region.id,
        'addressDetails': addressDetails.trim(),
        'deliveryNote': deliveryNote.trim(),
        'expectedDeliveryFeeIqd': expectedDeliveryFeeIqd,
        'idempotencyKey': idempotencyKey,
        'saveAddress': saveAddress,
        'items': lines
            .map(
              (line) => {
                'productId': line.product.id,
                'quantity': line.quantity,
                'expectedPriceIqd': line.product.priceIqd,
              },
            )
            .toList(growable: false),
      },
    );
    if (response is! Map<String, dynamic> ||
        response['order_number'] is! String ||
        (response['order_number'] as String).isEmpty) {
      throw const FormatException('لم يُرجع الخادم رقم الطلب.');
    }
    return response['order_number'] as String;
  }

  @override
  Future<List<StoreOrder>> fetchOrders() async =>
      _rows(await _request('GET', '/api/customer/orders', authenticated: true))
          .map(StoreOrder.fromJson)
          .toList(growable: false);

  @override
  Future<List<Map<String, dynamic>>> fetchOrderItems(String orderId) async =>
      _rows(
        await _request(
          'GET',
          '/api/customer/orders/$orderId/items',
          authenticated: true,
        ),
      );

  @override
  Future<void> cancelPendingOrder(String orderId) async {
    await _request(
      'POST',
      '/api/customer/orders/$orderId/cancel',
      authenticated: true,
    );
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMaintenanceRequests() async => _rows(
    await _request('GET', '/api/customer/maintenance', authenticated: true),
  );

  @override
  Future<List<Map<String, dynamic>>> fetchNotifications() async => _rows(
    await _request('GET', '/api/customer/notifications', authenticated: true),
  );

  @override
  Future<void> markNotificationRead(String notificationId) async {
    await _request(
      'PATCH',
      '/api/customer/notifications/$notificationId/read',
      authenticated: true,
    );
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMotorcycles() async => _rows(
    await _request('GET', '/api/customer/motorcycles', authenticated: true),
  );

  @override
  Future<void> saveMotorcycle({
    String? id,
    required String make,
    required String model,
    int? year,
    String nickname = '',
  }) async {
    await _request(
      id == null ? 'POST' : 'PATCH',
      id == null
          ? '/api/customer/motorcycles'
          : '/api/customer/motorcycles/$id',
      authenticated: true,
      body: {
        'make': make.trim(),
        'model': model.trim(),
        'year': year,
        'nickname': nickname.trim(),
      },
    );
  }

  @override
  Future<void> deleteMotorcycle(String id) async {
    await _request(
      'DELETE',
      '/api/customer/motorcycles/$id',
      authenticated: true,
    );
  }

  @override
  Future<void> submitMaintenanceRequest({
    required String serviceType,
    required String branchId,
    required String motorcycle,
    required String description,
    String? preferredDate,
  }) async {
    await _request(
      'POST',
      '/api/customer/maintenance',
      authenticated: true,
      body: {
        'serviceType': serviceType,
        'branchId': serviceType == 'workshop' ? branchId : null,
        'motorcycle': motorcycle.trim(),
        'description': description.trim(),
        'preferredDate': preferredDate,
      },
    );
  }

  @override
  Future<List<Map<String, dynamic>>> fetchBranches() async =>
      _rows(await _request('GET', '/api/catalog/branches'));

  @override
  Future<String?> fetchSupportPhone() async {
    final response = await _request('GET', '/api/catalog/settings');
    if (response is! Map<String, dynamic>) {
      throw const FormatException('استجابة إعدادات المتجر غير صالحة.');
    }
    return response['support_phone'] as String?;
  }

  @override
  void dispose() => _httpClient.close(force: true);
}
