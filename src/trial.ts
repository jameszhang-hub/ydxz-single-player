import trialConfig from "../config/trial-monsters.v148.json";
import { EMPTY_STATS } from "./config";
import type { CombatStats } from "./types";

export interface TrialMonsterDefinition {
  id: number;
  chapter: number;
  chapterName: string;
  step: number;
  speed: number;
  hp: number;
  attack: number;
  defense: number;
  lifesteal: number;
  antiLifesteal: number;
  counter: number;
  antiCounter: number;
  combo: number;
  antiCombo: number;
  dodge: number;
  antiDodge: number;
  crit: number;
  antiCrit: number;
  stun: number;
  antiStun: number;
}

export const TRIAL_META = trialConfig.meta;
export const TRIAL_MONSTERS = trialConfig.monsters as TrialMonsterDefinition[];

export function trialMonsterAt(progress: number) {
  const index = Math.max(0, Math.min(TRIAL_MONSTERS.length - 1, Math.floor(progress) - 1));
  return TRIAL_MONSTERS[index];
}

export function trialStageLabel(progress: number) {
  const monster = trialMonsterAt(progress);
  if (progress <= TRIAL_MONSTERS.length) return `${monster.chapter}-${monster.step}`;
  return `${monster.chapter}-${monster.step}+${Math.floor(progress) - TRIAL_MONSTERS.length}`;
}

export function trialEnemyStats(progress: number): CombatStats {
  const monster = trialMonsterAt(progress);
  const overflow = Math.max(0, Math.floor(progress) - TRIAL_MONSTERS.length);
  const baseScale = Math.pow(1.035, overflow);
  const rateScale = Math.pow(1.006, overflow);
  const rate = (value: number) => Math.round(value * 100 * rateScale);
  return {
    ...EMPTY_STATS,
    hp: Math.round(monster.hp * baseScale),
    attack: Math.round(monster.attack * baseScale),
    defense: Math.round(monster.defense * baseScale),
    speed: Math.round(monster.speed * baseScale),
    lifesteal: rate(monster.lifesteal),
    counter: rate(monster.counter),
    combo: rate(monster.combo),
    dodge: rate(monster.dodge),
    crit: rate(monster.crit),
    stun: rate(monster.stun),
    antiLifesteal: rate(monster.antiLifesteal),
    antiCounter: rate(monster.antiCounter),
    antiCombo: rate(monster.antiCombo),
    antiDodge: rate(monster.antiDodge),
    antiCrit: rate(monster.antiCrit),
    antiStun: rate(monster.antiStun)
  };
}
