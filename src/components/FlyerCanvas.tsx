'use client';

import React, { useRef, forwardRef, useImperativeHandle } from 'react';

interface FlyerCanvasProps {
    bibleQuote: string;
    onBibleQuoteChange: (value: string) => void;
    date: string;
    onDateChange: (value: string) => void;
    time: string;
    onTimeChange: (value: string) => void;
    location: string;
    onLocationChange: (value: string) => void;
    logoSrc: string;
    showLogo?: boolean;
    template?: string;
}

export interface FlyerCanvasRef {
    getCanvasElement: () => HTMLDivElement | null;
}

export const FlyerCanvas = forwardRef<FlyerCanvasRef, FlyerCanvasProps>(
    ({
        bibleQuote,
        onBibleQuoteChange,
        date,
        onDateChange,
        time,
        onTimeChange,
        location,
        onLocationChange,
        logoSrc,
        showLogo = true,
        template = 'divine',
    }, ref) => {
        const canvasRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            getCanvasElement: () => canvasRef.current,
        }));

        return (
            <div className={`flyer-canvas template-${template}`} ref={canvasRef}>
                {/* Background Shapes */}
                <div className="flyer-circle-bg"></div>
                {/* Shapes for Fire Template */}
                <div className="flyer-fire-bg-1"></div>
                <div className="flyer-fire-bg-2"></div>
                {/* Shape for Hope Template */}
                <div className="flyer-wave-bg"></div>

                {/* Header Title (Static) */}
                <div className="flyer-header">
                    <div className="flyer-title-main">ENCUENTRO</div>
                    <div className="flyer-title-sub">JUVENIL</div>
                </div>

                {/* Logo */}
                {showLogo && (
                    <div className="flyer-logo">
                        <img src={logoSrc} alt="Logo" />
                    </div>
                )}

                {/* Content Grid */}
                <div className="flyer-content">
                    {/* Bible Quote Area */}
                    <div className="flyer-quote-area">
                        <textarea
                            className="flyer-text-input quote-text"
                            value={bibleQuote}
                            onChange={(e) => onBibleQuoteChange(e.target.value)}
                            placeholder='"Donde hay dos o tres reunidos en mi nombre, allí estoy yo en medio de ellos" (Mateo 18,20)'
                            rows={5}
                        />
                    </div>

                    {/* Date and Time Block */}
                    <div className="flyer-datetime-block">
                        <input
                            type="text"
                            className="flyer-text-input date-text"
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            placeholder="SÁBADO 24"
                        />
                        <input
                            type="text"
                            className="flyer-text-input time-text"
                            value={time}
                            onChange={(e) => onTimeChange(e.target.value)}
                            placeholder="07:30 p.m."
                        />
                    </div>

                    {/* Location */}
                    <div className="flyer-location-area">
                        <div className="location-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 21l18 0" />
                                <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
                                <path d="M10 5l4 0" />
                                <path d="M12 3l0 5" />
                                <path d="M6 21v-7m-2 2l8 -8l8 8m-2 -2v7" />
                            </svg>
                        </div>
                        <textarea
                            className="flyer-text-input location-text"
                            value={location}
                            onChange={(e) => onLocationChange(e.target.value)}
                            placeholder="Lugar: Parroquia Nuestra Sra de Lourdes"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Decorative Cross (Only for Divine) */}
                <div className="flyer-cross">
                    <svg
                        viewBox="0 0 200 200"
                        xmlns="http://www.w3.org/2000/svg"
                        className="cross-svg"
                    >

                        {/* Cross Shape - Thinner Latin Style */}
                        <path
                            d="M92 15 H108 V65 H155 V81 H108 V195 H92 V81 H45 V65 H92 V15 Z"
                            fill="#C8A663"
                            stroke="none"
                            className="cross-shape"
                        />
                    </svg>
                </div>
            </div>
        );
    }
);

FlyerCanvas.displayName = 'FlyerCanvas';

export default FlyerCanvas;
