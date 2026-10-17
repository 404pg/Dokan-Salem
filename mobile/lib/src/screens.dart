import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_state.dart';
import 'models.dart';
import 'store_repository.dart';
import 'theme.dart';

class ConfigurationScreen extends StatelessWidget {
  const ConfigurationScreen({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _brandLogo(size: 90),
                const SizedBox(height: 22),
                Text(
                  message ?? 'أكمل إعداد المتجر للبدء',
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                const Text(
                  'اربط التطبيق بخادم المتجر على شبكة المحل قبل استقبال العملاء. '
                  'لا نعرض أسعارًا أو منتجات تجريبية على أنها بيانات حقيقية.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 22),
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(18),
                    child: SelectableText(
                      'cd mobile\n'
                      'flutter run --dart-define=API_BASE_URL=http://STORE_SERVER_IP:4176',
                      textDirection: TextDirection.ltr,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'دليل الإعداد الكامل موجود في mobile/README.md. '
                  'يجب أن يكون الهاتف وخادم المتجر على شبكة Wi-Fi نفسها.',
                  style: TextStyle(color: DokanColors.muted, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class DokanHome extends StatelessWidget {
  const DokanHome({required this.state, super.key});

  final AppState state;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: state,
    builder: (context, _) {
      if (!state.isConfigured) return const ConfigurationScreen();
      if (!state.hasSeenOnboarding) return WelcomeScreen(state: state);
      const titles = [
        'دكان سليم',
        'الأقسام والبحث',
        'الصيانة',
        'طلباتي',
        'حسابي',
      ];
      return Scaffold(
        appBar: AppBar(
          titleSpacing: 16,
          title: Row(
            children: [
              _brandLogo(size: 38),
              const SizedBox(width: 10),
              Text(titles[state.selectedTab]),
            ],
          ),
          actions: [
            IconButton(
              tooltip: 'الإشعارات',
              onPressed: () =>
                  _push(context, NotificationsScreen(state: state)),
              icon: const Icon(Icons.notifications_outlined),
            ),
            IconButton(
              tooltip: 'سلة التسوق',
              onPressed: () => _push(context, CartScreen(state: state)),
              icon: Badge(
                isLabelVisible: state.cartCount > 0,
                label: Text('${state.cartCount}'),
                child: const Icon(Icons.shopping_bag_outlined),
              ),
            ),
          ],
        ),
        body: IndexedStack(
          index: state.selectedTab,
          children: [
            HomeScreen(state: state),
            CatalogScreen(state: state),
            MaintenanceScreen(state: state),
            OrdersScreen(state: state),
            AccountScreen(state: state),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: state.selectedTab,
          onDestinationSelected: state.setTab,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'الرئيسية',
            ),
            NavigationDestination(
              icon: Icon(Icons.grid_view_outlined),
              selectedIcon: Icon(Icons.grid_view),
              label: 'الأقسام',
            ),
            NavigationDestination(
              icon: Icon(Icons.build_outlined),
              selectedIcon: Icon(Icons.build),
              label: 'الصيانة',
            ),
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined),
              selectedIcon: Icon(Icons.receipt_long),
              label: 'طلباتي',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'حسابي',
            ),
          ],
        ),
      );
    },
  );
}

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({required this.state, super.key});
  final AppState state;

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  static const _pages = [
    (
      Icons.two_wheeler_outlined,
      'قطع غيار لدراجتك',
      'تصفّح المنتجات وابحث بحسب القسم أو العلامة التجارية وتحقق من التوفر.',
    ),
    (
      Icons.local_shipping_outlined,
      'توصيل واضح ومريح',
      'اختر منطقة التوصيل وراجع الرسوم والإجمالي قبل تأكيد طلبك.',
    ),
    (
      Icons.build_outlined,
      'تسوّق واطلب الصيانة',
      'قدّم طلب صيانة في الورشة أو في موقعك وتابع حالته من التطبيق.',
    ),
  ];

  final _controller = PageController();
  int _page = 0;
  bool _saving = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    setState(() => _saving = true);
    try {
      await widget.state.completeOnboarding();
    } catch (error, stackTrace) {
      _reportActionError('حفظ شاشة الترحيب', error, stackTrace);
      if (mounted) _showMessage(context, _actionErrorText(error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 10, 24, 20),
        child: Column(
          children: [
            Row(
              children: [
                _brandLogo(size: 42),
                const SizedBox(width: 10),
                const Text(
                  'دكان سليم',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                TextButton(
                  onPressed: _saving ? null : _finish,
                  child: const Text('تخطّي'),
                ),
              ],
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (value) => setState(() => _page = value),
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 190,
                        height: 190,
                        decoration: BoxDecoration(
                          color: DokanColors.orangeTint,
                          borderRadius: BorderRadius.circular(54),
                        ),
                        child: Icon(
                          page.$1,
                          size: 86,
                          color: DokanColors.orangeInk,
                        ),
                      ),
                      const SizedBox(height: 38),
                      Text(
                        page.$2,
                        style: Theme.of(context).textTheme.headlineSmall,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 10),
                      Text(page.$3, textAlign: TextAlign.center),
                    ],
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var index = 0; index < _pages.length; index++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: index == _page ? 22 : 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: index == _page
                          ? DokanColors.orange
                          : DokanColors.line,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: _saving
                  ? null
                  : _page == _pages.length - 1
                  ? _finish
                  : () => _controller.nextPage(
                      duration: const Duration(milliseconds: 220),
                      curve: Curves.easeOut,
                    ),
              child: Text(
                _saving
                    ? 'جارٍ الحفظ...'
                    : _page == _pages.length - 1
                    ? 'ابدأ التسوق'
                    : 'التالي',
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

// Temporary name-based icon mapping. Replace with a database-backed
// `categories.icon` column in a future phase (needs migration + admin field).
IconData _iconForCategory(String name) {
  switch (name) {
    case 'الزيوت والسوائل':
      return Icons.oil_barrel_outlined;
    case 'المحرك وقطع الغيار':
      return Icons.handyman_outlined;
    case 'الحركة والفرامل':
      return Icons.disc_full_outlined;
    case 'الإطارات والكهرباء والهيكل':
      return Icons.tire_repair_outlined;
    default:
      return Icons.category_outlined;
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({required this.state, super.key});
  final AppState state;

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: state.refreshCatalog,
    child: ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        _locationCard(context, state),
        const SizedBox(height: 16),
        TextField(
          readOnly: true,
          onTap: () => state.setTab(1),
          decoration: const InputDecoration(
            hintText: 'ابحث عن قطعة غيار أو منتج...',
            prefixIcon: Icon(Icons.search),
          ),
        ),
        const SizedBox(height: 16),
        _serviceBanner(context, state),
        if (state.promotions.isNotEmpty) ...[
          const SizedBox(height: 14),
          _promotionStrip(context, state),
        ],
        const SizedBox(height: 24),
        _sectionHeading(
          context,
          'الأقسام',
          action: 'عرض الكل',
          onTap: () {
            state.setCategory(null);
            state.setTab(1);
          },
        ),
        const SizedBox(height: 12),
        if (state.categories.isEmpty && !state.isCatalogLoading)
          _inlineNotice('لا توجد أقسام منشورة حاليًا'),
        if (state.categories.isNotEmpty)
          SizedBox(
            height: 108,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: state.categories.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final category = state.categories[index];
                return SizedBox(
                  width: 112,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () {
                      state.setCategory(category.id);
                      state.setTab(1);
                    },
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 12,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _iconForCategory(category.name),
                              color: DokanColors.orangeInk,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              category.name,
                              maxLines: 2,
                              textAlign: TextAlign.center,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        const SizedBox(height: 24),
        _sectionHeading(
          context,
          'منتجات المتجر',
          action: 'عرض الكل',
          onTap: () => state.setTab(1),
        ),
        const SizedBox(height: 12),
        _CatalogContent(context, state, compact: true),
        const SizedBox(height: 22),
        const _CodNotice(),
      ],
    ),
  );
}

class CatalogScreen extends StatelessWidget {
  const CatalogScreen({required this.state, super.key});
  final AppState state;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
        child: TextField(
          onChanged: state.setSearchQuery,
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: 'ابحث عن منتج أو علامة تجارية...',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: state.searchQuery.isEmpty
                ? null
                : IconButton(
                    tooltip: 'مسح البحث',
                    onPressed: () => state.setSearchQuery(''),
                    icon: const Icon(Icons.close),
                  ),
          ),
        ),
      ),
      if (state.categories.isNotEmpty)
        SizedBox(
          height: 48,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            children: [
              Padding(
                padding: const EdgeInsetsDirectional.only(end: 8),
                child: FilterChip(
                  selected: state.selectedCategoryId == null,
                  label: const Text('الكل'),
                  onSelected: (_) => state.setCategory(null),
                ),
              ),
              for (final category in state.categories)
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 8),
                  child: FilterChip(
                    selected: state.selectedCategoryId == category.id,
                    label: Text(category.name),
                    onSelected: (_) => state.setCategory(category.id),
                  ),
                ),
            ],
          ),
        ),
      Expanded(child: _CatalogContent(context, state)),
    ],
  );
}

class _CatalogContent extends StatelessWidget {
  const _CatalogContent(this.context, this.state, {this.compact = false});

