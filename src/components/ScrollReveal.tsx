'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * A single shared IntersectionObserver reused across every <ScrollReveal>
 * instance on the page, instead of one observer per card. Product grids can
 * have dozens of cards — one observer with many targets is far cheaper than
 * dozens of independent observers, and this is the piece that actually
 * matters for scroll performance on a catalog page.
 */
let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function getObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          callbacks.get(entry.target)?.();
          sharedObserver?.unobserve(entry.target); // reveal once, then stop watching
          callbacks.delete(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  return sharedObserver;
}

type ScrollRevealProps = {
  children: ReactNode;
  /** Stagger delay in ms — e.g. index * 60 for a cascading grid reveal. */
  delay?: number;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
};

export default function ScrollReveal({ children, delay = 0, className = '', as: Tag = 'div', ...rest }: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the user's motion preference — reduced motion just skips
    // straight to the visible state, no observer needed.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    callbacks.set(el, () => setVisible(true));
    getObserver().observe(el);

    return () => {
      callbacks.delete(el);
      sharedObserver?.unobserve(el);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
