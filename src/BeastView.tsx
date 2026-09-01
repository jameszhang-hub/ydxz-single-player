import {
  useEffect, useMemo, useRef, useState,
  type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode
} from "react";
import {
  ArrowLeft, ArrowLeftRight, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, Coins, Crown,
  Egg, Flame, Gem, Ghost, Grid3X3, LockKeyhole, LockKeyholeOpen, MoreHorizontal,
  Leaf, MoonStar, PackageOpen, PawPrint, Plus, Puzzle, RefreshCw, RotateCcw, Shield,
  Settings2, SlidersHorizontal, Sparkles, Star, SunMedium, Swords, TimerReset, Undo2, Users, WandSparkles,
  Waves, X, Zap
} from "lucide-react";
import {
  BEASTS, BEAST_CODEX_SLOTS, BEAST_EGG_TYPES, BEAST_EVOLUTIONS, BEAST_FACTIONS, BEAST_QUALITIES,
  COMBAT_STAT_META, beastDisplayArtIndex
} from "./config";
import {
  beastAssistRate, beastAwakenMaterialCount, beastDevourPreview, beastExpForLevel, beastRerollCost, beastSkillWashGradeRates, beastSpiritExp, calculatePlayerStats, calculatePower,
  powerContributionLosses
} from "./engine";
import { useGameStore } from "./store";
import { AtlasArt, fmt, ResourcePill } from "./ui";
import type {
  BeastBoardPiece, BeastDefinition, BeastEggKind, BeastFaction, CombatStats, GrowthAffix
} from "./types";

type Screen = "board" | "detail" | "codex" | "awaken";
type DetailTab = "detail" | "wash" | "devour" | "ascend";
type AwakenTab = "awaken" | "strengthen";
type GuidePage = { title: string; body: ReactNode; visual: ReactNode };

const detailTabs: { id: DetailTab; label: string; icon: typeof PawPrint }[] = [
  { id: "detail", label: "魔兽详情", icon: PawPrint },
  { id: "wash", label: "技能洗炼", icon: WandSparkles },
  { id: "devour", label: "魔兽吞噬", icon: Ghost },
  { id: "ascend", label: "魔兽升阶", icon: Crown }
];

const percentStats = new Set<keyof CombatStats>([
  "lifesteal", "crit", "dodge", "stun", "combo", "counter", "antiLifesteal",
  "antiCrit", "antiDodge", "antiStun", "antiCombo", "antiCounter", "critDamage",
  "tenacity", "healing", "recovery", "damageBonus", "damageReduction", "beastStrength"
]);

const boardHelp: GuidePage[] = [
  { title: "出征", visual: <><AtlasArt kind="beast" index={2} /><ChevronRight /><Swords /></>, body: <>把兽栏魔兽拖到顶部出战格即可出战；从出战格拖回下方空格即可卸下。</> },
  { title: "查看详情", visual: <><AtlasArt kind="beast" index={0} /><ChevronRight /><BookOpen /></>, body: <>点击兽栏中的魔兽，可以查看成长、技能、吞噬与升阶信息。</> },
  { title: "经验精灵", visual: <><AtlasArt kind="beast" index={13} /><ChevronRight /><AtlasArt kind="beast" index={15} /></>, body: <>经验精灵也是可出战、助战和培养的魔兽。拖到任意魔兽（包括其他经验精灵）上时，会转化为等级经验。</> },
  { title: "锁定", visual: <><AtlasArt kind="beast" index={1} /><LockKeyhole /></>, body: <>锁定魔兽不能参与合成，但仍可培养、出战和助战。</> },
  { title: "魔兽助战", visual: <><Users /><AtlasArt kind="beast" index={6} /><AtlasArt kind="beast" index={22} /><AtlasArt kind="beast" index={34} /></>, body: <>最多选择 3 只助战魔兽。助战属性按品质比例生效，品质越高，生效比例越高。</> },
  { title: "拖动与合成", visual: <><AtlasArt kind="beast" index={0} /><Plus /><AtlasArt kind="beast" index={14} /><ChevronRight /><Sparkles /></>, body: <>魔兽可拖到空格移动，也可拖到不同品质魔兽上换位。两只普通同品质魔兽叠放时进行概率合成。</> }
];

const awakenHelp: GuidePage[] = [
  { title: "超凡觉醒", visual: <><AtlasArt kind="beast" index={8} /><Plus /><span className="rate-orb high">任意</span><ChevronRight /><AtlasArt kind="beast" index={9} /></>, body: <>魔兽达到超凡级后，可以通过觉醒继续提升星级或品质。</> },
  { title: "觉醒与强化", visual: <><span className="rate-orb high">+9</span><Flame /><span className="rate-orb low">+6</span><ChevronRight /><span className="rate-orb high">+10</span></>, body: <>魔兽达到超凡 1 星后开启强化。强化有一定概率成功，成功后强化等级 +1；失败时有一定概率使强化等级降低 1-3 级。</> },
  { title: "强化道具", visual: <><Zap /><Plus /><Shield /><ChevronRight /><Sparkles /></>, body: <>强化时可以额外添加增率道具提高成功概率，也可以添加失败保护道具避免本次强化掉级。</> },
  { title: "强化回溯", visual: <><span className="rate-orb low">+6</span><Undo2 /><span className="rate-orb high">+9</span></>, body: <>强化失败降低等级后，可以通过回溯恢复到本次强化之前；回溯等级越高，消耗越高。</> }
];

const factionIcons = { nature: Leaf, element: Waves, shadow: MoonStar, legend: SunMedium } as const;

function quality(tier: number) {
  return BEAST_QUALITIES[Math.max(0, Math.min(BEAST_QUALITIES.length - 1, tier - 1))];
}

function sourceLabel(definition: BeastDefinition) {
  if (definition.isExperienceSpirit) return "经验精灵";
  return BEAST_FACTIONS.find((item) => item.id === definition.faction)?.name || "魔兽";
}

function mergeExamples(tier: number) {
  const materials = BEASTS.filter((definition) => definition.tier === tier - 1 && definition.mergeEligible !== false);
  const pairs = materials.flatMap((left, leftIndex) => materials
    .slice(leftIndex)
    .map((right) => [left, right] as const));
  return [...pairs.filter(([left, right]) => left.faction !== right.faction), ...pairs.filter(([left, right]) => left.faction === right.faction)].slice(0, 4);
}

