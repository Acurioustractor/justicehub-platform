import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('📝 Creating Unified Stories Editor\n');

// Read the blog editor
const blogEditorPath = join(process.cwd(), 'src/app/admin/blog/new/page.tsx');
let editorContent = readFileSync(blogEditorPath, 'utf-8');

console.log('1️⃣ Copying blog editor to stories editor...');

// Replace all references to blog_posts with articles
editorContent = editorContent.replace(/blog_posts/g, 'articles');

// Replace navigation paths
editorContent = editorContent.replace(/\/admin\/blog/g, '/admin/stories');
editorContent = editorContent.replace(/Back to Blog Posts/g, 'Back to Stories');

// Update title and description
editorContent = editorContent.replace('Write New Story', 'Write New Content');
editorContent = editorContent.replace(/Blog post/g, 'Story');
editorContent = editorContent.replace(/blog post/g, 'story');

// Update URL slug preview
editorContent = editorContent.replace('/blog/{formData.slug', '/stories/{formData.slug');

// Update form data to match articles table
const formDataPattern = /const \[formData, setFormData\] = useState\({[\s\S]*?}\);/;
const newFormData = `const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    featured_image_caption: '', // NEW from blog_posts
    status: 'draft' as 'draft' | 'published',
    tags: [] as string[],
    categories: [] as string[], // NEW from blog_posts
    category: '', // Existing in articles
    seo_title: '', // articles uses seo_title
    seo_description: '', // articles uses seo_description
  });`;

editorContent = editorContent.replace(formDataPattern, newFormData);

// Update categories handling
const categoriesAddition = `
  // Handle category management (same as tags)
  const [currentCategory, setCurrentCategory] = useState('');

  const handleAddCategory = () => {
    if (currentCategory && !formData.categories.includes(currentCategory)) {
      setFormData({
        ...formData,
        categories: [...formData.categories, currentCategory],
        category: formData.categories.length === 0 ? currentCategory : formData.category, // First category becomes primary
      });
      setCurrentCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    const newCategories = formData.categories.filter(c => c !== cat);
    setFormData({
      ...formData,
      categories: newCategories,
      category: formData.category === cat ? (newCategories[0] || '') : formData.category, // Update primary if removed
    });
  };`;

// Insert after the tag handlers
editorContent = editorContent.replace(
  /(const handleRemoveTag[\s\S]*?};)/,
  `$1${categoriesAddition}`
);

console.log('2️⃣ Adding articles-specific fields...');

// Create the directory
const storiesDir = join(process.cwd(), 'src/app/admin/stories/new');
mkdirSync(storiesDir, { recursive: true });

// Write the new file
const storiesEditorPath = join(storiesDir, 'page.tsx');
writeFileSync(storiesEditorPath, editorContent, 'utf-8');

console.log(`✅ Created: ${storiesEditorPath}\n`);

console.log('📋 Manual steps needed:');
console.log('1. Add featured_image_caption field to the form');
console.log('2. Add categories field UI (similar to tags)');
console.log('3. Add SEO fields (seo_title, seo_description)');
console.log('4. Test saving to articles table');
console.log('\n✨ Base editor created! Now run the dev server to test.');
