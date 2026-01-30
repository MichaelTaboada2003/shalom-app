'use client';

import React, { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import BirthdayCanvas, { BirthdayCanvasRef } from '@/components/BirthdayCanvas';

// Definición de templates disponibles
export interface Template {
  id: string;
  name: string;
  preview: string;
}

const TEMPLATES: Template[] = [
  { id: 'classic', name: 'Vintage', preview: '🎞️' },
  { id: 'modern', name: 'Floral', preview: '🌹' },
  { id: 'elegant', name: 'Elegante', preview: '💎' },
];

export default function Home() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState('Feliz\ncumpleaños');
  const [message, setMessage] = useState(
    'Que Dios te acompañe y te bendiga, desde Shalom te deseamos un feliz cumpleaños 🎉'
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic');
  const [isDownloading, setIsDownloading] = useState(false);

  const canvasRef = useRef<BirthdayCanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePhotoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handlePhotoUpload(file);
      }
    },
    [handlePhotoUpload]
  );

  const handleDownload = useCallback(async () => {
    const canvasElement = canvasRef.current?.getCanvasElement();
    if (!canvasElement) return;

    setIsDownloading(true);

    try {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(canvasElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        onclone: (_clonedDoc, element) => {
          element.style.borderRadius = '0';

          const overlays = element.querySelectorAll('.photo-overlay');
          overlays.forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });

          const replaceWithDiv = (
            input: HTMLInputElement | HTMLTextAreaElement | null,
            styles: Partial<CSSStyleDeclaration>
          ) => {
            if (!input || !input.parentNode) return;

            const div = document.createElement('div');
            div.textContent = input.value;

            const computed = window.getComputedStyle(input);
            div.style.fontFamily = styles.fontFamily || computed.fontFamily;
            div.style.fontSize = computed.fontSize;
            div.style.fontWeight = computed.fontWeight;
            div.style.color = styles.color || computed.color;
            div.style.textShadow = computed.textShadow;
            div.style.lineHeight = computed.lineHeight;
            div.style.padding = computed.padding;
            div.style.margin = computed.margin;
            div.style.textAlign = computed.textAlign;
            div.style.width = '100%';
            div.style.boxSizing = 'border-box';
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordWrap = 'break-word';
            div.className = input.className;

            input.parentNode.replaceChild(div, input);
          };

          replaceWithDiv(
            element.querySelector('.title-text') as HTMLTextAreaElement,
            { fontFamily: "'Dancing Script', cursive" }
          );

          replaceWithDiv(
            element.querySelector('.message-text') as HTMLTextAreaElement,
            { fontFamily: "'Dancing Script', cursive" }
          );
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);

      const link = document.createElement('a');
      link.download = `feliz-cumpleaños-shalom-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al descargar la imagen:', error);
      alert('Error al generar la imagen. Por favor, intenta de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return (
    <main className="app-container">
      {/* Ambient Background */}
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      {/* Header */}
      <header className="app-header">
        <h1>✨ Tarjetas de Cumpleaños</h1>
        <p>Haz clic en cualquier texto para editarlo</p>
      </header>

      {/* Template Navigation */}
      <div className="template-nav">
        <button
          className="nav-arrow nav-prev"
          onClick={() => {
            const currentIndex = TEMPLATES.findIndex(t => t.id === selectedTemplate);
            const prevIndex = currentIndex === 0 ? TEMPLATES.length - 1 : currentIndex - 1;
            setSelectedTemplate(TEMPLATES[prevIndex].id);
          }}
          type="button"
          aria-label="Plantilla anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="template-indicator">
          <span className="template-current-name">
            {TEMPLATES.find(t => t.id === selectedTemplate)?.preview}{' '}
            {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
          </span>
          <div className="template-dots">
            {TEMPLATES.map((template) => (
              <span
                key={template.id}
                className={`dot ${selectedTemplate === template.id ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        <button
          className="nav-arrow nav-next"
          onClick={() => {
            const currentIndex = TEMPLATES.findIndex(t => t.id === selectedTemplate);
            const nextIndex = currentIndex === TEMPLATES.length - 1 ? 0 : currentIndex + 1;
            setSelectedTemplate(TEMPLATES[nextIndex].id);
          }}
          type="button"
          aria-label="Siguiente plantilla"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Editor Container */}
      <div className="editor-container">
        {/* Canvas */}
        <div className="canvas-wrapper">
          <BirthdayCanvas
            ref={canvasRef}
            photo={photo}
            title={title}
            message={message}
            logoSrc="/shalom-logo.png"
            template={selectedTemplate}
            onPhotoClick={handlePhotoClick}
            onTitleChange={setTitle}
            onMessageChange={setMessage}
          />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden-input"
        />

        {/* Floating Toolbar */}
        <div className="floating-toolbar">
          <button
            className="toolbar-btn primary"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="animate-spin">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Descargar
              </>
            )}
          </button>
        </div>

        <p className="hint-text">
          💡 Tip: Haz clic directamente en los textos de la tarjeta para editarlos
        </p>
      </div>
    </main>
  );
}
