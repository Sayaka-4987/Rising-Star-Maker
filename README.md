# Rising Star Maker

一款以字符画和鼠标操作为主要风格的中文实习生养成网页游戏。

玩家以 Mentor 的第一人称视角，在 24 周内安排工作、学习、相处与冒险活动。实习生会犯错，也可能有超出预期的表现。叙述者不急着评价一个人，但不会淡化错误和后果。

## 本地运行

需要 Node.js 18 或更高版本。

```bash
npm install
npm run dev
```

常用命令：

```bash
npm test
npm run build
npm run preview
```

## 修改中文文案

玩家可见文本集中在 [src/content/zh-CN.json](src/content/zh-CN.json)。字符画集中在 [src/content/ascii.json](src/content/ascii.json)。

- `{name}` 会替换为实习生姓名。
- `{pronoun}` 会根据角色替换为“他”“她”或“ta”。
- 每项活动分别有 `criticalFailure`、`failure`、`success` 和 `criticalSuccess` 四种结果文案。
- 规则数据与文案键的对应关系位于 [src/data/gameData.ts](src/data/gameData.ts)。

修改后运行 `npm test`，内容校验会检查缺失文案、重复 ID、事件数量和未知引用。

### 未来增加英文

语言目录接口位于 [src/content/text.ts](src/content/text.ts)。当前只注册 `zh-CN`，未来新增英文时：

1. 复制中文键集合并创建 `en-US.json`。
2. 使用 `registerLocale('en-US', catalog)` 注册英文目录。
3. 通过 `setLocale('en-US')` 切换；遗漏的键会自动回退到中文。

目前不展示语言选择器，也不维护英文文本。

## 技术结构

- Vite + TypeScript + 原生 DOM/CSS
- 带种子的确定性随机数
- 每周情况卡与机会、风险、相关提示
- 12 维隐藏证据账本与可解释阶段评价
- `localStorage` 当前存档与 HumanDex 图鉴
- Vitest 规则与完整流程测试
- GitHub Actions 自动部署到 GitHub Pages

当前已实现的设计和 MVP 范围见 [plan.mvp.md](plan.mvp.md)。事件牌、证据账本、两页面循环和 30 个结局的下一阶段设计见 [plan.md](plan.md)。

## 部署

推送到 `main` 后，GitHub Actions 会运行测试和构建，然后发布 `dist` 到 GitHub Pages。仓库首次部署前，需要在 GitHub 的 **Settings > Pages > Build and deployment** 中把 Source 设为 **GitHub Actions**。