  final BuildContext context;
  final AppState state;
  final bool compact;

  @override
  Widget build(BuildContext _) {
    if (state.isCatalogLoading && state.products.isEmpty) {
      return const Center(child: CircularProgressIndicator.adaptive());
    }
    if (state.catalogError case final error?) {
      return _ErrorPanel(message: error, onRetry: state.refreshCatalog);
    }
    final products = state.visibleProducts;
    if (products.isEmpty) {
      return _EmptyPanel(
        icon: Icons.inventory_2_outlined,
        title: state.products.isEmpty
            ? 'لم تُضف المنتجات بعد'
            : 'لا توجد منتجات مطابقة',
        subtitle: state.products.isEmpty
            ? 'ستظهر المنتجات هنا بعد نشرها من لوحة المتجر.'
            : 'جرّب كلمة بحث أخرى أو اختر قسمًا مختلفًا.',
        onAction: state.products.isEmpty ? state.refreshCatalog : null,
      );
    }
    final shown = compact ? products.take(4).toList() : products;
    if (compact) {
      return Column(
        children: [
          for (final product in shown)
            Padding(
              padding: const EdgeInsetsDirectional.only(bottom: 10),
              child: _ProductTile(state: state, product: product),
            ),
        ],
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 240,
        mainAxisExtent: 284,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: shown.length,
      itemBuilder: (context, index) =>
          _ProductCard(state: state, product: shown[index]),
    );
  }
}

class _ProductTile extends StatelessWidget {
  const _ProductTile({required this.state, required this.product});
  final AppState state;
  final StoreProduct product;

  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () =>
          _push(context, ProductDetailsScreen(state: state, product: product)),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            _ProductImage(url: product.imageUrls.firstOrNull, size: 70),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (product.brand case final brand?)
                    Text(brand, style: Theme.of(context).textTheme.bodySmall),
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 5),
                  Text(
                    formatIqd(product.priceIqd),
                    style: const TextStyle(
                      color: DokanColors.orangeInk,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              product.available
                  ? Icons.chevron_left
                  : Icons.remove_shopping_cart_outlined,
              color: DokanColors.muted,
            ),
          ],
        ),
      ),
    ),
  );
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.state, required this.product});
  final AppState state;
  final StoreProduct product;

  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: () =>
          _push(context, ProductDetailsScreen(state: state, product: product)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                _ProductImage(url: product.imageUrls.firstOrNull),
                PositionedDirectional(
                  top: 6,
                  end: 6,
                  child: IconButton.filledTonal(
                    tooltip: 'إضافة إلى المفضلة',
                    onPressed: () => _favorite(context, state, product),
                    icon: Icon(
                      state.favoriteIds.contains(product.id)
                          ? Icons.favorite
                          : Icons.favorite_border,
                      color: DokanColors.orangeInk,
                      size: 19,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (product.brand case final brand?)
                  Text(
                    brand,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                Text(
                  product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 5),
                Text(
                  formatIqd(product.priceIqd),
                  style: const TextStyle(
                    color: DokanColors.orangeInk,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 5),
                _Availability(available: product.available),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class ProductDetailsScreen extends StatelessWidget {
  const ProductDetailsScreen({
    required this.state,
    required this.product,
    super.key,
  });
  final AppState state;
  final StoreProduct product;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('تفاصيل المنتج'),
      actions: [
        IconButton(
          tooltip: 'المفضلة',
          onPressed: () => _favorite(context, state, product),
          icon: Icon(
            state.favoriteIds.contains(product.id)
                ? Icons.favorite
                : Icons.favorite_border,
          ),
        ),
      ],
    ),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
      children: [
        SizedBox(
          height: 230,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: _ProductImage(url: product.imageUrls.firstOrNull),
          ),
        ),
        const SizedBox(height: 18),
        if (product.brand case final brand?) Text(brand),
        const SizedBox(height: 5),
        Text(product.name, style: Theme.of(context).textTheme.headlineSmall),
        if (product.sku case final sku?) ...[
          const SizedBox(height: 6),
          Text('رقم القطعة: $sku'),
        ],
        const SizedBox(height: 12),
        Text(
          formatIqd(product.priceIqd),
          style: Theme.of(context).textTheme.headlineSmall
              ?.copyWith(color: DokanColors.orangeInk),
        ),
        const SizedBox(height: 10),
        _Availability(available: product.available),
        if (product.description case final description?
            when description.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text('الوصف', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 7),
          Text(description),
        ],
        if (product.specifications.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text(
            'المواصفات الفنية',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 7),
          Card(
            child: Column(
              children: [
                for (final spec in product.specifications.entries)
                  ListTile(
                    dense: true,
                    title: Text(spec.key),
                    trailing: Text('${spec.value}'),
                  ),
              ],
            ),
          ),
        ],
        if (product.compatibleModels.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text(
            'التوافق مع الدراجات',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 7),
          Card(
            child: Column(
              children: [
                for (final fitment in product.compatibleModels)
                  ListTile(
                    dense: true,
                    leading: const Icon(
                      Icons.check_circle_outline,
                      color: DokanColors.green,
                    ),
                    title: Text('${fitment['make']} ${fitment['model']}'),
                    subtitle:
                        fitment['year_from'] == null &&
                            fitment['year_to'] == null
                        ? null
                        : Text(
                            '${fitment['year_from'] ?? '—'} – ${fitment['year_to'] ?? '—'}',
                          ),
                  ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 18),
        const _CodNotice(),
        const SizedBox(height: 18),
        FilledButton.icon(
          onPressed: product.available
              ? () => _perform(
                  context,
                  () => state.addToCart(product),
                  success: 'أُضيف المنتج إلى السلة',
                )
              : null,
          icon: const Icon(Icons.add_shopping_cart),
          label: Text(product.available ? 'أضف إلى السلة' : 'غير متوفر'),
        ),
      ],
    ),
  );
}

class CartScreen extends StatelessWidget {
  const CartScreen({required this.state, super.key});
  final AppState state;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: state,
    builder: (context, _) {
      final lines = state.cartLines;
      return Scaffold(
        appBar: AppBar(title: const Text('سلة التسوق')),
        body: state.cartCount == 0
            ? const _EmptyPanel(
                icon: Icons.shopping_bag_outlined,
                title: 'سلتك فارغة',
                subtitle: 'تصفّح المنتجات وأضف ما تحتاجه إلى سلتك.',
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _locationCard(context, state),
                  if (state.unavailableCartCount > 0) ...[
                    const SizedBox(height: 12),
                    _inlineNotice(
                      'تعذّر العثور على ${state.unavailableCartCount} منتج في المتجر الحالي. '
                      'احذف العناصر غير المتاحة قبل متابعة الطلب.',
                      warning: true,
                    ),
                  ],
                  for (final line in lines) ...[
                    const SizedBox(height: 10),
                    _CartItem(state: state, line: line),
                  ],
                  if (lines.isEmpty && state.unavailableCartCount > 0) ...[
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: () => _perform(
                        context,
                        state.clearCart,
                        success: 'أُفرغت السلة',
                      ),
                      child: const Text('إفراغ السلة'),
                    ),
                  ],
                  const SizedBox(height: 14),
                  _PriceSummary(
                    subtotal: state.cartSubtotal,
                    deliveryFee: state.selectedRegion?.feeIqd,
                  ),
                  const SizedBox(height: 14),
                  const _CodNotice(),
                  const SizedBox(height: 18),
                  FilledButton(
                    onPressed:
                        lines.isNotEmpty &&
                            state.unavailableCartCount == 0 &&
                            lines.every((line) => line.product.available) &&
                            state.selectedRegion != null
                        ? () => _startCheckout(context, state)
                        : null,
                    child: const Text('متابعة إلى إتمام الطلب'),
                  ),
                  if (state.selectedRegion == null)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        'اختر منطقة التوصيل قبل متابعة الطلب.',
                        textAlign: TextAlign.center,
                      ),
                    ),
                ],
              ),
      );
    },
  );
}

class _CartItem extends StatelessWidget {
  const _CartItem({required this.state, required this.line});
  final AppState state;
  final CartLine line;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Row(
            children: [
              _ProductImage(url: line.product.imageUrls.firstOrNull, size: 64),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      line.product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 5),
                    Text(
                      formatIqd(line.product.priceIqd),
                      style: const TextStyle(
                        color: DokanColors.orangeInk,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    _Availability(available: line.product.available),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'حذف من السلة',
                onPressed: () => _perform(
                  context,
                  () => state.changeCartQuantity(line.product.id, 0),
                ),
                icon: const Icon(Icons.delete_outline, color: DokanColors.red),
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            children: [
              IconButton(
                tooltip: 'تقليل الكمية',
                onPressed: () => _perform(
                  context,
                  () => state.changeCartQuantity(
                    line.product.id,
                    line.quantity - 1,
                  ),
                ),
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text('${line.quantity}'),
              IconButton(
                tooltip: 'زيادة الكمية',
                onPressed: line.product.available
                    ? () => _perform(
                        context,
                        () => state.changeCartQuantity(
                          line.product.id,
                          line.quantity + 1,
                        ),
                      )
                    : null,
                icon: const Icon(Icons.add_circle_outline),
              ),
              const Spacer(),
              Text(
                formatIqd(line.totalIqd),
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({required this.state, super.key});
  final AppState state;

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late final String _idempotencyKey = _newIdempotencyKey();
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _noteController = TextEditingController();
  String? _regionId;
  bool _saving = false;
  bool _saveAddress = true;

  @override
  void initState() {
    super.initState();
    final state = widget.state;
    _nameController.text =
        state.user?.name ?? state.addresses.firstOrNull?.recipientName ?? '';
    _phoneController.text =
        (state.user?.phone ?? state.addresses.firstOrNull?.phone ?? '')
            .replaceFirst('+964', '');
    _addressController.text = state.addresses.firstOrNull?.details ?? '';
    _noteController.text = state.addresses.firstOrNull?.deliveryNote ?? '';
    _regionId =
        state.addresses.firstOrNull?.regionId ??
        state.selectedRegion?.id ??
        state.regions.firstOrNull?.id;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    final region = state.regions
        .where((item) => item.id == _regionId)
        .firstOrNull;
    return Scaffold(
      appBar: AppBar(title: const Text('إتمام الطلب')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _CheckoutStep(current: 1),
            const SizedBox(height: 14),
            Text(
              'بيانات التوصيل',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _nameController,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(labelText: 'الاسم الكامل *'),
              validator: _required,
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              textDirection: TextDirection.ltr,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9 +()-]')),
              ],
              decoration: const InputDecoration(
                labelText: 'رقم الهاتف للتواصل *',
                prefixText: '+964 ',
                helperText: 'أدخل 10 أرقام تبدأ بالرقم 7 بدون الصفر الأول.',
              ),
              validator: (value) => validateIraqiPhone(value ?? ''),
            ),
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Text(
                'لا نرسل رمز تحقق الآن؛ يُستخدم رقمك للتواصل بشأن الطلب والتوصيل.',
                style: TextStyle(color: DokanColors.muted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              initialValue: _regionId,
              decoration: const InputDecoration(
                labelText: 'المحافظة والمنطقة *',
              ),
              items: [
                for (final item in state.regions)
                  DropdownMenuItem(value: item.id, child: Text(item.label)),
              ],
              validator: (value) =>
                  value == null ? 'اختر منطقة توصيل متاحة' : null,
              onChanged: (value) => setState(() => _regionId = value),
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _addressController,
              minLines: 2,
              maxLines: 4,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'العنوان التفصيلي *',
                hintText: 'الحي، الشارع، رقم الدار، أقرب نقطة دالة',
                alignLabelWithHint: true,
              ),
              validator: _required,
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _noteController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'تعليمات التوصيل',
                hintText: 'اختياري — مثل الاتصال قبل الوصول',
              ),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _saveAddress,
              title: const Text('حفظ هذا العنوان لطلباتي القادمة'),
              onChanged: (value) =>
                  setState(() => _saveAddress = value ?? false),
            ),
            const SizedBox(height: 20),
            Text('مراجعة الطلب', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            _PriceSummary(
              subtotal: state.cartSubtotal,
              deliveryFee: region?.feeIqd,
            ),
            const SizedBox(height: 12),
            const _CodNotice(),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _saving ? null : _submit,
              child: _saving
                  ? const SizedBox.square(
                      dimension: 22,
                      child: CircularProgressIndicator.adaptive(strokeWidth: 2),
                    )
                  : const Text('تأكيد الطلب — الدفع عند الاستلام'),
            ),
          ],
        ),
      ),
    );
  }

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'هذا الحقل مطلوب' : null;

  String _newIdempotencyKey() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex = bytes
        .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
        .join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-${hex.substring(16, 20)}-'
        '${hex.substring(20)}';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final state = widget.state;
    final region = state.regions
        .where((item) => item.id == _regionId)
        .firstOrNull;
    if (region == null || state.cartLines.isEmpty) {
      _showMessage(context, 'السلة أو منطقة التوصيل غير متاحة. أعد المحاولة.');
      return;
    }
    if (state.unavailableCartCount > 0 ||
        state.cartLines.any((line) => !line.product.available)) {
      _showMessage(context, 'تحقق من توفر جميع منتجات السلة قبل تأكيد الطلب.');
      return;
    }
    setState(() => _saving = true);
    try {
      final orderNumber = await state.repository!.placeCashOrder(
        idempotencyKey: _idempotencyKey,
        customerName: _nameController.text,
        phone: toIraqiE164(_phoneController.text),
        region: region,
        addressDetails: _addressController.text,
        deliveryNote: _noteController.text,
        expectedDeliveryFeeIqd: region.feeIqd,
        lines: state.cartLines,
        saveAddress: _saveAddress,
      );
      await state.clearCart();
      await state.refreshAccount();
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          icon: const Icon(
            Icons.check_circle_outline,
            color: DokanColors.green,
            size: 42,
          ),
          title: const Text('استُلم طلبك'),
          content: Text(
            'رقم الطلب: $orderNumber\nسنتواصل معك لتأكيد الطلب. الدفع نقدًا عند الاستلام.',
          ),
          actions: [
            FilledButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).popUntil((route) => route.isFirst);
                state.setTab(3);
              },
              child: const Text('متابعة طلباتي'),
            ),
          ],
        ),
      );
    } catch (error, stackTrace) {
      _reportActionError('إنشاء الطلب', error, stackTrace);
      if (mounted) _showMessage(context, _actionErrorText(error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

class _CheckoutStep extends StatelessWidget {
  const _CheckoutStep({required this.current});
  final int current;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          for (var step = 1; step <= 3; step++) ...[
            CircleAvatar(
              radius: 15,
              backgroundColor: step <= current
                  ? DokanColors.orange
                  : DokanColors.background,
              child: Text('$step'),
            ),
            if (step < 3)
              const Expanded(child: Divider(indent: 8, endIndent: 8)),
          ],
        ],
      ),
    ),
  );
}

