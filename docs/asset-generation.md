# 生成美术记录

## 魔兽空间场景 v1

- 模式：OpenAI 内置 ImageGen，`stylized-concept`。
- 生产文件：`public/assets/beast-sanctuary-v1.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-8c254d53-4893-4a83-917f-dce3eece721c.png`
- 尺寸：941×1672，竖屏 9:16；上部祭坛、中部 4×4 围栏、底部三枚蛋承台与代码交互层对齐。

最终提示词：

```text
Use case: stylized-concept
Asset type: production full-screen background for the beast stable of a portrait Chinese fantasy mobile RPG
Primary request: Create one bright, readable vertical outdoor beast sanctuary scene with a raised stone-and-wood altar at the upper center, a grassy fenced training yard below it, compact wooden pens arranged as a subtle 4-by-4 field, and a rocky foreground where three magical eggs could sit. The scene supports UI overlays; it must not contain actual creatures, eggs, buttons, labels, text, numbers, or interface frames.
Style/medium: polished colorful hand-painted 2D mobile game environment, cheerful fantasy wilderness, close in energy to a light chest-opening RPG while remaining original.
Composition/framing: portrait 9:16, straight-on slightly elevated game camera, altar in top quarter, main 4-by-4 yard in middle half, clear foreground in bottom quarter, generous safe areas and crisp scale at phone resolution.
Lighting/mood: sunny soft daylight, inviting and playful, high clarity.
Color palette: varied fresh grass green, warm timber, pale stone, cyan sky accents and small red-gold details; avoid a one-note green wash.
Constraints: no text, letters, numbers, logo, watermark, UI elements, characters, creatures, eggs, treasure chests, gradients used as abstract decoration, dark atmospheric crop, or objects crossing the implied cell boundaries.
```

## 捕猎图鉴 v1

- 模式：OpenAI 内置 ImageGen，`stylized-concept`。
- 生产文件：`public/assets/hunting-atlas-v1.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-a7ebac9f-c616-40fd-a097-c2033d5661c7.png`
- 尺寸：1256×1256，4 列×4 行；53 项捕猎名称按语义映射到 16 类藏品造型。

最终提示词：

```text
Use case: stylized-concept
Asset type: production hunting-codex sprite atlas for a portrait Chinese fantasy mobile RPG
Primary request: Create exactly sixteen distinct whimsical forest hunting collectibles in a precise 4-column by 4-row atlas. Reading left to right: Row 1: a sesame-colored rabbit, a black-feather duck, a tiny winged angel pig, a rocket-tailed sparrow. Row 2: a spotted deer, a fluffy lamb, a sturdy fantasy bull, a long-haired wild boar. Row 3: an emerald peacock, a battle eagle, a glowing mushroom, a rare golden flower. Row 4: a magical pumpkin-fruit bundle, a pearl shell with stones, a playful horned imp, a translucent spirit stag.
Composition/framing: sixteen identical edge-aligned square cells, one centered full-body collectible per cell, consistent scale, strong silhouette, safe padding, no subject crossing a boundary.
Style/medium: bright polished hand-painted mobile-game codex art, compact toy-like proportions, lively and collectible, distinct from combat beasts, with forest and meadow cues on dark green neutral cell backgrounds.
Constraints: exactly 16 images in exactly 4x4 cells; no text, letters, numbers, logo, watermark, UI frame, repeated creature, merged cells, empty cells, or cropped body.
```

## 人物成长图集 v2

- 模式：OpenAI 内置 ImageGen，`stylized-concept`，以 v1 布局和官网玩法宣传图作为视觉参考。
- 初版造型：`public/assets/hero-progression-atlas-v2.png`
- 色键原图：`public/assets/hero-progression-atlas-v2-chroma.png`
- 生产文件：`public/assets/hero-progression-atlas-v2-final2.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-86a1e7e9-3861-4df2-95ce-dde5377641ae.png`
- 后处理：第二次内置 ImageGen 编辑只把黑底替换为纯绿，再使用 `remove_chroma_key.py` 移除色键；主页、头像与战斗共用同一五阶段图集。

最终提示词要点：

