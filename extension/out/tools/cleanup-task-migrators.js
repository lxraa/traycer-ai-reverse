#!/usr/bin/env node

/**
 * 清理脚本：从 extension.js 中删除已迁移到 task_migrators.js 的代码
 * 
 * 功能：
 * 1. 删除 TaskMigratorV0-V36 的类定义
 * 2. 删除相关的辅助函数（formatPlanStepToMarkdown, createTextDocNode 等）
 * 3. 删除 StorageSerializer 类
 * 4. 删除 extractWorkspacePathsFromPhases 和 extractFilesFromPhaseBreakdowns
 * 5. 删除各种格式化函数
 * 6. 删除 Ba 枚举（FileOperation）
 * 7. 删除 uM 枚举（AgentMode）
 * 8. 保留主 TaskMigrator 类和 initTaskMigrator 函数
 */

const fs = require('fs');
const path = require('path');

// 配置
const EXTENSION_FILE = path.join(__dirname, '..', 'extension.js');
const BACKUP_FILE = path.join(__dirname, '..', 'extension.js.backup-task-migrators');

console.log('🧹 开始清理 extension.js...\n');

// 读取文件
console.log('📖 读取文件:', EXTENSION_FILE);
let content = fs.readFileSync(EXTENSION_FILE, 'utf-8');
const originalLength = content.length;
const originalLines = content.split('\n').length;

// 备份原文件
console.log('💾 备份原文件:', BACKUP_FILE);
fs.writeFileSync(BACKUP_FILE, content, 'utf-8');

