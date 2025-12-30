# Bundle 文件模块拆解指南

## 目标
将 `extension.js` 中的模块逐个提取为独立文件，保持代码运行结果完全一致，包括全局类的加载顺序。

## 核心原则
⚠️ **必须严格保证**：
1. 代码行为完全一致
2. 全局类加载顺序不变
3. 依赖关系正确处理
4. 无 lint 错误

## 模块类型识别

### ✅ 无前置依赖（可直接提取）
```javascript
initRequestQueue = __esmModule(() => {
  'use strict';
  
  RequestQueue = class {
    // 直接定义类，没有调用其他 init 函数
  }
});
```

### ❌ 有前置依赖（需先处理依赖）
```javascript
initDocumentManager = __esmModule(() => {
  'use strict';
  
  initWorkspaceInfo(), initRequestQueue(), In = class {
    // ↑ 调用了其他 init 函数
  }
});
```

## 拆解步骤

### 1. 读取目标模块
```javascript
// 找到完整的 __esmModule 定义
var RequestQueue,
    initRequestQueue = __esmModule(() => {
      'use strict';
      RequestQueue = class { ... }
    }),
```

### 2. 创建独立文件
在 `modules/` 目录创建文件，如 `request_queue.js`：

```javascript
'use strict';

// 导入依赖（如果有）
const { Logger } = require("./logger.js");

/**
 * 类功能描述
 */
class RequestQueue {
  // 复制类定义，清理混淆的变量名
  constructor(concurrencyLimit, breatherDuration, continuousRequestDuration) {
    this.concurrencyLimit = concurrencyLimit;
    // ...
  }
  // 其他方法...
}

// CommonJS 导出
module.exports = {
  RequestQueue
};
```

### 3. 在主文件导入区添加导入
在 `extension.js` 导入区（约第 3-111 行）添加：

```javascript
const {
  RequestQueue
} = require("./modules/request_queue.js");
```

**位置建议**：放在相关依赖模块之后，如 `logger.js` 后面。

### 4. 删除主文件中的旧代码

#### 4.1 删除模块定义
删除整个 `__esmModule` 包装：
```javascript
// 删除这部分 ↓
RequestQueue,
initRequestQueue = __esmModule(() => {
  'use strict';
  RequestQueue = class { ... }
}),
```

#### 4.2 删除所有 init 调用
搜索并删除所有 `initRequestQueue()` 调用：
```bash
# 搜索命令
grep "initRequestQueue()" extension.js
```

删除示例：
```javascript
// 修改前
initWorkspaceInfo(), initRequestQueue(), In = class {

// 修改后
initWorkspaceInfo(), In = class {
```

### 5. 验证

#### 5.1 检查使用点
确保所有使用该类的地方仍正常工作：
```bash
grep "new RequestQueue(" extension.js
grep "extends RequestQueue" extension.js
```

#### 5.2 Lint 检查
```bash
# 无错误即为成功
read_lints ["extension/out/modules/request_queue.js", "extension/out/extension.js"]
```

## 注意事项

### ⚠️ 加载顺序
- **关键**：不要改变类的实例化时机
- 如果原代码在 `__esmModule` 中立即创建实例，需保持这个时机
- init 函数调用顺序必须保持一致

### 🔍 依赖处理
遇到有依赖的模块：
1. 先提取其依赖的模块
2. 再提取当前模块
3. 保持 init 调用链完整

### 📝 命名规范
- 文件名：小写下划线，如 `request_queue.js`
- 类名：保持原有命名（驼峰）
- 导出：使用对象解构 `{ ClassName }`

## 示例：RequestQueue 拆解记录

**原位置**：`extension.js` 1591-1629 行  
**新文件**：`modules/request_queue.js`  
**导入位置**：`extension.js` 第 72-74 行  
**删除的 init 调用**：4 处（行号：1598, 1732, 3371, 15637）  
**验证**：4 处 `new RequestQueue()` 调用正常，无 lint 错误

## 示例：LatestRequestLimiter 拆解记录

**原位置**：`extension.js` 1597-1623 行  
**新文件**：`modules/latest_request_limiter.js`  
**导入位置**：`extension.js` 第 75-77 行  
**删除的 init 调用**：1 处（行号：1701）  
**依赖**：`RequestQueue`, `Logger`（均已提取）  
**验证**：1 处 `new LatestRequestLimiter()` 调用正常，无 lint 错误

