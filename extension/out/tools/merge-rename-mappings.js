/**
 * 合并所有 rename-batch*.json 文件到 rename.json
 */

const fs = require('fs');
const path = require('path');

const mappingDir = path.join(__dirname, 'rename_mapping');
const outputFile = path.join(mappingDir, 'rename.json');

// 读取所有 batch 文件
const files = fs.readdirSync(mappingDir)
  .filter(f => f.startsWith('rename-batch') && f.endsWith('.json'))
  .sort((a, b) => {
    // 提取数字进行排序
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });

console.log(`找到 ${files.length} 个 batch 文件:\n`);
files.forEach(f => console.log(`  - ${f}`));

// 合并的结果
const merged = {
  globals: {},
  locals: {}
};

// 合并每个文件
for (const file of files) {
  const filePath = path.join(mappingDir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // 合并 globals
  if (content.globals) {
    Object.assign(merged.globals, content.globals);
  }
  
  // 合并 locals
  if (content.locals) {
    Object.assign(merged.locals, content.locals);
  }
  
  console.log(`\n✓ ${file}:`);
  console.log(`  全局符号: ${Object.keys(content.globals || {}).length} 个`);
  console.log(`  局部作用域: ${Object.keys(content.locals || {}).length} 个`);
}

// 写入合并后的文件
fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2), 'utf-8');

console.log('\n' + '='.repeat(60));
console.log('✅ 合并完成!');
console.log('='.repeat(60));
console.log(`\n📊 合并统计:`);
console.log(`  全局符号总数: ${Object.keys(merged.globals).length} 个`);
console.log(`  局部作用域总数: ${Object.keys(merged.locals).length} 个`);
console.log(`\n📄 输出文件: ${outputFile}`);

