import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08]"
        preserveAspectRatio="none"
        viewBox="0 0 800 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={i} cx={(i * 83) % 800} cy={40 + ((i * 57) % 220)} r={i % 3 === 0 ? 28 : 14} fill="#E8A020" />
        ))}
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-20 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <span className="inline-block price-tag bg-marigold-400 text-ink text-xs font-mono font-semibold mb-4">
            Season Sale — Up to 30% Off
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-white leading-tight">
            The whole bazaar,
            <br />
            <span className="text-marigold-400">brought to your door.</span>
          </h1>
          <p className="text-ink-100 mt-4 max-w-md mx-auto md:mx-0">
            Electronics, fashion, home essentials, beauty, groceries and more — all in one place, with cash on delivery.
          </p>
          <Link
            href="#featured"
            className="inline-block mt-6 bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Shop the Deals
          </Link>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3 w-full max-w-sm">
          <div className="bg-ink-800 rounded-xl p-4 h-28 flex flex-col justify-end">
            <span className="text-marigold-400 font-display text-xl">Electronics</span>
          </div>
          <div className="bg-marigold-400 rounded-xl p-4 h-28 flex flex-col justify-end">
            <span className="text-ink font-display text-xl">Fashion</span>
          </div>
          <div className="bg-spice rounded-xl p-4 h-28 flex flex-col justify-end">
            <span className="text-white font-display text-xl">Groceries</span>
          </div>
          <div className="bg-ink-800 rounded-xl p-4 h-28 flex flex-col justify-end">
            <span className="text-marigold-400 font-display text-xl">Home</span>
          </div>
        </div>
      </div>
    </section>
  );
}
