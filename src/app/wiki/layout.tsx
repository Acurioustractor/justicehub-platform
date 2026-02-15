import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'JusticeHub Wiki - Strategic Planning & Documentation',
  description: 'Comprehensive strategic planning, budget frameworks, and platform documentation for JusticeHub',
};

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen bg-gray-50`}>
      {children}
    </div>
  );
}
