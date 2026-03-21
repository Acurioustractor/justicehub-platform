'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function DevLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Logging in...');

  useEffect(() => {
    const redirect = searchParams.get('redirect') || '/admin/empathy-ledger/content';

    fetch('/api/dev/funding-smoke/admin-session?auto=true', {
      credentials: 'include',
    })
      .then(res => {
        if (res.ok) {
          setStatus('Logged in! Redirecting...');
          window.location.href = redirect;
        } else {
          res.text().then(t => setStatus(`Failed (${res.status}): ${t}`));
        }
      })
      .catch(err => setStatus(`Failed to connect: ${err.message}`));
  }, [router, searchParams]);

  return <p style={{ color: '#666' }}>{status}</p>;
}

export default function DevLogin() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Dev Admin Login</h1>
        <Suspense fallback={<p style={{ color: '#666' }}>Loading...</p>}>
          <DevLoginInner />
        </Suspense>
      </div>
    </div>
  );
}
