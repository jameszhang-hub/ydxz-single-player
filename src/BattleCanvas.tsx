import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { FastForward, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { BEASTS, WAR_SOULS } from "./config";
import { AtlasArt, fmt } from "./ui";
import type { BattleResult, CombatEvent } from "./types";

function isPlayerActor(actor: CombatEvent["actor"]) {
  return actor === "player" || actor === "warSoul" || actor === "beast" || actor === "battlePet";
}

function initialHp(result: BattleResult) {
  return {
    player: result.playerMaxHp || Math.max(1, result.playerHp),
    enemy: result.enemyMaxHp || Math.max(1, result.enemyHp)
  };
}

export function BattleCanvas({ result, heroTier = 0, autoMode = false }: { result: BattleResult; heroTier?: number; autoMode?: boolean }) {
  const [cursor, setCursor] = useState(0);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [playing, setPlaying] = useState(true);
  const [hp, setHp] = useState(() => initialHp(result));
  const [replayKey, setReplayKey] = useState(0);
  const events = result.events;
  const battleKey = result.battleId || `${result.enemyName || "enemy"}-${result.stage || 0}-${result.playerHp}-${result.enemyHp}-${events.length}`;
  const current = events[Math.max(0, cursor - 1)];
  const finished = cursor >= events.length;
  const enemyTier = Math.max(0, Math.min(4, Math.floor(((result.enemyLevel || result.stage || 1) - 1) / 10)));
  const maxHp = initialHp(result);

  const warSoulIndex = useMemo(() => WAR_SOULS.findIndex((item) => item.name === result.companions?.warSoul), [result.companions?.warSoul]);
  const beastArtIndex = useMemo(() => result.companions?.beastArtIndex
    ?? BEASTS.find((item) => item.name === result.companions?.beast)?.artIndex
    ?? -1, [result.companions?.beast, result.companions?.beastArtIndex]);
  const battlePetArtIndex = result.companions?.battlePetArtIndex ?? -1;

  useEffect(() => {
    setCursor(0);
    setHp(initialHp(result));
    setPlaying(true);
  }, [battleKey, replayKey]);

  useEffect(() => {
    if (autoMode) setSpeed(2);
  }, [autoMode]);

  useEffect(() => {
    if (!playing || finished) return;
    const timer = window.setTimeout(() => {
      const event = events[cursor];
      if (!event) return;
      setHp((previous) => {
        const next = { ...previous };
        const amount = Math.max(0, event.value || 0);
        if (["attack", "crit", "combo", "counter", "skill"].includes(event.type) && amount > 0) {
          if (isPlayerActor(event.actor)) next.enemy = Math.max(0, next.enemy - amount);
          else next.player = Math.max(0, next.player - amount);
        }
        if (event.type === "heal" && amount > 0) {
          if (isPlayerActor(event.actor)) next.player = Math.min(maxHp.player, next.player + amount);
          else next.enemy = Math.min(maxHp.enemy, next.enemy + amount);
        }
        return next;
      });
      setCursor((value) => value + 1);
    }, (current?.type === "defeat" ? 700 : 420) / speed);
    return () => window.clearTimeout(timer);
  }, [cursor, current?.type, events, finished, maxHp.enemy, maxHp.player, playing, speed]);

  const playerActs = current && isPlayerActor(current.actor) && ["attack", "crit", "combo", "counter", "skill"].includes(current.type);
  const enemyActs = current?.actor === "enemy" && ["attack", "crit", "combo", "counter", "skill"].includes(current.type);
  const playerHit = enemyActs;
  const enemyHit = playerActs && current?.value;
  const isHeal = current?.type === "heal";
  const isDodge = current?.type === "dodge";
  const floatOnEnemy = isHeal ? current?.actor === "enemy" : Boolean(current && isPlayerActor(current.actor));
  const round = current?.round || 1;
  const restart = () => setReplayKey((value) => value + 1);
  const skip = () => { setCursor(events.length); setHp({ player: result.playerHp, enemy: result.enemyHp }); setPlaying(false); };

  return <section className={`battle-stage ${finished ? "finished" : ""} ${result.win ? "win" : "loss"}`}>
    <header className="battle-hud">
      <div className="fighter-hud player"><span><strong>无畏旅人</strong><small>Lv.{Math.max(1, result.playerLevel || 1)}</small></span><div><i style={{ width: `${Math.max(0, hp.player / maxHp.player * 100)}%` }} /></div><b>{fmt(hp.player)} / {fmt(maxHp.player)}</b></div>
      <div className="battle-round"><span>ROUND</span><strong>{round}</strong><small>{cursor}/{events.length}</small></div>
      <div className="fighter-hud enemy"><span><strong>{result.enemyName || "试炼怪物"}</strong><small>{result.enemyLevel ? `Lv.${result.enemyLevel}` : result.stageLabel ? `关卡 ${result.stageLabel}` : `第${result.stage || 1}关`}</small></span><div><i style={{ width: `${Math.max(0, hp.enemy / maxHp.enemy * 100)}%` }} /></div><b>{fmt(hp.enemy)} / {fmt(maxHp.enemy)}</b></div>
    </header>

    <div className="battlefield">
      <div className="arena-depth back" /><div className="arena-depth front" />
      <div key={`hero-${current?.id || "idle"}`} className={`battle-sprite hero tier-${heroTier} ${playerActs ? "attacking" : ""} ${playerHit ? "hit" : ""} ${hp.player <= 0 ? "defeated" : ""}`} style={{ "--frame": `${Math.max(0, Math.min(4, heroTier)) * 25}%` } as CSSProperties} />
      <div key={`enemy-${current?.id || "idle"}`} className={`battle-sprite enemy tier-${enemyTier} ${enemyActs ? "attacking" : ""} ${enemyHit ? "hit" : ""} ${hp.enemy <= 0 ? "defeated" : ""}`} style={{ "--frame": `${enemyTier * 25}%` } as CSSProperties} />
      {warSoulIndex >= 0 && <div key={`soul-${current?.id || "idle"}`} className={`battle-companion-sprite war-soul ${current?.actor === "warSoul" ? "casting" : ""}`}><AtlasArt kind="warSoul" index={warSoulIndex} /><span>{result.companions?.warSoul}</span></div>}
      {beastArtIndex >= 0 && <div key={`beast-${current?.id || "idle"}`} className={`battle-companion-sprite beast ${current?.actor === "beast" ? "casting" : ""}`}><AtlasArt kind="beast" index={beastArtIndex} /><span>{result.companions?.beast}</span></div>}
      {battlePetArtIndex >= 0 && <div key={`battle-pet-${current?.id || "idle"}`} className={`battle-companion-sprite battle-pet ${current?.actor === "battlePet" ? "casting" : ""}`}><AtlasArt kind="battlePet" index={battlePetArtIndex} /><span>{result.companions?.battlePet}</span></div>}
      {current && current.type !== "defeat" && <div key={`${replayKey}-${current.id}`} className={`combat-float ${floatOnEnemy ? "on-enemy" : "on-player"} ${current.type}`}>
        {isDodge ? "闪避" : isHeal ? `+${fmt(current.value || 0)}` : current.value ? `-${fmt(current.value)}` : current.type === "stun" ? "眩晕" : current.type === "skill" ? "技能" : ""}
      </div>}
      {current?.type === "skill" && <div key={`skill-${replayKey}-${current.id}`} className={`skill-projectile ${current.actor}`} />}
      {current && ["skill", "crit", "stun", "combo", "counter"].includes(current.type) && <div key={`banner-${replayKey}-${current.id}`} className={`battle-skill-banner ${current.type}`}><b>{current.type === "crit" ? "暴击" : current.type === "combo" ? "连击" : current.type === "counter" ? "反击" : current.type === "stun" ? "击晕" : "技能释放"}</b><span>{current.text}</span></div>}
      {finished && <div className={`battle-finish-emblem ${result.win ? "win" : "loss"}`}><small>{result.win ? "VICTORY" : "DEFEAT"}</small><strong>{result.win ? "战斗胜利" : "挑战失败"}</strong><span>{result.win ? `金币 +${fmt(result.rewards.gold || 0)} · 宝箱 +${fmt(result.rewards.chestTicket || 0)}` : "调整装备、战魂与属性流派后再战"}</span></div>}
    </div>

    <div className="battle-playback-controls">
      <button onClick={() => setPlaying((value) => !value)} disabled={finished} title={playing ? "暂停战斗" : "继续战斗"}>{playing ? <Pause /> : <Play />}</button>
      <button onClick={() => setSpeed((value) => value === 1 ? 2 : 1)} title="切换战斗倍速"><FastForward /><span>{speed}×</span></button>
      <button onClick={restart} title="重新播放"><RotateCcw /></button>
      <button onClick={skip} disabled={finished} title="跳过播放"><SkipForward /></button>
      <div><i style={{ width: `${events.length ? cursor / events.length * 100 : 100}%` }} /></div>
    </div>
    <div className="battle-caption"><i>R{round}</i><span>{current?.text || "双方进入战场，战斗即将开始"}</span></div>
  </section>;
}
