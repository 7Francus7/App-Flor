// Inline SVG icons — iOS SF Symbols style (thin, elegant strokes)
import React from 'react';

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const SearchIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export const PlusIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ChevronRight = ({ size = 16 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size} strokeWidth={2}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export const ChevronLeft = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size} strokeWidth={2}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const ScissorsIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
  </svg>
);

export const ShirtIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
  </svg>
);

export const UserIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const UsersIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

export const ClockIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const CalendarIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const TrashIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

export const EditIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const XIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const CreditCardIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <path d="M1 10h22" />
  </svg>
);

export const DollarIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

export const PhoneIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

export const NoteIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

export const HomeIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <path d="M9 22V12h6v10" />
  </svg>
);

export const PaletteIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

export const CheckIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const MoonIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

export const SunIcon = ({ size = 24 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
