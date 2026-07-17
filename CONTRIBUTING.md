# Contributing Guide | 贡献指南

## English

Thanks for helping improve Rising Star Maker.

### 1. Local setup

```bash
npm install
npm run dev
```

### 2. Main folders

- `src/content/zh-CN.json`: player-facing Chinese text
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
- Preserve a consistent tone: grounded, specific, and consequence-aware
- Keep the mentor narration in first person with a kind, gentle, non-judgmental attitude toward the intern
- Use inclusive language and avoid exclusionary, stereotyped, or biased expressions

## 中文

感谢你为 Rising Star Maker 做贡献。

### 1. 本地运行

```bash
npm install
npm run dev
```

### 2. 主要目录

- `src/content/zh-CN.json`：玩家可见中文文案
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
- 文案语气保持具体、克制、可追溯后果
- Mentor 第一人称叙述应保持友善、温柔、不过度评判实习生
- 注意包容性表达，避免排他、刻板印象或带偏见的措辞