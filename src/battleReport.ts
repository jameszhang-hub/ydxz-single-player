import type { BattleResult, BuildStat, CombatEvent } from "./types";

export type BattleDamageSource = "player" | "warSoul" | "beast" | "battlePet";

export interface BattleReport {
  rounds: number;
  damage: Record<BattleDamageSource, number>;
  totalDamage: number;
  damageTaken: number;
  healing: number;
  triggers: Record<BuildStat, number>;
}

const damageTypes = new Set<CombatEvent["type"]>(["attack", "crit", "combo", "counter", "skill"]);
const playerActors = new Set<CombatEvent["actor"]>(["player", "warSoul", "beast", "battlePet"]);

export function summarizeBattle(result: BattleResult): BattleReport {
  const damage: Record<BattleDamageSource, number> = { player: 0, warSoul: 0, beast: 0, battlePet: 0 };
  const triggers: Record<BuildStat, number> = { crit: 0, dodge: 0, combo: 0, lifesteal: 0, stun: 0, counter: 0 };
  let damageTaken = 0;
  let healing = 0;

  result.events.forEach((event) => {
    const value = Math.max(0, event.value || 0);
    if (damageTypes.has(event.type) && value > 0) {
      if (event.actor === "enemy") damageTaken += value;
      if (event.actor === "player" || event.actor === "warSoul" || event.actor === "beast" || event.actor === "battlePet") damage[event.actor] += value;
    }
    if (event.type === "heal" && playerActors.has(event.actor)) {
      healing += value;
      if (event.text.startsWith("吸血恢复")) triggers.lifesteal += 1;
    }
    if (event.actor === "player") {
      if (event.type === "crit") triggers.crit += 1;
      if (event.type === "combo") triggers.combo += 1;
      if (event.type === "counter") triggers.counter += 1;
      if (event.type === "dodge") triggers.dodge += 1;
      if (event.type === "stun" && event.text.startsWith("击晕生效")) triggers.stun += 1;
    }
  });

  return {
    rounds: Math.max(1, ...result.events.map((event) => event.round)),
    damage,
    totalDamage: Object.values(damage).reduce((sum, value) => sum + value, 0),
    damageTaken,
    healing,
    triggers
  };
}
