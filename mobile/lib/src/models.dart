class StoreUser {
  const StoreUser({
    required this.id,
    required this.role,
    this.email,
    this.name,
    this.phone,
  });

  final String id;
  final String role;
  final String? email;
  final String? name;
  final String? phone;

  factory StoreUser.fromJson(Map<String, dynamic> json) => StoreUser(
    id: json['id'] as String,
    role: json['role'] as String,
    email: json['email'] as String?,
    name: json['name'] as String?,
    phone: json['phone'] as String?,
  );

  StoreUser copyWith({String? name, String? phone}) => StoreUser(
    id: id,
    role: role,
    email: email,
    name: name ?? this.name,
    phone: phone ?? this.phone,
  );
}

class ProductCategory {
  const ProductCategory({
    required this.id,
    required this.name,
    required this.sortOrder,
  });

  final String id;
  final String name;
  final int sortOrder;

  factory ProductCategory.fromJson(Map<String, dynamic> json) =>
      ProductCategory(
        id: json['id'] as String,
        name: json['name_ar'] as String,
        sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
      );
}

class StorePromotion {
  const StorePromotion({
    required this.id,
    required this.title,
    required this.body,
    this.imageUrl,
    this.productId,
    this.startsAt,
    this.endsAt,
  });

  final String id;
  final String title;
  final String body;
  final String? imageUrl;
  final String? productId;
  final DateTime? startsAt;
  final DateTime? endsAt;

  factory StorePromotion.fromJson(Map<String, dynamic> json) => StorePromotion(
    id: json['id'] as String,
    title: json['title_ar'] as String,
    body: json['body_ar'] as String? ?? '',
    imageUrl: json['image_url'] as String?,
    productId: json['product_id'] as String?,
    startsAt: _optionalDate(json['starts_at']),
    endsAt: _optionalDate(json['ends_at']),
  );
}

DateTime? _optionalDate(Object? value) =>
    value is String ? DateTime.tryParse(value) : null;

class StoreProduct {
  const StoreProduct({
    required this.id,
    required this.name,
    required this.priceIqd,
    required this.available,
    this.categoryId,
    this.brand,
    this.description,
    this.sku,
    this.compareAtPriceIqd,
    this.imageUrls = const [],
    this.specifications = const {},
    this.compatibleModels = const [],
  });

  final String id;
  final String name;
  final int priceIqd;
  final bool available;
  final String? categoryId;
  final String? brand;
  final String? description;
  final String? sku;
  final int? compareAtPriceIqd;
  final List<String> imageUrls;
  final Map<String, dynamic> specifications;
  final List<Map<String, dynamic>> compatibleModels;

  factory StoreProduct.fromJson(Map<String, dynamic> json) => StoreProduct(
    id: json['id'] as String,
    name: json['name_ar'] as String,
    priceIqd: (json['price_iqd'] as num).toInt(),
    available: json['is_available'] as bool? ?? false,
    categoryId: json['category_id'] as String?,
    brand: json['brand'] as String?,
    description: json['description_ar'] as String?,
    sku: json['sku'] as String?,
    compareAtPriceIqd: (json['compare_at_price_iqd'] as num?)?.toInt(),
    imageUrls: (json['image_urls'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .toList(growable: false),
    specifications: Map<String, dynamic>.from(
      json['specifications'] as Map? ?? const {},
    ),
    compatibleModels: (json['compatible_models'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((entry) => Map<String, dynamic>.from(entry))
        .toList(growable: false),
  );
}

class DeliveryRegion {
  const DeliveryRegion({
    required this.id,
    required this.province,
    required this.neighborhood,
    required this.feeIqd,
  });

  final String id;
  final String province;
  final String neighborhood;
  final int feeIqd;
  String get label => '$province — $neighborhood';

  factory DeliveryRegion.fromJson(Map<String, dynamic> json) => DeliveryRegion(
    id: json['id'] as String,
    province: json['province_ar'] as String,
    neighborhood: json['neighborhood_ar'] as String,
    feeIqd: (json['delivery_fee_iqd'] as num).toInt(),
  );
}

class CustomerAddress {
  const CustomerAddress({
    required this.id,
    required this.recipientName,
    required this.phone,
    required this.regionId,
    required this.province,
    required this.neighborhood,
    required this.details,
    this.deliveryNote,
    this.isDefault = false,
  });

  final String id;
  final String recipientName;
  final String phone;
  final String regionId;
  final String province;
  final String neighborhood;
  final String details;
  final String? deliveryNote;
  final bool isDefault;

  String get label => '$province — $neighborhood، $details';

  factory CustomerAddress.fromJson(Map<String, dynamic> json) =>
      CustomerAddress(
        id: json['id'] as String,
        recipientName: json['recipient_name'] as String,
        phone: json['phone'] as String,
        regionId: json['region_id'] as String,
        province: json['province_ar'] as String,
        neighborhood: json['neighborhood_ar'] as String,
        details: json['address_details'] as String,
        deliveryNote: json['delivery_note'] as String?,
        isDefault: json['is_default'] as bool? ?? false,
      );
}

class StoreOrder {
  const StoreOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.subtotalIqd,
    required this.deliveryFeeIqd,
    required this.totalIqd,
    required this.createdAt,
  });

  final String id;
  final String orderNumber;
  final String status;
  final int subtotalIqd;
  final int deliveryFeeIqd;
  final int totalIqd;
  final DateTime createdAt;

  factory StoreOrder.fromJson(Map<String, dynamic> json) => StoreOrder(
    id: json['id'] as String,
    orderNumber: json['order_number'] as String,
    status: json['status'] as String,
    subtotalIqd: (json['subtotal_iqd'] as num).toInt(),
    deliveryFeeIqd: (json['delivery_fee_iqd'] as num).toInt(),
    totalIqd: (json['total_iqd'] as num).toInt(),
    createdAt: DateTime.parse(json['created_at'] as String),
  );
}

class CartLine {
  const CartLine({required this.product, required this.quantity});

  final StoreProduct product;
  final int quantity;
  int get totalIqd => product.priceIqd * quantity;
}

String formatIqd(int amount) {
  final digits = amount.abs().toString();
  final grouped = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) grouped.write(',');
    grouped.write(digits[i]);
  }
  return '${amount < 0 ? '-' : ''}$grouped د.ع';
}

String? validateIraqiPhone(String input) {
  final digits = input.replaceAll(RegExp(r'\D'), '');
  var national = digits.startsWith('964') ? digits.substring(3) : digits;
  if (national.startsWith('0')) national = national.substring(1);
  if (!RegExp(r'^7\d{9}$').hasMatch(national)) {
    return 'أدخل رقمًا عراقيًا من 10 أرقام يبدأ بالرقم 7';
  }
  return null;
}

String toIraqiE164(String input) {
  final digits = input.replaceAll(RegExp(r'\D'), '');
  var national = digits.startsWith('964') ? digits.substring(3) : digits;
  if (national.startsWith('0')) national = national.substring(1);
  if (!RegExp(r'^7\d{9}$').hasMatch(national)) {
    throw ArgumentError.value(input, 'input', 'رقم الهاتف العراقي غير صالح');
  }
  return '+964$national';
}
