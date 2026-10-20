import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tartan Tickets | Campus events',
  description: 'Find and save your spot at Carnegie Mellon campus events.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}