class _PriceSummary extends StatelessWidget {
  const _PriceSummary({required this.subtotal, required this.deliveryFee});
  final int subtotal;
  final int? deliveryFee;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          _priceRow('المجموع الفرعي', formatIqd(subtotal)),
          const SizedBox(height: 8),
          _priceRow(
            'رسوم التوصيل',
            deliveryFee == null ? 'اختر المنطقة' : formatIqd(deliveryFee!),
          ),
          const Divider(height: 22),
          _priceRow(
            'الإجمالي',
            deliveryFee == null ? '—' : formatIqd(subtotal + deliveryFee!),
            bold: true,
          ),
        ],
      ),
    ),
  );
}

class _CodNotice extends StatelessWidget {
  const _CodNotice();

  @override
  Widget build(BuildContext context) => Card(
    color: DokanColors.greenTint,
    child: const ListTile(
      leading: Icon(Icons.payments_outlined, color: DokanColors.green),
      title: Text('الدفع نقدًا عند الاستلام'),
      subtitle: Text(
        'لا توجد مدفوعات إلكترونية. تتأكد الإدارة من التوفر قبل تجهيز طلبك.',
      ),
    ),
  );
}

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({required this.state, super.key});
  final AppState state;

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: state.refreshAccount,
    child: !state.isSignedIn
        ? _GuestSessionPrompt(
            state: state,
            message: 'تعذّر بدء جلسة الزائر لعرض طلباتك.',
          )
        : state.accountError != null
        ? _ErrorPanel(
            message: state.accountError!,
            onRetry: state.refreshAccount,
          )
        : state.isAccountLoading && state.orders.isEmpty
        ? const Center(child: CircularProgressIndicator.adaptive())
        : state.orders.isEmpty
        ? const _EmptyPanel(
            icon: Icons.receipt_long_outlined,
            title: 'لا توجد طلبات بعد',
            subtitle: 'ستظهر طلباتك هنا بعد تأكيدها عند إتمام الشراء.',
          )
        : ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: state.orders.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, index) =>
                _OrderCard(state: state, order: state.orders[index]),
          ),
  );
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.state, required this.order});
  final AppState state;
  final StoreOrder order;

  @override
  Widget build(BuildContext context) {
    final status = _statusLabel(order.status);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () =>
            _push(context, OrderDetailsScreen(state: state, order: order)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.orderNumber,
                      textDirection: TextDirection.ltr,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  Chip(
                    label: Text(status),
                    visualDensity: VisualDensity.compact,
                    side: BorderSide.none,
                    backgroundColor: DokanColors.orangeTint,
                  ),
                ],
              ),
              Text(_formatDate(order.createdAt)),
              const SizedBox(height: 8),
              Text('الإجمالي: ${formatIqd(order.totalIqd)}'),
              const SizedBox(height: 4),
              const Text('الدفع نقدًا عند الاستلام'),
              if (order.status == 'pending')
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: TextButton(
                    onPressed: () => _cancelOrder(context, state, order),
                    child: const Text(
                      'إلغاء الطلب',
                      style: TextStyle(color: DokanColors.red),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class OrderDetailsScreen extends StatelessWidget {
  const OrderDetailsScreen({
    required this.state,
    required this.order,
    super.key,
  });

  final AppState state;
  final StoreOrder order;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('الطلب ${order.orderNumber}')),
    body: FutureBuilder<List<Map<String, dynamic>>>(
      future: state.repository!.fetchOrderItems(order.id),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _ErrorPanel(
            message: _actionErrorText(snapshot.error!),
            onRetry: () => Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (_) => OrderDetailsScreen(state: state, order: order),
              ),
            ),
          );
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator.adaptive());
        }
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _OrderCard(state: state, order: order),
            const SizedBox(height: 12),
            Text('حالة الطلب', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            _OrderProgress(status: order.status),
            const SizedBox(height: 16),
            Text('المنتجات', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            for (final item in snapshot.data!)
              Card(
                child: ListTile(
                  title: Text(item['product_name_ar'] as String),
                  subtitle: Text(
                    '${item['quantity']} × ${formatIqd((item['unit_price_iqd'] as num).toInt())}',
                  ),
                  trailing: Text(
                    formatIqd((item['line_total_iqd'] as num).toInt()),
                  ),
                ),
              ),
            const SizedBox(height: 10),
            _PriceSummary(
              subtotal: order.subtotalIqd,
              deliveryFee: order.deliveryFeeIqd,
            ),
          ],
        );
      },
    ),
  );
}

