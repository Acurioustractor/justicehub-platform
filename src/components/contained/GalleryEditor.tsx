'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, GripVertical, Plus, Settings, Trash2, Upload, X } from 'lucide-react';

interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

interface AvailableImage {
  src: string;
  org: string;
  filename: string;
}

interface GalleryEditorProps {
  images: GalleryImage[];
  onSave: (images: GalleryImage[]) => void;
}

export function GalleryEditor({ images: initialImages, onSave }: GalleryEditorProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [available, setAvailable] = useState<AvailableImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && available.length === 0) {
      setLoading(true);
      fetch('/api/admin/contained/gallery')
        .then(res => res.json())
        .then(data => {
          setAvailable(data.available || []);
          setImages(data.images || initialImages);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, available.length, initialImages]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/contained/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      if (res.ok) {
        onSave(images);
        setOpen(false);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const addImage = (img: AvailableImage) => {
    if (images.some(i => i.src === img.src)) return;
    const orgName = img.org.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setImages(prev => [...prev, {
      src: img.src,
      alt: `${orgName} - ${img.filename.replace(/\.\w+$/, '').replace(/[-_]/g, ' ')}`,
      caption: `${orgName}`,
    }]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, caption } : img));
  };

  const updateAlt = (index: number, alt: string) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, alt } : img));
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'gallery');
        const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
        if (!res.ok) continue;
        const { url } = await res.json();
        const name = file.name.replace(/\.\w+$/, '').replace(/[-_]/g, ' ');
        setImages(prev => [...prev, { src: url, alt: name, caption: '' }]);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setUploading(false);
  };

  const orgs = [...new Set(available.map(i => i.org))];
  const filtered = filterOrg === 'all' ? available : available.filter(i => i.org === filterOrg);
  const selectedSrcs = new Set(images.map(i => i.src));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-4 right-4 z-20 bg-black/80 text-white px-3 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-colors"
      >
        <Settings className="w-3.5 h-3.5" /> Edit Gallery
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Edit Gallery
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 text-black px-5 py-2 text-sm font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setOpen(false); setImages(initialImages); }}
              className="text-white/60 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current gallery */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-4">
            Current Gallery ({images.length} images)
          </h3>
          {images.length === 0 ? (
            <p className="text-white/40 text-sm">No images selected. Add some below.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={img.src} className="bg-white/5 border border-white/10 group">
                  <div className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveImage(i, i - 1)}
                        disabled={i === 0}
                        className="bg-black/70 text-white p-1 text-xs disabled:opacity-30"
                        title="Move left"
                      >
                        &larr;
                      </button>
                      <button
                        onClick={() => moveImage(i, i + 1)}
                        disabled={i === images.length - 1}
                        className="bg-black/70 text-white p-1 text-xs disabled:opacity-30"
                        title="Move right"
                      >
                        &rarr;
                      </button>
                    </div>
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 flex items-center gap-1">
                      <GripVertical className="w-3 h-3 text-white/40 flex-shrink-0" />
                      <span className="text-white text-xs font-mono">{i + 1}</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <input
                      value={img.caption}
                      onChange={e => updateCaption(i, e.target.value)}
                      className="w-full bg-transparent text-white text-xs px-1 py-0.5 border border-white/10 focus:border-white/30 focus:outline-none"
                      placeholder="Caption"
                    />
                    <input
                      value={img.alt}
                      onChange={e => updateAlt(i, e.target.value)}
                      className="w-full bg-transparent text-white/60 text-xs px-1 py-0.5 border border-white/10 focus:border-white/30 focus:outline-none"
                      placeholder="Alt text"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add images */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
            >
              <Plus className="w-4 h-4" />
              {showPicker ? 'Hide Available Images' : 'Browse Existing'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={e => e.target.files && handleUpload(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload from Computer'}
            </button>
          </div>

          {showPicker && (
            <>
              {/* Org filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setFilterOrg('all')}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border transition-colors ${
                    filterOrg === 'all' ? 'bg-white text-black border-white' : 'text-white/60 border-white/20 hover:border-white/40'
                  }`}
                >
                  All
                </button>
                {orgs.map(org => (
                  <button
                    key={org}
                    onClick={() => setFilterOrg(org)}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border transition-colors ${
                      filterOrg === org ? 'bg-white text-black border-white' : 'text-white/60 border-white/20 hover:border-white/40'
                    }`}
                  >
                    {org.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>

              {loading ? (
                <p className="text-white/40 text-sm">Scanning images...</p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {filtered.map(img => {
                    const selected = selectedSrcs.has(img.src);
                    return (
                      <button
                        key={img.src}
                        onClick={() => selected ? undefined : addImage(img)}
                        disabled={selected}
                        className={`relative aspect-square overflow-hidden border-2 transition-all ${
                          selected
                            ? 'border-emerald-500 opacity-50 cursor-not-allowed'
                            : 'border-transparent hover:border-white/40 cursor-pointer'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt={img.filename} className="w-full h-full object-cover" />
                        {selected && (
                          <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                            <Check className="w-6 h-6 text-emerald-400" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                          <span className="text-white text-[10px] truncate block">{img.filename}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
