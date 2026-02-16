export interface CellData {
  id: string;
  value: string;
}

export interface RowData {
  id: string;
  cells: { [columnId: string]: CellData };
  height?: number;
}

export interface ColumnData {
  id: string;
  title: string;
  width?: number;
}

export interface TableData {
  id: string;
  title: string;
  columns: ColumnData[];
  rows: RowData[];
}

export interface Layer {
  id: string;
  title: string;
  description: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  tables: TableData[];
}

export interface Category {
  id: string;
  title: string;
  layers: Layer[];
}

export interface SidebarItem {
  id: string;
  title: string;
  categories: Category[];
}

export interface AppState {
  projectTitle: string;
  sidebarItems: SidebarItem[];
  activeSidebarItemId: string | null;
  activeCategoryId: string | null;
}
