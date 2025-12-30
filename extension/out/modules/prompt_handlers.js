'use strict';

const vscode_module = require("vscode");
const { Logger } = require("./logger.js");
const { WorkspaceInfoManager } = require("./workspace_info.js");
const path_module = require("path");
const os_module = require("os");
/**
 * ExtensionHelper - 用于获取和激活 VSCode 扩展的辅助类
 */
class ExtensionHelper {
  /**
   * 获取指定的 VSCode 扩展
   * @param {string} extensionId - 扩展 ID
   * @param {string} displayName - 显示名称
   * @param {string} extensionName - 扩展名称（可选，默认使用 displayName）
   * @returns {Promise<vscode_module.Extension>} - VSCode 扩展实例
   */
  static async getExtension(extensionId, displayName, extensionName) {
    let extension = vscode_module.extensions.getExtension(extensionId);
    if (!extension) {
      Logger.warn("Extension not found", extensionId);
      const result = await vscode_module.window.showInformationMessage(
        `You have selected to use ${displayName} for execution, but the ${extensionName ?? displayName} extension is not installed. Would you like to install it from the marketplace?`,
        "View in Marketplace",
        'Cancel'
      );
      if (result === "View in Marketplace") {
        Logger.info('Opening marketplace for extension', extensionId);
        await vscode_module.commands.executeCommand("workbench.extensions.search", extensionId);
      }
      throw new Error(`${displayName} extension not found`);
    }
    return extension;
  }

  /**
   * 激活指定的 VSCode 扩展
   * @param {string} extensionId - 扩展 ID
   * @param {string} displayName - 显示名称
   * @param {string} extensionName - 扩展名称（可选）
   * @returns {Promise<vscode_module.Extension>} - 已激活的 VSCode 扩展实例
   */
  static async activateExtension(extensionId, displayName, extensionName) {
    let extension = await ExtensionHelper.getExtension(extensionId, displayName, extensionName);
    await extension.activate();
    return extension;
  }
}

/**
 * ExtensionTaskHandler - 扩展任务处理基类
 * 用于处理需要调用其他扩展的任务
 * 
 * 注意：此类需要在运行时与 BasePromptTemplate 建立继承关系
 * 通过 createPromptHandlerClasses 工厂函数实现动态继承
 */
class ExtensionTaskHandler {
  constructor(prompt, config) {
    this.prompt = prompt;
    this.config = config;
  }

  async handle() {
    let extension = await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    await this.startTask(extension.exports);
    if (this.config.sidebarCommand) {
      await vscode_module.commands.executeCommand(this.config.sidebarCommand);
    }
  }
}

/**
 * ClipboardPromptHandler - 剪贴板提示处理基类
 * 通过剪贴板操作来传递提示内容
 * 
 * 注意：此类需要在运行时与 BasePromptTemplate 建立继承关系
 * 通过 createPromptHandlerClasses 工厂函数实现动态继承
 */
class ClipboardPromptHandler {
  constructor(prompt) {
    this.prompt = prompt;
    this.customDelay = 100;
  }

  getPreCommandsToRun() {
    return [];
  }

  async handle() {
    let originalClipboard = await vscode_module.env.clipboard.readText();
    
    // 执行预命令
    for (let command of this.getPreCommandsToRun()) {
      await vscode_module.commands.executeCommand(command);
      await new Promise(resolve => setTimeout(resolve, this.customDelay));
    }
    
    // 写入提示到剪贴板并粘贴
    await vscode_module.env.clipboard.writeText(this.prompt);
    await vscode_module.commands.executeCommand("editor.action.clipboardPasteAction");
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 恢复原剪贴板内容
    await vscode_module.env.clipboard.writeText(originalClipboard);
  }
}

// ============== 基于 ExtensionTaskHandler 的具体实现 ==============

/**
 * ClineHandler (Windsurf) - 处理 Cline 扩展任务
 */
class ClineHandler extends ExtensionTaskHandler {
  constructor(prompt) {
    super(prompt, {
      extensionId: 'saoudrizwan.claude-dev',
      displayName: 'Cline',
      sidebarCommand: 'claude-dev.SidebarProvider.focus'
    });
  }

  async startTask(extensionExports) {
    await extensionExports.startNewTask(this.prompt);
  }
}

/**
 * KiloCodeHandler (Cursor) - 处理 Kilo Code 扩展任务
 */
