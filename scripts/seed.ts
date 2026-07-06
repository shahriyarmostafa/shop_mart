import bcrypt from 'bcryptjs';
import { getDb, createCategory, createProduct, createUser, resetDatabase } from '../src/lib/db';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: 'Smartphone' },
  { name: 'Fashion', slug: 'fashion', icon: 'Shirt' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'Sofa' },
  { name: 'Beauty & Health', slug: 'beauty-health', icon: 'Sparkles' },
  { name: 'Groceries', slug: 'groceries', icon: 'ShoppingBasket' },
  { name: 'Sports & Outdoor', slug: 'sports-outdoor', icon: 'Dumbbell' },
];

const productsByCategory: Record<string, { name: string; price: number; compareAtPrice?: number; desc: string; featured?: boolean }[]> = {
  electronics: [
    { name: 'Wireless Bluetooth Earbuds', price: 1490, compareAtPrice: 2200, desc: 'Noise-isolating earbuds with 24-hour battery life via charging case.', featured: true },
    { name: '43-inch 4K Smart TV', price: 32999, compareAtPrice: 38999, desc: 'Ultra HD smart display with built-in streaming apps and voice remote.', featured: true },
    { name: 'Fast-Charging Power Bank 20000mAh', price: 1650, desc: 'Dual USB output power bank with LED charge indicator.' },
    { name: 'Mechanical Gaming Keyboard', price: 3200, compareAtPrice: 4100, desc: 'RGB backlit keyboard with blue clicky switches.' },
    { name: 'Smartwatch with Heart Rate Monitor', price: 2890, desc: 'Fitness tracking smartwatch with SpO2 and sleep tracking.' },
    { name: 'Portable Bluetooth Speaker', price: 1990, desc: 'Waterproof speaker with 12-hour playtime and deep bass.' },
  ],
  fashion: [
    { name: "Men's Slim Fit Cotton Shirt", price: 890, compareAtPrice: 1200, desc: 'Breathable cotton shirt, available in classic colors.', featured: true },
    { name: "Women's Embroidered Kurti", price: 1150, desc: 'Handcrafted embroidery on soft rayon fabric.' },
    { name: 'Unisex Canvas Sneakers', price: 1650, compareAtPrice: 2000, desc: 'Everyday casual sneakers with cushioned insole.' },
    { name: 'Leather Wallet', price: 750, desc: 'Genuine leather bi-fold wallet with card slots.' },
    { name: "Kids' Graphic T-Shirt Set", price: 690, desc: 'Pack of 2 soft cotton t-shirts for everyday wear.' },
    { name: 'Classic Denim Jacket', price: 2100, desc: 'Timeless denim jacket, unisex fit.' },
  ],
  'home-kitchen': [
    { name: 'Non-Stick Cookware Set (5-Piece)', price: 3450, compareAtPrice: 4200, desc: 'Durable non-stick pots and pans set with heat-resistant handles.', featured: true },
    { name: 'Electric Rice Cooker 1.8L', price: 2290, desc: 'One-touch rice cooker with keep-warm function.' },
    { name: 'Memory Foam Pillow (Set of 2)', price: 1290, desc: 'Ergonomic support pillows for better sleep.' },
    { name: 'LED Table Lamp', price: 850, desc: 'Adjustable brightness lamp with USB charging port.' },
    { name: '4-Seater Dining Table Set', price: 18500, compareAtPrice: 21000, desc: 'Solid wood dining set with cushioned chairs.' },
    { name: 'Stainless Steel Vacuum Flask', price: 590, desc: 'Keeps drinks hot for 12 hours, cold for 24.' },
  ],
  'beauty-health': [
    { name: 'Vitamin C Brightening Serum', price: 980, compareAtPrice: 1300, desc: 'Lightweight serum for even skin tone and glow.', featured: true },
    { name: 'Herbal Hair Oil 200ml', price: 420, desc: 'Nourishing blend of natural oils for hair growth.' },
    { name: 'Electric Toothbrush', price: 1590, desc: 'Rechargeable toothbrush with 3 cleaning modes.' },
    { name: 'Digital Body Weight Scale', price: 1150, desc: 'Precision scale with BMI calculation.' },
    { name: 'Sunscreen SPF 50+', price: 550, desc: 'Broad-spectrum, non-greasy daily sunscreen.' },
    { name: 'Aromatherapy Diffuser', price: 1290, desc: 'Ultrasonic diffuser with 7-color LED light.' },
  ],
  groceries: [
    { name: 'Premium Basmati Rice 5kg', price: 780, desc: 'Aromatic long-grain basmati rice.', featured: true },
    { name: 'Pure Mustard Oil 1L', price: 320, desc: 'Cold-pressed mustard oil for authentic flavor.' },
    { name: 'Organic Honey 500g', price: 590, desc: 'Raw, unprocessed honey sourced from local farms.' },
    { name: 'Mixed Dry Fruits Pack 1kg', price: 1450, desc: 'Assorted almonds, cashews, and raisins.' },
    { name: 'Green Tea Bags (100pcs)', price: 380, desc: 'Antioxidant-rich green tea for daily wellness.' },
    { name: 'Whole Wheat Flour 5kg', price: 420, desc: 'Stone-ground whole wheat atta.' },
  ],
  'sports-outdoor': [
    { name: 'Yoga Mat with Carry Strap', price: 690, desc: 'Non-slip 6mm mat for yoga and floor workouts.', featured: true },
    { name: 'Adjustable Dumbbell Set', price: 3900, compareAtPrice: 4600, desc: 'Space-saving dumbbells adjustable from 2.5kg to 20kg.' },
    { name: '2-Person Camping Tent', price: 4200, desc: 'Waterproof, easy-setup tent for weekend trips.' },
    { name: 'Cycling Helmet', price: 1250, desc: 'Lightweight, well-ventilated safety helmet.' },
    { name: 'Football - Size 5', price: 850, desc: 'Match-quality football for outdoor play.' },
    { name: 'Trekking Backpack 40L', price: 2600, desc: 'Durable backpack with multiple compartments.' },
  ],
};

async function main() {
  console.log('Seeding database...');
  await getDb();
  await resetDatabase();

  const adminPassword = await bcrypt.hash('admin123', 10);
  await createUser({ name: 'Store Admin', email: 'admin@shopmart.test', password: adminPassword, role: 'ADMIN' });

  const demoPassword = await bcrypt.hash('demo1234', 10);
  await createUser({ name: 'Demo Customer', email: 'demo@shopmart.test', password: demoPassword, role: 'CUSTOMER' });

  for (const cat of categories) {
    const created = await createCategory({ name: cat.name, slug: cat.slug, icon: cat.icon, image: img(cat.slug) });

    const items = productsByCategory[cat.slug];
    for (const p of items) {
      const seedKey = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const product = await createProduct({
        name: p.name,
        description: p.desc,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: Math.floor(Math.random() * 80) + 20,
        images: [img(seedKey + '-1'), img(seedKey + '-2')].join(','),
        categoryId: created.id,
        featured: !!p.featured,
      });
      // set randomized rating/review count directly since createProduct defaults them
      const rating = Math.round((4 + Math.random()) * 10) / 10;
      const reviewCount = Math.floor(Math.random() * 400) + 5;
      
      const db = await getDb();
      await db.prepare('UPDATE products SET rating = ?, reviewCount = ? WHERE id = ?').run(rating, reviewCount, product.id);
    }
  }

  console.log('Seed complete: admin@shopmart.test / admin123, demo@shopmart.test / demo1234');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
