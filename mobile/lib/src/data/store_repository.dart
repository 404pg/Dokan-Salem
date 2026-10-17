import 'package:shared_preferences/shared_preferences.dart';

import '../models.dart';
import 'api_repository.dart';
import 'supabase_repository.dart';

class StoreApiException implements Exception {
  const StoreApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;

  @override
  String toString() => message;
}

enum DataBackend { api, supabase }

abstract class StoreRepository {
  factory StoreRepository({
    required Uri? baseUri,
    required SharedPreferences preferences,
  }) {
    const backendName = String.fromEnvironment(
      'DATA_BACKEND',
      defaultValue: 'api',
    );
    final backend = backendName == 'supabase'
        ? DataBackend.supabase
        : DataBackend.api;
    return createStoreRepository(
      backend: backend,
      baseUri: baseUri,
      preferences: preferences,
    );
  }

  StoreUser? get currentUser;

  Future<StoreUser?> restoreSession();
  Future<StoreUser> signInAnonymously();
  Future<void> signOut();

  bool get isGoogleLinked;
  Future<void> linkGoogleIdentity();

  Future<void> saveFcmToken(String token, {required String platform});
  Future<void> deleteFcmToken(String token);

  Future<StoreUser?> fetchProfile();
  Future<void> saveProfile({required String name, required String phone});

  Future<List<ProductCategory>> fetchCategories();
  Future<List<StoreProduct>> fetchProducts({
    String? categoryId,
    String query = '',
  });
  Future<List<StorePromotion>> fetchPromotions();
  Future<List<DeliveryRegion>> fetchDeliveryRegions();
  Future<List<Map<String, dynamic>>> fetchBranches();
  Future<String?> fetchSupportPhone();

  Future<List<CustomerAddress>> fetchAddresses();
  Future<void> saveAddress({
    required String recipientName,
    required String phone,
    required DeliveryRegion region,
    required String details,
    String? deliveryNote,
    String? addressId,
    bool isDefault = false,
  });
  Future<void> deleteAddress(String id);

  Future<Set<String>> fetchFavorites();
  Future<void> toggleFavorite(String productId);

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
  });

  Future<List<StoreOrder>> fetchOrders();
  Future<List<Map<String, dynamic>>> fetchOrderItems(String orderId);
  Future<void> cancelPendingOrder(String orderId);

  Future<List<Map<String, dynamic>>> fetchMaintenanceRequests();
  Future<void> submitMaintenanceRequest({
    required String serviceType,
    required String branchId,
    required String motorcycle,
    required String description,
    String? preferredDate,
  });

  Future<List<Map<String, dynamic>>> fetchNotifications();
  Future<void> markNotificationRead(String notificationId);

  Future<List<Map<String, dynamic>>> fetchMotorcycles();
  Future<void> saveMotorcycle({
    String? id,
    required String make,
    required String model,
    int? year,
    String nickname = '',
  });
  Future<void> deleteMotorcycle(String id);

  void dispose();
}

StoreRepository createStoreRepository({
  required DataBackend backend,
  required Uri? baseUri,
  required SharedPreferences preferences,
}) {
  switch (backend) {
    case DataBackend.supabase:
      return SupabaseRepository();
    case DataBackend.api:
      return ApiRepository(baseUri: baseUri!, preferences: preferences);
  }
}
