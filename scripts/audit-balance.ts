import { ARTIFACTS, BEASTS, GEM_COLORS, HUNTING_POOL, MOUNTS, RUNES, SLOTS, SOUL_CARDS, WAR_SOULS } from "../src/config";
import {
  ARTIFACT_MAX_LEVEL, GameRng, arenaEnemyStats, battleLoadoutFromSave, calculatePlayerStats, calculatePower, createInitialSave,
  generateEquipment, generateNpcs, powerContributionLosses, rebalanceEquipment, rollMountAttribute, runBattle, stageEnemy
} from "../src/engine";
import type { GameSaveV1, GrowthAffix } from "../src/types";

const save = createInitialSave(20260721);
const player = calculatePlayerStats(save);
console.log("starter", { stats: player, power: calculatePower(player) });

for (const stage of [1, 2, 5, 10, 20, 25, 30, 40, 50, 75, 100, 137, 200]) {
  const enemy = stageEnemy(stage);
  const results = Array.from({ length: 50 }, (_, seed) => runBattle(player, enemy, new GameRng(stage * 1000 + seed), 1, battleLoadoutFromSave(save)));
  const wins = results.filter((result) => result.win).length;
  const rounds = results.map((result) => result.events.at(-1)?.round || 0);
  console.log(stage, {
    power: calculatePower(enemy),
    hp: enemy.hp,
    attack: enemy.attack,
    defense: enemy.defense,
    wins,
    minRound: Math.min(...rounds),
    maxRound: Math.max(...rounds),
    avgRound: Math.round(rounds.reduce((sum, round) => sum + round, 0) / rounds.length * 10) / 10
  });
}

console.log("day-one arena", generateNpcs(20260721).slice(-8).map((npc) => ({
  level: npc.level,
  shownPower: npc.power,
  battlePower: calculatePower(arenaEnemyStats(npc))
})));

type AuditProfile = {
  name: string;
  level: number;
  gearQuality: number;
  systemLevel: number;
  soulStage: number;
  cardStage: number;
  beastStage: number;
  beastStars: number;
  beastDevour: number;
  gemLevel: number;
  flagLevel: number;
  territoryReputation: number;
};

const auditProfiles: AuditProfile[] = [
  { name: "early", level: 20, gearQuality: 2, systemLevel: 8, soulStage: 1, cardStage: 1, beastStage: 1, beastStars: 0, beastDevour: 0, gemLevel: 2, flagLevel: 5, territoryReputation: 20 },
  { name: "mid", level: 60, gearQuality: 5, systemLevel: 25, soulStage: 3, cardStage: 2, beastStage: 2, beastStars: 1, beastDevour: 5, gemLevel: 4, flagLevel: 35, territoryReputation: 100 },
  { name: "mature", level: 137, gearQuality: 7, systemLevel: 55, soulStage: 5, cardStage: 4, beastStage: 4, beastStars: 2, beastDevour: 15, gemLevel: 6, flagLevel: 80, territoryReputation: 300 },
  { name: "limit", level: 200, gearQuality: 8, systemLevel: 100, soulStage: 7, cardStage: 6, beastStage: 6, beastStars: 3, beastDevour: 30, gemLevel: 8, flagLevel: 120, territoryReputation: 1000 }
];

