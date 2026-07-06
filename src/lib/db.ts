import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'shop.db');

const globalForDb = global as unknown as { __db?: DatabaseSync };

function getDb(): DatabaseSync {
  if (!globalForDb.__db) {
    const db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    migrate(db);
    globalForDb.__db = db;
  }
  return globalForDb.__db;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      phone TEXT,
      address TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Package',
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      compareAtPrice REAL,
      stock INTEGER NOT NULL DEFAULT 0,
      images TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 4.5,
      reviewCount INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      categoryId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      paymentMethod TEXT NOT NULL DEFAULT 'COD',
      total REAL NOT NULL,
      shippingName TEXT NOT NULL,
      shippingPhone TEXT NOT NULL,
      shippingAddress TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    );
  `);
}

// ---------- Types ----------
export type DBCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string | null;
};

export type DBProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  categoryId: string;
  createdAt: string;
};

export type DBUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
};

export type DBOrder = {
  id: string;
  userId: string;
  status: string;
  paymentMethod: string;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  createdAt: string;
};

export type DBOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
};

function rowToProduct(row: any): DBProduct {
  return { ...row, featured: !!row.featured };
}

// ---------- Categories ----------
export function getCategories(): DBCategory[] {
  return getDb().prepare('SELECT * FROM categories ORDER BY name ASC').all() as unknown as DBCategory[];
}

export function getCategoriesWithCounts(): (DBCategory & { productCount: number })[] {
  const rows = getDb()
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id) as productCount
       FROM categories c ORDER BY c.name ASC`
    )
    .all();
  return rows as unknown as (DBCategory & { productCount: number })[];
}

export function getCategoryBySlug(slug: string): DBCategory | undefined {
  return getDb().prepare('SELECT * FROM categories WHERE slug = ?').get(slug) as DBCategory | undefined;
}

export function createCategory(data: { name: string; slug: string; icon?: string; image?: string }): DBCategory {
  const id = randomUUID();
  getDb()
    .prepare('INSERT INTO categories (id, name, slug, icon, image) VALUES (?, ?, ?, ?, ?)')
    .run(id, data.name, data.slug, data.icon || 'Package', data.image || null);
  return getCategoryBySlug(data.slug)!;
}

// ---------- Products ----------
type ProductFilter = {
  categorySlug?: string;
  search?: string;
  featured?: boolean;
  sort?: 'price-asc' | 'price-desc' | 'rating' | string;
  limit?: number;
};

export function getProducts(filter: ProductFilter = {}): DBProduct[] {
  const clauses: string[] = [];
  const params: any[] = [];

  let joinCategory = '';
  if (filter.categorySlug) {
    joinCategory = 'JOIN categories c ON c.id = p.categoryId';
    clauses.push('c.slug = ?');
    params.push(filter.categorySlug);
  }
  if (filter.search) {
    clauses.push('p.name LIKE ?');
    params.push(`%${filter.search}%`);
  }
  if (filter.featured) {
    clauses.push('p.featured = 1');
  }

  let orderBy = 'p.createdAt DESC';
  if (filter.sort === 'price-asc') orderBy = 'p.price ASC';
  if (filter.sort === 'price-desc') orderBy = 'p.price DESC';
  if (filter.sort === 'rating') orderBy = 'p.rating DESC';

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = filter.limit ? `LIMIT ${filter.limit}` : '';

  const sql = `SELECT p.* FROM products p ${joinCategory} ${where} ORDER BY ${orderBy} ${limit}`;
  const rows = getDb().prepare(sql).all(...params);
  return rows.map(rowToProduct);
}

export function getProductBySlug(slug: string): (DBProduct & { category: DBCategory }) | undefined {
  const row = getDb().prepare('SELECT * FROM products WHERE slug = ?').get(slug) as any;
  if (!row) return undefined;
  const category = getDb().prepare('SELECT * FROM categories WHERE id = ?').get(row.categoryId) as DBCategory;
  return { ...rowToProduct(row), category };
}

export function getProductById(id: string): DBProduct | undefined {
  const row = getDb().prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  return row ? rowToProduct(row) : undefined;
}

