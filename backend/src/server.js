import './env.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import sql from 'mssql/msnodesqlv8.js';
import { uploadImage, isR2Configured } from './storage.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const port = Number(process.env.PORT || 4176);
const host = process.env.HOST || '127.0.0.1';
const publicApiUrl = (process.env.PUBLIC_API_URL || `http://localhost:${port}`).replace(/\/$/, '');
const allowedOrigins = new Set((process.env.ADMIN_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
  .split(',').map((origin) => origin.trim()).filter(Boolean));
const jwtSecret = process.env.JWT_SECRET || '';
const imageDirectory = path.resolve(root, process.env.IMAGE_DIRECTORY || 'data/images');
const app = express();
let pool;

const sqlConfig = {
  server: process.env.SQL_SERVER || 'localhost',
  database: process.env.SQL_DATABASE || 'DokanSaleem',
  driver: process.env.SQL_DRIVER || 'ODBC Driver 17 for SQL Server',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    instanceName: process.env.SQL_INSTANCE || 'SQLEXPRESS',
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

function signToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    role: user.role,
    email: user.email || null,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  })).toString('base64url');
  const content = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', jwtSecret).update(content).digest('base64url');
  return `${content}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const content = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', jwtSecret).update(content).digest();
  let received;
  try {
    received = Buffer.from(parts[2], 'base64url');
  } catch {
    return null;
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload.sub || !payload.role || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAuth(request, response, next) {
  const match = /^Bearer (.+)$/i.exec(request.get('authorization') || '');
  const user = match ? verifyToken(match[1]) : null;
  if (!user) return response.status(401).json({ error: 'يلزم تسجيل الدخول مجددًا.' });
  request.user = user;
  next();
}

function requireAdmin(request, response, next) {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ error: 'هذا الحساب غير مخوّل لإدارة المتجر.' });
  }
  next();
}

function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(password, salt, 64);
  return { hash, salt };
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 256;
}

function secureEquals(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function sqlRequest(transaction) {
  return (transaction || pool).request();
}

function normalizeProduct(row) {
  const imageUrls = JSON.parse(row.image_urls || '[]');
  return {
    ...row,
    image_urls: imageUrls.map((url) => url.startsWith('/') ? `${publicApiUrl}${url}` : url),
    specifications: JSON.parse(row.specifications || '{}'),
    is_available: Boolean(row.is_available),
  };
}

function customerId(request) {
  if (request.user.role !== 'guest') {
    const error = new Error('هذه العملية متاحة لحساب الزبون فقط.');
    error.status = 403;
    throw error;
  }
  return request.user.sub;
}

app.disable('x-powered-by');
app.use((request, response, next) => {
  const origin = request.get('origin');
  if (origin && allowedOrigins.has(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
    response.set('Vary', 'Origin');
    response.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }
  if (request.method === 'OPTIONS') return response.status(204).end();
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use('/api/customer', requireAuth);

app.get('/api/health', async (_request, response) => {
  try {
    await pool.request().query('SELECT 1 AS ok');
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error);
    response.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

app.post('/api/auth/guest', async (_request, response, next) => {
  try {
    const id = crypto.randomUUID();
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query("INSERT INTO dbo.app_users (id, role) VALUES (@id, N'guest')");
    response.status(201).json({ token: signToken({ id, role: 'guest' }), user: { id, role: 'guest' } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/session', requireAuth, (request, response) => {
  response.json({
    user: {
      id: request.user.sub,
      role: request.user.role,
      email: request.user.email || null,
    },
  });
});

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = request.body?.password;
    if (!email || !validPassword(password)) {
      return response.status(400).json({ error: 'البريد أو كلمة المرور غير صالحة.' });
    }
    const result = await pool.request()
      .input('email', sql.NVarChar(254), email)
      .query("SELECT TOP (1) id, email, password_hash, password_salt, role FROM dbo.app_users WHERE email = @email AND role = N'admin'");
    const admin = result.recordset[0];
    if (!admin || !admin.password_hash || !admin.password_salt) {
      return response.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة.' });
    }
    const supplied = crypto.scryptSync(password, admin.password_salt, 64);
    if (!crypto.timingSafeEqual(supplied, admin.password_hash)) {
      return response.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة.' });
    }
    response.json({
      token: signToken({ id: admin.id, role: admin.role, email: admin.email }),
      user: { id: admin.id, role: admin.role, email: admin.email },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog/categories', async (_request, response, next) => {
  try {
    const { recordset } = await pool.request().query(
      'SELECT id, name_ar, sort_order FROM dbo.categories WHERE is_active = 1 ORDER BY sort_order, name_ar',
    );
    response.json(recordset);
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog/products', async (request, response, next) => {
  try {
    const categoryId = request.query.categoryId;
    const search = typeof request.query.search === 'string' ? request.query.search.trim().slice(0, 100) : '';
    const dbRequest = pool.request()
      .input('categoryId', sql.UniqueIdentifier, categoryId || null)
      .input('search', sql.NVarChar(100), `%${search}%`);
    const { recordset } = await dbRequest.query(`
      SELECT p.id, p.category_id, p.name_ar, p.brand, p.description_ar, p.sku,
        p.price_iqd, p.compare_at_price_iqd, p.image_urls, p.specifications,
        CAST(CASE WHEN SUM(CASE WHEN b.is_active = 1 THEN i.quantity_on_hand ELSE 0 END) > 0 THEN 1 ELSE 0 END AS bit) AS is_available,
        COALESCE((
          SELECT pc.make, pc.model, pc.year_from, pc.year_to
          FROM dbo.product_compatibility pc WHERE pc.product_id = p.id
          FOR JSON PATH
        ), N'[]') AS compatible_models
      FROM dbo.products p
      LEFT JOIN dbo.branch_inventory i ON i.product_id = p.id
      LEFT JOIN dbo.branches b ON b.id = i.branch_id
      WHERE p.is_active = 1
        AND (@categoryId IS NULL OR p.category_id = @categoryId)
        AND (@search = N'%%' OR p.name_ar LIKE @search OR p.brand LIKE @search OR p.sku LIKE @search)
      GROUP BY p.id, p.category_id, p.name_ar, p.brand, p.description_ar, p.sku,
        p.price_iqd, p.compare_at_price_iqd, p.image_urls, p.specifications
      ORDER BY p.name_ar`);
    response.json(recordset.map((row) => ({
      ...normalizeProduct(row),
      compatible_models: JSON.parse(row.compatible_models || '[]'),
    })));
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog/promotions', async (_request, response, next) => {
  try {
    const { recordset } = await pool.request().query(`
      SELECT id, title_ar, body_ar, image_url, product_id FROM dbo.promotions
      WHERE is_active = 1 AND (starts_at IS NULL OR starts_at <= SYSUTCDATETIME())
        AND (ends_at IS NULL OR ends_at > SYSUTCDATETIME())
      ORDER BY sort_order`);
    response.json(recordset.map((promotion) => ({
      ...promotion,
      image_url: promotion.image_url?.startsWith('/')
        ? `${publicApiUrl}${promotion.image_url}`
        : promotion.image_url,
    })));
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog/regions', async (_request, response, next) => {
  try {
    const { recordset } = await pool.request().query(`
      SELECT id, province_ar, neighborhood_ar, delivery_fee_iqd
      FROM dbo.delivery_regions WHERE is_active = 1 ORDER BY province_ar, neighborhood_ar`);
    response.json(recordset);
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog/branches', async (_request, response, next) => {
  try {
    const { recordset } = await pool.request().query(`
      SELECT id, name_ar, address_ar FROM dbo.branches WHERE is_active = 1 ORDER BY name_ar`);
    response.json(recordset);
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog/settings', async (_request, response, next) => {
  try {
    const { recordset } = await pool.request().query(
      'SELECT TOP (1) support_phone FROM dbo.store_settings WHERE id = 1',
    );
    response.json(recordset[0] || { support_phone: null });
  } catch (error) {
    next(error);
  }
});

app.get('/api/customer/addresses', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const result = await pool.request().input('userId', sql.UniqueIdentifier, userId).query(`
      SELECT id, recipient_name, phone, region_id, province_ar, neighborhood_ar,
        address_details, delivery_note, is_default
      FROM dbo.customer_addresses WHERE user_id = @userId
      ORDER BY is_default DESC, created_at DESC`);
    response.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

async function saveCustomerAddress(request, response, next, addressId = null) {
  try {
    const userId = customerId(request);
    const { recipientName, phone, regionId, addressDetails, deliveryNote = '', isDefault = false } = request.body || {};
    if (typeof recipientName !== 'string' || !recipientName.trim() ||
        !/^\+9647\d{9}$/.test(phone || '') || typeof addressDetails !== 'string' ||
        addressDetails.trim().length < 3 || addressDetails.trim().length > 500 ||
        typeof deliveryNote !== 'string' || deliveryNote.length > 500) {
      return response.status(400).json({ error: 'بيانات العنوان أو رقم الهاتف غير صالحة.' });
    }
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const region = await transaction.request()
        .input('regionId', sql.UniqueIdentifier, regionId)
        .query('SELECT TOP (1) id, province_ar, neighborhood_ar FROM dbo.delivery_regions WITH (UPDLOCK, HOLDLOCK) WHERE id = @regionId AND is_active = 1');
      if (!region.recordset[0]) throw Object.assign(new Error('منطقة التوصيل المحددة غير متاحة.'), { status: 400 });
      if (isDefault) {
        await transaction.request().input('userId', sql.UniqueIdentifier, userId)
          .query('UPDATE dbo.customer_addresses SET is_default = 0 WHERE user_id = @userId');
      }
      const regionRow = region.recordset[0];
      let id = addressId;
      const dbRequest = transaction.request()
        .input('userId', sql.UniqueIdentifier, userId)
        .input('name', sql.NVarChar(120), recipientName.trim())
        .input('phone', sql.NVarChar(16), phone)
        .input('regionId', sql.UniqueIdentifier, regionId)
        .input('province', sql.NVarChar(100), regionRow.province_ar)
        .input('neighborhood', sql.NVarChar(120), regionRow.neighborhood_ar)
        .input('details', sql.NVarChar(500), addressDetails.trim())
        .input('note', sql.NVarChar(500), deliveryNote.trim())
        .input('isDefault', sql.Bit, Boolean(isDefault));
      if (addressId) {
        const result = await dbRequest
          .input('id', sql.UniqueIdentifier, addressId)
          .query(`UPDATE dbo.customer_addresses
            SET recipient_name=@name, phone=@phone, region_id=@regionId,
              province_ar=@province, neighborhood_ar=@neighborhood,
              address_details=@details, delivery_note=@note, is_default=@isDefault,
              updated_at=SYSUTCDATETIME()
            WHERE id=@id AND user_id=@userId`);
        if (!result.rowsAffected[0]) {
          throw Object.assign(new Error('العنوان غير موجود.'), { status: 404 });
        }
      } else {
        id = crypto.randomUUID();
        await dbRequest
          .input('id', sql.UniqueIdentifier, id)
          .query(`INSERT INTO dbo.customer_addresses
            (id,user_id,recipient_name,phone,region_id,province_ar,neighborhood_ar,address_details,delivery_note,is_default)
            VALUES (@id,@userId,@name,@phone,@regionId,@province,@neighborhood,@details,@note,@isDefault)`);
      }
      await transaction.commit();
      if (addressId) response.status(204).end();
      else response.status(201).json({ id });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

app.post('/api/customer/addresses', (request, response, next) =>
  saveCustomerAddress(request, response, next));

app.put('/api/customer/addresses/:id', (request, response, next) =>
  saveCustomerAddress(request, response, next, request.params.id));

app.delete('/api/customer/addresses/:id', async (request, response, next) => {
  try {
    const userId = customerId(request);
    await pool.request()
      .input('id', sql.UniqueIdentifier, request.params.id)
      .input('userId', sql.UniqueIdentifier, userId)
      .query('DELETE FROM dbo.customer_addresses WHERE id = @id AND user_id = @userId');
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/customer/favorites', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const result = await pool.request().input('userId', sql.UniqueIdentifier, userId)
      .query('SELECT product_id FROM dbo.wishlist_items WHERE user_id = @userId');
    response.json(result.recordset.map((row) => row.product_id));
  } catch (error) {
    next(error);
  }
});

app.put('/api/customer/favorites/:productId', async (request, response, next) => {
  try {
    const userId = customerId(request);
    await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('productId', sql.UniqueIdentifier, request.params.productId)
      .query(`IF NOT EXISTS (SELECT 1 FROM dbo.wishlist_items WHERE user_id=@userId AND product_id=@productId)
        INSERT INTO dbo.wishlist_items (user_id, product_id) VALUES (@userId, @productId)`);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.delete('/api/customer/favorites/:productId', async (request, response, next) => {
  try {
    const userId = customerId(request);
    await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('productId', sql.UniqueIdentifier, request.params.productId)
      .query('DELETE FROM dbo.wishlist_items WHERE user_id=@userId AND product_id=@productId');
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/customer/orders', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const result = await pool.request().input('userId', sql.UniqueIdentifier, userId).query(`
      SELECT id, order_number, status, subtotal_iqd, delivery_fee_iqd, total_iqd, created_at
      FROM dbo.orders WHERE customer_id = @userId ORDER BY created_at DESC`);
    response.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

app.get('/api/customer/orders/:id/items', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('orderId', sql.UniqueIdentifier, request.params.id)
      .query(`SELECT i.product_name_ar, i.unit_price_iqd, i.quantity, i.line_total_iqd
        FROM dbo.order_items i JOIN dbo.orders o ON o.id=i.order_id
        WHERE o.id=@orderId AND o.customer_id=@userId ORDER BY i.created_at`);
    response.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

app.post('/api/customer/orders/:id/cancel', async (request, response, next) => {
  const transaction = new sql.Transaction(pool);
  try {
    const userId = customerId(request);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const order = await transaction.request()
      .input('orderId', sql.UniqueIdentifier, request.params.id)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`SELECT TOP (1) status FROM dbo.orders WITH (UPDLOCK,HOLDLOCK)
        WHERE id=@orderId AND customer_id=@userId`);
    if (!order.recordset[0]) {
      await transaction.rollback();
      return response.status(404).json({ error: 'الطلب غير موجود.' });
    }
    if (order.recordset[0].status === 'cancelled') {
      await transaction.commit();
      return response.status(204).end();
    }
    if (order.recordset[0].status !== 'pending') {
      await transaction.rollback();
      return response.status(409).json({ error: 'لا يمكن إلغاء الطلب بعد بدء تجهيزه.' });
    }
    await transaction.request()
      .input('orderId', sql.UniqueIdentifier, request.params.id)
      .query(`UPDATE inventory
        SET inventory.quantity_on_hand = inventory.quantity_on_hand + items.quantity,
            inventory.updated_at = SYSUTCDATETIME()
        FROM dbo.branch_inventory inventory
        JOIN (
          SELECT branch_id, product_id, SUM(quantity) AS quantity
          FROM dbo.order_items
          WHERE order_id=@orderId AND product_id IS NOT NULL
          GROUP BY branch_id, product_id
        ) items ON items.branch_id=inventory.branch_id AND items.product_id=inventory.product_id`);
    await transaction.request()
      .input('orderId', sql.UniqueIdentifier, request.params.id)
      .query(`UPDATE dbo.orders SET status=N'cancelled',updated_at=SYSUTCDATETIME()
        WHERE id=@orderId`);
    await transaction.commit();
    response.status(204).end();
  } catch (error) {
    if (transaction._aborted !== true) {
      try { await transaction.rollback(); } catch (rollbackError) { console.error('Order cancellation rollback failed:', rollbackError); }
    }
    next(error);
  }
});

app.get('/api/customer/maintenance', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const result = await pool.request().input('userId', sql.UniqueIdentifier, userId).query(`
      SELECT id, request_number, service_type, motorcycle, description, preferred_date, status, created_at
      FROM dbo.maintenance_requests WHERE customer_id=@userId ORDER BY created_at DESC`);
    response.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

app.get('/api/customer/motorcycles', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const result = await pool.request().input('userId', sql.UniqueIdentifier, userId).query(`
      SELECT id, make, model, [year], nickname FROM dbo.customer_motorcycles
      WHERE user_id=@userId ORDER BY created_at DESC`);
    response.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

app.post('/api/customer/motorcycles', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const { make, model, year, nickname = '' } = request.body || {};
    if (typeof make !== 'string' || !make.trim() || make.length > 80 ||
        typeof model !== 'string' || !model.trim() || model.length > 100 ||
        typeof nickname !== 'string' || nickname.length > 80 ||
        (year != null && (!Number.isInteger(year) || year < 1900 || year > 2200))) {
      return response.status(400).json({ error: 'بيانات الدراجة غير صالحة.' });
    }
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('make', sql.NVarChar(80), make.trim())
      .input('model', sql.NVarChar(100), model.trim())
      .input('year', sql.SmallInt, year ?? null)
      .input('nickname', sql.NVarChar(80), nickname.trim())
      .query(`INSERT INTO dbo.customer_motorcycles (user_id,make,model,[year],nickname)
        OUTPUT INSERTED.id VALUES (@userId,@make,@model,@year,@nickname)`);
    response.status(201).json({ id: result.recordset[0].id });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/customer/motorcycles/:id', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const { make, model, year, nickname = '' } = request.body || {};
    if (typeof make !== 'string' || !make.trim() || make.length > 80 ||
        typeof model !== 'string' || !model.trim() || model.length > 100 ||
        typeof nickname !== 'string' || nickname.length > 80 ||
        (year != null && (!Number.isInteger(year) || year < 1900 || year > 2200))) {
      return response.status(400).json({ error: 'بيانات الدراجة غير صالحة.' });
    }
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, request.params.id)
      .input('userId', sql.UniqueIdentifier, userId)
      .input('make', sql.NVarChar(80), make.trim())
      .input('model', sql.NVarChar(100), model.trim())
      .input('year', sql.SmallInt, year ?? null)
      .input('nickname', sql.NVarChar(80), nickname.trim())
      .query(`UPDATE dbo.customer_motorcycles SET make=@make,model=@model,[year]=@year,nickname=@nickname
        WHERE id=@id AND user_id=@userId`);
    if (!result.rowsAffected[0]) return response.status(404).json({ error: 'الدراجة غير موجودة.' });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.delete('/api/customer/motorcycles/:id', async (request, response, next) => {
  try {
    const userId = customerId(request);
    await pool.request()
      .input('id', sql.UniqueIdentifier, request.params.id)
      .input('userId', sql.UniqueIdentifier, userId)
      .query('DELETE FROM dbo.customer_motorcycles WHERE id=@id AND user_id=@userId');
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/customer/notifications', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`SELECT TOP (50) id,title_ar,body_ar,created_at,is_read
        FROM dbo.customer_notifications WHERE user_id=@userId ORDER BY created_at DESC`);
    response.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/customer/notifications/:id/read', async (request, response, next) => {
  try {
    const userId = customerId(request);
    await pool.request()
      .input('id', sql.UniqueIdentifier, request.params.id)
      .input('userId', sql.UniqueIdentifier, userId)
      .query('UPDATE dbo.customer_notifications SET is_read=1 WHERE id=@id AND user_id=@userId');
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/customer/maintenance', async (request, response, next) => {
  try {
    const userId = customerId(request);
    const { serviceType, branchId, motorcycle, description, preferredDate } = request.body || {};
    if (!['workshop', 'onsite'].includes(serviceType) ||
        typeof motorcycle !== 'string' || motorcycle.trim().length < 2 ||
        typeof description !== 'string' || description.trim().length < 5 ||
        (serviceType === 'workshop' && !branchId) || (serviceType === 'onsite' && branchId)) {
      return response.status(400).json({ error: 'بيانات طلب الصيانة غير مكتملة.' });
    }
    const id = crypto.randomUUID();
    const number = `MR-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('number', sql.NVarChar(32), number)
      .input('userId', sql.UniqueIdentifier, userId)
      .input('serviceType', sql.NVarChar(16), serviceType)
      .input('branchId', sql.UniqueIdentifier, branchId || null)
      .input('motorcycle', sql.NVarChar(120), motorcycle.trim())
      .input('description', sql.NVarChar(2000), description.trim())
      .input('date', sql.Date, preferredDate || null)
      .query(`INSERT INTO dbo.maintenance_requests
        (id,request_number,customer_id,service_type,branch_id,motorcycle,description,preferred_date)
        VALUES (@id,@number,@userId,@serviceType,@branchId,@motorcycle,@description,@date)`);
    response.status(201).json({ id, request_number: number });
  } catch (error) {
    next(error);
  }
});

