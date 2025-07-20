"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
      <p className="mb-8">An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.</p>
      <button
        className="px-6 py-2 bg-justice-blue text-white rounded hover:bg-justice-blue-700 transition"
        onClick={() => reset()}
      >
        Try Again
      </button>
    </div>
  );
}