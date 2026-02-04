
import React, { useState, useMemo } from 'react';
import { Category, ThemeColor } from '../types';
import { THEME_CONFIG } from '../App';
import { ConfirmDialog } from './ConfirmDialog';

interface CategoryEditorProps {
  category: Category;
  existingCategories: Category[];
  currentTheme?: ThemeColor;
  pinnedCount?: number;
  onSave: (id: string, name: string, color: string, isPinned: boolean) => void;
  onCancel: () => void;
  onDelete?: (category: Category) => void;
}

export const CATEGORY_COLORS = [
  { name: 'Červená', class: 'bg-rose-500' },
  { name: 'Oranžová', class: 'bg-orange-500' },
  { name: 'Jantarová', class: 'bg-amber-500' },
  { name: 'Žlutá', class: 'bg-yellow-500' },
  { name: 'Limetková', class: 'bg-lime-500' },
  { name: 'Zelená', class: 'bg-emerald-500' },
  { name: 'Tyrkysová', class: 'bg-cyan-500' },
  { name: 'Modrá', class: 'bg-blue-500' },
  { name: 'Indigo', class: 'bg-indigo-500' },
  { name: 'Fialová', class: 'bg-violet-500' },
  { name: 'Růžová', class: 'bg-fuchsia-500' },
  { name: 'Šedá', class: 'bg-slate-500' },
];

export const CategoryEditor: React.FC<CategoryEditorProps> = ({ category, existingCategories, currentTheme = 'blue', pinnedCount = 0, onSave, onCancel, onDelete }) => {
  const [name, setName] = useState(category.name);
  const [selectedColor, setSelectedColor] = useState(category.color);
  const [isPinned, setIsPinned] = useState(category.isPinned || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const theme = THEME_CONFIG[currentTheme];

  const hasChanges = useMemo(() => {
    return name.trim() !== category.name || selectedColor !== category.color || isPinned !== (category.isPinned || false);
  }, [name, selectedColor, isPinned, category]);

  const handleSave = () => { 
    const trimmedName = name.trim();
    if (!trimmedName) return;

    // Kontrola duplicity
    const isDuplicate = existingCategories.some(c => 
      c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== category.id
    );

    if (isDuplicate) {
      setError('Kategorie s tímto názvem již existuje.');
      return;
    }

    onSave(category.id, trimmedName, selectedColor, isPinned); 
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(category);
    }
  };

  const handleCancelClick = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  };

  const canPin = isPinned || pinnedCount < 5;

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleCancelClick} />
        <div className="relative bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-white/10 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              {category.id ? 'Upravit kategorii' : 'Nová kategorie'}
            </h3>
            {category.id && onDelete && (
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="inline-flex items-center justify-center p-2.5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                title="Smazat kategorii"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Název</label>
              <input 
                type="text" 
                maxLength={100}
                className={`w-full px-4 py-3 bg-gray-700 border-none rounded-2xl focus:ring-2 ${error ? 'ring-2 ring-red-500' : theme.ring} text-white font-bold h-12`} 
                value={name} 
                onChange={(e) => { setName(e.target.value); setError(null); }} 
                autoFocus 
                placeholder="Název..."
              />
              {error && <p className="text-red-500 text-[10px] font-bold mt-2 px-1 uppercase tracking-wider">{error}</p>}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPinned ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-700 text-gray-500'}`}>
                  <svg className="w-4 h-4" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white tracking-widest">Připnout kategorii</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase">Zobrazit nahoře (max. 5)</p>
                </div>
              </div>
              <button 
                type="button"
                disabled={!canPin}
                onClick={() => setIsPinned(!isPinned)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed ${isPinned ? theme.primary : 'bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPinned ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Vyberte barvu</label>
              <div className="grid grid-cols-4 gap-3">
                {CATEGORY_COLORS.map((c) => (
                  <button 
                    key={c.class} 
                    onClick={() => setSelectedColor(c.class)} 
                    className={`w-full aspect-square rounded-full border-4 transition-all inline-flex items-center justify-center ${c.class} ${selectedColor === c.class ? 'border-white scale-110 shadow-lg ring-2 ring-white/20' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}`} 
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCancelClick} className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-black rounded-2xl transition-all">Zrušit</button>
              <button onClick={handleSave} className={`flex-1 inline-flex items-center justify-center px-4 py-3 ${theme.primary} hover:${theme.hover} text-white font-black rounded-2xl transition-all shadow-lg ${theme.shadow}`}>Uložit</button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Smazat kategorii?"
          message={`Opravdu chcete smazat kategorii "${category.name}"? Poznámky s touto kategorií zůstanou zachovány, ale tato kategorie z nich bude odebrána.`}
          confirmText="Smazat"
          isDanger={true}
          currentTheme={currentTheme}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showDiscardConfirm && (
        <ConfirmDialog
          title="Opustit editor?"
          message="Máte neuložené změny v nastavení kategorie."
          confirmText="Zahodit"
          alternativeText="Uložit a zavřít"
          isDanger={true}
          currentTheme={currentTheme}
          onConfirm={onCancel}
          onCancel={() => setShowDiscardConfirm(false)}
          onAlternative={() => { setShowDiscardConfirm(false); handleSave(); }}
        />
      )}
    </>
  );
};
