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