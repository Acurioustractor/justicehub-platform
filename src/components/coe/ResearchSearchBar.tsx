'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface ResearchSearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function ResearchSearchBar({ onSearch, initialQuery = '' }: ResearchSearchBarProps) {
  const [query, setQuery] = React.useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search research by title, author, keywords, findings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
    </form>
  );
}
