import ErrorBoundary from '@/components/ErrorBoundary';
import ToastContainer from '@/components/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <ToastContainer />
    </ErrorBoundary>
  );
}