```text
Use case: stylized-concept
Asset type: production character progression sprite atlas for a portrait mobile fantasy RPG
Input images: v1 is the exact five-column layout reference; official feature art is the reference for a compact faceless knight, red helmet plume, shield/sword combat language and bright cartoon proportions.
Primary request: Replace all five bearded hammer warriors with five stages of the same closed-helmet knight: worn leather and dented gray helmet, bronze armor, polished steel, ornate gold, then luminous red-and-gold legendary armor. Keep the face hidden in every stage.
Composition: exact five equal columns, one centered full-body hero per cell, identical scale and baseline, no boundary crossing.
Constraints: no text, logo, watermark, extra characters, exposed face, beard, hammer, axe or cropped body.
```

## 独立符文图集 v1

- 模式：OpenAI 内置 ImageGen，`stylized-concept`。
- 生产文件：`public/assets/rune-atlas-v1.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-dc7840bd-f976-4663-b5be-9af25574267d.png`

最终提示词要点：

```text
Use case: stylized-concept
Asset type: production rune icon sprite atlas for a portrait mobile fantasy RPG
Primary request: Create exactly twelve distinct magical rune emblems in a precise 4x3 atlas: emerald heart, blood-fang crescent, thorn ring, wind hourglass; rebirth phoenix, crossed blades, illusion mirror mask, fortified shield knot; holy sun, lightning judgment, binding chains, armor-breaking spearhead.
Composition: identical edge-aligned square cells, one centered emblem per cell, stable scale and padding.
Constraints: exactly 12 icons and 4x3 cells; no text, logo, watermark, characters, repeated compositions, merged or empty cells.
```

## 魂卡图集 v1

- 模式：OpenAI 内置 ImageGen，`stylized-concept`。
- 生产文件：`public/assets/soul-card-atlas-v1.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-62355585-bf0e-4b45-977a-7803ad6e5dd1.png`

最终提示词：

```text
Use case: stylized-concept; production sprite atlas for Chinese mobile fantasy RPG soul-card UI; exactly 30 distinct illustrations in a precise 5 columns x 6 rows grid; identical edge-aligned cells; polished hand-painted style; varied heroes, spirits, weapons, beasts, fortresses and sigils; varied red, jade, gold, cyan and magenta palette; no text, logo or watermark.
```

## 人物成长图集 v1

- 模式：OpenAI 内置 ImageGen，`stylized-concept`，生成后使用本地色键移除工具转为透明 PNG。
- 生产文件：`public/assets/hero-progression-atlas-v1.png`
- 色键原图：`public/assets/hero-progression-atlas-v1-source.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-247f097c-598d-453e-a33c-8b6d145debe2.png`
- 尺寸：1983x793，5 列x1 行。

最终提示词：

```text
Use case: stylized-concept
Asset type: five-frame horizontal character progression atlas for a portrait mobile fantasy RPG
Primary request: Show the same young male adventurer in five increasingly powerful stages, reading left to right: simple cloth novice, light leather fighter, blue-silver knight, ornate gold-red champion, and radiant endgame warlord. Preserve the same face, dark hair, stance, body proportions, and camera angle in all five frames; only equipment, weapon, aura, and refinement should advance.
Style/medium: polished colorful 2D Chinese mobile RPG character art with crisp silhouettes, readable armor layers, heroic but compact proportions.
Composition/framing: exact 5x1 layout, one full-body front three-quarter character per equal cell, feet and head fully visible, generous safe padding, no overlap between cells.
Background: perfectly flat chroma-key green, uniform edge to edge, for local transparency removal.
Constraints: no text, no numbers, no UI frames, no logo, no watermark, no cast shadow, no green on the character, no duplicated progression stage.
```

## 战斗敌人图集 v1

- 模式：OpenAI 内置 ImageGen，`stylized-concept`，生成后使用本地色键移除工具转为透明 PNG。
- 生产文件：`public/assets/battle-enemy-atlas-v1.png`
- 色键原图：`public/assets/battle-enemy-atlas-v1-source.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-b13e4668-e66c-4427-baf9-9271b467c548.png`
- 尺寸：1920x819，5 列x1 行。

最终提示词：

```text
Use case: stylized-concept
Asset type: five-frame horizontal enemy atlas for an animated portrait mobile RPG battle scene
Primary request: Create five clearly different full-body fantasy enemies in increasing danger, reading left to right: a small goblin raider, an armored wolf brute, a purple cave demon, a horned abyss commander, and a frost-armored ancient boss. Each needs a strong combat silhouette and a weapon or magical attack cue.
Style/medium: premium colorful 2D Chinese mobile RPG battle art, crisp readable shapes, lively expressions, rich material detail.
Composition/framing: exact 5x1 layout, one centered front three-quarter enemy per equal cell, consistent baseline and scale progression, complete body visible, safe padding, no crossing cell boundaries.
Background: perfectly flat chroma-key green, uniform edge to edge, for local transparency removal.
Constraints: no text, no numbers, no UI frames, no logo, no watermark, no cast shadow, no green on subjects, no repeated creature design.
```