## 示例：Mutex 和 Semaphore 拆解记录

**原位置**：`extension.js` 1763-1934 行  
**新文件**：`modules/mutex.js`  
**导入位置**：`extension.js` 第 78-81 行  
**删除内容**：
- 辅助函数：`insertByPriority`, `formatDirectoryContent`
- 异步辅助：`R9e`, `x9e`  
- 常量：`k9e` (LOCK_CANCELED_ERROR)
- 类：`Semaphore`, `Mutex`  
**依赖**：无外部依赖  
**验证**：8 处 `new Mutex()` 调用正常，无 lint 错误

## 示例：CommandRegistry (initRepoMappingStore) 拆解记录

**原位置**：`extension.js` 14411-14416 行  
**新文件**：`modules/command_registry.js`  
**导入位置**：`extension.js` 第 82-84 行  
**删除的 init 调用**：5 处（行号：15048, 16915, 16925, 17114, 17780）  
**删除的模块**：`initRepoMappingStore`（直接删除，Map 实例在新文件中创建）和 `initRepoMappingHelper`（空模块，只调用 initRepoMappingStore）  
**依赖**：无外部依赖  
**说明**：原变量 `_H` 是一个 Map，用于存储 VSCode 命令注册的 disposable 对象。重命名为更语义化的 `commandRegistry`，仍然是一个 Map 实例，完全保持原有语义  
**验证**：`registerVscodeCommand` 函数正常使用 `commandRegistry.get()` 和 `commandRegistry.set()`，无 lint 错误

## 示例：FileSystemWatcher (initFileSystemWatcher) 拆解记录

**原位置**：`extension.js` 7793-7832 行  
**新文件**：`modules/file_system_watcher.js`  
**导入位置**：`extension.js` 第 109-111 行  
**删除的 init 调用**：2 处（行号：11881, 12990）  
**依赖**：无外部依赖，仅使用内置模块 `path_module`, `fs_promises_module`  
**说明**：原类名 `jW` 重命名为 `FileSystemWatcher`。该类用于跟踪目录中的项目，并在目录为空时自动清理。使用常量 `XM`（EMPTY_FUNCTION）和 `xKe`（FROZEN_EMPTY_SET）被内联为 `EMPTY_FUNCTION` 和 `FROZEN_EMPTY_SET`  
**验证**：无 lint 错误

## 示例：YoloArtifactManager (initYoloArtifactManager) 拆解记录

**原位置**：`extension.js` 7834-7941 行  
**新文件**：`modules/yolo_artifact_manager.js`  
**导入位置**：`extension.js` 第 112-115 行  
**删除的 init 调用**：3 处（行号：8235, 8872, 17200）  
**依赖**：
- `Logger`（已提取）
- `FileSystemWatcher`（已提取）
- `ensureDirectoryExists`（主文件全局函数，通过 `injectYoloArtifactManagerHelpers` 注入）
- 内置模块：`path_module`, `os_module`, `fs_promises_module`, `chokidar_module`  
**说明**：单例模式,用于监视和管理 Yolo 生成的构件文件。由于依赖主文件中的全局函数 `ensureDirectoryExists`，在主文件第 2228 行（定义 `ensureDirectoryExists` 后）调用 `injectYoloArtifactManagerHelpers({ ensureDirectoryExists })` 进行注入  
**验证**：6 处 `YoloArtifactManager.getInstance()` 调用正常，无 lint 错误

## 示例：GitHubTicketQueryBuilder 拆解记录

