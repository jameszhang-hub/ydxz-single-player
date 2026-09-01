import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight, Check, CircleHelp, Dna, Flame, Gauge, Gift, Leaf, LockKeyhole,
  RefreshCw, Shield, Sparkles, Swords, TrendingUp, X
} from "lucide-react";
import {
  BATTLE_PET_AWAKEN_QUALITY_NAMES, BATTLE_PET_MUTATION_QUALITY_NAMES,
  battlePetAwakenRates, battlePetExpForLevel, battlePetMutationRates,
  powerContributionLosses
} from "./engine";
import { COMBAT_STAT_META } from "./config";
import { useGameStore } from "./store";
import { AtlasArt, fmt, ResourcePill } from "./ui";

type PetTab = "train" | "mutation" | "awaken";
type MutationMaterial = "grass" | "flower" | "fruit";

const mutationMaterials: { id: MutationMaterial; resource: "petSoulGrass" | "petSoulFlower" | "petSoulFruit"; name: string; icon: typeof Leaf }[] = [
  { id: "grass", resource: "petSoulGrass", name: "炼魂草", icon: Leaf },
  { id: "flower", resource: "petSoulFlower", name: "炼魂花", icon: Sparkles },
  { id: "fruit", resource: "petSoulFruit", name: "传说炼魂果", icon: Flame }
];

const mutationColors = ["#64c778", "#62a9e7", "#b983e9", "#e6ca62", "#ef8b4b", "#e55e56"];
const awakeningColors = ["#5ebcce", "#7e80df", "#d9aa4f", "#df6257", "#53c9a8", "#f0d573"];
const skillValue = (value: number) => `${(value / 100).toFixed(2)}%`;

function RateStrip({ rates }: { rates: readonly number[] }) {
  const failure = Math.max(0, 100 - rates.reduce((sum, value) => sum + value, 0));
  return <div className="pet-rate-strip">
    {rates.map((rate, index) => <span key={BATTLE_PET_MUTATION_QUALITY_NAMES[index]} style={{ "--rate-color": mutationColors[index] } as CSSProperties}>
      <i />
      <b>{BATTLE_PET_MUTATION_QUALITY_NAMES[index]}</b>
      <strong>{rate}%</strong>
    </span>)}
    <span className="miss"><i /><b>未突变</b><strong>{failure}%</strong></span>
  </div>;
}

