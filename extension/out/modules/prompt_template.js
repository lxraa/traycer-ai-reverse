const vscode_module = require("vscode");
const {EXTENSION_ID,SHOW_TEMPLATE_ERRORS_COMMAND } = require("./constants");
const {isWindows} = require("./config");
const path = require("path");
const { mkdir, writeFile } = require("fs/promises");
const grayMatter = require("gray-matter");
const Ajv = require("ajv");
const { WorkspaceInfoManager } = require("./workspace_info.js");

var PROMPT_ENV_VAR = "TRAYCER_PROMPT"

// Template Schemas
var baseTemplateSchema = {
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      description: "Display name for the template"
    }
  },
  required: [],
  additionalProperties: false
};

var fullTemplateSchema = {
  type: "object",
  properties: {
    ...baseTemplateSchema.properties,
    applicableFor: {
      type: 'string',
      enum: ['plan', 'verification', 'generic', "review", 'userQuery'],
      description: 'Specifies which type of content this template applies to'
    }
  },
  required: ['applicableFor', ...baseTemplateSchema.required],
  additionalProperties: false
};

// ============== TemplateFile 错误类 ==============

class TemplateFileNotFoundError extends Error {
  constructor(filePath) {
    super('Template file ' + filePath + " not found");
    this.name = "TemplateFileNotFoundError";
  }
}

class TemplateFileEmptyError extends Error {
  constructor() {
    super("File is empty");
    this.name = "TemplateFileEmptyError";
  }
}

class TemplateFileNotMarkdownError extends Error {
  constructor() {
    super("Only markdown (.md) files are supported");
    this.name = 'TemplateFileNotMarkdownError';
  }
}

class TemplateMissingMetadataError extends Error {
  constructor() {
    super('Missing metadata');
    this.name = 'TemplateMissingMetadataError';
  }
}

class TemplateInvalidMetadataError extends Error {
  constructor(message) {
    super("Invalid metadata" + (message ? ': ' + message : ''));
    this.name = 'TemplateInvalidMetadataError';
  }
}

class TemplateFileAlreadyExistsError extends Error {
  constructor(filePath) {
    super('Template file ' + filePath + " already exists");
    this.name = 'TemplateFileAlreadyExistsError';
  }
}

// ============== AJV 验证器单例 ==============

let ajvValidatorInstance = null;

function getAjvValidator() {
  if (!ajvValidatorInstance) {
    ajvValidatorInstance = new Ajv();
  }
  return ajvValidatorInstance;
}

// ============== TemplateFile 类 ==============

class TemplateFile {
  constructor(filePath, metadata, validationResult) {
    this._filePath = filePath;
    this._metadata = metadata;
    this._validationResult = validationResult;
  }

  get filePath() {
    return this._filePath;
  }

  get metadata() {
    return this._metadata;
  }

  get validationResult() {
    return this._validationResult;
  }

  async getContent() {
    let fileContent = await WorkspaceInfoManager.getInstance().readFile(this.filePath);
    return grayMatter(fileContent).content.replaceAll(/<!--[\s\S]*?-->\s*/g, '').trim();
  }

  async createOnDisk(content) {
    if (await WorkspaceInfoManager.getInstance().fileExists(this.filePath)) {
      throw new TemplateFileAlreadyExistsError(this.filePath);
    }
    
    let fileContent = grayMatter.stringify(content, this.metadata);
    
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, fileContent, { mode: 420 }); // 0o644 = 420
  }

  static async validateTemplateFile(filePath, schema) {
    if (!(await WorkspaceInfoManager.getInstance().fileExists(filePath))) {
      throw new TemplateFileNotFoundError(filePath);
    }

    if (path.extname(filePath).toLowerCase() !== '.md') {
      throw new TemplateFileNotMarkdownError();
    }

    let fileContent = await WorkspaceInfoManager.getInstance().readFile(filePath);
    
    if (!fileContent.length) {
      throw new TemplateFileEmptyError();
    }

    if (!grayMatter.test(fileContent)) {
      throw new TemplateMissingMetadataError();
    }

    let parsed = grayMatter(fileContent);
    
    let validator = getAjvValidator().compile(schema);
    if (!validator(parsed.data)) {
      let errorMessages = validator.errors?.map(error => {
        if (error.keyword === "enum" && error.params && "allowedValues" in error.params) {
          let allowedValues = error.params.allowedValues.join(', ');
          return ((error.instancePath ? error.instancePath.substring(1) : error.schemaPath) || "field") 
            + ' should be equal to one of the allowed values: ' + allowedValues;
        }
        return error.message;
      }).join(', ');
      
      throw new TemplateInvalidMetadataError(errorMessages);
    }

    return parsed.data;
  }
}

