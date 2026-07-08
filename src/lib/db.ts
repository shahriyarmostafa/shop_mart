import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

// Next.js's own CLI (next dev/build/start) auto-loads .env, but running this
// module via plain `tsx` (e.g. the seed script) does not. Without this, the
// seed script and the app can silently point at different databases.
try {
  process.loadEnvFile();
} catch {
  // No .env file present - expected on Vercel/production, where env vars
  // are injected directly rather than read from a file.
}

const url = process.env.DATABASE_URL || "file:./data/shop.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (process.env.NODE_ENV !== 'production') {
  console.log(`[db] connecting to: ${url.startsWith('file:') ? url : url.replace(/\/\/.*@/, '//***@')}`);
}

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

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      attributeName TEXT NOT NULL,
      value TEXT NOT NULL,
      priceModifier REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id)
    );
  `);

  // order_items gained variant-tracking columns after the original schema
  // shipped. ALTER TABLE ADD COLUMN isn't idempotent in SQLite (there's no
  // "IF NOT EXISTS" for columns), so guard each one against the "duplicate
  // column" error a server that already has them would throw.
  const orderItemColumnAdditions = [
    'ALTER TABLE order_items ADD COLUMN variantId TEXT',
    'ALTER TABLE order_items ADD COLUMN variantLabel TEXT',
  ];
  for (const stmt of orderItemColumnAdditions) {
    try {
      await db.exec(stmt);
    } catch (err: any) {
      if (!String(err?.message || err).toLowerCase().includes('duplicate column')) {
        throw err;
      }
    }
  }
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
  /** True if this product has one or more rows in product_variants. Only
   *  populated by queries that join for it (getProducts, getRelatedProducts);
   *  defaults to false elsewhere. */
  hasVariants?: boolean;
};

export type DBVariant = {
  id: string;
  productId: string;
  attributeName: string;
  value: string;
  priceModifier: number;
  stock: number;
  image: string | null;
  sortOrder: number;
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
  /** Comma-joined product_variants ids actually purchased (or null for a plain, variant-less item). */
  variantId: string | null;
  /** Human-readable snapshot, e.g. "Color: Red, Size: XL", taken at order time so it survives later variant edits/deletes. */
  variantLabel: string | null;
};

function rowToProduct(row: any): DBProduct {
  const { variantCount, ...rest } = row;
  return { ...rest, featured: !!row.featured, hasVariants: Number(variantCount || 0) > 0 };
}

function rowToVariant(row: any): DBVariant {
  return {
    ...row,
    priceModifier: Number(row.priceModifier) || 0,
    stock: Number(row.stock) || 0,
    sortOrder: Number(row.sortOrder) || 0,
  };
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

  const sql = `SELECT p.*, (SELECT COUNT(*) FROM product_variants v WHERE v.productId = p.id) as variantCount
               FROM products p ${joinCategory} ${where} ORDER BY ${orderBy} ${limit}`;
  const rows = await db.prepare(sql).all(...params);
  return rows.map(rowToProduct);
}

export async function getProductBySlug(
  slug: string
): Promise<(DBProduct & { category: DBCategory; variants: DBVariant[] }) | undefined> {
  const db = await getDb();
  const row = await db.prepare('SELECT * FROM products WHERE slug = ?').get(slug) as any;
  if (!row) return undefined;
  const categoryPrepared = db.prepare('SELECT * FROM categories WHERE id = ?');
  const category = (await categoryPrepared.get(row.categoryId)) as unknown as DBCategory;
  const variants = await getVariantsForProduct(row.id);
  return { ...rowToProduct(row), category, variants };
}

export async function getProductById(id: string): Promise<(DBProduct & { variants: DBVariant[] }) | undefined> {
  const db = await getDb();
  const row = await db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  const variants = await getVariantsForProduct(id);
  return { ...rowToProduct(row), variants };
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 5): Promise<DBProduct[]> {
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT p.*, (SELECT COUNT(*) FROM product_variants v WHERE v.productId = p.id) as variantCount
       FROM products p WHERE p.categoryId = ? AND p.id != ? LIMIT ?`
    )
    .all(categoryId, excludeId, limit);
  return rows.map(rowToProduct);
}

// ---------- Product Variants ----------
export async function getVariantsForProduct(productId: string): Promise<DBVariant[]> {
  const db = await getDb();
  const rows = await db
    .prepare('SELECT * FROM product_variants WHERE productId = ? ORDER BY sortOrder ASC, createdAt ASC')
    .all(productId);
  return rows.map(rowToVariant);
}

export type VariantInput = {
  attributeName: string;
  value: string;
  priceModifier?: number;
  stock?: number;
  image?: string | null;
};

