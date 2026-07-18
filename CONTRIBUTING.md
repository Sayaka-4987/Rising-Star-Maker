# Contributing Guide / 贡献指南

## English

Thanks for helping improve *Rising Star Maker*.

### 1. Local setup

```bash
npm install
npm run dev
```

### 2. Main folders

- `src/content/zh-CN.json`: player-facing Chinese text
- `src/content/en-US.json`: player-facing English text (parallel to zh-CN keys)
- `src/content/ascii.json`: ASCII art assets
- `src/data/gameData.ts`: gameplay data and content key mapping
- `src/game/`: rules, RNG, save/load logic

### 3. Before opening a PR

```bash
npm test
npm run build
```

Please include:

- What changed and why
- Screenshots or terminal output if UI/rules changed
- Notes on balance/content impact if applicable

### 4. Content rules

- Keep IDs stable; avoid renaming existing keys unless necessary
- Add complete text variants for each activity result
- Keep `zh-CN.json` and `en-US.json` key sets aligned (no missing or extra keys)
- When adding or changing player-facing text keys, update both locales in the same PR
- Preserve a consistent tone: grounded, specific, and consequence-aware
- Keep the mentor narration in first person with a kind, gentle, non-judgmental attitude toward the intern
- Use inclusive language and avoid exclusionary, stereotyped, or biased expressions

### 5. Current numeric mechanics

- Hidden stats: `technical`, `curiosity`, `independence`, `social`, `creativity`, `ambition`, `chaos`
- Initial stats: each starts in `35-65`, then normalized to total around `350`
- Weekly loop: choose exactly 3 activities each week, then resolve outcomes in one batch
- Outcome tiers: `criticalFailure` / `failure` / `success` / `criticalSuccess`
- Base outcome model: activity-relevant stats drive probabilities (higher aptitude lowers failure odds)
- Situation modifiers: `opportunity` reduces failure and raises critical success; `risk` increases failure and critical failure; `related` mainly affects evidence
- Repetition pressure: repeating the same activity increases `chaos` over time
- Evidence ledger: 12 hidden evidence dimensions; weekly gain per single evidence is capped (anti-spam)
- Risk ledger: tracks `rework`, `lateHelp`, `unsafeAction`, `unclearCommunication`, `scopeCreep`
- Traits: unlocked by behavior patterns and thresholds (priority decides tie-breaking)
- Ending evaluation: checks hard requirements first, then computes weighted scores from stats/evidence/activities/counters/traits/situations
- Special gating: `no_return_offer` / `internship_extended` are evaluated before regular career endings

### 6. Ending strategy (for balancing/content QA)

<details>
<summary>Click Here</summary>

Use this quick routing map when you design new content, tune numbers, or verify that an ending is still realistically reachable.

- Core engineer lane (`software` / `backend` / `test_engineer`)
	- Activity bias: `fix_bug`, `write_tests`, with controlled `production_incident`
	- Evidence targets: `engineering`, `reliability`, `incidentResponse`
	- Watch-outs: too many late critical failures can trigger `no_return_offer`
- Product and communication lane (`product` / `program_manager` / `technical_sales`)
	- Activity bias: `build_feature`, `mentor_1on1`, `demo`, `team_lunch`
	- Evidence targets: `productSense`, `communication`, `customerFacing`, `ownership`
	- Watch-outs: avoid excessive scope creep and unclear communication streaks
- Research and data lane (`research` / `data_scientist` / `applied_scientist` / `ml_engineer`)
	- Activity bias: `read_docs`, `tech_talk`, plus `build_feature` or `write_tests` to ground outcomes
	- Evidence targets: `research`, plus `engineering` or `ownership`
	- Watch-outs: pure reading without delivery often stalls score growth
- Reliability and platform lane (`site_reliability` / `security` / `kubernetes` / `data_engineer`)
	- Activity bias: `write_tests`, `production_incident`, `touch_kubernetes`, selective `fix_bug`
	- Evidence targets: `incidentResponse`, `reliability`, `engineering`
	- Watch-outs: high-risk actions raise failure burden quickly if stats are not ready
- Creative side-project lane (`open_source` / `founder` / `independent_developer`)
	- Activity bias: `friday_project` with support from `build_feature` / `demo`
	- Evidence targets: `community`, `ownership`, `productSense`
	- Watch-outs: over-spamming one action raises chaos and can reduce consistency
- Hobby-special endings (`flight` / `indie_game_creator` / `robotics_engineer` / `music_tech_creator` / `illustrator`)
	- Activity bias: route through events that can emit hobby tags; use weekly `?` mystery activities to diversify hobby growth
	- Evidence targets: corresponding hobby evidence (`aviation`, `gaming`, `robotics`, `music`, `anime`, etc.)
	- Watch-outs: do not rely on a single activity only; multiple activity sources improve trait unlock reliability

Practical QA checklist per PR:

- Run at least one focused schedule per target lane for multiple seeds
- Confirm both locales describe the same strategic signals
- If changing event tags, verify hobby growth tier copy still appears with healthy frequency

