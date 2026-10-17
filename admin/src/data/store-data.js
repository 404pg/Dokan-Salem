import { createClient } from '@supabase/supabase-js';

export const API_TOKEN_KEY = 'dokan.admin.token.v1';
export const API_USER_KEY = 'dokan.admin.user.v1';
const SUPABASE_SESSION_KEY = 'dokan.admin.supabase.session.v1';

const TABLES = new Set([
  'orders',
  'products',
  'categories',
  'branches',
  'delivery_regions',
  'promotions',
  'maintenance_requests',
  'product_compatibility',
  'branch_inventory',
  'store_settings',
]);

const TABLE_SELECT = {
  orders: '*',
  products: '*',
  categories: '*',
  branches: '*',
  delivery_regions: '*',
  promotions: '*',
  maintenance_requests: '*',
  product_compatibility: '*, products(name_ar)',
  branch_inventory: '*, products(name_ar), branches(name_ar)',
  store_settings: '*',
};

const AUTH_ERRORS = {
  'invalid login credentials': 'بيانات الدخول غير صحيحة.',
  'email not confirmed': 'لم يتم تأكيد البريد الإلكتروني بعد.',
};

function parseJsonish(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed);
  } catch {
    return fallback;
  }
}

export function normalizeProductRow(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    image_urls: parseJsonish(row.image_urls, []),
    specifications: parseJsonish(row.specifications, {}),
  };
}

export function splitCompositeId(id) {
  const [branchId, productId] = String(id ?? '').split('|');
  if (!branchId || !productId) throw new Error('مُعرّف السجل غير صالح.');
  return { branchId, productId };
}

export function publicImageUrl(value, { apiUrl } = {}) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (apiUrl) {
    try {
      return new URL(raw, `${apiUrl.replace(/\/+$/, '')}/`).toString();
    } catch {
      throw new Error('رابط الصورة غير صالح.');
    }
  }
  throw new Error('رابط الصورة غير صالح.');
}

function buildApiUrl(path, apiUrl) {
  return new URL(path.replace(/^\/+/, ''), `${apiUrl.replace(/\/+$/, '')}/`);
}

class ApiStoreData {
  constructor({ apiUrl, tokenKey = API_TOKEN_KEY, onUnauthorized }) {
    this.apiUrl = (apiUrl || '').replace(/\/+$/, '');
    if (!this.apiUrl) {
      throw new Error('أضف عنوان خادم المتجر في admin/.env.local ثم أعد تشغيل لوحة الإدارة.');
    }
    this.tokenKey = tokenKey;
    this.onUnauthorized = onUnauthorized;
  }

  get token() {
    return sessionStorage.getItem(this.tokenKey);
  }

