import { Briefcase, Flag, GraduationCap, Hospital, Plane, Route, ShoppingBag, Temple, Train } from "@/components/glyphs";

/** Glyph for each landmark kind (see LANDMARK_KINDS). */
export const LANDMARK_ICON: Record<string, React.ElementType> = {
  transport: Train,
  highway: Route,
  airport: Plane,
  school: GraduationCap,
  hospital: Hospital,
  temple: Temple,
  shopping: ShoppingBag,
  office: Briefcase,
  other: Flag,
};
