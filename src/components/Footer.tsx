export default function Footer() {
  return (
    <footer className="bg-ink text-ink-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h3 className="font-display text-xl text-white mb-3">
            Shop<span className="text-marigold-400">Mart</span>
          </h3>
          <p className="text-ink-200">Your everyday marketplace for electronics, fashion, home, beauty, groceries and more.</p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Customer Service</h4>
          <ul className="space-y-2 text-ink-200">
            <li>Help Center</li>
            <li>Track Order</li>
            <li>Returns & Refunds</li>
            <li>Contact Us</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Company</h4>
          <ul className="space-y-2 text-ink-200">
            <li>About ShopMart</li>
            <li>Careers</li>
            <li>Seller Center</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Payment Methods</h4>
          <p className="text-ink-200">Cash on Delivery, Cards, and Mobile Banking</p>
        </div>
      </div>
      <div className="border-t border-ink-600 text-center text-xs text-ink-300 py-4">
        © {new Date().getFullYear()} ShopMart. Built as a demo storefront.
      </div>
    </footer>
  );
}
