import {
  ARTIFACTS, BEASTS, BEAST_AFFIX_POOL, BEAST_QUALITIES, BUILD_PLANS, EMPTY_STATS, beastDisplayArtIndex,
  FLAG_EXP_ROLLS, GEM_BASE_VALUES, GEM_COLORS, MOUNTS, MOUNT_DRAW_RATES, MOUNT_QUALITIES,
  HUNTING_POOL, QUALITIES, RUNES, RUNE_DRAW_ITEMS, SLOTS, SOUL_CARDS, SOUL_CARD_SET_STATS,
  VIP_THRESHOLDS, WAR_EAGLE_SKINS, WAR_SOULS, WAR_SOUL_QUALITIES
} from "./config";
import type {
  BattleResult, BeastBoardPiece, BuildPlanId, CollectionDefinition, CombatEvent, CombatStats, EquipmentInstance,
  GameSaveV1, GemColor, GearSlot, GrowthAffix, GrowthStat, GrowthSystemsState, MountInstance,
  NpcPlayer, Resources, TerritoryOffer, WarSoulRefineEntry, WarSoulRefineOption
} from "./types";
import { trialEnemyStats } from "./trial";

export class GameRng {
  state: number;
  draws: number;

  constructor(seed: number, draws = 0) {
    this.state = seed >>> 0 || 0x6d2b79f5;
    this.draws = draws;
  }

  next() {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    this.draws += 1;
    return this.state / 0x100000000;
  }

  int(min: number, max: number) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: T[]): T {
    return items[Math.min(items.length - 1, Math.floor(this.next() * items.length))];
  }
}

const lv1 = [7000, 2500, 500, 0, 0, 0, 0, 0, 0, 0];
const lv3 = [5000, 3700, 1200, 100, 0, 0, 0, 0, 0, 0];
const lv30 = [0, 0, 416, 2700, 3800, 2100, 700, 200, 80, 4];
const lv31 = [0, 0, 235, 2300, 4150, 2200, 800, 220, 90, 5];

function normalizedWeights(values: number[]) {
  const rounded = values.map((value) => Math.max(0, Math.round(value)));
  rounded[rounded.length - 1] += 10000 - rounded.reduce((sum, value) => sum + value, 0);
  return rounded;
}

export function chestQualityWeights(level: number) {
  if (level >= 31) return lv31;
  const from = level <= 3 ? lv1 : lv3;
  const to = level <= 3 ? lv3 : lv30;
  const t = level <= 3 ? (level - 1) / 2 : (level - 3) / 27;
  return normalizedWeights(from.map((value, index) => value + (to[index] - value) * Math.max(0, Math.min(1, t))));
}

function rollWeighted(rng: GameRng, weights: number[]) {
  const roll = rng.int(0, 9999);
  let cursor = 0;
  for (let index = 0; index < weights.length; index += 1) {
    cursor += weights[index];
    if (roll < cursor) return index;
  }
  return weights.length - 1;
}

const equipmentAffixStats: (keyof CombatStats)[] = [
  "lifesteal", "crit", "dodge", "stun", "combo", "counter",
  "antiLifesteal", "antiCrit", "antiDodge", "antiStun", "antiCombo", "antiCounter",
  "critDamage", "tenacity", "healing", "recovery", "damageBonus", "damageReduction", "beastStrength"
];

export function generateEquipment(level: number, chestLevel: number, rng: GameRng): EquipmentInstance {
  const quality = rollWeighted(rng, chestQualityWeights(chestLevel));
  const slot = rng.pick(SLOTS).id;
  const multiplier = QUALITIES[quality].multiplier;
  const variance = 0.92 + rng.next() * 0.16;
  const scale = Math.pow(Math.max(1, level), 1.12) * multiplier * variance;
  const stats = {
    hp: Math.round(75 * scale),
    attack: Math.round(14 * scale),
    defense: Math.round(6 * scale),
    speed: Math.max(1, Math.round(1.3 * scale))
  };
  const affixCount = Math.min(4, 1 + Math.floor(quality / 2));
  const pool = [...equipmentAffixStats].sort(() => rng.next() - 0.5);
  const affixes = pool.slice(0, affixCount).map((stat) => ({ stat, value: Math.round((80 + rng.next() * 120 + quality * 35)), percent: true }));
  const score = Math.round(stats.hp * 0.6 + stats.attack * 25 + stats.defense * 18 + stats.speed * 200 + affixes.reduce((sum, item) => sum + item.value * 18, 0));
  return {
    id: `gear-${rng.draws.toString(36)}-${rng.state.toString(36)}`,
    slot,
    level,
    quality,
    stats,
    affixes,
    score,
    sellValue: Math.round(18 * Math.pow(1.04, Math.max(0, level - 1)) * Math.pow(1.78, quality))
  };
}

export function rebalanceEquipment(item: EquipmentInstance) {
  const quality = Math.max(0, Math.min(QUALITIES.length - 1, item.quality));
  const hash = [...item.id].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
  const variance = 0.92 + (hash % 161) / 1000;
  const scale = Math.pow(Math.max(1, item.level), 1.12) * QUALITIES[quality].multiplier * variance;
  item.quality = quality;
  item.stats = {
    hp: Math.round(75 * scale),
    attack: Math.round(14 * scale),
    defense: Math.round(6 * scale),
    speed: Math.max(1, Math.round(1.3 * scale))
  };
  item.affixes = item.affixes.map((affix) => ({ ...affix, value: Math.max(20, Math.min(600, Math.round(affix.value))) }));
  item.score = Math.round(item.stats.hp * 0.6 + item.stats.attack * 25 + item.stats.defense * 18 + item.stats.speed * 200 + item.affixes.reduce((sum, affix) => sum + affix.value * 18, 0));
  item.sellValue = Math.round(18 * Math.pow(1.04, Math.max(0, item.level - 1)) * Math.pow(1.78, quality));
  return item;
}

export function equipmentPlanScore(item: EquipmentInstance, planId: BuildPlanId) {
  const plan = BUILD_PLANS.find((entry) => entry.id === planId) || BUILD_PLANS[0];
  const synergy = item.affixes.reduce((sum, affix) => {
    if (affix.stat === plan.primary) return sum + affix.value * 5;
    if (affix.stat === plan.secondary) return sum + affix.value * 2;
    return sum;
  }, 0);
  return item.score + synergy;
}

export function chestUpgradeCost(level: number) {
  const known: Record<number, number> = { 1: 50, 2: 100, 3: 300, 4: 1500, 5: 3000, 11: 270000, 12: 330000, 13: 400000, 14: 540000, 15: 590000, 16: 610000, 17: 680000, 18: 750000, 19: 900000, 20: 1050000, 21: 1200000, 22: 1400000, 23: 1600000 };
  if (known[level]) return known[level];
  if (level >= 24) return Math.round(1600000 * Math.pow(1.18, level - 23) / 100) * 100;
  const ratio = (level - 5) / 6;
  return Math.round((3000 * Math.pow(270000 / 3000, ratio)) / 100) * 100;
}

export function chestUpgradeRequirement(level: number) {
  return Math.min(5, 1 + Math.floor(Math.max(0, level - 1) / 6));
}

export function expForLevel(level: number) {
  // The exponential term controls late-game pacing; the power term keeps Lv.1-30 readable.
  return Math.round(200 * Math.pow(1.045, Math.max(1, level)) + 47 * Math.pow(Math.max(1, level), 1.5));
}

const EQUIPMENT_EXP_BY_QUALITY = [14, 23, 38, 63, 105, 170, 270, 420, 650, 1000];

export function equipmentDecomposeExp(items: { quality: number; level?: number }[]) {
  return items.reduce((sum, item) => {
    const levelScale = Math.pow(1.034, Math.max(0, (item.level || 1) - 1));
    return sum + Math.round((EQUIPMENT_EXP_BY_QUALITY[item.quality] || 14) * levelScale);
  }, 0);
}

export function equipmentRefineCost(playerLevel: number, refineLevel: number) {
  return Math.max(80, Math.round(80 * Math.pow(1.075, Math.max(0, playerLevel - 1)) * Math.pow(1.62, refineLevel)));
}

export const EQUIPMENT_REFINE_MAX = 30;
export const ARTIFACT_MAX_LEVEL = 20;

export function equipmentRefineScale(refineLevel: number) {
  const level = Math.max(0, Math.min(EQUIPMENT_REFINE_MAX, refineLevel));
  return 1 + level * 0.035 + Math.pow(level, 1.35) * 0.008;
}

export function warSoulStatScale(level: number) {
  const progress = Math.max(0, Math.min(100, level) - 1);
  return 1 + progress * 0.02 + Math.pow(progress, 1.4) * 0.018;
}

export function beastStatScale(level: number) {
  const progress = Math.max(0, Math.min(100, level) - 1);
  return 1 + progress * 0.018 + Math.pow(progress, 1.38) * 0.012;
}

export function soulCardStatScale(level: number) {
  const progress = Math.max(0, Math.min(60, level) - 1);
  return 1 + progress * 0.025 + Math.pow(progress, 1.38) * 0.04;
}

