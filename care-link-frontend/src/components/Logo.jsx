import React from 'react';

/**
 * Care Link AI Logo
 * A heart-shaped pulse monitor icon inside a rounded gradient container.
 * Props:
 *   size - 'sm' (32px), 'md' (40px), 'lg' (48px)  
 *   showText - whether to show "Care Link AI" text beside the icon
 *   textClassName - custom className for the text span
 */
const Logo = ({ size = 'md', showText = true, textClassName = '' }) => {
    const dimensions = {
        sm: { box: 32, icon: 20 },
        md: { box: 40, icon: 24 },
        lg: { box: 48, icon: 30 },
    };

    const d = dimensions[size] || dimensions.md;

    return (
        <div className="flex items-center gap-2.5">
            <div
                className="relative flex items-center justify-center rounded-xl shadow-md overflow-hidden flex-shrink-0"
                style={{
                    width: d.box,
                    height: d.box,
                    background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                }}
            >
                {/* Heart + pulse SVG */}
                <svg
                    width={d.icon}
                    height={d.icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Heart shape */}
                    <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="rgba(255,255,255,0.25)"
                    />
                    {/* Pulse/heartbeat line across the heart */}
                    <polyline
                        points="2,13 7,13 9,9 11,17 13,11 15,13 22,13"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Small link/chain circles at the bottom */}
                    <circle cx="10" cy="19" r="1.2" fill="rgba(255,255,255,0.6)" />
                    <circle cx="14" cy="19" r="1.2" fill="rgba(255,255,255,0.6)" />
                    <line
                        x1="11.2"
                        y1="19"
                        x2="12.8"
                        y2="19"
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth="1"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            {showText && (
                <span className={`font-bold tracking-tight ${textClassName}`}>
                    Care Link AI
                </span>
            )}
        </div>
    );
};

export default Logo;
