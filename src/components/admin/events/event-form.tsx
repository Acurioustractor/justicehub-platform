'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Calendar, MapPin, Upload, X, Video, Link as LinkIcon, Eye, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

// Dynamically import the editor
const NovelEditor = dynamic(() => import('@/components/NovelEditor'), {
    ssr: false,
    loading: () => <div className="p-8 text-center text-gray-500">Loading editor...</div>
});

export interface EventFormData {
    id?: string;
    title: string;
    slug: string;
    description: string; // Rich text content
    event_type: string;
    start_date: string;
    end_date: string;
    location_name: string;
    location_address: string;
    location_state: string;
    latitude?: number;
    longitude?: number;
    featured_image_url: string;
    video_url?: string;
    gallery_urls?: string[];
    max_attendees?: number;
    is_public: boolean;
    is_featured: boolean;
    registration_url?: string; // External registration link if needed
}

interface EventFormProps {
    initialData?: EventFormData;
    isDid?: boolean;
}

export function EventForm({ initialData }: EventFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState<EventFormData>(initialData || {
        title: '',
        slug: '',
        description: '',
        event_type: 'community',
        start_date: '',
        end_date: '',
        location_name: '',
        location_address: '',
        location_state: 'NSW',
        featured_image_url: '',
        video_url: '',
        is_public: true,
        is_featured: false,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<any>(null);

    // Auto-generate slug from title if not manually set
    useEffect(() => {
        if (!initialData && formData.title && !formData.slug) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setFormData(prev => ({ ...prev, slug: `${slug}-${new Date().getFullYear()}` }));
        }
    }, [formData.title, formData.slug, initialData]);

    // Handle Image Upload
    const handleImageUpload = async (file?: File) => {
        if (!file) {
            fileInputRef.current?.click();
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('folder', 'events');

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: uploadFormData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();

            // If uploading via the featured image button
            if (document.activeElement?.getAttribute('name') === 'featured_upload') {
                setFormData(prev => ({ ...prev, featured_image_url: data.url }));
            } else if (editorRef.current) {
                // If uploading via editor
                editorRef.current.chain().focus().setImage({ src: data.url, alt: 'Event Image' }).run();
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.slug) {
            alert('Title and Slug are required');
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();

            // Prepare data for DB
            const dbData = {
                ...formData,
                // Convert empty strings to null for optional fields if needed, 
                // though Supabase handles types well usually.
            };

            const { error } = await supabase
                .from('events')
                .upsert(dbData)
                .select()
                .single();

            if (error) throw error;

            alert('Event saved successfully!');
            router.push('/admin/events');
            router.refresh();
        } catch (error: any) {
            console.error('Error saving event:', error);
            alert(`Error saving event: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
                {/* Basic Info */}
                <div className="bg-white border-2 border-black p-6 shadow-sm">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                        <span className="bg-black text-white px-2 py-1 text-sm">1</span> Basic Details
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Event Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-bold text-lg"
                                placeholder="e.g. Annual Community Dinner"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Slug *</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Event Type</label>
                                <select
                                    value={formData.event_type}
                                    onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                                    className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none"
                                >
                                    <option value="community">Community Event</option>
                                    <option value="launch">Launch</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="vip">VIP Dinner</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Editor */}
                <div className="bg-white border-2 border-black p-6 shadow-sm">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                        <span className="bg-black text-white px-2 py-1 text-sm">2</span> Description
                    </h2>
                    <div className="border-2 border-gray-200 min-h-[400px]">
                        <NovelEditor
                            content={formData.description}
                            onChange={(content) => setFormData({ ...formData, description: content })}
                            onImageUpload={() => fileInputRef.current?.click()}
                            onInsertImage={(editor) => { editorRef.current = editor; fileInputRef.current?.click(); }}
                            placeholder="Describe the event..."
                        />
                    </div>
                </div>

                {/* Media */}
                <div className="bg-white border-2 border-black p-6 shadow-sm">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                        <span className="bg-black text-white px-2 py-1 text-sm">3</span> Multimedia
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4" /> Video URL
                            </label>
                            <input
                                type="text"
                                value={formData.video_url || ''}
                                onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                                className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none"
                                placeholder="https://vimeo.com/..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Supports YouTube, Vimeo, or MP4 links.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Featured Image
                            </label>

                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={formData.featured_image_url || ''}
                                        onChange={e => setFormData({ ...formData, featured_image_url: e.target.value })}
                                        className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none mb-2"
                                        placeholder="https://..."
                                    />
                                    <button
                                        type="button"
                                        name="featured_upload"
                                        onClick={() => {
                                            // Hacky way to ensure we know which upload triggered this
                                            // ideally use a separate handler or state, but this works for now with the generic handler
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = async (e: any) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setUploading(true);
                                                    try {
                                                        const uploadFormData = new FormData();
                                                        uploadFormData.append('file', file);
                                                        uploadFormData.append('folder', 'events/featured');
                                                        const res = await fetch('/api/upload-image', { method: 'POST', body: uploadFormData });
                                                        const data = await res.json();
                                                        setFormData(prev => ({ ...prev, featured_image_url: data.url }));
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Upload failed');
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }
                                            };
                                            input.click();
                                        }}
                                        disabled={uploading}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold text-sm flex items-center gap-2"
                                    >
                                        <Upload className="w-4 h-4" /> Upload Image
                                    </button>
                                </div>
                                {formData.featured_image_url && (
                                    <div className="w-32 h-24 bg-gray-100 border border-gray-300 relative overflow-hidden">
                                        <img src={formData.featured_image_url} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Actions */}
                <div className="bg-white border-2 border-black p-6 shadow-sm sticky top-6">
                    <h3 className="font-black text-lg mb-4">Publishing</h3>

                    <div className="space-y-4 mb-6">
                        <label className="flex items-center gap-3 p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_public}
                                onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                                className="w-5 h-5 text-black"
                            />
                            <div>
                                <span className="block font-bold">Publicly Visible</span>
                                <span className="text-xs text-gray-500">Visible to users (enables RLS)</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_featured}
                                onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                                className="w-5 h-5 text-black"
                            />
                            <div>
                                <span className="block font-bold">Featured / Listed</span>
                                <span className="text-xs text-gray-500">Show in main event lists</span>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-black text-white font-black text-lg hover:bg-gray-800 flex items-center justify-center gap-2"
                    >
                        {saving ? 'Saving...' : (
                            <>
                                <Save className="w-5 h-5" /> Save Event
                            </>
                        )}
                    </button>
                </div>

                {/* Date & Time */}
                <div className="bg-white border-2 border-black p-6 shadow-sm">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" /> Schedule
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Start Date/Time</label>
                            <input
                                type="datetime-local"
                                value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''}
                                onChange={e => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })}
                                className="w-full p-2 border-2 border-gray-200 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">End Date/Time</label>
                            <input
                                type="datetime-local"
                                value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''}
                                onChange={e => setFormData({ ...formData, end_date: new Date(e.target.value).toISOString() })}
                                className="w-full p-2 border-2 border-gray-200 bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white border-2 border-black p-6 shadow-sm">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" /> Location
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Venue Name</label>
                            <input
                                type="text"
                                value={formData.location_name}
                                onChange={e => setFormData({ ...formData, location_name: e.target.value })}
                                className="w-full p-2 border-2 border-gray-200"
                                placeholder="e.g. Town Hall"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Address</label>
                            <textarea
                                value={formData.location_address}
                                onChange={e => setFormData({ ...formData, location_address: e.target.value })}
                                className="w-full p-2 border-2 border-gray-200 h-20"
                                placeholder="Full address..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">State</label>
                            <select
                                value={formData.location_state}
                                onChange={e => setFormData({ ...formData, location_state: e.target.value })}
                                className="w-full p-2 border-2 border-gray-200"
                            >
                                <option value="NSW">NSW</option>
                                <option value="VIC">VIC</option>
                                <option value="QLD">QLD</option>
                                <option value="ACT">ACT</option>
                                <option value="WA">WA</option>
                                <option value="SA">SA</option>
                                <option value="TAS">TAS</option>
                                <option value="NT">NT</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden inputs for editor */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