app.post('/api/customer/orders', async (request, response, next) => {
  const transaction = new sql.Transaction(pool);
  try {
    const userId = customerId(request);
    const body = request.body || {};
    if (typeof body.customerName !== 'string' || !body.customerName.trim() ||
        !/^\+9647\d{9}$/.test(body.phone || '') ||
        !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50 ||
        !body.idempotencyKey) {
      return response.status(400).json({ error: 'بيانات الطلب غير مكتملة أو غير صالحة.' });
    }
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const idempotent = await transaction.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('key', sql.UniqueIdentifier, body.idempotencyKey)
      .query('SELECT TOP (1) order_number FROM dbo.orders WHERE customer_id=@userId AND idempotency_key=@key');
    if (idempotent.recordset[0]) {
      await transaction.commit();
      return response.json({ order_number: idempotent.recordset[0].order_number });
    }
    const region = await transaction.request()
      .input('regionId', sql.UniqueIdentifier, body.regionId)
      .query('SELECT TOP (1) * FROM dbo.delivery_regions WITH (UPDLOCK, HOLDLOCK) WHERE id=@regionId AND is_active=1');
    const regionRow = region.recordset[0];
    if (!regionRow) throw Object.assign(new Error('منطقة التوصيل المحددة غير متاحة.'), { status: 400 });
    if (Number(regionRow.delivery_fee_iqd) !== Number(body.expectedDeliveryFeeIqd)) {
      throw Object.assign(new Error('تغيّرت رسوم التوصيل. راجع الإجمالي ثم أعد المحاولة.'), { status: 409 });
    }

    const orderId = crypto.randomUUID();
    const orderNumber = `DS-${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    let subtotal = 0;
    const items = [];
    for (const item of body.items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
        throw Object.assign(new Error('كمية أحد المنتجات غير صالحة.'), { status: 400 });
      }
      const productResult = await transaction.request()
        .input('productId', sql.UniqueIdentifier, item.productId)
        .query(`SELECT TOP (1) p.id,p.name_ar,p.sku,p.price_iqd
          FROM dbo.products p WITH (UPDLOCK,HOLDLOCK)
          WHERE p.id=@productId AND p.is_active=1`);
      const product = productResult.recordset[0];
      if (!product || Number(product.price_iqd) !== Number(item.expectedPriceIqd)) {
        throw Object.assign(new Error('تغيّر سعر أحد المنتجات أو لم يعد متاحًا. حدّث السلة ثم أعد المحاولة.'), { status: 409 });
      }
      const stockResult = await transaction.request()
        .input('productId', sql.UniqueIdentifier, item.productId)
        .input('quantity', sql.Int, quantity)
        .query(`SELECT TOP (1) i.branch_id,i.quantity_on_hand
          FROM dbo.branch_inventory i WITH (UPDLOCK,HOLDLOCK)
          JOIN dbo.branches b ON b.id=i.branch_id AND b.is_active=1
          WHERE i.product_id=@productId AND i.quantity_on_hand >= @quantity
          ORDER BY i.quantity_on_hand DESC`);
      const stock = stockResult.recordset[0];
      if (!stock) throw Object.assign(new Error('أحد المنتجات غير متوفر بالكمية المطلوبة.'), { status: 409 });
      await transaction.request()
        .input('branchId', sql.UniqueIdentifier, stock.branch_id)
        .input('productId', sql.UniqueIdentifier, item.productId)
        .input('quantity', sql.Int, quantity)
        .query(`UPDATE dbo.branch_inventory SET quantity_on_hand=quantity_on_hand-@quantity,
          updated_at=SYSUTCDATETIME() WHERE branch_id=@branchId AND product_id=@productId AND quantity_on_hand>=@quantity`);
      const lineTotal = Number(product.price_iqd) * quantity;
      subtotal += lineTotal;
      items.push({ ...product, branch_id: stock.branch_id, quantity, line_total_iqd: lineTotal });
    }

    await transaction.request()
      .input('id', sql.UniqueIdentifier, orderId)
      .input('number', sql.NVarChar(32), orderNumber)
      .input('userId', sql.UniqueIdentifier, userId)
      .input('key', sql.UniqueIdentifier, body.idempotencyKey)
      .input('name', sql.NVarChar(120), body.customerName.trim())
      .input('phone', sql.NVarChar(16), body.phone)
      .input('regionId', sql.UniqueIdentifier, regionRow.id)
      .input('province', sql.NVarChar(100), regionRow.province_ar)
      .input('neighborhood', sql.NVarChar(120), regionRow.neighborhood_ar)
      .input('details', sql.NVarChar(500), String(body.addressDetails || '').trim())
      .input('note', sql.NVarChar(500), String(body.deliveryNote || '').trim().slice(0, 500))
      .input('subtotal', sql.BigInt, subtotal)
      .input('fee', sql.BigInt, regionRow.delivery_fee_iqd)
      .input('total', sql.BigInt, subtotal + Number(regionRow.delivery_fee_iqd))
      .query(`INSERT INTO dbo.orders
        (id,order_number,customer_id,idempotency_key,customer_name,phone,region_id,province_ar,neighborhood_ar,address_details,delivery_note,subtotal_iqd,delivery_fee_iqd,total_iqd)
        VALUES (@id,@number,@userId,@key,@name,@phone,@regionId,@province,@neighborhood,@details,@note,@subtotal,@fee,@total)`);
    for (const item of items) {
      await transaction.request()
        .input('id', sql.UniqueIdentifier, crypto.randomUUID())
        .input('orderId', sql.UniqueIdentifier, orderId)
        .input('productId', sql.UniqueIdentifier, item.id)
        .input('branchId', sql.UniqueIdentifier, item.branch_id)
        .input('name', sql.NVarChar(200), item.name_ar)
        .input('sku', sql.NVarChar(80), item.sku)
        .input('price', sql.BigInt, item.price_iqd)
        .input('quantity', sql.Int, item.quantity)
        .input('lineTotal', sql.BigInt, item.line_total_iqd)
        .query(`INSERT INTO dbo.order_items
          (id,order_id,product_id,branch_id,product_name_ar,sku,unit_price_iqd,quantity,line_total_iqd)
          VALUES (@id,@orderId,@productId,@branchId,@name,@sku,@price,@quantity,@lineTotal)`);
    }
    if (body.saveAddress === true) {
      await transaction.request()
        .input('id', sql.UniqueIdentifier, crypto.randomUUID())
        .input('userId', sql.UniqueIdentifier, userId)
        .input('name', sql.NVarChar(120), body.customerName.trim())
        .input('phone', sql.NVarChar(16), body.phone)
        .input('regionId', sql.UniqueIdentifier, regionRow.id)
        .input('province', sql.NVarChar(100), regionRow.province_ar)
        .input('neighborhood', sql.NVarChar(120), regionRow.neighborhood_ar)
        .input('details', sql.NVarChar(500), String(body.addressDetails || '').trim())
        .input('note', sql.NVarChar(500), String(body.deliveryNote || '').trim().slice(0, 500))
        .query(`INSERT INTO dbo.customer_addresses
          (id,user_id,recipient_name,phone,region_id,province_ar,neighborhood_ar,address_details,delivery_note,is_default)
          VALUES (@id,@userId,@name,@phone,@regionId,@province,@neighborhood,@details,@note,
          CASE WHEN NOT EXISTS (SELECT 1 FROM dbo.customer_addresses WHERE user_id=@userId AND is_default=1) THEN 1 ELSE 0 END)`);
    }
    await transaction.commit();
    response.status(201).json({ order_number: orderNumber });
  } catch (error) {
    if (transaction._aborted !== true) {
      try { await transaction.rollback(); } catch (rollbackError) { console.error('Order transaction rollback failed:', rollbackError); }
    }
    next(error);
  }
});

app.post('/api/admin/bootstrap', async (request, response, next) => {
  try {
    const { email, password, bootstrapToken } = request.body || {};
    const requiredToken = process.env.ADMIN_BOOTSTRAP_TOKEN || '';
    if (!requiredToken || typeof bootstrapToken !== 'string' ||
        !secureEquals(bootstrapToken, requiredToken)) {
      return response.status(403).json({ error: 'تهيئة المدير غير مخوّلة.' });
    }
    if (typeof email !== 'string' || !email.includes('@') || !validPassword(password)) {
      return response.status(400).json({ error: 'أدخل بريدًا صحيحًا وكلمة مرور لا تقل عن 12 محرفًا.' });
    }
    const existing = await pool.request().query(
      "SELECT TOP (1) id FROM dbo.app_users WHERE role = N'admin'",
    );
    if (existing.recordset.length) {
      return response.status(409).json({ error: 'يوجد حساب مدير بالفعل؛ أوقف رمز التهيئة.' });
    }
    const id = crypto.randomUUID();
    const { hash, salt } = hashPassword(password);
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('email', sql.NVarChar(254), email.trim().toLowerCase())
      .input('hash', sql.VarBinary(64), hash)
      .input('salt', sql.VarBinary(32), salt)
      .query("INSERT INTO dbo.app_users (id, email, password_hash, password_salt, role) VALUES (@id, @email, @hash, @salt, N'admin')");
    response.status(201).json({ status: 'created' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/admin', requireAuth, requireAdmin);

app.post('/api/admin/password', async (request, response, next) => {
  try {
    const { currentPassword, newPassword } = request.body || {};
    if (!validPassword(currentPassword) || !validPassword(newPassword)) {
      return response.status(400).json({ error: 'يجب أن تتكون كل كلمة مرور من 12 محرفًا على الأقل.' });
    }
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, request.user.sub)
      .query(`SELECT password_hash,password_salt FROM dbo.app_users
        WHERE id=@id AND role=N'admin'`);
    const admin = result.recordset[0];
    const supplied = admin?.password_salt
      ? crypto.scryptSync(currentPassword, admin.password_salt, 64)
      : Buffer.alloc(64);
    if (!admin?.password_hash || !crypto.timingSafeEqual(supplied, admin.password_hash)) {
      return response.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
    }
    const { hash, salt } = hashPassword(newPassword);
    await pool.request()
      .input('id', sql.UniqueIdentifier, request.user.sub)
      .input('hash', sql.VarBinary(64), hash)
      .input('salt', sql.VarBinary(32), salt)
      .query(`UPDATE dbo.app_users SET password_hash=@hash,password_salt=@salt WHERE id=@id`);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/customers', requireAuth, requireAdmin, async (_request, response, next) => {
  try {
    const { recordset } = await pool.request().query(`
      SELECT u.id, u.email, u.created_at,
        CAST(N'guest' AS nvarchar(16)) AS role,
        latest.phone,
        (SELECT COUNT_BIG(*) FROM dbo.orders o WHERE o.customer_id = u.id) AS order_count,
        (SELECT MAX(o.created_at) FROM dbo.orders o WHERE o.customer_id = u.id) AS last_order_at
      FROM dbo.app_users u
      OUTER APPLY (
        SELECT TOP (1) address.phone FROM dbo.customer_addresses address
        WHERE address.user_id=u.id ORDER BY address.created_at DESC
      ) latest
      WHERE u.role = N'guest' ORDER BY u.created_at DESC`);
    response.json(recordset);
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/summary', async (_request, response, next) => {
  try {
    const { recordset } = await pool.request().query(`
      SELECT
        (SELECT COUNT_BIG(*) FROM dbo.orders) AS order_count,
        (SELECT COUNT_BIG(*) FROM dbo.products) AS product_count,
        (SELECT COUNT_BIG(*) FROM dbo.maintenance_requests
          WHERE status IN (N'pending_review',N'confirmed',N'in_progress')) AS open_maintenance_count,
        (SELECT COALESCE(SUM(total_iqd),0) FROM (
          SELECT TOP (5) total_iqd FROM dbo.orders
          WHERE status=N'delivered' ORDER BY created_at DESC
        ) recent_delivered) AS recent_delivered_revenue_iqd`);
    response.json(recordset[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/orders/:id', async (request, response, next) => {
  try {
    const order = await pool.request()
      .input('id', sql.UniqueIdentifier, request.params.id)
      .query(`SELECT TOP (1) order_number,customer_name,phone,province_ar,neighborhood_ar,
          address_details,delivery_note,subtotal_iqd,delivery_fee_iqd,total_iqd,payment_method
        FROM dbo.orders WHERE id=@id`);
    if (!order.recordset[0]) return response.status(404).json({ error: 'الطلب غير موجود.' });
    const items = await pool.request()
      .input('id', sql.UniqueIdentifier, request.params.id)
      .query(`SELECT item.product_name_ar,item.sku,item.quantity,item.unit_price_iqd,
          item.line_total_iqd,branch.name_ar AS branch_name
        FROM dbo.order_items item
        LEFT JOIN dbo.branches branch ON branch.id=item.branch_id
        WHERE item.order_id=@id ORDER BY item.created_at`);
    response.json({ order: order.recordset[0], items: items.recordset });
  } catch (error) {
    next(error);
  }
});

const adminTables = {
  categories: ['name_ar', 'sort_order', 'is_active'],
  products: ['category_id', 'name_ar', 'brand', 'description_ar', 'sku', 'price_iqd', 'compare_at_price_iqd', 'image_urls', 'specifications', 'is_active'],
  product_compatibility: ['product_id', 'make', 'model', 'year_from', 'year_to'],
  branches: ['name_ar', 'address_ar', 'phone', 'is_active', 'sort_order'],
  delivery_regions: ['province_ar', 'neighborhood_ar', 'delivery_fee_iqd', 'is_active'],
  branch_inventory: ['branch_id', 'product_id', 'quantity_on_hand'],
  promotions: ['title_ar', 'body_ar', 'image_url', 'product_id', 'starts_at', 'ends_at', 'is_active', 'sort_order'],
  store_settings: ['store_name_ar', 'support_phone'],
};

function bindAdminValue(request, key, value) {
  if (key === 'is_active' || key === 'is_default') return request.input(key, sql.Bit, Boolean(value));
  if (['sort_order', 'quantity_on_hand', 'year_from', 'year_to'].includes(key)) {
    return request.input(key, sql.Int, value == null ? null : Number(value));
  }
  if (['price_iqd', 'compare_at_price_iqd', 'delivery_fee_iqd'].includes(key)) {
    return request.input(key, sql.BigInt, value == null ? null : Number(value));
  }
  if (['category_id', 'product_id', 'branch_id'].includes(key)) {
    return request.input(key, sql.UniqueIdentifier, value || null);
  }
  if (key === 'image_urls') return request.input(key, sql.NVarChar(sql.MAX), JSON.stringify(value || []));
  if (key === 'specifications') return request.input(key, sql.NVarChar(sql.MAX), JSON.stringify(value || {}));
  if (['starts_at', 'ends_at'].includes(key)) return request.input(key, sql.DateTime2, value ? new Date(value) : null);
  return request.input(key, sql.NVarChar(sql.MAX), value == null ? null : String(value));
}

app.get('/api/admin/data/:table', async (request, response, next) => {
  try {
    const table = request.params.table;
    const allowed = Object.hasOwn(adminTables, table) ||
      ['orders', 'order_items', 'maintenance_requests', 'customer_addresses', 'customer_motorcycles'].includes(table);
    if (!allowed) return response.status(404).json({ error: 'نوع البيانات غير معروف.' });
    const limit = Math.max(1, Math.min(500, Number(request.query.limit) || 200));
    const orderColumns = {
      categories: ['created_at', 'sort_order', 'name_ar'],
      products: ['created_at', 'name_ar', 'price_iqd'],
      product_compatibility: ['make', 'model', 'year_from'],
      branches: ['sort_order', 'name_ar'],
      delivery_regions: ['province_ar', 'neighborhood_ar', 'delivery_fee_iqd'],
      branch_inventory: ['updated_at', 'quantity_on_hand'],
      promotions: ['sort_order', 'starts_at', 'ends_at'],
      store_settings: ['id'],
      orders: ['created_at', 'order_number', 'status'],
      order_items: ['created_at', 'product_name_ar'],
      maintenance_requests: ['created_at', 'request_number', 'status'],
      customer_addresses: ['created_at', 'province_ar', 'recipient_name'],
      customer_motorcycles: ['created_at', 'make', 'model'],
    };
    const orderColumn = orderColumns[table].includes(request.query.order)
      ? request.query.order
      : orderColumns[table][0];
    const direction = request.query.ascending === 'true' ? 'ASC' : 'DESC';
    const dbRequest = pool.request().input('limit', sql.Int, limit);
    let query;
    if (table === 'branch_inventory' && request.query.branchId && request.query.productId) {
      dbRequest
        .input('branchId', sql.UniqueIdentifier, request.query.branchId)
        .input('productId', sql.UniqueIdentifier, request.query.productId);
      query = `SELECT TOP (@limit) inventory.*,
          (SELECT name_ar FROM dbo.products WHERE id=inventory.product_id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS product_json,
          (SELECT name_ar FROM dbo.branches WHERE id=inventory.branch_id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS branch_json
        FROM dbo.branch_inventory inventory
        WHERE inventory.branch_id=@branchId AND inventory.product_id=@productId
        ORDER BY inventory.[${orderColumn}] ${direction}`;
    } else if (table === 'branch_inventory') {
      query = `SELECT TOP (@limit) inventory.*,
          (SELECT name_ar FROM dbo.products WHERE id=inventory.product_id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS product_json,
          (SELECT name_ar FROM dbo.branches WHERE id=inventory.branch_id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS branch_json
        FROM dbo.branch_inventory inventory ORDER BY inventory.[${orderColumn}] ${direction}`;
    } else if (table === 'product_compatibility') {
      query = `SELECT TOP (@limit) compatibility.*,
          (SELECT name_ar FROM dbo.products WHERE id=compatibility.product_id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS product_json
        FROM dbo.product_compatibility compatibility
        ORDER BY compatibility.[${orderColumn}] ${direction}`;
    } else if (table === 'order_items') {
      query = `SELECT TOP (@limit) item.*,
          (SELECT name_ar FROM dbo.branches WHERE id=item.branch_id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS branch_json
        FROM dbo.order_items item ORDER BY item.[${orderColumn}] ${direction}`;
    } else {
      query = `SELECT TOP (@limit) * FROM dbo.[${table}] ORDER BY [${orderColumn}] ${direction}`;
    }
    const result = await dbRequest.query(query);
    const recordset = result.recordset.map((row) => {
      if (row.product_json !== undefined) {
        row.products = row.product_json ? JSON.parse(row.product_json) : null;
        delete row.product_json;
      }
      if (row.branch_json !== undefined) {
        row.branches = row.branch_json ? JSON.parse(row.branch_json) : null;
        delete row.branch_json;
      }
      return row;
    });
    response.json(recordset);
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/data/:table/:id', async (request, response, next) => {
  try {
    const { table, id } = request.params;
    const allowed = Object.hasOwn(adminTables, table) ||
      ['orders', 'order_items', 'maintenance_requests', 'customer_addresses', 'customer_motorcycles'].includes(table);
    if (!allowed) return response.status(404).json({ error: 'نوع البيانات غير معروف.' });
    let result;
    if (table === 'branch_inventory') {
      const [branchId, productId] = id.split('|');
      if (!branchId || !productId) {
        return response.status(400).json({ error: 'معرّف المخزون غير صالح.' });
      }
      result = await pool.request()
        .input('branchId', sql.UniqueIdentifier, branchId)
        .input('productId', sql.UniqueIdentifier, productId)
        .query('SELECT TOP (1) * FROM dbo.branch_inventory WHERE branch_id=@branchId AND product_id=@productId');
    } else {
      result = await pool.request()
        .input('id', table === 'store_settings' ? sql.Int : sql.UniqueIdentifier,
          table === 'store_settings' ? Number(id) : id)
        .query(`SELECT TOP (1) * FROM dbo.[${table}] WHERE id=@id`);
    }
    if (!result.recordset[0]) return response.status(404).json({ error: 'السجل غير موجود.' });
    response.json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/data/:table', async (request, response, next) => {
  try {
    const table = request.params.table;
    const fields = adminTables[table];
    if (!fields) return response.status(404).json({ error: 'هذا النوع لا يدعم الإضافة.' });
    const body = request.body || {};
    const entries = Object.entries(body).filter(([key]) => fields.includes(key));
    if (!entries.length) return response.status(400).json({ error: 'لا توجد حقول صالحة للحفظ.' });
    if (table === 'branch_inventory') {
      const values = Object.fromEntries(entries);
      if (!values.branch_id || !values.product_id ||
          !Number.isInteger(Number(values.quantity_on_hand)) || Number(values.quantity_on_hand) < 0) {
        return response.status(400).json({ error: 'بيانات المخزون غير صالحة.' });
      }
      const result = await pool.request()
        .input('branchId', sql.UniqueIdentifier, values.branch_id)
        .input('productId', sql.UniqueIdentifier, values.product_id)
        .input('quantity', sql.Int, Number(values.quantity_on_hand))
        .query(`IF EXISTS (SELECT 1 FROM dbo.branch_inventory WHERE branch_id=@branchId AND product_id=@productId)
          UPDATE dbo.branch_inventory SET quantity_on_hand=@quantity,updated_at=SYSUTCDATETIME()
            WHERE branch_id=@branchId AND product_id=@productId;
        ELSE
          INSERT INTO dbo.branch_inventory (branch_id,product_id,quantity_on_hand)
            VALUES (@branchId,@productId,@quantity);
        SELECT @branchId AS branch_id,@productId AS product_id`);
      response.status(201).json(result.recordset[0]);
      return;
    }
    const id = crypto.randomUUID();
    const dbRequest = pool.request().input('id', sql.UniqueIdentifier, id);
    for (const [key, value] of entries) bindAdminValue(dbRequest, key, value);
    const columns = entries.map(([key]) => `[${key}]`).join(',');
    const parameters = entries.map(([key]) => `@${key}`).join(',');
    await dbRequest.query(`INSERT INTO dbo.[${table}] (id,${columns}) VALUES (@id,${parameters})`);
    response.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/data/:table/:id', async (request, response, next) => {
  try {
    const table = request.params.table;
    if (table === 'orders' || table === 'maintenance_requests') {
      const transitions = table === 'orders'
        ? {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['preparing', 'cancelled'],
            preparing: ['out_for_delivery', 'cancelled'],
            out_for_delivery: ['delivered', 'cancelled'],
          }
        : {
            pending_review: ['confirmed', 'cancelled'],
            confirmed: ['in_progress', 'cancelled'],
            in_progress: ['completed', 'cancelled'],
          };
      const newStatus = request.body?.status;
      if (!Object.values(transitions).some((values) => values.includes(newStatus))) {
        return response.status(400).json({ error: 'حالة السجل غير صالحة.' });
      }
      const transaction = new sql.Transaction(pool);
      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      try {
        const record = await transaction.request()
          .input('id', sql.UniqueIdentifier, request.params.id)
          .query(`SELECT TOP (1) id,status,customer_id,
              ${table === 'orders' ? 'order_number' : 'request_number'} AS record_number
            FROM dbo.[${table}] WITH (UPDLOCK,HOLDLOCK) WHERE id=@id`);
        const current = record.recordset[0];
        if (!current) {
          await transaction.rollback();
          return response.status(404).json({ error: 'السجل غير موجود.' });
        }
        if (!transitions[current.status]?.includes(newStatus)) {
          await transaction.rollback();
          return response.status(409).json({ error: 'انتقال الحالة غير مسموح.' });
        }
        if (table === 'orders' && newStatus === 'cancelled') {
          await transaction.request()
            .input('orderId', sql.UniqueIdentifier, request.params.id)
            .query(`UPDATE inventory
              SET inventory.quantity_on_hand = inventory.quantity_on_hand + items.quantity,
                  inventory.updated_at = SYSUTCDATETIME()
              FROM dbo.branch_inventory inventory
              JOIN (
                SELECT branch_id, product_id, SUM(quantity) AS quantity
                FROM dbo.order_items
                WHERE order_id=@orderId AND product_id IS NOT NULL
                GROUP BY branch_id, product_id
              ) items ON items.branch_id=inventory.branch_id AND items.product_id=inventory.product_id`);
        }
        await transaction.request()
          .input('id', sql.UniqueIdentifier, request.params.id)
          .input('status', sql.NVarChar(24), newStatus)
          .query(`UPDATE dbo.[${table}] SET status=@status,updated_at=SYSUTCDATETIME() WHERE id=@id`);
        const statusLabels = {
          pending: 'بانتظار التأكيد', confirmed: 'مؤكد', preparing: 'قيد التجهيز',
          out_for_delivery: 'في الطريق', delivered: 'تم التسليم', cancelled: 'ملغي',
          pending_review: 'بانتظار المراجعة', in_progress: 'قيد التنفيذ', completed: 'مكتمل',
        };
        const title = table === 'orders' ? 'تحديث حالة طلبك' : 'تحديث طلب الصيانة';
        const body = `تم تحديث ${current.record_number} إلى: ${statusLabels[newStatus]}`;
        await transaction.request()
          .input('userId', sql.UniqueIdentifier, current.customer_id)
          .input('title', sql.NVarChar(160), title)
          .input('body', sql.NVarChar(500), body)
          .query(`INSERT INTO dbo.customer_notifications (user_id,title_ar,body_ar)
            VALUES (@userId,@title,@body)`);
        await transaction.commit();
        response.status(204).end();
      } catch (error) {
        if (transaction._aborted !== true) {
          try { await transaction.rollback(); } catch (rollbackError) { console.error('Status update rollback failed:', rollbackError); }
        }
        throw error;
      }
      return;
    }
    const fields = adminTables[table];
    if (!fields) return response.status(404).json({ error: 'هذا النوع لا يدعم التعديل.' });
    const entries = Object.entries(request.body || {}).filter(([key]) => fields.includes(key));
    if (!entries.length) return response.status(400).json({ error: 'لا توجد حقول صالحة للتعديل.' });
    if (table === 'branch_inventory') {
      const [branchId, productId] = request.params.id.split('|');
      if (!branchId || !productId) return response.status(400).json({ error: 'معرّف المخزون غير صالح.' });
      const dbRequest = pool.request()
        .input('branch_id', sql.UniqueIdentifier, branchId)
        .input('product_id', sql.UniqueIdentifier, productId);
      for (const [key, value] of entries) {
        if (key === 'branch_id' || key === 'product_id') continue;
        bindAdminValue(dbRequest, key, value);
      }
      const assignments = entries.filter(([key]) => !['branch_id', 'product_id'].includes(key))
        .map(([key]) => `[${key}]=@${key}`).join(',');
      const result = await dbRequest.query(`UPDATE dbo.branch_inventory
        SET ${assignments},updated_at=SYSUTCDATETIME()
        WHERE branch_id=@branch_id AND product_id=@product_id`);
      if (!result.rowsAffected[0]) return response.status(404).json({ error: 'السجل غير موجود.' });
      response.status(204).end();
      return;
    }
    const dbRequest = pool.request().input(
      'id',
      table === 'store_settings' ? sql.Int : sql.UniqueIdentifier,
      table === 'store_settings' ? Number(request.params.id) : request.params.id,
    );
    for (const [key, value] of entries) bindAdminValue(dbRequest, key, value);
    const assignments = entries.map(([key]) => `[${key}]=@${key}`).join(',');
    const result = await dbRequest.query(`UPDATE dbo.[${table}] SET ${assignments}, updated_at=SYSUTCDATETIME() WHERE id=@id`);
    if (!result.rowsAffected[0]) return response.status(404).json({ error: 'السجل غير موجود.' });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/data/:table/:id', async (request, response, next) => {
  try {
    if (request.params.table !== 'product_compatibility') {
      return response.status(403).json({ error: 'الحذف غير متاح لهذا النوع من السجلات.' });
    }
    await pool.request().input('id', sql.UniqueIdentifier, request.params.id)
      .query('DELETE FROM dbo.product_compatibility WHERE id=@id');
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

const mimeExtensions = new Map([
  ['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'],
]);

app.post('/api/admin/images', requireAuth, requireAdmin, async (request, response, next) => {
  try {
    const contentType = request.get('content-type') || '';
    const extension = mimeExtensions.get(contentType);
    const length = Number(request.get('content-length') || 0);
    if (!extension || length < 1 || length > 5 * 1024 * 1024) {
      return response.status(400).json({ error: 'الصورة يجب أن تكون PNG أو JPG أو WebP وأقل من 5 MB.' });
    }

    if (isR2Configured()) {
      // Buffer the incoming stream, then upload to Cloudflare R2.
      const chunks = [];
      let total = 0;
      for await (const chunk of request) {
        total += chunk.length;
        if (total > 5 * 1024 * 1024) {
          return response.status(400).json({ error: 'الصورة أكبر من 5 MB.' });
        }
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const { url } = await uploadImage(buffer, { mimeType: contentType });
      return response.status(201).json({ image_url: url });
    }

    // Fallback: local disk (used when R2 is not configured).
    fs.mkdirSync(imageDirectory, { recursive: true });
    const id = `${crypto.randomUUID()}${extension}`;
    const target = path.join(imageDirectory, id);
    const output = fs.createWriteStream(target, { flags: 'wx' });
    request.pipe(output);
    output.on('finish', () => response.status(201).json({ image_url: `/images/${id}` }));
    output.on('error', next);
  } catch (error) {
    next(error);
  }
});

app.use('/images', express.static(imageDirectory, {
  fallthrough: false,
  index: false,
  dotfiles: 'deny',
  immutable: true,
  maxAge: '7d',
}));

app.use((error, _request, response, _next) => {
  console.error('Local API request failed:', error);
  if (response.headersSent) return;
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  response.status(status).json({
    error: status < 500 ? error.message : 'حدث خطأ داخلي. راجع سجل خادم المتجر.',
  });
});

async function start() {
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
  }
  pool = await sql.connect(sqlConfig);
  await pool.request().query('SELECT 1');
  const adminCount = await pool.request().query(
    "SELECT COUNT(*) AS total FROM dbo.app_users WHERE role = N'admin'",
  );
  const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN || '';
  if (adminCount.recordset[0].total === 0 && bootstrapToken.length < 32) {
    throw new Error('Set ADMIN_BOOTSTRAP_TOKEN to a random value of at least 32 characters before the first administrator is created.');
  }
  if (bootstrapToken && bootstrapToken.length < 32) {
    throw new Error('ADMIN_BOOTSTRAP_TOKEN must be at least 32 characters when configured.');
  }
  app.listen(port, host, () => {
    console.log(`Dokan local API listening on http://${host}:${port}`);
  });
}

start().catch((error) => {
  console.error('Unable to start the Dokan local API:', error);
  process.exitCode = 1;
});
