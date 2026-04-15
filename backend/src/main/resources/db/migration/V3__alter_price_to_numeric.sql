ALTER TABLE products
ALTER COLUMN price TYPE NUMERIC(10, 2)
USING ROUND(price::numeric, 2);