## 商城资源图集与商人横幅 v1

- 模式：OpenAI 内置 ImageGen，项目生产素材。
- 生产文件：`public/assets/commerce-atlas-v1.png`、`public/assets/shop-merchant-v1.png`。
- 用途：商城/礼包的钻石、金币、鞭子、石板、魔兽蛋、魂卡等资源图标，以及商城和礼包顶部商人场景。
- 约束：资源图集为规则网格、每格单一物件、无文字；横幅预留右侧标题和按钮安全区，人物、柜台与远景不遮挡交互层。

资源图集最终提示词：

```text
Use case: stylized-concept
Asset type: compact fantasy mobile RPG commerce item atlas
Primary request: Create twelve distinct premium game-resource icons including diamonds, gold, training whip, rune tablet, beast essence, gem ticket, soul core, beast egg, artifact ore, battle token, soul-card crystal, and pet awakening flower.
Style/medium: polished colorful Chinese mobile RPG item art with readable silhouettes and varied materials.
Composition/framing: exact 4x3 equal-cell atlas, one centered object per cell, consistent scale and generous padding, no crossing cell boundaries.
Constraints: no text, no numbers, no UI frames, no logo, no watermark.
```

商人横幅最终提示词：

```text
Use case: stylized-concept
Asset type: wide in-game shop header banner
Primary request: A friendly fantasy merchant woman presenting goods in an open-air mountain market, with shelves and hanging ornaments framing a bright distant landscape.
Style/medium: polished colorful Chinese mobile RPG background illustration.
Composition/framing: wide shallow banner; merchant on the left half, open readable space on the right for live UI text and buttons.
Constraints: no baked-in text, numbers, UI, logo, or watermark.
```

## 魔兽图集 v3

- 模式：OpenAI 内置 ImageGen，`stylized-concept`。
- 生产文件：`public/assets/beast-atlas-v3.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-d5ef4c1b-a257-4047-a136-75f93486767f.png`
- 尺寸：1448×1086，4 列×3 行。

最终提示词：

```text
Use case: stylized-concept
Asset type: 4 columns by 3 rows sprite atlas for a mobile RPG beast collection screen
Primary request: Create twelve clearly distinct fantasy beast portraits, one centered creature per equal square cell. The subjects, in reading order, are: a small emerald fairy dragon, a blue electric baby dragon, a white frost dragon, a crimson life-draining spirit demon, a purple cave bat beast, a bronze armored lion beast, a regal emerald dragon, a ghost princess spirit, a black nightmare horse-like demon, an ice overlord beast, a humanoid thunder god beast, and a glowing experience spirit.
Style/medium: polished colorful 3D cartoon mobile RPG game art, compact toy-like proportions, expressive silhouettes, similar visual energy to a lighthearted Chinese chest-opening RPG
Composition/framing: exact 4x3 grid, equal square cells, each portrait fills its own cell with generous edge padding, straight-on or three-quarter view, no subject crosses cell boundaries
Lighting/mood: bright readable rim lighting, each creature has its own elemental atmosphere
Color palette: varied by subject, not one-note; greens, cyan, white, crimson, violet, bronze, black, ice blue, lightning gold
Constraints: clean dark neutral background inside every cell; strong visual differentiation; no UI frames; no text; no logos; no watermark; no duplicated creature designs; grid lines must be perfectly straight and evenly spaced
```

## 系统图集 v4

- 模式：OpenAI 内置 ImageGen，`stylized-concept`。
- 生产文件：`public/assets/system-atlas-v4.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-83b50d2c-8f52-4e7f-8d78-a96546fb5799.png`
- 尺寸：1448×1086，4 列×3 行。

最终提示词：

```text
Use case: stylized-concept
Asset type: exact 4 columns by 3 rows sprite atlas for a Chinese fantasy mobile RPG
Primary request: Create twelve distinct system illustrations in reading order: a black thunder horse, a massive ice bear mount, a crimson hunter wolf, a golden flying cloud, a luminous rune altar, a tray of four red/blue/orange/green gems, Ares's golden sword, a white feather katana, a black-red immortal blade, a blue ocean blade, a heroic red battle flag, and a frontier territory supply wagon.
Style/medium: premium colorful hand-painted 2D mobile game art, crisp silhouettes and rich material detail.
Composition/framing: exact equal 4x3 grid; one centered subject per cell; safe padding; no subject crosses a cell boundary.
Constraints: no text, no logos, no watermark, no repeated subject, no UI frames, perfectly straight grid axes for CSS sprite cropping.
```

