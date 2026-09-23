import { type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

const icons = {
  success: <CheckCircle2 size={20} className="text-success-500" />,
  error: <XCircle size={20} className="text-error-500" />,
  info: <Info size={20} className="text-blue-500" />,
  warning: <AlertCircle size={20} className="text-warning-500" />,
};

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 px-4 py-3 animate-slide-up pointer-events-auto"
        >
          {icons[toast.type]}
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

export { type ReactNode };
