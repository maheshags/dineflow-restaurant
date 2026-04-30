import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import type { PaymentSettings } from '@/lib/types';
import { CreditCard, QrCode, Smartphone, Banknote, Save, Upload, Eye, Loader, X } from 'lucide-react';
import { toast } from 'sonner';
import paymentsService from '@/services/payments';

export const Route = createFileRoute('/dashboard/payments')({
  component: PaymentsPage,
});

// Safe default so the form always has something to render
const DEFAULT_SETTINGS: PaymentSettings = {
  upiId: '',
  qrCodeImage: '',
  upiEnabled: true,
  qrEnabled: false,
  cashEnabled: true,
  cardEnabled: true,
  instructions: 'Scan the QR code or use UPI ID to complete payment before placing your order.',
};

function PaymentsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch on mount ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await paymentsService.getSettings();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } catch (err) {
        console.error('Failed to load payment settings:', err);
        toast.error('Could not load payment settings. Using defaults.');
        // Keep default values — page remains usable
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const update = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  /** Convert the picked image file to a base64 data URL and store it in state. */
  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, SVG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      update('qrCodeImage', reader.result as string);
      toast.success('QR image loaded — click Save to persist');
    };
    reader.onerror = () => toast.error('Failed to read image file');
    reader.readAsDataURL(file);

    // Reset so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleSave = async (section?: string) => {
    try {
      setSaving(true);
      const saved = await paymentsService.updateSettings(settings);
      setSettings({ ...DEFAULT_SETTINGS, ...saved });
      toast.success(section ? `${section} saved` : 'Payment settings saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <TopNavbar title="Payment Settings" subtitle="Manage payment methods" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading payment settings…</p>
          </div>
        </div>
      </>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <>
      <TopNavbar title="Payment Settings" subtitle="Manage payment methods" />
      <div className="p-6 space-y-6 max-w-4xl">

        {/* UPI Setup */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">UPI Setup</h3>
              <p className="text-xs text-muted-foreground">Configure your UPI payment ID</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">UPI ID</label>
              <input
                value={settings.upiId}
                onChange={e => update('upiId', e.target.value)}
                placeholder="yourname@upi"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <p className="text-xs text-muted-foreground mt-1">Format: username@bankname or phone@upi</p>
            </div>
            <button
              onClick={() => handleSave('UPI ID')}
              disabled={saving}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save UPI ID
            </button>
          </div>
        </div>

        {/* QR Code Setup */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-info" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">QR Code Setup</h3>
              <p className="text-xs text-muted-foreground">Upload your payment QR code</p>
            </div>
          </div>
          {/* Hidden file input — triggered by button or preview box click */}
          <input
            ref={qrFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleQrFileChange}
          />

          <div className="flex items-start gap-6">
            {/* Clickable preview box */}
            <div
              onClick={() => qrFileInputRef.current?.click()}
              title="Click to upload QR image"
              className="w-40 h-40 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors relative group"
            >
              {settings.qrCodeImage ? (
                <>
                  <img src={settings.qrCodeImage} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Click to upload</span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => qrFileInputRef.current?.click()}
                className="h-9 px-4 rounded-lg border border-input text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload QR Code
              </button>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG · max 2 MB</p>
              {settings.qrCodeImage && (
                <button
                  type="button"
                  onClick={() => {
                    update('qrCodeImage', '');
                    toast.success('QR image removed — click Save to persist');
                  }}
                  className="h-9 px-4 rounded-lg border border-destructive text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method Toggles */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-4">Payment Methods</h3>
          <div className="space-y-4">
            {[
              { key: 'upiEnabled'  as const, label: 'UPI Payments',      icon: Smartphone, desc: 'Accept payments via UPI' },
              { key: 'qrEnabled'   as const, label: 'QR Code Payments',   icon: QrCode,     desc: 'Accept payments via QR code scan' },
              { key: 'cashEnabled' as const, label: 'Cash on Delivery',   icon: Banknote,   desc: 'Accept cash payments' },
              { key: 'cardEnabled' as const, label: 'Card Payments',      icon: CreditCard, desc: 'Accept debit/credit card payments' },
            ].map(method => (
              <div key={method.key} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <method.icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => update(method.key, !settings[method.key])}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings[method.key] ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${
                      settings[method.key] ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleSave('Payment methods')}
            disabled={saving}
            className="mt-4 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Methods
          </button>
        </div>

        {/* Payment Instructions */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-4">Payment Instructions</h3>
          <textarea
            value={settings.instructions}
            onChange={e => update('instructions', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
            placeholder="Enter payment instructions for customers..."
          />
          <p className="text-xs text-muted-foreground mt-1">
            Example: "Scan the QR code and complete payment before placing order"
          </p>
          <button
            onClick={() => handleSave('Instructions')}
            disabled={saving}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Instructions
          </button>
        </div>

        {/* Preview */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-display font-semibold text-foreground">Payment Preview</h3>
          </div>
          <div className="bg-muted/30 rounded-xl p-6 max-w-sm mx-auto">
            <h4 className="font-semibold text-foreground text-center mb-4">Payment Details</h4>
            {settings.upiEnabled && settings.upiId && (
              <div className="bg-background rounded-lg p-3 mb-3">
                <p className="text-xs text-muted-foreground">UPI ID</p>
                <p className="text-sm font-medium text-foreground">{settings.upiId}</p>
              </div>
            )}
            {settings.qrEnabled && settings.qrCodeImage && (
              <div className="bg-background rounded-lg p-3 mb-3 flex justify-center">
                <img src={settings.qrCodeImage} alt="QR" className="w-32 h-32 object-contain" />
              </div>
            )}
            {settings.instructions && (
              <p className="text-xs text-muted-foreground text-center mt-2">{settings.instructions}</p>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
