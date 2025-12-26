#!/usr/bin/env node

/**
 * 自动提取 Sentry 相关代码到 modules/sentry.js
 * 
 * 使用方法：
 * node tools/extract-sentry.js
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_FILE = path.join(__dirname, '..', 'extension.js');
const SENTRY_MODULE_FILE = path.join(__dirname, '..', 'modules', 'sentry.js');

// 定义需要提取的 Sentry 相关内容的行号范围和独立函数
const SENTRY_RANGES = [
  // Sentry 核心函数和变量 (103-688)
  { start: 103, end: 688, description: 'Sentry core functions and variables' },
  
  // Sentry 初始化和实例管理 (16402-16437)
  { start: 16402, end: 16437, description: 'Sentry initialization and instance management' },
];

// 需要提取的独立 Sentry 相关函数名（用于精确匹配）
const SENTRY_FUNCTION_NAMES = [
  'getSentryCarrier',
  'getOrCreateGlobalSingleton',
  'consoleSandbox',
  'enableLogger',
  'disableLogger',
  'isLoggerEnabled',
  'logInfo',
  'logWarn',
  'logError',
  'sentryLog',
  'getLoggerSettings',
  'getFunctionName',
  'getVueNodeType',
  'getErrorType',
  'isObjectType',
  'isString',
  'isPlainObject',
  'isDomEvent',
  'isDomElement',
  'isThenable',
  'isSyntheticEvent',
  'safeInstanceOf',
  'isVueInstance',
  'buildDomPath',
  'buildDomSelector',
  'normalizeEventForSentry',
  'getObjectDescription',
  'shallowCopyObject',
  'normalizeAndSerialize',
  'normalizeObjectForSentry',
  'serializeSpecialValue',
  'getPrototypeName',
  'createMemoizationTracker',
  'createEnvelopeTuple',
  'iterateEnvelopeItems',
  'encodeTextToBytes',
  'serializeEnvelopeToBuffer',
  'concatUint8Arrays',
  'getEnvelopeItemType',
  'createResolvedSyncPromise',
  'createRejectedSyncPromise',
  'createSyncPromise',
  'getRateLimitForCategory',
  'isRateLimited',
  'updateRateLimits',
  'createSentryTransportWithRateLimit',
  'isNativeFunction',
  'createFetchTransport',
  'deleteFromCache',
  'createSentryFetchTransport',
  'getSentryInstance',
  'initializeSentryClient',
  'captureExceptionToSentry',
  'setSentryTag',
  'closeSentryClient',
];

// 需要提取的 Sentry 相关变量
const SENTRY_VARIABLES = [
  'LOGGER_PREFIX',
  'originalConsoleMethods',
  'logger',
  'DV',
  'EX',
  'jV',
  'E3e',
  'yi',
  '_B',
  'fZ',
  'hZ',
  'SyncPromise',
  'Qy',
  'PB',
  'rUe',
  'qk',
  'NVe',
  'IS',
  'xee',
  'jn',
  'eq',
  'tq',
  'sentryInstance',
  'initSentryInstance',
];

function readFileLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
}

function extractSentryCode() {
  console.log('📦 开始提取 Sentry 相关代码...\n');
  
  const lines = readFileLines(EXTENSION_FILE);
  const extractedLines = [];
  const lineNumbersToExtract = new Set();
  
  // 收集所有需要提取的行号
  SENTRY_RANGES.forEach(range => {
    console.log(`📍 标记范围: 行 ${range.start}-${range.end} (${range.description})`);
    for (let i = range.start - 1; i < range.end; i++) {
      lineNumbersToExtract.add(i);
    }
  });
  
  console.log(`\n✅ 总共标记了 ${lineNumbersToExtract.size} 行代码\n`);
  
  // 提取标记的行
  const sortedLineNumbers = Array.from(lineNumbersToExtract).sort((a, b) => a - b);
  sortedLineNumbers.forEach(lineNum => {
    extractedLines.push(lines[lineNum]);
  });
  
  // 生成 sentry.js 模块
  const sentryModule = generateSentryModule(extractedLines);
  
  // 写入文件
  writeFile(SENTRY_MODULE_FILE, sentryModule);
  
  console.log(`✅ Sentry 模块已生成: ${SENTRY_MODULE_FILE}`);
  console.log(`📊 提取了 ${extractedLines.length} 行代码\n`);
  
  // 生成删除脚本
  generateDeleteScript(sortedLineNumbers);
  
  // 生成依赖分析
  analyzeDependencies(extractedLines);
  
  console.log('\n✅ 完成！');
  console.log('\n📋 下一步操作：');
  console.log('1. 检查生成的 modules/sentry.js 文件');
  console.log('2. 运行删除脚本: node tools/delete-sentry-lines.js');
  console.log('3. 在 extension.js 中添加导入: const sentry = require("./modules/sentry.js");');
  console.log('4. 测试扩展是否正常工作');
}

function generateSentryModule(lines) {
  const header = `/**
 * Sentry Error Tracking Module
 * 
 * This module contains all Sentry-related functionality including:
 * - Error tracking and reporting
 * - Event serialization and normalization
 * - Transport layer (rate limiting, retries)
 * - DOM utilities for error context
 * - Logger integration
 * 
 * Auto-generated from extension.js
 */

