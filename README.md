# Gridwell — Modular Layout & Data Manager

A lightweight, browser-based admin panel for organizing projects with **hierarchical sidebar navigation**, **categories**, **resizable layers**, and **dynamic spreadsheet tables** — all persisted locally with zero backend.

---

## ✨ Features

### 📁 Sidebar Navigation
- Create, rename, and delete sidebar items
- **Drag-to-reorder** sidebar items with visual drop indicators
- Each sidebar item contains its own set of categories
- Searchable category selector with inline add/rename/delete
- Custom in-app confirmation modals (no browser dialogs)

### 📂 Categories
- Organize work into named categories
- Each category contains independent layers and tables
- Switch between categories with unsaved-changes warnings

### 📐 Layers
- Add an unlimited number of layers per category
- **Duplicate layers** with all tables and data cloned instantly
- Resize layers by dragging the corner handle
- Reorder layers with ▲/▼ buttons
- Editable layer title and rich-text description (with **bold** & *italic* support)
- Layers with no tables work as standalone design elements
- Delete layers with confirmation modal

### 📊 Dynamic Spreadsheet Tables
- Each layer supports **0–10 tables**
- **Duplicate tables** within a layer
- Add / remove rows and columns dynamically
- Resize column widths and row heights by dragging borders
- Rename column headers with double-click
- Edit cell values inline
- Reorder tables within a layer using ▲/▼ buttons
- Rename tables with double-click
- Delete tables with confirmation modal

### 🔍 Global Search (⌘K)
- Full-text search across **sidebar items, categories, layers, tables, and cell content**
- Keyboard navigation: ↑/↓ to select, Enter to navigate, Esc to close
- Breadcrumb trail shows the path to each result
- Type indicators with icons (📁 📂 📐 📊 🔤)
- Results limited to 20 for performance

### ↩️ Undo / Redo
- **Undo** with ⌘Z — reverts the last state change
- **Redo** with ⌘⇧Z or ⌘Y — reapplies undone changes
- History supports up to 50 steps

### 🌗 Dark Mode
- Toggle between light and dark themes
- Theme preference persisted in `localStorage`
- Full design system with CSS variables for consistent theming

### 📤 Export / Import
- **Export** the entire project as a `.json` file
- **Import** a previously exported project from a `.json` file
- Automatic data migration on import

### �️ Print / PDF Export
- Print button in toolbar + **⌘P** shortcut
- Clean print stylesheet hides sidebar, modals, and interactive controls
- Layers formatted at full-width for A4 printing
- Page breaks avoid splitting layers

### �💾 Save & Load Layouts
- Save the entire project state as a named layout
- Load any previously saved layout to restore your workspace
- Saving with the same name overwrites the previous version
- Delete saved layouts you no longer need
- All data auto-saves to `localStorage` on every change — nothing is ever lost

### ♿ Accessibility
- Comprehensive **ARIA roles** and attributes throughout (`navigation`, `dialog`, `grid`, `combobox`, `listbox`, `toolbar`)
- Keyboard-operable: category dropdown, search modal, table cells, all modals
- **Focus management** for modals and search
- Screen reader-friendly labels on all interactive elements

### ⚡ Performance
- Components wrapped in `React.memo` to prevent unnecessary re-renders
- Event handlers stabilized with `useCallback`
- Minimal bundle size with zero external runtime dependencies

### 🛡️ Data Safety
- **Auto-persistence** — every edit is saved to `localStorage` in real-time
- **Unsaved changes warnings** when switching sidebar items or categories
- **Confirmation modals** before any destructive action (delete sidebar item, category, layer, or table)
- Old data formats are automatically migrated on load

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open global search |
| `⌘S` / `Ctrl+S` | Save layout |
| `⌘Z` / `Ctrl+Z` | Undo |
| `⌘⇧Z` / `Ctrl+Shift+Z` | Redo |
| `⌘Y` / `Ctrl+Y` | Redo (alternate) |
| `⌘P` / `Ctrl+P` | Print / export PDF |

---

## 🖥️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev) | 19 | UI framework |
| [TypeScript](https://typescriptlang.org) | 5.9 | Type safety |
| [Vite](https://vite.dev) | 7 | Build tool & dev server |
| [ESLint](https://eslint.org) | 9 | Linting |

**Zero external runtime dependencies** beyond React itself — no CSS frameworks, no state management libraries, no backend.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/yynnooss/gridwell.git
cd gridwell

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**.

### Build for Production

```bash
# Type-check and build
npm run build

# Preview the production build
npm run preview
```

The production bundle is output to the `dist/` directory.

---

## 📁 Project Structure

```
gridwell/
├── index.html              # HTML entry point
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── eslint.config.js        # ESLint configuration
└── src/
    ├── main.tsx            # React entry point
    ├── App.tsx             # Root component — state management, layout
    ├── App.css             # Component & layout styles
    ├── index.css           # Design system tokens & global reset
    ├── types.ts            # TypeScript interfaces
    └── components/
        ├── Sidebar.tsx          # Sidebar with drag-reorder, save/load
        ├── CategorySelector.tsx # Category dropdown with search
        ├── LayerBox.tsx         # Resizable layer with multi-table support
        ├── DynamicTable.tsx     # Spreadsheet table with editable cells
        └── SearchModal.tsx      # Global search modal (⌘K)
```

---

## 🗂️ Data Model

```
AppState
  ├── projectTitle
  ├── sidebarItems[]
  │     ├── id, title
  │     └── categories[]
  │           ├── id, title
  │           └── layers[]
  │                 ├── id, title, description
  │                 ├── width, height (resizable)
  │                 └── tables[]
  │                       ├── id, title
  │                       ├── columns[] (id, title, width)
  │                       └── rows[] → cells{} (id, value)
  ├── activeSidebarItemId
  └── activeCategoryId
```

All data is stored in `localStorage` under two keys:
- `admin-panel-state` — the live working state
- `admin-panel-saved-configs` — named layout snapshots

---

## 🧪 Quality

- ✅ **Zero ESLint errors** — strict React hooks & TypeScript rules
- ✅ **Zero TypeScript errors** — full type safety across all components
- ✅ **Clean production build** — optimized with Vite
- ✅ **No unused dependencies** — minimal footprint
- ✅ **Auto-migration** — old data formats are upgraded gracefully
- ✅ **WCAG-friendly** — comprehensive ARIA attributes & keyboard navigation

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Type-check and create production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across all source files |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
