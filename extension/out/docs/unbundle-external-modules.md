# 外部模块解绑操作文档

## 目的
将打包代码中的 `__commonJS` + `__toESM` 包装形式简化为顶部直接 `require()`，提高代码可读性和维护性。

## 操作步骤

### 1. 添加顶部导入
在导入区添加：
```javascript
const xxx_module = require("package-name");
```

### 2. 删除 `__commonJS` 包装定义
找到并替换为注释：`/* [unbundle] package-name 已移至顶部导入区 */`

**注意 `var` 链语法**：
- 若删除的是链中间元素，保留逗号分隔
- 若删除的是链末尾元素（原来以 `);` 结尾），需调整分号位置
- 若链断裂导致语法错误，可添加占位变量：`_unused_xxx_placeholder_;`

### 3. 删除初始化调用
删除 `initXxx` 函数中的赋值：
```javascript
xxxModule = __toESM(xxxJsModule())  // 删除
```

### 4. 全局替换引用
- `xxxModule.yyy` → `xxx_module.yyy`
- `xxxModule.default.yyy` → `xxx_module.yyy`（CommonJS 模块无需 `.default`）

### 5. 验证
```powershell
node --check extension.js
```

## 已处理模块清单

| 包名 | 变量名 |
|------|--------|
| @grpc/grpc-js | grpc_module |
| @grpc/proto-loader | proto_loader_module |
| diff-match-patch | diff_match_patch_module |
| diff3 | diff3_module |
| retry | retry_module |
| ignore | ignore_module |
| sqlite3 | sqlite3_module |
| workerpool | workerpool_module |
| lru_map | lru_map_module |
| posthog-js-lite | posthog_module |
| lodash | lodash_module |
| ajv | ajv_module |
| gray-matter | gray_matter_module |
| google-auth-library | google_auth_module |
| fuzzysort | fuzzysort_module |
| web-tree-sitter | tree_sitter_module |
| semver | semver_module |
| markdown-it | markdown_it_module |
| @vscode/ripgrep | vscode_ripgrep_module |
| vscode | vscode_module |
| @sentry/browser | sentry_browser_module |
| @prisma/client/runtime/library | prisma_runtime_module |
| chokidar | chokidar_module |
| path | path_module |
| fs/promises | fs_promises_module |
| os | os_module |
| child_process | child_process_module |
| util | util_module |
| fs | fs_module |
| node:crypto | crypto_module |
| ./modules/config.js | config_module |

## 注意事项

1. **同一模块可能有多个变量名**（如 `grpcModule` 和 `grpcImport`），需全部处理
2. **`.default` 引用**：CommonJS 模块直接导出，无需 `.default`
3. **语法检查**：每次修改后运行 `node --check` 验证
4. **`var` 链复杂**：删除元素时注意逗号/分号，必要时用占位变量

## 命名规范
- 模块变量名：`包名_module`
- 用下划线替代 `-`、`@`、`/` 等特殊字符

## 自动化工具

### unify-module-aliases.js

统一模块别名工具，处理 `alias = xxx_module; use(alias)` 模式，将所有别名引用替换为原始模块名。

**用法**：
```powershell
node tools/unify-module-aliases.js [输入文件] [输出文件]
# 默认: extension.js → extension.unified.js
```

**处理的模式**：
- `var Zp = path_module` → 删除声明，替换所有 `Zp` 为 `path_module`
- `Ute = diff_match_patch_module` → 删除赋值，替换所有 `Ute` 为 `diff_match_patch_module`
- 逗号表达式中的赋值 `(a = 1, alias = xxx_module, b = 2)` → 自动移除中间的别名赋值

**注意**：
- 工具会自动处理作用域
- 只处理 `xxx_module` 模式的模块变量（小写字母+下划线+module 后缀）
- 运行后务必执行 `node --check` 验证语法