function buildAuditSave(profile: AuditProfile): GameSaveV1 {
  const save = createInitialSave(20260721 + profile.level);
  const rng = new GameRng(0x51f15e + profile.level);
  save.player.level = profile.level;
  save.player.stage = Math.max(1, Math.round(profile.level * 1.1));
  SLOTS.forEach((slot) => {
    const item = generateEquipment(Math.max(1, profile.level - 2), 31, rng);
    item.slot = slot.id;
    item.quality = profile.gearQuality;
    save.equipped[slot.id] = rebalanceEquipment(item);
    save.gearRefines[slot.id] = Math.min(12, Math.floor(profile.systemLevel / 8));
  });

  const warSoul = WAR_SOULS.at(-1)!;
  save.collections.warSouls[warSoul.id] = {
    count: 1, stage: profile.soulStage, level: Math.min(100, profile.systemLevel), refine: 0, luck: 0,
    refineStar: 1, refineAttributes: [], refineEntries: [], previousRefineAttributes: [], pendingRefine: []
  };
  save.collections.deployedWarSoul = warSoul.id;

  const combatBeast = [...BEASTS].reverse().find((item) => item.tier === 7 && item.mergeEligible !== false) || BEASTS.at(-1)!;
  BEASTS.slice(0, Math.min(BEASTS.length, profile.level < 60 ? 4 : profile.level < 137 ? 12 : 24)).forEach((beast) => {
    save.collections.beasts[beast.id] = { count: 1, discovered: true, level: 1, exp: 0, stars: 0, affixes: [], pendingAffixes: [], devourLevel: 0 };
  });
  save.collections.beasts[combatBeast.id] = {
    count: 1, discovered: true, level: Math.min(100, profile.systemLevel), exp: 0, stars: profile.beastStars,
    stage: profile.beastStage, affixes: [], pendingAffixes: [], devourLevel: Math.min(20, profile.beastDevour),
    enhanceLevel: Math.min(10, profile.beastDevour)
  };
  save.collections.deployedBeast = combatBeast.id;

  const cardCount = profile.level < 60 ? 3 : profile.level < 137 ? 6 : 12;
  SOUL_CARDS.slice(-cardCount).forEach((card) => {
    save.collections.soulCards[card.id] = { count: 1, level: Math.min(60, profile.systemLevel), stage: profile.cardStage };
    save.collections.equippedCards.push(card.id);
  });
  save.collections.soulCardSchemes[0] = [...save.collections.equippedCards];

  save.growthSystems.battlePet.level = Math.min(200, profile.systemLevel * 2);
  save.growthSystems.battlePet.awakeningQuality = Math.min(6, Math.max(1, profile.cardStage));
  save.growthSystems.warEagle.levels.crit = Math.min(80, profile.systemLevel);

  const mount = { id: `audit-mount-${profile.name}`, definitionId: MOUNTS.at(-1)!.id, quality: Math.min(4, Math.max(1, profile.cardStage)) as 1 | 2 | 3 | 4, level: 1, attributes: [] as GrowthAffix[] };
  while (mount.level < Math.min(80, profile.systemLevel)) {
    const rolled = rollMountAttribute(mount, rng);
    const existing = mount.attributes.find((item) => item.stat === rolled.stat);
    if (existing) existing.value += rolled.value;
    else mount.attributes.push(rolled);
    mount.level += 1;
  }
  save.growthSystems.mount.mounts = [mount];
  save.growthSystems.mount.activeId = mount.id;

  const runeCount = profile.level < 60 ? 1 : profile.level < 137 ? 2 : 3;
  RUNES.filter((rune) => rune.tier === 3).slice(0, runeCount).forEach((rune) => {
    save.growthSystems.runes.inventory[rune.id] = 1;
    save.growthSystems.runes.levels[rune.id] = Math.min(20, Math.max(1, Math.round(profile.systemLevel / 4)));
    save.growthSystems.runes.equipped.push(rune.id);
  });
  GEM_COLORS.forEach((gem) => {
    for (let slot = 0; slot < 5; slot += 1) save.growthSystems.gems.sockets[`${gem.id}-${slot}`] = { color: gem.id, level: profile.gemLevel };
  });
  const artifact = ARTIFACTS.at(-1)!;
  save.growthSystems.artifact.owned[artifact.id] = { count: 1, level: Math.min(ARTIFACT_MAX_LEVEL, Math.max(1, Math.round(profile.systemLevel / 7))) };
  save.growthSystems.artifact.equipped = artifact.id;
  save.growthSystems.flag.level = profile.flagLevel;
  save.growthSystems.territory.reputation = profile.territoryReputation;
  HUNTING_POOL.slice(0, Math.min(HUNTING_POOL.length, Math.round(profile.level / 3))).forEach((item) => { save.hunting[item.id] = 1; });
  return save;
}

console.log("growth power budgets");
const audited: { name: string; power: number; contributions: ReturnType<typeof powerContributionLosses> }[] = [];
for (const profile of auditProfiles) {
  const profileSave = buildAuditSave(profile);
  const power = calculatePower(calculatePlayerStats(profileSave));
  const contributions = powerContributionLosses(profileSave);
  audited.push({ name: profile.name, power, contributions });
  console.log(profile.name, {
    level: profile.level,
    power,
    shares: Object.fromEntries(contributions.map((item) => [item.name, `${(item.value / power * 100).toFixed(1)}%`]))
  });
}

const mature = audited.find((item) => item.name === "mature")!;
const limit = audited.find((item) => item.name === "limit")!;
if (mature.power < 45_000_000 || mature.power > 65_000_000) throw new Error(`mature power escaped budget: ${mature.power}`);
if (limit.power < mature.power * 1.8 || limit.power > 160_000_000) throw new Error(`limit power escaped budget: ${limit.power}`);
for (const profile of [mature, limit]) {
  const largestSystemShare = Math.max(...profile.contributions.slice(1).map((item) => item.value / profile.power));
  const levelShare = profile.contributions[0].value / profile.power;
  if (largestSystemShare >= 0.25) throw new Error(`${profile.name} is dominated by one system: ${(largestSystemShare * 100).toFixed(1)}%`);
  if (levelShare < 0.28) throw new Error(`${profile.name} character-level share is too small: ${(levelShare * 100).toFixed(1)}%`);
}