## 成长玩法图集 v1

- 模式：OpenAI 内置 ImageGen，`stylized-concept`。
- 生产文件：`public/assets/growth-atlas-v1.png`
- 原始生成文件：`/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-2ab67f12-acab-4f81-9c43-10e1c54e6abe.png`
- 尺寸：1256×1256，4 列×4 行。

最终提示词：

```text
Use case: stylized-concept
Asset type: 4 by 4 sprite atlas for a Chinese fantasy mobile RPG single-player game UI
Primary request: Create one perfectly square image divided into an EXACT 4 columns by 4 rows grid of sixteen equal square cells, with no gutters and no borders between cells. Each cell is an independent richly illustrated game icon/scene. Cell order left-to-right, top-to-bottom:
1 emerald heart-shaped Life Rune stone on a moss altar;
2 sapphire phoenix-shaped Revival Rune stone with rebirth flames;
3 amber-gold sacred shield-shaped Holy Rune stone with divine rays;
4 prismatic Wildcard Rune stone with four-color magic;
5 treasure chest wagon on an old road;
6 windmill farm with wheat and food baskets;
7 hunter supply camp with meat racks and tents;
8 beast-taming camp with whips, fences and stable;
9 abandoned gold minecart at a rocky mine;
10 ancient rune ruins with luminous standing stones;
11 jewel merchant caravan with red blue orange green gems;
12 ancient volcanic forge with anvil and glowing furnace;
13 frontier military supply camp with red battle flags;
14 guarded frontier gate and watchtower;
15 small misty mountain shrine with reward chest;
16 woodland expedition camp with map table and supplies.
Style/medium: premium hand-painted 2D mobile fantasy RPG game art, slightly isometric for location cells, crisp readable silhouettes, saturated but balanced colors, detailed materials, consistent lighting and scale.
Composition/framing: one centered subject fills each cell with safe padding; every cell must remain visually distinct at 80px display size.
Lighting/mood: luminous magical highlights, adventurous daytime environments, high clarity.
Constraints: exact 4x4 geometry; no text, no letters, no numbers, no logos, no watermarks, no UI frames, no rounded cards, no seams or gutters, no repeated scene, no character portraits. Keep the grid axes precisely at 25%, 50%, 75% so CSS sprite cropping works.
```

## 战魂图集 v3

- 模式：OpenAI 内置 ImageGen，`stylized-concept`；五张分层图集经等格机械裁切后拼为生产图。
- 生产文件：`public/assets/war-soul-atlas-v3.png`，1536×2304，4 列×6 行，每格 384×384。
- 映射顺序：严格按 `WAR_SOULS`：布朗、苍云、耶格尔、乌云、泰尼、尤弥尔、夜叉、罗刹、波比、影武者、炎魔、极光、纳塞、死神、红莲、波蒙特、阿努比斯、奈尼斯、青龙、白虎、朱雀、玄武、切茜娅、海德拉。
- 原作依据：录屏 `frame-1190-0595.00s.jpg` 的尤弥尔全身比例，以及 `frame-1185-0592.50s.jpg` 的完美/超凡图鉴顺序与物种、色彩特征。
- 原始生成文件：
  - `/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-58d35ce3-a1af-4b70-b54c-71a2c9fd0fe8.png`
  - `/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-8dbf061d-bd6b-4b53-ba1c-5b56231b7f5a.png`
  - `/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-65f918b6-5f2f-42a6-9bde-3376eb6275d6.png`
  - `/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-e39a1077-f0e5-44d4-aa01-43aa1d75c5b1.png`
  - `/Users/jz/.codex/generated_images/019f5e63-c699-7ed0-87ee-180f9df2a385/exec-21de66af-954b-4793-b4ae-cd84bf0b0016.png`

最终提示词组：

