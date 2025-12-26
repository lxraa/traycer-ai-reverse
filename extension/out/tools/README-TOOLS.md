# 模块依赖分析工具集

这是一套用于分析JavaScript/TypeScript模块依赖关系和检测循环依赖的工具集。

## 🔧 工具列表

### 1. analyze-deps.js - 模块依赖分析
分析代码中的模块定义和依赖关系。

**使用方法**:
```bash
node analyze-deps.js [输入文件] [输出文件] [--commonjs=名称] [--esm=名称]
```

**示例**:
```bash
# 使用默认闭包名称 (k, T)
node analyze-deps.js ../extension.js

# 指定闭包名称
node analyze-deps.js ../extension.js --commonjs=__commonJS --esm=__esmModule

# 指定输出文件
node analyze-deps.js ../extension.js deps.json --commonjs=__commonJS --esm=__esmModule
```

**输出**:
- JSON文件包含完整的模块依赖关系数据
- 控制台显示统计摘要

---

### 2. detect-cycles.js - 循环依赖详细检测
检测所有循环依赖并输出详细信息。

**使用方法**:
```bash
node detect-cycles.js [deps.json文件路径]
```

**示例**:
```bash
node detect-cycles.js extension.js.12-deps.json
```

**输出**:
- 所有循环依赖的完整路径
- 每个循环的复杂度分析
- 每个模块的详细信息
- 参与循环最多的模块排行

---

### 3. cycle-report.js - 循环依赖简洁报告
生成简洁的循环依赖报告，便于快速了解情况。

**使用方法**:
```bash
node cycle-report.js [deps.json文件路径]
```

**示例**:
```bash
node cycle-report.js extension.js.12-deps.json
```

**输出**:
- 循环依赖统计摘要
- 最短循环列表（优先解决）
- 高频循环模块
- 优化建议
- JSON格式的详细报告文件

---

### 4. cycle-visualizer.js - 可视化图表生成
生成Graphviz DOT格式的循环依赖可视化图表。

**使用方法**:
```bash
node cycle-visualizer.js [deps.json文件路径]
```

**示例**:
```bash
node cycle-visualizer.js extension.js.12-deps.json
```

**输出**:
- `*-short-cycles.dot` - 短循环（长度2）关系图
- `*-top-modules.dot` - 高频模块依赖图
- `*-complex-cycle-*.dot` - 复杂循环示例图

**渲染DOT文件**:
```bash
# 需要安装 Graphviz
dot -Tpng short-cycles.dot -o short-cycles.png
dot -Tsvg top-modules.dot -o top-modules.svg

# 或使用在线工具
# https://dreampuf.github.io/GraphvizOnline/
```

---

## 📋 完整工作流程

### 步骤1: 分析模块依赖
```bash
node analyze-deps.js ../extension.js.12 --commonjs=__commonJS --esm=__esmModule
```

这会生成 `extension.js.12-deps.json` 文件。

### 步骤2: 生成简洁报告
```bash
node cycle-report.js extension.js.12-deps.json
```

快速了解循环依赖情况。

### 步骤3: 查看详细信息（可选）
```bash
node detect-cycles.js extension.js.12-deps.json > cycle-details.txt
```

获取完整的循环依赖详细信息。

### 步骤4: 生成可视化图表
```bash
node cycle-visualizer.js extension.js.12-deps.json
```

生成可在Graphviz中查看的图表文件。

---

## 📊 输出文件说明

| 文件名 | 说明 |
|--------|------|
| `*-deps.json` | 完整的模块依赖关系数据 |
| `*-cycle-report.json` | 循环依赖汇总报告（JSON格式） |
| `*-short-cycles.dot` | 短循环可视化图（DOT格式） |
| `*-top-modules.dot` | 高频模块关系图（DOT格式） |
| `*-complex-cycle-*.dot` | 复杂循环示例（DOT格式） |

---

## 🎯 如何解读结果

### 循环长度
- **长度 2**: 两个模块相互依赖，最容易解决
- **长度 3-5**: 中等复杂度，需要仔细分析
- **长度 6+**: 高复杂度，可能需要架构重构

