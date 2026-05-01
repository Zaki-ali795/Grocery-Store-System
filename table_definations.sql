CREATE TABLE Category(
    CategoryID          int Primary key Not Null Identity(1, 1),
    CategoryName        NVARCHAR(100) Unique Not Null,
    numberOfProduct    int Not Null Default 0 check(numberOfProduct >= 0)
);

CREATE TABLE Product(
    ProductID            INT Primary Key NOT NULL Identity(1, 1),
    CategoryID           INT NOT NULL,
    pName                NVARCHAR(150) NOT NULL,
    price                DECIMAL(10, 2) NOT NULL CHECK(Price >= 0),
    stock_Quantity       INT  NOT NULL DEFAULT 0 CHECK(stock_Quantity >= 0),
    product_description  NVARCHAR(MAX),
    pic_url              NVARCHAR(500),
    unit                 NVARCHAR(50) NOT NULL,
    inDeal               Bit NOT NULL DEFAULT 0,
    deal_price           DECIMAL(10, 2) Default NULL CHECK(deal_price >= 0),
    deal_end             DATETIME Default NULL,
    CONSTRAINT fk_Product_category FOREIGN KEY(CategoryID) REFERENCES Category(CategoryID)
    ON DELETE No ACTION ON UPDATE CASCADE
);

CREATE TABLE Users(
    UserID         INT Primary Key NOT NULL Identity(1, 1),
    name           NVARCHAR(100)  NOT NULL,
    email          NVARCHAR(150) Unique NOT NULL,
    password_hash  NVARCHAR(255)  NOT NULL,
    phone_no       NVARCHAR(20),
    Address        NVARCHAR(MAX),
    City           NVARCHAR(50) Not NULL,
    role           NVARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK(role IN('customer', 'admin'))
);

CREATE TABLE Orders(
    OrderID           INT Primary Key NOT NULL Identity(1, 1),
    CustomerID        INT   NOT NULL,
    total_amount      DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK(total_amount >= 0),
    orderDate         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status            NVARCHAR(20)  NOT NULL DEFAULT 'cart',
    delivery_address  NVARCHAR(MAX),
    tax_amount        DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK(tax_amount >= 0),
    discount_amount   DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK(discount_amount >= 0),
    CONSTRAINT fk_orders_customer FOREIGN KEY(CustomerID) REFERENCES Users(UserID)
    ON DELETE No Action ON UPDATE CASCADE,
    CONSTRAINT chk_order_status CHECK(status In('cart', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'))
);

CREATE TABLE OrderItem(
    OrderItemID INT PRIMARY KEY NOT NULL IDENTITY(1, 1),
    OrderID     INT NOT NULL,
    ProductID   INT NOT NULL,
    quantity    INT NOT NULL CHECK(quantity > 0),
    unit_price  DECIMAL(10, 2) NOT NULL CHECK(unit_price >= 0),
    subtotal    DECIMAL(10, 2) NOT NULL CHECK(subtotal >= 0),
    CONSTRAINT fk_OrderItem_order FOREIGN KEY(OrderID) REFERENCES Orders(OrderID)
    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_OrderItem_product FOREIGN KEY(ProductID) REFERENCES Product(ProductID)
    ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE TABLE Payment(
    payment_id       INT PRIMARY KEY NOT NULL IDENTITY(1, 1),
    order_id         INT UNIQUE NOT NULL,
    payment_method   NVARCHAR(50) NOT NULL,
    payment_type     NVARCHAR(50) NOT NULL,
    status           NVARCHAR(20) NOT NULL DEFAULT 'pending',
    tax_benefit      BIT NOT NULL DEFAULT 0,
    transaction_ref  NVARCHAR(200),
    paid_at          DATETIME,
    CONSTRAINT fk_Payment_order FOREIGN KEY(order_id) REFERENCES Orders(OrderID)
    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_Payment_status CHECK(status IN('pending', 'completed', 'failed', 'refunded'))
);

-- Table for admin verification requests
CREATE TABLE AdminVerificationRequests 
(
    RequestID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    RequestDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    ReviewedBy INT NULL,
    ReviewedDate DATETIME NULL,
    Comments NVARCHAR(500),
    CONSTRAINT fk_verification_user FOREIGN KEY(UserID) REFERENCES Users(UserID),
    CONSTRAINT chk_status CHECK(Status IN('pending', 'approved', 'rejected'))
);

-- Table for admin access log (audit trail)
CREATE TABLE AdminAccessLog (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    AdminID INT NOT NULL,
    Action NVARCHAR(100) NOT NULL,
    IPAddress NVARCHAR(50),
    ActionDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_admin_log FOREIGN KEY(AdminID) REFERENCES Users(UserID)
);

-- Add admin_approved column
ALTER TABLE Users ADD admin_approved BIT NOT NULL DEFAULT 0;
ALTER TABLE Users ADD approved_by INT NULL;
ALTER TABLE Users ADD approved_at DATETIME NULL;

-- Update existing admins
UPDATE Users SET admin_approved = 1 WHERE role = 'admin';

-- Now you can remove role column or keep it as 'customer' only
-- Role ALWAYS stays 'customer'
UPDATE Users SET role = 'customer' WHERE role = 'admin';
-- Drop and recreate role constraint (only allow 'customer')
ALTER TABLE Users DROP CONSTRAINT chk_users_role;
ALTER TABLE Users ADD CONSTRAINT chk_users_role CHECK(role = 'customer');
