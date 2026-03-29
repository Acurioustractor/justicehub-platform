'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { usePreviewAuth } from '@/lib/hooks/use-preview-auth';

export default function JusticeNavigatorPreviewPage() {
  const { isAuthenticated, isLoading, password, setPassword, error, handleSubmit } = usePreviewAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <h1 className="text-3xl font-bold mb-2 text-white">Justice Navigator</h1>
            <p className="text-gray-400">AI-powered legal guidance chat</p>
            <p className="text-gray-500 text-sm mt-2">This mockup is password protected</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 focus:border-purple-500 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <button type="submit" className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-purple-600 transition-colors">
              View Preview
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: 0, padding: 0, boxSizing: 'border-box', background: '#1a1a2e', color: '#e0e0e0', fontFamily: "'Segoe UI', system-ui, sans-serif", height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
      {/* Crisis Bar */}
      <div style={{ background: '#e74c3c', color: '#fff', textAlign: 'center', padding: 8, fontSize: 12, fontWeight: 600 }}>
        If you are in danger, call 000. Yarning support: 13YARN (13 92 76)
      </div>

      {/* Header */}
      <header style={{ background: '#16213e', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #e2725b' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Justice<span style={{ color: '#e2725b' }}>Hub</span></div>
        <span style={{ background: '#e2725b', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Navigator</span>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/preview" style={{ color: '#8a8aa0', fontSize: 12, textDecoration: 'none' }}>
            &larr; Previews
          </Link>
        </div>
      </header>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Bot message 1 */}
        <div style={{ maxWidth: '85%', padding: '14px 18px', borderRadius: 16, fontSize: 14, lineHeight: 1.6, background: '#16213e', border: '1px solid #2a2a4a', borderBottomLeftRadius: 4, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 11, color: '#e2725b', fontWeight: 600, marginBottom: 6 }}>Justice Navigator</div>
          What&apos;s going on? Tell me in your own words and I&apos;ll find the right support. I&apos;m an AI assistant that connects you with services and tools. I&apos;m not recording this unless you ask me to.
        </div>

        {/* User message */}
        <div style={{ maxWidth: '85%', padding: '14px 18px', borderRadius: 16, fontSize: 14, lineHeight: 1.6, background: '#e2725b', color: '#fff', borderBottomRightRadius: 4, alignSelf: 'flex-end' }}>
          my daughter got expelled from school for nothing they said she was threatening but she was just standing up for herself
        </div>

        {/* Bot message 2 with recommendations */}
        <div style={{ maxWidth: '85%', padding: '14px 18px', borderRadius: 16, fontSize: 14, lineHeight: 1.6, background: '#16213e', border: '1px solid #2a2a4a', borderBottomLeftRadius: 4, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 11, color: '#e2725b', fontWeight: 600, marginBottom: 6 }}>Justice Navigator</div>
          That sounds really frustrating, and you have options. Based on what you&apos;ve told me, here&apos;s what I&apos;d recommend:

          {/* Recommendation 1 */}
          <div style={{ background: 'rgba(226,114,91,.08)', border: '1px solid rgba(226,114,91,.2)', borderRadius: 10, padding: 14, marginTop: 10 }}>
            <h4 style={{ fontSize: 13, color: '#e2725b', marginBottom: 6 }}>1. Education Appeal Process</h4>
            <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: 13 }}>
              <strong style={{ color: '#fff' }}>You have 7 days to lodge an appeal</strong> with the NSW Department of Education. I can walk you through that right now.
              <div style={{ color: '#8a8aa0', fontSize: 12, marginTop: 2 }}>NSW public school suspension/expulsion policy requires written notification and appeal rights.</div>
            </div>
            <a href="#" style={{ display: 'inline-block', background: '#e2725b', color: '#fff', padding: '8px 16px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 600, marginTop: 6 }}>Get Appeal Guide</a>
          </div>

          {/* Recommendation 2 */}
          <div style={{ background: 'rgba(226,114,91,.08)', border: '1px solid rgba(226,114,91,.2)', borderRadius: 10, padding: 14, marginTop: 10 }}>
            <h4 style={{ fontSize: 13, color: '#e2725b', marginBottom: 6 }}>2. Nearby Advocacy Services</h4>
            <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: 13 }}>
              <strong style={{ color: '#fff' }}>Aboriginal Education Consultative Group &mdash; Dubbo</strong>
              <div style={{ color: '#8a8aa0', fontSize: 12, marginTop: 2 }}>Free education advocacy - 02 6882 1144</div>
            </div>
            <div style={{ padding: '8px 0', fontSize: 13 }}>
              <strong style={{ color: '#fff' }}>Legal Aid NSW &mdash; Dubbo</strong>
              <div style={{ color: '#8a8aa0', fontSize: 12, marginTop: 2 }}>Education law, discrimination - 1300 888 529</div>
            </div>
          </div>

          {/* Recommendation 3 */}
          <div style={{ background: 'rgba(226,114,91,.08)', border: '1px solid rgba(226,114,91,.2)', borderRadius: 10, padding: 14, marginTop: 10 }}>
            <h4 style={{ fontSize: 13, color: '#e2725b', marginBottom: 6 }}>3. If Race Played a Part</h4>
            <div style={{ padding: '8px 0', fontSize: 13 }}>
              You can report through <strong style={{ color: '#fff' }}>Call It Out</strong>, which builds a record even if you don&apos;t want to take formal action yet.
            </div>
            <a href="#" style={{ display: 'inline-block', background: 'transparent', border: '1px solid #9b59b6', color: '#9b59b6', padding: '8px 16px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 600, marginTop: 6 }}>Report on Call It Out</a>
          </div>
        </div>

        {/* Bot message 3 with support pack */}
        <div style={{ maxWidth: '85%', padding: '14px 18px', borderRadius: 16, fontSize: 14, lineHeight: 1.6, background: '#16213e', border: '1px solid #2a2a4a', borderBottomLeftRadius: 4, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 11, color: '#e2725b', fontWeight: 600, marginBottom: 6 }}>Justice Navigator</div>
          I&apos;ve put together a Support Pack with everything in one place &mdash; the appeal guide, service contacts, and complaint options. You can share it with family.
          <div style={{ background: 'linear-gradient(135deg, #2d1b4e, #16213e)', border: '2px solid #9b59b6', borderRadius: 12, padding: 18, textAlign: 'center', marginTop: 8 }}>
            <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 6 }}>Your Support Pack</h4>
            <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6, fontSize: 12, color: '#9b59b6', fontFamily: 'monospace', margin: '10px 0' }}>justicehub.com.au/navigator/abc123</div>
            <a href="#" style={{ display: 'inline-block', background: '#9b59b6', color: '#fff', padding: '8px 20px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Copy Link to Share</a>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: '#5a5a7a', textAlign: 'center', padding: 8, lineHeight: 1.4 }}>
          I&apos;m not a lawyer or counselor. I connect you with people who are. All recommendations should be verified with a qualified professional.
        </div>
      </div>

      {/* Input Bar */}
      <div style={{ background: '#16213e', padding: '14px 16px', display: 'flex', gap: 10, borderTop: '1px solid #2a2a4a' }}>
        <input placeholder="Type a message..." style={{ flex: 1, padding: '12px 16px', borderRadius: 24, border: '1px solid #2a2a4a', background: '#1a1a2e', color: '#fff', fontSize: 14 }} />
        <button style={{ width: 44, height: 44, borderRadius: '50%', background: '#e2725b', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>&#10148;</button>
      </div>
    </div>
  );
}