class KiloCodeHandler extends ExtensionTaskHandler {
  constructor(prompt) {
    super(prompt, {
      extensionId: "kilocode.Kilo-Code",
      displayName: "Kilo Code",
      extensionName: 'Kilo Code',
      sidebarCommand: "kilo-code.SidebarProvider.focus"
    });
  }

  async startTask(extensionExports) {
    await extensionExports.startNewTask({
      configuration: {},
      text: this.prompt
    });
  }
}

/**
 * RooCodeHandler (Zed) - 处理 Roo Code 扩展任务
 */
class RooCodeHandler extends ExtensionTaskHandler {
  constructor(prompt) {
    super(prompt, {
      extensionId: "RooVeterinaryInc.roo-cline",
      displayName: 'Roo Code',
      extensionName: "Roo Code",
      sidebarCommand: "roo-cline.SidebarProvider.focus"
    });
  }

  async startTask(extensionExports) {
    await extensionExports.startNewTask({
      configuration: {},
      text: this.prompt
    });
  }
}

// ============== 基于 ClipboardPromptHandler 的具体实现 ==============

/**
 * AmpHandler (Cline) - 处理 Amp 扩展任务
 */
class AmpHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.customDelay = 400;
    this.config = {
      extensionId: 'sourcegraph.amp',
      displayName: 'Amp',
      extensionName: 'Amp'
    };
  }

  getPreCommandsToRun() {
    return ["amp.agent.newThread"];
  }

  async handle() {
    await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

/**
 * AugmentHandler (Aider) - 处理 Augment 扩展任务
 */
class AugmentHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.config = {
      extensionId: "augment.vscode-augment",
      displayName: "Augment",
      extensionName: "Augment"
    };
  }

  getPreCommandsToRun() {
    return ["vscode-augment.startNewChat"];
  }

  async handle() {
    await ExtensionHelper.activateExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

/**
 * ClaudeCodeHandler (Copilot) - 处理 Claude Code 扩展任务
 */
class ClaudeCodeHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.customDelay = 2000;
    this.config = {
      extensionId: 'anthropic.claude-code',
      displayName: 'Claude Code Extension',
      extensionName: "Claude Code"
    };
  }

  getPreCommandsToRun() {
    return ["claude-vscode.editor.open"];
  }

  async handle() {
    await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

/**
 * ChatGPTHandler (Continue) - 处理 ChatGPT/Codex 扩展任务
 */
class ChatGPTHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.customDelay = 2000;
    this.config = {
      extensionId: "openai.chatgpt",
      displayName: 'Codex Extension',
      extensionName: "Codex"
    };
  }

  getPreCommandsToRun() {
    return ['chatgpt.newCodexPanel'];
  }

  async handle() {
    await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

/**
 * ZenCoderHandler (Roo) - 处理 ZenCoder 扩展任务
 */
class ZenCoderHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.customDelay = 400;
    this.config = {
      extensionId: "zencoderai.zencoder",
      displayName: "ZenCoder",
      extensionName: 'ZenCoder'
    };
  }

  getPreCommandsToRun() {
    return ["zencoder.insert-into-chat"];
  }

  async handle() {
    await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

// ============== 独立的 Handler 类（直接继承 ClipboardPromptHandler）==============

/**
 * CopilotPromptHandler - 处理 GitHub Copilot Chat
 */
class CopilotPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return [];
  }

  async handle() {
    await vscode_module.commands.executeCommand("workbench.action.chat.open", {
      mode: 'agent',
      query: this.prompt,
      isPartialQuery: false
    });
  }
}

/**
 * CursorPromptHandler - 处理 Cursor 编辑器
 */
class CursorPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return ["composer.createNewComposerTab", "composerMode.agent", "aichat.newfollowupaction"];
  }
}

/**
 * AugmentPromptHandler - 处理 Augment 原生集成
 */
class AugmentPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return [
      'workbench.action.chat.icube.open',
      "workbench.action.icube.aiChatSidebar.createNewSession",
      "workbench.panel.chat.view.ai-chat.focus"
    ];
  }
}

/**
 * WindsurfPromptHandler - 处理 Windsurf 编辑器（Cascade）
 */
class WindsurfPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return ['windsurf.prioritized.chat.openNewConversation'];
  }

  async handle() {
    for (let command of this.getPreCommandsToRun()) {
      await vscode_module.commands.executeCommand(command);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    await vscode_module.env.clipboard.writeText(this.prompt);
    vscode_module.window.showInformationMessage(
      "Prompt copied to clipboard. Paste it into Cascade to start the execution."
    );
  }
}

/**
 * AntigravityPromptHandler - 处理 Antigravity 编辑器
 */
class AntigravityPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return [
      'antigravity.prioritized.chat.open',
      'antigravity.prioritized.chat.openNewConversation'
    ];
  }
}
class BasePromptTemplate {
  constructor(_0xe85d2e) {
    this.prompt = _0xe85d2e;
  }
}



class CopyToClipboardHandler extends BasePromptTemplate {
  async ["handle"]() {
    await vscode_module.env.clipboard.writeText(this.prompt), vscode_module.window.showInformationMessage('Copied to clipboard');
  }
}


class ExportHandler extends BasePromptTemplate {
  constructor(_0x3d33b1, _0x2dcdb8) {
    super(_0x3d33b1), this.title = _0x2dcdb8;
  }
  ["getDefaultFilename"]() {
    let _0x3104f7 = this.title.replaceAll(' ', '-').toLocaleLowerCase() + '.' + this.getFileExtension(),
      _0x35e01e = WorkspaceInfoManager.getInstance().getWorkspaceDirs();
    return _0x35e01e.length > 0 ? path_module.join(_0x35e01e[0], _0x3104f7) : path_module.join(os_module.homedir(), _0x3104f7);
  }
  async ['getSaveUri'](_0x3b461c, _0x75b21f) {
    return await vscode_module.window.showSaveDialog({
      defaultUri: vscode_module.Uri.file(_0x3b461c),
      filters: _0x75b21f
    });
  }
  ['showSuccessMessage'](_0x33a647) {
    vscode_module.window.showInformationMessage('Export as ' + this.getType() + " completed successfully to " + _0x33a647);
  }
  ["showErrorMessage"](_0x529c74) {
    vscode_module.window.showErrorMessage('Failed to export as ' + this.getType() + ': ' + _0x529c74);
  }
  ["showCancelMessage"]() {
    vscode_module.window.showInformationMessage("Export as " + this.getType() + ' cancelled');
  }
  async ['handle']() {
    try {
      let _0x17c0ff = this.getDefaultFilename(),
        _0x21335f = this.getFileFilter(),
        _0x41d370 = await this.getSaveUri(_0x17c0ff, _0x21335f);
      if (!_0x41d370) {
        this.showCancelMessage();
        return;
      }
      await this.performExport(this.prompt, _0x41d370.fsPath);
      let _0x284b0d = path_module.basename(_0x41d370.fsPath) || "file";
      this.showSuccessMessage(_0x284b0d);
    } catch (_0x16fa56) {
      let _0x4de4b8 = _0x16fa56 instanceof Error ? _0x16fa56.message : 'Unknown error';
      this.showErrorMessage(_0x4de4b8);
    }
  }
};
class MarkdownExportHandler extends ExportHandler {
  ["getType"]() {
    return 'Markdown';
  }
  ["getFileExtension"]() {
    return 'md';
  }
  ['getFileFilter']() {
    return {
      'Markdown Files': ['md']
    };
  }
  async ['performExport'](_0x103353, _0x3ec67f) {
    await vscode_module.workspace.fs.writeFile(vscode_module.Uri.file(_0x3ec67f), Buffer.from(_0x103353, "utf8"));
  }
};

// CommonJS 导出
module.exports = {
  // 基础类
  ExtensionHelper,
  ExtensionTaskHandler,
  ClipboardPromptHandler,
  
  // ExtensionTaskHandler 子类
  ClineHandler,
  KiloCodeHandler,
  RooCodeHandler,
  
  // ClipboardPromptHandler 子类（需要扩展检测）
  AmpHandler,
  AugmentHandler,
  ClaudeCodeHandler,
  ChatGPTHandler,
  ZenCoderHandler,
  
  // ClipboardPromptHandler 子类（独立）
  CopilotPromptHandler,
  CursorPromptHandler,
  AugmentPromptHandler,
  WindsurfPromptHandler,
  AntigravityPromptHandler,
  MarkdownExportHandler,
  CopyToClipboardHandler,
  BasePromptTemplate,
};

