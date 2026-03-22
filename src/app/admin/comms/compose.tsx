'use client';

import { useState, useEffect } from 'react';
import { Loader2, Image as ImageIcon, BarChart3, Save, Check, X, Linkedin } from 'lucide-react';
import { STATS } from '@/lib/contained-brand';

interface MediaItem {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
}

export default function Compose({ onInsertStat }: { onInsertStat?: string }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [sentDate, setSentDate] = useState('');
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showStatsPicker, setShowStatsPicker] = useState(false);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (onInsertStat) {
      setContent(prev => prev ? `${prev}\n\n${onInsertStat}` : onInsertStat);
    }
  }, [onInsertStat]);

  const fetchPhotos = async () => {
    if (photos.length > 0) {
      setShowPhotoPicker(true);
      return;
    }
    setLoadingPhotos(true);
    setShowPhotoPicker(true);
    try {
      const res = await fetch('/api/empathy-ledger/media?limit=100');
      const data = await res.json();
      if (data.media) {
        setPhotos(data.media);
      }
    } catch (err) {
      console.error('Photo fetch error:', err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const saveToNotion = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/comms/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          status: 'Draft',
          sentDate: sentDate || null,
          imageUrl: selectedImage?.url || null,
          targets: ['LinkedIn (Personal)'],
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setTitle('');
          setContent('');
          setSentDate('');
          setSelectedImage(null);
        }, 2000);
      }
    } catch (err) {
      setError('Failed to save. Try again.');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const insertStat = (key: string) => {
    const stat = STATS[key];
    if (!stat) return;
    const text = `${stat.value} ${stat.label} - ${stat.subtext}`;
    setContent(prev => prev ? `${prev}\n\n${text}` : text);
    setShowStatsPicker(false);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-4">
        {/* Target label */}
        <div className="flex items-center gap-2 text-xs">
          <Linkedin size={14} className="text-blue-600" />
          <span className="font-bold text-gray-900">LinkedIn (Personal)</span>
          <span className="text-gray-400">- Only distribution channel</span>
        </div>

        {/* Title */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Post Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Post title for Notion..."
            className="w-full px-3 py-2 rounded border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-black"
          />
        </div>

        {/* Content textarea */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Post Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your LinkedIn post here..."
            rows={12}
            className="w-full px-3 py-2 rounded border border-gray-300 bg-white text-sm text-gray-900 leading-relaxed resize-y focus:outline-none focus:border-black"
          />
          <div className="flex justify-between mt-1">
            <div className="text-[10px] text-gray-400">
              {content.length} chars {content.length > 3000 && <span className="text-red-600">(LinkedIn limit ~3000)</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchPhotos}
                className="text-[10px] px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors flex items-center gap-1 text-gray-600"
              >
                <ImageIcon size={10} /> Photo
              </button>
              <button
                onClick={() => setShowStatsPicker(!showStatsPicker)}
                className="text-[10px] px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors flex items-center gap-1 text-gray-600"
              >
                <BarChart3 size={10} /> Stat
              </button>
            </div>
          </div>
        </div>

        {/* Stats picker */}
        {showStatsPicker && (
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Insert Stat</span>
              <button onClick={() => setShowStatsPicker(false)} className="p-0.5 hover:bg-gray-200 rounded text-gray-500">
                <X size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {Object.entries(STATS).map(([key, stat]) => (
                <button
                  key={key}
                  onClick={() => insertStat(key)}
                  className="text-left p-2 rounded hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xs font-bold text-red-600" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-gray-500 ml-1">{stat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photo picker */}
        {showPhotoPicker && (
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Select Photo (Empathy Ledger)
              </span>
              <button onClick={() => setShowPhotoPicker(false)} className="p-0.5 hover:bg-gray-200 rounded text-gray-500">
                <X size={12} />
              </button>
            </div>
            {loadingPhotos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-gray-400" size={16} />
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto">
                {photos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => { setSelectedImage(photo); setShowPhotoPicker(false); }}
                    className={`relative aspect-square rounded overflow-hidden border-2 transition-colors ${
                      selectedImage?.id === photo.id ? 'border-red-500' : 'border-transparent hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={photo.thumbnail || photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {photos.length === 0 && (
                  <div className="col-span-5 text-center py-4 text-xs text-gray-400">
                    No photos available from Empathy Ledger.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Date picker */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Sent Date</label>
          <input
            type="date"
            value={sentDate}
            onChange={e => setSentDate(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-black"
          />
        </div>

        {/* Selected image */}
        {selectedImage && (
          <div className="flex items-center gap-3 p-2 rounded border border-gray-200 bg-white">
            <img src={selectedImage.thumbnail || selectedImage.url} alt="" className="w-12 h-12 rounded object-cover" />
            <div className="flex-1 text-xs text-gray-600 truncate">{selectedImage.title}</div>
            <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs p-2 rounded bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={saveToNotion}
          disabled={saving || saved}
          className={`w-full py-2.5 rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-white ${
            saved ? 'bg-emerald-600' : 'bg-black hover:bg-gray-800'
          }`}
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Saving to Notion...</>
          ) : saved ? (
            <><Check size={14} /> Saved to Notion</>
          ) : (
            <><Save size={14} /> Save to Notion as Draft</>
          )}
        </button>
      </div>

      {/* Preview */}
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">LinkedIn Preview</label>
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          {/* LinkedIn header */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
              BK
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Benjamin Knight</div>
              <div className="text-xs text-gray-500">Founder, THE CONTAINED</div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {content || <span className="text-gray-400 italic">Your post content will appear here...</span>}
            </p>
          </div>

          {/* Image */}
          {selectedImage && (
            <div className="w-full aspect-[1.91/1] relative">
              <img
                src={selectedImage.url || selectedImage.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* LinkedIn engagement row */}
          <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Like</span>
            <span>Comment</span>
            <span>Repost</span>
            <span>Send</span>
          </div>
        </div>
      </div>
    </div>
  );
}
