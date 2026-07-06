import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

const url = process.env.DATABASE_URL || "file:./data/shop.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url: url,
  authToken: authToken,
});

const dbAdapter = {
  exec: async (sql: string) => {
    return await client.executeMultiple(sql);
  },
  prepare: (sql: string) => {
    return {
      all: async (...params: any[]) => {
        const result = await client.execute({ sql, args: params });
        return result.rows;
      },
      get: async (...params: any[]) => {
        const result = await client.execute({ sql, args: params });
        return result.rows[0];
      },
      run: async (...params: any[]) => {
        return await client.execute({ sql, args: params });
      }
    };
  }
};

async function getDb() {
  if (!(global as any).__dbInitialized) {
    await migrate(dbAdapter as any);
    (global as any).__dbInitialized = true;
  }
  return dbAdapter;
}

async function migrate(db: any) {
  await db.exec(`
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
export async function getCategories(): Promise<DBCategory[]> {
  const db = await getDb();
  const rows = await db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  return rows as unknown as DBCategory[];
}

export async function getCategoriesWithCounts(): Promise<(DBCategory & { productCount: number })[]> {
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id) as productCount
       FROM categories c ORDER BY c.name ASC`
    )
    .all();
  return rows as unknown as (DBCategory & { productCount: number })[];
}

export async function getCategoryBySlug(slug: string): Promise<DBCategory | undefined> {
  const db = await getDb();
  const row = await db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
  return row as unknown as DBCategory | undefined;
}

export async function createCategory(data: { name: string; slug: string; icon?: string; image?: string }): Promise<DBCategory> {
  const db = await getDb();
  const id = randomUUID();
  await db
    .prepare('INSERT INTO categories (id, name, slug, icon, image) VALUES (?, ?, ?, ?, ?)')
    .run(id, data.name, data.slug, data.icon || 'Package', data.image || null);
  return (await getCategoryBySlug(data.slug))!;
}

// ---------- Products ----------
type ProductFilter = {
  categorySlug?: string;
  search?: string;
  featured?: boolean;
  sort?: 'price-asc' | 'price-desc' | 'rating' | string;
  limit?: number;
};

export async function getProducts(filter: ProductFilter = {}): Promise<DBProduct[]> {
  const db = await getDb();
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
  const rows = await db.prepare(sql).all(...params);
  return rows.map(rowToProduct);
}

export async function getProductBySlug(slug: string): Promise<(DBProduct & { category: DBCategory }) | undefined> {
  const db = await getDb();
  const row = await db.prepare('SELECT * FROM products WHERE slug = ?').get(slug) as any;
  if (!row) return undefined;
  const categoryPrepared = db.prepare('SELECT * FROM categories WHERE id = ?');
  const category = (await categoryPrepared.get(row.categoryId)) as unknown as DBCategory;
  return { ...rowToProduct(row), category };
}

export async function getProductById(id: string): Promise<DBProduct | undefined> {
  const db = await getDb();
  const row = await db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  return row ? rowToProduct(row) : undefined;
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 5): Promise<DBProduct[]> {
  const db = await getDb();
  const rows = await db
    .prepare('SELECT * FROM products WHERE categoryId = ? AND id != ? LIMIT ?')
    .all(categoryId, excludeId, limit);
  return rows.map(rowToProduct);
}

export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string;
  categoryId: string;
  featured?: boolean;
}): Promise<DBProduct> {
  const db = await getDb();
  const id = randomUUID();
  const slug =
    data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 6);
  const createdAt = new Date().toISOString();

  await db
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

  return (await getProductById(id))!;
}

export async function updateProduct(id: string, data: Partial<DBProduct>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(data).filter((k) => k !== 'id');
  if (!fields.length) return;
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => {
    const v = (data as any)[f];
    return typeof v === 'boolean' ? (v ? 1 : 0) : v;
  });
  await db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`).run(...values, id);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDb();
  await db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

// ---------- Users ----------
export async function getUserByEmail(email: string): Promise<DBUser | undefined> {
  const db = await getDb();
  const row = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return row as unknown as DBUser | undefined;
}

export async function getUserById(id: string): Promise<DBUser | undefined> {
  const db = await getDb();
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return row as unknown as DBUser | undefined;
}

export async function createUser(data: { name: string; email: string; password: string; role?: string }): Promise<DBUser> {
  const db = await getDb();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await db
    .prepare('INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, data.name, data.email, data.password, data.role || 'CUSTOMER', createdAt);
  return (await getUserByEmail(data.email))!;
}

// ---------- Orders ----------
export async function getOrdersForUser(
  userId: string
): Promise<(DBOrder & { items: (DBOrderItem & { product: DBProduct })[] })[]> {
  const db = await getDb();
  const orders = (await db
    .prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC')
    .all(userId)) as unknown as DBOrder[];
  return attachItems(orders);
}

export async function getAllOrders(): Promise<(DBOrder & { items: (DBOrderItem & { product: DBProduct })[] })[]> {
  const db = await getDb();
  const orders = (await db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all()) as unknown as DBOrder[];
  return attachItems(orders);
}

async function attachItems(orders: DBOrder[]) {
  const db = await getDb();
  return Promise.all(
    orders.map(async (order) => {
      const items = (await db
        .prepare('SELECT * FROM order_items WHERE orderId = ?')
        .all(order.id)) as unknown as DBOrderItem[];
      const itemsWithProduct = await Promise.all(
        items.map(async (item) => ({
          ...item,
          product: rowToProduct(await db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId)),
        }))
      );
      return { ...order, items: itemsWithProduct };
    })
  );
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const db = await getDb();
  await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
}

export async function createOrder(data: {
  userId: string;
  items: { productId: string; quantity: number }[];
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  paymentMethod: string;
}) {
  const db = await getDb();
  await db.exec('BEGIN');
  try {
    let total = 0;
    const resolvedItems: { productId: string; quantity: number; price: number; name: string }[] = [];

    for (const item of data.items) {
      const product = (await db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId)) as any;
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}. Only ${product.stock} left.`);
      }
      total += product.price * item.quantity;
      resolvedItems.push({ productId: product.id, quantity: item.quantity, price: product.price, name: product.name });
      await db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, product.id);
    }

    const orderId = randomUUID();
    const createdAt = new Date().toISOString();
    await db.prepare(
      `INSERT INTO orders (id, userId, status, paymentMethod, total, shippingName, shippingPhone, shippingAddress, createdAt)
       VALUES (?, 'PENDING', ?, ?, ?, ?, ?, ?, ?)`
    ).run(orderId, data.paymentMethod, total, data.shippingName, data.shippingPhone, data.shippingAddress, createdAt);

    for (const item of resolvedItems) {
      await db.prepare('INSERT INTO order_items (id, orderId, productId, quantity, price) VALUES (?, ?, ?, ?, ?)').run(
        randomUUID(),
        orderId,
        item.productId,
        item.quantity,
        item.price
      );
    }

    await db.exec('COMMIT');
    return { id: orderId, total };
  } catch (err) {
    await db.exec('ROLLBACK');
    throw err;
  }
}

export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.exec('DELETE FROM order_items; DELETE FROM orders; DELETE FROM products; DELETE FROM categories; DELETE FROM users;');
}

export { getDb };