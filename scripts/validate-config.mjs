import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const configPath = path.join(root, "config", "game-config.v0.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const beastSourcePath = path.join(root, "src", "config.ts");
const beastMapPath = path.join(root, "config", "beast-atlas-map.tsv");
const beastAtlasPath = path.join(root, "public", "assets", "beast-atlas-original-v1.png");
const trialConfigPath = path.join(root, "config", "trial-monsters.v148.json");

const errors = [];

function checkLootTable(table) {
  if (!Array.isArray(table.rolls)) return;
  const total = table.rolls.reduce((sum, roll) => sum + Number(roll.weight || 0), 0);
  if (total !== config.meta.basisPointsTotal) {
    errors.push(`Loot table ${table.id} sums to ${total}, expected ${config.meta.basisPointsTotal}`);
  }
}

for (const table of config.chests.lootTables || []) {
  checkLootTable(table);
}

const skillIds = new Set(config.attributes.skills.map((skill) => skill.id));
const resistIds = new Set(config.attributes.resists.map((resist) => resist.id));

for (const skill of config.attributes.skills) {
  if (!resistIds.has(skill.resistId)) {
    errors.push(`Skill ${skill.id} references missing resist ${skill.resistId}`);
  }
}

const startCombatAttrs = config.playerStart.combatAttributes || {};
for (const id of [...skillIds, ...resistIds]) {
  if (!(id in startCombatAttrs)) {
    errors.push(`playerStart.combatAttributes is missing ${id}`);
  }
}

const beastSource = fs.readFileSync(beastSourcePath, "utf8");
const beastRows = [...beastSource.matchAll(/\{ id: "(beast-\d+)", name: "([^"]+)", tier: (\d+), faction: "([^"]+)", artIndex: (\d+),/g)]
  .map((match) => ({ id: match[1], name: match[2], tier: Number(match[3]), faction: match[4], artIndex: Number(match[5]) }));
const beastMap = fs.readFileSync(beastMapPath, "utf8").trim().split("\n")
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => {
    const [artIndex, id, name, tier, faction] = line.split("\t");
    return { id, name, tier: Number(tier), faction, artIndex: Number(artIndex) };
  });

if (beastRows.length !== 48 || beastMap.length !== 48) {
  errors.push(`Beast atlas mapping must contain 48 entries (config ${beastRows.length}, manifest ${beastMap.length})`);
} else {
  beastMap.forEach((entry, index) => {
    if (JSON.stringify(entry) !== JSON.stringify(beastRows[index])) {
      errors.push(`Beast atlas mismatch at index ${index}: manifest ${JSON.stringify(entry)}, config ${JSON.stringify(beastRows[index])}`);
    }
  });
}

if (!fs.existsSync(beastAtlasPath)) {
  errors.push("Missing generated beast atlas public/assets/beast-atlas-original-v1.png");
} else {
  const pngHeader = fs.readFileSync(beastAtlasPath).subarray(0, 24);
  const width = pngHeader.readUInt32BE(16);
  const height = pngHeader.readUInt32BE(20);
  if (pngHeader.toString("ascii", 1, 4) !== "PNG" || width !== 2048 || height !== 1536) {
    errors.push(`Beast atlas must be a 2048x1536 PNG, got ${width}x${height}`);
  }
}

if (!fs.existsSync(trialConfigPath)) {
  errors.push("Missing config/trial-monsters.v148.json");
} else {
  const trial = JSON.parse(fs.readFileSync(trialConfigPath, "utf8"));
  const monsters = trial.monsters || [];
  if (trial.meta?.version !== "v148 (2025-04-03)" || trial.meta?.rateUnit !== "percent") {
    errors.push("Trial monster metadata does not match the captured v148 source");
  }
  if (monsters.length !== 1480 || trial.meta?.monsterCount !== monsters.length) {
    errors.push(`Trial monster table must contain 1480 rows, got ${monsters.length}`);
  }
  const first = monsters[0];
  const last = monsters.at(-1);
  if (!first || first.id !== 1 || first.hp !== 1000 || first.attack !== 250 || first.speed !== 100) {
    errors.push("Trial monster 1 no longer matches the captured source");
  }
  if (!last || last.id !== 1580 || last.chapter !== 40 || last.step !== 40) {
    errors.push("Trial monster table no longer ends at captured chapter 40-40");
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Config validation passed.");
