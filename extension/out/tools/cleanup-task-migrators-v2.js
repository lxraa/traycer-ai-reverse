#!/usr/bin/env node

/**
 * 清理脚本 V2：从 extension.js 中精确删除已迁移到 task_migrators.js 的代码
 */

const fs = require('fs');
const path = require('path');

// 配置
const EXTENSION_FILE = path.join(__dirname, '..', 'extension.js');
const BACKUP_FILE = path.join(__dirname, '..', 'extension.js.backup-task-migrators-v2');

console.log('🧹 开始清理 extension.js (V2)...\n');

// 读取文件
console.log('📖 读取文件:', EXTENSION_FILE);
let content = fs.readFileSync(EXTENSION_FILE, 'utf-8');
const lines = content.split('\n');
const originalLength = content.length;
const originalLines = lines.length;

// 备份原文件
console.log('💾 备份原文件:', BACKUP_FILE);
fs.writeFileSync(BACKUP_FILE, content, 'utf-8');

console.log('\n🔍 开始精确删除已迁移的代码...\n');

// 需要删除的代码块（通过行号范围）
const blocksToDelete = [];

// 1. 删除孤立的方法 (3721-3743)
console.log('查找孤立的方法块...');
for (let i = 0; i < lines.length; i++) {
  // 查找孤立的 } 后面跟着 static ["migrateTask"]
  if (lines[i].trim() === '}' && 
      lines[i+1] && lines[i+1].includes('static ["migrateTask"]')) {
    // 向后找到对应的结束 }
    let endIdx = i + 1;
    let braceCount = 0;
    let foundStart = false;
    
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.includes('{')) {
        foundStart = true;
        braceCount++;
      }
      if (line.includes('}')) {
        braceCount--;
        if (foundStart && braceCount <= 0 && line.trim().endsWith('};')) {
          endIdx = j;
          break;
        }
      }
    }
    
    blocksToDelete.push({
      name: `孤立方法块 (行 ${i+1}-${endIdx+1})`,
      start: i + 1,  // 从下一行开始（保留前面的 }）
      end: endIdx
    });
    console.log(`  找到孤立方法块: 行 ${i+1} 到 ${endIdx+1}`);
  }
}

// 2. 查找并删除 TaskMigratorV16-V20 和 StorageSerializer
console.log('查找 TaskMigratorV16-V20 和 StorageSerializer...');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // TaskMigratorV16
  if (line.includes('var TaskMigratorV16 = class {')) {
    let endIdx = findClassEnd(lines, i);
    blocksToDelete.push({
      name: 'TaskMigratorV16',
      start: i,
      end: endIdx
    });
    console.log(`  找到 TaskMigratorV16: 行 ${i+1} 到 ${endIdx+1}`);
  }
  
  // TaskMigratorV17
  if (line.includes('TaskMigratorV17 = class {')) {
    let endIdx = findClassEnd(lines, i);
    blocksToDelete.push({
      name: 'TaskMigratorV17',
      start: i,
      end: endIdx
    });
    console.log(`  找到 TaskMigratorV17: 行 ${i+1} 到 ${endIdx+1}`);
  }
  
  // TaskMigratorV18
  if (line.includes('TaskMigratorV18 = class {')) {
    let endIdx = findClassEnd(lines, i);
    blocksToDelete.push({
      name: 'TaskMigratorV18',
      start: i,
      end: endIdx
    });
    console.log(`  找到 TaskMigratorV18: 行 ${i+1} 到 ${endIdx+1}`);
  }
  
  // TaskMigratorV19
  if (line.includes('TaskMigratorV19 = class {')) {
    let endIdx = findClassEnd(lines, i);
    blocksToDelete.push({
      name: 'TaskMigratorV19',
      start: i,
      end: endIdx
    });
    console.log(`  找到 TaskMigratorV19: 行 ${i+1} 到 ${endIdx+1}`);
  }
  
  // TaskMigratorV20
  if (line.includes('TaskMigratorV20 = class {')) {
    let endIdx = findClassEnd(lines, i);
    blocksToDelete.push({
      name: 'TaskMigratorV20',
      start: i,
      end: endIdx
    });
    console.log(`  找到 TaskMigratorV20: 行 ${i+1} 到 ${endIdx+1}`);
  }
  
  // StorageSerializer
  if (line.includes('StorageSerializer = class {')) {
    let endIdx = findClassEnd(lines, i);
    blocksToDelete.push({
      name: 'StorageSerializer',
      start: i,
      end: endIdx
    });
    console.log(`  找到 StorageSerializer: 行 ${i+1} 到 ${endIdx+1}`);
  }
}

// 辅助函数：查找类的结束位置
function findClassEnd(lines, startIdx) {
  let braceCount = 0;
  let foundStart = false;
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    
    // 计算大括号
    for (let char of line) {
      if (char === '{') {
        foundStart = true;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          // 找到匹配的结束括号
          // 检查是否是类结束（通常有 }, 或 } 结尾）
          if (line.trim().endsWith('},') || line.trim().endsWith('}')) {
            return i;
          }
        }
      }
    }
  }
  
  return startIdx; // 未找到，返回起始位置
}

// 排序删除块（从后往前删除，避免行号偏移）
blocksToDelete.sort((a, b) => b.start - a.start);

console.log(`\n共找到 ${blocksToDelete.length} 个代码块需要删除\n`);

// 执行删除
let deletedLines = 0;
blocksToDelete.forEach(block => {
  const count = block.end - block.start + 1;
  console.log(`✂️  删除 ${block.name}: 行 ${block.start + 1}-${block.end + 1} (${count} 行)`);
  
  // 删除这些行
  lines.splice(block.start, count);
  deletedLines += count;
});

// 重新组合内容
content = lines.join('\n');

// 清理连续的空行
content = content.replace(/\n{3,}/g, '\n\n');

// 写回文件
console.log('\n💾 保存清理后的文件...');
fs.writeFileSync(EXTENSION_FILE, content, 'utf-8');

const newLength = content.length;
const newLines = content.split('\n').length;
const savedBytes = originalLength - newLength;
const savedLines = originalLines - newLines;

console.log('\n✨ 清理完成！\n');
console.log('📊 统计信息:');
console.log(`  原始大小: ${originalLength} bytes (${originalLines} 行)`);
console.log(`  清理后:   ${newLength} bytes (${newLines} 行)`);
console.log(`  减少:     ${savedBytes} bytes (${savedLines} 行, ${((savedLines/originalLines)*100).toFixed(1)}%)`);
console.log(`\n✅ 备份文件: ${BACKUP_FILE}`);
console.log('✅ 如果出现问题，可以从备份恢复');