export function battlePetStatScale(level: number) {
  const progress = Math.max(0, Math.min(200, level) - 1);
  return 1 + progress * 0.015 + Math.pow(progress, 1.75) * 0.012;
}

export function artifactStatScale(level: number) {
  const progress = Math.max(0, Math.min(ARTIFACT_MAX_LEVEL, level) - 1);
  return 1 + progress * 0.1 + Math.pow(progress, 1.5) * 0.012;
}

export function stageRewardScale(stage: number) {
  return Math.pow(1.075, Math.max(0, stage - 1));
}

export function progressionRewardMultiplier(level: number, day: number) {
  const levelScale = Math.pow(1.025, Math.min(200, Math.max(0, level - 1)));
  const dayScale = Math.pow(1.08, Math.min(60, Math.max(0, day - 1)));
  return levelScale * dayScale;
}

export function highestGemLevel(save: GameSaveV1) {
  return Math.max(0, ...Object.values(save.growthSystems.gems.sockets).map((socket) => socket?.level || 0));
}

export function heroAppearanceTier(save: GameSaveV1) {
  const equipped = Object.values(save.equipped).filter(Boolean) as EquipmentInstance[];
  const averageQuality = equipped.length ? equipped.reduce((sum, item) => sum + item.quality, 0) / equipped.length : 0;
  const completeness = equipped.length / 12;
  return Math.max(0, Math.min(4, Math.floor((averageQuality + completeness * 2 + save.player.level / 35) / 2)));
}

export function grantPlayerExp(save: GameSaveV1, amount: number) {
  save.player.exp += Math.max(0, Math.round(amount));
  let gained = 0;
  while (save.player.exp >= expForLevel(save.player.level) && save.player.level < 400) {
    save.player.exp -= expForLevel(save.player.level);
    save.player.level += 1;
    save.resources.chestTicket += Math.round(18 * Math.pow(1.045, save.player.level));
    gained += 1;
  }
  return gained;
}

export function vipLevel(totalSpent: number) {
  let result = 0;
  VIP_THRESHOLDS.forEach((threshold, index) => { if (totalSpent >= threshold) result = index; });
  return result;
}

export function goalProgress(save: GameSaveV1, id: string) {
  if (id === "open-10") return save.counters.chestsOpened;
  if (id === "open-100") return save.counters.chestsOpened;
  if (id === "equip-4") return Object.keys(save.equipped).length;
  if (id === "stage-3") return save.counters.stagesWon;
  if (id === "stage-20") return save.counters.stagesWon;
  if (id === "level-5") return save.player.level;
  if (id === "summon-10") return save.counters.summons;
  if (id === "hatch-10") return save.counters.beastHatches;
  if (id === "beast-compose-3") return save.counters.beastComposes;
  if (id === "refine-1") return save.counters.refines;
  if (id === "gem-compose-3") return save.counters.gemComposes;
  if (id === "vip-1") return vipLevel(save.totalSpent);
  return 0;
}

export const WAR_SOUL_REFINE_QUALITY_NAMES = ["铂金/彩色", "红色", "橙色", "黄色", "紫色", "蓝色", "绿色", "白色"];

export const WAR_SOUL_STAR_POWER = [0, 10, 20, 30, 50, 80, 120, 200, 300] as const;
export const WAR_SOUL_STAGE_THRESHOLDS = [0, 0, 200, 400, 600, 840, 1080, 1400, 1800] as const;
export const WAR_SOUL_REFINE_SLOTS = 10;

export function warSoulRefineSlotCap(tier: number) {
  return [5, 6, 7, 8, 9, 10][Math.max(0, Math.min(5, tier - 1))];
}

export function warSoulRefineWeights(luck: number, soulTier = 5) {
  const tier = Math.max(1, Math.min(6, soulTier));
  const topLuck = [400, 800, 1200, 1600, 2000, 2400][tier - 1];
  const ratio = Math.max(0, luck) / topLuck;
  if (ratio >= 1) {
    if (tier === 6) return [160, 360, 3320, 4720, 1420, 20, 0, 0];
    if (tier === 5) return [0, 380, 3340, 4820, 1440, 20, 0, 0];
    return [0, 330, 3360, 4830, 1450, 30, 0, 0];
  }
  if (ratio >= 0.75) return [0, 0, 1, 840, 5810, 3290, 60, 0];
  if (ratio >= 0.5) return [0, 0, 0, 0, 200, 7090, 2710, 0];
  if (ratio >= 0.25) return [0, 0, 0, 0, 0, 500, 9000, 500];
  return [0, 0, 0, 0, 0, 0, 1500, 8500];
}

export function rollWarSoulRefine(luck: number, rng: GameRng, soulTier = 5) {
  const index = rollWeighted(rng, warSoulRefineWeights(luck, soulTier));
  return { index, grade: 8 - index, name: WAR_SOUL_REFINE_QUALITY_NAMES[index] };
}

const refineAffixPool: { stat: GrowthStat; name: string; percent: boolean }[] = [
  { stat: "attack", name: "攻击", percent: false }, { stat: "defense", name: "防御", percent: false },
  { stat: "lifesteal", name: "吸血", percent: true }, { stat: "crit", name: "暴击", percent: true },
  { stat: "dodge", name: "闪避", percent: true }, { stat: "stun", name: "击晕", percent: true },
  { stat: "combo", name: "连击", percent: true }, { stat: "counter", name: "反击", percent: true },
  { stat: "antiCrit", name: "暴击抗性", percent: true }, { stat: "antiDodge", name: "闪避抗性", percent: true },
  { stat: "antiStun", name: "击晕抗性", percent: true }, { stat: "antiCombo", name: "连击抗性", percent: true },
  { stat: "antiCounter", name: "反击抗性", percent: true }, { stat: "antiLifesteal", name: "吸血抗性", percent: true },
  { stat: "critDamage", name: "暴击伤害", percent: true }, { stat: "tenacity", name: "坚毅", percent: true },
  { stat: "healing", name: "疗伤", percent: true }, { stat: "recovery", name: "恢复", percent: true },
  { stat: "damageBonus", name: "伤害加成", percent: true }, { stat: "damageReduction", name: "伤害减免", percent: true }
];

const refineGradeRatios = [
  [0.06, 0.12], [0.13, 0.22], [0.23, 0.34], [0.35, 0.47],
  [0.48, 0.61], [0.62, 0.74], [0.75, 0.89], [0.9, 1]
] as const;

function warSoulAffixCap(stat: GrowthStat, soulTier: number) {
  const tier = Math.max(1, Math.min(6, soulTier)) - 1;
  if (stat === "hp") return [8000, 14000, 24000, 42000, 70000, 110000][tier];
  if (stat === "attack") return [320, 520, 900, 1500, 2400, 3800][tier];
  if (stat === "defense") return [200, 340, 620, 1000, 1600, 2500][tier];
  if (stat === "speed") return [180, 260, 380, 520, 700, 900][tier];
  return [450, 600, 800, 1000, 1250, 1500][tier];
}

function refineValue(stat: GrowthStat, grade: number, soulTier: number, rng: GameRng) {
  const [minimum, maximum] = refineGradeRatios[Math.max(0, Math.min(7, grade - 1))];
  const ratio = rng.int(Math.round(minimum * 10000), Math.round(maximum * 10000)) / 10000;
  return Math.max(1, Math.round(warSoulAffixCap(stat, soulTier) * ratio));
}

export function generateWarSoulRefineEntry(soulTier: number, luck: number, rng: GameRng, slotIndex = 0): WarSoulRefineEntry {
  const result = rollWarSoulRefine(luck, rng, soulTier);
  const available = [...refineAffixPool];
  const selected: typeof refineAffixPool = [];
  while (selected.length < 3 && available.length) selected.push(available.splice(rng.int(0, available.length - 1), 1)[0]);
  const entryId = `soul-refine-${rng.draws}-${slotIndex}`;
  const gradeBand = (result.grade >= 6 ? 3 : result.grade >= 3 ? 2 : 1) as 1 | 2 | 3;
  const attributes: GrowthAffix[] = [
    { id: `${entryId}-hp`, stat: "hp", name: "生命", value: refineValue("hp", result.grade, soulTier, rng), percent: false, grade: gradeBand, refineLevel: result.grade, refineCap: soulTier === 6 ? 8 : 7 },
    ...selected.map((affix, index) => ({
      id: `${entryId}-${affix.stat}-${index}`,
      stat: affix.stat,
      name: affix.name,
      value: refineValue(affix.stat, result.grade, soulTier, rng),
      percent: affix.percent,
      grade: gradeBand,
      refineLevel: result.grade,
      refineCap: soulTier === 6 ? 8 : 7
    }))
  ];
  return {
    id: entryId,
    starGrade: result.grade,
    resultQuality: result.name,
    soulPower: WAR_SOUL_STAR_POWER[result.grade],
    attributes,
    locked: false
  };
}

