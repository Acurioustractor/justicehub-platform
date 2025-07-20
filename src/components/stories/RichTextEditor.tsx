'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote,
  Link as LinkIcon,
  Heading2,
  Heading3,
  Undo,
  Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start writing your story...', 
  className 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUserInput = useRef(true);

  useEffect(() => {
    if (editorRef.current && !isUserInput.current) {
      editorRef.current.innerHTML = content;
    }
    isUserInput.current = false;
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      isUserInput.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      executeCommand('insertText', '    ');
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void; 
    icon: any; 
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 dark:bg-gray-800 p-2 flex items-center gap-1 flex-wrap">
        <ToolbarButton 
          onClick={() => executeCommand('undo')} 
          icon={Undo} 
          title="Undo" 
        />
        <ToolbarButton 
          onClick={() => executeCommand('redo')} 
          icon={Redo} 
          title="Redo" 
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton 
          onClick={() => executeCommand('formatBlock', 'h2')} 
          icon={Heading2} 
          title="Heading 2" 
        />
        <ToolbarButton 
          onClick={() => executeCommand('formatBlock', 'h3')} 
          icon={Heading3} 
          title="Heading 3" 
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton 
          onClick={() => executeCommand('bold')} 
          icon={Bold} 
          title="Bold" 
        />
        <ToolbarButton 
          onClick={() => executeCommand('italic')} 
          icon={Italic} 
          title="Italic" 
        />
        <ToolbarButton 
          onClick={() => executeCommand('underline')} 
          icon={Underline} 
          title="Underline" 
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton 
          onClick={() => executeCommand('insertUnorderedList')} 
          icon={List} 
          title="Bullet List" 
        />
        <ToolbarButton 
          onClick={() => executeCommand('insertOrderedList')} 
          icon={ListOrdered} 
          title="Numbered List" 
        />
        <ToolbarButton 
          onClick={() => executeCommand('formatBlock', 'blockquote')} 
          icon={Quote} 
          title="Quote" 
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton 
          onClick={insertLink} 
          icon={LinkIcon} 
          title="Insert Link" 
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-h-[400px] p-4 focus:outline-none prose prose-lg dark:prose-invert max-w-none",
          "prose-p:my-3 prose-headings:mt-6 prose-headings:mb-4",
          "prose-ul:my-3 prose-ol:my-3 prose-li:my-1",
          "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4",
          "[&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-gray-400"
        )}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}