// ============== PromptTemplate 类 ==============

class PromptTemplate {
    constructor(_0x22652d, _0x437174, _0x91c128, _0x245cce, _0x295e30, _0x3b991f, _0x93dd4) {
      this.name = _0x22652d, this.filePath = _0x437174, this.content = _0x91c128, this.metadata = _0x245cce, this.scope = _0x295e30, this.fileExtension = _0x3b991f, this.isDefault = _0x93dd4, this.allowedFields = ["TRAYCER_PROMPT", "TRAYCER_PROMPT_TMP_FILE", "TRAYCER_PHASE_ID", "TRAYCER_TASK_ID", "TRAYCER_PHASE_BREAKDOWN_ID"], this._validationResult = {
        isValid: true,
        errors: []
      };
    }
    static {
      this.TEMPLATE_HEADER_COMMENT = 'CLI Agent Template';
    }
    static {
      this.AVAILABLE_TAGS_HEADER = 'Available environment variables:';
    }
    static {
      this.PROMPT_TAG_DESCRIPTION = 'The prompt to be executed (environment variable set by Traycer at runtime)';
    }
    static {
      this.TASK_CHAIN_ID_TAG_DESCRIPTION = 'Traycer task identifier - use this when you want to use the same session on the execution agent across phase iterations, plans, and verification execution';
    }
    static {
      this.PHASE_BREAKDOWN_ID_TAG_DESCRIPTION = "Traycer phase breakdown identifier - use this when you want to use the same session for the current list of phases";
    }
    static {
      this.PHASE_ID_TAG_DESCRIPTION = 'Traycer per phase identifier - use this when you want to use the same session for plan/review and verification';
    }
    static {
      this.PROMPT_TMP_FILE_TAG_DESCRIPTION = 'Temporary file path containing the prompt content - useful for large prompts that exceed environment variable limits. Use commands like `cat $TRAYCER_PROMPT_TMP_FILE` to read and pass the prompt content to the CLI agent at runtime.';
    }
    static ['buildShellCommentBlock']() {
      return '#!/bin/sh\x0a\x0a# ' + this.TEMPLATE_HEADER_COMMENT + "\n# " + this.AVAILABLE_TAGS_HEADER + "\n#   $TRAYCER_PROMPT - " + this.PROMPT_TAG_DESCRIPTION + "\n#   $TRAYCER_PROMPT_TMP_FILE - " + this.PROMPT_TMP_FILE_TAG_DESCRIPTION + '\x0a#        Example: cat $TRAYCER_PROMPT_TMP_FILE | CLI_AGENT_NAME\x0a#   $TRAYCER_TASK_ID - ' + this.TASK_CHAIN_ID_TAG_DESCRIPTION + "\n#   $TRAYCER_PHASE_BREAKDOWN_ID - " + this.PHASE_BREAKDOWN_ID_TAG_DESCRIPTION + '\x0a#   $TRAYCER_PHASE_ID - ' + this.PHASE_ID_TAG_DESCRIPTION;
    }
    static ["buildBatCommentBlock"]() {
      return "REM ================================\nREM " + this.TEMPLATE_HEADER_COMMENT + '\x0aREM ' + this.AVAILABLE_TAGS_HEADER + "\nREM   $env:TRAYCER_PROMPT - " + this.PROMPT_TAG_DESCRIPTION + '\x0aREM   $env:TRAYCER_PROMPT_TMP_FILE - ' + this.PROMPT_TMP_FILE_TAG_DESCRIPTION + '\x0aREM        Example: Get-Content -Raw $env:TRAYCER_PROMPT_TMP_FILE | CLI_AGENT_NAME\x0aREM   $env:TRAYCER_TASK_ID - ' + this.TASK_CHAIN_ID_TAG_DESCRIPTION + '\x0aREM   $env:TRAYCER_PHASE_BREAKDOWN_ID - ' + this.PHASE_BREAKDOWN_ID_TAG_DESCRIPTION + "\nREM   $env:TRAYCER_PHASE_ID - " + this.PHASE_ID_TAG_DESCRIPTION + '\x0aREM\x0aREM NOTE: This template uses PowerShell syntax ($env:) by default.\x0aREM\x0aREM For other terminals, clone this template and modify as follows:\x0aREM   Git Bash: $TRAYCER_PROMPT, $TRAYCER_PROMPT_TMP_FILE, $TRAYCER_TASK_ID, $TRAYCER_PHASE_BREAKDOWN_ID, $TRAYCER_PHASE_ID\x0aREM\x0aREM CMD is not supported at the moment.\x0aREM ================================';
    }
    static {
      this.DEFAULT_CLI_AGENTS_DIR_PATH = vscode_module.Uri.parse(EXTENSION_ID + ':/.traycer/default-cli-agents');
    }
    static {
      this.DEFAULT_SHELL_TEMPLATE_CONTENT = PromptTemplate.buildShellCommentBlock() + "\n\necho \"$TRAYCER_PROMPT\"\n";
    }
    static {
      this.DEFAULT_BAT_TEMPLATE_CONTENT = '\x0a' + PromptTemplate.buildBatCommentBlock() + "\n\necho \"$env:TRAYCER_PROMPT\"\n";
    }
    get ['validationResult']() {
      return this._validationResult;
    }
    static ["detectShellSyntaxFromContent"](_0x314072) {
      let _0x3456a7 = /\$env:TRAYCER_[A-Z_]+(?![A-Za-z0-9_])/i.test(_0x314072),
        _0x448218 = /\$(?:TRAYCER_[A-Z_]+(?![A-Za-z0-9_])|\{TRAYCER_[A-Z_]+\})/.test(_0x314072);
      if (_0x3456a7 && _0x448218) return 'mixed';
      if (_0x3456a7) return "powershell";
      if (_0x448218) return "bash";
    }
    static ["buildExpectedSyntaxMessage"](_0x2cae5b) {
      return _0x2cae5b === "mixed" ? 'Template uses mixed shell syntax. Include at least one prompt reference: $env:TRAYCER_PROMPT (PowerShell) or $TRAYCER_PROMPT (Bash) or $env:TRAYCER_PROMPT_TMP_FILE (PowerShell) or $TRAYCER_PROMPT_TMP_FILE (Bash)' : _0x2cae5b === "powershell" ? 'Template must contain at least one prompt reference using PowerShell syntax: $env:TRAYCER_PROMPT or $env:TRAYCER_PROMPT_TMP_FILE' : "Template must contain at least one prompt reference using Bash syntax: $TRAYCER_PROMPT or $TRAYCER_PROMPT_TMP_FILE";
    }
    ['validateTemplate']() {
      let _0x13526f = [],
        _0x5c85a8 = this.getContent(),
        _0x4c8c38 = PromptTemplate.detectShellSyntaxFromContent(_0x5c85a8),
        _0x5a00df = _0x409fba => {
          let _0x181702 = PromptTemplate.buildExpectedSyntaxMessage(_0x409fba);
          _0x13526f.push(_0x181702), this._validationResult.isValid = false, this._validationResult.errors = _0x13526f;
        };
      if (!_0x4c8c38) return _0x5a00df(isWindows ? 'powershell' : 'mixed');
      let _0x2e4a80 = false;
      if (this.fileExtension === ".sh") {
        let _0x18337a = new RegExp('\x5c$(?:TRAYCER_PROMPT_TMP_FILE(?![A-Za-z0-9_])|\x5c{TRAYCER_PROMPT_TMP_FILE\x5c})').test(_0x5c85a8);
        _0x2e4a80 = new RegExp("\\$(?:TRAYCER_PROMPT(?![A-Za-z0-9_])|\\{TRAYCER_PROMPT\\})").test(_0x5c85a8) || _0x18337a;
      } else {
        if (this.fileExtension === ".bat") {
          let _0x4bc814 = new RegExp('\x5c$env:TRAYCER_PROMPT_TMP_FILE(?![A-Za-z0-9_])', 'i').test(_0x5c85a8),
            _0x5099f5 = new RegExp("\\$(?:TRAYCER_PROMPT_TMP_FILE(?![A-Za-z0-9_])|\\{TRAYCER_PROMPT_TMP_FILE\\})").test(_0x5c85a8),
            _0x21c695 = new RegExp('\x5c$env:TRAYCER_PROMPT(?![A-Za-z0-9_])', 'i').test(_0x5c85a8),
            _0x47f45f = new RegExp("\\$(?:TRAYCER_PROMPT(?![A-Za-z0-9_])|\\{TRAYCER_PROMPT\\})").test(_0x5c85a8);
          _0x2e4a80 = _0x21c695 || _0x47f45f || _0x4bc814 || _0x5099f5;
        }
      }
      if (_0x2e4a80) this._validationResult.isValid = true, this._validationResult.errors = [];else {
        let _0x2e9103 = PromptTemplate.buildExpectedSyntaxMessage(_0x4c8c38);
        _0x13526f.push(_0x2e9103), this._validationResult.isValid = false, this._validationResult.errors = _0x13526f;
      }
    }
    ["getContent"]() {
      return this.fileExtension === '.sh' ? this.content.replace(/^\s*#.*\n?/gm, '').trim() : this.fileExtension === ".bat" ? this.content.replace(/^\s*REM.*\n?/gm, '').trim() : this.content;
    }
    ['serializeToUI']() {
      return {
        filePath: this.filePath,
        metadata: {
          displayName: this.name
        },
        scope: this.scope,
        fileExtension: this.fileExtension,
        validationResult: this.validationResult,
        isDefault: this.isDefault
      };
    }
  };



class SD{
    constructor(_0x20355d) {
      this._templateErrors = _0x20355d, this._onDidChangeCodeLenses = new vscode_module.EventEmitter();
    }
    set ["templateErrors"](_0x57b553) {
      this._templateErrors = _0x57b553, this.triggerCodeLensUpdate();
    }
    get ["templateErrors"]() {
      return this._templateErrors;
    }
    get ['onDidChangeCodeLenses']() {
      return this._onDidChangeCodeLenses.event;
    }
    ['triggerCodeLensUpdate']() {
      this._onDidChangeCodeLenses.fire();
    }
    ["reset"]() {
      this.templateErrors = new Map(), this._onDidChangeCodeLenses.fire();
    }
    ["provideCodeLenses"](_0x6bd548) {
      let _0x5cbf06 = this._templateErrors.get(_0x6bd548.uri.fsPath);
      if (!_0x5cbf06 || _0x5cbf06.length === 0) return [];
      let _0x5c1730 = [];
      if (_0x5cbf06.length === 1) _0x5c1730.push(this.createTemplateErrorCodeLens(_0x5cbf06[0], new vscode_module.Range(0, 0, 0, 0)));else {
        if (_0x5cbf06.length > 1) {
          let _0x5f410c = "Template Error: " + _0x5cbf06.length + " issue(s) — click to view";
          _0x5c1730.push(this.createTemplateErrorCodeLens(_0x5f410c, new vscode_module.Range(0, 0, 0, 0), _0x5cbf06));
        }
      }
      return _0x5c1730;
    }
    ['createTemplateErrorCodeLens'](_0x6df035, _0x393642, _0x3dd9ff) {
      let _0x1d0a51 = {
        title: _0x3dd9ff ? _0x6df035 : 'Template Error: ' + _0x6df035,
        command: SHOW_TEMPLATE_ERRORS_COMMAND,
        arguments: _0x3dd9ff ? [_0x3dd9ff] : [_0x6df035]
      };
      return new vscode_module.CodeLens(_0x393642, _0x1d0a51);
    }
    ['resolveCodeLens'](_0x21123b) {
      return _0x21123b;
    }
  };