class _OrderProgress extends StatelessWidget {
  const _OrderProgress({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    const steps = [
      ('pending', 'بانتظار التأكيد'),
      ('confirmed', 'مؤكد'),
      ('preparing', 'قيد التجهيز'),
      ('out_for_delivery', 'في الطريق إليك'),
      ('delivered', 'تم التسليم'),
    ];
    if (status == 'cancelled') {
      return const _InfoBanner(text: 'أُلغي هذا الطلب.');
    }
    final activeIndex = steps.indexWhere((step) => step.$1 == status);
    return Card(
      child: Column(
        children: [
          for (var index = 0; index < steps.length; index++)
            ListTile(
              leading: Icon(
                index <= activeIndex
                    ? Icons.check_circle
                    : Icons.radio_button_unchecked,
                color: index <= activeIndex
                    ? DokanColors.green
                    : DokanColors.muted,
              ),
              title: Text(steps[index].$2),
              dense: true,
            ),
        ],
      ),
    );
  }
}

Future<void> _cancelOrder(
  BuildContext context,
  AppState state,
  StoreOrder order,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('إلغاء الطلب؟'),
      content: const Text(
        'يمكن إلغاء الطلب قبل أن يبدأ تجهيزه. سيُعاد المخزون إلى المتجر.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('متابعة الطلب'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, true),
          child: const Text('إلغاء الطلب'),
        ),
      ],
    ),
  );
  if (confirmed != true) return;
  try {
    await state.repository!.cancelPendingOrder(order.id);
    await state.refreshAccount();
    if (context.mounted) _showMessage(context, 'تم إلغاء الطلب');
  } catch (error, stackTrace) {
    _reportActionError('إلغاء الطلب', error, stackTrace);
    if (context.mounted) _showMessage(context, _actionErrorText(error));
  }
}

class MaintenanceScreen extends StatefulWidget {
  const MaintenanceScreen({required this.state, super.key});
  final AppState state;

  @override
  State<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen> {
  String _serviceType = 'workshop';
  String? _branchId;
  final _bikeController = TextEditingController();
  final _descriptionController = TextEditingController();
  List<Map<String, dynamic>>? _branches;
  Object? _branchError;
  bool _loadingBranches = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    unawaited(_loadBranches());
  }

  @override
  void dispose() {
    _bikeController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadBranches() async {
    setState(() {
      _loadingBranches = true;
      _branchError = null;
    });
    try {
      final result = await widget.state.repository!.fetchBranches();
      if (!mounted) return;
      setState(() {
        _branches = result;
        if (result.every((branch) => branch['id'] != _branchId)) {
          _branchId = result.firstOrNull?['id'] as String?;
        }
      });
    } catch (error, stackTrace) {
      _reportActionError('تحميل الفروع', error, stackTrace);
      if (mounted) setState(() => _branchError = error);
    } finally {
      if (mounted) setState(() => _loadingBranches = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.state.isSignedIn) {
      return _GuestSessionPrompt(
        state: widget.state,
        message: 'تعذّر بدء جلسة الزائر لإرسال طلب الصيانة ومتابعته.',
      );
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'صيانة دراجتك على أيدي مختصين',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        const Text(
          'أرسل طلبك في الورشة أو في موقعك. سنتواصل معك لمراجعة الطلب وتأكيد الموعد والتكلفة.',
        ),
        const SizedBox(height: 18),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(
              value: 'workshop',
              icon: Icon(Icons.storefront_outlined),
              label: Text('في الورشة'),
            ),
            ButtonSegment(
              value: 'onsite',
              icon: Icon(Icons.location_on_outlined),
              label: Text('في موقعي'),
            ),
          ],
          selected: {_serviceType},
          onSelectionChanged: (value) =>
              setState(() => _serviceType = value.first),
        ),
        const SizedBox(height: 14),
        if (_serviceType == 'workshop') ...[
          _branchSelector(),
          const SizedBox(height: 12),
        ] else
          const _InfoBanner(
            text: 'خدمة الموقع متاحة داخل نطاق الخدمة فقط. يؤكد المتجر التغطية والتكلفة بعد مراجعة طلبك.',
          ),
        TextField(
          controller: _bikeController,
          decoration: const InputDecoration(
            labelText: 'نوع الدراجة والموديل *',
            hintText: 'مثل هوندا CG 125',
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _descriptionController,
          minLines: 3,
          maxLines: 5,
          decoration: const InputDecoration(
            labelText: 'وصف المشكلة *',
            hintText: 'اشرح المشكلة التي لاحظتها...',
            alignLabelWithHint: true,
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () async {
            final date = await showDatePicker(
              context: context,
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 120)),
              initialDate: DateTime.now().add(const Duration(days: 1)),
            );
            if (date != null && mounted) {
              _selectedDate = DateTime(date.year, date.month, date.day);
              setState(() {});
            }
          },
          icon: const Icon(Icons.calendar_today_outlined),
          label: Text(
            _selectedDate == null
                ? 'الموعد المفضّل (اختياري)'
                : _formatDate(_selectedDate!),
          ),
        ),
        const SizedBox(height: 8),
        const _InfoBanner(
          text: 'الطلب بانتظار المراجعة وليس موعدًا مؤكدًا. سعر الصيانة يحدّد بعد فحص الدراجة، والدفع عند الاستلام.',
        ),
        if (widget.state.maintenanceRequests.isNotEmpty) ...[
          const SizedBox(height: 22),
          Text(
            'طلبات الصيانة السابقة',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          for (final request in widget.state.maintenanceRequests)
            _MaintenanceRequestCard(request: request),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const CircularProgressIndicator.adaptive()
              : const Text('إرسال طلب الصيانة'),
        ),
      ],
    );
  }

  DateTime? _selectedDate;