export function regradeWarSoulRefineEntry(entry: WarSoulRefineEntry, targetTier: number, preserveGrade = false): WarSoulRefineEntry {
  if (preserveGrade) return structuredClone(entry);
  const hp = entry.attributes.find((attribute) => attribute.stat === "hp")?.value || 0;
  const ratio = hp / warSoulAffixCap("hp", targetTier);
  const grade = ratio >= 0.9 ? 8 : ratio >= 0.75 ? 7 : ratio >= 0.62 ? 6 : ratio >= 0.48 ? 5 : ratio >= 0.35 ? 4 : ratio >= 0.23 ? 3 : ratio >= 0.13 ? 2 : 1;
  return {
    ...structuredClone(entry),
    starGrade: grade,
    resultQuality: WAR_SOUL_REFINE_QUALITY_NAMES[8 - grade],
    soulPower: WAR_SOUL_STAR_POWER[grade],
    attributes: entry.attributes.map((attribute) => ({ ...structuredClone(attribute), refineLevel: grade, refineCap: targetTier === 6 ? 8 : 7 }))
  };
}

export function warSoulStageFromPower(power: number) {
  let stage = 1;
  for (let candidate = 2; candidate < WAR_SOUL_STAGE_THRESHOLDS.length; candidate += 1) {
    if (power >= WAR_SOUL_STAGE_THRESHOLDS[candidate]) stage = candidate;
  }
  return stage;
}

export function warSoulRefinePower(entries: WarSoulRefineEntry[]) {
  return entries.reduce((total, entry) => total + entry.soulPower, 0);
}

// Retained for old saves and external callers; the live flow now appends one refinement card at a time.
export function generateWarSoulRefineOptions(soulTier: number, luck: number, rng: GameRng): WarSoulRefineOption[] {
  return Array.from({ length: 6 }, (_, index) => {
    const entry = generateWarSoulRefineEntry(soulTier, luck, rng, index);
    return { id: entry.id, star: entry.starGrade, resultQuality: entry.resultQuality, attributes: entry.attributes };
  });
}

export function warSoulComposeRate(subSoulCount: number) {
  return Math.max(0, Math.min(10000, subSoulCount * 2500));
}

export function beastComposeRate(targetTier: number) {
  return BEAST_QUALITIES.find((quality) => quality.tier === targetTier)?.composeRate || 0;
}

export function beastAssistRate(tier: number) {
  // Tier 5 is captured at 12%; the remaining monotonic steps are local balance until more source screens exist.
  return Math.max(4, Math.min(18, 2 + Math.max(1, tier) * 2));
}

export function beastDevourPreview(level: number) {
  const current = Math.max(0, Math.floor(level));
  const redChance = Math.min(95, 82 + current * 1.5);
  const round2 = (value: number) => Math.round(value * 100) / 100;
  return {
    red: { chance: round2(redChance), speed: 316 + current * 18, attack: 790 + current * 45 },
    blue: { chance: round2(redChance * 0.8308235294), hp: 8260 + current * 460, defense: 413 + current * 23 },
    yellow: { chance: round2(redChance * 0.4135294118), beastStrength: round2(0.61 + current * 0.08), hp: 2062 + current * 124 }
  };
}

export function beastLevelCost(level: number) {
  return Math.max(1, Math.ceil(Math.pow(1.085, Math.max(0, level - 1))));
}

export function beastUpgradeCost(level: number, tier: number) {
  return {
    spirits: beastLevelCost(level),
    essence: Math.max(1, Math.ceil(tier * 4 * Math.pow(1.072, Math.max(0, level - 1))))
  };
}

export function beastRerollCost(_level: number, _tier: number) {
  return 80000;
}

export function beastExpForLevel(level: number, tier: number) {
  return Math.ceil((80 + tier * 35) * Math.pow(1.049, Math.max(0, level - 1)));
}

export const BEAST_SPIRIT_EXP_BY_TIER = [0, 600, 1200, 2400, 4800, 9600, 19200] as const;

// Recorded UI exposes three material slots and only 0/1/2/3-star extraordinary forms.
export const BEAST_AWAKEN_MATERIAL_COUNTS = [1, 2, 3, 3] as const;

export function beastAwakenMaterialCount(stars: number) {
  return BEAST_AWAKEN_MATERIAL_COUNTS[Math.max(0, Math.min(3, Math.floor(stars)))] || 0;
}

export function beastSpiritExp(tier: number, amount = 1) {
  const perSpirit = BEAST_SPIRIT_EXP_BY_TIER[Math.max(1, Math.min(6, Math.floor(tier)))];
  return Math.max(1, amount) * perSpirit;
}

export const BATTLE_PET_MUTATION_QUALITY_NAMES = ["绿色", "蓝色", "紫色", "黄色", "橙色", "红色"] as const;
export const BATTLE_PET_AWAKEN_QUALITY_NAMES = ["精良", "稀有", "史诗", "完美", "超凡", "完全觉醒"] as const;

export function battlePetMutationRates(material: "grass" | "flower" | "fruit") {
  if (material === "grass") return [5, 3, 1.5, 0.5, 0, 0] as const;
  if (material === "flower") return [0, 4, 5, 4, 2, 0] as const;
  return [0, 0, 6, 8, 4, 2] as const;
}

export function battlePetAwakenRates(luck: number) {
  if (luck >= 2500) return [0, 0, 0, 0, 50, 50] as const;
  if (luck >= 2000) return [0, 30, 34, 20, 8, 8] as const;
  if (luck >= 1500) return [20, 35, 25, 12, 4, 4] as const;
  if (luck >= 500) return [40, 35, 18, 7, 0, 0] as const;
  return [60, 35, 5, 0, 0, 0] as const;
}

export function battlePetExpForLevel(level: number) {
  return Math.ceil(100 * Math.pow(1.16, Math.max(0, level - 1)));
}

export function warSoulUpgradeCost(level: number, tier: number) {
  return {
    gold: Math.ceil((1600 + tier * 900) * Math.pow(1.105, Math.max(0, level - 1)) / 100) * 100,
    soulCore: Math.max(1, Math.ceil(tier * Math.pow(1.072, Math.max(0, level - 1))))
  };
}

export function warSoulRefineCost(_tier: number, _filledSlots: number) {
  return { gold: 12000, soulCore: 0 };
}

export function beastSkillWashGradeRates(tier: number): readonly [number, number, number] {
  if (tier <= 2) return [70, 20, 10];
  if (tier === 3) return [60, 25, 15];
  if (tier === 4) return [50, 30, 20];
  if (tier === 5) return [40, 35, 25];
  if (tier === 6) return [30, 40, 30];
  return [0, 45, 55];
}

export function rollBeastAffixes(tier: number, rng: GameRng): GrowthAffix[] {
  const pool = BEAST_AFFIX_POOL.map(([stat, name, weight]) => ({ stat: stat as GrowthStat, name, weight }));
  const result: GrowthAffix[] = [];
  while (result.length < 4) {
    const available = pool.filter((entry) => !result.some((item) => item.stat === entry.stat));
    const total = available.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rng.next() * total;
    let picked = available[available.length - 1];
    for (const entry of available) {
      roll -= entry.weight;
      if (roll <= 0) { picked = entry; break; }
    }
    const gradeRates = beastSkillWashGradeRates(tier).map((rate) => rate * 100);
    const grade = (rollWeighted(rng, gradeRates) + 1) as 1 | 2 | 3;
    const gradeScale = [0.72, 1, 1.42][grade - 1];
    const raw = ["hp", "attack", "defense", "speed"].includes(picked.stat);
    const rolled = raw
      ? picked.stat === "hp" ? rng.int(500, 900) * tier : picked.stat === "attack" ? rng.int(55, 95) * tier : picked.stat === "defense" ? rng.int(35, 65) * tier : rng.int(18, 34) * tier
      : rng.int(120, 240) + tier * 32;
    result.push({ id: `beast-affix-${rng.draws}-${result.length}`, stat: picked.stat, name: picked.name, value: Math.round(rolled * gradeScale), percent: !raw, grade, refineLevel: 1, refineCap: 20 });
  }
  return result;
}

export function battleFlagSuccessRate(level: number) {
  if (level < 10) return 10000;
  if (level >= 90) return 1000;
  return (10 - Math.floor(level / 10)) * 1000;
}

export function battleFlagRequiredExp(level: number) {
  return Math.ceil(20 * Math.pow(1.028, Math.max(0, level - 1)));
}

export function rollBattleFlagExp(rng: GameRng) {
  return FLAG_EXP_ROLLS[rollWeighted(rng, FLAG_EXP_ROLLS.map((item) => item.rate))].exp;
}

export function mountUpgradeCost(level: number, quality: number) {
  return {
    food: Math.ceil((3 + quality * 2) * Math.pow(1.105, Math.max(0, level - 1))),
    steak: level < 10 ? 0 : Math.ceil((quality + Math.floor(level / 12)) * Math.pow(1.06, level - 10)),
    gold: Math.ceil((1200 + quality * 800) * Math.pow(1.075, Math.max(0, level - 1)) / 100) * 100
  };
}