export function getRelatedProducts(categoryId: string, excludeId: string, limit = 5): DBProduct[] {
  const rows = getDb()
    .prepare('SELECT * FROM products WHERE categoryId = ? AND id != ? LIMIT ?')
    .all(categoryId, excludeId, limit);
  return rows.map(rowToProduct);
}

export function createProduct(data: {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string;
  categoryId: string;
  featured?: boolean;
}): DBProduct {
  const id = randomUUID();
  const slug =
    data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 6);
  const createdAt = new Date().toISOString();

  getDb()
    .prepare(
      `INSERT INTO products (id, name, slug, description, price, compareAtPrice, stock, images, rating, reviewCount, featured, categoryId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      data.name,
      slug,
      data.description,
      data.price,
      data.compareAtPrice ?? null,
      data.stock,
      data.images,
      4.5,
      0,
      data.featured ? 1 : 0,
      data.categoryId,
      createdAt
    );

  return getProductById(id)!;
}

export function updateProduct(id: string, data: Partial<DBProduct>): void {
  const fields = Object.keys(data).filter((k) => k !== 'id');
  if (!fields.length) return;
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => {
    const v = (data as any)[f];
    return typeof v === 'boolean' ? (v ? 1 : 0) : v;
  });
  getDb().prepare(`UPDATE products SET ${setClause} WHERE id = ?`).run(...values, id);
}

export function deleteProduct(id: string): void {
  getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
}

// ---------- Users ----------
export function getUserByEmail(email: string): DBUser | undefined {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as DBUser | undefined;
}

export function getUserById(id: string): DBUser | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as DBUser | undefined;
}

export function createUser(data: { name: string; email: string; password: string; role?: string }): DBUser {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  getDb()
    .prepare('INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, data.name, data.email, data.password, data.role || 'CUSTOMER', createdAt);
  return getUserByEmail(data.email)!;
}

// ---------- Orders ----------
export function getOrdersForUser(userId: string): (DBOrder & { items: (DBOrderItem & { product: DBProduct })[] })[] {
  const orders = getDb()
    .prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC')
    .all(userId) as unknown as DBOrder[];
  return attachItems(orders);
}

export function getAllOrders(): (DBOrder & { items: (DBOrderItem & { product: DBProduct })[] })[] {
  const orders = getDb().prepare('SELECT * FROM orders ORDER BY createdAt DESC').all() as unknown as DBOrder[];
  return attachItems(orders);
}

function attachItems(orders: DBOrder[]) {
  const db = getDb();
  return orders.map((order) => {
    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(order.id) as unknown as DBOrderItem[];
    const itemsWithProduct = items.map((item) => ({
      ...item,
      product: rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId)),
    }));
    return { ...order, items: itemsWithProduct };
  });
}

export function updateOrderStatus(id: string, status: string): void {
  getDb().prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
}

export function createOrder(data: {
  userId: string;
  items: { productId: string; quantity: number }[];
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  paymentMethod: string;
}) {
  const db = getDb();
  db.exec('BEGIN');
  try {
    let total = 0;
    const resolvedItems: { productId: string; quantity: number; price: number; name: string }[] = [];

    for (const item of data.items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId) as any;
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}. Only ${product.stock} left.`);
      }
      total += product.price * item.quantity;
      resolvedItems.push({ productId: product.id, quantity: item.quantity, price: product.price, name: product.name });
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, product.id);
    }

    const orderId = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO orders (id, userId, status, paymentMethod, total, shippingName, shippingPhone, shippingAddress, createdAt)
       VALUES (?, 'PENDING', ?, ?, ?, ?, ?, ?, ?)`
    ).run(orderId, data.paymentMethod, total, data.shippingName, data.shippingPhone, data.shippingAddress, createdAt);

    for (const item of resolvedItems) {
      db.prepare('INSERT INTO order_items (id, orderId, productId, quantity, price) VALUES (?, ?, ?, ?, ?)').run(
        randomUUID(),
        orderId,
        item.productId,
        item.quantity,
        item.price
      );
    }

    db.exec('COMMIT');
    return { id: orderId, total };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function resetDatabase(): void {
  const db = getDb();
  db.exec('DELETE FROM order_items; DELETE FROM orders; DELETE FROM products; DELETE FROM categories; DELETE FROM users;');
}

export { getDb };
