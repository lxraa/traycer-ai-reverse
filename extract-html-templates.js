// 从extension.js中提取HTML模板的脚本
const fs = require('fs');
const path = require('path');

// 读取extension.js文件
const extensionPath = path.join(__dirname, 'extension', 'out', 'extension.js');
const extensionCode = fs.readFileSync(extensionPath, 'utf-8');

console.log('开始提取HTML模板...\n');

// 提取发布说明HTML模板
function extractReleaseNotesHtml() {
  try {
    // 找到generateReleaseNotesHtml函数
    const funcMatch = extensionCode.match(/function generateReleaseNotesHtml\(_0x[a-f0-9]+\)\s*\{[\s\S]*?return\s+"([\s\S]*?)"\s*\+\s*VS\({/);
    
    if (!funcMatch) {
      console.error('❌ 无法找到generateReleaseNotesHtml函数');
      return null;
    }
    
    let htmlTemplate = funcMatch[1];
    
    // 解码转义字符
    htmlTemplate = htmlTemplate
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\x20/g, ' ')
      .replace(/\\x22/g, '"')
      .replace(/\\x27/g, "'")
      .replace(/\\x0a/g, '\n');
    
    // 提取footer部分（在函数的后面）
    const footerMatch = extensionCode.match(/VS\(\{[^}]+\}\)\.render\(_0x[a-f0-9]+\)\s*\+\s*'([\s\S]*?)'\s*;/);
    
    if (footerMatch) {
      let footer = footerMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\x20/g, ' ')
        .replace(/\\x22/g, '"');
      
      // 替换footer中的wE变量引用
      footer = footer.replace(/wE\.(\w+)/g, (match, prop) => {
        return webLinks[prop] || match;
      });
      
      htmlTemplate += '\n            <div class="content">\n                ${markdownContent}\n            </div>\n' + footer;
    }
    
    return htmlTemplate;
  } catch (error) {
    console.error('提取发布说明HTML时出错:', error.message);
    return null;
  }
}

// 提取React App HTML模板
function extractReactAppHtml() {
  try {
    // 找到getReactApp方法中的return语句
    // 使用更精确的正则表达式来匹配整个HTML字符串
    const lines = extensionCode.split('\n');
    let startLine = -1;
    let inReturn = false;
    let htmlParts = [];
    let depth = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 找到return "<!DOCTYPE html>的行
      if (line.includes('return "<!DOCTYPE html>')) {
        startLine = i;
        inReturn = true;
        // 提取这一行的字符串部分
        const match = line.match(/return\s+"(.*)$/);
        if (match) {
          htmlParts.push(match[1]);
        }
        continue;
      }
      
      if (inReturn) {
        // 检查是否是字符串连接
        if (line.includes('" + ') || line.includes(' + "')) {
          htmlParts.push(line.trim());
        } else if (line.includes('";')) {
          // 字符串结束
          const match = line.match(/^(.*)";/);
          if (match) {
            htmlParts.push(match[1].trim());
          }
          break;
        } else {
          htmlParts.push(line.trim());
        }
      }
    }
    
    if (htmlParts.length === 0) {
      console.error('❌ 无法找到React App HTML模板');
      return null;
    }
    
    // 合并并处理HTML字符串
    let htmlString = htmlParts.join('');
    
    // 移除所有的" + 和 + "连接符
    htmlString = htmlString.replace(/"\s*\+\s*"/g, '');
    
    // 处理变量引用，替换为占位符
    const variableMap = {
      '_0x1aa01e.webview.cspSource': '${cspSource}',
      '_0x507afa': '${nonce}',
      'process.platform': '${platform}',
      '_0x570ae4': '${detectedIDE}',
      '_0x12c129': '${cssUri1}',
      '_0x29e1cb': '${cssUri2}',
      '_0x2136e7': '${jsUri1}',
      '_0x274c8a': '${jsUri2}'
    };
    
    // 替换变量引用
    for (const [varName, placeholder] of Object.entries(variableMap)) {
      const escapedVar = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('"\s*\\+\s*' + escapedVar + '\s*\\+\s*"', 'g');
      htmlString = htmlString.replace(regex, placeholder);
    }
    
    // 解码转义字符
    htmlString = htmlString
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\x20/g, ' ')
      .replace(/\\x22/g, '"')
      .replace(/\\x27/g, "'")
      .replace(/\\x0a/g, '\n');
    
    return htmlString;
  } catch (error) {
    console.error('提取React App HTML时出错:', error.message);
    console.error(error.stack);
    return null;
  }
}

// 提取wE对象
function extractWebLinks() {
  try {
    const match = extensionCode.match(/wE\s*=\s*\{([^}]+)\}/s);
    if (!match) {
      console.error('❌ 无法找到wE对象');
      return {};
    }
    
    const weContent = match[1];
    const weObject = {};
    
    // 解析每一行
    const lines = weContent.split(',');
    for (const line of lines) {
      const propMatch = line.trim().match(/(\w+):\s*["']([^"']+)["']/);
      if (propMatch) {
        weObject[propMatch[1]] = propMatch[2];
      } else {
        // 处理包含变量的情况
        const varMatch = line.trim().match(/(\w+):\s*"([^"]+)"\s*\+\s*(\w+)/);
        if (varMatch) {
          // IT变量通常是扩展ID
          weObject[varMatch[1]] = varMatch[2] + 'traycer.traycer-vscode';
        }
      }
    }
    
    return weObject;
  } catch (error) {
    console.error('提取wE对象时出错:', error.message);
    return {};
  }
}

// 执行提取
const webLinks = extractWebLinks();
const releaseNotesHtml = extractReleaseNotesHtml();
const reactAppHtml = extractReactAppHtml();

// 保存结果
if (webLinks && Object.keys(webLinks).length > 0) {
  fs.writeFileSync('web-links.json', JSON.stringify(webLinks, null, 2), 'utf-8');
  console.log('✓ 已保存: web-links.json');
  console.log('  包含 ' + Object.keys(webLinks).length + ' 个链接配置');
}

if (releaseNotesHtml) {
  fs.writeFileSync('release-notes-template.html', releaseNotesHtml, 'utf-8');
  console.log('✓ 已保存: release-notes-template.html');
  console.log('  长度: ' + releaseNotesHtml.length + ' 字符');
}

if (reactAppHtml) {
  fs.writeFileSync('react-app-template.html', reactAppHtml, 'utf-8');
  console.log('✓ 已保存: react-app-template.html');
  console.log('  长度: ' + reactAppHtml.length + ' 字符');
}

console.log('\n提取完成！');
console.log('\n说明:');
console.log('- release-notes-template.html: 发布说明HTML模板，使用 ${markdownContent} 作为占位符');
console.log('- react-app-template.html: React应用Webview模板，包含以下占位符:');
console.log('  - ${cspSource}: Content Security Policy源');
console.log('  - ${nonce}: 随机nonce值');
console.log('  - ${platform}: 平台信息');
console.log('  - ${detectedIDE}: IDE信息');
console.log('  - ${cssUri1}, ${cssUri2}: CSS文件URI');
console.log('  - ${jsUri1}, ${jsUri2}: JavaScript文件URI');
console.log('- web-links.json: 网站链接配置');