export function warEagleUpgradeCost(level: number) {
  const safeLevel = Math.max(1, Math.min(80, Math.floor(level)));
  return {
    feathers: Math.max(2, Math.ceil(2 * Math.pow(1.045, safeLevel - 1))),
    gold: Math.ceil(4000 * Math.pow(1.09, safeLevel - 1))
  };
}

export function warEagleStatValue(level: number) {
  return Math.round(28 * Math.pow(Math.max(1, Math.min(80, level)), 1.03));
}

export function rollMountQuality(mode: "normal" | "advanced", rng: GameRng) {
  return (rollWeighted(rng, [...MOUNT_DRAW_RATES[mode]]) + 1) as 1 | 2 | 3 | 4;
}

export function rollMountAttribute(mount: MountInstance, rng: GameRng): GrowthAffix {
  const definition = MOUNTS.find((item) => item.id === mount.definitionId) || MOUNTS[0];
  const quality = MOUNT_QUALITIES[mount.quality - 1];
  const main = rng.next() < 0.6667;
  const otherPool = ([
    { stat: "hpBonus", name: "生命加成" }, { stat: "attackBonus", name: "攻击加成" },
    { stat: "defenseBonus", name: "防御加成" }, { stat: "crit", name: "暴击" },
    { stat: "stun", name: "击晕" }, { stat: "dodge", name: "闪避" },
    { stat: "combo", name: "连击" }, { stat: "counter", name: "反击" }
  ] as { stat: GrowthStat; name: string }[]).filter((item) => item.stat !== definition.mainStat);
  const picked = main ? { stat: definition.mainStat, name: definition.mainName } : rng.pick(otherPool);
  const max = main ? quality.mainMax : quality.otherMax;
  const value = Math.round((1 + rng.next() * (max - 1)) * 100);
  return { id: `mount-affix-${rng.draws}-${mount.level}`, stat: picked.stat, name: picked.name, value, percent: true, grade: mount.quality >= 4 ? 3 : mount.quality >= 2 ? 2 : 1 };
}

export function runeUpgradeCost(level: number) {
  return { copies: Math.min(8, 2 + Math.floor(level / 3)), shards: Math.ceil(8 * Math.pow(1.18, Math.max(0, level - 1))) };
}

export function soulCardUpgradeCost(level: number, tier: number) {
  return Math.ceil((45 + tier * 20) * Math.pow(1.16, Math.max(0, level - 1)));
}

export function hunterExpForLevel(level: number) {
  return Math.ceil(80 * Math.pow(1.24, Math.max(0, level - 1)));
}

export function runeMaterialCount(save: GameSaveV1, mainId: string) {
  const level = save.growthSystems.runes.levels[mainId] || 1;
  return RUNES.reduce((total, rune) => {
    if ((save.growthSystems.runes.levels[rune.id] || 1) !== level) return total;
    const amount = save.growthSystems.runes.inventory[rune.id] || 0;
    const reserved = rune.id === mainId || save.growthSystems.runes.equipped.includes(rune.id) ? 1 : 0;
    return total + Math.max(0, amount - reserved);
  }, 0);
}

export function artifactMaterialCount(save: GameSaveV1, mainId: string) {
  const main = save.growthSystems.artifact.owned[mainId];
  if (!main) return 0;
  return ARTIFACTS.reduce((total, artifact) => {
    const state = save.growthSystems.artifact.owned[artifact.id];
    if (!state || state.level !== main.level) return total;
    const reserved = artifact.id === mainId || save.growthSystems.artifact.equipped === artifact.id ? 1 : 0;
    return total + Math.max(0, state.count - reserved);
  }, 0);
}

export function warSoulMaterialCount(save: GameSaveV1, mainId: string) {
  const definition = WAR_SOULS.find((item) => item.id === mainId);
  if (!definition) return 0;
  return WAR_SOULS.reduce((total, soul) => {
    if (soul.tier !== definition.tier) return total;
    const amount = save.collections.warSouls[soul.id]?.count || 0;
    const reserved = soul.id === mainId || save.collections.deployedWarSoul === soul.id ? 1 : 0;
    return total + Math.max(0, amount - reserved);
  }, 0);
}

export function warSoulReplacementMaterialCount(save: GameSaveV1, mainId: string) {
  const definition = WAR_SOULS.find((item) => item.id === mainId);
  if (!definition || definition.tier < 5) return 0;
  const materialTier = definition.tier - 1;
  return WAR_SOULS.reduce((total, soul) => {
    if (soul.tier !== materialTier) return total;
    const amount = save.collections.warSouls[soul.id]?.count || 0;
    const reserved = save.collections.deployedWarSoul === soul.id ? 1 : 0;
    return total + Math.max(0, amount - reserved);
  }, 0);
}

export function beastMaterialCount(save: GameSaveV1, tier: number) {
  const assists = new Set(save.collections.beastAssistPieceIds || []);
  return save.collections.beastBoard.filter((piece) => piece
    && piece.kind !== "spirit"
    && piece.tier === tier
    && !piece.protected
    && !assists.has(piece.id)).length;
}

export function rollRuneDrawItem(rng: GameRng) {
  return RUNE_DRAW_ITEMS[rollWeighted(rng, RUNE_DRAW_ITEMS.map((item) => item.rate))];
}

export function gemKey(color: GemColor, level: number) {
  return `${color}-${level}`;
}

export function artifactForgeCost(forgeLevel: number) {
  return Math.ceil(2 * Math.pow(1.06, Math.max(0, forgeLevel - 1)));
}

export function artifactForgeWeights(forgeLevel: number) {
  const high = Math.min(700, Math.max(0, forgeLevel - 10) * 22);
  const perfect = Math.min(180, Math.max(0, forgeLevel - 24) * 8);
  return normalizedWeights([7200 - high, 2350 + Math.round(high * 0.45), 450 + Math.round(high * 0.55) - perfect, perfect]);
}

const territoryRewardKinds = ["chest", "food", "steak", "whip", "gold", "rune", "gem", "artifact", "flag"] as const;

export function generateTerritoryOffers(rng: GameRng, level: number): TerritoryOffer[] {
  const labels: Record<(typeof territoryRewardKinds)[number], string> = {
    chest: "遗落宝箱车", food: "风车农庄", steak: "猎人补给站", whip: "驯兽营地",
    gold: "废弃矿车", rune: "符文遗迹", gem: "宝石商队", artifact: "古代锻造场", flag: "边境军需营"
  };
  return Array.from({ length: 3 }, (_, index) => {
    const quality = (rollWeighted(rng, [5500, 2800, 1300, 400]) + 1) as 1 | 2 | 3 | 4;
    const kind = rng.pick([...territoryRewardKinds]);
    const scale = quality * Math.pow(1.045, Math.min(200, Math.max(0, level - 1)));
    const reward: Partial<Resources> = kind === "chest" ? { chestTicket: Math.round(45 * scale) }
      : kind === "food" ? { food: Math.round(6 * scale) }
        : kind === "steak" ? { steak: Math.round(4 * scale) }
          : kind === "whip" ? { mountWhip: Math.max(1, Math.round(scale / 2)) }
            : kind === "gold" ? { gold: Math.round(9000 * scale) }
              : kind === "rune" ? { runeShard: Math.round(8 * scale) }
                : kind === "gem" ? { gemTicket: Math.max(1, Math.round(scale / 2)) }
                  : kind === "artifact" ? { artifactOre: Math.max(1, Math.round(scale / 2)) }
                    : { flagEssence: Math.round(6 * scale) };
    return { id: `territory-${rng.draws}-${index}`, title: labels[kind], quality, reward };
  });
}

export function createGrowthSystems(rng: GameRng, level = 1): GrowthSystemsState {
  return {
    battlePet: {
      level: 1,
      exp: 0,
      awakeningLuck: 0,
      awakeningQuality: 1,
      skills: [
        { id: "pet-skill-1", slot: 0, name: "暴击强化", category: "属性强化", stat: "crit", quality: 1, value: 90 },
        { id: "pet-skill-2", slot: 1, name: "闪避抗性", category: "属性抗性", stat: "antiDodge", quality: 1, value: 90 },
        { id: "pet-skill-3", slot: 2, name: "连击增幅", category: "特殊效果", stat: "combo", quality: 1, value: 90 },
        { id: "pet-skill-4", slot: 3, name: "反击强化", category: "属性强化", stat: "counter", quality: 1, value: 90 }
      ]
    },
    warEagle: { activeSkin: "crit", unlockedSkins: ["crit"], levels: { crit: 1 } },
    mount: { mounts: [], pity: 0, freeRefreshDay: 0, lastDraw: [] },
    runes: { inventory: {}, levels: {}, equipped: [], lastDraw: [] },
    gems: { inventory: {}, sockets: {}, selectedLevel: 1 },
    artifact: { forgeLevel: 1, forgeExp: 0, pity: 0, owned: {}, lastForge: [] },
    flag: { level: 0, progress: 0, attempts: 0, selectedStat: "crit", lastGain: 0, lastSuccess: false },
    territory: { pullsRemaining: 5, refreshesRemaining: 1, reputation: 0, offers: generateTerritoryOffers(rng, level) },
    turntable: { pool: 1, remaining: [0, 1, 2, 3, 4, 5, 6, 7, 8], spinsToday: 0 }
  };
}

