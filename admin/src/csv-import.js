export const CSV_STOCK_BRANCHES = {
  stock_dora: 'الدورة',
  stock_qahira: 'القاهرة',
};

const TEMPLATE_HEADERS = [
  'name_ar',
  'brand',
  'description_ar',
  'category_ar',
  'price_iqd',
  'compare_at_price_iqd',
  'sku',
  'image_urls',
  'specifications',
  'is_active',
  ...Object.keys(CSV_STOCK_BRANCHES),
];

const TEMPLATE_SAMPLE = [
  'زيت محرك 5W-30',
  'كاسترول',
  'زيت محرك تخليقي بالكامل.',
  'زيوت',
  '25000',
  '30000',
  '',
  'https://example.com/a.jpg|https://example.com/b.jpg',
  '{"اللزوجة":"5W-30"}',
  'true',
  '10',
  '5',
];

function csvCell(value) {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function pick(record, ...keys) {
  for (const key of keys) {
    const value = record[key];
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

export function parseCsv(text) {
  const src = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 1; } else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => String(cell).trim() !== ''));
}

export function csvToObjects(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => String(header).trim());
  return rows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] != null ? String(cells[index]).trim() : '';
    });
    return record;
  });
}

export function buildProductsTemplateCsv() {
  const lines = [
    TEMPLATE_HEADERS.map(csvCell).join(','),
    TEMPLATE_SAMPLE.map(csvCell).join(','),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function normalizeArabic(value) {
  return String(value ?? '')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchCategory(value, categories) {
  const target = normalizeArabic(value);
  if (!target || target.length < 2) return null;
  const normed = categories.map((category) => ({ category, norm: normalizeArabic(category.name_ar) }));
  const exact = normed.find((entry) => entry.norm === target);
  if (exact) return exact.category;
  const partial = normed.find((entry) => entry.norm.includes(target) || target.includes(entry.norm));
  return partial ? partial.category : null;
}

function notFoundMessage(value, categories) {
  const names = categories.slice(0, 5).map((category) => category.name_ar);
  const more = categories.length > 5 ? '…' : '';
  return `القسم «${value}» غير موجود.\n`
    + `الأقسام المتاحة: ${names.join('، ')}${more}.\n`
    + 'أضف القسم أولاً من صفحة "الأقسام".';
}

export function validateProductRow(record, { categories = [], branchMap = new Map(), rowNumber = 0 } = {}) {
  const errors = [];
  const prefix = rowNumber ? `صف ${rowNumber}: ` : '';

  const nameAr = pick(record, 'name_ar', 'name');
  if (!nameAr) errors.push('الاسم مطلوب.');
  else if (nameAr.length > 200) errors.push('الاسم يتجاوز 200 حرف.');

  const priceRaw = pick(record, 'price_iqd', 'price');
  const price = Number(priceRaw);
  if (!priceRaw) errors.push('السعر مطلوب.');
  else if (!Number.isInteger(price) || price < 1 || price > 1e12) errors.push('السعر غير صالح (عدد صحيح ≥ 1).');

  let compareAt = null;
  const compareRaw = pick(record, 'compare_at_price_iqd', 'compare_at_price');
  if (compareRaw) {
    const value = Number(compareRaw);
    if (!Number.isInteger(value) || value < 1) errors.push('سعر المقارنة غير صالح.');
    else if (Number.isInteger(price) && value < price) errors.push('سعر المقارنة يجب أن يكون ≥ السعر.');
    else compareAt = value;
  }

  const categoryName = pick(record, 'category_ar', 'category');
  let categoryId = null;
  if (!categoryName) {
    errors.push('القسم مطلوب.');
  } else {
    const match = matchCategory(categoryName, categories);
    if (!match) errors.push(notFoundMessage(categoryName, categories));
    else categoryId = match.id;
  }

  const imageUrls = String(record.image_urls || '')
    .split(/[|;]/)
    .map((url) => url.trim())
    .filter(Boolean);

  let specifications = {};
  const specRaw = pick(record, 'specifications');
  if (specRaw) {
    try {
      const parsed = JSON.parse(specRaw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) specifications = parsed;
      else errors.push('المواصفات يجب أن تكون كائن JSON.');
    } catch {
      errors.push('المواصفات ليست JSON صالحاً.');
    }
  }

  const isActive = ['true', '1', 'نعم', 'yes'].includes(String(record.is_active || '').trim().toLowerCase());

  const stocks = [];
  for (const [header, branchName] of Object.entries(CSV_STOCK_BRANCHES)) {
    const raw = String(record[header] || '').trim();
    if (!raw) continue;
    const quantity = Number(raw);
    if (!Number.isInteger(quantity) || quantity < 0) {
      errors.push(`الكمية في «${header}» غير صالحة.`);
      continue;
    }
    const branchId = branchMap.get(branchName);
    if (!branchId) {
      errors.push(`الفرع «${branchName}» غير موجود أو غير مفعّل.`);
      continue;
    }
    stocks.push({ branch_id: branchId, quantity_on_hand: quantity });
  }

  return {
    ok: errors.length === 0,
    errors: errors.map((message) => `${prefix}${message}`),
    data: {
      name_ar: nameAr,
      brand: pick(record, 'brand') || null,
      description_ar: pick(record, 'description_ar', 'description'),
      category_id: categoryId,
      price_iqd: price,
      compare_at_price_iqd: compareAt,
      sku: pick(record, 'sku') || null,
      image_urls: imageUrls,
      specifications,
      is_active: isActive,
      _stocks: stocks,
    },
  };
}

export function normalizeProductRecord(data, fallbackSku) {
  const { _stocks, ...row } = data;
  return { ...row, sku: row.sku || fallbackSku, _stocks };
}