function formatRemaining(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${rest}`;
}

function affixValue(affix: GrowthAffix) {
  return affix.percent ? `${(affix.value / 100).toFixed(2)}%` : fmt(affix.value);
}

function statValue(stat: keyof CombatStats, value: number) {
  return percentStats.has(stat) ? `${(value / 100).toFixed(2)}%` : fmt(value);
}

function growthFor(definition: BeastDefinition) {
  const hp = [0, 100, 200, 300, 500, 700, 1000, 1500, 2000][definition.tier];
  return {
    speed: [0, 3, 4, 5, 6, 7, 8, 9, 10][definition.tier],
    attack: Math.round(hp / 4),
    hp,
    defense: Math.round(hp / 10)
  };
}

function SkillRows({ affixes, pending = false }: { affixes: GrowthAffix[]; pending?: boolean }) {
  return <div className="original-skill-list">
    {Array.from({ length: 4 }, (_, index) => {
      const affix = affixes[index];
      const grade = affix?.grade || 1;
      return <article className={affix ? `grade-${grade}` : "empty"} key={affix?.id || `empty-${index}`}>
        <i>{affix ? ["初", "中", "高"][grade - 1] : "?"}</i>
        <span><strong>{affix?.name || (pending ? "等待洗炼" : "未解锁技能")}</strong><small>{affix ? `Lv.${affix.refineLevel || 1}/${affix.refineCap || 20}` : `被动技能 ${index + 1}`}</small></span>
        <b>{affix ? `+${affixValue(affix)}` : "-"}</b>
      </article>;
    })}
  </div>;
}

function GuideModal({ pages, page, setPage, close }: {
  pages: GuidePage[];
  page: number;
  setPage: (page: number) => void;
  close: () => void;
}) {
  const current = pages[page];
  return <div className="beast-guide-mask" onClick={close}>
    <section className="beast-guide-card" onClick={(event) => event.stopPropagation()}>
      <header><span>玩法说明</span><button aria-label="关闭玩法说明" onClick={close}><X /></button></header>
      <div className="guide-illustration"><div className="guide-scene">{current.visual}</div><strong>{current.title}</strong></div>
      <p>{current.body}</p>
      <button className="guide-arrow left" aria-label="上一页" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft /></button>
      <button className="guide-arrow right" aria-label="下一页" disabled={page === pages.length - 1} onClick={() => setPage(page + 1)}><ChevronRight /></button>
      <div className="guide-dots">{pages.map((_, index) => <i className={index === page ? "active" : ""} key={index} />)}</div>
    </section>
  </div>;
}

function BeastRateModal({ close }: { close: () => void }) {
  const rows = [
    ["合成精良级魔兽", "90%"], ["合成稀有级魔兽", "80%"],
    ["合成史诗级魔兽", "60%"], ["合成传说级魔兽", "30%"],
    ["合成完美级魔兽", "20%"], ["合成超凡级魔兽", "10%"]
  ];
  return <div className="beast-system-mask" onClick={close}>
    <section className="beast-system-card" onClick={(event) => event.stopPropagation()}>
      <header><strong>系统说明</strong><button aria-label="关闭合成概率说明" onClick={close}><X /></button></header>
      <h3>合成概率</h3>
      <div>{rows.map(([name, rate]) => <span key={name}><b>{name}</b><strong>{rate}</strong></span>)}</div>
      <p>超凡魔兽不在兽栏继续合并；请从详情进入觉醒页，消耗其他超凡魔兽提升到 1 星、2 星、3 星，之后提升为对应璀璨品质。</p>
      <p>完美合成超凡失败必得完美经验精灵 ×1 和超凡魔兽碎片 ×1；集齐 5 个碎片可合成 1 只随机基础超凡魔兽。每次普通合成还会按公示概率独立判定魔晶。</p>
    </section>
  </div>;
}

function BeastTopBar({ back }: { back?: () => void }) {
  const save = useGameStore((state) => state.save);
  return <div className="original-beast-topbar">
    {back && <button className="topbar-back" aria-label="返回" onClick={back}><ArrowLeft /></button>}
    <ResourcePill id="diamond" value={save.resources.diamond} />
    <ResourcePill id="beastMagicCrystal" value={save.resources.beastMagicCrystal} />
    <ResourcePill id="beastExtraordinaryShard" value={save.resources.beastExtraordinaryShard} />
  </div>;
}

function PieceArt({ piece, stars = 0 }: { piece: BeastBoardPiece; stars?: number }) {
  const definition = BEASTS.find((item) => item.id === piece.definitionId);
  if (piece.kind === "spirit") return <>
    <AtlasArt kind="beast" index={definition?.artIndex ?? 13} />
    <span className="spirit-exp">EXP</span><b className="piece-count">{piece.state?.level || 1}</b>
    {piece.protected && <LockKeyhole className="piece-lock" />}
  </>;
  if (!definition) return <PawPrint />;
  return <>
    <AtlasArt kind="beast" index={beastDisplayArtIndex(definition.id, stars)} />
    <b className="piece-count">{piece.state?.level || 1}</b>
    {piece.protected && <LockKeyhole className="piece-lock" />}
  </>;
}

export function BeastView({ onClose }: { onClose: () => void }) {
  const save = useGameStore((state) => state.save);
  const notice = useGameStore((state) => state.notice);
  const hatch = useGameStore((state) => state.hatchBeasts);
  const moveSlot = useGameStore((state) => state.moveBeastSlot);
  const deployFromSlot = useGameStore((state) => state.deployBeastFromSlot);
  const returnDeployedToSlot = useGameStore((state) => state.returnDeployedBeastToSlot);
  const mergeSlots = useGameStore((state) => state.mergeBeastSlots);
  const feedSpirit = useGameStore((state) => state.feedBeastSpirit);
  const autoMerge = useGameStore((state) => state.autoMergeBeasts);
  const organize = useGameStore((state) => state.organizeBeastBoard);
  const lockPiece = useGameStore((state) => state.toggleBeastPieceLock);
  const sandboxPack = useGameStore((state) => state.claimBeastSandboxPack);
  const buyEggs = useGameStore((state) => state.buyBeastEggs);
  const synthesizeExtraordinary = useGameStore((state) => state.synthesizeExtraordinaryBeast);
  const unlockSlots = useGameStore((state) => state.unlockBeastSlots);
  const deploy = useGameStore((state) => state.deploy);
  const toggleAssist = useGameStore((state) => state.toggleBeastAssist);
  const reroll = useGameStore((state) => state.rerollBeastAffixes);
  const resolveAffixes = useGameStore((state) => state.resolveBeastAffixes);
  const upgradeSkill = useGameStore((state) => state.upgradeBeastSkill);
  const devourInstances = useGameStore((state) => state.devourBeastInstances);
  const devourEssence = useGameStore((state) => state.devourBeastEssence);
  const ascend = useGameStore((state) => state.ascendBeast);
  const awaken = useGameStore((state) => state.awakenBeast);
  const strengthen = useGameStore((state) => state.strengthenBeast);
  const rewindStrength = useGameStore((state) => state.rewindBeastStrength);
  const fastForwardEgg = useGameStore((state) => state.fastForwardBeastEgg);

  const board = save.collections.beastBoard;
  const [screen, setScreen] = useState<Screen>("board");
  const [detailTab, setDetailTab] = useState<DetailTab>("detail");
  const [awakenTab, setAwakenTab] = useState<AwakenTab>("awaken");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(save.collections.deployedBeastPiece?.id || save.collections.deployedBeast || null);
  const [assistOpen, setAssistOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [eggPurchaseMode, setEggPurchaseMode] = useState(false);
  const [eggBuyKind, setEggBuyKind] = useState<BeastEggKind | null>(null);
  const [eggBuyCount, setEggBuyCount] = useState(1);
  const [guidePage, setGuidePage] = useState<number | null>(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [awakenGuidePage, setAwakenGuidePage] = useState<number | null>(null);
  const [codexFaction, setCodexFaction] = useState<BeastFaction | null>(null);
  const [codexDetailId, setCodexDetailId] = useState<string | null>(null);
  const [codexFull, setCodexFull] = useState(false);
  const [devourMode, setDevourMode] = useState<"beasts" | "essence">("beasts");
  const [devourMaterialIds, setDevourMaterialIds] = useState<string[]>([]);
  const [devourEssenceAmount, setDevourEssenceAmount] = useState(10);
  const [useBoost, setUseBoost] = useState(false);
  const [useProtect, setUseProtect] = useState(false);
  const [awakenMaterialIds, setAwakenMaterialIds] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const [mergeFx, setMergeFx] = useState(false);
  const [hatchFx, setHatchFx] = useState<BeastEggKind | null>(null);
  const [drag, setDrag] = useState<{ source: number; target: number | null; x: number; y: number; active: boolean } | null>(null);
  const dragStart = useRef<{ pointerId: number; source: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedPiece = selectedIndex == null
    ? save.collections.deployedBeastPiece && (save.collections.deployedBeastPiece.id === selectedId || save.collections.deployedBeastPiece.definitionId === selectedId)
      ? save.collections.deployedBeastPiece
      : null
    : board[selectedIndex];
  const selectedDefinition = BEASTS.find((item) => item.id === (selectedPiece?.definitionId || selectedId));
  const selectedState = selectedPiece?.state || (selectedDefinition ? save.collections.beasts[selectedDefinition.id] : undefined);
  const selectedEvolutionId = selectedDefinition ? BEAST_EVOLUTIONS[selectedDefinition.id] : undefined;
  const selectedEvolution = BEASTS.find((item) => item.id === selectedEvolutionId);
  const qualityAwakenReady = Boolean(selectedDefinition?.tier === 7 && selectedState && selectedState.stars >= 3);
  const awakenAtMax = Boolean(selectedDefinition && selectedDefinition.tier >= 8);
  const awakenNeedsStrength = Boolean(selectedState && selectedState.stars > 0 && (selectedState.enhanceLevel || 0) < 10);
  const awakenMaterialCount = selectedDefinition?.tier === 7 && selectedState ? beastAwakenMaterialCount(selectedState.stars) : 0;
  const washGradeRates = beastSkillWashGradeRates(selectedDefinition?.tier || 1);
  const awakenCandidates = board.filter((piece): piece is BeastBoardPiece => Boolean(piece
    && piece.id !== selectedPiece?.id
    && piece.kind !== "spirit"
    && piece.tier === 7
    && !piece.protected
    && !save.collections.beastAssistPieceIds?.includes(piece.id)))
    .sort((left, right) => (left.state?.stars || 0) - (right.state?.stars || 0)
      || (left.state?.enhanceLevel || 0) - (right.state?.enhanceLevel || 0)
      || (left.state?.level || 1) - (right.state?.level || 1));
  const selectedAwakenMaterials = awakenMaterialIds
    .map((id) => board.find((piece) => piece?.id === id))
    .filter(Boolean) as BeastBoardPiece[];
  const deployedDefinition = BEASTS.find((item) => item.id === (save.collections.deployedBeastPiece?.definitionId || save.collections.deployedBeast));
  const deployedState = save.collections.deployedBeastPiece?.state || (deployedDefinition ? save.collections.beasts[deployedDefinition.id] : undefined);
  const totalStats = useMemo(() => calculatePlayerStats(save), [save]);
  const totalPower = useMemo(() => calculatePower(totalStats), [totalStats]);
  const beastPower = useMemo(() => powerContributionLosses(save).find((item) => item.name === "魔兽")?.value || 0, [save]);
  const remaining = Math.max(0, 21_600_000 - (now - save.beastEggClock.lastGeneratedAt));
  const occupied = board.filter((piece, index) => index < save.collections.beastUnlockedSlots && piece).length;
  const spaces = save.collections.beastUnlockedSlots - occupied;
  const codexTotals = useMemo(() => BEASTS.reduce((totals, definition) => {
    if (!save.collections.beasts[definition.id]?.discovered) return totals;
    Object.entries(definition.codexBonus).forEach(([key, value]) => {
      totals[key as keyof CombatStats] = (totals[key as keyof CombatStats] || 0) + Number(value || 0);
    });
    return totals;
  }, {} as Partial<Record<keyof CombatStats, number>>), [save.collections.beasts]);

  const openPiece = (index: number) => {
    const piece = board[index];
    if (!piece) return;
    setSelectedIndex(index);
    setSelectedId(piece.id);
    setDetailTab("detail");
    setScreen("detail");
  };

  const dragTargetAt = (x: number, y: number, source: number) => {
    const hovered = document.elementFromPoint(x, y);
    if (source >= 0 && hovered?.closest<HTMLElement>("[data-beast-altar]")) return -1;
    const element = hovered?.closest<HTMLElement>("[data-beast-slot]");
    const target = Number(element?.dataset.beastSlot);
    if (!Number.isInteger(target) || target === source) return null;
    const sourcePiece = source === -1 ? save.collections.deployedBeastPiece : board[source];
    if (!sourcePiece || target < 0 || target >= save.collections.beastUnlockedSlots) return null;
    return target;
  };

  const pointerDown = (event: ReactPointerEvent<HTMLButtonElement>, source: number) => {
    const piece = source === -1 ? save.collections.deployedBeastPiece : board[source];
    if (!piece || source >= save.collections.beastUnlockedSlots) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { pointerId: event.pointerId, source, x: event.clientX, y: event.clientY };
    setDrag({ source, target: null, x: event.clientX, y: event.clientY, active: false });
  };

  const pointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const active = Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7;
    if (active) event.preventDefault();
    setDrag({ source: start.source, target: active ? dragTargetAt(event.clientX, event.clientY, start.source) : null, x: event.clientX, y: event.clientY, active });
  };

  const pointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const target = drag?.active ? dragTargetAt(event.clientX, event.clientY, start.source) : null;
    if (drag?.active) {
      event.preventDefault();
      suppressClick.current = true;
      if (target != null) {
        const sourcePiece = start.source === -1 ? save.collections.deployedBeastPiece : board[start.source];
        const targetPiece = target === -1 ? save.collections.deployedBeastPiece : board[target];
        if (start.source === -1 && target >= 0) returnDeployedToSlot(target);
        else if (start.source >= 0 && target === -1) deployFromSlot(start.source);
        else if (sourcePiece?.kind === "spirit" && targetPiece) feedSpirit(start.source, target);
        else if (sourcePiece && targetPiece && sourcePiece.kind !== "spirit" && targetPiece.kind !== "spirit" && sourcePiece.tier === targetPiece.tier) {
          setMergeFx(true);
          mergeSlots(start.source, target);
          window.setTimeout(() => setMergeFx(false), 720);
        } else if (start.source >= 0 && target >= 0) moveSlot(start.source, target);
      }
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
    dragStart.current = null;
    setDrag(null);
  };

  const openEgg = (kind: BeastEggKind, count: 1 | 10 | 100 = 1) => {
    setHatchFx(kind);
    hatch(count, kind);
    window.setTimeout(() => setHatchFx(null), 620);
  };

  const boardScreen = <div className="original-beast-space">
    <BeastTopBar />
    <button className="beast-space-close" aria-label="退出魔兽" onClick={onClose}><ArrowLeft /></button>
    <button className="beast-space-help" aria-label="玩法说明" onClick={() => setGuidePage(0)}><CircleHelp /></button>
    <button className="beast-space-rate" aria-label="合成概率说明" onClick={() => setRateOpen(true)}><Settings2 /><span>概率</span></button>

    <button
      className={`original-altar ${drag?.target === -1 ? "drag-target" : ""}`}
      data-beast-altar
      aria-label={deployedDefinition ? `出战格：${deployedDefinition.name}，可拖回兽栏` : "空出战格，可拖入魔兽"}
      onPointerDown={(event) => pointerDown(event, -1)}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={() => { dragStart.current = null; setDrag(null); }}
      onClick={() => {
      if (!deployedDefinition) return;
      setSelectedIndex(null);
      setSelectedId(save.collections.deployedBeastPiece?.id || deployedDefinition.id);
      setScreen("detail");
    }}>
      {deployedDefinition ? <AtlasArt kind="beast" index={beastDisplayArtIndex(deployedDefinition.id, deployedState?.stars || 0)} /> : <PawPrint />}
      {deployedState && <b>{deployedState.level}</b>}
    </button>
    <button className="original-assist-button" aria-label="魔兽助战" onClick={() => setAssistOpen(true)}><Users /><span>助战<br /><b>{save.collections.beastAssistPieceIds?.length || 0}/3</b></span></button>
    <button className="original-codex-button" aria-label="魔兽图鉴" onClick={() => { setCodexFaction(null); setScreen("codex"); }}><BookOpen /><span>图鉴</span></button>

    <div className="original-beast-grid" aria-label="16格魔兽空间">
      {board.map((piece, index) => {
        const locked = index >= save.collections.beastUnlockedSlots;
        const entryQuality = piece ? quality(piece.tier) : null;
        return <button
          key={piece?.id || index}
          data-beast-slot={index}
          aria-label={locked ? `第${index + 1}格未解锁` : piece?.kind === "spirit" ? `${entryQuality?.name}经验精灵，普通等级${piece.state?.level || 1}` : piece ? `${BEASTS.find((item) => item.id === piece.definitionId)?.name || "魔兽"}${entryQuality?.name}，普通等级${piece.state?.level || 1}` : `第${index + 1}格空位`}
          className={`${locked ? "locked" : piece ? piece.kind === "spirit" ? "spirit" : "beast" : "empty"} ${drag?.source === index && drag.active ? "drag-source" : ""} ${drag?.target === index ? "drag-target" : ""}`}
          style={entryQuality ? { "--beast-color": entryQuality.color } as CSSProperties : undefined}
          disabled={locked}
          onPointerDown={(event) => pointerDown(event, index)}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={() => { dragStart.current = null; setDrag(null); }}
          onClick={() => { if (!suppressClick.current) openPiece(index); }}
        >
          {locked ? <LockKeyhole /> : piece ? <><PieceArt piece={piece} stars={piece.state?.stars || 0} />{save.collections.beastAssistPieceIds?.includes(piece.id) && <span className="piece-assist">助战</span>}</> : null}
        </button>;
      })}
    </div>

    <div className="original-egg-dock">
      {BEAST_EGG_TYPES.filter((egg) => ["green", "blue", "yellow"].includes(egg.id)).map((egg) => <button
        key={egg.id}
        aria-label={eggPurchaseMode ? `钻石购买${egg.name}` : `开启${egg.name}`}
        className={`original-egg egg-${egg.id} ${eggPurchaseMode ? "purchase" : ""}`}
        onClick={() => {
          if (eggPurchaseMode) { setEggBuyKind(egg.id); setEggBuyCount(1); }
          else openEgg(egg.id);
        }}
      ><Egg /><b>{eggPurchaseMode ? <><Gem />{fmt(egg.diamondPrice || 0)}</> : fmt(save.resources[egg.resource])}</b></button>)}
    </div>
    <button className={`original-more-button ${eggPurchaseMode ? "active" : ""}`} aria-label={eggPurchaseMode ? "切换为开启魔兽蛋" : "切换为钻石购买魔兽蛋"} onClick={() => setEggPurchaseMode(!eggPurchaseMode)}><ArrowLeftRight /></button>
    <button className="beast-space-tools" aria-label="魔兽空间功能" onClick={() => setActionOpen(!actionOpen)}><SlidersHorizontal /></button>
    <button className="beast-fragment-quick" aria-label={`超凡魔兽碎片${save.resources.beastExtraordinaryShard}个，使用5个合成超凡魔兽`} disabled={save.resources.beastExtraordinaryShard < 5 || spaces < 1} onClick={synthesizeExtraordinary}><Puzzle /><span>{save.resources.beastExtraordinaryShard}/5</span><b>合成超凡</b></button>

    <div className="free-egg-note"><TimerReset /><span>{save.resources.beastEgg >= 6 ? "免费蛋暂停" : formatRemaining(remaining)}</span></div>

    {actionOpen && <section className="beast-action-drawer">
      <header><strong>魔兽空间</strong><span>{occupied}/{save.collections.beastUnlockedSlots}</span><button aria-label="关闭功能" onClick={() => setActionOpen(false)}><X /></button></header>
      <div className="beast-action-grid">
        <button onClick={() => openEgg("green", 10)}><PackageOpen /><span>孵化10枚</span></button>
        <button onClick={autoMerge}><RefreshCw /><span>一键合成</span></button>
        <button onClick={organize}><Grid3X3 /><span>一键整理</span></button>
        <button disabled={save.collections.beastUnlockedSlots >= 16} onClick={unlockSlots}><LockKeyholeOpen /><span>扩建兽栏</span></button>
        <button onClick={sandboxPack}><Gem /><span>单机补给</span></button>
        <button onClick={fastForwardEgg}><TimerReset /><span>推进6小时</span></button>
      </div>
      <section className="beast-fragment-forge">
        <Puzzle />
        <span><b>超凡魔兽碎片</b><small>{save.resources.beastExtraordinaryShard}/5 · 失败保底</small></span>
        <button
          aria-label="使用5个超凡魔兽碎片合成超凡魔兽"
          disabled={save.resources.beastExtraordinaryShard < 5 || spaces < 1}
          onClick={synthesizeExtraordinary}
        ><Sparkles />合成超凡</button>
      </section>
      <section className="beast-egg-vault">
        <h3>活动魔兽蛋</h3>
        <div>{BEAST_EGG_TYPES.filter((egg) => !["green", "blue", "yellow"].includes(egg.id)).map((egg) => <article key={egg.id} style={{ "--egg-color": egg.color } as CSSProperties}>
          <button className="egg-vault-open" disabled={!save.resources[egg.resource] || spaces < 1} onClick={() => openEgg(egg.id)}><Egg /><span>{egg.name}<b>{fmt(save.resources[egg.resource])}</b></span></button>
        </article>)}</div>
      </section>
      <small>{spaces} 个空位 · 经验精灵可出战，也可拖拽用于培养</small>
    </section>}

    {assistOpen && <section className="original-assist-panel">
      <header><Users /><strong>魔兽助战</strong><span>{save.collections.beastAssistPieceIds?.length || 0}/3</span><button aria-label="关闭助战" onClick={() => setAssistOpen(false)}><X /></button></header>
      <div className="assist-targets">{Array.from({ length: 3 }, (_, index) => {
        const pieceId = save.collections.beastAssistPieceIds?.[index];
        const piece = board.find((entry) => entry?.id === pieceId);
        const definition = BEASTS.find((item) => item.id === piece?.definitionId);
        const state = piece?.state;
        return <i key={index}>{definition ? <><AtlasArt kind="beast" index={beastDisplayArtIndex(definition.id, state?.stars || 0)} /><small>属性生效 {beastAssistRate(definition.tier)}%</small><b>{definition.name}</b></> : <Plus />}</i>;
      })}</div>
      <div className="assist-roster">{board.filter((piece): piece is BeastBoardPiece => Boolean(piece)).map((piece) => {
        const item = BEASTS.find((definition) => definition.id === piece.definitionId);
        if (!item) return null;
        const active = Boolean(save.collections.beastAssistPieceIds?.includes(piece.id));
        return <button key={piece.id} className={active ? "active" : ""} onClick={() => toggleAssist(piece.id)}><AtlasArt kind="beast" index={beastDisplayArtIndex(item.id, piece.state?.stars || 0)} /><span>{item.name}</span><small>Lv.{piece.state?.level || 1} · 属性 {beastAssistRate(item.tier)}%</small>{active && <Check />}</button>;
      })}</div>
    </section>}

    {eggBuyKind && (() => {
      const egg = BEAST_EGG_TYPES.find((item) => item.id === eggBuyKind)!;
      const cost = eggBuyCount * (egg.diamondPrice || 0);
      return <div className="beast-system-mask" onClick={() => setEggBuyKind(null)}><section className="beast-egg-buy-card" onClick={(event) => event.stopPropagation()}>
        <button className="egg-buy-close" aria-label="关闭购买魔兽蛋" onClick={() => setEggBuyKind(null)}><X /></button>
        <Egg style={{ color: egg.color }} /><h3>{egg.name}</h3><small>购买后进入蛋库存，不会立即孵化</small>
        <div className="egg-buy-stepper"><button onClick={() => setEggBuyCount(Math.max(1, eggBuyCount - 10))}>-10</button><button aria-label="减少一个" onClick={() => setEggBuyCount(Math.max(1, eggBuyCount - 1))}>-</button><b>{eggBuyCount}</b><button aria-label="增加一个" onClick={() => setEggBuyCount(Math.min(999, eggBuyCount + 1))}>+</button><button onClick={() => setEggBuyCount(Math.min(999, eggBuyCount + 10))}>+10</button></div>
        <button className="egg-buy-confirm" disabled={save.resources.diamond < cost} onClick={() => { buyEggs(eggBuyCount, egg.id); setEggBuyKind(null); }}><Gem />{fmt(cost)} 购买</button>
      </section></div>;
    })()}

    {drag?.active && (drag.source === -1 ? save.collections.deployedBeastPiece : board[drag.source]) && (() => {
      const piece = drag.source === -1 ? save.collections.deployedBeastPiece! : board[drag.source]!;
      return <div className="original-drag-ghost" style={{ left: drag.x, top: drag.y }}><PieceArt piece={piece} stars={piece.state?.stars || 0} /></div>;
    })()}
    {mergeFx && <div className="original-merge-fx"><Sparkles /><strong>合成</strong></div>}
    {hatchFx && <div className={`original-hatch-fx egg-${hatchFx}`}><Egg /><Sparkles /></div>}
    {guidePage != null && <GuideModal pages={boardHelp} page={guidePage} setPage={setGuidePage} close={() => setGuidePage(null)} />}
    {rateOpen && <BeastRateModal close={() => setRateOpen(false)} />}
  </div>;

  const detailScreen = selectedDefinition && selectedState ? <div className="original-beast-detail-screen">
    <BeastTopBar back={() => setScreen("board")} />
    <main className="original-parchment">
      <header className="parchment-ribbon">{detailTabs.find((item) => item.id === detailTab)?.label}</header>
      <section className="detail-beast-heading" style={{ "--beast-color": quality(selectedDefinition.tier).color } as CSSProperties}>
        <div className="detail-beast-art"><AtlasArt kind="beast" index={beastDisplayArtIndex(selectedDefinition.id, selectedState.stars)} /><i>{quality(selectedDefinition.tier).name}</i></div>
        <div><span>{BEAST_FACTIONS.find((item) => item.id === selectedDefinition.faction)?.name}</span><h2>{selectedDefinition.name}</h2><b>Lv.{selectedState.level} · {selectedState.stage || 1}阶 {selectedDefinition.tier >= 7 ? `· ${selectedState.stars}星` : ""}</b></div>
        <div className="detail-heading-actions"><button aria-label={selectedPiece?.protected ? "解除锁定" : "锁定魔兽"} disabled={selectedIndex == null} onClick={() => selectedIndex != null && lockPiece(selectedIndex)}>{selectedPiece?.protected ? <LockKeyhole /> : <LockKeyholeOpen />}</button>{selectedDefinition.tier >= 7 && <button className="awaken" aria-label="觉醒升星" onClick={() => { setAwakenMaterialIds([]); setScreen("awaken"); }}><Crown /><small>觉醒</small></button>}</div>
      </section>

      {detailTab === "detail" && (() => {
        const growth = growthFor(selectedDefinition);
        const need = beastExpForLevel(selectedState.level, selectedDefinition.tier);
        return <div className="original-detail-pane">
          <section className="growth-block"><h3>每级属性成长{selectedDefinition.isExperienceSpirit && <small>喂养提供普通经验 +{fmt(beastSpiritExp(selectedDefinition.tier))}</small>}</h3><div><span><Zap />速度<b>{growth.speed}</b></span><span><Swords />攻击<b>{growth.attack}</b></span><span><Shield />生命<b>{growth.hp}</b></span><span><Crown />防御<b>{growth.defense}</b></span></div><p><i style={{ width: `${Math.min(100, selectedState.exp / need * 100)}%` }} /><b>{selectedState.exp}/{need}</b></p></section>
          <section className="owner-bonus"><h3>对主角的加成</h3><div><span>速度<b>{fmt((selectedDefinition.baseSpeedBonus || 0) + growth.speed * Math.max(0, selectedState.level - 1) + selectedDefinition.tier * 54)}</b></span><span>生命<b>{fmt(growth.hp * Math.max(0, selectedState.level - 1) + selectedDefinition.tier * 1750)}</b></span><span>攻击<b>{fmt(growth.attack * Math.max(0, selectedState.level - 1) + selectedDefinition.tier * 1750)}</b></span><span>防御<b>{fmt(growth.defense * Math.max(0, selectedState.level - 1) + selectedDefinition.tier * 70)}</b></span><span>生命<b>{selectedDefinition.baseBonusPct?.hp || 0}%</b></span><span>攻击<b>{selectedDefinition.baseBonusPct?.attack || 0}%</b></span><span>防御<b>{selectedDefinition.baseBonusPct?.defense || 0}%</b></span><span>魔兽强化<b>{Math.round(selectedDefinition.tier * .5)}%</b></span></div></section>
          <section className="combat-skill-row"><h3>战斗技能</h3><div>{Array.from({ length: 4 }, (_, index) => <button key={index} className={index === 0 ? "open" : "locked"} aria-label={index === 0 ? selectedDefinition.skillName : `战斗技能${index + 1}未解锁`} disabled={index > 0} onClick={() => setSkillOpen(true)}>{index === 0 ? <Flame /> : <LockKeyhole />}<i>{index === 0 ? 1 : index + 1}</i></button>)}</div><p>{selectedDefinition.skill}</p></section>
          <section className="passive-block"><header><h3>被动技能</h3><button onClick={() => setDetailTab("wash")}>洗炼<ChevronRight /></button></header><SkillRows affixes={selectedState.affixes} /></section>
          <div className="detail-actions"><button className="primary" onClick={() => selectedPiece && upgradeSkill(selectedPiece.id)}><WandSparkles />随机升级被动 <small><Sparkles />8</small></button><button className={save.collections.deployedBeastPiece?.id === selectedPiece?.id ? "active" : ""} onClick={() => {
            if (!selectedPiece) return;
            const wasDeployed = save.collections.deployedBeastPiece?.id === selectedPiece.id;
            if (!wasDeployed) setSelectedIndex(null);
            deploy("beasts", selectedPiece.id);
            if (wasDeployed) setScreen("board");
          }}><Swords />{save.collections.deployedBeastPiece?.id === selectedPiece?.id ? "卸下出战" : "放入出战格"}</button></div>
        </div>;
      })()}

      {detailTab === "wash" && <div className="original-wash-pane">
        <div className="wash-resource"><ResourcePill id="gold" value={save.resources.gold} /><ResourcePill id="beastMagicCrystal" value={save.resources.beastMagicCrystal} /></div>
        <div className="wash-probability" aria-label="官网公示洗炼概率"><span><CircleHelp />官网公示</span><b>初级 {washGradeRates[0]}%</b><b>中级 {washGradeRates[1]}%</b><b>高级 {washGradeRates[2]}%</b></div>
        <div className="wash-compare"><section><h3>当前技能</h3><SkillRows affixes={selectedState.affixes} /></section><ChevronRight /><section><h3>洗炼结果</h3><SkillRows affixes={selectedState.pendingAffixes} pending /></section></div>
        {selectedState.pendingAffixes.length ? <div className="wash-resolution"><button onClick={() => selectedPiece && resolveAffixes(selectedPiece.id, false)}>保留</button><button className="primary" onClick={() => selectedPiece && resolveAffixes(selectedPiece.id, true)}>替换</button><button onClick={() => selectedPiece && reroll(selectedPiece.id)}><RotateCcw />继续洗炼 <small><Coins />{fmt(beastRerollCost(selectedState.level, selectedDefinition.tier))}</small></button></div> : <button className="original-gold-button" onClick={() => selectedPiece && reroll(selectedPiece.id)}><WandSparkles />洗炼 <small><Coins />{fmt(beastRerollCost(selectedState.level, selectedDefinition.tier))}</small></button>}
        <p>继续洗炼会放弃右侧结果并重新消耗金币；四个被动槽已经升级的等级不会被洗掉。</p>
      </div>}

      {detailTab === "devour" && (() => {
        const required = Math.ceil(100 * Math.pow(1.58, selectedState.devourLevel));
        const preview = beastDevourPreview(selectedState.devourLevel);
        const candidates = board.filter((piece): piece is BeastBoardPiece => Boolean(piece
          && piece.id !== selectedPiece?.id
          && piece.kind !== "spirit"
          && !piece.protected
          && !save.collections.beastAssistPieceIds?.includes(piece.id)));
        const selectedMaterials = devourMaterialIds
          .map((id) => board.find((piece) => piece?.id === id))
          .filter(Boolean) as BeastBoardPiece[];
        return <div className="original-devour-pane">
          <div className="devour-triangle">
            <article className="node speed" style={{ "--chance": `${preview.red.chance}%` } as CSSProperties}><Flame /><strong>{preview.red.chance.toFixed(2)}%</strong><span>速度 {preview.red.speed}<br />攻击 {preview.red.attack}</span></article>
            <article className="node life"><Shield /><strong>{preview.blue.chance.toFixed(2)}%</strong><span>生命 {fmt(preview.blue.hp)}<br />防御 {preview.blue.defense}</span></article>
            <article className="node power"><Swords /><strong>{preview.yellow.chance.toFixed(2)}%</strong><span>魔兽强度 {preview.yellow.beastStrength.toFixed(2)}%<br />生命 {fmt(preview.yellow.hp)}</span></article>
            <b>{selectedState.devourLevel}级</b>
          </div>
          <div className="devour-mode-tabs"><button className={devourMode === "beasts" ? "active" : ""} onClick={() => setDevourMode("beasts")}>吞噬魔兽</button><button className={devourMode === "essence" ? "active" : ""} onClick={() => setDevourMode("essence")}>使用精华</button></div>
          {devourMode === "beasts" ? <>
            <h3>材料消耗</h3>
            <div className="devour-materials">{Array.from({ length: 5 }, (_, index) => {
              const material = selectedMaterials[index];
              return <button key={index} className={material ? "filled" : ""} aria-label={`吞噬材料位${index + 1}`} onClick={() => material && setDevourMaterialIds((ids) => ids.filter((id) => id !== material.id))}>{material ? <><AtlasArt kind="beast" index={BEASTS.find((item) => item.id === material.definitionId)?.artIndex || 0} /><b>Lv.{material.state?.level || 1}</b></> : <Plus />}</button>;
            })}</div>
            <div className="devour-roster">{candidates.map((piece) => {
              const active = devourMaterialIds.includes(piece.id);
              const definition = BEASTS.find((item) => item.id === piece.definitionId);
              return <button key={piece.id} className={active ? "active" : ""} disabled={!active && devourMaterialIds.length >= 5} onClick={() => setDevourMaterialIds((ids) => active ? ids.filter((id) => id !== piece.id) : [...ids, piece.id].slice(0, 5))}><AtlasArt kind="beast" index={definition?.artIndex || 0} /><small>{definition?.name}</small><b>Lv.{piece.state?.level || 1}</b>{active && <Check />}</button>;
            })}</div>
          </> : <div className="devour-essence-picker"><Gem /><strong>魔兽精华 {fmt(save.resources.beastEssence)}</strong><div><button onClick={() => setDevourEssenceAmount(Math.max(1, devourEssenceAmount - 10))}>-10</button><b>{Math.min(devourEssenceAmount, save.resources.beastEssence)}</b><button onClick={() => setDevourEssenceAmount(Math.min(save.resources.beastEssence, devourEssenceAmount + 10))}>+10</button><button onClick={() => setDevourEssenceAmount(save.resources.beastEssence)}>最大</button></div><small>1 精华 = 10 吞噬经验</small></div>}
          <div className="devour-progress"><span>吞噬经验</span><b>{selectedState.devourExp || 0}/{required}</b><i><em style={{ width: `${Math.min(100, (selectedState.devourExp || 0) / required * 100)}%` }} /></i></div>
          {devourMode === "beasts" ? <div className="devour-buttons"><button onClick={() => setDevourMaterialIds(candidates.slice(0, 5).map((piece) => piece.id))}>一键选择</button><button className="primary" disabled={!devourMaterialIds.length || !selectedPiece} onClick={() => { if (selectedPiece) devourInstances(selectedPiece.id, devourMaterialIds); setDevourMaterialIds([]); }}>吞噬</button></div> : <button className="devour-button" disabled={!selectedPiece || !save.resources.beastEssence} onClick={() => selectedPiece && devourEssence(selectedPiece.id, Math.min(devourEssenceAmount, save.resources.beastEssence))}><Gem />使用精华吞噬</button>}
          <small>普通等级与吞噬等级独立；经验精灵只用于普通等级。</small>
        </div>;
      })()}

      {detailTab === "ascend" && (() => {
        const stage = selectedState.stage || 1;
        const requiredLevel = 50;
        const requiredDevour = stage + 1;
        return <div className="original-ascend-pane">
          <h3>升阶条件</h3>
          <div className="ascend-beast"><AtlasArt kind="beast" index={beastDisplayArtIndex(selectedDefinition.id, selectedState.stars)} /><strong>{selectedDefinition.name}</strong></div>
          <section className="ascend-requirements"><span>魔兽等级达到 {requiredLevel} 级<b className={selectedState.level >= requiredLevel ? "done" : ""}>{selectedState.level >= requiredLevel ? <Check /> : `${selectedState.level}/${requiredLevel}`}</b></span><span>吞噬等级达到 {requiredDevour} 级<b className={selectedState.devourLevel >= requiredDevour ? "done" : ""}>{selectedState.devourLevel >= requiredDevour ? <Check /> : `${selectedState.devourLevel}/${requiredDevour}`}</b></span></section>
          <h3>属性</h3>
          <div className="ascend-comparison"><span>属性</span><b>{stage}阶</b><b>{stage + 1}阶</b><span>造成伤害</span><b>{145 + stage * 3}%</b><strong>{148 + stage * 4}%</strong><span>攻击加成</span><b>{20 + stage * 2.5}%</b><strong>{23.5 + stage * 2.5}%</strong></div>
          <button className="original-gold-button" onClick={() => selectedPiece && ascend(selectedPiece.id)}>升阶</button>
          {selectedDefinition.tier >= 7 && <button className="ascend-awaken-shortcut" onClick={() => { setAwakenMaterialIds([]); setScreen("awaken"); }}><Crown />觉醒升星是独立培养</button>}
        </div>;
      })()}
    </main>
    {skillOpen && <div className="beast-system-mask" onClick={() => setSkillOpen(false)}><section className="beast-system-card beast-skill-card" onClick={(event) => event.stopPropagation()}><header><strong>战斗技能</strong><button aria-label="关闭战斗技能详情" onClick={() => setSkillOpen(false)}><X /></button></header><article><Flame /><span><h3>{selectedDefinition.skillName}</h3><small>每 {selectedDefinition.skillInterval || 3} 回合触发</small></span><p>{selectedDefinition.skill}</p></article></section></div>}
    <nav className="original-detail-tabs">{detailTabs.map((item) => { const Icon = item.icon; return <button key={item.id} className={detailTab === item.id ? "active" : ""} onClick={() => setDetailTab(item.id)}><Icon /><span>{item.label}</span></button>; })}</nav>
  </div> : <div className="original-empty-detail"><Egg /><strong>该魔兽已不在兽栏</strong><button onClick={() => setScreen("board")}>返回魔兽空间</button></div>;

  const codexDetail = BEASTS.find((item) => item.id === codexDetailId);
  const codexReward = codexDetail?.codexReward;
  const codexScreen = <div className="original-codex-screen">
    <header className="codex-title"><button aria-label="返回" onClick={() => codexFaction ? setCodexFaction(null) : setScreen("board")}><ArrowLeft /></button><strong>{codexFaction ? BEAST_FACTIONS.find((item) => item.id === codexFaction)?.name : "图鉴"}</strong><span /></header>
    {!codexFaction ? <>
      <div className="original-faction-orbs">{BEAST_FACTIONS.map((faction) => {
        const slots = BEAST_CODEX_SLOTS.filter((slot) => slot.faction === faction.id);
        const found = slots.filter((slot) => slot.definitionId && save.collections.beasts[slot.definitionId]?.discovered).length;
        const FactionIcon = factionIcons[faction.id];
        return <button key={faction.id} style={{ "--faction-color": faction.color } as CSSProperties} onClick={() => setCodexFaction(faction.id)}><i><FactionIcon /></i><b>{found}/{faction.total}</b><strong>{faction.name}</strong></button>;
      })}</div>
      <section className="codex-total-stats"><h3>属性加成</h3><div>{(["hp", "attack", "defense", "speed", "lifesteal", "crit", "dodge", "stun", "combo", "counter", "antiLifesteal", "antiCrit", "antiDodge", "antiStun", "antiCombo", "antiCounter"] as (keyof CombatStats)[]).map((key) => <span key={key}>{COMBAT_STAT_META[key].name}<b>{statValue(key, Number(codexTotals[key] || 0))}</b></span>)}</div></section>
      <div className="codex-power-line"><PawPrint /><span>魔兽战力</span><strong>{fmt(beastPower)}</strong><i /><span>主人总战力</span><strong>{fmt(totalPower)}</strong></div>
    </> : <div className="original-faction-codex">{BEAST_QUALITIES.map((entry) => {
      const slots = BEAST_CODEX_SLOTS.filter((slot) => slot.faction === codexFaction && slot.tier === entry.tier);
      if (!slots.length) return null;
      return <section key={entry.tier}><h3>{entry.name}级魔兽</h3><div>{slots.map((slot) => {
        const definition = BEASTS.find((item) => item.id === slot.definitionId);
        const found = definition && save.collections.beasts[definition.id]?.discovered;
        if (!definition) return <div className="codex-unrevealed" key={slot.id}>?</div>;
        return <button key={slot.id} className={found ? "found" : "unfound"} style={{ "--beast-color": entry.color } as CSSProperties} onClick={() => { setCodexDetailId(definition.id); setCodexFull(false); }}><AtlasArt kind="beast" index={definition.artIndex} /><strong>{definition.name}</strong>{!found && <small>未获得</small>}</button>;
      })}{Array.from({ length: (4 - slots.length % 4) % 4 }, (_, index) => <div className="codex-layout-placeholder" key={`filler-${index}`}>?</div>)}</div></section>;
    })}</div>}

    {codexDetail && <div className="codex-detail-mask" onClick={() => setCodexDetailId(null)}><section className="original-codex-detail" onClick={(event) => event.stopPropagation()}>
      <button className="codex-detail-close" aria-label="关闭图鉴详情" onClick={() => setCodexDetailId(null)}><X /></button>
      <header><AtlasArt kind="beast" index={codexDetail.artIndex} /><span><i>{quality(codexDetail.tier).name} · {sourceLabel(codexDetail)}</i><h2>{codexDetail.name}</h2>{codexDetail.codexForm && <small>{codexDetail.codexForm}</small>}</span></header>
      <div className="codex-bonus-columns"><section><h3>基础加成</h3><span>速度<b>{codexDetail.baseSpeedBonusPct ? `${codexDetail.baseSpeedBonusPct}%` : fmt(codexDetail.baseSpeedBonus || 0)}</b></span><span>生命<b>{codexDetail.baseBonusPct?.hp || 0}%</b></span><span>攻击<b>{codexDetail.baseBonusPct?.attack || 0}%</b></span><span>防御<b>{codexDetail.baseBonusPct?.defense || 0}%</b></span></section><section><h3>图鉴加成 <small>永久属性</small></h3>{Object.entries(codexDetail.codexBonus).map(([key, value]) => <span key={key}>{COMBAT_STAT_META[key as keyof CombatStats].name}<b>{statValue(key as keyof CombatStats, Number(value))}</b></span>)}</section></div>
      <div className="codex-skill-icons">{Array.from({ length: 4 }, (_, index) => <i key={index}>{index === 0 ? <Flame /> : <LockKeyhole />}<b>{index + 1}</b></i>)}</div>
      <section className="codex-recipe"><h3>合成图谱</h3>{codexDetail.isExperienceSpirit ? <div className="recipe-origin"><span><Ghost /><b>合成失败获得</b></span></div> : codexDetail.tier === 1 ? <div className="recipe-origin"><span><Egg /><b>魔兽蛋孵化</b></span></div> : codexDetail.tier === 8 ? <div className="recipe-origin">{(() => {
        const sourceId = Object.entries(BEAST_EVOLUTIONS).find(([, resultId]) => resultId === codexDetail.id)?.[0];
        const source = BEASTS.find((definition) => definition.id === sourceId);
        return source ? <span><AtlasArt kind="beast" index={source.artIndex} /><Plus /><Sparkles /><ChevronRight /><AtlasArt kind="beast" index={codexDetail.artIndex} /></span> : <span><Crown /><b>超凡觉醒取得</b></span>;
      })()}</div> : <div>{mergeExamples(codexDetail.tier).map(([left, right]) => <span key={`${left.id}-${right.id}`}><AtlasArt kind="beast" index={left.artIndex} /><Plus /><AtlasArt kind="beast" index={right.artIndex} /></span>)}</div>}<small>{codexDetail.isExperienceSpirit ? "可出战或助战；拖给任意魔兽（包括其他经验精灵）增加等级经验" : codexDetail.tier === 8 ? "对应超凡魔兽满星、满强化后觉醒" : codexDetail.tier === 1 ? "由对应品质魔兽蛋取得" : `任意 2 只${quality(codexDetail.tier - 1).name}品质魔兽均可跨种类合成；成功结果随机`}</small></section>
      <section className="codex-reward"><h3>收集奖励</h3><Gem /><b>×{codexReward}</b></section>
      <div className="codex-stage-toggle"><button className={!codexFull ? "active" : ""} onClick={() => setCodexFull(false)}>初阶</button><button className={codexFull ? "active" : ""} onClick={() => setCodexFull(true)}>满阶</button></div>
    </section></div>}
  </div>;

  const awakenScreen = selectedDefinition && selectedState ? <div className={`original-awaken-screen tab-${awakenTab}`}>
    <button className="awaken-help" aria-label="觉醒玩法说明" onClick={() => setAwakenGuidePage(0)}><CircleHelp /><span>教程</span></button>
    {awakenTab === "strengthen" && <div className="awaken-resource-bar">
      <ResourcePill id="beastEnhanceStone" value={save.resources.beastEnhanceStone} />
      <ResourcePill id="beastBoostCharm" value={save.resources.beastBoostCharm} />
      <ResourcePill id="beastRewindStone" value={save.resources.beastRewindStone} />
    </div>}
    <section className="awaken-core">
      <div className="awaken-stone-disc">
        <div className="awaken-rune" style={{ "--beast-color": quality(selectedDefinition.tier).color } as CSSProperties}>
          <AtlasArt kind="beast" index={beastDisplayArtIndex(selectedDefinition.id, selectedState.stars)} />
          <strong>{selectedDefinition.name}</strong>
          <b>{selectedDefinition.tier === 7 ? `${selectedState.stars}星` : quality(selectedDefinition.tier).name} · +{selectedState.enhanceLevel || 0}</b>
        </div>
        <div className="awaken-star-track" aria-label="超凡觉醒进度">
          {[1, 2, 3].map((star) => <i className={selectedState.stars >= star ? "done" : ""} key={star}><Star /><b>{star}</b></i>)}
          <ChevronRight />
          <i className={selectedDefinition.tier >= 8 ? "done radiant" : "radiant"}><Crown /></i>
        </div>
      </div>

      {awakenTab === "awaken" ? <>
        <div className="awaken-material-slots" aria-label={`本次需要${awakenMaterialCount}只其他超凡魔兽`}>
          {Array.from({ length: 3 }, (_, index) => {
            const material = selectedAwakenMaterials[index];
            const definition = material && BEASTS.find((item) => item.id === material.definitionId);
            const locked = index >= awakenMaterialCount || awakenAtMax;
            return <button
              key={index}
              className={material ? "filled" : locked ? "locked" : "empty"}
              disabled={locked}
              aria-label={locked ? `觉醒材料位${index + 1}未启用` : material ? `移除觉醒材料${definition?.name || index + 1}` : `觉醒材料位${index + 1}`}
              onClick={() => material && setAwakenMaterialIds((ids) => ids.filter((id) => id !== material.id))}
            >{locked ? <LockKeyhole /> : material && definition ? <><AtlasArt kind="beast" index={beastDisplayArtIndex(definition.id, material.state?.stars || 0)} /><small>{definition.name}</small><b>{material.state?.stars || 0}星</b></> : <Plus />}</button>;
          })}
        </div>
        <button
          className="awaken-main-button"
          disabled={awakenAtMax || awakenNeedsStrength || selectedAwakenMaterials.length !== awakenMaterialCount || !selectedPiece}
          onClick={() => {
            if (!selectedPiece) return;
            awaken(selectedPiece.id, awakenMaterialIds);
            setAwakenMaterialIds([]);
          }}
        >{qualityAwakenReady ? `觉醒为${selectedEvolution?.name || "璀璨品质"}` : "觉醒"}</button>
        <div className="awaken-rule-lines">
          <p>魔兽觉醒 100% 成功，觉醒后主魔兽的被动技能继承</p>
          <p>魔兽达到超凡 1 星后需要强化至满级才能继续觉醒</p>
          {awakenNeedsStrength && <strong>当前强化 +{selectedState.enhanceLevel || 0}，需要 +10</strong>}
        </div>
        <section className="awaken-inventory-panel">
          <header><span>{awakenAtMax ? "当前品质已完成" : `本次需要其他超凡 ${selectedAwakenMaterials.length}/${awakenMaterialCount}`}</span><button disabled={awakenCandidates.length < awakenMaterialCount} onClick={() => setAwakenMaterialIds(awakenCandidates.slice(0, awakenMaterialCount).map((piece) => piece.id))}>一键放入</button></header>
          {awakenCandidates.length ? <div>{awakenCandidates.map((piece) => {
            const definition = BEASTS.find((item) => item.id === piece.definitionId)!;
            const active = awakenMaterialIds.includes(piece.id);
            return <button key={piece.id} className={active ? "active" : ""} disabled={!active && awakenMaterialIds.length >= awakenMaterialCount} onClick={() => setAwakenMaterialIds((ids) => active ? ids.filter((id) => id !== piece.id) : [...ids, piece.id].slice(0, awakenMaterialCount))}><AtlasArt kind="beast" index={beastDisplayArtIndex(definition.id, piece.state?.stars || 0)} /><span>{definition.name}</span><small>{piece.state?.stars || 0}星 · +{piece.state?.enhanceLevel || 0}</small>{active && <Check />}</button>;
          })}</div> : <div className="awaken-empty-material"><Crown /><span>超凡级魔兽不足</span><small>孵化超凡蛋、完美合成成功或使用 5 个超凡碎片可获得</small></div>}
        </section>
      </> : <>
        <div className="strength-material-chain">
          <button className={useBoost ? "selected" : ""} disabled={!save.resources.beastBoostCharm} onClick={() => setUseBoost(!useBoost)}><Zap /><span>增率道具</span><b>{save.resources.beastBoostCharm}</b></button>
          <button className={useProtect ? "selected" : ""} disabled={!save.resources.beastProtectCharm} onClick={() => setUseProtect(!useProtect)}><Shield /><span>失败保护</span><b>{save.resources.beastProtectCharm}</b></button>
        </div>
        <div className="strength-rate"><span>强化 +{selectedState.enhanceLevel || 0} → +{Math.min(10, (selectedState.enhanceLevel || 0) + 1)}</span><strong>{Math.min(100, Math.max(20, 90 - (selectedState.enhanceLevel || 0) * 7) + (useBoost ? 20 : 0))}%</strong></div>
        <button className="awaken-main-button" disabled={selectedState.stars < 1 || (selectedState.enhanceLevel || 0) >= 10 || !selectedPiece} onClick={() => selectedPiece && strengthen(selectedPiece.id, useBoost, useProtect)}>强化</button>
        <div className="awaken-rule-lines"><p>强化失败时有概率使强化等级降低 1-3 级</p>{selectedState.stars < 1 && <strong>魔兽达到超凡 1 星后开启强化</strong>}</div>
        <section className="strength-status-panel">
          <header>当前强化属性</header>
          <div><span>强化等级<b>+{selectedState.enhanceLevel || 0}/10</b></span><span>本次强化石<b>{Math.max(1, Math.ceil(Math.pow(1.28, selectedState.enhanceLevel || 0)))}</b></span><span>失败保护<b>{useProtect ? "生效" : "未添加"}</b></span></div>
          <button className="rewind-button" disabled={!selectedState.rewindAvailable || !selectedPiece} onClick={() => selectedPiece && rewindStrength(selectedPiece.id)}><Undo2 />回溯至 +{selectedState.enhanceBeforeAttempt || 0}<small>消耗 {Math.max(1, (selectedState.enhanceBeforeAttempt || 0) * 2)} 回溯石</small></button>
        </section>
      </>}
    </section>
    <nav className="awaken-tabs"><button className={awakenTab === "awaken" ? "active" : ""} onClick={() => setAwakenTab("awaken")}><Star />觉醒</button><button className={awakenTab === "strengthen" ? "active" : ""} onClick={() => setAwakenTab("strengthen")}><Flame />强化</button><button className="awaken-back" aria-label="返回魔兽详情" onClick={() => setScreen("detail")}><ArrowLeft /></button></nav>
    {awakenGuidePage != null && <GuideModal pages={awakenHelp} page={awakenGuidePage} setPage={setAwakenGuidePage} close={() => setAwakenGuidePage(null)} />}
  </div> : null;

  return <div className="beast-rebuild-root">
    {screen === "board" && boardScreen}
    {screen === "detail" && detailScreen}
    {screen === "codex" && codexScreen}
    {screen === "awaken" && awakenScreen}
    {notice && <div className={`beast-inline-notice ${screen}`}>{notice}</div>}
  </div>;
}