export function calculatePlayerStats(save: GameSaveV1): CombatStats {
  const stats: CombatStats = {
    ...EMPTY_STATS,
    hp: Math.round(160 * Math.pow(Math.max(1, save.player.level), 1.85)),
    attack: Math.round(24 * Math.pow(Math.max(1, save.player.level), 1.95)),
    defense: Math.round(8 * Math.pow(Math.max(1, save.player.level), 1.98)),
    speed: Math.max(1, Math.round(0.4 * Math.pow(Math.max(1, save.player.level), 1.98)))
  };
  const percent = { hp: 0, attack: 0, defense: 0 };
  const applyAffix = (affix: GrowthAffix) => {
    if (affix.stat === "hpBonus") { percent.hp += affix.value; return; }
    if (affix.stat === "attackBonus") { percent.attack += affix.value; return; }
    if (affix.stat === "defenseBonus") { percent.defense += affix.value; return; }
    if ((affix.stat === "hp" || affix.stat === "attack" || affix.stat === "defense") && affix.percent) {
      percent[affix.stat] += affix.value;
      return;
    }
    stats[affix.stat] += affix.value;
  };
  Object.entries(save.equipped).forEach(([slot, gear]) => {
    if (!gear) return;
    const refineLevel = save.gearRefines?.[slot as GearSlot] || 0;
    const refineScale = equipmentRefineScale(refineLevel);
    stats.hp += Math.round(gear.stats.hp * refineScale);
    stats.attack += Math.round(gear.stats.attack * refineScale);
    stats.defense += Math.round(gear.stats.defense * refineScale);
    stats.speed += Math.round(gear.stats.speed * refineScale);
    gear.affixes.forEach((affix) => { stats[affix.stat] += affix.value; });
  });
  const discoveredWarSouls = Object.keys(save.collections.warSouls).length;
  if (discoveredWarSouls >= 6) {
    stats.lifesteal += 100;
    stats.counter += 100;
    stats.combo += 100;
    stats.dodge += 100;
    stats.crit += 100;
    stats.stun += 100;
  }
  const warSoulDefinition = WAR_SOULS.find((item) => item.id === save.collections.deployedWarSoul);
  const warSoulState = warSoulDefinition ? save.collections.warSouls[warSoulDefinition.id] : undefined;
  if (warSoulDefinition && warSoulState) {
    const fallback = { hp: 5 + warSoulDefinition.tier * 5, attack: 1 + warSoulDefinition.tier * 1.5, defense: 1 + warSoulDefinition.tier * 1.5 };
    const bonus = warSoulDefinition.baseBonusPct || fallback;
    percent.hp += (bonus.hp || 0) * 100;
    percent.attack += (bonus.attack || 0) * 100;
    percent.defense += (bonus.defense || 0) * 100;
    const levelScale = warSoulStatScale(warSoulState.level);
    stats.hp += Math.round((180 + warSoulState.stage * 420) * levelScale);
    stats.attack += Math.round((34 + warSoulState.stage * 82) * levelScale);
    stats.defense += Math.round((18 + warSoulState.stage * 45) * levelScale);
    warSoulState.refineAttributes.forEach(applyAffix);
  }
  Object.entries(save.collections.beasts).forEach(([id, beast]) => {
    if (!beast.discovered) return;
    const definition = BEASTS.find((item) => item.id === id);
    if (!definition) return;
    Object.entries(definition.codexBonus).forEach(([key, value]) => {
      stats[key as keyof CombatStats] += Number(value || 0);
    });
  });
  const deployedPiece = save.collections.deployedBeastPiece;
  const beastDefinition = BEASTS.find((item) => item.id === (deployedPiece?.definitionId || save.collections.deployedBeast));
  const beastState = deployedPiece?.state || (beastDefinition ? save.collections.beasts[beastDefinition.id] : undefined);
  if (beastDefinition && beastState) {
    const tier = beastDefinition.tier;
    const levelScale = beastStatScale(beastState.level);
    const starScale = 1 + Math.max(0, beastState.stars) * 0.18;
    const stageScale = 1 + Math.max(0, (beastState.stage || 1) - 1) * 0.12;
    const devourScale = 1 + Math.max(0, beastState.devourLevel) * 0.055;
    const enhanceScale = 1 + Math.max(0, beastState.enhanceLevel || 0) * 0.05;
    const growthScale = starScale * stageScale * devourScale * enhanceScale;
    stats.hp += Math.round(tier * (700 + 190 * levelScale) * growthScale);
    stats.attack += Math.round(tier * (110 + 34 * levelScale) * growthScale);
    stats.defense += Math.round(tier * (62 + 20 * levelScale) * growthScale);
    stats.beastStrength += Math.round((tier * 180 + 25 * levelScale) * growthScale);
    const baseBonus = beastDefinition.baseBonusPct || {};
    percent.hp += Number(baseBonus.hp || 0) * 100;
    percent.attack += Number(baseBonus.attack || 0) * 100;
    percent.defense += Number(baseBonus.defense || 0) * 100;
    beastState.affixes.forEach(applyAffix);
  }
  const instanceAssists = (save.collections.beastAssistPieceIds || [])
    .map((pieceId) => save.collections.beastBoard.find((piece) => piece?.id === pieceId))
    .filter(Boolean) as BeastBoardPiece[];
  const assistEntries = instanceAssists.length
    ? instanceAssists.map((piece) => ({ definition: BEASTS.find((item) => item.id === piece.definitionId), state: piece.state }))
    : (save.collections.beastAssists || []).filter((id) => id !== save.collections.deployedBeast).slice(0, 3)
      .map((id) => ({ definition: BEASTS.find((item) => item.id === id), state: save.collections.beasts[id] }));
  assistEntries.slice(0, 3).forEach(({ definition, state }) => {
    if (!definition || !state) return;
    const levelScale = beastStatScale(state.level);
    const trainedScale = 1
      + Math.max(0, (state.stage || 1) - 1) * 0.06
      + Math.max(0, state.devourLevel) * 0.025
      + Math.max(0, state.enhanceLevel || 0) * 0.025;
    const assistScale = beastAssistRate(definition.tier) / 100
      * (1 + Math.max(0, state.stars) * 0.12)
      * trainedScale;
    stats.hp += Math.round(definition.tier * (700 + 190 * levelScale) * assistScale);
    stats.attack += Math.round(definition.tier * (110 + 34 * levelScale) * assistScale);
    stats.defense += Math.round(definition.tier * (62 + 20 * levelScale) * assistScale);
    stats.beastStrength += Math.round((definition.tier * 90 + 12 * levelScale) * assistScale);
    state.affixes.forEach((affix) => applyAffix({ ...affix, value: Math.round(affix.value * assistScale) }));
  });
  const deployedCards = save.collections.equippedCards
    .map((id) => SOUL_CARDS.find((item) => item.id === id))
    .filter(Boolean) as CollectionDefinition[];
  deployedCards.forEach((item) => {
    const cardState = save.collections.soulCards[item.id];
    const scale = item.tier * (1 + ((cardState?.stage || 1) - 1) * 0.45) * soulCardStatScale(cardState?.level || 1);
    Object.entries(item.bonus).forEach(([key, value]) => { stats[key as keyof CombatStats] += Math.round((value || 0) * scale * 2.5); });
  });
  const cardSetCounts = save.collections.equippedCards.reduce<Record<string, number>>((counts, id) => {
    const card = SOUL_CARDS.find((entry) => entry.id === id);
    const setName = card?.name.split("·")[0];
    if (setName) counts[setName] = (counts[setName] || 0) + 1;
    return counts;
  }, {});
  Object.entries(cardSetCounts).forEach(([setName, count]) => {
    const stat = SOUL_CARD_SET_STATS[setName];
    if (stat && count >= 3) stats[stat] += 2200;
  });
  HUNTING_POOL.forEach((item) => {
    if (!save.hunting[item.id]) return;
    stats.hp += item.rarity * 12;
    stats.attack += item.rarity * 1.5;
    stats.defense += item.rarity;
    applyAffix({ id: `hunt-codex-${item.id}`, stat: item.codexStat, name: item.name, value: item.codexValue, percent: true });
  });
  const growth = save.growthSystems;
  if (growth) {
    const battlePet = growth.battlePet;
    if (battlePet?.level > 0) {
      const levelScale = battlePetStatScale(battlePet.level);
      const qualityScale = 1 + Math.max(0, battlePet.awakeningQuality - 1) * 0.28;
      const petScale = levelScale * qualityScale;
      stats.hp += Math.round(2800 * petScale);
      stats.attack += Math.round(430 * petScale);
      stats.defense += Math.round(210 * petScale);
      stats.speed += Math.round(45 * petScale);
      battlePet.skills.forEach((skill) => { stats[skill.stat] += skill.value; });
    }
    const eagle = growth.warEagle;
    const eagleSkin = eagle ? WAR_EAGLE_SKINS.find((skin) => skin.id === eagle.activeSkin) : undefined;
    const eagleLevel = eagleSkin ? eagle.levels[eagleSkin.id] || 0 : 0;
    if (eagleSkin && eagleLevel > 0) {
      const primary = warEagleStatValue(eagleLevel);
      stats[eagleSkin.primary] += primary;
      stats[eagleSkin.secondary] += Math.round(primary * 0.65);
    }
    const uniqueMounts = new Set(growth.mount.mounts.map((item) => item.definitionId));
    stats.hp += uniqueMounts.size * 1800;
    stats.attack += uniqueMounts.size * 220;
    const activeMount = growth.mount.mounts.find((item) => item.id === growth.mount.activeId);
    if (activeMount) {
      const levelScale = Math.pow(1.045, Math.max(0, activeMount.level - 1));
      stats.hp += Math.round(activeMount.quality * (9000 + 950 * levelScale));
      stats.attack += Math.round(activeMount.quality * (1300 + 135 * levelScale));
      stats.defense += Math.round(activeMount.quality * (620 + 65 * levelScale));
      stats.speed += Math.round(activeMount.quality * (110 + 16 * levelScale));
      percent.hp += activeMount.quality * 90 + Math.min(320, activeMount.level * 4);
      percent.attack += activeMount.quality * 28 + Math.min(120, activeMount.level * 2);
      percent.defense += activeMount.quality * 28 + Math.min(120, activeMount.level * 2);
      activeMount.attributes.forEach(applyAffix);
    }
    growth.runes.equipped.forEach((id) => {
      const rune = RUNES.find((item) => item.id === id);
      if (!rune) return;
      const runeLevel = growth.runes.levels[id] || 1;
      stats[rune.stat] += Math.round(rune.base * Math.pow(1.16, runeLevel - 1));
    });
    Object.values(growth.gems.sockets).forEach((socket) => {
      if (!socket) return;
      const gem = GEM_COLORS.find((entry) => entry.id === socket.color);
      if (!gem) return;
      const level = socket.level;
      stats[gem.baseStat] += GEM_BASE_VALUES[gem.id][level - 1] || 0;
      if (level >= 4) {
        const secondary = Math.round((level - 3) * 85 + Math.pow(level - 3, 1.35) * 22);
        stats[gem.secondary[0]] += secondary;
        stats[gem.secondary[1]] += secondary;
      }
    });
    const artifact = ARTIFACTS.find((item) => item.id === growth.artifact.equipped);
    const artifactState = artifact ? growth.artifact.owned[artifact.id] : undefined;
    if (artifact && artifactState) {
      const levelScale = artifactStatScale(artifactState.level);
      stats[artifact.stat] += Math.round(artifact.base * levelScale);
      stats.attack += Math.round(artifact.quality * 850 + 260 * levelScale);
    }
    const flag = growth.flag;
    const flagScale = flag.level > 0 ? (Math.pow(1.035, flag.level) - 1) / (Math.pow(1.035, 120) - 1) : 0;
    percent.hp += Math.round(flagScale * 1800);
    percent.defense += Math.round(flagScale * 1200);
    stats[flag.selectedStat] += Math.round(flagScale * 1800);
    const effectiveReputation = Math.min(1000, Math.max(0, growth.territory.reputation));
    stats.hp += Math.floor(effectiveReputation / 10) * 3200;
    stats.attack += Math.floor(effectiveReputation / 25) * 420;
  } else {
    Object.entries(save.upgrades).forEach(([id, level]) => {
      if (id === "mount") stats.speed += level * 20;
      if (id === "rune") stats.attack += level * 120;
      if (id === "gem") stats.hp += level * 1800;
      if (id === "artifact") stats.crit += level * 80;
      if (id === "flag") stats.defense += level * 90;
      if (id === "territory") stats.hp += level * 1200;
    });
  }
  stats.hp = Math.round(stats.hp * (1 + percent.hp / 10000));
  stats.attack = Math.round(stats.attack * (1 + percent.attack / 10000));
  stats.defense = Math.round(stats.defense * (1 + percent.defense / 10000));
  return stats;
}

