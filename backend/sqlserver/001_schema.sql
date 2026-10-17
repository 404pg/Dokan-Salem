IF DB_ID(N'DokanSaleem') IS NULL
    CREATE DATABASE DokanSaleem;
GO
USE DokanSaleem;
GO

IF OBJECT_ID(N'dbo.app_users', N'U') IS NULL
CREATE TABLE dbo.app_users (
    id uniqueidentifier NOT NULL CONSTRAINT PK_app_users PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    email nvarchar(254) NULL,
    password_hash varbinary(64) NULL,
    password_salt varbinary(32) NULL,
    role nvarchar(16) NOT NULL CONSTRAINT DF_app_users_role DEFAULT N'guest',
    created_at datetime2(3) NOT NULL CONSTRAINT DF_app_users_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_app_users_role CHECK (role IN (N'guest', N'admin'))
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_app_users_email' AND object_id=OBJECT_ID(N'dbo.app_users'))
    CREATE UNIQUE INDEX UX_app_users_email ON dbo.app_users(email) WHERE email IS NOT NULL;
GO
IF OBJECT_ID(N'dbo.categories', N'U') IS NULL
CREATE TABLE dbo.categories (
    id uniqueidentifier NOT NULL CONSTRAINT PK_categories PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    name_ar nvarchar(100) NOT NULL,
    sort_order int NOT NULL CONSTRAINT DF_categories_order DEFAULT 0,
    is_active bit NOT NULL CONSTRAINT DF_categories_active DEFAULT 0,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_categories_created DEFAULT SYSUTCDATETIME(),
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_categories_updated DEFAULT SYSUTCDATETIME()
);
GO
IF OBJECT_ID(N'dbo.products', N'U') IS NULL
CREATE TABLE dbo.products (
    id uniqueidentifier NOT NULL CONSTRAINT PK_products PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    category_id uniqueidentifier NULL,
    name_ar nvarchar(200) NOT NULL,
    brand nvarchar(120) NULL,
    description_ar nvarchar(2000) NOT NULL CONSTRAINT DF_products_description DEFAULT N'',
    sku nvarchar(80) NULL,
    price_iqd bigint NOT NULL,
    compare_at_price_iqd bigint NULL,
    image_urls nvarchar(max) NOT NULL CONSTRAINT DF_products_images DEFAULT N'[]',
    specifications nvarchar(max) NOT NULL CONSTRAINT DF_products_specs DEFAULT N'{}',
    is_active bit NOT NULL CONSTRAINT DF_products_active DEFAULT 0,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_products_created DEFAULT SYSUTCDATETIME(),
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_products_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_products_categories FOREIGN KEY (category_id) REFERENCES dbo.categories(id) ON DELETE SET NULL,
    CONSTRAINT UQ_products_sku UNIQUE (sku),
    CONSTRAINT CK_products_price CHECK (price_iqd BETWEEN 1 AND 1000000000000),
    CONSTRAINT CK_products_images_json CHECK (ISJSON(image_urls) = 1),
    CONSTRAINT CK_products_specs_json CHECK (ISJSON(specifications) = 1)
);
GO
IF OBJECT_ID(N'dbo.branches', N'U') IS NULL
CREATE TABLE dbo.branches (
    id uniqueidentifier NOT NULL CONSTRAINT PK_branches PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    name_ar nvarchar(160) NOT NULL,
    address_ar nvarchar(500) NOT NULL,
    phone nvarchar(32) NULL,
    is_active bit NOT NULL CONSTRAINT DF_branches_active DEFAULT 1,
    sort_order int NOT NULL CONSTRAINT DF_branches_order DEFAULT 0,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_branches_created DEFAULT SYSUTCDATETIME(),
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_branches_updated DEFAULT SYSUTCDATETIME()
);
GO
IF OBJECT_ID(N'dbo.delivery_regions', N'U') IS NULL
CREATE TABLE dbo.delivery_regions (
    id uniqueidentifier NOT NULL CONSTRAINT PK_delivery_regions PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    province_ar nvarchar(100) NOT NULL,
    neighborhood_ar nvarchar(120) NOT NULL,
    delivery_fee_iqd bigint NOT NULL,
    is_active bit NOT NULL CONSTRAINT DF_delivery_regions_active DEFAULT 1,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_delivery_regions_created DEFAULT SYSUTCDATETIME(),
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_delivery_regions_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_delivery_regions_name UNIQUE (province_ar, neighborhood_ar),
    CONSTRAINT CK_delivery_regions_fee CHECK (delivery_fee_iqd BETWEEN 0 AND 1000000000)
);
GO
IF OBJECT_ID(N'dbo.branch_inventory', N'U') IS NULL
CREATE TABLE dbo.branch_inventory (
    branch_id uniqueidentifier NOT NULL,
    product_id uniqueidentifier NOT NULL,
    quantity_on_hand int NOT NULL CONSTRAINT DF_inventory_quantity DEFAULT 0,
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_inventory_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_branch_inventory PRIMARY KEY (branch_id, product_id),
    CONSTRAINT FK_inventory_branch FOREIGN KEY (branch_id) REFERENCES dbo.branches(id) ON DELETE CASCADE,
    CONSTRAINT FK_inventory_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
    CONSTRAINT CK_inventory_quantity CHECK (quantity_on_hand >= 0)
);
GO
IF OBJECT_ID(N'dbo.customer_addresses', N'U') IS NULL
CREATE TABLE dbo.customer_addresses (
    id uniqueidentifier NOT NULL CONSTRAINT PK_customer_addresses PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    user_id uniqueidentifier NOT NULL,
    recipient_name nvarchar(120) NOT NULL,
    phone nvarchar(16) NOT NULL,
    region_id uniqueidentifier NOT NULL,
    province_ar nvarchar(100) NOT NULL,
    neighborhood_ar nvarchar(120) NOT NULL,
    address_details nvarchar(500) NOT NULL,
    delivery_note nvarchar(500) NOT NULL CONSTRAINT DF_addresses_note DEFAULT N'',
    is_default bit NOT NULL CONSTRAINT DF_addresses_default DEFAULT 0,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_addresses_created DEFAULT SYSUTCDATETIME(),
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_addresses_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_addresses_user FOREIGN KEY (user_id) REFERENCES dbo.app_users(id) ON DELETE CASCADE,
    CONSTRAINT FK_addresses_region FOREIGN KEY (region_id) REFERENCES dbo.delivery_regions(id)
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_customer_addresses_default' AND object_id=OBJECT_ID(N'dbo.customer_addresses'))
    CREATE UNIQUE INDEX UX_customer_addresses_default ON dbo.customer_addresses(user_id) WHERE is_default = 1;
GO
IF OBJECT_ID(N'dbo.customer_motorcycles', N'U') IS NULL
CREATE TABLE dbo.customer_motorcycles (
    id uniqueidentifier NOT NULL CONSTRAINT PK_customer_motorcycles PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    user_id uniqueidentifier NOT NULL,
    make nvarchar(80) NOT NULL,
    model nvarchar(100) NOT NULL,
    [year] smallint NULL,
    nickname nvarchar(80) NOT NULL CONSTRAINT DF_motorcycles_nickname DEFAULT N'',
    created_at datetime2(3) NOT NULL CONSTRAINT DF_motorcycles_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_motorcycles_user FOREIGN KEY (user_id) REFERENCES dbo.app_users(id) ON DELETE CASCADE
);
GO
IF OBJECT_ID(N'dbo.wishlist_items', N'U') IS NULL
CREATE TABLE dbo.wishlist_items (
    user_id uniqueidentifier NOT NULL,
    product_id uniqueidentifier NOT NULL,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_wishlist_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_wishlist_items PRIMARY KEY (user_id, product_id),
    CONSTRAINT FK_wishlist_user FOREIGN KEY (user_id) REFERENCES dbo.app_users(id) ON DELETE CASCADE,
    CONSTRAINT FK_wishlist_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
);
GO
IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
CREATE TABLE dbo.orders (
    id uniqueidentifier NOT NULL CONSTRAINT PK_orders PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    order_number nvarchar(32) NOT NULL,
    customer_id uniqueidentifier NOT NULL,
    idempotency_key uniqueidentifier NOT NULL,
    status nvarchar(24) NOT NULL CONSTRAINT DF_orders_status DEFAULT N'pending',
    customer_name nvarchar(120) NOT NULL,
    phone nvarchar(16) NOT NULL,
    region_id uniqueidentifier NOT NULL,
    province_ar nvarchar(100) NOT NULL,
    neighborhood_ar nvarchar(120) NOT NULL,
    address_details nvarchar(500) NOT NULL,
    delivery_note nvarchar(500) NOT NULL CONSTRAINT DF_orders_note DEFAULT N'',
    subtotal_iqd bigint NOT NULL,
    delivery_fee_iqd bigint NOT NULL,
    total_iqd bigint NOT NULL,
    payment_method nvarchar(32) NOT NULL CONSTRAINT DF_orders_payment DEFAULT N'cash_on_delivery',
    created_at datetime2(3) NOT NULL CONSTRAINT DF_orders_created DEFAULT SYSUTCDATETIME(),
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_orders_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_orders_number UNIQUE (order_number),
    CONSTRAINT UQ_orders_idempotency UNIQUE (customer_id, idempotency_key),
    CONSTRAINT FK_orders_customer FOREIGN KEY (customer_id) REFERENCES dbo.app_users(id),
    CONSTRAINT FK_orders_region FOREIGN KEY (region_id) REFERENCES dbo.delivery_regions(id),
    CONSTRAINT CK_orders_status CHECK (status IN (N'pending',N'confirmed',N'preparing',N'out_for_delivery',N'delivered',N'cancelled')),
    CONSTRAINT CK_orders_total CHECK (subtotal_iqd > 0 AND delivery_fee_iqd >= 0 AND total_iqd = subtotal_iqd + delivery_fee_iqd)
);
GO
IF OBJECT_ID(N'dbo.order_items', N'U') IS NULL
CREATE TABLE dbo.order_items (
    id uniqueidentifier NOT NULL CONSTRAINT PK_order_items PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    order_id uniqueidentifier NOT NULL,
    product_id uniqueidentifier NULL,
    branch_id uniqueidentifier NOT NULL,
    product_name_ar nvarchar(200) NOT NULL,
    sku nvarchar(80) NULL,
    unit_price_iqd bigint NOT NULL,
    quantity int NOT NULL,
    line_total_iqd bigint NOT NULL,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_order_items_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_order_items_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_order_items_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE SET NULL,
    CONSTRAINT FK_order_items_branch FOREIGN KEY (branch_id) REFERENCES dbo.branches(id),
    CONSTRAINT CK_order_items_total CHECK (unit_price_iqd > 0 AND quantity BETWEEN 1 AND 999 AND line_total_iqd = unit_price_iqd * quantity)
);
GO
IF OBJECT_ID(N'dbo.product_compatibility', N'U') IS NULL
CREATE TABLE dbo.product_compatibility (
    id uniqueidentifier NOT NULL CONSTRAINT PK_product_compatibility PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    product_id uniqueidentifier NOT NULL,
    make nvarchar(80) NOT NULL,
    model nvarchar(100) NOT NULL,
    year_from smallint NULL,
    year_to smallint NULL,
    CONSTRAINT FK_compatibility_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
    CONSTRAINT CK_compatibility_years CHECK ((year_from IS NULL OR year_from BETWEEN 1900 AND 2200) AND (year_to IS NULL OR year_to BETWEEN 1900 AND 2200) AND (year_from IS NULL OR year_to IS NULL OR year_to >= year_from)),
    CONSTRAINT UQ_compatibility UNIQUE (product_id, make, model, year_from, year_to)
);
GO
IF OBJECT_ID(N'dbo.promotions', N'U') IS NULL
CREATE TABLE dbo.promotions (
    id uniqueidentifier NOT NULL CONSTRAINT PK_promotions PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    title_ar nvarchar(160) NOT NULL,
    body_ar nvarchar(500) NOT NULL CONSTRAINT DF_promotions_body DEFAULT N'',
    image_url nvarchar(1000) NULL,
    product_id uniqueidentifier NULL,
    starts_at datetime2(3) NULL,
    ends_at datetime2(3) NULL,
    is_active bit NOT NULL CONSTRAINT DF_promotions_active DEFAULT 0,
    sort_order int NOT NULL CONSTRAINT DF_promotions_order DEFAULT 0,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_promotions_created DEFAULT SYSUTCDATETIME(),
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_promotions_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_promotions_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE SET NULL
);
GO
IF OBJECT_ID(N'dbo.maintenance_requests', N'U') IS NULL
CREATE TABLE dbo.maintenance_requests (
    id uniqueidentifier NOT NULL CONSTRAINT PK_maintenance_requests PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    request_number nvarchar(32) NOT NULL,
    customer_id uniqueidentifier NOT NULL,
    service_type nvarchar(16) NOT NULL,
    branch_id uniqueidentifier NULL,
    motorcycle nvarchar(120) NOT NULL,
    description nvarchar(2000) NOT NULL,
    preferred_date date NULL,
    status nvarchar(24) NOT NULL CONSTRAINT DF_maintenance_status DEFAULT N'pending_review',
    created_at datetime2(3) NOT NULL CONSTRAINT DF_maintenance_created DEFAULT SYSUTCDATETIME(),
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_maintenance_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_maintenance_number UNIQUE (request_number),
    CONSTRAINT FK_maintenance_customer FOREIGN KEY (customer_id) REFERENCES dbo.app_users(id) ON DELETE CASCADE,
    CONSTRAINT FK_maintenance_branch FOREIGN KEY (branch_id) REFERENCES dbo.branches(id),
    CONSTRAINT CK_maintenance_service CHECK ((service_type = N'workshop' AND branch_id IS NOT NULL) OR (service_type = N'onsite' AND branch_id IS NULL))
);
GO
IF OBJECT_ID(N'dbo.customer_notifications', N'U') IS NULL
CREATE TABLE dbo.customer_notifications (
    id uniqueidentifier NOT NULL CONSTRAINT PK_customer_notifications PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    user_id uniqueidentifier NOT NULL,
    title_ar nvarchar(160) NOT NULL,
    body_ar nvarchar(500) NOT NULL,
    is_read bit NOT NULL CONSTRAINT DF_notifications_read DEFAULT 0,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_notifications_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES dbo.app_users(id) ON DELETE CASCADE
);
GO
IF OBJECT_ID(N'dbo.store_settings', N'U') IS NULL
CREATE TABLE dbo.store_settings (
    id int NOT NULL CONSTRAINT PK_store_settings PRIMARY KEY,
    store_name_ar nvarchar(160) NOT NULL,
    support_phone nvarchar(32) NULL,
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_settings_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_store_settings_singleton CHECK (id = 1)
);
GO
