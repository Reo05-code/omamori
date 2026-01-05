import React from 'react';
import {
  Bell,
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CirclePlay,
  CircleStop,
  FileText,
  Home,
  Info,
  LayoutDashboard,
  Map,
  Menu,
  Search,
  RefreshCw,
  Settings,
  Shield,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react';

const ICON_MAP = {
  // header / nav
  menu: Menu,
  search: Search,
  help_outline: CircleHelp,

  // dashboard
  dashboard: LayoutDashboard,
  people: Users,
  group: Users,
  article: FileText,
  notifications: Bell,
  notifications_active: BellRing,
  settings: Settings,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,

  // worker / actions
  home: Home,
  shield: Shield,
  refresh: RefreshCw,
  check: Check,
  check_circle: CircleCheck,
  play_circle: CirclePlay,
  stop_circle: CircleStop,

  // alerts
  warning: TriangleAlert,
  error: CircleAlert,
  info: Info,

  // common
  close: X,
  map: Map,
} as const;

export type AppIconName = keyof typeof ICON_MAP;

type Props = {
  name: AppIconName;
  className?: string;
  strokeWidth?: number;
  ariaLabel?: string;
};

export default function AppIcon({ name, className, strokeWidth = 2, ariaLabel }: Props) {
  const IconComponent = ICON_MAP[name];

  return (
    <IconComponent
      className={className}
      size="1em"
      strokeWidth={strokeWidth}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? 'img' : undefined}
    />
  );
}
