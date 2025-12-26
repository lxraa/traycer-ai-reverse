const fs = require('fs');
const path = require('path');

// 配置
const SOURCE_FILE = path.join(__dirname, '../extension.js');
const TARGET_FILE = path.join(__dirname, '../modules/markdown-parser.js');
const BACKUP_FILE = path.join(__dirname, '../extension.js.backup-markdown');

// 需要提取的函数列表
const FUNCTIONS_TO_EXTRACT = [
  'unescapeBackslash',
  'unescapeMarkdown',
  'getHtmlEntityChar',
  'escapeHtml',
  'escapeMarkdownChars',
  'isSpaceOrTab',
  'isWhitespaceChar',
  'isPunctuationOrSymbol',
  'isAsciiPunctuation',
  'normalizeUnicodeCase',
  'findMatchingBracket',
  'parseLinkDestination',
  'parseLinkTitle',
  'createSimpleDocNode',
  'createTextNode',
  'parseMarkdownToDoc',
  'parseMarkdownToDocNodes',
  'parseMarkdownTokensToNodes'
];

// 需要提取的变量声明
const DEAD_CODE_LINES = [
  'var ZBe, Ere, rqe, nqe, aqe, oqe, uqe, lqe, pqe;',
  'var /* [dead-code] Pre removed */',
  'Bq = {};',
  '__export(Bq, {'
];

console.log('开始提取 markdown 解析器...');

// 1. 备份原文件
console.log('1. 备份原文件...');
fs.copyFileSync(SOURCE_FILE, BACKUP_FILE);
console.log(`   备份完成: ${BACKUP_FILE}`);

// 2. 读取源文件
console.log('2. 读取源文件...');
const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf-8');
const lines = sourceContent.split('\n');

// 3. 找到需要提取的代码范围
console.log('3. 分析代码范围...');

// 查找起始行（从 unescapeBackslash 开始）
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function unescapeBackslash(str)')) {
    startLine = i;
    break;
  }
}

// 查找结束行（parseMarkdownTokensToNodes 函数结束）
let endLine = -1;
for (let i = startLine; i < lines.length; i++) {
  if (lines[i].trim() === '}' && i > startLine + 300) {
    // 检查下一行是否是新的类或函数定义
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.startsWith('var ') && nextLine.includes('class')) {
        endLine = i;
        break;
      }
    }
  }
}

console.log(`   找到代码范围: 第 ${startLine + 1} 行到第 ${endLine + 1} 行`);

// 4. 提取代码
console.log('4. 提取代码...');
const extractedLines = lines.slice(startLine, endLine + 1);

// 5. 查找需要的常量定义（在提取范围之前）
let constantsLine = -1;
for (let i = startLine - 1; i >= 0; i--) {
  if (lines[i].includes('var ZBe, Ere, rqe, nqe, aqe, oqe, uqe, lqe, pqe;')) {
    constantsLine = i;
    break;
  }
}

// 6. 创建新模块内容
console.log('5. 创建新模块...');
const moduleContent = `/**
 * Markdown Parser Module
 * 
 * 从 extension.js 提取的 markdown 解析相关功能
 * 依赖: markdown-it
 */

const markdown_it = require("markdown-it");

// HTML 实体和正则表达式常量
var ZBe, Ere, rqe, nqe, aqe, oqe, uqe, lqe, pqe;

${extractedLines.join('\n')}

// 导出主要函数
module.exports = {
  parseMarkdownToDoc,
  parseMarkdownToDocNodes,
  parseMarkdownTokensToNodes,
  createSimpleDocNode,
  createTextNode,
  unescapeMarkdown,
  escapeHtml
};
`;

// 7. 写入新模块文件
fs.writeFileSync(TARGET_FILE, moduleContent, 'utf-8');
console.log(`   新模块已创建: ${TARGET_FILE}`);

// 8. 从原文件删除提取的代码
console.log('6. 从原文件删除提取的代码...');

// 删除常量声明行
if (constantsLine !== -1) {
  lines.splice(constantsLine, 1);
  // 调整索引
  startLine--;
  endLine--;
}

// 删除死代码声明（Bq 相关）
for (let i = endLine; i >= startLine; i--) {
  const line = lines[i].trim();
  if (line.includes('var /* [dead-code] Pre removed */') ||
      line === 'Bq = {};' ||
      line.startsWith('__export(Bq,')) {
    lines.splice(i, 1);
    endLine--;
  }
}

// 删除提取的函数代码，但保留一个导入语句
const importStatement = `
// Markdown parser functions moved to separate module
const {
  parseMarkdownToDoc,
  parseMarkdownToDocNodes,
  createSimpleDocNode,
  createTextNode,
  unescapeMarkdown,
  escapeHtml
} = require('./modules/markdown-parser');
`;

// 删除提取的代码范围
lines.splice(startLine, endLine - startLine + 1, importStatement);

// 9. 写回原文件
const newSourceContent = lines.join('\n');
fs.writeFileSync(SOURCE_FILE, newSourceContent, 'utf-8');
console.log('   原文件已更新');

// 10. 统计信息
console.log('\n提取完成！');
console.log('='.repeat(50));
console.log(`提取的代码行数: ${endLine - startLine + 1}`);
console.log(`新模块大小: ${(moduleContent.length / 1024).toFixed(2)} KB`);
console.log(`原文件减少: ${((sourceContent.length - newSourceContent.length) / 1024).toFixed(2)} KB`);
console.log('='.repeat(50));
console.log('\n文件列表:');
console.log(`  - 新模块: ${TARGET_FILE}`);
console.log(`  - 备份文件: ${BACKUP_FILE}`);
console.log(`  - 更新的文件: ${SOURCE_FILE}`);