  Widget _branchSelector() {
    if (_loadingBranches && _branches == null) {
      return const Center(child: CircularProgressIndicator.adaptive());
    }
    if (_branchError != null) {
      return _ErrorPanel(
        message: _actionErrorText(_branchError!),
        onRetry: _loadBranches,
      );
    }
    final branches = _branches ?? [];
    if (branches.isEmpty) {
      return const _InfoBanner(
        text: 'لا توجد فروع متاحة لطلبات الورشة حاليًا.',
      );
    }
    return DropdownButtonFormField<String>(
      initialValue: _branchId,
      decoration: const InputDecoration(labelText: 'اختر الفرع *'),
      items: [
        for (final branch in branches)
          DropdownMenuItem(
            value: branch['id'] as String,
            child: Text(branch['name_ar'] as String),
          ),
      ],
      onChanged: (value) => setState(() => _branchId = value),
    );
  }

  Future<void> _submit() async {
    if (_bikeController.text.trim().isEmpty ||
        _descriptionController.text.trim().isEmpty) {
      _showMessage(context, 'أدخل نوع الدراجة ووصف المشكلة للمتابعة.');
      return;
    }
    if (_serviceType == 'workshop' && _branchId == null) {
      _showMessage(context, 'اختر فرعًا متاحًا للمتابعة.');
      return;
    }
    setState(() => _submitting = true);
    try {
      await widget.state.repository!.submitMaintenanceRequest(
        serviceType: _serviceType,
        branchId: _branchId ?? '',
        motorcycle: _bikeController.text,
        description: _descriptionController.text,
        preferredDate: _selectedDate?.toIso8601String().split('T').first,
      );
      await widget.state.refreshAccount();
      if (!mounted) return;
      _bikeController.clear();
      _descriptionController.clear();
      setState(() => _selectedDate = null);
      _showMessage(
        context,
        'وصل طلبك وهو بانتظار المراجعة. سنتواصل معك لتأكيد الموعد.',
      );
    } catch (error, stackTrace) {
      _reportActionError('إرسال طلب الصيانة', error, stackTrace);
      if (mounted) _showMessage(context, _actionErrorText(error));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _MaintenanceRequestCard extends StatelessWidget {
  const _MaintenanceRequestCard({required this.request});
  final Map<String, dynamic> request;

  @override
  Widget build(BuildContext context) {
    final service = request['service_type'] == 'workshop'
        ? 'في الورشة'
        : 'في موقعي';
    return Card(
      child: ListTile(
        leading: const Icon(Icons.build_outlined),
        title: Text(request['request_number'] as String),
        subtitle: Text(
          '$service · ${request['motorcycle']}\n'
          '${_maintenanceStatus(request['status'] as String)}',
        ),
        isThreeLine: true,
      ),
    );
  }
}

String _maintenanceStatus(String status) => switch (status) {
  'pending_review' => 'بانتظار المراجعة',
  'confirmed' => 'مؤكد',
  'in_progress' => 'قيد التنفيذ',
  'completed' => 'مكتمل',
  'cancelled' => 'ملغي',
  _ => 'قيد المراجعة',
};

class AccountScreen extends StatelessWidget {
  const AccountScreen({required this.state, super.key});
  final AppState state;

  @override
  Widget build(BuildContext context) {
    if (!state.isSignedIn) {
      return _GuestSessionPrompt(
        state: state,
        message: 'تعذّر بدء جلسة الزائر لإدارة عناوينك وطلباتك.',
      );
    }
    final identity = state.user;
    final address = state.addresses.firstOrNull;
    return RefreshIndicator(
      onRefresh: state.refreshAccount,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person_outline)),
              title: Text(
                identity?.name ?? address?.recipientName ?? 'حسابي',
              ),
              subtitle: Text(
                identity?.phone ?? address?.phone ?? 'بدون رقم هاتف',
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (state.accountError case final error?)
            _ErrorPanel(message: error, onRetry: state.refreshAccount),
          if (state.repository?.isGoogleLinked == false) ...[
            const SizedBox(height: 12),
            _LinkGoogleButton(state: state),
          ],
          _AccountItem(
            icon: Icons.location_on_outlined,
            title: 'عناويني',
            subtitle: 'إضافة وتعديل عناوين التوصيل',
            onTap: () => _push(context, AddressesScreen(state: state)),
          ),
          _AccountItem(
            icon: Icons.favorite_border,
            title: 'قائمة المفضلة',
            subtitle: 'المنتجات التي حفظتها',
            onTap: () => _push(context, FavoritesScreen(state: state)),
          ),
          _AccountItem(
            icon: Icons.two_wheeler_outlined,
            title: 'دراجاتي',
            subtitle: 'احفظ موديلاتك للتحقق من التوافق',
            onTap: () => _push(context, MotorcyclesScreen(state: state)),
          ),
          _AccountItem(
            icon: Icons.store_outlined,
            title: 'الفروع',
            subtitle: 'الفروع ومعلومات الوصول',
            onTap: () => _push(context, BranchesScreen(state: state)),
          ),
          _AccountItem(
            icon: Icons.notifications_outlined,
            title: 'الإشعارات',
            subtitle: 'تحديثات الطلبات والحساب',
            onTap: () => _push(context, NotificationsScreen(state: state)),
          ),
          _AccountItem(
            icon: Icons.help_outline,
            title: 'الدعم',
            subtitle: 'تواصل مع خدمة العملاء',
            onTap: () => _push(context, SupportScreen(state: state)),
          ),
          const SizedBox(height: 14),
          const _CodNotice(),
        ],
      ),
    );
  }
}

class MotorcyclesScreen extends StatefulWidget {
  const MotorcyclesScreen({required this.state, super.key});
  final AppState state;

  @override
  State<MotorcyclesScreen> createState() => _MotorcyclesScreenState();
}

