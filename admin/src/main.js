import './style.css';
import { createStoreData, publicImageUrl as sharedPublicImageUrl } from './data/store-data.js';
import { csvToObjects, buildProductsTemplateCsv, validateProductRow, normalizeProductRecord } from './csv-import.js';

const appConfig = {
  backend: (import.meta.env.VITE_DATA_BACKEND || 'api').trim().toLowerCase(),
  apiUrl: import.meta.env.VITE_DOKAN_API_URL?.trim(),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim(),
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
};

let storeData = null;
let storeDataError = null;
try {
  storeData = createStoreData({
    backend: appConfig.backend,
    apiUrl: appConfig.apiUrl,
    supabaseUrl: appConfig.supabaseUrl,
    supabaseAnonKey: appConfig.supabaseAnonKey,
    onUnauthorized: () => {
      clearSession();
      loginView.hidden = false;
      adminView.hidden = true;
    },
  });
} catch (error) {
  storeDataError = error;
}

const labels = {
  dashboard: 'الرئيسية',
  orders: 'الطلبات',
  products: 'المنتجات',
  categories: 'الأقسام',
  compatibility: 'توافق المنتجات',
  inventory: 'المخزون',
  regions: 'مناطق التوصيل',
  branches: 'الفروع',
  promotions: 'العروض',
  maintenance: 'طلبات الصيانة',
  customers: 'العملاء',
  reports: 'التقارير',
  settings: 'إعدادات المتجر',
};
const statuses = {
  pending: 'بانتظار التأكيد',
  confirmed: 'مؤكد',
  preparing: 'قيد التجهيز',
  out_for_delivery: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  pending_review: 'بانتظار المراجعة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
};
// Quick actions shown per current order status. Targets MUST be allowed by
// public.validate_order_status_transition (store_core.sql:308).
const orderActions = {
  pending: [
    { to: 'confirmed', label: 'تأكيد', className: 'primary small' },
    { to: 'cancelled', label: 'إلغاء', className: 'danger small' },
  ],
  confirmed: [
    { to: 'preparing', label: 'بدء التجهيز', className: 'primary small' },
    { to: 'cancelled', label: 'إلغاء', className: 'danger small' },
  ],
  preparing: [
    { to: 'out_for_delivery', label: 'إرسال مع مندوب', className: 'primary small' },
    { to: 'cancelled', label: 'إلغاء', className: 'danger small' },
  ],
  out_for_delivery: [
    { to: 'delivered', label: 'تم التسليم', className: 'primary small' },
    { to: 'cancelled', label: 'فشل التوصيل', className: 'danger small' },
  ],
};
const maintenanceTransitions = {
  pending_review: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
};
const nav = document.querySelector('#navigation');
const page = document.querySelector('#page-content');
const notice = document.querySelector('#notice');
const loginView = document.querySelector('#login-view');
const adminView = document.querySelector('#admin-view');
const loginError = document.querySelector('#login-error');
const editor = document.querySelector('#editor');
const editorForm = document.querySelector('#editor-form');
const tokenKey = 'dokan.admin.token.v1';
const userKey = 'dokan.admin.user.v1';
let token = sessionStorage.getItem(tokenKey);
let currentUser;
let activePage = 'dashboard';
let messageTimer;
try {
  currentUser = JSON.parse(sessionStorage.getItem(userKey) || 'null');
} catch {
  sessionStorage.removeItem(userKey);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('ar-IQ')} د.ع`;
}

function publicImageUrl(value) {
  return sharedPublicImageUrl(value, {
    apiUrl: appConfig.backend === 'supabase' ? null : appConfig.apiUrl,
  });
}

function showNotice(message, error = false) {
  clearTimeout(messageTimer);
  notice.textContent = message;
  notice.className = message ? `notice ${error ? 'error' : 'success'}` : '';
  if (message) messageTimer = setTimeout(() => { notice.textContent = ''; }, 5000);
}

function showLoginError(message, error = true) {
  loginError.textContent = message;
  loginError.className = `message ${error ? 'error' : 'success'}`;
}

function clearSession() {
  token = null;
  currentUser = null;
  sessionStorage.removeItem(tokenKey);
  sessionStorage.removeItem(userKey);
}

function saveSession(session) {
  token = session.token;
  currentUser = session.user;
  sessionStorage.setItem(tokenKey, token);
  sessionStorage.setItem(userKey, JSON.stringify(currentUser));
}

async function apiRequest(path, { method = 'GET', body, authenticated = true } = {}) {
  if (!appConfig.apiUrl) {
    throw new Error('أضف عنوان خادم المتجر في admin/.env.local ثم أعد تشغيل لوحة الإدارة.');
  }
  const url = new URL(path.replace(/^\/+/, ''), `${appConfig.apiUrl.replace(/\/+$/, '')}/`);
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authenticated && token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let result = null;
  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error('أرسل خادم المتجر استجابة غير صالحة.');
    }
  }
  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      clearSession();
      adminView.hidden = true;
      loginView.hidden = false;
    }
    throw new Error(result?.error || 'تعذّر إكمال الطلب.');
  }
  return result;
}

function renderNavigation() {
  nav.innerHTML = Object.entries(labels).map(([key, label]) => `
    <button class="nav-item ${activePage === key ? 'selected' : ''}" data-page="${key}">
      <span>${escapeHtml(label)}</span>
    </button>`).join('');
  nav.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => loadPage(button.dataset.page));
  });
}

async function showAdmin(user) {
  try {
    await storeData.summary();
    document.querySelector('#admin-email').textContent = user.email || '';
    loginView.hidden = true;
    adminView.hidden = false;
    await loadPage(activePage);
  } catch (error) {
    showLoginError(error.message || 'تعذر التحقق من صلاحية المدير.');
    clearSession();
    loginView.hidden = false;
    adminView.hidden = true;
  }
}

function createTable(columns, rows, actions = '') {
  if (!rows.length) return '<div class="empty">لا توجد بيانات لعرضها.</div>';
  const head = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${column.render ? column.render(row) : escapeHtml(row[column.key])}</td>`).join('')}${actions ? `<td>${actions(row)}</td>` : ''}</tr>`).join('');
  return `<div class="table-wrap"><table><thead><tr>${head}${actions ? '<th>إجراء</th>' : ''}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function truncate(value, max) {
  const text = (value == null ? '' : String(value)).replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function pageHeader(description, action = '') {
  return `<div class="page-heading"><p>${escapeHtml(description)}</p>${action}</div>`;
}

async function loadPage(key) {
  activePage = key;
  renderNavigation();
  document.querySelector('#page-title').textContent = labels[key];
  page.innerHTML = '<div class="loading">جارٍ تحميل البيانات…</div>';
  try {
    const output = await pageRenderers[key]();
    page.innerHTML = output;
    bindPageActions();
  } catch (error) {
    page.innerHTML = `<div class="error-panel"><strong>تعذر تحميل البيانات</strong><p>${escapeHtml(error.message || 'حدث خطأ غير متوقع.')}</p><button class="quiet" data-retry>إعادة المحاولة</button></div>`;
    page.querySelector('[data-retry]').addEventListener('click', () => loadPage(key));
  }
}

async function fetchRows(table, columns, options = {}) {
  const rows = await storeData.list(table, columns, options);
  if (table !== 'products') return rows;
  return rows.map((row) => ({
    ...row,
    image_urls: typeof row.image_urls === 'string' ? JSON.parse(row.image_urls || '[]') : (row.image_urls || []),
    specifications: typeof row.specifications === 'string' ? JSON.parse(row.specifications || '{}') : (row.specifications || {}),
  }));
}

async function dashboard() {
  const [summary, orders] = await Promise.all([
    storeData.summary(),
    fetchRows('orders', 'order_number,customer_name,status,total_iqd', { order: 'created_at', ascending: false, limit: 5 }),
  ]);
  return `<div class="stats-grid">
    <article class="stat-card"><span>كل الطلبات</span><strong>${summary.order_count ?? 0}</strong></article>
    <article class="stat-card"><span>المنتجات</span><strong>${summary.product_count ?? 0}</strong></article>
    <article class="stat-card"><span>طلبات صيانة مفتوحة</span><strong>${summary.open_maintenance_count ?? 0}</strong></article>
    <article class="stat-card"><span>مبيعات أحدث الطلبات المسلّمة</span><strong>${formatMoney(summary.recent_delivered_revenue_iqd)}</strong></article>
  </div>${pageHeader('آخر الطلبات المسجلة في المتجر.', '<button class="quiet" data-go="orders">عرض الطلبات</button>')}
  ${createTable([
    { key: 'order_number', label: 'رقم الطلب' },
    { key: 'customer_name', label: 'العميل' },
    { key: 'status', label: 'الحالة', render: (row) => escapeHtml(statuses[row.status] || row.status) },
    { key: 'total_iqd', label: 'الإجمالي', render: (row) => formatMoney(row.total_iqd) },
  ], orders)}`;
}

function statusBadge(status) {
  return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(statuses[status] || status)}</span>`;
}

const TRASH_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></svg>';
const ARCHIVE_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"/></svg>';

const editBtn = (table, id) => `<button class="quiet small" data-edit="${table}" data-id="${escapeHtml(id)}">تعديل</button>`;
const trashBtn = (attr, id, label = 'حذف') => `<button class="icon-btn danger" data-${attr}="${escapeHtml(id)}" aria-label="${label}" title="${label}">${TRASH_SVG}</button>`;
const archiveBtn = (id) => `<button class="icon-btn danger" data-archive-product="${escapeHtml(id)}" aria-label="أرشفة" title="أرشفة">${ARCHIVE_SVG}</button>`;

function orderActionButtons(row) {
  const actions = orderActions[row.status];
  if (!actions || !actions.length) return '<span class="muted">—</span>';
  return actions
    .map((a) => `<button class="${a.className}" data-order-action="${escapeHtml(row.id)}" data-to="${a.to}">${escapeHtml(a.label)}</button>`)
    .join(' ');
}

async function ordersPage() {
  const rows = await fetchRows('orders', 'id,order_number,customer_name,phone,status,total_iqd,province_ar,neighborhood_ar,created_at', { order: 'created_at', ascending: false, limit: 200 });
  return `${pageHeader('راجع طلبات الدفع عند الاستلام وحدّث حالتها.', '<button class="danger" data-clear-orders>مسح كل الطلبات</button>')}<div class="table-wrap"><table><thead><tr><th>الطلب</th><th>العميل</th><th>الهاتف</th><th>المنطقة</th><th>الإجمالي</th><th>الحالة</th><th>الإجراء</th><th>التفاصيل</th><th></th></tr></thead><tbody>${rows.map((row) => `<tr>
    <td>${escapeHtml(row.order_number)}<small>${new Date(row.created_at).toLocaleString('ar-IQ')}</small></td>
    <td>${escapeHtml(row.customer_name)}</td><td><a href="tel:${escapeHtml(row.phone)}">${escapeHtml(row.phone)}</a></td>
    <td>${escapeHtml(row.province_ar)}، ${escapeHtml(row.neighborhood_ar)}</td><td>${formatMoney(row.total_iqd)}</td>
    <td>${statusBadge(row.status)}</td>
    <td>${orderActionButtons(row)}</td>
    <td><button class="quiet small" data-order-details="${escapeHtml(row.id)}">عرض</button></td>
    <td>${trashBtn('delete-order', row.id)}</td>
  </tr>`).join('')}</tbody></table></div>`;
}

async function productsPage() {
  const [rows, categories] = await Promise.all([
    fetchRows('products', 'id,name_ar,brand,sku,price_iqd,is_active', { order: 'created_at', ascending: false, limit: 500 }),
    fetchRows('categories', 'id,name_ar', { order: 'sort_order' }),
  ]);
  const actions = `<div class="csv-toolbar">
    <button class="primary" data-create="products">إضافة منتج</button>
    <button class="quiet small" data-download-template>تنزيل قالب CSV</button>
    <button class="quiet small" data-import-csv>استيراد من CSV</button>
    <input type="file" accept=".csv,text/csv" data-csv-file hidden>
  </div>`;
  return `${pageHeader('أضف قطع الغيار وحدّث الأسعار والوصف والصور.', actions)}<div class="csv-panel" data-csv-panel hidden></div>${createTable([
    { key: 'name_ar', label: 'المنتج', render: (row) => `${escapeHtml(row.name_ar)}<small>${escapeHtml(row.brand || '')} ${escapeHtml(row.sku || '')}</small>` },
    { key: 'price_iqd', label: 'السعر', render: (row) => formatMoney(row.price_iqd) },
    { key: 'is_active', label: 'النشر', render: (row) => row.is_active ? 'منشور' : 'مسودة' },
  ], rows, (row) => `${editBtn('products', row.id)} ${archiveBtn(row.id)}`)}${renderEditorData('products', { products: categories })}`;
}

function renderCsvSummary({ inserted, failed, rowErrors, batchError }) {
  const batch = batchError ? `<p class="csv-batch-error">تعذر الإدراج الجماعي: ${escapeHtml(batchError)}</p>` : '';
  const errors = rowErrors.length
    ? `<ul class="csv-errors">${rowErrors.map((message) => `<li>${escapeHtml(message).split('\n').join('<br>')}</li>`).join('')}</ul>`
    : '';
  return `<div class="csv-summary"><strong>نتيجة الاستيراد</strong><p>تم الاستيراد: ${inserted} — فشل: ${failed}</p>${batch}${errors}</div>`;
}

function downloadProductsTemplate() {
  const blob = new Blob([buildProductsTemplateCsv()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'products-template.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function runCsvImport(file) {
  const panel = page.querySelector('[data-csv-panel]');
  const setPanel = (html) => {
    if (!panel) return;
    panel.hidden = false;
    panel.innerHTML = html;
  };
  setPanel('<div class="loading">جارٍ قراءة الملف…</div>');

  const text = await file.text();
  const records = csvToObjects(text);
  if (!records.length) {
    setPanel('<div class="error-panel"><p>الملف فارغ أو لا يحتوي صفوفاً صالحة.</p></div>');
    return;
  }

  const [categories, branches] = await Promise.all([
    fetchRows('categories', 'id,name_ar,sort_order', { order: 'sort_order' }),
    fetchRows('branches', 'id,name_ar,is_active'),
  ]);
  const branchMap = new Map(branches.filter((branch) => branch.is_active).map((branch) => [branch.name_ar, branch.id]));

  const stamp = Date.now();
  const valid = [];
  const rowErrors = [];
  records.forEach((record, index) => {
    const result = validateProductRow(record, { categories, branchMap, rowNumber: index + 2 });
    if (result.ok) valid.push(normalizeProductRecord(result.data, `TMP-${stamp}-${index + 1}`));
    else rowErrors.push(...result.errors);
  });

  if (!valid.length) {
    setPanel(renderCsvSummary({ inserted: 0, failed: records.length, rowErrors, batchError: '' }));
    return;
  }

  let insertedRows = [];
  let batchError = '';
  try {
    insertedRows = await storeData.createMany('products', valid.map(({ _stocks, ...row }) => row), 'id,sku');
  } catch (error) {
    batchError = error.message || '';
    for (const row of valid) {
      const { _stocks, ...payload } = row;
      try {
        insertedRows.push(await storeData.createReturning('products', payload, 'id,sku'));
      } catch (rowError) {
        rowErrors.push(`«${row.name_ar}»: ${rowError.message}`);
      }
    }
  }

  if (insertedRows.length) {
    const bySku = new Map(insertedRows.map((row) => [row.sku, row.id]));
    const inventory = [];
    valid.forEach((row) => {
      const productId = bySku.get(row.sku);
      if (!productId) return;
      (row._stocks || []).forEach((stock) => inventory.push({ product_id: productId, branch_id: stock.branch_id, quantity_on_hand: stock.quantity_on_hand }));
    });
    if (inventory.length) {
      try {
        await storeData.createMany('branch_inventory', inventory, 'product_id,branch_id');
      } catch (error) {
        rowErrors.push(`تعذر حفظ كميات الفروع: ${error.message}`);
      }
    }
  }

  const inserted = insertedRows.length;
  setPanel(renderCsvSummary({ inserted, failed: records.length - inserted, rowErrors, batchError }));
  if (inserted) showNotice(`تم استيراد ${inserted} منتج.`);
  await loadPage(activePage);
}

async function categoriesPage() {
  const rows = await fetchRows('categories', 'id,name_ar,sort_order,is_active', { order: 'sort_order' });
  return `${pageHeader('نظّم المنتجات ضمن أقسام المتجر.', '<button class="primary" data-create="categories">إضافة قسم</button>')}${createTable([
    { key: 'name_ar', label: 'اسم القسم' },
    { key: 'sort_order', label: 'الترتيب' },
    { key: 'is_active', label: 'الحالة', render: (row) => row.is_active ? 'نشط' : 'متوقف' },
  ], rows, (row) => `${editBtn('categories', row.id)} ${trashBtn('delete-category', row.id)}`)}`;
}

async function compatibilityPage() {
  const [rows, products] = await Promise.all([
    fetchRows('product_compatibility', 'id,product_id,make,model,year_from,year_to,products(name_ar)', { order: 'make', limit: 500 }),
    fetchRows('products', 'id,name_ar', { order: 'name_ar' }),
  ]);
  return `${pageHeader('اربط قطع الغيار بالمصنّع والطراز وسنوات الصنع.', '<button class="primary" data-create="product_compatibility">إضافة توافق</button>')}${createTable([
    { key: 'product_id', label: 'المنتج', render: (row) => escapeHtml(row.products?.name_ar || 'منتج محذوف') },
    { key: 'make', label: 'المصنّع' },
    { key: 'model', label: 'الطراز' },
    { key: 'year_from', label: 'سنوات الصنع', render: (row) => `${escapeHtml(row.year_from || 'كل السنوات')} – ${escapeHtml(row.year_to || 'حتى الآن')}` },
  ], rows, (row) => `<button class="quiet small" data-edit="product_compatibility" data-id="${escapeHtml(row.id)}">تعديل</button> <button class="icon-btn danger" data-delete="product_compatibility" data-id="${escapeHtml(row.id)}" aria-label="حذف" title="حذف"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></svg></button>`)}${renderEditorData('product_compatibility', { products })}`;
}

async function regionsPage() {
  const rows = await fetchRows('delivery_regions', 'id,province_ar,neighborhood_ar,delivery_fee_iqd,is_active', { order: 'province_ar' });
  return `${pageHeader('أدر المحافظات والأحياء ورسوم التوصيل بالدينار.', '<button class="primary" data-create="delivery_regions">إضافة منطقة</button>')}${createTable([
    { key: 'province_ar', label: 'المحافظة' },
    { key: 'neighborhood_ar', label: 'الحي' },
    { key: 'delivery_fee_iqd', label: 'رسوم التوصيل', render: (row) => formatMoney(row.delivery_fee_iqd) },
    { key: 'is_active', label: 'الحالة', render: (row) => row.is_active ? 'نشط' : 'متوقف' },
  ], rows, (row) => `${editBtn('delivery_regions', row.id)} ${trashBtn('delete-region', row.id)}`)}`;
}

async function branchesPage() {
  const rows = await fetchRows('branches', 'id,name_ar,address_ar,phone,is_active', { order: 'sort_order' });
  return `${pageHeader('أدر مواقع الفروع وأرقام التواصل.', '<button class="primary" data-create="branches">إضافة فرع</button>')}${createTable([
    { key: 'name_ar', label: 'الفرع' },
    { key: 'address_ar', label: 'العنوان' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'is_active', label: 'الحالة', render: (row) => row.is_active ? 'نشط' : 'متوقف' },
  ], rows, (row) => `${editBtn('branches', row.id)} ${trashBtn('delete-branch', row.id)}`)}`;
}

async function inventoryPage() {
  const [rows, products, branches] = await Promise.all([
    fetchRows('branch_inventory', 'branch_id,product_id,quantity_on_hand,products(name_ar),branches(name_ar)', { order: 'updated_at', ascending: false, limit: 500 }),
    fetchRows('products', 'id,name_ar', { order: 'name_ar' }),
    fetchRows('branches', 'id,name_ar', { order: 'sort_order' }),
  ]);
  return `${pageHeader('حدّث الكمية المتاحة لكل منتج في كل فرع.', '<button class="primary" data-create="branch_inventory">إضافة مخزون</button>')}${createTable([
    { key: 'product', label: 'المنتج', render: (row) => escapeHtml(row.products?.name_ar || 'منتج محذوف') },
    { key: 'branch', label: 'الفرع', render: (row) => escapeHtml(row.branches?.name_ar || 'فرع محذوف') },
    { key: 'quantity_on_hand', label: 'الكمية' },
  ], rows, (row) => `${editBtn('branch_inventory', `${row.branch_id}|${row.product_id}`)} ${trashBtn('delete-inventory', `${row.branch_id}|${row.product_id}`)}`)}
  ${renderEditorData('branch_inventory', { products, branches })}`;
}

async function promotionsPage() {
  const rows = await fetchRows('promotions', 'id,title_ar,body_ar,image_url,product_id,starts_at,ends_at,is_active,sort_order', { order: 'sort_order' });
  const products = await fetchRows('products', 'id,name_ar', { order: 'name_ar' });
  return `${pageHeader('أدر العروض التي تظهر للعملاء في التطبيق.', '<button class="primary" data-create="promotions">إضافة عرض</button>')}${createTable([
    { key: 'title_ar', label: 'العرض' },
    { key: 'is_active', label: 'الحالة', render: (row) => row.is_active ? 'نشط' : 'مسودة' },
    { key: 'starts_at', label: 'يبدأ', render: (row) => row.starts_at ? new Date(row.starts_at).toLocaleDateString('ar-IQ') : 'دائم' },
    { key: 'ends_at', label: 'ينتهي', render: (row) => row.ends_at ? new Date(row.ends_at).toLocaleDateString('ar-IQ') : 'دائم' },
  ], rows, (row) => `${editBtn('promotions', row.id)} ${trashBtn('delete-promotion', row.id)}`)}
  ${renderEditorData('promotions', { products })}`;
}

async function maintenancePage() {
  const rows = await fetchRows('maintenance_requests', 'id,request_number,customer_id,service_type,branch_id,motorcycle,description,preferred_date,status,created_at', { order: 'created_at', ascending: false, limit: 300 });
  return `${pageHeader('راجع مواعيد الصيانة وغيّر الحالة لإرسال تحديث للعميل.')}<div class="table-wrap"><table><thead><tr><th>الطلب</th><th>الخدمة</th><th>المركبة والوصف</th><th>الموعد</th><th>الحالة</th></tr></thead><tbody>${rows.map((row) => `<tr>
    <td>${escapeHtml(row.request_number)}<small>${escapeHtml(row.customer_id)}</small></td>
    <td>${row.service_type === 'workshop' ? 'ورشة' : 'ميداني'}</td><td>${escapeHtml(row.motorcycle)}<small>${escapeHtml(row.description)}</small></td>
    <td>${escapeHtml(row.preferred_date || 'غير محدد')}</td><td><select data-maintenance-status="${escapeHtml(row.id)}">${[row.status, ...(maintenanceTransitions[row.status] || [])].map((value) => `<option value="${value}" ${row.status === value ? 'selected' : ''}>${escapeHtml(statuses[value] || value)}</option>`).join('')}</select></td>
  </tr>`).join('')}</tbody></table></div>`;
}

async function customersPage() {
  const rows = await storeData.customers();
  const archiveButton = (row) => (appConfig.backend === 'supabase'
    ? `<button class="icon-btn danger" data-archive-customer="${escapeHtml(row.id)}" aria-label="أرشفة" title="أرشفة"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"/></svg></button>`
    : '');
  return `${pageHeader('حسابات العملاء المسجّلة في المتجر.')}${createTable([
    { key: 'full_name',  label: 'العميل',        render: (row) => escapeHtml(truncate(row.full_name, 30) || 'بدون اسم') },
    { key: 'phone',      label: 'الهاتف',        render: (row) => escapeHtml(row.phone || 'بدون رقم') },
    { key: 'address',    label: 'العنوان',       render: (row) => escapeHtml(truncate(row.address, 40) || '—') },
    { key: 'motorcycle', label: 'الدراجة',       render: (row) => escapeHtml(truncate(row.motorcycle, 30) || '—') },
    { key: 'role',       label: 'الدور',         render: (row) => escapeHtml(row.role === 'admin' ? 'مدير' : 'عميل') },
    { key: 'created_at', label: 'تاريخ التسجيل', render: (row) => new Date(row.created_at).toLocaleDateString('ar-IQ') },
  ], rows, archiveButton)}`;
}