```text
[1/5]
Use case: stylized-concept
Asset type: production sprite sheet for a portrait Chinese fantasy mobile RPG war-soul collection
Input images: Image 1 is a style and proportion reference from the original game, especially the compact full-body 3D chibi battle-spirit standing in an arena.
Primary request: Create exactly four distinct full-body battle-spirit characters in a precise 2-column by 2-row atlas, ordered left to right, top to bottom:
1) Brown: a small heroic knight in silver and gold plate armor, blue scarf, round shield and short sword.
2) Cangyun: a compact jade-and-silver cloud swordsman with tied black hair and one straight sword.
3) Jaeger: a compact masked shadow hunter in black and violet light armor with two short blades.
4) Wuyun: a mischievous dark storm-cloud spirit, creature rather than human, with a smoky round body, clawed arms and cyan lightning marks.
Style/medium: polished colorful 3D mobile-game character render, original-game-like compact proportions, readable full-body silhouette, slightly oversized head and equipment, not anime portrait art.
Composition/framing: exactly four equal edge-aligned cells in a 2x2 grid; one centered full-body character per cell; identical scale, camera, baseline, and safe padding; no subject crosses a cell boundary. Clean muted blue-gray arena backdrop in every cell.
Lighting/mood: bright game-key art lighting, clear materials, friendly heroic fantasy.
Constraints: exactly 4 characters and exactly 2x2 cells; no text, letters, numbers, logo, watermark, UI frame, card border, labels, cropped feet, duplicate designs, extra characters, merged cells, or objects crossing boundaries.
Avoid: close-up faces, landscape banners, painterly anime portraits, realistic human proportions.

[2/5]
Use case: stylized-concept
Asset type: production sprite sheet for a portrait Chinese fantasy mobile RPG war-soul collection
Input images: Image 1 is the original-game style and exact Ymir reference: compact full-body 3D chibi battle spirits in a suspended-stone arena.
Primary request: Create exactly four distinct full-body epic battle spirits in a precise 2-column by 2-row atlas, ordered left to right, top to bottom:
1) Taini: a compact violet astral witch spirit with twin hair buns, a floating purple orb and star charms.
2) Ymir: faithfully follow the reference character: a stocky cyan-and-deep-blue ice golem, rocky crystal spikes on head and shoulders, heavy stone fists, holding a short dark hammer; friendly but powerful proportions.
3) Yaksha: a compact crimson horned demon warrior with black-red armor, ember fists and a fierce mask.
4) Rakshasa: a compact turquoise spectral water warrior queen with flowing wave hair, crescent blades and cool blue armor.
Style/medium: polished colorful 3D mobile-game character render matching the reference's compact proportions, readable full-body silhouette, slightly oversized head, hands and equipment; not anime portrait art.
Composition/framing: exactly four equal edge-aligned cells in a 2x2 grid; one centered full-body character per cell; identical scale, camera, baseline, and safe padding; no subject crosses a cell boundary. Use the same pale suspended-stone arena backdrop in all cells.
Lighting/mood: bright readable game lighting, clear crystals, metal and elemental materials.
Constraints: exactly 4 characters and exactly 2x2 cells; no text, letters, numbers, logo, watermark, UI frame, card border, labels, cropped feet, duplicate designs, extra characters, merged cells, or objects crossing boundaries.
Avoid: close-up faces, landscape banners, painterly anime portraits, realistic human proportions.

[3/5]
Use case: stylized-concept
Asset type: production sprite sheet for a portrait Chinese fantasy mobile RPG war-soul collection
Input images: Image 1 is the original-game style reference for compact full-body 3D chibi battle spirits in a suspended-stone arena.
Primary request: Create a precise 3-column by 2-row atlas. Reading left to right:
Row 1: 1) Bobby: a short moss-green forest guardian with bark armor, leafy antlers and a stone club. 2) Shadow Warrior: a compact black-and-violet ninja with masked face, scarf and twin short blades. 3) Flame Demon: a stocky crimson lava demon with black-gold armor, fiery mane and ember claws.
Row 2: 4) Aurora: an elegant compact ice-and-aurora spirit queen with pale hair, crystalline crown and a frost staff. 5) Nasser: a compact pale vampire lord with black hair, red-lined high collar and a dark saber. 6) an entirely empty matching arena cell with no character or object.
Style/medium: polished colorful 3D mobile-game character render matching the reference's compact proportions, readable full-body silhouette, slightly oversized head, hands and equipment; not anime portrait art.
Composition/framing: exactly six equal edge-aligned cells in a 3x2 grid; one centered full-body character in cells 1-5; cell 6 completely empty; identical scale, camera, baseline, and safe padding; no subject crosses a cell boundary. Use the same pale suspended-stone arena backdrop in every cell.
Lighting/mood: bright readable game lighting, clear materials and strong distinct silhouettes.
Constraints: exactly 5 characters plus 1 empty cell and exactly 3x2 cells; no text, letters, numbers, logo, watermark, UI frame, card border, labels, cropped feet, duplicate designs, extra characters, merged cells, or objects crossing boundaries.
Avoid: close-up faces, landscape banners, painterly anime portraits, realistic human proportions.

[4/5]
Use case: stylized-concept
Asset type: production sprite sheet for a portrait Chinese fantasy mobile RPG war-soul collection
Input images: Image 1 shows the original game's codex icons and exact order for the perfect-tier spirits; Image 2 shows the original game's compact full-body 3D chibi battle-spirit proportions and arena.
Primary request: Create a precise 3-column by 2-row atlas. Reading left to right:
Row 1: 1) Death: a compact black-hooded skeletal reaper with violet soul flame and a short crescent scythe. 2) Red Lotus: a compact scarlet-and-gold lotus dragon spirit, with a fiery flower mane and curled draconic body. 3) Beaumont: a compact round midnight abyss beast, whale-slime-like, with glossy black-blue body, cyan eyes and violet orb markings.
Row 2: 4) Anubis: a compact black jackal-headed tomb guardian in black-and-gold Egyptian fantasy armor with a crescent staff. 5) Nainis: a compact obsidian moon sorceress spirit with dark indigo armor, silver crescent crown and floating red-violet rune. 6) an entirely empty matching arena cell with no character or object.
Style/medium: polished colorful 3D mobile-game character render matching Image 2's compact proportions, readable full-body silhouette, slightly oversized head, hands and equipment; preserve the species and major color identity seen in Image 1; not anime portrait art.
Composition/framing: exactly six equal edge-aligned cells in a 3x2 grid; one centered full-body character in cells 1-5; cell 6 completely empty; identical scale, camera, baseline, and safe padding; no subject crosses a cell boundary. Use the same pale suspended-stone arena backdrop in every cell.
Lighting/mood: bright readable game lighting with clear magical materials and silhouettes.
Constraints: exactly 5 characters plus 1 empty cell and exactly 3x2 cells; no text, letters, numbers, logo, watermark, UI frame, card border, labels, cropped feet, duplicate designs, extra characters, merged cells, or objects crossing boundaries.
Avoid: close-up faces, landscape banners, painterly anime portraits, realistic human proportions.

[5/5]
Use case: stylized-concept
Asset type: production sprite sheet for a portrait Chinese fantasy mobile RPG war-soul collection
Input images: Image 1 shows the original game's extraordinary-tier codex icons in the exact 3x2 order; Image 2 shows the original game's compact full-body 3D chibi battle-spirit proportions and suspended-stone arena.
Primary request: Recreate the six extraordinary battle spirits as full-body 3D characters in a precise 3-column by 2-row atlas, matching Image 1's species, colors and order:
Row 1: 1) Azure Dragon: a long jade-green and cyan eastern dragon, compact coiled full body, antler horns and cloud fins. 2) White Tiger: a powerful compact white tiger with gray stripes, icy blue eyes and light silver armor. 3) Vermilion Bird: a compact crimson, orange and gold phoenix with spread flame-feather wings.
Row 2: 4) Black Tortoise: a stocky obsidian tortoise guardian entwined with a dark blue serpent, both visible as one spirit. 5) Cheshiya: a compact elegant white-and-pink fox spirit girl matching the pale pink creature in the codex reference, with multiple soft tails and a crescent ornament. 6) Hydra: a compact pale cyan three-headed sea dragon, three distinct necks and heads, fin crests and one shared body.
Style/medium: polished colorful 3D mobile-game character render matching Image 2's compact proportions, readable complete silhouettes, slightly oversized heads and features; preserve the identity seen in Image 1; not anime portrait art.
Composition/framing: exactly six equal edge-aligned cells in a 3x2 grid; one centered complete character per cell; identical scale, camera, baseline, and safe padding; no wings, tails, horns or heads cross a cell boundary. Use the same pale suspended-stone arena backdrop in every cell.
Lighting/mood: premium bright game-key lighting, vivid extraordinary-tier color and clear material separation.
Constraints: exactly 6 characters and exactly 3x2 cells; no text, letters, numbers, logo, watermark, UI frame, card border, labels, cropped body parts, duplicate designs, extra characters, merged cells, or objects crossing boundaries.
Avoid: close-up faces, landscape banners, painterly anime portraits, realistic human proportions.
```