class _MotorcyclesScreenState extends State<MotorcyclesScreen> {
  bool _saving = false;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('دراجاتي'),
      actions: [
        IconButton(
          tooltip: 'إضافة دراجة',
          onPressed: _saving ? null : _addMotorcycle,
          icon: const Icon(Icons.add),
        ),
      ],
    ),
    body: AnimatedBuilder(
      animation: widget.state,
      builder: (context, _) => widget.state.motorcycles.isEmpty
          ? _EmptyPanel(
              icon: Icons.two_wheeler_outlined,
              title: 'لم تُضف دراجة بعد',
              subtitle: 'احفظ نوع دراجتك لتسهيل التحقق من توافق المنتجات.',
              actionLabel: 'إضافة دراجة',
              onAction: _saving ? null : _addMotorcycle,
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: widget.state.motorcycles.length,
              separatorBuilder: (_, _) => const SizedBox(height: 9),
              itemBuilder: (context, index) {
                final bike = widget.state.motorcycles[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.two_wheeler_outlined),
                    title: Text(
                      (bike['nickname'] as String).isEmpty
                          ? '${bike['make']} ${bike['model']}'
                          : bike['nickname'] as String,
                    ),
                    subtitle: Text(
                      '${bike['make']} ${bike['model']}'
                      '${bike['year'] == null ? '' : ' · ${bike['year']}'}',
                    ),
                    trailing: IconButton(
                      tooltip: 'حذف الدراجة',
                      onPressed: _saving
                          ? null
                          : () => _run(
                              () => widget.state.repository!.deleteMotorcycle(
                                bike['id'] as String,
                              ),
                            ),
                      icon: const Icon(Icons.delete_outline),
                    ),
                  ),
                );
              },
            ),
    ),
  );

  Future<void> _addMotorcycle() async {
    final form = GlobalKey<FormState>();
    final make = TextEditingController();
    final model = TextEditingController();
    final year = TextEditingController();
    final nickname = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إضافة دراجة'),
        content: Form(
          key: form,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: make,
                  decoration: const InputDecoration(labelText: 'الشركة'),
                  validator: _requiredText,
                ),
                const SizedBox(height: 9),
                TextFormField(
                  controller: model,
                  decoration: const InputDecoration(labelText: 'الموديل'),
                  validator: _requiredText,
                ),
                const SizedBox(height: 9),
                TextFormField(
                  controller: year,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(labelText: 'سنة الصنع'),
                ),
                const SizedBox(height: 9),
                TextFormField(
                  controller: nickname,
                  decoration: const InputDecoration(
                    labelText: 'اسم اختياري للدراجة',
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () {
              if (form.currentState!.validate()) {
                Navigator.pop(context, true);
              }
            },
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
    try {
      if (saved == true && mounted) {
        final yearValue = int.tryParse(year.text);
        if (year.text.isNotEmpty &&
            (yearValue == null || yearValue < 1900 || yearValue > 2200)) {
          _showMessage(context, 'أدخل سنة صحيحة بين 1900 و2200.');
          return;
        }
        await _run(
          () => widget.state.repository!.saveMotorcycle(
            make: make.text,
            model: model.text,
            year: yearValue,
            nickname: nickname.text,
          ),
        );
      }
    } finally {
      make.dispose();
      model.dispose();
      year.dispose();
      nickname.dispose();
    }
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _saving = true);
    try {
      await action();
      await widget.state.refreshAccount();
    } catch (error, stackTrace) {
      _reportActionError('تحديث الدراجات المحفوظة', error, stackTrace);
      if (mounted) _showMessage(context, _actionErrorText(error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

class AddressesScreen extends StatelessWidget {
  const AddressesScreen({required this.state, super.key});
  final AppState state;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: state,
    builder: (context, _) => Scaffold(
      appBar: AppBar(
        title: const Text('عناويني'),
        actions: [
          IconButton(
            tooltip: 'إضافة عنوان',
            onPressed: () => _editAddress(context, state),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: state.addresses.isEmpty
          ? _EmptyPanel(
              icon: Icons.location_on_outlined,
              title: 'لا توجد عناوين محفوظة',
              subtitle: 'أضف عنوانًا لتسهيل إتمام طلبك القادم.',
              actionLabel: 'إضافة عنوان',
              onAction: () => _editAddress(context, state),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.addresses.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final address = state.addresses[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.location_on_outlined),
                    title: Text(address.recipientName),
                    subtitle: Text(
                      '${address.label}\n${address.phone}',
                      maxLines: 3,
                    ),
                    isThreeLine: true,
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) async {
                        if (value == 'edit') {
                          await _editAddress(context, state, address: address);
                        } else if (value == 'delete') {
                          await _deleteAddress(context, state, address);
                        }
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'edit', child: Text('تعديل')),
                        PopupMenuItem(value: 'delete', child: Text('حذف')),
                      ],
                    ),
                  ),
                );
              },
            ),
    ),
  );
}

Future<void> _editAddress(
  BuildContext context,
  AppState state, {
  CustomerAddress? address,
}) async {
  final form = GlobalKey<FormState>();
  final name = TextEditingController(text: address?.recipientName ?? '');
  final phone = TextEditingController(
    text: address?.phone.replaceFirst('+964', '') ?? '',
  );
  final details = TextEditingController(text: address?.details ?? '');
  final note = TextEditingController(text: address?.deliveryNote ?? '');
  String? regionId = address?.regionId ?? state.selectedRegion?.id;
  var isDefault = address?.isDefault ?? state.addresses.isEmpty;
  final saved = await showDialog<bool>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setDialogState) => AlertDialog(
        title: Text(address == null ? 'إضافة عنوان' : 'تعديل العنوان'),
        content: SizedBox(
          width: 420,
          child: Form(
            key: form,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: name,
                    decoration: const InputDecoration(
                      labelText: 'الاسم الكامل',
                    ),
                    validator: _requiredText,
                  ),
                  const SizedBox(height: 9),
                  TextFormField(
                    controller: phone,
                    keyboardType: TextInputType.phone,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9 +()-]')),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'رقم الهاتف العراقي',
                      prefixText: '+964 ',
                    ),
                    validator: (value) => validateIraqiPhone(value ?? ''),
                  ),
                  const SizedBox(height: 9),
                  DropdownButtonFormField<String>(
                    initialValue: regionId,
                    decoration: const InputDecoration(
                      labelText: 'المحافظة / المنطقة',
                    ),
                    items: [
                      for (final region in state.regions)
                        DropdownMenuItem(
                          value: region.id,
                          child: Text(region.label),
                        ),
                    ],
                    validator: (value) =>
                        value == null ? 'اختر منطقة التوصيل' : null,
                    onChanged: (value) =>
                        setDialogState(() => regionId = value),
                  ),
                  const SizedBox(height: 9),
                  TextFormField(
                    controller: details,
                    minLines: 2,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'العنوان التفصيلي',
                    ),
                    validator: _requiredText,
                  ),
                  const SizedBox(height: 9),
                  TextFormField(
                    controller: note,
                    decoration: const InputDecoration(
                      labelText: 'تعليمات التوصيل (اختياري)',
                    ),
                  ),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    value: isDefault,
                    title: const Text('العنوان الافتراضي'),
                    onChanged: (value) =>
                        setDialogState(() => isDefault = value ?? false),
                  ),
                ],
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () {
              if (form.currentState!.validate()) {
                Navigator.pop(context, true);
              }
            },
            child: const Text('حفظ العنوان'),
          ),
        ],
      ),
    ),
  );
  if (saved == true && context.mounted) {
    try {
      final region = state.regions.firstWhere((item) => item.id == regionId);
      await state.repository!.saveAddress(
        recipientName: name.text,
        phone: toIraqiE164(phone.text),
        region: region,
        details: details.text,
        deliveryNote: note.text,
        addressId: address?.id,
        isDefault: isDefault,
      );
      await state.refreshAccount();
      if (context.mounted) _showMessage(context, 'تم حفظ العنوان');
    } catch (error, stackTrace) {
      _reportActionError('حفظ العنوان', error, stackTrace);
      if (context.mounted) _showMessage(context, _actionErrorText(error));
    }
  }
  name.dispose();
  phone.dispose();
  details.dispose();
  note.dispose();
}

Future<void> _deleteAddress(
  BuildContext context,
  AppState state,
  CustomerAddress address,
) async {
  final confirm = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('حذف العنوان؟'),
      content: Text('سيُحذف العنوان «${address.label}».'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('إلغاء'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, true),
          child: const Text('حذف'),
        ),
      ],
    ),
  );
  if (confirm != true) return;
  try {
    await state.repository!.deleteAddress(address.id);
    await state.refreshAccount();
    if (context.mounted) _showMessage(context, 'تم حذف العنوان');
  } catch (error, stackTrace) {
    _reportActionError('حذف العنوان', error, stackTrace);
    if (context.mounted) _showMessage(context, _actionErrorText(error));
  }
}

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({required this.state, super.key});
  final AppState state;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('قائمة المفضلة')),
    body: AnimatedBuilder(
      animation: state,
      builder: (context, _) {
        final favoriteProducts = state.products
            .where((product) => state.favoriteIds.contains(product.id))
            .toList(growable: false);
        if (favoriteProducts.isEmpty) {
          return const _EmptyPanel(
            icon: Icons.favorite_border,
            title: 'قائمتك فارغة',
            subtitle: 'احفظ المنتجات التي تريد الرجوع إليها لاحقًا.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: favoriteProducts.length,
          separatorBuilder: (_, _) => const SizedBox(height: 9),
          itemBuilder: (context, index) =>
              _ProductTile(state: state, product: favoriteProducts[index]),
        );
      },
    ),
  );
}

class BranchesScreen extends StatelessWidget {
  const BranchesScreen({required this.state, super.key});
  final AppState state;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('فروعنا')),
    body: FutureBuilder<List<Map<String, dynamic>>>(
      future: state.repository!.fetchBranches(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _ErrorPanel(
            message: _actionErrorText(snapshot.error!),
            onRetry: () => Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => BranchesScreen(state: state)),
            ),
          );
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator.adaptive());
        }
        if (snapshot.data!.isEmpty) {
          return const _EmptyPanel(
            icon: Icons.store_outlined,
            title: 'لا توجد فروع منشورة',
            subtitle: 'ستظهر معلومات الفروع هنا عند تفعيلها.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: snapshot.data!.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final branch = snapshot.data![index];
            return Card(
              child: ListTile(
                leading: const Icon(Icons.storefront_outlined),
                title: Text(branch['name_ar'] as String),
                subtitle: Text(branch['address_ar'] as String? ?? ''),
                isThreeLine: false,
              ),
            );
          },
        );
      },
    ),
  );
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({required this.state, super.key});
  final AppState state;

  Future<List<Map<String, dynamic>>> _fetch() async {
    if (!state.isSignedIn) return [];
    return state.repository!.fetchNotifications();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('الإشعارات')),
    body: !state.isSignedIn
        ? _GuestSessionPrompt(
            state: state,
            message: 'تعذّر بدء جلسة الزائر لعرض تحديثات طلباتك.',
          )
        : FutureBuilder<List<Map<String, dynamic>>>(
            future: _fetch(),
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return _ErrorPanel(
                  message: _actionErrorText(snapshot.error!),
                  onRetry: () => Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) => NotificationsScreen(state: state),
                    ),
                  ),
                );
              }
              if (!snapshot.hasData) {
                return const Center(
                  child: CircularProgressIndicator.adaptive(),
                );
              }
              final notifications = snapshot.data!;
              if (notifications.isEmpty) {
                return const _EmptyPanel(
                  icon: Icons.notifications_none,
                  title: 'لا توجد إشعارات',
                  subtitle: 'ستظهر تحديثات الطلبات وطلبات الصيانة هنا.',
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: notifications.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final item = notifications[index];
                  return Card(
                    child: ListTile(
                      leading: Icon(
                        item['is_read'] == true
                            ? Icons.notifications_none
                            : Icons.notifications_active_outlined,
                        color: DokanColors.orangeInk,
                      ),
                      title: Text(item['title_ar'] as String),
                      subtitle: Text(item['body_ar'] as String),
                      onTap: item['is_read'] == true
                          ? null
                          : () => _markNotificationRead(
                              context,
                              item['id'] as String,
                            ),
                    ),
                  );
                },
              );
            },
          ),
  );

  Future<void> _markNotificationRead(
    BuildContext context,
    String notificationId,
  ) async {
    try {
      await state.repository!.markNotificationRead(notificationId);
      if (context.mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => NotificationsScreen(state: state)),
        );
      }
    } catch (error, stackTrace) {
      _reportActionError('تحديث الإشعار', error, stackTrace);
      if (context.mounted) _showMessage(context, _actionErrorText(error));
    }
  }
}

