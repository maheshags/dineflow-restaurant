import { useState } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationCenter() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const notificationIcons = {
        order_assigned: <AlertCircle className="w-5 h-5 text-primary" />,
        status_updated: <Info className="w-5 h-5 text-blue-500" />,
        delivery_completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    };

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors group"
            >
                <Bell className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-96 max-h-96 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#141414]">
                            <div>
                                <h3 className="font-semibold text-white">Notifications</h3>
                                <p className="text-xs text-white/50">{unreadCount} unread</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                    <p className="text-sm text-white/50">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map(notif => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${
                                                !notif.read ? 'bg-primary/10' : ''
                                            }`}
                                            onClick={() => markAsRead(notif.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className="shrink-0 mt-1">
                                                    {notificationIcons[notif.type]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-white truncate">
                                                        {notif.title}
                                                    </h4>
                                                    <p className="text-xs text-white/60 mt-1 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-xs text-white/40 mt-2">
                                                        {formatTime(notif.timestamp)}
                                                    </p>
                                                </div>
                                                {!notif.read && (
                                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-white/5 bg-[#141414] flex gap-2">
                                <button
                                    onClick={() => {
                                        markAllAsRead();
                                    }}
                                    className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                                >
                                    Mark all read
                                </button>
                                <button
                                    onClick={() => {
                                        clearNotifications();
                                        setIsOpen(false);
                                    }}
                                    className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Format timestamp to readable time difference
 */
function formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
}
