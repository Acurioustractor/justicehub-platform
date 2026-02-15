/**
 * TypeScript interfaces for Rich Text Editor
 */

export interface EditorExtensions {
  // Core formatting
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  
  // Structure
  headings: [1, 2, 3];
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  
  // Media
  image: boolean;
  video: boolean;
  link: boolean;
  
  // Custom
  mediaEmbed: boolean;
  autoSave: boolean;
  characterCount: boolean;
  placeholder: boolean;
}

export interface RichTextEditorConfig {
  extensions: Partial<EditorExtensions>;
  maxCharacters?: number;
  autoSaveInterval?: number; // in milliseconds
  placeholder?: string;
  readOnly?: boolean;
}

export interface EditorContent {
  text: string;
  html: string;
  json?: any; // ProseMirror JSON format
  characterCount: number;
  wordCount: number;
}

export interface AutoSaveState {
  lastSaved: Date | null;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

export interface EditorToolbarConfig {
  showFormatting: boolean;
  showHeadings: boolean;
  showLists: boolean;
  showMedia: boolean;
  showHistory: boolean;
  customButtons?: ToolbarButton[];
}

export interface ToolbarButton {
  id: string;
  label: string;
  icon: React.ComponentType;
  action: () => void;
  isActive?: () => boolean;
  isDisabled?: () => boolean;
  tooltip?: string;
}

export interface MediaUploadConfig {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  uploadEndpoint: string;
  compressionQuality?: number;
}

export interface EditorCallbacks {
  onContentChange?: (content: EditorContent) => void;
  onAutoSave?: (content: EditorContent) => Promise<void>;
  onMediaUpload?: (file: File) => Promise<string>;
  onError?: (error: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}