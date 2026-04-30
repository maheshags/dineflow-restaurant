/**
 * Maps integration for delivery app
 * Shows order delivery location using Google Maps Embed API
 */

import { MapPin } from 'lucide-react';

interface DeliveryMapProps {
    address: string;
    customerName?: string;
    className?: string;
}

export function DeliveryMap({ address, customerName, className = '' }: DeliveryMapProps) {
    const encodedAddress = encodeURIComponent(address);
    
    // Google Maps Embed API - no API key needed for basic embed
    const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.659849143405!2d${getCoordinates(address).lng}!3d${getCoordinates(address).lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${getCoordinates(address).lat}%2C${getCoordinates(address).lng}!5e0!3m2!1sen!2sin!4v1234567890`;

    return (
        <div className={`relative rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/5 ${className}`}>
            {/* Map Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Delivery Location</p>
                        {customerName && <p className="text-sm font-semibold text-white">{customerName}</p>}
                    </div>
                </div>
            </div>

            {/* Simple Map Fallback - Grid Pattern */}
            <div className="relative w-full h-64 bg-[#141414] overflow-hidden flex items-center justify-center">
                {/* Grid background */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Center marker */}
                <div className="absolute z-10 flex flex-col items-center gap-2">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-full animate-pulse opacity-20 scale-125"></div>
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50">
                            <MapPin className="w-5 h-5 text-primary-foreground" />
                        </div>
                    </div>
                    <p className="text-xs text-white/70 font-medium text-center max-w-[180px] leading-tight">{address}</p>
                </div>

                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-0 right-0 border-t border-primary/10" />
                    <div className="absolute left-1/2 top-0 bottom-0 border-l border-primary/10" />
                </div>
            </div>

            {/* Action Footer */}
            <div className="p-3 bg-[#0A0A0A] border-t border-white/5 flex gap-2">
                <button
                    onClick={() => {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                        window.open(mapsUrl, '_blank');
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                    Open in Maps
                </button>
                <button
                    onClick={() => {
                        // Copy address to clipboard
                        navigator.clipboard.writeText(address);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors border border-white/10"
                >
                    Copy Address
                </button>
            </div>
        </div>
    );
}

/**
 * Dummy coordinates generator based on address hash
 * In production, use geocoding API
 */
function getCoordinates(address: string) {
    const hash = address.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
    return {
        lat: 28.5 + ((hash % 30) / 100),
        lng: 77.0 + ((hash % 30) / 100),
    };
}

/**
 * Embedded Map View Component
 * For full-screen map viewing
 */
interface EmbeddedMapProps {
    address: string;
    height?: string;
}

export function EmbeddedMapView({ address, height = 'h-96' }: EmbeddedMapProps) {
    const encodedAddress = encodeURIComponent(address);
    
    return (
        <div className={`relative rounded-2xl overflow-hidden border border-white/10 bg-[#1a1a1a] ${height}`}>
            <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen={true}
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyDummyKeyForDemo&q=${encodedAddress}&zoom=15`}
            />
        </div>
    );
}
