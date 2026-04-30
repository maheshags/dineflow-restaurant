import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, UtensilsCrossed, ShoppingBag } from 'lucide-react';

export const Route = createFileRoute('/user/loading')({
    component: LoadingScreen,
    head: () => ({
        meta: [{ title: 'Loading — Spice Garden' }],
    }),
});

const messages = [
    'Finding fresh meals near you…',
    'Loading today’s menu…',
    'Preparing your food experience…',
];

const icons = [Bike, UtensilsCrossed, ShoppingBag];

function LoadingScreen() {
    const navigate = useNavigate();
    const [msgIndex, setMsgIndex] = useState(0);
    const [iconIndex, setIconIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const msgInterval = setInterval(() => {
            setMsgIndex(i => (i + 1) % messages.length);
        }, 900);
        const iconInterval = setInterval(() => {
            setIconIndex(i => (i + 1) % icons.length);
        }, 700);
        const progressInterval = setInterval(() => {
            setProgress(p => Math.min(100, p + 100 / 28)); // ~2.8s
        }, 100);
        const navTimer = setTimeout(() => {
            navigate({ to: '/user' });
        }, 2800);

        return () => {
            clearInterval(msgInterval);
            clearInterval(iconInterval);
            clearInterval(progressInterval);
            clearTimeout(navTimer);
        };
    }, [navigate]);

    const Icon = icons[iconIndex];

    return (
        <div className="min-h-screen bg-[oklch(0.16_0.012_260)] text-[oklch(0.95_0.005_260)] flex justify-center font-body">
            <div className="w-full max-w-[480px] min-h-screen bg-[oklch(0.18_0.012_260)] relative flex flex-col items-center justify-center px-8 overflow-hidden shadow-2xl">
                {/* Ambient blobs */}
                <motion.div
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/15 blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-[oklch(0.70_0.18_55)]/10 blur-3xl"
                    animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Animated icon */}
                <div className="relative z-10 mb-12">
                    <motion.div
                        className="absolute inset-0 -m-6 rounded-full bg-primary/20 blur-2xl"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute inset-0 -m-4 rounded-full border-2 border-primary/30"
                        animate={{ scale: [1, 1.4, 1.4], opacity: [0.8, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.div
                        className="absolute inset-0 -m-4 rounded-full border-2 border-primary/30"
                        animate={{ scale: [1, 1.4, 1.4], opacity: [0.8, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                    />
                    <motion.div
                        className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.70_0.18_55)] flex items-center justify-center shadow-2xl shadow-primary/40"
                        animate={{ rotate: [0, -8, 8, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={iconIndex}
                                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                transition={{ duration: 0.35 }}
                            >
                                <Icon className="w-11 h-11 text-primary-foreground" strokeWidth={2.2} />
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Brand */}
                <h2 className="relative z-10 font-display font-bold text-2xl text-center">
                    <span className="text-primary">Spice</span> Garden
                </h2>

                {/* Rotating message */}
                <div className="relative z-10 h-7 mt-3 mb-8 w-full flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={msgIndex}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.4 }}
                            className="text-sm text-[oklch(0.7_0.01_260)] text-center absolute"
                        >
                            {messages[msgIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Progress bar */}
                <div className="relative z-10 w-56 h-1.5 rounded-full bg-[oklch(0.24_0.012_260)] overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary to-[oklch(0.78_0.18_55)] rounded-full"
                        style={{ width: `${progress}%` }}
                        transition={{ ease: 'linear' }}
                    />
                </div>

                {/* Pulsing dots */}
                <div className="relative z-10 flex items-center gap-2 mt-8">
                    {[0, 1, 2].map(i => (
                        <motion.span
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}