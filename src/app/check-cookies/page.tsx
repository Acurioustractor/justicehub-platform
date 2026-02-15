'use client';

import { useEffect, useState } from 'react';

export default function CheckCookiesPage() {
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // Get all cookies
    setCookies(document.cookie || 'No cookies found');
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-black mb-8">Cookie Check</h1>

      <div className="bg-gray-100 p-6 border-2 border-black mb-8">
        <h2 className="text-2xl font-bold mb-4">Browser Cookies:</h2>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto">
          {cookies}
        </pre>
      </div>

      <div className="bg-blue-50 p-6 border-2 border-black">
        <h2 className="text-xl font-bold mb-4">What to look for:</h2>
        <ul className="space-y-2 text-sm">
          <li>✅ Look for cookies starting with <code className="bg-gray-200 px-2 py-1">sb-</code></li>
          <li>✅ Specifically: <code className="bg-gray-200 px-2 py-1">sb-tednluwflfhxyucgwigh-auth-token</code></li>
          <li>❌ If you don't see any sb- cookies, authentication won't work</li>
        </ul>
      </div>

      <div className="mt-6">
        <a href="/login" className="text-blue-600 underline">← Back to login</a>
        {' | '}
        <a href="/test-auth" className="text-blue-600 underline">Test server auth →</a>
      </div>
    </div>
  );
}
