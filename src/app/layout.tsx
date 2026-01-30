import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shalom - Generador de Tarjetas",
  description: "Crea tarjetas de cumpleaños personalizadas para la comunidad Shalom",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