async function reportsPage() {
  const rows = await fetchRows('orders', 'status,total_iqd,created_at', { order: 'created_at', ascending: false, limit: 1000 });
  const totals = rows.reduce((result, row) => {
    result[row.status] = (result[row.status] || 0) + 1;
    if (row.status === 'delivered') result.revenue += Number(row.total_iqd);
    return result;
  }, { revenue: 0 });
  return `${pageHeader('ملخص الطلبات والإيرادات المحصلة للطلبات المسلّمة (آخر 1000 طلب).')}
    <div class="stats-grid"><article class="stat-card"><span>عدد الطلبات</span><strong>${rows.length}</strong></article>
    <article class="stat-card"><span>إيراد الطلبات المسلّمة</span><strong>${formatMoney(totals.revenue)}</strong></article>
    ${Object.entries(statuses).filter(([key]) => totals[key]).map(([key,label]) => `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${totals[key]}</strong></article>`).join('')}</div>`;
}

async function settingsPage() {
  const rows = await fetchRows('store_settings', 'id,store_name_ar,support_phone');
  const settings = rows[0] || { id: 1, store_name_ar: 'دكان سليم', support_phone: '' };
  return `${pageHeader('اسم المتجر ورقم هاتف الدعم الظاهر للعملاء.', '<button class="primary" data-edit="store_settings" data-id="1">تعديل الإعدادات</button>')}
    <div class="settings-card"><p><span>اسم المتجر</span><strong>${escapeHtml(settings.store_name_ar)}</strong></p><p><span>هاتف الدعم</span><strong>${escapeHtml(settings.support_phone || 'غير محدد')}</strong></p></div>`;
}

