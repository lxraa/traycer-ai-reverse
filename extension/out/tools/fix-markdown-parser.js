const fs = require('fs');
const path = require('path');

// 配置
const SOURCE_FILE = path.join(__dirname, '../extension.js');
const MODULE_FILE = path.join(__dirname, '../modules/markdown-parser.js');
const BACKUP_FILE = path.join(__dirname, '../extension.js.backup-markdown2');

console.log('修复 markdown-parser 模块依赖...');

// 1. 备份当前文件
console.log('1. 备份文件...');
fs.copyFileSync(SOURCE_FILE, BACKUP_FILE);

// 2. 读取文件
const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf-8');
const sourceLines = sourceContent.split('\n');

// 3. 找到缺失的依赖函数
const missingFunctions = [
  'codePointToString',
  'isValidUnicodeCodePoint',
  'decodeHtmlEntities',
  'resolveHtmlEntity'
];

console.log('2. 查找缺失的依赖函数...');
const functionCode = {};

for (const funcName of missingFunctions) {
  for (let i = 0; i < sourceLines.length; i++) {
    if (sourceLines[i].includes(`function ${funcName}(`)) {
      // 找到函数开始
      let startLine = i;
      let braceCount = 0;
      let endLine = i;
      let foundFirstBrace = false;
      
      for (let j = i; j < sourceLines.length; j++) {
        const line = sourceLines[j];
        for (let char of line) {
          if (char === '{') {
            braceCount++;
            foundFirstBrace = true;
          } else if (char === '}') {
            braceCount--;
            if (foundFirstBrace && braceCount === 0) {
              endLine = j;
              break;
            }
          }
        }
        if (foundFirstBrace && braceCount === 0) break;
      }
      
      functionCode[funcName] = sourceLines.slice(startLine, endLine + 1).join('\n');
      console.log(`   找到 ${funcName}: 第 ${startLine + 1} - ${endLine + 1} 行`);
      break;
    }
  }
}

// 4. 查找常量定义位置
console.log('3. 查找常量定义...');
let constantsCode = '';
for (let i = 0; i < sourceLines.length; i++) {
  if (sourceLines[i].includes('var Wc, HBe;')) {
    constantsCode = sourceLines[i];
    console.log(`   找到 Wc, HBe 常量声明: 第 ${i + 1} 行`);
    break;
  }
}

// 5. 读取现有的 markdown-parser 模块
console.log('4. 更新 markdown-parser.js...');
let moduleContent = fs.readFileSync(MODULE_FILE, 'utf-8');

// 在常量声明后添加新的常量
const newConstants = `
var Wc, HBe;
`;

// 在函数定义之前插入缺失的依赖函数
const dependencyFunctions = `
// 依赖的辅助函数
${functionCode['isValidUnicodeCodePoint'] || ''}

${functionCode['codePointToString'] || ''}

${functionCode['resolveHtmlEntity'] || ''}

// 外部依赖函数
var decodeHtmlEntities;
`;

// 更新模块内容
const lines = moduleContent.split('\n');
let insertIndex = -1;

// 找到常量声明行
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('var ZBe, Ere')) {
    insertIndex = i + 1;
    break;
  }
}

if (insertIndex !== -1) {
  // 插入新常量和依赖函数
  lines.splice(insertIndex, 0, newConstants, dependencyFunctions);
  
  // 更新导出
  const exportStart = lines.findIndex(l => l.includes('module.exports'));
  if (exportStart !== -1) {
    lines[exportStart] = `// 导出主要函数
module.exports = {
  parseMarkdownToDoc,
  parseMarkdownToDocNodes,
  parseMarkdownTokensToNodes,
  createSimpleDocNode,
  createTextNode,
  unescapeMarkdown,
  escapeHtml,
  isValidUnicodeCodePoint,
  codePointToString
};`;
  }
  
  moduleContent = lines.join('\n');
  fs.writeFileSync(MODULE_FILE, moduleContent, 'utf-8');
  console.log('   markdown-parser.js 已更新');
}

// 6. 更新 extension.js 中的导入
console.log('5. 更新 extension.js 中的导入...');
for (let i = 0; i < sourceLines.length; i++) {
  if (sourceLines[i].includes('// Markdown parser functions moved to separate module')) {
    // 找到导入语句的结束
    let endImport = i;
    for (let j = i; j < sourceLines.length; j++) {
      if (sourceLines[j].includes('} = require(')) {
        endImport = j;
        break;
      }
    }
    
    // 替换导入语句
    const newImport = `
// Markdown parser functions moved to separate module
const {
  parseMarkdownToDoc,
  parseMarkdownToDocNodes,
  createSimpleDocNode,
  createTextNode,
  unescapeMarkdown,
  escapeHtml,
  isValidUnicodeCodePoint,
  codePointToString
} = require('./modules/markdown-parser');
`;
    
    sourceLines.splice(i, endImport - i + 1, newImport);
    break;
  }
}

// 7. 需要保留 decodeHtmlEntities 和 resolveHtmlEntity（它们在其他地方可能被使用）
// 检查这些函数是否在其他地方被调用
console.log('6. 检查函数使用情况...');
const fullContent = sourceLines.join('\n');
const checkFunctions = ['decodeHtmlEntities', 'resolveHtmlEntity'];

for (const func of checkFunctions) {
  const regex = new RegExp(`\\b${func}\\(`, 'g');
  const matches = fullContent.match(regex);
  if (matches && matches.length > 2) {
    console.log(`   ⚠ ${func} 在其他地方被使用 (${matches.length} 次)，保留在原文件中`);
  }
}

// 8. 写回文件
fs.writeFileSync(SOURCE_FILE, sourceLines.join('\n'), 'utf-8');
console.log('   extension.js 已更新');

console.log('\n完成！');
console.log('='.repeat(50));
console.log('文件列表:');
console.log(`  - 更新的模块: ${MODULE_FILE}`);
console.log(`  - 更新的主文件: ${SOURCE_FILE}`);
console.log(`  - 备份文件: ${BACKUP_FILE}`);

