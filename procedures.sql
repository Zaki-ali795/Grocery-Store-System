------------------ -
--Sign Up Queries
------------------ -
GO

Create Procedure sp_SignUp
@name           NVARCHAR(100),
@email          NVARCHAR(150),
@password_hash  NVARCHAR(255),
@phone_no       NVARCHAR(20),
@Address        NVARCHAR(MAX) = NULL,
@City           NVARCHAR(50)
As
BEGIN
IF EXISTS(SELECT 1 FROM Users WHERE email = @email)
BEGIN
RAISERROR('Email already registered.', 16, 1);
RETURN;
END

INSERT INTO Users(name, email, password_hash, phone_no, Address, City, role)
VALUES(@name, @email, @password_hash, @phone_no, @address, @city, 'customer');
END

Go
------------------------------------------------
------------------ -
--Log In Queries
------------------ -

drop procedure dbo.sp_LogIn
GO

CREATE PROCEDURE sp_LogIn
@email NVARCHAR(150)
AS
BEGIN
    IF NOT EXISTS(SELECT 1 FROM Users WHERE email = @email)
    BEGIN
        RAISERROR('Email not found.', 16, 1);
        RETURN;
    END

    -- Return user data WITHOUT comparing password
    -- Let Node.js handle bcrypt comparison
    SELECT UserID, name, email, password_hash, phone_no, Address, City, role
    FROM Users
    WHERE email = @email;
END
Go
---------------------------------------------------
------------------ -
--View Cart
------------------ -

GO
CREATE PROCEDURE sp_ViewCart
@CustomerID INT
AS
BEGIN
IF NOT EXISTS(SELECT 1 FROM Orders WHERE CustomerID = @CustomerID AND status = 'cart')
BEGIN
RAISERROR('No active cart found.', 16, 1);
RETURN;
END

SELECT oi.OrderItemID, p.ProductID, p.pName ProductName, p.unit, oi.quantity, oi.unit_price, oi.subtotal, o.total_amount CartTotal
FROM Orders o JOIN OrderItem oi ON oi.OrderID = o.OrderID JOIN Product p ON p.ProductID = oi.ProductID
WHERE o.CustomerID = @CustomerID AND o.status = 'cart';
END
GO
--------------------------------------------------
--------------------
--Add item to cart
--------------------

GO
CREATE PROCEDURE sp_AddToCart
@CustomerID INT,
@ProductID  INT,
@quantity   INT
AS
BEGIN
-- Check product exists and has enough stock
IF NOT EXISTS(SELECT 1 FROM Product WHERE ProductID = @ProductID AND stock_Quantity >= @quantity)
BEGIN
RAISERROR('Product unavailable or insufficient stock.', 16, 1);
RETURN;
END

DECLARE @OrderID    INT;
DECLARE @unit_price DECIMAL(10, 2);
DECLARE @subtotal   DECIMAL(10, 2);

--Get or create cart
SELECT @OrderID = OrderID FROM Orders WHERE CustomerID = @CustomerID AND status = 'cart';

IF @OrderID IS NULL
BEGIN
INSERT INTO Orders(CustomerID, status) VALUES(@CustomerID, 'cart');
SELECT @OrderID = OrderID FROM Orders
WHERE CustomerID = @CustomerID AND status = 'cart';
END

-- Get price(use deal_price if active, otherwise regular price)
SELECT @unit_price =
CASE
WHEN inDeal = 1 AND deal_end > GETDATE() THEN deal_price
ELSE price
END
FROM Product WHERE ProductID = @ProductID;

SET @subtotal = @unit_price * @quantity;

--If product already in cart, update quantity
IF EXISTS(SELECT 1 FROM OrderItem WHERE OrderID = @OrderID AND ProductID = @ProductID)
BEGIN
UPDATE OrderItem
SET quantity = quantity + @quantity,
subtotal = (quantity + @quantity) * @unit_price
WHERE OrderID = @OrderID AND ProductID = @ProductID;
END
ELSE
BEGIN
INSERT INTO OrderItem(OrderID, ProductID, quantity, unit_price, subtotal) VALUES
(@OrderID, @ProductID, @quantity, @unit_price, @subtotal);
END
END
GO
------------------------------------------------
go
-- Procedure to request admin access
CREATE PROCEDURE sp_RequestAdminAccess
    @UserID INT,
    @Comments NVARCHAR(500) = NULL
AS
BEGIN
    -- Check if user already has a pending request
    IF EXISTS(SELECT 1 FROM AdminVerificationRequests 
              WHERE UserID = @UserID AND Status = 'pending')
    BEGIN
        RAISERROR('You already have a pending admin request', 16, 1);
        RETURN;
    END
    
    -- Check if user is already admin
    IF EXISTS(SELECT 1 FROM Users WHERE UserID = @UserID AND role = 'admin')
    BEGIN
        RAISERROR('User is already an admin', 16, 1);
        RETURN;
    END
    
    -- Create verification request
    INSERT INTO AdminVerificationRequests(UserID, Comments)
    VALUES(@UserID, @Comments);
    
    SELECT 'Admin access request submitted successfully' AS Message;
END
