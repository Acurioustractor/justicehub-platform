'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface NovelEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImageUpload?: () => void;
  placeholder?: string;
}

export default function NovelEditor({ content, onChange, onImageUpload, placeholder }: NovelEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your story here... Type "/" for commands',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            onImageUpload?.();
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            onImageUpload?.();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Convert editor content to markdown
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Update editor when content changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border-2 border-black focus-within:ring-2 focus-within:ring-black">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b-2 border-black">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-black text-white'
              : 'bg-white hover:bg-gray-100'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-black text-white'
              : 'bg-white hover:bg-gray-100'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-black text-white'
              : 'bg-white hover:bg-gray-100'
          }`}
        >
          H3
        </button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('bold') ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('italic') ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('strike') ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
          }`}
        >
          <s>S</s>
        </button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('bulletList') ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('orderedList') ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
          }`}
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('blockquote') ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
          }`}
        >
          " Quote
        </button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-black ${
            editor.isActive('link') ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
          }`}
        >
          🔗 Link
        </button>
        <button
          type="button"
          onClick={onImageUpload}
          className="px-3 py-1.5 text-sm font-bold border-2 border-black bg-green-100 hover:bg-green-200"
        >
          🖼️ Image
        </button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-3 py-1.5 text-sm font-bold border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-50"
        >
          ↶ Undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-3 py-1.5 text-sm font-bold border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-50"
        >
          ↷ Redo
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white" />

      {/* Helper Text */}
      <div className="p-2 bg-blue-50 border-t-2 border-black text-xs text-blue-900">
        <strong>✨ Tips:</strong> Drag & drop images • Paste images • Use toolbar for formatting • Keyboard shortcuts: Cmd+B (bold), Cmd+I (italic)
      </div>
    </div>
  );
}