  class TemplateErrorManager {
    static {
      this._templateErrors = new Map();
    }
    constructor() {}
    static ["init"]() {
      this.resetProvider();
    }
    ['dispose']() {
      TemplateErrorManager.dispose();
    }
    static ["dispose"]() {
      this._providerDisposable?.['dispose'](), this._providerDisposable = void 0, this._provider = null;
    }
    static ["addTemplateErrors"](_0x14513f, _0x39d1de) {
      this._templateErrors.set(_0x14513f.fsPath, _0x39d1de), this.resetProvider();
    }
    static ["removeTemplateErrors"](_0x4cb5d7) {
      this._templateErrors.delete(_0x4cb5d7.fsPath), this.resetProvider();
    }
    static ["getTemplateErrors"]() {
      return this._templateErrors;
    }
    static ['triggerTemplateCodeLensUpdate']() {
      this._provider?.['triggerCodeLensUpdate']();
    }
    static ['resetProvider']() {
      this._provider != null ? this._provider.templateErrors = this._templateErrors : (this._provider = new SD(this._templateErrors), this._providerDisposable = vscode_module.Disposable.from(vscode_module.languages.registerCodeLensProvider([{
        scheme: 'file',
        language: '*'
      }], this._provider))), this._provider?.['triggerCodeLensUpdate']();
    }
  };





