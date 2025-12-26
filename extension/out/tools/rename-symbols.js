/**
 * rename-symbols.js - AST 符号重命名通用工具
 * 
 * 功能：
 * - 全局变量/函数重命名（全文件作用域）
 * - 局部变量/参数重命名（函数作用域内，通过精确上下文定位）
 * - 自动备份原文件
 * 
 * 使用方式：
 *   node tools/rename-symbols.js <input.js> <mappings.json>
 *   node tools/rename-symbols.js extension.js mappings/sentry-logger.json
 *   node tools/rename-symbols.js extension.js mappings/xxx.json --no-backup
 * 
 * 映射文件格式 (mappings.json)：
 * {
 *   "globals": {
 *     "oldName": "newName",
 *     "cm": "getSentryCarrier"
 *   },
 *   "locals": {
 *     // 方式1: 行号范围 + 可选的父函数上下文
 *     "34-37": {
 *       "_0xedab9e": "carrier"
 *     },
 *     // 方式2: 函数名 + 起始行号（精确定位）
 *     "getSentryCarrier@34": {
 *       "_0xedab9e": "carrier"
 *     },
 *     // 方式3: 仅函数名（如果唯一）
 *     "getSentryCarrier": {
 *       "_0xedab9e": "carrier"
 *     },
 *     // 方式4: 函数路径（嵌套函数）
 *     "outerFunc>innerFunc@120": {
 *       "_0x123": "localVar"
 *     }
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// 解析命令行参数
const args = process.argv.slice(2);
let inputFile = null;
let mappingsFile = null;
let outputFile = null;
let noBackup = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--no-backup') {
    noBackup = true;
  } else if (args[i] === '-o' || args[i] === '--output') {
    outputFile = args[++i];
  } else if (!inputFile) {
    inputFile = args[i];
  } else if (!mappingsFile) {
    mappingsFile = args[i];
  }
}

// 显示帮助
if (!inputFile || !mappingsFile) {
  console.log(`
🔧 rename-symbols.js - AST 符号重命名通用工具

使用方式:
  node tools/rename-symbols.js <input.js> <mappings.json> [options]

参数:
  <input.js>       输入 JS 文件路径
  <mappings.json>  符号映射 JSON 文件路径
  -o, --output     输出文件路径（默认覆盖原文件）
  --no-backup      不创建备份文件（默认会创建 .bak.js）

示例:
  node tools/rename-symbols.js out/extension.js mappings/all-symbols.json
  node tools/rename-symbols.js extension.clear.js mappings/all-symbols.json -o extension.sym.js
  node tools/rename-symbols.js out/extension.js mappings/xxx.json --no-backup

映射文件格式:
{
  "globals": { "oldName": "newName" },
  "locals": {
    "34-37": { "_0x123": "varName" },           // 按行号范围
    "funcName": { "_0x456": "paramName" },      // 按函数名（唯一）
    "funcName@120": { "_0x789": "local" },      // 按函数名+行号（精确）
    "outer>inner@200": { "_0xabc": "nested" }   // 嵌套函数路径
  }
}
`);
  process.exit(1);
}

// 解析路径
inputFile = path.resolve(inputFile);
mappingsFile = path.resolve(mappingsFile);

// 检查文件存在
if (!fs.existsSync(inputFile)) {
  console.error(`❌ 错误: 输入文件不存在: ${inputFile}`);
  process.exit(1);
}
if (!fs.existsSync(mappingsFile)) {
  console.error(`❌ 错误: 映射文件不存在: ${mappingsFile}`);
  process.exit(1);
}

// 读取映射
const mappings = JSON.parse(fs.readFileSync(mappingsFile, 'utf-8'));

// 如果没有指定输出文件，覆盖原文件
if (!outputFile) {
  outputFile = inputFile;
}
outputFile = path.resolve(outputFile);

console.log('🔧 rename-symbols.js - AST 符号重命名\n');
console.log(`📂 输入文件: ${inputFile}`);
console.log(`📄 映射文件: ${mappingsFile}`);
console.log(`📄 输出文件: ${outputFile}`);

// 备份原文件
if (!noBackup) {
  const backupFile = inputFile.replace(/\.js$/, '.bak.js');
  fs.copyFileSync(inputFile, backupFile);
  console.log(`💾 备份文件: ${backupFile}`);
}

// 读取文件
const code = fs.readFileSync(inputFile, 'utf-8');
console.log(`📊 文件大小: ${(code.length / 1024 / 1024).toFixed(2)} MB\n`);

// 解析 AST
console.log('🔧 解析 AST...');
const ast = parser.parse(code, {
  sourceType: 'script',
  plugins: ['jsx'],
  errorRecovery: true,
});
console.log('✅ AST 解析成功\n');

// 统计
const stats = {
  globalsRenamed: 0,
  localsRenamed: 0,
  referencesUpdated: 0,
  notFound: [],  // 未找到的符号
};

// 全局重命名映射
const globalMappings = mappings.globals || {};
// 局部重命名映射
const localMappings = mappings.locals || {};

// ============== 阶段 1: 全局符号重命名 ==============
console.log('🔄 阶段 1: 全局符号重命名...');

// 收集需要重命名的全局符号的绑定
const globalBindings = new Map();

// 第一遍：收集全局声明
traverse(ast, {
  // 函数声明
  FunctionDeclaration(path) {
    if (path.parent.type !== 'Program') return;
    const name = path.node.id?.name;
    if (name && globalMappings[name]) {
      globalBindings.set(name, {
        newName: globalMappings[name],
        binding: path.scope.getBinding(name),
      });
    }
  },
  // 变量声明
  VariableDeclarator(path) {
    // 只处理顶层变量
    if (path.parentPath.parent.type !== 'Program') return;
    const name = path.node.id?.name;
    if (name && globalMappings[name]) {
      globalBindings.set(name, {
        newName: globalMappings[name],
        binding: path.scope.getBinding(name),
      });
    }
  },
});

console.log(`   找到 ${globalBindings.size} 个全局符号需要重命名`);

// 检查未找到的全局符号（在重命名之前检测）
const globalKeys = Object.keys(globalMappings);
const foundGlobals = new Set();

// 收集所有存在的符号
traverse(ast, {
  Identifier(path) {
    const name = path.node.name;
    if (globalMappings[name]) {
      foundGlobals.add(name);
    }
  },
});

// 记录未找到的符号
for (const key of globalKeys) {
  if (!foundGlobals.has(key)) {
    stats.notFound.push(key);
  }
}

console.log(`   实际匹配: ${foundGlobals.size} / ${globalKeys.length} 个符号`);
if (stats.notFound.length > 0) {
  console.log(`   ⚠️  未找到: ${stats.notFound.length} 个符号`);
}

// 第二遍：重命名全局符号
traverse(ast, {
  Identifier(path) {
    const name = path.node.name;
    if (typeof name !== 'string') return;
    if (!globalMappings[name]) return;
    
    const newName = globalMappings[name];
    if (typeof newName !== 'string') return;
    
    const parent = path.parent;
    
    // 跳过对象属性键（非计算属性）
    if (t.isObjectProperty(parent) && parent.key === path.node && !parent.computed) return;
    // 跳过成员表达式的属性（非计算属性）
    if (t.isMemberExpression(parent) && parent.property === path.node && !parent.computed) return;
    
    // 检查是否是全局作用域的引用
    const binding = path.scope.getBinding(name);
    
    // 如果没有绑定（可能是全局变量）或者绑定在 Program 作用域
    if (!binding || binding.scope.block.type === 'Program') {
      path.node.name = newName;
      stats.referencesUpdated++;
    }
  },
});

stats.globalsRenamed = globalBindings.size;
console.log(`   重命名: ${stats.globalsRenamed} 个全局符号`);

// ============== 阶段 2: 局部符号重命名 ==============
console.log('\n🔄 阶段 2: 局部符号重命名...');

// 解析行号范围
function parseLineRange(key) {
  const match = key.match(/^(\d+)-(\d+)$/);
  if (match) {
    return { start: parseInt(match[1]), end: parseInt(match[2]) };
  }
  return null;
}

// 检查节点是否在行号范围内
function isInLineRange(node, range) {
  if (!node.loc) return false;
  const startLine = node.loc.start.line;
  const endLine = node.loc.end.line;
  return startLine >= range.start && endLine <= range.end;
}

// 处理每个局部映射
for (const [scopeKey, localMap] of Object.entries(localMappings)) {
  const lineRange = parseLineRange(scopeKey);
  
  if (lineRange) {
    // 按行号范围匹配
    console.log(`   处理行号范围 ${scopeKey}...`);
    
    traverse(ast, {
      Function(path) {
        if (!isInLineRange(path.node, lineRange)) return;
        
        // 重命名这个函数作用域内的局部变量
        renameLocalsInScope(path, localMap);
      },
    });
  } else {
    // 按函数名匹配（使用重命名后的名称）
    console.log(`   处理函数 ${scopeKey}...`);
    
    traverse(ast, {
      Function(path) {
        let funcName = null;
        if (t.isFunctionDeclaration(path.node) && path.node.id) {
          funcName = path.node.id.name;
        } else if (t.isFunctionExpression(path.node) && path.node.id) {
          funcName = path.node.id.name;
        } else if (t.isArrowFunctionExpression(path.node) || t.isFunctionExpression(path.node)) {
          // 箭头函数或函数表达式可能是变量赋值或赋值表达式
          if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
            funcName = path.parent.id.name;
          } else if (t.isAssignmentExpression(path.parent) && t.isIdentifier(path.parent.left)) {
            // 赋值表达式: funcName = () => {...}
            funcName = path.parent.left.name;
          } else if (t.isCallExpression(path.parent)) {
            // 作为函数参数: __esmModule(() => {...})
            // 检查外层是否是赋值表达式
            const grandParent = path.parentPath.parent;
            if (t.isAssignmentExpression(grandParent) && t.isIdentifier(grandParent.left)) {
              funcName = grandParent.left.name;
            } else if (t.isVariableDeclarator(grandParent) && t.isIdentifier(grandParent.id)) {
              funcName = grandParent.id.name;
            }
          }
        }
        
        if (funcName === scopeKey) {
          renameLocalsInScope(path, localMap);
        }
      },
    });
  }
}

// 在函数作用域内重命名局部变量
function renameLocalsInScope(funcPath, localMap) {
  const scope = funcPath.scope;
  let renamed = 0;
  
  // 遍历这个作用域内的所有标识符（包括嵌套函数中的）
  funcPath.traverse({
    Identifier(path) {
      const name = path.node.name;
      if (typeof name !== 'string') return;
      if (!localMap[name]) return;
      
      const newName = localMap[name];
      if (typeof newName !== 'string') return;
      
      const parent = path.parent;
      
      // 跳过对象属性键（非计算属性）
      if (t.isObjectProperty(parent) && parent.key === path.node && !parent.computed) return;
      // 跳过成员表达式的属性（非计算属性）
      if (t.isMemberExpression(parent) && parent.property === path.node && !parent.computed) return;
      
      // 检查绑定是否属于当前函数作用域或其子作用域（包括嵌套函数）
      const binding = path.scope.getBinding(name);
      if (binding) {
        // 确保绑定是在当前函数作用域内定义的（包括嵌套函数作用域）
        let bindingScope = binding.scope;
        let isLocal = false;
        
        // 向上遍历作用域链，检查绑定是否在目标函数作用域内（包括嵌套）
        while (bindingScope) {
          if (bindingScope === scope) {
            isLocal = true;
            break;
          }
          // 如果到达 Program 作用域，说明不是局部变量
          if (bindingScope.block.type === 'Program') break;
          bindingScope = bindingScope.parent;
        }
        
        // 如果上面的检查失败，再检查绑定作用域是否是目标函数的子作用域
        if (!isLocal) {
          bindingScope = binding.scope;
          // 检查绑定作用域是否嵌套在目标函数内
          let currentPath = binding.path;
          while (currentPath) {
            if (currentPath.scope === scope) {
              isLocal = true;
              break;
            }
            currentPath = currentPath.parentPath;
          }
        }
        
        if (isLocal) {
          path.node.name = newName;
          renamed++;
          stats.referencesUpdated++;
        }
      }
    },
  });
  
  stats.localsRenamed += Object.keys(localMap).length;
  console.log(`     重命名 ${renamed} 处引用`);
}

// ============== 生成代码 ==============
console.log('\n💾 生成输出代码...');

const output = generate(ast, {
  retainLines: false,
  compact: false,
  comments: true,
});

// 保存结果
fs.writeFileSync(outputFile, output.code, 'utf-8');

console.log('\n' + '═'.repeat(60));
console.log('✅ 处理完成!');
console.log('═'.repeat(60));
console.log(`
📊 处理统计:
   全局符号重命名: ${stats.globalsRenamed} 个
   局部作用域处理: ${Object.keys(localMappings).length} 个
   引用更新总数: ${stats.referencesUpdated} 处
   未找到符号数: ${stats.notFound.length} 个
`);

// 输出未找到的符号列表
if (stats.notFound.length > 0) {
  console.log('⚠️  未找到的符号列表:');
  for (const sym of stats.notFound) {
    console.log(`   - ${sym} → ${globalMappings[sym]}`);
  }
  console.log('');
}

