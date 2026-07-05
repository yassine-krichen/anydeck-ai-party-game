import {
  ArrowDownToLine,
  Atom,
  BarChart3,
  Briefcase,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Coins,
  Crown,
  Download,
  Earth,
  Flame,
  Gamepad2,
  Ghost,
  GraduationCap,
  Heart,
  Infinity as InfinityIcon,
  Landmark,
  Laugh,
  Layers,
  Lock,
  MapPin,
  Music,
  Palette,
  PartyPopper,
  PawPrint,
  PencilLine,
  Pizza,
  Play,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  Settings,
  Share2,
  SkipForward,
  Sparkles,
  Star,
  Swords,
  Terminal,
  Timer,
  Trash2,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react-native';

/**
 * Curated icon registry. Static imports keep the bundle tree-shaken —
 * never import the full lucide `icons` map.
 */
const registry = {
  'arrow-down-to-line': ArrowDownToLine,
  atom: Atom,
  'bar-chart': BarChart3,
  briefcase: Briefcase,
  camera: Camera,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clapperboard: Clapperboard,
  coins: Coins,
  crown: Crown,
  download: Download,
  earth: Earth,
  flame: Flame,
  gamepad: Gamepad2,
  ghost: Ghost,
  'graduation-cap': GraduationCap,
  heart: Heart,
  infinity: InfinityIcon,
  landmark: Landmark,
  laugh: Laugh,
  layers: Layers,
  lock: Lock,
  'map-pin': MapPin,
  music: Music,
  palette: Palette,
  'party-popper': PartyPopper,
  'paw-print': PawPrint,
  pencil: PencilLine,
  pizza: Pizza,
  play: Play,
  plus: Plus,
  'qr-code': QrCode,
  'rotate-ccw': RotateCcw,
  search: Search,
  settings: Settings,
  share: Share2,
  'skip-forward': SkipForward,
  sparkles: Sparkles,
  star: Star,
  swords: Swords,
  terminal: Terminal,
  timer: Timer,
  trash: Trash2,
  trophy: Trophy,
  users: Users,
  x: X,
  zap: Zap,
} as const;

export type IconName = keyof typeof registry;

export const iconNames = Object.keys(registry) as IconName[];

interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}

/** Unknown names (e.g. from imported decks) fall back to the layers glyph. */
export function Icon({ name, size = 22, color = '#FFFFFF', strokeWidth = 2.25, fill }: IconProps) {
  const Component = registry[name as IconName] ?? Layers;
  return <Component size={size} color={color} strokeWidth={strokeWidth} fill={fill ?? 'none'} />;
}

export function isIconName(name: string): name is IconName {
  return name in registry;
}
