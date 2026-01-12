'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Trash2, Image as ImageIcon, Check } from 'lucide-react';
import { copyNapkinPrompt } from '@/lib/napkin-visualizer';

interface Story {
  id: string;
  title: string;
  status: string;
  created_at: string;
  content_type?: 'article' | 'blog';
  excerpt?: string;
  category?: string;
  public_profiles?: {
    full_name: string;
    slug: string;
  };
}

export function StoriesTable({ initialStories }: { initialStories: Story[] }) {
  const router = useRouter();
  const [stories, setStories] = useState(initialStories);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const handleCopyPrompt = async (story: Story) => {
    setCopyingId(story.id);
    const success = await copyNapkinPrompt(story);
    if (success) {
      setTimeout(() => setCopyingId(null), 2000);
    } else {
      setCopyingId(null);
    }
  };

  const handleDelete = async (story: Story) => {
    const storyType = story.content_type === 'blog' ? 'blog post' : 'article';
    const confirmed = window.confirm(
      `Are you sure you want to delete "${story.title}"?\n\nType: ${storyType}\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(story.id);

    try {
      const supabase = createClient();

      // Delete from the correct table based on content_type
      const tableName = story.content_type === 'blog' ? 'blog_posts' : 'articles';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', story.id);

      if (error) throw error;

      // Remove from local state
      setStories(stories.filter(s => s.id !== story.id));

      // Show success message
      alert(`${storyType.charAt(0).toUpperCase() + storyType.slice(1)} deleted successfully!`);

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (stories.length === 0) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
        <p className="text-xl font-bold text-gray-600 mb-4">No stories yet</p>
        <Link
          href="/admin/stories/new"
          className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
        >
          Create Your First Story
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-black bg-gray-50">
            <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Title</th>
            <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Type</th>
            <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Author</th>
            <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Status</th>
            <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Created</th>
            <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stories.map((story) => (
            <tr key={story.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{story.title}</td>
              <td className="px-6 py-4">
                <span className={`text-xs font-bold px-2 py-1 border ${story.content_type === 'blog'
                    ? 'bg-purple-50 text-purple-600 border-purple-600'
                    : 'bg-blue-50 text-blue-600 border-blue-600'
                  }`}>
                  {story.content_type === 'blog' ? 'BLOG' : 'ARTICLE'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {story.public_profiles?.full_name || 'Unknown'}
              </td>
              <td className="px-6 py-4">
                <span className={`text-xs font-bold px-2 py-1 border ${story.status === 'published'
                    ? 'bg-green-50 text-green-600 border-green-600'
                    : 'bg-yellow-50 text-yellow-600 border-yellow-600'
                  }`}>
                  {story.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(story.created_at).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleCopyPrompt(story)}
                    className={`flex items-center gap-1 text-sm font-bold transition-colors ${copyingId === story.id ? 'text-green-600' : 'text-ochre-600 hover:text-ochre-800'
                      }`}
                    title="Copy visual prompt for Napkin AI"
                  >
                    {copyingId === story.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        Visualize
                      </>
                    )}
                  </button>
                  <Link
                    href={`/admin/stories/${story.id}`}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(story)}
                    disabled={deletingId === story.id}
                    className="text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Delete story"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === story.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
