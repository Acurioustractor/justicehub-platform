# Integration Patch for Existing Story Editor
## Modify /admin/stories/new/page.tsx to Receive Transcript Data

## Add this code to your existing `/src/app/admin/stories/new/page.tsx`

### 1. Add Import (at top of file, around line 6)

```typescript
import { useEffect } from 'react'; // If not already imported
```

### 2. Add useEffect Hook (after line 105, where state is defined)

Add this code right after your state definitions and before the first function:

```typescript
// NEW: Check if coming from transcript flow
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('from') === 'transcript') {
    const storedData = localStorage.getItem('extracted_story_data');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);

        // Build content from extracted data
        let content = `<h2>Story Background</h2>
<p><strong>Storyteller:</strong> ${data.storytellerName || 'Unknown'}</p>
<p><strong>Contact:</strong> ${data.storytellerContact || ''}</p>
${data.interviewDate ? `<p><strong>Interview Date:</strong> ${new Date(data.interviewDate).toLocaleDateString()}</p>` : ''}

<h2>Key Quotes from Interview</h2>
<p><em>These quotes were extracted by AI. Use them to craft your narrative. Each quote is labeled with its theme.</em></p>

`;

        // Group quotes by theme
        const quotesByTheme: Record<string, any[]> = {};
        data.quotes?.forEach((quote: any) => {
          if (!quotesByTheme[quote.theme]) {
            quotesByTheme[quote.theme] = [];
          }
          quotesByTheme[quote.theme].push(quote);
        });

        // Add quotes organized by theme
        Object.entries(quotesByTheme).forEach(([theme, quotes]) => {
          content += `<h3>${theme}</h3>\n`;
          quotes.slice(0, 5).forEach((quote: any) => {
            content += `<blockquote>"${quote.text}"</blockquote>\n`;
          });
        });

        // Add themes section
        if (data.themes && data.themes.length > 0) {
          content += `\n<h2>Key Themes Identified</h2>\n<ul>\n`;
          data.themes.forEach((theme: any) => {
            content += `<li><strong>${theme.name}:</strong> ${theme.description}</li>\n`;
          });
          content += `</ul>\n`;
        }

        // Add case studies section
        if (data.case_studies && data.case_studies.length > 0) {
          content += `\n<h2>Case Studies to Develop</h2>\n`;
          data.case_studies.forEach((cs: any) => {
            content += `<h3>${cs.title}</h3>\n`;
            content += `<p>${cs.description}</p>\n`;
            if (cs.key_points && cs.key_points.length > 0) {
              content += `<ul>\n`;
              cs.key_points.forEach((point: string) => {
                content += `<li>${point}</li>\n`;
              });
              content += `</ul>\n`;
            }
          });
        }

        // Add writing guidance
        content += `\n<hr>\n<h2>Writing Guidelines</h2>
<p><strong>Structure:</strong></p>
<ul>
<li>Start with a powerful scene or quote from above</li>
<li>Build narrative around quotes (60%) + direct quotes (40%)</li>
<li>Use case studies as section anchors</li>
<li>Show community expertise vs. system failures</li>
<li>End with storyteller's vision / what's needed</li>
</ul>

<p><strong>Style:</strong></p>
<ul>
<li>Literary journalism (scene-based, not abstract)</li>
<li>Use storyteller's EXACT words for quotes</li>
<li>No deficit framing or pity narratives</li>
<li>Specific examples, not generalizations</li>
</ul>

<hr>
<p><em>Delete these guidelines and start writing your story below...</em></p>

`;

        // Pre-fill form with generated content
        setFormData(prev => ({
          ...prev,
          title: `${data.storytellerName}'s Story`,
          content: content,
          excerpt: `${data.storytellerName} shares their experience and expertise...`,
        }));

        // Clear stored data
        localStorage.removeItem('extracted_story_data');

        console.log('✅ Loaded transcript data into editor');
      } catch (error) {
        console.error('Failed to load transcript data:', error);
      }
    }
  }
}, []); // Empty dependency array - run once on mount
```

### Location in File

Add this code after your state definitions (around line 105) and before your first function (handleTitleChange).

The structure should look like:

```typescript
export default function UnifiedStoriesEditor() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // ... other state variables ...

  // ✅ ADD THE useEffect HERE ✅

  // Calculate stats
  const wordCount = formData.content
    .replace(/<[^>]*>/g, ' ')
    ...
