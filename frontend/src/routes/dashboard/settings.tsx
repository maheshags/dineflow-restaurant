import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import type { RestaurantProfile } from '@/lib/types';
import { Save, Upload, User, Building2, Clock, Lock, Loader } from 'lucide-react';
import { toast } from 'sonner';
import profileService from '@/services/profile';

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
});

const DEFAULT_PROFILE: RestaurantProfile = {
  name: '',
  ownerName: '',
  email: '',
  phone: '',
  address: '',
  logo: '',
  openingTime: '10:00',
  closingTime: '23:00',
  description: '',
};

function SettingsPage() {
  const [profile, setProfile] = useState<RestaurantProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'profile' | 'restaurant' | 'security'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // ── Load profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await profileService.getProfile();
        setProfile({ ...DEFAULT_PROFILE, ...data });
      } catch (err) {
        console.error('Failed to load profile:', err);
        toast.error('Could not load profile. Using defaults.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Field updater ──────────────────────────────────────────────────────────
  const update = (key: keyof RestaurantProfile, value: string) =>
    setProfile(prev => ({ ...prev, [key]: value }));

  // ── Save profile / restaurant info ─────────────────────────────────────────
  const handleSave = async (section?: string) => {
    try {
      setSaving(true);
      const saved = await profileService.updateProfile(profile);
      setProfile({ ...DEFAULT_PROFILE, ...saved });
      toast.success(section ? `${section} saved` : 'Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    try {
      setChangingPassword(true);
      await profileService.changePassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile'    as const, label: 'Admin Profile',    icon: User },
    { id: 'restaurant' as const, label: 'Restaurant Info',  icon: Building2 },
    { id: 'security'   as const, label: 'Security',         icon: Lock },
  ];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <TopNavbar title="Settings" subtitle="Manage your profile and restaurant" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          </div>
        </div>
      </>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      <TopNavbar title="Settings" subtitle="Manage your profile and restaurant" />
      <div className="p-6 max-w-4xl">

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Admin Profile Tab ─────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold select-none">
                {profile.ownerName.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">{profile.ownerName || 'Admin'}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  value={profile.ownerName}
                  onChange={e => update('ownerName', e.target.value)}
                  placeholder="Enter your name"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  value={profile.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  value={profile.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <button
              onClick={() => handleSave('Admin profile')}
              disabled={saving}
              className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        )}

        {/* ── Restaurant Info Tab ───────────────────────────────────────── */}
        {activeTab === 'restaurant' && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                {profile.logo ? (
                  <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Restaurant Logo</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Shown to customers on receipts and menus</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Restaurant Name</label>
                <input
                  value={profile.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="Spice Garden Restaurant"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  value={profile.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                value={profile.address}
                onChange={e => update('address', e.target.value)}
                rows={2}
                placeholder="42, MG Road, Bangalore - 560001"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={profile.description}
                onChange={e => update('description', e.target.value)}
                rows={2}
                placeholder="Authentic Indian cuisine with a modern twist…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Opening Time
                </label>
                <input
                  type="time"
                  value={profile.openingTime}
                  onChange={e => update('openingTime', e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Closing Time
                </label>
                <input
                  type="time"
                  value={profile.closingTime}
                  onChange={e => update('closingTime', e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <button
              onClick={() => handleSave('Restaurant info')}
              disabled={saving}
              className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Restaurant Info
            </button>
          </div>
        )}

        {/* ── Security Tab ─────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-5">
            <h3 className="font-display font-semibold text-foreground">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {changingPassword ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
