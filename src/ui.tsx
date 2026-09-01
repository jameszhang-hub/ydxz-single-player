import type { CSSProperties } from "react";
import {
  Anvil, Apple, Badge, Beef, Box, Coins, Egg, Feather, Flag, Flame, Gem, Ghost, Hammer,
  KeyRound, Layers3, Leaf, Medal, Puzzle, Shield, Shuffle, Sparkles, Target, Ticket, WandSparkles, Zap
} from "lucide-react";
import { RESOURCE_META } from "./config";
import type { ResourceId } from "./types";

export type AtlasKind = "equipment" | "warSoul" | "soulCard" | "beast" | "battlePet" | "warEagle" | "commerce" | "hunting" | "system" | "growth" | "rune";

const iconMap: Record<ResourceId, typeof Coins> = {
  gold: Coins,
  diamond: Gem,
  chestTicket: Box,
  challengeTicket: Ticket,
  soulCore: Sparkles,
    beastEssence: Flame,
    beastEgg: Egg,
    beastEggBlue: Egg,
    beastEggGold: Egg,
    beastEggRare: Egg,
    experienceSpirit: Ghost,
    beastDevourStone: Gem,
    beastAwakenStone: Sparkles,
    beastEnhanceStone: Flame,
    beastBoostCharm: Zap,
    beastProtectCharm: Shield,
    beastRewindStone: Shuffle,
    beastExtraordinaryShard: Puzzle,
    beastMagicCrystal: Sparkles,
    beastEggLegendary: Egg,
    beastEggPerfect: Egg,
    beastEggExtraordinary: Egg,
  petSoulGrass: Leaf,
  petSoulFlower: Sparkles,
  petSoulFruit: Flame,
  soulCardTicket: Layers3,
  soulCardDust: Sparkles,
  huntingStamina: Zap,
  huntingCoin: Coins,
  runeShard: WandSparkles,
  gemTicket: Gem,
  mountWhip: WandSparkles,
  eagleFeather: Feather,
  food: Apple,
  steak: Beef,
  artifactOre: Anvil,
  flagEssence: Flag,
  wildRune: Shuffle,
  eggHammer: Hammer,
  treasuryKey: KeyRound,
  goldenSnakeToken: Badge,
  guildCoin: Shield,
  merit: Medal,
  trialCoin: Target
};

export const fmt = (value: number) => value >= 100000000
  ? `${(value / 100000000).toFixed(2)}亿`
  : value >= 10000
    ? `${(value / 10000).toFixed(value >= 100000 ? 1 : 2)}万`
    : Math.floor(value).toLocaleString();

export function atlasStyle(kind: AtlasKind, index: number): CSSProperties {
  const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
  const beastMeta = { cols: 8, rows: 6, image: asset("beast-atlas-clean-v2.png"), index };
  const meta = kind === "equipment"
    ? { cols: 4, rows: 3, image: asset("equipment-atlas-v2.png") }
    : kind === "soulCard"
      ? { cols: 5, rows: 6, image: asset("soul-card-atlas-v1.png") }
    : kind === "beast"
      ? beastMeta
      : kind === "battlePet"
        ? { cols: 3, rows: 2, image: asset("battle-pet-atlas-v1.png") }
      : kind === "warEagle"
        ? { cols: 3, rows: 2, image: asset("war-eagle-atlas-v1.png") }
      : kind === "commerce"
        ? { cols: 4, rows: 3, image: asset("commerce-atlas-v1.png") }
      : kind === "hunting"
        ? { cols: 4, rows: 4, image: asset("hunting-atlas-v1.png") }
      : kind === "rune"
        ? { cols: 4, rows: 3, image: asset("rune-atlas-v1.png") }
      : kind === "system"
        ? { cols: 4, rows: 3, image: asset("system-atlas-v4.png") }
        : kind === "growth"
          ? { cols: 4, rows: 4, image: asset("growth-atlas-v1.png") }
          : { cols: 4, rows: 6, image: asset("war-soul-atlas-v3.png") };
  const atlasIndex = "index" in meta ? meta.index : index;
  const safeIndex = ((atlasIndex % (meta.cols * meta.rows)) + meta.cols * meta.rows) % (meta.cols * meta.rows);
  const column = safeIndex % meta.cols;
  const row = Math.floor(safeIndex / meta.cols);
  // The recorded beast sprites sit very close to their atlas cell edges. A small
  // overscan prevents fractional CSS scaling from leaking a neighbouring sprite.
  const cellOverscan = kind === "beast" ? 1.03 : kind === "warSoul" ? 1.012 : 1;
  return {
    backgroundImage: `url(${meta.image})`,
    backgroundSize: `${meta.cols * 100 * cellOverscan}% ${meta.rows * 100 * cellOverscan}%`,
    backgroundPosition: `${column / (meta.cols - 1) * 100}% ${row / (meta.rows - 1) * 100}%`
  };
}

export function AtlasArt({ kind, index, className = "" }: { kind: AtlasKind; index: number; className?: string }) {
  return <span aria-hidden="true" className={`atlas-art ${className}`} style={atlasStyle(kind, index)} />;
}

export function ResourcePill({ id, value, label = false }: { id: ResourceId; value: number; label?: boolean }) {
  const Icon = iconMap[id];
  return <div className="resource-pill" title={RESOURCE_META[id].name}>
    <Icon size={15} />
    {label && <span>{RESOURCE_META[id].name}</span>}
    <strong>{fmt(value)}</strong>
  </div>;
}
