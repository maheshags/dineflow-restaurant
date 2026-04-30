import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'destructive' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', variant = 'destructive', isLoading = false }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
          <AlertTriangle className={`w-6 h-6 ${variant === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-3 mt-6 w-full">
          <button onClick={onClose} disabled={isLoading} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); if (!isLoading) onClose(); }}
            disabled={isLoading}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
