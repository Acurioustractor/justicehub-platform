'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageIcon, RotateCcw } from 'lucide-react';
import {
  ELPhotoPickerModal,
  type ELPhotoPickerSource,
} from '@/components/empathy-ledger/ELPhotoPickerModal';
import {
  heroBackgroundStyle,
  type ManagedHeroBackground,
} from '@/content/hero-backgrounds';

const ADMIN_STORAGE_KEY = 'contained-admin';
const OVERRIDES_ENDPOINT = '/api/admin/contained/photo-overrides';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type ManagedHeroBackgroundLayerProps = {
  background: ManagedHeroBackground;
  overrideKey: string;
  initialOverrideUrl?: string | null;
  className?: string;
  adminLabel?: string;
  pickerTitle?: string;
  pickerSource?: ELPhotoPickerSource;
};

function useContainedAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get('admin');

    if (adminParam === '0') {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }

    setIsAdmin(adminParam === '1');
  }, []);

  return isAdmin;
}

function useContainedPhotoOverrides(initialOverrideKey?: string, initialOverrideUrl?: string | null) {
  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    if (!initialOverrideKey || !initialOverrideUrl) return {};
    return { [initialOverrideKey]: initialOverrideUrl };
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    fetch(OVERRIDES_ENDPOINT)
      .then((response) => response.json())
      .then((data) => {
        if (data.overrides && typeof data.overrides === 'object') {
          setOverrides(data.overrides);
        }
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((next: Record<string, string>) => {
    setSaveStatus('saving');
    fetch(OVERRIDES_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: next }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Save failed with ${response.status}`);
        setSaveStatus('saved');
        window.setTimeout(() => setSaveStatus('idle'), 1800);
      })
      .catch((error) => {
        console.error('Hero background override save failed:', error);
        setSaveStatus('error');
      })
  }, []);

  const setOverride = useCallback(
    (key: string, url: string) => {
      setOverrides((current) => {
        const next = { ...current, [key]: url };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearOverride = useCallback(
    (key: string) => {
      setOverrides((current) => {
        const next = { ...current };
        delete next[key];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return { overrides, setOverride, clearOverride, saveStatus };
}

export function ManagedHeroBackgroundLayer({
  background,
  overrideKey,
  initialOverrideUrl,
  className,
  adminLabel = 'Hero image',
  pickerTitle = 'Pick hero image',
  pickerSource = 'all',
}: ManagedHeroBackgroundLayerProps) {
  const isAdmin = useContainedAdminMode();
  const { overrides, setOverride, clearOverride, saveStatus } = useContainedPhotoOverrides(
    overrideKey,
    initialOverrideUrl
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeImage = overrides[overrideKey] || background.image;
  const hasOverride = Boolean(overrides[overrideKey]);
  const activeBackground = useMemo(
    () => ({ ...background, image: activeImage }),
    [activeImage, background]
  );

  return (
    <>
      <div className={className} style={heroBackgroundStyle(activeBackground)} aria-hidden="true" />

      {isAdmin && (
        <div className="absolute right-4 top-4 z-30 flex flex-wrap items-center justify-end gap-2 rounded-md border border-white/20 bg-black/78 p-2 text-white shadow-xl backdrop-blur">
          <span
            className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/62"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {adminLabel}
          </span>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex min-h-9 items-center gap-2 rounded-sm bg-[#dc2626] px-3 text-xs font-bold uppercase tracking-[0.08em] text-white hover:bg-[#b91c1c]"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {hasOverride ? 'Swap' : 'Pick'}
          </button>
          {hasOverride && (
            <button
              type="button"
              onClick={() => clearOverride(overrideKey)}
              className="inline-flex min-h-9 items-center gap-2 rounded-sm border border-white/20 px-3 text-xs font-bold uppercase tracking-[0.08em] text-white/80 hover:bg-white/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Default
          </button>
          )}
          {saveStatus !== 'idle' && (
            <span
              className={`min-w-12 px-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] ${
                saveStatus === 'saved'
                  ? 'text-emerald-300'
                  : saveStatus === 'error'
                    ? 'text-red-300'
                    : 'text-white/48'
              }`}
            >
              {saveStatus === 'saving' ? 'Saving' : saveStatus === 'saved' ? 'Saved' : 'Failed'}
            </span>
          )}
        </div>
      )}

      {pickerOpen && (
        <ELPhotoPickerModal
          title={pickerTitle}
          source={pickerSource}
          onPick={(url) => {
            setOverride(overrideKey, url);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