export function BattlePetView({ openProbability }: { openProbability: () => void }) {
  const save = useGameStore((state) => state.save);
  const claimPack = useGameStore((state) => state.claimBattlePetPack);
  const train = useGameStore((state) => state.trainBattlePet);
  const mutate = useGameStore((state) => state.mutateBattlePet);
  const resolveMutation = useGameStore((state) => state.resolveBattlePetMutation);
  const awaken = useGameStore((state) => state.awakenBattlePet);
  const [tab, setTab] = useState<PetTab>("train");
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [material, setMaterial] = useState<MutationMaterial>("grass");
  const mutationPanelRef = useRef<HTMLDivElement>(null);
  const pet = save.growthSystems.battlePet;
  const needed = battlePetExpForLevel(pet.level);
  const mutationRates = battlePetMutationRates(material);
  const awakenRates = battlePetAwakenRates(pet.awakeningLuck);
  const petPower = useMemo(() => powerContributionLosses(save).find((item) => item.name === "战宠")?.value || 0, [save]);
  const resultSlot = pet.pendingSkill?.slot ?? selectedSlot;
  const currentSkill = pet.skills[resultSlot];
  const selectedMaterial = mutationMaterials.find((item) => item.id === material)!;
  const selectedAmount = save.resources[selectedMaterial.resource];
  const artIndex = Math.max(0, Math.min(5, pet.awakeningQuality - 1));
  const levelScale = Math.pow(1.055, Math.max(0, pet.level - 1));
  const qualityScale = 1 + Math.max(0, pet.awakeningQuality - 1) * 0.28;

  useEffect(() => {
    if (!pet.pendingSkill) return;
    const frame = requestAnimationFrame(() => mutationPanelRef.current?.scrollTo({ top: mutationPanelRef.current.scrollHeight, behavior: "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [pet.pendingSkill]);

  return <div className="battle-pet-view">
    <div className="pet-resource-bar">
      <ResourcePill id="petSoulGrass" value={save.resources.petSoulGrass} label />
      <ResourcePill id="petSoulFlower" value={save.resources.petSoulFlower} label />
      <ResourcePill id="petSoulFruit" value={save.resources.petSoulFruit} label />
      <button onClick={claimPack} title="领取单机战宠补给"><Gift /><span>单机补给</span></button>
    </div>

    <section className="pet-stage" style={{ "--pet-quality": awakeningColors[artIndex] } as CSSProperties}>
      <div className="pet-aura"><AtlasArt kind="battlePet" index={artIndex} /></div>
      <div className="pet-identity">
        <small>当前形态</small>
        <h2>{BATTLE_PET_AWAKEN_QUALITY_NAMES[artIndex]}战宠</h2>
        <span>Lv.{pet.level}<i />战力 {fmt(petPower)}</span>
      <div className="pet-mini-stats"><b>生命 +{fmt(Math.round(2800 * levelScale * qualityScale))}</b><b>攻击 +{fmt(Math.round(430 * levelScale * qualityScale))}</b></div>
      </div>
      <button className="pet-help" onClick={openProbability} title="查看战宠公示概率"><CircleHelp /></button>
    </section>

    {tab === "train" && <div className="pet-train-panel">
      <section className="pet-level-band">
        <header><span><Gauge /><b>战宠等级</b></span><strong>{pet.level}<small>/200</small></strong></header>
        <div><i style={{ width: `${pet.level >= 200 ? 100 : Math.min(100, pet.exp / needed * 100)}%` }} /></div>
        <footer><span>{pet.level >= 200 ? "已满级" : `${fmt(pet.exp)} / ${fmt(needed)}`}</span><b>每次培养经验 +60</b></footer>
      </section>
      <div className="pet-stat-ledger">
        <span><Shield /><b>防御</b><strong>+{fmt(Math.round(210 * levelScale * qualityScale))}</strong></span>
        <span><Gauge /><b>速度</b><strong>+{fmt(Math.round(45 * levelScale * qualityScale))}</strong></span>
        <span><Swords /><b>技能词条</b><strong>{skillValue(pet.skills.reduce((sum, skill) => sum + skill.value, 0))}</strong></span>
      </div>
      <div className="pet-growth-preview">
        {[1, 20, 50, 100, 150, 200].map((level) => <span className={pet.level >= level ? "done" : ""} key={level}><i>{pet.level >= level ? <Check /> : <LockKeyhole />}</i><b>Lv.{level}</b><small>{fmt(battlePetExpForLevel(level))}经验阶</small></span>)}
      </div>
      <div className="pet-main-actions">
        <button disabled={pet.level >= 200 || save.resources.petSoulGrass < 1} onClick={() => train(1)}><Leaf />培养 1 次<small>炼魂草 ×1</small></button>
        <button className="primary" disabled={pet.level >= 200 || save.resources.petSoulGrass < 10} onClick={() => train(10)}><TrendingUp />培养 10 次<small>炼魂草 ×10</small></button>
      </div>
    </div>}

    {tab === "mutation" && <div className="pet-mutation-panel" ref={mutationPanelRef}>
      <section className="pet-skill-slots" aria-label="战宠技能槽">
        {pet.skills.map((skill, index) => <button key={skill.id} disabled={Boolean(pet.pendingSkill)} className={selectedSlot === index ? "selected" : ""} onClick={() => setSelectedSlot(index)} style={{ "--skill-color": mutationColors[skill.quality - 1] } as CSSProperties}>
          <i>{index + 1}</i><span><strong>{skill.name}</strong><small>{skill.category} · {COMBAT_STAT_META[skill.stat].name} +{skillValue(skill.value)}</small></span><b>{BATTLE_PET_MUTATION_QUALITY_NAMES[skill.quality - 1]}</b>
        </button>)}
      </section>

      <section className="pet-material-picker">
        <header><span><Dna /><b>突变材料</b></span><small>已选第 {selectedSlot + 1} 槽</small></header>
        <div>{mutationMaterials.map((item) => { const Icon = item.icon; return <button key={item.id} className={material === item.id ? "active" : ""} onClick={() => setMaterial(item.id)}><Icon /><strong>{item.name}</strong><small>拥有 {fmt(save.resources[item.resource])}</small></button>; })}</div>
      </section>

      <section className="pet-official-rates">
        <header><span>本次品质概率</span><button onClick={openProbability}><CircleHelp />全部公示</button></header>
        <RateStrip rates={mutationRates} />
      </section>

      {pet.pendingSkill && <section className="pet-mutation-result">
        <header><Dna /><span><strong>突变结果</strong><small>第 {resultSlot + 1} 技能槽</small></span></header>
        <div className="pet-skill-compare">
          <article style={{ "--skill-color": mutationColors[currentSkill.quality - 1] } as CSSProperties}><small>原技能</small><strong>{currentSkill.name}</strong><span>{currentSkill.category}</span><b>{COMBAT_STAT_META[currentSkill.stat].name} +{skillValue(currentSkill.value)}</b></article>
          <ArrowRight />
          <article className="new" style={{ "--skill-color": mutationColors[pet.pendingSkill.quality - 1] } as CSSProperties}><small>新技能</small><strong>{pet.pendingSkill.name}</strong><span>{pet.pendingSkill.category}</span><b>{COMBAT_STAT_META[pet.pendingSkill.stat].name} +{skillValue(pet.pendingSkill.value)}</b></article>
        </div>
        <footer><button onClick={() => resolveMutation(false)}><X />保留原技能</button><button className="primary" onClick={() => resolveMutation(true)}><Check />替换技能</button></footer>
      </section>}
      {!pet.pendingSkill && pet.lastMutation && <div className="pet-inline-result"><Dna /><span>{pet.lastMutation}</span></div>}
      {!pet.pendingSkill && <button className="pet-mutate-button" disabled={selectedAmount < 1} onClick={() => mutate(material, selectedSlot)}><RefreshCw />突变第 {selectedSlot + 1} 槽<small>{selectedMaterial.name} ×1</small></button>}
    </div>}

    {tab === "awaken" && <div className="pet-awaken-panel">
      <section className="pet-awaken-track">
        {BATTLE_PET_AWAKEN_QUALITY_NAMES.map((name, index) => <span key={name} className={pet.awakeningQuality > index ? "done" : pet.awakeningQuality === index + 1 ? "current" : ""} style={{ "--awaken-color": awakeningColors[index] } as CSSProperties}>
          <i>{pet.awakeningQuality > index ? <Check /> : index + 1}</i><b>{name}</b>
        </span>)}
      </section>
      <section className="pet-luck-meter">
        <header><span><Sparkles />觉醒幸运</span><strong>{pet.awakeningLuck}<small>/2500</small></strong></header>
        <div><i style={{ width: `${Math.min(100, pet.awakeningLuck / 25)}%` }} /></div>
        <footer>{pet.lastAwakening || "等待觉醒"}</footer>
      </section>
      <section className="pet-awaken-rates">
        <header><span>当前幸运档位概率</span><button onClick={openProbability}><CircleHelp />全部公示</button></header>
        <div>{awakenRates.map((rate, index) => <span className={rate ? "available" : ""} key={BATTLE_PET_AWAKEN_QUALITY_NAMES[index]} style={{ "--awaken-color": awakeningColors[index] } as CSSProperties}><i /><b>{BATTLE_PET_AWAKEN_QUALITY_NAMES[index]}</b><strong>{rate}%</strong></span>)}</div>
      </section>
      <button className="pet-awaken-button primary" disabled={pet.awakeningQuality >= 6 || save.resources.petSoulFruit < 1} onClick={awaken}><Flame />{pet.awakeningQuality >= 6 ? "已完全觉醒" : "觉醒一次"}<small>传说炼魂果 ×1</small></button>
    </div>}

    <nav className="pet-tabs" aria-label="战宠养成分类">
      <button className={tab === "train" ? "active" : ""} onClick={() => setTab("train")}><TrendingUp />培养</button>
      <button className={tab === "mutation" ? "active" : ""} onClick={() => setTab("mutation")}><Dna />突变</button>
      <button className={tab === "awaken" ? "active" : ""} onClick={() => setTab("awaken")}><Flame />觉醒</button>
    </nav>
  </div>;
}
