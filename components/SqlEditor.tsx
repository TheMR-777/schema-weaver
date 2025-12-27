import React from 'react';
import { Database, Play, Trash2 } from 'lucide-react';

interface SqlEditorProps {
  value: string;
  onChange: (val: string) => void;
  onParse: () => void;
  onClear: () => void;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({ value, onChange, onParse, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2 text-brand-400">
          <Database size={18} />
          <h2 className="font-semibold text-sm tracking-wide">SQL INPUT</h2>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onClear}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                title="Clear"
            >
                <Trash2 size={16} />
            </button>
            <button 
                onClick={onParse}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-all shadow-lg shadow-brand-900/20"
            >
                <Play size={12} fill="currentColor" />
                VISUALIZE
            </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <textarea
          className="w-full h-full bg-slate-900 text-slate-300 font-mono text-xs p-4 resize-none focus:outline-none focus:ring-1 focus:ring-slate-700 leading-relaxed"
          placeholder="Paste your CREATE TABLE statements here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
};