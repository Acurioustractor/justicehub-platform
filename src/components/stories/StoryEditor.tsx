'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from './RichTextEditor';
import { MediaUploader } from './MediaUploader';
import { PrivacySelector } from './PrivacySelector';
import { 
  Save, 
  Eye, 
  X, 
  Plus,
  Image as ImageIcon,
  FileText,
  Shield,
  Tag as TagIcon,
  Loader2
} from 'lucide-react';

interface StoryEditorProps {
  story?: any; // Existing story for editing
  onSave: (data: any) => void;
  isSubmitting?: boolean;
  mode: 'create' | 'edit';
}

export function StoryEditor({ story, onSave, isSubmitting = false, mode }: StoryEditorProps) {
  const [title, setTitle] = useState(story?.title || '');
  const [content, setContent] = useState(story?.content || '');
  const [storyType, setStoryType] = useState(story?.storyType || 'reflection');
  const [visibility, setVisibility] = useState(story?.visibility || 'private');
  const [tags, setTags] = useState<string[]>(story?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<Array<{file: File; url: string; key: string}>>([]);
  const [existingMedia, setExistingMedia] = useState(story?.media || []);
  const [isDraft, setIsDraft] = useState(!story?.published);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tagInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!content.trim()) {
      newErrors.content = 'Story content is required';
    }
    if (content.trim().split(/\s+/).length < 50) {
      newErrors.content = 'Story should be at least 50 words';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    // Prepare media data with uploaded URLs
    const mediaData = uploadedMedia.map(item => ({
      url: item.url,
      key: item.key,
      name: item.file.name,
      size: item.file.size,
      type: item.file.type
    }));

    const storyData = {
      title,
      content,
      storyType,
      visibility,
      tags,
      published: publish,
      media: mediaData.length > 0 ? mediaData : undefined,
    };

    onSave(storyData);
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  return (
    <div className="p-6">
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Story Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story a meaningful title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Story Type */}
          <div>
            <Label htmlFor="story-type">Story Type</Label>
            <Select value={storyType} onValueChange={setStoryType}>
              <SelectTrigger id="story-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reflection">Reflection</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="challenge">Challenge</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
                <SelectItem value="goal">Goal</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Editor */}
          <div>
            <Label>Story Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Share your story here..."
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="text-sm text-red-500 mt-1">{errors.content}</p>
            )}
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{wordCount} words</span>
              <span>~{readingTime} min read</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                ref={tagInputRef}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tags to help others find your story"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="pl-3 pr-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <MediaUploader
            onMediaAdd={setMedia}
            onMediaUploaded={(uploadedFiles) => {
              setUploadedMedia(prev => [...prev, ...uploadedFiles]);
            }}
            existingMedia={existingMedia}
            onExistingMediaRemove={(id) => {
              setExistingMedia(existingMedia.filter((m: any) => m.id !== id));
            }}
            uploadType="story_media"
            autoUpload={true}
          />
          {uploadedMedia.length > 0 && (
            <Alert>
              <AlertDescription>
                {uploadedMedia.length} file(s) uploaded successfully and will be attached to your story.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <PrivacySelector
            visibility={visibility}
            onChange={setVisibility}
          />
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your privacy settings determine who can see your story. You can change these settings at any time.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <article className="prose prose-lg dark:prose-invert max-w-none">
                <h1>{title || 'Untitled Story'}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>{new Date().toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{readingTime} min read</span>
                  <span>·</span>
                  <span className="capitalize">{storyType}</span>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div
                  dangerouslySetInnerHTML={{ __html: content || '<p>Your story content will appear here...</p>' }}
                />
              </article>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Publish Story
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}