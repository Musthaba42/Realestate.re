// Golden Groups glyph set — drawn for this site in a surveyor's-plan style:
// square line ends, mitred corners, and a small "boundary stone" dot (.g-stone)
// that picks up the brand gold (see --glyph-accent in globals.css).
import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement> & { className?: string };

function make(name: string, body: React.ReactNode) {
  function Glyph({ className = "size-5", strokeWidth = 1.6, ...rest }: GlyphProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
        className={className}
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {body}
      </svg>
    );
  }
  Glyph.displayName = name;
  return Glyph;
}

/** Filled survey-stone accent. */
const S = ({ x, y, r = 1.4 }: { x: number; y: number; r?: number }) => <circle className="g-stone" cx={x} cy={y} r={r} />;

// ---- arrows (drawn as dimension lines: a tick at the tail) ----
export const ArrowRight = make("ArrowRight", <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5M5 10v4" />);
export const ArrowLeft = make("ArrowLeft", <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5M19 10v4" />);
export const ArrowUp = make("ArrowUp", <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5M10 19h4" />);
export const ArrowDown = make("ArrowDown", <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5M10 5h4" />);
export const ArrowUpRight = make("ArrowUpRight", <path d="M7 17 17 7M9.5 7H17v7.5M5.6 15.6l2.8 2.8" />);
export const ChevronLeft = make("ChevronLeft", <path d="M14.5 5.5 8 12l6.5 6.5" />);
export const ChevronRight = make("ChevronRight", <path d="M9.5 5.5 16 12l-6.5 6.5" />);
export const Navigation = make("Navigation", <path d="M4 11.2 20 4l-7.2 16-2-6.8z" />);
export const ExternalLink = make("ExternalLink", <path d="M14 4h6v6M20 4l-8.5 8.5M18 14v6H4V6h6" />);

// ---- marks ----
export const X = make("X", <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />);
export const Plus = make("Plus", <path d="M12 5.5v13M5.5 12h13" />);
export const Menu = make(
  "Menu",
  <>
    <path d="M4 7h16M4 12h11M4 17h16" />
    <S x={18.6} y={12} />
  </>,
);
export const CircleCheck = make(
  "CircleCheck",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.3 12.2 2.6 2.6 4.8-5.3" />
  </>,
);
export const CirclePlus = make(
  "CirclePlus",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v8M8 12h8" />
  </>,
);
export const Ban = make(
  "Ban",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </>,
);
export const Info = make(
  "Info",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <S x={12} y={7.9} r={1.2} />
  </>,
);
export const TriangleAlert = make(
  "TriangleAlert",
  <>
    <path d="M12 3.8 21 19.5H3z" />
    <path d="M12 9.5v4.5" />
    <S x={12} y={16.6} r={1.1} />
  </>,
);
export const MessageSquareWarning = make(
  "MessageSquareWarning",
  <>
    <path d="M4 4.5h16v12H9.5L4 20.5z" />
    <path d="M12 7.5v4" />
    <S x={12} y={13.8} r={1.1} />
  </>,
);
export const Star = make("Star", <path d="m12 3.6 2.6 5.5 6 .8-4.4 4.1 1.1 6-5.3-2.9L6.7 20l1.1-6-4.4-4.1 6-.8z" />);
export const Play = make("Play", <path d="M7.5 4.8v14.4L19 12z" />);
export const LoaderCircle = make(
  "LoaderCircle",
  <>
    <path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5" />
    <S x={12} y={3.5} r={1.5} />
  </>,
);

// ---- search & position ----
export const Search = make(
  "Search",
  <>
    <circle cx="10.5" cy="10.5" r="6.2" />
    <path d="m15 15 5 5M10.5 8.6v3.8M8.6 10.5h3.8" />
  </>,
);
export const SearchX = make(
  "SearchX",
  <>
    <circle cx="10.5" cy="10.5" r="6.2" />
    <path d="m15 15 5 5M8.7 8.7l3.6 3.6M12.3 8.7l-3.6 3.6" />
  </>,
);
export const MapPin = make(
  "MapPin",
  <>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
    <S x={12} y={10} r={2.2} />
  </>,
);
export const LocateFixed = make(
  "LocateFixed",
  <>
    <circle cx="12" cy="12" r="6.5" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    <S x={12} y={12} r={2} />
  </>,
);
export const Compass = make(
  "Compass",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m12 6.5 2.1 5.5-2.1 5.5L9.9 12z" />
    <path className="g-stone" d="m12 6.5 2.1 5.5H9.9z" />
  </>,
);
export const Route = make(
  "Route",
  <>
    <path d="M4.5 20.5 9.5 3.5M19.5 20.5l-5-17" />
    <path d="M12 5v2.2M12 10.4v2.8M12 16.6v3.9" />
  </>,
);
export const SlidersHorizontal = make(
  "SlidersHorizontal",
  <>
    <path d="M4 7h8.5M17.5 7H20M4 17h2.5M11.5 17H20" />
    <circle cx="15" cy="7" r="2.3" />
    <S x={9} y={17} r={2.3} />
  </>,
);

// ---- property ----
export const House = make(
  "House",
  <>
    <path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5M10 20v-5h4v5" />
    <S x={12} y={10.6} r={1.3} />
  </>,
);
export const Building = make(
  "Building",
  <>
    <path d="M5 20V5h9v15M14 10h5v10M3 20h18M8 8.5h3M8 12h3M8 15.5h3" />
    <S x={16.5} y={13.5} r={1.1} />
  </>,
);
export const Landmark = make(
  "Landmark",
  <>
    <path d="M3.5 9.5 12 4.5l8.5 5zM6 12v5.5M10 12v5.5M14 12v5.5M18 12v5.5M3 20.5h18" />
    <S x={12} y={7.8} r={1.1} />
  </>,
);
export const LandPlot = make(
  "LandPlot",
  <>
    <path d="m4.5 17 3.5-10h11.5L16 17z" strokeDasharray="2.4 1.8" />
    <S x={4.5} y={17} />
    <S x={8} y={7} />
    <S x={19.5} y={7} />
    <S x={16} y={17} />
  </>,
);
export const Maximize = make(
  "Maximize",
  <>
    <path d="M7 7h12v12H7z" />
    <path d="M7 3.5h12M7 2.5v2M19 2.5v2M3.5 7v12M2.5 7h2M2.5 19h2" strokeWidth={1.2} />
  </>,
);
export const Ruler = make("Ruler", <path d="M3.5 16.5 16.5 3.5l4 4-13 13zM7 13l2 2M10 10l1.5 1.5M13 7l2 2" />);
export const Layers = make("Layers", <path d="m12 3.5 9 4.5-9 4.5L3 8zM3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />);
export const BedDouble = make(
  "BedDouble",
  <path d="M3 19.5V6M3 14.5h18v5M21 14.5V12a2.5 2.5 0 0 0-2.5-2.5H11v5M5.4 11.6a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 0 0-3.6 0" />,
);
export const Bath = make(
  "Bath",
  <path d="M3 12h18v2.5a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 14.5zM6 12V6.2a2 2 0 0 1 3.8-.9M6.5 19l-1 2M17.5 19l1 2" />,
);
export const Car = make(
  "Car",
  <>
    <path d="M3 16v-3.5L5.2 8h9.6l3.7 4.5H21V16h-2M5 16h10" />
    <circle cx="7" cy="16.5" r="1.9" />
    <circle cx="17" cy="16.5" r="1.9" />
  </>,
);
export const HardHat = make("HardHat", <path d="M4.5 16a7.5 7.5 0 0 1 15 0M2.5 16h19v2.5h-19zM10 9V6.5h4V9" />);
export const Tag = make(
  "Tag",
  <>
    <path d="M3.5 12.5V4H12l8.5 8.5L12 21z" />
    <S x={8} y={8.5} r={1.5} />
  </>,
);

// ---- money & trust ----
export const Wallet = make(
  "Wallet",
  <>
    <path d="M3.5 7.5h17v12h-17zM5.5 7.5l9-3.5 1.5 3.5M15 11.5h5.5V15H15" />
    <S x={17.3} y={13.25} r={1.1} />
  </>,
);
export const Banknote = make(
  "Banknote",
  <>
    <path d="M2.5 6.5h19v11h-19z" />
    <path d="M9.8 9h4.6M9.8 11.2h4.6M11.4 9c2.3 0 2.3 3.6 0 3.6H9.8l3.6 3" strokeWidth={1.4} />
    <S x={5.5} y={12} r={0.9} />
    <S x={18.5} y={12} r={0.9} />
  </>,
);
export const BadgeCheck = make(
  "BadgeCheck",
  <>
    <path d="m12 3 2.4 1.6 2.8.1.9 2.7 2.3 1.7-.9 2.9.9 2.9-2.3 1.7-.9 2.7-2.8.1L12 21l-2.4-1.6-2.8-.1-.9-2.7-2.3-1.7.9-2.9-.9-2.9 2.3-1.7.9-2.7 2.8-.1z" />
    <path d="m8.6 12.2 2.4 2.4 4.4-4.8" />
  </>,
);
export const ShieldCheck = make(
  "ShieldCheck",
  <>
    <path d="M12 3.2 19.5 6v5.6c0 4.4-3.1 7.8-7.5 9.3-4.4-1.5-7.5-4.9-7.5-9.3V6z" />
    <path d="m8.7 12 2.3 2.3 4.3-4.6" />
  </>,
);
export const Handshake = make(
  "Handshake",
  <>
    <path d="M2.5 8.5h3l4 5.2M21.5 8.5h-3l-4.6 5.8a1.6 1.6 0 0 1-2.4.1L9 11.8" />
    <path d="m8.5 7.6 2.6-1.6 3.4 1 4 1.5M9.5 15.5l1.6 1.6M12 17.6l1 1" />
    <S x={12.2} y={11.2} r={1} />
  </>,
);
export const Hand = make(
  "Hand",
  <path d="M9.5 11.5V5a1.5 1.5 0 0 1 3 0v6l5.1 1.1a2 2 0 0 1 1.6 2.3l-.9 5.6h-8.1l-3.8-4.3a1.6 1.6 0 0 1 2.3-2.2l.8.9M5.8 6.6a5 5 0 0 1 2-3.1M16.2 3.5a5 5 0 0 1 2 3.1" />,
);

// ---- documents & files ----
export const FileText = make(
  "FileText",
  <path d="M6 3h8.5L18 6.5V21H6zM14.5 3v3.5H18M9 10h2M9 13.5h6M9 17h6" />,
);
export const Inbox = make("Inbox", <path d="M3.5 13.5 6 5h12l2.5 8.5v6h-17zM3.5 13.5h5l1 2.5h5l1-2.5h5" />);
export const Trash = make("Trash", <path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14M10.5 10.5v6M13.5 10.5v6" />);
export const Pencil = make("Pencil", <path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19zM13.5 7l3.5 3.5M3 20.5h4" />);
export const Upload = make("Upload", <path d="M12 15V4.5M7.5 9 12 4.5 16.5 9M4 14v6h16v-6" />);
export const ImagePlus = make(
  "ImagePlus",
  <>
    <path d="M13.5 5H3.5v14h17v-6.5M3.5 16l5-5 4 4 2.5-2.5 5.5 5M18.5 3v6M15.5 6h6" />
    <S x={8.5} y={8.8} r={1.2} />
  </>,
);
export const Images = make(
  "Images",
  <>
    <path d="M7 3.5h13.5V17M3.5 7H17v13.5H3.5zM3.5 17.5l4.5-4.5 4 4 2-2 3 3" />
    <S x={12.5} y={10.8} r={1.1} />
  </>,
);
export const Video = make(
  "Video",
  <>
    <path d="M3 6.5h12.5v11H3zM15.5 10.5 21 7.5v9l-5.5-3" />
    <S x={6.5} y={10} r={1.2} />
  </>,
);
export const Expand = make("Expand", <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />);
export const Share2 = make(
  "Share2",
  <>
    <circle cx="17.5" cy="5.5" r="2.4" />
    <circle cx="17.5" cy="18.5" r="2.4" />
    <path d="m8.6 10.9 6.8-4.2M8.6 13.1l6.8 4.2" />
    <S x={6.5} y={12} r={2.4} />
  </>,
);
export const Eye = make(
  "Eye",
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
    <S x={12} y={12} r={1.1} />
  </>,
);
export const EyeOff = make(
  "EyeOff",
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
    <path d="m4 4 16 16" />
  </>,
);

// ---- contact ----
export const Phone = make(
  "Phone",
  <>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" />
    <path d="M14.5 3.8a6 6 0 0 1 5.7 5.7" strokeWidth={1.3} />
  </>,
);
export const Mail = make(
  "Mail",
  <>
    <path d="M3.5 6h17v12h-17zM3.5 6.5 12 13l8.5-6.5" />
    <S x={12} y={13} r={1.3} />
  </>,
);
export const Clock = make(
  "Clock",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
    <S x={12} y={12} r={1} />
  </>,
);

// ---- people & account ----
export const UserRound = make(
  "UserRound",
  <>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20.5c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
  </>,
);
export const CircleUserRound = make(
  "CircleUserRound",
  <>
    <circle cx="12" cy="12" r="8.8" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.6 18.4c1.2-1.9 3.1-2.9 5.4-2.9s4.2 1 5.4 2.9" />
  </>,
);
export const Users = make(
  "Users",
  <>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.5 20.5c0-3.7 2.8-6.3 6.5-6.3s6.5 2.6 6.5 6.3M15.5 4.8a3.2 3.2 0 0 1 0 6.4M17.5 14.4c2.3.7 4 2.7 4 6.1" />
  </>,
);
export const UsersRound = Users;
export const UserPlus = make(
  "UserPlus",
  <>
    <circle cx="9.5" cy="8" r="3.6" />
    <path d="M3 20.5c0-3.9 2.9-6.5 6.5-6.5s6.5 2.6 6.5 6.5M18.5 8v6M15.5 11h6" />
  </>,
);
export const LogIn = make("LogIn", <path d="M14 4h5.5v16H14M3.5 12h11M10.5 8l4 4-4 4" />);
export const LogOut = make("LogOut", <path d="M10 4H4.5v16H10M9.5 12h11M16.5 8l4 4-4 4" />);

// ---- admin ----
export const LayoutDashboard = make(
  "LayoutDashboard",
  <>
    <path d="M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z" />
  </>,
);
export const Settings = make(
  "Settings",
  <>
    <circle cx="12" cy="12" r="6" />
    <path d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5M5.3 5.3l2.5 2.5M16.2 16.2l2.5 2.5M5.3 18.7l2.5-2.5M16.2 7.8l2.5-2.5" />
    <S x={12} y={12} r={2} />
  </>,
);

// ---- landmarks (Explore the locality) ----
export const Train = make(
  "Train",
  <>
    <path d="M6 3.5h12v12.5H6zM6 10h12M8.5 16 6 20.5M15.5 16l2.5 4.5M7.5 19h9" />
    <S x={9} y={13} r={1} />
    <S x={15} y={13} r={1} />
  </>,
);
export const Plane = make("Plane", <path d="M2.5 13.5 21 6.5l-3.5 4.5L21 19l-7-3.5-4 4.5v-6.5z" />);
export const GraduationCap = make(
  "GraduationCap",
  <>
    <path d="M2.5 9.5 12 5l9.5 4.5L12 14zM6.5 11.5v4.5c3 2.2 8 2.2 11 0v-4.5M21.5 9.5v5" />
    <S x={21.5} y={15.8} r={1} />
  </>,
);
export const Hospital = make(
  "Hospital",
  <>
    <path d="M4 20.5V6.5h16v14M2.5 20.5h19M12 9v6M9 12h6" />
  </>,
);
/** South-Indian temple tower (gopuram). */
export const Temple = make(
  "Temple",
  <>
    <path d="M3 20.5h18M5.5 20.5l1.5-4.5h10l1.5 4.5M7.5 16l1.2-4h6.6l1.2 4M9 12l1-3.8h4l1 3.8M10.5 8.2V6h3v2.2M10.5 20.5V18h3v2.5" />
    <S x={12} y={4.3} r={1.2} />
  </>,
);
export const ShoppingBag = make(
  "ShoppingBag",
  <>
    <path d="M4.5 7.5h15l-1 13h-13zM8.5 10V6a3.5 3.5 0 0 1 7 0v4" />
  </>,
);
export const Briefcase = make(
  "Briefcase",
  <>
    <path d="M3 7.5h18v12H3zM9 7.5V4.5h6v3M3 12.5h18" />
    <S x={12} y={12.5} r={1.3} />
  </>,
);
export const Flag = make(
  "Flag",
  <>
    <path d="M5.5 21V4M5.5 4.5h12l-2.5 4 2.5 4h-12" />
    <S x={5.5} y={21} r={1.4} />
  </>,
);