### 参与循环数
- **1-5个**: 影响较小
- **6-20个**: 中等影响，建议优化
- **21+个**: 严重问题，必须重构

### 优先级排序
1. **高优先级**: 长度为2的循环（快速解决）
2. **中优先级**: 参与20+个循环的模块
3. **低优先级**: 长度大于10的复杂循环

---

## 💡 常见解决方案

### 1. 延迟加载
```javascript
// 问题
import { funcB } from './moduleB';

// 解决
export function funcA() {
  const { funcB } = require('./moduleB');
  return funcB();
}
```

### 2. 依赖注入
```javascript
// 问题
class A {
  constructor() {
    this.b = new B();
  }
}

// 解决
class A {
  constructor(b) {
    this.b = b;
  }
}
```

### 3. 事件系统
```javascript
// 问题：模块间相互调用
// 解决：使用事件发射器
eventBus.emit('event', data);
eventBus.on('event', handler);
```

### 4. 注册表模式
```javascript
// 适用于：多个实现类依赖管理器
const registry = new Map();
export function register(key, impl) {
  registry.set(key, impl);
}
```

### 5. 接口分离
```typescript
// 提取接口，依赖倒置
interface IService {
  method(): void;
}

class Consumer {
  constructor(private service: IService) {}
}
```

---

## 🔍 技术原理

### 依赖分析算法
1. 使用 @babel/parser 解析AST
2. 遍历所有模块定义（闭包调用）
3. 分析每个模块内部的标识符引用
4. 构建模块依赖图

### 循环检测算法
- 使用DFS（深度优先搜索）
- 维护递归栈检测回边
- 规范化循环路径去重

### 复杂度分析
- 内部依赖：循环内模块间的依赖数
- 外部依赖：循环依赖外部模块数
- 被外部依赖：外部模块依赖循环的数量

---

## 🛠 依赖项

这些工具需要以下npm包：

```json
{
  "@babel/parser": "^7.x",
  "@babel/traverse": "^7.x",
  "@babel/generator": "^7.x",
  "@babel/types": "^7.x"
}
```

---

## 📝 示例输出

### analyze-deps.js 输出示例
```
📦 模块依赖分析工具
📂 输入文件: extension.js
📊 文件大小: 0.97 MB
   📦 发现 201 个模块定义

   模块统计:
      总模块数: 201
      活跃模块: 201
      CommonJS 模块: 7
      ESM 模块: 194
```

### cycle-report.js 输出示例
```
⚠️  发现 89 个循环依赖

循环长度分布:
   长度 2: 15 个
   长度 3: 5 个
   ...

🔥 最短的循环（长度为2，最容易解决）
1. initSearchUtils ⇄ initWorkspaceInfo
2. initPathModule ⇄ initWorkspaceInfo
...

🎯 参与循环最多的模块
1. initIDEAgentManager (54个循环)
2. initSearchConfig (49个循环)
...
```

---

## 📚 更多资源

- [Graphviz 官网](https://graphviz.org/)
- [Graphviz Online](https://dreampuf.github.io/GraphvizOnline/)
- [循环依赖最佳实践](https://stackoverflow.com/questions/10869636/how-to-deal-with-cyclic-dependencies-in-node-js)

---

## ⚠️ 注意事项

1. **大文件处理**: 对于超大文件（>5MB），分析可能需要较长时间
2. **闭包名称**: 必须正确指定代码中使用的闭包函数名
3. **死代码**: 工具会自动识别并排除死代码模块
4. **内存使用**: 生成详细报告时可能需要较多内存

---

## 🐛 故障排除

### 问题：未找到模块
**原因**: 闭包名称不匹配  
**解决**: 检查代码中的实际闭包函数名，使用 `--commonjs` 和 `--esm` 参数指定

### 问题：输出为空
**原因**: 文件路径错误或文件格式不支持  
**解决**: 确认文件路径正确，文件是有效的JavaScript代码

### 问题：循环数量过多
**原因**: 代码架构存在严重的循环依赖问题  
**解决**: 优先解决短循环和高频模块，逐步重构

---

**版本**: v1.0  
**最后更新**: 2024-12-26

