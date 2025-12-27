import { SchemaData, Table, Column, Relationship } from '../types';

/**
 * Parses raw SQL Create statements (specifically TablePlus/MySQL style)
 * into a structured Schema object.
 */
export const parseSqlToSchema = (sql: string): SchemaData => {
  const tables: Table[] = [];
  const relationships: Relationship[] = [];
  
  // Clean comments that are on their own lines or block comments to simplify parsing
  // But keep inline comments for column descriptions
  let cleanSql = sql.replace(/\/\*!.*?\*\//g, ''); // Remove MySQL directives
  
  // Split by CREATE TABLE
  const tableBlocks = cleanSql.split(/CREATE TABLE/i).slice(1);

  tableBlocks.forEach((block) => {
    // Extract Table Name
    const nameMatch = block.match(/^\s*`?(\w+)`?/);
    if (!nameMatch) return;
    const tableName = nameMatch[1];

    // Extract Content inside the main parentheses
    const contentMatch = block.match(/\(([\s\S]*)\)(?=\s*ENGINE|\s*;)/i);
    // Fallback if no ENGINE specified, just look for last paren
    const content = contentMatch ? contentMatch[1] : block.substring(block.indexOf('(') + 1, block.lastIndexOf(')'));
    
    if (!content) return;

    const columns: Column[] = [];
    // Split by comma, but ignore commas inside parentheses (e.g. DECIMAL(10,0))
    const lines = content.split(/,(?![^(]*\))/);

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      // Check for constraints defined on separate lines
      if (line.toUpperCase().startsWith('PRIMARY KEY')) {
        const pkMatch = line.match(/\(`?(\w+)`?\)/);
        if (pkMatch) {
          const pkCol = columns.find(c => c.name === pkMatch[1]);
          if (pkCol) pkCol.isPrimaryKey = true;
        }
        return;
      }

      if (line.toUpperCase().startsWith('KEY') || line.toUpperCase().startsWith('UNIQUE KEY') || line.toUpperCase().startsWith('CONSTRAINT')) {
        return; // Skip index definitions for now
      }

      // Parse Column Definition
      // Example: `id` bigint NOT NULL AUTO_INCREMENT
      const colParts = line.match(/^`?(\w+)`?\s+([a-z0-9()]+)(.*)/i);
      if (colParts) {
        const colName = colParts[1];
        const colType = colParts[2];
        const rest = colParts[3];

        const isPrimaryKey = rest.toUpperCase().includes('PRIMARY KEY');
        const commentMatch = rest.match(/COMMENT\s+'([^']*)'/i);
        const comment = commentMatch ? commentMatch[1] : undefined;
        const nullable = !rest.toUpperCase().includes('NOT NULL');

        columns.push({
          name: colName,
          type: colType,
          isPrimaryKey,
          isForeignKey: false, // Will determine later
          comment,
          nullable
        });
      }
    });

    tables.push({
      id: tableName,
      name: tableName,
      columns,
      rawSql: `CREATE TABLE ${tableName} ...`
    });
  });

  // Infer Relationships
  // 1. Look for explicit foreign keys (not implemented in this simple regex parser, usually rare in export dumps compared to implicit)
  // 2. Look for implicit naming conventions: table `users`, other table has `user_id`
  // 3. Look for explicit `_id` fields that match a table name (singularized)

  tables.forEach(sourceTable => {
    sourceTable.columns.forEach(col => {
      if (col.name.endsWith('_id')) {
        // Try to find target
        // 1. exact match to table name (e.g. account_id -> accounts? no. account -> accounts)
        // Simple pluralization check
        const potentialBase = col.name.replace('_id', '');
        
        // Check for direct match (rare) or plural match
        let targetTable = tables.find(t => t.name === potentialBase);
        if (!targetTable) {
            targetTable = tables.find(t => t.name === potentialBase + 's');
        }
        if (!targetTable) {
            targetTable = tables.find(t => t.name === potentialBase + 'es');
        }

        // Special case: parent_id refers to self
        if (col.name === 'parent_id') {
           targetTable = sourceTable;
        }

        if (targetTable) {
          col.isForeignKey = true;
          relationships.push({
            source: sourceTable.id,
            target: targetTable.id,
            label: col.name
          });
        }
      }
    });
  });

  return { tables, relationships };
};