  class T0{
    constructor(_0x58f7d4) {
      this.uriConverter = _0x58f7d4, this._emitter = new vscode_module.EventEmitter(), this.fileEntries = new Map(), this.onDidChangeFile = this._emitter.event;
    }
    ['watch']() {
      return new vscode_module.Disposable(() => {});
    }
    ["readFile"](_0x19d2b3) {
      let _0x4eb12a = this.uriConverter(_0x19d2b3),
        _0x51816a = this.fileEntries.get(_0x4eb12a.toString());
      if (_0x51816a === void 0) throw vscode_module.FileSystemError.FileNotFound();
      return Buffer.from(_0x51816a.content, "utf8");
    }
    ["upsertTrigger"](_0x4db288) {
      this._emitter.fire([{
        type: vscode_module.FileChangeType.Created,
        uri: this.uriConverter(_0x4db288)
      }]);
    }
    ["stat"]() {
      return {
        type: vscode_module.FileType.File,
        ctime: Date.now(),
        mtime: Date.now(),
        size: 0
      };
    }
    ['readDirectory']() {
      return [];
    }
    ['delete'](_0xb4b13a) {
      let _0x43b12c = this.uriConverter(_0xb4b13a);
      this.fileEntries.delete(_0x43b12c.toString()), this._emitter.fire([{
        type: vscode_module.FileChangeType.Deleted,
        uri: _0x43b12c
      }]);
    }
    ["updateIfExists"](_0x882585, _0xf56d9b) {
      let _0x2215c7 = this.uriConverter(_0x882585);
      this.fileEntries.has(_0x2215c7.toString()) && this.writeFile(_0x2215c7, Buffer.from(_0xf56d9b, 'utf8'));
    }
    ['rename']() {}
    ["createDirectory"]() {}
  };


class TraycerFileSystem extends T0 {
    static {
      this._instance = null;
    }
    constructor(_0x3ab98d) {
      super(_0x3ab98d);
    }
    static ["getInstance"]() {
      return TraycerFileSystem._instance || (TraycerFileSystem._instance = new TraycerFileSystem(_0x2df9dd => _0x2df9dd.with({
        scheme: EXTENSION_ID
      }))), TraycerFileSystem._instance;
    }
    ['createFile'](_0x3967ff, _0x9c0657) {
      let _0x362955 = this.uriConverter(_0x3967ff);
      this.fileEntries.set(_0x362955.toString(), {
        content: Buffer.from(_0x9c0657).toString('utf8')
      }), this._emitter.fire([{
        type: vscode_module.FileChangeType.Created,
        uri: _0x362955
      }]);
    }
    ['writeFile'](_0x33d79b, _0x478034) {
      let _0x1b60c8 = this.uriConverter(_0x33d79b);
      this.fileEntries.has(_0x1b60c8.toString()) && (this.fileEntries.set(_0x1b60c8.toString(), {
        content: Buffer.from(_0x478034).toString('utf8')
      }), this._emitter.fire([{
        type: vscode_module.FileChangeType.Changed,
        uri: _0x1b60c8
      }]));
    }
  };



module.exports = {
    PromptTemplate,
    PROMPT_ENV_VAR,
    TraycerFileSystem,
    TemplateErrorManager,
    T0,
    baseTemplateSchema,
    fullTemplateSchema,
    TemplateFile,
    TemplateFileNotFoundError,
    TemplateFileEmptyError,
    TemplateFileNotMarkdownError,
    TemplateMissingMetadataError,
    TemplateInvalidMetadataError,
    TemplateFileAlreadyExistsError,
    getAjvValidator
};