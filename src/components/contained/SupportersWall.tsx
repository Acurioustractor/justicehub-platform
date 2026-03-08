'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users } from 'lucide-react';

interface Backer {
  name: string;
  avatar_url?: string;
  message?: string;
}

interface SupportersWallProps {
  backers: Backer[];
  totalCount: number;
}

const GRADIENT_COLORS = [
  'bg-gradient-to-br from-emerald-600 to-emerald-800',
  'bg-gradient-to-br from-red-600 to-red-800',
  'bg-gradient-to-br from-amber-600 to-amber-800',
  'bg-gradient-to-br from-blue-600 to-blue-800',
  'bg-gradient-to-br from-purple-600 to-purple-800',
  'bg-gradient-to-br from-pink-600 to-pink-800',
  'bg-gradient-to-br from-teal-600 to-teal-800',
  'bg-gradient-to-br from-orange-600 to-orange-800',
  'bg-gradient-to-br from-cyan-600 to-cyan-800',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function getGradient(index: number): string {
  return GRADIENT_COLORS[index % GRADIENT_COLORS.length];
}

function BackerAvatar({
  backer,
  index,
  size = 'default',
}: {
  backer: Backer;
  index: number;
  size?: 'default' | 'large';
}) {
  const sizeClass = size === 'large' ? 'h-16 w-16' : 'h-12 w-12';
  const textClass = size === 'large' ? 'text-lg' : 'text-sm';

  return (
    <Avatar className={`${sizeClass} border-2 border-white/20`}>
      {backer.avatar_url && (
        <AvatarImage src={backer.avatar_url} alt={backer.name} />
      )}
      <AvatarFallback
        className={`${getGradient(index)} text-white font-bold ${textClass}`}
      >
        {getInitials(backer.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export default function SupportersWall({
  backers,
  totalCount,
}: SupportersWallProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Show up to 9 on desktop, 6 on mobile (handled by CSS grid)
  const displayBackers = backers.slice(0, 9);
  const hasMore = totalCount > displayBackers.length;

  return (
    <div className="mb-10">
      {/* Counter */}
      <div className="text-center mb-6">
        <div className="text-6xl font-black tracking-tighter">{totalCount}</div>
        <div className="text-lg text-gray-600 font-bold uppercase tracking-widest">
          people back this tour
        </div>
      </div>

      {/* Avatar Grid */}
      {displayBackers.length > 0 && (
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {displayBackers.map((backer, i) => (
              <div
                key={i}
                className="relative flex flex-col items-center group"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <BackerAvatar backer={backer} index={i} size="large" />
                <span className="text-xs text-gray-600 mt-1 font-medium truncate max-w-[80px] text-center">
                  {backer.name}
                </span>

                {/* Tooltip on hover */}
                {hoveredIndex === i && backer.message && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap z-10 max-w-[200px]">
                    <p className="truncate italic">&ldquo;{backer.message}&rdquo;</p>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* See all supporters dialog */}
      {hasMore && (
        <div className="text-center">
          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:underline">
                <Users className="w-4 h-4" />
                See all {totalCount} supporters
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                  Tour Supporters
                </DialogTitle>
                <DialogDescription>
                  {totalCount} people backing THE CONTAINED Australian Tour
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {backers.map((backer, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-2 p-3">
                    <BackerAvatar backer={backer} index={i} size="large" />
                    <div>
                      <div className="text-sm font-bold">{backer.name}</div>
                      {backer.message && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                          &ldquo;{backer.message}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
