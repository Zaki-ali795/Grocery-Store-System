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
-------------------------------------------
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
--------------------------------------------
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
------------------------------------------------