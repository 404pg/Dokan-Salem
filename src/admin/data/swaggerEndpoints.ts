import { SwaggerEndpoint } from '../../types/adminTypes';

export const SWAGGER_ENDPOINTS: SwaggerEndpoint[] = [
  {
    id: 'get-products',
    method: 'GET',
    path: '/api/v1/products',
    summary: 'استرجاع قائمة قطع الغيار والزيوت مع فلترة التوافق وفروع بغداد',
    tag: 'Products & Catalog',
    parameters: [
      { name: 'category', in: 'query', required: false, type: 'string', description: 'تصنيف القطعة (brakes, oils, engine...)' },
      { name: 'bike_model', in: 'query', required: false, type: 'string', description: 'طراز الدراجة (e.g. Boxer 150, CBR 600)' },
      { name: 'branch_id', in: 'query', required: false, type: 'string', description: 'فرع التوفر (dora, qahira, sinak)' },
    ],
    responses: {
      '200': {
        description: 'نجاح الاستعلام - إرجاع قائمة القطع المتاحة',
        sample: {
          status: 'success',
          total: 6,
          data: [
            {
              id: 'brembo-brakes-7045',
              sku: 'BRM-7045-SP',
              name: 'طقم سفايف فرامل سيراميك بريمبو',
              brand: 'Brembo Italy',
              price_iqd: 35000,
              stock: { dora: 8, qahira: 3, sinak: 24 },
              genuine_certified: true,
            },
            {
              id: 'motul-7100-oil',
              sku: 'MOT-7100-1040',
              name: 'زيت موتول 7100 10W-40',
              brand: 'Motul France',
              price_iqd: 22000,
              stock: { dora: 15, qahira: 9, sinak: 60 },
              genuine_certified: true,
            },
          ],
        },
      },
    },
  },
  {
    id: 'post-order-cod',
    method: 'POST',
    path: '/api/v1/orders/checkout-cod',
    summary: 'إنشاء طلبية جديدة والدفع نقدًا عند الاستلام (COD) في بغداد والمحافظات',
    tag: 'Orders & Fulfillment',
    requestBodySample: {
      recipient_name: 'سجاد العراقي',
      phone_number: '07701234567',
      fulfillment_type: 'delivery',
      delivery_district: 'الكرادة',
      street_address: 'قرب ساحة الطيران، عمارة الأمل',
      items: [
        { sku: 'MOT-7100-1040', quantity: 2 },
        { sku: 'BRM-7045-SP', quantity: 1 },
      ],
      payment_method: 'COD',
    },
    responses: {
      '201': {
        description: 'تم إنشاء الطلب بنجاح وتوجيهه لمستودع التجهيز',
        sample: {
          status: 'created',
          order_id: 'ORD-9942',
          subtotal_iqd: 79000,
          delivery_fee_iqd: 5000,
          total_iqd: 84000,
          currency: 'IQD',
          payment: 'CASH_ON_DELIVERY',
          fulfillment: {
            hub: 'DORA_LOGISTICS',
            courier_assigned: false,
            estimated_delivery: 'خلال 45 دقيقة',
          },
        },
      },
      '400': {
        description: 'بيانات غير مكتملة أو نقص في المخزون',
        sample: { error: 'INVALID_PAYLOAD', message: 'يرجى تزويد رقم هاتف عراقي صالح' },
      },
    },
  },
  {
    id: 'post-maintenance-booking',
    method: 'POST',
    path: '/api/v1/maintenance/bookings',
    summary: 'حجز موعد صيانة داخل الورشة أو إرسال فيتر جوال في موقع العطل',
    tag: 'Workshop & Mobile Mechanics',
    requestBodySample: {
      service_type: 'mobile',
      baghdad_district: 'المنصور',
      exact_location: 'شارع 14 رمضان قرب مطعم الساعة',
      bike_make: 'Bajaj',
      bike_model: 'Boxer 150',
      bike_year: '2022',
      services: ['صيانة دورية وتبديل زيت وفلاتر', 'فحص منظومة الفرامل والدسك'],
      preferred_slot: 'MORNING_09_13',
    },
    responses: {
      '201': {
        description: 'تم تسجيل الحجز وإشعار أقرب فيتر جوال',
        sample: {
          status: 'confirmed',
          booking_id: 'DK-8842',
          mechanic_assigned: {
            name: 'أبو كرار الميكانيكي',
            phone: '07718765432',
            eta_minutes: 25,
            van_unit: 'VAN-BAGHDAD-04',
          },
          tracking_url: 'https://dokansaleem.iq/track/DK-8842',
        },
      },
    },
  },
  {
    id: 'get-branch-inventory',
    method: 'GET',
    path: '/api/v1/inventory/branches/stock',
    summary: 'الاستعلام عن أرصدة مستودعات بغداد والرفوف التخزينية',
    tag: 'Warehouse & Inventory',
    parameters: [
      { name: 'branch', in: 'query', required: true, type: 'string', description: 'dora, qahira, or sinak' },
    ],
    responses: {
      '200': {
        description: 'أرصدة الرفوف والقطع المتوفرة',
        sample: {
          branch_name: 'فرع بغداد - الدورة',
          updated_at: '2026-10-14T14:28:00Z',
          total_skus: 840,
          low_stock_alerts: 3,
          racks: [
            { rack_code: 'A-12', category: 'BRAKES_CERAMIC', items_count: 8 },
            { rack_code: 'B-04', category: 'SYNTHETIC_OILS', items_count: 24 },
          ],
        },
      },
    },
  },
  {
    id: 'post-sos-emergency-dispatch',
    method: 'POST',
    path: '/api/v1/dispatch/emergency-sos',
    summary: 'إطلاق دورية إنقاذ عاجلة لدراجة عاطلة في شوارع وطرق بغداد',
    tag: 'Dispatch & Fleet Telemetry',
    requestBodySample: {
      customer_phone: '07809988776',
      gps_coordinates: { latitude: 33.3152, longitude: 44.3661 },
      issue_type: 'BROKEN_CHAIN_OR_PUNCTURE',
      notes: 'دراجة باجاج متوقفة على سريع الدورة قرب جسر الطابقين',
    },
    responses: {
      '200': {
        description: 'تم تحريك أقرب فيتر طوارئ على دراجة التدخل السريع',
        sample: {
          dispatch_id: 'SOS-BAGHDAD-119',
          priority: 'CRITICAL',
          responder: 'علي السريع (دراجة التدخل 02)',
          current_eta: '12 دقيقة',
          status: 'EN_ROUTE',
        },
      },
    },
  },
];
