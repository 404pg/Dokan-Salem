import 'dart:async';
import 'dart:convert';
import 'dart:developer' as developer;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'models.dart';
import 'store_repository.dart';

class AppState extends ChangeNotifier {
  AppState._({required this._preferences, required this.repository});

  static const _cartKey = 'dokan.customer.cart.v1';
  static const _regionKey = 'dokan.customer.region.v1';
  static const _onboardingKey = 'dokan.customer.onboarding.v1';

  final SharedPreferences _preferences;
  final StoreRepository? repository;
  final Map<String, int> _cart = {};
  final List<ProductCategory> categories = [];
  final List<StoreProduct> products = [];
  final List<StorePromotion> promotions = [];
  final List<DeliveryRegion> regions = [];
  final List<CustomerAddress> addresses = [];
  final List<StoreOrder> orders = [];
  final List<Map<String, dynamic>> maintenanceRequests = [];
  final List<Map<String, dynamic>> motorcycles = [];
  final Set<String> favoriteIds = {};
  final List<Map<String, dynamic>> branches = [];

  StoreUser? user;
  String? selectedRegionId;
  String? catalogError;
  String? accountError;
  bool isCatalogLoading = false;
  bool isAccountLoading = false;
  bool hasSeenOnboarding = false;
  int selectedTab = 0;
  String searchQuery = '';
  String? selectedCategoryId;

  static Future<AppState> create({
    required SharedPreferences preferences,
    required Uri? apiBaseUri,
  }) async {
    final state = AppState._(
      preferences: preferences,
      repository: StoreRepository(
        baseUri: apiBaseUri,
        preferences: preferences,
      ),
    );
    state._restoreCart();
    state.selectedRegionId = preferences.getString(_regionKey);
    state.hasSeenOnboarding = preferences.getBool(_onboardingKey) ?? false;

    if (state.repository != null) {
      try {
        state.user = await state.repository!.restoreSession();
        state.user ??= await state.repository!.signInAnonymously();
      } catch (error, stackTrace) {
        developer.log(
          'Unable to restore or create a guest customer session',
          error: error,
          stackTrace: stackTrace,
        );
        state.accountError = state._friendlyError(error);
      }
      try {
        // Listen to auth changes (handles Google Login deep-link return).
        Supabase.instance.client.auth.onAuthStateChange.listen((data) {
          final event = data.event;
          if (event == AuthChangeEvent.signedIn ||
              event == AuthChangeEvent.userUpdated) {
            unawaited(state.refreshAccount());
          }
        });
      } catch (_) {
        // Supabase not initialized (local API mode) — ignore.
      }
      unawaited(state.refreshCatalog());
      if (state.user != null) {
        unawaited(state._registerPushToken());
        unawaited(state.refreshAccount());
      }
    }
    return state;
  }

  bool get isConfigured => repository != null;
  bool get isSignedIn => user != null;
  int get cartCount => _cart.values.fold(0, (sum, value) => sum + value);
  int get unavailableCartCount =>
      cartCount - cartLines.fold(0, (sum, line) => sum + line.quantity);
  List<CartLine> get cartLines {
    final byId = {for (final product in products) product.id: product};
    return [
      for (final entry in _cart.entries)
        if (byId[entry.key] case final product?)
          CartLine(product: product, quantity: entry.value),
    ];
  }

  DeliveryRegion? get selectedRegion {
    for (final region in regions) {
      if (region.id == selectedRegionId) return region;
    }
    return null;
  }

  int get cartSubtotal => cartLines.fold(0, (sum, line) => sum + line.totalIqd);

  List<StoreProduct> get visibleProducts {
    final query = searchQuery.trim().toLowerCase();
    return products
        .where((product) {
          final categoryMatches =
              selectedCategoryId == null ||
              product.categoryId == selectedCategoryId;
          final queryMatches =
              query.isEmpty ||
              '${product.name} ${product.brand ?? ''} ${product.sku ?? ''}'
                  .toLowerCase()
                  .contains(query);
          return categoryMatches && queryMatches;
        })
        .toList(growable: false);
  }

