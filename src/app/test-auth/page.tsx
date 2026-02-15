import { createClient } from '@/lib/supabase/server';

export default async function TestAuthPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-black mb-8">Auth Test Page</h1>

      <div className="bg-gray-100 p-6 border-2 border-black mb-8">
        <h2 className="text-2xl font-bold mb-4">Server-Side Auth Check</h2>

        {user ? (
          <div className="space-y-2">
            <p className="text-green-600 font-bold text-xl">✅ Logged In</p>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>
        ) : (
          <div>
            <p className="text-red-600 font-bold text-xl">❌ Not Logged In</p>
            {error && <p className="text-red-500 mt-2">Error: {error.message}</p>}
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 border-2 border-black">
        <h2 className="text-xl font-bold mb-4">What This Means:</h2>

        {user ? (
          <div className="space-y-2 text-sm">
            <p>✅ Your session is working on the server</p>
            <p>✅ Server components can see you're logged in</p>
            <p>✅ The Edit Profile button SHOULD appear</p>
            <p className="mt-4 font-bold">Next: Go to <a href="/people/benjamin-knight" className="text-blue-600 underline">/people/benjamin-knight</a></p>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p>❌ Session is NOT working on the server</p>
            <p>This means the cookie is not being passed correctly</p>
            <p className="mt-4 font-bold">Go back to <a href="/login" className="text-blue-600 underline">/login</a> and try again</p>
          </div>
        )}
      </div>
    </div>
  );
}
