import type { MDXComponents } from 'mdx/types'
import { Callout } from '@/components/wiki/Callout'
import { VideoEmbed } from '@/components/wiki/VideoEmbed'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/wiki/Tabs'
import { ImageGallery } from '@/components/wiki/ImageGallery'
import { StatCard } from '@/components/wiki/StatCard'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Custom wiki components
    Callout,
    VideoEmbed,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    ImageGallery,
    StatCard,

    // Enhanced HTML elements
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold text-gray-900 mb-6 pb-4 border-b-4 border-blue-600 mt-8">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold text-gray-900 mt-16 mb-6 pb-3 border-b-2 border-gray-300">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl font-bold text-gray-900 mt-8 mb-3">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="text-gray-700 leading-relaxed mb-5 text-base">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 space-y-2 mb-6 text-gray-700">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-6 pr-4 py-4 my-6 text-gray-700 italic">
        {children}
      </blockquote>
    ),
    code: ({ children, className }: any) => {
      const isInline = !className
      if (isInline) {
        return (
          <code className="bg-gray-100 text-blue-700 px-2 py-1 rounded text-sm font-mono font-semibold">
            {children}
          </code>
        )
      }
      return (
        <code className={`block bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm font-mono my-6 leading-relaxed ${className}`}>
          {children}
        </code>
      )
    },
    pre: ({ children }) => (
      <pre className="my-6">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-8">
        <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-100">
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 border-b-2 border-gray-300">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200">
        {children}
      </td>
    ),
    a: ({ children, href }: any) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
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
      <em className="italic text-gray-700">
        {children}
      </em>
    ),
    hr: () => (
      <hr className="my-8 border-t-2 border-gray-200" />
    ),

    ...components,
  }
}
