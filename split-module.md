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

