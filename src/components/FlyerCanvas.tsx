'use client';

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Rnd } from 'react-rnd';

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

        // Layout configurations for each template
        const layoutConfig: Record<string, { quote: any; date: any; location: any; header: any; logo: any }> = {
            divine: {
                quote: { x: 30, y: 240, width: 233, height: 147 },
                date: { x: 40, y: 440, width: 151, height: 68 },
                location: { x: 40, y: 530, width: 252, height: 36 },
                header: { x: 60, y: 30, width: 380, height: 200 }, // Reduced width to allow lateral movement
                logo: { x: 395, y: 35, width: 70, height: 70 },
            },
            hope: {
                quote: { x: 122, y: 180, width: 256, height: 151 },
                date: { x: 159, y: 375, width: 182, height: 72 },
                location: { x: 137, y: 545, width: 226, height: 36 },
                header: { x: 60, y: 50, width: 380, height: 200 },
                logo: { x: 395, y: 35, width: 70, height: 70 },
            },
            fire: {
                quote: { x: 25, y: 220, width: 297, height: 139 },
                date: { x: 270, y: 495, width: 204, height: 73 },
                location: { x: 30, y: 530, width: 226, height: 36 },
                header: { x: 60, y: 45, width: 380, height: 200 },
                logo: { x: 340, y: 270, width: 120, height: 120 },
            },
        };

        const activeConfig = layoutConfig[template] || layoutConfig.divine;

        return (
            <div className={`flyer-canvas template-${template}`} ref={canvasRef}>
                {/* Background Shapes */}
                <div className="flyer-circle-bg"></div>
                {/* Shapes for Fire Template */}
                <div className="flyer-fire-bg-1"></div>
                <div className="flyer-fire-bg-2"></div>
                {/* Shape for Hope Template */}
                <div className="flyer-wave-bg"></div>

                {/* Header Title (Draggable, No Resize) */}
                <Rnd
                    key={`header-${template}`}
                    default={activeConfig.header}
                    className="flyer-rnd flyer-header-rnd"
                    enableResizing={false}
                    enableUserSelectHack={false}
                >
                    <div className="flyer-header flyer-element" style={{ width: '100%', height: '100%', position: 'static', padding: '10px', textAlign: 'center' }}>
                        <div className="flyer-title-main">ENCUENTRO</div>
                        <div className="flyer-title-sub">JUVENIL</div>
                    </div>
                </Rnd>

                {/* Logo (Draggable, No Resize) */}
                {showLogo && (
                    <Rnd
                        key={`logo-${template}`}
                        default={activeConfig.logo}
                        className="flyer-rnd flyer-logo-rnd"
                        enableResizing={false}
                        enableUserSelectHack={false}
                    >
                        <div className="flyer-logo flyer-element" style={{ position: 'static', transform: 'none', top: 'auto', right: 'auto', width: '100%', height: '100%' }}>
                            <img
                                src={logoSrc}
                                alt="Logo"
                                draggable={false}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                            />
                        </div>
                    </Rnd>
                )}

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

                {/* Content Grid (Draggable Layers) */}
                {/* Bible Quote Area */}
                <Rnd
                    key={`quote-${template}`}
                    default={activeConfig.quote}
                    className="flyer-rnd flyer-quote-area-rnd"
                    enableUserSelectHack={false}
                    dragHandleClassName="drag-handle-icon"
                >
                    <div className="flyer-quote-area flyer-element" style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <textarea
                            className="flyer-text-input quote-text"
                            style={{ width: '100%', height: '100%', resize: 'none' }}
                            value={bibleQuote}
                            onChange={(e) => onBibleQuoteChange(e.target.value)}
                            placeholder='"Donde hay dos o tres reunidos en mi nombre, allí estoy yo en medio de ellos" (Mateo 18,20)'
                        />
                        {/* Drag Handle Icon */}
                        <div
                            className="drag-handle-icon"
                            style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                width: '24px',
                                height: '24px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                cursor: 'move',
                                zIndex: 10,
                                color: '#333',
                            }}
                            title="Drag to move"
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"></path>
                            </svg>
                        </div>
                    </div>
                </Rnd>

                {/* Date and Time Block */}
                <Rnd
                    key={`date-${template}`}
                    default={activeConfig.date}
                    className="flyer-rnd flyer-date-rnd"
                    enableUserSelectHack={false}
                >
                    <div className="flyer-datetime-block flyer-element" style={{ width: '100%', height: '100%' }}>
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
                </Rnd>

                {/* Location */}
                <Rnd
                    key={`loc-${template}`}
                    default={activeConfig.location}
                    className="flyer-rnd flyer-location-rnd"
                    enableUserSelectHack={false}
                >
                    <div className="flyer-location-area flyer-element" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
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
                            style={{ flex: 1, height: '100%', resize: 'none' }}
                        />
                    </div>
                </Rnd>
            </div>
        );
    }
);

FlyerCanvas.displayName = 'FlyerCanvas';

export default FlyerCanvas;