export function powerContributionLosses(save: GameSaveV1) {
  const total = calculatePower(calculatePlayerStats(save));
  const lossWithout = (mutate: (copy: GameSaveV1) => void) => {
    const copy = structuredClone(save);
    mutate(copy);
    return Math.max(0, total - calculatePower(calculatePlayerStats(copy)));
  };
  const raw = [
    { name: "装备", value: lossWithout((copy) => { copy.equipped = {}; }) },
    { name: "战魂", value: lossWithout((copy) => { copy.collections.warSouls = {}; copy.collections.deployedWarSoul = undefined; }) },
    { name: "魔兽", value: lossWithout((copy) => { copy.collections.beasts = {}; copy.collections.deployedBeast = undefined; copy.collections.deployedBeastPiece = undefined; copy.collections.beastAssists = []; copy.collections.beastAssistPieceIds = []; }) },
    { name: "捕猎图鉴", value: lossWithout((copy) => { copy.hunting = {}; }) },
    { name: "魂卡", value: lossWithout((copy) => { copy.collections.equippedCards = []; }) },
    { name: "战宠", value: lossWithout((copy) => { copy.growthSystems.battlePet.level = 0; copy.growthSystems.battlePet.skills = []; }) },
    { name: "战鹰", value: lossWithout((copy) => { copy.growthSystems.warEagle.levels = {}; }) },
    { name: "坐骑", value: lossWithout((copy) => { copy.growthSystems.mount.mounts = []; copy.growthSystems.mount.activeId = undefined; }) },
    { name: "符文", value: lossWithout((copy) => { copy.growthSystems.runes.equipped = []; }) },
    { name: "宝石", value: lossWithout((copy) => { copy.growthSystems.gems.sockets = {}; }) },
    { name: "神器", value: lossWithout((copy) => { copy.growthSystems.artifact.equipped = undefined; }) },
    { name: "战旗", value: lossWithout((copy) => { copy.growthSystems.flag.level = 0; copy.growthSystems.flag.progress = 0; }) },
    { name: "领地", value: lossWithout((copy) => { copy.growthSystems.territory.reputation = 0; }) }
  ];
  const baseSave = structuredClone(save);
  baseSave.equipped = {};
  baseSave.collections = { warSouls: {}, beasts: {}, soulCards: {}, beastBoard: Array.from({ length: 16 }, () => null), beastAssists: [], beastAssistPieceIds: [], beastUnlockedSlots: 8, equippedCards: [], soulCardSchemes: [[], [], []], activeSoulCardScheme: 0 };
  baseSave.hunting = {};
  baseSave.growthSystems = createGrowthSystems(new GameRng(1), baseSave.player.level);
  baseSave.growthSystems.battlePet.level = 0;
  baseSave.growthSystems.battlePet.skills = [];
  baseSave.growthSystems.territory.offers = [];
  const pureBase = Math.min(total, calculatePower(calculatePlayerStats(baseSave)));
  const rawSum = raw.reduce((sum, item) => sum + item.value, 0);
  const scale = rawSum > total - pureBase && rawSum > 0 ? (total - pureBase) / rawSum : 1;
  const normalized = raw.map((item) => ({ ...item, value: Math.max(0, Math.round(item.value * scale)) }));
  const allocated = normalized.reduce((sum, item) => sum + item.value, 0);
  return [{ name: "人物等级", value: Math.max(0, total - allocated) }, ...normalized];
}

export function calculatePower(stats: CombatStats) {
  const bounded = (value: number) => Math.max(0, Math.min(10000, value));
  const combat = [stats.lifesteal, stats.crit, stats.dodge, stats.stun, stats.combo, stats.counter].reduce((sum, value) => sum + bounded(value), 0);
  const resist = [stats.antiLifesteal, stats.antiCrit, stats.antiDodge, stats.antiStun, stats.antiCombo, stats.antiCounter].reduce((sum, value) => sum + bounded(value), 0);
  const advanced = [stats.critDamage, stats.tenacity, stats.healing, stats.recovery, stats.damageBonus, stats.damageReduction, stats.beastStrength].reduce((sum, value) => sum + bounded(value), 0);
  return Math.round(stats.hp * 0.6 + stats.attack * 40 + stats.defense * 20 + stats.speed * 200 + combat * 85 + resist * 58 + advanced * 72);
}

export function stageEnemy(stage: number): CombatStats {
  return trialEnemyStats(stage);
}

export function arenaStageForLevel(level: number) {
  return Math.max(1, Math.round(Math.max(1, level) * 1.25));
}

function scaleCombatStats(stats: CombatStats, scale: number): CombatStats {
  return Object.fromEntries(Object.entries(stats).map(([key, value]) => [key, Math.max(key === "speed" ? 1 : 0, Math.round(value * scale))])) as unknown as CombatStats;
}

export function arenaEnemyStats(npc: NpcPlayer): CombatStats {
  const base = stageEnemy(arenaStageForLevel(npc.level));
  const basePower = Math.max(1, calculatePower(base));
  return scaleCombatStats(base, Math.max(0.72, Math.min(1.35, npc.power / basePower)));
}

const clampChance = (value: number) => Math.max(0, Math.min(10000, value));

