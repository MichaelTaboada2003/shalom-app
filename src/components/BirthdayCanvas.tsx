'use client';

import React, { useRef, forwardRef, useImperativeHandle } from 'react';

interface BirthdayCanvasProps {
    photo: string | null;
    title: string;
    message: string;
    logoSrc: string;
    template: string;
    onPhotoClick: () => void;
    onTitleChange: (value: string) => void;
    onMessageChange: (value: string) => void;
}

export interface BirthdayCanvasRef {
    getCanvasElement: () => HTMLDivElement | null;
}

// Componente reutilizable para foto
const PhotoFrame = ({
    photo,
    onPhotoClick,
    className = ''
}: {
    photo: string | null;
    onPhotoClick: () => void;
    className?: string;
}) => (
    <div className={`photo-frame-wrapper ${className}`} onClick={onPhotoClick}>
        {photo ? (
            <>
                <img src={photo} alt="Foto" />
                <div className="photo-overlay"><span>📷</span></div>
            </>
        ) : (
            <div className="photo-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                <span>Subir foto</span>
            </div>
        )}
    </div>
);

export const BirthdayCanvas = forwardRef<BirthdayCanvasRef, BirthdayCanvasProps>(
    ({
        photo,
        title,
        message,
        logoSrc,
        template,
        onPhotoClick,
        onTitleChange,
        onMessageChange,
    }, ref) => {
        const canvasRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            getCanvasElement: () => canvasRef.current,
        }));

        // Template: Classic - Estilo vintage refinado con marco ornamental
        if (template === 'classic') {
            return (
                <div className="birthday-canvas template-classic" ref={canvasRef}>
                    {/* Decorative corners */}
                    <div className="classic-corner corner-tl">❦</div>
                    <div className="classic-corner corner-tr">❦</div>
                    <div className="classic-corner corner-bl">❦</div>
                    <div className="classic-corner corner-br">❦</div>

                    {/* Inner frame */}
                    <div className="classic-frame">
                        {/* Header with logo */}
                        <div className="classic-header">
                            <div className="classic-logo">
                                <img src={logoSrc} alt="Logo" />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="classic-title-area">
                            <div className="classic-ornament">✿ ✿ ✿</div>
                            <textarea
                                className="title-text"
                                value={title}
                                onChange={(e) => onTitleChange(e.target.value)}
                                placeholder="Feliz cumpleaños"
                                rows={2}
                            />
                        </div>

                        {/* Photo - Polaroid style */}
                        <div className="classic-photo-area">
                            <div className="polaroid-frame" onClick={onPhotoClick}>
                                <PhotoFrame photo={photo} onPhotoClick={() => { }} className="polaroid-photo" />
                                <div className="polaroid-caption">Con cariño</div>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="classic-message-area">
                            <textarea
                                className="message-text"
                                value={message}
                                onChange={(e) => onMessageChange(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                rows={3}
                            />
                        </div>

                        <div className="classic-ornament">✿ ✿ ✿</div>
                    </div>
                </div>
            );
        }

        // Template: Modern - Diseño romántico con estética de rosas
        if (template === 'modern') {
            return (
                <div className="birthday-canvas template-modern" ref={canvasRef}>
                    {/* Background flowers image */}
                    <div className="roses-bg">
                        <img src="/flores.jpg" alt="" />
                    </div>

                    {/* Decorative corners */}
                    <div className="roses-corner corner-tl">❀</div>
                    <div className="roses-corner corner-tr">❀</div>
                    <div className="roses-corner corner-bl">❀</div>
                    <div className="roses-corner corner-br">❀</div>

                    {/* Content frame */}
                    <div className="roses-frame">
                        {/* Logo */}
                        <div className="roses-logo">
                            <img src={logoSrc} alt="Logo" />
                        </div>

                        {/* Divider */}
                        <div className="roses-divider">✿ ❀ ✿</div>

                        {/* Title */}
                        <div className="roses-title-area">
                            <textarea
                                className="title-text"
                                value={title}
                                onChange={(e) => onTitleChange(e.target.value)}
                                placeholder="Feliz cumpleaños"
                                rows={2}
                            />
                        </div>

                        {/* Photo */}
                        <div className="roses-photo-area" onClick={onPhotoClick}>
                            <div className="roses-photo-frame">
                                <PhotoFrame photo={photo} onPhotoClick={() => { }} className="roses-photo" />
                            </div>
                        </div>

                        {/* Message */}
                        <div className="roses-message-area">
                            <textarea
                                className="message-text"
                                value={message}
                                onChange={(e) => onMessageChange(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                rows={3}
                            />
                        </div>

                        {/* Bottom divider */}
                        <div className="roses-divider">✿ ❀ ✿</div>
                    </div>
                </div>
            );
        }

        // Template: Elegant - Diseño sofisticado con detalles florales
        if (template === 'elegant') {
            return (
                <div className="birthday-canvas template-elegant" ref={canvasRef}>
                    {/* Decorative corners */}
                    <div className="elegant-corner corner-tl">✿</div>
                    <div className="elegant-corner corner-tr">✿</div>
                    <div className="elegant-corner corner-bl">✿</div>
                    <div className="elegant-corner corner-br">✿</div>

                    {/* Border frame */}
                    <div className="elegant-frame">
                        {/* Title */}
                        <div className="elegant-title-area">
                            <div className="elegant-divider">— ✦ —</div>
                            <textarea
                                className="title-text"
                                value={title}
                                onChange={(e) => onTitleChange(e.target.value)}
                                placeholder="Feliz cumpleaños"
                                rows={2}
                            />
                            <div className="elegant-divider">— ✦ —</div>
                        </div>

                        {/* Photo - Elegant oval frame */}
                        <div className="elegant-photo-area" onClick={onPhotoClick}>
                            <PhotoFrame photo={photo} onPhotoClick={() => { }} className="elegant-photo" />
                        </div>

                        {/* Message */}
                        <div className="elegant-message-area">
                            <textarea
                                className="message-text"
                                value={message}
                                onChange={(e) => onMessageChange(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                rows={3}
                            />
                        </div>

                        {/* Logo at bottom */}
                        <div className="elegant-logo">
                            <img src={logoSrc} alt="Logo" />
                        </div>
                    </div>
                </div>
            );
        }

        // Fallback to classic
        return (
            <div className="birthday-canvas template-classic" ref={canvasRef}>
                <div className="classic-frame">
                    <textarea
                        className="title-text"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="Feliz cumpleaños"
                        rows={2}
                    />
                    <PhotoFrame photo={photo} onPhotoClick={onPhotoClick} />
                    <textarea
                        className="message-text"
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        rows={3}
                    />
                </div>
            </div>
        );
    }
);

BirthdayCanvas.displayName = 'BirthdayCanvas';

export default BirthdayCanvas;
