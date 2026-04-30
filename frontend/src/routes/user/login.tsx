import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowLeft, Loader2, UtensilsCrossed, ShieldCheck, User } from 'lucide-react';
import { useUserAuth } from '@/hooks/use-user-auth';

export const Route = createFileRoute('/user/login')({
    component: UserLoginPage,
    head: () => ({
        meta: [
            { title: 'Sign in — Spice Garden' },
            { name: 'description', content: 'Sign in to order from Spice Garden' },
        ],
    }),
});

const API_BASE_URL = "http://localhost:5000/api";

function UserLoginPage() {
    const navigate = useNavigate();
    const { signIn } = useUserAuth();
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [resendIn, setResendIn] = useState(0);
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setTimeout(() => setResendIn(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendIn]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (name.trim().length < 2) {
            setError('Please enter your name');
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            setError('Enter a valid 10-digit phone number');
            return;
        }
        setSending(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
            
            setSending(false);
            setStep('otp');
            setResendIn(30);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            setSending(false);
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleOtpChange = (i: number, val: string) => {
        const v = val.replace(/\D/g, '').slice(-1);
        const next = [...otp];
        next[i] = v;
        setOtp(next);
        setError('');
        if (v && i < 3) otpRefs.current[i + 1]?.focus();
    };

    const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) {
            otpRefs.current[i - 1]?.focus();
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const code = otp.join('');
        if (code.length !== 4) {
            setError('Enter the 4-digit code');
            return;
        }
        setVerifying(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), phone, otp: code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid OTP');
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            signIn(phone, name.trim());
            navigate({ to: '/user/loading' });
        } catch (err) {
            setVerifying(false);
            setError(err instanceof Error ? err.message : 'Invalid OTP. Hint: 1234');
            setOtp(['', '', '', '']);
            otpRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (resendIn > 0) return;
        setSending(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
            
            setSending(false);
            setResendIn(30);
            setOtp(['', '', '', '']);
            otpRefs.current[0]?.focus();
        } catch (err) {
            setSending(false);
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <div className="min-h-screen bg-[oklch(0.16_0.012_260)] text-[oklch(0.95_0.005_260)] flex justify-center font-body">
            <div className="w-full max-w-[480px] min-h-screen bg-[oklch(0.18_0.012_260)] relative flex flex-col shadow-2xl overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-32 left-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                {/* Top bar */}
                <div className="relative z-10 px-5 pt-6 pb-4 flex items-center">
                    {step === 'otp' && (
                        <button
                            onClick={() => { setStep('phone'); setOtp(['', '', '', '']); setError(''); }}
                            className="w-10 h-10 rounded-full bg-[oklch(0.24_0.012_260)] flex items-center justify-center"
                            aria-label="Back"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Brand */}
                <div className="relative z-10 px-6 pt-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.70_0.18_55)] flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                        <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
                    </motion.div>
                    <h1 className="font-display font-bold text-3xl mt-5 leading-tight">
                        {step === 'phone' ? <>Welcome to<br /><span className="text-primary">Spice Garden</span></> : 'Verify it’s you'}
                    </h1>
                    <p className="text-sm text-[oklch(0.65_0.01_260)] mt-2">
                        {step === 'phone'
                            ? 'Sign in with your phone to start ordering delicious meals.'
                            : <>We’ve sent a 4-digit code to <span className="text-[oklch(0.9_0.01_260)] font-medium">+91 {phone}</span></>}
                    </p>
                </div>

                {/* Forms */}
                <div className="relative z-10 px-6 mt-8 flex-1">
                    <AnimatePresence mode="wait">
                        {step === 'phone' ? (
                            <motion.form
                                key="phone"
                                onSubmit={handleSendOtp}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-5"
                            >
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-wider text-[oklch(0.6_0.01_260)] mb-2">
                                        Your name
                                    </label>
                                    <div className="flex items-center gap-2 bg-[oklch(0.22_0.012_260)] border border-[oklch(0.28_0.012_260)] rounded-2xl px-4 h-14 focus-within:border-primary/60 transition">
                                        <User className="w-4 h-4 text-primary" />
                                        <div className="w-px h-6 bg-[oklch(0.3_0.012_260)]" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => { setName(e.target.value.slice(0, 40)); setError(''); }}
                                            placeholder="e.g. Aarav Sharma"
                                            className="flex-1 bg-transparent outline-none text-base placeholder:text-[oklch(0.45_0.01_260)]"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-wider text-[oklch(0.6_0.01_260)] mb-2">
                                        Phone number
                                    </label>
                                    <div className="flex items-center gap-2 bg-[oklch(0.22_0.012_260)] border border-[oklch(0.28_0.012_260)] rounded-2xl px-4 h-14 focus-within:border-primary/60 transition">
                                        <Phone className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium text-[oklch(0.85_0.01_260)]">+91</span>
                                        <div className="w-px h-6 bg-[oklch(0.3_0.012_260)]" />
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            value={phone}
                                            onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                                            placeholder="98765 43210"
                                            className="flex-1 bg-transparent outline-none text-base placeholder:text-[oklch(0.45_0.01_260)] tracking-wider"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-xs text-destructive font-medium px-1">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                                >
                                    {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</> : 'Send OTP'}
                                </button>

                                <p className="text-[11px] text-[oklch(0.55_0.01_260)] text-center leading-relaxed pt-2">
                                    By continuing, you agree to our{' '}
                                    <span className="text-primary">Terms</span> &{' '}
                                    <span className="text-primary">Privacy Policy</span>
                                </p>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="otp"
                                onSubmit={handleVerify}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-wider text-[oklch(0.6_0.01_260)] mb-3">
                                        Enter OTP
                                    </label>
                                    <div className="flex items-center justify-between gap-3">
                                        {otp.map((d, i) => (
                                            <input
                                                key={i}
                                                ref={el => { otpRefs.current[i] = el; }}
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={d}
                                                onChange={e => handleOtpChange(i, e.target.value)}
                                                onKeyDown={e => handleOtpKey(i, e)}
                                                className="w-full aspect-square max-w-[68px] rounded-2xl bg-[oklch(0.22_0.012_260)] border border-[oklch(0.28_0.012_260)] text-center text-2xl font-display font-bold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5">
                                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                                    <p className="text-xs text-[oklch(0.8_0.01_260)]">
                                        Demo OTP is <span className="font-bold text-primary">1234</span>
                                    </p>
                                </div>

                                {error && (
                                    <p className="text-xs text-destructive font-medium px-1">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={verifying}
                                    className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                                >
                                    {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify & Continue'}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resendIn > 0 || sending}
                                        className="text-sm text-[oklch(0.65_0.01_260)] disabled:opacity-50"
                                    >
                                        Didn’t receive the code?{' '}
                                        <span className="text-primary font-semibold">
                                            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                                        </span>
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative z-10 px-6 pb-8 text-center">
                    <p className="text-[11px] text-[oklch(0.45_0.01_260)]">
                        Spice Garden · Order. Track. Enjoy.
                    </p>
                </div>
            </div>
        </div>
    );
}