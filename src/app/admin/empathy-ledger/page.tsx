import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, Users, BookOpen, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default async function EmpathyLedgerDashboard() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/admin/empathy-ledger');
  }

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Fetch synced profiles
  const { data: syncedProfiles } = await supabase
    .from('public_profiles')
    .select('id, full_name, slug, photo_url, empathy_ledger_profile_id, last_synced_at')
    .eq('synced_from_empathy_ledger', true)
    .order('last_synced_at', { ascending: false });

  // Fetch synced transcripts (blog posts)
  const { data: syncedTranscripts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, empathy_ledger_transcript_id, video_url, audio_url, created_at')
    .eq('synced_from_empathy_ledger', true)
    .order('created_at', { ascending: false });

  // Fetch auto-linked relationships for synced profiles
  const { data: autoLinkedOrgs } = await supabase
    .from('organizations_profiles')
    .select(`
      id,
      public_profiles!inner (
        id,
        synced_from_empathy_ledger
      )
    `)
    .eq('public_profiles.synced_from_empathy_ledger', true);

  const { data: autoLinkedPosts } = await supabase
    .from('blog_posts_profiles')
    .select(`
      id,
      blog_posts!inner (
        id,
        synced_from_empathy_ledger
      )
    `)
    .eq('blog_posts.synced_from_empathy_ledger', true);

  const totalProfiles = syncedProfiles?.length || 0;
  const totalTranscripts = syncedTranscripts?.length || 0;
  const totalAutoLinks = (autoLinkedOrgs?.length || 0) + (autoLinkedPosts?.length || 0);

  // Get most recent sync
  const mostRecentSync = syncedProfiles?.[0]?.last_synced_at;

  return (
    <div className="min-h-screen bg-white page-content">
      {/* Header */}
      <section className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-12 border-b-2 border-black">
        <div className="container-justice">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-900 mb-4 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-violet-600" />
            <h1 className="text-4xl md:text-5xl font-black">
              Empathy Ledger Sync
            </h1>
          </div>
          <p className="text-lg text-earth-700">
            Content and relationships synced from the Empathy Ledger database
          </p>
        </div>
      </section>

      <div className="container-justice py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="border-2 border-black p-6 bg-gradient-to-br from-violet-50 to-violet-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-6 w-6 text-violet-600" />
              <div className="text-4xl font-black text-violet-600">{totalProfiles}</div>
            </div>
            <div className="font-bold text-earth-900">Synced Profiles</div>
            <div className="text-sm text-earth-600">People from Empathy Ledger</div>
          </div>

          <div className="border-2 border-black p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-6 w-6 text-purple-600" />
              <div className="text-4xl font-black text-purple-600">{totalTranscripts}</div>
            </div>
            <div className="font-bold text-earth-900">Transcripts</div>
            <div className="text-sm text-earth-600">Interview transcripts synced</div>
          </div>

          <div className="border-2 border-black p-6 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              <div className="text-4xl font-black text-indigo-600">{totalAutoLinks}</div>
            </div>
            <div className="font-bold text-earth-900">Auto-Links</div>
            <div className="text-sm text-earth-600">Relationships created</div>
          </div>

          <div className="border-2 border-black p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-6 w-6 text-green-600" />
              <div className="text-sm font-black text-green-600">
                {mostRecentSync ? new Date(mostRecentSync).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div className="font-bold text-earth-900">Last Sync</div>
            <div className="text-sm text-earth-600">Most recent update</div>
          </div>
        </div>

        {/* Sync Instructions */}
        <section className="border-2 border-black p-6 bg-blue-50 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h2 className="text-xl font-black mb-2">How Syncing Works</h2>
              <div className="text-earth-700 space-y-2">
                <p>
                  <strong>Automatic Sync:</strong> Profiles marked as <code className="px-2 py-1 bg-white border border-black font-mono text-sm">justicehub_enabled = true</code> in Empathy Ledger
                  are automatically synced to JusticeHub.
                </p>
                <p>
                  <strong>What Gets Synced:</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Profile information (name, bio, photo, role tags)</li>
                  <li>Organization memberships (creates organization links)</li>
                  <li>Interview transcripts (creates blog posts)</li>
                  <li>Stories and galleries (when available)</li>
                </ul>
                <p>
                  <strong>Manual Sync:</strong> Run the sync script to update existing profiles and add new ones:
                </p>
                <div className="bg-white border-2 border-black p-3 font-mono text-sm mt-2">
                  npx tsx src/scripts/sync-profiles-from-empathy-ledger.ts
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Synced Profiles */}
        <section className="mb-8">
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-violet-600" />
            Synced Profiles ({totalProfiles})
          </h2>

          {syncedProfiles && syncedProfiles.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {syncedProfiles.map((profile: any) => (
                <div key={profile.id} className="border-2 border-black p-4 bg-white hover:bg-violet-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {profile.photo_url && (
                      <img
                        src={profile.photo_url}
                        alt={profile.full_name}
                        className="w-16 h-16 object-cover border-2 border-black"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">{profile.full_name}</div>
                      <div className="text-xs font-mono text-earth-600 mb-2">
                        {profile.empathy_ledger_profile_id}
                      </div>
                      {profile.last_synced_at && (
                        <div className="text-sm text-earth-600 mb-3">
                          Last synced: {new Date(profile.last_synced_at).toLocaleDateString()}
                        </div>
                      )}
                      <Link
                        href={`/admin/profiles/${profile.id}/connections`}
                        className="inline-block px-4 py-2 bg-violet-600 text-white border-2 border-black font-bold hover:bg-violet-700 transition-colors"
                      >
                        View Connections
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-black p-8 bg-gray-50 text-center">
              <div className="text-gray-600">No synced profiles found</div>
            </div>
          )}
        </section>

        {/* Synced Transcripts */}
        <section>
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-600" />
            Synced Transcripts ({totalTranscripts})
          </h2>

          {syncedTranscripts && syncedTranscripts.length > 0 ? (
            <div className="space-y-3">
              {syncedTranscripts.map((transcript: any) => (
                <div key={transcript.id} className="border-2 border-black p-4 bg-white hover:bg-purple-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">{transcript.title}</div>
                      <div className="text-xs font-mono text-earth-600 mb-2">
                        {transcript.empathy_ledger_transcript_id}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        {transcript.video_url && (
                          <a
                            href={transcript.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            📹 Video Available
                          </a>
                        )}
                        {transcript.audio_url && (
                          <a
                            href={transcript.audio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            🎧 Audio Available
                          </a>
                        )}
                      </div>
                      <div className="text-sm text-earth-600">
                        Synced on {new Date(transcript.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {transcript.slug && (
                      <Link
                        href={`/stories/${transcript.slug}`}
                        className="px-4 py-2 bg-purple-600 text-white border-2 border-black font-bold hover:bg-purple-700 transition-colors"
                      >
                        View Story
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-black p-8 bg-gray-50 text-center">
              <div className="text-gray-600">No synced transcripts found</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
