/**
 * 提取 treeSitterWasm 模块到独立文件
 */
const fs = require('fs');
const path = require('path');

const extensionPath = path.join(__dirname, '../extension.js');
const outputPath = path.join(__dirname, '../modules/tree-sitter-wasm.js');

console.log('📦 提取 treeSitterWasm 模块...');

const code = fs.readFileSync(extensionPath, 'utf8');
const lines = code.split('\n');

// 提取 19662-21626 行 (0-indexed: 19661-21625)
const startLine = 19661;
const endLine = 21626;
const moduleLines = lines.slice(startLine, endLine);
let moduleCode = moduleLines.join('\n');

// 移除开头的 '  treeSitterWasm = ' 
moduleCode = moduleCode.replace(/^\s*treeSitterWasm\s*=\s*/, '');
// 移除结尾的 ','
moduleCode = moduleCode.replace(/,\s*$/, '');

// 包装成模块
const header = `/**
 * Module: tree-sitter-wasm
 * Description: Tree-sitter WebAssembly runtime (web-tree-sitter@0.24.7)
 * Original Line Range: 19662-21626
 * Size: ~130.9 KB
 * 
 * Auto-extracted from extension.js
 */
'use strict';

var { __commonJS } = require('./shared-env.js');

var treeSitterWasm = `;

const footer = `;

module.exports = treeSitterWasm;
`;

const output = header + moduleCode + footer;

fs.writeFileSync(outputPath, output, 'utf8');

console.log('✅ 模块已提取到:', outputPath);
console.log('   行数:', output.split('\n').length);
console.log('   大小:', (output.length / 1024).toFixed(1), 'KB');

