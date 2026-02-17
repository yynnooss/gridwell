import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

const defaults = { size: 16, strokeWidth: 1.8 };

// Helper to merge props
const p = (props: IconProps) => ({
    width: props.size || defaults.size,
    height: props.size || defaults.size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: defaults.strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: props.className,
    style: props.style,
    'aria-hidden': true as const,
});

// ── Navigation & Ordering ──

export const ChevronUp: React.FC<IconProps> = (props) => (
    <svg {...p(props)}><polyline points="18 15 12 9 6 15" /></svg>
);

export const ChevronDown: React.FC<IconProps> = (props) => (
    <svg {...p(props)}><polyline points="6 9 12 15 18 9" /></svg>
);

export const ChevronsLeft: React.FC<IconProps> = (props) => (
    <svg {...p(props)}><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
);

export const ChevronsRight: React.FC<IconProps> = (props) => (
    <svg {...p(props)}><polyline points="13 7 18 12 13 17" /><polyline points="6 7 11 12 6 17" /></svg>
);

// ── Actions ──

export const Copy: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

export const Trash: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

export const Pencil: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
);

export const X: React.FC<IconProps> = (props) => (
    <svg {...p(props)}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

export const Plus: React.FC<IconProps> = (props) => (
    <svg {...p(props)}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

// ── Toolbar ──

export const Search: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

export const Printer: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
    </svg>
);

export const Save: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

export const Download: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

export const Upload: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

export const Undo: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
);

export const Redo: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

// ── Drag & Layout ──

export const GripVertical: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
        <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
);

export const PanelLeftClose: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <path d="m16 15-3-3 3-3" />
    </svg>
);

export const PanelLeftOpen: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <path d="m14 9 3 3-3 3" />
    </svg>
);

// ── Rich Text ──

export const Bold: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
);

export const Italic: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <line x1="19" y1="4" x2="10" y2="4" />
        <line x1="14" y1="20" x2="5" y2="20" />
        <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
);

// ── Search Result Type Icons ──

export const Folder: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

export const FolderOpen: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    </svg>
);

export const Layers: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
);

export const Table: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
);

export const Type: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
);

// ── Decorative / Empty State ──

export const Monitor: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

export const Hand: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <path d="M18 11V6a2 2 0 0 0-4 0v1" />
        <path d="M14 10V4a2 2 0 0 0-4 0v2" />
        <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
);

export const LayoutGrid: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

// ── Collapse/Expand ──

export const ChevronRight: React.FC<IconProps> = (props) => (
    <svg {...p(props)}><polyline points="9 18 15 12 9 6" /></svg>
);

// ── Badge / Count ──

export const FolderTree: React.FC<IconProps> = (props) => (
    <svg {...p(props)}>
        <path d="M13 10h7a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15.2 3H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z" />
        <path d="M13 21h7a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.88a1 1 0 0 1-.8-.4l-.9-1.2a1 1 0 0 0-.8-.4H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z" />
        <path d="M3 3v2c0 1.1.9 2 2 2h3" />
        <path d="M3 3v13c0 1.1.9 2 2 2h3" />
    </svg>
);

// ── Utility: OS-aware modifier key ──

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

export const modKey = isMac ? '⌘' : 'Ctrl';
export const modKeyLabel = (key: string) => `${modKey}+${key}`;
