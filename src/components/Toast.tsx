'use client';

import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '@/lib/toast-store';

const styles = {
  success: { icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  error: { icon: AlertTriangle, classes: 'bg-spice/10 text-spice border-spice/20' },
  info: { icon: Info, classes: 'bg-ink-50 text-ink-600 border-ink-100' },
} as const;

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => {
        const { icon: Icon, classes } = styles[t.type];
        return (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start gap-2.5 border rounded-lg px-4 py-3 shadow-lg text-sm ${classes}`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <p className="flex-1">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss"
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