```

---

## Alternative: Complete Modified Section

If you prefer, here's the complete section with the useEffect added:

```typescript
export default function UnifiedStoriesEditor() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    featured_image_caption: '',
    status: 'draft' as 'draft' | 'published',
    tags: [] as string[],
    categories: [] as string[],
    category: '',
    seo_title: '',
    seo_description: '',
  });
  const [currentTag, setCurrentTag] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const editorRef = useRef<any>(null);

  // ===== ADD THIS useEffect =====
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'transcript') {
      const storedData = localStorage.getItem('extracted_story_data');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);

          let content = `<h2>Story Background</h2>
<p><strong>Storyteller:</strong> ${data.storytellerName || 'Unknown'}</p>
<p><strong>Contact:</strong> ${data.storytellerContact || ''}</p>

<h2>Key Quotes from Interview</h2>
`;
          const quotesByTheme: Record<string, any[]> = {};
          data.quotes?.forEach((quote: any) => {
            if (!quotesByTheme[quote.theme]) {
              quotesByTheme[quote.theme] = [];
            }
            quotesByTheme[quote.theme].push(quote);
          });

          Object.entries(quotesByTheme).forEach(([theme, quotes]) => {
            content += `<h3>${theme}</h3>\n`;
            quotes.slice(0, 5).forEach((quote: any) => {
              content += `<blockquote>"${quote.text}"</blockquote>\n`;
            });
          });

          if (data.themes?.length > 0) {
            content += `\n<h2>Key Themes</h2>\n<ul>\n`;
            data.themes.forEach((theme: any) => {
              content += `<li><strong>${theme.name}:</strong> ${theme.description}</li>\n`;
            });
            content += `</ul>\n`;
          }

          if (data.case_studies?.length > 0) {
            content += `\n<h2>Case Studies</h2>\n`;
            data.case_studies.forEach((cs: any) => {
              content += `<h3>${cs.title}</h3>\n<p>${cs.description}</p>\n`;
              if (cs.key_points?.length > 0) {
                content += `<ul>\n`;
                cs.key_points.forEach((point: string) => {
                  content += `<li>${point}</li>\n`;
                });
                content += `</ul>\n`;
              }
            });
          }

          content += `\n<hr>\n<p><em>Delete these guidelines and start writing below...</em></p>\n`;

          setFormData(prev => ({
            ...prev,
            title: `${data.storytellerName}'s Story`,
            content: content,
          }));

          localStorage.removeItem('extracted_story_data');
          console.log('✅ Loaded transcript data into editor');
        } catch (error) {
          console.error('Failed to load transcript data:', error);
        }
      }
    }
  }, []);
  // ===== END OF ADDED CODE =====

  // Calculate stats
  const wordCount = formData.content
    .replace(/<[^>]*>/g, ' ')
    // ... rest of existing code ...
```

---

## Test the Integration

1. **Navigate to transcript page:**
   http://localhost:3000/admin/stories/transcript

2. **Enter storyteller info and paste transcript**

3. **Click "Extract Quotes with AI"**

4. **Review extracted data**

5. **Click "Create Story with These Quotes"**

6. **You should land on `/admin/stories/new` with pre-filled content!**

---

## Troubleshooting

**Content not pre-filling:**
- Check browser console for errors
- Verify localStorage has data: `localStorage.getItem('extracted_story_data')`
- Make sure URL has `?from=transcript` parameter

**useEffect running multiple times:**
- This is normal in React dev mode (Strict Mode)
- The localStorage clear prevents duplicate loads

**TypeScript errors:**
- Add type annotations if needed: `data: any`
- Or define proper interfaces for the extracted data structure

---

## Clean Up (Optional)

After testing, you can:
1. Extract the useEffect logic into a custom hook
2. Add loading state while processing
3. Add error handling for malformed data

Example custom hook:

```typescript
// hooks/useTranscriptData.ts
export function useTranscriptData(setFormData: Function) {
  useEffect(() => {
    // ... logic above ...
  }, [setFormData]);
}

// Then in component:
import { useTranscriptData } from '@/hooks/useTranscriptData';
useTranscriptData(setFormData);
```

---

**Integration complete!** The story editor now receives and displays AI-extracted data from transcripts.
