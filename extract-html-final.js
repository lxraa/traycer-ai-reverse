// 精确提取HTML模板的脚本
const fs = require('fs');
const path = require('path');

// 读取extension.js文件
const extensionPath = path.join(__dirname, 'extension', 'out', 'extension.js');
const extensionCode = fs.readFileSync(extensionPath, 'utf-8');

console.log('开始提取HTML模板...\n');

// 工具函数：解析JavaScript字符串字面量
function parseJsString(jsString) {
  // 移除首尾引号
  if (jsString.startsWith('"') && jsString.endsWith('"')) {
    jsString = jsString.slice(1, -1);
  }
  
  // 解码转义字符
  return jsString
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// 1. 提取wE对象
console.log('提取wE对象...');
const weMatch = extensionCode.match(/wE\s*=\s*\{([^}]+)\}/s);
let webLinks = {};
if (weMatch) {
  const weCode = `webLinks = {${weMatch[1].replace(/\+ IT/g, '+ "traycer.traycer-vscode"')}}`;
  try {
    eval(weCode);
    console.log('✓ wE对象提取成功，包含', Object.keys(webLinks).length, '个属性');
  } catch (e) {
    console.error('❌ wE对象解析失败:', e.message);
  }
}

// 2. 提取generateReleaseNotesHtml函数的HTML
console.log('提取发布说明HTML模板...');
const releaseMatch = extensionCode.match(/function generateReleaseNotesHtml\(_0x[a-f0-9]+\)\s*\{[\s\S]*?return\s+"([\s\S]*?)"\s*\+\s*VS\(\{/);
if (releaseMatch) {
  let releaseHtml = releaseMatch[1];
  
  // 找到footer部分
  const footerMatch = extensionCode.match(/VS\(\{[\s\S]*?\}\)\.render\(_0x[a-f0-9]+\)\s*\+\s*'([\s\S]*?)';[\s\n]*\}/m);
  if (footerMatch) {
    releaseHtml += footerMatch[1];
  }
  
  // 替换wE变量
  releaseHtml = releaseHtml.replace(/wE\.(\w+)/g, (match, prop) => {
    return webLinks[prop] || match;
  });
  
  // 解码转义字符
  releaseHtml = parseJsString(releaseHtml);
  
  // 添加markdown内容占位符
  const fullReleaseHtml = releaseHtml.replace(
    '</div>',
    '${markdownContent}\n            </div>'
  );
  
  fs.writeFileSync('release-notes-template.html', fullReleaseHtml, 'utf-8');
  console.log('✓ 发布说明HTML模板已保存，长度:', fullReleaseHtml.length, '字符');
}

// 3. 提取React App HTML模板
console.log('提取React App HTML模板...');
// 精确匹配第13782行的return语句
const lines = extensionCode.split('\n');
let reactHtmlLine = '';
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return "<!DOCTYPE html>')) {
    reactHtmlLine = lines[i];
    break;
  }
}

if (reactHtmlLine) {
  // 提取return语句后的字符串
  // 格式: return "..." + var1 + "..." + var2 + ... + '...';
  const match = reactHtmlLine.match(/return\s+"(.*?)";$/);
  
  if (match) {
    // 分解字符串拼接
    let fullString = reactHtmlLine.substring(reactHtmlLine.indexOf('return ') + 7, reactHtmlLine.lastIndexOf(';'));
    
    // 定义变量映射
    const varMap = {
      '_0x1aa01e.webview.cspSource': '${cspSource}',
      '_0x507afa': '${nonce}',
      '_0x12c129': '${cssUri1}',
      '_0x29e1cb': '${cssUri2}',
      '_0x2136e7': '${jsUri1}',
      '_0x274c8a': '${jsUri2}',
      '_0x570ae4': '${detectedIDE}',
      'process.platform': '${platform}'
    };
    
    // 手动解析字符串拼接
    let parts = [];
    let current = '';
    let inString = false;
    let stringChar = null;
    let escapeNext = false;
    
    for (let i = 0; i < fullString.length; i++) {
      const char = fullString[i];
      
      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        current += char;
        escapeNext = true;
        continue;
      }
      
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        continue;
      }
      
      if (char === stringChar && inString) {
        inString = false;
        parts.push({ type: 'string', value: current });
        current = '';
        stringChar = null;
        continue;
      }
      
      if (inString) {
        current += char;
      } else if (char === '+') {
        // 跳过+和空格
        continue;
      } else if (char.trim()) {
        current += char;
        // 检查是否是变量
        for (const varName of Object.keys(varMap)) {
          if (fullString.substring(i).startsWith(varName)) {
            parts.push({ type: 'var', value: varMap[varName] });
            i += varName.length - 1;
            current = '';
            break;
          }
        }
      }
    }
    
    // 组合结果
    let reactHtml = '';
    for (const part of parts) {
      if (part.type === 'string') {
        reactHtml += parseJsString(part.value);
      } else if (part.type === 'var') {
        reactHtml += part.value;
      }
    }
    
    fs.writeFileSync('react-app-template.html', reactHtml, 'utf-8');
    console.log('✓ React App HTML模板已保存，长度:', reactHtml.length, '字符');
  }
} else {
  console.log('❌ 未找到React App HTML模板');
}

// 4. 保存web-links.json
if (Object.keys(webLinks).length > 0) {
  fs.writeFileSync('web-links.json', JSON.stringify(webLinks, null, 2), 'utf-8');
  console.log('✓ web-links.json已保存');
}

console.log('\n提取完成！生成了以下文件:');
console.log('1. release-notes-template.html - 发布说明页面模板');
console.log('2. react-app-template.html - React应用Webview模板');
console.log('3. web-links.json - 网站链接配置');