  Future<void> refreshCatalog() async {
    final store = repository;
    if (store == null) return;
    isCatalogLoading = true;
    catalogError = null;
    notifyListeners();
    try {
      final values = await Future.wait<Object>([
        store.fetchCategories(),
        store.fetchProducts(),
        store.fetchPromotions(),
        store.fetchDeliveryRegions(),
      ]);
      categories
        ..clear()
        ..addAll(values[0] as List<ProductCategory>);
      products
        ..clear()
        ..addAll(values[1] as List<StoreProduct>);
      promotions
        ..clear()
        ..addAll(values[2] as List<StorePromotion>);
      regions
        ..clear()
        ..addAll(values[3] as List<DeliveryRegion>);
      if (regions.every((region) => region.id != selectedRegionId)) {
        selectedRegionId = null;
      }
      if (selectedRegionId == null && regions.isNotEmpty) {
        selectedRegionId = regions.first.id;
        await _preferences.setString(_regionKey, selectedRegionId!);
      }
    } catch (error, stackTrace) {
      developer.log(
        'Unable to load the store catalog',
        error: error,
        stackTrace: stackTrace,
      );
      catalogError = _friendlyError(error);
    } finally {
      isCatalogLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshAccount() async {
    final store = repository;
    if (store == null || user == null) {
      addresses.clear();
      orders.clear();
      maintenanceRequests.clear();
      motorcycles.clear();
      favoriteIds.clear();
      notifyListeners();
      return;
    }
    isAccountLoading = true;
    accountError = null;
    notifyListeners();
    try {
      final values = await Future.wait<Object?>([
        store.fetchProfile(),
        store.fetchAddresses(),
        store.fetchOrders(),
        store.fetchFavorites(),
        store.fetchMaintenanceRequests(),
        store.fetchMotorcycles(),
      ]);
      final profile = values[0] as StoreUser?;
      if (profile != null) {
        user = user?.copyWith(name: profile.name, phone: profile.phone);
      }
      addresses
        ..clear()
        ..addAll(values[1] as List<CustomerAddress>);
      orders
        ..clear()
        ..addAll(values[2] as List<StoreOrder>);
      favoriteIds
        ..clear()
        ..addAll(values[3] as Set<String>);
      maintenanceRequests
        ..clear()
        ..addAll(values[4] as List<Map<String, dynamic>>);
      motorcycles
        ..clear()
        ..addAll(values[5] as List<Map<String, dynamic>>);
    } catch (error, stackTrace) {
      developer.log(
        'Unable to load the signed-in customer data',
        error: error,
        stackTrace: stackTrace,
      );
      accountError = _friendlyError(error);
    } finally {
      isAccountLoading = false;
      notifyListeners();
    }
  }

  Future<void> addToCart(StoreProduct product) async {
    if (!product.available) {
      throw StateError('هذا المنتج غير متوفر حاليًا');
    }
    _cart[product.id] = (_cart[product.id] ?? 0) + 1;
    await _persistCart();
    notifyListeners();
  }

  Future<void> ensureGuestSession() async {
    if (user != null) return;
    final store = repository;
    if (store == null) throw StateError('يتطلب تشغيل خدمة المتجر');
    try {
      user = await store.signInAnonymously();
      accountError = null;
      notifyListeners();
      await refreshAccount();
      unawaited(_registerPushToken());
    } catch (error, stackTrace) {
      developer.log(
        'Unable to create an anonymous customer session',
        error: error,
        stackTrace: stackTrace,
      );
      accountError = _friendlyError(error);
      notifyListeners();
      rethrow;
    }
  }

  Future<void> linkGoogleAccount() async {
    final store = repository;
    if (store == null) throw StateError('يتطلب تشغيل خدمة المتجر');
    try {
      await store.linkGoogleIdentity();
    } catch (error, stackTrace) {
      developer.log('Google link failed', error: error, stackTrace: stackTrace);
      accountError = _friendlyError(error);
      notifyListeners();
      rethrow;
    }
    await refreshAccount();
  }

  Future<void> _registerPushToken() async {
    final store = repository;
    if (store == null || user == null) return;
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      messaging.onRegistered.listen((fid) {
        store.saveFcmToken(fid, platform: 'android').catchError((_) {});
      });
      await messaging.register();
    } catch (error, stackTrace) {
      developer.log('Push registration failed', error: error, stackTrace: stackTrace);
    }
  }

  Future<void> changeCartQuantity(String productId, int quantity) async {
    if (quantity < 0) throw ArgumentError.value(quantity, 'quantity');
    if (quantity == 0) {
      _cart.remove(productId);
    } else {
      _cart[productId] = quantity;
    }
    await _persistCart();
    notifyListeners();
  }

  Future<void> clearCart() async {
    _cart.clear();
    await _persistCart();
    notifyListeners();
  }

  Future<void> setRegion(DeliveryRegion region) async {
    selectedRegionId = region.id;
    await _preferences.setString(_regionKey, region.id);
    notifyListeners();
  }

  Future<void> completeOnboarding() async {
    final saved = await _preferences.setBool(_onboardingKey, true);
    if (!saved) throw StateError('تعذّر حفظ إعداد البداية على هذا الجهاز');
    hasSeenOnboarding = true;
    notifyListeners();
  }

  Future<void> toggleFavorite(String productId) async {
    final store = repository;
    if (store == null) throw StateError('يتطلب تشغيل خدمة المتجر');
    await store.toggleFavorite(productId);
    if (favoriteIds.add(productId)) {
      notifyListeners();
      return;
    }
    favoriteIds.remove(productId);
    notifyListeners();
  }

  void setSearchQuery(String value) {
    searchQuery = value;
    notifyListeners();
  }

  void setCategory(String? value) {
    selectedCategoryId = value;
    notifyListeners();
  }

  void setTab(int value) {
    selectedTab = value;
    notifyListeners();
  }

  Future<void> _persistCart() async {
    final saved = await _preferences.setString(_cartKey, jsonEncode(_cart));
    if (!saved) throw StateError('تعذّر حفظ سلة التسوق على هذا الجهاز');
  }

  void _restoreCart() {
    final saved = _preferences.getString(_cartKey);
    if (saved == null) return;
    try {
      final decoded = jsonDecode(saved);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Saved cart has an invalid shape');
      }
      for (final entry in decoded.entries) {
        if (entry.value is int && (entry.value as int) > 0) {
          _cart[entry.key] = entry.value as int;
        }
      }
    } on FormatException catch (error, stackTrace) {
      developer.log(
        'Saved cart data is invalid',
        error: error,
        stackTrace: stackTrace,
      );
      _cart.clear();
    }
  }

  String _friendlyError(Object error) {
    if (error is StoreApiException) return error.message;
    if (error is FormatException) {
      return 'وصلت بيانات غير مكتملة من خادم المتجر.';
    }
    if (error is StateError) return error.message;
    return 'تعذّر الاتصال بخادم المتجر. اتصل بشبكة المتجر ثم أعد المحاولة.';
  }

  @override
  void dispose() {
    repository?.dispose();
    super.dispose();
  }
}
