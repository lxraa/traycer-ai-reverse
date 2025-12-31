'use strict';

const vscode_module = require("vscode");
const path = require("path");
const { mkdir, writeFile, readFile, chmod } = require("fs/promises");
const { PromptTemplate, PROMPT_ENV_VAR, TraycerFileSystem } = require("./prompt_template.js");
const { WorkspaceInfoManager } = require("./workspace_info.js");
const { agentRegistry } = require("./agent_registry.js");

/**
 * PromptTemplateFactory - 提示模板工厂类
 * 负责创建、加载和管理提示模板
 */
class PromptTemplateFactory {
  /**
   * 创建模板元数据
   * @param {string} filePath - 文件路径
   * @returns {Object} 元数据对象
   */
  static createMetadata(filePath) {
    return {
      displayName: WorkspaceInfoManager.getInstance().getFileNameWithoutExtension(filePath)
    };
  }

  /**
   * 创建内置代理元数据
   * @param {string} agentId - 代理ID
   * @returns {Object} 元数据对象
   */
  static createBuiltInAgentMetadata(agentId) {
    return {
      displayName: agentRegistry[agentId].displayName
    };
  }

  /**
   * 实例化模板
   * @param {string} filePath - 文件路径
   * @param {Object} metadata - 元数据
   * @param {string} scope - 作用域 (user/workspace)
   * @param {string} fileExtension - 文件扩展名
   * @param {string} content - 模板内容
   * @param {boolean} isBuiltIn - 是否为内置模板
   * @returns {PromptTemplate} 模板实例
   */
  static instantiateTemplate(filePath, metadata, scope, fileExtension, content, isBuiltIn) {
    let displayName = metadata.displayName || WorkspaceInfoManager.getInstance().getFileNameWithoutExtension(filePath);
    return new PromptTemplate(displayName, filePath, content, metadata, scope, fileExtension, isBuiltIn);
  }

  /**
   * 在磁盘上创建模板文件
   * @param {string} filePath - 文件路径
   * @param {string} content - 文件内容
   * @param {string} fileExtension - 文件扩展名
   */
  static async createTemplateOnDisk(filePath, content, fileExtension) {
    let dirPath = path.dirname(filePath);
    await mkdir(dirPath, { recursive: true });
    await writeFile(filePath, content, "utf8");
    
    // 设置文件权限: .sh 文件为 755 (可执行), 其他为 644
    let fileMode = fileExtension === ".sh" ? 0o755 : 0o644;
    await chmod(filePath, fileMode);
  }

  /**
   * 获取代理模板内容
   * @param {string} agentId - 代理ID
   * @param {string} fileExtension - 文件扩展名
   * @returns {string} 模板内容
   */
  static getAgentTemplateContent(agentId, fileExtension) {
    let commandPrefix;
    
    switch (agentId) {
      case "claude-code":
        commandPrefix = 'claude';
        break;
      case "gemini":
        commandPrefix = 'gemini -p';
        break;
      case "codex":
        commandPrefix = "codex";
        break;
      default:
        throw new Error("Unsupported agent ID: " + agentId);
    }
    
    let isShellScript = fileExtension === '.sh';
    let envVarReference = isShellScript 
      ? '"$' + PROMPT_ENV_VAR + '"' 
      : '"$env:' + PROMPT_ENV_VAR + '"';
    let commandLine = commandPrefix 
      ? commandPrefix + ' ' + envVarReference 
      : "echo " + envVarReference;
    
    let commentBlock = isShellScript 
      ? PromptTemplate.buildShellCommentBlock() 
      : PromptTemplate.buildBatCommentBlock();
    
    return commentBlock + '\n\n' + commandLine + '\n';
  }

  /**
   * 在虚拟文件系统上创建内置代理模板
   * @param {string} agentId - 代理ID
   * @param {string} fileExtension - 文件扩展名
   */
  static createBuiltInAgentTemplateOnVirtualFileSystem(agentId, fileExtension) {
    let content = this.getAgentTemplateContent(agentId, fileExtension);
    let fileName = agentId + fileExtension;
    let fileUri = vscode_module.Uri.joinPath(PromptTemplate.DEFAULT_CLI_AGENTS_DIR_PATH, fileName);
    TraycerFileSystem.getInstance().createFile(fileUri, Buffer.from(content, "utf8"));
  }

  /**
   * 创建新模板
   * @param {string} filePath - 文件路径
   * @param {string} scope - 作用域 (user/workspace)
   * @param {string} fileExtension - 文件扩展名
   * @param {string} customContent - 自定义内容(可选)
   * @returns {Promise<PromptTemplate>} 模板实例
   */
  static async createNewTemplate(filePath, scope, fileExtension, customContent) {
    let metadata = this.createMetadata(filePath);
    let content = customContent || (
      fileExtension === ".sh" 
        ? PromptTemplate.DEFAULT_SHELL_TEMPLATE_CONTENT 
        : PromptTemplate.DEFAULT_BAT_TEMPLATE_CONTENT
    );
    
    await this.createTemplateOnDisk(filePath, content, fileExtension);
    
    let fileContent = await readFile(filePath, 'utf8');
    let template = this.instantiateTemplate(filePath, metadata, scope, fileExtension, fileContent, false);
    template.validateTemplate();
    
    return template;
  }

  /**
   * 从磁盘加载模板
   * @param {string} filePath - 文件路径
   * @param {Object} metadata - 元数据
   * @param {string} scope - 作用域
   * @param {string} fileExtension - 文件扩展名
   * @returns {Promise<PromptTemplate>} 模板实例
   */
  static async loadTemplateFromDisk(filePath, metadata, scope, fileExtension) {
    let content = await readFile(filePath, 'utf8');
    let template = this.instantiateTemplate(filePath, metadata, scope, fileExtension, content, false);
    template.validateTemplate();
    
    return template;
  }

  /**
   * 创建内置代理模板
   * @param {string} agentId - 代理ID
   * @param {string} fileExtension - 文件扩展名
   * @returns {PromptTemplate} 模板实例
   */
  static createBuiltInAgentTemplate(agentId, fileExtension) {
    this.createBuiltInAgentTemplateOnVirtualFileSystem(agentId, fileExtension);
    
    let content = this.getAgentTemplateContent(agentId, fileExtension);
    let fileName = agentId + fileExtension;
    let fileUri = vscode_module.Uri.joinPath(PromptTemplate.DEFAULT_CLI_AGENTS_DIR_PATH, fileName);
    
    return this.instantiateTemplate(
      fileUri.toString(), 
      this.createBuiltInAgentMetadata(agentId), 
      'user', 
      fileExtension, 
      content, 
      true
    );
  }
}

module.exports = {
  PromptTemplateFactory
};