const pageRenderers = {
  dashboard, orders: ordersPage, products: productsPage, categories: categoriesPage,
  compatibility: compatibilityPage,
  inventory: inventoryPage, regions: regionsPage, branches: branchesPage,
  promotions: promotionsPage, maintenance: maintenancePage, customers: customersPage,
  reports: reportsPage, settings: settingsPage,
};

function renderEditorData(key, data) {
  page.dataset.editorData = JSON.stringify({ [key]: data });
  return '';
}

function field(name, label, value = '', type = 'text', required = false) {
  const safeValue = escapeHtml(value ?? '');
  if (type === 'checkbox') return `<label class="check-field"><input name="${name}" type="checkbox" ${value ? 'checked' : ''} /><span>${escapeHtml(label)}</span></label>`;
  if (type === 'textarea') return `<label>${escapeHtml(label)}<textarea name="${name}" ${required ? 'required' : ''}>${safeValue}</textarea></label>`;
  const min = name === 'price_iqd' ? 1 : ['year_from', 'year_to'].includes(name) ? 1900 : 0;
  const max = ['year_from', 'year_to'].includes(name) ? 'max="2200"' : '';
  return `<label>${escapeHtml(label)}<input name="${name}" type="${type}" value="${safeValue}" ${required ? 'required' : ''} ${type === 'number' ? `min="${min}" step="1" ${max}` : ''} /></label>`;
}