'use strict';

// ============== 导入依赖 ==============
const sentry_browser_module = require("@sentry/browser");
const { __globalThis, SENTRY_DEBUG, SENTRY_VERSION } = require('./shared-env.js');

// ============== Sentry 相关代码 ==============

`;

  const footer = `

// ============== 导出 ==============
module.exports = {
  // Sentry 初始化和管理
  initializeSentryClient,
  captureExceptionToSentry,
  setSentryTag,
  closeSentryClient,
  getSentryInstance,
  
  // Logger 相关
  logger,
  enableLogger,
  disableLogger,
  isLoggerEnabled,
  logInfo,
  logWarn,
  logError,
  
  // 序列化和标准化
  normalizeAndSerialize,
  normalizeObjectForSentry,
  normalizeEventForSentry,
  
  // DOM 工具
  buildDomPath,
  buildDomSelector,
  
  // 类型检查
  isString,
  isPlainObject,
  isDomEvent,
  isDomElement,
  isThenable,
  isSyntheticEvent,
  isVueInstance,
  getErrorType,
  
  // Transport 相关
  createSentryFetchTransport,
  createSentryTransportWithRateLimit,
  
  // Promise 工具
  SyncPromise,
  createResolvedSyncPromise,
  createRejectedSyncPromise,
  
  // 变量
  yi,
  IS,
  eq,
  tq,
  
  // 常量
  LOGGER_PREFIX,
  PB,
  NVe,
};
`;

  return header + lines.join('\n') + footer;
}

function generateDeleteScript(lineNumbers) {
  const scriptPath = path.join(__dirname, 'delete-sentry-lines.js');
  
  const script = `#!/usr/bin/env node

/**
 * 自动删除 extension.js 中已提取的 Sentry 代码
 * 
 * ⚠️  警告：此操作会修改 extension.js 文件
 * 建议先备份文件：cp extension.js extension.js.backup
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_FILE = path.join(__dirname, '..', 'extension.js');

// 需要删除的行号（从大到小排序，避免删除时行号变化）
const LINES_TO_DELETE = ${JSON.stringify(lineNumbers.reverse(), null, 2)};

function deleteLines() {
  console.log('⚠️  即将从 extension.js 删除 ' + LINES_TO_DELETE.length + ' 行代码');
  console.log('⚠️  建议先备份文件！\\n');
  
  const content = fs.readFileSync(EXTENSION_FILE, 'utf-8');
  const lines = content.split('\\n');
  
  console.log('原文件行数:', lines.length);
  
  // 标记要删除的行
  const linesToKeep = [];
  for (let i = 0; i < lines.length; i++) {
    if (!LINES_TO_DELETE.includes(i)) {
      linesToKeep.push(lines[i]);
    }
  }
  
  // 写回文件
  fs.writeFileSync(EXTENSION_FILE, linesToKeep.join('\\n'), 'utf-8');
  
  console.log('新文件行数:', linesToKeep.length);
  console.log('删除行数:', lines.length - linesToKeep.length);
  console.log('\\n✅ 删除完成！');
}

// 确认后执行
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('是否继续删除？(yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    deleteLines();
  } else {
    console.log('❌ 操作已取消');
  }
  rl.close();
});
`;

  writeFile(scriptPath, script);
  console.log(`📝 删除脚本已生成: ${scriptPath}`);
}

function analyzeDependencies(lines) {
  console.log('\n📊 依赖分析：\n');
  
  const code = lines.join('\n');
  
  // 分析导入的模块
  const imports = new Set();
  
  // 检查使用的外部模块
  if (code.includes('sentry_browser_module')) imports.add('@sentry/browser');
  if (code.includes('__globalThis')) imports.add('./shared-env.js');
  if (code.includes('SENTRY_DEBUG')) imports.add('./shared-env.js');
  if (code.includes('SENTRY_VERSION')) imports.add('./shared-env.js');
  if (code.includes('config.')) imports.add('./config.js');
  
  console.log('需要导入的模块：');
  imports.forEach(imp => {
    console.log(`  - ${imp}`);
  });
  
  // 分析导出的函数
  const exports = [];
  SENTRY_FUNCTION_NAMES.forEach(name => {
    if (code.includes(`function ${name}`) || code.includes(`${name} =`)) {
      exports.push(name);
    }
  });
  
  console.log(`\n需要导出的函数: ${exports.length} 个`);
  
  // 分析 extension.js 中需要的导入
  console.log('\n在 extension.js 中添加以下导入：\n');
  console.log('const {');
  console.log('  initializeSentryClient,');
  console.log('  captureExceptionToSentry,');
  console.log('  setSentryTag,');
  console.log('  closeSentryClient,');
  console.log('  logger,');
  console.log('  // ... 其他需要的导出');
  console.log('} = require("./modules/sentry.js");');
}

// 执行提取
try {
  extractSentryCode();
} catch (error) {
  console.error('❌ 错误:', error);
  process.exit(1);
}

