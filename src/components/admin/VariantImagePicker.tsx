'use client';

import { useRef, useState } from 'react';
import { Link2, X, Loader2, ImagePlus } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import { toast } from '@/lib/toast-store';

type Props = {
  /** Current image URL/path for this one variant, or empty string if unset. */
  image: string;
  onChange: (image: string) => void;
};

function looksLikeUrlOrPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * A small single-image slot used next to each variant row so an admin can
 * assign (e.g.) a specific photo to the "Red" color option. Mirrors
 * ImageUploader's upload/URL behavior but only ever holds one image.
 */
export default function VariantImagePicker({ image, onChange }: Props) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.url) {
        toast.error(data?.error || `Failed to upload "${file.name}".`);
        return;
      }
      onChange(data.url);
    } catch {
      toast.error(`Network error uploading "${file.name}".`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!looksLikeUrlOrPath(trimmed)) {
      toast.error('That doesn\u2019t look like a valid image URL. It should start with http:// or https://');
      return;
    }
    onChange(trimmed);
    setUrlInput('');
    setShowUrlInput(false);
  }

  if (image) {
    return (
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-ink-50 border border-ink-100 shrink-0">
        <SafeImage src={image} alt="Variant photo" fill sizes="56px" className="object-cover" />
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Remove variant image"
          className="absolute top-0.5 right-0.5 bg-ink-900/70 hover:bg-ink-900 text-white rounded-full p-0.5 transition-colors"
        >
          <X size={10} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      {showUrlInput ? (
        <div className="flex items-center gap-1 w-40">
          <input
            autoFocus
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
              if (e.key === 'Escape') setShowUrlInput(false);
            }}
            onBlur={() => {
              if (!urlInput.trim()) setShowUrlInput(false);
            }}
            placeholder="Image URL"
            className="w-full border border-ink-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-marigold-400"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="text-xs font-medium text-ink-600 hover:text-ink border border-ink-100 rounded-lg px-2 py-1.5 transition-colors shrink-0"
          >
            Add
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload variant photo"
            title="Upload photo for this option"
            className="w-14 h-14 flex flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-ink-200 hover:border-marigold-400 disabled:opacity-60 text-ink-300 hover:text-marigold-500 transition-colors"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            <span className="text-[9px] leading-none">Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            aria-label="Paste image URL"
            title="Paste an image URL instead"
            className="text-ink-300 hover:text-marigold-500 transition-colors p-1"
          >
            <Link2 size={14} />
          </button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