  async request(path, { method = 'GET', body, authenticated = true } = {}) {
    const url = buildApiUrl(path, this.apiUrl);
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (authenticated && this.token) headers.Authorization = `Bearer ${this.token}`;
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
      if (response.status === 401 && authenticated) this.onUnauthorized?.();
      throw new Error(result?.error || 'تعذّر إكمال الطلب.');
    }
    return result;
  }

  async login(email, password) {
    const result = await this.request('/api/auth/login', {
      method: 'POST',
      authenticated: false,
      body: { email, password },
    });
    return { token: result.token, user: result.user };
  }

  async logout() {
    return true;
  }

  async getSession() {
    const token = this.token;
    if (!token) return null;
    let user = null;
    try {
      user = JSON.parse(sessionStorage.getItem(API_USER_KEY) || 'null');
    } catch {
      user = null;
    }
    if (!user) return null;
    return { token, user };
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/api/admin/password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
  }

  async summary() {
    return this.request('/api/admin/summary');
  }

  async list(table, columns, options = {}) {
    const query = new URLSearchParams();
    if (options.order) query.set('order', options.order);
    if (options.ascending !== undefined) query.set('ascending', String(options.ascending));
    if (options.limit) query.set('limit', String(options.limit));
    if (options.branchId) query.set('branchId', options.branchId);
    if (options.productId) query.set('productId', options.productId);
    const rows = await this.request(`/api/admin/data/${table}?${query}`);
    if (table !== 'products') return rows;
    return (rows || []).map(normalizeProductRow);
  }

  async get(table, id) {
    return this.request(`/api/admin/data/${table}/${encodeURIComponent(id)}`);
  }

  async create(table, values) {
    return this.request(`/api/admin/data/${table}`, { method: 'POST', body: values });
  }

  async createReturning(_table, _values, _columns = '*') {
    throw new Error('إدراج مع إرجاع غير متاح في وضع الخادم المحلي.');
  }

  async createMany(_table, _rows, _columns = '*') {
    throw new Error('الإدراج الجماعي غير متاح في وضع الخادم المحلي.');
  }

  async update(table, id, values) {
    return this.request(`/api/admin/data/${table}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: values,
    });
  }

  async remove(table, id) {
    return this.request(`/api/admin/data/${table}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async archiveCustomer(_userId) {
    throw new Error('أرشفة العملاء غير متاحة في وضع الخادم المحلي.');
  }

  async adminArchiveProduct(_id) { throw new Error('هذه العملية غير متاحة في وضع الخادم المحلي.'); }
  async adminDeleteCategory(_id) { throw new Error('هذه العملية غير متاحة في وضع الخادم المحلي.'); }
  async adminDeleteBranch(_id) { throw new Error('هذه العملية غير متاحة في وضع الخادم المحلي.'); }
  async adminDeleteRegion(_id) { throw new Error('هذه العملية غير متاحة في وضع الخادم المحلي.'); }
  async adminDeletePromotion(_id) { throw new Error('هذه العملية غير متاحة في وضع الخادم المحلي.'); }
  async adminDeleteInventory(_b, _p) { throw new Error('هذه العملية غير متاحة في وضع الخادم المحلي.'); }
  async adminDeleteOrder(_id) { throw new Error('هذه العملية غير متاحة في وضع الخادم المحلي.'); }
  async adminClearAllOrders() { throw new Error('هذه العملية غير متاحة في وضع الخادم المحلي.'); }

  async customers() {
    return this.request('/api/admin/customers');
  }

  async orderDetails(orderId) {
    return this.request(`/api/admin/orders/${encodeURIComponent(orderId)}`);
  }

  async uploadImage(file) {
    const response = await fetch(`${this.apiUrl}/api/admin/images`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
        Authorization: `Bearer ${this.token || ''}`,
      },
      body: file,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) this.onUnauthorized?.();
      throw new Error(payload.error || `فشل الرفع (${response.status}).`);
    }
    const { image_url } = await response.json();
    if (!image_url) throw new Error('لم يُعِد الخادم رابط الصورة.');
    return image_url;
  }
}

