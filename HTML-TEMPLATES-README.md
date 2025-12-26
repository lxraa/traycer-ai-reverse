# HTML模板提取说明

本目录包含从 `extension.js` 中提取的HTML模板文件。

## 提取的文件

### 1. `react-app-template.html`
**用途**: React应用的Webview容器模板

**占位符说明**:
- `${cspSource}`: Content Security Policy源地址
- `${nonce}`: 随机生成的nonce值，用于CSP
- `${platform}`: 平台信息 (如 win32, darwin, linux)
- `${detectedIDE}`: 检测到的IDE名称
- `${cssUri1}`: commentNavigator.css的URI
- `${cssUri2}`: global.css的URI  
- `${jsUri1}`: commentNavigator.js的URI
- `${jsUri2}`: global.js的URI

**原始位置**: `extension.js` 第13782行 `getReactApp()` 方法

**示例使用**:
```javascript
const html = reactAppTemplate
  .replace(/\$\{cspSource\}/g, webview.cspSource)
  .replace(/\$\{nonce\}/g, nonce)
  .replace(/\$\{platform\}/g, process.platform)
  .replace(/\$\{detectedIDE\}/g, ideName)
  .replace(/\$\{cssUri1\}/g, cssUri1.toString())
  .replace(/\$\{cssUri2\}/g, cssUri2.toString())
  .replace(/\$\{jsUri1\}/g, jsUri1.toString())
  .replace(/\$\{jsUri2\}/g, jsUri2.toString());
```

---

### 2. `release-notes-template.html`
**用途**: 发布说明页面的HTML模板

**占位符说明**:
- `${markdownContent}`: Markdown渲染后的HTML内容

**原始位置**: `extension.js` 第18614行 `generateReleaseNotesHtml()` 函数

**特性**:
- 完整的CSS样式，包括VS Code主题适配
- 代码高亮支持 (Monaco tokenizer)
- Markdown渲染样式
- Footer区域包含社交链接

**示例使用**:
```javascript
const markdownIt = require('markdown-it');
const md = markdownIt({ html: true });
const renderedMarkdown = md.render(changelogContent);

const html = releaseNotesTemplate
  .replace('${markdownContent}', renderedMarkdown);
```

---

### 3. `web-links.json`
**用途**: 网站和社交媒体链接配置

**原始位置**: `extension.js` 第18575行 `wE` 对象

**包含链接**:
- 主网站和定价页面
- 平台网站
- 社交媒体 (Twitter, Discord, LinkedIn, GitHub)
- 市场链接 (VS Code Marketplace, Open VSX)
- 法律文档 (隐私政策, 服务条款)
- 支持邮箱

---

## 提取脚本

### `extract-html-final.js`
用于从 `extension.js` 中提取HTML模板的Node.js脚本。

**运行方法**:
```bash
node extract-html-final.js
```

**功能**:
1. 提取 `wE` 对象并保存为 `web-links.json`
2. 提取 `generateReleaseNotesHtml()` 函数的HTML模板
3. 提取 `getReactApp()` 方法的HTML模板
4. 自动替换内部变量引用为占位符
5. 解码所有转义字符

---

## 注意事项

1. **占位符格式**: 所有占位符使用 `${变量名}` 格式，便于字符串替换
2. **转义字符**: 所有 `\n`, `\x20` 等转义字符已被解码为实际字符
3. **变量替换**: `wE` 对象的引用已被替换为实际URL值
4. **CSP安全**: react-app-template包含严格的Content Security Policy配置

---

## 文件更新

如果 `extension.js` 有更新需要重新提取模板:
```bash
node extract-html-final.js
```

提取完成后会生成/更新以下文件:
- `react-app-template.html`
- `release-notes-template.html`  
- `web-links.json`

---

生成时间: 2024-12-27
源文件: `extension/out/extension.js` (19009行)

