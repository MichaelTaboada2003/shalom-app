'use client';

import React, { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import BirthdayCanvas, { BirthdayCanvasRef } from '@/components/BirthdayCanvas';
import FlyerCanvas from '@/components/FlyerCanvas';

// Definición de templates disponibles para Tarjetas
export interface Template {
  id: string;
  name: string;
  preview: string;
}

const CARD_TEMPLATES: Template[] = [
  { id: 'classic', name: 'Vintage', preview: '🎞️' },
  { id: 'modern', name: 'Floral', preview: '🌹' },
  { id: 'elegant', name: 'Elegante', preview: '💎' },
];

// Definición de templates disponibles para Flyers
const FLYER_TEMPLATES: Template[] = [
  { id: 'divine', name: 'Divino', preview: '✝️' },
  { id: 'hope', name: 'Esperanza', preview: '🕊️' },
  { id: 'fire', name: 'Fuego', preview: '🔥' },
];

export default function Home() {
  // Estado global de la app
  const [activeTab, setActiveTab] = useState<'cards' | 'flyers'>('cards');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showLogo, setShowLogo] = useState(true);

  // Estados para Tarjetas
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState('Feliz\ncumpleaños');
  const [message, setMessage] = useState(
    'Que Dios te acompañe y te bendiga, desde Shalom te deseamos un feliz cumpleaños 🎉'
  );
  const [selectedCardTemplate, setSelectedCardTemplate] = useState<string>('classic');

  // Estados para Flyers
  const [flyerQuote, setFlyerQuote] = useState('"Donde hay dos o tres reunidos en mi nombre, allí estoy yo en medio de ellos"\n(Mateo 18,20)');
  const [flyerDate, setFlyerDate] = useState('SÁBADO 24');
  const [flyerTime, setFlyerTime] = useState('07:30 p.m.');
  const [flyerLocation, setFlyerLocation] = useState('Lugar: Parroquia\nNuestra Sra de Lourdes');
  const [selectedFlyerTemplate, setSelectedFlyerTemplate] = useState<string>('divine');

  // Refs
  const cardCanvasRef = useRef<BirthdayCanvasRef>(null);
  const flyerCanvasRef = useRef<any>(null); // TODO: Type properly
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

  // Helper para navegar templates
  const navigateTemplate = (direction: 'next' | 'prev', type: 'cards' | 'flyers') => {
    const templates = type === 'cards' ? CARD_TEMPLATES : FLYER_TEMPLATES;
    const currentId = type === 'cards' ? selectedCardTemplate : selectedFlyerTemplate;
    const setTemplate = type === 'cards' ? setSelectedCardTemplate : setSelectedFlyerTemplate;

    const currentIndex = templates.findIndex(t => t.id === currentId);
    let newIndex;

    if (direction === 'next') {
      newIndex = currentIndex === templates.length - 1 ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex === 0 ? templates.length - 1 : currentIndex - 1;
    }

    setTemplate(templates[newIndex].id);
  };

  const handleDownload = useCallback(async () => {
    // Determinar qué canvas descargar según la pestaña activa
    const canvasRef = activeTab === 'cards' ? cardCanvasRef : flyerCanvasRef;
    const canvasElement = canvasRef.current?.getCanvasElement();

    if (!canvasElement) return;

    setIsDownloading(true);

    try {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(canvasElement, {
        scale: 4, // Alta resolución
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
        onclone: (_clonedDoc, element) => {
          element.style.borderRadius = '0';

          const allImages = element.querySelectorAll('img');
          allImages.forEach((img) => {
            img.style.imageRendering = 'high-quality';
          });

          // Solo ocultar overlays si estamos en modo tarjetas
          if (activeTab === 'cards') {
            const overlays = element.querySelectorAll('.photo-overlay');
            overlays.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          }

          // Ocultar handles de Rnd en modo flyers
          if (activeTab === 'flyers') {
            // Ocultar los manejadores de redimensionamiento (divs que no son contenido principal)
            const handles = element.querySelectorAll('.flyer-rnd > div:not(.flyer-quote-area):not(.flyer-datetime-block):not(.flyer-location-area):not(.flyer-header):not(.flyer-logo)');
            handles.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });

            // Ocultar icono de arrastre explícito
            const dragIcons = element.querySelectorAll('.drag-handle-icon');
            dragIcons.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          }

          // Convertir inputs/textareas a divs para rendering correcto
          const replaceWithDiv = (
            input: HTMLInputElement | HTMLTextAreaElement | null,
            styles: Partial<CSSStyleDeclaration> = {}
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

            // Copiar posición si es absolute
            if (computed.position === 'absolute') {
              div.style.position = 'absolute';
              div.style.top = computed.top;
              div.style.left = computed.left;
              div.style.right = computed.right;
              div.style.bottom = computed.bottom;
              div.style.transform = computed.transform;
            }

            input.parentNode.replaceChild(div, input);
          };

          if (activeTab === 'cards') {
            replaceWithDiv(element.querySelector('.title-text') as HTMLTextAreaElement, { fontFamily: "'Dancing Script', cursive" });
            replaceWithDiv(element.querySelector('.message-text') as HTMLTextAreaElement, { fontFamily: "'Dancing Script', cursive" });
          } else {
            // Reemplazar inputs del flyer
            const inputs = element.querySelectorAll('input, textarea');
            inputs.forEach(input => replaceWithDiv(input as HTMLInputElement));
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const prefix = activeTab === 'cards' ? 'feliz-cumpleaños' : 'flyer-evento';
      link.download = `${prefix}-shalom-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al generar la imagen. Por favor, intenta de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  }, [activeTab]);

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
        <h1>✨ Generador de Templates</h1>
        <p>Crea tarjetas de cumpleaños y flyers para tus eventos</p>
      </header>

      {/* Tool Navigation */}
      <div className="tool-selector">
        <button
          className={`tool-btn ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          🎂 Tarjetas
        </button>
        <button
          className={`tool-btn ${activeTab === 'flyers' ? 'active' : ''}`}
          onClick={() => setActiveTab('flyers')}
        >
          📢 Flyers
        </button>
      </div>

      {/* Editor Container */}
      <div className="editor-container">

        {/* VIEW: CARDS */}
        {activeTab === 'cards' && (
          <>
            {/* Template Navigation */}
            <div className="template-nav">
              <button
                className="nav-arrow nav-prev"
                onClick={() => navigateTemplate('prev', 'cards')}
                type="button"
                aria-label="Plantilla anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <div className="template-indicator">
                <span className="template-current-name">
                  {CARD_TEMPLATES.find(t => t.id === selectedCardTemplate)?.preview}{' '}
                  {CARD_TEMPLATES.find(t => t.id === selectedCardTemplate)?.name}
                </span>
                <div className="template-dots">
                  {CARD_TEMPLATES.map((template) => (
                    <span
                      key={template.id}
                      className={`dot ${selectedCardTemplate === template.id ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <button
                className="nav-arrow nav-next"
                onClick={() => navigateTemplate('next', 'cards')}
                type="button"
                aria-label="Siguiente plantilla"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            <div className="canvas-wrapper">
              <BirthdayCanvas
                ref={cardCanvasRef}
                photo={photo}
                title={title}
                message={message}
                logoSrc="/shalom-logo.png"
                showLogo={showLogo}
                template={selectedCardTemplate}
                onPhotoClick={handlePhotoClick}
                onTitleChange={setTitle}
                onMessageChange={setMessage}
              />
            </div>
          </>
        )}

        {/* VIEW: FLYERS */}
        {activeTab === 'flyers' && (
          <>
            {/* Template Navigation for Flyers */}
            <div className="template-nav">
              <button
                className="nav-arrow nav-prev"
                onClick={() => navigateTemplate('prev', 'flyers')}
                type="button"
                aria-label="Plantilla anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <div className="template-indicator">
                <span className="template-current-name">
                  {FLYER_TEMPLATES.find(t => t.id === selectedFlyerTemplate)?.preview}{' '}
                  {FLYER_TEMPLATES.find(t => t.id === selectedFlyerTemplate)?.name}
                </span>
                <div className="template-dots">
                  {FLYER_TEMPLATES.map((template) => (
                    <span
                      key={template.id}
                      className={`dot ${selectedFlyerTemplate === template.id ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <button
                className="nav-arrow nav-next"
                onClick={() => navigateTemplate('next', 'flyers')}
                type="button"
                aria-label="Siguiente plantilla"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            <div className="canvas-wrapper">
              <FlyerCanvas
                ref={flyerCanvasRef}
                bibleQuote={flyerQuote}
                onBibleQuoteChange={setFlyerQuote}
                date={flyerDate}
                onDateChange={setFlyerDate}
                time={flyerTime}
                onTimeChange={setFlyerTime}
                location={flyerLocation}
                onLocationChange={setFlyerLocation}
                logoSrc="/shalom-logo.png"
                showLogo={showLogo}
                template={selectedFlyerTemplate}
              />
            </div>
          </>
        )}

        {/* Hidden file input (Shared) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden-input"
        />

        {/* Floating Toolbar (Shared) */}
        <div className="floating-toolbar">
          <button
            className="toolbar-btn secondary"
            onClick={() => setShowLogo(!showLogo)}
            type="button"
          >
            {showLogo ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
                Ocultar Logo
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ver Logo
              </>
            )}
          </button>

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
          💡 Tip: Haz clic directamente en los textos para editarlos
        </p>
      </div>
    </main>
  );
}
