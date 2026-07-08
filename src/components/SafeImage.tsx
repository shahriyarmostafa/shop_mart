'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';

/**
 * Returns true if `src` is something next/image can safely be asked to render:
 * either a root-relative local path (e.g. "/uploads/abc.jpg") or a fully
 * qualified http(s) URL. Anything else (empty strings, garbage text pasted
 * into a form, relative paths without a leading slash, javascript: URLs,
 * etc.) is rejected so we never hand next/image a value it might throw on.
 */
function isRenderableSrc(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('/')) return true;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

type SafeImageProps = Omit<ImageProps, 'src' | 'onError'> & {
  src: string | null | undefined;
  /** Extra classes applied to the fallback placeholder box so it can match the real image's shape. */
  fallbackClassName?: string;
};

/**
 * Drop-in replacement for next/image that can never crash the page.
 *
 * - Invalid/empty/malformed src values never reach next/image at all; we
 *   render a placeholder box instead.
 * - Valid-looking URLs that fail to actually load (404, broken link, CORS,
 *   non-image content, etc.) are caught via onError and swapped to the same
 *   placeholder.
 */
export default function SafeImage({ src, alt, className, fallbackClassName, fill, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  // Reset error state if the caller gives us a new src to try (e.g. editing a product).
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const canRender = isRenderableSrc(src) && !failed;

  if (!canRender) {
    return (
      <div
        className={`flex items-center justify-center bg-ink-50 text-ink-200 ${fill ? 'absolute inset-0' : ''} ${
          className || ''
        } ${fallbackClassName || ''}`}
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        <ImageOff size={fill ? 22 : 18} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={src as string}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