**原位置**：`extension.js` 5582-5648 行（包含辅助函数和类）  
**新文件**：`modules/github_ticket_query_builder.js`  
**导入位置**：`extension.js` 第 116-122 行  
**删除内容**：
- 枚举：`yo` (TICKET_SOURCE) - 重命名为 `TICKET_SOURCE`，值保持不变
- 辅助函数：`formatPathForDisplay`（格式化票据源显示名）
- 辅助函数：`formatTicketReferenceDisplay`（格式化票据引用显示）
- 辅助函数：`getGitHubIssueUrl`（获取 GitHub issue URL）
- 类：`GitHubTicketQueryBuilder`（构建 GitHub 票据查询的 JSON 格式）  
**依赖**：无外部依赖，所有依赖已内联到新模块  
**全局替换**：所有 `yo.GITHUB_TICKET` → `TICKET_SOURCE.GITHUB_TICKET`，`yo.JIRA_TICKET` → `TICKET_SOURCE.JIRA_TICKET`  
**验证**：
- 1 处 `new GitHubTicketQueryBuilder()` 调用正常
- 2 处 `formatTicketReferenceDisplay()` 调用正常
- 1 处 `formatPathForDisplay()` 调用正常
- 3 处 `TICKET_SOURCE.GITHUB_TICKET` 使用正常
- 无 lint 错误

## 示例：WorkerPoolManager (initStatusBar) 拆解记录

**原位置**：`extension.js` 2044-2078 行  
**新文件**：`modules/workerpool.js`（移动到已有的 WorkerPoolBase 所在文件）  
**导入位置**：`extension.js` 第 82-86 行  
**删除的 init 调用**：16 处（行号：2116, 3898, 4264, 5131, 5423, 6344, 7290, 8133, 9097, 9740, 12070, 13448, 14099, 14107, 14797, 15368）  
**依赖解耦**：
- 原依赖：`WorkspaceInfoManager.getInstance().getResourcesDir()` 
- 解耦后：在 `WorkerPoolBase` 中实现了独立的 `getResourcesDir()` 方法
- 实现：`path.join(path.dirname(path.dirname(__dirname)), "resources")`
  - `__dirname` = `extension/out/modules` (workerpool.js 所在目录)
  - `path.dirname(path.dirname(__dirname))` = `extension` (向上两级)
  - 最终路径：`extension/resources` ✅
- 不再依赖 `WorkspaceInfo`
**说明**：
- 将 `WorkerPoolManager` 从主文件移到 `modules/workerpool.js`，与基类 `WorkerPoolBase` 放在一起
- `WorkerPoolManager` 继承自 `WorkerPoolBase` (原 `ex` 类)
- 在基类中添加了 `getResourcesDir()` 方法，实现解耦
- `WorkerPoolManager` 的 `getWorkerPath()` 方法现在调用 `this.getResourcesDir()` 而不是 `WorkspaceInfoManager`
- ⚠️ **路径修正**：初始实现使用了 `path.dirname(__dirname)`（只向上一级），导致路径错误。已修正为 `path.dirname(path.dirname(__dirname))`（向上两级到 extension 目录）
**验证**：9 处 `WorkerPoolManager.exec()` 和其他静态方法调用正常，无 lint 错误，worker 文件路径正确

## 示例：LlmCacheHandler (initLlmCacheHandler) 拆解记录

**原位置**：`extension.js` 1573-1619 行  
**新文件**：`modules/llm_cache_handler.js`  
**导入位置**：`extension.js` 第 104-106 行  
**删除的 init 调用**：4 处（行号：3196, 13196, 13221, 14482）  
**依赖**：
- `SqliteService`, `SummaryCacheService`（已提取到 `modules/sqlite_service.js`）
- `WorkspaceInfoManager`, `DocumentManager`（从 `modules/workspace_info.js` 导入）
- `TraycerPath`（从 `modules/path_types.js` 导入）
- `Logger`（已提取）
**说明**：
- 单例模式，用于管理文件摘要的缓存存取
- 直接从相应的模块导入所需依赖，无需反向依赖主文件
- `getInstance()` 方法内部创建 `SqliteService` 和 `SummaryCacheService` 实例
- `getSummaryFromCache()` 和 `setSummaryToCache()` 方法使用 `DocumentManager` 和 `TraycerPath` 处理文件操作
**验证**：5 处 `LlmCacheHandler.getInstance()` 调用正常，无 lint 错误

## 工作流程总结

```
1. 搜索无依赖的 __esmModule
   ↓
2. 提取并创建独立文件
   ↓
3. 在导入区添加 require
   ↓
4. 删除旧定义和所有 init 调用
   ↓
5. 验证使用点和 lint
   ↓
6. 记录到此文档
```

---

**最后提醒**：每次只处理一个模块，确保每步都通过验证后再继续下一个。

