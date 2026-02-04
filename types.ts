
export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind bg class
  isPinned?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  author?: string;
  updatedAt: number;
  categories: string[]; 
  isPinned: boolean;
  color?: string;
}

export type ViewMode = 'grid' | 'list';

export type ThemeColor = 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'cyan' | 'blue' | 'indigo' | 'violet' | 'pink' | 'gray';

export type NoteAction = 'create' | 'edit' | 'delete' | 'summarize' | 'improve' | 'translate' | 'verify';

export type SortOption = 'newest' | 'oldest' | 'az' | 'za';

export interface AISuggestion {
  summary?: string;
  improvedText?: string;
  suggestedTitle?: string;
  translatedText?: string;
  suggestedCategories: string[];
  newCategoryRecommendation?: string;
}