/**
 * Replaces all variants for a product with the given set. A full
 * delete-and-reinsert is the simplest strategy that stays correct for an
 * admin form where rows can be freely added, edited, and removed - there's
 * no stable client-side id to diff against otherwise.
 *
 * Also keeps products.stock in sync as the sum of variant stock, so
 * anything that only reads the flat product record (ProductCard's
 * "out of stock" badge, the admin table, checkout's fallback stock check)
 * keeps showing an accurate total without needing to know variants exist.
 */
export async function replaceVariantsForProduct(productId: string, variants: VariantInput[]): Promise<void> {
  const db = await getDb();
  await db.prepare('DELETE FROM product_variants WHERE productId = ?').run(productId);

  let totalStock = 0;
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const stock = Math.max(0, Math.trunc(v.stock ?? 0));
    totalStock += stock;
    await db
      .prepare(
        `INSERT INTO product_variants (id, productId, attributeName, value, priceModifier, stock, image, sortOrder, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        randomUUID(),
        productId,
        v.attributeName.trim(),
        v.value.trim(),
        v.priceModifier ?? 0,
        stock,
        v.image?.trim() || null,
        i,
        new Date().toISOString()
      );
  }

  if (variants.length > 0) {
    await updateProduct(productId, { stock: totalStock } as Partial<DBProduct>);
  }
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
  variants?: VariantInput[];
}): Promise<DBProduct & { variants: DBVariant[] }> {
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

  if (data.variants && data.variants.length) {
    await replaceVariantsForProduct(id, data.variants);
  }

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
  items: { productId: string; quantity: number; variantIds?: string[] }[];
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  paymentMethod: string;
}) {
  const tx = await client.transaction('write');
  try {
    let total = 0;
    const resolvedItems: {
      productId: string;
      quantity: number;
      price: number;
      name: string;
      variantId: string | null;
      variantLabel: string | null;
    }[] = [];

    for (const item of data.items) {
      const result = await tx.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [item.productId] });
      const product = result.rows[0] as any;
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      // Never trust a client-supplied price - always recompute from the
      // authoritative product (and variant) rows.
      const variantIds = Array.isArray(item.variantIds) ? item.variantIds.filter(Boolean) : [];
      const selectedVariants: any[] = [];
      let unitPrice = product.price as number;

      if (variantIds.length) {
        for (const variantId of variantIds) {
          const vResult = await tx.execute({
            sql: 'SELECT * FROM product_variants WHERE id = ? AND productId = ?',
            args: [variantId, item.productId],
          });
          const variant = vResult.rows[0] as any;
          if (!variant) throw new Error(`A selected option for ${product.name} is no longer available.`);
          if ((variant.stock as number) < item.quantity) {
            throw new Error(
              `Not enough stock for ${product.name} (${variant.attributeName}: ${variant.value}). Only ${variant.stock} left.`
            );
          }
          selectedVariants.push(variant);
          unitPrice += (variant.priceModifier as number) || 0;
        }
      } else if ((product.stock as number) < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}. Only ${product.stock} left.`);
      }

      unitPrice = Math.max(0, unitPrice);
      total += unitPrice * item.quantity;

      resolvedItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: unitPrice,
        name: product.name as string,
        variantId: selectedVariants.length ? selectedVariants.map((v) => v.id).join(',') : null,
        variantLabel: selectedVariants.length
          ? selectedVariants.map((v) => `${v.attributeName}: ${v.value}`).join(', ')
          : null,
      });

      // Keep the flat products.stock aggregate in sync either way, then
      // additionally draw down the specific variant(s) purchased.
      await tx.execute({ sql: 'UPDATE products SET stock = stock - ? WHERE id = ?', args: [item.quantity, product.id] });
      for (const variant of selectedVariants) {
        await tx.execute({
          sql: 'UPDATE product_variants SET stock = stock - ? WHERE id = ?',
          args: [item.quantity, variant.id],
        });
      }
    }

    const orderId = randomUUID();
    const createdAt = new Date().toISOString();
    await tx.execute({
      sql: `INSERT INTO orders (id, userId, status, paymentMethod, total, shippingName, shippingPhone, shippingAddress, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [orderId, data.userId, 'PENDING', data.paymentMethod, total, data.shippingName, data.shippingPhone, data.shippingAddress, createdAt],
    });

    for (const item of resolvedItems) {
      await tx.execute({
        sql: 'INSERT INTO order_items (id, orderId, productId, quantity, price, variantId, variantLabel) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [randomUUID(), orderId, item.productId, item.quantity, item.price, item.variantId, item.variantLabel],
      });
    }

    await tx.commit();
    return { id: orderId, total };
  } catch (err) {
    await tx.rollback();
    throw err;
  } finally {
    tx.close();
  }
}

export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.exec(
    'DELETE FROM order_items; DELETE FROM orders; DELETE FROM product_variants; DELETE FROM products; DELETE FROM categories; DELETE FROM users;'
  );
}

export { getDb };