class SupportScreen extends StatelessWidget {
  const SupportScreen({required this.state, super.key});
  final AppState state;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('الدعم والمساعدة')),
    body: FutureBuilder<String?>(
      future: state.repository!.fetchSupportPhone(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _ErrorPanel(
            message: _actionErrorText(snapshot.error!),
            onRetry: () => Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => SupportScreen(state: state)),
            ),
          );
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator.adaptive());
        }
        final phone = snapshot.data;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const _InfoBanner(
              text: 'للاستفسار عن التوفر أو التوصيل أو الصيانة، تواصل مع فريق المتجر خلال ساعات العمل.',
            ),
            const SizedBox(height: 16),
            if (phone == null || phone.isEmpty)
              const _EmptyPanel(
                icon: Icons.support_agent_outlined,
                title: 'بيانات الدعم غير مكتملة',
                subtitle: 'سيظهر رقم التواصل هنا بعد إضافته في إعدادات المتجر.',
              )
            else
              Card(
                child: ListTile(
                  leading: const Icon(Icons.phone_outlined),
                  title: const Text('خدمة العملاء'),
                  subtitle: Text(phone, textDirection: TextDirection.ltr),
                ),
              ),
          ],
        );
      },
    ),
  );
}

class _GuestSessionPrompt extends StatefulWidget {
  const _GuestSessionPrompt({required this.state, required this.message});
  final AppState state;
  final String message;

  @override
  State<_GuestSessionPrompt> createState() => _GuestSessionPromptState();
}

class _GuestSessionPromptState extends State<_GuestSessionPrompt> {
  bool _loading = false;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.lock_outline, size: 42, color: DokanColors.muted),
          const SizedBox(height: 14),
          Text(widget.message, textAlign: TextAlign.center),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _loading ? null : _retry,
            child: Text(_loading ? 'جارٍ الاتصال…' : 'إعادة المحاولة'),
          ),
        ],
      ),
    ),
  );

  Future<void> _retry() async {
    setState(() => _loading = true);
    try {
      await widget.state.ensureGuestSession();
    } catch (error, stackTrace) {
      _reportActionError('بدء جلسة الزائر', error, stackTrace);
      if (mounted) _showMessage(context, _actionErrorText(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class _ProductImage extends StatelessWidget {
  const _ProductImage({this.url, this.size});
  final String? url;
  final double? size;

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(
      width: size,
      height: size,
      color: const Color(0xFFECE8EE),
      alignment: Alignment.center,
      child: const Icon(
        Icons.inventory_2_outlined,
        size: 34,
        color: DokanColors.charcoal,
      ),
    );
    if (url == null || url!.isEmpty || Uri.tryParse(url!)?.isAbsolute != true) {
      return placeholder;
    }
    return Image.network(
      url!,
      width: size,
      height: size,
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => placeholder,
      loadingBuilder: (context, child, progress) => progress == null
          ? child
          : SizedBox(
              width: size,
              height: size,
              child: const Center(
                child: CircularProgressIndicator.adaptive(strokeWidth: 2),
              ),
            ),
    );
  }
}

class _Availability extends StatelessWidget {
  const _Availability({required this.available});
  final bool available;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(
        available ? Icons.check_circle : Icons.info_outline,
        color: available ? DokanColors.green : DokanColors.muted,
        size: 15,
      ),
      const SizedBox(width: 4),
      Text(
        available ? 'متوفر' : 'غير متوفر حاليًا',
        style: TextStyle(
          color: available ? DokanColors.green : DokanColors.muted,
          fontSize: 12,
        ),
      ),
    ],
  );
}

class _LinkGoogleButton extends StatefulWidget {
  const _LinkGoogleButton({required this.state});
  final AppState state;

  @override
  State<_LinkGoogleButton> createState() => _LinkGoogleButtonState();
}

class _LinkGoogleButtonState extends State<_LinkGoogleButton> {
  bool _busy = false;

  Future<void> _link() async {
    setState(() => _busy = true);
    try {
      await widget.state.linkGoogleAccount();
      if (mounted) _showMessage(context, 'تم ربط الحساب بحساب Google بنجاح');
    } catch (error, stackTrace) {
      _reportActionError('ربط حساب Google', error, stackTrace);
      if (mounted) _showMessage(context, _actionErrorText(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    height: 48,
    child: FilledButton.icon(
      onPressed: _busy ? null : _link,
      icon: _busy
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(Icons.g_mobiledata),
      label: const Text('ربط الحساب بحساب Google'),
    ),
  );
}

class _AccountItem extends StatelessWidget {
  const _AccountItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      leading: Icon(icon, color: DokanColors.orangeInk),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_left),
      onTap: onTap,
    ),
  );
}

class _EmptyPanel extends StatelessWidget {
  const _EmptyPanel({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 42, color: DokanColors.muted),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 5),
          Text(subtitle, textAlign: TextAlign.center),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 14),
            OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    ),
  );
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({required this.message, required this.onRetry});
  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.cloud_off_outlined,
            size: 40,
            color: DokanColors.red,
          ),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 14),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    ),
  );
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) => Card(
    color: DokanColors.orangeTint,
    child: Padding(
      padding: const EdgeInsets.all(13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: DokanColors.orangeInk),
          const SizedBox(width: 9),
          Expanded(child: Text(text)),
        ],
      ),
    ),
  );
}

Widget _brandLogo({double size = 48}) => ClipRRect(
  borderRadius: BorderRadius.circular(size * .22),
  child: Image.asset(
    'assets/images/dokan_logo.jpg',
    width: size,
    height: size,
    fit: BoxFit.cover,
    errorBuilder: (_, _, _) => Container(
      width: size,
      height: size,
      color: DokanColors.onyx,
      alignment: Alignment.center,
      child: const Text(
        'د',
        style: TextStyle(
          color: Colors.white,
          fontSize: 26,
          fontWeight: FontWeight.bold,
        ),
      ),
    ),
  ),
);

Widget _locationCard(BuildContext context, AppState state) => Card(
  child: InkWell(
    borderRadius: BorderRadius.circular(14),
    onTap: () => _chooseRegion(context, state),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          const Icon(Icons.location_on_outlined, color: DokanColors.orangeInk),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'التوصيل إلى',
                  style: TextStyle(color: DokanColors.muted, fontSize: 12),
                ),
                Text(
                  state.selectedRegion?.label ?? 'اختر منطقة التوصيل',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
          const Text(
            'تغيير',
            style: TextStyle(
              color: DokanColors.orangeInk,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_left),
        ],
      ),
    ),
  ),
);

Future<void> _chooseRegion(BuildContext context, AppState state) async {
  if (state.regions.isEmpty) {
    _showMessage(context, 'لا توجد مناطق توصيل متاحة حاليًا.');
    return;
  }
  final selected = await showModalBottomSheet<DeliveryRegion>(
    context: context,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: ListView(
        shrinkWrap: true,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
            child: Text(
              'اختر منطقة التوصيل',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
          for (final region in state.regions)
            ListTile(
              leading: const Icon(Icons.location_on_outlined),
              title: Text(region.label),
              subtitle: Text('رسوم التوصيل: ${formatIqd(region.feeIqd)}'),
              trailing: region.id == state.selectedRegionId
                  ? const Icon(Icons.check, color: DokanColors.green)
                  : null,
              onTap: () => Navigator.pop(context, region),
            ),
        ],
      ),
    ),
  );
  if (selected != null) {
    try {
      await state.setRegion(selected);
    } catch (error, stackTrace) {
      _reportActionError('اختيار منطقة التوصيل', error, stackTrace);
      if (context.mounted) _showMessage(context, _actionErrorText(error));
    }
  }
}

