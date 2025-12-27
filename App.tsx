import React, { useState, useEffect } from 'react';
import { SqlEditor } from './components/SqlEditor';
import { ErdDiagram } from './components/ErdDiagram';
import { TableDetails } from './components/TableDetails';
import { AiAssistant } from './components/AiAssistant';
import { parseSqlToSchema } from './utils/sqlParser';
import { SchemaData, Table } from './types';
import { LayoutGrid, AlertCircle } from 'lucide-react';

const DEFAULT_SQL = `
CREATE TABLE \`users\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) NOT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
);

CREATE TABLE \`posts\` (
  \`id\` bigint NOT NULL AUTO_INCREMENT,
  \`user_id\` int NOT NULL COMMENT 'Author of the post',
  \`title\` varchar(255) NOT NULL,
  \`body\` text,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
);

CREATE TABLE \`comments\` (
  \`id\` bigint NOT NULL AUTO_INCREMENT,
  \`post_id\` bigint NOT NULL,
  \`user_id\` int NOT NULL,
  \`content\` text NOT NULL,
  PRIMARY KEY (\`id\`)
);
`;

const App: React.FC = () => {
  const [sqlInput, setSqlInput] = useState<string>(DEFAULT_SQL);
  const [schemaData, setSchemaData] = useState<SchemaData>({ tables: [], relationships: [] });
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleParse = () => {
    try {
      if (!sqlInput.trim()) {
        setNotification("Please enter some SQL to parse.");
        return;
      }
      const data = parseSqlToSchema(sqlInput);
      setSchemaData(data);
      setSelectedTable(null);
      if (data.tables.length === 0) {
        setNotification("No tables found. Check your SQL syntax.");
      } else {
        setNotification(null);
      }
    } catch (error) {
      console.error(error);
      setNotification("Error parsing SQL.");
    }
  };

  const handleClear = () => {
    setSqlInput('');
    setSchemaData({ tables: [], relationships: [] });
    setSelectedTable(null);
  };

  // Initial parse on load
  useEffect(() => {
    handleParse();
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center px-6 justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <LayoutGrid size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white">
            Schema<span className="text-brand-400">Weaver</span> AI
          </h1>
        </div>
        <div className="flex items-center gap-4">
             {notification && (
               <div className="flex items-center gap-2 text-amber-400 text-sm animate-pulse">
                 <AlertCircle size={14} />
                 <span>{notification}</span>
               </div>
             )}
            <a href="https://tableplus.com/" target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Optimized for TablePlus Exports
            </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: Editor */}
        <div className="w-1/3 min-w-[350px] max-w-[600px] h-full flex flex-col z-10 shadow-xl">
          <SqlEditor 
            value={sqlInput} 
            onChange={setSqlInput} 
            onParse={handleParse} 
            onClear={handleClear}
          />
        </div>

        {/* Right Pane: Visualization */}
        <div className="flex-1 relative bg-slate-950">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
                    backgroundSize: '24px 24px' 
                }} 
            />
            
            <ErdDiagram 
              data={schemaData} 
              onNodeClick={setSelectedTable} 
            />

            {/* Floating Details Panel */}
            <TableDetails 
              table={selectedTable} 
              onClose={() => setSelectedTable(null)} 
            />
            
            {/* Gemini Assistant Overlay */}
            <AiAssistant schema={schemaData} />
        </div>
      </main>
    </div>
  );
};

export default App;