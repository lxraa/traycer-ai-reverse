# Bundle 拆分方案

## 当前状态

`extension.js` 是一个 ~21000 行的打包文件，包含：
- 235 个顶级函数
- 12 个类定义
- 22 个 `__esmModule` 懒加载模块
- 大量混淆的变量名（如 `_0x5e67d9`）

已完成的工作：
- ✅ 外部 npm 模块已提取到顶部 `require()` 
- ✅ `modules/shared-env.js` - 运行时辅助函数
- ✅ `modules/constants.js` - Traycer 常量定义

## 拆分策略

### 原则
1. **按功能域拆分** - 每个模块负责一个独立功能
2. **保持懒加载机制** - 使用 `__esmModule` 的模块保持懒加载
3. **依赖关系清晰** - 避免循环依赖
4. **渐进式拆分** - 从底层模块开始，逐步向上

### 模块依赖层级

```
Layer 0 (基础)
├── shared-env.js        ✅ 已完成
├── constants.js         ✅ 已完成
└── core-utils.js        (待拆分) - 基础工具函数

Layer 1 (核心服务)
├── logger.js            - 日志系统
├── config.js            - 配置管理
├── sentry.js            - 错误追踪
└── diff-utils.js        - Diff 工具

Layer 2 (功能模块)
├── ignore-patterns.js   - 忽略规则
├── ripgrep/             - Ripgrep 搜索
│   ├── config.js
│   ├── command-builder.js
│   └── executor.js
├── ticket/              - 工单系统
│   ├── types.js
│   └── module.js
└── queue/               - 队列系统
    ├── request-queue.js
    └── latest-request-limiter.js

Layer 3 (业务逻辑)
├── task-chain/          - 任务链管理
├── auth/                - 认证系统
├── grpc/                - gRPC 通信
└── webview/             - WebView 相关
```

## 拆分步骤

### Phase 1: 核心工具模块

#### 1.1 创建 `modules/core-utils.js`
提取基础工具函数：
- `ensureBuffer()`
- `CustomSet` 类
- `AsyncQueue` 类
- 类型检查函数 (`isString`, `isPlainObject`, etc.)

#### 1.2 创建 `modules/logger.js`
提取日志系统：
- `Logger` 类及其实例
- `throttle()` 函数
- `initLogger` 模块

#### 1.3 创建 `modules/config.js`
提取配置管理：
- `createExtensionConfig()` 函数
- `config` 对象
- `initSearchConfig` 模块

### Phase 2: Sentry 和 Diff 模块

#### 2.1 创建 `modules/sentry.js`
- Sentry 初始化
- `captureExceptionToSentry()`
- `setSentryTag()`

#### 2.2 创建 `modules/diff-utils.js`
- `fuzzyFindTextInDocument()`
- `initDiffUtils`
- `initDiffMatchPatch`
- `initDiffExports`

### Phase 3: 功能模块

#### 3.1 创建 `modules/ignore-patterns.js`
- `u$` (目录忽略列表)
- `yO` (文件忽略列表)
- `o$` (合并列表)

#### 3.2 创建 `modules/ripgrep/` 目录
- `config.js` - ripgrep 配置
- `command-builder.js` - 命令构建器
- `executor.js` - 执行器

#### 3.3 创建 `modules/ticket/` 目录
- `types.js` - TicketType 枚举
- `module.js` - 工单模块

### Phase 4: 队列和请求模块

#### 4.1 创建 `modules/queue/`
- `request-queue.js`
- `latest-request-limiter.js`

## 自动化工具

### 工具 1: `split-module.js`
按 `__esmModule` 边界自动拆分模块

```javascript
// 用法
node tools/split-module.js --module initLogger --output modules/logger.js
```

### 工具 2: `analyze-deps.js`
分析模块依赖关系

```javascript
// 用法
node tools/analyze-deps.js extension.js
```

### 工具 3: `verify-split.js`
验证拆分后的代码是否正确

```javascript
// 用法
node tools/verify-split.js
```

## 拆分模板

每个拆分出的模块应遵循以下结构：

```javascript
/**
 * Module: <module-name>
 * Description: <description>
 * Dependencies: <list of dependencies>
 */
'use strict';

// 导入依赖
var { __esmModule, ... } = require('./shared-env.js');
var { CONSTANT_A, ... } = require('./constants.js');

// 模块代码
// ...

// 导出
module.exports = {
  // 导出项
};
```

## 注意事项

1. **混淆变量名** - 很多变量名是混淆的（如 `_0x5e67d9`），拆分时可以考虑重命名以提高可读性

2. **懒加载依赖** - `__esmModule` 包装的模块在首次调用时才初始化，拆分时需保持这个特性

3. **循环依赖** - 注意避免循环依赖，可以通过依赖注入或延迟 require 解决

4. **测试** - 每次拆分后运行 `node --check` 验证语法，并进行功能测试

## 预期结果

拆分完成后的目录结构：

```
extension/out/
├── extension.js          (主入口，~5000 行)
├── modules/
│   ├── shared-env.js     ✅
│   ├── constants.js      ✅
│   ├── core-utils.js
│   ├── logger.js
│   ├── config.js
│   ├── sentry.js
│   ├── diff-utils.js
│   ├── ignore-patterns.js
│   ├── ripgrep/
│   │   ├── index.js
│   │   ├── config.js
│   │   ├── command-builder.js
│   │   └── executor.js
│   ├── ticket/
│   │   ├── index.js
│   │   └── types.js
│   └── queue/
│       ├── request-queue.js
│       └── latest-request-limiter.js
└── tools/
    ├── split-module.js
    ├── analyze-deps.js
    └── verify-split.js
```

## 下一步行动

1. 先创建 `analyze-deps.js` 工具，分析当前依赖关系
2. 从最底层的 `core-utils.js` 开始拆分
3. 逐步向上拆分，每次验证功能正常