// 定义需要删除的代码块
const blocksToRemove = [
  // 1. TaskMigratorV0
  {
    name: 'TaskMigratorV0',
    start: /TaskMigratorV0\s*=\s*class\s+\w+\s*\{/,
    end: /^\s*\};\s*$/m,
    multiBlock: false
  },
  
  // 2. formatPlanStepToMarkdown 函数
  {
    name: 'formatPlanStepToMarkdown',
    start: /^function formatPlanStepToMarkdown\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  // 3. TaskMigratorV1-V9 (连续定义)
  {
    name: 'TaskMigratorV1',
    start: /var TaskMigratorV1\s*=\s*class\s+\w+\s*\{/,
    end: /^\s*\},\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'TaskMigratorV2',
    start: /TaskMigratorV2\s*=\s*class\s+\w+\s*\{/,
    end: /^\s*\};\s*$/m,
    multiBlock: false
  },
  
  // 4. createTextDocNode 和 convertQueryToDocNode
  {
    name: 'createTextDocNode',
    start: /^function createTextDocNode\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'convertQueryToDocNode',
    start: /^function convertQueryToDocNode\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  // 5. TaskMigratorV3-V9
  {
    name: 'TaskMigratorV3-V9',
    start: /var TaskMigratorV3\s*=\s*class/,
    end: /TaskMigratorV9\s*=\s*class[\s\S]*?\};\s*$/m,
    multiBlock: false
  },
  
  // 6. getActiveWorkspacePath
  {
    name: 'getActiveWorkspacePath',
    start: /^function getActiveWorkspacePath\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  // 7. TaskMigratorV16-V20
  {
    name: 'TaskMigratorV16-V20',
    start: /var TaskMigratorV16\s*=\s*class/,
    end: /TaskMigratorV20[\s\S]*?\};\s*$/m,
    multiBlock: false
  },
  
  // 8. StorageSerializer
  {
    name: 'StorageSerializer',
    start: /StorageSerializer\s*=\s*class\s*\{/,
    end: /^\s*\},\s*$/m,
    multiBlock: false
  },
  
  // 9. TaskMigratorV17-V34 (大块)
  {
    name: 'TaskMigratorV17-V34',
    start: /TaskMigratorV17\s*=\s*class/,
    end: /TaskMigratorV34[\s\S]*?agentMode:\s*uM\.SINGLE_AGENT[\s\S]*?\};\s*$/m,
    multiBlock: false
  },
  
  // 10. extractWorkspacePathsFromPhases 和相关函数
  {
    name: 'extractWorkspacePathsFromPhases',
    start: /^function extractWorkspacePathsFromPhases\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'extractFilesFromPhaseBreakdowns',
    start: /^function extractFilesFromPhaseBreakdowns\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  // 11. WorkspaceMigrator.setExtractFunction 调用行
  {
    name: 'WorkspaceMigrator.setExtractFunction call',
    start: /^\/\/\s*\[unbundle\].*WorkspaceMigrator.*$/m,
    end: /^WorkspaceMigrator\.setExtractFunction\(extractWorkspacePathsFromPhases\);\s*$/m,
    multiBlock: false
  },
  
  // 12. 格式化函数
  {
    name: 'formatMermaidDiagram',
    start: /^function formatMermaidDiagram\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'formatImplementationPlanToMarkdown',
    start: /^function formatImplementationPlanToMarkdown\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'formatFileChangeHeader',
    start: /^function formatFileChangeHeader\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'formatCommitMessageWithReferences',
    start: /^function formatCommitMessageWithReferences\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'formatReferredFilesList',
    start: /^function formatReferredFilesList\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'getFileChangeTypeSuffix',
    start: /^function getFileChangeTypeSuffix\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'formatRenameOperation',
    start: /^function formatRenameOperation\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'pathProtoEquals',
    start: /^function pathProtoEquals\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  {
    name: 'categorizeFileChangesByOperation',
    start: /^function categorizeFileChangesByOperation\(/m,
    end: /^\}\s*$/m,
    multiBlock: false
  },
  
  // 13. Ba 枚举 (FileOperation)
  {
    name: 'Ba enum',
    start: /var Ba\s*=\s*\{/,
    end: /^\s*\},\s*$/m,
    multiBlock: false
  },
  
  // 14. TaskMigratorV35 和 V36
  {
    name: 'TaskMigratorV35-V36',
    start: /TaskMigratorV35\s*=\s*class/,
    end: /TaskMigratorV36[\s\S]*?aiGeneratedSummary:\s*void\s*0[\s\S]*?\}\s*$/m,
    multiBlock: false
  },
  
  // 15. uM 枚举
  {
    name: 'uM enum',
    start: /uM\s*=\s*\{[\s\S]*?SINGLE_AGENT:\s*0,[\s\S]*?MULTI_AGENT:\s*1,[\s\S]*?QUICK_AGENT:\s*2[\s\S]*?\}/,
    end: null, // 单行或已包含结束
    multiBlock: false
  }
];

// 使用更精确的方式删除代码块
function removeCodeBlock(content, blockDef) {
  const lines = content.split('\n');
  let modified = false;
  let startIndex = -1;
  let endIndex = -1;
  
  // 查找起始位置
  for (let i = 0; i < lines.length; i++) {
    if (blockDef.start.test(lines[i])) {
      startIndex = i;
      break;
    }
  }
  
  if (startIndex === -1) {
    console.log(`  ⚠️  未找到 ${blockDef.name} 的起始标记`);
    return content;
  }
  
  // 查找结束位置
  if (blockDef.end) {
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (blockDef.end.test(lines[i])) {
        endIndex = i;
        break;
      }
    }
  } else {
    endIndex = startIndex;
  }
  
  if (endIndex === -1) {
    console.log(`  ⚠️  未找到 ${blockDef.name} 的结束标记`);
    return content;
  }
  
  // 删除代码块
  const deletedLines = endIndex - startIndex + 1;
  lines.splice(startIndex, deletedLines);
  
  console.log(`  ✅ 删除 ${blockDef.name} (${deletedLines} 行)`);
  
  return lines.join('\n');
}

// 方法2: 使用正则表达式大范围删除
console.log('\n🔍 开始删除已迁移的代码...\n');

// 删除 TaskMigratorV0-V9 的大块
content = content.replace(
  /TaskMigratorV0\s*=\s*class[\s\S]*?static\s+\["migratePlan"\][\s\S]*?\}\s*\};/,
  '// [已迁移] TaskMigratorV0 moved to task_migrators.js'
);

