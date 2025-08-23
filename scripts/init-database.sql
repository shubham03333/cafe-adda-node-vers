-- Cafe Order System Database Initialization Script
-- Run this script in your PlanetScale MySQL database to create the required tables

-- Create orders table
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  order_number VARCHAR(10) NOT NULL,
  items JSON NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'preparing', 'ready', 'served', 'cancelled') DEFAULT 'pending',
  order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create menu items table
CREATE TABLE menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(250) NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  category VARCHAR(50),
  position INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample menu data with positions
INSERT INTO menu_items (id, name, price, category, position) VALUES
(1, 'Special Veg Munch Roll ', 40.00, 'Main Course', 1),
(2, 'Veg Manchurian Bhel', 35.00, 'Main Course', 2),
(3, 'Veg Manchurian Paav ', 25.00, 'Main Course', 3),
(4, 'Special Veg Munch CHEESE Roll ', 50.00, 'Main Course', 4),
(5, 'Chilax Cold Coffee', 40.00, 'Beverages', 1),
(6, 'Veg Peri Peri Manchurian', 25.00, 'Main Course', 5),
(7, 'Veg Masala Manchurian', 35.00, 'Main Course', 6),
(8, 'Chilax Cold COCOA', 40.00, 'Beverages', 2),
(9, 'Special DahiVada', 40.00, 'Main Course', 7),
(10, 'Adda Special Combo', 99.00, 'Main Course', 8),
(11, 'Tea', 10.00, 'Beverages', 3);


-- Create daily sales table
CREATE TABLE daily_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_date DATE NOT NULL UNIQUE,
  total_orders INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Create indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_time ON orders(order_time);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_daily_sales_date ON daily_sales(sale_date);