class SupabaseStoreData {
  constructor({ url, anonKey, onUnauthorized }) {
    if (!url || !anonKey) {
      throw new Error(
        'أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في admin/.env.local ثم أعد تشغيل لوحة الإدارة.',
      );
    }
    this.onUnauthorized = onUnauthorized;
    this.client = createClient(url, anonKey, {
      auth: {
        storage: {
          getItem: (key) => sessionStorage.getItem(key),
          setItem: (key, value) => sessionStorage.setItem(key, value),
          removeItem: (key) => sessionStorage.removeItem(key),
        },
        storageKey: SUPABASE_SESSION_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }

  async verifyAdmin(userId) {
    const { data, error } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.role === 'admin';
  }

  assertTable(table) {
    if (!TABLES.has(table)) throw new Error('نوع سجل غير مدعوم.');
  }

  async login(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      const message = AUTH_ERRORS[(error.message || '').toLowerCase()] || 'بيانات الدخول غير صحيحة.';
      throw new Error(message);
    }
    if (!(await this.verifyAdmin(data.user.id))) {
      await this.client.auth.signOut();
      throw new Error('هذا الحساب لا يملك صلاحية دخول لوحة الإدارة.');
    }
    return {
      token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email, role: 'admin' },
    };
  }

  async logout() {
    await this.client.auth.signOut();
    return true;
  }

  async getSession() {
    const { data } = await this.client.auth.getSession();
    const session = data?.session;
    if (!session) return null;
    if (!(await this.verifyAdmin(session.user.id))) {
      await this.client.auth.signOut();
      return null;
    }
    return {
      token: session.access_token,
      user: { id: session.user.id, email: session.user.email, role: 'admin' },
    };
  }

  async changePassword(_currentPassword, newPassword) {
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async summary() {
    const { data, error } = await this.client.rpc('admin_store_summary');
    if (error) throw new Error(error.message);
    return Array.isArray(data) ? data[0] : data;
  }

  async list(table, columns, options = {}) {
    this.assertTable(table);
    const select = columns && String(columns).trim() ? String(columns).trim() : TABLE_SELECT[table];
    let query = this.client.from(table).select(select);
    if (options.order) {
      query = query.order(options.order, { ascending: options.ascending !== false });
    }
    if (options.limit) query = query.limit(Number(options.limit));
    if (options.branchId && table === 'branch_inventory') {
      query = query.eq('branch_id', options.branchId);
    }
    if (options.productId && table === 'product_compatibility') {
      query = query.eq('product_id', options.productId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (table !== 'products') return data || [];
    return (data || []).map(normalizeProductRow);
  }

  async get(table, id) {
    this.assertTable(table);
    let query;
    if (table === 'branch_inventory') {
      const { branchId, productId } = splitCompositeId(id);
      query = this.client
        .from(table)
        .select('*')
        .eq('branch_id', branchId)
        .eq('product_id', productId)
        .single();
    } else {
      query = this.client.from(table).select('*').eq('id', id).single();
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async create(table, values) {
    this.assertTable(table);
    const { error } = await this.client.from(table).insert(values);
    if (error) throw new Error(error.message);
  }

  async createReturning(table, values, columns = '*') {
    this.assertTable(table);
    const { data, error } = await this.client.from(table).insert(values).select(columns).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async createMany(table, rows, columns = '*') {
    this.assertTable(table);
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const { data, error } = await this.client.from(table).insert(rows).select(columns);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async update(table, id, values) {
    this.assertTable(table);
    let query;
    if (table === 'branch_inventory') {
      const { branchId, productId } = splitCompositeId(id);
      query = this.client
        .from(table)
        .update(values)
        .eq('branch_id', branchId)
        .eq('product_id', productId);
    } else {
      query = this.client.from(table).update(values).eq('id', id);
    }
    const { error } = await query;
    if (error) throw new Error(error.message);
  }

  async remove(table, id) {
    this.assertTable(table);
    let query;
    if (table === 'branch_inventory') {
      const { branchId, productId } = splitCompositeId(id);
      query = this.client
        .from(table)
        .delete()
        .eq('branch_id', branchId)
        .eq('product_id', productId);
    } else {
      query = this.client.from(table).delete().eq('id', id);
    }
    const { error } = await query;
    if (error) throw new Error(error.message);
  }

  async customers() {
    const { data, error } = await this.client.rpc('admin_customer_overview');
    if (error) throw new Error(error.message);
    return data || [];
  }

  async archiveCustomer(userId) {
    const { error } = await this.client.rpc('admin_archive_customer', { p_user_id: userId });
    if (error) throw new Error(error.message);
  }

  async adminArchiveProduct(productId) {
    const { error } = await this.client.rpc('admin_archive_product', { p_id: productId });
    if (error) throw new Error(error.message);
  }

  async adminDeleteCategory(categoryId) {
    const { error } = await this.client.rpc('admin_delete_category', { p_id: categoryId });
    if (error) throw new Error(error.message);
  }

  async adminDeleteBranch(branchId) {
    const { error } = await this.client.rpc('admin_delete_branch', { p_id: branchId });
    if (error) throw new Error(error.message);
  }

  async adminDeleteRegion(regionId) {
    const { error } = await this.client.rpc('admin_delete_region', { p_id: regionId });
    if (error) throw new Error(error.message);
  }

  async adminDeletePromotion(promotionId) {
    const { error } = await this.client.rpc('admin_delete_promotion', { p_id: promotionId });
    if (error) throw new Error(error.message);
  }

  async adminDeleteInventory(branchId, productId) {
    const { error } = await this.client.rpc('admin_delete_inventory', { p_branch_id: branchId, p_product_id: productId });
    if (error) throw new Error(error.message);
  }

  async adminDeleteOrder(orderId) {
    const { error } = await this.client.rpc('admin_delete_order', { p_id: orderId });
    if (error) throw new Error(error.message);
  }

  async adminClearAllOrders() {
    const { data, error } = await this.client.rpc('admin_clear_all_orders');
    if (error) throw new Error(error.message);
    return data;
  }

  async orderDetails(orderId) {
    const { data, error } = await this.client
      .from('orders')
      .select('*, order_items(*, products(name_ar), branches(name_ar))')
      .eq('id', orderId)
      .single();
    if (error) throw new Error(error.message);
    const { order_items: items = [], ...order } = data;
    return {
      order,
      items: items.map((item) => ({ ...item, branch_name: item.branches?.name_ar || null })),
    };
  }

  async uploadImage(file) {
    const { data, error } = await this.client.functions.invoke('upload-image', { body: file });
    if (error) throw new Error(error.message || 'فشل رفع الصورة.');
    const imageUrl = data?.image_url || data?.url;
    if (!imageUrl) throw new Error('لم يُعِد الخادم رابط الصورة.');
    return imageUrl;
  }
}

export function createStoreData(config = {}) {
  const backend = (config.backend || 'api').toLowerCase();
  if (backend === 'supabase') {
    return new SupabaseStoreData({
      url: config.supabaseUrl,
      anonKey: config.supabaseAnonKey,
      onUnauthorized: config.onUnauthorized,
    });
  }
  return new ApiStoreData({
    apiUrl: config.apiUrl,
    tokenKey: config.tokenKey,
    onUnauthorized: config.onUnauthorized,
  });
}