</details>

## 中文

感谢你参与开发《职场新星梦工厂》。

### 1. 本地运行

```bash
npm install
npm run dev
```

### 2. 主要目录

- `src/content/zh-CN.json`：玩家可见中文文案
- `src/content/en-US.json`：玩家可见英文文案（与 zh-CN 键保持并行）
- `src/content/ascii.json`：ASCII 字符画资源
- `src/data/gameData.ts`：规则数据与文案键映射
- `src/game/`：规则、随机数、存档逻辑

### 3. 提交 PR 前

```bash
npm test
npm run build
```

请在 PR 中说明：

- 修改了什么、为什么改
- 若改动 UI/规则，附截图或关键输出
- 若影响平衡或文案，说明影响范围

### 4. 内容约定

- 尽量保持现有 ID 稳定，非必要不改键名
- 活动结果文案要补齐完整分支
- `zh-CN.json` 与 `en-US.json` 的键集合必须保持一致（不缺失、不多余）
- 新增或修改玩家可见文案键时，需在同一个 PR 同步更新中英文两套文案
- 文案语气保持具体、克制、可追溯后果
- Mentor 第一人称叙述应保持友善、温柔、不过度评判实习生
- 注意包容性表达，避免排他、刻板印象或带偏见的措辞

### 5. 当前数值机制

- 隐藏属性：`technical`、`curiosity`、`independence`、`social`、`creativity`、`ambition`、`chaos`
- 初始属性：每项 `35-65`，随后做一次总和归一（总量约 `350`）
- 周循环：每周必须安排 3 个活动，然后一次性结算结果
- 结果分档：`criticalFailure` / `failure` / `success` / `criticalSuccess`
- 基础结算：活动相关属性越高，失败概率越低
- 情况卡修正：`opportunity` 降低失败并提高大成功；`risk` 提高失败与大失败；`related` 主要影响证据
- 重复活动压力：重复同类活动会逐步提高 `chaos`
- 证据账本：12 维隐藏证据；单周单维证据增量有上限（防刷）
- 风险账本：记录 `rework`、`lateHelp`、`unsafeAction`、`unclearCommunication`、`scopeCreep`
- Trait 解锁：由行为模式和阈值触发，优先级用于并列决策
- 结局判定：先检查硬性资格，再按属性/证据/活动/计数器/Trait/情况卡做加权评分
- 特殊前置：`no_return_offer` 与 `internship_extended` 先于常规职业结局判定

### 6. 结局攻略（用于平衡/内容回归）

<details>
<summary>点击展开</summary>

当你新增内容、调数值或验证结局可达性时，可按下面这张“路线指挥图”快速检查。

- 核心工程路线（`software` / `backend` / `test_engineer`）
	- 活动倾向：`fix_bug`、`write_tests`，配合可控的 `production_incident`
	- 证据目标：`engineering`、`reliability`、`incidentResponse`
	- 避坑重点：后期连续大失败过多会触发 `no_return_offer`
- 产品与沟通路线（`product` / `program_manager` / `technical_sales`）
	- 活动倾向：`build_feature`、`mentor_1on1`、`demo`、`team_lunch`
	- 证据目标：`productSense`、`communication`、`customerFacing`、`ownership`
	- 避坑重点：避免范围失控与沟通不清连续累积
- 研究与数据路线（`research` / `data_scientist` / `applied_scientist` / `ml_engineer`）
	- 活动倾向：`read_docs`、`tech_talk`，并用 `build_feature` 或 `write_tests` 承接落地
	- 证据目标：`research`，并兼顾 `engineering` 或 `ownership`
	- 避坑重点：只读不交付容易导致评分增长停滞
- 可靠性与平台路线（`site_reliability` / `security` / `kubernetes` / `data_engineer`）
	- 活动倾向：`write_tests`、`production_incident`、`touch_kubernetes`，辅以 `fix_bug`
	- 证据目标：`incidentResponse`、`reliability`、`engineering`
	- 避坑重点：高风险活动在属性不足时会快速累积失败负担
- 创作副项目路线（`open_source` / `founder` / `independent_developer`）
	- 活动倾向：以 `friday_project` 为主，配合 `build_feature` / `demo`
	- 证据目标：`community`、`ownership`、`productSense`
	- 避坑重点：单一活动刷太猛会推高 chaos，降低稳定性
- 兴趣专精结局（`flight` / `indie_game_creator` / `robotics_engineer` / `music_tech_creator` / `illustrator`）
	- 活动倾向：优先选择会产出兴趣标签的事件来源，并利用每周 `?` 随机行动分散培养兴趣
	- 证据目标：对应兴趣证据（`aviation`、`gaming`、`robotics`、`music`、`anime` 等）
	- 避坑重点：不要只押单一活动；多来源更利于稳定触发 Trait

每个 PR 的实操回归清单：

- 每条目标路线至少用若干 seed 跑一组“定向排程”
- 确认中英文文案对策略信号表达一致
- 若改了事件标签，确认兴趣分档文案仍以健康频率出现

</details>