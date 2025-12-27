import React from 'react';
import { Table, Column } from '../types';
import { X, Key, GitCommit, FileText } from 'lucide-react';

interface TableDetailsProps {
  table: Table | null;
  onClose: () => void;
}

export const TableDetails: React.FC<TableDetailsProps> = ({ table, onClose }) => {
  if (!table) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur shadow-2xl border-l border-slate-800 flex flex-col transform transition-transform duration-300 z-20">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div>
           <h3 className="text-lg font-bold text-white break-all">{table.name}</h3>
           <span className="text-xs text-slate-500 font-mono">TABLE</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
            <h4 className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Columns</h4>
            <div className="space-y-2">
                {table.columns.map((col: Column, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/50 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                            {col.isPrimaryKey && <Key size={12} className="text-yellow-500" />}
                            {col.isForeignKey && <GitCommit size={12} className="text-purple-400" />}
                            <span className={`font-mono text-sm ${col.isPrimaryKey ? 'text-white font-bold' : 'text-slate-300'}`}>
                                {col.name}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                             <span className="text-xs text-brand-600/80 font-mono">{col.type}</span>
                             <span className="text-[10px] text-slate-600 uppercase">{col.nullable ? 'NULL' : 'NOT NULL'}</span>
                        </div>
                        {col.comment && (
                            <div className="mt-2 text-xs text-slate-500 italic border-l-2 border-slate-800 pl-2">
                                {col.comment}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};