# Page Templates

## Standard Marketing Page
```tsx
import { Navigation, Footer } from '@/components/ui/navigation';

export default function PageName() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="page-content">
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice text-center">
            <h1 className="headline-truth mb-6">Title</h1>
            <p className="body-truth mx-auto mb-12">Description</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
```

## Dashboard/Admin Page
```tsx
export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="section-padding border-b-2 border-black bg-white">
        <div className="container-justice">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-700 text-green-800 font-bold text-xs mb-4">
            <Leaf className="w-3 h-3" />
            DASHBOARD
          </div>
          <h1 className="text-4xl font-black text-black mb-2">Title</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stats */}
          </div>
        </div>
      </section>
    </div>
  );
}
```

## Intelligence/Data Page (Dark)
```tsx
export default function DataPage() {
  return (
    <main className="bg-[#0a0f16] text-white min-h-screen">
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div className="h-full bg-gradient-to-r from-[#27ae60] to-[#e57a28]" />
      </div>
      <section className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          {/* Content */}
        </div>
      </section>
    </main>
  );
}
```
