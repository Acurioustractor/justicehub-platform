import { requireAdmin } from '@/lib/supabase/admin-lite';
import { NewSourceForm } from './NewSourceForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NewSourcePage() {
  await requireAdmin('/admin/justice-matrix/sources/new');
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/admin/justice-matrix/sources"
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to source health
          </Link>
          <div className="w-px h-6 bg-gray-300" />
          <div>
            <h1 className="text-2xl font-black text-black">Add a source</h1>
            <p className="text-sm text-gray-600">Adds a row to justice_matrix_sources. The scanner picks it up on the next run.</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <NewSourceForm />
      </div>
    </div>
  );
}
