import { WikiSidebar } from '@/components/WikiSidebar';
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Map of slugs to actual file names
const SLUG_TO_FILE: Record<string, string> = {
  'strategic-overview': 'STRATEGIC_OVERVIEW.md',
  'executive-summary': 'EXECUTIVE_SUMMARY.md',
  'one-page-overview': 'ONE_PAGE_OVERVIEW.md',
  'justicehub-planning': 'JUSTICEHUB_PLANNING.md',
  'budget-summary': 'BUDGET_SUMMARY.md',
  'funding-pitch-templates': 'FUNDING_PITCH_TEMPLATES.md',
  'admin-user-guide': 'ADMIN_USER_GUIDE.md',
  'admin-quick-start': 'ADMIN_QUICK_START.md',
  'admin-routes-complete': 'ADMIN_ROUTES_COMPLETE.md',
  'admin-complete-flows': 'ADMIN_COMPLETE_FLOWS.md',
  'admin-flows-analysis': 'ADMIN_FLOWS_ANALYSIS.md',
  'centre-of-excellence-complete': 'CENTRE_OF_EXCELLENCE_COMPLETE.md',
  'empathy-ledger-full-integration': 'EMPATHY_LEDGER_FULL_INTEGRATION.md',
  'auto-linking-complete': 'AUTO_LINKING_COMPLETE.md',
  'blog-editor-complete': 'BLOG_EDITOR_COMPLETE.md',
  'programs-consolidation-complete': 'PROGRAMS_CONSOLIDATION_COMPLETE.md',
};

// Generate static params for all documentation pages
export async function generateStaticParams() {
  return Object.keys(SLUG_TO_FILE).map((slug) => ({
    slug,
  }));
}

async function getDocContent(slug: string): Promise<string | null> {
  const fileName = SLUG_TO_FILE[slug];
  if (!fileName) return null;

  const filePath = path.join(process.cwd(), 'public', 'docs', fileName);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Error reading file ${fileName}:`, error);
    return null;
  }
}

export default async function WikiDocPage({ params }: { params: { slug: string } }) {
  const content = await getDocContent(params.slug);

  if (!content) {
    notFound();
  }

  // Extract title from the first heading in the markdown
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Documentation';

  return (
    <div className="flex min-h-screen">
      <WikiSidebar />

      <main className="flex-1 overflow-y-auto bg-white">
        <article className="max-w-4xl mx-auto px-8 py-12">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-8">
            <a href="/wiki" className="hover:text-gray-700">Wiki</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{title}</span>
          </div>

          {/* Markdown Content */}
          <div className="prose prose-lg prose-blue max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-4xl font-bold text-gray-900 mb-6 pb-4 border-b-4 border-blue-600">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4 pb-2 border-b-2 border-gray-300">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-xl font-bold text-gray-900 mt-6 mb-2">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="ml-4">
                    {children}
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700">
                    {children}
                  </blockquote>
                ),
                code: ({ inline, children, ...props }: any) => {
                  if (inline) {
                    return (
                      <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4" {...props}>
                      {children}
                    </code>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full divide-y divide-gray-300 border-2 border-gray-300">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-300">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">
                    {children}
                  </td>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-blue-600 hover:text-blue-800 underline"
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-gray-900">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-800">
                    {children}
                  </em>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Back to Wiki */}
          <div className="mt-16 pt-8 border-t-2 border-gray-200">
            <a
              href="/wiki"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Wiki Home
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}