function imageUploaderField(urls, { single = false, fieldName = 'image_urls' } = {}) {
  // Normalize input: accept array, JSON string, or comma-separated string.
  let list = [];
  if (Array.isArray(urls)) {
    list = urls.filter(Boolean);
  } else if (typeof urls === 'string' && urls.trim()) {
    try {
      const parsed = JSON.parse(urls);
      list = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      list = urls.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  const items = list.map((url) => {
    const display = /^https?:\/\//.test(url)
      ? url
      : `${(appConfig.apiUrl || '').replace(/\/+$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
    return `<li class="image-item" data-url="${escapeHtml(url)}">
      <img src="${escapeHtml(display)}" alt="" loading="lazy" />
      <button type="button" class="image-remove" data-remove-image="${escapeHtml(url)}" aria-label="حذف الصورة">×</button>
    </li>`;
  }).join('');
  return `<div class="image-field" data-image-field>
    <span class="image-field-label">صور المنتج</span>
    <input type="hidden" name="${fieldName}" value="${escapeHtml(single ? (list[0] || '') : list.join(', '))}" data-image-input data-single="${single ? '1' : '0'}" />
    <ul class="image-list" data-image-list>${items}</ul>
    <label class="image-add">
      <input type="file" accept="image/png,image/jpeg,image/webp" data-image-file hidden />
      <span>+ إضافة صورة (PNG / JPG / WebP، أقل من 5 MB)</span>
    </label>
    <p class="image-status" data-image-status></p>
  </div>`;
}



const SPEC_SUGGESTIONS = ['المادة', 'بلد المنشأ', 'الموقع', 'مقاومة الحرارة', 'اللون', 'الوزن', 'السعة', 'نوع الوقود'];

// Nested detection — any value that is a non-null object/array.
function specHasNestedValues(specs) {
  return Object.values(specs).some((value) => value !== null && typeof value === 'object');
}

function specRowHtml(key = '', value = '') {
  return `<div class="spec-row" data-spec-row>
    <input type="text" class="spec-key" placeholder="اسم المواصفة" value="${escapeHtml(key ?? '')}" />
    <input type="text" class="spec-value" placeholder="القيمة" value="${escapeHtml(value ?? '')}" />
    <button type="button" class="spec-remove" data-spec-remove aria-label="حذف">×</button>
  </div>`;
}

function specificationsEditorField(specsObject) {
  const specs = (specsObject && typeof specsObject === 'object' && !Array.isArray(specsObject)) ? specsObject : {};
  const entries = Object.entries(specs);
  const hasNested = specHasNestedValues(specs);
  const rows = hasNested ? '' : entries.map(([key, value]) => specRowHtml(key, value)).join('');
  const hiddenJson = hasNested ? escapeHtml(JSON.stringify(specs)) : '';
  const suggestions = SPEC_SUGGESTIONS
    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
    .join('');
  const jsonView = hasNested
    ? `<textarea class="spec-json-view" readonly disabled>${escapeHtml(JSON.stringify(specs, null, 2))}</textarea>`
    : '';
  return `<div class="spec-field" data-spec-field>
    <span class="spec-field-label">المواصفات (اختياري)</span>
    <input type="hidden" name="specifications_json" value="${hiddenJson}" data-spec-json />
    <p class="spec-warning" data-spec-warning ${hasNested ? '' : 'hidden'}>تنبيه: المواصفات الحالية تحتوي على بنية متداخلة. لم يتم تعديلها.</p>
    <div class="spec-editor" data-spec-editor ${hasNested ? 'hidden' : ''}>${rows}</div>
    ${jsonView}
    <button type="button" class="spec-clear" data-spec-clear ${hasNested ? '' : 'hidden'}>مسح المواصفات المتداخلة</button>
    <div class="spec-actions" data-spec-actions ${hasNested ? 'hidden' : ''}>
      <button type="button" class="spec-add" data-spec-add>+ إضافة مواصفة</button>
      <select class="spec-suggest" data-spec-suggest>
        <option value="">اقتراح مواصفة…</option>
        ${suggestions}
      </select>
    </div>
  </div>`;
}

function selectField(name, label, options, value = '', required = true) {
  return `<label>${escapeHtml(label)}<select name="${name}" ${required ? 'required' : ''}><option value="">اختر…</option>${options.map((option) => `<option value="${escapeHtml(option.id)}" ${option.id === value ? 'selected' : ''}>${escapeHtml(option.name_ar)}</option>`).join('')}</select></label>`;
}

async function openEditor(table, id = null) {
  const editorData = JSON.parse(page.dataset.editorData || '{}')[table] || {};
  let row = {};
  if (id) row = await storeData.get(table, id);
  const formFields = {
    categories: () => `${field('name_ar','اسم القسم',row.name_ar,'text',true)}${field('sort_order','الترتيب',row.sort_order ?? 0,'number',true)}${field('is_active','نشط',row.is_active ?? true,'checkbox')}`,
    products: () => `${selectField('category_id','القسم',editorData.products || [],row.category_id || '',false)}${field('name_ar','اسم المنتج',row.name_ar,'text',true)}${field('brand','العلامة التجارية',row.brand)}${field('sku','رمز المنتج (SKU)',row.sku)}${field('price_iqd','السعر بالدينار',row.price_iqd,'number',true)}${field('compare_at_price_iqd','السعر قبل الخصم (اختياري)',row.compare_at_price_iqd,'number')}${field('description_ar','الوصف',row.description_ar,'textarea')}${imageUploaderField(row.image_urls || [])}${specificationsEditorField(row.specifications || {})}${field('is_active','نشر المنتج',row.is_active ?? false,'checkbox')}`,
    product_compatibility: () => `${selectField('product_id','المنتج',editorData.products || [],row.product_id || '')}${field('make','المصنّع',row.make,'text',true)}${field('model','الطراز',row.model,'text',true)}${field('year_from','من سنة (اختياري)',row.year_from,'number')}${field('year_to','إلى سنة (اختياري)',row.year_to,'number')}`,
    branches: () => `${field('name_ar','اسم الفرع',row.name_ar,'text',true)}${field('address_ar','العنوان',row.address_ar,'text',true)}${field('phone','الهاتف',row.phone)}${field('sort_order','الترتيب',row.sort_order ?? 0,'number',true)}${field('is_active','نشط',row.is_active ?? true,'checkbox')}`,
    delivery_regions: () => `${field('province_ar','المحافظة',row.province_ar,'text',true)}${field('neighborhood_ar','الحي',row.neighborhood_ar,'text',true)}${field('delivery_fee_iqd','رسوم التوصيل بالدينار',row.delivery_fee_iqd,'number',true)}${field('is_active','متاحة للتوصيل',row.is_active ?? true,'checkbox')}`,
    branch_inventory: () => `${selectField('branch_id','الفرع',editorData.branches || [],row.branch_id || '')}${selectField('product_id','المنتج',editorData.products || [],row.product_id || '')}${field('quantity_on_hand','الكمية المتوفرة',row.quantity_on_hand ?? 0,'number',true)}`,
    promotions: () => `${field('title_ar','عنوان العرض',row.title_ar,'text',true)}${field('body_ar','وصف العرض',row.body_ar,'textarea')}${selectField('product_id','منتج مرتبط (اختياري)',editorData.products || [],row.product_id || '',false)}${imageUploaderField(row.image_url ? [row.image_url] : [], { single: true, fieldName: 'image_url' })}${field('starts_at','وقت البداية (ISO، اختياري)',row.starts_at ? new Date(row.starts_at).toISOString().slice(0,16) : '','datetime-local')}${field('ends_at','وقت الانتهاء (ISO، اختياري)',row.ends_at ? new Date(row.ends_at).toISOString().slice(0,16) : '','datetime-local')}${field('sort_order','الترتيب',row.sort_order ?? 0,'number',true)}${field('is_active','تفعيل العرض',row.is_active ?? false,'checkbox')}`,
    store_settings: () => `${field('store_name_ar','اسم المتجر',row.store_name_ar,'text',true)}${field('support_phone','هاتف الدعم',row.support_phone)}`,
  };
  const titles = { categories:'قسم', products:'منتج', product_compatibility:'توافق', branches:'فرع', delivery_regions:'منطقة توصيل', branch_inventory:'مخزون', promotions:'عرض', store_settings:'إعدادات المتجر' };
  if (!formFields[table]) throw new Error('هذا السجل لا يدعم التعديل.');
  document.querySelector('#editor-title').textContent = `${id ? 'تعديل' : 'إضافة'} ${titles[table]}`;
  document.querySelector('#editor-fields').innerHTML = formFields[table]();
  document.querySelector('#save-record').hidden = false;
  document.querySelector('.dialog-actions').hidden = false;
  document.querySelector('#editor-error').textContent = '';
  editorForm.dataset.table = table;
  editorForm.dataset.id = id || '';
  editor.showModal();
}

async function showOrderDetails(orderId) {
  const { order, items: itemRows } = await storeData.orderDetails(orderId);
  document.querySelector('#editor-title').textContent = `تفاصيل الطلب ${order.order_number}`;
  document.querySelector('#editor-fields').innerHTML = `
    <div class="settings-card">
      <p><span>العميل</span><strong>${escapeHtml(order.customer_name)}</strong></p>
      <p><span>الهاتف</span><strong>${escapeHtml(order.phone)}</strong></p>
      <p><span>العنوان</span><strong>${escapeHtml(`${order.province_ar}، ${order.neighborhood_ar}، ${order.address_details}`)}</strong></p>
      <p><span>تعليمات التوصيل</span><strong>${escapeHtml(order.delivery_note || 'لا توجد')}</strong></p>
      <p><span>الدفع</span><strong>نقدًا عند الاستلام</strong></p>
    </div>
    ${createTable([
      { key: 'product_name_ar', label: 'المنتج' },
      { key: 'sku', label: 'SKU' },
      { key: 'quantity', label: 'الكمية' },
      { key: 'unit_price_iqd', label: 'سعر الوحدة', render: (row) => formatMoney(row.unit_price_iqd) },
      { key: 'line_total_iqd', label: 'الإجمالي', render: (row) => formatMoney(row.line_total_iqd) },
      { key: 'branch', label: 'الفرع', render: (row) => escapeHtml(row.branch_name || '—') },
    ], itemRows)}
    <div class="settings-card">
      <p><span>المجموع الفرعي</span><strong>${formatMoney(order.subtotal_iqd)}</strong></p>
      <p><span>التوصيل</span><strong>${formatMoney(order.delivery_fee_iqd)}</strong></p>
      <p><span>الإجمالي</span><strong>${formatMoney(order.total_iqd)}</strong></p>
    </div>`;
  document.querySelector('#save-record').hidden = true;
  document.querySelector('.dialog-actions').hidden = true;
  editorForm.dataset.table = '';
  editor.showModal();
}

function getEditorValues(table) {
  const form = new FormData(editorForm);
  const values = Object.fromEntries(form.entries());
  if (table === 'categories') return { name_ar: values.name_ar.trim(), sort_order: Number(values.sort_order), is_active: form.has('is_active') };
  if (table === 'products') {
    let specifications;
    const rawJson = (values.specifications_json || '').trim();
    if (rawJson) {
      try {
        specifications = JSON.parse(rawJson);
      } catch {
        throw new Error('المواصفات ليست بصيغة JSON صحيحة.');
      }
    } else {
      specifications = {};
      document.querySelectorAll('#editor-fields .spec-row').forEach((rowEl) => {
        const key = rowEl.querySelector('.spec-key')?.value.trim() || '';
        const value = rowEl.querySelector('.spec-value')?.value.trim() || '';
        if (!key || !value) return;
        specifications[key] = value;
      });
    }
    if (specifications === null || Array.isArray(specifications) || typeof specifications !== 'object') {
      throw new Error('يجب أن تكون المواصفات كائن JSON.');
    }
    return {
    category_id: values.category_id || null, name_ar: values.name_ar.trim(), brand: values.brand.trim() || null,
    sku: values.sku.trim() || null, price_iqd: Number(values.price_iqd),
    compare_at_price_iqd: values.compare_at_price_iqd ? Number(values.compare_at_price_iqd) : null,
    description_ar: values.description_ar.trim(), image_urls: values.image_urls.split(',').map((url) => url.trim()).filter(Boolean).map(publicImageUrl),
    specifications,
    is_active: form.has('is_active'),
    };
  }
  if (table === 'product_compatibility') return {
    product_id: values.product_id, make: values.make.trim(), model: values.model.trim(),
    year_from: values.year_from ? Number(values.year_from) : null,
    year_to: values.year_to ? Number(values.year_to) : null,
  };
  if (table === 'branches') return { name_ar: values.name_ar.trim(), address_ar: values.address_ar.trim(), phone: values.phone.trim() || null, sort_order: Number(values.sort_order), is_active: form.has('is_active') };
  if (table === 'delivery_regions') return { province_ar: values.province_ar.trim(), neighborhood_ar: values.neighborhood_ar.trim(), delivery_fee_iqd: Number(values.delivery_fee_iqd), is_active: form.has('is_active') };
  if (table === 'branch_inventory') return { branch_id: values.branch_id, product_id: values.product_id, quantity_on_hand: Number(values.quantity_on_hand) };
  if (table === 'promotions') return { title_ar: values.title_ar.trim(), body_ar: values.body_ar.trim(), product_id: values.product_id || null, image_url: publicImageUrl(values.image_url.trim()), starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null, ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null, sort_order: Number(values.sort_order), is_active: form.has('is_active') };
  if (table === 'store_settings') return { store_name_ar: values.store_name_ar.trim(), support_phone: values.support_phone.trim() || null };
  throw new Error('نوع سجل غير مدعوم.');
}

// Universal dialog close handler for [data-close-editor]
function bindEditorCloseButtons() {
  document.querySelectorAll('[data-close-editor]').forEach((btn) => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const dialog = btn.closest('dialog');
      if (dialog) dialog.close('cancel');
    });
  });
}


async function saveEditor(event) {
  if (event.submitter?.id !== 'save-record') return;
  event.preventDefault();
  const table = editorForm.dataset.table;
  const id = editorForm.dataset.id;
  const errorNode = document.querySelector('#editor-error');
  const saveButton = document.querySelector('#save-record');
  saveButton.disabled = true;
  try {
    const values = getEditorValues(table);
    if (id) await storeData.update(table, id, values);
    else await storeData.create(table, values);
    editor.close();
    showNotice('تم حفظ التغييرات.');
    await loadPage(activePage);
  } catch (error) {
    errorNode.textContent = error.message || 'تعذر حفظ التغييرات.';
  } finally {
    saveButton.disabled = false;
  }
}

function bindPageActions() {
  bindEditorCloseButtons();
  page.querySelectorAll('[data-create]').forEach((button) => button.addEventListener('click', () => openEditor(button.dataset.create).catch((error) => showNotice(error.message, true))));
  page.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openEditor(button.dataset.edit, button.dataset.id).catch((error) => showNotice(error.message, true))));
  page.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteRecord(button.dataset.delete, button.dataset.id)));
  page.querySelectorAll('[data-archive-customer]').forEach((button) => button.addEventListener('click', () => archiveCustomer(button.dataset.archiveCustomer)));
  page.querySelectorAll('[data-archive-product]').forEach((button) => button.addEventListener('click', () => archiveProduct(button.dataset.archiveProduct)));
  page.querySelectorAll('[data-delete-category]').forEach((button) => button.addEventListener('click', () => adminDelete('category', button.dataset.deleteCategory, 'القسم')));
  page.querySelectorAll('[data-delete-branch]').forEach((button) => button.addEventListener('click', () => adminDelete('branch', button.dataset.deleteBranch, 'الفرع')));
  page.querySelectorAll('[data-delete-region]').forEach((button) => button.addEventListener('click', () => adminDelete('region', button.dataset.deleteRegion, 'المنطقة')));
  page.querySelectorAll('[data-delete-promotion]').forEach((button) => button.addEventListener('click', () => adminDelete('promotion', button.dataset.deletePromotion, 'العرض')));
  page.querySelectorAll('[data-delete-inventory]').forEach((button) => button.addEventListener('click', () => adminDelete('inventory', button.dataset.deleteInventory, 'سجل المخزون')));
  page.querySelectorAll('[data-delete-order]').forEach((button) => button.addEventListener('click', () => adminDelete('order', button.dataset.deleteOrder, 'الطلب')));
  page.querySelectorAll('[data-clear-orders]').forEach((button) => button.addEventListener('click', clearAllOrders));
  page.querySelectorAll('[data-order-details]').forEach((button) => button.addEventListener('click', () => showOrderDetails(button.dataset.orderDetails).catch((error) => showNotice(error.message, true))));
  page.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => loadPage(button.dataset.go)));
  page.querySelectorAll('[data-order-action]').forEach((button) => button.addEventListener('click', () => applyOrderAction(button)));
  page.querySelectorAll('[data-maintenance-status]').forEach((select) => select.addEventListener('change', () => updateStatus('maintenance_requests', select.dataset.maintenanceStatus, 'status', select.value, select)));
  const csvInput = page.querySelector('[data-csv-file]');
  const importButton = page.querySelector('[data-import-csv]');
  if (importButton && csvInput) {
    importButton.addEventListener('click', () => { csvInput.value = ''; csvInput.click(); });
    csvInput.addEventListener('change', () => {
      const file = csvInput.files && csvInput.files[0];
      if (file) runCsvImport(file).catch((error) => showNotice(error.message || 'تعذر استيراد الملف.', true));
    });
  }
  page.querySelectorAll('[data-download-template]').forEach((button) => button.addEventListener('click', downloadProductsTemplate));
}

async function deleteRecord(table, id) {
  if (!window.confirm('هل تريد حذف سجل التوافق هذا؟')) return;
  try {
    await storeData.remove(table, id);
    showNotice('تم حذف سجل التوافق.');
    await loadPage(activePage);
  } catch (error) {
    showNotice(error.message || 'تعذر حذف السجل.', true);
  }
}

async function archiveCustomer(userId) {
  if (!window.confirm('أرشفة هذا العميل؟ سيُخفى من القائمة مع الاحتفاظ بطلباته وسجله.')) return;
  try {
    await storeData.archiveCustomer(userId);
    showNotice('تمت أرشفة العميل.');
    await loadPage(activePage);
  } catch (error) {
    showNotice(error.message || 'تعذر أرشفة العميل.', true);
  }
}

const ADMIN_DELETE_METHODS = {
  category: 'adminDeleteCategory',
  branch: 'adminDeleteBranch',
  region: 'adminDeleteRegion',
  promotion: 'adminDeletePromotion',
  inventory: 'adminDeleteInventory',
  order: 'adminDeleteOrder',
};

async function archiveProduct(id) {
  if (!window.confirm('أرشفة هذا المنتج؟ سيختفي من التطبيق ويبقى في السجلات.')) return;
  try {
    await storeData.adminArchiveProduct(id);
    showNotice('تمت أرشفة المنتج.');
    await loadPage(activePage);
  } catch (error) {
    showNotice(error.message || 'تعذر أرشفة المنتج.', true);
  }
}

async function adminDelete(kind, id, label) {
  if (!window.confirm(`حذف هذا ${label} نهائياً؟ لا يمكن التراجع.`)) return;
  try {
    const args = kind === 'inventory' ? id.split('|') : [id];
    await storeData[ADMIN_DELETE_METHODS[kind]](...args);
    showNotice(`تم حذف ${label}.`);
    await loadPage(activePage);
  } catch (error) {
    showNotice(error.message || 'تعذر الحذف.', true);
  }
}

async function clearAllOrders() {
  const answer = window.prompt('سيتم حذف جميع الطلبات نهائياً. اكتب DELETE للتأكيد:');
  if (answer !== 'DELETE') return;
  if (!window.confirm('تأكيد أخير: حذف جميع الطلبات نهائياً؟')) return;
  try {
    const count = await storeData.adminClearAllOrders();
    showNotice(`تم حذف ${count} طلب.`);
    await loadPage(activePage);
  } catch (error) {
    showNotice(error.message || 'تعذر مسح الطلبات.', true);
  }
}

async function applyOrderAction(button) {
  const id = button.dataset.orderAction;
  const to = button.dataset.to;
  if (to === 'cancelled' && !window.confirm('تأكيد إلغاء/فشل هذا الطلب؟ لا يمكن التراجع.')) return;
  await updateStatus('orders', id, 'status', to, button);
}

async function updateStatus(table, id, fieldName, value, select) {
  select.disabled = true;
  try {
    await storeData.update(table, id, { [fieldName]: value });
    showNotice('تم تحديث الحالة وإشعار العميل.');
    await loadPage(activePage);
  } catch (error) {
    showNotice(error.message || 'تعذر تحديث الحالة.', true);
    await loadPage(activePage);
  } finally {
    select.disabled = false;
  }
}

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  showLoginError('');
  const data = new FormData(event.currentTarget);
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const session = await storeData.login(data.get('email'), data.get('password'));
    saveSession(session);
    await showAdmin(session.user);
  } catch (error) {
    showLoginError(error.message || 'تعذر تسجيل الدخول.');
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#forgot-password').addEventListener('click', () => {
  showLoginError('إعادة التعيين عبر البريد غير مفعّلة محليًا. إذا تعذّر تسجيل الدخول، اطلب من مسؤول الخادم إعادة ضبط حساب المدير.');
});

editorForm.addEventListener('submit', saveEditor);
const passwordDialog = document.querySelector('#password-dialog');
const passwordForm = document.querySelector('#password-form');
passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = new FormData(passwordForm);
  const currentPassword = values.get('current-password');
  const newPassword = values.get('new-password');
  const errorNode = document.querySelector('#password-error');
  errorNode.textContent = '';
  if (newPassword !== values.get('confirm-password')) {
    errorNode.textContent = 'كلمتا المرور الجديدتان غير متطابقتين.';
    return;
  }
  const button = passwordForm.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await storeData.changePassword(currentPassword, newPassword);
    passwordForm.reset();
    passwordDialog.close();
    showNotice('تم تغيير كلمة المرور.');
  } catch (error) {
    errorNode.textContent = error.message || 'تعذّر تغيير كلمة المرور.';
  } finally {
    button.disabled = false;
  }
});
document.querySelector('#change-password').addEventListener('click', () => {
  document.querySelector('#password-error').textContent = '';
  passwordDialog.showModal();
});
passwordDialog.querySelectorAll('[data-close-password]').forEach((button) => {
  button.addEventListener('click', () => passwordDialog.close());
});
document.querySelector('#sign-out').addEventListener('click', async () => {
  clearSession();
  adminView.hidden = true;
  loginView.hidden = false;
});

const requiredConfig = appConfig.backend === 'supabase'
  ? [
      ['VITE_SUPABASE_URL', appConfig.supabaseUrl],
      ['VITE_SUPABASE_ANON_KEY', appConfig.supabaseAnonKey],
    ]
  : [['VITE_DOKAN_API_URL', appConfig.apiUrl]];

const missingConfig = requiredConfig.filter(([, value]) => !value).map(([key]) => key);

if (missingConfig.length > 0 || !storeData) {
  clearSession();
  showLoginError(
    storeDataError?.message
      || `أضف الإعدادات التالية في admin/.env.local ثم أعد تشغيل لوحة الإدارة: ${missingConfig.join('، ')}`,
  );
  renderNavigation();
} else {
  try {
    if (appConfig.backend !== 'supabase') {
      const parsedApiUrl = new URL(appConfig.apiUrl);
      if (!['http:', 'https:'].includes(parsedApiUrl.protocol) ||
          parsedApiUrl.username || parsedApiUrl.password ||
          parsedApiUrl.search || parsedApiUrl.hash ||
          (parsedApiUrl.pathname !== '/' && parsedApiUrl.pathname !== '')) {
        throw new Error('عنوان خادم المتجر غير صالح.');
      }
    }
    const session = await storeData.getSession();
    if (session) {
      saveSession(session);
      await showAdmin(session.user);
    } else {
      clearSession();
      renderNavigation();
    }
  } catch (error) {
    clearSession();
    showLoginError(error.message || 'تحقق من إعدادات الاتصال.');
    renderNavigation();
  }
}


// --- Image uploader handlers (Cloudflare R2) ---
document.addEventListener('change', async (event) => {
  const input = event.target;
  if (!input.matches('[data-image-file]')) return;
  const file = input.files?.[0];
  if (!file) return;

  const field = input.closest('[data-image-field]');
  const statusEl = field?.querySelector('[data-image-status]');
  const listEl = field?.querySelector('[data-image-list]');
  const hidden = field?.querySelector('[data-image-input]');
  if (!field || !statusEl || !listEl || !hidden) return;

  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type)) {
    statusEl.textContent = 'صيغة غير مدعومة. استخدم PNG أو JPG أو WebP.';
    statusEl.classList.add('error');
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    statusEl.textContent = 'حجم الصورة أكبر من 5 MB.';
    statusEl.classList.add('error');
    input.value = '';
    return;
  }

  statusEl.textContent = 'جاري رفع الصورة...';
  statusEl.classList.remove('error');

  try {
    // Supabase mode calls the `upload-image` Edge Function (built in Phase 5); may fail until then.
    const image_url = await storeData.uploadImage(file);
   
    const isSingle = hidden.dataset.single === '1';
    if (isSingle) {
      hidden.value = image_url;
      // Clear all other preview images for single mode
      listEl.querySelectorAll('.image-item').forEach((el) => el.remove());
    } else {
      const current = hidden.value.split(',').map((s) => s.trim()).filter(Boolean);
      current.push(image_url);
      hidden.value = current.join(', ');
    }

    const li = document.createElement('li');
    li.className = 'image-item';
    li.dataset.url = image_url;
    const img = document.createElement('img');
    img.src = image_url;
    img.alt = '';
    img.loading = 'lazy';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'image-remove';
    btn.dataset.removeImage = image_url;
    btn.setAttribute('aria-label', 'حذف الصورة');
    btn.textContent = '×';
    li.appendChild(img);
    li.appendChild(btn);
    listEl.appendChild(li);

    statusEl.textContent = 'تم رفع الصورة بنجاح.';
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add('error');
  } finally {
    input.value = '';
  }
});

document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-remove-image]');
  if (!btn) return;
  const field = btn.closest('[data-image-field]');
  const hidden = field?.querySelector('[data-image-input]');
  if (!field || !hidden) return;
  const url = btn.dataset.removeImage;
  if (hidden.dataset.single === '1') {
    hidden.value = '';
  } else {
    const current = hidden.value.split(',').map((s) => s.trim()).filter(Boolean);
    hidden.value = current.filter((u) => u !== url).join(', ');
  }
  btn.closest('li')?.remove();
});

// --- Specifications key-value editor handlers ---
document.addEventListener('click', (event) => {
  const addBtn = event.target.closest('[data-spec-add]');
  if (addBtn) {
    const editorEl = addBtn.closest('[data-spec-field]')?.querySelector('[data-spec-editor]');
    if (editorEl) editorEl.insertAdjacentHTML('beforeend', specRowHtml());
    return;
  }
  const removeBtn = event.target.closest('[data-spec-remove]');
  if (removeBtn) {
    removeBtn.closest('[data-spec-row]')?.remove();
    return;
  }
  const clearBtn = event.target.closest('[data-spec-clear]');
  if (clearBtn) {
    if (!confirm('هل أنت متأكد من مسح المواصفات المتداخلة؟ لا يمكن التراجع.')) return;
    const fieldEl = clearBtn.closest('[data-spec-field]');
    if (!fieldEl) return;
    const hidden = fieldEl.querySelector('[data-spec-json]');
    if (hidden) hidden.value = '';
    fieldEl.querySelector('[data-spec-warning]')?.setAttribute('hidden', '');
    fieldEl.querySelector('[data-spec-json-view]')?.remove();
    clearBtn.setAttribute('hidden', '');
    fieldEl.querySelector('[data-spec-editor]')?.removeAttribute('hidden');
    fieldEl.querySelector('[data-spec-actions]')?.removeAttribute('hidden');
  }
});

document.addEventListener('change', (event) => {
  const select = event.target.closest('[data-spec-suggest]');
  if (!select || !select.value) return;
  const editorEl = select.closest('[data-spec-field]')?.querySelector('[data-spec-editor]');
  if (editorEl) editorEl.insertAdjacentHTML('beforeend', specRowHtml(select.value, ''));
  select.value = '';
});
