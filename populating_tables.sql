--POPULATING Category

Insert into Category(CategoryName, numberOfProduct) Values
('Fruits and Vegetables', 0),
('Bakery', 0),
('Dairy and Eggs', 0),
('Snacks', 0),
('Spices', 0),
('Common Households', 0),
('Cleaning Supplies', 0),
('Meat and Poultry', 0),
('Canned Food', 0),
('Frozen Food', 0)


--POPULATING Product

--Trigger to update numberOfProduct in Category Table
Go

Create Trigger updateProductCount On Product
For Insert, Update, Delete
As
Begin
UPDATE Category
SET numberOfProduct = (
    SELECT COUNT(*)
    FROM Product
    WHERE Product.CategoryID = Category.CategoryID
    )
    Where CategoryID In(
        Select CategoryID From inserted
        UNION
        Select CategoryID From deleted
    )
    End

    Go

    Insert into Product(CategoryID, pName, Price, stock_Quantity, product_description, pic_url, unit, inDeal) Values

    --Fruits and Vegetables



    -- Bakery
    (2, 'Barfi', 200, 300, 'Sweet Barfi made with original ghee', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYUbnXPCHEtFKaNB6Hp-8TRAlPlvhcI14n4EUxxs-BfeHHe_rSPPRsyqF9nL9RPyDuvxsKdzDtAsukaWl3zhpd_YJTgjJUGugGYtkuRw&s=10', 'kg', 0),
    (2, 'Gulab Jaman', 230, 200, 'Taste the traditional sweet of pakistan made with pure ghee', 'https://www.cadburydessertscorner.com/hubfs/dc-website-2022/articles/soft-gulab-jamun-recipe-for-raksha-bandhan-from-dough-to-syrup-all-you-need-to-know/soft-gulab-jamun-recipe-for-raksha-bandhan-from-dough-to-syrup-all-you-need-to-know.webp', 'kg', 0),
    (2, 'Gajar ka Halwa', 190, 200, 'Made with pure and organic milk,ghee and sugar', 'https://www.vegrecipesofindia.com/wp-content/uploads/2021/11/gajar-halwa-carrot-halwa.jpg', 'kg', 0),

    --Dairy and Eggs
    (3, 'Brown Eggs', 230, 1000, 'Brown eggs , good for health and diet ', 'https://cdn.britannica.com/94/151894-050-F72A5317/Brown-eggs.jpg', 'dozen', 0),
    (3, 'Olper', 300, 800, 'full cream milk', 'https://cdn.britannica.com/94/151894-050-F72A5317/Brown-eggs.jpg', 'liters', 0),
    (3, 'Dairy Pure', 250, 900, 'Tea Whitener , adds taste to tea', 'https://static.tossdown.com/images/b2d74299-956d-433d-bab3-7798098f1985.webp', 'liters', 0),

    --Snacks
    (4, 'Knorr noodles', 60, 1000, 'Noodles for Adult and Children , made within 2 min and served quickly', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZrIeLeVGHnxus46rubDJqxodDmVxtlHQ-_g&s', 'mg', 0),
    (4, 'Lays', 70, 1000, 'Light snack , enjoyable while watching movie', 'https://springs.com.pk/cdn/shop/files/8964002346929.png?v=1747844887', 'kg', 0),
    (4, 'Slanty (120g)', 80.00, 300, 'Tangy salted pretzel sticks', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkDgzOoRrtCkAQTUaTpWihJjXLtut2vd8Dng&s', 'pack', 0),

    --Spices
    (5, 'Shan Bombay Biryani', 100, 1000, 'Masala used in making for Bombay Biryani', 'https://arysahulatbazar.pk/wp-content/uploads/2024/05/1119333-1.jpg', 'gram', 0),
    (5, 'Shan Karahi', 120, 1000, 'Masala used in making for Karahi', 'https://www.shanfoods.com/wp-content/uploads/2016/11/karahi-2.png', 'gram', 0),
    (5, 'Shan Achar Gosht', 120, 1000, 'Masala used in making for Achar Gosht', 'https://media.naheed.pk/catalog/product/cache/2f2d0cb0c5f92580479e8350be94f387/1/1/1119324-1.jpg', 'gram', 0),

    --Common Households
    (6, ' Crockery', 600, 1000, 'Common houseHold crockery for daily use', 'https://m.media-amazon.com/images/I/41kKtm3up9L.jpg', 'kg', 0),

    --Cleaning Supplies
    (7, 'Harpic', 650, 500, 'Used to clean Washrooms and floor', 'https://afzalwholesaler.com/cdn/shop/files/harpic-blue_303caae7-730e-4133-b7fe-105183e748bb.jpg?v=1706011222', 'ml', 0),
    (7, 'Max Long Bar', 90, 400, 'Made with Lemon , clean dishes very efficiently', 'https://www.box.com.pk:4006/assets/product/dk1wIWkOZp1vClVGxOJQPU3FGDzOyd7P_1727698719711.jpg', 'gram', 0),
    (7, 'Sirf Excel', 90, 400, 'A premier Unilever laundry detergent', 'https://www.hkarimbuksh.com/cdn/shop/Product/5_12c50271-24eb-4da5-9375-a23141e214d4_1024x.jpg?v=1630133856', 'gram', 0),

    --Meat and Poultry
    (8, 'Mutton 5 kg', 2000, 5000, 'Halal Mutton , with no unnessessary stuff', 'https://www.tayyib.pk/cdn/shop/Product/deluxe-mutton-mix-1-kg-234136.jpg?v=1746270268&width=480', 'kg', 0),
    (8, 'Chicken 1 kg', 800, 1000, 'Halal Chicken dismantled by experts', 'https://images.immediate.co.uk/production/volatile/sites/30/2025/06/Step-2-79305f0.jpg?quality=90&fit=700,466', 'kg', 0),
    (8, 'Beef 500 gram', 800, 1000, 'Halal Beef', 'https://www.dukeshill.co.uk/cdn/shop/files/Diced_Beef.png?v=1740006211', 'gram', 0),

    --Canned Food



    --Frozen Food
    (10, 'Crispy Chicken Strips Sabroso', 1500, 400, 'Halal boneless chicken, mixed spices, salt, water, vegetable oil, wheat flour, vinegar and sodium phosphates.', 'https://shopsabroso.pk/cdn/shop/files/Crispy-Chicken-Strips-copy_eab1fc73-eca0-4292-ad86-305ed1499228.jpg?v=1721731097', 'kg', 0),
    (10, 'Gola Kabab Sabroso', 1000, 200, ' Halal boneless chicken, fresh onion, fresh mint, fresh ginger, fresh garlic, vegetable oil, salt and mixed spices.', 'https://shopsabroso.pk/cdn/shop/files/Gola-copy_a552d1c7-136e-4431-bec6-b37f1be5e7f0.jpg?v=1721731017', 'kg', 0),
    (10, 'Shami Kabab Sabroso', 900, 200, ' Halal boneless chicken, fresh onion, green chili, salt, mixed spices, water, vegetable oil, wheat flour and sodium phosphate.', 'https://shopsabroso.pk/cdn/shop/files/8964001541486.jpg?v=1729594436', 'kg', 0)


    --POPULATING USERS

    INSERT INTO Users(name, email, password_hash, phone_no, Address, City, role) VALUES
    -- Admins
    ('Admin User', 'admin@desigrocery.pk', 'hashed_password_123', '0300-1234567', 'Shop 5, Saddar Trade Centre', 'Karachi', 'admin'),
    ('Store Manager', 'manager@desigrocery.pk', 'hashed_password_456', '0321-9876543', 'Office 12, Hafeez Centre', 'Lahore', 'admin'),

    --Customers
    ('Ali Raza', 'ali.raza@email.com', 'customer_hash_1', '0333-1237890', 'House 45, Block 6, PECHS', 'Karachi', 'customer'),
    ('Fatima Khan', 'fatima.k@email.com', 'customer_hash_2', '0345-4561237', 'Flat 302, Anum Heaven, North Nazimabad', 'Karachi', 'customer'),
    ('Ahmed Malik', 'ahmed.m@email.com', 'customer_hash_3', '0312-7894561', 'House 12, Lane 5, DHA Phase 6', 'Karachi', 'customer'),
    ('Sana Chaudhry', 'sana.c@email.com', 'customer_hash_4', '0322-2345678', 'House 123, Model Town', 'Lahore', 'customer'),
    ('Bilal Ahmed', 'bilal.a@email.com', 'customer_hash_5', '0306-8765432', 'Flat 7B, Lake City', 'Lahore', 'customer'),
    ('Zara Tariq', 'zara.t@email.com', 'customer_hash_6', '0335-3456789', 'House 45, Street 78, F-11/4', 'Islamabad', 'customer'),
    ('Usman Sheikh', 'usman.s@email.com', 'customer_hash_7', '0347-6543210', 'Flat 12, Serena Vista, G-10/2', 'Islamabad', 'customer'),
    ('Maria Aslam', 'maria.a@email.com', 'customer_hash_8', '0311-4567890', 'House 56, Peoples Colony', 'Faisalabad', 'customer'),
    ('Hassan Abbas', 'hassan.a@email.com', 'customer_hash_9', '0336-5678901', 'Flat 4, City Towers', 'Peshawar', 'customer'),
    ('Ayesha Siddiqui', 'ayesha.s@email.com', 'customer_hash_10', '0342-6789012', 'House 789, Satellite Town', 'Quetta', 'customer'),
    ('Farhan Ali', 'farhan.a@email.com', 'customer_hash_11', '0323-7890123', 'Flat 56, Gulshan-e-Iqbal', 'Multan', 'customer'),
    ('Nida Hussain', 'nida.h@email.com', 'customer_hash_12', '0307-8901234', 'House 234, Gulgasht Colony', 'Multan', 'customer');

--Trigger Auto Update Order Total
GO
CREATE TRIGGER trg_UpdateOrderTotal ON OrderItem
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
UPDATE Orders
SET total_amount = (
    SELECT ISNULL(SUM(subtotal), 0)
    FROM OrderItem
    WHERE OrderItem.OrderID = Orders.OrderID
    ) + tax_amount - discount_amount
    WHERE OrderID IN(
        SELECT DISTINCT OrderID FROM inserted
        UNION
        SELECT DISTINCT OrderID FROM deleted
    );
END
GO


-- Trigger Auto Update Order Status Based on Payemnt
GO
CREATE TRIGGER trg_UpdateOrderStatusOnPayment ON Payment
AFTER INSERT, UPDATE
AS
BEGIN
UPDATE Orders
SET status =
CASE
WHEN i.status = 'completed' THEN 'confirmed'
WHEN i.status = 'failed' THEN 'cancelled'
ELSE o.status
END
FROM Orders o
INNER JOIN inserted i ON o.OrderID = i.order_id;
END
GO

-- Orders
INSERT INTO Orders(CustomerID, total_amount, orderDate, status, delivery_address, tax_amount, discount_amount) VALUES
(3, 520, '2026-01-14', 'delivered', 'PECHS Karachi', 40, 10),
(4, 300, '2026-01-17', 'shipped', 'North Nazimabad Karachi', 25, 0),
(5, 2800, '2026-01-17', 'confirmed', 'DHA Karachi', 150, 100),
(6, 600, '2026-01-18', 'pending', 'Model Town Lahore', 40, 0),
(7, 2000, '2026-01-19', 'delivered', 'Lake City Lahore', 120, 50),
(8, 450, '2026-01-20', 'cancelled', 'F-11 Islamabad', 30, 0),
(9, 900, '2026-01-24', 'delivered', 'G-10 Islamabad', 60, 20),
(10, 750, '2026-02-05', 'shipped', 'Faisalabad', 50, 10),
(11, 650, '2026-02-15', 'pending', 'Peshawar', 45, 0),
(12, 1100, '2026-03-16', 'confirmed', 'Quetta', 70, 20),
(13, 500, '2026-02-10', 'delivered', 'Multan', 35, 0),
(14, 1300, '2026-02-25', 'shipped', 'Multan', 90, 50),
(3, 400, '2026-03-19', 'pending', 'Karachi', 30, 0),
(4, 1800, '2026-01-18', 'delivered', 'Karachi', 120, 100),
(5, 950, '2026-03-12', 'confirmed', 'Karachi', 60, 20),
(6, 700, '2026-03-13', 'pending', 'Lahore', 50, 0),
(7, 1500, '2026-01-14', 'delivered', 'Lahore', 100, 50),
(8, 350, '2026-03-11', 'cancelled', 'Islamabad', 25, 0),
(9, 1200, '2026-01-09', 'shipped', 'Islamabad', 80, 40),
(10, 600, '2026-03-27', 'confirmed', 'Faisalabad', 40, 10);

--OrderItem
INSERT INTO OrderItem(OrderID, ProductID, quantity, unit_price, subtotal) VALUES

-- Order 1 (3 items)
(1, 4, 2, 230, 460),
(1, 7, 1, 60, 60),
(1, 8, 1, 70, 70),

--Order 2 (1 item)
(2, 10, 2, 100, 200),

--Order 3 (4 items)
(3, 17, 1, 2000, 2000),
(3, 18, 1, 800, 800),
(3, 13, 2, 120, 240),
(3, 14, 1, 120, 120),

--Order 4 (2 items)
(4, 13, 2, 120, 240),
(4, 7, 2, 60, 120),

--Order 5 (3 items)
(5, 20, 1, 1500, 1500),
(5, 21, 1, 1000, 1000),
(5, 9, 2, 80, 160),

--Order 6 (1 item)
(6, 6, 2, 250, 500),

--Order 7 (2 items)
(7, 11, 2, 120, 240),
(7, 12, 1, 120, 120),

--Order 8 (3 items)
(8, 7, 3, 60, 180),
(8, 8, 2, 70, 140),
(8, 9, 1, 80, 80),

--Order 9 (1 item)
(9, 4, 3, 230, 690),

--Order 10 (2 items)
(10, 5, 2, 300, 600),
(10, 6, 1, 250, 250),

--Order 11 (3 items)
(11, 9, 2, 80, 160),
(11, 8, 2, 70, 140),
(11, 10, 1, 100, 100),

--Order 12 (2 items)
(12, 20, 1, 1500, 1500),
(12, 21, 1, 1000, 1000),

--Order 13 (1 item)
(13, 7, 2, 60, 120),

--Order 14 (3 items)
(14, 17, 1, 2000, 2000),
(14, 18, 1, 800, 800),
(14, 5, 1, 300, 300),

--Order 15 (2 items)
(15, 4, 2, 230, 460),
(15, 11, 1, 120, 120),

--Order 16 (1 item)
(16, 10, 2, 100, 200),

--Order 17 (4 items)
(17, 20, 1, 1500, 1500),
(17, 21, 1, 1000, 1000),
(17, 8, 2, 70, 140),
(17, 9, 2, 80, 160),

--Order 18 (2 items)
(18, 9, 2, 80, 160),
(18, 7, 1, 60, 60),

--Order 19 (3 items)
(19, 5, 2, 300, 600),
(19, 6, 2, 250, 500),
(19, 8, 1, 70, 70),

--Order 20 (1 item)
(20, 10, 3, 100, 300);


--Payment
INSERT INTO Payment(order_id, payment_method, payment_type, status, tax_benefit, transaction_ref, paid_at) VALUES
(1, 'Credit Card', 'Online', 'completed', 0, 'TXN001', GETDATE()),
(2, 'Cash', 'COD', 'pending', 0, NULL, NULL),
(3, 'Debit Card', 'Online', 'completed', 1, 'TXN003', GETDATE()),
(4, 'Cash', 'COD', 'pending', 0, NULL, NULL),
(5, 'Credit Card', 'Online', 'completed', 0, 'TXN005', GETDATE()),
(6, 'Cash', 'COD', 'failed', 0, NULL, NULL),
(7, 'Debit Card', 'Online', 'completed', 1, 'TXN007', GETDATE()),
(8, 'Cash', 'COD', 'pending', 0, NULL, NULL),
(9, 'Credit Card', 'Online', 'completed', 0, 'TXN009', GETDATE()),
(10, 'Cash', 'COD', 'pending', 0, NULL, NULL),
(11, 'Debit Card', 'Online', 'completed', 0, 'TXN011', GETDATE()),
(12, 'Credit Card', 'Online', 'completed', 1, 'TXN012', GETDATE()),
(13, 'Cash', 'COD', 'pending', 0, NULL, NULL),
(14, 'Credit Card', 'Online', 'completed', 0, 'TXN014', GETDATE()),
(15, 'Debit Card', 'Online', 'completed', 0, 'TXN015', GETDATE()),
(16, 'Cash', 'COD', 'pending', 0, NULL, NULL),
(17, 'Credit Card', 'Online', 'completed', 1, 'TXN017', GETDATE()),
(18, 'Cash', 'COD', 'failed', 0, NULL, NULL),
(19, 'Debit Card', 'Online', 'completed', 0, 'TXN019', GETDATE()),
(20, 'Cash', 'COD', 'pending', 0, NULL, NULL);