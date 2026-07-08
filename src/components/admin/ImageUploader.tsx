'use client';

import { useRef, useState } from 'react';
import { Upload, Link2, X, Loader2 } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import { toast } from '@/lib/toast-store';

type Props = {
  /** Current images, in order, as plain URLs/paths. */
  images: string[];
  onChange: (images: string[]) => void;
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

export default function ImageUploader({ images, onChange }: Props) {
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(fileList)) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });

          // Never assume the response is JSON - a proxy/server error could
          // return HTML and calling res.json() on that would throw.
          let data: any = null;
          try {
            data = await res.json();
          } catch {
            data = null;
          }

          if (!res.ok || !data?.url) {
            toast.error(data?.error || `Failed to upload "${file.name}".`);
            continue;
          }
          uploaded.push(data.url);
        } catch {
          toast.error(`Network error uploading "${file.name}".`);
        }
      }
      if (uploaded.length) {
        onChange([...images, ...uploaded]);
        toast.success(`Uploaded ${uploaded.length} image${uploaded.length > 1 ? 's' : ''}.`);
      }
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
    onChange([...images, trimmed]);
    setUrlInput('');
  }

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-ink-50 border border-ink-100">
              <SafeImage src={src} alt={`Product image ${i + 1}`} fill sizes="80px" className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label="Remove image"
                className="absolute top-1 right-1 bg-ink-900/70 hover:bg-ink-900 text-white rounded-full p-1 transition-colors"
              >
                <X size={12} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-white/90 text-[10px] font-medium text-ink-500 px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-sm border border-ink-100 hover:border-marigold-400 disabled:opacity-60 rounded-lg px-3 py-2 transition-colors"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Uploading...' : 'Upload photo(s)'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 border border-ink-100 rounded-lg px-3 py-2 focus-within:border-marigold-400">
          <Link2 size={16} className="text-ink-300 shrink-0" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="Or paste an image URL"
            className="w-full text-sm focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleAddUrl}
          className="text-sm font-medium text-ink-600 hover:text-ink border border-ink-100 rounded-lg px-3 py-2 transition-colors"
        >
          Add
        </button>
      </div>

      {images.length === 0 && <p className="text-xs text-ink-300">Add at least one photo or image URL.</p>}
    </div>
  );
}