export interface BattleLoadout {
  warSoul?: CollectionDefinition;
  beast?: CollectionDefinition;
  beastArtIndex?: number;
  battlePet?: { level: number; quality: number };
  buildPlan?: BuildPlanId;
}

export function battleLoadoutFromSave(save: GameSaveV1): BattleLoadout {
  const beast = BEASTS.find((item) => item.id === (save.collections.deployedBeastPiece?.definitionId || save.collections.deployedBeast));
  return {
    warSoul: WAR_SOULS.find((item) => item.id === save.collections.deployedWarSoul),
    beast,
    beastArtIndex: beastDisplayArtIndex(beast?.id, beast ? save.collections.deployedBeastPiece?.state?.stars || save.collections.beasts[beast.id]?.stars || 0 : 0),
    battlePet: {
      level: save.growthSystems.battlePet.level,
      quality: save.growthSystems.battlePet.awakeningQuality
    },
    buildPlan: save.buildPlan
  };
}

export function runBattle(playerStats: CombatStats, enemyStats: CombatStats, rng: GameRng, rewardScale = 1, loadout: BattleLoadout = {}): BattleResult {
  const battleId = `${rng.state}-${rng.draws}`;
  const actors = {
    player: { stats: { ...playerStats }, hp: playerStats.hp, stunned: false },
    enemy: { stats: { ...enemyStats }, hp: enemyStats.hp, stunned: false }
  };
  const events: CombatEvent[] = [];
  let eventId = 0;
  let zhuqueRevived = false;
  let beastBuffApplied = false;
  const emit = (round: number, actor: CombatEvent["actor"], type: CombatEvent["type"], text: string, value?: number) => events.push({ id: eventId += 1, round, actor, type, text, value });

  if (loadout.warSoul?.name === "青龙") {
    actors.player.stats.damageBonus += 4000;
    actors.enemy.stats.antiCrit = Math.max(0, actors.enemy.stats.antiCrit - 3000);
    actors.enemy.stats.antiDodge = Math.max(0, actors.enemy.stats.antiDodge - 3000);
    emit(0, "warSoul", "skill", "青龙·神威：我方伤害提高，敌方特殊抗性降低");
  }

  const companionDamage = (round: number, actor: "warSoul" | "beast" | "battlePet", name: string, percent: number) => {
    const beastScale = actor === "beast" ? 1 + Math.max(0, actors.player.stats.beastStrength) / 10000 : 1;
    const damageScale = 1 + Math.max(-8000, actors.player.stats.damageBonus - actors.enemy.stats.damageReduction) / 10000;
    const raw = actors.player.stats.attack * percent / 100 * beastScale * damageScale;
    const dealt = Math.min(actors.enemy.hp, Math.max(1, Math.round(raw - actors.enemy.stats.defense * 0.3)));
    actors.enemy.hp -= dealt;
    emit(round, actor, "skill", `${name}造成 ${dealt} 技能伤害`, dealt);
    return dealt;
  };

  const companionHeal = (round: number, name: string, attackPercent: number) => {
    const beastScale = 1 + Math.max(0, actors.player.stats.beastStrength) / 10000;
    const healingScale = 1 + Math.max(0, actors.player.stats.healing) / 10000;
    const amount = Math.min(actors.player.stats.hp - actors.player.hp, Math.round(actors.player.stats.attack * attackPercent / 100 * beastScale * healingScale));
    if (amount > 0) {
      actors.player.hp += amount;
      emit(round, "beast", "heal", `${name}恢复 ${amount} 生命`, amount);
    }
  };

  const strike = (attackerId: "player" | "enemy", round: number, reason: "attack" | "combo" | "counter" = "attack", depth = 0) => {
    const defenderId = attackerId === "player" ? "enemy" : "player";
    const attacker = actors[attackerId];
    const defender = actors[defenderId];
    if (attacker.hp <= 0 || defender.hp <= 0) return;
    if (rng.next() * 10000 < clampChance(defender.stats.dodge - attacker.stats.antiDodge)) {
      emit(round, defenderId, "dodge", `${defenderId === "player" ? "勇者" : "对手"}闪避了攻击`);
      return;
    }
    const critical = rng.next() * 10000 < clampChance(attacker.stats.crit - defender.stats.antiCrit);
    const variance = 0.95 + rng.next() * 0.1;
    let damage = Math.max(1, attacker.stats.attack - defender.stats.defense * 0.5) * variance;
    if (critical) damage *= 2 + Math.max(0, attacker.stats.critDamage - defender.stats.tenacity) / 10000;
    damage *= 1 + Math.max(-8000, attacker.stats.damageBonus - defender.stats.damageReduction) / 10000;
    const dealt = Math.min(defender.hp, Math.max(1, Math.round(damage)));
    defender.hp -= dealt;
    emit(round, attackerId, critical ? "crit" : reason, `${attackerId === "player" ? "勇者" : "对手"}${critical ? "暴击" : reason === "combo" ? "连击" : reason === "counter" ? "反击" : "攻击"}造成 ${dealt} 伤害`, dealt);
    const lifesteal = clampChance(attacker.stats.lifesteal - defender.stats.antiLifesteal);
    if (lifesteal > 0) {
      const heal = Math.min(attacker.stats.hp - attacker.hp, Math.round(dealt * lifesteal / 10000 * (1 + Math.max(0, attacker.stats.healing) / 10000)));
      if (heal > 0) { attacker.hp += heal; emit(round, attackerId, "heal", `吸血恢复 ${heal}`, heal); }
    }
    if (defender.hp <= 0) {
      if (defenderId === "player" && loadout.warSoul?.name === "朱雀" && !zhuqueRevived) {
        zhuqueRevived = true;
        defender.hp = Math.max(1, Math.round(defender.stats.hp * 0.1));
        defender.stats.damageReduction += 5000;
        emit(round, "warSoul", "skill", `朱雀·重燃：复活并恢复 ${defender.hp} 生命`, defender.hp);
      } else {
        return;
      }
    }
    if (rng.next() * 10000 < clampChance(attacker.stats.stun - defender.stats.antiStun)) {
      defender.stunned = true;
      emit(round, attackerId, "stun", "击晕生效，下次行动跳过");
    }
    if (reason !== "counter" && depth < 3 && rng.next() * 10000 < clampChance(defender.stats.counter - attacker.stats.antiCounter)) strike(defenderId, round, "counter", depth + 1);
    if (attacker.hp > 0 && defender.hp > 0 && reason !== "counter" && depth < 3 && rng.next() * 10000 < clampChance(attacker.stats.combo - defender.stats.antiCombo)) strike(attackerId, round, "combo", depth + 1);
  };

  for (let round = 1; round <= 20 && actors.player.hp > 0 && actors.enemy.hp > 0; round += 1) {
    if (loadout.warSoul?.name === "朱雀") actors.player.stats.damageBonus = Math.min(4000, actors.player.stats.damageBonus + 400);
    if (loadout.warSoul && round >= 2 && round % 2 === 0) {
      const percent = loadout.warSoul.skillDamagePct || 85 + loadout.warSoul.tier * 24;
      companionDamage(round, "warSoul", `${loadout.warSoul.name}·${loadout.warSoul.name === "青龙" ? "神罚天雷" : loadout.warSoul.name === "朱雀" ? "圣焰" : "战魂技"}`, percent);
      if (loadout.warSoul.name === "青龙" && actors.enemy.hp > 0) {
        for (let tick = 1; tick <= 5 && actors.enemy.hp > 0; tick += 1) companionDamage(round, "warSoul", `触电 ${tick}/5`, 50);
        actors.player.hp = Math.min(playerStats.hp, actors.player.hp + Math.round(playerStats.hp * 0.2));
      }
      if (loadout.warSoul.name === "朱雀") actors.enemy.stats.damageReduction -= 2000;
      if (actors.enemy.hp <= 0) break;
    }
    if (loadout.beast && round % Math.max(1, loadout.beast.skillInterval || 3) === 0) {
      if (loadout.beast.skillHealPct) companionHeal(round, `${loadout.beast.name}·${loadout.beast.name === "翡翠龙" ? "疗愈" : "雷电疗愈"}`, loadout.beast.skillHealPct);
      if (loadout.beast.skillDamagePct || !loadout.beast.skillHealPct) companionDamage(round, "beast", `${loadout.beast.name}·主动技能`, loadout.beast.skillDamagePct || 55 + loadout.beast.tier * 14);
      if (!beastBuffApplied) {
        beastBuffApplied = true;
        if (loadout.beast.name === "翡翠龙") { actors.player.stats.attack = Math.round(actors.player.stats.attack * 1.1); actors.player.stats.stun += 2200; }
        if (loadout.beast.name === "幽灵公主") { actors.player.stats.crit += 2200; actors.enemy.stats.defense = Math.round(actors.enemy.stats.defense * 0.76); }
        if (loadout.beast.name === "雷神") { actors.player.stats.defense = Math.round(actors.player.stats.defense * 1.4); }
        if (loadout.beast.name === "古拉蝠") actors.player.stats.attack = Math.round(actors.player.stats.attack * 1.12);
        emit(round, "beast", "skill", `${loadout.beast.name}的固定增益已生效`);
      }
      if (actors.enemy.hp <= 0) break;
    }
    if (loadout.battlePet && round % 3 === 0) {
      const petPercent = 35 + loadout.battlePet.quality * 10 + Math.min(60, loadout.battlePet.level * 0.4);
      companionDamage(round, "battlePet", `战宠·协战（Lv.${loadout.battlePet.level}）`, petPercent);
      if (actors.enemy.hp <= 0) break;
    }
    const order: ("player" | "enemy")[] = playerStats.speed >= enemyStats.speed ? ["player", "enemy"] : ["enemy", "player"];
    for (const actorId of order) {
      if (actors[actorId].hp <= 0) continue;
      if (actors[actorId].stunned) { actors[actorId].stunned = false; emit(round, actorId, "stun", "眩晕中，跳过行动"); continue; }
      strike(actorId, round);
      if (actors.player.hp <= 0 || actors.enemy.hp <= 0) break;
    }
    if (actors.player.hp > 0 && actors.enemy.hp > 0) {
      order.forEach((actorId) => {
        const actor = actors[actorId];
        const rawRecovery = Math.round(actor.stats.hp * Math.min(5000, Math.max(0, actor.stats.recovery)) / 10000);
        const recovered = Math.min(actor.stats.hp - actor.hp, Math.round(rawRecovery * (1 + Math.max(0, actor.stats.healing) / 10000)));
        if (recovered > 0) {
          actor.hp += recovered;
          emit(round, actorId, "heal", `${actorId === "player" ? "勇者" : "对手"}回合恢复 ${recovered} 生命`, recovered);
        }
      });
    }
  }
  const win = actors.enemy.hp <= 0 || (actors.player.hp > 0 && actors.player.hp / playerStats.hp >= actors.enemy.hp / enemyStats.hp);
  emit(Math.min(20, Math.max(1, events.at(-1)?.round || 1)), "system", "defeat", win ? "战斗胜利" : "战斗失败");
  return {
    battleId,
    win,
    playerHp: Math.max(0, actors.player.hp),
    enemyHp: Math.max(0, actors.enemy.hp),
    playerMaxHp: playerStats.hp,
    enemyMaxHp: enemyStats.hp,
    playerPower: calculatePower(playerStats),
    enemyPower: calculatePower(enemyStats),
    buildPlan: loadout.buildPlan,
    playerCombat: {
      lifesteal: playerStats.lifesteal,
      crit: playerStats.crit,
      dodge: playerStats.dodge,
      stun: playerStats.stun,
      combo: playerStats.combo,
      counter: playerStats.counter
    },
    enemyResists: {
      lifesteal: enemyStats.antiLifesteal,
      crit: enemyStats.antiCrit,
      dodge: enemyStats.antiDodge,
      stun: enemyStats.antiStun,
      combo: enemyStats.antiCombo,
      counter: enemyStats.antiCounter
    },
    events,
    rewards: win ? { gold: Math.round(120 * rewardScale), chestTicket: Math.max(1, Math.round(rewardScale / 2)) } : {},
    companions: {
      warSoul: loadout.warSoul?.name,
      beast: loadout.beast?.name,
      beastArtIndex: loadout.beast ? loadout.beastArtIndex ?? ("artIndex" in loadout.beast ? Number(loadout.beast.artIndex) : undefined) : undefined,
      ...(loadout.battlePet ? {
        battlePet: `${BATTLE_PET_AWAKEN_QUALITY_NAMES[Math.max(0, Math.min(5, loadout.battlePet.quality - 1))]}战宠`,
        battlePetArtIndex: Math.max(0, Math.min(5, loadout.battlePet.quality - 1))
      } : {})
    }
  };
}

