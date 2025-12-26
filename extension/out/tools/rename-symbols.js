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

// 解析作用域键的格式
function parseScopeKey(key) {
  // 格式1: "startLine-endLine" (行号范围)
  const rangeMatch = key.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    return {
      type: 'range',
      start: parseInt(rangeMatch[1]),
      end: parseInt(rangeMatch[2])
    };
  }
  
  // 格式2: "funcName@line" (函数名 + 起始行号)
  const funcLineMatch = key.match(/^(.+)@(\d+)$/);
  if (funcLineMatch) {
    return {
      type: 'funcAtLine',
      funcName: funcLineMatch[1],
      line: parseInt(funcLineMatch[2])
    };
  }
  
  // 格式3: "outerFunc>innerFunc@line" (嵌套函数路径)
  if (key.includes('>')) {
    const atIndex = key.lastIndexOf('@');
    if (atIndex > 0) {
      const path = key.substring(0, atIndex);
      const line = parseInt(key.substring(atIndex + 1));
      return {
        type: 'nestedPath',
        path: path.split('>'),
        line: line
      };
    }
    return {
      type: 'nestedPath',
      path: key.split('>'),
      line: null
    };
  }
  
  // 格式4: "funcName" (仅函数名)
  return {
    type: 'funcName',
    funcName: key
  };
}

// 检查节点是否在行号范围内
function isInLineRange(node, range) {
  if (!node.loc) return false;
  const startLine = node.loc.start.line;
  const endLine = node.loc.end.line;
  return startLine >= range.start && endLine <= range.end;
}

// 获取函数名称（考虑各种声明方式）
function getFunctionName(path) {
  const node = path.node;
  const parent = path.parent;
  
  if (t.isFunctionDeclaration(node) && node.id) {
    return node.id.name;
  }
  
  if (t.isFunctionExpression(node) && node.id) {
    return node.id.name;
  }
  
  // 变量声明: const funcName = function() {} 或 const funcName = () => {}
  if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
    return parent.id.name;
  }
  
  // 赋值表达式: funcName = () => {}
  if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) {
    return parent.left.name;
  }
  
  // 对象方法: { methodName() {} } 或 { methodName: function() {} }
  if (t.isObjectMethod(path.parent)) {
    const key = path.parent.key;
    if (t.isIdentifier(key)) {
      return key.name;
    }
  }
  
  if (t.isObjectProperty(parent) && t.isIdentifier(parent.key) && !parent.computed) {
    return parent.key.name;
  }
  
  // 类方法
  if (t.isClassMethod(parent) && t.isIdentifier(parent.key)) {
    return parent.key.name;
  }
  
  return null;
}

// 获取函数起始行号
function getFunctionStartLine(path) {
  return path.node.loc ? path.node.loc.start.line : null;
}

// 构建函数的嵌套路径
function buildFunctionPath(path) {
  const names = [];
  let current = path;
  
  while (current) {
    if (current.isFunction()) {
      const name = getFunctionName(current);
      if (name) {
        names.unshift(name);
      }
    }
    current = current.getFunctionParent();
  }
  
  return names;
}

// 匹配函数路径
function matchFunctionPath(actualPath, targetPath) {
  if (actualPath.length < targetPath.length) return false;
  
  // 从末尾开始匹配（最内层函数必须匹配）
  const offset = actualPath.length - targetPath.length;
  for (let i = 0; i < targetPath.length; i++) {
    if (actualPath[offset + i] !== targetPath[i]) {
      return false;
    }
  }
  return true;
}

// 收集所有匹配的函数作用域
const matchedScopes = [];

for (const [scopeKey, localMap] of Object.entries(localMappings)) {
  const scopeInfo = parseScopeKey(scopeKey);
  
  console.log(`   解析作用域键: ${scopeKey} (类型: ${scopeInfo.type})`);
  
  if (scopeInfo.type === 'range') {
    // 方式1: 按行号范围匹配
    traverse(ast, {
      Function(path) {
        if (isInLineRange(path.node, scopeInfo)) {
          const funcName = getFunctionName(path);
          const line = getFunctionStartLine(path);
          matchedScopes.push({
            path: path,
            localMap: localMap,
            description: `行号范围 ${scopeKey}`,
            funcName: funcName || '(匿名)',
            line: line
          });
          path.skip(); // 避免重复处理嵌套函数
        }
      }
    });
  } else if (scopeInfo.type === 'funcAtLine') {
    // 方式2: 按函数名 + 行号精确匹配
    let found = false;
    traverse(ast, {
      Function(path) {
        const funcName = getFunctionName(path);
        const line = getFunctionStartLine(path);
        
        if (funcName === scopeInfo.funcName && line === scopeInfo.line) {
          matchedScopes.push({
            path: path,
            localMap: localMap,
            description: `函数 ${scopeInfo.funcName} @ 行${scopeInfo.line}`,
            funcName: funcName,
            line: line
          });
          found = true;
          path.skip();
        }
      }
    });
    
    if (!found) {
      console.log(`   ⚠️  警告: 未找到函数 ${scopeInfo.funcName} @ 行${scopeInfo.line}`);
    }
  } else if (scopeInfo.type === 'nestedPath') {
    // 方式3: 按嵌套函数路径匹配
    traverse(ast, {
      Function(path) {
        const actualPath = buildFunctionPath(path);
        const line = getFunctionStartLine(path);
        
        if (matchFunctionPath(actualPath, scopeInfo.path)) {
          // 如果指定了行号，还要匹配行号
          if (scopeInfo.line === null || line === scopeInfo.line) {
            matchedScopes.push({
              path: path,
              localMap: localMap,
              description: `嵌套路径 ${scopeInfo.path.join('>')}${scopeInfo.line ? ` @ 行${scopeInfo.line}` : ''}`,
              funcName: actualPath[actualPath.length - 1] || '(匿名)',
              line: line
            });
            path.skip();
          }
        }
      }
    });
  } else if (scopeInfo.type === 'funcName') {
    // 方式4: 仅按函数名匹配（如果唯一）
    const matches = [];
    traverse(ast, {
      Function(path) {
        const funcName = getFunctionName(path);
        const line = getFunctionStartLine(path);
        
        if (funcName === scopeInfo.funcName) {
          matches.push({ path, line });
        }
      }
    });
    
    if (matches.length === 0) {
      console.log(`   ⚠️  警告: 未找到函数 ${scopeInfo.funcName}`);
    } else if (matches.length === 1) {
      matchedScopes.push({
        path: matches[0].path,
        localMap: localMap,
        description: `函数 ${scopeInfo.funcName}`,
        funcName: scopeInfo.funcName,
        line: matches[0].line
      });
    } else {
      console.log(`   ⚠️  警告: 找到 ${matches.length} 个同名函数 ${scopeInfo.funcName}，需要指定行号或路径:`);
      matches.forEach(m => {
        console.log(`       - 行${m.line}`);
      });
      console.log(`   建议使用 "${scopeInfo.funcName}@${matches[0].line}" 格式精确指定`);
    }
  }
}

console.log(`   匹配到 ${matchedScopes.length} 个作用域需要处理\n`);

// 处理所有匹配的作用域
for (const scope of matchedScopes) {
  console.log(`   处理 ${scope.description}...`);
  renameLocalsInScope(scope.path, scope.localMap);
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

