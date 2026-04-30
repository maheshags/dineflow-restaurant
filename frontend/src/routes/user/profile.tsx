import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Heart, CreditCard, Bell, Shield, Settings, LogOut, ChevronRight, Star, Award, Loader2, AlertCircle, Edit2, Key, Check, X, User, Phone, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const Route = createFileRoute('/user/profile')({
    component: UserProfile,
});

const API_BASE_URL = "http://localhost:5000/api";

function UserProfile() {
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState<any>(null);
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Editing States
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    // Password States
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '' });
    const [savingPass, setSavingPass] = useState(false);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate({ to: '/user/login' });
                return;
            }

            const [profileRes, dashRes] = await Promise.all([
                fetch(`${API_BASE_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/user/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const pData = await profileRes.json();
            const dData = await dashRes.json();

            if (!profileRes.ok) throw new Error(pData.message || 'Error fetching profile');
            
            setProfile(pData.data);
            setDashboard(dData.data);
            setEditForm({
                name: pData.data.name || '',
                phone: pData.data.phone || '',
                address: pData.data.address || ''
            });

        } catch (e: any) {
            setError(e.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [navigate]);

    const handleUpdateProfile = async () => {
        setSavingProfile(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update user');
            
            setProfile(data.data);
            toast.success('Profile updated successfully');
            setIsEditing(false);
            
            // Sync local storage context if needed
            const lUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...lUser, name: editForm.name }));
            
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passForm.oldPassword || !passForm.newPassword) {
            toast.error('Both password fields are required');
            return;
        }
        setSavingPass(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/user/change-password`, {
                method: 'PUT',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(passForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to change password');
            
            toast.success('Password updated successfully');
            setIsChangingPass(false);
            setPassForm({ oldPassword: '', newPassword: '' });
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSavingPass(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate({ to: '/user/login' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="px-5 py-20 text-center">
                <AlertCircle className="w-9 h-9 text-destructive mx-auto" />
                <h2 className="font-display font-bold text-lg mt-5 text-destructive">Dashboard Error</h2>
                <p className="text-sm text-[oklch(0.6_0.01_260)] mt-1">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 rounded-full bg-[oklch(0.24_0.012_260)] text-sm font-semibold">Retry</button>
            </div>
        );
    }

    return (
        <div>
            <header className="sticky top-0 z-30 bg-[oklch(0.18_0.012_260)]/95 backdrop-blur-xl border-b border-[oklch(0.26_0.012_260)] px-5 pt-6 pb-3">
                <div className="flex items-center gap-3">
                    <Link to="/user" className="w-9 h-9 rounded-full bg-[oklch(0.24_0.012_260)] flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="font-display font-bold text-lg flex-1">Profile</h1>
                </div>
            </header>

            {/* Profile Card & Editing */}
            <section className="px-5 pt-5">
                <AnimatePresence mode="wait">
                    {!isEditing ? (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-gradient-to-br from-primary/20 to-[oklch(0.22_0.012_260)] rounded-3xl p-5 border border-primary/30 relative overflow-hidden"
                        >
                            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-2xl uppercase">
                                    {profile?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-display font-bold text-lg">{profile?.name}</h2>
                                    <p className="text-xs text-[oklch(0.7_0.01_260)] truncate">{profile?.email || profile?.phone}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1">
                                            <Award className="w-3 h-3 text-warning" />
                                            <span className="text-[10px] font-semibold text-warning">{profile?.role?.toUpperCase()}</span>
                                        </div>
                                        <button onClick={() => setIsEditing(true)} className="w-6 h-6 bg-primary/20 rounded text-primary flex items-center justify-center">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {profile?.address && (
                                <p className="relative mt-4 text-xs text-[oklch(0.7_0.01_260)] flex items-start gap-1">
                                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                                    <span>{profile.address}</span>
                                </p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[oklch(0.22_0.012_260)] rounded-3xl p-5 border border-[oklch(0.26_0.012_260)]"
                        >
                            <h3 className="font-display font-bold text-sm mb-4">Edit Profile</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-[oklch(0.6_0.01_260)] ml-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={editForm.name} 
                                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full bg-[oklch(0.18_0.012_260)] border border-[oklch(0.26_0.012_260)] rounded-xl px-4 h-10 text-sm outline-none mt-1 focus:border-primary transition-colors" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[oklch(0.6_0.01_260)] ml-1">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        value={editForm.phone} 
                                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                        className="w-full bg-[oklch(0.18_0.012_260)] border border-[oklch(0.26_0.012_260)] rounded-xl px-4 h-10 text-sm outline-none mt-1 focus:border-primary transition-colors" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[oklch(0.6_0.01_260)] ml-1">Address</label>
                                    <input 
                                        type="text" 
                                        value={editForm.address} 
                                        onChange={e => setEditForm({...editForm, address: e.target.value})}
                                        className="w-full bg-[oklch(0.18_0.012_260)] border border-[oklch(0.26_0.012_260)] rounded-xl px-4 h-10 text-sm outline-none mt-1 focus:border-primary transition-colors" 
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[oklch(0.3_0.01_260)]">Cancel</button>
                                    <button onClick={handleUpdateProfile} disabled={savingProfile} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-2">
                                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Comprehensive Stats mapping per requirements */}
            <section className="px-5 mt-4 grid grid-cols-2 gap-3">
                <Stat label="Total Orders" value={dashboard?.totalOrders?.toString() || '0'} />
                <Stat label="Total Spent" value={`₹${dashboard?.totalSpent || '0'}`} />
                <Stat label="Delivered" value={dashboard?.stats?.delivered?.toString() || '0'} />
                <Stat label="Pending" value={dashboard?.stats?.pending?.toString() || '0'} />
                <Stat label="Cancelled" value={dashboard?.stats?.cancelled?.toString() || '0'} />
                <Stat label="Saved Foods" value={dashboard?.favoriteFoods?.length?.toString() || '0'} />
            </section>

            {/* Menu */}
            <section className="px-5 mt-6 space-y-2 pb-24">
                {/* Security Section dynamically restricted for OTP/No-Password users */}
                {profile?.email ? (
                    <div className="mb-4">
                        <button
                            onClick={() => setIsChangingPass(!isChangingPass)}
                            className="w-full flex items-center gap-3 bg-[oklch(0.22_0.012_260)] hover:bg-[oklch(0.24_0.012_260)] rounded-2xl p-3.5 border border-[oklch(0.26_0.012_260)] transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                                <Key className="w-4 h-4" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-sm">Change Password</p>
                                <p className="text-[10px] text-[oklch(0.6_0.01_260)]">Update your security</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-[oklch(0.5_0.01_260)] transition-transform ${isChangingPass ? 'rotate-90' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isChangingPass && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-2 bg-[oklch(0.22_0.012_260)] rounded-2xl p-4 border border-[oklch(0.26_0.012_260)]">
                                        <input 
                                            type="password" 
                                            placeholder="Old Password"
                                            value={passForm.oldPassword}
                                            onChange={e => setPassForm({...passForm, oldPassword: e.target.value})}
                                            className="w-full bg-[oklch(0.18_0.012_260)] border border-[oklch(0.26_0.012_260)] rounded-xl px-4 h-10 text-sm outline-none mb-3 focus:border-primary transition-colors" 
                                        />
                                        <input 
                                            type="password" 
                                            placeholder="New Password"
                                            value={passForm.newPassword}
                                            onChange={e => setPassForm({...passForm, newPassword: e.target.value})}
                                            className="w-full bg-[oklch(0.18_0.012_260)] border border-[oklch(0.26_0.012_260)] rounded-xl px-4 h-10 text-sm outline-none mb-3 focus:border-primary transition-colors" 
                                        />
                                        <button onClick={handleChangePassword} disabled={savingPass} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-2">
                                            {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Security'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="w-full flex items-center gap-3 bg-[oklch(0.22_0.012_260)] opacity-60 rounded-2xl p-3.5 border border-[oklch(0.26_0.012_260)]">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Key className="w-4 h-4" />
                       </div>
                       <div className="flex-1 text-left">
                            <p className="font-semibold text-sm">Change Password</p>
                            <p className="text-[10px] text-[oklch(0.6_0.01_260)]">Password login not enabled</p>
                       </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 bg-destructive/10 hover:bg-destructive/15 rounded-2xl p-3.5 border border-destructive/20 transition-colors mt-3"
                >
                    <div className="w-10 h-10 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center">
                        <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-destructive">Log Out</span>
                </button>

                <p className="text-center text-[10px] text-[oklch(0.5_0.01_260)] py-4">Spice Garden v1.0.0</p>
            </section>
        </div>
    );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="bg-[oklch(0.22_0.012_260)] rounded-2xl p-3 border border-[oklch(0.26_0.012_260)] text-center shadow-lg shadow-black/20">
            <p className="font-display font-bold text-base flex items-center justify-center gap-1">{icon}{value}</p>
            <p className="text-[10px] text-[oklch(0.6_0.01_260)] mt-0.5">{label}</p>
        </div>
    );
}