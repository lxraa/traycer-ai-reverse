/**
 * 使用 Babel AST 将 require("vscode") 提取到文件顶部
 * 
 * 功能：
 * 1. 在文件开头添加 const vscode_module = require("vscode");
 * 2. 删除所有 xxx = require("vscode") 赋值
 * 3. 删除这些变量的声明
 * 4. 将所有这些变量的引用替换为 vscode_module
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// 目标文件
const targetFile = path.join(__dirname, '..', 'extension.js');

// 读取文件
let code = fs.readFileSync(targetFile, 'utf-8');

console.log('解析 AST...');
const ast = parser.parse(code, {
    sourceType: 'script',
    plugins: ['classProperties', 'classPrivateProperties', 'classPrivateMethods']
});

// 收集所有 require("vscode") 的变量名
const vscodeVars = new Set();
const NEW_VAR_NAME = 'vscode_module';

// 第一遍遍历：收集所有 vscode 变量名
traverse(ast, {
    // 匹配 xxx = require("vscode")
    AssignmentExpression(path) {
        if (
            t.isIdentifier(path.node.left) &&
            t.isCallExpression(path.node.right) &&
            t.isIdentifier(path.node.right.callee, { name: 'require' }) &&
            path.node.right.arguments.length === 1 &&
            t.isStringLiteral(path.node.right.arguments[0], { value: 'vscode' })
        ) {
            vscodeVars.add(path.node.left.name);
        }
    },
    // 匹配 var xxx = require("vscode")
    VariableDeclarator(path) {
        if (
            t.isIdentifier(path.node.id) &&
            t.isCallExpression(path.node.init) &&
            t.isIdentifier(path.node.init.callee, { name: 'require' }) &&
            path.node.init.arguments.length === 1 &&
            t.isStringLiteral(path.node.init.arguments[0], { value: 'vscode' })
        ) {
            vscodeVars.add(path.node.id.name);
        }
    }
});

console.log('找到的 vscode 变量名：');
console.log([...vscodeVars].join(', '));
console.log(`共 ${vscodeVars.size} 个变量\n`);

// 统计
let assignmentsRemoved = 0;
let declaratorsRemoved = 0;
let referencesReplaced = 0;

// 第二遍遍历：删除赋值和声明，替换引用
traverse(ast, {
    // 删除 xxx = require("vscode") 赋值表达式
    AssignmentExpression(path) {
        if (
            t.isIdentifier(path.node.left) &&
            vscodeVars.has(path.node.left.name) &&
            t.isCallExpression(path.node.right) &&
            t.isIdentifier(path.node.right.callee, { name: 'require' }) &&
            path.node.right.arguments.length === 1 &&
            t.isStringLiteral(path.node.right.arguments[0], { value: 'vscode' })
        ) {
            assignmentsRemoved++;
            // 如果是在 SequenceExpression 中，替换为空标识符或移除
            if (t.isSequenceExpression(path.parent)) {
                path.remove();
            } else if (t.isExpressionStatement(path.parent)) {
                path.parentPath.remove();
            } else {
                // 替换为 undefined 以保持语法正确
                path.replaceWith(t.identifier('undefined'));
            }
        }
    },
    
    // 删除 var xxx = require("vscode") 声明
    VariableDeclarator(path) {
        if (
            t.isIdentifier(path.node.id) &&
            vscodeVars.has(path.node.id.name) &&
            path.node.init &&
            t.isCallExpression(path.node.init) &&
            t.isIdentifier(path.node.init.callee, { name: 'require' }) &&
            path.node.init.arguments.length === 1 &&
            t.isStringLiteral(path.node.init.arguments[0], { value: 'vscode' })
        ) {
            declaratorsRemoved++;
            path.remove();
        }
        // 删除没有初始化的变量声明（var xxx; 形式）
        else if (
            t.isIdentifier(path.node.id) &&
            vscodeVars.has(path.node.id.name) &&
            !path.node.init
        ) {
            declaratorsRemoved++;
            path.remove();
        }
    },
    
    // 替换所有变量引用
    Identifier(path) {
        // 跳过属性访问的属性名 (obj.xxx)
        if (t.isMemberExpression(path.parent) && path.parent.property === path.node && !path.parent.computed) {
            return;
        }
        // 跳过对象属性的 key ({ xxx: value })
        if (t.isObjectProperty(path.parent) && path.parent.key === path.node && !path.parent.computed) {
            return;
        }
        // 跳过函数参数声明
        if (t.isFunction(path.parent) && path.parent.params.includes(path.node)) {
            return;
        }
        // 跳过变量声明的左侧
        if (t.isVariableDeclarator(path.parent) && path.parent.id === path.node) {
            return;
        }
        // 跳过赋值表达式的左侧（除非是在 require 调用中）
        if (t.isAssignmentExpression(path.parent) && path.parent.left === path.node) {
            return;
        }
        
        if (vscodeVars.has(path.node.name)) {
            referencesReplaced++;
            path.node.name = NEW_VAR_NAME;
        }
    }
});

console.log(`✓ 已删除 ${assignmentsRemoved} 处赋值表达式`);
console.log(`✓ 已删除 ${declaratorsRemoved} 处变量声明`);
console.log(`✓ 已替换 ${referencesReplaced} 处变量引用为 ${NEW_VAR_NAME}\n`);

// 生成代码
console.log('生成代码...');
const output = generate(ast, {
    retainLines: true,
    compact: false,
    comments: true
}, code);

let newCode = output.code;

// 在导入区添加 vscode_module
const importMarker = '// ============== 导入区开始====================================';
const vscodeImport = `const ${NEW_VAR_NAME} = require("vscode");`;

if (!newCode.includes(vscodeImport)) {
    const importStartIndex = newCode.indexOf(importMarker);
    if (importStartIndex !== -1) {
        const insertPos = newCode.indexOf('\n', importStartIndex) + 1;
        newCode = newCode.slice(0, insertPos) + '\n' + vscodeImport + '\n' + newCode.slice(insertPos);
        console.log(`✓ 已添加顶部导入: ${vscodeImport}`);
    }
}

// 写入文件
fs.writeFileSync(targetFile, newCode, 'utf-8');
console.log('✓ 文件已保存\n');

// 验证语法
console.log('正在验证语法...');
const { execSync } = require('child_process');
try {
    execSync(`node --check "${targetFile}"`, { stdio: 'inherit' });
    console.log('✓ 语法验证通过！');
} catch (e) {
    console.error('✗ 语法验证失败，请手动检查');
    process.exit(1);
}