content = content.replace(
  /function formatPlanStepToMarkdown[\s\S]*?\n\}/,
  '// [已迁移] formatPlanStepToMarkdown moved to task_migrators.js'
);

content = content.replace(
  /var TaskMigratorV1[\s\S]*?TaskMigratorV2[\s\S]*?TaskMigratorV9[\s\S]*?\};\s*\n/,
  '// [已迁移] TaskMigratorV1-V9 moved to task_migrators.js\n'
);

content = content.replace(
  /function createTextDocNode[\s\S]*?\n\}\n/,
  '// [已迁移] createTextDocNode moved to task_migrators.js\n'
);

content = content.replace(
  /function convertQueryToDocNode[\s\S]*?\n\}\n/,
  '// [已迁移] convertQueryToDocNode moved to task_migrators.js\n'
);

content = content.replace(
  /function getActiveWorkspacePath[\s\S]*?\n\}\n/,
  '// [已迁移] getActiveWorkspacePath moved to task_migrators.js\n'
);

content = content.replace(
  /var TaskMigratorV16[\s\S]*?StorageSerializer[\s\S]*?TaskMigratorV34[\s\S]*?agentMode:\s*uM\.SINGLE_AGENT[\s\S]*?\};\s*\n/,
  '// [已迁移] TaskMigratorV16-V34, StorageSerializer moved to task_migrators.js\n'
);

content = content.replace(
  /function extractWorkspacePathsFromPhases[\s\S]*?\n\}\n/,
  '// [已迁移] extractWorkspacePathsFromPhases moved to task_migrators.js (injected)\n'
);

content = content.replace(
  /function extractFilesFromPhaseBreakdowns[\s\S]*?\n\}\n/,
  '// [已迁移] extractFilesFromPhaseBreakdowns moved to task_migrators.js\n'
);

content = content.replace(
  /\/\/\s*\[unbundle\].*WorkspaceMigrator.*\nWorkspaceMigrator\.setExtractFunction[\s\S]*?\);\s*\n/,
  '// [已迁移] WorkspaceMigrator.setExtractFunction call moved to task_migrators.js\n'
);

// 删除格式化函数
const formatFunctions = [
  'formatMermaidDiagram',
  'formatImplementationPlanToMarkdown',
  'formatFileChangeHeader',
  'formatCommitMessageWithReferences',
  'formatReferredFilesList',
  'getFileChangeTypeSuffix',
  'formatRenameOperation',
  'pathProtoEquals',
  'categorizeFileChangesByOperation'
];

formatFunctions.forEach(funcName => {
  const regex = new RegExp(`function ${funcName}[\\s\\S]*?\\n\\}\\n`, 'g');
  content = content.replace(regex, `// [已迁移] ${funcName} moved to task_migrators.js\n`);
});

// 删除 Ba 枚举
content = content.replace(
  /var Ba\s*=\s*\{[\s\S]*?RENAME:\s*3[\s\S]*?\},\s*\n/,
  '// [已迁移] Ba (FileOperation) enum moved to task_migrators.js\n'
);

// 删除 TaskMigratorV35-V36
content = content.replace(
  /TaskMigratorV35\s*=\s*class[\s\S]*?TaskMigratorV36[\s\S]*?aiGeneratedSummary:\s*void\s*0[\s\S]*?\}\s*\},\s*\n/,
  '// [已迁移] TaskMigratorV35-V36 moved to task_migrators.js\n'
);

// 删除 uM 枚举
content = content.replace(
  /uM\s*=\s*\{[\s\S]*?SINGLE_AGENT:\s*0,[\s\S]*?MULTI_AGENT:\s*1,[\s\S]*?QUICK_AGENT:\s*2[\s\S]*?\},\s*\n/,
  '// [已迁移] uM (AgentMode) enum moved to task_migrators.js\n'
);

// 清理多余的空行
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