Widget _serviceBanner(BuildContext context, AppState state) => Card(
  color: DokanColors.onyx,
  child: Padding(
    padding: const EdgeInsets.all(18),
    child: Row(
      children: [
        Icon(
          Icons.build_circle_outlined,
          color: DokanColors.orange,
          size: 38,
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'صيانة دراجتك',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'في الورشة أو في موقعك',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'اطلب صيانة',
          onPressed: () => state.setTab(2),
          color: DokanColors.orange,
          icon: const Icon(Icons.arrow_forward),
        ),
      ],
    ),
  ),
);

Widget _promotionStrip(BuildContext context, AppState state) => SizedBox(
  height: 158,
  child: PageView.builder(
    itemCount: state.promotions.length,
    itemBuilder: (context, index) {
      final promotion = state.promotions[index];
      final product = state.products
          .where((item) => item.id == promotion.productId)
          .firstOrNull;
      return Card(
        clipBehavior: Clip.antiAlias,
        color: DokanColors.orangeTint,
        child: InkWell(
          onTap: product == null
              ? null
              : () => _push(
                  context,
                  ProductDetailsScreen(state: state, product: product),
                ),
          child: Stack(
            children: [
              if (promotion.imageUrl != null && promotion.imageUrl!.isNotEmpty)
                PositionedDirectional(
                  top: 0,
                  bottom: 0,
                  end: 0,
                  child: SizedBox(
                    width: 116,
                    child: Image.network(
                      promotion.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const SizedBox.shrink(),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(15),
                child: Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: SizedBox(
                    width: promotion.imageUrl == null ? double.infinity : null,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 240),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'عرض من المتجر',
                            style: TextStyle(
                              color: DokanColors.orangeInk,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            promotion.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          if (promotion.body.isNotEmpty) ...[
                            const SizedBox(height: 3),
                            Text(
                              promotion.body,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                          PromotionCountdown(
                            startsAt: promotion.startsAt,
                            endsAt: promotion.endsAt,
                          ),
                          if (product != null)
                            const Padding(
                              padding: EdgeInsets.only(top: 5),
                              child: Text(
                                'تسوّق العرض ←',
                                style: TextStyle(
                                  color: DokanColors.orangeInk,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  ),
);

// TODO(phase-a2): the "يبدأ خلال" branch is currently unreachable because
// fetchPromotions() filters out promotions whose starts_at is in the future.
// Kept for when that visibility filter is revisited.
class PromotionCountdown extends StatefulWidget {
  const PromotionCountdown({super.key, this.startsAt, this.endsAt});

  final DateTime? startsAt;
  final DateTime? endsAt;

  @override
  State<PromotionCountdown> createState() => _PromotionCountdownState();
}

class _PromotionCountdownState extends State<PromotionCountdown> {
  Timer? _timer;
  Duration _remaining = Duration.zero;
  bool _countingToStart = false;

  @override
  void initState() {
    super.initState();
    _compute();
    if (widget.startsAt != null || widget.endsAt != null) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(_compute);
      });
    }
  }

  void _compute() {
    final now = DateTime.now();
    final starts = widget.startsAt;
    final ends = widget.endsAt;
    if (starts != null && starts.isAfter(now)) {
      _countingToStart = true;
      _remaining = starts.difference(now);
    } else if (ends != null) {
      _countingToStart = false;
      _remaining = ends.difference(now);
    } else {
      _remaining = Duration.zero;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  // Singular forms on purpose: the value ticks every second, so full Arabic
  // pluralization would flash between forms.
  static String _format(Duration d) {
    final days = d.inDays;
    final hours = d.inHours % 24;
    final minutes = d.inMinutes % 60;
    final seconds = d.inSeconds % 60;
    final parts = <String>[];
    if (days > 0) parts.add('$days يوم');
    if (days > 0 || hours > 0) parts.add('$hours ساعة');
    if (days > 0 || hours > 0 || minutes > 0) parts.add('$minutes دقيقة');
    parts.add('$seconds ثانية');
    return parts.join('، ');
  }

  @override
  Widget build(BuildContext context) {
    if (widget.startsAt == null && widget.endsAt == null) {
      return const SizedBox.shrink();
    }
    if (_remaining.isNegative) {
      return const SizedBox.shrink();
    }
    final prefix = _countingToStart ? 'يبدأ خلال:' : 'ينتهي خلال:';
    return Padding(
      padding: const EdgeInsets.only(top: 5),
      child: Text(
        '$prefix ${_format(_remaining)}',
        style: const TextStyle(color: DokanColors.orangeInk, fontSize: 11),
      ),
    );
  }
}

Widget _sectionHeading(
  BuildContext context,
  String title, {
  String? action,
  VoidCallback? onTap,
}) => Row(
  children: [
    Expanded(child: Text(title, style: Theme.of(context).textTheme.titleLarge)),
    if (action != null) TextButton(onPressed: onTap, child: Text(action)),
  ],
);

Widget _inlineNotice(String message, {bool warning = false}) => Card(
  color: warning ? DokanColors.orangeTint : DokanColors.surface,
  child: Padding(padding: const EdgeInsets.all(13), child: Text(message)),
);

Widget _priceRow(String label, String value, {bool bold = false}) => Row(
  children: [
    Expanded(
      child: Text(
        label,
        style: TextStyle(
          color: bold ? DokanColors.onyx : DokanColors.muted,
          fontWeight: bold ? FontWeight.w700 : FontWeight.normal,
        ),
      ),
    ),
    Text(
      value,
      style: TextStyle(fontWeight: bold ? FontWeight.w700 : FontWeight.w500),
    ),
  ],
);

String? _requiredText(String? value) =>
    value == null || value.trim().isEmpty ? 'هذا الحقل مطلوب' : null;

Future<void> _favorite(
  BuildContext context,
  AppState state,
  StoreProduct product,
) async {
  if (!state.isSignedIn) {
    try {
      await state.ensureGuestSession();
    } catch (error, stackTrace) {
      _reportActionError('بدء جلسة الزائر', error, stackTrace);
      if (context.mounted) _showMessage(context, _actionErrorText(error));
      return;
    }
  }
  try {
    await state.toggleFavorite(product.id);
    if (context.mounted) {
      _showMessage(
        context,
        state.favoriteIds.contains(product.id)
            ? 'أُضيف المنتج إلى المفضلة'
            : 'أُزيل المنتج من المفضلة',
      );
    }
  } catch (error, stackTrace) {
    _reportActionError('تحديث المفضلة', error, stackTrace);
    if (context.mounted) _showMessage(context, _actionErrorText(error));
  }
}

Future<void> _startCheckout(BuildContext context, AppState state) async {
  if (!state.isSignedIn) {
    try {
      await state.ensureGuestSession();
    } catch (error, stackTrace) {
      _reportActionError('بدء جلسة الزائر', error, stackTrace);
      if (context.mounted) _showMessage(context, _actionErrorText(error));
      return;
    }
  }
  if (!context.mounted) return;
  await _push(context, CheckoutScreen(state: state));
}

Future<void> _push(BuildContext context, Widget screen) =>
    Navigator.of(context)
        .push<void>(MaterialPageRoute<void>(builder: (_) => screen));

Future<void> _perform(
  BuildContext context,
  Future<void> Function() action, {
  String? success,
}) async {
  try {
    await action();
    if (success != null && context.mounted) _showMessage(context, success);
  } catch (error, stackTrace) {
    _reportActionError('إجراء التطبيق', error, stackTrace);
    if (context.mounted) _showMessage(context, _actionErrorText(error));
  }
}

void _showMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

void _reportActionError(String action, Object error, StackTrace stackTrace) {
  developerLog('دكان سليم: فشل $action', error, stackTrace);
}

void developerLog(String message, Object error, StackTrace stackTrace) {
  debugPrint('$message: $error\n$stackTrace');
}

String _actionErrorText(Object error) {
  if (error is StoreApiException) return error.message;
  if (error is StateError || error is ArgumentError) return error.toString();
  return 'تعذّر الاتصال بخادم المتجر. اتصل بشبكة المتجر ثم أعد المحاولة.';
}

String _statusLabel(String status) => switch (status) {
  'pending' => 'بانتظار التأكيد',
  'confirmed' => 'مؤكد',
  'preparing' => 'قيد التجهيز',
  'out_for_delivery' => 'في الطريق إليك',
  'delivered' => 'تم التسليم',
  'cancelled' => 'ملغي',
  _ => 'قيد المراجعة',
};

String _formatDate(DateTime date) =>
    '${date.year}/${date.month.toString().padLeft(2, '0')}/${date.day.toString().padLeft(2, '0')}';
