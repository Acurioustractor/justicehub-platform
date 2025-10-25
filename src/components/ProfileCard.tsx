import React from 'react';
import { User, ExternalLink, AlertCircle } from 'lucide-react';

interface EmpathyLedgerProfile {
  id: string;
  name?: string;
  preferred_name?: string;
  bio?: string;
  profile_picture_url?: string;
  organization?: {
    name: string;
  };
}

interface ProfileCardProps {
  profile: EmpathyLedgerProfile | null;
  role?: string;
  storyExcerpt?: string;
  isFeatured?: boolean;
  culturalWarning?: string;
  showLink?: boolean;
}

export default function ProfileCard({
  profile,
  role,
  storyExcerpt,
  isFeatured = false,
  culturalWarning,
  showLink = true
}: ProfileCardProps) {
  if (!profile) return null;

  const displayName = profile.preferred_name || profile.name || 'Anonymous';
  const bioPreview = profile.bio?.substring(0, 150) || storyExcerpt?.substring(0, 150);

  return (
    <div className={`border-2 border-black p-6 bg-white ${isFeatured ? 'ring-4 ring-yellow-400' : ''}`}>
      {/* Cultural Warning */}
      {culturalWarning && (
        <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{culturalWarning}</p>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {profile.profile_picture_url ? (
            <img
              src={profile.profile_picture_url}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-black"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-black flex items-center justify-center">
              <User className="h-8 w-8 text-gray-600" />
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-black">{displayName}</h3>
            {isFeatured && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                FEATURED
              </span>
            )}
          </div>

          {role && (
            <p className="text-sm font-medium text-blue-600 mb-2">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </p>
          )}

          {profile.organization && (
            <p className="text-sm text-gray-600 mb-2">
              {profile.organization.name}
            </p>
          )}

          {bioPreview && (
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              {bioPreview}
              {(profile.bio?.length || 0) > 150 || (storyExcerpt?.length || 0) > 150 ? '...' : ''}
            </p>
          )}

          {showLink && (
            <a
              href={`https://empathy-ledger.vercel.app/profiles/${profile.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              Read full story
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
