import { Navigation, Footer } from '@/components/ui/navigation';

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="pt-40">
        {children}
      </main>

      <Footer />
    </div>
  );
}
