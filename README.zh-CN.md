# Agent Tempo

Agent Tempo 是一个 local-first 的中英双语网页应用，用来帮人和 agent 协作时稳住节奏。

它不是云服务，不是 agent 执行平台，也不会自动调用 Claude、Codex 或其他模型。它做的是一件更小的事：让人每天只盯一到三个结果，在 agent 跑任务时继续做人该做的事，并在 agent 回来后做明确验收。

## 当前状态

这个仓库是 Agent Tempo 的开源候选仓。当前公开定位是：静态本地网页应用、纯 JavaScript 状态逻辑、双语文档和隐私扫描门。

请把它理解成候选包，而不是已经上线的云产品。

## 它解决什么

- 把一天限制在一到三个具体结果上。
- 区分 agent 正在跑的任务和人类可以并行推进的任务。
- 把跑偏的新想法先停进停车场，只有服务当前结果且今天有必要时才提上来。
- agent 完成后进入返回闸口：接受、返工、暂停或进入下一步。
- 默认把数据存在浏览器 `localStorage` 的 `agent-tempo:v1` key 里。
- 提供英文和中文说明，方便公开分发。

## 它不做什么

- 不创建、不控制、不调度 agent。
- 不自动调用 Claude、Codex、OpenAI、Anthropic、GitHub 或任何远程 API。
- 不跨设备同步。
- 没有账号、团队、计费、遥测或服务端数据库。
- 不适合保存密钥、客户资料、真实业务对话库、生产事故记录或私人策略。

## 隐私边界

默认边界很简单：

- 默认无网络请求。
- 无账号系统。
- 无遥测。
- 无服务端数据库。
- 浏览器数据存在 `localStorage`，key 是 `agent-tempo:v1`。

请把它当成本地轻量计划板。不要把 API key、密码、客户记录、机密提示词、完整私人聊天记录粘进去。

发布或打包前运行：

```bash
node scripts/privacy-scan.js
```

扫描器会拦截常见私有路径、治理源标记和疑似 secret token。正常开源说明里的 `localStorage` 和 `agent-tempo:v1` 不会被当成问题。

维护者可以把 `privacy-blocklist.example.json` 复制为 `privacy-blocklist.local.json`，写入不能发布的私有代号或工作区词。这个本地 blocklist 会被 git 忽略，但会被扫描器读取。

## 快速开始

要求：

- Node.js 18 或更新版本。
- 一个现代浏览器。

运行检查：

```bash
npm test
node scripts/privacy-scan.js
```

从 checkout 启动本地静态服务：

```bash
npm run serve
```

然后打开 [http://localhost:4173](http://localhost:4173)。推荐用本地服务访问，因为应用会导入本地 JavaScript 模块；直接用 `file://` 打开可能被浏览器安全策略拦住。

## 一天怎么用

1. 先写下今天一到三个必须产出的结果。
2. 只启动一个和当前结果有关的 agent 任务。
3. agent 在跑的时候，人继续做人类专属工作：判断、沟通、写作、销售、验收。
4. agent 回来后，不要直接当完成；先过返回闸口。
5. 跑偏的新想法先停下，除非它服务今天结果且有真实延迟成本。

## 产品边界

Agent Tempo 是一个给单人使用的协作节奏工具：

- 判断权仍然在人。
- 应用只帮你稳住节奏和验收动作。
- agent 执行发生在应用之外。
- 私人内容不要进入公开 issue、示例和截图。

更多边界见 [docs/PRODUCT.md](docs/PRODUCT.md) 和 [docs/PRIVACY.md](docs/PRIVACY.md)。

## 贡献

贡献必须保持 local-first、用户可见内容双语优先、默认隐私安全。提交前请先看 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 安全

不要在公开 issue 里贴私人提示词、secret、客户资料或本机路径。见 [SECURITY.md](SECURITY.md)。

## License

MIT。见 [LICENSE](LICENSE)。
