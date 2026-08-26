import type { Metadata } from 'next';
import './globals.css';
import { RestaurantProvider } from '@/context/RestaurantContext';

export const metadata: Metadata = {
  title: 'ÉTERRA — Alta Cocina Marina & Gastronomía de Vanguardia',
  description: 'Experiencia gastronómica sensorial, pesca del día, brasas de autor y sistema operativo de restaurante en tiempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="min-h-screen antialiased selection:bg-amber-500 selection:text-black">
        <RestaurantProvider>
          {children}
        </RestaurantProvider>
      </body>
    </html>
  );
}
