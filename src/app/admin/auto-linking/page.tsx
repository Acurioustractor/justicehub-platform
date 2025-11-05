import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Building2, BookOpen, ExternalLink } from 'lucide-react';

export default async function AutoLinkingDashboard() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/admin/auto-linking');
  }

  // Check admin role
  const { data: userData } = await supabase
    .from('users')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (userData?.user_role !== 'admin') {
    redirect('/');
  }

  // Fetch auto-linked organizations
  const { data: orgLinks } = await supabase
    .from('organizations_profiles')
    .select(`
      id,
      role,
      is_current,
      created_at,
      organizations:organization_id (
        id, name, slug
      ),
      public_profiles:public_profile_id (
        id, full_name, slug, photo_url,
        synced_from_empathy_ledger
      )
    `)
    .order('created_at', { ascending: false });

  // Fetch auto-linked blog posts
  const { data: postLinks } = await supabase
    .from('blog_posts_profiles')
    .select(`
      id,
      role,
      is_featured,
      created_at,
      blog_posts:blog_post_id (
        id, title, slug,
        synced_from_empathy_ledger
      ),
      public_profiles:public_profile_id (
        id, full_name, slug, photo_url
      )
    `)
    .order('created_at', { ascending: false });

  // Filter for auto-linked items
  const autoLinkedOrgs = orgLinks?.filter(link =>
    link.public_profiles?.synced_from_empathy_ledger
  ) || [];

  const autoLinkedPosts = postLinks?.filter(link =>
    link.blog_posts?.synced_from_empathy_ledger
  ) || [];

  const totalAutoLinks = autoLinkedOrgs.length + autoLinkedPosts.length;

  return (
    <div className="min-h-screen bg-white page-content">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 py-12 border-b-2 border-black">
        <div className="container-justice">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-900 mb-4 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl md:text-5xl font-black">
              Auto-Linked Relationships
            </h1>
          </div>
          <p className="text-lg text-earth-700">
            All relationships automatically created by the Empathy Ledger sync system
          </p>
        </div>
      </section>

      <div className="container-justice py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="border-2 border-black p-6 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <div className="text-4xl font-black text-indigo-600 mb-2">{totalAutoLinks}</div>
            <div className="font-bold text-earth-900">Total Auto-Links</div>
            <div className="text-sm text-earth-600">All automatic relationships</div>
          </div>

          <div className="border-2 border-black p-6 bg-gradient-to-br from-cyan-50 to-cyan-100">
            <div className="text-4xl font-black text-cyan-600 mb-2">{autoLinkedOrgs.length}</div>
            <div className="font-bold text-earth-900">Organization Links</div>
            <div className="text-sm text-earth-600">Profiles → Organizations</div>
          </div>

          <div className="border-2 border-black p-6 bg-gradient-to-br from-violet-50 to-violet-100">
            <div className="text-4xl font-black text-violet-600 mb-2">{autoLinkedPosts.length}</div>
            <div className="font-bold text-earth-900">Story/Transcript Links</div>
            <div className="text-sm text-earth-600">Profiles → Stories</div>
          </div>
        </div>

        {/* Organization Links Section */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-cyan-600" />
            <h2 className="text-2xl font-black">Organization Links ({autoLinkedOrgs.length})</h2>
          </div>

          {autoLinkedOrgs.length > 0 ? (
            <div className="space-y-3">
              {autoLinkedOrgs.map((link: any) => (
                <div key={link.id} className="border-2 border-black p-4 bg-cyan-50 hover:bg-cyan-100 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {link.public_profiles?.photo_url && (
                        <img
                          src={link.public_profiles.photo_url}
                          alt={link.public_profiles.full_name}
                          className="w-16 h-16 object-cover border-2 border-black"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-lg">{link.public_profiles?.full_name}</div>
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-600 text-indigo-700 text-xs font-bold">
                            <Sparkles className="h-3 w-3" />
                            AUTO-LINKED
                          </div>
                          {link.is_current && (
                            <div className="px-2 py-0.5 bg-green-50 border border-green-600 text-green-700 text-xs font-bold">
                              CURRENT
                            </div>
                          )}
                        </div>
                        <div className="text-earth-700 mb-2">
                          <span className="font-medium">{link.role}</span> at{' '}
                          <span className="font-bold">{link.organizations?.name}</span>
                        </div>
                        <div className="text-sm text-earth-600">
                          Linked on {new Date(link.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/profiles/${link.public_profiles?.id}/connections`}
                        className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-earth-50 transition-colors"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/admin/organizations/${link.organizations?.slug}`}
                        className="px-4 py-2 bg-cyan-600 text-white border-2 border-black font-bold hover:bg-cyan-700 transition-colors"
                      >
                        View Org
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-black p-8 bg-gray-50 text-center">
              <div className="text-gray-600">No auto-linked organization relationships found</div>
            </div>
          )}
        </section>

        {/* Story/Transcript Links Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-6 w-6 text-violet-600" />
            <h2 className="text-2xl font-black">Story & Transcript Links ({autoLinkedPosts.length})</h2>
          </div>

          {autoLinkedPosts.length > 0 ? (
            <div className="space-y-3">
              {autoLinkedPosts.map((link: any) => (
                <div key={link.id} className="border-2 border-black p-4 bg-violet-50 hover:bg-violet-100 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {link.public_profiles?.photo_url && (
                        <img
                          src={link.public_profiles.photo_url}
                          alt={link.public_profiles.full_name}
                          className="w-16 h-16 object-cover border-2 border-black"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-lg">{link.public_profiles?.full_name}</div>
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-600 text-indigo-700 text-xs font-bold">
                            <Sparkles className="h-3 w-3" />
                            AUTO-LINKED
                          </div>
                          {link.is_featured && (
                            <div className="px-2 py-0.5 bg-yellow-50 border border-yellow-600 text-yellow-700 text-xs font-bold">
                              FEATURED
                            </div>
                          )}
                        </div>
                        <div className="text-earth-700 mb-2">
                          <span className="font-medium">{link.role}</span> in{' '}
                          <span className="font-bold">{link.blog_posts?.title}</span>
                        </div>
                        <div className="text-sm text-earth-600">
                          Linked on {new Date(link.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/profiles/${link.public_profiles?.id}/connections`}
                        className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-earth-50 transition-colors"
                      >
                        View Profile
                      </Link>
                      {link.blog_posts?.slug && (
                        <Link
                          href={`/stories/${link.blog_posts.slug}`}
                          className="px-4 py-2 bg-violet-600 text-white border-2 border-black font-bold hover:bg-violet-700 transition-colors flex items-center gap-2"
                        >
                          View Story
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-black p-8 bg-gray-50 text-center">
              <div className="text-gray-600">No auto-linked story/transcript relationships found</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
