'use client';

import Image from 'next/image';
import { Image as ImageIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type ImageOption = {
  src: string;
  label: string;
};

export function SwappableMockupImage({
  storageKey,
  initialSrc,
  alt,
  options,
}: {
  storageKey: string;
  initialSrc: string;
  alt: string;
  options: ImageOption[];
}) {
  const [src, setSrc] = useState(initialSrc);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setSrc(saved);
  }, [storageKey]);

  const chooseImage = (nextSrc: string) => {
    setSrc(nextSrc);
    window.localStorage.setItem(storageKey, nextSrc);
    setOpen(false);
  };

  const resetImage = () => {
    setSrc(initialSrc);
    window.localStorage.removeItem(storageKey);
    setOpen(false);
  };

  return (
    <>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 48vw, 100vw" unoptimized />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute right-5 top-5 z-20 inline-flex min-h-11 items-center gap-2 border border-white/25 bg-black/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-white"
      >
        <ImageIcon className="h-4 w-4" />
        Swap image
      </button>

      {open && (
        <ImagePickerModal
          title="Swap this room image"
          activeSrc={src}
          options={options}
          onChoose={chooseImage}
          onClose={() => setOpen(false)}
          onReset={resetImage}
        />
      )}
    </>
  );
}

export function SwappableReferenceThumbnail({
  storageKey,
  initialSrc,
  label,
  options,
}: {
  storageKey: string;
  initialSrc: string;
  label: string;
  options: ImageOption[];
}) {
  const [src, setSrc] = useState(initialSrc);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setSrc(saved);
  }, [storageKey]);

  const chooseImage = (nextSrc: string) => {
    setSrc(nextSrc);
    window.localStorage.setItem(storageKey, nextSrc);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative aspect-[4/3] w-full overflow-hidden border border-[#F5F0E8]/12 bg-black text-left"
      >
        <Image src={src} alt={label} fill className="object-cover transition-transform group-hover:scale-105" sizes="180px" loading="eager" unoptimized />
        <span className="absolute inset-x-0 bottom-0 bg-black/75 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-white">
          {label}
        </span>
        <span className="absolute right-1 top-1 bg-black/75 px-1.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/75 opacity-0 transition-opacity group-hover:opacity-100">
          Swap
        </span>
      </button>

      {open && (
        <ImagePickerModal
          title={`Swap ${label}`}
          activeSrc={src}
          options={options}
          onChoose={chooseImage}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function ImagePickerModal({
  title,
  activeSrc,
  options,
  onChoose,
  onClose,
  onReset,
}: {
  title: string;
  activeSrc: string;
  options: ImageOption[];
  onChoose: (src: string) => void;
  onClose: () => void;
  onReset?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/92 p-4 backdrop-blur-sm md:p-8">
      <div className="mx-auto max-w-6xl border border-white/20 bg-[#0A0A0A] p-4 shadow-2xl md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Choose from all reference photos</p>
            <h3 className="mt-1 text-xl font-black uppercase tracking-normal text-white md:text-2xl">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 text-white hover:border-white"
            aria-label="Close image picker"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {options.map((option) => (
            <button
              key={option.src}
              type="button"
              onClick={() => onChoose(option.src)}
              className={`group relative aspect-[4/3] overflow-hidden border bg-black text-left ${
                option.src === activeSrc ? 'border-white' : 'border-white/15 hover:border-white/70'
              }`}
            >
              <Image
                src={option.src}
                alt={option.label}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(min-width: 1024px) 260px, 45vw"
                loading="eager"
                unoptimized
              />
              <span className="absolute inset-x-0 bottom-0 bg-black/78 px-2 py-1.5 text-[11px] uppercase tracking-[0.12em] text-white">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="mt-5 min-h-11 border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/75 hover:border-white hover:text-white"
          >
            Reset default
          </button>
        )}
      </div>
    </div>
  );
}
