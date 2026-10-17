// SupabaseRepository implements StoreRepository using Supabase.instance.client.
//
// - Supabase.instance.client is initialized in main.dart (Step 3.5) before
//   AppState is created, so this class never calls Supabase.initialize itself.
// - Every method returns the same snake_case keys as the local API contract so
//   the existing model parsers (models.dart) and screens keep working unchanged.

import 'package:supabase_flutter/supabase_flutter.dart';

import '../models.dart';
import 'store_repository.dart';

class SupabaseRepository implements StoreRepository {
  SupabaseClient get _client => Supabase.instance.client;

  static StoreUser _toStoreUser(User user, {String? name, String? phone}) =>
      StoreUser(
        id: user.id,
        role: user.isAnonymous ? 'guest' : 'customer',
        email: user.email,
        name: name,
        phone: phone,
      );

  @override
  StoreUser? get currentUser {
    final user = _client.auth.currentUser;
    return user == null ? null : _toStoreUser(user);
  }

  @override
  Future<StoreUser?> fetchProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return null;
    try {
      final data = await _client
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle();
      if (data == null) return _toStoreUser(user);
      return _toStoreUser(
        user,
        name: data['full_name'] as String?,
        phone: data['phone'] as String?,
      );
    } on AuthException {
      rethrow;
    } on PostgrestException {
      // Schema may not have full_name yet (pre-migration) — degrade gracefully.
      return _toStoreUser(user);
    }
  }

  @override
  Future<void> saveProfile({
    required String name,
    required String phone,
  }) async {
    final String normalized;
    try {
      normalized = toIraqiE164(phone);
    } catch (_) {
      throw const StoreApiException(
        422,
        'أدخل رقم هاتف عراقي صالحًا للتواصل.',
      );
    }
    try {
      await _client.rpc('save_customer_profile', params: {
        'p_full_name': name.trim(),
        'p_phone': normalized,
      });
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<StoreUser?> restoreSession() async {
    final session = _client.auth.currentSession;
    if (session == null) return null;
    return currentUser;
  }

  @override
  Future<StoreUser> signInAnonymously() async {
    try {
      final response = await _client.auth.signInAnonymously();
      final user = response.user;
      if (user == null) {
        throw const StoreApiException(500, 'تعذّر إنشاء جلسة الزائر.');
      }
      return _toStoreUser(user);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> signOut() async {
    try {
      await _client.auth.signOut();
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  bool get isGoogleLinked => _client.auth.currentUser?.identities
          ?.any((identity) => identity.provider == 'google') ??
      false;

  @override
  Future<void> linkGoogleIdentity() async {
    if (isGoogleLinked) return; // already linked — do nothing
    try {
      await _client.auth.linkIdentity(
        OAuthProvider.google,
        redirectTo: 'com.dokansaleem.customer://login-callback',
      );
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> saveFcmToken(String token, {required String platform}) async {
    final user = _client.auth.currentUser;
    if (user == null) return;
    try {
      await _client.from('customer_devices').upsert(
        {
          'user_id': user.id,
          'fcm_token': token,
          'platform': platform,
          'last_seen_at': DateTime.now().toUtc().toIso8601String(),
        },
        onConflict: 'user_id,fcm_token',
      );
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> deleteFcmToken(String token) async {
    final user = _client.auth.currentUser;
    if (user == null) return;
    try {
      await _client
          .from('customer_devices')
          .delete()
          .eq('user_id', user.id)
          .eq('fcm_token', token);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<ProductCategory>> fetchCategories() async {
    try {
      final rows = await _client
          .from('categories')
          .select('id,name_ar,sort_order')
          .eq('is_active', true)
          .order('sort_order')
          .order('name_ar');
      return _rows(rows).map(ProductCategory.fromJson).toList(growable: false);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<StoreProduct>> fetchProducts({
    String? categoryId,
    String query = '',
  }) async {
    try {
      final rows = await _client.rpc(
        'get_catalog_products',
        params: {
          'p_category_id': categoryId,
          'p_search': query.trim(),
        },
      );
      return _rows(rows).map(StoreProduct.fromJson).toList(growable: false);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<StorePromotion>> fetchPromotions() async {
    try {
      final rows = await _client
          .from('promotions')
          .select('id,title_ar,body_ar,image_url,product_id,starts_at,ends_at')
          .eq('is_active', true)
          .order('sort_order');
      final now = DateTime.now().toUtc();
      return _rows(rows)
          .where((row) => _isPromotionVisible(row, now))
          .map(StorePromotion.fromJson)
          .toList(growable: false);
    } catch (error) {
      throw _mapError(error);
    }
  }

  static bool _isPromotionVisible(Map<String, dynamic> row, DateTime now) {
    final startsAt = row['starts_at'] as String?;
    final endsAt = row['ends_at'] as String?;
    final hasStarted =
        startsAt == null || !DateTime.parse(startsAt).isAfter(now);
    final hasNotEnded = endsAt == null || DateTime.parse(endsAt).isAfter(now);
    return hasStarted && hasNotEnded;
  }

  @override
  Future<List<DeliveryRegion>> fetchDeliveryRegions() async {
    try {
      final rows = await _client
          .from('delivery_regions')
          .select('id,province_ar,neighborhood_ar,delivery_fee_iqd')
          .eq('is_active', true)
          .order('province_ar')
          .order('neighborhood_ar');
      return _rows(rows).map(DeliveryRegion.fromJson).toList(growable: false);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<Map<String, dynamic>>> fetchBranches() async {
    try {
      final rows = await _client
          .from('branches')
          .select('id,name_ar,address_ar')
          .eq('is_active', true)
          .order('name_ar');
      return _rows(rows);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<String?> fetchSupportPhone() async {
    try {
      final row = await _client
          .from('store_settings')
          .select('support_phone')
          .eq('id', 1)
          .maybeSingle();
      return row?['support_phone'] as String?;
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<CustomerAddress>> fetchAddresses() async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) throw const StoreApiException(401, 'الجلسة غير صالحة.');
      final rows = await _client
          .from('customer_addresses')
          .select('id,recipient_name,phone,region_id,province_ar,neighborhood_ar,address_details,delivery_note,is_default')
          .eq('user_id', user.id)
          .order('is_default', ascending: false)
          .order('created_at', ascending: false);
      return _rows(rows).map(CustomerAddress.fromJson).toList(growable: false);
    } catch (error) {
      throw _mapError(error);
    }
  }

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
    try {
      await _client.rpc('save_customer_address', params: {
        'p_recipient_name': recipientName.trim(),
        'p_phone': phone.trim(),
        'p_region_id': region.id,
        'p_address_details': details.trim(),
        'p_delivery_note': deliveryNote?.trim() ?? '',
        'p_address_id': addressId,
        'p_is_default': isDefault,
      });
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> deleteAddress(String id) async {
    try {
      await _client.from('customer_addresses').delete().eq('id', id);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<Set<String>> fetchFavorites() async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) throw const StoreApiException(401, 'الجلسة غير صالحة.');
      final rows = await _client.from('wishlist_items').select('product_id').eq('user_id', user.id);
      final ids = _rows(rows).map((r) => r['product_id'] as String?).whereType<String>().toSet();
      return ids;
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> toggleFavorite(String productId) async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) throw const StoreApiException(401, 'الجلسة غير صالحة.');
      final favs = await fetchFavorites();
      final isFav = favs.contains(productId);
      if (isFav) {
        await _client.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', productId);
      } else {
        await _client.from('wishlist_items').insert({'user_id': user.id, 'product_id': productId});
      }
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<Map<String, dynamic>>> fetchNotifications() async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) throw const StoreApiException(401, 'الجلسة غير صالحة.');
      final rows = await _client
          .from('customer_notifications')
          .select('id,title_ar,body_ar,is_read,created_at')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);
      return _rows(rows);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> markNotificationRead(String notificationId) async {
    try {
      await _client.from('customer_notifications').update({'is_read': true}).eq('id', notificationId);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMotorcycles() async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) throw const StoreApiException(401, 'الجلسة غير صالحة.');
      final rows = await _client
          .from('customer_motorcycles')
          .select('id,make,model,year,nickname')
          .eq('user_id', user.id);
      return _rows(rows);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> saveMotorcycle({
    String? id,
    required String make,
    required String model,
    int? year,
    String nickname = '',
  }) async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) throw const StoreApiException(401, 'الجلسة غير صالحة.');
      if (id == null) {
        await _client.from('customer_motorcycles').insert({
          'user_id': user.id,
          'make': make.trim(),
          'model': model.trim(),
          'year': year,
          'nickname': nickname.trim(),
        });
      } else {
        await _client
            .from('customer_motorcycles')
            .update({
              'make': make.trim(),
              'model': model.trim(),
              'year': year,
              'nickname': nickname.trim(),
            })
            .eq('id', id);
      }
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> deleteMotorcycle(String id) async {
    try {
      await _client.from('customer_motorcycles').delete().eq('id', id);
    } catch (error) {
      throw _mapError(error);
    }
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
    try {
      final result = await _client.rpc('create_cod_order', params: {
        'p_customer_name': customerName.trim(),
        'p_phone': phone.trim(),
        'p_region_id': region.id,
        'p_address_details': addressDetails.trim(),
        'p_delivery_note': deliveryNote.trim(),
        'p_expected_delivery_fee_iqd': expectedDeliveryFeeIqd,
        'p_items': lines
            .map(
              (line) => <String, dynamic>{
                'product_id': line.product.id,
                'quantity': line.quantity,
                'expected_price_iqd': line.product.priceIqd,
              },
            )
            .toList(growable: false),
        'p_idempotency_key': idempotencyKey,
        'p_save_address': saveAddress,
      });
      if (result is! String || result.isEmpty) {
        throw const FormatException('لم يُرجع الخادم رقم الطلب.');
      }
      return result;
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<StoreOrder>> fetchOrders() async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) throw const StoreApiException(401, 'الجلسة غير صالحة.');
      final rows = await _client
          .from('orders')
          .select('id,order_number,status,subtotal_iqd,delivery_fee_iqd,total_iqd,created_at')
          .eq('customer_id', user.id)
          .order('created_at', ascending: false);
      return _rows(rows).map(StoreOrder.fromJson).toList(growable: false);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<Map<String, dynamic>>> fetchOrderItems(String orderId) async {
    try {
      final rows = await _client
          .from('order_items')
          .select('product_name_ar,unit_price_iqd,quantity,line_total_iqd')
          .eq('order_id', orderId)
          .order('created_at');
      return _rows(rows);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> cancelPendingOrder(String orderId) async {
    try {
      await _client.rpc('cancel_pending_cod_order', params: {
        'p_order_id': orderId,
      });
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMaintenanceRequests() async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) throw const StoreApiException(401, 'الجلسة غير صالحة.');
      final rows = await _client
          .from('maintenance_requests')
          .select('id,request_number,service_type,motorcycle,description,preferred_date,status,created_at')
          .eq('customer_id', user.id)
          .order('created_at', ascending: false);
      return _rows(rows);
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<void> submitMaintenanceRequest({
    required String serviceType,
    required String branchId,
    required String motorcycle,
    required String description,
    String? preferredDate,
  }) async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) throw const StoreApiException(401, 'الجلسة غير صالحة.');
      final isWorkshop = serviceType == 'workshop';
      await _client.from('maintenance_requests').insert({
        'customer_id': user.id,
        'service_type': serviceType,
        'branch_id': isWorkshop ? branchId : null,
        'motorcycle': motorcycle.trim(),
        'description': description.trim(),
        'preferred_date': preferredDate,
      });
    } catch (error) {
      throw _mapError(error);
    }
  }

  @override
  void dispose() {
    // SupabaseClient is a singleton managed by supabase_flutter.
    // Nothing to tear down here.
  }

  List<Map<String, dynamic>> _rows(Object? response) {
    if (response is! List) {
      throw const FormatException('استجابة قائمة المتجر غير صالحة.');
    }
    return response
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList(growable: false);
  }

  StoreApiException _mapError(Object error) {
    if (error is StoreApiException) return error;
    if (error is FormatException) throw error;
    if (error is PostgrestException) {
      return StoreApiException(500, _arabicForPostgrest(error));
    }
    if (error is AuthException) {
      return StoreApiException(
        int.tryParse(error.statusCode ?? '') ?? 401,
        _arabicForAuth(error),
      );
    }
    return StoreApiException(500, 'تعذّر الاتصال بخدمة المتجر.');
  }

  String _arabicForPostgrest(PostgrestException e) {
    switch (e.code) {
      case '23505':
        return 'هذا السجل موجود مسبقاً.';
      case '23503':
        return 'السجل المرتبط غير موجود.';
      case '23514':
        return 'البيانات المُدخلة غير صالحة.';
      case '42501':
        return 'ليس لديك صلاحية لهذا الإجراء.';
      case 'PGRST116':
        return 'لم يتم العثور على البيانات المطلوبة.';
      default:
        if (e.message.isNotEmpty && _arabicText.hasMatch(e.message)) {
          return e.message;
        }
        return 'تعذّر تنفيذ العملية. الرجاء المحاولة مرة أخرى.';
    }
  }

  static final RegExp _arabicText = RegExp(r'[\u0600-\u06FF]');

  String _arabicForAuth(AuthException e) {
    final code = e.statusCode ?? '';
    if (code == '400' || code == '401') {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    if (code == '422') {
      return 'البيانات المُدخلة غير صالحة.';
    }
    if (code == '429') {
      return 'محاولات كثيرة. الرجاء الانتظار قليلاً.';
    }
    return 'تعذّر تسجيل الدخول. الرجاء المحاولة مرة أخرى.';
  }
}