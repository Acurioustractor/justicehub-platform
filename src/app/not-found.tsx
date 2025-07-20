export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <h2 className="text-3xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="mb-8">Sorry, the page you are looking for does not exist.</p>
      <a href="/" className="px-6 py-2 bg-justice-blue text-white rounded hover:bg-justice-blue-700 transition">Go Home</a>
    </div>
  );
}