export function generateNpcs(seed: number): NpcPlayer[] {
  const rng = new GameRng(seed ^ 0xa51ce55);
  const first = ["星野", "云川", "秋原", "北辰", "风间", "青岚", "沉舟", "逐光", "月白", "长歌"];
  const last = ["旅人", "先锋", "骑士", "猎手", "守望", "行者"];
  const guilds = ["晨星旅团", "荒原酒馆", "长风守望", "赤焰营地", "远海之歌"];
  return Array.from({ length: 50 }, (_, index) => {
    const archetype = index < 3 ? "冲榜" : index < 12 ? "豪爽" : index < 32 ? "活跃" : "休闲";
    const level = Math.max(1, 24 - Math.floor(index * 23 / 49));
    const archetypeScale = archetype === "冲榜" ? 1.14 : archetype === "豪爽" ? 1.06 : archetype === "活跃" ? 0.98 : 0.9;
    const power = Math.round(calculatePower(stageEnemy(arenaStageForLevel(level))) * archetypeScale * (0.97 + rng.next() * 0.06));
    return { id: `npc-${index + 1}`, name: `${rng.pick(first)}${rng.pick(last)}`, level, power, rating: Math.max(800, 1800 - index * 17), guild: guilds[index % guilds.length], archetype };
  });
}

export function emptyResources(): Resources {
  return {
    gold: 300, diamond: 0, chestTicket: 20, challengeTicket: 5, soulCore: 0,
    beastEssence: 0, beastEgg: 6, beastEggBlue: 0, beastEggRare: 0, beastEggGold: 0,
    beastEggLegendary: 0, beastEggPerfect: 0, beastEggExtraordinary: 0, experienceSpirit: 0,
    petSoulGrass: 0, petSoulFlower: 0, petSoulFruit: 0,
    beastDevourStone: 0, beastAwakenStone: 0, beastEnhanceStone: 0, beastBoostCharm: 0,
    beastProtectCharm: 0, beastRewindStone: 0, beastExtraordinaryShard: 0, beastMagicCrystal: 0,
    soulCardTicket: 0, soulCardDust: 0,
    huntingStamina: 100, huntingCoin: 0, runeShard: 0, gemTicket: 0, mountWhip: 0, eagleFeather: 0, food: 0,
    steak: 0, artifactOre: 0, flagEssence: 0, wildRune: 0, eggHammer: 0,
    treasuryKey: 0, goldenSnakeToken: 0, guildCoin: 0, merit: 0, trialCoin: 0
  };
}

export function createInitialSave(now = Date.now()): GameSaveV1 {
  const seed = (now ^ 0x9e3779b9) >>> 0;
  const setupRng = new GameRng(seed);
  const growthSystems = createGrowthSystems(setupRng, 1);
  return {
    schemaVersion: 1, createdAt: now, updatedAt: now, day: 1, lastSeenAt: now, rngSeed: setupRng.state, rngDraws: setupRng.draws,
    player: { name: "无畏旅人", level: 1, exp: 0, stage: 1, tower: 1, arenaRating: 1000, arenaWins: 0 },
    resources: emptyResources(), chest: { level: 1, progress: 0, autoOpen: false },
    buildPlan: "crit",
    automation: { autoChest: false, autoStage: false, batch: 10, keepQuality: 4, targetStat: "crit", stopOnUpgrade: false, stopOnQuality: true, speedMode: false },
    counters: {
      chestsOpened: 0, stagesWon: 0, summons: 0, systemsUpgraded: 0, beastHatches: 0,
      beastComposes: 0, warSoulComposes: 0, refines: 0, mountDraws: 0, mountUpgrades: 0,
      runeDraws: 0, runeUpgrades: 0, gemPurchases: 0, gemComposes: 0, artifactForges: 0,
      flagAttempts: 0, territoryPulls: 0, turntableSpins: 0
    }, claimedGoals: [], equipped: {}, gearRefines: {}, loot: [],
    collections: {
      warSouls: {}, beasts: {}, soulCards: {}, beastBoard: Array.from({ length: 16 }, () => null), beastAssists: [], beastAssistPieceIds: [], beastUnlockedSlots: 8, equippedCards: [], soulCardSchemes: [[], [], []], activeSoulCardScheme: 0
    },
    beastEggClock: { lastGeneratedAt: now }, hunting: {}, hunterLevel: 1, hunterExp: 0, lastHunt: [],
    orders: [], totalSpent: 0, claimedVip: [], firstPurchaseProducts: [],
    commerce: { day: 1, shopPurchases: {}, packagePurchases: {}, shopRotation: 0, refreshes: 0, claimedGrowthFree: [], claimedGrowthPremium: [], cardClaimDays: {} },
    claimedActivities: [], upgrades: {},
    growthSystems,
    eventDrops: { day: 1, eggHammers: 0, treasuryKeys: 0 },
    guild: { donatedDay: 0, shopDay: 0, bossWins: 0 }, npcs: generateNpcs(seed),
    fidelityUpgradeV2: true, fidelityUpgradeV3: true, fidelityUpgradeV4: true, fidelityUpgradeV5: true, fidelityUpgradeV6: true, fidelityUpgradeV7: true, fidelityUpgradeV8: true, fidelityUpgradeV9: true, fidelityUpgradeV10: true, fidelityUpgradeV11: true, fidelityUpgradeV12: true
  };
}
