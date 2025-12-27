export interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  comment?: string;
  nullable: boolean;
}

export interface Table {
  id: string; // usually the table name
  name: string;
  columns: Column[];
  rawSql?: string;
}

export interface Relationship {
  source: string; // source table id
  target: string; // target table id
  label?: string; // e.g. column name
}

export interface SchemaData {
  tables: Table[];
  relationships: Relationship[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}