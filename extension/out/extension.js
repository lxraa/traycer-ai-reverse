'use strict';

// ============== 导入区开始====================================
const vscode_module = require("vscode");
const grpc_module = require("@grpc/grpc-js");
const diff_match_patch_module = require("diff-match-patch");
const retry_module = require("retry");
/* [unbundle] ignore_module 已移至 config.js */
const sqlite3_module = require("sqlite3");
// const sqlite_module = require("sqlite");
const lru_map_module = require("lru_map");
const posthog_module = require("posthog-js-lite");
const lodash_module = require("lodash");
const ajv_module = require("ajv");
const gray_matter_module = require("gray-matter");
const google_auth_module = require("google-auth-library");
const fuzzysort_module = require("fuzzysort");
const tree_sitter_module = require("web-tree-sitter");
const proto_loader_module = require("@grpc/proto-loader");
const semver_module = require("semver");
const markdown_it_module = require("markdown-it");
const uuid_module = require("uuid");
const events_module = require("events");
const stream_module = require("stream");
const sqlite_module = require("sqlite");
const chokidar_module = require("chokidar");
const p_retry_module = require("p-retry")
const { PromptTemplate,PROMPT_ENV_VAR ,TraycerFileSystem,TemplateErrorManager,T0} = require("./modules/prompt_template.js")
const path_module = {
  default: require("path"),
  ...require("path")
};
const fs_promises_module = require("fs/promises");
const os_module = {
  default: require("os"),
  ...require("os")
};
const child_process_module = require("child_process");
const util_module = require("util");
const crypto_module = {
  default: require("node:crypto"),
  ...require("node:crypto")
};
const config_module = require("./modules/config.js");

// �?config_module 导入 ripgrep 配置和语言相关函数
const {
  isWindows,
  MAX_SEARCH_RESULTS,
  DEFAULT_RG_ARGS,
  resolveRipgrepPath,
  parseLanguagePreference
} = config_module;
const {
  prismaClient
} = require("./modules/prisma.js");
const {
  RipgrepCommandBuilder,
  RipgrepExecutor
} = require("./modules/ripgrep.js");
const {
  parseMarkdownToDoc
} = require("./modules/markdown-parser.js");
const {
  Logger,
  initializeSentryClient,
  captureExceptionToSentry,
  setSentryTag,
  closeSentryClient,
  getSentryInstance
} = require("./modules/logger.js");
const {
  RequestQueue
} = require("./modules/request_queue.js");
const {
  LatestRequestLimiter
} = require("./modules/latest_request_limiter.js");
const {
  Semaphore,
  Mutex
} = require("./modules/mutex.js");
const {
  commandRegistry
} = require("./modules/command_registry.js");
const {
  MediaFileSystem
} = require("./modules/media_file_system.js");
const {
  SqliteService,
  SummaryCacheService
} = require("./modules/sqlite_service.js");
const {
  WorkspaceMigrator,
  TaskMigratorV10,
  TaskMigratorV11,
  TaskMigratorV12,
  TaskMigratorV13,
  TaskMigratorV14,
  TaskMigratorV15
} = require("./modules/task_migrators.js");
const {
  EditableFileSystem
} = require("./modules/editable_file_system.js");
const {
  SqliteMigrator,
  MementoKey,
  MementoToTableMapping
} = require("./modules/storage_migrator.js");
const {
  FileSystemWatcher
} = require("./modules/file_system_watcher.js");
const {
  YoloArtifactManager,
  injectYoloArtifactManagerHelpers
} = require("./modules/yolo_artifact_manager.js");
const {
  TICKET_SOURCE,
  formatPathForDisplay,
  formatTicketReferenceDisplay,
  getGitHubIssueUrl,
  GitHubTicketQueryBuilder
} = require("./modules/github_ticket_query_builder.js");
const {
  PlatformType: xr,
  FilePath,
  TraycerPath
} = require("./modules/path_types.js");

// [unbundle] 声明辅助函数，稍后在主文件中定义后，需要注入到 WorkspaceMigrator
// extractWorkspacePathsFromPhases 依赖主文件中的 extractFilesFromPhaseBreakdowns、CustomSet、TraycerPath 等
// 因此保留在主文件中，并在定义后注入到 WorkspaceMigrator

// ============== 从外部模块导入运行时辅助函数 ==============
var {
  __esmModule,
  __export,
  __toESM,
  __toCommonJS
} = require('./modules/shared-env.js');

// ============== 从外部模块导入常量 ==============
var {
  cte,
  Hk,
  nq,
  RS,
  OPEN_SETTINGS_COMMAND,
  AUTH_CALLBACK_COMMAND,
  START_NEW_TASK_COMMAND,
  OPEN_TASK_HISTORY_COMMAND,
  LIST_MCP_SERVERS_COMMAND,
  MANAGE_PROMPT_TEMPLATES_COMMAND,
  MANAGE_CLI_AGENTS_COMMAND,
  TRIGGER_MANUAL_ANALYSIS_FILE_COMMAND,
  TRIGGER_MANUAL_ANALYSIS_CHANGES_COMMAND,
  TRIGGER_MANUAL_ANALYSIS_ALL_CHANGES_COMMAND,
  SHOW_TEMPLATE_ERRORS_COMMAND,
  COMMAND_IDS,
  MEDIA_VIEW_ID,
  EXTENSION_ID,
  EDITABLE_DIFF_VIEW_ID,
  COMMENT_NAVIGATOR_WEBVIEW_ID,
  ACCESS_TOKEN_KEY,
  AUTH_TOKEN_KEY,
  LAST_SELECTED_IDE_AGENT_KEY,
  StorageKey
} = require('./modules/constants.js');
const {
  ex
} = require("./modules/workerpool.js");

// ============== 导入区结束====================================
var prisma = __toESM(prismaClient(), 1);
var config = config_module.config; // 使用 config 模块导出的单例

resolveRipgrepPath().catch(() => Logger.error("Failed to resolve ripgrep binary path"));
var HttpStatusError = class extends Error {
    ["statusCode"];
    constructor(errorMessage, statusCodeValue) {
      super(errorMessage), this.statusCode = statusCodeValue;
    }
  },
  ChunkingError = class extends HttpStatusError {
    constructor(errorMessage) {
      super(errorMessage, 400), this.name = 'ChunkingError';
    }
  },
  NoFuzzyMatchError = class extends Error {
    constructor(errorMessage = 'No match found in fuzzy search') {
      super(errorMessage), this.name = "NoFuzzyMatchError";
    }
  },
  QueueClosedError = class extends Error {
    ['name'] = "QueueClosedError";
    constructor(errorMessage = "Queue is closed") {
      super(errorMessage);
    }
  },
  SBe = "Attached image is not supported.",
  wBe = Array.from(Hk.keys()).join(', '),
  UnsupportedImageTypeError = class extends Error {
    constructor(imageType) {
      super(SBe + ' ' + imageType + ". Supported types are " + wBe + '.'), this.name = 'UnsupportedImageTypeError';
    }
  },
  UserAbortedError = class extends Error {
    constructor(abortMessage = "User aborted") {
      super(abortMessage), this.name = 'UserAbortedError';
    }
  },
  Ate = "RequestAbortedError",
  RequestAbortedError = class extends Error {
    ["reason"];
    constructor(abortReason) {
      super('Request aborted: ' + abortReason), this.reason = abortReason, this.name = Ate;
    }
    static ['matches'](errorToCheck) {
      return errorToCheck instanceof Error && errorToCheck.name === Ate;
    }
  },
  bu = {
    USER_ABORT: 0,
    PING_WRITE_FAILURE: 1,
    PING_TIMEOUT: 2,
    EXTENSION_CLOSED: 3
  },
  $c = {
    ISSUE: 0,
    STORY: 1,
    EPIC: 2
  },
  tv = {
    MINOR: 0,
    MAJOR: 1,
    CRITICAL: 2
  };
  /* [unbundle] Ht, r9e 已移至 config.js */
  /* [unbundle] yo (TICKET_SOURCE) 已移至 github_ticket_query_builder.js */
function ensureBuffer(inputData) {
  if (Buffer.isBuffer(inputData)) return inputData;
  if (inputData instanceof Uint8Array) return Buffer.from(inputData);
  if (inputData && typeof inputData == "object") {
    let objData = inputData;
    if (objData.type === "Buffer" && Array.isArray(objData.data)) return Buffer.from(objData.data);
    let objKeys = Object.keys(objData);
    if (objKeys.length > 0 && objKeys.every(keyItem => /^\d+$/.test(keyItem)) && objKeys.map(Number).sort((numA, numB) => numA - numB).every((numVal, indexVal) => numVal === indexVal)) {
      let byteArray = new Uint8Array(objKeys.length);
      for (let loopIndex = 0; loopIndex < objKeys.length; loopIndex++) byteArray[loopIndex] = objData[loopIndex];
      return Buffer.from(byteArray);
    }
  }
  return Buffer.from(inputData);
}
class CustomSet {
  ['items'] = [];
  ["equals"];
  constructor(equalsFn, initialItems) {
    if (this.equals = equalsFn, this.items = [], initialItems && initialItems.length > 0) {
      for (let key of initialItems) this.add(key);
    }
  }
  ["add"](_0x30372c) {
    this.has(_0x30372c) || this.items.push(_0x30372c);
  }
  ['has'](_0xc781ff) {
    return this.items.some(_0xeba538 => this.equals(_0xeba538, _0xc781ff));
  }
  ["values"]() {
    return [...this.items];
  }
  ['union'](otherSet) {
    let resultSet = new CustomSet(this.equals);
    return this.values().forEach(thisItem => resultSet.add(thisItem)), otherSet.values().forEach(otherItem => resultSet.add(otherItem)), resultSet;
  }
  ['intersection'](otherSet) {
    let resultSet = new CustomSet(this.equals);
    return this.values().forEach(itemToCheck => {
      otherSet.has(itemToCheck) && resultSet.add(itemToCheck);
    }), resultSet;
  }
  ['difference'](otherSet) {
    let resultSet = new CustomSet(this.equals);
    return this.values().forEach(itemToCheck => {
      otherSet.has(itemToCheck) || resultSet.add(itemToCheck);
    }), resultSet;
  }
  ['isSubsetOf'](superSet) {
    return this.values().every(itemToCheck => superSet.has(itemToCheck));
  }
  ['clear']() {
    this.items = [];
  }
  get ["size"]() {
    return this.items.length;
  }
}
class LineRange {
  ["startLine"];
  ['count'];
  constructor(startLineNum, lineCount) {
    this.startLine = startLineNum, this.count = lineCount;
  }
  get ['endLine']() {
    return this.startLine + this.count - 1;
  }
  get ["startLineOneBased"]() {
    return this.startLine + 1;
  }
  get ['endLineOneBased']() {
    return this.endLine + 1;
  }
  get ["rangeOutput"]() {
    return {
      startLine: this.startLineOneBased,
      count: this.count
    };
  }
  ['equals'](otherRange) {
    return this.startLine === otherRange.startLine && this.count === otherRange.count;
  }
  ["doesIntersect"](otherRange) {
    return this.startLine <= otherRange.endLine && otherRange.startLine <= this.endLine;
  }
  ["union"](otherRange) {
    return LineRange.fromEndLine(Math.min(this.startLine, otherRange.startLine), Math.max(this.endLine, otherRange.endLine));
  }
  static ["fromCount"](startLineNum, lineCount) {
    return new LineRange(startLineNum, lineCount);
  }
  static ["fromEndLine"](_0xa19a67, _0x37cf22) {
    return new LineRange(_0xa19a67, _0x37cf22 - _0xa19a67 + 1);
  }
  static ["fromRangeOutput"](_0x42e23a) {
    return new LineRange(_0x42e23a.startLine - 1, _0x42e23a.count);
  }
  static ['fromOneBased'](_0x131f4b, _0x40dc3d) {
    return LineRange.fromEndLine(_0x131f4b - 1, _0x40dc3d - 1);
  }
  static ["fromOneBasedCount"](_0x3c01f2, _0x5d0fdf) {
    return LineRange.fromCount(_0x3c01f2 - 1, _0x5d0fdf);
  }
}

/* [unbundle] diff-match-patch 已移至顶部导入区 */
function createCodeSnippetFromRange(_0x3d9552, _0x24123c, _0x309720, _0x2b83a8) {
  let _0x352f6c = FileContent.fromFile(_0x24123c),
    _0x3267d9 = _0x309720.line,
    _0x596fe5 = _0x2b83a8.line;
  _0x309720.context && (_0x3267d9 = Math.max(0, _0x309720.line - _0x309720.context)), _0x2b83a8.context && (_0x596fe5 = Math.min(_0x352f6c.length - 1, _0x2b83a8.line + _0x2b83a8.context));
  let _0x5b19be = LineRange.fromEndLine(_0x3267d9, _0x596fe5);
  return {
    path: _0x3d9552,
    content: _0x352f6c.getContent(),
    range: _0x5b19be.rangeOutput,
    diagnostics: []
  };
}
function mergeOverlappingRanges(_0x3f9a56, _0x443e05, _0x2d2477, _0x239576) {
  if (_0x3f9a56.length === 0) return [];
  _0x3f9a56.sort((_0x42a602, _0x1e8f06) => _0x443e05(_0x42a602).startLine - _0x443e05(_0x1e8f06).startLine);
  let _0x339bff = [],
    _0x5863c7 = _0x3f9a56[0],
    _0x1dcb38 = _0x443e05(_0x5863c7);
  for (let _0x4b92d0 = 1; _0x4b92d0 < _0x3f9a56.length; _0x4b92d0++) {
    let _0x43bd17 = _0x3f9a56[_0x4b92d0],
      _0x4e2f87 = _0x443e05(_0x43bd17),
      _0x42e5e2 = _0x1dcb38.startLine + _0x1dcb38.count - 1,
      _0x333b25 = _0x4e2f87.startLine === _0x42e5e2 + 1;
    _0x4e2f87.startLine <= _0x42e5e2 || _0x239576 && _0x333b25 ? (_0x5863c7 = _0x2d2477(_0x5863c7, _0x43bd17), _0x1dcb38 = _0x443e05(_0x5863c7)) : (_0x339bff.push(_0x5863c7), _0x5863c7 = _0x43bd17, _0x1dcb38 = _0x4e2f87);
  }
  return _0x339bff.push(_0x5863c7), _0x339bff;
}
function mergeOverlappingLineRanges(_0x46b414, _0x3e8896 = false) {
  return mergeOverlappingRanges(_0x46b414, _0x53a1d6 => _0x53a1d6, (_0x21121c, _0x6d0324) => {
    let _0xa876e1 = Math.max(_0x21121c.endLine, _0x6d0324.endLine);
    return _0x21121c.count = _0xa876e1 - _0x21121c.startLine + 1, _0x21121c;
  }, _0x3e8896);
}
function getLineByNumber(_0x433b9e, _0x3c9178) {
  let _0x352f0e = _0x433b9e.split('\x0a');
  if (_0x3c9178 < 0 || _0x3c9178 >= _0x352f0e.length) throw new Error('Line number out of bounds');
  return _0x352f0e[_0x3c9178];
}
function fuzzyFindTextInDocument(_0x5d65a3, _0x44d627, _0x304c53) {
  let _0x5a8549 = new diff_match_patch_module();
  return _0x5a8549.Match_Distance = 5000, _0x5a8549.Match_Threshold = 0.1, findTextInDocument(_0x5d65a3, _0x44d627, _0x304c53, _0x5a8549);
}
function findFuzzyTextPosition(_0x5324c8, _0x2b2ebe, _0x2a9906, _0x412a06) {
  let _0x28de44 = fuzzyFindTextInDocument(_0x5324c8, _0x2b2ebe, _0x2a9906),
    _0x1fbb0d = getLineByNumber(_0x5324c8, _0x28de44.startLine),
    _0x2ed7ad = findTokenPositionInLine(_0x1fbb0d, _0x412a06);
  return {
    lineNumber: _0x28de44.startLine,
    character: _0x2ed7ad
  };
}
function findTextInDocument(_0x56e703, _0xfbf152, _0x4fc112, _0x594165, _0x439e5f = false) {
  if (isWhitespaceOnly(_0x4fc112) || isWhitespaceOnly(_0x56e703) || _0xfbf152 < 0) throw new NoFuzzyMatchError();
  let _0x5db09c = getCharOffsetForLine(_0x56e703, _0xfbf152);
  if (_0x439e5f) {
    let _0x232898 = reverseString(_0x56e703),
      _0x25869d = reverseString(_0x4fc112),
      _0x1fd738 = calculateSafeOffset(_0x56e703.length, _0x5db09c + _0x4fc112.length - 1),
      _0x27311d = fuzzyMatchText(_0x232898, _0x25869d, _0x1fd738, _0x594165);
    if (_0x27311d === -1) throw new NoFuzzyMatchError();
    let _0x2e88ca = calculateSafeOffset(_0x56e703.length, _0x27311d);
    return LineRange.fromEndLine(0, getLineNumberAtOffset(_0x56e703, _0x2e88ca));
  } else {
    let _0x732008 = fuzzyMatchText(_0x56e703, _0x4fc112, _0x5db09c, _0x594165);
    if (_0x732008 === -1) throw new NoFuzzyMatchError();
    return LineRange.fromCount(getLineNumberAtOffset(_0x56e703, _0x732008), 0);
  }
}
function fuzzyMatchText(_0x15f632, _0x240a2e, _0x4cccc3, _0x44ca18) {
  let _0x576c7b = _0x240a2e;
  _0x240a2e.length > _0x44ca18.Match_MaxBits && (_0x576c7b = _0x240a2e.substring(0, _0x44ca18.Match_MaxBits));
  let _0x229f48 = -1;
  try {
    _0x229f48 = _0x44ca18.match_main(_0x15f632, _0x576c7b, _0x4cccc3);
  } catch {
    return -1;
  }
  return _0x229f48;
}
function getLineNumberAtOffset(_0x1a315a, _0x2aa510) {
  let _0x55f3a7 = _0x1a315a.lastIndexOf('\x0a', _0x2aa510) + 1;
  return (_0x1a315a.substring(0, _0x55f3a7).match(/\n/g) || []).length;
}
function findTokenPositionInLine(_0xf911b0, _0x49d6d3) {
  let _0x13d886 = new RegExp('\x5cb' + _0x49d6d3 + '\x5cb'),
    _0xedeefd = _0xf911b0.match(_0x13d886);
  if (!_0xedeefd || _0xedeefd.index === void 0) throw new NoFuzzyMatchError("Token " + _0x49d6d3 + ' not found in line ' + _0xf911b0);
  return _0xedeefd.index;
}
function getCharOffsetForLine(_0x50b4a4, _0x4e6e40) {
  let _0x3416d2 = 0,
    _0x300257 = 0;
  for (let _0x4fd11c = 0; _0x4fd11c < _0x50b4a4.length && _0x300257 < _0x4e6e40; _0x4fd11c++) if (_0x50b4a4.charAt(_0x4fd11c) === '\x0a') {
    if (_0x300257++, _0x4fd11c === _0x50b4a4.length - 1) break;
    _0x3416d2 = _0x4fd11c + 1;
  }
  return _0x3416d2;
}
function isWhitespaceOnly(_0x426dfb) {
  for (let _0x383a13 = 0; _0x383a13 < _0x426dfb.length; _0x383a13++) {
    let _0xd8adc6 = _0x426dfb[_0x383a13];
    if (!/\s/.test(_0xd8adc6)) return false;
  }
  return true;
}
function calculateSafeOffset(_0x2bd8a6, _0x2c5776) {
  let _0x2d32fe = _0x2bd8a6 - _0x2c5776 - 1;
  return _0x2d32fe < 0 ? 0 : _0x2d32fe > _0x2bd8a6 - 1 ? _0x2bd8a6 - 1 : _0x2d32fe;
}
function reverseString(_0x1677f0) {
  return _0x1677f0.split('').reverse().join('');
}
function isValidAgentType(agentType) {
  return Object.keys(wm).includes(agentType);
}
function getAgentIconByDisplayName(displayName) {
  for (let [agentKey, agentInfo] of Object.entries(wm)) if (agentInfo.displayName === displayName) return getAgentIcon(agentKey);
  return null;
}
function getAgentIcon(agentType) {
  return Object.keys(wm).includes(agentType) ? wm[agentType] : wm.copy;
}
function isUtilityAgent(agentObj) {
  return agentObj.type === "utility";
}
function isTerminalAgent(agentObj) {
  return agentObj.type === "terminal";
}
var wm = Object.freeze({
  'claude-code': Object.freeze({
    id: "claude-code",
    type: "terminal",
    displayName: "Claude Code CLI",
    source: "builtin"
  }),
  gemini: Object.freeze({
    id: 'gemini',
    type: "terminal",
    displayName: "Gemini CLI",
    source: 'builtin'
  }),
  codex: Object.freeze({
    id: "codex",
    type: "terminal",
    displayName: 'Codex CLI',
    source: 'builtin'
  }),
  cursor: Object.freeze({
    id: 'cursor',
    type: 'ide',
    displayName: "Cursor",
    source: "builtin"
  }),
  visualstudiocode: Object.freeze({
    id: 'visualstudiocode',
    type: 'ide',
    displayName: 'VS Code',
    source: "builtin"
  }),
  'visualstudiocode-insiders': Object.freeze({
    id: 'visualstudiocode-insiders',
    type: "ide",
    displayName: "VS Code Insiders",
    source: 'builtin'
  }),
  'code-server': Object.freeze({
    id: 'code-server',
    type: "ide",
    displayName: 'Code Server',
    source: "builtin"
  }),
  windsurf: Object.freeze({
    id: 'windsurf',
    type: "ide",
    displayName: 'Windsurf',
    source: 'builtin'
  }),
  trae: Object.freeze({
    id: "trae",
    type: "ide",
    displayName: "Trae",
    source: 'builtin'
  }),
  augment: Object.freeze({
    id: 'augment',
    type: "ide",
    displayName: "Augment",
    source: 'builtin'
  }),
  antigravity: Object.freeze({
    id: "antigravity",
    type: "ide",
    displayName: "Antigravity",
    source: "builtin"
  }),
  'kilo-code': Object.freeze({
    id: "kilo-code",
    type: "extension",
    displayName: "Kilo Code",
    source: 'builtin'
  }),
  'roo-code': Object.freeze({
    id: "roo-code",
    type: 'extension',
    displayName: 'Roo Code',
    source: 'builtin'
  }),
  cline: Object.freeze({
    id: "cline",
    type: "extension",
    displayName: "Cline",
    source: "builtin"
  }),
  copy: Object.freeze({
    id: 'copy',
    type: 'utility',
    displayName: "Copy",
    source: 'builtin'
  }),
  'markdown-export': Object.freeze({
    id: "markdown-export",
    type: "utility",
    displayName: 'Export as Markdown',
    source: "builtin"
  }),
  'claude-code-extension': Object.freeze({
    id: "claude-code-extension",
    type: "extension",
    displayName: 'Claude Code Extension',
    source: 'builtin'
  }),
  'codex-extension': Object.freeze({
    id: "codex-extension",
    type: "extension",
    displayName: 'Codex Extension',
    source: 'builtin'
  }),
  zencoder: Object.freeze({
    id: "zencoder",
    type: 'extension',
    displayName: 'ZenCoder',
    source: "builtin"
  }),
  amp: Object.freeze({
    id: 'amp',
    type: "extension",
    displayName: "Amp",
    source: 'builtin'
  })
});
var FileContent = class _0x27d9ac {
    ["_lines"];
    constructor(_0x3743aa) {
      this._lines = _0x3743aa;
    }
    get ['lines']() {
      return this._lines;
    }
    ['getLines'](_0x19cec2, _0x4c789a = oie) {
      if (!_0x19cec2) return this._lines;
      if (_0x19cec2.startLine < 0 || _0x19cec2.endLine >= this._lines.length) throw _0x4c789a('Line range: (' + _0x19cec2.startLine + ', ' + _0x19cec2.endLine + ") is out of bounds for file with " + this._lines.length + " lines");
      return this._lines.slice(_0x19cec2.startLine, _0x19cec2.endLine + 1);
    }
    ["getContent"](_0x3a4d91, _0x4c3743 = oie) {
      return _0x3a4d91 ? this.getLines(_0x3a4d91, _0x4c3743).join('\x0a') : this._lines.join('\x0a');
    }
    get ['length']() {
      return this._lines.length;
    }
    ['replaceMultiple'](_0x41b83f) {
      _0x41b83f.sort((_0x4cbade, _0x1f3ada) => _0x4cbade.lineRange.startLine - _0x1f3ada.lineRange.startLine), this.detectOverlapping(_0x41b83f);
      let _0xc9e607 = 0;
      for (let {
        replacementLines: _0x2622d6,
        lineRange: _0x361b27
      } of _0x41b83f) {
        let _0x53b844 = _0x361b27.startLine + _0xc9e607,
          _0x20e666 = _0x361b27.count;
        this._lines.splice(_0x53b844, _0x20e666, ..._0x2622d6), _0xc9e607 += _0x2622d6.length - _0x20e666;
      }
    }
    ["searchWord"](_0x233b9a) {
      let _0x42b161 = [];
      for (let [_0x4b27a3, _0x29f05c] of this.lines.entries()) new RegExp('\x5cb' + _0x233b9a + '\x5cb').test(_0x29f05c) && _0x42b161.push({
        text: _0x29f05c,
        line: _0x4b27a3
      });
      return _0x42b161;
    }
    ['detectOverlapping'](_0x23766c) {
      for (let _0x53dccc = 1; _0x53dccc < _0x23766c.length; _0x53dccc++) {
        let _0x150cb2 = _0x23766c[_0x53dccc - 1].lineRange,
          _0x119743 = _0x23766c[_0x53dccc].lineRange;
        if (_0x150cb2.endLine >= _0x119743.startLine) throw new Error('Overlapping replacements detected: ' + JSON.stringify(_0x150cb2) + ' and ' + JSON.stringify(_0x119743));
      }
    }
    static ['fromFile'](_0x4cae84) {
      return new _0x27d9ac(_0x4cae84.split('\x0a'));
    }
    static ["fromLines"](_0x23c94b) {
      return new _0x27d9ac(_0x23c94b);
    }
  },
  oie = _0x472706 => new Error(_0x472706);
function parseGitHubUrl(_0xb5cb1d) {
  let _0x1139a0 = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?=\.git|\/?$)(?:\.git)?\/?$/,
    _0xe68749 = /^git@github\.com:([^/]+)\/([^/]+?)(?=\.git|\/?$)(?:\.git)?\/?$/;
  _0xb5cb1d = _0xb5cb1d.trim();
  let _0x24dac3 = _0xb5cb1d.match(_0x1139a0);
  return _0x24dac3 || (_0x24dac3 = _0xb5cb1d.match(_0xe68749)), _0x24dac3 ? {
    owner: _0x24dac3[1],
    name: _0x24dac3[2]
  } : null;
}
function distributeItemsAcrossGroups(_0x31e5e1, _0x41e53d, _0xaf935 = 50) {
  let _0x2de324 = new Map(),
    _0x2e681b = _0x97b73d => _0x2de324.get(_0x97b73d) ?? [],
    _0x5b4dff = new Set(_0x41e53d.map(_0x30516e => _0x31e5e1(_0x30516e.path))).size,
    _0x470525 = _0x5b4dff > 0 ? Math.ceil(_0xaf935 / _0x5b4dff) : 0,
    _0x565f7b = 0;
  for (let key of _0x41e53d) {
    if (_0x565f7b >= _0xaf935) break;
    let _0x41a617 = _0x31e5e1(key.path);
    if (Math.min(_0x470525 - _0x2e681b(_0x41a617).length, _0xaf935 - _0x565f7b) > 0) {
      let _0x591546 = _0x2e681b(_0x41a617);
      _0x2de324.set(_0x41a617, _0x591546.concat(key)), _0x565f7b += 1;
    }
  }
  return Array.from(_0x2de324.values()).flat();
}
function createUuid(_0x48d9d4, _0x47d03e, _0x1e5614) {
  if (_0x47d03e) switch (_0x47d03e) {
    case prisma.SubscriptionStatus.FREE:
    case prisma.SubscriptionStatus.PENDING:
      return 'Free';
    case prisma.SubscriptionStatus.PRO:
      return formatPlanName(_0x48d9d4, "Pro (Legacy)", _0x1e5614);
    case prisma.SubscriptionStatus.PRO_PLUS:
      return formatPlanName(_0x48d9d4, "Pro+ (Legacy)", _0x1e5614);
    case prisma.SubscriptionStatus.LITE:
      return formatPlanName(_0x48d9d4, "Lite (Legacy)", _0x1e5614);
    case prisma.SubscriptionStatus.LITE_V2:
      return formatPlanName(_0x48d9d4, 'Lite', _0x1e5614);
    case prisma.SubscriptionStatus.PRO_V2:
      return formatPlanName(_0x48d9d4, 'Pro', _0x1e5614);
    case prisma.SubscriptionStatus.PRO_PLUS_V2:
      return formatPlanName(_0x48d9d4, 'Pro+', _0x1e5614);
    case prisma.SubscriptionStatus.PRO_LEGACY:
      return formatPlanName(_0x48d9d4, "Pro (Legacy)", _0x1e5614);
    default:
      throw new Error("Invalid subscription status: " + _0x47d03e);
  } else return 'Free';
}
function formatPlanName(_0x2aa6c9, _0x497a89, _0x4ce2d4) {
  let _0x1ca706 = _0x2aa6c9 ? _0x497a89 : 'Business ' + _0x497a89;
  return _0x4ce2d4 ? _0x1ca706 + ' (Trial)' : _0x1ca706;
}
function parseUserQueryContent(_0x4e3d49, _0x2960d1) {
  let _0x50343a = {
      userQuery: '',
      userQueryWithMentions: '',
      sourceContext: {
        files: [],
        directories: [],
        detectedRuleFiles: [],
        ticketReference: null,
        attachments: [],
        gitDiffs: []
      },
      githubTicketRef: null,
      attachments: [],
      gitMentions: []
    },
    _0x66f191 = [];
  function _0x54fb15(_0x5e69bc) {
    if (_0x5e69bc.type === 'paragraph') {
      let _0x78978b = _0x50343a.userQuery.endsWith('\x0a') && _0x50343a.userQueryWithMentions.endsWith('\x0a');
      _0x50343a.userQuery.length > 0 && !_0x78978b && (_0x50343a.userQuery += '\x0a', _0x50343a.userQueryWithMentions += '\x0a'), _0x5e69bc.content && _0x5e69bc.content.forEach(_0x54fb15), _0x50343a.userQuery += '\x0a', _0x50343a.userQueryWithMentions += '\x0a';
      return;
    }
    if (_0x5e69bc.type === "text" && _0x5e69bc.text && (_0x50343a.userQuery += _0x5e69bc.text, _0x50343a.userQueryWithMentions += _0x5e69bc.text), _0x5e69bc.type === "hardBreak" && (_0x50343a.userQuery += '\x0a', _0x50343a.userQueryWithMentions += '\x0a'), _0x5e69bc.type === 'blockquote') {
      let _0x2a7f29 = [];
      _0x5e69bc.content && _0x5e69bc.content.forEach(_0x240971 => {
        let _0x1f5b50 = '',
          _0x4a5067 = _0x26a6fd => {
            _0x26a6fd.type === "text" && _0x26a6fd.text ? _0x1f5b50 += _0x26a6fd.text : _0x26a6fd.content && _0x26a6fd.content.forEach(_0x4a5067);
          };
        _0x4a5067(_0x240971), _0x2a7f29.push(_0x1f5b50);
      });
      let _0x37455c = _0x2a7f29.join('\x0a');
      _0x50343a.userQuery += '\x0a<user_quoted_section>' + _0x37455c + '</user_quoted_section>\x0a', _0x50343a.userQueryWithMentions += _0x37455c;
      return;
    }
    if (_0x5e69bc.type === "mention" && _0x5e69bc.attrs) {
      let _0x2a66a7, _0x527c1a;
      switch (_0x5e69bc.attrs.contextType) {
        case 'file':
        case "folder":
          {
            _0x2a66a7 = {
              absolutePath: _0x5e69bc.attrs.id,
              isDirectory: _0x5e69bc.attrs.contextType === "folder"
            }, _0x527c1a = FilePath.getAbsolutePath(_0x2a66a7, _0x2960d1), _0x50343a.userQuery += '`' + _0x527c1a + '`', _0x66f191.push({
              filename: '@' + (_0x5e69bc.attrs.label ?? _0x5e69bc.attrs.id),
              fullPath: '`' + _0x527c1a + '`'
            }), _0x5e69bc.attrs.contextType === 'file' ? (_0x50343a.sourceContext.files?.['push']({
              path: _0x2a66a7,
              content: '',
              range: null,
              diagnostics: []
            }), _0x50343a.userQueryWithMentions += '@' + _0x5e69bc.attrs.label) : (_0x50343a.sourceContext.directories?.["push"]({
              path: _0x2a66a7,
              filePaths: [],
              subDirectories: []
            }), _0x50343a.userQueryWithMentions += '@' + _0x5e69bc.attrs.id);
            break;
          }
        case "phase":
          {
            let _0xa1e769 = _0x5e69bc.attrs.phaseId || _0x5e69bc.attrs.label;
            _0x50343a.userQuery += '@phase:' + _0xa1e769, _0x66f191.push({
              filename: '@phase:' + _0xa1e769,
              fullPath: '@phase:' + _0xa1e769
            }), _0x50343a.userQueryWithMentions += "@phase:" + _0xa1e769;
            break;
          }
        case "review_comment":
          {
            let _0x192e96 = _0x5e69bc.attrs.reviewCommentId || _0x5e69bc.attrs.label;
            _0x50343a.userQuery += "@review-comment:" + _0x192e96, _0x66f191.push({
              filename: '@review-comment:' + _0x192e96,
              fullPath: '@review-comment:' + _0x192e96
            }), _0x50343a.userQueryWithMentions += "@review-comment:" + _0x192e96;
            break;
          }
        case "github_issue":
          _0x50343a.githubTicketRef = {
            organizationLogin: _0x5e69bc.attrs.organizationLogin,
            repositoryName: _0x5e69bc.attrs.repositoryName,
            issueNumber: _0x5e69bc.attrs.issueNumber,
            userLogin: _0x5e69bc.attrs.userLogin
          }, _0x50343a.userQuery += '`' + _0x5e69bc.attrs.label + '`', _0x66f191.push({
            filename: '@' + _0x5e69bc.attrs.label,
            fullPath: '`' + _0x5e69bc.attrs.label + '`'
          }), _0x50343a.userQueryWithMentions += '@' + _0x5e69bc.attrs.label;
          break;
        case "attachment":
          _0x50343a.userQuery += '`' + _0x5e69bc.attrs.label + '`', _0x66f191.push({
            filename: '@' + _0x5e69bc.attrs.label,
            fullPath: '`' + _0x5e69bc.attrs.label + '`'
          }), _0x50343a.userQueryWithMentions += '@' + _0x5e69bc.attrs.label, _0x5e69bc.attrs.b64content && _0x5e69bc.attrs.fileName && _0x50343a.attachments.push({
            file: {
              b64content: _0x5e69bc.attrs.b64content,
              fileName: _0x5e69bc.attrs.fileName
            }
          });
          break;
        case 'git':
          {
            let _0x54fa81 = _0x5e69bc.attrs.gitType,
              _0x43bd4d = _0x5e69bc.attrs.branchName,
              _0x11ae8c = _0x5e69bc.attrs.commitHash,
              _0x37324c = "@git:diff-against";
            _0x43bd4d ? _0x37324c += ":branch@" + _0x43bd4d : _0x11ae8c ? _0x37324c += ':commit@' + _0x11ae8c : _0x37324c += ":uncommitted-changes", _0x50343a.userQuery += _0x37324c, _0x66f191.push({
              filename: _0x37324c,
              fullPath: _0x37324c
            }), _0x50343a.userQueryWithMentions += _0x37324c, _0x50343a.gitMentions.push({
              gitType: _0x54fa81,
              branchName: _0x43bd4d,
              commitHash: _0x11ae8c
            });
            break;
          }
        default:
          throw new Error("Unknown context type: " + _0x5e69bc.attrs.contextType);
      }
    }
    _0x5e69bc.content && _0x5e69bc.content.forEach(_0x54fb15);
  }
  if (_0x4e3d49.content && _0x4e3d49.content.forEach(_0x54fb15), _0x4e3d49.traycerMarkdown) {
    let _0x5a8318 = _0x4e3d49.traycerMarkdown;
    if (/\[mention\]/.test(_0x5a8318)) {
      let _0x146efa = 0;
      _0x50343a.userQuery = _0x5a8318.replace(/\[mention\]/g, () => {
        let _0x446c09 = _0x66f191[_0x146efa];
        return _0x146efa += 1, _0x446c09 ? _0x446c09.fullPath : "[mention]";
      }), _0x146efa = 0, _0x50343a.userQueryWithMentions = _0x5a8318.replace(/\[mention\]/g, () => {
        let _0x251f62 = _0x66f191[_0x146efa];
        return _0x146efa += 1, _0x251f62 ? _0x251f62.filename : '[mention]';
      });
    } else _0x50343a.userQuery.trim().length === 0 && (_0x50343a.userQuery = _0x5a8318), _0x50343a.userQueryWithMentions.trim().length === 0 && (_0x50343a.userQueryWithMentions = _0x5a8318);
  }
  return _0x50343a.userQuery = _0x50343a.userQuery.trim(), _0x50343a.userQueryWithMentions = _0x50343a.userQueryWithMentions.trim(), _0x50343a.sourceContext.files = new CustomSet((_0x5e7a12, _0x1bd341) => FilePath.getAbsolutePath(_0x5e7a12.path, _0x2960d1) === FilePath.getAbsolutePath(_0x1bd341.path, _0x2960d1), [..._0x50343a.sourceContext.files]).values(), _0x50343a.sourceContext.directories = new CustomSet((_0x58a05f, _0x256672) => FilePath.getAbsolutePath(_0x58a05f.path, _0x2960d1) === FilePath.getAbsolutePath(_0x256672.path, _0x2960d1), [..._0x50343a.sourceContext.directories]).values(), _0x50343a;
}
function spliceIntoDocContent(_0x206a3b, _0x42a599, _0x3a5d0e) {
  let _0x50b145 = _0x206a3b.content ? [..._0x206a3b.content] : [],
    _0xc71353 = _0x3a5d0e !== void 0 ? Math.max(0, Math.min(_0x3a5d0e, _0x50b145.length)) : _0x50b145.length;
  return Array.isArray(_0x42a599) ? _0x50b145.splice(_0xc71353, 0, ..._0x42a599) : _0x50b145.splice(_0xc71353, 0, _0x42a599), {
    ..._0x206a3b,
    content: _0x50b145
  };
}
var w5e = 'Stream drain timed out',
  StreamDrainTimeoutError = class extends Error {
    constructor() {
      super(w5e), this.name = "StreamDrainTimeoutError";
    }
  },
  P5e = 'Stream is not writable',
  StreamNotWritableError = class extends Error {
    constructor() {
      super(P5e), this.name = 'StreamNotWritableError';
    }
  };
/* [unbundle] createUuidWithFallback = uuid_module.v4 */
var createUuidWithFallback = uuid_module.v4;
var Ut = createUuidWithFallback,
  un = {
    QUEUE_CAPACITY: 512,
    HIGH_WATER_MARK: 512,
    BACKPRESSURE_THRESHOLD: 256,
    MAX_WRITE_RETRIES: 2,
    DRAIN_TIMEOUT_MS: 15000,
    PING_INTERVAL_MS: 2000,
    MAX_MISSED_PINGS: 30,
    PING_TIMEOUT_MS: 75000,
    STREAM_END_TIMEOUT_MS: 75000,
    MAX_CHUNK_SIZE_BYTES: 1048576
  };
async function splitMessageIntoChunks(_0x39089f, _0x57dc84) {
  let _0x4287c3 = await _0x57dc84(_0x39089f);
  if (_0x4287c3.length <= un.MAX_CHUNK_SIZE_BYTES) return null;
  let _0x58e015 = Ut(),
    _0x1f0dbe = Math.ceil(_0x4287c3.length / un.MAX_CHUNK_SIZE_BYTES),
    _0x39db9e = [];
  for (let _0xc525e6 = 0; _0xc525e6 < _0x1f0dbe; _0xc525e6++) {
    let _0x184372 = _0xc525e6 * un.MAX_CHUNK_SIZE_BYTES,
      _0x5b1f6c = Math.min(_0x184372 + un.MAX_CHUNK_SIZE_BYTES, _0x4287c3.length),
      _0x15b1f8 = _0x4287c3.subarray(_0x184372, _0x5b1f6c);
    _0x39db9e.push({
      chunkId: _0x58e015,
      sequenceNumber: _0xc525e6,
      totalChunks: _0x1f0dbe,
      isFinal: _0xc525e6 === _0x1f0dbe - 1,
      data: _0x15b1f8
    });
  }
  return _0x39db9e;
}
function reassembleChunkedMessage(_0x42d4c0) {
  if (_0x42d4c0.length === 0) throw new ChunkingError("Cannot reassemble message from empty chunks array");
  let _0x1a7df6 = _0x42d4c0[0].chunkId;
  if (!_0x1a7df6) throw new ChunkingError("First chunk missing chunkId");
  for (let key of _0x42d4c0) if (key.chunkId !== _0x1a7df6) throw new ChunkingError('Chunk ID mismatch: expected ' + _0x1a7df6 + ", got " + key.chunkId);
  let _0x285643 = _0x42d4c0[0].totalChunks;
  if (!_0x285643) throw new ChunkingError('First chunk missing totalChunks');
  if (_0x42d4c0.length !== _0x285643) throw new ChunkingError('Expected ' + _0x285643 + ' chunks, but received ' + _0x42d4c0.length);
  let _0x308972 = new Set(_0x42d4c0.map(_0x3b559d => _0x3b559d.sequenceNumber ?? -1));
  if (_0x308972.size !== _0x42d4c0.length) throw new ChunkingError('Duplicate chunks detected: received ' + _0x42d4c0.length + ' chunks but only ' + _0x308972.size + ' unique sequence numbers');
  let _0x4f0c5d = [..._0x42d4c0].sort((_0x37f5ad, _0x10132) => (_0x37f5ad.sequenceNumber ?? 0) - (_0x10132.sequenceNumber ?? 0));
  for (let _0x1d2eeb = 0; _0x1d2eeb < _0x4f0c5d.length; _0x1d2eeb++) if (_0x4f0c5d[_0x1d2eeb].sequenceNumber !== _0x1d2eeb) throw new ChunkingError('Missing or duplicate chunk: expected sequence ' + _0x1d2eeb + ", got " + _0x4f0c5d[_0x1d2eeb].sequenceNumber);
  let _0x2854b9 = _0x4f0c5d.filter(_0x2cb003 => _0x2cb003.isFinal);
  if (_0x2854b9.length !== 1) throw new ChunkingError("Expected exactly one chunk with isFinal=true, found " + _0x2854b9.length);
  if (!_0x4f0c5d[_0x4f0c5d.length - 1].isFinal) throw new ChunkingError("The last chunk must have isFinal=true");
  let _0x31c636 = _0x4f0c5d.reduce((_0x3bf4a1, _0x22f581) => {
      let _0x2c2019 = _0x22f581.data;
      if (!_0x2c2019) throw new ChunkingError('Chunk missing data field');
      return _0x3bf4a1 + (typeof _0x2c2019 == 'string' ? Buffer.from(_0x2c2019).length : _0x2c2019.length);
    }, 0),
    _0x2737c9 = new Uint8Array(_0x31c636),
    _0x808b8 = 0;
  for (let key of _0x4f0c5d) {
    let _0x266a8f = key.data;
    if (!_0x266a8f) throw new ChunkingError("Chunk missing data field");
    let _0x1930f7 = typeof _0x266a8f == 'string' ? Buffer.from(_0x266a8f) : _0x266a8f;
    _0x2737c9.set(_0x1930f7, _0x808b8), _0x808b8 += _0x1930f7.length;
  }
  let _0x1b8713 = new TextDecoder('utf-8').decode(_0x2737c9);
  return JSON.parse(_0x1b8713, (_0x15aaae, _0x109109) => {
    if (_0x109109 && typeof _0x109109 == "object" && !Array.isArray(_0x109109)) {
      let _0x1dfafb = _0x109109.type === "Buffer" && Array.isArray(_0x109109.data),
        _0x20a570 = Object.keys(_0x109109),
        _0x4e18b8 = _0x20a570.length > 0 && _0x20a570.every(_0x771dcf => /^\d+$/.test(_0x771dcf));
      if (_0x1dfafb || _0x4e18b8) try {
        return ensureBuffer(_0x109109);
      } catch {
        return _0x109109;
      }
    }
    return _0x109109;
  });
}
function calculateRetryDelay(_0x41c0b5, _0x162062) {
  let _0xb2ea5b = Math.pow(2, _0x162062) * 1000,
    _0x233ddc = getRandomInt(50, 100);
  return {
    retryAfter: Math.min(_0xb2ea5b + _0x233ddc, _0x41c0b5 * 1000)
  };
}
function getRandomInt(_0xcb681b, _0x438e9a) {
  return Math.floor(Math.random() * (_0x438e9a - _0xcb681b)) + _0xcb681b;
}

async function writeToStreamWithDrain(_0x121526, _0x2afa60) {
  return new Promise((_0x255682, _0x40fef8) => {
    if (!_0x121526.writable) return _0x40fef8(new StreamNotWritableError());
    if (_0x121526.write(_0x2afa60, _0x10975b => {
      _0x10975b && _0x40fef8(_0x10975b);
    }) === false) {
      let _0x5add3f = () => {
          clearTimeout(_0xee9123), _0x255682();
        },
        _0xee9123 = setTimeout(() => {
          _0x121526.off("drain", _0x5add3f), _0x40fef8(new StreamDrainTimeoutError());
        }, x5e);
      _0x121526.once('drain', _0x5add3f);
    } else _0x255682();
  });
}
async function writeToStreamWithRetry(_0x381bd6, _0x4e6d6a, _0x349139, _0x6b5598, _0x25ac87) {
  await _0x25ac87(async () => writeToStreamWithDrain(_0x381bd6, _0x4e6d6a), {
    retries: _0x6b5598,
    shouldRetry(_0xb9c87f) {
      return !(_0xb9c87f instanceof StreamNotWritableError);
    },
    onFailedAttempt: async _0x259322 => {
      let _0x8ce263 = calculateRetryDelay(10, _0x259322.attemptNumber);
      return _0x349139.debug('stream.write failed ' + _0x259322.attemptNumber + ", retrying in " + _0x8ce263.retryAfter + 'ms...', _0x259322), new Promise(_0x443ad9 => setTimeout(_0x443ad9, _0x8ce263.retryAfter));
    }
  });
}
async function writeChunkedMessageToStream(_0x23533f, _0x2611c4, _0x1bf0b0, _0x2d28b7, _0x2dd691, _0x266379, _0x330cef) {
  if (_0x2611c4.chunkedMessage || !_0x2dd691) return writeToStreamWithRetry(_0x23533f, _0x2611c4, _0x1bf0b0, _0x2d28b7, _0x330cef);
  let _0x1992bf = await splitMessageIntoChunks(_0x2611c4, _0x266379);
  if (_0x1992bf === null) return writeToStreamWithRetry(_0x23533f, _0x2611c4, _0x1bf0b0, _0x2d28b7, _0x330cef);
  for (let key of _0x1992bf) await writeToStreamWithRetry(_0x23533f, {
    chunkedMessage: key
  }, _0x1bf0b0, _0x2d28b7, _0x330cef);
}
async function writeChunkedMessageWithRetry(_0x3efdc2, _0x2c197f, _0xd53e86, _0x3317bf, _0x487b94, _0x536d9c) {
  let _0x3a375e = await p_retry_module.default;
  return writeChunkedMessageToStream(_0x3efdc2, _0x2c197f, _0xd53e86, _0x3317bf, _0x487b94, _0x536d9c, _0x3a375e);
}
var x5e = un.DRAIN_TIMEOUT_MS;
/* [unbundle] ignore patterns 已移至 config.js */
var u$ = config_module.IGNORE_DIRECTORIES,
  yO = config_module.IGNORE_FILES,
  rue = config_module.IGNORE_ALL_PATTERNS,
  getGlobalIgnoreInstance = config_module.getGlobalIgnoreInstance,
  AsyncQueue = class extends events_module.EventEmitter {
    ['items'] = [];
    ["headIndex"] = 0;
    ['tailIndex'] = 0;
    ["_size"] = 0;
    ["_isClosed"] = false;
    ['pendingPops'] = [];
    ['capacity'];
    ['logger'];
    constructor(_0x5cbc91) {
      super(), this.capacity = un.QUEUE_CAPACITY, this.logger = _0x5cbc91, this.items = new Array(un.QUEUE_CAPACITY);
    }
    ['push'](_0x2a135c) {
      if (this._isClosed) return this.logger.warn('Attempted to push item to closed queue (size: ' + this._size + '/' + this.capacity + ')'), false;
      let _0x306a1e = this.pendingPops.shift();
      if (_0x306a1e) return _0x306a1e.resolve(_0x2a135c), true;
      if (this._size >= this.capacity) {
        let _0x54145a = {
          currentSize: this._size,
          capacity: this.capacity,
          queueState: "full",
          pendingPops: this.pendingPops.length,
          isClosed: this._isClosed
        };
        return this.logger.warn("Queue full, rejecting push operation", _0x54145a), false;
      }
      return this.items[this.tailIndex] = _0x2a135c, this.tailIndex = (this.tailIndex + 1) % this.capacity, this._size++, this.emit('item-available'), true;
    }
    ['pop']() {
      return new Promise((_0x218753, _0xee5eae) => {
        if (this._size > 0) {
          let _0x2d1313 = this.popInternal();
          if (_0x2d1313 !== void 0) {
            _0x218753(_0x2d1313);
            return;
          }
        }
        if (this._isClosed) {
          let _0xdb1b40 = {
            currentSize: this._size,
            capacity: this.capacity,
            queueState: "closed and empty",
            pendingPops: this.pendingPops.length
          };
          this.logger.warn("Pop operation failed: queue is closed and empty", _0xdb1b40), _0xee5eae(new QueueClosedError("Queue is closed and empty"));
          return;
        }
        this.pendingPops.push({
          resolve: _0x218753,
          reject: _0xee5eae
        });
      });
    }
    ["popInternal"]() {
      if (this._size === 0) return;
      let _0x4d4553 = this.items[this.headIndex];
      this.items[this.headIndex] = void 0, this.headIndex = (this.headIndex + 1) % this.capacity, this._size--;
      let _0x2fa1f2 = Math.min(this.capacity - 1, un.BACKPRESSURE_THRESHOLD);
      return this._size < _0x2fa1f2 && this.emit("space-available"), _0x4d4553;
    }
    ["close"]() {
      if (this._isClosed) return;
      let _0x5e16d0 = {
        currentSize: this._size,
        capacity: this.capacity,
        pendingPops: this.pendingPops.length,
        itemsDiscarded: this._size
      };
      this._isClosed = true;
      for (let key of this.pendingPops) key.reject(new QueueClosedError("Queue was closed"));
      this.pendingPops.length = 0, this.emit("closed", _0x5e16d0), this.removeAllListeners(), this.items.fill(void 0);
    }
    async *[Symbol.asyncIterator]() {
      for (; !this._isClosed || this._size > 0;) {
        if (this._size > 0) {
          let _0x127a4e = this.popInternal();
          if (_0x127a4e !== void 0) {
            yield _0x127a4e;
            continue;
          }
        }
        if (this._isClosed) break;
        await new Promise(_0xcb03ae => {
          let _0x2b120d = () => {
              this.off('item-available', _0x2b120d), this.off('closed', _0x1394bf), _0xcb03ae();
            },
            _0x1394bf = () => {
              this.off('item-available', _0x2b120d), this.off("closed", _0x1394bf), _0xcb03ae();
            };
          this.once('item-available', _0x2b120d), this.once("closed", _0x1394bf);
        });
      }
    }
  },
  StreamMessageHandler = class {
    ['_messageQueue'];
    ['_passThrough'];
    ["_overflowBuffer"] = [];
    ['_shuttingDown'] = false;
    ['_stream'];
    ["_logger"];
    ['_chunkBuffers'];
    ["_chunkTimeouts"];
    constructor(_0x35007b, _0x14e17f) {
      this._stream = _0x35007b, this._logger = _0x14e17f, this._messageQueue = new AsyncQueue(_0x14e17f), this._passThrough = new stream_module.PassThrough({
        objectMode: true,
        highWaterMark: un.HIGH_WATER_MARK
      }), this._chunkBuffers = new Map(), this._chunkTimeouts = new Map(), this.setupStreamPipeline();
    }
    ['setupStreamPipeline']() {
      this._passThrough.on("data", _0xdd152e => {
        if (this._shuttingDown) return;
        let _0x14518c = this.extractChunkedMessage(_0xdd152e);
        if (_0x14518c) try {
          let _0x5cb62c = this.handleChunkedMessage(_0x14518c);
          if (!_0x5cb62c) return;
          _0xdd152e = _0x5cb62c;
        } catch (_0x1b3c86) {
          this._logger.error(_0x1b3c86, 'Error handling chunked message, discarding chunk_id: ' + _0x14518c.chunkId);
          let _0x406716 = _0x14518c.chunkId,
            _0x21f408 = this._chunkTimeouts.get(_0x406716);
          _0x21f408 && clearTimeout(_0x21f408), this._chunkBuffers.delete(_0x406716), this._chunkTimeouts.delete(_0x406716);
          return;
        }
        this._messageQueue.push(_0xdd152e) || (this._overflowBuffer.push(_0xdd152e), this._passThrough.isPaused() || (this._passThrough.pause(), this._logger.warn('Stream paused due to queue overflow, backpressure detected')));
      }), this._messageQueue.on("space-available", () => {
        if (!this._shuttingDown) {
          if (this._overflowBuffer.length === 0) {
            this._passThrough.isPaused() && this._passThrough.resume();
            return;
          }
          for (; this._overflowBuffer.length > 0;) {
            let _0xd4c600 = this._overflowBuffer.shift();
            if (_0xd4c600 && !this._messageQueue.push(_0xd4c600)) {
              this._overflowBuffer.unshift(_0xd4c600);
              return;
            }
          }
          this._passThrough.isPaused() && this._passThrough.resume();
        }
      }), this._stream.pipe(this._passThrough);
    }
    ["extractChunkedMessage"](_0x40196a) {
      return _0x40196a.chunkedMessage ?? void 0;
    }
    ['handleChunkedMessage'](_0x50ac93) {
      let _0x36a460 = _0x50ac93.chunkId;
      this._chunkBuffers.has(_0x36a460) || this._chunkBuffers.set(_0x36a460, []);
      let _0x1c8c4a = this._chunkTimeouts.get(_0x36a460);
      _0x1c8c4a && clearTimeout(_0x1c8c4a);
      let _0x150864 = setTimeout(() => {
        this._logger.warn("Clearing stale chunks for chunk_id " + _0x36a460 + " after " + un.STREAM_END_TIMEOUT_MS + "ms timeout"), this._chunkBuffers.delete(_0x36a460), this._chunkTimeouts.delete(_0x36a460);
      }, un.STREAM_END_TIMEOUT_MS);
      this._chunkTimeouts.set(_0x36a460, _0x150864);
      let _0x1166d9 = this._chunkBuffers.get(_0x36a460);
      if (_0x1166d9.some(_0x348757 => _0x348757.sequenceNumber === _0x50ac93.sequenceNumber)) return this._logger.debug("Duplicate chunk detected: sequence " + _0x50ac93.sequenceNumber + ' for chunk_id: ' + _0x36a460 + ', ignoring'), null;
      _0x1166d9.push(_0x50ac93);
      let _0x2c39bb = new Set(_0x1166d9.map(_0x325bae => _0x325bae.sequenceNumber));
      if (_0x2c39bb.size === _0x50ac93.totalChunks) {
        this._logger.debug("Attempting reassembly for chunk_id: " + _0x36a460 + ', unique sequences: ' + _0x2c39bb.size + ", total chunks expected: " + _0x50ac93.totalChunks + ', buffer length: ' + _0x1166d9.length), clearTimeout(_0x150864), this._chunkBuffers.delete(_0x36a460), this._chunkTimeouts.delete(_0x36a460);
        try {
          return reassembleChunkedMessage(_0x1166d9);
        } catch (_0x3f0c2f) {
          throw this._logger.error(_0x3f0c2f, "Failed to reassemble message from chunks (chunk_id: " + _0x36a460 + ')'), _0x3f0c2f;
        }
      }
      return null;
    }
    async *['consumeMessages']() {
      for await (let key of this._messageQueue) {
        if (this._shuttingDown) break;
        yield key;
      }
    }
    ["cleanup"]() {
      this._shuttingDown = true;
      for (let key of Array.from(this._chunkTimeouts.values())) clearTimeout(key);
      this._chunkTimeouts.clear(), this._chunkBuffers.size > 0 && this._logger.warn('Discarding ' + this._chunkBuffers.size + " incomplete chunk buffers during cleanup"), this._chunkBuffers.clear(), this._messageQueue.close(), this._passThrough && !this._passThrough.destroyed && (this._stream.unpipe(this._passThrough), this._passThrough.removeAllListeners(), this._passThrough.destroy()), this._overflowBuffer = [];
    }
    async ["startMessageConsumption"]() {
      try {
        for await (let key of this.consumeMessages()) {
          if (this._shuttingDown) break;
          this.processMessage(key).catch(_0x42b310 => {
            this._logger.error(_0x42b310, 'Error in message processing');
          });
        }
      } catch (_0xf7110d) {
        _0xf7110d instanceof QueueClosedError ? this._logger.debug("Message queue closed, ending consumption") : this._logger.error(_0xf7110d, 'Error in message consumption');
      }
    }
  },
  yt = {
    UNKNOWN_STATUS: 0,
    INDEX_MODIFIED: 1,
    INDEX_ADDED: 2,
    INDEX_DELETED: 3,
    INDEX_RENAMED: 4,
    INDEX_COPIED: 5,
    MODIFIED: 6,
    DELETED: 7,
    UNTRACKED: 8,
    IGNORED: 9,
    INTENT_TO_ADD: 10,
    INTENT_TO_RENAME: 11,
    TYPE_CHANGED: 12,
    ADDED_BY_US: 13,
    ADDED_BY_THEM: 14,
    DELETED_BY_US: 15,
    DELETED_BY_THEM: 16,
    BOTH_ADDED: 17,
    BOTH_DELETED: 18,
    BOTH_MODIFIED: 19
  };
function getGitignoreCache(_0x122f12) {
  return t9e[_0x122f12];
}
function isAbortError(_0x5911c2) {
  return _0x5911c2 instanceof Error && (_0x5911c2.name === "AbortError" || _0x5911c2.name === 'AbortedError' || RequestAbortedError.matches(_0x5911c2));
}
/* [unbundle] formatPathForDisplay 已移�?github_ticket_query_builder.js */
function isDatabaseError(_0x463868) {
  for (let key of cte) {
    let _0x181ea6 = new RegExp(key);
    if (_0x463868.message.match(_0x181ea6) !== null) return true;
  }
  return false;
}
function getContextFilePath(_0xbe0463) {
  for (let key of rq) {
    let _0x46b2f5 = new RegExp(key);
    if (_0xbe0463.message.match(_0x46b2f5) !== null) return true;
  }
  return false;
}
function formatContextFileContent(_0x6b6682) {
  if (_0x6b6682.file?.["b64content"]) {
    let _0x2f6258 = path_module.extname(_0x6b6682.file.fileName);
    if (Hk.has(_0x2f6258.toLowerCase())) {
      if (_0x6b6682.file.b64content.length > nq) throw new Error("Attached image " + _0x6b6682.file.fileName + " is too large. Maximum size is " + nq + " bytes.");
    } else throw new UnsupportedImageTypeError(_0x6b6682.file.fileName);
  }
}
function parseGitignoreContent(_0x58b03f) {
  let _0x318b0b = {
    iVBORw0KGgo: 'image/png',
    '/9j/': 'image/jpeg',
    R0lGODlh: 'image/gif'
  };
  for (let key in _0x318b0b) if (_0x58b03f.startsWith(key)) return _0x318b0b[key];
  return 'image/png';
}
/* [unbundle] formatTaskTitle 已移至 config.js */
function formatTaskToMarkdown(_0x3c41bc, _0x466b44, _0x579cee) {
  let _0x206277 = '## Task ' + _0x466b44 + ': ' + _0x3c41bc.title + '\x0a\x0a';
  if (_0x3c41bc.plans.length > 0 && _0x3c41bc.plans[0].queryJsonContent) {
    let _0x180ea3 = parseUserQueryContent(_0x3c41bc.plans[0].queryJsonContent, _0x579cee).userQuery;
    _0x180ea3 && (_0x206277 += _0x180ea3 + '\x0a');
  }
  return _0x206277 + '\x0a\x0a';
}
function formatPhaseBreakdownToMarkdown(_0x264ee7, _0x42e415, _0x2089ba) {
  let _0x4ee86b = '# Phase Breakdown\x0a\x0a';
  if (!_0x264ee7.tasks || _0x264ee7.tasks.length === 0) return _0x4ee86b += 'No tasks\x0a', _0x4ee86b;
  let _0x2aa5d4 = _0x264ee7.tasks.map((_0x4e1620, _0x1d995a) => _0x42e415.length === 0 || _0x42e415.includes(_0x4e1620.id) ? formatTaskToMarkdown(_0x4e1620, _0x1d995a + 1, _0x2089ba) : '').filter(_0x4b5147 => _0x4b5147 !== '');
  return _0x4ee86b += _0x2aa5d4.join(''), _0x4ee86b.trim();
}
var t9e = {
  [xr.WINDOWS]: 'Windows',
  [xr.POSIX]: 'POSIX'
};
var il = {
    FETCH_SUBSCRIPTION: 'fetchSubscription',
    VALIDATE_INVOICE: 'validateInvoice',
    REFRESH_USER: 'refreshUser'
  },
  vt = {
    NEW_TASK: 'newTask',
    FETCH_TASK_HISTORY: "fetchTaskHistory",
    FETCH_TASK_CHAIN: 'fetchTaskChain',
    FETCH_FILE_AND_FOLDER: "fetchFileAndFolder",
    OPEN_FILE: "openFile",
    DELETE_TASK_CHAIN: 'deleteTaskChain',
    DELETE_TASK: 'deleteTask',
    OPEN_TASK_FILE: "openTaskFile",
    TASK_USER_QUERY: 'taskUserQuery',
    PLAN_ITERATION_USER_QUERY: "planIteration",
    ABORT_TASK: 'abortTask',
    ABORT_PRE_PHASE: 'abortPrePhase',
    OPEN_EXTERNAL_LINK: 'openExternalLink',
    OPEN_ATTACHMENT: "openAttachment",
    EXECUTE_IN_PLATFORM: "executeInPlatform",
    NEW_TASK_BREAKDOWN: "newTaskBreakdown",
    REORDER_TASKS: 'reorderTasks',
    TASK_LIST_BOOTSTRAPPING: 'taskListBootstrapping',
    START_TASK_VERIFICATION: "startTaskVerification",
    SKIP_TASK_VERIFICATION: "skipTaskVerification",
    REVERIFY_TASK: 'reVerifyTask',
    DISCARD_VERIFICATION_COMMENT: "discardVerificationComment",
    TOGGLE_VERIFICATION_COMMENTS_APPLIED: "toggleVerificationCommentsApplied",
    INSERT_TASK: 'insertTask',
    UPDATE_TASK_QUERY: "updateTaskQuery",
    UPDATE_FAILED_PLAN_ITERATION_QUERY: 'updateFailedPlanIterationQuery',
    UPDATE_FAILED_OR_ABORTED_CONVERSATION_QUERY: "updateFailedOrAbortedConversationQuery",
    EXECUTE_VERIFICATION_COMMENT_IN_IDE: "executeVerificationCommentInIDE",
    EXECUTE_ALL_VERIFICATION_COMMENTS_IN_IDE: 'executeAllVerificationCommentsInIDE',
    EXECUTE_REVIEW_COMMENTS_IN_IDE: "executeReviewCommentsInIDE",
    EXECUTE_ALL_REVIEW_COMMENTS_IN_IDE: "executeAllReviewCommentsInIDE",
    TOGGLE_REVIEW_COMMENTS_APPLIED: "toggleReviewCommentsApplied",
    DISCARD_REVIEW_COMMENT: 'discardReviewComment',
    EDIT_PRE_PHASE_CONVERSATION: "editPrePhaseConversation",
    DISPOSE_VERIFICATION: 'disposeVerification',
    DELETE_PHASE_CONVERSATION: 'deletePhaseConversation',
    FETCH_GIT_CONTEXT: "fetchGitContext",
    EXECUTE_QUERY_DIRECTLY_IN_IDE: "executeQueryDirectlyInIDE",
    DISCARD_PLAN: 'discardPlan',
    START_YOLO_MODE: "startYoloMode",
    STOP_YOLO_MODE: 'stopYoloMode',
    SET_TASK_EXECUTION_CONFIG: 'setTaskExecutionConfig',
    STOP_WAITING_FOR_EXECUTION: 'stopWaitingForExecution',
    RESET_REVERIFICATION_STATE: 'resetReverificationState',
    MARK_PLAN_AS_EXECUTED: 'markPlanAsExecuted',
    EXPORT_PHASE_BREAKDOWN: 'exportPhaseBreakdown'
  },
  PO = {
    CONVERT_FILE_PATH: 'convertFilePath'
  },
  o9e = {
    NOT_STARTED: 0,
    RATE_LIMITED: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    FAILED: 4,
    ABORTING: 5,
    ABORTED: 6,
    SKIPPED: 7,
    WAITING_FOR_EXECUTION: 8
  },
  pe = o9e,
  Ru = {
    CREATE_USER_CLI_AGENT: 'createUserCLIAgent',
    CREATE_WORKSPACE_CLI_AGENT: 'createWorkspaceCLIAgent',
    DELETE_CLI_AGENT: "deleteCLIAgent",
    REFRESH_CLI_AGENTS: 'refreshCLIAgents',
    OPEN_CLI_AGENT: "openCLIAgent",
    IS_USER_CLI_AGENT_NAME_ALLOWED: 'isUserCLIAgentNameAllowed',
    IS_WORKSPACE_CLI_AGENT_NAME_ALLOWED: "isWorkspaceCLIAgentNameAllowed"
  },
  hw = {
    SIGNIN: "cloudUISignin",
    PASTE_TOKEN: "cloudUIPasteToken"
  },
  bO = {
    ACTIVATION_STATUS: "activation-status"
  },
  Cv = {
    SIGNIN: "signin",
    STATUS: 'status',
    SIGNOUT: "signout"
  },
  mw = {
    STATUS_REFRESH: 'statusRefresh',
    SET_ACTIVE_ACCOUNT_FOR_MCP_SERVER: 'setActiveAccountForMCPServer'
  },
  CO = {
    TRACK_METRICS: 'trackMetrics'
  },
  ea = {
    CREATE_USER_PROMPT_TEMPLATE: 'createUserPromptTemplate',
    CREATE_WORKSPACE_PROMPT_TEMPLATE: "createWorkspacePromptTemplate",
    ACTIVATE_PROMPT_TEMPLATE: 'activatePromptTemplate',
    DEACTIVATE_PROMPT_TEMPLATE: 'deactivatePromptTemplate',
    DELETE_PROMPT_TEMPLATE: 'deletePromptTemplate',
    REFRESH_PROMPT_TEMPLATES: "refreshPromptTemplates",
    OPEN_PROMPT_TEMPLATE: "openPromptTemplate",
    IS_USER_PROMPT_TEMPLATE_NAME_ALLOWED: 'isUserPromptTemplateNameAllowed',
    IS_WORKSPACE_PROMPT_TEMPLATE_NAME_ALLOWED: 'isWorkspacePromptTemplateNameAllowed',
    LIST_WORKSPACE_DIRECTORIES: "listWorkspaceDirectories"
  },
  Ou = {
    GET_TASK_SETTINGS_STATE: "get-task-settings-state",
    UPDATE_LAST_SELECTED_IDE_AGENT: 'update-last-selected-ide-agent',
    UPDATE_ALWAYS_ALLOW_PAY_TO_RUN: "update-always-allow-pay-to-run",
    GET_DEFAULT_TASK_EXECUTION_CONFIG: "get-default-task-execution-config",
    SET_DEFAULT_TASK_EXECUTION_CONFIG: "set-default-task-execution-config",
    OPEN_SETTINGS: 'open-settings',
    TOGGLE_INTERVIEW_TEXT_ONLY_MODE: 'toggle-interview-text-only-mode'
  },
  _w = {
    FETCH_USAGE_INFORMATION: "fetchUsageInformation",
    SEND_FETCH_STATUS: "sendFetchStatus"
  },
  IO = {
    LISTENERS_READY: 'LISTENERS_READY'
  },
  gw = {
    OPEN_FOLDER: "openFolder",
    GET_WORKSPACE_STATUS: "getWorkspaceStatus"
  };
function removeGitignorePatterns(_0x116b53) {
  return c9e.has(_0x116b53);
}
function clearGitignoreCache(_0x264340) {
  return l9e.has(_0x264340);
}
function getGitignorePatterns(_0x1a18f9) {
  return d9e.has(_0x1a18f9);
}
function hasGitignoreFile(_0x511038) {
  return p9e.has(_0x511038);
}
function isGitignoreLoaded(_0x235251) {
  return f9e.has(_0x235251);
}
function loadGitignoreFromPath(_0xfba99a) {
  return h9e.has(_0xfba99a);
}
function reloadGitignore(_0x35d261) {
  return m9e.has(_0x35d261);
}
function getGitignorePath(_0x205b9e) {
  return _9e.has(_0x205b9e);
}
function setGitignorePath(_0x2f9e48) {
  return g9e.has(_0x2f9e48);
}
function getGitignoreStats(_0x3f8095) {
  return y9e.has(_0x3f8095);
}
function resetGitignoreState(_0x36f4a0) {
  return v9e.has(_0x36f4a0);
}
function initGitignoreWatcher(_0x161549) {
  return T9e.has(_0x161549);
}
function disposeGitignoreWatcher(_0x4588c5) {
  return E9e.has(_0x4588c5);
}
function onGitignoreChange(_0x4c81ab) {
  return S9e.has(_0x4c81ab);
}
var c9e = new Set(Object.values(Ou)),
  l9e = new Set(Object.values(il)),
  d9e = new Set(Object.values(vt)),
  p9e = new Set(Object.values(CO)),
  f9e = new Set(Object.values(Cv)),
  h9e = new Set(Object.values(hw)),
  m9e = new Set(Object.values(bO)),
  _9e = new Set(Object.values(IO)),
  g9e = new Set(Object.values(_w)),
  y9e = new Set(Object.values(gw)),
  v9e = new Set(Object.values(mw)),
  T9e = new Set(Object.values(ea)),
  E9e = new Set(Object.values(Ru)),
  S9e = new Set(Object.values(PO)),
  yw = {
    POST_SUBSCRIPTION: 'postSubscription'
  },
  _n = {
    POST_TASK: "postTask",
    POST_TASKS: "postTasks",
    POST_TASK_LIGHT: "postTaskLight",
    FETCH_FILE_AND_FOLDER: "fetchFileAndFolder",
    OPEN_TASK: "openTask",
    TICKET_LOADING: 'ticketLoading',
    TASK_LIST_BOOTSTRAPPING: 'taskListBootstrapping',
    POST_PLAN_THINKING: "postPlanThinking",
    POST_VERIFICATION_THINKING: 'postVerificationThinking',
    POST_PRE_PHASE_CONVERSATION_THINKING: 'postPrePhaseConversationThinking',
    POST_PLAN_DELTA: "postPlanDelta",
    FETCH_GIT_CONTEXT: "fetchGitContext",
    YOLO_MODE_STARTED: 'yoloModeStarted',
    YOLO_MODE_STOPPED: 'yoloModeStopped'
  },
  AO = {
    FILE_PATH_CONVERTED: "filePathConverted"
  },
  kO = {
    ACTIVATED: "activated"
  },
  Iv = {
    SIGNING_IN: 'signingIn',
    SIGNED_OUT: "signedOut",
    SIGNED_IN: "signedIn"
  },
  vw = {
    SYNC_MCP_SERVERS: 'syncMCPServers',
    ACKNOWLEDGE_SET_ACTIVE_ACCOUNT_FOR_MCP_SERVER: "acknowledgeSetActiveAccountForMCPServer"
  },
  Um = {
    LIST_CLI_AGENTS: 'listCLIAgents',
    IS_USER_CLI_AGENT_NAME_ALLOWED: 'isUserCLIAgentNameAllowed',
    IS_WORKSPACE_CLI_AGENT_NAME_ALLOWED: 'isWorkspaceCLIAgentNameAllowed'
  },
  sl = {
    NAVIGATE_TO_NEW_TASK: 'navigateToNewTask',
    NAVIGATE_TO_TASK_HISTORY: "navigateToTaskHistory",
    NAVIGATE_TO_MCP_SERVERS: 'navigateToMCPServers',
    NAVIGATE_TO_PROMPT_TEMPLATES: 'navigateToPromptTemplates',
    NAVIGATE_TO_CLI_AGENTS: 'navigateToCLIAgents',
    NAVIGATE_TO_TASK_LANDING_WITH_PREFILL: "navigateToTaskLandingWithPrefill"
  },
  Ef = {
    LIST_PROMPT_TEMPLATES: "listPromptTemplates",
    IS_USER_PROMPT_TEMPLATE_NAME_ALLOWED: "isUserPromptTemplateNameAllowed",
    IS_WORKSPACE_PROMPT_TEMPLATE_NAME_ALLOWED: 'isWorkspacePromptTemplateNameAllowed',
    LIST_WORKSPACE_DIRECTORIES: "listWorkspaceDirectories"
  },
  Av = {
    SYNC_TASK_SETTINGS: "sync-task-settings",
    SYNC_DEFAULT_TASK_EXECUTION_CONFIG: "sync-default-task-execution-config"
  },
  Tw = {
    SEND_USAGE_INFORMATION: 'sendUsageInformation',
    SEND_FETCH_STATUS: 'SEND_FETCH_STATUS'
  },
  RO = {
    WORKSPACE_STATUS: "workspaceStatus"
  },
  OO = {
    type: 'object',
    properties: {
      displayName: {
        type: 'string',
        description: "Display name for the template"
      }
    },
    required: [],
    additionalProperties: false
  },
  ice = {
    type: "object",
    properties: {
      ...OO.properties,
      applicableFor: {
        type: 'string',
        enum: ['plan', 'verification', 'generic', "review", 'userQuery'],
        description: 'Specifies which type of content this template applies to'
      }
    },
    required: ['applicableFor', ...OO.required],
    additionalProperties: false
  },
  AgentRegistry = class _0x98f6f0 {
    constructor() {
      this.agents = new Map();
    }
    static ["getInstance"]() {
      return _0x98f6f0.instance || (_0x98f6f0.instance = new _0x98f6f0()), _0x98f6f0.instance;
    }
    ["registerAgent"](_0x2d953d) {
      this.agents.set(_0x2d953d.id, _0x2d953d);
    }
    ['unregisterAgent'](_0x2358a0) {
      return this.agents.delete(_0x2358a0);
    }
    ['getAgent'](_0x205f38) {
      return this.hasAgent(_0x205f38) ? this.agents.get(_0x205f38) : isValidAgentType(_0x205f38) ? getAgentIcon(_0x205f38) : void 0;
    }
    ['getAllAgents']() {
      return Array.from(this.agents.values());
    }
    ['getAgentsBySource'](_0x5f51c9) {
      return this.getAllAgents().filter(_0x2b27ea => _0x2b27ea.source === _0x5f51c9);
    }
    ['getBuiltInCLIAgents']() {
      return this.getAgentsBySource('builtin').filter(_0x1447b2 => _0x1447b2.type === 'terminal');
    }
    ["getUserAgents"]() {
      return this.getAgentsBySource('user');
    }
    ['getWorkspaceAgents']() {
      return this.getAgentsBySource('workspace');
    }
    ["hasAgent"](_0x460b87) {
      return this.agents.has(_0x460b87);
    }
    ["getAgentInfo"](_0xd801d2) {
      let _0x23405d = this.getAgent(_0xd801d2);
      if (!_0x23405d) throw new Error("Agent with ID " + _0xd801d2 + " not found");
      return _0x23405d;
    }
    ["getAgentInfoIfExists"](_0x112a1a) {
      try {
        return this.getAgentInfo(_0x112a1a);
      } catch {
        return null;
      }
    }
    ["getConflictingWithBuiltInAgent"](_0x3824d6) {
      return this.getAgentsBySource('builtin').find(_0x360e25 => _0x360e25.id === _0x3824d6 || _0x360e25.displayName.toLowerCase() === _0x3824d6.toLowerCase()) || null;
    }
  };
async function formatCodeBlockContent(_0xaeb101, _0x36e209, _0x4fbe28, _0xb33b6, _0xef23c3, _0x136f81, _0x11d8e6, _0xcd99b2) {
  if (!(await _0xaeb101.fileExists(_0xb33b6.absPath))) throw new Error("Directory not found");
  let _0x35c95e = new RipgrepCommandBuilder(_0x36e209).withMaxResults(300).withIncludePatterns(_0xef23c3 ? [_0xef23c3] : []).withIgnorePatterns(_0x136f81).withAdditionalArgs(['--json', '--context=' + 3, _0xb33b6.absPath]).withRegex(_0x4fbe28).build(),
    _0x3c19f5 = await RipgrepExecutor.execute([_0x35c95e], {
      encoding: 'utf8'
    });
  return {
    matchingFileSnippets: await _0xcd99b2(_0x3c19f5, _0xb33b6.proto, _0x11d8e6)
  };
}
async function searchFilesWithRipgrep(_0x5639f8, _0x5cdd49, _0x4b2c47, _0x4d5e92, _0x401908 = 50, _0x2cee82 = true) {
  let _0x4eeab0 = await config.getRipgrepBinPath();
  if (!_0x4eeab0) throw new Error('ripgrep binary not found');
  if (!(await workspace_info.getInstance().fileExists(_0x5639f8))) return Logger.warn('Path to list files in does not exist', _0x5639f8), '';
  let _0xa9f861 = isWindows ? '[^\x5c\x5c]*' : "[^/]*",
    _0x5a2f9 = [...DEFAULT_RG_ARGS];
  _0x2cee82 || _0x5a2f9.push('--max-depth', '1');
  let _0x565312 = new RipgrepCommandBuilder(_0x4eeab0).withAdditionalArgs(_0x5a2f9).withIncludePatterns(_0x4b2c47 ? [_0x4b2c47] : []).build(),
    _0xafc48d = new RipgrepCommandBuilder(_0x4eeab0).withMaxResults(_0x401908).withCaseInsensitive().withQuery('' + _0xa9f861 + _0x5cdd49 + _0xa9f861 + '$').build(),
    _0x407f09 = [_0x565312, _0xafc48d];
  return await RipgrepExecutor.execute(_0x407f09, {
    cwd: _0x5639f8,
    timeout: MAX_SEARCH_RESULTS,
    abortSignal: _0x4d5e92?.['signal']
  });
}
async function searchFoldersWithRipgrep(_0x10d4d2, _0x249521, _0x1d3546, _0x4ffec6 = 50, _0x1850be = true) {
  let _0x1ff9c5 = await config.getRipgrepBinPath();
  if (!_0x1ff9c5) throw new Error('ripgrep binary not found');
  if (!(await workspace_info.getInstance().fileExists(_0x10d4d2))) return Logger.warn("Path to list folders in does not exist", _0x10d4d2), [];
  let _0x17afb1 = isWindows ? ['-o', "^.*\\\\"] : ['-o', "'^.*/'"],
    _0x1f39ac = [...DEFAULT_RG_ARGS];
  _0x1850be || _0x1f39ac.push('--max-depth', '2');
  let _0x547294 = new RipgrepCommandBuilder(_0x1ff9c5).withAdditionalArgs(_0x1f39ac).build(),
    _0x4f4b02 = new RipgrepCommandBuilder(_0x1ff9c5).withAdditionalArgs(_0x17afb1).build(),
    _0x40281f = new RipgrepCommandBuilder(_0x1ff9c5).withCaseInsensitive().withQuery(_0x249521).build(),
    _0x23e87e = isWindows ? ["sort", "/unique"] : ["sort", '-u', '-f'],
    _0x13e594 = new RipgrepCommandBuilder(_0x1ff9c5).withMaxResults(_0x4ffec6).withCaseInsensitive().withQuery('').build(),
    _0x262355 = [_0x547294, _0x4f4b02, _0x40281f, _0x23e87e, _0x13e594];
  return (await RipgrepExecutor.execute(_0x262355, {
    cwd: _0x10d4d2,
    timeout: MAX_SEARCH_RESULTS,
    abortSignal: _0x1d3546?.['signal']
  })).trim().replaceAll('\x0d', '\x0a').split('\x0a').filter(Boolean);
}
async function searchFilesAndFoldersInWorkspace(_0x41dcf1, _0x326761, _0x438a88) {
  let _0x5aa40f = {
      files: [],
      folders: []
    },
    _0x40d284 = vscode_module.workspace.workspaceFolders;
  if (_0x40d284?.["length"]) {
    let _0x1c0187 = Math.ceil(50 / _0x40d284.length);
    _0x326761 === 'mix' && (_0x1c0187 = Math.ceil(_0x1c0187 / 2));
    let _0x236178 = async _0x579343 => {
        try {
          let _0x159f12 = (await searchFilesWithRipgrep(_0x579343.uri.fsPath, _0x41dcf1, void 0, _0x438a88, _0x1c0187)).trim().replaceAll('\x0d', '\x0a').split('\x0a').filter(Boolean);
          _0x5aa40f.files.push(..._0x159f12.map(_0x3c2431 => ({
            absolutePath: path_module.join(_0x579343.uri.fsPath, _0x3c2431),
            isDirectory: false
          })));
        } catch (_0x1a1b3c) {
          Logger.warn("Error getting files for workspace", {
            error: _0x1a1b3c instanceof Error ? _0x1a1b3c.message : String(_0x1a1b3c)
          });
        }
      },
      _0x27aedc = async _0x15bd70 => {
        try {
          let _0x256034 = await searchFoldersWithRipgrep(_0x15bd70.uri.fsPath, _0x41dcf1, _0x438a88, _0x1c0187);
          _0x5aa40f.folders.push(..._0x256034.map(_0x579285 => ({
            absolutePath: path_module.join(_0x15bd70.uri.fsPath, _0x579285),
            isDirectory: true
          })));
        } catch (_0x5f1918) {
          Logger.warn('Error getting folders for workspace', {
            error: _0x5f1918 instanceof Error ? _0x5f1918.message : String(_0x5f1918)
          });
        }
      },
      _0x412a71 = [];
    _0x40d284.forEach(_0x13b04a => {
      (_0x326761 === 'file' || _0x326761 === 'mix') && _0x412a71.push(_0x236178(_0x13b04a)), (_0x326761 === "folder" || _0x326761 === "mix") && _0x412a71.push(_0x27aedc(_0x13b04a));
    }), await Promise.allSettled(_0x412a71);
  }
  return _0x5aa40f;
}
function escapeSearchPattern(_0xa891fa) {
  return _0xa891fa.replace(/[^a-zA-Z0-9_-]/g, '.');
}
async function searchFilesAndFoldersQueued(_0x3ad6d4, _0x4205d2) {
  try {
    return await I9e.enqueueRequest(_0x3cfdfb => searchFilesAndFoldersInWorkspace(escapeSearchPattern(_0x3ad6d4), _0x4205d2, _0x3cfdfb));
  } catch (_0x571111) {
    throw Logger.warn('Error in getListOfFilesAndFolders', {
      error: _0x571111 instanceof Error ? _0x571111.message : String(_0x571111)
    }), _0x571111;
  }
}
var I9e,
  initSearchUtils = __esmModule(() => {
    'use strict';

    initSearchConfig(), initWorkspaceInfo(), /* fce = vscode_module */ I9e = new LatestRequestLimiter();
  }),
  In,
  initDocumentManager = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), In = class _0xc6fed {
      static {
        this.concurrencyLimiter = new RequestQueue(5, 200, 2000);
      }
      static async ["getSourceCode"](_0x37304d) {
        let _0x40d5e7 = await _0xc6fed.getCachedTextDocument(_0x37304d);
        return _0x40d5e7 ? _0x40d5e7.getText() : workspace_info.getInstance().readFile(_0x37304d, false);
      }
      static async ['saveDocument'](_0xe4fa0a) {
        let _0x18ba5d = await _0xc6fed.getTextDocument(_0xe4fa0a);
        _0x18ba5d.isDirty && (await _0x18ba5d.save());
      }
      static async ['getCachedTextDocument'](_0x8cd8c3) {
        let _0x46ace8 = vscode_module.Uri.file(_0x8cd8c3),
          _0x4ddba6 = vscode_module.workspace.textDocuments.find(_0x5aec35 => _0x5aec35.uri.toString() === _0x46ace8.toString());
        if (_0x4ddba6) return _0x4ddba6;
      }
      static async ["getTextDocument"](_0x1bfaca) {
        let _0x91bc78 = vscode_module.Uri.file(_0x1bfaca),
          _0x4c8a6e = await _0xc6fed.getCachedTextDocument(_0x1bfaca);
        return _0x4c8a6e || _0xc6fed.enqueueOpenTextDocument(_0x91bc78);
      }
      static async ['enqueueOpenTextDocument'](_0x1633d2) {
        return _0xc6fed.concurrencyLimiter.enqueueRequest(() => _0xc6fed.openDocumentWithTimeout(_0x1633d2));
      }
      static async ['openDocumentWithTimeout'](_0x339582, _0x4d84bc = 5000) {
        let _0x5c4629 = vscode_module.workspace.openTextDocument(_0x339582),
          _0x2e5ed9 = new Promise((_0x47e156, _0x53246c) => {
            setTimeout(() => _0x53246c(new Error("Timed out opening document")), _0x4d84bc);
          });
        try {
          return await Promise.race([_0x5c4629, _0x2e5ed9]);
        } catch (_0x5c9453) {
          throw Logger.debug('Failed to open document:', _0x5c9453), _0x5c9453;
        }
      }
      static async ['enqueueOpenNotebookDocument'](_0x52d2d8) {
        return _0xc6fed.concurrencyLimiter.enqueueRequest(() => _0xc6fed.openNotebookDocumentWithTimeout(_0x52d2d8));
      }
      static async ["openNotebookDocumentWithTimeout"](_0x5e8688, _0x164049 = 5000) {
        let _0x56d04c = vscode_module.workspace.openNotebookDocument(_0x5e8688),
          _0x26501d = new Promise((_0x255cca, _0x46b812) => {
            setTimeout(() => _0x46b812(new Error('Timed out opening document')), _0x164049);
          });
        try {
          return await Promise.race([_0x56d04c, _0x26501d]);
        } catch (_0x5de235) {
          throw Logger.debug('Failed to open notebook document:', _0x5de235), _0x5de235;
        }
      }
    };
  });
/* [unbundle] sqlite3 已移至顶部导入区 */
/* [unbundle] SqliteService 和 SummaryCacheService 已移至 modules/sqlite_service.js */
var LlmCacheHandler,
  initLlmCacheHandler = __esmModule(() => {
    'use strict';

    initDocumentManager(), initWorkspaceInfo(), LlmCacheHandler = class _0x31bc7c {
      constructor(_0x46d11a) {
        this.llmCache = _0x46d11a;
      }
      static async ["getInstance"]() {
        if (!_0x31bc7c.instance) {
          let _0x4fae2a = workspace_info.getInstance(),
            _0x48aa46 = SqliteService.getInstance(_0x4fae2a.getLogger()),
            _0xba957a = new SummaryCacheService(_0x48aa46);
          _0x31bc7c.instance = new _0x31bc7c(_0xba957a);
        }
        return _0x31bc7c.instance;
      }
      ["shutdown"]() {
        this.runShutdownInBackground();
      }
      async ['runShutdownInBackground']() {
        try {
          await this.llmCache.shutdown(), _0x31bc7c.instance = null;
        } catch (_0x295c81) {
          Logger.error(_0x295c81, 'Failed to shutdown cache handler');
        }
      }
      async ['getSummaryFromCache'](_0xecb0a5, _0xb09b81) {
        try {
          return await this.llmCache.getSummaryFromCache(_0xecb0a5, _0xb09b81);
        } catch (_0x508ecc) {
          return Logger.error('Error getting summary from cache for ' + _0xecb0a5, _0x508ecc), '';
        }
      }
      async ['setSummaryToCache'](_0x35e77a, _0x4aac3b) {
        try {
          let _0x45aed9 = TraycerPath.fromPathProto(_0x35e77a).absPath,
            _0x2a483b = await In.getSourceCode(_0x45aed9);
          await this.llmCache.setSummaryToCache(_0x45aed9, _0x4aac3b, _0x2a483b, null);
        } catch (_0x4ace6d) {
          Logger.error("Error setting summary to cache for " + _0x35e77a, _0x4ace6d);
        }
      }
    };
  });
function getWorkspaceRootPath(_0x479aed) {
  return vscode_module.languages.getDiagnostics(_0x479aed);
}
async function getDiagnosticsForFile(_0x993928, _0x2eeeaf) {
  let _0x175edc = TraycerPath.fromPathProto(_0x993928),
    _0x2302aa = vscode_module.Uri.file(_0x175edc.absPath);
  try {
    let _0xa788b = getWorkspaceRootPath(_0x2302aa),
      _0x5f3657 = [];
    return await Promise.allSettled(_0xa788b.map(async _0x29ecf2 => {
      if (_0x2eeeaf !== void 0 && _0x29ecf2.severity !== _0x2eeeaf) return;
      let _0x3f672b = [],
        _0x235844 = (_0x29ecf2.relatedInformation ?? []).map(async _0x26bac4 => {
          let _0x1da05e = {
            location: {
              range: LineRange.fromEndLine(_0x26bac4.location.range.start.line, _0x26bac4.location.range.end.line).rangeOutput,
              path: (await TraycerPath.fromPath(_0x26bac4.location.uri.fsPath)).proto
            },
            message: _0x26bac4.message
          };
          _0x3f672b.push(_0x1da05e);
        });
      await Promise.allSettled(_0x235844), _0x5f3657.push({
        info: _0x3f672b,
        message: _0x29ecf2.message,
        range: LineRange.fromEndLine(_0x29ecf2.range.start.line, _0x29ecf2.range.end.line).rangeOutput,
        severity: vscode_module.DiagnosticSeverity[_0x29ecf2.severity ?? 0],
        tags: _0x29ecf2.tags?.['map'](_0x35cd57 => vscode_module.DiagnosticTag[_0x35cd57 ?? 0]) ?? [],
        source: _0x29ecf2.source,
        code: _0x29ecf2.code ? {
          value: typeof _0x29ecf2.code == 'object' ? _0x29ecf2.code.value.toString() : _0x29ecf2.code.toString(),
          targetUri: typeof _0x29ecf2.code == "object" ? _0x29ecf2.code.target.fsPath : void 0
        } : void 0
      });
    })), {
      path: _0x993928,
      diagnostics: _0x5f3657
    };
  } catch (_0x177ead) {
    let _0x56fa85 = 'Failed to get diagnostics for file: ' + _0x2302aa.fsPath;
    throw Logger.warn(_0x56fa85, _0x177ead), new Error(_0x56fa85);
  }
}
async function listFilesInDirectory(_0x21e2c9, _0x5a352b) {
  let _0x9a0a93 = (await searchFilesWithRipgrep(_0x21e2c9, '', _0x5a352b ?? void 0, null, Number.MAX_SAFE_INTEGER, true)).trim().replaceAll('\x0d', '\x0a').split('\x0a').filter(Boolean),
    _0x157211 = [];
  for (let key of _0x9a0a93) {
    let _0x5b4bf1 = path_module.join(_0x21e2c9, key);
    _0x157211.push((await TraycerPath.fromPath(_0x5b4bf1)).proto);
  }
  return _0x157211;
}
async function listFilesFromPathProto(_0x2629da, _0x580829) {
  let _0x505d89 = TraycerPath.fromPathProto(_0x2629da);
  return listFilesInDirectory(_0x505d89.absPath, _0x580829);
}
var initSymbolSearch = __esmModule(() => {
    'use strict';

    initSearchUtils();
  }),
  WO = {
    DEFINITION: 0,
    REFERENCE: 1,
    IMPLEMENTATION: 2
  },
  jO = {
    USER: 0,
    ORGANIZATION: 1
  },
  jm = {
    NEW_PHASE: 0,
    MODIFIED_PHASE: 1,
    UNCHANGED_PHASE: 2
  },
  An = {
    IMPLEMENTATION_ARTIFACT: 0,
    REVIEW_ARTIFACT: 1
  },
  HO = {
    EXPLANATION: 0,
    ITERATION: 1
  },
  l4 = {
    SERVER_ERROR: 0,
    NO_ACTIVE_SUBSCRIPTION: 1,
    RATE_LIMIT_EXCEEDED: 2,
    USER_ABORTED: 3
  },
  Id = {
    TASK_NOT_STARTED: 0,
    TASK_IN_PROGRESS: 1,
    TASK_COMPLETED: 2
  },
  Ad = {
    UNRESOLVED: 0,
    RESOLVED: 1,
    OUTDATED: 2
  };
async function readFilesWithSummary(_0x14bfc8, _0x5b961d) {
  let _0x3a46ec = new CustomSet((_0x50d723, _0x45e05a) => TraycerPath.equals(_0x50d723, _0x45e05a), _0x14bfc8).values(),
    _0x1bbcec = await LlmCacheHandler.getInstance(),
    _0x23b4ac = await Promise.allSettled(_0x3a46ec.map(async _0x58a509 => {
      let _0x499f42 = await workspace_info.getInstance().readFile(_0x58a509.absPath),
        _0x106904 = await _0x1bbcec.getSummaryFromCache(_0x58a509.absPath, _0x499f42),
        _0x7b4eba = {
          path: _0x58a509.proto,
          content: _0x499f42,
          summary: _0x106904,
          range: null,
          diagnostics: []
        };
      if (_0x5b961d === "fileContent") return {
        filePath: _0x58a509,
        fileOutput: _0x7b4eba,
        type: "fileContent"
      };
      let _0x1894d0 = await getDiagnosticsForFile(_0x58a509.proto, void 0);
      return {
        filePath: _0x58a509,
        fileResponse: {
          file: _0x7b4eba,
          summary: _0x106904 || '',
          diagnostics: _0x1894d0.diagnostics
        },
        type: "fileResponse"
      };
    })),
    _0xc1c361 = [],
    _0x48d500 = [];
  for (let _0x3c6d4a = 0; _0x3c6d4a < _0x23b4ac.length; _0x3c6d4a++) {
    let _0x2ad57e = _0x23b4ac[_0x3c6d4a];
    _0x2ad57e.status === 'fulfilled' ? _0x2ad57e.value.type === 'fileContent' && _0xc1c361.push(_0x2ad57e.value.fileOutput) : _0x48d500.push(_0x3a46ec[_0x3c6d4a]);
  }
  return _0x5b961d === "fileContent" ? {
    fileContents: _0xc1c361,
    failedPaths: _0x48d500
  } : {
    fileContents: _0xc1c361,
    failedPaths: _0x48d500
  };
}
/* [unbundle] TraycerPath �?initPathModule 已移�?modules/path_types.js */
function isConnected() {
  return process.platform.includes("win32") ? xr.WINDOWS : xr.POSIX;
}
function isAuthenticated() {
  return process.platform;
}
function formatTimeAgo() {
  return vscode_module.env.remoteName !== void 0 && ['wsl', "ssh-remote", 'dev-container', "attached-container", "tunnel"].includes(vscode_module.env.remoteName) && process.platform === 'win32';
}
function formatRelativeTime(_0x1b8f4c) {
  let _0x54752f = _0x1b8f4c.split('\x5c').join('/');
  return _0x54752f[1] === ':' && (_0x54752f = _0x54752f.slice(2)), _0x54752f;
}
function createRemoteOrLocalUri(_0x3faf3f) {
  let _0xc5a098 = _0x3faf3f;
  return vscode_module.env.remoteName ? (formatTimeAgo() && (_0xc5a098 = formatRelativeTime(_0x3faf3f)), vscode_module.Uri.parse("vscode-remote://" + vscode_module.env.remoteName + _0xc5a098)) : vscode_module.Uri.file(_0xc5a098);
}
function formatRangeSnippet(_0x352b00, _0xbfbdb3) {
  if (_0x352b00.workspaceFile === void 0) {
    let _0x257eec = new Set(_0x352b00.workspaceFolders.map(_0x1a8e0a => _0x1a8e0a.absPath)),
      _0x53c0f3 = new Set(workspace_info.getInstance().getWorkspaceDirs()),
      _0x3602d8 = true;
    for (let key of _0x257eec) if (!_0x53c0f3.has(key)) {
      _0x3602d8 = false;
      break;
    }
    return _0x3602d8 ? {
      association: 'current'
    } : _0x257eec.size === 1 ? {
      association: 'resolvableExternal',
      workspace: Array.from(_0x257eec)[0]
    } : {
      association: "unresolvableExternal",
      workspaces: Array.from(_0x257eec)
    };
  }
  return _0xbfbdb3 && TraycerPath.equals(_0xbfbdb3, _0x352b00.workspaceFile) ? {
    association: 'current'
  } : {
    association: "resolvableExternal",
    workspace: _0x352b00.workspaceFile.absPath
  };
}
var Pf,
  initWorkspaceAssociation = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), Pf = class _0x2ee32b {
      constructor(_0x510acd, _0x55f56e) {
        this._workspaceFile = _0x510acd, this._workspaceFolders = _0x55f56e;
      }
      get ['workspaceFile']() {
        return this._workspaceFile;
      }
      get ['workspaceFolders']() {
        return this._workspaceFolders;
      }
      static async ["deserialize"](_0x31cc89) {
        let _0x3664a8 = await Promise.all(_0x31cc89.workspaceFolders.map(_0x5c524c => TraycerPath.fromPath(_0x5c524c.absolutePath))),
          _0x3657dc = _0x31cc89.workspaceFile ? TraycerPath.deserializeFromStorage(_0x31cc89.workspaceFile) : void 0;
        return _0x3657dc && !(await workspace_info.getInstance().fileExists(_0x3657dc.absPath)) && (_0x3657dc = void 0), new _0x2ee32b(_0x3657dc, _0x3664a8);
      }
      async ["determineWorkspaceScope"]() {
        return formatRangeSnippet(this, (await workspace_info.getInstance().getCurrentWSInfo()).WSAssociation.workspaceFile);
      }
      ["serializeToStorage"]() {
        return {
          workspaceFile: this._workspaceFile ? this._workspaceFile.serializeToStorage() : void 0,
          workspaceFolders: this._workspaceFolders.map(_0x5764f1 => _0x5764f1.serializeToStorage())
        };
      }
    };
  }),
  InvalidRepoUrlError = class extends Error {
    constructor(_0x41024b) {
      super(_0x41024b), this.name = "InvalidRepoUrlError";
    }
  },
  /* [unbundle] workerpool 已移至顶部导入区 */

  WorkerPoolManager,
  initStatusBar = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), WorkerPoolManager = class WorkerPoolManager extends ex {
      static {
        this._instance = null;
      }
      constructor() {
        super({
          minWorkers: 2,
          maxWorkers: 2,
          workerType: 'thread',
          logger: Logger
        });
      }
      ['getWorkerPath'](workerType) {
        return path_module.join(workspace_info.getInstance().getResourcesDir(), "workers", workerType);
      }
      ['getSupportedWorkerTypes']() {
        return ['json-operations.cjs', 'three-way-merge.cjs', 'ripgrep-processor.cjs', 'diff-utils.cjs', 'list-files-processor.cjs'];
      }
      static ["getInstance"]() {
        return WorkerPoolManager._instance || (WorkerPoolManager._instance = new WorkerPoolManager()), WorkerPoolManager._instance;
      }
      static async ["initWorkerPool"]() {
        await WorkerPoolManager.getInstance().initWorkerPool();
      }
      static async ['exec'](workerType, method, args) {
        return WorkerPoolManager.getInstance().exec(workerType, method, args);
      }
      static async ['cleanup']() {
        return WorkerPoolManager.getInstance().cleanup();
      }
    };
  });
function formatErrorToString(_0x78ccb6) {
  return _0x78ccb6 instanceof Error ? 'Error Name: ' + _0x78ccb6.name + '\x0aError Message: ' + _0x78ccb6.message + '\x0aError Stack: ' + _0x78ccb6.stack : '' + _0x78ccb6;
}
function normalizeLineEndings() {
  return path_module.resolve(path_module.dirname(__filename), '..', "proto");
}
function getRpcProtoPath() {
  return path_module.join(normalizeLineEndings(), "traycer", "stream", 'v3', "rpc.proto");
}
function getGoogleCredentialsPath() {
  return path_module.resolve(path_module.dirname(__filename), '..', "keys", 'vivid-spot-418405-24bae3583142.json');
}
async function ensureTraycerHomeDir() {
  let _0x10358b = path_module.join(os_module.homedir(), ".traycer");
  return await ensureDirectoryExists(_0x10358b), _0x10358b;
}
async function ensureAppAssetsFolder() {
  let _0x2a1393 = path_module.join(await ensureTraycerHomeDir(), 'app-assets');
  return await ensureDirectoryExists(_0x2a1393), _0x2a1393;
}
async function ensureDirectoryExists(_0x3dd03b) {
  try {
    await (0, fs_promises_module.stat)(_0x3dd03b);
  } catch (_0x515145) {
    Logger.debug('Creating folder: ' + _0x3dd03b, formatErrorToString(_0x515145));
    try {
      await (0, fs_promises_module.mkdir)(_0x3dd03b, {
        recursive: true
      });
    } catch (_0x1659e1) {
      if (_0x1659e1.code !== "EEXIST") throw Logger.warn("Failed to create folder: " + _0x3dd03b, _0x1659e1), _0x1659e1;
    }
  }
}

// [unbundle] 注入 YoloArtifactManager 需要的全局辅助函数
injectYoloArtifactManagerHelpers({ ensureDirectoryExists });

async function getAppAssetsDatabasePath() {
  return path_module.join(await ensureAppAssetsFolder(), 'app-assets.db');
}

class BaseStorage{
    constructor(_0x33e794, _0x242c47) {
      this.id = _0x242c47, this.baseStorage = _0x33e794;
    }
    async ['read']() {
      return this.baseStorage.read(this.id);
    }
    async ["upsert"](_0x1e4b26, _0xe53388) {
      return this.baseStorage.upsert(_0x1e4b26, _0xe53388);
    }
    async ["runInTransaction"](_0x2e8eb3) {
      return this.baseStorage.runInTransaction(_0x2e8eb3);
    }
    async ["delete"](_0x2fc842) {
      return this.baseStorage.delete(this.id, _0x2fc842);
    }
  }
  class ThreadStorage extends BaseStorage {}
  class ConversationStorage extends BaseStorage {}
  class TaskStorage extends BaseStorage {}
  class PlanStorage extends BaseStorage {}
  class AttachmentStorage extends BaseStorage {}
  class EmptyStorage {}
function isSqliteBusyError(_0xbf95bf) {
  return String(_0xbf95bf).includes('SQLITE_BUSY') ? true : _0xbf95bf instanceof Error ? getContextFilePath(_0xbf95bf) : false;
}
var ox,
  Bv,
  initProgressReporter = __esmModule(() => {
    'use strict';

    initStatusBar(), ox = class _0x22559d {
      constructor(_0x55ecde) {
        this.reopenConnectionLock = new Mutex(), this._txDb = null, this._db = _0x55ecde, this.writeLock = new Mutex();
      }
      static {
        this.instance = null;
      }
      static {
        this.instanceCreationLock = new Mutex();
      }
      static async ['getInstance']() {
        let _0x3af209 = await _0x22559d.instanceCreationLock.acquire();
        try {
          if (_0x22559d.instance) return _0x22559d.instance;
          let _0x4407d7 = await _0x22559d.openConnection();
          return _0x22559d.instance = new _0x22559d(_0x4407d7), _0x22559d.instance;
        } finally {
          _0x3af209();
        }
      }
      static async ['createTables'](_0x1474b1) {
        await _0x1474b1.exec("PRAGMA journal_mode=WAL;"), await _0x1474b1.exec('PRAGMA synchronous=NORMAL;'), await _0x1474b1.exec("PRAGMA cache_size=-4096;"), await _0x1474b1.exec('PRAGMA busy_timeout=30000;');
        for (let key of Object.values(StorageKey)) await _0x1474b1.exec("CREATE TABLE IF NOT EXISTS " + key + ' (' + "\n        id TEXT PRIMARY KEY,\n        json_data TEXT NOT NULL,\n        last_updated INTEGER NOT NULL,\n        version INTEGER NOT NULL\n      " + ')');
      }
      async ["getConnection"]() {
        if (this._txDb) return this._txDb;
        try {
          await (0, fs_promises_module.stat)(await getAppAssetsDatabasePath());
        } catch {
          this.reopenConnectionLock.isLocked() ? await this.reopenConnectionLock.waitForUnlock() : await this.reopenConnectionLock.runExclusive(this.closeAndReOpenConnection.bind(this));
        }
        return this._db;
      }
      async ['closeAndReOpenConnection']() {
        try {
          await this._db.close();
        } catch {
          Logger.warn("Failed to close database connection");
        }
        this._db = await _0x22559d.openConnection();
      }
      static async ['openConnection']() {
        let _0x2ab7fb = await getAppAssetsDatabasePath(),
          _0x264d80 = await sqlite_module.open({
            filename: _0x2ab7fb,
            driver: sqlite3_module.Database
          });
        return await this.createTables(_0x264d80), _0x264d80;
      }
      async ['beginTransaction']() {
        return (await this.getConnection()).exec('BEGIN TRANSACTION');
      }
      async ['commitTransaction']() {
        return (await this.getConnection()).exec("COMMIT");
      }
      async ["rollbackTransaction"]() {
        return (await this.getConnection()).exec("ROLLBACK");
      }
      async ['acquireWriteLock']() {
        await this.writeLock.acquire();
      }
      async ['releaseWriteLock']() {
        this.writeLock.release();
      }
      async ['close']() {
        await this._db.close();
      }
      async ["read"](_0x273634, _0x5bfc30) {
        let _0x18ab61 = await (await this.getConnection()).get("SELECT json_data, last_updated, version FROM " + _0x273634 + ' WHERE id = ?', _0x5bfc30);
        return this.serializeItem(_0x18ab61, _0x5bfc30, _0x273634);
      }
      async ['serializeItem'](_0x1bedde, _0x3c6191, _0x459706) {
        try {
          let _0x52bf28;
          try {
            _0x52bf28 = await WorkerPoolManager.exec("json-operations.cjs", 'parseJSON', [_0x1bedde.json_data, true]);
          } catch (_0x16164a) {
            Logger.warn("Worker pool JSON parsing failed for row " + _0x3c6191 + " in table " + _0x459706 + ", falling back to synchronous parsing: " + (_0x16164a instanceof Error ? _0x16164a.message : String(_0x16164a))), _0x52bf28 = JSON.parse(_0x1bedde.json_data);
          }
          return {
            serializedItem: _0x52bf28,
            metadata: {
              lastUpdated: _0x1bedde.last_updated,
              version: _0x1bedde.version
            }
          };
        } catch (_0x19a0db) {
          throw _0x19a0db instanceof TypeError ? new Bv(_0x3c6191, _0x19a0db.message, _0x459706) : _0x19a0db;
        }
      }
      async ["upsert"](_0x30f146, _0xc70374, _0x5b6d3d) {
        let _0x120c65;
        try {
          _0x120c65 = await WorkerPoolManager.exec('json-operations.cjs', "stringifyJSON", [_0xc70374]);
        } catch (_0x4882c8) {
          Logger.warn('Worker pool JSON stringification failed for item ' + _0xc70374.id + " in table " + _0x30f146 + ', falling back to synchronous stringification: ' + (_0x4882c8 instanceof Error ? _0x4882c8.message : String(_0x4882c8))), _0x120c65 = JSON.stringify(_0xc70374);
        }
        await (await this.getConnection()).run('INSERT OR REPLACE INTO ' + _0x30f146 + ' (id, json_data, last_updated, version) VALUES (?, ?, ?, ?)', _0xc70374.id, _0x120c65, _0x5b6d3d.lastUpdated, _0x5b6d3d.version);
      }
      async ['delete'](_0xc4e7bf, _0x25b0c1) {
        await (await this.getConnection()).run('DELETE FROM ' + _0xc4e7bf + " WHERE id = ?", _0x25b0c1);
      }
      async ["deleteMultiple"](_0x4a2f61, _0x59805e) {
        if (_0x59805e.length === 0) return;
        let _0x384ec8 = _0x59805e.map(() => '?').join(','),
          _0x262a34 = "DELETE FROM " + _0x4a2f61 + " WHERE id IN (" + _0x384ec8 + ')';
        await (await this.getConnection()).run(_0x262a34, ..._0x59805e);
      }
      async ["readAll"](_0x17b475) {
        let _0x2d154b = await (await this.getConnection()).all('SELECT id, json_data, last_updated, version FROM ' + _0x17b475),
          _0x5af236 = [];
        for (let key of _0x2d154b) try {
          let _0x3a78aa;
          try {
            _0x3a78aa = await WorkerPoolManager.exec('json-operations.cjs', "parseJSON", [key.json_data, true]);
          } catch (_0x26c66c) {
            Logger.warn('Worker pool JSON parsing failed for row ' + key.id + ' in table ' + _0x17b475 + ", falling back to synchronous parsing: " + (_0x26c66c instanceof Error ? _0x26c66c.message : String(_0x26c66c))), _0x3a78aa = JSON.parse(key.json_data);
          }
          let _0x2a6c7d = {
            serializedItem: _0x3a78aa,
            metadata: {
              lastUpdated: key.last_updated,
              version: key.version
            }
          };
          _0x5af236.push(_0x2a6c7d);
        } catch (_0x473cb3) {
          let _0x40e1c6 = _0x473cb3 instanceof Error ? _0x473cb3.message : String(_0x473cb3),
            _0x3e3bfc = new Bv(key.id, _0x40e1c6, _0x17b475);
          _0x5af236.push(_0x3e3bfc);
        }
        return _0x5af236;
      }
      async ["clearTable"](_0x38954a) {
        await (await this.getConnection()).run("DELETE FROM " + _0x38954a);
      }
      async ['runInTransaction'](_0x5b2034) {
        let _0x131b3a = await p_retry_module.default,
          _0x5c16da = false;
        return _0x131b3a(async () => this.writeLock.runExclusive(async () => {
          _0x5c16da && (await this.closeAndReOpenConnection(), _0x5c16da = false);
          let _0x5d6cbd = await this.getConnection();
          this._txDb = _0x5d6cbd, await this.beginTransaction();
          let _0xf96b6a = new EmptyStorage();
          try {
            let _0x146fc3 = await _0x5b2034(_0xf96b6a);
            return await this.commitTransaction(), _0x146fc3;
          } catch (_0xf1c695) {
            throw await this.rollbackTransaction(), _0xf1c695 instanceof Error && getContextFilePath(_0xf1c695) && (_0x5c16da = true), _0xf1c695;
          } finally {
            this._txDb = null;
          }
        }), {
          retries: 2,
          shouldRetry: isSqliteBusyError,
          onFailedAttempt: _0x28e84d => {
            let _0x1dfcdb = calculateRetryDelay(10, _0x28e84d.attemptNumber);
            return Logger.warn("Failed attempt " + _0x28e84d.attemptNumber + ' due to DB error: ' + _0x28e84d.message + ", retrying in " + _0x1dfcdb.retryAfter + "ms."), new Promise(_0x3d0529 => setTimeout(_0x3d0529, _0x1dfcdb.retryAfter));
          }
        });
      }
    }, Bv = class _0x5326c8 extends Error {
      constructor(_0x54d0db, _0x2ed8d5, _0x11573b) {
        super("Failed to parse row with ID=" + _0x54d0db + ' from table ' + _0x11573b + (_0x2ed8d5 ? ': ' + _0x2ed8d5 : '')), this.rowId = _0x54d0db, this.name = 'RowParseError', Object.setPrototypeOf(this, _0x5326c8.prototype);
      }
    };
  }),
  ol,
  initFileOperations = __esmModule(() => {
    'use strict';

    initProgressReporter(), ol = class _0x3815e {
      constructor(_0x593325, _0x401801, _0x54beb4, _0x40747b, _0x3a5601) {
        this.MAX_ITEMS_TO_PRE_FILL_IN_MEMORY_CACHE = 20, this.inMemoryCache = new lru_map_module.LRUMap(this.MAX_ITEMS_TO_PRE_FILL_IN_MEMORY_CACHE), this.context = _0x593325, this.tableName = _0x401801, this.appAssetsDB = _0x54beb4, this.currentVersion = _0x40747b, this.dataValidityDuration = _0x3815e.DATA_VALIDITY_DURATION, this.maxItemsToPersist = _0x3a5601;
      }
      static {
        this.DATA_VALIDITY_DURATION = 1209600000;
      }
      async ['deleteAllFromDisk']() {
        return this.runInTransaction(async () => {
          let _0x4ee329 = this.getLiveItemIDs();
          return this.deleteItems(_0x4ee329);
        });
      }
      async ['clearDisk']() {
        return this.runInTransaction(async () => (this.inMemoryCache.clear(), this.appAssetsDB.clearTable(this.tableName)));
      }
      async ["deleteItems"](_0x3d6000) {
        return this.runInTransaction(async () => (_0x3d6000.forEach(_0x12e872 => this.inMemoryCache.delete(_0x12e872)), this.appAssetsDB.deleteMultiple(this.tableName, _0x3d6000)));
      }
      async ['deleteItem'](_0x3e4901) {
        return this.runInTransaction(async () => (this.inMemoryCache.delete(_0x3e4901), this.appAssetsDB.delete(this.tableName, _0x3e4901)));
      }
      async ['read'](_0x10f9cc) {
        let _0x2695e6 = this.inMemoryCache.get(_0x10f9cc);
        if (_0x2695e6) return _0x2695e6;
        let _0x5e5c41 = await this._getItem(_0x10f9cc);
        return this.inMemoryCache.set(_0x10f9cc, _0x5e5c41), _0x5e5c41;
      }
      async ['upsert'](_0x217932, _0x1beb54) {
        return this.inMemoryCache.set(_0x217932.id, _0x217932), this.appAssetsDB.upsert(this.tableName, _0x217932, this.generateMetadata());
      }
      async ['delete'](_0x3af836, _0x2d5146) {
        this.inMemoryCache.delete(_0x3af836), await this.appAssetsDB.delete(this.tableName, _0x3af836);
      }
      async ["addFromStorage"](_0x50a528) {
        let _0x582bb6 = await this._addFromStorage(_0x50a528);
        for (let _0x5cd1a3 = 0; _0x5cd1a3 < _0x582bb6.length; _0x5cd1a3++) {
          let _0x3b29f0 = _0x582bb6[_0x5cd1a3];
          if (_0x3b29f0.status === 'rejected') {
            let _0x23ac9d = _0x50a528[_0x5cd1a3];
            Logger.debug("Failed to add item in " + this.tableName + ' with ID: ' + _0x23ac9d.id + '. Reason: ' + _0x3b29f0.reason);
          }
        }
      }
      async ['bootstrapFromDisk']() {
        let {
            items: _0x1c663c
          } = await this._fetchAllItems(),
          {
            data: _0x358abe
          } = await this.migrateData(_0x1c663c);
        await this._invalidateItems(_0x358abe);
        let _0x5cf8d4 = _0x358abe.map(_0x3881c6 => _0x3881c6.serializedItem),
          _0xe287f7 = await this.getLoadableItems(_0x5cf8d4);
        _0x358abe.sort((_0x4f66ce, _0x1ab45d) => _0x1ab45d.metadata.lastUpdated - _0x4f66ce.metadata.lastUpdated).slice(0, this.MAX_ITEMS_TO_PRE_FILL_IN_MEMORY_CACHE).forEach(_0x5bd9a3 => this.inMemoryCache.set(_0x5bd9a3.serializedItem.id, _0x5bd9a3.serializedItem)), await this.addFromStorage(_0xe287f7);
      }
      async ['getLoadableItems'](_0x371b45) {
        let _0x14964b = new Map();
        for (let key of _0x371b45) {
          let _0x5b3e9e = this.getRequiredFiles(key);
          _0x14964b.set(key.id, _0x5b3e9e);
        }
        return await this.getDataToLoad(_0x14964b, _0x371b45);
      }
      async ['_fetchAllItems']() {
        let _0x4e7003 = await this.appAssetsDB.readAll(this.tableName),
          _0x553b67 = [];
        for (let key of _0x4e7003) key instanceof Bv || _0x553b67.push(key);
        return {
          items: _0x553b67
        };
      }
      async ['_getItem'](_0x2e3a2d) {
        return (await this.appAssetsDB.read(this.tableName, _0x2e3a2d)).serializedItem;
      }
      async ['_invalidateItems'](_0x3b1788) {
        let _0x18260a = new Set();
        if (_0x3b1788.length > this.maxItemsToPersist) {
          _0x3b1788.sort((_0x3b2985, _0x3e4758) => _0x3b2985.metadata.lastUpdated - _0x3e4758.metadata.lastUpdated);
          let _0x44425f = _0x3b1788.length - this.maxItemsToPersist,
            _0x34a2ad = _0x3b1788.slice(0, _0x44425f).map(_0x36d967 => _0x36d967.serializedItem.id);
          for (let key of _0x34a2ad) _0x18260a.add(key);
        }
        if (this.shouldInvalidateData) {
          for (let key of _0x3b1788) this.isDataInvalid(key) && _0x18260a.add(key.serializedItem.id);
        }
        await this.deleteItems([..._0x18260a]), _0x3b1788 = _0x3b1788.filter(_0x20cada => !_0x18260a.has(_0x20cada.serializedItem.id));
      }
      ['isDataInvalid'](_0x3608d3) {
        return Date.now() - _0x3608d3.metadata.lastUpdated > this.dataValidityDuration;
      }
      async ["getDataToLoad"](_0xe10076, _0x2e63a2) {
        let _0x20f5b5 = this.collectUniqueRequiredFiles(_0xe10076),
          _0x3db815 = await this.checkFileExistence(_0x20f5b5),
          _0x2943eb = Array.from(_0x3db815.values()).filter(_0x51e7a2 => _0x51e7a2).length;
        return Logger.debug("Found " + _0x2943eb + ' out of ' + _0x20f5b5.size + " required files for loading up " + this.tableName + ' in the workspace'), this.getLoadableData(_0xe10076, _0x3db815, _0x2e63a2);
      }
      async ["isFileInWorkspace"](_0x122429) {
        let _0x1c110c = vscode_module.Uri.file(_0x122429);
        if (!vscode_module.workspace.getWorkspaceFolder(_0x1c110c)) return false;
        try {
          return await vscode_module.workspace.fs.stat(_0x1c110c), true;
        } catch {
          return false;
        }
      }
      ["collectUniqueRequiredFiles"](_0x195176) {
        let _0x44476c = new Set();
        for (let _0xcc6068 of _0x195176.values()) for (let _0x3802ed of _0xcc6068) _0x44476c.add(_0x3802ed.absPath);
        return _0x44476c;
      }
      async ["checkFileExistence"](_0x3d604d) {
        let _0x58feb9 = new Map(),
          _0x114b00 = Array.from(_0x3d604d),
          _0x1b3745 = _0x114b00.map(_0x653c2d => this.isFileInWorkspace(_0x653c2d)),
          _0x28c441 = await Promise.allSettled(_0x1b3745);
        for (let [_0x28535b, _0x25a0e4] of _0x28c441.entries()) {
          let _0x47bd42 = _0x114b00[_0x28535b];
          _0x25a0e4.status === "rejected" ? _0x58feb9.set(_0x47bd42, false) : _0x58feb9.set(_0x47bd42, _0x25a0e4.value);
        }
        return _0x58feb9;
      }
      ["getLoadableData"](_0x5a018c, _0x55273b, _0x188284) {
        let _0x5bed93 = [];
        for (let key of _0x188284) {
          let _0x132bb0 = _0x5a018c.get(key.id);
          if (!_0x132bb0) throw new Error("Required files not generated for the item with id: " + key.id);
          _0x132bb0.every(_0x244046 => _0x55273b.get(_0x244046.absPath) === true) && _0x5bed93.push(key);
        }
        return _0x5bed93;
      }
      async ["migrateData"](_0x104d5f) {
        let _0xefeb84 = [],
          _0x2a36bd = [];
        for (let key of _0x104d5f) try {
          let _0x4a1328 = key.metadata.version,
            _0xb5d7d7 = this.migrateItem(key);
          _0x4a1328 !== _0xb5d7d7.metadata.version && _0x2a36bd.push(this.runInTransaction(async _0x2fd48d => {
            await this.upsert(_0xb5d7d7.serializedItem, _0x2fd48d);
          })), _0xefeb84.push(_0xb5d7d7);
        } catch (_0x29c4b6) {
          Logger.warn("Failed to migrate item " + key.serializedItem.id, formatErrorToString(_0x29c4b6));
        }
        return await Promise.all(_0x2a36bd), {
          data: _0xefeb84
        };
      }
      ['generateMetadata']() {
        return {
          lastUpdated: Date.now(),
          version: this.currentVersion
        };
      }
      async ['runInTransaction'](_0x1fe57f) {
        return this.appAssetsDB.runInTransaction(_0x1fe57f);
      }
    };
  }),
  RepoMappingMigrator,
  initRepoMappingMigrator = __esmModule(() => {
    'use strict';

    initSearchConfig(), RepoMappingMigrator = class {
      static ['migrate'](_0x256ce0) {
        let _0x11a44a = config.CURRENT_REPO_WORKSPACE_MAPPING_VERSION,
          _0x1d91d8 = _0x256ce0.metadata;
        for (; _0x1d91d8.version < _0x11a44a;) {
          switch (Logger.debug("Migrating persisted repo workspace mapping from version " + _0x1d91d8.version + " to " + _0x11a44a), _0x1d91d8.version) {
            case 1:
              break;
            default:
              throw new Error("Attempting to migrate to invalid persisted repo workspace mapping version: " + _0x1d91d8.version);
          }
          _0x1d91d8.version = _0x1d91d8.version + 1;
        }
        return _0x256ce0;
      }
    };
  }),
  Qm,
  initGitOperationsExports = __esmModule(() => {
    'use strict';

    initSearchConfig(), initFileOperations(), initRepoMappingMigrator(), Qm = class _0x403fb4 extends ol {
      constructor(_0x1fbe6c, _0xa0fc6) {
        super(_0x1fbe6c, 'RepoMapping', _0xa0fc6, config.CURRENT_REPO_WORKSPACE_MAPPING_VERSION, config.REPO_WORKSPACE_MAPPING_SIZE), this.shouldInvalidateData = false, this.shouldInvalidateData = false;
      }
      static {
        this.instance = null;
      }
      static ['getInstance'](_0x122d74, _0x25f934) {
        if (!_0x403fb4.instance) {
          if (!_0x122d74 || !_0x25f934) throw new Error("Context and appAssetsDB are required");
          _0x403fb4.instance = new _0x403fb4(_0x122d74, _0x25f934);
        }
        return _0x403fb4.instance;
      }
      async ["_addFromStorage"](_0x494501) {
        return Promise.allSettled([]);
      }
      ['getLiveItemIDs']() {
        return [];
      }
      ['migrateItem'](_0x5e6f88) {
        return RepoMappingMigrator.migrate(_0x5e6f88);
      }
      ["getRequiredFiles"](_0x18f1ee) {
        return [];
      }
    };
  }),
  Jm,
  initGitOperations = __esmModule(() => {
    'use strict';

    initGitOperationsExports(), Jm = class _0x1c573a {
      constructor(_0x47594d, _0x4135bd) {
        this._repoUrl = _0x47594d, this._gitRoot = _0x4135bd, this._repoID = _0x1c573a.getRepoID(this._repoUrl);
        let _0x53547a = Qm.getInstance();
        this.storageAPI = new PlanStorage(_0x53547a, this._repoID);
      }
      get ['repoID']() {
        return this._repoID;
      }
      get ["repoUrl"]() {
        return this._repoUrl;
      }
      get ["gitRoot"]() {
        return this._gitRoot;
      }
      static ["getRepoID"](_0x265750) {
        let _0x33c015 = parseGitHubUrl(_0x265750);
        if (!_0x33c015) throw new InvalidRepoUrlError('Invalid repository URL: ' + _0x265750);
        return _0x33c015.owner + '/' + _0x33c015.name;
      }
      static async ["fetchFromStorage"](_0x21b7ab) {
        let _0x45f916 = _0x1c573a.getRepoID(_0x21b7ab),
          _0x247a99 = Qm.getInstance(),
          _0x3c6027 = await new PlanStorage(_0x247a99, _0x45f916).read();
        return new _0x1c573a(_0x3c6027.repoUrl, _0x3c6027.workspacePath);
      }
      ["serializeToStorage"]() {
        return {
          id: this._repoID,
          repoUrl: this._repoUrl,
          workspacePath: this._gitRoot
        };
      }
      async ['upsertInStorage']() {
        let _0x234066 = this.serializeToStorage();
        return this.storageAPI.runInTransaction(async _0x2920fd => this.storageAPI.upsert(_0x234066, _0x2920fd));
      }
    };
  }),
  Du,
  initRepoMappingManager = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initGitOperations(), Du = class _0x41fa98 {
      constructor() {
        this.repoMappings = new Map();
      }
      static ['getInstance']() {
        return _0x41fa98.instance || (_0x41fa98.instance = new _0x41fa98()), _0x41fa98.instance;
      }
      async ["getRepoMapping"](_0x56a2c9) {
        let _0x26bd4e = (await TraycerPath.fromPath(_0x56a2c9.fsPath)).absPath,
          _0xf4fc53 = this.repoMappings.get(_0x26bd4e);
        return _0xf4fc53 || (_0xf4fc53 = await getRepoMappingFromUri(_0x56a2c9), await _0xf4fc53.upsertInStorage(), this.repoMappings.set(_0x26bd4e, _0xf4fc53)), _0xf4fc53;
      }
      async ['upsertRepoMappings']() {
        let _0x3df180 = workspace_info.getInstance().getWorkspaceDirs();
        await Promise.allSettled(_0x3df180.map(async _0x4c5bbe => {
          let _0x5d1b1e = await getAllRepoMappingsFromUri(createRemoteOrLocalUri(_0x4c5bbe));
          await Promise.allSettled(_0x5d1b1e.map(async _0x399240 => {
            await _0x399240.upsertInStorage();
          }));
        }));
      }
      async ["fetchRepoMapping"](_0x2f7852, _0x1395cf) {
        let _0x3dd5cb = "https://github.com/" + _0x1395cf + '/' + _0x2f7852;
        return await Jm.fetchFromStorage(_0x3dd5cb);
      }
    };
  });
async function executeGitCommand(_0x5a0bf3, _0x2b8c81, _0x4d6cec) {
  try {
    let {
      stdout: _0x411152,
      stderr: _0x24469e
    } = await (0, util_module.promisify)(child_process_module.exec)('git ' + _0x5a0bf3, {
      cwd: _0x2b8c81
    });
    if (_0x24469e) throw new Error(_0x24469e);
    return _0x4d6cec ? _0x411152.trim() : _0x411152;
  } catch (_0x3b2eff) {
    throw new Error('Git command failed: ' + _0x3b2eff);
  }
}
async function getGitBranch(_0x305507) {
  let _0x258485 = (0, path_module.dirname)(_0x305507.fsPath);
  try {
    (await vscode_module.workspace.fs.stat(_0x305507)).type === vscode_module.FileType.Directory && (_0x258485 = _0x305507.fsPath);
  } catch (_0x1feb72) {
    Logger.debug("Failed to get file type", _0x1feb72);
  }
  try {
    return await executeGitCommand('rev-parse --show-toplevel', _0x258485, true);
  } catch (_0x5d9ed7) {
    return Logger.debug('Failed to get git root', _0x5d9ed7), '';
  }
}
async function getGitRootAndRelativePath(_0x5ea10a) {
  let _0x13fd9a = await Du.getInstance().getRepoMapping(_0x5ea10a);
  if (!_0x13fd9a) throw new Error('File is not part of a git repo');
  let _0x1b4cb7 = _0x13fd9a.gitRoot,
    _0x2e00cb = isWindows ? _0x1b4cb7.toLowerCase().replace(/\//g, '\x5c') : _0x1b4cb7,
    _0x2cb7f0 = _0x5ea10a.fsPath.replace(_0x2e00cb, '').slice(1);
  return [_0x1b4cb7, isWindows ? _0x2cb7f0.replace(/\\/g, '/') : _0x2cb7f0];
}
async function getGitRootPath(_0x1783be) {
  try {
    let [_0x27af39, _0x4a7964] = await getGitRootAndRelativePath(_0x1783be);
    return await executeGitCommand("show HEAD:" + _0x4a7964, _0x27af39, false);
  } catch (_0x11e2e5) {
    return Logger.debug("Failed to get file contents", _0x11e2e5), '';
  }
}
async function getGitFileRelativePath(_0x6ddbc9) {
  try {
    let [_0x17c1f1] = await getGitRootAndRelativePath(_0x6ddbc9);
    return await executeGitCommand('rev-parse --abbrev-ref HEAD', _0x17c1f1, true);
  } catch (_0x282bd6) {
    return Logger.debug('Failed to get branch', {
      error: _0x282bd6,
      path: _0x6ddbc9.fsPath
    }), '';
  }
}
async function getGitRemoteUrl(_0x1c516d) {
  try {
    let [_0xee287f] = await getGitRootAndRelativePath(_0x1c516d);
    return await executeGitCommand("rev-parse HEAD", _0xee287f, true);
  } catch (_0x3ccf93) {
    return Logger.debug('Failed to get commit hash', _0x3ccf93), '';
  }
}
async function getRepoMappingFromUri(_0x21d9a6) {
  try {
    let _0x11698b = await getGitBranch(_0x21d9a6),
      _0x4bad89 = await executeGitCommand('config --get remote.origin.url', _0x11698b, true);
    return new Jm(_0x4bad89, _0x11698b);
  } catch (_0xf03117) {
    throw Logger.debug("Failed to get repo mapping", _0xf03117), new InvalidRepoUrlError('Failed to get repo mapping for ' + _0x21d9a6.fsPath);
  }
}
async function getAllRepoMappingsFromUri(_0x7ca9c1) {
  try {
    let _0x408af2 = await getGitBranch(_0x7ca9c1),
      _0x77255c = (await executeGitCommand("remote -v | awk '{print $2}'", _0x408af2, true)).split('\x0a').map(_0x53ba85 => _0x53ba85.trim()).filter(_0x25b0e0 => _0x25b0e0 !== '');
    return Array.from(new Set(_0x77255c)).map(_0x591d81 => new Jm(_0x591d81, _0x408af2));
  } catch (_0x545926) {
    throw Logger.debug("Failed to get all repo mappings", _0x545926), new InvalidRepoUrlError("Failed to get repo mappings for " + _0x7ca9c1.fsPath);
  }
}
async function isFileIgnoredByGit(_0x9b462a) {
  try {
    let [_0x1a6e14] = await getGitRootAndRelativePath(_0x9b462a);
    return (await executeGitCommand('check-ignore -v ' + _0x9b462a.fsPath, _0x1a6e14, true)).trim().length > 0;
  } catch (_0x910467) {
    return Logger.debug('Failed to check if file is ignored', _0x910467), false;
  }
}
async function getGitCommitInfo(_0x5afcc4) {
  try {
    let [_0x3fb7a6] = await getGitRootAndRelativePath(_0x5afcc4);
    return (await executeGitCommand("branch --sort=-creatordate --format='%(refname:short)'", _0x3fb7a6, true)).split('\x0a').map(_0x46462b => _0x46462b.trim()).filter(_0x4416d3 => _0x4416d3.length > 0);
  } catch (_0x472b11) {
    return Logger.debug('Failed to get local branches', _0x472b11), [];
  }
}
async function getDefaultGitBranch(_0x43680c) {
  try {
    let [_0x216c26] = await getGitRootAndRelativePath(_0x43680c);
    return (await executeGitCommand("symbolic-ref refs/remotes/origin/HEAD", _0x216c26, true)).replace("refs/remotes/origin/", '').trim();
  } catch (_0x4f88d0) {
    return Logger.debug("Failed to get default branch", _0x4f88d0), 'main';
  }
}
async function hasUncommittedChanges(_0x197778) {
  try {
    let [_0x4c4bb5] = await getGitRootAndRelativePath(_0x197778);
    return (await executeGitCommand('status --porcelain', _0x4c4bb5, true)).trim().length > 0;
  } catch (_0x6f688d) {
    return Logger.debug('Failed to check uncommitted changes', _0x6f688d), false;
  }
}
async function getGitDiff(_0x383d51, _0xe0d4ca = 50) {
  try {
    let [_0x5c7c81] = await getGitRootAndRelativePath(_0x383d51);
    return (await executeGitCommand('log --format=\x27%H|%s|%an|%ad\x27 --date=short -n ' + _0xe0d4ca, _0x5c7c81, true)).split('\x0a').filter(_0x1c3fb3 => _0x1c3fb3.trim().length > 0).map(_0x4fcf58 => {
      let _0xcfc16c = _0x4fcf58.split('|'),
        _0x4d654c = _0xcfc16c[0]?.['trim']() || '',
        _0x55ac91 = _0xcfc16c[_0xcfc16c.length - 2]?.["trim"]() || '',
        _0x5af546 = _0xcfc16c[_0xcfc16c.length - 1]?.['trim']() || '',
        _0x1ca724 = _0xcfc16c.slice(1, _0xcfc16c.length - 2).join('|').trim() || '';
      return {
        hash: _0x4d654c,
        message: _0x1ca724,
        author: _0x55ac91,
        date: _0x5af546
      };
    });
  } catch (_0x101427) {
    return Logger.debug("Failed to get recent commits", _0x101427), [];
  }
}
function parseGitStatusCode(_0x2a340d) {
  if (_0x2a340d.length !== 2) return Logger.debug('Invalid git status code length: ' + _0x2a340d), yt.UNKNOWN_STATUS;
  let _0x2a22f0 = _0x2a340d[0],
    _0x373619 = _0x2a340d[1];
  return _0x2a340d === '??' ? yt.UNTRACKED : _0x2a340d === '!!' ? yt.IGNORED : _0x2a340d === 'DD' ? yt.BOTH_DELETED : _0x2a340d === 'AU' ? yt.ADDED_BY_US : _0x2a340d === 'UD' ? yt.DELETED_BY_THEM : _0x2a340d === 'UA' ? yt.ADDED_BY_THEM : _0x2a340d === 'DU' ? yt.DELETED_BY_US : _0x2a340d === 'AA' ? yt.BOTH_ADDED : _0x2a340d === 'UU' ? yt.BOTH_MODIFIED : _0x2a22f0 === 'M' ? yt.INDEX_MODIFIED : _0x2a22f0 === 'A' ? yt.INDEX_ADDED : _0x2a22f0 === 'D' ? yt.INDEX_DELETED : _0x2a22f0 === 'R' ? yt.INDEX_RENAMED : _0x2a22f0 === 'C' ? yt.INDEX_COPIED : _0x2a22f0 === 'T' ? yt.TYPE_CHANGED : _0x2a22f0 === 'I' ? yt.INTENT_TO_ADD : _0x373619 === 'M' ? yt.MODIFIED : _0x373619 === 'D' ? yt.DELETED : _0x373619 === 'T' ? yt.TYPE_CHANGED : (Logger.debug("Unrecognized git status code: " + _0x2a340d), yt.UNKNOWN_STATUS);
}
function parseGitStatusOutput(_0x318e91) {
  let _0x178f91 = [],
    _0x12ff83 = _0x318e91.split('\x0a');
  for (let key of _0x12ff83) {
    if (key.length === 0) continue;
    if (key.length < 3) {
      Logger.debug('Invalid git status line: ' + key);
      continue;
    }
    let _0x3a7522 = key.substring(0, 2),
      _0x571797 = key.substring(3),
      _0x27129e;
    if (_0x571797.includes(" -> ")) {
      let _0x370a80 = _0x571797.split(' -> ');
      _0x370a80.length === 2 && (_0x27129e = _0x370a80[0].trim(), _0x571797 = _0x370a80[1].trim(), _0x27129e.startsWith('\x22') && _0x27129e.endsWith('\x22') && (_0x27129e = _0x27129e.slice(1, -1)));
    }
    _0x571797.startsWith('\x22') && _0x571797.endsWith('\x22') && (_0x571797 = _0x571797.slice(1, -1));
    let _0x273a2d = parseGitStatusCode(_0x3a7522);
    _0x178f91.push({
      filePath: _0x571797,
      status: _0x273a2d,
      previousPath: _0x27129e
    });
  }
  return _0x178f91;
}
function parseDiffStatusChar(_0x2072d3) {
  switch (_0x2072d3) {
    case 'A':
      return yt.INDEX_ADDED;
    case 'M':
      return yt.MODIFIED;
    case 'D':
      return yt.DELETED;
    case 'R':
      return yt.INDEX_RENAMED;
    case 'C':
      return yt.INDEX_COPIED;
    case 'T':
      return yt.TYPE_CHANGED;
    case 'U':
      return yt.BOTH_MODIFIED;
    default:
      return Logger.debug('Unrecognized diff status: ' + _0x2072d3), yt.UNKNOWN_STATUS;
  }
}
function parseDiffNameStatus(_0x2736d7) {
  let _0x198f29 = [],
    _0xf8064d = _0x2736d7.split('\x0a');
  for (let key of _0xf8064d) {
    let _0x5954cf = key.trim();
    if (_0x5954cf.length === 0) continue;
    let _0x4f2cd7 = _0x5954cf.split('\x09');
    if (_0x4f2cd7.length < 2) {
      Logger.debug('Invalid diff name-status line: ' + _0x5954cf);
      continue;
    }
    let _0x7b16c2 = _0x4f2cd7[0].charAt(0),
      _0x4e6aab,
      _0x2b5fc7;
    (_0x7b16c2 === 'R' || _0x7b16c2 === 'C') && _0x4f2cd7.length >= 3 ? (_0x2b5fc7 = _0x4f2cd7[1], _0x4e6aab = _0x4f2cd7[2]) : _0x4e6aab = _0x4f2cd7[1], _0x198f29.push({
      filePath: _0x4e6aab,
      status: _0x7b16c2,
      previousPath: _0x2b5fc7
    });
  }
  return _0x198f29;
}
async function createFileChangeInfo(_0x448c75, _0x28031d, _0x303c2d, _0x17d22b, _0xdf0606, _0x12c99d, _0x87bd67) {
  let _0x13174d = await TraycerPath.fromPath(path_module.join(_0x448c75, _0x28031d)),
    _0x23dfa9 = _0x87bd67 ? await TraycerPath.fromPath(path_module.join(_0x448c75, _0x87bd67)) : void 0;
  return {
    currentPath: _0x13174d.proto,
    currentFileContent: _0xdf0606,
    previousFileContent: _0x12c99d,
    previousPath: _0x23dfa9?.["proto"],
    diff: _0x303c2d,
    gitStatus: _0x17d22b
  };
}
async function getFileContentAtRef(_0x4a84f0, _0x4fe54b, _0x38e9c4) {
  try {
    let [_0x52c7af] = await getGitRootAndRelativePath(_0x4a84f0);
    return await executeGitCommand('show ' + _0x4fe54b + ':' + _0x38e9c4, _0x52c7af, false);
  } catch (_0x59d559) {
    return Logger.debug('Failed to get file content at ref', {
      error: _0x59d559,
      ref: _0x4fe54b,
      filePath: _0x38e9c4
    }), '';
  }
}
function createNewFileDiff(_0x333ef9, _0x32eabf) {
  if (!_0x333ef9) return '';
  let _0x59f31f = _0x333ef9.split('\x0a'),
    _0x2c2b9d = ["--- /dev/null", '+++ b/' + _0x32eabf, '@@ -0,0 +1,' + _0x59f31f.length + " @@"];
  for (let key of _0x59f31f) _0x2c2b9d.push('+' + key);
  return _0x2c2b9d.join('\x0a');
}
async function createFileDeltaFromStatus(_0x1e821c, _0x132241, _0x462b16, _0x336590, _0x52e6f7) {
  try {
    if (_0x336590 === yt.UNTRACKED) return await createUntrackedFileDiff(_0x1e821c, _0x462b16);
    let _0x2f5f0f = path_module.join(_0x1e821c, _0x462b16),
      _0x567180 = '';
    try {
      _0x567180 = await In.getSourceCode(_0x2f5f0f);
    } catch (_0x23ebc6) {
      Logger.debug('Failed to get current file content', {
        error: _0x23ebc6,
        filePath: _0x462b16
      });
    }
    let _0x4ab882;
    if (_0x336590 !== yt.DELETED && _0x336590 !== yt.INDEX_DELETED) {
      let _0x17e942 = _0x52e6f7 || _0x462b16,
        _0x426d52 = vscode_module.Uri.file(path_module.join(_0x1e821c, _0x17e942));
      _0x4ab882 = await getGitRootPath(_0x426d52);
    }
    let _0x2cc5d2 = '';
    try {
      _0x336590 === yt.DELETED || _0x336590 === yt.INDEX_DELETED ? _0x2cc5d2 = await executeGitCommand('diff HEAD -- \x22' + _0x462b16 + '\x22', _0x1e821c, false) : _0x336590 === yt.INDEX_RENAMED && _0x52e6f7 ? _0x2cc5d2 = await executeGitCommand("diff HEAD -- \"" + _0x52e6f7 + '\x22 \x22' + _0x462b16 + '\x22', _0x1e821c, false) : _0x2cc5d2 = await executeGitCommand("diff HEAD -- \"" + _0x462b16 + '\x22', _0x1e821c, false);
    } catch (_0x185dd1) {
      Logger.debug('Failed to generate diff', {
        error: _0x185dd1,
        filePath: _0x462b16
      }), _0x2cc5d2 = '';
    }
    return createFileChangeInfo(_0x1e821c, _0x462b16, _0x2cc5d2, _0x336590, _0x567180, _0x4ab882, _0x52e6f7);
  } catch (_0x45c369) {
    Logger.debug('Failed to create FileDelta from status', {
      error: _0x45c369,
      filePath: _0x462b16,
      status: _0x336590
    });
    let [_0x531057] = await getGitRootAndRelativePath(_0x132241).catch(() => [_0x132241.fsPath, _0x462b16]);
    return createFileChangeInfo(_0x531057, _0x462b16, '', _0x336590, '', '', _0x52e6f7);
  }
}
async function createUntrackedFileDiff(_0x3d2f01, _0x1d7278) {
  try {
    let _0x162430 = path_module.join(_0x3d2f01, _0x1d7278),
      _0x39ccf2 = '';
    try {
      _0x39ccf2 = await In.getSourceCode(_0x162430);
    } catch (_0x1f71f6) {
      Logger.debug('Failed to get untracked file content', {
        error: _0x1f71f6,
        filePath: _0x1d7278
      });
    }
    let _0x1723da = createNewFileDiff(_0x39ccf2, _0x1d7278);
    return createFileChangeInfo(_0x3d2f01, _0x1d7278, _0x1723da, yt.UNTRACKED, _0x39ccf2, void 0, void 0);
  } catch (_0x13833d) {
    return Logger.debug("Failed to create FileDelta for untracked file", {
      error: _0x13833d,
      filePath: _0x1d7278
    }), createFileChangeInfo(_0x3d2f01, _0x1d7278, '', yt.UNTRACKED, '', void 0, void 0);
  }
}
async function getUncommittedFileDeltas(_0x3a3c62, _0x2d4c32) {
  try {
    let [_0x1e9cf5] = await getGitRootAndRelativePath(_0x3a3c62),
      _0x3426d7 = _0x2d4c32 ? "status --porcelain -- \"" + _0x2d4c32 + '\x22' : 'status --porcelain',
      _0x34a705 = await executeGitCommand(_0x3426d7, _0x1e9cf5, false);
    if (_0x34a705.trim().length === 0) return [];
    let _0x2c2240 = parseGitStatusOutput(_0x34a705);
    if (_0x2c2240.length === 0) return [];
    let _0x3a9066 = [];
    for (let key of _0x2c2240) try {
      let _0x163b9d = await createFileDeltaFromStatus(_0x1e9cf5, _0x3a3c62, key.filePath, key.status, key.previousPath);
      _0x3a9066.push(_0x163b9d);
    } catch (_0x465cf5) {
      Logger.debug("Failed to create FileDelta from status entry", {
        error: _0x465cf5,
        filePath: key.filePath,
        status: key.status
      });
    }
    return _0x3a9066;
  } catch (_0x363bac) {
    return Logger.debug("Failed to get all file statuses as deltas", {
      error: _0x363bac,
      path: _0x3a3c62.fsPath
    }), [];
  }
}
async function getRevisionDiffWithContent(_0x3ef3bf, _0x2b4220, _0x49f087) {
  try {
    let [_0x860a51] = await getGitRootAndRelativePath(_0x3ef3bf),
      _0x4ccfbb = _0x49f087 ? 'diff ' + _0x2b4220 + ' --name-status -- \x22' + _0x49f087 + '\x22' : "diff " + _0x2b4220 + " --name-status",
      _0x5db65 = await executeGitCommand(_0x4ccfbb, _0x860a51, false);
    if (_0x5db65.trim().length === 0) return [];
    let _0x1e4629 = parseDiffNameStatus(_0x5db65),
      _0x4f787f = [],
      _0x5175cf = _0x2b4220.includes('..') || _0x2b4220.includes('...');
    for (let key of _0x1e4629) try {
      let _0x19a412 = await executeGitCommand("diff " + _0x2b4220 + " -- \"" + key.filePath + '\x22', _0x860a51, false),
        _0x59321b = parseDiffStatusChar(key.status),
        _0x3a8602 = '',
        _0x4ae3f6 = '';
      if (_0x5175cf) {
        let _0x239d89 = _0x2b4220.includes('...') ? '...' : '..',
          _0x494290 = _0x2b4220.split(_0x239d89),
          _0x57a26c = _0x494290[0],
          _0x453b4e = _0x494290[1] || "HEAD";
        _0x59321b !== yt.DELETED && _0x59321b !== yt.INDEX_DELETED && (_0x3a8602 = await getFileContentAtRef(_0x3ef3bf, _0x453b4e, key.filePath)), _0x59321b !== yt.INDEX_ADDED && _0x59321b !== yt.UNTRACKED && (_0x4ae3f6 = await getFileContentAtRef(_0x3ef3bf, _0x57a26c, key.previousPath || key.filePath));
      } else {
        if (_0x59321b !== yt.DELETED && _0x59321b !== yt.INDEX_DELETED) {
          let _0x1f028f = path_module.join(_0x860a51, key.filePath);
          _0x3a8602 = await In.getSourceCode(_0x1f028f);
        }
        _0x59321b !== yt.INDEX_ADDED && _0x59321b !== yt.UNTRACKED && (_0x4ae3f6 = await getFileContentAtRef(_0x3ef3bf, _0x2b4220, key.previousPath || key.filePath));
      }
      let _0x3350eb = await createFileChangeInfo(_0x860a51, key.filePath, _0x19a412, _0x59321b, _0x3a8602, _0x4ae3f6, key.previousPath);
      _0x4f787f.push(_0x3350eb);
    } catch (_0x2a4328) {
      Logger.debug('Failed to process file in revision diff', {
        error: _0x2a4328,
        filePath: key.filePath
      });
    }
    return _0x4f787f;
  } catch (_0x5474b3) {
    return Logger.debug('Failed to get revision diff', {
      error: _0x5474b3,
      revisionSpec: _0x2b4220
    }), [];
  }
}
var workspace_info,
  initWorkspaceInfo = __esmModule(() => {
    'use strict';

    initSearchUtils(), initWorkspaceAssociation(), initRepoMappingManager(), workspace_info = class _0x2ba944 {
      constructor() {
        this.wsInfoInitLock = new Mutex(), this._currentWSInfo = void 0, this.concurrencyLimiter = new RequestQueue(10, 200, 5000);
      }
      static {
        this.MAX_BYTES = 100000;
      }
      static ["getInstance"]() {
        return _0x2ba944.instance || (_0x2ba944.instance = new _0x2ba944()), _0x2ba944.instance;
      }
      async ["getTreeSitterWasmDir"]() {
        return path_module.join((0, path_module.dirname)(__dirname), 'out', 'tree-sitter-wasm');
      }
      async ["getTiktokenWorkerPoolPath"]() {
        return path_module.join((0, path_module.dirname)(__dirname), "resources", "tiktokenWorkerPool.js");
      }
      async ['getWorkspaceInfo']() {
        if (this._currentWSInfo === void 0) {
          let _0x2f6389 = await this.wsInfoInitLock.acquire();
          try {
            if (this._currentWSInfo !== void 0) return this._currentWSInfo;
            let _0x584d09 = vscode_module.workspace.workspaceFile,
              _0x3defff;
            if (_0x584d09 && _0x584d09.scheme !== "untitled") try {
              _0x3defff = await TraycerPath.fromPath(_0x584d09.fsPath);
            } catch {
              _0x3defff = void 0;
            }
            let _0x8e5081 = await Promise.all(vscode_module.workspace.workspaceFolders?.["map"](async _0x44203a => await TraycerPath.fromPath(_0x44203a.uri.fsPath)) || []),
              _0x646619 = new Pf(_0x3defff, _0x8e5081);
            this._currentWSInfo = {
              WSAssociation: _0x646619,
              persistedWSAssociation: _0x646619.serializeToStorage(),
              workspaceScope: formatRangeSnippet(_0x646619, _0x3defff)
            };
          } finally {
            _0x2f6389();
          }
        }
        return this._currentWSInfo;
      }
      ["invalidateWSInfo"]() {
        this._currentWSInfo = void 0;
      }
      ["getResourcesDir"]() {
        return path_module.join((0, path_module.dirname)(__dirname), "resources");
      }
      async ['isDirectory'](_0x3191c4) {
        try {
          return (await (0, fs_promises_module.lstat)(_0x3191c4)).isDirectory();
        } catch (_0xcedb68) {
          return Logger.debug("Error checking if path is directory: " + _0x3191c4, _0xcedb68), false;
        }
      }
      async ["getPathProto"](_0x2a455a) {
        try {
          return (await TraycerPath.fromPath(_0x2a455a)).proto;
        } catch (_0x4918a4) {
          return Logger.debug("Error getting path proto", _0x4918a4, _0x2a455a), null;
        }
      }
      ["getIdeAgentInfo"]() {
        return getAgentIcon(this.getIdeInfo().name);
      }
      ["getIdeInfo"]() {
        return {
          ideType: "vscode",
          name: vscode_module.env.appName.toLowerCase().replaceAll(' ', ''),
          uriScheme: vscode_module.env.uriScheme,
          version: vscode_module.version,
          remoteName: vscode_module.env.remoteName || "local"
        };
      }
      ['getPlatform']() {
        return process.platform === 'win32' ? xr.WINDOWS : xr.POSIX;
      }
      ['getFileNameWithoutExtension'](_0x159785) {
        return path_module.basename(_0x159785, path_module.extname(_0x159785));
      }
      async ["fileExists"](_0x44ff7a) {
        let _0x7c6656 = await this.resolveAbsFilepathInWorkspace(_0x44ff7a);
        return vscode_module.workspace.fs.stat(createRemoteOrLocalUri(_0x7c6656)).then(() => true, () => false);
      }
      ['getWorkspaceDirs']() {
        return vscode_module.workspace.workspaceFolders?.['map'](_0x1c4d1b => _0x1c4d1b.uri.fsPath) || [];
      }
      async ['getCurrentWSInfo']() {
        return await this.getWorkspaceInfo();
      }
      async ["getOpenFiles"]() {
        return vscode_module.window.tabGroups.all.map(_0x60de3f => _0x60de3f.tabs.map(_0x1a60a1 => _0x1a60a1.input?.['uri'])).flat().filter(Boolean).filter(_0x3013d8 => this.documentIsCode(_0x3013d8)).map(_0x4fedde => _0x4fedde.fsPath);
      }
      async ['readFile'](_0x14f47a, _0x54aac0 = true) {
        return this.concurrencyLimiter.enqueueRequest(() => this.readFileImpl(_0x14f47a, _0x54aac0));
      }
      ["isVirtualUri"](_0x29d0bc) {
        return _0x29d0bc.scheme === EXTENSION_ID || _0x29d0bc.scheme === MEDIA_VIEW_ID || _0x29d0bc.scheme === EDITABLE_DIFF_VIEW_ID;
      }
      async ['readFileImpl'](_0x20f64c, _0x531515 = false) {
        let _0x1e1d0f = vscode_module.Uri.parse(_0x20f64c),
          _0x3866a1 = this.isVirtualUri(_0x1e1d0f);
        try {
          _0x3866a1 || (_0x20f64c = await this.getAbsolutePath(_0x20f64c), _0x1e1d0f = createRemoteOrLocalUri(_0x20f64c));
          let _0x4efa76 = await vscode_module.workspace.fs.readFile(_0x1e1d0f);
          return _0x531515 ? new TextDecoder().decode(_0x4efa76.slice(0, _0x2ba944.MAX_BYTES)) : new TextDecoder().decode(_0x4efa76);
        } catch (_0x31717e) {
          if (Logger.debug('Error reading file', _0x31717e, _0x20f64c), !_0x3866a1) {
            let _0x475e98 = createRemoteOrLocalUri(_0x20f64c);
            try {
              let _0x3cb024 = await (0, fs_promises_module.lstat)(_0x475e98.fsPath);
              if (_0x3cb024.size > 10 * _0x2ba944.MAX_BYTES || _0x3cb024.isDirectory()) return '';
              if (_0x3cb024.isSymbolicLink()) {
                let _0x4f88d4 = await (0, fs_promises_module.realpath)(_0x20f64c);
                return this.readFile(_0x4f88d4);
              }
              return '';
            } catch (_0x30c41c) {
              return Logger.debug('Error stat file', _0x30c41c, _0x20f64c), '';
            }
          }
          return '';
        }
      }
      async ['getBranch'](_0x3ed234) {
        return getGitFileRelativePath(vscode_module.Uri.file(_0x3ed234));
      }
      async ["getLastModified"](_0x82ae51) {
        let _0x263d24 = {};
        for (let _0x8a5157 = 0; _0x8a5157 < _0x82ae51.length; _0x8a5157 += 100) {
          let _0x2ba387 = _0x82ae51.slice(_0x8a5157, _0x8a5157 + 100);
          await Promise.allSettled(_0x2ba387.map(async _0x4aece6 => {
            let _0x13a4c3 = await this.statFile(_0x4aece6);
            _0x263d24[_0x4aece6] = {
              lastModified: _0x13a4c3.mtime,
              size: _0x13a4c3.size
            };
          })), await new Promise(_0x4fcdfa => setImmediate(_0x4fcdfa));
        }
        return _0x263d24;
      }
      async ["statFile"](_0x191d4f) {
        return this.concurrencyLimiter.enqueueRequest(() => new Promise((_0x3ffeb7, _0x124097) => {
          try {
            let _0x5c850d = vscode_module.workspace.fs.stat(createRemoteOrLocalUri(_0x191d4f));
            _0x3ffeb7(_0x5c850d);
          } catch (_0x269c80) {
            _0x124097(_0x269c80);
          }
        }));
      }
      ['pathSep']() {
        return path_module.sep;
      }
      async ['getAbsolutePath'](_0x54dfec) {
        let _0x69183 = this.getWorkspaceDirs();
        return !path_module.isAbsolute(_0x54dfec) && _0x69183.length === 1 ? path_module.join(_0x69183[0], _0x54dfec) : createRemoteOrLocalUri(_0x54dfec).fsPath;
      }
      ['documentIsCode'](_0x3e4ef5) {
        return _0x3e4ef5.scheme === "file" || _0x3e4ef5.scheme === 'vscode-remote';
      }
      async ["resolveAbsFilepathInWorkspace"](_0x11d839) {
        if (path_module.isAbsolute(_0x11d839)) return _0x11d839;
        let _0x38a182 = this.getWorkspaceDirs();
        for (let key of _0x38a182) {
          let _0x243124 = path_module.resolve(key, _0x11d839);
          if (await this.fileExists(_0x243124)) return _0x243124;
        }
        return _0x11d839;
      }
      async ["getRepositories"]() {
        let _0x370b59 = this.getWorkspaceDirs(),
          _0x54bfd1 = [];
        for (let key of _0x370b59) try {
          let _0x3911b9 = await Du.getInstance().getRepoMapping(vscode_module.Uri.file(key));
          _0x54bfd1.push(_0x3911b9.repoUrl);
        } catch (_0x5544e7) {
          Logger.debug('Failed to get repository for', key, _0x5544e7), _0x54bfd1.push("local_repository");
        }
        return _0x54bfd1;
      }
      ["getLogger"]() {
        return Logger;
      }
      async ["getWorkspaceFiles"](_0x1f10bc) {
        return await searchFilesWithRipgrep(_0x1f10bc, '', void 0, null, Number.MAX_SAFE_INTEGER, true);
      }
      async ["openExternalLink"](_0x41d93f) {
        await vscode_module.env.openExternal(vscode_module.Uri.parse(_0x41d93f));
      }
      ['isWorkspaceOpen'](_0x3aad4b) {
        return this.getWorkspaceDirs().some(_0x48199e => TraycerPath.pathEquals(_0x3aad4b, _0x48199e));
      }
    };
  }),
  TemplateFileNotFoundError = class extends Error {
    constructor(_0xe835c) {
      super('Template file ' + _0xe835c + " not found"), this.name = "TemplateFileNotFoundError";
    }
  },
  TemplateFileEmptyError = class extends Error {
    constructor() {
      super("File is empty"), this.name = "TemplateFileEmptyError";
    }
  },
  TemplateFileNotMarkdownError = class extends Error {
    constructor() {
      super("Only markdown (.md) files are supported"), this.name = 'TemplateFileNotMarkdownError';
    }
  },
  TemplateMissingMetadataError = class extends Error {
    constructor() {
      super('Missing metadata'), this.name = 'TemplateMissingMetadataError';
    }
  },
  TemplateInvalidMetadataError = class extends Error {
    constructor(_0xd43f10) {
      super("Invalid metadata" + (_0xd43f10 ? ': ' + _0xd43f10 : '')), this.name = 'TemplateInvalidMetadataError';
    }
  },
  TemplateFileAlreadyExistsError = class extends Error {
    constructor(_0xcd915f) {
      super('Template file ' + _0xcd915f + " already exists"), this.name = 'TemplateFileAlreadyExistsError';
    }
  },
  TemplateNotFoundError = class extends Error {
    constructor(_0x3eeaeb) {
      super("Template not found at " + _0x3eeaeb), this.name = "TemplateNotFoundError";
    }
  },
  CLIAgentNameConflictsWithBuiltInAgentError = class extends Error {
    constructor(_0x4bfacc, _0x480537) {
      super('CLI agent name \x22' + _0x4bfacc + '\x22 conflicts with built-in agent: ' + _0x480537 + '. Please choose a different name.'), this.name = 'CLIAgentNameConflictsWithBuiltInAgentError';
    }
  },
  TemplateNameNotAllowedError = class extends Error {
    constructor(_0x754de5) {
      super('Template name \x22' + _0x754de5 + '\x22 is not allowed. This may be due to the reasons:\x0a      - The template name is already in use\x0a      - The template name ends with .sh or .bat\x0a      - The template name conflicts with a built-in agent'), this.name = "TemplateNameNotAllowedError";
    }
  },
  CLIAgentInvalidPlatformError = class extends Error {
    constructor(_0x183590, _0x3bfa69, _0x50d8b3) {
      super("CLI agent template file extension \"" + _0x183590 + '\x22 is invalid for ' + getGitignoreCache(_0x3bfa69) + ' platform. Expected extension: ' + _0x50d8b3), this.name = "CLIAgentInvalidPlatformError";
    }
  },
  yn,
  initPosthogAnalytics = __esmModule(() => {
    'use strict';

    initSearchConfig(), yn = class _0x693982 {
      constructor(_0x3044ab, _0x44cbc2, _0x23f42f = false) {
        this.userId = _0x3044ab, this.userEmail = _0x44cbc2, this.privacyMode = _0x23f42f;
        let _0x2072b2 = config.posthogApiKey,
          _0xc63215 = config.posthogApiUri,
          _0x430800 = new posthog_module.PostHog(_0x2072b2, {
            host: _0xc63215,
            flushAt: 3,
            flushInterval: 30000
          });
        _0x430800.identify(this.userId, {
          name: this.userId || '',
          email: this.userEmail || ''
        }), this.posthog = _0x430800;
      }
      ['reIdentify'](_0x43c654, _0x425039, _0x3e5010 = false) {
        if (!_0x43c654) return;
        let _0x1b73be = _0x43c654 === this.userId,
          _0x31cc6f = _0x425039 === this.userEmail;
        _0x1b73be && _0x31cc6f || (this.userId = _0x43c654, this.userEmail = _0x425039, this.privacyMode = _0x3e5010, this.posthog.identify(_0x43c654, {
          name: this.userId,
          email: this.userEmail || ''
        }));
      }
      static ["getInstance"](_0x42f455, _0x3ebb1f, _0x9cf05f = false) {
        let _0x11638f = _0x693982.instance;
        return _0x11638f ? _0x11638f.reIdentify(_0x42f455, _0x3ebb1f, _0x9cf05f) : (_0x11638f = new _0x693982(_0x42f455, _0x3ebb1f, _0x9cf05f), _0x693982.instance = _0x11638f), _0x11638f;
      }
      ['getSystemTags']() {
        let _0x203853 = {
          defaultProperties: {
            version: config.version || "unknown"
          },
          userProperties: {}
        };
        return this.userId && (_0x203853.defaultProperties.userId = this.userId), _0x203853;
      }
      ["getAllTags"](_0x1584b1) {
        let _0x453c15 = this.getSystemTags();
        return {
          ..._0x1584b1?.["defaultProperties"],
          ...(this.privacyMode ? {} : _0x1584b1?.['userProperties']),
          ..._0x453c15.defaultProperties,
          ..._0x453c15.userProperties
        };
      }
      ['increment'](_0x25cc48, _0x38b2da) {
        try {
          this.posthog.capture(_0x25cc48, this.getAllTags(_0x38b2da));
        } catch (_0x17a781) {
          Logger.warn("Failed to increment event: " + _0x25cc48, _0x17a781 instanceof Error ? _0x17a781.message : String(_0x17a781));
        }
      }
    };
  }),
  initAnalytics = __esmModule(() => {
    'use strict';

    initPosthogAnalytics();
  }),
  CloudAuthHandler = class {
    constructor(_0x3bc94d) {
      this.auth = _0x3bc94d;
    }
    ["handle"](_0x3cd9f2) {
      switch (_0x3cd9f2.type) {
        case hw.SIGNIN:
          return this.signinWithCloudUI();
        case hw.PASTE_TOKEN:
          return this.pasteTokenFromBrowser();
      }
    }
    async ['signinWithCloudUI']() {
      return this.auth.openCloudUI();
    }
    async ['pasteTokenFromBrowser']() {
      await this.auth.promptPasteToken();
    }
  },
  initCommentNavigatorDeps = __esmModule(() => {
    'use strict';

    initCommentNavigator();
  }),
  kYe,
  RYe,
  na,
  initFilePathHandler = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initCommentNavigatorDeps(), kYe = /`file:([^`]+)`|file:([^\s),;`]+)/g, RYe = 100, na = class _0x1552a5 {
      constructor() {
        this.pathCache = new lru_map_module.LRUMap(RYe);
      }
      static ['getInstance']() {
        return _0x1552a5.instance || (_0x1552a5.instance = new _0x1552a5()), _0x1552a5.instance;
      }
      async ["invalidatePath"](_0x1fc005) {
        let _0x2c5071 = await TraycerPath.fromPath(_0x1fc005);
        this.pathCache.delete(_0x2c5071.relPath);
      }
      ["clearCache"]() {
        this.pathCache.clear();
      }
      async ['handle'](_0x510cd1) {
        switch (_0x510cd1.type) {
          case PO.CONVERT_FILE_PATH:
            await this.convertFilePathAndReturn(_0x510cd1);
            return;
          default:
            Logger.warn("Unknown file message type: " + _0x510cd1.type);
            return;
        }
      }
      async ['convertFilePathAndReturn'](_0x12d63d) {
        let {
            requestId: _0x5ea94e,
            content: _0x42860b
          } = _0x12d63d,
          _0x113096 = await _0x1552a5.convertFilePath(_0x42860b),
          _0x2b8613 = {
            type: AO.FILE_PATH_CONVERTED,
            requestId: _0x5ea94e,
            convertedContent: _0x113096
          };
        return Qe.postToCommentNavigator(_0x2b8613);
      }
      static async ['convertFilePath'](_0x2fb9d4) {
        let _0x5b6343 = _0x2fb9d4;
        try {
          _0x5b6343 = await this.processFilePatterns(_0x2fb9d4, kYe);
        } catch (_0x4a1a0d) {
          Logger.error("Error converting file paths in content: " + _0x4a1a0d), _0x5b6343 = _0x2fb9d4;
        }
        return _0x5b6343;
      }
      static async ['processFilePatterns'](_0x31e9cb, _0x2d5fb3) {
        let _0x1acd6f = _0x31e9cb,
          _0x358b28 = [],
          _0x5baee9,
          _0x3042d8 = new RegExp(_0x2d5fb3.source, _0x2d5fb3.flags);
        for (; (_0x5baee9 = _0x3042d8.exec(_0x31e9cb)) !== null;) {
          let _0x1e398d = _0x5baee9[0],
            _0x157d36 = _0x5baee9[1] ?? _0x5baee9[2];
          _0x157d36 && _0x358b28.push({
            match: _0x1e398d,
            relativePath: _0x157d36,
            index: _0x5baee9.index
          });
        }
        let _0x55d44e = _0x1552a5.getInstance();
        for (let _0x867090 = _0x358b28.length - 1; _0x867090 >= 0; _0x867090--) {
          let {
              match: _0x51ac63,
              relativePath: _0x22bfc0,
              index: _0x21ed19
            } = _0x358b28[_0x867090],
            _0x455214 = _0x51ac63,
            _0xb3a9e8 = path_module.normalize(_0x22bfc0),
            _0x1ef788 = _0x55d44e.pathCache.get(_0xb3a9e8);
          if (_0x1ef788) _0x455214 = _0x1ef788.replacement;else {
            let _0x31a708 = await _0x1552a5.resolveFilePath(_0x22bfc0);
            _0x31a708 ? (_0x455214 = _0x31a708.replacement, _0x55d44e.pathCache.set(_0xb3a9e8, _0x31a708)) : _0x455214 = _0x22bfc0;
          }
          _0x1acd6f = _0x1acd6f.substring(0, _0x21ed19) + _0x455214 + _0x1acd6f.substring(_0x21ed19 + _0x51ac63.length);
        }
        return _0x1acd6f;
      }
      static async ['resolveFilePath'](_0x2aeda7) {
        if (path_module.isAbsolute(_0x2aeda7)) {
          let _0x26af08 = _0x2aeda7;
          if (await workspace_info.getInstance().fileExists(_0x26af08)) {
            let _0x107fe2 = TraycerPath.findWorkspaceForPath(_0x26af08),
              _0x527f91 = _0x26af08;
            _0x107fe2 && (_0x527f91 = path_module.relative(_0x107fe2, _0x26af08));
            let _0x2144ec = await workspace_info.getInstance().isDirectory(_0x26af08);
            return {
              replacement: '<' + RS + ' absPath=\x22' + _0x26af08 + '\x22' + (_0x2144ec ? " isDirectory=\"true\"" : '') + '>' + _0x527f91 + '</' + RS + '>',
              absolutePath: _0x26af08,
              isDirectory: _0x2144ec
            };
          }
        } else {
          let _0x5a54f2 = [],
            _0x3b3cec = workspace_info.getInstance().getWorkspaceDirs();
          for (let key of _0x3b3cec) {
            let _0x53e28b = path_module.join(key, _0x2aeda7);
            if (await workspace_info.getInstance().fileExists(_0x53e28b)) {
              let _0x13546a = await workspace_info.getInstance().isDirectory(_0x53e28b);
              _0x5a54f2.push({
                workspaceDir: key,
                absolutePath: _0x53e28b,
                isDirectory: _0x13546a
              });
            }
            if (_0x5a54f2.length > 1) break;
          }
          if (_0x5a54f2.length === 1) {
            let {
              absolutePath: _0x43d760,
              isDirectory: _0x1c4e1b
            } = _0x5a54f2[0];
            return {
              replacement: '<' + RS + " absPath=\"" + _0x43d760 + '\x22' + (_0x1c4e1b ? " isDirectory=\"true\"" : '') + '>' + _0x2aeda7 + '</' + RS + '>',
              absolutePath: _0x43d760,
              isDirectory: _0x1c4e1b
            };
          } else {
            if (_0x5a54f2.length > 1) return Logger.warn('FileHandler: Multiple workspace matches found for path: ' + _0x2aeda7), null;
          }
        }
        return null;
      }
    };
  }),
  GitHubAuthHandler = class {
    constructor(_0xf40a84) {
      this.auth = _0xf40a84;
    }
    ["handle"](_0x2127d9) {
      switch (_0x2127d9.type) {
        case Cv.SIGNIN:
          return this.signinWithGithub();
        case Cv.STATUS:
          return this.sendAuthenticationStatus();
        case Cv.SIGNOUT:
          return this.signOut();
      }
    }
    async ['signinWithGithub']() {
      if (!this.auth.traycerUser) await this.auth.promptSignIn();else return this.auth.sendAuthenticationStatus();
    }
    async ["sendAuthenticationStatus"]() {
      await this.auth.sendAuthenticationStatus();
    }
    async ['signOut']() {
      await this.auth.handleDeactivation();
    }
  },
  U1,
  initMetricsHandler = __esmModule(() => {
    'use strict';

    initAnalytics(), U1 = class {
      ['handle'](_0x44d825) {
        let _0x5ca766 = yn.getInstance();
        switch (_0x44d825.type) {
          case CO.TRACK_METRICS:
            _0x5ca766.increment(_0x44d825.name, null);
            break;
        }
      }
    };
  }),
  WorkspaceSettingsMigratorV1 = class {
    static ["migrate"](_0x423c93) {
      return {
        ..._0x423c93,
        activePromptTemplates: {
          plan: null,
          verification: null,
          generic: null,
          review: null
        }
      };
    }
  },
  WorkspaceSettingsMigratorV2 = class {
    static ["migrate"](_0x103548) {
      return {
        ..._0x103548,
        activePromptTemplates: {
          plan: _0x103548.activePromptTemplates?.["plan"] || null,
          verification: _0x103548.activePromptTemplates?.['verification'] || null,
          generic: _0x103548.activePromptTemplates?.["generic"] || null,
          review: _0x103548.activePromptTemplates?.['review'] || null,
          userQuery: null
        }
      };
    }
  },
  IdeAgentMigrator,
  initIdeAgentMigrator = __esmModule(() => {
    'use strict';

    initSearchConfig(), IdeAgentMigrator = class {
      static ["migrate"](_0x1f47c3) {
        let _0x153721 = _0x3192d8 => {
          let _0x157e40 = getAgentIcon(_0x3192d8);
          return {
            id: _0x157e40.id,
            type: _0x157e40.type,
            displayName: _0x157e40.displayName
          };
        };
        return {
          ..._0x1f47c3,
          lastUsedIDEAgents: {
            plan: _0x153721(config.lastUsedIDEAgent),
            verification: _0x153721(config.lastUsedIDEAgent),
            review: _0x153721(config.lastUsedIDEAgent),
            userQuery: _0x153721(config.lastUsedIDEAgent)
          },
          defaultTaskExecutionConfig: null
        };
      }
    };
  }),
  WorkspaceSettingsMigratorV3 = class {
    static ['migrate'](_0x2dd5f0) {
      return _0x2dd5f0.defaultTaskExecutionConfig === null ? {
        ..._0x2dd5f0,
        defaultTaskExecutionConfig: null
      } : {
        ..._0x2dd5f0,
        defaultTaskExecutionConfig: {
          plan: {
            ..._0x2dd5f0.defaultTaskExecutionConfig.plan,
            executionTimeoutMinutes: 10
          },
          review: {
            ..._0x2dd5f0.defaultTaskExecutionConfig.review,
            executionTimeoutMinutes: 10
          },
          verification: {
            ..._0x2dd5f0.defaultTaskExecutionConfig.verification,
            executionTimeoutMinutes: 10
          },
          userQuery: {
            ..._0x2dd5f0.defaultTaskExecutionConfig.userQuery,
            executionTimeoutMinutes: 10
          }
        }
      };
    }
  },
  WorkspaceSettingsMigratorV4 = class {
    static ['migrate'](_0x41d657) {
      return {
        ..._0x41d657,
        defaultTaskExecutionConfig: _0x41d657.defaultTaskExecutionConfig ? {
          plan: {
            ..._0x41d657.defaultTaskExecutionConfig.plan,
            ideAgent: AgentRegistry.getInstance().getAgentInfo(_0x41d657.defaultTaskExecutionConfig.plan.ideAgent.id)
          },
          review: {
            ..._0x41d657.defaultTaskExecutionConfig.review,
            ideAgent: AgentRegistry.getInstance().getAgentInfo(_0x41d657.defaultTaskExecutionConfig.review.ideAgent.id)
          },
          verification: {
            ..._0x41d657.defaultTaskExecutionConfig.verification,
            ideAgent: AgentRegistry.getInstance().getAgentInfo(_0x41d657.defaultTaskExecutionConfig.verification.ideAgent.id)
          },
          userQuery: {
            ..._0x41d657.defaultTaskExecutionConfig.userQuery,
            ideAgent: AgentRegistry.getInstance().getAgentInfo(_0x41d657.defaultTaskExecutionConfig.userQuery.ideAgent.id)
          }
        } : null,
        lastUsedIDEAgents: {
          plan: AgentRegistry.getInstance().getAgentInfo(_0x41d657.lastUsedIDEAgents.plan.id),
          verification: AgentRegistry.getInstance().getAgentInfo(_0x41d657.lastUsedIDEAgents.verification.id),
          review: AgentRegistry.getInstance().getAgentInfo(_0x41d657.lastUsedIDEAgents.review.id),
          userQuery: AgentRegistry.getInstance().getAgentInfo(_0x41d657.lastUsedIDEAgents.userQuery.id)
        }
      };
    }
  },
  WorkspaceSettingsMigratorV5 = class {
    static ["migrate"](_0x29ab44) {
      return {
        ..._0x29ab44,
        defaultTaskExecutionConfig: _0x29ab44.defaultTaskExecutionConfig ? {
          ..._0x29ab44.defaultTaskExecutionConfig,
          verification: {
            ..._0x29ab44.defaultTaskExecutionConfig.verification,
            maxReVerificationAttempts: 3
          }
        } : null,
        interviewTextOnlyMode: false
      };
    }
  },
  WorkspaceSettingsMigrator,
  initWorkspaceSettingsMigrator = __esmModule(() => {
    'use strict';

    initSearchConfig(), initIdeAgentMigrator(), WorkspaceSettingsMigrator = class {
      static ["migrate"](_0x2637c7) {
        let _0x4d7892 = config.CURRENT_WORKSPACE_SETTINGS_VERSION,
          _0x1c3c2c = _0x2637c7.metadata;
        for (; _0x1c3c2c.version < _0x4d7892;) {
          switch (Logger.debug("Migrating persisted workspace settings from version " + _0x1c3c2c.version + ' to ' + _0x4d7892), _0x1c3c2c.version) {
            case 1:
              Logger.debug('Migrating workspace settings data from v1 to v2'), _0x2637c7.serializedItem = WorkspaceSettingsMigratorV1.migrate(_0x2637c7.serializedItem);
              break;
            case 2:
              Logger.debug("Migrating workspace settings data from v2 to v3"), _0x2637c7.serializedItem = WorkspaceSettingsMigratorV2.migrate(_0x2637c7.serializedItem);
              break;
            case 3:
              Logger.debug('Migrating workspace settings data from v3 to v4'), _0x2637c7.serializedItem = IdeAgentMigrator.migrate(_0x2637c7.serializedItem);
              break;
            case 4:
              Logger.debug('Migrating workspace settings data from v4 to v5'), _0x2637c7.serializedItem = WorkspaceSettingsMigratorV3.migrate(_0x2637c7.serializedItem);
              break;
            case 5:
              Logger.debug("Migrating workspace settings data from v5 to v6"), _0x2637c7.serializedItem = WorkspaceSettingsMigratorV4.migrate(_0x2637c7.serializedItem);
              break;
            case 6:
              Logger.debug('Migrating workspace settings data from v6 to v7'), _0x2637c7.serializedItem = WorkspaceSettingsMigratorV5.migrate(_0x2637c7.serializedItem);
              break;
            default:
              throw new Error('Attempting to migrate to invalid persisted workspace settings version: ' + _0x1c3c2c.version);
          }
          _0x1c3c2c.version = _0x1c3c2c.version + 1;
        }
        return _0x2637c7;
      }
    };
  }),
  WorkspaceSettingsPersistence,
  initWorkspaceSettingsPersistence = __esmModule(() => {
    'use strict';

    initSearchConfig(), initFileOperations(), initWorkspaceSettingsMigrator(), WorkspaceSettingsPersistence = class _0x241431 extends ol {
      constructor(_0x5c3e40, _0x47b84e) {
        super(_0x5c3e40, 'WorkspaceSettings', _0x47b84e, config.CURRENT_WORKSPACE_SETTINGS_VERSION, config.WORKSPACE_SETTINGS_SIZE), this.shouldInvalidateData = false, this.shouldInvalidateData = false;
      }
      static {
        this.instance = null;
      }
      static ['getInstance'](_0x32e91b, _0xcbead8) {
        if (!_0x241431.instance) {
          if (!_0x32e91b || !_0xcbead8) throw new Error("Context and appAssetsDB are required");
          _0x241431.instance = new _0x241431(_0x32e91b, _0xcbead8);
        }
        return _0x241431.instance;
      }
      async ['_addFromStorage'](_0x584507) {
        return Promise.allSettled([]);
      }
      ['getLiveItemIDs']() {
        return [];
      }
      ["migrateItem"](_0x171f50) {
        return WorkspaceSettingsMigrator.migrate(_0x171f50);
      }
      ['getRequiredFiles'](_0x37aa76) {
        return [];
      }
    };
  }),
  PlanExecutionFailedError = class extends Error {
    constructor(_0x5d63c0) {
      super(_0x5d63c0), this.name = "PlanExecutionFailedError";
    }
  },
  PlanGenerationFailedError = class extends Error {
    constructor(_0x39a0ea) {
      super(_0x39a0ea), this.name = "PlanGenerationFailedError";
    }
  },
  GenericPlanError = class extends Error {
    constructor(_0x3cb44e) {
      super(_0x3cb44e);
    }
  },
  TaskMigratorV0 = class _0x21a617 {
    static ["migrate"](_0x50ed38) {
      let _0x2acfde = _0x21a617.migrateTask(_0x50ed38);
      return {
        id: _0x50ed38.id,
        tasks: [_0x2acfde],
        title: _0x50ed38.title
      };
    }
    static ['migrateTask'](_0x1690c0) {
      let _0x113a09 = _0x1690c0.plans?.['map'](_0x21a617.migratePlan) || [];
      return {
        id: Ut(),
        title: _0x1690c0.title,
        threads: _0x1690c0.threads,
        steps: _0x1690c0.steps,
        plans: _0x113a09,
        creationTime: _0x1690c0.creationTime,
        lastUpdated: _0x1690c0.lastUpdated,
        retryAfterTimestamp: _0x1690c0.retryAfterTimestamp,
        isPayAsYouGo: _0x1690c0.isPayAsYouGo,
        isActive: true,
        fileSummaries: []
      };
    }
    static ["migratePlan"](_0x186d62) {
      return {
        planID: Ut(),
        isActive: _0x186d62.isActive,
        logs: _0x186d62.logs,
        generatedPlan: _0x186d62.generatedPlan,
        userModifiedPlan: _0x186d62.userModifiedPlan,
        queryJsonContent: _0x186d62.userQuery
      };
    }
  };
function formatPlanStepToMarkdown(_0x271e9e) {
  let _0x1481b7 = _0x271e9e.traycerResponse,
    _0x218a18;
  return _0x1481b7 && (_0x218a18 = {
    ..._0x1481b7,
    afterApply: _0x1481b7?.['commentProto']['codeComment']?.['fileEdit']?.['newFileContent'] || '',
    beforeApply: _0x1481b7?.["commentProto"]['codeComment']?.["fileEdit"]?.['oldFileContent'] || ''
  }), {
    ..._0x271e9e,
    traycerResponse: _0x218a18
  };
}
var TaskMigratorV1 = class _0x1cd3bf {
    static ['migrate'](_0x42dcac) {
      return {
        id: _0x42dcac.id,
        tasks: _0x42dcac.tasks.map(_0x1cd3bf.migrateTask),
        title: _0x42dcac.title
      };
    }
    static ["migrateTask"](_0x452276) {
      return {
        ..._0x452276,
        threads: _0x452276.threads.map(_0x2b5137 => _0x1cd3bf.migrateThread(_0x2b5137))
      };
    }
    static ["migrateThread"](_0xa23d43) {
      return {
        ..._0xa23d43,
        conversation: _0xa23d43.conversation.map(_0x1cc0a7 => formatPlanStepToMarkdown(_0x1cc0a7))
      };
    }
  },
  TaskMigratorV2 = class _0xd5f595 {
    static ['migrate'](_0x25ac86) {
      return {
        ..._0x25ac86,
        tasks: _0x25ac86.tasks.map(_0xd5f595.migrateTask)
      };
    }
    static ["migrateTask"](_0x3d2b69) {
      return {
        ..._0x3d2b69,
        plans: _0x3d2b69.plans?.['map'](_0xd5f595.migratePlan) ?? void 0
      };
    }
    static ['migratePlan'](_0x5a1aac) {
      return {
        ..._0x5a1aac,
        logs: _0x5a1aac.logs.map(_0x543fbb => ({
          id: Ut(),
          title: _0x543fbb,
          thinking: ''
        }))
      };
    }
  };
function createTextDocNode(_0x35aba3) {
  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: "text",
        text: _0x35aba3
      }]
    }]
  };
}
function convertQueryToDocNode(_0xec56d7) {
  let _0x38e096 = _0xec56d7.userQuery,
    _0x19e292 = _0x38e096 ? createTextDocNode(_0x38e096) : {
      type: 'doc',
      content: []
    };
  return {
    ..._0xec56d7,
    userQuery: _0x19e292
  };
}
var TaskMigratorV3 = class _0x2b15cc {
    static ['migrate'](_0x4f86f2) {
      return {
        id: _0x4f86f2.id,
        tasks: _0x4f86f2.tasks.map(_0x2b15cc.migrateTask),
        title: _0x4f86f2.title
      };
    }
    static ['migrateTask'](_0x1a6dd2) {
      return {
        ..._0x1a6dd2,
        threads: _0x1a6dd2.threads.map(_0x3c133e => _0x2b15cc.migrateThread(_0x3c133e))
      };
    }
    static ["migrateThread"](_0x47f583) {
      return {
        ..._0x47f583,
        conversation: _0x47f583.conversation.map(_0x436934 => convertQueryToDocNode(_0x436934))
      };
    }
  },
  TaskMigratorV4 = class _0x421eff {
    static ['migrate'](_0x2300b1) {
      return {
        ..._0x2300b1,
        tasks: _0x2300b1.tasks.map(_0x421eff.migrateTask)
      };
    }
    static ['migrateTask'](_0x5e620a) {
      let _0x2f6701 = _0x5e620a.plans || [];
      return {
        ..._0x5e620a,
        plans: _0x2f6701.map(_0xde2e8 => _0x421eff.migratePlan(_0xde2e8))
      };
    }
    static ['migratePlan'](_0x5e0cf3) {
      return {
        ..._0x5e0cf3,
        generatedPlan: _0x5e0cf3.generatedPlan ? {
          ..._0x5e0cf3.generatedPlan,
          observations: _0x5e0cf3.generatedPlan.summary,
          approach: '',
          howDidIGetHere: '',
          joke: '',
          mermaid: ''
        } : void 0,
        userModifiedPlan: _0x5e0cf3.userModifiedPlan ? {
          ..._0x5e0cf3.userModifiedPlan,
          observations: _0x5e0cf3.userModifiedPlan.summary,
          approach: '',
          howDidIGetHere: '',
          joke: '',
          mermaid: ''
        } : void 0
      };
    }
  },
  TaskMigratorV5 = class {
    static ["migrate"](_0x256a2a) {
      return {
        ..._0x256a2a,
        tasks: _0x256a2a.tasks.map(_0x5e16f6 => this.migrateTask(_0x5e16f6))
      };
    }
    static ['migrateTask'](_0x584401) {
      return {
        ..._0x584401,
        plans: _0x584401.plans.map(_0x1b7364 => this.migratePlan(_0x1b7364))
      };
    }
    static ["migratePlan"](_0x428818) {
      return {
        ..._0x428818,
        generatedPlan: _0x428818.generatedPlan ? {
          ..._0x428818.generatedPlan,
          implementationPlan: _0x428818.generatedPlan.implementationPlan ? {
            ..._0x428818.generatedPlan.implementationPlan,
            fileChanges: _0x428818.generatedPlan.implementationPlan.fileChanges.map(_0x177056 => ({
              ..._0x177056,
              referredAttachmentNames: _0x177056.referredAttachments.map(_0x46aa64 => _0x46aa64.fileAttachments ? _0x46aa64.fileAttachments.fileName : _0x46aa64.urlAttachments ? _0x46aa64.urlAttachments.url : '').filter(_0x5a139a => _0x5a139a !== '')
            }))
          } : null
        } : void 0,
        userModifiedPlan: _0x428818.userModifiedPlan ? {
          ..._0x428818.userModifiedPlan,
          implementationPlan: _0x428818.userModifiedPlan.implementationPlan ? {
            ..._0x428818.userModifiedPlan.implementationPlan,
            fileChanges: _0x428818.userModifiedPlan.implementationPlan.fileChanges.map(_0x55f442 => ({
              ..._0x55f442,
              referredAttachmentNames: _0x55f442.referredAttachments.map(_0x4f0c47 => _0x4f0c47.fileAttachments ? _0x4f0c47.fileAttachments.fileName : _0x4f0c47.urlAttachments ? _0x4f0c47.urlAttachments.url : '').filter(_0x59d7cd => _0x59d7cd !== '')
            }))
          } : null
        } : void 0
      };
    }
  },
  TaskMigratorV6 = class {
    static ["migrate"](_0x2cdcbc) {
      return {
        ..._0x2cdcbc,
        tasks: _0x2cdcbc.tasks.map(_0x157479 => this.migrateTask(_0x157479))
      };
    }
    static ["migrateTask"](_0x5a2530) {
      return {
        ..._0x5a2530,
        plans: _0x5a2530.plans.map(_0x497d5e => this.migratePlan(_0x497d5e))
      };
    }
    static ['migratePlan'](_0x147948) {
      return {
        ..._0x147948,
        llmInput: null
      };
    }
  },
  TaskMigratorV7 = class {
    static ["migrate"](_0x1d7ea8) {
      return {
        ..._0x1d7ea8,
        tasks: _0x1d7ea8.tasks.map(_0xa8d0c8 => this.migrateTask(_0xa8d0c8))
      };
    }
    static ["migrateTask"](_0x443399) {
      return {
        ..._0x443399,
        plans: _0x443399.plans.map(_0x325064 => this.migratePlan(_0x325064))
      };
    }
    static ["migratePlan"](_0x3ceb4f) {
      return {
        ..._0x3ceb4f,
        planConversations: []
      };
    }
  },
  TaskMigratorV8 = class {
    static ["migrate"](_0x141f98) {
      return {
        ..._0x141f98,
        tasks: _0x141f98.tasks.map(_0x30c6dd => this.migrateTask(_0x30c6dd))
      };
    }
    static ['migrateTask'](_0x30c1c7) {
      return {
        ..._0x30c1c7,
        plans: _0x30c1c7.plans.map(_0x44d465 => this.migratePlan(_0x44d465))
      };
    }
    static ["migratePlan"](_0x14900a) {
      let {
        planID: _0x4ad758,
        ..._0x340f9c
      } = _0x14900a;
      return {
        id: _0x4ad758,
        ..._0x340f9c
      };
    }
  },
  TaskMigratorV9 = class {
    static ["migrate"](_0x5244d3) {
      let _0xbac57d = _0x5244d3.tasks.find(_0x3beb27 => _0x3beb27.isActive),
        _0x4a34fe = _0xbac57d ? _0xbac57d.id : null;
      return _0x4a34fe || (_0x4a34fe = _0x5244d3.tasks[_0x5244d3.tasks.length - 1].id), {
        ..._0x5244d3,
        activeTaskId: _0x4a34fe,
        tasks: _0x5244d3.tasks.map(_0x4485a4 => this.migrateTask(_0x4485a4))
      };
    }
    static ["migrateTask"](_0x2617d0) {
      let _0x46ad8a = _0x2617d0.plans.find(_0x52fced => _0x52fced.isActive),
        _0x33d42e = _0x46ad8a ? _0x46ad8a.id : null;
      _0x33d42e || (_0x33d42e = _0x2617d0.plans[_0x2617d0.plans.length - 1].id);
      let {
        isActive: _0x949731,
        ..._0x40948c
      } = _0x2617d0;
      return {
        ..._0x40948c,
        activePlanId: _0x33d42e,
        plans: _0x2617d0.plans.map(_0x4b8e4c => this.migratePlan(_0x4b8e4c))
      };
    }
    static ["migratePlan"](_0x5c64ec) {
      let {
        isActive: _0x2ed021,
        ..._0x895d40
      } = _0x5c64ec;
      return _0x895d40;
    }
  };
function getActiveWorkspacePath(_0x33bf28) {
  return pe[_0x33bf28];
}
var TaskMigratorV16 = class {
    static ["migrate"](_0x4fdfce) {
      let _0x27a32b = _0x4fdfce.tasks.map(_0x5d7792 => this.migrateTask(_0x5d7792)),
        _0x5496fc = _0x27a32b[0]?.['creationTime'] ?? Date.now();
      return {
        ..._0x4fdfce,
        tasks: _0x27a32b,
        prePhaseConversations: [],
        displayState: "SHOW_ACTIVE_TASK",
        creationTimestamp: _0x5496fc
      };
    }
    static ["migrateTask"](_0x6fb3b4) {
      return {
        ..._0x6fb3b4,
        plans: _0x6fb3b4.plans.map(_0x385cd9 => this.migratePlan(_0x385cd9, _0x6fb3b4.activePlanId, _0x6fb3b4.steps.code_changes)),
        verification: null,
        steps: {
          userQuery: getActiveWorkspacePath(_0x6fb3b4.steps.user_query),
          planGeneration: getActiveWorkspacePath(_0x6fb3b4.steps.plan_generation),
          codeChanges: getActiveWorkspacePath(_0x6fb3b4.steps.code_changes),
          verification: pe.NOT_STARTED
        }
      };
    }
    static ['migratePlan'](_0x48185b, _0x449604, _0x4a7364) {
      return {
        ..._0x48185b,
        planConversations: _0x48185b.planConversations.map(_0x1946f8 => this.migratePlanConversation(_0x1946f8)),
        isExecuted: _0x48185b.id === _0x449604 && _0x4a7364 === 'COMPLETED'
      };
    }
    static ['migratePlanConversation'](_0x22f484) {
      return {
        ..._0x22f484,
        llmInput: void 0
      };
    }
  },
  StorageSerializer = class {
    static ["toStorage"](_0x2b1c02) {
      return _0x2b1c02 ? {
        data: ensureBuffer(_0x2b1c02.data).toString("base64"),
        version: _0x2b1c02.version
      } : null;
    }
    static ["fromStorage"](_0x2d146d) {
      if (!_0x2d146d) return null;
      let _0x652d84 = /^[A-Za-z0-9+/]*={0,2}$/.test(_0x2d146d.data) ? "base64" : 'utf-8';
      return {
        data: Buffer.from(_0x2d146d.data, _0x652d84),
        version: _0x2d146d.version
      };
    }
  },
  TaskMigratorV17 = class {
    static ["migrate"](_0x3ddbbf) {
      let _0x2b197b = _0x3ddbbf.tasks.map(_0x448166 => this.migrateTask(_0x448166)),
        _0x189066 = Ut();
      return {
        creationTimestamp: _0x3ddbbf.creationTimestamp,
        displayState: _0x3ddbbf.displayState,
        id: _0x3ddbbf.id,
        title: _0x3ddbbf.title,
        phaseBreakdowns: [{
          id: _0x189066,
          prePhaseConversations: _0x3ddbbf.prePhaseConversations,
          tasks: _0x2b197b,
          activeTaskId: _0x3ddbbf.activeTaskId
        }],
        activePhaseBreakdownId: _0x189066,
        lastUpdatedTime: _0x2b197b.find(_0x3f4e42 => _0x3f4e42.id === _0x3ddbbf.activeTaskId)?.["lastUpdated"] ?? Date.now()
      };
    }
    static ["migrateTask"](_0x1dd33c) {
      return {
        activePlanId: _0x1dd33c.activePlanId,
        id: _0x1dd33c.id,
        steps: _0x1dd33c.steps,
        threads: _0x1dd33c.threads,
        title: _0x1dd33c.title,
        plans: _0x1dd33c.plans.map(_0x1c78cc => this.migratePlan(_0x1c78cc)),
        attachmentSummaries: _0x1dd33c.attachmentSummaries,
        creationTime: _0x1dd33c.creationTime,
        fileSummaries: _0x1dd33c.fileSummaries,
        lastUpdated: _0x1dd33c.lastUpdated,
        verification: _0x1dd33c.verification
      };
    }
    static ["migratePlan"](_0x3a0fb3) {
      return {
        ..._0x3a0fb3,
        generatedPlan: _0x3a0fb3.userModifiedPlan ?? _0x3a0fb3.generatedPlan,
        executedWithAgent: null,
        llmInput: _0x3a0fb3.llmInput ? StorageSerializer.toStorage(_0x3a0fb3.llmInput) : null
      };
    }
  },
  TaskMigratorV18 = class {
    static ['migrate'](_0x1eacf6) {
      let _0x590ebf = _0x1eacf6.phaseBreakdowns.map(_0x27656e => this.migratePhaseBreakdown(_0x27656e));
      return {
        ..._0x1eacf6,
        phaseBreakdowns: _0x590ebf
      };
    }
    static ["migratePhaseBreakdown"](_0x108352) {
      let _0x4a8f6d = _0x108352.tasks.map(_0x5f49a6 => this.migrateTask(_0x5f49a6));
      return {
        ..._0x108352,
        tasks: _0x4a8f6d
      };
    }
    static ['migrateTask'](_0x4eb50f) {
      let _0x5852ca = _0x4eb50f.verification ? this.migrateVerification(_0x4eb50f.verification) : null;
      return {
        ..._0x4eb50f,
        verification: _0x5852ca
      };
    }
    static ['migrateVerification'](_0x179efe) {
      let _0xd2dd87 = _0x179efe.verificationOutput ? {
        ..._0x179efe.verificationOutput,
        comments: _0x179efe.verificationOutput.comments.map(_0xca4f8 => ({
          ..._0xca4f8,
          isApplied: false
        }))
      } : null;
      return {
        ..._0x179efe,
        verificationOutput: _0xd2dd87
      };
    }
  },
  uM = {
    SINGLE_AGENT: 0,
    MULTI_AGENT: 1,
    QUICK_AGENT: 2
  },
  TaskMigratorV19 = class {
    static ['migrate'](_0x215f36) {
      let _0x4cabc5 = _0x215f36.phaseBreakdowns.map(_0x34c551 => this.migratePhaseBreakdown(_0x34c551));
      return {
        ..._0x215f36,
        phaseBreakdowns: _0x4cabc5
      };
    }
    static ['migratePhaseBreakdown'](_0x4ac882) {
      let _0x363e39 = _0x4ac882.tasks.map(_0x4d4a80 => this.migrateTask(_0x4d4a80));
      return {
        ..._0x4ac882,
        tasks: _0x363e39
      };
    }
    static ["migrateTask"](_0x142f55) {
      return {
        ..._0x142f55,
        plans: _0x142f55.plans.map(_0x2a7e8a => this.migratePlan(_0x2a7e8a))
      };
    }
    static ['migratePlan'](_0x3daf7c) {
      return {
        ..._0x3daf7c,
        agentMode: uM.SINGLE_AGENT
      };
    }
  },
  TaskMigratorV20 = class {
    static ['migrate'](_0x1230be) {
      let _0x171b6e = _0x1230be.phaseBreakdowns.map(_0x214a65 => this.migratePhaseBreakdown(_0x214a65));
      return {
        ..._0x1230be,
        phaseBreakdowns: _0x171b6e
      };
    }
    static ["migratePhaseBreakdown"](_0x361e04) {
      let _0x4775f3 = _0x361e04.tasks.map(_0x3515b1 => this.migrateTask(_0x3515b1));
      return {
        ..._0x361e04,
        tasks: _0x4775f3
      };
    }
    static ['migrateTask'](_0x1dae80) {
      return {
        ..._0x1dae80,
        plans: _0x1dae80.plans.map(_0x338b66 => this.migratePlan(_0x338b66))
      };
    }
    static ["migratePlan"](_0x9d065e) {
      let _0x18eede = _0x9d065e.planConversations.map(_0x166e8b => this.migratePlanConversation(_0x166e8b));
      return {
        ..._0x9d065e,
        generatedPlan: _0x9d065e.generatedPlan ? this.migratePlanProto(_0x9d065e.generatedPlan) : void 0,
        planConversations: _0x18eede
      };
    }
    static ["migratePlanConversation"](_0x37696b) {
      let _0x3d5d03 = null;
      return _0x37696b.plan && (_0x3d5d03 = this.migratePlanProto(_0x37696b.plan)), {
        ..._0x37696b,
        plan: _0x3d5d03
      };
    }
    static ['migratePlanProto'](_0x26a1a4) {
      return _0x26a1a4.implementationPlan?.['summary'] && !_0x26a1a4.implementationPlan.fileChanges.length ? {
        explanationPlan: {
          text: _0x26a1a4.implementationPlan.summary,
          mermaid: _0x26a1a4.implementationPlan.mermaid,
          canProposePlan: false
        },
        implementationPlan: null
      } : {
        ..._0x26a1a4,
        explanationPlan: null
      };
    }
  },
  TaskMigratorV21 = class {
    static ['migrate'](_0x55789b) {
      return {
        ..._0x55789b,
        phaseBreakdowns: _0x55789b.phaseBreakdowns.map(_0x1e49ee => this.migratePhaseBreakdown(_0x1e49ee))
      };
    }
    static ['migratePhaseBreakdown'](_0x36a92d) {
      return {
        ..._0x36a92d,
        tasks: _0x36a92d.tasks.map(_0x19a2cc => this.migrateTask(_0x19a2cc))
      };
    }
    static ['migrateTask'](_0x597f9b) {
      return {
        ..._0x597f9b,
        verification: _0x597f9b.verification ? this.migrateVerification(_0x597f9b.verification) : _0x597f9b.verification
      };
    }
    static ['migrateVerification'](_0x569e8c) {
      return {
        ..._0x569e8c,
        verificationOutput: _0x569e8c.verificationOutput ? this.migrateVerificationOutput(_0x569e8c.verificationOutput) : _0x569e8c.verificationOutput
      };
    }
    static ['migrateVerificationOutput'](_0x498eec) {
      return {
        ..._0x498eec,
        comments: _0x498eec.comments?.["map"](_0x116d55 => this.migrateVerificationComment(_0x116d55)) || []
      };
    }
    static ["migrateVerificationComment"](_0x39accb) {
      return {
        ..._0x39accb,
        severity: tv.MAJOR
      };
    }
  },
  TaskMigratorV22 = class {
    static ['migrate'](_0x26d49d) {
      return {
        ..._0x26d49d,
        phaseBreakdowns: _0x26d49d.phaseBreakdowns.map(_0x3aada6 => this.migratePhaseBreakdown(_0x3aada6))
      };
    }
    static ['migratePhaseBreakdown'](_0x435f62) {
      return {
        ..._0x435f62,
        tasks: _0x435f62.tasks.map(_0x150ba4 => this.migrateTask(_0x150ba4))
      };
    }
    static ['migrateTask'](_0x5d93ca) {
      return {
        ..._0x5d93ca,
        plans: _0x5d93ca.plans.map(_0x3d3824 => this.migratePlan(_0x3d3824, _0x5d93ca.isPayAsYouGo)),
        verification: _0x5d93ca.verification ? this.migrateVerification(_0x5d93ca.verification) : _0x5d93ca.verification
      };
    }
    static ['migratePlan'](_0x1ad0a3, _0x14035f) {
      return {
        ..._0x1ad0a3,
        isPayAsYouGo: _0x14035f ?? false
      };
    }
    static ["migrateVerification"](_0x44e04d) {
      return {
        ..._0x44e04d,
        isPayAsYouGo: false
      };
    }
  },
  TaskMigratorV23 = class {
    static ['migrate'](_0x401ce5) {
      return {
        ..._0x401ce5,
        phaseBreakdowns: _0x401ce5.phaseBreakdowns.map(_0xe07cd7 => this.migratePhaseBreakdown(_0xe07cd7))
      };
    }
    static ['migratePhaseBreakdown'](_0xc2ed31) {
      return {
        ..._0xc2ed31,
        tasks: _0xc2ed31.tasks.map(_0x36cb5a => this.migrateTask(_0x36cb5a))
      };
    }
    static ["migrateTask"](_0x45e2eb) {
      return {
        ..._0x45e2eb,
        codeChanges: {
          taskThreads: _0x45e2eb.threads,
          isPayAsYouGo: false
        }
      };
    }
  },
  TaskMigratorV24 = class {
    static ["migrate"](_0x2e2da3) {
      return {
        ..._0x2e2da3,
        phaseBreakdowns: _0x2e2da3.phaseBreakdowns.map(_0x16077c => this.migratePhaseBreakdown(_0x16077c))
      };
    }
    static ["migratePhaseBreakdown"](_0x33e202) {
      return {
        ..._0x33e202,
        tasks: _0x33e202.tasks.map(_0x4d54cd => this.migrateTask(_0x4d54cd))
      };
    }
    static ['migrateTask'](_0x368818) {
      return {
        ..._0x368818,
        plans: this.migratePlans(_0x368818.plans ?? []),
        codeChanges: _0x368818.codeChanges,
        verification: _0x368818.verification ?? null
      };
    }
    static ["migratePlans"](_0x4a53a5) {
      let _0x5c4814 = [],
        _0x4adac8 = null;
      for (let key of _0x4a53a5) {
        let _0x12d3b0 = {
          ...key,
          parentPlanID: _0x4adac8
        };
        _0x5c4814.push(_0x12d3b0), _0x4adac8 = _0x12d3b0.id;
      }
      return _0x5c4814;
    }
  },
  TaskMigratorV25 = class {
    static ["migrate"](_0x27aeec) {
      return {
        ..._0x27aeec,
        phaseBreakdowns: _0x27aeec.phaseBreakdowns.map(_0x31f09d => this.migratePhaseBreakdown(_0x31f09d))
      };
    }
    static ['migratePhaseBreakdown'](_0x338ac8) {
      return {
        ..._0x338ac8,
        tasks: _0x338ac8.tasks.map(_0x4e45af => this.migrateTask(_0x4e45af))
      };
    }
    static ["migrateTask"](_0x34fe52) {
      return {
        ..._0x34fe52,
        hasSentCreationMetrics: !!_0x34fe52.plans.some(_0x434e32 => _0x434e32.generatedPlan),
        plans: _0x34fe52.plans.map(_0x40a0e4 => this.migratePlan(_0x40a0e4))
      };
    }
    static ['migratePlan'](_0x4c93b3) {
      return {
        ..._0x4c93b3,
        hasSentCreationMetrics: !!_0x4c93b3.generatedPlan
      };
    }
  },
  TaskMigratorV26 = class {
    static ["migrate"](_0x50ccb5) {
      return {
        ..._0x50ccb5,
        phaseBreakdowns: _0x50ccb5.phaseBreakdowns.map(_0x436ef0 => this.migratePhaseBreakdown(_0x436ef0))
      };
    }
    static ['migratePhaseBreakdown'](_0x1edcba) {
      return {
        ..._0x1edcba,
        tasks: _0x1edcba.tasks.map(_0x1cec5d => this.migrateTask(_0x1cec5d)),
        prePhaseConversations: _0x1edcba.prePhaseConversations.map(_0x463fe8 => this.migratePhaseConversation(_0x463fe8))
      };
    }
    static ['migratePhaseConversation'](_0x2cf34d) {
      return {
        ..._0x2cf34d,
        logs: _0x2cf34d.logs.map(_0x21959a => this.migrateLogEntry(_0x21959a))
      };
    }
    static ["migrateTask"](_0x1752e6) {
      return {
        ..._0x1752e6,
        hasSentCreationMetrics: !!_0x1752e6.plans.some(_0x3b0fc5 => _0x3b0fc5.generatedPlan),
        plans: _0x1752e6.plans.map(_0xdcfcda => this.migratePlan(_0xdcfcda)),
        verification: _0x1752e6.verification ? this.migrateVerification(_0x1752e6.verification) : null
      };
    }
    static ["migratePlan"](_0x282e64) {
      return {
        ..._0x282e64,
        hasSentCreationMetrics: !!_0x282e64.generatedPlan,
        logs: _0x282e64.logs.map(_0x29e5b3 => this.migrateLogEntry(_0x29e5b3)),
        planConversations: _0x282e64.planConversations.map(_0x16b1c2 => this.migratePlanConversation(_0x16b1c2))
      };
    }
    static ['migrateLogEntry'](_0x5a72cc) {
      return {
        ..._0x5a72cc,
        toolCallInfo: null
      };
    }
    static ['migratePlanConversation'](_0x38c55d) {
      return {
        ..._0x38c55d,
        logs: _0x38c55d.logs.map(_0x31e6d0 => this.migrateLogEntry(_0x31e6d0))
      };
    }
    static ['migrateVerification'](_0x6e5b06) {
      return {
        ..._0x6e5b06,
        logs: _0x6e5b06.logs.map(_0xddd65e => this.migrateLogEntry(_0xddd65e))
      };
    }
  },
  TaskMigratorV27 = class {
    static ['migrate'](_0x12d26a) {
      return {
        ..._0x12d26a,
        phaseBreakdowns: _0x12d26a.phaseBreakdowns.map(_0xde9fe5 => this.migratePhaseBreakdown(_0xde9fe5))
      };
    }
    static ['migratePhaseBreakdown'](_0x356afe) {
      return {
        ..._0x356afe,
        tasks: _0x356afe.tasks.map(_0x1cabea => this.migrateTask(_0x1cabea))
      };
    }
    static ["migrateTask"](_0x329507) {
      let _0x3685c8 = [];
      return {
        ..._0x329507,
        verification: _0x329507.verification ? this.migrateVerification(_0x329507.verification) : _0x329507.verification,
        discardedVerificationComments: _0x3685c8
      };
    }
    static ['migrateVerification'](_0x566a31) {
      let _0x368f3b = _0x566a31.verificationOutput;
      if (_0x368f3b == null) return {
        ..._0x566a31,
        verificationOutput: null
      };
      let _0x45b121 = 0,
        _0x5af90e = [];
      for (let key of _0x368f3b.comments) _0x5af90e.push({
        id: Ut(),
        comments: [key],
        status: 0
      });
      return {
        ..._0x566a31,
        verificationOutput: {
          markdown: _0x368f3b.markdown,
          threads: _0x5af90e
        }
      };
    }
  },
  TaskMigratorV28 = class {
    static ['migrate'](_0x740b95) {
      return {
        ..._0x740b95,
        phaseBreakdowns: _0x740b95.phaseBreakdowns.map(_0x91963a => this.migratePhaseBreakdown(_0x91963a))
      };
    }
    static ["migratePhaseBreakdown"](_0x778d4a) {
      return {
        ..._0x778d4a,
        tasks: _0x778d4a.tasks.map(_0x3d9ca3 => this.migrateTask(_0x3d9ca3))
      };
    }
    static ["migrateTask"](_0x3b5e6f) {
      return {
        ..._0x3b5e6f,
        plans: _0x3b5e6f.plans.map(_0x532388 => this.migratePlan(_0x532388))
      };
    }
    static ["migratePlan"](_0x4142c4) {
      return {
        ..._0x4142c4,
        planConversations: _0x4142c4.planConversations.map(_0xbcadbb => this.migratePlanConversation(_0xbcadbb))
      };
    }
    static ["migratePlanConversation"](_0x3dc152) {
      return {
        ..._0x3dc152,
        llmInput: _0x3dc152.llmInput ? StorageSerializer.toStorage(_0x3dc152.llmInput) : null
      };
    }
  },
  TaskMigratorV29 = class {
    static ["migrate"](_0x1cc4ed) {
      let _0x169e89 = new Map();
      return {
        ..._0x1cc4ed,
        phaseBreakdowns: _0x1cc4ed.phaseBreakdowns.map(_0x480888 => this.migratePhaseBreakdown(_0x480888, _0x169e89))
      };
    }
    static ["migratePhaseBreakdown"](_0x384308, _0x43d32d) {
      return {
        ..._0x384308,
        tasks: _0x384308.tasks.map(_0x47a1f0 => this.migrateTask(_0x47a1f0, _0x43d32d))
      };
    }
    static ["migrateTask"](_0x4554f9, _0x5744da) {
      let _0x9b2eb0 = false;
      return _0x5744da.has(_0x4554f9.id) ? _0x9b2eb0 = true : _0x5744da.set(_0x4554f9.id, _0x4554f9), {
        ..._0x4554f9,
        isReferred: _0x9b2eb0
      };
    }
  },
  TaskMigratorV30 = class {
    static ["migrate"](_0x445b14) {
      return {
        ..._0x445b14,
        phaseBreakdowns: _0x445b14.phaseBreakdowns.map(_0x548fa4 => this.migratePhaseBreakdown(_0x548fa4))
      };
    }
    static ['migratePhaseBreakdown'](_0x43f222) {
      return {
        ..._0x43f222,
        tasks: _0x43f222.tasks.map(_0x2e99d6 => this.migrateTask(_0x2e99d6))
      };
    }
    static ['migrateTask'](_0x15039a) {
      return {
        ..._0x15039a,
        codeChanges: this.migrateCodeChanges(_0x15039a.codeChanges)
      };
    }
    static ['migrateCodeChanges'](_0x1e7988) {
      return {
        ..._0x1e7988,
        taskThreads: _0x1e7988.taskThreads.map(_0x3cd6b2 => this.migrateTaskThread(_0x3cd6b2))
      };
    }
    static ["migrateTaskThread"](_0x120720) {
      return {
        ..._0x120720,
        conversation: _0x120720.conversation.map(_0x3086f1 => this.migrateConvPair(_0x3086f1))
      };
    }
    static ['migrateConvPair'](_0x4078e2) {
      return {
        ..._0x4078e2,
        traycerResponse: _0x4078e2.traycerResponse ? this.migrateComment(_0x4078e2.traycerResponse) : void 0
      };
    }
    static ['migrateComment'](_0x251f4d) {
      return {
        ..._0x251f4d,
        lastModifiedTimestamp: 0
      };
    }
  },
  TaskMigratorV31 = class {
    static ["migrate"](_0x2ae980) {
      return {
        ..._0x2ae980,
        phaseBreakdowns: _0x2ae980.phaseBreakdowns.map(_0x50fb50 => this.migratePhaseBreakdown(_0x50fb50))
      };
    }
    static ['migratePhaseBreakdown'](_0x424738) {
      return {
        ..._0x424738,
        prePhaseConversations: _0x424738.prePhaseConversations.map(_0x23a546 => this.migratePhaseConversation(_0x23a546))
      };
    }
    static ['migratePhaseConversation'](_0x2316e8) {
      return {
        ..._0x2316e8,
        output: _0x2316e8.output ? this.migrateTaskOrchestratorOutput(_0x2316e8.output) : _0x2316e8.output
      };
    }
    static ['migrateTaskOrchestratorOutput'](_0xebf8db) {
      return {
        ..._0xebf8db,
        phase: _0xebf8db.phase ? this.migratePhaseOutput(_0xebf8db.phase) : _0xebf8db.phase
      };
    }
    static ['migratePhaseOutput'](_0x375ca2) {
      return {
        ..._0x375ca2,
        reasoning: _0x375ca2.howDidIGetHere,
        phases: _0x375ca2.phases.map(_0x2bb2b7 => this.migratePhase(_0x2bb2b7, _0x375ca2.howDidIGetHere))
      };
    }
    static ['migratePhase'](_0x44ff16, _0x3b0021) {
      return {
        ..._0x44ff16,
        reasoning: _0x3b0021,
        phaseSize: $c.ISSUE
      };
    }
  },
  TaskMigratorV32 = class {
    static ['migrate'](_0x2e8494) {
      return {
        ..._0x2e8494,
        tasks: _0x2e8494.tasks.map(_0x24954e => this.migrateTask(_0x24954e))
      };
    }
    static ['migrateTask'](_0xaaae72) {
      return {
        ..._0xaaae72,
        plans: _0xaaae72.plans.map(_0x1c8042 => this.migratePlan(_0x1c8042)),
        attachmentSummaries: []
      };
    }
    static ["migratePlan"](_0xb853f7) {
      return {
        ..._0xb853f7,
        generatedPlan: _0xb853f7.generatedPlan ? {
          ..._0xb853f7.generatedPlan,
          fileChanges: _0xb853f7.generatedPlan?.["fileChanges"]?.["map"](_0x41f5fc => ({
            ..._0x41f5fc,
            referredAttachments: []
          })) ?? []
        } : void 0,
        userModifiedPlan: _0xb853f7.userModifiedPlan ? {
          ..._0xb853f7.userModifiedPlan,
          fileChanges: _0xb853f7.userModifiedPlan?.["fileChanges"]?.["map"](_0x20004e => ({
            ..._0x20004e,
            referredAttachments: []
          })) ?? []
        } : void 0
      };
    }
  },
  TaskMigratorV33 = class {
    static ["migrate"](_0x24c7de) {
      return {
        ..._0x24c7de,
        tasks: _0x24c7de.tasks.map(_0x1b48d3 => this.migrateTask(_0x1b48d3))
      };
    }
    static ['migrateTask'](_0x5c16fb) {
      return {
        ..._0x5c16fb,
        plans: _0x5c16fb.plans.map(_0x32c500 => this.migratePlan(_0x32c500)),
        attachmentSummaries: []
      };
    }
    static ['migratePlan'](_0x22f057) {
      return {
        ..._0x22f057,
        generatedPlan: _0x22f057.generatedPlan ? {
          implementationPlan: _0x22f057.generatedPlan
        } : void 0,
        userModifiedPlan: _0x22f057.userModifiedPlan ? {
          implementationPlan: _0x22f057.userModifiedPlan
        } : void 0
      };
    }
  },
  TaskMigratorV34 = class {
    static ['migrate'](_0x4cae06) {
      return {
        ..._0x4cae06,
        tasks: _0x4cae06.tasks.map(_0x133f21 => this.migrateTask(_0x133f21))
      };
    }
    static ['migrateTask'](_0x22e34d) {
      return {
        ..._0x22e34d,
        plans: _0x22e34d.plans.map(_0xa530d4 => this.migratePlan(_0xa530d4))
      };
    }
    static ["migratePlan"](_0xc7f499) {
      return {
        ..._0xc7f499,
        agentMode: uM.SINGLE_AGENT
      };
    }
  };
function extractWorkspacePathsFromPhases(_0x45d362) {
  let _0x1dacec = new Set(),
    _0x310fb8 = extractFilesFromPhaseBreakdowns(_0x45d362);
  for (let key of _0x310fb8) key.workspacePath && _0x1dacec.add(key.workspacePath);
  return Array.from(_0x1dacec.values()).map(_0x3fb4e0 => ({
    relPath: '',
    workspacePath: _0x3fb4e0,
    isDirectory: true
  }));
}
function extractFilesFromPhaseBreakdowns(_0x64eb96) {
  let _0x3901d2 = new CustomSet(TraycerPath.equals);
  for (let _0x171272 of _0x64eb96.phaseBreakdowns) for (let _0x286a0d of _0x171272.tasks) {
    let _0x5452b5 = _0x286a0d.plans?.["find"](_0x4a0dee => _0x4a0dee.id === _0x286a0d.activePlanId)?.["generatedPlan"]?.["implementationPlan"]?.['fileChanges'] ?? [];
    for (let _0x5b2078 of _0x5452b5) {
      let _0x550422 = TraycerPath.deserializeFromWire({
          absolutePath: path_module.join(_0x5b2078.path?.['workspacePath'] ?? '', _0x5b2078.path?.['relPath'] ?? ''),
          isDirectory: _0x5b2078.path?.['isDirectory'] ?? false
        }),
        _0x5d8ef2 = _0x5b2078.referredFiles.map(_0x5412c1 => TraycerPath.deserializeFromWire({
          absolutePath: path_module.join(_0x5412c1.workspacePath ?? '', _0x5412c1.relPath ?? ''),
          isDirectory: _0x5412c1.isDirectory ?? false
        }));
      _0x3901d2.add(_0x550422);
      for (let _0x2039f9 of _0x5d8ef2) _0x3901d2.add(_0x2039f9);
    }
  }
  return Array.from(_0x3901d2.values());
}

// [unbundle] 注入辅助函数到 WorkspaceMigrator，因为该函数依赖主文件中的其他类和函数
WorkspaceMigrator.setExtractFunction(extractWorkspacePathsFromPhases);

function formatMermaidDiagram(_0xdd130) {
  let _0x379b60 = '';
  return _0x379b60 += '\x0a\x0a## Mermaid Diagram\x0a\x0a', _0x379b60 += _0xdd130, _0x379b60;
}
function formatImplementationPlanToMarkdown(_0x25621f) {
  let _0x2710af = '';
  if (!_0x25621f?.["fileChanges"]?.['length']) return _0x2710af += '\x0a\x0a### Summary\x0a\x0a' + (_0x25621f?.['summary'] || ''), _0x2710af;
  if (_0x2710af += "\n\n### Observations\n\n" + (_0x25621f?.["observations"] || ''), _0x2710af += '\x0a\x0a### Approach\x0a\x0a' + (_0x25621f?.["approach"] || ''), _0x2710af += '\x0a\x0a### Reasoning\x0a\x0a' + (_0x25621f?.["howDidIGetHere"] || ''), _0x2710af += formatMermaidDiagram(_0x25621f.mermaid || ''), _0x25621f?.['fileChanges']?.["length"]) {
    _0x2710af += '\x0a\x0a## Proposed File Changes\x0a\x0a';
    let _0x3bdddd = _0x25621f.fileChanges.map(_0x23d24a => {
      let _0x370cc4 = formatFileChangeHeader(_0x23d24a).trimEnd(),
        _0x350137 = formatCommitMessageWithReferences(_0x23d24a, _0x25621f?.['fileChanges'] || []).trim();
      return _0x370cc4 + '\x0a\x0a' + _0x350137;
    });
    _0x2710af += _0x3bdddd.join('\x0a\x0a');
  }
  return _0x2710af.trim();
}
function formatFileChangeHeader(_0x5ee29a) {
  if (!_0x5ee29a.path) return '';
  let _0x4aee38 = '';
  return _0x5ee29a.operation === Ba.RENAME && _0x5ee29a.newPath?.['relPath'] ? _0x4aee38 += formatRenameOperation(_0x5ee29a) : (_0x4aee38 += '### file:' + _0x5ee29a.path.relPath, _0x4aee38 += getFileChangeTypeSuffix(_0x5ee29a.operation)), _0x4aee38 += '\x0a', _0x4aee38;
}
function formatCommitMessageWithReferences(_0x5ba613, _0x44494f) {
  let _0x1c0a7a = '',
    _0x104542 = '',
    _0x463ebc = '';
  return _0x5ba613.referredFiles.length > 0 && (_0x104542 = formatReferredFilesList(_0x5ba613.referredFiles, _0x44494f)), _0x5ba613.referredAttachmentNames.length > 0 && (_0x463ebc = _0x5ba613.referredAttachmentNames.map(_0xb9af02 => "- [" + _0xb9af02 + ']').join('\x0a')), (_0x104542 || _0x463ebc) && (_0x1c0a7a += ('\x0a\x0aReferences: \x0a\x0a' + _0x104542 + '\x0a\x0a' + _0x463ebc).trimEnd()), _0x1c0a7a += '\x0a\x0a' + _0x5ba613.changes, _0x1c0a7a;
}
function formatReferredFilesList(_0x3dcd9d, _0x15115a) {
  if (_0x3dcd9d.length === 0) return '';
  let {
    newFiles: _0x36f273,
    deleteFiles: _0x3073a0,
    renameFiles: _0x8bac7b,
    modifyFiles: _0x374ee7
  } = categorizeFileChangesByOperation(_0x15115a);
  return _0x3dcd9d.map(_0x8a5189 => {
    let _0x4ea2ad = 'file:' + _0x8a5189.relPath,
      _0x4dedd7 = '';
    return _0x36f273.some(_0x5a941b => pathProtoEquals(_0x5a941b.path, _0x8a5189)) ? _0x4dedd7 = getFileChangeTypeSuffix(Ba.NEW) : _0x3073a0.some(_0x2d44d4 => pathProtoEquals(_0x2d44d4.path, _0x8a5189)) ? _0x4dedd7 = getFileChangeTypeSuffix(Ba.DELETE) : _0x8bac7b.some(_0x3ac767 => pathProtoEquals(_0x3ac767.path, _0x8a5189)) ? _0x4dedd7 = getFileChangeTypeSuffix(Ba.RENAME) : _0x374ee7.some(_0x58ac76 => pathProtoEquals(_0x58ac76.path, _0x8a5189)) && (_0x4dedd7 = getFileChangeTypeSuffix(Ba.MODIFY)), '- ' + _0x4ea2ad + _0x4dedd7;
  }).join('\x0a');
}
function getFileChangeTypeSuffix(_0xf3d6b2) {
  switch (_0xf3d6b2) {
    case Ba.MODIFY:
      return ' (Modify)';
    case Ba.NEW:
      return " (New)";
    case Ba.DELETE:
      return ' (Delete)';
    case Ba.RENAME:
      return " (Rename)";
    default:
      return '';
  }
}
function formatRenameOperation(_0x51cd4a) {
  return !_0x51cd4a.path || !_0x51cd4a.newPath ? '' : '### file:' + _0x51cd4a.path.relPath + " �?file:" + _0x51cd4a.newPath.relPath;
}
function pathProtoEquals(_0x25d18c, _0x2157e8) {
  if (!_0x25d18c || !_0x2157e8) throw new Error("Path is null");
  return _0x25d18c.relPath === _0x2157e8.relPath && _0x25d18c.workspacePath === _0x2157e8.workspacePath && _0x25d18c.isDirectory === _0x2157e8.isDirectory;
}
function categorizeFileChangesByOperation(_0x446fa9) {
  let _0x102098 = {
    newFiles: [],
    deleteFiles: [],
    renameFiles: [],
    modifyFiles: []
  };
  return _0x446fa9.forEach(_0x41b155 => {
    let _0x38ed67 = {
      webviewPath: _0x41b155.path,
      path: _0x41b155.path
    };
    switch (_0x41b155.operation) {
      case Ba.NEW:
        {
          _0x102098.newFiles.push(_0x38ed67);
          break;
        }
      case Ba.DELETE:
        {
          _0x102098.deleteFiles.push(_0x38ed67);
          break;
        }
      case Ba.RENAME:
        {
          _0x102098.renameFiles.push(_0x38ed67);
          break;
        }
      case Ba.MODIFY:
        {
          _0x102098.modifyFiles.push(_0x38ed67);
          break;
        }
    }
  }), _0x102098;
}
var Ba = {
    MODIFY: 0,
    NEW: 1,
    DELETE: 2,
    RENAME: 3
  },
  TaskMigratorV35 = class {
    static ["migrate"](_0x43458e) {
      return {
        ..._0x43458e,
        workspaces: this.migrateWorkspaces(_0x43458e.workspaces),
        phaseBreakdowns: _0x43458e.phaseBreakdowns.map(_0x364421 => this.migratePhaseBreakdown(_0x364421))
      };
    }
    static ['migrateWorkspaces'](_0x5be71a) {
      return {
        workspaceFile: _0x5be71a.workspaceFile ? this.migratePathV2ToV3(_0x5be71a.workspaceFile) : void 0,
        workspaceFolders: _0x5be71a.workspaceFolders.map(_0x2327a5 => this.migratePathV2ToV3(_0x2327a5))
      };
    }
    static ['migratePhaseBreakdown'](_0x57ebd1) {
      return {
        ..._0x57ebd1,
        tasks: _0x57ebd1.tasks.map(_0x6c739 => this.migrateTask(_0x6c739)),
        prePhaseConversations: _0x57ebd1.prePhaseConversations.map(_0xcf8be => this.migratePhaseConversation(_0xcf8be))
      };
    }
    static ['migratePhaseConversation'](_0x10de37) {
      return {
        ..._0x10de37,
        logs: _0x10de37.logs.map(_0x4feb7a => this.migrateThinkingOutput(_0x4feb7a))
      };
    }
    static ['migrateTask'](_0x4892e4) {
      return {
        ..._0x4892e4,
        plans: _0x4892e4.plans.map(_0x415efb => this.migratePlan(_0x415efb)),
        verification: _0x4892e4.verification ? this.migrateVerification(_0x4892e4.verification) : null,
        discardedVerificationComments: _0x4892e4.discardedVerificationComments.map(_0x5c3217 => this.migrateVerificationComment(_0x5c3217)),
        failedPlanIterationQuery: _0x4892e4.failedPlanIterationQuery ? this.migrateFailedPlanIterationQuery(_0x4892e4.failedPlanIterationQuery) : void 0,
        attachmentSummaries: _0x4892e4.attachmentSummaries.map(_0x3369a8 => this.migrateAttachmentSummary(_0x3369a8))
      };
    }
    static ['migratePlan'](_0x4860d5) {
      let {
        agentMode: _0x4b97c2,
        ..._0x1e2a66
      } = _0x4860d5;
      return {
        ..._0x1e2a66,
        planConversations: _0x4860d5.planConversations.map(_0x35f7c3 => this.migratePlanConversation(_0x35f7c3)),
        generatedPlan: _0x4860d5.generatedPlan ? this.migrateAllPlanOutput(_0x4860d5.generatedPlan) : null,
        logs: _0x4860d5.logs.map(_0x206950 => this.migrateThinkingOutput(_0x206950))
      };
    }
    static ["migratePlanConversation"](_0x507b15) {
      return {
        ..._0x507b15,
        plan: _0x507b15.plan ? this.migrateAllPlanOutput(_0x507b15.plan) : null,
        logs: _0x507b15.logs.map(_0x51d56e => this.migrateThinkingOutput(_0x51d56e))
      };
    }
    static ["migrateAllPlanOutput"](_0x5e0417) {
      return {
        implementationPlan: _0x5e0417.implementationPlan ? this.migrateImplementationPlan(_0x5e0417.implementationPlan) : _0x5e0417.explanationPlan ? this.migrateExplanationPlan(_0x5e0417.explanationPlan) : null,
        reviewOutput: _0x5e0417.reviewOutput ? this.migrateReviewOutput(_0x5e0417.reviewOutput) : null
      };
    }
    static ['migrateExplanationPlan'](_0x60e2c4) {
      return {
        output: _0x60e2c4.text,
        summary: void 0
      };
    }
    static ['migrateImplementationPlan'](_0x41110f) {
      return {
        output: formatImplementationPlanToMarkdown(_0x41110f),
        summary: _0x41110f.summary
      };
    }
    static ["migrateReviewOutput"](_0x14f6e2) {
      return {
        ..._0x14f6e2,
        comments: _0x14f6e2.comments.map(_0x3ff865 => this.migrateReviewComment(_0x3ff865))
      };
    }
    static ["migrateReviewComment"](_0x86506a) {
      return {
        ..._0x86506a,
        relevantFiles: _0x86506a.relevantFiles.map(_0x1dbd73 => this.migratePathV2ToV3(_0x1dbd73))
      };
    }
    static ['migrateVerification'](_0x1eacee) {
      return {
        ..._0x1eacee,
        logs: _0x1eacee.logs.map(_0x6f3fb8 => this.migrateThinkingOutput(_0x6f3fb8)),
        verificationOutput: _0x1eacee.verificationOutput ? this.migrateVerificationOutput(_0x1eacee.verificationOutput) : null
      };
    }
    static ["migrateVerificationOutput"](_0x2c43bf) {
      return {
        ..._0x2c43bf,
        threads: _0x2c43bf.threads.map(_0x11b9d0 => this.migrateVerificationThread(_0x11b9d0))
      };
    }
    static ["migrateVerificationThread"](_0x5627c3) {
      return {
        ..._0x5627c3,
        comments: _0x5627c3.comments.map(_0x1e2f9d => this.migrateVerificationComment(_0x1e2f9d))
      };
    }
    static ["migrateVerificationComment"](_0x51abe7) {
      return {
        ..._0x51abe7,
        referredFiles: _0x51abe7.referredFiles.map(_0x3162a0 => this.migratePathV2ToV3(_0x3162a0))
      };
    }
    static ["migrateFailedPlanIterationQuery"](_0x5cbecd) {
      let {
        mode: _0x27ab9f,
        ..._0x155257
      } = _0x5cbecd;
      return _0x155257;
    }
    static ['migrateAttachmentSummary'](_0x1e490d) {
      return _0x1e490d.fileAttachment ? {
        fileAttachmentSummary: {
          fileName: _0x1e490d.fileAttachment.fileName,
          summary: _0x1e490d.fileAttachment.summary
        }
      } : _0x1e490d.urlAttachment ? {
        fileAttachmentSummary: {
          fileName: _0x1e490d.urlAttachment.url,
          summary: _0x1e490d.urlAttachment.summary
        }
      } : {
        fileAttachmentSummary: null
      };
    }
    static ["migratePathV2ToV3"](_0x50fc42) {
      return {
        absolutePath: _0x50fc42.workspacePath ? path_module.join(_0x50fc42.workspacePath, _0x50fc42.relPath) : _0x50fc42.relPath,
        isDirectory: _0x50fc42.isDirectory ?? false
      };
    }
    static ['migrateThinkingOutput'](_0x175354) {
      return {
        id: Ut(),
        childrenThinkings: [],
        content: {
          codeExplorationToolCallInfo: _0x175354.toolCallInfo ? null : {
            title: "Thought",
            subTitle: '',
            description: _0x175354.title + '\x0a\x0a' + _0x175354.thinking,
            result: ''
          },
          mcpToolCallInfo: _0x175354.toolCallInfo ? {
            toolName: _0x175354.toolCallInfo.toolName,
            parameters: _0x175354.toolCallInfo.parameters,
            result: _0x175354.toolCallInfo.result
          } : null
        },
        isCompleted: true
      };
    }
  },
  TaskMigratorV36 = class {
    static ["migrate"](_0x6156a2) {
      return {
        ..._0x6156a2,
        phaseBreakdowns: _0x6156a2.phaseBreakdowns.map(_0x5c5335 => this.migratePhaseBreakdown(_0x5c5335))
      };
    }
    static ["migratePhaseBreakdown"](_0x15c61e) {
      return {
        ..._0x15c61e,
        tasks: _0x15c61e.tasks.map(_0x387d16 => this.migrateTask(_0x387d16))
      };
    }
    static ["migrateTask"](_0xae610f) {
      return {
        ..._0xae610f,
        plans: _0xae610f.plans.map(_0x16230c => this.migratePlan(_0x16230c))
      };
    }
    static ['migratePlan'](_0x5d9ec6) {
      return {
        ..._0x5d9ec6,
        planConversations: _0x5d9ec6.planConversations.map(_0x4cfaad => this.migratePlanConversation(_0x4cfaad)),
        generatedPlan: _0x5d9ec6.generatedPlan ? this.migrateAllPlanOutput(_0x5d9ec6.generatedPlan) : null
      };
    }
    static ["migratePlanConversation"](_0x3f6362) {
      return {
        ..._0x3f6362,
        plan: _0x3f6362.plan ? this.migrateAllPlanOutput(_0x3f6362.plan) : null
      };
    }
    static ["migrateAllPlanOutput"](_0x20586d) {
      return {
        implementationPlan: _0x20586d.implementationPlan ? this.migrateImplementationPlan(_0x20586d.implementationPlan) : null,
        reviewOutput: _0x20586d.reviewOutput ? this.migrateReviewOutput(_0x20586d.reviewOutput) : null
      };
    }
    static ["migrateImplementationPlan"](_0x4540d6) {
      let {
        summary: _0x50e734,
        ..._0x22467e
      } = _0x4540d6;
      return {
        ..._0x22467e,
        aiGeneratedSummary: _0x50e734
      };
    }
    static ["migrateReviewOutput"](_0x2ba5bf) {
      return {
        ..._0x2ba5bf,
        aiGeneratedSummary: void 0
      };
    }
  },
  TaskMigrator,
  initTaskMigrator = __esmModule(() => {
    'use strict';

    initSearchConfig(), /* [unbundle] initWorkspaceMigrator 已移至独立模块 task_migrators.js */ TaskMigrator = class {
      static ["migrate"](_0x26699c) {
        let _0x4ecdbd = config.CURRENT_TASK_VERSION,
          _0x223deb = _0x26699c.metadata;
        for (; _0x223deb.version < _0x4ecdbd;) {
          switch (_0x223deb.version) {
            case 1:
              throw new Error('This is a breaking change so no migration is needed');
            case 2:
              Logger.debug("Migrating task data from v2 to v3"), _0x26699c.serializedItem = TaskMigratorV0.migrate(_0x26699c.serializedItem);
              break;
            case 3:
              Logger.debug('Migrating task data from v3 to v4'), _0x26699c.serializedItem = TaskMigratorV1.migrate(_0x26699c.serializedItem);
              break;
            case 4:
              Logger.debug('Migrating task data from v4 to v5'), _0x26699c.serializedItem = TaskMigratorV2.migrate(_0x26699c.serializedItem);
              break;
            case 5:
              Logger.debug('Migrating task data from v5 to v6'), _0x26699c.serializedItem = TaskMigratorV3.migrate(_0x26699c.serializedItem);
              break;
            case 6:
              Logger.debug("Migrating task data from v6 to v7"), _0x26699c.serializedItem = TaskMigratorV4.migrate(_0x26699c.serializedItem);
              break;
            case 7:
              Logger.debug("Migrating task data from v7 to v8"), _0x26699c.serializedItem = TaskMigratorV32.migrate(_0x26699c.serializedItem);
              break;
            case 8:
              Logger.debug("Migrating task data from v8 to v9"), _0x26699c.serializedItem = TaskMigratorV33.migrate(_0x26699c.serializedItem);
              break;
            case 9:
              Logger.debug("Migrating task data from v9 to v10"), _0x26699c.serializedItem = TaskMigratorV34.migrate(_0x26699c.serializedItem);
              break;
            case 10:
              Logger.debug('Migrating task data from v10 to v11'), _0x26699c.serializedItem = TaskMigratorV5.migrate(_0x26699c.serializedItem);
              break;
            case 11:
              Logger.debug('Migrating task data from v11 to v12'), _0x26699c.serializedItem = TaskMigratorV6.migrate(_0x26699c.serializedItem);
              break;
            case 12:
              Logger.debug('Migrating task data from v12 to v13'), _0x26699c.serializedItem = TaskMigratorV7.migrate(_0x26699c.serializedItem);
              break;
            case 13:
              Logger.debug("Migrating task data from v13 to v14"), _0x26699c.serializedItem = TaskMigratorV8.migrate(_0x26699c.serializedItem);
              break;
            case 14:
              Logger.debug('Migrating task data from v14 to v15'), _0x26699c.serializedItem = TaskMigratorV9.migrate(_0x26699c.serializedItem);
              break;
            case 15:
              Logger.debug('Migrating task data from v15 to v16'), _0x26699c.serializedItem = TaskMigratorV16.migrate(_0x26699c.serializedItem);
              break;
            case 16:
              Logger.debug('Migrating task data from v16 to v17'), _0x26699c.serializedItem = TaskMigratorV17.migrate(_0x26699c.serializedItem);
              break;
            case 17:
              Logger.debug("Migrating task data from v17 to v18"), _0x26699c.serializedItem = TaskMigratorV18.migrate(_0x26699c.serializedItem);
              break;
            case 18:
              Logger.debug("Migrating task data from v18 to v19"), _0x26699c.serializedItem = TaskMigratorV19.migrate(_0x26699c.serializedItem);
              break;
            case 19:
              Logger.debug('Migrating task data from v19 to v20'), _0x26699c.serializedItem = TaskMigratorV20.migrate(_0x26699c.serializedItem);
              break;
            case 20:
              Logger.debug("Migrating task data from v20 to v21"), _0x26699c.serializedItem = TaskMigratorV21.migrate(_0x26699c.serializedItem);
              break;
            case 21:
              Logger.debug("Migrating task data from v21 to v22"), _0x26699c.serializedItem = TaskMigratorV22.migrate(_0x26699c.serializedItem);
              break;
            case 22:
              Logger.debug("Migrating task data from v22 to v23"), _0x26699c.serializedItem = TaskMigratorV23.migrate(_0x26699c.serializedItem);
              break;
            case 23:
              Logger.debug('Migrating task data from v23 to v24'), _0x26699c.serializedItem = TaskMigratorV24.migrate(_0x26699c.serializedItem);
              break;
            case 24:
              Logger.debug('Migrating task data from v24 to v25'), _0x26699c.serializedItem = TaskMigratorV25.migrate(_0x26699c.serializedItem);
              break;
            case 25:
              Logger.debug('Migrating task data from v25 to v26'), _0x26699c.serializedItem = TaskMigratorV26.migrate(_0x26699c.serializedItem);
              break;
            case 26:
              Logger.debug('Migrating task data from v26 to v27'), _0x26699c.serializedItem = TaskMigratorV27.migrate(_0x26699c.serializedItem);
              break;
            case 27:
              Logger.debug('Migrating task data from v27 to v28'), _0x26699c.serializedItem = TaskMigratorV28.migrate(_0x26699c.serializedItem);
              break;
            case 28:
              Logger.debug('Migrating task data from v28 to v29'), _0x26699c.serializedItem = TaskMigratorV29.migrate(_0x26699c.serializedItem);
              break;
            case 29:
              Logger.debug("Migrating task data from v29 to v30"), _0x26699c.serializedItem = TaskMigratorV30.migrate(_0x26699c.serializedItem);
              break;
            case 30:
              Logger.debug('Migrating task data from v30 to v31'), _0x26699c.serializedItem = TaskMigratorV31.migrate(_0x26699c.serializedItem);
              break;
            case 31:
              Logger.debug('Migrating task data from v31 to v32'), _0x26699c.serializedItem = WorkspaceMigrator.migrate(_0x26699c.serializedItem);
              break;
            case 32:
              Logger.debug('Migrating task data from v32 to v33'), _0x26699c.serializedItem = TaskMigratorV10.migrate(_0x26699c.serializedItem);
              break;
            case 33:
              Logger.debug('Migrating task data from v33 to v34'), _0x26699c.serializedItem = TaskMigratorV11.migrate(_0x26699c.serializedItem);
              break;
            case 34:
              Logger.debug("Migrating task data from v34 to v35"), _0x26699c.serializedItem = TaskMigratorV12.migrate(_0x26699c.serializedItem);
              break;
            case 35:
              Logger.debug("Migrating task data from v35 to v36"), _0x26699c.serializedItem = TaskMigratorV13.migrate(_0x26699c.serializedItem);
              break;
            case 36:
              Logger.debug("Migrating task data from v36 to v37"), _0x26699c.serializedItem = TaskMigratorV14.migrate(_0x26699c.serializedItem);
              break;
            case 37:
              Logger.debug("Migrating task data from v37 to v38"), _0x26699c.serializedItem = TaskMigratorV15.migrate(_0x26699c.serializedItem);
              break;
            case 38:
              Logger.debug("Migrating task data from v38 to v39"), _0x26699c.serializedItem = TaskMigratorV35.migrate(_0x26699c.serializedItem);
              break;
            case 39:
              Logger.debug('Migrating task data from v39 to v40'), _0x26699c.serializedItem = TaskMigratorV36.migrate(_0x26699c.serializedItem);
              break;
            default:
              throw new Error("Attempting to migrate to invalid persisted threads version: " + _0x223deb.version);
          }
          _0x223deb.version = _0x223deb.version + 1;
        }
        return _0x26699c;
      }
    };
  }),
  TaskChainPersistence,
  initTaskChainPersistence = __esmModule(() => {
    'use strict';

    initSearchConfig(), initFileOperations(), initTaskMigrator(), TaskChainPersistence = class _0x5cac0c extends ol {
      static ['getInstance'](_0x1b4138, _0x134bf1, _0x4d52f0) {
        if (!_0x5cac0c.instance) {
          if (!_0x1b4138 || !_0x134bf1 || !_0x4d52f0) throw new Error("Missing arguments to create TaskChainPersistence.");
          _0x5cac0c.instance = new _0x5cac0c(_0x1b4138, _0x134bf1, _0x4d52f0);
        }
        return _0x5cac0c.instance;
      }
      constructor(_0x40f540, _0xba7557, _0x5dee4f) {
        super(_0x40f540, "TaskHistory", _0x5dee4f, config.CURRENT_TASK_VERSION, config.TASK_HISTORY_SIZE), this.shouldInvalidateData = false, this.taskChainTracker = _0xba7557;
      }
      async ["_addFromStorage"](_0x12644b) {
        return Promise.allSettled(_0x12644b.map(_0x329e95 => this.taskChainTracker.addLightTaskChainFromStorage(_0x329e95)));
      }
      ["getLiveItemIDs"]() {
        return this.taskChainTracker.getAllTaskChainIDs();
      }
      ["migrateItem"](_0x8686ff) {
        return TaskMigrator.migrate(_0x8686ff);
      }
      ['getRequiredFiles']() {
        return [];
      }
    };
  }),
  VYe = "Active plan not found for the task",
  ActivePlanNotFoundError = class extends Error {
    constructor(_0x5ec3dc) {
      super(_0x5ec3dc ?? VYe), this.name = "ActivePlanNotFoundError";
    }
  };
async function findAgentsMdFile(_0x1188f6, _0x165fe4) {
  let _0x4fed75 = path_module.join(_0x1188f6, 'AGENTS.md');
  try {
    return await vscode_module.workspace.fs.stat(vscode_module.Uri.file(_0x4fed75)), _0x4fed75;
  } catch {}
  if (TraycerPath.pathEquals(_0x1188f6, _0x165fe4)) return;
  let _0x490768 = path_module.dirname(_0x1188f6);
  if (!TraycerPath.pathEquals(_0x490768, _0x1188f6)) return await findAgentsMdFile(_0x490768, _0x165fe4);
}
async function getAgentsMdContent(_0x5a2524) {
  let _0x1c4a47 = TraycerPath.normalizePath(_0x5a2524),
    _0x29afc0 = TraycerPath.findWorkspaceForPath(_0x1c4a47);
  if (!_0x29afc0) return [];
  let _0x5f17a7 = await findAgentsMdFile(_0x5a2524, _0x29afc0);
  if (!_0x5f17a7) return [];
  let _0x5f088e = await workspace_info.getInstance().readFile(_0x5f17a7, false);
  return [{
    path: (await TraycerPath.fromPath(_0x5f17a7)).proto,
    content: _0x5f088e,
    range: null,
    diagnostics: []
  }];
}
async function getAgentsMdContentFromPaths(_0xb6c7ec) {
  let _0x53b940 = [];
  for (let key of _0xb6c7ec) try {
    let _0x48743e = await getAgentsMdContent(key);
    _0x53b940.push(..._0x48743e);
  } catch {
    continue;
  }
  return _0x53b940;
}
var initGitLogModule = __esmModule(() => {
  'use strict';

  initWorkspaceInfo(), initRepoMappingManager();
});
async function listDirectoryWithAgentsMd(_0x1f3609, _0x1b6bb9) {
  let _0x120891 = TraycerPath.fromPathProto(_0x1f3609),
    _0x11bc6a = [],
    _0x50b9ad = [],
    _0x421b99 = (await searchFilesWithRipgrep(_0x120891.absPath, '', void 0, null, Number.MAX_SAFE_INTEGER, _0x1b6bb9)).trim().replaceAll('\x0d', '\x0a').split('\x0a').filter(Boolean),
    _0x201b6a = await searchFoldersWithRipgrep(_0x120891.absPath, '', null, Number.MAX_SAFE_INTEGER, _0x1b6bb9);
  for (let key of _0x421b99) _0x11bc6a.push(path_module.join(_0x120891.absPath, key));
  for (let key of _0x201b6a) _0x50b9ad.push(path_module.join(_0x120891.absPath, key));
  let _0x22368c = [];
  try {
    let _0x780a5b = _0x120891.absPath;
    _0x22368c = config.enableAgentsMd ? await getAgentsMdContent(_0x780a5b) : [];
  } catch (_0x4ab736) {
    Logger.debug("Failed to read agents.md for directory: " + _0x4ab736), _0x22368c = [];
  }
  return {
    directory: await WorkerPoolManager.exec("list-files-processor.cjs", "buildDirectoryTree", [{
      filePaths: _0x11bc6a,
      directoryPaths: _0x50b9ad,
      rootAbsolutePath: _0x120891.absPath,
      rootPath: _0x1f3609,
      emptyWorkspacePath: TraycerPath.EMPTY_WORKSPACE,
      workspacePath: _0x120891.workspacePath
    }]),
    detectedRuleFiles: _0x22368c
  };
}
var initQueryProcessor = __esmModule(() => {
  'use strict';

  initSearchUtils(), initSearchConfig(), initStatusBar(), initGitLogModule();
});
async function parseAndFormatUserQuery(_0x2bd6eb, _0x253e4d) {
  let _0x4b797c = parseUserQueryContent(_0x2bd6eb, _0x253e4d);
  if (_0x4b797c.attachments.length > 0) {
    for (let key of _0x4b797c.attachments) formatContextFileContent(key);
  }
  return _0x4b797c;
}
async function resolveGitMentions(_0x346575) {
  if (_0x346575.length === 0) return [];
  let _0x2e19c4 = [],
    _0x2e2123 = new Set(),
    _0x489433 = vscode_module.Uri.file(workspace_info.getInstance().getWorkspaceDirs()[0]);
  if (!_0x489433) return Logger.warn("No workspace URI available for git operations"), [];
  let _0x2404a9 = 'against_uncommitted_changes:UNCOMMITTED_CHANGES';
  for (let key of _0x346575) try {
    switch (key.gitType) {
      case 'against_uncommitted_changes':
        {
          if (_0x2e2123.has('against_uncommitted_changes:UNCOMMITTED_CHANGES')) break;
          _0x2e2123.add('against_uncommitted_changes:UNCOMMITTED_CHANGES');
          let _0x475e58 = await getUncommittedFileDeltas(_0x489433, void 0);
          _0x2e19c4.push({
            gitDiffAgainstUncommitted: {
              fileDeltas: _0x475e58
            }
          });
          break;
        }
      case "against_branch":
        if (key.branchName) {
          let _0x2feefb = "against_branch:" + key.branchName;
          if (_0x2e2123.has(_0x2feefb)) break;
          _0x2e2123.add(_0x2feefb);
          let _0x6d78b1 = await getGitFileRelativePath(_0x489433);
          if (_0x6d78b1 && key.branchName !== _0x6d78b1) {
            let _0x41f1e3 = key.branchName + '...' + _0x6d78b1,
              _0x1b4766 = await getRevisionDiffWithContent(_0x489433, _0x41f1e3, void 0);
            _0x2e19c4.push({
              gitDiffAgainstRevision: {
                revisionSpec: _0x41f1e3,
                fileDeltas: _0x1b4766
              }
            });
          } else {
            let _0x4ef5fc = await getUncommittedFileDeltas(_0x489433, void 0);
            _0x2e19c4.push({
              gitDiffAgainstRevision: {
                revisionSpec: key.branchName + "..." + _0x6d78b1,
                fileDeltas: _0x4ef5fc
              }
            });
          }
        } else throw new Error("Branch name is required for AGAINST_BRANCH git type");
        break;
      case "against_commit":
        {
          let _0x4960b8 = "against_commit:" + key.commitHash;
          if (_0x2e2123.has(_0x4960b8)) break;
          if (_0x2e2123.add(_0x4960b8), key.commitHash) {
            let _0x297084 = key.commitHash + '...HEAD',
              _0x49a996 = await getRevisionDiffWithContent(_0x489433, _0x297084, void 0);
            _0x2e19c4.push({
              gitDiffAgainstRevision: {
                revisionSpec: _0x297084,
                fileDeltas: _0x49a996
              }
            }), _0x2e2123.add(_0x4960b8);
          } else throw new Error("Commit hash is required for SINCE_COMMIT git type");
          break;
        }
      default:
        throw new Error('Unknown git type: ' + key.gitType);
    }
  } catch (_0x20324c) {
    Logger.warn('Failed to resolve git mention', {
      error: _0x20324c,
      gitMention: key
    });
  }
  return _0x2e19c4;
}
async function enrichFilesContext(_0x2f8c27) {
  return await enrichAttachmentContext({
    files: _0x2f8c27.files,
    directories: _0x2f8c27.directories,
    detectedRuleFiles: _0x2f8c27.detectedRuleFiles,
    attachments: [],
    gitDiffs: [],
    ticketReference: null
  });
}
async function enrichAttachmentContext(_0x23ee1e) {
  let _0x316721 = await LlmCacheHandler.getInstance(),
    _0x11c9dd = await Promise.all(_0x23ee1e.files.map(async _0xbd0fd => {
      let _0x3128a4 = TraycerPath.fromPathProto(_0xbd0fd.path);
      try {
        let _0x56e628 = _0xbd0fd.content || (await In.getSourceCode(_0x3128a4.absPath));
        return {
          path: _0xbd0fd.path,
          content: _0x56e628,
          summary: await _0x316721.getSummaryFromCache(_0x3128a4.absPath, _0x56e628),
          diagnostics: _0xbd0fd.diagnostics,
          range: _0xbd0fd.range
        };
      } catch (_0x576cb3) {
        throw Logger.warn("Failed to fetch file content", _0x576cb3), new Error("Cannot find the attached file: " + _0x3128a4.absPath);
      }
    })),
    _0xfbd62 = config.enableAgentsMd ? await getAgentsMdContentFromPaths(_0x11c9dd.filter(_0x4c6e0a => _0x4c6e0a?.["path"] !== null).map(_0x54064f => TraycerPath.fromPathProto(_0x54064f.path).absPath)) : [],
    {
      directories: _0x5d44a5,
      detectedRuleFiles: _0xc21cdc
    } = await listDirectoriesWithRuleFiles(_0x23ee1e.directories),
    _0x30687f = new CustomSet((_0x4f79e5, _0x25623e) => TraycerPath.equals(TraycerPath.fromPathProto(_0x4f79e5.path), TraycerPath.fromPathProto(_0x25623e.path)), [..._0xfbd62, ..._0xc21cdc]);
  return {
    files: _0x11c9dd.filter(_0x4b89df => _0x4b89df !== null).map(_0x45328a => ({
      path: _0x45328a.path,
      content: _0x45328a.content,
      summary: _0x45328a.summary,
      diagnostics: _0x45328a.diagnostics,
      range: _0x45328a.range
    })),
    directories: _0x5d44a5,
    detectedRuleFiles: _0x30687f.values(),
    attachments: _0x23ee1e.attachments,
    gitDiffs: _0x23ee1e.gitDiffs,
    ticketReference: _0x23ee1e.ticketReference
  };
}
async function listDirectoriesWithRuleFiles(_0x55874b) {
  let _0x37518b = [..._0x55874b.map(_0x1e29f3 => ({
      fsPath: TraycerPath.fromPathProto(_0x1e29f3.path),
      directory: _0x1e29f3
    }))].sort((_0x3ce35b, _0x24c93c) => _0x3ce35b.fsPath.absPath.length > _0x24c93c.fsPath.absPath.length ? 1 : _0x3ce35b.fsPath.absPath.length < _0x24c93c.fsPath.absPath.length ? -1 : 0),
    _0x1b6d8f = [],
    _0x5812ba = [];
  for (let key of _0x37518b) {
    if (isPathContainedInDirectories(key.fsPath, _0x1b6d8f)) continue;
    if (!(await workspace_info.getInstance().fileExists(key.fsPath.absPath))) {
      Logger.warn('Directory does not exist: ' + key.fsPath.absPath + ", skipping it from the attached context");
      continue;
    }
    let _0x22c9f0 = await listDirectoryWithAgentsMd(key.fsPath.proto, true);
    _0x22c9f0.directory && _0x1b6d8f.push(_0x22c9f0.directory), _0x22c9f0.detectedRuleFiles && _0x5812ba.push(..._0x22c9f0.detectedRuleFiles);
  }
  return {
    directories: _0x1b6d8f,
    detectedRuleFiles: _0x5812ba
  };
}
function isPathContainedInDirectories(_0x90173f, _0x44af6d) {
  function _0x48cc70(_0x478945, _0x1b229b) {
    if (_0x478945.absPath !== _0x1b229b.absPath) return false;
    let _0x3153ee = _0x478945.absUri,
      _0x3d930e = _0x1b229b.absUri;
    if (_0x3153ee.toString() === _0x3d930e.toString()) return true;
    let _0x2de6f1 = _0x3153ee.path,
      _0x24125d = _0x3d930e.path;
    if (_0x24125d === _0x2de6f1) return true;
    let _0x12e1cc = _0x2de6f1.endsWith('/') ? _0x2de6f1 : _0x2de6f1 + '/';
    return _0x24125d.startsWith(_0x12e1cc);
  }
  function _0x5b7500(_0xea6bd9) {
    if (_0xea6bd9.path) {
      let _0x490c72 = TraycerPath.fromPathProto(_0xea6bd9.path);
      if (_0x48cc70(_0x490c72, _0x90173f)) return true;
      if (_0x48cc70(_0x90173f, _0x490c72)) return false;
    }
    for (let key of _0xea6bd9.subDirectories) if (_0x5b7500(key)) return true;
    return false;
  }
  for (let key of _0x44af6d) if (_0x5b7500(key)) return true;
  return false;
}
var initPlanContextModule = __esmModule(() => {
    'use strict';

    initSearchConfig(), initDocumentManager(), initWorkspaceInfo(), initQueryProcessor(), initGitLogModule(), initLlmCacheHandler();
  }),
  $Ye = 'Implementation plan not found',
  ImplementationPlanNotFoundError = class extends Error {
    constructor() {
      super($Ye), this.name = 'ImplementationPlanNotFoundError';
    }
  };
function parseQueryParams(_0x201ec2) {
  let _0x2924b3 = {};
  for (let key of _0x201ec2) if (key.includes('=')) {
    let [_0x4eb962, _0x305d43] = key.split('=', 2).map(decodeURIComponent);
    _0x4eb962 && (_0x2924b3[_0x4eb962] = _0x305d43);
  }
  return _0x2924b3;
}
/* [unbundle] formatTicketReferenceDisplay, getGitHubIssueUrl 已移至 github_ticket_query_builder.js */
/* [unbundle] GitHubTicketQueryBuilder 已移至 github_ticket_query_builder.js */
function formatVerificationResult(_0x219b5a) {
  switch (_0x219b5a.ticketSource) {
    case TICKET_SOURCE.GITHUB_TICKET:
      return new GitHubTicketQueryBuilder(_0x219b5a);
    default:
      throw new Error("Unsupported ticket source: " + _0x219b5a.ticketSource);
  }
}
async function parseAndEnrichUserQuery(_0x469cbe) {
  let {
      userQuery: _0x5d2bff,
      sourceContext: _0x58dd0a,
      attachments: _0x161ff0,
      githubTicketRef: _0x4d0ac8,
      gitMentions: _0x9ccb80
    } = await parseAndFormatUserQuery(_0x469cbe, workspace_info.getInstance().getPlatform()),
    _0x4486e0 = _0x58dd0a;
  (_0x4486e0?.['files']?.["length"] || _0x4486e0?.["directories"]?.['length']) && (_0x4486e0 = await enrichAttachmentContext(_0x4486e0));
  let _0x4f745a = await resolveGitMentions(_0x9ccb80);
  return {
    query: _0x5d2bff,
    context: {
      ..._0x4486e0,
      gitDiffs: _0x4f745a,
      ticketReference: {
        github: _0x4d0ac8
      },
      attachments: _0x161ff0
    }
  };
}
var initPlanOutputModule = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initPlanContextModule();
  }),
  BasePlanOutput = class {
    constructor(_0x16d7d2) {
      this.planOutput = _0x16d7d2, this.validateOutput();
    }
    ['validateOutput']() {
      if (!this.planOutput) throw new Error("Plan output cannot be null or undefined");
    }
    ["throwNotFoundError"](_0x104d8b) {
      throw new Error(_0x104d8b + " not found in plan output");
    }
  },
  ImplementationPlanNotFoundError,
  ImplementationPlanOutput,
  initImplementationPlanOutput = __esmModule(() => {
    'use strict';

    initFilePathHandler(), ImplementationPlanNotFoundError = class extends Error {
      constructor(_0x1a9d35 = "Implementation plan not found in plan output") {
        super(_0x1a9d35), this.name = "ImplementationPlanNotFoundError";
      }
    }, ImplementationPlanOutput = class extends BasePlanOutput {
      constructor(_0x51bf47) {
        super(_0x51bf47);
      }
      ['validateOutput']() {
        if (super.validateOutput(), !this.planOutput.implementationPlan) throw new ImplementationPlanNotFoundError();
      }
      ['setPlanSummary'](_0x35308b) {
        if (!this.planOutput.implementationPlan) throw new ImplementationPlanNotFoundError();
        this.planOutput.implementationPlan.aiGeneratedSummary = _0x35308b;
      }
      ['getImplementationPlan']() {
        return this.planOutput.implementationPlan || this.throwNotFoundError("ImplementationPlan"), this.planOutput.implementationPlan;
      }
      ["serializeToStorage"]() {
        return {
          implementationPlan: this.getImplementationPlan(),
          reviewOutput: null
        };
      }
      async ["serializeToUI"]() {
        let _0x5172a4 = this.getImplementationPlan();
        return {
          implementationPlan: {
            ..._0x5172a4,
            output: await na.convertFilePath(_0x5172a4.output)
          },
          reviewOutput: void 0
        };
      }
      ['serializeToWire']() {
        return this.getImplementationPlan();
      }
    };
  }),
  AnalysisFinding,
  initAnalysisFinding = __esmModule(() => {
    'use strict';

    AnalysisFinding = class _0x2cdb4f {
      constructor(_0x516eb8, _0x173ada, _0x25d801, _0x5f2887, _0x17b7aa, _0x21e66f, _0x54c73d) {
        this._id = _0x516eb8, this._statement = _0x173ada, this._explanation = _0x25d801, this._promptForAIAgent = _0x5f2887, this._relevantFiles = _0x17b7aa, this._category = _0x21e66f, this._isApplied = _0x54c73d;
      }
      ["markAsApplied"]() {
        this._isApplied = true;
      }
      ['resetApplied']() {
        this._isApplied = false;
      }
      static ['createFromProto'](_0x6e49c6) {
        let _0x45a6d1 = _0x6e49c6.relevantFiles.map(_0x4422bd => TraycerPath.fromPathProto(_0x4422bd));
        return new _0x2cdb4f(_0x6e49c6.id, _0x6e49c6.statement, _0x6e49c6.explanation, _0x6e49c6.promptForAIAgent, _0x45a6d1, _0x6e49c6.category, _0x6e49c6.isApplied);
      }
      ["serializeToStorage"]() {
        return {
          id: this._id,
          statement: this._statement,
          explanation: this._explanation,
          promptForAIAgent: this._promptForAIAgent,
          relevantFiles: this._relevantFiles.map(_0x3a5375 => _0x3a5375.serializeToStorage()),
          category: this._category,
          isApplied: this._isApplied
        };
      }
      ['serializeToWire']() {
        return {
          id: this._id,
          statement: this._statement,
          explanation: this._explanation,
          promptForAIAgent: this._promptForAIAgent,
          relevantFiles: this._relevantFiles.map(_0x5062af => _0x5062af.serializeToWire()),
          category: this._category,
          isApplied: this._isApplied
        };
      }
      ["serializeToUI"]() {
        return {
          id: this._id,
          statement: this._statement,
          explanation: this._explanation,
          promptForAIAgent: this._promptForAIAgent,
          relevantFiles: this._relevantFiles.map(_0x594347 => _0x594347.serializeToWire()),
          category: this._category,
          isApplied: this._isApplied
        };
      }
      get ['id']() {
        return this._id;
      }
      get ["statement"]() {
        return this._statement;
      }
      get ['explanation']() {
        return this._explanation;
      }
      get ['promptForAIAgent']() {
        return ('\x0a' + this._promptForAIAgent + "\n\n### Relevant Files\n" + this._relevantFiles.map(_0x5bb96f => '- ' + _0x5bb96f.absPath).join('\x0a')).trimEnd();
      }
      get ["relevantFiles"]() {
        return this._relevantFiles;
      }
      get ['isApplied']() {
        return this._isApplied;
      }
      get ['category']() {
        return this._category;
      }
    };
  }),
  ReviewOutput,
  initReviewOutput = __esmModule(() => {
    'use strict';

    initStatusBar(), initAnalysisFinding(), ReviewOutput = class _0x4e2c46 {
      constructor(_0x18ca01, _0x232e46, _0x30ce46, _0x284965) {
        this._markdown = _0x18ca01, this._howDidIGetHere = _0x232e46, this._mermaid = _0x30ce46, this._comments = _0x284965;
      }
      get ["markdown"]() {
        return this._markdown;
      }
      set ["markdown"](_0x2620c1) {
        this._markdown = _0x2620c1;
      }
      get ['howDidIGetHere']() {
        return this._howDidIGetHere;
      }
      get ["mermaid"]() {
        return this._mermaid;
      }
      get ['comments']() {
        return this._comments;
      }
      get ["allComments"]() {
        return [...this._comments];
      }
      ['findCommentById'](_0x3203b9) {
        let _0x3246de = this._comments.find(_0xa2f1ee => _0xa2f1ee.id === _0x3203b9);
        if (!_0x3246de) throw new Error("Review comment with ID " + _0x3203b9 + ' not found. Current IDs: ' + this._comments.map(_0x544cd5 => _0x544cd5.id).join(', '));
        return _0x3246de;
      }
      async ["getReviewFiles"]() {
        let _0x255453 = [];
        for (let _0x5c9a6d of this._comments) for (let key of _0x5c9a6d.relevantFiles) _0x255453.push(key);
        let {
          fileContents: _0x461ffd,
          failedPaths: _0x1aa753
        } = await readFilesWithSummary(_0x255453, "fileContent");
        return _0x1aa753.length > 0 && Logger.debug('Failed to get review files for ' + _0x1aa753.map(_0x31eecc => _0x31eecc.absPath).join(', ')), _0x461ffd;
      }
      ["serializeToStorage"]() {
        return {
          markdown: this._markdown,
          howDidIGetHere: this._howDidIGetHere,
          mermaid: this._mermaid,
          comments: this._comments.map(_0xa9eeff => _0xa9eeff.serializeToStorage())
        };
      }
      ['serializeToUI']() {
        return {
          markdown: this._markdown,
          mermaid: this._mermaid,
          howDidIGetHere: this._howDidIGetHere,
          comments: this._comments.map(_0x514e00 => _0x514e00.serializeToUI())
        };
      }
      static ['createFromProto'](_0x13d7d0) {
        let _0x479be7 = _0x13d7d0.comments.map(_0x1963fc => AnalysisFinding.createFromProto(_0x1963fc));
        return new _0x4e2c46(_0x13d7d0.markdown, _0x13d7d0.howDidIGetHere, _0x13d7d0.mermaid, _0x479be7);
      }
      ["removeComments"](_0x2ca652) {
        for (let key of _0x2ca652) {
          let _0x5ed828 = this._comments.findIndex(_0x1620a5 => _0x1620a5.id === key);
          _0x5ed828 !== -1 && this._comments.splice(_0x5ed828, 1);
        }
      }
    };
  }),
  ll,
  L_,
  initPlanEditor = __esmModule(() => {
    'use strict';

    initIDEAgentManager(), initTemplateManager(), initReviewOutput(), initTaskContext(), ll = class extends Error {
      constructor(_0x13986e = 'Review output not found in plan output') {
        super(_0x13986e), this.name = 'ReviewOutputNotFoundError';
      }
    }, L_ = class extends BasePlanOutput {
      constructor(_0x25d775) {
        super(_0x25d775), this.initializeReviewOutput();
      }
      ["validateOutput"]() {
        if (super.validateOutput(), !this.planOutput.reviewOutput) throw new ll();
      }
      ["initializeReviewOutput"]() {
        let _0x17e6de = this.planOutput.reviewOutput;
        if (!_0x17e6de) throw new ll("ReviewOutput not found in plan output");
        this.reviewOutputInstance = ReviewOutput.createFromProto(_0x17e6de);
      }
      ['setPlanSummary'](_0xd2cbdf) {
        if (!this.planOutput.reviewOutput) throw new ll();
        this.planOutput.reviewOutput.aiGeneratedSummary = _0xd2cbdf;
      }
      ["getReviewOutput"]() {
        if (!this.reviewOutputInstance) throw new ll('ReviewOutput instance not initialized');
        return this.reviewOutputInstance;
      }
      ["getReviewOutputProto"]() {
        if (!this.planOutput.reviewOutput) throw new ll('ReviewOutput not found in plan output');
        return this.planOutput.reviewOutput;
      }
      ['getReviewComments']() {
        return this.getReviewOutput().comments;
      }
      ['findCommentById'](_0x480bbb) {
        return this.getReviewOutput().findCommentById(_0x480bbb);
      }
      ["serializeToStorage"]() {
        return {
          reviewOutput: this.getReviewOutput().serializeToStorage(),
          implementationPlan: null
        };
      }
      async ['serializeToUI']() {
        return {
          reviewOutput: this.getReviewOutput().serializeToUI(),
          implementationPlan: void 0
        };
      }
      ['serializeToWire']() {
        return this.getReviewOutputProto();
      }
      ["applyComment"](_0x4de275) {
        let _0x2a8d6b = this.findCommentById(_0x4de275);
        if (!_0x2a8d6b) throw new Error("Review comment with ID " + _0x4de275 + ' not found');
        _0x2a8d6b.markAsApplied();
      }
      ["revertComment"](_0x11ace8) {
        let _0x499df3 = this.findCommentById(_0x11ace8);
        if (!_0x499df3) throw new Error('Review comment with ID ' + _0x11ace8 + ' not found');
        _0x499df3.resetApplied();
      }
      ['applyComments'](_0x54c761) {
        _0x54c761.map(_0x48a1e2 => this.applyComment(_0x48a1e2));
      }
      ['revertComments'](_0x489ab2) {
        _0x489ab2.map(_0x4083fd => this.revertComment(_0x4083fd));
      }
      ["discardComments"](_0x8567a9) {
        return this.getReviewOutput().removeComments(_0x8567a9);
      }
      async ['executeCommentsInIDE'](_0xc9b2b6, _0x49099d, _0x618df6, _0x3a6e7c, _0x28eab1, _0x13f304, _0x28ff87) {
        if (_0x49099d.length === 0) throw new Error('No review comment IDs provided');
        let _0x2dbdbe = this.dedupeIds(_0x49099d),
          _0x3635be = this.filterComments(_0x57b3dc => _0x2dbdbe.includes(_0x57b3dc.id));
        await this.executeBatchReviewComments(_0xc9b2b6, _0x3635be, _0x618df6, _0x3a6e7c, _0x28eab1, _0x28ff87, _0x13f304);
      }
      async ['executeAllCommentsInIDE'](_0x5d1d89, _0x599869, _0x21d12e, _0x5292fe, _0x51af7a, _0x20a929, _0x6fe5d5) {
        let _0x2d7751 = this.getCommentsByStatus(false);
        _0x2d7751.length !== 0 && (_0x5292fe && (_0x2d7751 = _0x2d7751.filter(_0x13babd => _0x13babd.category === _0x5292fe)), _0x2d7751.length !== 0 && (await this.executeBatchReviewComments(_0x5d1d89, _0x2d7751, _0x599869, _0x21d12e, _0x51af7a, _0x6fe5d5, _0x20a929)));
      }
      async ["executeBatchReviewComments"](_0x51296a, _0x10ff30, _0x740164, _0x24668c, _0xbb929f, _0x23b53e, _0x189f70) {
        if (_0x10ff30.length === 0) return;
        let _0x3834de = this.buildCombinedContentFromComments(_0x10ff30),
          _0x18276c = "Review : " + _0x51296a,
          _0x1f4876 = await br.getInstance().getPromptTemplate(_0x24668c).applyTemplate('---\x0a' + _0x3834de);
        _0x23b53e && (_0x1f4876 += '\x0a\x0a' + _0x23b53e), await debounce(_0x1f4876, _0x18276c, _0x740164, _0x189f70), _0x10ff30.forEach(_0x406311 => _0x406311.markAsApplied()), await _0xbb929f(), await Vt.getInstance().setLastUsedIDEAgents("review", _0x740164);
      }
      ["buildCombinedContentFromComments"](_0x28eb1c) {
        let _0x794c96 = '';
        return _0x28eb1c.forEach((_0x1c8ce7, _0xd90a06) => {
          _0x794c96 += "## Comment " + (_0xd90a06 + 1) + ': ' + _0x1c8ce7.statement + '\x0a', _0x794c96 += _0x1c8ce7.promptForAIAgent + '\x0a', _0xd90a06 <= _0x28eb1c.length - 1 && (_0x794c96 += '---\x0a');
        }), _0x794c96.trimEnd();
      }
      ["dedupeIds"](_0x2670a4) {
        let _0x1f251c = {},
          _0x173657 = [];
        for (let key of _0x2670a4) _0x1f251c[key] || (_0x1f251c[key] = true, _0x173657.push(key));
        return _0x173657;
      }
      ["filterComments"](_0x3b5f9a) {
        return this.getReviewComments().filter(_0x3b5f9a);
      }
      ['getCommentsByStatus'](_0x386900) {
        return this.filterComments(_0x2c3b7b => _0x2c3b7b.isApplied === _0x386900);
      }
    };
  }),
  o0,
  WM,
  initPlanEditorDeps = __esmModule(() => {
    'use strict';

    initImplementationPlanOutput(), initPlanEditor(), o0 = class extends Error {
      constructor(_0x10908f = 'No valid output type found in plan output') {
        super(_0x10908f), this.name = 'InvalidPlanOutputError';
      }
    }, WM = class {
      static ['createHandler'](_0x259a95) {
        if (!_0x259a95) throw new o0('Plan output cannot be null or undefined');
        let _0x29cf29 = [_0x259a95.implementationPlan != null, _0x259a95.reviewOutput != null].filter(Boolean).length;
        if (_0x29cf29 === 0) throw new o0('No output found: expected one of explanationPlan or implementationPlan, reviewOutput');
        if (_0x29cf29 > 1) throw new o0('Multiple outputs present: plan output must be mutually exclusive. One of explanationPlan or implementationPlan, reviewOutput');
        if (_0x259a95.implementationPlan !== void 0 && _0x259a95.implementationPlan !== null) return new ImplementationPlanOutput(_0x259a95);
        if (_0x259a95.reviewOutput !== void 0 && _0x259a95.reviewOutput !== null) return new L_(_0x259a95);
        throw new o0('No valid output type found. Plan output must contain one of: explanationPlan, implementationPlan, or reviewOutput');
      }
    };
  }),
  UserQueryMessage,
  initUserQueryMessage = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), UserQueryMessage = class {
      constructor(_0xc5e000, _0x2e56a7, _0x427d8c, _0x22a957, _0x5328dd, _0xe72ed6, _0x436ab2, _0x50825d) {
        this._queryJSONContent = null, this._id = _0x50825d;
        let {
          userQueryWithMentions: _0x37c8e6,
          attachments: _0x261916
        } = parseUserQueryContent(_0xc5e000, workspace_info.getInstance().getPlatform());
        (!_0x261916.length || _0x5328dd) && (this._queryJSONContent = _0xc5e000), this._queryWithMentions = _0x37c8e6, this._payload = _0x2e56a7, this._logs = _0x22a957, this._isStreaming = _0x5328dd, this._isAborted = _0xe72ed6, this._hasFailed = _0x436ab2;
      }
      get ['id']() {
        return this._id;
      }
      get ["logs"]() {
        return this._logs;
      }
      get ["payload"]() {
        return this._payload;
      }
      get ["queryWithMentions"]() {
        return this._queryWithMentions;
      }
      set ["isStreaming"](_0x5aef61) {
        this._isStreaming = _0x5aef61;
      }
      set ["isAborted"](_0x46baa8) {
        this._isAborted = _0x46baa8;
      }
      set ['hasFailed'](_0x257c9d) {
        this._hasFailed = _0x257c9d;
      }
      ['updateLog'](_0x55822c) {
        let _0x556ef3 = this.findLogEntry(_0x55822c.id);
        return _0x556ef3 ? (_0x556ef3.content = _0x55822c.content, _0x556ef3.childrenThinkings = _0x55822c.childrenThinkings, _0x556ef3.isCompleted = _0x55822c.isCompleted) : this._logs.push(_0x55822c), this._logs;
      }
      ['findLogEntry'](_0x5ec474) {
        return this._logs.find(_0x531b42 => _0x531b42.id === _0x5ec474);
      }
    };
  }),
  PlanConversation,
  initPlanConversation = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initUserQueryMessage(), PlanConversation = class _0x47e2c7 extends UserQueryMessage {
      constructor(_0x5124c7, _0x5501ea, _0x449db9, _0x292314 = {}) {
        super(_0x5501ea, _0x292314.plan, _0x449db9, _0x292314.logs ?? [], _0x292314.isStreaming ?? false, _0x292314.isAborted ?? false, _0x292314.hasFailed ?? false, _0x292314.id ?? Ut()), this._storageAPI = _0x5124c7;
      }
      static async ['createNewInstance'](_0x171cab, _0x17aaf1, _0x4851ae, _0x161f58, _0x489787 = {}) {
        let _0x4d5765 = new _0x47e2c7(_0x171cab, _0x17aaf1, _0x4851ae, _0x489787);
        return await _0x161f58({
          id: _0x4d5765.id,
          userQuery: _0x17aaf1,
          llmInput: StorageSerializer.toStorage(_0x4851ae),
          plan: null,
          logs: []
        }), _0x4d5765;
      }
      get ["storageAPI"]() {
        return this._storageAPI;
      }
      async ["setIsStreaming"](_0x20c67f) {
        this._isStreaming = _0x20c67f;
      }
      async ['setIsAborted'](_0x2ad73a) {
        this._isAborted = _0x2ad73a;
      }
      async ["setHasFailed"](_0xf10c27) {
        this._hasFailed = _0xf10c27;
      }
      async ['getUserQuery']() {
        return this._queryJSONContent ? this._queryJSONContent : (await this.storageAPI.read()).userQuery;
      }
      async ["setUserQuery"](_0xba36e3, _0x5d7a9e) {
        let {
          userQueryWithMentions: _0x374762,
          attachments: _0x44d2e6
        } = parseUserQueryContent(_0xba36e3, workspace_info.getInstance().getPlatform());
        if (this._queryWithMentions = _0x374762, !_0x44d2e6.length || this._isStreaming ? this._queryJSONContent = _0xba36e3 : this._queryJSONContent = null, _0x5d7a9e) return this.upsertOnDisk(_0x2f7640 => {
          _0x2f7640.userQuery = _0xba36e3;
        });
      }
      async ["getLLMInput"]() {
        let _0x3b78b2 = await this.storageAPI.read();
        return StorageSerializer.fromStorage(_0x3b78b2.llmInput);
      }
      async ["setLLMInput"](_0x43f7c1) {
        return this.upsertOnDisk(_0x319590 => {
          _0x319590.llmInput = StorageSerializer.toStorage(_0x43f7c1);
        });
      }
      async ["serializeToUIHeavy"]() {
        return {
          id: this.id,
          userQuery: await this.getUserQuery(),
          plan: this.payload ?? void 0,
          logs: this._logs,
          isStreaming: this._isStreaming
        };
      }
      async ['handlePlanOutput'](_0x1a1d8c, _0x38dffb) {
        this._isStreaming = false, this._payload = _0x1a1d8c, this._queryJSONContent && (await this.setUserQuery(this._queryJSONContent, false)), await this.upsertOnDisk(_0x5b2818 => {
          _0x5b2818.plan = {
            implementationPlan: _0x1a1d8c.implementationPlan ?? null,
            reviewOutput: _0x1a1d8c.reviewOutput ?? null
          }, _0x5b2818.llmInput = StorageSerializer.toStorage(_0x38dffb), _0x5b2818.logs = this._logs;
        });
      }
      static async ['deserializeFromStorage'](_0x3908c6, _0x493f00) {
        return new _0x47e2c7(_0x493f00, _0x3908c6.userQuery, StorageSerializer.fromStorage(_0x3908c6.llmInput), {
          id: _0x3908c6.id,
          logs: _0x3908c6.logs,
          isStreaming: false,
          isAborted: false,
          hasFailed: false,
          plan: _0x3908c6.plan
        });
      }
      async ['dispose']() {}
      async ['upsertOnDisk'](_0x5543c9) {
        return this.storageAPI.runInTransaction(async _0x450f87 => {
          let _0x1e5f24 = await this.storageAPI.read();
          _0x5543c9(_0x1e5f24), await this.storageAPI.upsert(_0x1e5f24, _0x450f87);
        });
      }
    };
  });
function findPlanConversationIndex(_0x1871e6, _0x313b6d) {
  let _0xa4fb72 = _0x1871e6.planConversations.findIndex(_0x4bb143 => _0x4bb143.id === _0x313b6d);
  if (_0xa4fb72 === -1) throw new Error("Plan conversation storage API: Plan conversation with id " + _0x313b6d + ' not found in plan.');
  return _0xa4fb72;
}
function getPlanConversationById(_0x4c7eae, _0x30cb5c) {
  let _0x385cb0 = findPlanConversationIndex(_0x4c7eae, _0x30cb5c);
  return _0x4c7eae.planConversations[_0x385cb0];
}
function updatePlanConversation(_0x3b6d62, _0x393c36) {
  let _0x369130 = findPlanConversationIndex(_0x3b6d62, _0x393c36.id);
  _0x3b6d62.planConversations[_0x369130] = _0x393c36;
}
function deletePlanConversation(_0x266d7d, _0x45098c) {
  let _0x9fb2bc = findPlanConversationIndex(_0x266d7d, _0x45098c);
  _0x266d7d.planConversations.splice(_0x9fb2bc, 1);
}
var NP = class {
    constructor(_0x164bab) {
      this.planStorageAPI = _0x164bab;
    }
    async ['read'](_0x2628df) {
      let _0xca06e3 = await this.planStorageAPI.read();
      return getPlanConversationById(_0xca06e3, _0x2628df);
    }
    async ['upsert'](_0xff3d17, _0x14b5e1) {
      let _0x474f29 = await this.planStorageAPI.read();
      updatePlanConversation(_0x474f29, _0xff3d17), await this.planStorageAPI.upsert(_0x474f29, _0x14b5e1);
    }
    async ["runInTransaction"](_0xe73334) {
      return this.planStorageAPI.runInTransaction(_0xe73334);
    }
    async ['delete'](_0x10b32d, _0xac6d8d) {
      let _0x4f9c3e = await this.planStorageAPI.read();
      deletePlanConversation(_0x4f9c3e, _0x10b32d), await this.planStorageAPI.upsert(_0x4f9c3e, _0xac6d8d);
    }
    ['getAdapter'](_0x5c4a0a) {
      return new CW(this, _0x5c4a0a);
    }
  },
  CW = class extends BaseStorage {},
  Uf,
  initTaskExecution = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initPlanOutputModule(), initPlanEditorDeps(), initImplementationPlanOutput(), initPlanEditor(), initPlanConversation(), Uf = class _0x41754d {
      constructor(_0x167b0c, _0x15c7b8, _0x325423, _0x5e0628, _0xc66fdd, _0x910f84, _0x314df0, _0x45b3ed = {}) {
        this._parentPlan = _0x167b0c, this._planStorageAdapter = _0x15c7b8, this._planArtifactType = _0x325423, this._generatedPlan = null, this._queryJSONContent = null, this._isExecuted = false, this._executedWithAgent = null, this._isPayAsYouGo = false, this._planOutputHandler = null, this._isQueryExecutedDirectly = false, this._id = _0x45b3ed.id ?? Ut(), this._planConversations = _0x45b3ed.planConversations ?? [], this._executedWithAgent = _0x45b3ed.executedWithAgent ? AgentRegistry.getInstance().getAgentInfoIfExists(_0x45b3ed.executedWithAgent) : null, this._isExecuted = _0x45b3ed.isExecuted ?? false, this._isPayAsYouGo = _0x45b3ed.isPayAsYouGo ?? false, this._logs = _0x45b3ed.logs ?? [], this._hasSentCreationMetrics = _0x45b3ed.hasSentCreationMetrics ?? false, this._generatedPlan = _0x5e0628;
        let {
          userQueryWithMentions: _0x4b4184,
          attachments: _0x570610
        } = parseUserQueryContent(_0xc66fdd, workspace_info.getInstance().getPlatform());
        (!_0x570610.length || _0x910f84) && (this._queryJSONContent = _0xc66fdd), this._queryWithMentions = _0x4b4184, this._isStreaming = _0x910f84, this._isQueryExecutedDirectly = _0x45b3ed.isQueryExecutedDirectly ?? false;
      }
      static async ["createNewInstance"](_0x397e30, _0x939807, _0x2e8f77, _0x454419, _0x274903, _0x1677f5, _0x5767f5 = {}) {
        let _0x2d6b24 = new _0x41754d(_0x939807, _0x2e8f77, _0x397e30, null, _0x454419, _0x274903, void 0, _0x5767f5);
        return await _0x1677f5({
          id: _0x2d6b24.id,
          queryJsonContent: _0x454419,
          llmInput: null,
          isExecuted: false,
          isPayAsYouGo: false,
          hasSentCreationMetrics: false,
          executedWithAgent: null,
          logs: [],
          planConversations: [],
          parentPlanID: _0x939807?.['id'] ?? null,
          generatedPlan: null,
          planArtifactType: _0x397e30,
          isQueryExecutedDirectly: false,
          planSummary: void 0
        }), _0x2d6b24;
      }
      get ["outputHandler"]() {
        return this._planOutputHandler ? this._planOutputHandler : this.createOutputHandler();
      }
      ["createOutputHandler"]() {
        if (!this._generatedPlan) return null;
        let _0x420ee5 = WM.createHandler(this._generatedPlan);
        return this._planOutputHandler = _0x420ee5, _0x420ee5;
      }
      ['mustGetOutputHandler']() {
        let _0x19855f = this.outputHandler;
        if (!_0x19855f) throw new Error("Output handler not found");
        return _0x19855f;
      }
      get ['planArtifactType']() {
        return this._planArtifactType;
      }
      async ['setPlanSummary'](_0x5b5424) {
        let _0x2f465e = this.mustGetOutputHandler();
        _0x2f465e.setPlanSummary(_0x5b5424), await this.upsertToDisk(_0x43a70e => {
          _0x43a70e.generatedPlan = _0x2f465e.serializeToStorage();
        });
      }
      get ["storageAPI"]() {
        return this._planStorageAdapter;
      }
      get ['hasSentCreationMetrics']() {
        return this._hasSentCreationMetrics;
      }
      async ["sendCreationMetrics"](_0x34118a, _0x5616c9) {
        try {
          this._hasSentCreationMetrics || (_0x34118a.increment("task_plan_generation", _0x5616c9), this._hasSentCreationMetrics = true, await this.upsertToDisk(_0x355fe6 => {
            _0x355fe6.hasSentCreationMetrics = true;
          }));
        } catch (_0x4cc280) {
          Logger.warn('Failed to send creation metrics for plan ' + this.id, _0x4cc280);
        }
      }
      get ['id']() {
        return this._id;
      }
      get ["isExecuted"]() {
        return this._isExecuted;
      }
      get ['executedWithAgent']() {
        return this._executedWithAgent;
      }
      get ['isPayAsYouGo']() {
        return this._isPayAsYouGo;
      }
      get ["isQueryExecutedDirectly"]() {
        return this._isQueryExecutedDirectly;
      }
      get ['parentPlan']() {
        return this._parentPlan;
      }
      get ["generatedPlan"]() {
        return this._generatedPlan;
      }
      async ["setIsExecuted"](_0x320185, _0x1b0a3d) {
        this._isExecuted = _0x320185, _0x1b0a3d && (await this.upsertToDisk(_0x382df2 => {
          _0x382df2.isExecuted = _0x320185;
        }));
      }
      async ['setExecutedWithAgent'](_0x361d15) {
        this._executedWithAgent = _0x361d15 ? AgentRegistry.getInstance().getAgentInfo(_0x361d15) : null, _0x361d15 ? this._isExecuted = true : this._isExecuted = false, await this.upsertToDisk(_0x32e533 => {
          _0x32e533.executedWithAgent = _0x361d15, _0x32e533.isExecuted = this._isExecuted;
        });
      }
      async ["handlePlanGenerationFailure"]() {
        this._isPayAsYouGo = false, this._isStreaming = false, this._logs = [], this._queryJSONContent && (await this.setQueryJSONContent(this._queryJSONContent, false)), await this.upsertToDisk(_0x18ab82 => {
          _0x18ab82.isPayAsYouGo = false, _0x18ab82.logs = [];
        });
      }
      async ["setPayAsYouGo"](_0x410a80) {
        this._isPayAsYouGo = _0x410a80, await this.upsertToDisk(_0x24fa9f => {
          _0x24fa9f.isPayAsYouGo = _0x410a80;
        });
      }
      async ['setQueryExecutedDirectly'](_0x4932eb) {
        this._isQueryExecutedDirectly = _0x4932eb, await this.upsertToDisk(_0x5ce899 => {
          _0x5ce899.isQueryExecutedDirectly = _0x4932eb;
        });
      }
      async ['getQueryJSONContent']() {
        return this._queryJSONContent ? this._queryJSONContent : (await this.storageAPI.read()).queryJsonContent;
      }
      async ["setQueryJSONContentAndArtifactType"](_0x29d781, _0xd111e6, _0x5b8efb) {
        await this.setQueryJSONContent(_0x29d781, false), await this.setPlanArtifactType(_0xd111e6, false), _0x5b8efb && (await this.upsertToDisk(_0xfc1a4d => {
          _0xfc1a4d.queryJsonContent = _0x29d781, _0xfc1a4d.planArtifactType = _0xd111e6;
        }));
      }
      async ['setPlanArtifactType'](_0x3c0381, _0x182b32) {
        this._planArtifactType = _0x3c0381, _0x182b32 && (await this.upsertToDisk(_0x442742 => {
          _0x442742.planArtifactType = _0x3c0381;
        }));
      }
      async ["setQueryJSONContent"](_0x44466e, _0x22b5ab) {
        let {
          userQueryWithMentions: _0x591241,
          attachments: _0x7e96e1
        } = parseUserQueryContent(_0x44466e, workspace_info.getInstance().getPlatform());
        !_0x7e96e1.length || this._isStreaming ? this._queryJSONContent = _0x44466e : this._queryJSONContent = null, this._queryWithMentions = _0x591241, _0x22b5ab && (await this.upsertToDisk(_0x21d8de => {
          _0x21d8de.queryJsonContent = _0x44466e;
        }));
      }
      async ["updateQueryAndPlanArtifactType"](_0x43673a, _0x28b308) {
        await this.setQueryJSONContent(_0x43673a, false), await this.setPlanArtifactType(_0x28b308, false), await this.upsertToDisk(_0x4e4917 => {
          _0x4e4917.queryJsonContent = _0x43673a, _0x4e4917.planArtifactType = _0x28b308;
        });
      }
      ["isPlanConvInProgress"]() {
        return !!this._activeConversation;
      }
      get ['logs']() {
        return this._logs;
      }
      async ["getLLMInput"]() {
        if (this._planConversations.length) return this._planConversations[this._planConversations.length - 1].getLLMInput();
        let _0x5e3c22 = await this.storageAPI.read();
        return StorageSerializer.fromStorage(_0x5e3c22.llmInput);
      }
      async ["handlePlanOutput"](_0xcd3677, _0x2c1426, _0x1ce793) {
        let _0x21151e = false;
        this._isStreaming = false, this._activeConversation ? (await this._activeConversation.handlePlanOutput(_0xcd3677, _0x2c1426), _0x21151e = true) : (this._generatedPlan = _0xcd3677, this.createOutputHandler(), this._queryJSONContent && (await this.setQueryJSONContent(this._queryJSONContent, false))), this.disposeActiveConversation(), _0x1ce793 !== void 0 && (this._isPayAsYouGo = _0x1ce793), await this.upsertToDisk(_0x3af546 => {
          _0x1ce793 !== void 0 && (_0x3af546.isPayAsYouGo = _0x1ce793), _0x21151e || (_0x3af546.logs = this._logs, _0x3af546.llmInput = StorageSerializer.toStorage(_0x2c1426), _0x3af546.generatedPlan = this.mustGetOutputHandler().serializeToStorage());
        });
      }
      async ["handleImplementationPlanDelta"](_0xea925e) {
        this._generatedPlan || (this._generatedPlan = {
          implementationPlan: {
            output: ''
          }
        });
        let _0x2fafa4 = this.mustGetImplementationPlan();
        return _0x2fafa4.output += _0xea925e, this.mustGetOutputHandler().serializeToUI();
      }
      async ["setLLMInput"](_0x17ee03) {
        this._activeConversation ? await this._activeConversation.setLLMInput(_0x17ee03) : await this.upsertToDisk(_0x4a1503 => {
          _0x4a1503.llmInput = StorageSerializer.toStorage(_0x17ee03);
        });
      }
      ['findLogEntry'](_0x6b55d) {
        return this._logs.find(_0x35b990 => _0x35b990.id === _0x6b55d);
      }
      ['updateLog'](_0x253650) {
        if (this._activeConversation) this._activeConversation.updateLog(_0x253650);else {
          let _0x56929b = this.findLogEntry(_0x253650.id);
          _0x56929b ? (_0x56929b.content = _0x253650.content, _0x56929b.childrenThinkings = _0x253650.childrenThinkings, _0x56929b.isCompleted = _0x253650.isCompleted) : this._logs.push(_0x253650);
        }
        return this._logs;
      }
      async ["dispose"]() {
        this._logs = [], this._planConversations = [], this._activeConversation = void 0, this._queryWithMentions = '', this._isExecuted = false, this._isQueryExecutedDirectly = false, this._executedWithAgent = null, this._isPayAsYouGo = false;
      }
      get ["queryWithMentions"]() {
        return this._queryWithMentions;
      }
      get ["planConversations"]() {
        return this._planConversations;
      }
      get ['activeConversation']() {
        return this._activeConversation;
      }
      ['removeActiveConversation']() {
        this._planConversations.pop(), this._activeConversation = void 0;
      }
      async ["startNewConversation"](_0x39ce8d) {
        let _0x2a146e = Ut(),
          _0x2ee92d = async _0x143618 => {
            await this.upsertToDisk(_0x4bfc79 => {
              _0x4bfc79.planConversations.push(_0x143618);
            });
          },
          _0x39c010 = await PlanConversation.createNewInstance(new NP(this.storageAPI).getAdapter(_0x2a146e), _0x39ce8d, null, _0x2ee92d, {
            id: _0x2a146e,
            hasFailed: false,
            isAborted: false,
            isStreaming: true
          });
        return this._activeConversation = _0x39c010, this._planConversations.push(_0x39c010), _0x39c010;
      }
      ["disposeActiveConversation"]() {
        this._activeConversation && (this._activeConversation = void 0);
      }
      get ["mustGetPlanOutput"]() {
        if (!this._generatedPlan) throw new ImplementationPlanNotFoundError();
        return this._generatedPlan;
      }
      ['mustGetReviewOutput']() {
        let _0x2991f7 = this.mustGetOutputHandler();
        if (_0x2991f7 instanceof L_) return _0x2991f7.getReviewOutputProto();
        throw new ll();
      }
      ["mustGetReviewOutputHandler"]() {
        let _0x169f7b = this.mustGetOutputHandler();
        if (_0x169f7b instanceof L_) return _0x169f7b;
        throw new ll();
      }
      ['mustGetImplementationPlan']() {
        let _0x222425 = this.mustGetOutputHandler();
        if (_0x222425 instanceof ImplementationPlanOutput) return _0x222425.getImplementationPlan();
        throw new ImplementationPlanNotFoundError();
      }
      static async ["deserializeFromStorage"](_0x4698f7, _0x4907bf, _0x5aefe5) {
        _0x4698f7.parentPlanID !== void 0 && _0x4698f7.parentPlanID !== null && _0x4907bf !== null && _0x4907bf.id !== _0x4698f7.parentPlanID && Logger.warn("Parent plan mismatch while deserializing plan " + _0x4698f7.id + ". Expected parent " + _0x4698f7.parentPlanID + ", but got " + _0x4907bf.id + '.');
        let _0x43d1b5 = _0x4698f7.planConversations;
        if (_0x43d1b5.length > 0) {
          let _0xd359d3 = _0x43d1b5[_0x43d1b5.length - 1];
          _0xd359d3.userQuery && !_0xd359d3.plan && _0x43d1b5.pop();
        }
        let _0xae3e7b = null;
        _0x4698f7.generatedPlan && (_0xae3e7b = _0x4698f7.generatedPlan);
        let _0x233367 = _0x4698f7.planArtifactType;
        return _0xae3e7b && (_0xae3e7b.reviewOutput ? _0x233367 = An.REVIEW_ARTIFACT : _0x233367 = An.IMPLEMENTATION_ARTIFACT), new _0x41754d(_0x4907bf, _0x5aefe5, _0x233367, _0xae3e7b, _0x4698f7.queryJsonContent, false, _0x4698f7.planSummary, {
          id: _0x4698f7.id,
          planConversations: await Promise.all(_0x43d1b5.map(_0xad4d98 => PlanConversation.deserializeFromStorage(_0xad4d98, new NP(_0x5aefe5).getAdapter(_0xad4d98.id)))),
          isExecuted: _0x4698f7.isExecuted,
          executedWithAgent: _0x4698f7.executedWithAgent ?? void 0,
          isPayAsYouGo: _0x4698f7.isPayAsYouGo,
          hasSentCreationMetrics: _0x4698f7.hasSentCreationMetrics,
          isQueryExecutedDirectly: _0x4698f7.isQueryExecutedDirectly,
          logs: _0x4698f7.logs
        });
      }
      static ['persistedPlanFromPersistedTicketPlan'](_0x3d5a60, _0x2bc432) {
        if (!_0x2bc432.ticketInput) throw new Error("No ticket input found");
        let _0xb7593c = formatVerificationResult(_0x3d5a60).constructJsonQuery(_0x2bc432);
        return {
          id: Ut(),
          queryJsonContent: _0xb7593c,
          logs: _0x2bc432.thinkings,
          planConversations: [],
          llmInput: null,
          isExecuted: false,
          executedWithAgent: null,
          hasSentCreationMetrics: false,
          generatedPlan: {
            implementationPlan: _0x2bc432?.["plan"]?.["implementationPlan"] ?? null,
            reviewOutput: _0x2bc432?.['plan']?.["reviewOutput"] ?? null
          },
          isPayAsYouGo: false,
          parentPlanID: null,
          planArtifactType: An.IMPLEMENTATION_ARTIFACT,
          isQueryExecutedDirectly: false,
          planSummary: void 0
        };
      }
      async ["getMarkdown"]() {
        return this.mustGetImplementationPlan().output;
      }
      async ['resetPlan'](_0x3af10f, _0x3024cd) {
        let {
          userQueryWithMentions: _0x4abaf0
        } = parseUserQueryContent(_0x3af10f, workspace_info.getInstance().getPlatform());
        this._logs = [], this._generatedPlan = null, this._planOutputHandler = null, this._queryWithMentions = _0x4abaf0, this._isQueryExecutedDirectly = false, this._isExecuted = false, this._executedWithAgent = null, await this.setQueryJSONContent(_0x3af10f, false), await Promise.all(this._planConversations.map(_0x488aac => _0x488aac.dispose())), this._planConversations = [], this._activeConversation = void 0, this._planArtifactType = _0x3024cd, await this.upsertToDisk(_0x54c384 => {
          _0x54c384.logs = [], _0x54c384.queryJsonContent = _0x3af10f, _0x54c384.isExecuted = false, _0x54c384.executedWithAgent = null, _0x54c384.planConversations = [], _0x54c384.logs = [], _0x54c384.llmInput = null, _0x54c384.generatedPlan = null, _0x54c384.isQueryExecutedDirectly = false, _0x54c384.planArtifactType = _0x3024cd;
        });
      }
      async ["serializeToUIHeavy"](_0xa24791) {
        return {
          id: this.id,
          queryWithMentions: this.queryWithMentions,
          queryJsonContent: await this.getQueryJSONContent(),
          logs: this._logs,
          generatedPlan: await this.outputHandler?.['serializeToUI'](),
          isActive: _0xa24791 === this.id,
          planConversations: await Promise.all(this._planConversations.map(_0x390eb8 => _0x390eb8.serializeToUIHeavy())),
          isExecuted: this._isExecuted,
          executedWithAgent: this._executedWithAgent,
          isPayAsYouGo: this._isPayAsYouGo,
          planArtifactType: this._planArtifactType,
          isQueryExecutedDirectly: this._isQueryExecutedDirectly
        };
      }
      async ['serializeToPlanWithUserPrompt'](_0x4c1a0e) {
        let _0xfb44e2 = await this.getQueryJSONContent(),
          _0x82adf1 = this.mustGetPlanOutput;
        return {
          userPrompt: await parseAndEnrichUserQuery(_0xfb44e2),
          plan: _0x82adf1,
          identifier: {
            ..._0x4c1a0e,
            planID: this.id
          }
        };
      }
      async ["persistOutput"]() {
        await this.upsertToDisk(_0x436e21 => {
          _0x436e21.generatedPlan = this.mustGetOutputHandler().serializeToStorage();
        });
      }
      async ['upsertToDisk'](_0x312032) {
        return this._planStorageAdapter.runInTransaction(async _0x3c623d => {
          let _0x5a609f = await this.storageAPI.read();
          _0x312032(_0x5a609f), await this._planStorageAdapter.upsert(_0x5a609f, _0x3c623d);
        });
      }
    };
  });
function findPlanStepIndex(_0x4c0fe6, _0x416c62) {
  let _0x595679 = _0x4c0fe6.plans.findIndex(_0x20a46b => _0x20a46b.id === _0x416c62);
  if (_0x595679 === -1) throw new Error('Plan storage API: Plan with id ' + _0x416c62 + ' not found in task.');
  return _0x595679;
}
function getPlanStepById(_0x1114f0, _0x4a9881) {
  let _0xef32c6 = findPlanStepIndex(_0x1114f0, _0x4a9881);
  return _0x1114f0.plans[_0xef32c6];
}
function updatePlanStep(_0x12aaa3, _0x409a93) {
  let _0x2068d5 = findPlanStepIndex(_0x12aaa3, _0x409a93.id);
  _0x12aaa3.plans[_0x2068d5] = _0x409a93;
}
function deletePlanStep(_0x568a37, _0x4aaafe) {
  let _0x43d02f = findPlanStepIndex(_0x568a37, _0x4aaafe);
  _0x568a37.plans.splice(_0x43d02f, 1);
}
var PlanStepStorageAPI = class {
    constructor(_0x4f2dc7) {
      this.taskStorageAPI = _0x4f2dc7;
    }
    async ['read'](_0x5ebb19) {
      let _0x4c7a16 = await this.taskStorageAPI.read();
      return getPlanStepById(_0x4c7a16, _0x5ebb19);
    }
    async ["upsert"](_0x463d91, _0x4f8ff8) {
      let _0x4d6779 = await this.taskStorageAPI.read();
      updatePlanStep(_0x4d6779, _0x463d91), await this.taskStorageAPI.upsert(_0x4d6779, _0x4f8ff8);
    }
    async ["runInTransaction"](_0x3b0dd6) {
      return this.taskStorageAPI.runInTransaction(_0x3b0dd6);
    }
    async ["delete"](_0xf8395, _0xc9bc71) {
      let _0x518d79 = await this.taskStorageAPI.read();
      deletePlanStep(_0x518d79, _0xf8395), await this.taskStorageAPI.upsert(_0x518d79, _0xc9bc71);
    }
    ['getAdapter'](_0x4d353a) {
      return new PlanStepStorageAdapter(this, _0x4d353a);
    }
  },
  PlanStepStorageAdapter = class extends BaseStorage {},
  AnalysisSuggestion,
  initAnalysisSuggestion = __esmModule(() => {
    'use strict';

    AnalysisSuggestion = class _0x115727 {
      constructor(_0x38756a, _0x187745, _0x5b567b, _0x207cc1, _0x2f0a7a, _0xba694e, _0x345b55) {
        this._id = _0x38756a, this._title = _0x187745, this._description = _0x5b567b, this._promptForAIAgent = _0x207cc1, this._referredFiles = _0x2f0a7a, this._severity = _0xba694e, this._isApplied = _0x345b55;
      }
      ["markAsApplied"]() {
        this._isApplied = true;
      }
      ["resetApplied"]() {
        this._isApplied = false;
      }
      static ['createFromProto'](_0xef5059) {
        let _0x49cc06 = Ut(),
          _0x345fd0 = _0xef5059.referredFiles.map(_0x47d16a => TraycerPath.fromPathProto(_0x47d16a));
        return new _0x115727(_0x49cc06, _0xef5059.title, _0xef5059.description, _0xef5059.promptForAIAgent, _0x345fd0, _0xef5059.severity, _0xef5059.isApplied);
      }
      ["serializeToStorage"]() {
        return {
          id: this._id,
          title: this._title,
          description: this._description,
          promptForAIAgent: this._promptForAIAgent,
          referredFiles: this._referredFiles.map(_0x395827 => _0x395827.serializeToStorage()),
          severity: this._severity,
          isApplied: this._isApplied
        };
      }
      static ["deserializeFromStorage"](_0x28a338) {
        let _0x102296 = _0x28a338.referredFiles.map(_0x23d02f => TraycerPath.deserializeFromStorage(_0x23d02f));
        return new _0x115727(_0x28a338.id, _0x28a338.title, _0x28a338.description, _0x28a338.promptForAIAgent, _0x102296, _0x28a338.severity, _0x28a338.isApplied);
      }
      ["serializeToWire"]() {
        return {
          title: this._title,
          description: this._description,
          promptForAIAgent: this._promptForAIAgent,
          referredFiles: this._referredFiles.map(_0x4f2685 => _0x4f2685.serializeToWire()),
          severity: this._severity,
          isApplied: this._isApplied
        };
      }
      ['serializeToUI'](_0x24bd32) {
        return {
          id: this._id,
          title: this._title,
          description: this._description,
          promptForAIAgent: this._promptForAIAgent,
          referredFiles: this._referredFiles.map(_0x5c3723 => _0x5c3723.serializeToWire()),
          severity: this._severity,
          isApplied: this._isApplied,
          status: _0x24bd32
        };
      }
      get ['id']() {
        return this._id;
      }
      get ["title"]() {
        return this._title;
      }
      get ["description"]() {
        return this._description;
      }
      get ['promptForAIAgent']() {
        return ('\x0a' + this._promptForAIAgent + "\n\n### Referred Files\n" + this._referredFiles.map(_0x5bfc1f => '- ' + _0x5bfc1f.absPath).join('\x0a')).trimEnd();
      }
      get ['referredFiles']() {
        return this._referredFiles;
      }
      get ['isApplied']() {
        return this._isApplied;
      }
      get ['severity']() {
        return this._severity;
      }
    };
  }),
  SuggestionThread,
  initSuggestionThread = __esmModule(() => {
    'use strict';

    initAnalysisSuggestion(), SuggestionThread = class _0xeecd8e {
      constructor(_0x1dab4c, _0x2a872c, _0x688c5d) {
        this._id = _0x1dab4c, this._comments = _0x2a872c, this._status = _0x688c5d;
      }
      get ['id']() {
        return this._id;
      }
      get ['comments']() {
        return this._comments;
      }
      get ["status"]() {
        return this._status;
      }
      ["addComment"](_0x1ce67f) {
        this._comments.push(_0x1ce67f);
      }
      ["updateStatus"](_0x56f0a4) {
        this._status = _0x56f0a4;
      }
      ['serializeToStorage']() {
        return {
          id: this._id,
          comments: this._comments.map(_0x10eb40 => _0x10eb40.serializeToStorage()),
          status: this._status
        };
      }
      ['serializeToWire']() {
        return {
          id: this._id,
          comments: this._comments.map(_0xebdefb => _0xebdefb.serializeToWire()),
          status: this._status
        };
      }
      static ['createFromProto'](_0xe6b247) {
        return new _0xeecd8e(Ut(), [AnalysisSuggestion.createFromProto(_0xe6b247)], Ad.UNRESOLVED);
      }
      static ['deserializeFromStorage'](_0x347948) {
        let _0x8ea9f8 = _0x347948.comments.map(_0x4bd3cb => AnalysisSuggestion.deserializeFromStorage(_0x4bd3cb));
        return new _0xeecd8e(_0x347948.id, _0x8ea9f8, _0x347948.status);
      }
    };
  }),
  VerificationOutput,
  initVerificationOutput = __esmModule(() => {
    'use strict';

    initStatusBar(), initAnalysisSuggestion(), initSuggestionThread(), VerificationOutput = class _0x372073 {
      constructor(_0x35f48b, _0x58c626) {
        this._markdown = _0x35f48b, this._threads = _0x58c626;
      }
      get ["markdown"]() {
        return this._markdown;
      }
      get ['threads']() {
        return this._threads;
      }
      set ['markdown'](_0x24964) {
        this._markdown = _0x24964;
      }
      get ["allComments"]() {
        let _0x365d2e = [];
        for (let key of this.threads) for (let [_0x4972b4, _0x2ea465] of key.comments.entries()) _0x4972b4 === key.comments.length - 1 ? _0x365d2e.push({
          comment: _0x2ea465,
          status: key.status
        }) : _0x365d2e.push({
          comment: _0x2ea465,
          status: _0x2ea465.isApplied ? Ad.RESOLVED : Ad.OUTDATED
        });
        return _0x365d2e;
      }
      get ['latestComments']() {
        let _0x2ce419 = [];
        for (let key of this.threads) {
          let _0x14928c = key.comments[key.comments.length - 1];
          _0x14928c && _0x2ce419.push({
            comment: _0x14928c,
            status: key.status
          });
        }
        return _0x2ce419;
      }
      async ['getVerificationFiles']() {
        let _0x14209b = [];
        for (let {
          comment: _0x4e5e63
        } of this.latestComments) for (let key of _0x4e5e63.referredFiles) _0x14209b.push(key);
        let {
          fileContents: _0x58e6bd,
          failedPaths: _0x134bfc
        } = await readFilesWithSummary(_0x14209b, 'fileContent');
        return _0x134bfc.length > 0 && Logger.debug("Failed to get verification files for " + _0x134bfc.map(_0x57089c => _0x57089c.absPath).join(', ')), _0x58e6bd;
      }
      ['deleteThread'](_0x560a8c) {
        let _0x42ad60 = this._threads.findIndex(_0x5b5cad => _0x5b5cad.id === _0x560a8c);
        _0x42ad60 !== -1 ? this._threads.splice(_0x42ad60, 1) : Logger.warn('Verification thread with ID ' + _0x560a8c + ' not found, while deleting thread');
      }
      ['findCommentById'](_0xfd017) {
        let _0x1d37da = this.allComments.find(_0x2de66e => _0x2de66e.comment.id === _0xfd017);
        if (!_0x1d37da) throw new Error("Verification comment not found: " + _0xfd017);
        return _0x1d37da.comment;
      }
      ['serializeToStorage']() {
        return {
          markdown: this._markdown,
          threads: this._threads.map(_0xe030ad => _0xe030ad.serializeToStorage())
        };
      }
      static ["deserializeFromStorage"](_0x5cf002) {
        let _0x10b74b = _0x5cf002.threads.map(_0xd030f1 => SuggestionThread.deserializeFromStorage(_0xd030f1));
        return new _0x372073(_0x5cf002.markdown, _0x10b74b);
      }
      ['serializeToUI']() {
        return {
          markdown: this._markdown,
          comments: this.allComments.map(_0x3ea610 => _0x3ea610.comment.serializeToUI(_0x3ea610.status))
        };
      }
      static ["createFromProto"](_0x3d2e35) {
        let _0x16afe7 = _0x3d2e35.comments.map(_0x5c32f6 => SuggestionThread.createFromProto(_0x5c32f6));
        return new _0x372073(_0x3d2e35.markdown, _0x16afe7);
      }
      ['handleReVerificationResponse'](_0x25ea2b) {
        for (let key of _0x25ea2b.updates) {
          let _0xcf664e = this._threads.find(_0xa74c54 => _0xa74c54.id === key.verificationThreadID);
          if (!_0xcf664e) {
            Logger.warn('Verification thread not found: ' + key.verificationThreadID);
            continue;
          }
          key.newComment ? _0xcf664e.addComment(AnalysisSuggestion.createFromProto(key.newComment)) : key.statusUpdate && _0xcf664e.updateStatus(key.statusUpdate);
        }
        this.markdown = _0x25ea2b.markdown;
      }
    };
  }),
  NoVerificationCommentsToExecuteError = class extends Error {
    constructor(_0x17042f) {
      super(_0x17042f), this.name = "NoVerificationCommentsToExecuteError";
    }
  },
  VP,
  initTaskPlanDeps = __esmModule(() => {
    'use strict';

    initIDEAgentManager(), initTemplateManager(), initTaskContext(), initVerificationOutput(), VP = class _0x16402e {
      constructor(_0x2f462a, _0x50e47, _0xce1cc7 = false, _0x2ee32f, _0x3ca8b2, _0x171ef4) {
        this._verificationOutput = _0x2f462a, this._verificationStorageAPI = _0x50e47, this._isPayAsYouGo = _0xce1cc7, this._logs = _0x2ee32f, this._id = _0x3ca8b2, this._reverificationState = _0x171ef4;
      }
      static async ['createNewInstance'](_0x1b3ec0, _0x2d8711, _0xf32295, _0x3419fc, _0x3e9944) {
        let _0x4d4279 = new _0x16402e(null, _0x1b3ec0, _0x2d8711, _0xf32295, _0x3419fc, null);
        return await _0x3e9944({
          id: _0x4d4279.id,
          verificationOutput: null,
          isPayAsYouGo: _0x4d4279._isPayAsYouGo,
          logs: [],
          reverificationState: null
        }), _0x4d4279;
      }
      get ['id']() {
        return this._id;
      }
      get ['verificationOutput']() {
        if (!this._verificationOutput) throw new Error("Verification response not found");
        return this._verificationOutput;
      }
      get ['reverificationState']() {
        return this._reverificationState;
      }
      async ["triggerExecuteInIDE"](_0x21bc55, _0x3f04a6, _0x350c67, _0x39b962, _0x2a85c6, _0x50d4e5) {
        if (_0x3f04a6.length === 0) throw new Error('No verification comment IDs provided');
        let _0x5828fd = this.dedupeIds(_0x3f04a6);
        await this.executeBatchVerificationComments(_0x21bc55, _0x5828fd, _0x350c67, _0x39b962, _0x2a85c6, _0x50d4e5);
      }
      async ["executeBatchVerificationComments"](_0x4230b4, _0x4dc2c8, _0x5a7bfc, _0x2ef162, _0x58b843, _0x21744e) {
        let _0x7241b0 = _0x4dc2c8.map(_0x23cd69 => this.verificationOutput.findCommentById(_0x23cd69));
        await this.executeCombinedVerificationComments(_0x4230b4, _0x7241b0, _0x5a7bfc, _0x2ef162, _0x58b843, _0x21744e);
      }
      ["buildCombinedContentFromComments"](_0x39f4fe) {
        let _0x1e5a41 = '';
        return _0x39f4fe.forEach((_0x2cd3cf, _0x43adf5) => {
          _0x1e5a41 += "## Comment " + (_0x43adf5 + 1) + ': ' + _0x2cd3cf.title + '\x0a', _0x1e5a41 += _0x2cd3cf.promptForAIAgent + '\x0a', _0x43adf5 <= _0x39f4fe.length - 1 && (_0x1e5a41 += '---\x0a');
        }), _0x1e5a41.trimEnd();
      }
      async ["executeCombinedVerificationComments"](_0x4b397b, _0x5a6603, _0x39ef04, _0x36ac1e, _0x300f64, _0x284412) {
        if (_0x5a6603.length === 0) throw new NoVerificationCommentsToExecuteError('No verification comments to execute');
        let _0x3453bf = this.buildCombinedContentFromComments(_0x5a6603),
          _0x2f76f6 = "Verification : " + _0x4b397b,
          _0x3b241e = await br.getInstance().getPromptTemplate(_0x36ac1e).applyTemplate('---\x0a' + _0x3453bf);
        _0x284412 && (_0x3b241e += '\x0a\x0a' + _0x284412), await debounce(_0x3b241e, _0x2f76f6, _0x39ef04, _0x300f64), _0x5a6603.forEach(_0x5dcf39 => _0x5dcf39.markAsApplied()), await this.persistVerificationOutput(this.verificationOutput), await Vt.getInstance().setLastUsedIDEAgents("verification", _0x39ef04);
      }
      async ['persistVerificationOutput'](_0x3995a8) {
        await this.upsertToDisk(_0x45aca7 => {
          _0x45aca7.verificationOutput = _0x3995a8.serializeToStorage();
        });
      }
      ["dedupeIds"](_0x46fa63) {
        let _0x38e41e = {},
          _0x365d49 = [];
        for (let key of _0x46fa63) _0x38e41e[key] || (_0x38e41e[key] = true, _0x365d49.push(key));
        return _0x365d49;
      }
      async ['executeAllVerificationCommentsInIDE'](_0x4bcc06, _0x3e5e7b, _0x4cb090, _0x2b0a05, _0xf30773, _0x643eba) {
        let _0x17c4d3 = this.verificationOutput,
          _0x4f1df9;
        if (_0x4f1df9 = _0x17c4d3.allComments.filter(_0x46582b => !_0x46582b.comment.isApplied), _0x4f1df9.length === 0) throw new NoVerificationCommentsToExecuteError("No verification comments to execute");
        if (_0x643eba === 'AllExceptOutdated' ? _0x4f1df9 = _0x4f1df9.filter(_0x28bbd1 => _0x28bbd1.status === Ad.UNRESOLVED) : _0x643eba === "Outdated" ? _0x4f1df9 = _0x4f1df9.filter(_0x52da64 => _0x52da64.status !== Ad.UNRESOLVED) : Array.isArray(_0x643eba) && _0x643eba.length > 0 && (_0x4f1df9 = _0x4f1df9.filter(_0x5752a8 => _0x643eba.includes(_0x5752a8.comment.severity) && _0x5752a8.status === Ad.UNRESOLVED)), _0x4f1df9.length === 0) throw new NoVerificationCommentsToExecuteError("No unapplied verification comments to execute");
        let _0x818209 = _0x4f1df9.map(_0x12d29 => _0x12d29.comment);
        await this.executeCombinedVerificationComments(_0x4bcc06, _0x818209, _0x3e5e7b, _0x4cb090, _0x2b0a05, _0xf30773);
      }
      async ['upsertToDisk'](_0x30d341) {
        return this.storageAPI.runInTransaction(async _0x1a035f => {
          let _0x122e5f = await this.storageAPI.read();
          _0x30d341(_0x122e5f), await this.storageAPI.upsert(_0x122e5f, _0x1a035f);
        });
      }
      async ['discardVerificationComment'](_0x283bc7) {
        let _0x25da50 = [];
        for (let _0xa2589d of _0x283bc7) for (let key of this.verificationOutput.threads) {
          let _0x45e098 = key.comments.find(_0x4d42ee => _0x4d42ee.id === _0xa2589d);
          if (_0x45e098) {
            _0x25da50.push(_0x45e098), this.verificationOutput.deleteThread(key.id);
            break;
          }
        }
        return await this.upsertToDisk(_0x3fe455 => {
          _0x3fe455.verificationOutput = this.verificationOutput.serializeToStorage();
        }), _0x25da50;
      }
      async ['toggleVerificationCommentsApplied'](_0x5e7521, _0x28a304) {
        for (let key of _0x5e7521) {
          let _0x5a79d0 = this.verificationOutput.findCommentById(key);
          _0x28a304 ? _0x5a79d0.markAsApplied() : _0x5a79d0.resetApplied();
        }
        await this.upsertToDisk(_0x1e672f => {
          _0x1e672f.verificationOutput = this.verificationOutput.serializeToStorage();
        });
      }
      async ["handleVerificationResponse"](_0x397fee) {
        if (!_0x397fee.output) throw new Error("Verification response is null");
        let _0x27dd65 = VerificationOutput.createFromProto(_0x397fee.output);
        this._verificationOutput = _0x27dd65, this._isPayAsYouGo = _0x397fee.isPayToRun, await this.upsertToDisk(_0x186dfe => {
          _0x186dfe.verificationOutput = _0x27dd65.serializeToStorage(), _0x186dfe.isPayAsYouGo = this._isPayAsYouGo, _0x186dfe.logs = this._logs;
        });
      }
      async ['handleReVerificationResponse'](_0x5dd6a9) {
        let _0x3ee6da = this.verificationOutput;
        this._reverificationState = null, _0x3ee6da.handleReVerificationResponse(_0x5dd6a9), await this.upsertToDisk(_0x323129 => {
          _0x323129.verificationOutput = _0x3ee6da.serializeToStorage(), _0x323129.reverificationState = null;
        });
      }
      async ["setReverificationState"](_0x47b2d3) {
        this._reverificationState = _0x47b2d3, await this.upsertToDisk(_0x5a3d9e => {
          _0x5a3d9e.reverificationState = _0x47b2d3;
        });
      }
      get ['storageAPI']() {
        return this._verificationStorageAPI;
      }
      get ["isPayAsYouGo"]() {
        return this._isPayAsYouGo;
      }
      get ["logs"]() {
        return [...this._logs];
      }
      async ['setLogs'](_0xc6aca) {
        this._logs = _0xc6aca, await this.upsertToDisk(_0x6e4ab8 => {
          _0x6e4ab8.logs = _0xc6aca;
        });
      }
      async ['setPayAsYouGo'](_0x583b82) {
        this._isPayAsYouGo = _0x583b82, await this.upsertToDisk(_0x1c2a81 => {
          _0x1c2a81.isPayAsYouGo = _0x583b82;
        });
      }
      ["updateLog"](_0x438fc0) {
        let _0x53bd61 = this.findLogEntry(_0x438fc0.id);
        return _0x53bd61 ? (_0x53bd61.content = _0x438fc0.content, _0x53bd61.childrenThinkings = _0x438fc0.childrenThinkings, _0x53bd61.isCompleted = _0x438fc0.isCompleted) : this._logs.push(_0x438fc0), this._logs;
      }
      async ["clearLogs"]() {
        this._logs = [], await this.upsertToDisk(_0x36ff8f => {
          _0x36ff8f.logs = [];
        });
      }
      ["findLogEntry"](_0x250df0) {
        return this._logs.find(_0x54105d => _0x54105d.id === _0x250df0);
      }
      async ["serializeToUI"]() {
        return {
          id: this._id,
          verificationOutput: this._verificationOutput ? this._verificationOutput.serializeToUI() : null,
          logs: this._logs,
          isPayAsYouGo: this._isPayAsYouGo,
          reverificationState: this._reverificationState
        };
      }
      static ["deserializeFromStorage"](_0x36d683, _0x5451ce) {
        let _0x4afec9 = null;
        return _0x36d683.verificationOutput && (_0x4afec9 = VerificationOutput.deserializeFromStorage(_0x36d683.verificationOutput)), new _0x16402e(_0x4afec9, _0x5451ce, _0x36d683.isPayAsYouGo, _0x36d683.logs, _0x36d683.id, _0x36d683.reverificationState);
      }
    };
  });
function getTaskCount(_0x41488b) {
  if (!_0x41488b.verification) throw new Error("Verification not found in task");
  return _0x41488b.verification;
}
function getCompletedTaskCount(_0x3a8837, _0x215243) {
  _0x3a8837.verification = _0x215243;
}
function getPendingTaskCount(_0x1c3c11) {
  _0x1c3c11.verification = null;
}
var TaskCountStorageAPI = class {
    constructor(_0x5693bc) {
      this.taskStorageAPI = _0x5693bc;
    }
    async ["read"]() {
      let _0x3d6e1e = await this.taskStorageAPI.read();
      return getTaskCount(_0x3d6e1e);
    }
    async ['runInTransaction'](_0xb7e670) {
      return this.taskStorageAPI.runInTransaction(_0xb7e670);
    }
    async ['upsert'](_0x4ea6f9, _0x5ae96) {
      let _0x31d059 = await this.taskStorageAPI.read();
      getCompletedTaskCount(_0x31d059, _0x4ea6f9), await this.taskStorageAPI.upsert(_0x31d059, _0x5ae96);
    }
    async ['delete'](_0x3cc4a1) {
      let _0x29e07c = await this.taskStorageAPI.read();
      getPendingTaskCount(_0x29e07c), await this.taskStorageAPI.upsert(_0x29e07c, _0x3cc4a1);
    }
    ["getAdapter"](_0x3a7828) {
      return new TaskCountStorageAdapter(this, _0x3a7828);
    }
  },
  TaskCountStorageAdapter = class extends BaseStorage {},
  qa,
  initTaskPlan = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initPlanContextModule(), initTaskExecution(), initStatusBar(), initTaskPlanDeps(), initAnalysisSuggestion(), qa = class _0x46545e {
      constructor(_0x103932) {
        this._hasSentCreationMetrics = false, this._abortController = _0x103932.abortController, this._id = _0x103932.id, this._activePlanId = _0x103932.activePlanID, this._title = _0x103932.title, this._creationTime = _0x103932.creationTime, this._lastUpdatedTime = _0x103932.lastUpdatedTime, this._steps = _0x103932.steps, this._plans = _0x103932.plans, this._verification = _0x103932.verification, this._attachmentSummaries = _0x103932.attachmentSummaries, this._storageAPI = _0x103932.storageAPI, this._discardedVerificationComments = _0x103932.discardedVerificationComments, this._retryAfterTimestamp = _0x103932.retryAfterTimestamp;
      }
      async ['sendCreationMetrics'](_0x561e66, _0x130f8f) {
        try {
          this._hasSentCreationMetrics || (_0x561e66.increment('task_creation', _0x130f8f), await this.upsertToDisk(_0x2bfa45 => {
            _0x2bfa45.hasSentCreationMetrics = true;
          }), this._hasSentCreationMetrics = true);
        } catch (_0x361998) {
          Logger.warn("Failed to send creation metrics for task " + this.id, _0x361998);
        }
      }
      static async ["convertPathsToJSONContentMentions"](_0x22eba1, _0x1bbe10) {
        let _0x1fef60 = [],
          _0x5a85fc = _0x3b69a1 => {
            _0x1fef60.push({
              type: 'paragraph',
              content: [{
                type: "text",
                text: '\x0a' + _0x3b69a1
              }]
            });
          },
          _0x14406a = async _0x15b2ce => {
            let _0x36fb1d = TraycerPath.fromPathProto(_0x15b2ce);
            _0x1fef60.push({
              type: 'paragraph',
              content: [{
                type: 'text',
                text: '- '
              }, {
                type: "mention",
                attrs: {
                  id: _0x36fb1d.absPath,
                  label: _0x36fb1d.name,
                  contextType: _0x36fb1d.isDirectory ? "folder" : "file",
                  absolutePath: _0x36fb1d.absPath,
                  isDirectory: _0x36fb1d.isDirectory
                }
              }]
            });
          };
        return _0x22eba1.length && (_0x5a85fc("Relevant Files:"), await Promise.all(_0x22eba1.map(_0x14406a))), _0x1bbe10.length && (_0x5a85fc('Relevant Folders:'), _0x1bbe10.forEach(_0xd72e73 => {
          _0x14406a(_0xd72e73);
        })), _0x1fef60;
      }
      static async ['fromPhaseOutput'](_0x3169c6, _0x55bd47, _0x40e6c2, _0x1a2bc0, _0x10cc67) {
        let _0x6226c9 = _0x1a2bc0.getAdapter(_0x55bd47),
          _0xd0da3d = {
            id: _0x55bd47,
            activePlanID: _0x40e6c2,
            title: _0x3169c6.title,
            creationTime: Date.now(),
            lastUpdatedTime: Date.now(),
            steps: {
              userQuery: pe.COMPLETED,
              planGeneration: pe.NOT_STARTED,
              verification: pe.NOT_STARTED
            },
            plans: [],
            verification: null,
            attachmentSummaries: [],
            storageAPI: _0x6226c9,
            abortController: new AbortController(),
            discardedVerificationComments: [],
            upsertToDisk: _0x10cc67
          };
        return _0x46545e.createNewInstance(_0xd0da3d);
      }
      static async ["createNewInstance"](_0x1d89fa) {
        let _0x6dadf = new _0x46545e(_0x1d89fa);
        return await _0x1d89fa.upsertToDisk({
          activePlanId: _0x1d89fa.activePlanID,
          attachmentSummaries: [],
          id: _0x6dadf.id,
          title: _0x6dadf.title,
          verification: null,
          steps: _0x6dadf.steps,
          plans: [],
          creationTime: _0x6dadf.creationTimestamp,
          lastUpdated: _0x6dadf.lastUpdatedTime,
          hasSentCreationMetrics: false,
          discardedVerificationComments: [],
          isReferred: false,
          failedPlanIterationQuery: void 0
        }), _0x6dadf;
      }
      get ["storageAPI"]() {
        return this._storageAPI;
      }
      get ["creationTimestamp"]() {
        return this._creationTime;
      }
      get ["abortController"]() {
        return this._abortController;
      }
      set ['abortController'](_0x1f580d) {
        this._abortController = _0x1f580d;
      }
      get ['retryAfterTimestamp']() {
        return this._retryAfterTimestamp;
      }
      get ['attachmentSummaries']() {
        return this._attachmentSummaries;
      }
      get ['id']() {
        return this._id;
      }
      get ['lastUpdatedTime']() {
        return this._lastUpdatedTime;
      }
      get ['activePlan']() {
        let _0x53781a = this.getPlanIfExists(this.activePlanId);
        if (!_0x53781a) throw new ActivePlanNotFoundError("Plan with id " + this.activePlanId + " not found");
        return _0x53781a;
      }
      get ["hasActivePlan"]() {
        return this._activePlanId !== null;
      }
      get ["activePlanId"]() {
        if (!this._activePlanId) throw new ActivePlanNotFoundError('No plan is marked as active');
        if (!this.getPlanIfExists(this._activePlanId)) throw new ActivePlanNotFoundError("Plan with id " + this._activePlanId + ' not found. Current plan IDs: ' + this.plans.map(_0x29bc67 => _0x29bc67.id).join(', '));
        return this._activePlanId;
      }
      get ['plans']() {
        if (this._plans === void 0) throw new Error('Plans are not initialized');
        return this._plans;
      }
      get ["title"]() {
        return this._title || '';
      }
      get ["steps"]() {
        return this._steps;
      }
      async ["removePlan"](_0x48e375) {
        let _0x3f6eab = this.getPlanIfExists(_0x48e375);
        _0x3f6eab && (await _0x3f6eab.dispose()), this._plans = this._plans.filter(_0x2c51a0 => _0x2c51a0.id !== _0x48e375), await this.upsertToDisk(_0x580f98 => {
          _0x580f98.plans = _0x580f98.plans.filter(_0xb1cb3e => _0xb1cb3e.id !== _0x48e375);
        });
      }
      async ["updateSummaries"](_0x59f250, _0x4237d3, _0x159682) {
        this._attachmentSummaries = _0x4237d3;
        let _0x5743e9 = this.getPlanIfExists(_0x59f250.planID);
        _0x5743e9 === void 0 ? Logger.error('Couldn\x27t find the plan to update the plan summary for. Has the state on the extension changed wrt expectation from the server.') : await _0x5743e9.setPlanSummary(_0x159682), await this.upsertToDisk(_0x251d37 => {
          _0x251d37.attachmentSummaries = this._attachmentSummaries.map(_0x320c15 => ({
            fileAttachmentSummary: {
              fileName: _0x320c15.fileAttachmentSummary?.["fileName"] ?? '',
              summary: _0x320c15.fileAttachmentSummary?.['summary'] ?? ''
            }
          })), _0x251d37.plans = _0x251d37.plans.map(_0x4381c1 => _0x4381c1.id === _0x59f250.planID ? {
            ..._0x4381c1,
            planSummary: _0x159682
          } : _0x4381c1);
        });
      }
      async ['updateTaskTitle'](_0x3f3331) {
        this._title = _0x3f3331, await this.upsertToDisk(_0x3380f6 => {
          _0x3380f6.title = _0x3f3331;
        });
      }
      async ['resetTask'](_0x22f33b, _0x1a5190) {
        this.isInProgress() && (await this.abortTask(false)), this.plans.forEach(_0x9a03ee => _0x9a03ee.dispose());
        let _0x1e0a8a = this.plans.find(_0x14d4e6 => _0x14d4e6.id === _0x22f33b.planID);
        if (!_0x1e0a8a) throw new ActivePlanNotFoundError('Plan with id ' + _0x22f33b.planID + " not found");
        this._steps = {
          userQuery: pe.COMPLETED,
          planGeneration: pe.NOT_STARTED,
          verification: pe.NOT_STARTED
        }, this._activePlanId = _0x22f33b.planID, this._verification = null, await this.upsertToDisk(_0x2a8e8 => {
          _0x2a8e8.plans = [{
            isPayAsYouGo: false,
            id: _0x22f33b.planID,
            logs: [],
            planConversations: [],
            queryJsonContent: _0x1a5190,
            generatedPlan: null,
            planArtifactType: _0x1e0a8a.planArtifactType,
            isExecuted: false,
            executedWithAgent: null,
            hasSentCreationMetrics: _0x1e0a8a.hasSentCreationMetrics,
            llmInput: null,
            parentPlanID: null,
            isQueryExecutedDirectly: false,
            planSummary: void 0
          }], _0x2a8e8.steps = this._steps, _0x2a8e8.verification = null, _0x2a8e8.activePlanId = _0x22f33b.planID;
        });
      }
      async ["markPlanAsActive"](_0x37571e, _0x39b207) {
        this._activePlanId = _0x37571e, _0x39b207 && (await this.upsertToDisk(_0x93a698 => {
          _0x93a698.activePlanId = _0x37571e;
        }));
      }
      async ["upsertToDisk"](_0xf561a9) {
        this._lastUpdatedTime = Date.now(), await this.storageAPI.runInTransaction(async _0xb7deaa => {
          let _0x2c08ea = await this.storageAPI.read();
          _0xf561a9(_0x2c08ea), _0x2c08ea.lastUpdated = Date.now(), await this.storageAPI.upsert(_0x2c08ea, _0xb7deaa);
        });
      }
      ["updatePlanLog"](_0x1be782, _0x54fa83) {
        return this.getPlan(_0x1be782.planID).updateLog(_0x54fa83);
      }
      ["updateVerificationLog"](_0x2a853c) {
        if (!this.verification) throw new Error("Verification is not found");
        return this.verification.updateLog(_0x2a853c);
      }
      async ["dispose"]() {
        this._abortController.abort();
      }
      ["getPlan"](_0x561998) {
        let _0x3daf8d = this.getPlanIfExists(_0x561998);
        if (!_0x3daf8d) throw new Error('Plan with id ' + _0x561998 + ' not found');
        return _0x3daf8d;
      }
      async ['startNewPlanConversation'](_0x3174e7, _0x12ece5) {
        await this.getPlan(_0x3174e7).startNewConversation(_0x12ece5);
      }
      ['getPlanIfExists'](_0x2cf7b1) {
        return this.plans.find(_0x49296d => _0x49296d.id === _0x2cf7b1);
      }
      async ['serializeToUIHeavy'](_0x147083) {
        return {
          id: this.id,
          title: this.title,
          steps: this.steps,
          timestamp: this._creationTime,
          plans: await Promise.all(this.plans.map(_0x49dbf9 => _0x49dbf9.serializeToUIHeavy(this.activePlanId))),
          isActive: _0x147083 === this.id,
          lastUpdated: this.lastUpdatedTime,
          isPendingPlanChat: this.pendingPlanChat !== void 0,
          verification: this.verification ? await this.verification.serializeToUI() : null,
          failedPlanIterationQuery: this.failedPlanIterationQuery ?? void 0,
          isCompleted: this.isAllStepsCompleted()
        };
      }
      async ["serializeToLivePhase"]() {
        let _0x3cee03 = await this.getInitialUserQueryJSONContent(),
          {
            userQueryWithMentions: _0xd7823,
            sourceContext: _0xee7e72
          } = parseUserQueryContent(_0x3cee03, workspace_info.getInstance().getPlatform());
        return {
          phase: {
            id: this.id,
            title: this.title,
            query: _0xd7823,
            referredFiles: _0xee7e72.files?.["map"](_0xe2ac7d => _0xe2ac7d.path)['filter'](_0x689fe1 => _0x689fe1 !== null),
            referredFolders: _0xee7e72.directories?.['map'](_0x39d4fa => _0x39d4fa.path)["filter"](_0x1fafbe => _0x1fafbe !== null),
            status: jm.NEW_PHASE,
            reasoning: '',
            phaseSize: $c.ISSUE,
            planArtifactType: this.activePlan.planArtifactType
          },
          taskSteps: this.steps
        };
      }
      async ['serializeToTaskProto'](_0x11ca80) {
        let {
            userQuery: _0x480fac,
            sourceContext: _0x1ee0b1,
            attachments: _0x70fddd,
            githubTicketRef: _0x1944ad,
            gitMentions: _0x541b66
          } = parseUserQueryContent(await this.activePlan.getQueryJSONContent(), workspace_info.getInstance().getPlatform()),
          _0x5350b9 = await resolveGitMentions(_0x541b66),
          _0x22822e = this.steps.planGeneration === pe.IN_PROGRESS ? Id.TASK_IN_PROGRESS : this.steps.planGeneration === pe.COMPLETED || this.steps.planGeneration === pe.WAITING_FOR_EXECUTION || this.steps.planGeneration === pe.SKIPPED ? Id.TASK_COMPLETED : Id.TASK_NOT_STARTED;
        return {
          title: this.title,
          taskID: this.id,
          activePlan: {
            plan: _0x22822e === Id.TASK_COMPLETED && !this.activePlan.isQueryExecutedDirectly ? {
              implementationPlan: this.activePlan.planArtifactType === An.IMPLEMENTATION_ARTIFACT ? this.activePlan.mustGetImplementationPlan() : null,
              reviewOutput: this.activePlan.planArtifactType === An.REVIEW_ARTIFACT ? this.activePlan.mustGetReviewOutput() : null
            } : null,
            userPrompt: {
              query: _0x480fac,
              context: {
                ..._0x1ee0b1,
                ticketReference: {
                  github: _0x1944ad
                },
                attachments: _0x70fddd,
                gitDiffs: _0x5350b9
              }
            },
            identifier: {
              phaseBreakdownIdentifier: _0x11ca80,
              taskID: this.id,
              planID: this.activePlan.id
            }
          },
          parentPlans: _0x22822e === Id.TASK_COMPLETED ? await this.serializeParentPlans(this.activePlan, _0x11ca80) : [],
          state: this.steps.planGeneration === pe.IN_PROGRESS ? Id.TASK_IN_PROGRESS : this.steps.planGeneration === pe.COMPLETED || this.steps.planGeneration === pe.SKIPPED || this.steps.planGeneration === pe.WAITING_FOR_EXECUTION ? Id.TASK_COMPLETED : Id.TASK_NOT_STARTED,
          attachmentSummaries: this._attachmentSummaries
        };
      }
      async ['serializeParentPlans'](_0x21b151, _0x49a045) {
        if (!_0x21b151.parentPlan) return [];
        let _0x2c963f = await _0x21b151.parentPlan.serializeToPlanWithUserPrompt({
          phaseBreakdownIdentifier: _0x49a045,
          taskID: this.id
        });
        return [...(await this.serializeParentPlans(_0x21b151.parentPlan, _0x49a045)), _0x2c963f];
      }
      static ["updatePersistedTaskSteps"](_0x82edad) {
        let _0x44ce9f = [pe.IN_PROGRESS, pe.ABORTING, pe.WAITING_FOR_EXECUTION];
        if (_0x44ce9f.includes(_0x82edad.steps.verification)) _0x82edad.verification?.['verificationOutput'] ? _0x82edad.steps.verification = pe.COMPLETED : _0x82edad.steps.verification = pe.NOT_STARTED;else {
          if (_0x44ce9f.includes(_0x82edad.steps.planGeneration)) {
            if (_0x82edad.plans?.["length"] && _0x82edad.plans.length > 1) {
              let _0x255d10 = _0x82edad.plans.find(_0x35e172 => _0x35e172.id === _0x82edad.activePlanId);
              if (!_0x255d10) throw new ActivePlanNotFoundError("Plan with id " + _0x82edad.activePlanId + " not found while deserializing task from storage.");
              _0x255d10.generatedPlan ? _0x255d10.planConversations.length && (_0x255d10.planConversations[_0x255d10.planConversations.length - 1].plan || _0x255d10.planConversations.pop()) : _0x82edad.plans = _0x82edad.plans.filter(_0x252604 => _0x252604.id !== _0x255d10.id), _0x82edad.steps.planGeneration = pe.COMPLETED;
            } else _0x82edad.steps.planGeneration = pe.NOT_STARTED;
            _0x82edad.steps.verification = pe.NOT_STARTED;
          } else _0x44ce9f.includes(_0x82edad.steps.userQuery) && (_0x82edad.steps.userQuery = pe.NOT_STARTED, _0x82edad.steps.planGeneration = pe.NOT_STARTED, _0x82edad.steps.verification = pe.NOT_STARTED);
        }
      }
      async ['resetReverificationState']() {
        this._verification && (await this._verification.setReverificationState(null), await this.setStepState("verification", pe.COMPLETED));
      }
      static async ['deserializeFromStorage'](_0x40ce26, _0x1921f5) {
        this.updatePersistedTaskSteps(_0x40ce26);
        let _0x2c7079 = _0x40ce26.attachmentSummaries.map(_0x2806f0 => ({
            fileAttachmentSummary: {
              fileName: _0x2806f0.fileAttachmentSummary?.["fileName"] ?? '',
              summary: _0x2806f0.fileAttachmentSummary?.["summary"] ?? ''
            }
          })),
          _0xc7d2ea = _0x40ce26.discardedVerificationComments.map(_0x32cd74 => AnalysisSuggestion.deserializeFromStorage(_0x32cd74)),
          _0x33a44a = new _0x46545e({
            id: _0x40ce26.id,
            title: _0x40ce26.title || '',
            creationTime: _0x40ce26.creationTime,
            lastUpdatedTime: _0x40ce26.lastUpdated,
            activePlanID: _0x40ce26.activePlanId,
            steps: _0x40ce26.steps,
            plans: [],
            verification: null,
            attachmentSummaries: _0x2c7079,
            storageAPI: _0x1921f5,
            abortController: new AbortController(),
            discardedVerificationComments: _0xc7d2ea,
            retryAfterTimestamp: _0x40ce26.retryAfterTimestamp
          }),
          _0x28be50 = [];
        for (let key of _0x40ce26.plans ?? []) {
          let _0x39f878 = key.parentPlanID ? _0x28be50.find(_0x47f5f8 => _0x47f5f8.id === key.parentPlanID) ?? null : null,
            _0x19c848 = await Uf.deserializeFromStorage(key, _0x39f878, new PlanStepStorageAPI(_0x33a44a.storageAPI).getAdapter(key.id));
          _0x28be50.push(_0x19c848);
        }
        _0x33a44a._plans = _0x28be50, _0x28be50.length > 0 && (_0x28be50.find(_0x47e070 => _0x47e070.id === _0x40ce26.activePlanId) || (_0x33a44a._activePlanId = _0x28be50[_0x28be50.length - 1].id, await _0x33a44a.upsertToDisk(_0x144bb9 => {
          _0x144bb9.activePlanId = _0x33a44a._activePlanId;
        }))), _0x33a44a.steps.planGeneration === pe.WAITING_FOR_EXECUTION && (await _0x33a44a.activePlan.setExecutedWithAgent(null)), _0x40ce26.failedPlanIterationQuery && (_0x33a44a._planChatQuery = {
          query: _0x40ce26.failedPlanIterationQuery.query,
          status: "failed"
        });
        let _0x8a1cd3 = _0x40ce26.verification ? VP.deserializeFromStorage(_0x40ce26.verification, new TaskCountStorageAPI(_0x33a44a.storageAPI).getAdapter(_0x40ce26.verification.id)) : null;
        return _0x33a44a._verification = _0x8a1cd3, _0x33a44a._hasSentCreationMetrics = _0x40ce26.hasSentCreationMetrics ?? false, _0x33a44a;
      }
      static ["persistedTaskFromPersistedTicket"](_0xfc087c, _0x2de49f, _0xd5fb97, _0x494175) {
        let _0x143643 = _0x494175.plans.map(_0x46c30f => Uf.persistedPlanFromPersistedTicketPlan(_0xd5fb97, _0x46c30f));
        return {
          id: _0xfc087c,
          title: formatTicketReferenceDisplay(_0xd5fb97),
          creationTime: _0x2de49f,
          lastUpdated: _0x2de49f,
          steps: {
            userQuery: pe.COMPLETED,
            planGeneration: pe.COMPLETED,
            verification: pe.NOT_STARTED
          },
          plans: _0x143643,
          verification: null,
          attachmentSummaries: [],
          activePlanId: _0x143643[_0x143643.length - 1].id,
          discardedVerificationComments: [],
          hasSentCreationMetrics: true,
          failedPlanIterationQuery: void 0,
          retryAfterTimestamp: void 0,
          isReferred: false
        };
      }
      async ["abortTask"](_0x29224a) {
        this._steps.planGeneration === pe.IN_PROGRESS ? this._steps.planGeneration = pe.ABORTING : this._steps.verification === pe.IN_PROGRESS && (this._steps.verification = pe.ABORTING), this._abortController.abort(), _0x29224a && (await this.upsertToDisk(_0x539024 => {
          _0x539024.steps = this._steps;
        })), this._abortController = new AbortController();
      }
      set ["planChatQuery"](_0x1ea729) {
        this._planChatQuery = _0x1ea729;
      }
      async ['resetFailedPlanIterationQuery']() {
        this._planChatQuery = void 0, await this.upsertToDisk(_0x5c2dbe => {
          _0x5c2dbe.failedPlanIterationQuery = void 0;
        });
      }
      async ['handlePlanIterationFailure'](_0x11e02c, _0xe4681f) {
        this._planChatQuery = _0x11e02c, await this.markPlanAsActive(_0xe4681f.planID, false), await this.upsertToDisk(_0x23778c => {
          _0x23778c.steps = this._steps, _0x23778c.failedPlanIterationQuery = {
            ..._0x11e02c,
            retryAfterTimestamp: void 0
          }, _0x23778c.activePlanId = _0xe4681f.planID;
        });
      }
      async ["handleFailedVerification"]() {
        this._verification = null, this._steps.verification = pe.FAILED, await this.upsertToDisk(_0x278ec5 => {
          _0x278ec5.steps = this._steps, _0x278ec5.verification = null;
        });
      }
      async ["addNewVerification"]() {
        let _0x438527 = Ut(),
          _0x4e01ac = async _0x542e12 => {
            await this.upsertToDisk(_0xa1c8c8 => {
              _0xa1c8c8.verification = _0x542e12;
            });
          },
          _0x3a52e0 = await VP.createNewInstance(new TaskCountStorageAPI(this.storageAPI).getAdapter(_0x438527), false, [], _0x438527, _0x4e01ac);
        return this._verification = _0x3a52e0, _0x3a52e0;
      }
      async ["addNewPlan"](_0x42c449, _0x30b45d, _0x3da77e, _0x253848) {
        let _0x87a96a = async _0x280a2e => this.upsertToDisk(_0x15db23 => {
            _0x15db23.plans.push(_0x280a2e), _0x15db23.activePlanId = _0x30b45d;
          }),
          _0x400401 = await Uf.createNewInstance(_0x3da77e, _0x253848, new PlanStepStorageAPI(this.storageAPI).getAdapter(_0x30b45d), _0x42c449, true, _0x87a96a, {
            id: _0x30b45d
          });
        return this.plans.push(_0x400401), this._activePlanId = _0x30b45d, _0x400401;
      }
      async ["resetPlan"](_0x3ceff3, _0x8e5b38, _0x5cec50) {
        let _0x3c272c = this.getPlan(_0x3ceff3.planID),
          _0x2d509a = this.plans.indexOf(_0x3c272c),
          _0xaf2dee = this.plans.splice(_0x2d509a + 1);
        await Promise.all(_0xaf2dee.map(_0x371e4b => _0x371e4b.dispose())), await _0x3c272c.resetPlan(_0x8e5b38, _0x5cec50), await this.upsertToDisk(_0x3a93fd => {
          _0x3a93fd.plans = _0x3a93fd.plans.slice(0, _0x2d509a + 1);
        });
      }
      async ["getInitialUserQueryJSONContent"]() {
        return this.plans[0].getQueryJSONContent();
      }
      ['getLastPlan']() {
        return this.plans[this.plans.length - 1];
      }
      get ["pendingPlanChat"]() {
        if (this._planChatQuery?.["status"] === 'pending') return this._planChatQuery;
      }
      get ["failedPlanIterationQuery"]() {
        if (this._planChatQuery?.['status'] === "failed") return this._planChatQuery;
      }
      async ["updateFailedPlanIterationQuery"](_0x162b91) {
        this.failedPlanIterationQuery && (this.failedPlanIterationQuery.query = _0x162b91, await this.upsertToDisk(_0x2f97d4 => {
          _0x2f97d4.failedPlanIterationQuery = this.failedPlanIterationQuery ? {
            ...this.failedPlanIterationQuery,
            retryAfterTimestamp: void 0
          } : void 0;
        }));
      }
      get ['verification']() {
        return this._verification;
      }
      get ['discardedVerificationComments']() {
        return this._discardedVerificationComments;
      }
      async ['discardVerificationComment'](_0x41c875) {
        let _0x42bf33 = this._verification;
        if (!_0x42bf33) {
          Logger.error('No verification found while trying to discard comments with IDs ' + _0x41c875.join(', '));
          return;
        }
        let _0x4d23d6 = await _0x42bf33.discardVerificationComment(_0x41c875);
        this._discardedVerificationComments.push(..._0x4d23d6), await this.upsertToDisk(_0x3c0d58 => {
          _0x3c0d58.discardedVerificationComments = this._discardedVerificationComments.map(_0x4b50b8 => _0x4b50b8.serializeToStorage());
        });
      }
      async ["toggleVerificationCommentsApplied"](_0x1d8971, _0x36372f) {
        let _0x54a480 = this._verification;
        if (!_0x54a480) {
          Logger.error("No verification found while trying to toggle applied state for comments with IDs " + _0x1d8971.join(', '));
          return;
        }
        await _0x54a480.toggleVerificationCommentsApplied(_0x1d8971, _0x36372f);
      }
      async ['executeReviewCommentsInIDE'](_0x4c00f6, _0x267fa3, _0x18875c, _0x449947, _0x1bb846) {
        let _0x2d2669 = this.getPlan(_0x4c00f6.planID),
          _0x200d79 = _0x2d2669.mustGetReviewOutputHandler(),
          _0x30c038 = async () => {
            await _0x2d2669.persistOutput();
          };
        if (!_0x4c00f6.phaseBreakdownIdentifier) throw new Error("Phase breakdown identifier not found");
        let _0x1161a4 = {
          taskId: this.id,
          taskChainId: _0x4c00f6.phaseBreakdownIdentifier.taskChainID,
          phaseBreakdownId: _0x4c00f6.phaseBreakdownIdentifier.phaseBreakdownID
        };
        return _0x200d79.executeCommentsInIDE(this.title, _0x267fa3, _0x18875c, _0x449947, _0x30c038, _0x1161a4, _0x1bb846);
      }
      async ["executeAllReviewCommentsInIDE"](_0x295f8b, _0x505e77, _0x1fa023, _0x31cc2c, _0xa7fa04) {
        let _0x532dc6 = this.getPlan(_0x295f8b.planID),
          _0x1bae4f = _0x532dc6.mustGetReviewOutputHandler(),
          _0xc2f803 = async () => {
            await _0x532dc6.persistOutput();
          };
        if (!_0x295f8b.phaseBreakdownIdentifier) throw new Error("Phase breakdown identifier not found");
        let _0x47746f = {
          taskId: this.id,
          taskChainId: _0x295f8b.phaseBreakdownIdentifier.taskChainID,
          phaseBreakdownId: _0x295f8b.phaseBreakdownIdentifier.phaseBreakdownID
        };
        return _0x1bae4f.executeAllCommentsInIDE(this.title, _0x505e77, _0x1fa023, _0x31cc2c, _0xc2f803, _0x47746f, _0xa7fa04);
      }
      async ["discardReviewComment"](_0x496a49, _0x3395b9) {
        let _0x3d7445 = this.getPlan(_0x496a49.planID);
        _0x3d7445.mustGetReviewOutputHandler().discardComments(_0x3395b9), await _0x3d7445.persistOutput();
      }
      async ['toggleReviewCommentsApplied'](_0x520eb8, _0x46eaaa, _0x42f8e0) {
        let _0x5b299d = this.getPlan(_0x520eb8.planID),
          _0x2b170e = _0x5b299d.mustGetReviewOutputHandler();
        _0x42f8e0 ? _0x2b170e.applyComments(_0x46eaaa) : _0x2b170e.revertComments(_0x46eaaa), await _0x5b299d.persistOutput();
      }
      async ["resetVerification"]() {
        this._steps.verification === pe.IN_PROGRESS && (await this.abortTask(false)), this._verification = null, this._steps.verification = pe.NOT_STARTED, await this.upsertToDisk(_0x421b47 => {
          _0x421b47.steps = this._steps, _0x421b47.verification = null;
        });
      }
      async ["discardPlan"]() {
        this.isInProgress() && (await this.abortTask(false));
        let _0x2d4c14 = this.plans[0],
          _0x5ce855 = await _0x2d4c14.getQueryJSONContent();
        this._steps = {
          userQuery: pe.COMPLETED,
          planGeneration: pe.NOT_STARTED,
          verification: pe.NOT_STARTED
        }, this._verification = null;
        let _0x2caf12 = this.plans.splice(1);
        await Promise.all(_0x2caf12.map(_0x575c84 => _0x575c84.dispose())), await _0x2d4c14.resetPlan(_0x5ce855, _0x2d4c14.planArtifactType), this._activePlanId = _0x2d4c14.id, await this.upsertToDisk(_0x455dc1 => {
          _0x455dc1.plans = _0x455dc1.plans.slice(0, 1), _0x455dc1.steps = this._steps, _0x455dc1.verification = null, _0x455dc1.activePlanId = _0x2d4c14.id;
        });
      }
      async ["markPlanAsExecuted"](_0x53d4dc) {
        let _0xe602f9 = this.getPlan(_0x53d4dc);
        this._activePlanId = _0x53d4dc, this._verification = null, this._steps = {
          userQuery: pe.COMPLETED,
          planGeneration: pe.COMPLETED,
          verification: pe.NOT_STARTED
        }, await _0xe602f9.setExecutedWithAgent(null), await this.upsertToDisk(_0x5250b7 => {
          _0x5250b7.activePlanId = _0x53d4dc, _0x5250b7.verification = null, _0x5250b7.steps = this._steps;
        });
      }
      ["consumePendingPlanChat"]() {
        let _0x2cb94d = this.pendingPlanChat;
        return this._planChatQuery = void 0, _0x2cb94d;
      }
      async ['resetSkipPlanGeneration']() {
        await this.setStepState('planGeneration', pe.NOT_STARTED), await this.activePlan.setIsExecuted(false, true);
      }
      async ["setStepState"](_0x307c45, _0x4fa96d) {
        this._steps = {
          ...this._steps,
          [_0x307c45]: _0x4fa96d
        }, await this.upsertToDisk(_0x599c4e => {
          _0x599c4e.steps = this._steps;
        });
      }
      ['isInProgress']() {
        return this._steps.userQuery === pe.IN_PROGRESS || this._steps.planGeneration === pe.IN_PROGRESS || this._steps.verification === pe.IN_PROGRESS;
      }
      ["isNotStarted"]() {
        return this._steps.planGeneration === pe.NOT_STARTED && this._steps.verification === pe.NOT_STARTED;
      }
      ['isAllStepsCompleted']() {
        return this._steps.userQuery !== pe.COMPLETED || this._steps.planGeneration !== pe.COMPLETED && this._steps.planGeneration !== pe.SKIPPED && this._steps.planGeneration !== pe.WAITING_FOR_EXECUTION ? false : this.activePlan.planArtifactType === An.REVIEW_ARTIFACT ? true : !(this._steps.verification !== pe.COMPLETED && this._steps.verification !== pe.SKIPPED && this._steps.verification !== pe.WAITING_FOR_EXECUTION);
      }
    };
  }),
  HM,
  initTaskPlanExports = __esmModule(() => {
    'use strict';

    initWorkspaceAssociation(), initWorkspaceInfo(), initTaskPlan(), HM = class {
      static async ['fromPersisted'](_0x1dd360) {
        let {
            id: _0x210dac,
            title: _0x371930,
            displayState: _0x72772d,
            creationTimestamp: _0x10f307,
            lastUpdatedTime: _0x4d695c,
            workspaces: _0xa3015d
          } = _0x1dd360,
          _0x3369c4 = await (await Pf.deserialize(_0xa3015d)).determineWorkspaceScope(),
          _0x75d4f2 = this.getUserQuery(_0x1dd360),
          _0x4e344e = this.getActivePhaseBreakdown(_0x1dd360),
          _0x372815 = _0x4e344e ? this.getActiveTaskFromPhaseBreakdown(_0x4e344e) : null,
          _0x1d6fac = _0x4e344e?.['tasks']?.['length'] ?? 0,
          _0x233526 = _0x4e344e ? this.getLastPrePhaseConversationState(_0x4e344e) : null;
        return {
          id: _0x210dac,
          title: _0x371930,
          displayState: _0x72772d,
          creationTimestamp: _0x10f307,
          lastUpdated: _0x4d695c,
          userQuery: _0x75d4f2,
          activeTask: _0x372815,
          taskLength: _0x1d6fac,
          activePrePhaseConversation: _0x233526,
          workspaceScope: _0x3369c4
        };
      }
      static ["getUserQuery"](_0x488044) {
        let _0x5d766e;
        if (_0x488044.phaseBreakdowns?.[0]?.["prePhaseConversations"]?.[0]?.['userQuery']) _0x5d766e = _0x488044.phaseBreakdowns[0].prePhaseConversations[0].userQuery;else {
          if (_0x488044.phaseBreakdowns?.[0]?.["tasks"]?.[0]?.["plans"]?.[0]?.["queryJsonContent"]) _0x5d766e = _0x488044.phaseBreakdowns[0].tasks[0].plans[0]?.["queryJsonContent"];else throw new Error("No user query found");
        }
        let {
          userQueryWithMentions: _0xe61770
        } = parseUserQueryContent(_0x5d766e, workspace_info.getInstance().getPlatform());
        return _0xe61770;
      }
      static ['getActivePhaseBreakdown'](_0x1147d6) {
        return !_0x1147d6.activePhaseBreakdownId || !_0x1147d6.phaseBreakdowns ? null : _0x1147d6.phaseBreakdowns.find(_0x843ed5 => _0x843ed5.id === _0x1147d6.activePhaseBreakdownId) || null;
      }
      static ["getActiveTaskFromPhaseBreakdown"](_0x37123d) {
        if (!_0x37123d.activeTaskId || !_0x37123d.tasks.length) return null;
        let _0x3d7038 = _0x37123d.tasks.find(_0x2512a9 => _0x2512a9.id === _0x37123d.activeTaskId);
        if (!_0x3d7038) return null;
        let _0x138ce1 = this.getActiveTaskIndex(_0x37123d, _0x37123d.activeTaskId);
        qa.updatePersistedTaskSteps(_0x3d7038);
        let _0x3c024a = _0x3d7038.plans.find(_0x1570bb => _0x1570bb.id === _0x3d7038.activePlanId);
        return _0x3c024a ? {
          index: _0x138ce1,
          steps: _0x3d7038.steps,
          activePlanArtifactType: _0x3c024a.planArtifactType
        } : null;
      }
      static ['getActiveTaskIndex'](_0x1a537f, _0x4b73f1) {
        return _0x1a537f.tasks.findIndex(_0x4e0b6f => _0x4e0b6f.id === _0x4b73f1);
      }
      static ['getLastPrePhaseConversationState'](_0x2b832f) {
        let _0x3c1913 = _0x2b832f.prePhaseConversations[_0x2b832f.prePhaseConversations.length - 1];
        return _0x3c1913?.["state"] ? {
          state: _0x3c1913.state
        } : null;
      }
    };
  }),
  TaskChainNotifier = class {
    constructor(_0x1bdf10) {
      this.webviewProvider = _0x1bdf10;
    }
    async ["postToUIHeavy"](_0x15a211, _0x3d7273) {
      let _0x23940d = {
        type: _n.POST_TASK,
        taskChain: _0x15a211,
        silentlyUpdateUI: _0x3d7273
      };
      await this.webviewProvider.postToCommentNavigator(_0x23940d);
    }
    async ['postToUILight'](_0x37bed0, _0x2a4657) {
      let _0x5cc4ee = {
        type: _n.POST_TASK_LIGHT,
        taskChain: _0x37bed0,
        silentlyUpdateUI: _0x2a4657
      };
      await this.webviewProvider.postToCommentNavigator(_0x5cc4ee);
    }
    async ['postToUIPlanThinking'](_0x3417d7, _0xaf8914) {
      let _0x10e03d = {
        type: _n.POST_PLAN_THINKING,
        planIdentifier: _0x3417d7,
        logs: _0xaf8914
      };
      await this.webviewProvider.postToCommentNavigator(_0x10e03d);
    }
    async ["postToUIPlanDelta"](_0x142957, _0xffdf62) {
      let _0xcc9e9f = {
        type: _n.POST_PLAN_DELTA,
        planIdentifier: _0x142957,
        generatedPlan: _0xffdf62
      };
      await this.webviewProvider.postToCommentNavigator(_0xcc9e9f);
    }
    async ['postToUIVerificationThinking'](_0x60164e, _0x3b7e3b) {
      let _0x2346a6 = {
        type: _n.POST_VERIFICATION_THINKING,
        verificationIdentifier: _0x60164e,
        logs: _0x3b7e3b
      };
      await this.webviewProvider.postToCommentNavigator(_0x2346a6);
    }
    async ["postToUIPrePhaseConversationThinking"](_0x3c0c33, _0x2976c7) {
      let _0x6eb6d9 = {
        type: _n.POST_PRE_PHASE_CONVERSATION_THINKING,
        phaseConversationIdentifier: _0x3c0c33,
        logs: _0x2976c7
      };
      await this.webviewProvider.postToCommentNavigator(_0x6eb6d9);
    }
    ['showNotification'](_0x2e3cd9, _0x35f3da) {
      vscode_module.window.showInformationMessage(_0x2e3cd9, {
        modal: false
      }, {
        title: "View Task"
      }).then(async _0x572447 => {
        _0x572447?.["title"] === "View Task" && _0x35f3da && (await _0x35f3da());
      });
    }
    async ['showTaskNotificationWithViewOption'](_0xe1a9, _0x59b09b) {
      let _0x551fc0 = async () => {
        let _0x52564c = {
          type: _n.OPEN_TASK,
          taskChain: _0x59b09b
        };
        this.webviewProvider.openCommentNavigator(), this.webviewProvider.postToCommentNavigator(_0x52564c);
      };
      this.showNotification(_0xe1a9, _0x551fc0);
    }
  },
  Bf,
  initMcpHandler = __esmModule(() => {
    'use strict';

    initCommentNavigator(), Bf = class _0x155860 {
      constructor() {
        this.commentNavigatorReady = false, this.pendingCommentNavigatorMessages = [];
      }
      static ["getInstance"]() {
        return _0x155860.instance || (_0x155860.instance = new _0x155860()), _0x155860.instance;
      }
      ['enqueueOrSendToCommentNavigator'](_0x57cfb8) {
        this.commentNavigatorReady || _0x57cfb8.sendToViewImmediately ? Qe.commentNavigatorView?.["webview"]['postMessage'](_0x57cfb8) : this.pendingCommentNavigatorMessages.push(_0x57cfb8);
      }
      ["markNavigatorReady"]() {
        this.commentNavigatorReady = true, this.flushPendingCommentNavigatorMessages();
      }
      ["flushPendingCommentNavigatorMessages"]() {
        setTimeout(() => {
          if (this.pendingCommentNavigatorMessages.length > 0) for (; this.pendingCommentNavigatorMessages.length > 0;) {
            let _0x1ac966 = this.pendingCommentNavigatorMessages.shift();
            _0x1ac966 && Qe.commentNavigatorView?.["webview"]["postMessage"](_0x1ac966);
          }
        }, 500);
      }
    };
  }),
  ActivePhaseBreakdownNotFoundError = class extends Error {
    constructor() {
      super('Active phase breakdown is not found for the task chain'), this.name = 'ActivePhaseBreakdownNotFoundError';
    }
  },
  eKe = "Active task is not found for the task chain",
  ActiveTaskNotFoundError = class extends Error {
    constructor() {
      super(eKe), this.name = 'ActiveTaskNotFoundError';
    }
  },
  PhaseBreakdownFailedError = class extends Error {
    constructor(_0x20b9e6) {
      super(_0x20b9e6), this.name = 'PhaseBreakdownFailedError';
    }
  },
  tKe = 'Traycer rate limit exceeded.',
  RateLimitExceededError = class extends Error {
    constructor(_0x5dca99, _0x4b16f0, _0x511f04) {
      super(tKe), this.retryAfter = _0x5dca99, this.allowPayAsYouGo = _0x4b16f0, this.invoiceUrl = _0x511f04, this.name = 'RateLimitExceededError';
    }
  },
  VerificationFailedError = class extends Error {
    constructor(_0x51f16d) {
      super(_0x51f16d), this.name = 'VerificationFailedError';
    }
  };
function findTaskStepIndex(_0x2df0a5, _0x1456d5) {
  let _0x344f17 = _0x2df0a5.tasks.findIndex(_0x52d3e1 => _0x52d3e1.id === _0x1456d5);
  if (_0x344f17 === -1) throw new Error("Task with id " + _0x1456d5 + ' not found within the phase breakdown');
  return _0x344f17;
}
function getTaskStepById(_0x5b182b, _0x5a7c1a) {
  let _0x395133 = findTaskStepIndex(_0x5b182b, _0x5a7c1a);
  return _0x5b182b.tasks[_0x395133];
}
function updateTaskStep(_0x45a85, _0x2212f9) {
  let _0x161634 = findTaskStepIndex(_0x45a85, _0x2212f9.id);
  _0x45a85.tasks[_0x161634] = _0x2212f9;
}
function deleteTaskStep(_0x211ce4, _0x19fee1) {
  let _0x4b381a = findTaskStepIndex(_0x211ce4, _0x19fee1);
  _0x211ce4.tasks.splice(_0x4b381a, 1);
}
var TaskStepStorageAPI = class {
  constructor(_0x313874) {
    this.storageAPI = _0x313874;
  }
  async ['read'](_0x2e1ae7) {
    let _0x2e21d6 = await this.storageAPI.read();
    return getTaskStepById(_0x2e21d6, _0x2e1ae7);
  }
  async ['upsert'](_0x59ef8b, _0x4f8e48) {
    let _0x33b7d2 = await this.storageAPI.read();
    return updateTaskStep(_0x33b7d2, _0x59ef8b), this.storageAPI.upsert(_0x33b7d2, _0x4f8e48);
  }
  async ['runInTransaction'](_0x5162d8) {
    return this.storageAPI.runInTransaction(_0x5162d8);
  }
  async ["delete"](_0x2ba99b, _0x1a553b) {
    let _0x9a04a8 = await this.storageAPI.read();
    return deleteTaskStep(_0x9a04a8, _0x2ba99b), this.storageAPI.upsert(_0x9a04a8, _0x1a553b);
  }
  ['getAdapter'](_0x57f1e) {
    return new ThreadStorage(this, _0x57f1e);
  }
};
var XM
/* [dead-code] Y_e removed */;
/* [unbundle] 已提取: file_system_watcher.js */
/* [unbundle] 已提取: yolo_artifact_manager.js */
function formatStackTrace(_0xebb9d3, _0x4b2e47, _0x49d1b7) {
  let _0xea8847 = _0xebb9d3.phaseBreakdown.getTaskExecutionConfig(_0x49d1b7),
    _0x277d9b = Vt.getInstance().activePromptTemplates;
  switch (_0x4b2e47) {
    case 'plan':
      return _0xea8847.plan?.['promptTemplateFilePath'] ?? _0x277d9b.plan?.['filePath'] ?? _0x277d9b.generic?.["filePath"] ?? '';
    case "review":
      return _0xea8847.review?.['promptTemplateFilePath'] ?? _0x277d9b.review?.['filePath'] ?? _0x277d9b.generic?.["filePath"] ?? '';
    case "verification":
      return _0xea8847.verification?.['promptTemplateFilePath'] ?? _0x277d9b.verification?.['filePath'] ?? _0x277d9b.generic?.["filePath"] ?? '';
    case 'userQuery':
      return _0xea8847.userQuery?.["promptTemplateFilePath"] ?? _0x277d9b.userQuery?.["filePath"] ?? _0x277d9b.generic?.['filePath'] ?? '';
    default:
      throw new Error('Invalid prompt template type: ' + _0x4b2e47);
  }
}
var initIdeAgentConfig = __esmModule(() => {
  'use strict';

  initTaskContext();
});
function parseStackFrame(_0x291b2d, _0x503e19, _0x570885) {
  let _0x457944 = _0x291b2d.phaseBreakdown.getTaskExecutionConfig(_0x503e19),
    _0x3504ba = Vt.getInstance().lastUsedIDEAgents;
  switch (_0x570885) {
    case "plan":
      return _0x457944.plan?.["ideAgent"] ?? _0x3504ba.plan;
    case "verification":
      return _0x457944.verification?.['ideAgent'] ?? _0x3504ba.verification;
    case "review":
      return _0x457944.review?.['ideAgent'] ?? _0x3504ba.review;
    case "userQuery":
      return _0x457944.userQuery?.['ideAgent'] ?? _0x3504ba.userQuery;
    default:
      throw new Error('Invalid context type: ' + _0x570885);
  }
}
var initIdeAgentConfigExports = __esmModule(() => {
  'use strict';

  initTaskContext();
});
function extractFunctionName(_0x2fff9b, _0x348bbf, _0x1afc5d) {
  let _0x19b273;
  switch (_0x348bbf) {
    case "plan":
      _0x19b273 = _0x1afc5d.phaseBreakdown.getTaskExecutionConfig(_0x2fff9b).plan;
      break;
    case "review":
      _0x19b273 = _0x1afc5d.phaseBreakdown.getTaskExecutionConfig(_0x2fff9b).review;
      break;
    case 'verification':
      _0x19b273 = _0x1afc5d.phaseBreakdown.getTaskExecutionConfig(_0x2fff9b).verification;
      break;
    case "userQuery":
      _0x19b273 = _0x1afc5d.phaseBreakdown.getTaskExecutionConfig(_0x2fff9b).userQuery;
      break;
    default:
      throw new Error("Invalid agent type: " + _0x348bbf);
  }
  return _0x19b273?.["executionTimeoutMinutes"] ? _0x19b273.executionTimeoutMinutes * 60 * 1000 : _0x1afc5d.artifactWatcherTimeoutMs;
}
var PlanGenerationStep,
  initPlanGenerationStep = __esmModule(() => {
    'use strict';

    initIdeAgentConfig(), initIdeAgentConfigExports(), PlanGenerationStep = class {
      async ['execute'](_0x39de75, _0x3199cd) {
        let {
          task: _0x669de,
          orchestratorContext: _0x354de5
        } = _0x39de75;
        if (_0x669de.activePlan.generatedPlan) {
          _0x354de5.eventEmitter.emit("step:plan:completed", {
            taskId: _0x669de.id,
            planId: _0x669de.activePlan.id
          });
          return;
        }
        if (_0x3199cd.plan?.["skipStep"]) return this.executeSkipStep(_0x39de75);
        let _0x48edbd = await _0x669de.getInitialUserQueryJSONContent(),
          _0x4cb099 = _0x669de.activePlan.planArtifactType;
        await _0x354de5.phaseBreakdown.context.taskChain.generatePlan(_0x39de75.planIdentifier, _0x48edbd, _0x4cb099, false), _0x354de5.eventEmitter.emit('step:plan:completed', {
          taskId: _0x669de.id,
          planId: _0x669de.activePlan.id
        });
      }
      async ["executeSkipStep"](_0x529909) {
        let {
            task: _0x24dfdf,
            planIdentifier: _0x2b1392,
            orchestratorContext: _0x493dd7
          } = _0x529909,
          _0x2d8819 = await _0x24dfdf.getInitialUserQueryJSONContent(),
          _0xb76c12 = _0x24dfdf.activePlan.planArtifactType,
          _0x5e32cf = 'userQuery',
          _0x3cc17a = parseStackFrame(_0x493dd7, _0x24dfdf.id, 'userQuery'),
          _0x28e07c = formatStackTrace(_0x493dd7, 'userQuery', _0x24dfdf.id);
        await _0x493dd7.phaseBreakdown.context.taskChain.executeQueryDirectlyInIDE(_0x2b1392, _0x3cc17a, _0x28e07c, _0x2d8819, _0xb76c12), await _0x24dfdf.setStepState("planGeneration", pe.WAITING_FOR_EXECUTION), await _0x493dd7.updateOnUI(false);
        let _0x5d17ec = _0x24dfdf.activePlan.id;
        if (_0x493dd7.watchedArtifactIds.has(_0x5d17ec)) throw new Error('Watcher already exists for plan generation artifact: ' + _0x5d17ec);
        _0x493dd7.watchedArtifactIds.add(_0x5d17ec);
        try {
          await _0x493dd7.artifactWatcher.watchForArtifact(_0x5d17ec, async () => {
            await _0x24dfdf.setStepState("planGeneration", pe.SKIPPED), _0x493dd7.eventEmitter.emit('step:userQuery:executed', {
              taskId: _0x24dfdf.id
            }), _0x493dd7.watchedArtifactIds.delete(_0x5d17ec);
          }, extractFunctionName(_0x24dfdf.id, 'userQuery', _0x493dd7));
        } catch (_0x228543) {
          Logger.error(_0x228543, 'Error watching for skip-step execution of \x22' + _0x24dfdf.title + '\x22'), _0x493dd7.watchedArtifactIds.delete(_0x5d17ec), _0x493dd7.eventEmitter.emit('yolo:error', {
            error: _0x228543 instanceof Error ? _0x228543.message : String(_0x228543)
          }), await _0x24dfdf.resetSkipPlanGeneration();
        } finally {
          await _0x493dd7.updateOnUI(true);
        }
      }
    };
  }),
  PlanExecutionStep,
  initPlanExecutionStep = __esmModule(() => {
    'use strict';

    initIdeAgentConfigExports(), initIdeAgentConfig(), initStatusBar(), PlanExecutionStep = class {
      async ['execute'](_0xd8c756) {
        let {
          task: _0x111859,
          planIdentifier: _0x45c52c,
          orchestratorContext: _0x418b95
        } = _0xd8c756;
        _0x418b95.eventEmitter.emit('step:execution:started', {
          taskId: _0x111859.id,
          planId: _0x111859.activePlan.id
        });
        let _0xdf056c = _0x111859.activePlan.planArtifactType === An.REVIEW_ARTIFACT ? 'review' : 'plan',
          _0x43fac6 = parseStackFrame(_0x418b95, _0x111859.id, _0xdf056c),
          _0x38babd = formatStackTrace(_0x418b95, _0x111859.activePlan.planArtifactType === An.REVIEW_ARTIFACT ? "review" : 'plan', _0x111859.id);
        if (_0xdf056c === "plan") await _0x418b95.phaseBreakdown.context.taskChain.executeInIDE(_0x45c52c, _0x43fac6, _0x38babd);else {
          let _0x2e4590 = _0x111859.activePlan.mustGetReviewOutput().comments,
            _0x12a37c = _0x418b95.phaseBreakdown.getTaskExecutionConfig(_0x111859.id).review;
          _0x12a37c?.['reviewCategories']["length"] > 0 && (_0x2e4590 = _0x2e4590.filter(_0x313a03 => _0x12a37c.reviewCategories.includes(_0x313a03.category)));
          let _0x3b5d34 = _0x2e4590.map(_0x239368 => _0x239368.id);
          if (_0x3b5d34.length === 0) {
            await _0x111859.setStepState("planGeneration", pe.COMPLETED), await _0x418b95.updateOnUI(false), _0x418b95.eventEmitter.emit("step:execution:completed", {
              taskId: _0x111859.id,
              artifactId: _0x111859.activePlan.id
            });
            return;
          }
          await _0x418b95.phaseBreakdown.context.taskChain.executeReviewCommentsInIDE(_0x45c52c, _0x3b5d34, _0x43fac6, _0x38babd);
        }
        await _0x111859.setStepState("planGeneration", pe.WAITING_FOR_EXECUTION), await _0x418b95.updateOnUI(false);
        let _0x2b4022 = _0x111859.activePlan.id;
        if (_0x418b95.watchedArtifactIds.has(_0x2b4022)) throw new Error("Watcher already exists for plan execution artifact: " + _0x2b4022);
        _0x418b95.watchedArtifactIds.add(_0x2b4022);
        try {
          await _0x418b95.artifactWatcher.watchForArtifact(_0x2b4022, async () => {
            _0x418b95.eventEmitter.emit('step:execution:completed', {
              taskId: _0x111859.id,
              artifactId: _0x2b4022
            }), _0x418b95.watchedArtifactIds.delete(_0x2b4022);
          }, extractFunctionName(_0x111859.id, _0xdf056c, _0x418b95));
        } catch (_0x23f542) {
          Logger.error(_0x23f542, "Error watching for plan execution of \"" + _0x111859.title + '\x22'), _0x418b95.watchedArtifactIds.delete(_0x2b4022), _0x418b95.eventEmitter.emit('yolo:error', {
            error: _0x23f542 instanceof Error ? _0x23f542.message : String(_0x23f542)
          });
        } finally {
          await _0x111859.setStepState("planGeneration", pe.COMPLETED), await _0x418b95.updateOnUI(true);
        }
      }
    };
  }),
  VerificationStepHandler,
  initVerificationStepHandler = __esmModule(() => {
    'use strict';

    VerificationStepHandler = class {
      async ["execute"](_0x15e35e, _0x2de60e) {
        let {
          task: _0x3c75ff,
          verificationIdentifier: _0x178d94,
          orchestratorContext: _0xbae38b
        } = _0x15e35e;
        if (_0xbae38b.eventEmitter.emit("step:verification:started", {
          taskId: _0x3c75ff.id
        }), _0x2de60e?.['verification']?.['skipStep']) {
          await _0xbae38b.phaseBreakdown.setStepState(_0x3c75ff.id, "verification", pe.SKIPPED), _0xbae38b.eventEmitter.emit('step:verification:completed', {
            taskId: _0x3c75ff.id
          });
          return;
        }
        let _0x35f4ad = false;
        _0x3c75ff.steps.verification === pe.NOT_STARTED ? await _0xbae38b.phaseBreakdown.context.taskChain.startTaskVerification(_0x178d94, false) : _0x3c75ff.steps.verification === pe.FAILED && (_0x3c75ff.verification?.["reverificationState"] ? await this.reVerify(_0x15e35e) : await _0xbae38b.phaseBreakdown.context.taskChain.startTaskVerification(_0x178d94, false)), _0xbae38b.eventEmitter.emit("step:verification:completed", {
          taskId: _0x3c75ff.id
        });
      }
      async ["checkComments"](_0x4a271a) {
        let {
            task: _0x5c9efb
          } = _0x4a271a,
          _0x2bd5ba = _0x5c9efb.verification;
        if (!_0x2bd5ba) throw new Error('Verification not found');
        let _0x295cd7 = _0x2bd5ba.verificationOutput;
        if (!_0x295cd7) throw new Error("Verification output not found");
        let _0x43b4aa = _0x4a271a.orchestratorContext.phaseBreakdown.getTaskExecutionConfig(_0x5c9efb.id).verification?.["verificationSeverities"] ?? [],
          _0x200aff = _0x295cd7.allComments.filter(_0x23d1c0 => !_0x23d1c0.comment.isApplied);
        return _0x43b4aa.length > 0 && (_0x200aff = _0x200aff.filter(_0xb7344d => _0x43b4aa.includes(_0xb7344d.comment.severity))), {
          hasUnappliedComments: _0x200aff.length > 0,
          shouldReVerify: false
        };
      }
      async ['reVerify'](_0x5628ff) {
        let {
          task: _0x4f8327,
          verificationIdentifier: _0x4bee80,
          orchestratorContext: _0x91cbeb
        } = _0x5628ff;
        await _0x91cbeb.phaseBreakdown.context.taskChain.reVerifyTask(_0x4bee80), Logger.debug("VerificationStepHandler: Re-verification completed for task: " + _0x4f8327.id + ', updating UI'), await _0x91cbeb.phaseBreakdown.upsertToDisk(() => {}), await _0x91cbeb.phaseBreakdown.context.taskChain.postToUILight(false);
      }
    };
  }),
  VerificationExecutionStep,
  initVerificationExecutionStep = __esmModule(() => {
    'use strict';

    initIdeAgentConfigExports(), initIdeAgentConfig(), VerificationExecutionStep = class {
      async ["execute"](_0x107e92) {
        let {
            task: _0x10a04d,
            verificationIdentifier: _0x339df4,
            orchestratorContext: _0x2e63b6
          } = _0x107e92,
          _0x332c9b = parseStackFrame(_0x2e63b6, _0x10a04d.id, "verification"),
          _0x1676c0 = _0x10a04d.verification;
        if (!_0x1676c0) throw new Error("Verification not found");
        await _0x10a04d.setStepState("verification", pe.WAITING_FOR_EXECUTION), await _0x2e63b6.updateOnUI(false);
        let _0x3a5ab8 = _0x2e63b6.phaseBreakdown.getTaskExecutionConfig(_0x10a04d.id).verification?.['verificationSeverities'] ?? [],
          _0x43c30b = _0x3a5ab8.length > 0 ? _0x3a5ab8 : 'AllExceptOutdated',
          _0x2587e2 = formatStackTrace(_0x2e63b6, "verification", _0x10a04d.id),
          _0x3fdfc7 = _0x1676c0.id;
        try {
          if (await _0x2e63b6.phaseBreakdown.context.taskChain.executeAllVerificationCommentsInIDE(_0x339df4, _0x43c30b, _0x332c9b, _0x2587e2), _0x2e63b6.watchedArtifactIds.has(_0x3fdfc7)) throw new Error("Watcher already exists for artifact: " + _0x10a04d.title);
          _0x2e63b6.watchedArtifactIds.add(_0x3fdfc7), await _0x2e63b6.artifactWatcher.watchForArtifact(_0x3fdfc7, async () => {
            await _0x10a04d.setStepState("verification", pe.COMPLETED), _0x2e63b6.eventEmitter.emit("step:verification:comments:executed", {
              taskId: _0x10a04d.id,
              verificationId: _0x3fdfc7
            }), _0x2e63b6.watchedArtifactIds.delete(_0x3fdfc7);
          }, extractFunctionName(_0x10a04d.id, 'verification', _0x2e63b6));
        } catch (_0x1c6411) {
          if (await _0x10a04d.setStepState("verification", pe.COMPLETED), _0x1c6411 instanceof NoVerificationCommentsToExecuteError) {
            _0x2e63b6.eventEmitter.emit("step:verification:comments:executed", {
              taskId: _0x10a04d.id,
              verificationId: _0x3fdfc7
            });
            return;
          }
          Logger.error(_0x1c6411, 'Error watching for verification artifact for \x22' + _0x10a04d.title + '\x22'), _0x2e63b6.watchedArtifactIds.delete(_0x3fdfc7), _0x2e63b6.eventEmitter.emit('yolo:error', {
            error: _0x1c6411 instanceof Error ? _0x1c6411.message : String(_0x1c6411)
          });
        } finally {
          await _0x2e63b6.updateOnUI(true);
        }
      }
    };
  }),
  initOrchestratorSteps = __esmModule(() => {
    'use strict';

    initPlanGenerationStep(), initPlanExecutionStep(), initVerificationStepHandler(), initVerificationExecutionStep();
  }),
  TaskStepProcessor,
  initTaskStepProcessor = __esmModule(() => {
    'use strict';

    initOrchestratorSteps(), TaskStepProcessor = class {
      constructor(_0x4dea64) {
        this.orchestratorContext = _0x4dea64, this.planGenerationHandler = new PlanGenerationStep(), this.planExecutionHandler = new PlanExecutionStep();
      }
      async ["processTask"](_0x283aa7, _0x27c818) {
        if (this.orchestratorContext.eventEmitter.emit('task:started', {
          taskId: _0x283aa7.id,
          startingStep: _0x27c818
        }), _0x27c818 === 'plan') await this.generatePlan(_0x283aa7);else {
          if (_0x27c818 === 'userQuery') {
            let _0x3f13ec = this.buildStepDependencies(_0x283aa7);
            await this.planGenerationHandler.executeSkipStep(_0x3f13ec);
          }
        }
      }
      async ["generatePlan"](_0x40eedc) {
        let _0x3b7f2b = this.orchestratorContext.phaseBreakdown.getTaskExecutionConfig(_0x40eedc.id),
          _0x284817 = this.buildStepDependencies(_0x40eedc);
        await this.planGenerationHandler.execute(_0x284817, _0x3b7f2b);
      }
      async ["executePlan"](_0x3721d4) {
        let _0x3c719b = this.buildStepDependencies(_0x3721d4);
        await this.planExecutionHandler.execute(_0x3c719b);
      }
      ["buildPlanIdentifier"](_0x3bf4b9) {
        return {
          phaseBreakdownIdentifier: {
            taskChainID: this.getTaskChainID(),
            phaseBreakdownID: this.orchestratorContext.phaseBreakdown.id
          },
          taskID: _0x3bf4b9.id,
          planID: _0x3bf4b9.activePlan.id
        };
      }
      ["buildVerificationIdentifier"](_0x3831de) {
        return {
          phaseBreakdownIdentifier: {
            taskChainID: this.getTaskChainID(),
            phaseBreakdownID: this.orchestratorContext.phaseBreakdown.id
          },
          taskID: _0x3831de.id,
          verificationID: _0x3831de.verification?.['id'] ?? ''
        };
      }
      ["getTaskChain"]() {
        return this.orchestratorContext.phaseBreakdown.context.taskChain;
      }
      ['getTaskChainID']() {
        return this.getTaskChain().id;
      }
      ["enqueueAction"](_0x27c752) {
        this.orchestratorContext.enqueueAction?.(_0x27c752);
      }
      ['buildStepDependencies'](_0x469507) {
        return {
          task: _0x469507,
          planIdentifier: this.buildPlanIdentifier(_0x469507),
          verificationIdentifier: this.buildVerificationIdentifier(_0x469507),
          orchestratorContext: this.orchestratorContext
        };
      }
      ['isPlanGenerationDone'](_0x10cd08) {
        return _0x10cd08.steps.planGeneration === pe.COMPLETED || _0x10cd08.steps.planGeneration === pe.SKIPPED || _0x10cd08.steps.planGeneration === pe.WAITING_FOR_EXECUTION;
      }
    };
  }),
  VerificationTaskStepProcessor,
  initVerificationTaskStepProcessor = __esmModule(() => {
    'use strict';

    initOrchestratorSteps(), initTaskStepProcessor(), VerificationTaskStepProcessor = class extends TaskStepProcessor {
      constructor(_0x127474) {
        super(_0x127474), this.verificationHandler = new VerificationStepHandler(), this.verificationCommentsHandler = new VerificationExecutionStep();
      }
      async ['handleExecutionCompletion'](_0x12f39e) {
        _0x12f39e.activePlan.planArtifactType === An.REVIEW_ARTIFACT ? this.enqueueAction({
          type: "MOVE_TO_NEXT_TASK",
          taskId: _0x12f39e.id,
          payload: void 0
        }) : this.enqueueAction({
          type: "START_VERIFICATION",
          taskId: _0x12f39e.id,
          payload: void 0
        });
      }
      async ['processTask'](_0x2fc512, _0x418567) {
        _0x418567 === "verification" ? _0x2fc512.steps.verification === pe.COMPLETED ? await this.checkAndExecuteVerificationComments(_0x2fc512) : await this.startVerification(_0x2fc512) : await super.processTask(_0x2fc512, _0x418567);
      }
      async ['startVerification'](_0x50b3b9) {
        let _0x8502b2 = this.orchestratorContext.phaseBreakdown.getTaskExecutionConfig(_0x50b3b9.id),
          _0x253ea0 = this.buildStepDependencies(_0x50b3b9);
        await this.verificationHandler.execute(_0x253ea0, _0x8502b2);
      }
      async ['checkAndExecuteVerificationComments'](_0x5b7164) {
        let _0x50b910 = this.buildStepDependencies(_0x5b7164),
          _0x4cb2c1 = await this.verificationHandler.checkComments(_0x50b910);
        _0x4cb2c1.shouldReVerify ? this.enqueueAction({
          type: 'RE_VERIFY_TASK',
          taskId: _0x5b7164.id,
          payload: void 0
        }) : _0x4cb2c1.hasUnappliedComments ? await this.executeVerificationComments(_0x5b7164) : this.enqueueAction({
          type: 'MOVE_TO_NEXT_TASK',
          taskId: _0x5b7164.id,
          payload: void 0
        });
      }
      async ["executeVerificationComments"](_0x116360) {
        let _0x1984b3 = this.buildStepDependencies(_0x116360);
        await this.verificationCommentsHandler.execute(_0x1984b3);
      }
      async ["reVerifyTask"](_0x56b8c2) {
        let _0x3e8296 = this.orchestratorContext.phaseBreakdown.getTaskExecutionConfig(_0x56b8c2.id).verification.maxReVerificationAttempts;
        if (_0x3e8296 === 0) {
          this.enqueueAction({
            type: "MOVE_TO_NEXT_TASK",
            taskId: _0x56b8c2.id,
            payload: void 0
          });
          return;
        }
        let _0xc9881a = this.orchestratorContext.reVerificationAttempts,
          _0x1f3c53 = _0xc9881a.get(_0x56b8c2.id) || 0;
        if (_0x1f3c53 >= _0x3e8296) throw new Error("Re-verification attempt limit exceeded for task " + _0x56b8c2.id + ". Maximum " + _0x3e8296 + " attempts allowed.");
        let _0x3fc329 = this.buildStepDependencies(_0x56b8c2);
        await this.verificationHandler.reVerify(_0x3fc329), _0xc9881a.set(_0x56b8c2.id, _0x1f3c53 + 1), this.enqueueAction({
          type: "EXECUTE_VERIFICATION_COMMENTS",
          taskId: _0x56b8c2.id,
          payload: void 0
        });
      }
    };
  }),
  SimpleTaskStepProcessor,
  initSimpleTaskStepProcessor = __esmModule(() => {
    'use strict';

    initTaskStepProcessor(), SimpleTaskStepProcessor = class extends TaskStepProcessor {
      constructor(_0x16571d) {
        super(_0x16571d);
      }
      async ['handleExecutionCompletion'](_0xd97efe) {
        this.enqueueAction({
          type: "MOVE_TO_NEXT_TASK",
          taskId: _0xd97efe.id,
          payload: void 0
        });
      }
    };
  }),
  initTaskStepProcessorExports = __esmModule(() => {
    'use strict';

    initTaskStepProcessor(), initVerificationTaskStepProcessor(), initSimpleTaskStepProcessor();
  }),
  TaskOrchestrator,
  initTaskOrchestrator = __esmModule(() => {
    'use strict';

    initCommentNavigator(), initTaskStepProcessorExports(), TaskOrchestrator = class _0x147220 extends events_module.EventEmitter {
      constructor(_0x481dc1, _0x43034f) {
        super(), this._isRunning = false, this._phaseBreakdownTaskIndex = 0, this._currentStep = null, this._watchedArtifactIds = new Set(), this._lastError = void 0, this._taskIds = [], this._yoloTaskIndex = 0, this._isInitialized = false, this._lastEmittedTaskIndex = -1, this._lastEmittedStep = null, this._actionQueue = [], this._isProcessingQueue = false, this._queueError = null, this._reVerificationAttempts = new Map(), this._phaseBreakdown = _0x481dc1, this._artifactWatcher = YoloArtifactManager.getInstance(), this._taskIds = _0x43034f, this._orchestratorContext = {
          phaseBreakdown: this._phaseBreakdown,
          artifactWatcher: this._artifactWatcher,
          eventEmitter: this,
          watchedArtifactIds: this._watchedArtifactIds,
          enqueueAction: this.enqueueAction.bind(this),
          reVerificationAttempts: this._reVerificationAttempts,
          artifactWatcherTimeoutMs: 600000,
          updateOnUI: this.upsertOnUI.bind(this)
        }, this._implementationProcessor = new VerificationTaskStepProcessor(this._orchestratorContext), this._reviewProcessor = new SimpleTaskStepProcessor(this._orchestratorContext), this.on('step:plan:completed', ({
          taskId: _0x4b2de3
        }) => {
          if (this._isRunning) try {
            this.enqueueAction({
              type: "EXECUTE_PLAN",
              taskId: _0x4b2de3,
              payload: void 0
            });
          } catch (_0x476536) {
            this._queueError = _0x476536 instanceof Error ? _0x476536 : new Error(String(_0x476536)), Logger.error(_0x476536, 'Error in PLAN_GENERATED event handler for task: ' + _0x4b2de3), this.emit("yolo:error", {
              error: this._queueError
            });
          }
        }), this.on('step:userQuery:executed', async ({
          taskId: _0x41c980
        }) => {
          await this.handlePlanExecutedOrSkipped(_0x41c980);
        }), this.on("step:execution:completed", async ({
          taskId: _0x44fe77
        }) => {
          await this.handlePlanExecutedOrSkipped(_0x44fe77);
        }), this.on("step:verification:completed", ({
          taskId: _0x436b90
        }) => {
          if (this._isRunning) try {
            this._phaseBreakdown.getTaskExecutionConfig(_0x436b90).verification?.["skipStep"] === true ? this.enqueueAction({
              type: "MOVE_TO_NEXT_TASK",
              taskId: _0x436b90,
              payload: void 0
            }) : this.enqueueAction({
              type: "EXECUTE_VERIFICATION_COMMENTS",
              taskId: _0x436b90,
              payload: {
                startingStep: void 0
              }
            });
          } catch (_0x5cde17) {
            this._queueError = _0x5cde17 instanceof Error ? _0x5cde17 : new Error(String(_0x5cde17)), Logger.error(_0x5cde17, "Error in VERIFICATION_COMPLETED event handler for task: " + _0x436b90), this.emit('yolo:error', {
              error: this._queueError
            });
          }
        }), this.on("step:verification:comments:executed", ({
          taskId: _0x35a7d6
        }) => {
          this._isRunning && this.enqueueAction({
            type: 'RE_VERIFY_TASK',
            taskId: _0x35a7d6,
            payload: void 0
          });
        }), this.validateTaskExecutionConfig();
      }
      set ['taskIds'](_0xab82dc) {
        this._taskIds = _0xab82dc;
      }
      get ['isInitialized']() {
        return this._isInitialized;
      }
      get ['isRunning']() {
        return this._isRunning;
      }
      get ["lastError"]() {
        return this._lastError;
      }
      get ["lastEmittedTaskIndex"]() {
        return this._lastEmittedTaskIndex;
      }
      get ['lastEmittedStep']() {
        return this._lastEmittedStep;
      }
      get ["reVerificationAttempts"]() {
        return this._reVerificationAttempts;
      }
      ['enqueueAction'](_0x4d19de) {
        if (!this._isRunning && _0x4d19de.type !== "COMPLETE_YOLO") throw new Error('Orchestrator not running, skipping enqueue of action: ' + _0x4d19de.type + ' for task: ' + _0x4d19de.taskId);
        if (this._queueError) throw new Error('Queue is in error state, skipping enqueue of action: ' + _0x4d19de.type + " for task: " + _0x4d19de.taskId);
        this._actionQueue.push(_0x4d19de), Logger.debug('Enqueued action: ' + _0x4d19de.type + " for task: " + _0x4d19de.taskId), this._isProcessingQueue || this.processQueue().catch(_0x39e653 => {
          Logger.error(_0x39e653, 'Fatal error in queue processing');
        });
      }
      async ["handlePlanExecutedOrSkipped"](_0x23e3c6) {
        if (this._isRunning) try {
          let _0x20b400 = this._phaseBreakdown.getTask(_0x23e3c6);
          await this.getProcessorForTask(_0x20b400).handleExecutionCompletion(_0x20b400);
        } catch (_0x1a51b1) {
          this._queueError = _0x1a51b1 instanceof Error ? _0x1a51b1 : new Error(String(_0x1a51b1)), Logger.error(_0x1a51b1, 'Error in PLAN_EXECUTED event handler for task: ' + _0x23e3c6), this.emit("yolo:error", {
            error: this._queueError
          });
        }
      }
      async ['processQueue']() {
        if (this._isProcessingQueue) throw new Error("Queue is already processing, skipping duplicate call");
        this._isProcessingQueue = true, Logger.debug('Starting queue processing with ' + this._actionQueue.length + " actions");
        try {
          for (; this._actionQueue.length > 0 && !this._queueError;) {
            let _0x413859 = this._actionQueue.shift();
            Logger.debug("Processing action: " + _0x413859.type + " for task: " + _0x413859.taskId);
            try {
              let _0x1f1141 = _0x413859.taskId ? this._phaseBreakdown.getTask(_0x413859.taskId) : null;
              switch (_0x413859.type) {
                case "PROCESS_TASK":
                  if (_0x1f1141) {
                    let _0x373f84 = this.getTimeoutForAction(_0x413859, _0x1f1141);
                    this._orchestratorContext.artifactWatcherTimeoutMs = _0x373f84;
                    let _0x53b495 = this._phaseBreakdown.tasks.findIndex(_0x589692 => _0x589692.id === _0x1f1141.id);
                    _0x53b495 !== -1 && (this._phaseBreakdownTaskIndex = _0x53b495);
                    let _0x50f811 = _0x413859.payload?.["startingStep"] || this.calculateStartingStep(_0x1f1141.id);
                    if (_0x50f811) this._currentStep = _0x50f811;else {
                      this.enqueueAction({
                        type: "MOVE_TO_NEXT_TASK",
                        taskId: _0x1f1141.id,
                        payload: void 0
                      });
                      break;
                    }
                    await this.persistYoloState(), await this.getProcessorForTask(_0x1f1141).processTask(_0x1f1141, _0x50f811);
                  }
                  break;
                case 'GENERATE_PLAN':
                  if (_0x1f1141) {
                    let _0x583da6 = this.getTimeoutForAction(_0x413859, _0x1f1141);
                    this._orchestratorContext.artifactWatcherTimeoutMs = _0x583da6, await this.getProcessorForTask(_0x1f1141).generatePlan(_0x1f1141);
                  }
                  break;
                case "EXECUTE_PLAN":
                  if (_0x1f1141) {
                    let _0x1cac4e = this.getTimeoutForAction(_0x413859, _0x1f1141);
                    this._orchestratorContext.artifactWatcherTimeoutMs = _0x1cac4e, await this.getProcessorForTask(_0x1f1141).executePlan(_0x1f1141);
                  }
                  break;
                case "START_VERIFICATION":
                  if (_0x1f1141) {
                    let _0x39a93a = this.getTimeoutForAction(_0x413859, _0x1f1141);
                    this._orchestratorContext.artifactWatcherTimeoutMs = _0x39a93a, await this._implementationProcessor.startVerification(_0x1f1141);
                  }
                  break;
                case 'EXECUTE_VERIFICATION_COMMENTS':
                  if (_0x1f1141) {
                    let _0x25b27e = this.getTimeoutForAction(_0x413859, _0x1f1141);
                    this._orchestratorContext.artifactWatcherTimeoutMs = _0x25b27e, await this._implementationProcessor.checkAndExecuteVerificationComments(_0x1f1141);
                  }
                  break;
                case "RE_VERIFY_TASK":
                  if (_0x1f1141) {
                    let _0x2aec32 = this.getTimeoutForAction(_0x413859, _0x1f1141);
                    this._orchestratorContext.artifactWatcherTimeoutMs = _0x2aec32, await this._implementationProcessor.reVerifyTask(_0x1f1141), await this.persistYoloState();
                  }
                  break;
                case "MOVE_TO_NEXT_TASK":
                  await this.moveToNextTask();
                  break;
                case 'COMPLETE_YOLO':
                  await this.stopYoloMode("completed");
                  break;
                default:
                  Logger.warn('Unknown action type: ' + _0x413859.type);
              }
            } catch (_0x96388c) {
              this._queueError = _0x96388c instanceof Error ? _0x96388c : new Error(String(_0x96388c)), Logger.error(_0x96388c, 'Error processing YOLO action');
              break;
            }
          }
          this._queueError && this.emit("yolo:error", {
            error: this._queueError
          }), Logger.debug("Queue processing completed. Remaining actions: " + this._actionQueue.length);
        } finally {
          this._isProcessingQueue = false;
        }
      }
      ["validateTaskExecutionConfig"]() {
        for (let key of this._taskIds) {
          if (!this._phaseBreakdown.getTask(key)) {
            this.emit("yolo:error", {
              error: 'Task ' + key + ' not found'
            });
            return;
          }
          let _0x53d500 = this._phaseBreakdown.getTaskExecutionConfig(key);
          if (!isTerminalAgent(_0x53d500.plan.ideAgent)) {
            this.emit("yolo:error", {
              error: 'Task ' + key + " is not a terminal agent"
            });
            return;
          }
          if (!isUtilityAgent(_0x53d500.review.ideAgent)) {
            this.emit('yolo:error', {
              error: "Task " + key + " is not a utility agent"
            });
            return;
          }
          if (!isTerminalAgent(_0x53d500.verification.ideAgent)) {
            this.emit('yolo:error', {
              error: 'Task ' + key + " is not a terminal agent"
            });
            return;
          }
          if (!isUtilityAgent(_0x53d500.userQuery.ideAgent)) {
            this.emit("yolo:error", {
              error: 'Task ' + key + " is not a utility agent"
            });
            return;
          }
        }
      }
      ['getTimeoutForAction'](_0x289277, _0x47965e) {
        let _0x484d94 = this._phaseBreakdown.getTaskExecutionConfig(_0x47965e.id),
          _0x1f432f;
        switch (_0x289277.type) {
          case "GENERATE_PLAN":
          case "EXECUTE_PLAN":
            _0x1f432f = _0x484d94.plan.executionTimeoutMinutes;
            break;
          case 'START_VERIFICATION':
          case 'EXECUTE_VERIFICATION_COMMENTS':
          case 'RE_VERIFY_TASK':
            _0x1f432f = _0x484d94.verification.executionTimeoutMinutes;
            break;
          default:
            return 600000;
        }
        return _0x1f432f * 60 * 1000;
      }
      static async ['init'](_0x4f7785, _0x5dedfc) {
        let _0x4d6270 = new _0x147220(_0x4f7785, _0x5dedfc),
          _0x40ecd5 = await _0x4f7785.getYoloModeState();
        if (_0x40ecd5 && (_0x4d6270._phaseBreakdownTaskIndex = _0x40ecd5.currentTaskIndex, _0x4d6270._currentStep = _0x40ecd5.currentStep, _0x4d6270._isRunning = _0x40ecd5.isRunning, _0x40ecd5.reVerificationAttempts)) {
          _0x4d6270._reVerificationAttempts.clear();
          for (let [_0x368a81, _0x267660] of Object.entries(_0x40ecd5.reVerificationAttempts)) _0x4d6270._reVerificationAttempts.set(_0x368a81, _0x267660);
        }
        return _0x4d6270._isInitialized = true, await _0x4d6270.persistYoloState(), _0x4d6270;
      }
      ["getYoloModeState"]() {
        return {
          currentTaskIndex: this._yoloTaskIndex,
          currentStep: this._currentStep,
          isRunning: this._isRunning,
          taskIds: this._taskIds,
          lastError: this._lastError,
          reVerificationAttempts: Object.fromEntries(this._reVerificationAttempts)
        };
      }
      async ["startYoloMode"]() {
        if (!this._isInitialized) throw new Error('YoloOrchestrator not initialized');
        if (this._phaseBreakdown.tasks.length === 0) throw new Error('No tasks available in phase breakdown');
        if (this._taskIds.length === 0) throw new Error('No tasks selected for YOLO mode');
        if (this._isProcessingQueue) throw new Error("YOLO mode queue is already processing, cannot start");
        this._queueError = null;
        let _0x295a85 = this._isRunning,
          _0x302c4a,
          _0x40df08 = _0x28aceb => {
            if (_0x28aceb >= this._taskIds.length) return;
            let _0x32ed79 = this._taskIds[_0x28aceb];
            if (this._phaseBreakdownTaskIndex = this._phaseBreakdown.tasks.findIndex(_0x4511c6 => _0x4511c6.id === _0x32ed79), this._phaseBreakdownTaskIndex === -1) throw new Error("Task " + _0x32ed79 + ' not found in phase breakdown');
            let _0x2c9230 = this.calculateStartingStep(_0x32ed79);
            if (_0x2c9230) this._currentStep = _0x2c9230, this._yoloTaskIndex = _0x28aceb;else return _0x40df08(_0x28aceb + 1);
            return _0x32ed79;
          };
        if (_0x295a85) {
          let _0x57ab8d = this._phaseBreakdown.tasks[this._phaseBreakdownTaskIndex]?.['id'];
          if (!_0x57ab8d) throw new Error("No task found at phase breakdown index " + this._phaseBreakdownTaskIndex);
          if (this._yoloTaskIndex = this._taskIds.findIndex(_0x597eea => _0x597eea === _0x57ab8d), this._yoloTaskIndex === -1) throw new Error('Current task ' + _0x57ab8d + ' not found in YOLO task list');
          _0x302c4a = _0x57ab8d;
        } else {
          this._yoloTaskIndex = 0;
          let _0x19f072 = _0x40df08(0);
          if (!_0x19f072) {
            this.emit("yolo:stopped", {
              reason: 'completed'
            });
            return;
          }
          _0x302c4a = _0x19f072;
        }
        this._isRunning = true, await this.persistYoloState();
        let _0x3c4f5a = this.getTaskChainID(),
          _0x4d21ff = this._phaseBreakdown.id;
        this.emit('yolo:started', {
          taskChainID: _0x3c4f5a,
          phaseBreakdownID: _0x4d21ff
        });
        let _0x513bbb = {
          type: _n.YOLO_MODE_STARTED,
          taskChainID: _0x3c4f5a,
          phaseBreakdownID: _0x4d21ff
        };
        return await Qe.postToAllWebviews(_0x513bbb), this.enqueueAction({
          type: "PROCESS_TASK",
          taskId: _0x302c4a,
          payload: void 0
        }), new Promise(_0x21b044 => {
          this.once('yolo:stopped', () => {
            _0x21b044();
          });
        });
      }
      async ["stopYoloMode"](_0x16e878, _0x59df40) {
        try {
          if (this._isRunning = false, this._actionQueue = [], this._isProcessingQueue = false, this._lastError = this.convertErrorToString(_0x59df40), await this.persistYoloState(), _0x16e878 !== "user_stopped") {
            for (let key of this._watchedArtifactIds) await this._artifactWatcher.stopWatching(key);
            this._watchedArtifactIds.clear();
          }
          this._queueError = null;
          let _0x35705c = this.determineStopReason(_0x16e878, _0x59df40),
            _0x5a0030 = this.getTaskChainID(),
            _0x5d6517 = this._phaseBreakdown.id;
          this.emit("yolo:stopped", {
            reason: _0x35705c,
            error: this._lastError,
            taskChainID: _0x5a0030,
            phaseBreakdownID: _0x5d6517
          });
          let _0x2c23c8 = {
            type: _n.YOLO_MODE_STOPPED,
            taskChainID: _0x5a0030,
            phaseBreakdownID: _0x5d6517,
            reason: _0x35705c,
            error: this._lastError
          };
          await Qe.postToAllWebviews(_0x2c23c8);
          let _0x19b59d = this.buildStopMessage(_0x35705c, _0x59df40);
          this.showNotification(_0x19b59d);
        } catch (_0x21129d) {
          throw Logger.error(_0x21129d, "Error stopping YOLO mode"), _0x21129d;
        }
      }
      ['getProcessorForTask'](_0x122ff6) {
        let _0x174c55 = _0x122ff6.activePlan.planArtifactType;
        if (_0x174c55 === An.IMPLEMENTATION_ARTIFACT) return this._implementationProcessor;
        if (_0x174c55 === An.REVIEW_ARTIFACT) return this._reviewProcessor;
        throw new Error('Unknown artifact type: ' + _0x174c55);
      }
      async ["moveToNextTask"]() {
        if (this._yoloTaskIndex < this._taskIds.length) {
          let _0x51ee6e = this._taskIds[this._yoloTaskIndex];
          this.emit('task:completed', {
            taskId: _0x51ee6e
          }), this._reVerificationAttempts.delete(_0x51ee6e);
        }
        if (this._yoloTaskIndex++, this._yoloTaskIndex >= this._taskIds.length) {
          this.enqueueAction({
            type: "COMPLETE_YOLO",
            taskId: '',
            payload: void 0
          });
          return;
        }
        let _0x64cb89 = this._taskIds[this._yoloTaskIndex],
          _0x1efb48 = this._phaseBreakdown.tasks.findIndex(_0x339ec7 => _0x339ec7.id === _0x64cb89);
        _0x1efb48 !== -1 && (this._phaseBreakdownTaskIndex = _0x1efb48);
        let _0x145320 = this.calculateStartingStep(_0x64cb89);
        if (_0x145320) this._currentStep = _0x145320;else return this.moveToNextTask();
        await this.persistYoloState(), this.enqueueAction({
          type: 'PROCESS_TASK',
          taskId: _0x64cb89,
          payload: void 0
        });
      }
      async ['persistYoloState']() {
        let _0x305a79 = this.getYoloModeState();
        await this._phaseBreakdown.upsertToDisk(_0x2c1884 => {
          _0x2c1884.yoloModeState = _0x305a79;
        }), this._isRunning && (this._yoloTaskIndex !== this._lastEmittedTaskIndex || this._currentStep !== this._lastEmittedStep) && (this._lastEmittedTaskIndex = this._yoloTaskIndex, this._lastEmittedStep = this._currentStep), await this.upsertOnUI(true);
      }
      ["isYoloModeRunning"]() {
        return this._isRunning;
      }
      async ['upsertOnUI'](_0x56c98a = false) {
        _0x56c98a || (await this._phaseBreakdown.upsertToDisk(() => {}));
        let _0x474d0e = this._phaseBreakdown.context.taskChain;
        _0x474d0e && (await _0x474d0e.postToUILight(false));
      }
      ['showNotification'](_0x31b92a) {
        this._phaseBreakdown.context.uiAdapter.showNotification(_0x31b92a);
      }
      ["determineStopReason"](_0x32c764, _0x17c939) {
        return _0x32c764 || (_0x17c939 ? 'error' : 'completed');
      }
      ['buildStopMessage'](_0x9e260c, _0xb05920) {
        return _0x9e260c === "user_stopped" ? 'YOLO mode stopped by user' : _0x9e260c === "error" ? "YOLO mode stopped due to error: " + _0xb05920 : 'YOLO mode completed successfully';
      }
      ["convertErrorToString"](_0x2fab76) {
        if (_0x2fab76) return _0x2fab76 instanceof Error ? _0x2fab76.message : String(_0x2fab76);
      }
      ["getTaskChainID"]() {
        return this._phaseBreakdown.context.taskChain.id;
      }
      ["calculateStartingStep"](_0x47d003) {
        let _0x1292ef = this._phaseBreakdown.getTask(_0x47d003),
          _0x4eb10e = this._phaseBreakdown.getTaskExecutionConfig(_0x47d003);
        if (this.shouldStartFromPlan(_0x1292ef)) return _0x4eb10e?.['plan']?.['skipStep'] ? 'userQuery' : 'plan';
        if (this.shouldStartFromVerification(_0x1292ef, _0x4eb10e)) return 'verification';
        if (_0x4eb10e?.['plan']?.['skipStep']) return "userQuery";
      }
      ["isPlanStepComplete"](_0x10fe1b) {
        if (_0x10fe1b.steps.planGeneration === pe.SKIPPED) return true;
        if (_0x10fe1b.steps.planGeneration === pe.COMPLETED) {
          let _0x3bc67c = _0x10fe1b.activePlan;
          if (_0x3bc67c.planArtifactType === An.REVIEW_ARTIFACT) {
            let _0x11b762 = _0x3bc67c.mustGetReviewOutput().comments.filter(_0x1bf731 => _0x1bf731.isApplied === false),
              _0x48f1e7 = this._phaseBreakdown.getTaskExecutionConfig(_0x10fe1b.id).review?.["reviewCategories"] ?? [];
            return _0x48f1e7.length > 0 && (_0x11b762 = _0x11b762.filter(_0x4c5200 => _0x48f1e7.includes(_0x4c5200.category))), _0x11b762.length === 0;
          }
          if (_0x3bc67c.planArtifactType === An.IMPLEMENTATION_ARTIFACT) return _0x3bc67c.isExecuted;
        }
        return false;
      }
      ["isVerificationStepComplete"](_0x3f412d, _0x42e560) {
        return _0x3f412d.steps.verification === pe.SKIPPED || _0x42e560.verification?.["skipStep"] === true ? true : _0x3f412d.steps.verification === pe.COMPLETED ? !this.hasUnappliedVerificationComments(_0x3f412d) : false;
      }
      ["shouldStartFromPlan"](_0x489cce) {
        return !this.isPlanStepComplete(_0x489cce);
      }
      ['shouldStartFromVerification'](_0xb795db, _0x1ce4a9) {
        return !this.isPlanStepComplete(_0xb795db) || _0xb795db.activePlan.planArtifactType !== An.IMPLEMENTATION_ARTIFACT ? false : !this.isVerificationStepComplete(_0xb795db, _0x1ce4a9);
      }
      ["hasUnappliedVerificationComments"](_0x6c7004) {
        if (!_0x6c7004.verification || !_0x6c7004.verification.verificationOutput) return false;
        let _0x14feda = this._phaseBreakdown.getTaskExecutionConfig(_0x6c7004.id);
        return _0x6c7004.verification.verificationOutput.allComments.filter(_0x37357c => _0x37357c.comment.isApplied === false && _0x14feda.verification.verificationSeverities.includes(_0x37357c.comment.severity)).length > 0;
      }
    };
  }),
  g0,
  initPlanConversationHandler = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initUserQueryMessage(), initPlanOutputModule(), g0 = class _0x56cba7 extends UserQueryMessage {
      constructor(_0x183799, _0x1dff0d, _0x41adfb, _0x297ec9 = {}) {
        let _0x2b958b = _0x297ec9.state === pe.IN_PROGRESS,
          _0x170416 = _0x297ec9.state === pe.ABORTING,
          _0x56125c = _0x297ec9.state === pe.FAILED;
        super(_0x1dff0d, _0x297ec9.output ?? null, _0x41adfb, _0x297ec9.logs ?? [], _0x2b958b, _0x170416, _0x56125c, _0x297ec9.id ?? Ut()), this._phaseConversationStorageAdapter = _0x183799, this._abortController = _0x297ec9.abortController ?? new AbortController(), this._state = _0x297ec9.state ?? pe.NOT_STARTED, this._retryAfterTimestamp = _0x297ec9.retryAfterTimestamp, this._creationTime = _0x297ec9.creationTime ?? Date.now(), this._lastUpdatedTime = _0x297ec9.lastUpdatedTime ?? Date.now();
      }
      static async ['createNewInstance'](_0x1c566a, _0x19394c, _0x52c905, _0x43eb91, _0x3b90e8 = {}) {
        let _0xf2e71d = new _0x56cba7(_0x1c566a, _0x19394c, _0x52c905, _0x3b90e8);
        return await _0x43eb91({
          id: _0xf2e71d.id,
          userQuery: _0x19394c,
          llmInput: StorageSerializer.toStorage(_0x52c905),
          output: _0x3b90e8.output ?? null,
          state: pe.NOT_STARTED,
          logs: _0x3b90e8.logs ?? [],
          creationTime: _0xf2e71d._creationTime,
          lastUpdatedTime: _0xf2e71d._lastUpdatedTime,
          retryAfterTimestamp: void 0
        }), _0xf2e71d;
      }
      get ['storageAPI']() {
        return this._phaseConversationStorageAdapter;
      }
      async ['getUserQueryAndLLMInput']() {
        let _0x11a241 = await this.storageAPI.read(),
          _0x589771 = _0x11a241.userQuery,
          _0xa96f1 = StorageSerializer.fromStorage(_0x11a241.llmInput);
        return {
          userQuery: _0x589771,
          llmInput: _0xa96f1
        };
      }
      async ["getUserQuery"]() {
        return this._queryJSONContent ? this._queryJSONContent : (await this.storageAPI.read()).userQuery;
      }
      async ["setStepState"](_0x51fe5d) {
        this._state = _0x51fe5d, await this.upsertOnDisk(_0x45b099 => {
          _0x45b099.state = _0x51fe5d;
        });
      }
      async ["resetConversation"](_0x572c74) {
        this._state = pe.NOT_STARTED, this._payload = null, this._logs = [], await this.setUserQuery(_0x572c74, false), await this.upsertOnDisk(_0x1887f5 => {
          _0x1887f5.state = pe.NOT_STARTED, _0x1887f5.output = null, _0x1887f5.logs = [], _0x1887f5.userQuery = _0x572c74, _0x1887f5.llmInput = null;
        });
      }
      async ["setUserQuery"](_0x189f16, _0x48cfd5) {
        let {
          userQueryWithMentions: _0x2b4497,
          attachments: _0x2fd665
        } = parseUserQueryContent(_0x189f16, workspace_info.getInstance().getPlatform());
        if (this._queryWithMentions = _0x2b4497, !_0x2fd665.length || this._isStreaming ? this._queryJSONContent = _0x189f16 : this._queryJSONContent = null, _0x48cfd5) return this.upsertOnDisk(_0x5cb9e6 => {
          _0x5cb9e6.userQuery = _0x189f16;
        });
      }
      async ['getLLMInput']() {
        let _0x10d0bf = await this.storageAPI.read();
        return StorageSerializer.fromStorage(_0x10d0bf.llmInput);
      }
      async ["setLLMInput"](_0x225cf4) {
        return this.upsertOnDisk(_0x18dbd1 => {
          _0x18dbd1.llmInput = StorageSerializer.toStorage(_0x225cf4);
        });
      }
      async ["handlePhaseGenerationResponse"](_0x57b4d1) {
        let _0x153b54 = _0x57b4d1.output;
        this._payload = _0x153b54, this._isStreaming = false, this._state = pe.COMPLETED, this._queryJSONContent && (await this.setUserQuery(this._queryJSONContent, false)), await this.upsertOnDisk(_0x9e834e => {
          _0x9e834e.output = _0x153b54, _0x9e834e.llmInput = StorageSerializer.toStorage(_0x57b4d1.llmInput), _0x9e834e.state = pe.COMPLETED, _0x9e834e.lastUpdatedTime = Date.now(), _0x9e834e.logs = this._logs;
        });
      }
      get ["abortController"]() {
        return this._abortController;
      }
      set ['abortController'](_0x4091e6) {
        this._abortController = _0x4091e6;
      }
      get ["state"]() {
        return this._state;
      }
      get ['retryAfterTimestamp']() {
        return this._retryAfterTimestamp;
      }
      get ['creationTime']() {
        return this._creationTime;
      }
      get ["lastUpdatedTime"]() {
        return this._lastUpdatedTime;
      }
      async ['setLastUpdatedTime'](_0x1b989a, _0x5320b3) {
        this._lastUpdatedTime = _0x1b989a, _0x5320b3 && (await this.upsertOnDisk(_0x11d7c9 => {
          _0x11d7c9.lastUpdatedTime = _0x1b989a;
        }));
      }
      async ["abort"]() {
        this._abortController.abort(), this._state = pe.ABORTING, this._abortController = new AbortController(), await this.upsertOnDisk(_0x348ddb => {
          _0x348ddb.state = pe.ABORTED;
        });
      }
      async ['serializeToProto']() {
        let {
          userQuery: _0x272eda,
          llmInput: _0x386aeb
        } = await this.getUserQueryAndLLMInput();
        return {
          userPrompt: await parseAndEnrichUserQuery(_0x272eda),
          output: this.payload ? {
            output: this.payload,
            llmInput: _0x386aeb ?? null,
            isPayToRun: false
          } : null
        };
      }
      async ["saveInterviewAnswers"](_0x9a1e48) {
        await this.upsertOnDisk(_0x279467 => {
          _0x279467.interviewAnswers = _0x9a1e48;
        });
      }
      async ["serializeToUIHeavy"]() {
        let _0xd9027a = await this.storageAPI.read();
        return {
          id: this.id,
          userQuery: await this.getUserQuery(),
          output: this.payload ? {
            output: this.payload,
            llmInput: null,
            isPayToRun: false
          } : null,
          logs: this.logs,
          state: this.state,
          interviewAnswers: _0xd9027a.interviewAnswers ?? null
        };
      }
      static async ['deserializeFromStorage'](_0x175724, _0x135a6c) {
        return _0x175724.state === pe.IN_PROGRESS && (_0x175724.state = pe.FAILED), _0x175724.state === pe.ABORTING && (_0x175724.state = pe.ABORTED), new _0x56cba7(_0x135a6c, _0x175724.userQuery, StorageSerializer.fromStorage(_0x175724.llmInput), {
          creationTime: _0x175724.creationTime,
          lastUpdatedTime: _0x175724.lastUpdatedTime,
          output: _0x175724.output,
          abortController: new AbortController(),
          state: _0x175724.state,
          logs: _0x175724.logs,
          id: _0x175724.id,
          retryAfterTimestamp: _0x175724.retryAfterTimestamp
        });
      }
      async ["dispose"]() {
        await this.abort();
      }
      async ["upsertOnDisk"](_0x2f9c13) {
        return this._phaseConversationStorageAdapter.runInTransaction(async _0x133509 => {
          let _0x518b35 = await this.storageAPI.read();
          _0x2f9c13(_0x518b35), await this._phaseConversationStorageAdapter.upsert(_0x518b35, _0x133509);
        });
      }
    };
  });
function findReviewStepIndex(_0x22916f, _0x194d0a) {
  let _0x1c08db = _0x22916f.prePhaseConversations.findIndex(_0xe161ff => _0xe161ff.id === _0x194d0a);
  if (_0x1c08db === -1) throw new Error("Phase conversation storage API: Phase conversation with id " + _0x194d0a + " not found in phase breakdown.");
  return _0x1c08db;
}
function getReviewStepById(_0x52740b, _0x1dad8c) {
  let _0x364c06 = findReviewStepIndex(_0x52740b, _0x1dad8c);
  return _0x52740b.prePhaseConversations[_0x364c06];
}
function updateReviewStep(_0x3b602b, _0x2b9d05) {
  let _0x13be8e = findReviewStepIndex(_0x3b602b, _0x2b9d05.id);
  _0x3b602b.prePhaseConversations[_0x13be8e] = _0x2b9d05;
}
function deleteReviewStep(_0x4ad61d, _0x1767ed) {
  let _0x1eb69d = findReviewStepIndex(_0x4ad61d, _0x1767ed);
  _0x4ad61d.prePhaseConversations.splice(_0x1eb69d, 1);
}
var ZP = class {
    constructor(_0x4d17e0) {
      this.phaseBreakdownStorageAPI = _0x4d17e0;
    }
    async ["read"](_0x188d38) {
      let _0x7146a6 = await this.phaseBreakdownStorageAPI.read();
      return getReviewStepById(_0x7146a6, _0x188d38);
    }
    async ['upsert'](_0x516808, _0x285a10) {
      let _0x5c7c71 = await this.phaseBreakdownStorageAPI.read();
      updateReviewStep(_0x5c7c71, _0x516808), await this.phaseBreakdownStorageAPI.upsert(_0x5c7c71, _0x285a10);
    }
    async ["runInTransaction"](_0x32d418) {
      return this.phaseBreakdownStorageAPI.runInTransaction(_0x32d418);
    }
    async ['delete'](_0x12343c, _0x34f745) {
      let _0x4d3ec4 = await this.phaseBreakdownStorageAPI.read();
      deleteReviewStep(_0x4d3ec4, _0x12343c), await this.phaseBreakdownStorageAPI.upsert(_0x4d3ec4, _0x34f745);
    }
    ['getAdapter'](_0x37ec3d) {
      return new YW(this, _0x37ec3d);
    }
  },
  YW = class extends BaseStorage {},
  G_,
  initTaskOrchestrator = __esmModule(() => {
    'use strict';

    initIDEAgentManager(), initWorkspaceInfo(), initAnalytics(), initStatusBar(), initPlanContextModule(), initTemplateManager(), initTaskSettingsHandler(), initUsageInfoHandler(), initTaskContext(), initTaskPlan(), initTaskOrchestrator(), initPlanConversationHandler(), G_ = class _0x5c880e {
      constructor(_0x20483f = Ut(), _0x35286c = [], _0x528b0a = [], _0x79b5be, _0x395b29, _0x4cbcac, _0x2e734f, _0xbaa6e9) {
        this._taskExecutionConfig = void 0, this.yoloOrchestrator = null, this._id = _0x20483f, this._prePhaseConversations = _0x35286c, this._tasks = _0x528b0a, this.taskChainContext = _0x395b29, this.planGenerationService = _0x4cbcac, this.phaseGenerationService = _0x2e734f, this.verificationService = _0xbaa6e9, this._storageAPI = _0x79b5be, this._taskStorage = new TaskStepStorageAPI(_0x79b5be);
      }
      static async ["createNewInstance"](_0x2440c1, _0x52e649 = [], _0x5971a5 = [], _0x321f0e, _0x1bb397, _0x4f0aef, _0xb91ea7, _0x216d7c, _0x8b25e0) {
        let _0x530240 = new _0x5c880e(_0x2440c1, _0x52e649, _0x5971a5, _0x321f0e, _0x1bb397, _0x4f0aef, _0xb91ea7, _0x216d7c);
        return await _0x8b25e0({
          id: _0x530240.id,
          prePhaseConversations: [],
          tasks: [],
          activeTaskId: null,
          yoloModeState: null,
          taskExecutionConfig: void 0
        }), _0x530240;
      }
      get ["storageAPI"]() {
        return this._storageAPI;
      }
      get ['id']() {
        return this._id;
      }
      get ['prePhaseConversations']() {
        return this._prePhaseConversations;
      }
      get ['tasks']() {
        return this._tasks;
      }
      get ['taskStorage']() {
        return this._taskStorage;
      }
      get ['context']() {
        return this.taskChainContext;
      }
      get ['initialUserQuery']() {
        return this._prePhaseConversations.length ? this.prePhaseConversations[0]?.['queryWithMentions'] ?? '' : this._tasks.length ? this._tasks[0]?.["plans"][0]?.["queryWithMentions"] : this.lastPrePhaseConversation.queryWithMentions;
      }
      ["getActiveTaskId"]() {
        for (let _0x12878e = 0; _0x12878e < this._tasks.length; _0x12878e++) {
          let _0x3a9126 = this._tasks[_0x12878e];
          if (_0x3a9126.isAllStepsCompleted()) continue;
          if (_0x12878e === this._tasks.length - 1) return _0x3a9126.id;
          if (!(this._tasks.findLastIndex(_0x20c197 => !_0x20c197.isNotStarted()) > _0x12878e)) return _0x3a9126.id;
        }
        let _0x2ccf8c = this._tasks[this._tasks.length - 1];
        if (!_0x2ccf8c) throw new ActiveTaskNotFoundError();
        return _0x2ccf8c.id;
      }
      async ['upsertToDisk'](_0x2f2db1) {
        return this.storageAPI.runInTransaction(async _0x4fc017 => {
          let _0x4c6b1a = await this.storageAPI.read();
          _0x2f2db1(_0x4c6b1a), await this.storageAPI.upsert(_0x4c6b1a, _0x4fc017);
        });
      }
      async ['getYoloArtifactInstructionForArtifactId'](_0x1ef299) {
        if ((await this.storageAPI.read()).yoloModeState?.['isRunning']) return 'After completing this task, create a file named `' + _0x1ef299 + ".json` with empty JSON content in the directory `~/.traycer/yolo_artifacts` to signal completion.";
      }
      async ['buildCombinedInstructions'](_0x53a2fb) {
        let _0x18027d = await this.getYoloArtifactInstructionForArtifactId(_0x53a2fb),
          _0x5751d0 = '';
        return _0x18027d && (_0x5751d0 += _0x18027d), _0x5751d0;
      }
      get ['activeTaskIndex']() {
        let _0x2d93fd = this.getActiveTaskId();
        return this._tasks.findIndex(_0x358be4 => _0x358be4.id === _0x2d93fd);
      }
      get ['activeTaskIndexIfExists']() {
        try {
          return this.activeTaskIndex;
        } catch (_0x515bb4) {
          if (_0x515bb4 instanceof ActiveTaskNotFoundError) return;
          throw _0x515bb4;
        }
      }
      get ["activeTaskIfExists"]() {
        try {
          return this.activeTask;
        } catch (_0x10261c) {
          if (_0x10261c instanceof ActiveTaskNotFoundError) return;
          throw _0x10261c;
        }
      }
      get ['activeTask']() {
        let _0x206b02 = this.getActiveTaskId();
        return this.getTask(_0x206b02);
      }
      get ["lastUpdatedTime"]() {
        return this._tasks.length ? this.activeTask.lastUpdatedTime : this.phaseGenerationService.getLastPrePhaseConversation(this._prePhaseConversations).lastUpdatedTime;
      }
      get ['lastPrePhaseConversation']() {
        return this.phaseGenerationService.getLastPrePhaseConversation(this._prePhaseConversations);
      }
      ['getTaskExecutionConfig'](_0x1ca561) {
        let _0x583c14 = this._taskExecutionConfig?.[_0x1ca561];
        return _0x583c14 || Vt.getInstance().defaultTaskExecutionConfig;
      }
      ['getTaskMetricsProperties'](_0x1703e1) {
        return {
          defaultProperties: {
            queryWithMentions: _0x1703e1,
            isChainedTask: this._tasks.length > 1,
            isPrePhase: false
          },
          userProperties: {}
        };
      }
      async ['startYoloMode'](_0x5eece8) {
        try {
          (this.yoloOrchestrator === null || !this.yoloOrchestrator.isInitialized) && (await YoloArtifactManager.getInstance().initialize(), this.yoloOrchestrator = await TaskOrchestrator.init(this, _0x5eece8)), this.yoloOrchestrator.taskIds = _0x5eece8, this.yoloOrchestrator.once("yolo:error", async ({
            error: _0x141eed
          }) => {
            await this.stopYoloModeOnError(_0x141eed);
          }), await this.yoloOrchestrator.startYoloMode();
        } catch (_0xb0e7cb) {
          throw Logger.error(_0xb0e7cb, "YOLO mode error from direct exception"), await this.stopYoloModeOnError(_0xb0e7cb), _0xb0e7cb;
        }
      }
      async ['stopWaitingForExecution'](_0x96196e, _0x61b22e) {
        let _0x2faf2b = this.getTask(_0x96196e.taskID);
        switch (_0x61b22e) {
          case 'planGeneration':
            await YoloArtifactManager.getInstance().stopWatching(_0x96196e.planID), await _0x2faf2b.activePlan.setExecutedWithAgent(null);
            break;
          case "verification":
            if (!_0x2faf2b.verification?.['id']) throw new Error('Can not stop waiting for verification if verification ID is not set');
            await YoloArtifactManager.getInstance().stopWatching(_0x2faf2b.verification.id);
            break;
          case 'userQuery':
            await YoloArtifactManager.getInstance().stopWatching(_0x96196e.taskID), await _0x2faf2b.setStepState("planGeneration", pe.NOT_STARTED);
            break;
          default:
            throw new Error('Invalid step: ' + _0x61b22e);
        }
      }
      async ["stopYoloMode"](_0x303afb) {
        if (this.yoloOrchestrator === null) return;
        let _0x142c01 = _0x303afb ? "error" : 'user_stopped';
        await this.yoloOrchestrator.stopYoloMode(_0x142c01, _0x303afb), this.yoloOrchestrator = null, await this.upsertToDisk(_0x5388c1 => {
          _0x5388c1.yoloModeState = null;
        });
      }
      async ["getYoloModeState"]() {
        return (await this.storageAPI.read()).yoloModeState || null;
      }
      ['isYoloModeRunning']() {
        return this.yoloOrchestrator !== null && this.yoloOrchestrator.isYoloModeRunning();
      }
      async ["stopYoloModeOnError"](_0x28b860) {
        this.isYoloModeRunning() && (await this.stopYoloMode(_0x28b860));
      }
      async ['setTaskExecutionConfig'](_0x1a463e, _0x551802) {
        this._taskExecutionConfig = {
          ...(this._taskExecutionConfig ?? {}),
          [_0x1a463e]: structuredClone(_0x551802)
        }, await this.upsertToDisk(_0x494a41 => {
          _0x494a41.taskExecutionConfig = this._taskExecutionConfig;
        });
      }
      async ["validateAndFixupAgentReferences"]() {
        let _0x4d4ca6 = false,
          _0x3202eb = AgentRegistry.getInstance(),
          _0xef9dc2 = _0x3202eb.getBuiltInCLIAgents(),
          _0x44fad3 = _0xef9dc2.length > 0 ? _0xef9dc2[0] : getAgentIcon("claude-code");
        if (!this._taskExecutionConfig) return false;
        let _0x417647 = _0x59a3ca => _0x3202eb.getAgent(_0x59a3ca.id) ? _0x59a3ca : (_0x4d4ca6 = true, _0x44fad3);
        for (let key in this._taskExecutionConfig) {
          let _0x2407c7 = this._taskExecutionConfig[key];
          _0x2407c7 && (_0x2407c7.plan.ideAgent && (_0x2407c7.plan.ideAgent = _0x417647(_0x2407c7.plan.ideAgent)), _0x2407c7.review.ideAgent && (_0x2407c7.review.ideAgent = _0x417647(_0x2407c7.review.ideAgent)), _0x2407c7.verification.ideAgent && (_0x2407c7.verification.ideAgent = _0x417647(_0x2407c7.verification.ideAgent)), _0x2407c7.userQuery.ideAgent && (_0x2407c7.userQuery.ideAgent = _0x417647(_0x2407c7.userQuery.ideAgent)));
        }
        return _0x4d4ca6 && (await this.upsertToDisk(_0x56ec24 => {
          _0x56ec24.taskExecutionConfig = this._taskExecutionConfig;
        }), this.yoloOrchestrator?.['isRunning'] && this.stopYoloModeOnError(new Error("The configured agents are no longer available"))), _0x4d4ca6;
      }
      async ['dispose']() {
        this.yoloOrchestrator !== null && (await this.stopYoloMode()), await Promise.all(this._prePhaseConversations.map(async _0x23fcb2 => {
          await _0x23fcb2.abort();
        })), this._prePhaseConversations = [], await Promise.all(this._tasks.map(async _0x32ac53 => {
          await _0x32ac53.dispose();
        })), this._tasks = [];
      }
      async ['generatePlan'](_0x137b8c, _0x24daaf, _0x30e525, _0x3309e3, _0x10dd6f, _0x4b6b0c = false, _0x239115, _0x2d762f, _0x242e09) {
        let _0x5a9402 = new AbortController(),
          _0x54270b = await this.addTask(_0x137b8c, _0x5a9402, _0x3309e3),
          _0x3b3aa9 = this.getTask(_0x137b8c.taskID);
        try {
          _0x54270b ? await _0x3b3aa9.resetPlan(_0x137b8c, _0x3309e3, _0x10dd6f) : await this.addNewPlan(_0x137b8c, _0x3309e3, _0x10dd6f, null), await this.planGenerationService.generatePlan(_0x137b8c, _0x3b3aa9, this._tasks, _0x24daaf, _0x3309e3, _0x30e525, _0x10dd6f, this.getTaskMetricsProperties.bind(this), _0x2d762f, this.setStepState.bind(this), _0x239115, _0x4b6b0c, _0x242e09);
        } catch (_0x1cb029) {
          throw await this.stopYoloModeOnError(_0x1cb029), _0x1cb029 instanceof RateLimitExceededError ? (await this.setStepState(_0x3b3aa9.id, "planGeneration", pe.RATE_LIMITED), await this.handleRateLimitExceedError(_0x3b3aa9, 'task_plan_generation_rate_limited', _0x1cb029), new PlanGenerationFailedError(String(_0x1cb029))) : _0x1cb029;
        }
      }
      async ["executeInIDE"](_0x71645b, _0x3848e2, _0x1044d7) {
        let _0x4fd79a = _0x71645b.phaseBreakdownIdentifier;
        if (!_0x4fd79a) throw new Error('Phase breakdown identifier is required');
        let _0xd825ef = this.getTask(_0x71645b.taskID),
          _0x4efcd8 = _0xd825ef.getPlan(_0x71645b.planID),
          _0x18d89f = _0xd825ef.plans.findIndex(_0x2d21cb => _0x2d21cb.id === _0x4efcd8.id),
          _0x4993f3 = _0x4efcd8.isQueryExecutedDirectly ? 'Handoff Query : ' + _0xd825ef.title : "Plan v" + (_0x18d89f + 1) + " : " + _0xd825ef.title,
          _0xc0bf3c = await br.getInstance().getPromptTemplate(_0x1044d7).applyTemplate(_0x4efcd8),
          _0x55c404 = _0x4efcd8.id,
          _0x556007 = await this.buildCombinedInstructions(_0x55c404);
        _0x556007 && (_0xc0bf3c += '\x0a\x0a' + _0x556007);
        let _0x23264b = {
          taskId: _0xd825ef.id,
          taskChainId: _0x4fd79a.taskChainID,
          phaseBreakdownId: this.id
        };
        await debounce(_0xc0bf3c, _0x4993f3, _0x3848e2, _0x23264b), yn.getInstance().increment('execute_in_ide', {
          defaultProperties: {
            agent: _0x3848e2.id
          },
          userProperties: {}
        }), await _0x4efcd8.setExecutedWithAgent(_0x3848e2.id), isUtilityAgent(_0x3848e2) || (await _0xd825ef.resetVerification());
      }
      async ["executeQueryDirectlyInIDE"](_0x3ed317, _0x404f0a, _0x1552b1, _0x4abf9c, _0x4d3b73) {
        let _0xb057ad = _0x3ed317.phaseBreakdownIdentifier;
        if (!_0xb057ad) throw new Error("Phase breakdown identifier is required");
        let _0xae98ae = this.getTask(_0x3ed317.taskID),
          _0x36b010 = _0xae98ae.getPlan(_0x3ed317.planID);
        await _0x36b010.setQueryJSONContentAndArtifactType(_0x4abf9c, _0x4d3b73, true);
        let {
            userQuery: _0xefbf26
          } = parseUserQueryContent(_0x4abf9c, workspace_info.getInstance().getPlatform()),
          _0x3c8c12 = "Handoff Query : " + _0xae98ae.title,
          _0xaa2f57 = await br.getInstance().getPromptTemplate(_0x1552b1).applyTemplate(_0xefbf26);
        if (this.isYoloModeRunning()) {
          let _0x119397 = await this.buildCombinedInstructions(_0x36b010.id);
          _0x119397 && (_0xaa2f57 += '\x0a\x0a' + _0x119397);
        }
        let _0x1880b9 = {
          taskId: _0xae98ae.id,
          taskChainId: _0xb057ad.taskChainID,
          phaseBreakdownId: this.id
        };
        await debounce(_0xaa2f57, _0x3c8c12, _0x404f0a, _0x1880b9), yn.getInstance().increment("user_query_executed_in_ide", {
          defaultProperties: {
            agent: _0x404f0a.id
          },
          userProperties: {}
        }), await _0x36b010.setExecutedWithAgent(_0x404f0a.id), isUtilityAgent(_0x404f0a) || (await _0xae98ae.resetVerification()), await this.setStepState(_0xae98ae.id, 'planGeneration', pe.SKIPPED), await _0x36b010.setQueryExecutedDirectly(true);
      }
      async ["startTaskVerification"](_0xad7639, _0x3b1298, _0x4ebdef, _0x2244dc, _0x59a656, _0x12b8b8) {
        let _0x5b2036 = this.getTask(_0xad7639.taskID);
        try {
          await this.verificationService.startTaskVerification(_0xad7639, _0x5b2036, this._tasks, _0x4ebdef, this.setStepState.bind(this), _0x59a656, _0x2244dc, _0x3b1298, _0x12b8b8);
        } catch (_0x1f69cd) {
          throw await this.stopYoloModeOnError(_0x1f69cd), _0x1f69cd instanceof RateLimitExceededError ? (await this.setStepState(_0x5b2036.id, 'verification', pe.RATE_LIMITED), await this.handleRateLimitExceedError(_0x5b2036, "task_verification_rate_limited", _0x1f69cd), new VerificationFailedError(String(_0x1f69cd))) : _0x1f69cd;
        }
      }
      async ["reVerifyTask"](_0x1b1ccf, _0xbe5355, _0x1c280b, _0x407a49) {
        let _0x2117b0 = this.getTask(_0x1b1ccf.taskID);
        try {
          await this.verificationService.reVerifyTask(_0x1b1ccf, _0x2117b0, this._tasks, _0xbe5355, this.setStepState.bind(this), _0x1c280b, _0x407a49);
        } catch (_0x5a1b3b) {
          throw await this.stopYoloModeOnError(_0x5a1b3b), _0x5a1b3b;
        }
      }
      async ["planIteration"](_0x200be1, _0x393485, _0x11f0c9, _0x5cf1cc, _0x50f0e0, _0x30f0f2, _0x15b12a) {
        let _0x40242f = this.getTask(_0x200be1.taskID),
          _0x15cc29 = this.tasks.findIndex(_0xacfa7 => _0xacfa7.id === _0x40242f.id);
        await this.planGenerationService.planIteration(_0x200be1, _0x40242f, this._tasks, _0x15cc29, _0x11f0c9, _0x393485, this.getTaskMetricsProperties.bind(this), _0x50f0e0, this.setStepState.bind(this), _0x5cf1cc, _0x30f0f2, _0x15b12a);
      }
      async ['generatePhases'](_0x3fdab7, _0x254408, _0x1d9c31, _0x4a9c71, _0x86a5df, _0x1ca578, _0x38cf25, _0x122a0a, _0x3e1dbe, _0x5d16c3) {
        await this.processPhases((_0x4a6ce2, _0x511c2a) => this.phaseGenerationService.generatePhases(_0x3fdab7, _0x4a6ce2, _0x4a9c71, _0x1d9c31, _0x511c2a, _0x86a5df, _0x254408, _0x1ca578, _0x3e1dbe, _0x5d16c3), _0x4a9c71, _0x254408, this._tasks, _0x3fdab7, _0x1ca578, _0x122a0a, _0x38cf25);
      }
      async ['iteratePhases'](_0x594dfc, _0xc0acee, _0x1dafd0, _0x707928, _0x5024bb, _0x505b15, _0x7ffa01, _0x2b5776, _0x588f5e, _0x92405e, _0x5e576e, _0x16d472) {
        await this.processPhases((_0x1cc889, _0x12d552) => this.phaseGenerationService.iteratePhases(_0x594dfc, _0x1cc889, _0x707928, _0x1dafd0, _0x12d552, _0x5024bb, _0x7ffa01, _0xc0acee, _0x2b5776, _0x5e576e, _0x16d472), _0x707928, _0xc0acee, _0x505b15, _0x594dfc, _0x2b5776, _0x92405e, _0x588f5e);
      }
      async ["serializeToProto"](_0x528239) {
        return {
          livePhases: await Promise.all(this._tasks.map(_0x388dfc => _0x388dfc.serializeToLivePhase())),
          phaseBreakdownContext: _0x528239 ? await this.gatherPhaseBreakdownContext(this._tasks) : null,
          phaseBreakdownConversation: await this.serializeConversationToProto(),
          phaseBreakdownID: this._id
        };
      }
      async ['serializeConversationToProto']() {
        if (this._prePhaseConversations.length === 0) {
          if (this._tasks.length > 0) {
            let _0x25adab = {
              reasoning: '',
              phases: await Promise.all(this._tasks.map(async _0x180664 => {
                let _0x37d6b7 = await _0x180664.getInitialUserQueryJSONContent(),
                  {
                    userQueryWithMentions: _0x197a32,
                    sourceContext: _0x2a93fe
                  } = await parseAndFormatUserQuery(_0x37d6b7, workspace_info.getInstance().getPlatform());
                return {
                  id: _0x180664.id,
                  title: _0x180664.title,
                  query: _0x197a32,
                  referredFiles: _0x2a93fe.files.map(_0x27dd22 => _0x27dd22.path).filter(_0x5b3187 => _0x5b3187 !== null),
                  referredFolders: _0x2a93fe.directories.map(_0x5eb087 => _0x5eb087.path).filter(_0x4c1ab3 => _0x4c1ab3 !== null),
                  status: jm.NEW_PHASE,
                  reasoning: '',
                  phaseSize: $c.ISSUE,
                  planArtifactType: _0x180664.activePlan.planArtifactType
                };
              }))
            };
            return [{
              userPrompt: {
                query: this._tasks[0].plans[0].queryWithMentions,
                context: null
              },
              output: {
                output: {
                  markdown: '',
                  phaseOutput: _0x25adab
                },
                llmInput: null,
                isPayToRun: false
              }
            }];
          }
          throw new Error('No pre-phase conversations and no tasks');
        }
        return await Promise.all(this._prePhaseConversations.map(_0x28edd2 => _0x28edd2.serializeToProto()));
      }
      async ["gatherPhaseBreakdownContext"](_0xa7a0a8) {
        let _0x4f443e = new CustomSet((_0x211e4d, _0x1b36aa) => TraycerPath.equals(TraycerPath.fromPathProto(_0x211e4d), TraycerPath.fromPathProto(_0x1b36aa))),
          _0xdcd340 = new CustomSet((_0x401e43, _0x9c9efb) => TraycerPath.equals(TraycerPath.fromPathProto(_0x401e43), TraycerPath.fromPathProto(_0x9c9efb))),
          _0x50247f = _0xa7a0a8.map(async _0x3b9f5f => {
            try {
              let _0x1cd5c6 = await _0x3b9f5f.getInitialUserQueryJSONContent(),
                {
                  sourceContext: _0x334dac
                } = parseUserQueryContent(_0x1cd5c6, workspace_info.getInstance().getPlatform());
              return {
                sourceContext: _0x334dac
              };
            } catch (_0x2f413b) {
              return Logger.debug("Failed to parse query content for task " + _0x3b9f5f.id + ': ' + _0x2f413b), null;
            }
          }),
          _0x41364f = (await Promise.all(_0x50247f)).filter(_0x5a0aa3 => _0x5a0aa3 !== null);
        for (let _0x3e4d15 of _0x41364f) if (_0x3e4d15.sourceContext) {
          if (_0x3e4d15.sourceContext.files) {
            for (let _0x3099ff of _0x3e4d15.sourceContext.files) _0x3099ff.path && _0x4f443e.add(_0x3099ff.path);
          }
          if (_0x3e4d15.sourceContext.directories) {
            for (let _0x21e6a1 of _0x3e4d15.sourceContext.directories) _0x21e6a1.path && _0xdcd340.add(_0x21e6a1.path);
          }
        }
        let _0x575f55 = {
          files: _0x4f443e.values().map(_0x57cdcc => ({
            path: _0x57cdcc,
            content: '',
            range: null,
            diagnostics: []
          })),
          directories: _0xdcd340.values().map(_0xf02b25 => ({
            path: _0xf02b25,
            filePaths: [],
            subDirectories: []
          })),
          detectedRuleFiles: []
        };
        return await enrichFilesContext(_0x575f55);
      }
      async ['addTaskFromReference'](_0x2b6f58) {
        this._tasks.push(_0x2b6f58), await this.upsertToDisk(_0x154160 => {
          _0x154160.tasks.push({
            id: _0x2b6f58.id,
            isReferred: true,
            plans: [],
            verification: null,
            attachmentSummaries: [],
            steps: _0x2b6f58.steps,
            creationTime: _0x2b6f58.creationTimestamp,
            lastUpdated: _0x2b6f58.lastUpdatedTime,
            title: _0x2b6f58.title,
            activePlanId: _0x2b6f58.activePlanId,
            hasSentCreationMetrics: false,
            discardedVerificationComments: [],
            failedPlanIterationQuery: void 0
          }), _0x154160.activeTaskId = _0x2b6f58.id;
        });
      }
      async ['addTaskFromPhaseOutput'](_0xc6ae4d, _0x631822) {
        let _0x454262 = {
            phaseBreakdownIdentifier: {
              taskChainID: _0x631822.taskChainID,
              phaseBreakdownID: this.id
            },
            taskID: Ut(),
            planID: Ut()
          },
          _0x18d97d = async _0x19d9d2 => {
            await this.upsertToDisk(_0x487f69 => {
              _0x487f69.tasks.push(_0x19d9d2), _0x487f69.activeTaskId = _0x19d9d2.id;
            });
          },
          _0x493c12 = await qa.fromPhaseOutput(_0xc6ae4d, _0x454262.taskID, _0x454262.planID, new TaskStepStorageAPI(this._storageAPI), _0x18d97d);
        this._tasks.push(_0x493c12);
        let _0x35fea8 = parseMarkdownToDoc(_0xc6ae4d.query);
        if (_0xc6ae4d.referredFiles) {
          let _0x4224cd = await qa.convertPathsToJSONContentMentions(_0xc6ae4d.referredFiles || [], _0xc6ae4d.referredFolders || []);
          _0x4224cd.length > 0 && (_0x35fea8 = spliceIntoDocContent(_0x35fea8, _0x4224cd));
        }
        return await this.addNewPlan(_0x454262, _0x35fea8, _0xc6ae4d.planArtifactType, null), _0x493c12;
      }
      async ["processPhases"](_0x3de9e6, _0x511531, _0x1999dd, _0x27f0c6, _0x2b3e4a, _0x2de7d7, _0x221e9c, _0x26b61e) {
        let _0x422646 = await Promise.all(this._prePhaseConversations.map(_0x179ea9 => _0x179ea9.serializeToProto())),
          {
            isExisting: _0x21b27d,
            conversation: _0x26710c
          } = await this.addPrePhaseConversation(_0x2b3e4a, _0x511531, new AbortController()),
          _0x1a4344 = '';
        try {
          let {
            userQueryWithMentions: _0x193bfe
          } = await parseAndFormatUserQuery(_0x511531, workspace_info.getInstance().getPlatform());
          _0x1a4344 = _0x193bfe, _0x21b27d || yn.getInstance().increment("phase_generation", {
            ...this.getTaskMetricsProperties(_0x193bfe)
          });
          let _0x41edbc = await _0x3de9e6(_0x26710c, _0x422646);
          for (let _0x5a7ce2 of _0x41edbc.output?.["phaseOutput"]?.["phases"] ?? []) {
            _0x41edbc.updatedDisplayState = 'SHOW_PHASES';
            let _0x5c4245 = _0x2b3e4a.phaseBreakdownIdentifier;
            if (!_0x5c4245) throw new Error('Phase breakdown identifier is required');
            switch (_0x5a7ce2.status) {
              case jm.NEW_PHASE:
              case jm.MODIFIED_PHASE:
                await this.addTaskFromPhaseOutput(_0x5a7ce2, _0x5c4245);
                break;
              case jm.UNCHANGED_PHASE:
                {
                  let _0x412ade = _0x27f0c6.find(_0x279832 => _0x279832.id === _0x5a7ce2.id);
                  if (_0x412ade?.["isNotStarted"]()) await this.addTaskFromPhaseOutput(_0x5a7ce2, _0x5c4245);else {
                    if (_0x412ade) await this.addTaskFromReference(_0x412ade);else throw new Error('Task with id ' + _0x5a7ce2.id + ' not found and cannot be created');
                  }
                  break;
                }
              default:
                throw new Error('Unknown phase status: ' + _0x5a7ce2.status);
            }
          }
          await _0x221e9c(_0x41edbc.updatedDisplayState);
        } catch (_0x2ed926) {
          throw Logger.warn('Failed to generate task breakdown', _0x2ed926), _0x2ed926 instanceof RateLimitExceededError ? (await this.lastPrePhaseConversation.setStepState(pe.RATE_LIMITED), await this.handleRateLimitExceedError(this.lastPrePhaseConversation, 'phase_generation_rate_limited', _0x2ed926), new PhaseBreakdownFailedError(String(_0x2ed926))) : (_0x2ed926 instanceof UserAbortedError || isAbortError(_0x2ed926) ? await _0x26710c.setStepState(pe.ABORTED) : (await _0x26710c.setStepState(pe.FAILED), await _0x26b61e("Failed to generate task breakdown for \"" + (_0x1999dd || _0x1a4344) + "\" due to \"" + _0x2ed926 + '\x22')), new PhaseBreakdownFailedError(String(_0x2ed926)));
        }
      }
      async ['addPrePhaseConversation'](_0x1993f6, _0x56b5d3, _0x5813be) {
        let {
            conversationID: _0x4c3ed9
          } = _0x1993f6,
          _0x2114cc = this._prePhaseConversations.find(_0x623c78 => _0x623c78.id === _0x4c3ed9);
        if (_0x2114cc) return _0x2114cc.abortController = _0x5813be, await _0x2114cc.resetConversation(_0x56b5d3), {
          conversation: _0x2114cc,
          isExisting: true
        };
        {
          let _0xc704c = new ConversationStorage(this._storageAPI, this.id),
            _0x12b163 = new ZP(_0xc704c).getAdapter(_0x4c3ed9),
            _0x318ba3 = async _0x221b43 => {
              await this.upsertToDisk(_0x39becd => {
                _0x39becd.prePhaseConversations.push(_0x221b43);
              });
            },
            _0x13ff7 = Date.now(),
            _0x3d9c9a = await g0.createNewInstance(_0x12b163, _0x56b5d3, null, _0x318ba3, {
              id: _0x4c3ed9,
              creationTime: _0x13ff7,
              lastUpdatedTime: _0x13ff7,
              output: void 0,
              abortController: _0x5813be,
              state: pe.NOT_STARTED,
              logs: []
            });
          return this._prePhaseConversations.push(_0x3d9c9a), {
            conversation: _0x3d9c9a,
            isExisting: false
          };
        }
      }
      async ["addNewPlan"](_0x3fc8fc, _0x2866fc, _0x4532f4, _0x46d59a) {
        return this.getTask(_0x3fc8fc.taskID).addNewPlan(_0x2866fc, _0x3fc8fc.planID, _0x4532f4, _0x46d59a);
      }
      async ['executeVerificationCommentsInIDE'](_0x274d6d, _0x300d6e, _0x2398e3, _0x57e04f, _0x22348e) {
        let _0x545faf = this.getTask(_0x274d6d.taskID),
          _0x1860c6 = _0x545faf.verification;
        if (!_0x1860c6) throw new Error("Verification not found for task");
        let _0x39e3e1 = _0x1860c6.id,
          _0x4f251a = await this.buildCombinedInstructions(_0x39e3e1),
          _0xca3925 = _0x274d6d.phaseBreakdownIdentifier;
        if (!_0xca3925) throw new Error('Phase breakdown identifier is required');
        let _0x4c9fda = {
          taskId: _0x545faf.id,
          taskChainId: _0xca3925.taskChainID,
          phaseBreakdownId: this.id
        };
        await _0x1860c6.triggerExecuteInIDE(_0x545faf.title, _0x300d6e, _0x2398e3, _0x57e04f, _0x4c9fda, _0x4f251a), await _0x22348e(false);
      }
      async ['executeAllVerificationCommentsInIDE'](_0x5c55de, _0x56eb92, _0x4e9b64, _0x347295, _0x127bb6) {
        let _0x10f000 = this.getTask(_0x5c55de.taskID),
          _0x1770ba = _0x10f000.verification;
        if (!_0x1770ba) throw new Error("Verification not found for task");
        let _0x294f6c = _0x1770ba.id,
          _0x470a4d = await this.buildCombinedInstructions(_0x294f6c),
          _0x33eae8 = _0x5c55de.phaseBreakdownIdentifier;
        if (!_0x33eae8) throw new Error("Phase breakdown identifier is required");
        let _0x3c6119 = {
          taskId: _0x10f000.id,
          taskChainId: _0x33eae8.taskChainID,
          phaseBreakdownId: this.id
        };
        await _0x1770ba.executeAllVerificationCommentsInIDE(_0x10f000.title, _0x56eb92, _0x4e9b64, _0x3c6119, _0x470a4d, _0x347295), await _0x127bb6(false);
      }
      async ["addNewPlanConversation"](_0x4111a0, _0x2c4974) {
        await this.getTask(_0x4111a0.taskID).startNewPlanConversation(_0x4111a0.planID, _0x2c4974);
      }
      async ['abortPrePhase']() {
        await this.lastPrePhaseConversation.abort();
      }
      async ["markPlanAsActive"](_0x23d1fb, _0x221cd6 = true) {
        await this.getTask(_0x23d1fb.taskID).markPlanAsActive(_0x23d1fb.planID, _0x221cd6);
      }
      async ["handlePlanChatQueryType"](_0x42ffb6, _0x218343, _0x983e8c, _0xb95832) {
        let _0x58fcf3 = this.getTask(_0x42ffb6.taskID);
        await this.planGenerationService.handlePlanChatQueryType(_0x42ffb6, _0x218343, _0x983e8c, _0x58fcf3, this.addNewPlan.bind(this), this.addNewPlanConversation.bind(this), this.setStepState.bind(this)), await _0xb95832(false);
      }
      async ['handleThinkingStream'](_0x8a362b, _0x562142) {
        if (_0x8a362b.phaseConversationIdentifier) {
          let _0x8d34 = this.getPrePhaseConversation(_0x8a362b.phaseConversationIdentifier.conversationID);
          _0x8d34.updateLog(_0x562142), await this.taskChainContext.uiAdapter.postToUIPrePhaseConversationThinking(_0x8a362b.phaseConversationIdentifier, _0x8d34.logs);
        } else {
          if (_0x8a362b.planIdentifier || _0x8a362b.planChatIdentifier) {
            let _0x530663 = _0x8a362b.planIdentifier || _0x8a362b.planChatIdentifier?.['planIdentifier'];
            if (!_0x530663) throw new Error("Plan identifier is required");
            let _0x4990a5 = this.getTask(_0x530663.taskID).updatePlanLog(_0x530663, _0x562142);
            await this.taskChainContext.uiAdapter.postToUIPlanThinking(_0x530663, _0x4990a5);
          } else {
            if (_0x8a362b.verificationIdentifier) {
              let _0xeb4f7d = this.getTask(_0x8a362b.verificationIdentifier.taskID).updateVerificationLog(_0x562142);
              await this.taskChainContext.uiAdapter.postToUIVerificationThinking(_0x8a362b.verificationIdentifier, _0xeb4f7d);
            } else throw new Error('Invalid artifact identifier');
          }
        }
      }
      async ['handleTaskPlan'](_0xc09948, _0x51270a) {
        let _0x3233e6 = this.getTask(_0xc09948.taskID);
        return this.planGenerationService.handleTaskPlan(_0xc09948, _0x51270a, null, _0x3233e6, this.setStepState.bind(this), void 0, pe.IN_PROGRESS);
      }
      async ["handleImplementationPlanDelta"](_0x1f7028, _0x4a47db) {
        return await this.getTask(_0x1f7028.taskID).getPlan(_0x1f7028.planID).handleImplementationPlanDelta(_0x4a47db);
      }
      async ['handleRateLimitExceedError'](_0x4bb51e, _0x57d347, _0x368b8a) {
        if (Xr.updateRateLimitTimestamp(_0x368b8a.retryAfter), this.taskChainContext.client.auth.traycerUser) {
          this.taskChainContext.client.auth.traycerUser.payAsYouGoUsage.allowPayAsYouGo = _0x368b8a.allowPayAsYouGo, _0x368b8a.invoiceUrl && (this.taskChainContext.client.auth.traycerUser.payAsYouGoUsage.meteredUsage ? this.taskChainContext.client.auth.traycerUser.payAsYouGoUsage.meteredUsage.invoiceUrl = _0x368b8a.invoiceUrl : (await this.taskChainContext.client.auth.refreshTraycerToken()) || this.taskChainContext.client.auth.handleDeactivation());
          let _0x393866 = new Gf(this.taskChainContext.client.auth);
          await _0x393866.handle({
            type: il.FETCH_SUBSCRIPTION
          });
          let _0xe4c86c = _0x393866.getSubscriptionMetrics();
          yn.getInstance().increment(_0x57d347, {
            defaultProperties: {
              isChainedTask: _0x4bb51e instanceof qa ? this._tasks.length > 1 : null,
              isPrePhase: _0x4bb51e instanceof g0 ? true : null,
              ..._0xe4c86c
            },
            userProperties: {}
          });
        }
      }
      async ['addTask'](_0x5b1497, _0x1bd98a, _0x211b17) {
        let _0x44af27 = _0x5b1497.taskID;
        if (this.tasks.find(_0x69771e => _0x69771e.id === _0x44af27)) return await this.getTask(_0x44af27).resetTask(_0x5b1497, _0x211b17), true;
        {
          let _0x4ec897 = this.taskStorage.getAdapter(_0x44af27),
            _0x257c6e = async _0x4a8207 => {
              await this.upsertToDisk(_0x314d44 => {
                _0x314d44.tasks.push(_0x4a8207), _0x314d44.activeTaskId = _0x4a8207.id;
              });
            },
            _0x4000e2 = await qa.createNewInstance({
              id: _0x44af27,
              activePlanID: _0x5b1497.planID,
              title: '',
              creationTime: Date.now(),
              lastUpdatedTime: Date.now(),
              steps: {
                userQuery: pe.COMPLETED,
                planGeneration: pe.NOT_STARTED,
                verification: pe.NOT_STARTED
              },
              plans: [],
              verification: null,
              attachmentSummaries: [],
              storageAPI: _0x4ec897,
              abortController: _0x1bd98a,
              discardedVerificationComments: [],
              upsertToDisk: _0x257c6e
            });
          this.tasks.push(_0x4000e2);
        }
        return false;
      }
      async ["insertTask"](_0x215cc0, _0x2953b6, _0x2a1d27, _0x3b11ad) {
        let _0x6c203d = this.taskStorage.getAdapter(_0x215cc0.taskID),
          _0x2c6c2c = {
            id: _0x215cc0.taskID,
            activePlanID: _0x215cc0.planID,
            title: '',
            creationTime: Date.now(),
            lastUpdatedTime: Date.now(),
            steps: {
              userQuery: pe.COMPLETED,
              planGeneration: pe.NOT_STARTED,
              verification: pe.NOT_STARTED
            },
            plans: [],
            verification: null,
            attachmentSummaries: [],
            storageAPI: _0x6c203d,
            abortController: new AbortController(),
            discardedVerificationComments: [],
            upsertToDisk: async _0x285191 => {
              await this.upsertToDisk(_0x193aad => {
                _0x193aad.tasks.push(_0x285191);
              });
            }
          },
          _0x566018;
        _0x3b11ad === this.tasks.length ? (_0x566018 = await qa.createNewInstance(_0x2c6c2c), this.tasks.push(_0x566018)) : (_0x2c6c2c.upsertToDisk = async _0x4e46da => {
          await this.upsertToDisk(_0x208b70 => {
            _0x208b70.tasks.splice(_0x3b11ad, 0, _0x4e46da);
          });
        }, _0x566018 = await qa.createNewInstance(_0x2c6c2c), this.tasks.splice(_0x3b11ad, 0, _0x566018));
        let _0x3dab0e = await _0x566018.addNewPlan(_0x2953b6, _0x215cc0.planID, _0x2a1d27, null);
        return {
          task: _0x566018,
          plan: _0x3dab0e
        };
      }
      async ['deleteTask'](_0x27432f) {
        let _0x21de12 = this.getTask(_0x27432f),
          _0x3c3603 = this._tasks.indexOf(_0x21de12);
        this._tasks.splice(_0x3c3603, 1), await _0x21de12.dispose(), await this.upsertToDisk(_0x391dc7 => {
          _0x391dc7.tasks.splice(_0x3c3603, 1);
        });
      }
      async ["discardVerificationComment"](_0x11776f, _0x25b376) {
        if (_0x25b376.length === 0) return;
        await this.getTask(_0x11776f).discardVerificationComment(_0x25b376);
      }
      async ["toggleVerificationCommentsApplied"](_0x20f6dc, _0x5822a4, _0xbb7fb0) {
        await this.getTask(_0x20f6dc.taskID).toggleVerificationCommentsApplied(_0x5822a4, _0xbb7fb0);
      }
      async ['executeReviewCommentsInIDE'](_0x226c43, _0x3cb898, _0x37f1d8, _0x1e3aa6) {
        let _0xfda5d4 = this.getTask(_0x226c43.taskID),
          _0x49e149 = _0x226c43.planID,
          _0xdd5be0 = await this.buildCombinedInstructions(_0x49e149);
        await _0xfda5d4.executeReviewCommentsInIDE(_0x226c43, _0x3cb898, _0x37f1d8, _0x1e3aa6, _0xdd5be0);
      }
      async ["executeAllReviewCommentsInIDE"](_0x5994e5, _0x295e35, _0x334867, _0x33fc27) {
        let _0x1f6031 = this.getTask(_0x5994e5.taskID),
          _0x491770 = _0x5994e5.planID,
          _0x47f02a = await this.buildCombinedInstructions(_0x491770);
        await _0x1f6031.executeAllReviewCommentsInIDE(_0x5994e5, _0x295e35, _0x334867, _0x33fc27, _0x47f02a);
      }
      ['discardReviewComment'](_0xb1b132, _0x20964f) {
        this.getTask(_0xb1b132.taskID).discardReviewComment(_0xb1b132, _0x20964f);
      }
      async ['toggleReviewCommentsApplied'](_0x5dedc1, _0x15ba15, _0x353d23) {
        await this.getTask(_0x5dedc1.taskID).toggleReviewCommentsApplied(_0x5dedc1, _0x15ba15, _0x353d23);
      }
      ["getTask"](_0x1202ee) {
        let _0x4747f1 = this._tasks.find(_0x18fa8a => _0x18fa8a.id === _0x1202ee);
        if (!_0x4747f1) throw new Error("Task " + _0x1202ee + " not found");
        return _0x4747f1;
      }
      async ["reorderTasks"](_0x33159a) {
        if (!_0x33159a.find(_0x20e662 => _0x20e662.isActive)) throw new ActiveTaskNotFoundError();
        let _0x58dfb1 = [];
        for (let key of _0x33159a) {
          let _0x4b9af3 = this._tasks.find(_0x4bff53 => _0x4bff53.id === key.id);
          _0x4b9af3 && _0x58dfb1.push(_0x4b9af3);
        }
        this._tasks = _0x58dfb1, await this.upsertToDisk(_0x4879c9 => {
          _0x4879c9.tasks = _0x58dfb1.map(_0x1b570a => {
            let _0xa17c2b = _0x4879c9.tasks.find(_0x30b283 => _0x30b283.id === _0x1b570a.id);
            if (!_0xa17c2b) throw new Error("Task with id " + _0x1b570a.id + ' not found');
            return _0xa17c2b;
          });
        });
      }
      async ['updateTaskQuery'](_0x73a0fa, _0x1137fc, _0xca40d3) {
        await this.getTask(_0x73a0fa.taskID).getPlan(_0x73a0fa.planID).updateQueryAndPlanArtifactType(_0x1137fc, _0xca40d3);
      }
      async ["abortTask"](_0x2df9b5) {
        await this.getTask(_0x2df9b5).abortTask(true);
      }
      ['getPrePhaseConversation'](_0x1767c8) {
        return this.phaseGenerationService.getPrePhaseConversation(_0x1767c8, this._prePhaseConversations);
      }
      async ["saveInterviewAnswers"](_0x168176, _0x256a6c) {
        await this.getPrePhaseConversation(_0x168176).saveInterviewAnswers(_0x256a6c);
      }
      async ["removePrePhaseConversationAndSubsequent"](_0x2fea5f) {
        let _0x5c4c6a = this._prePhaseConversations.findIndex(_0x6dd428 => _0x6dd428.id === _0x2fea5f);
        if (_0x5c4c6a === -1) throw new Error('Conversation with ID ' + _0x2fea5f + ' not found');
        let _0x4a85f0 = this._prePhaseConversations.splice(_0x5c4c6a);
        await Promise.all(_0x4a85f0.map(_0x531a42 => _0x531a42.dispose()));
        let _0x415e76 = _0x4a85f0.map(_0x218201 => _0x218201.id);
        await Promise.all(this._tasks.map(async _0x732e86 => {
          await _0x732e86.abortTask(false);
        })), this._tasks = [], await this.upsertToDisk(_0x9157e4 => {
          _0x9157e4.prePhaseConversations = _0x9157e4.prePhaseConversations.filter(_0x6dd505 => !_0x415e76.includes(_0x6dd505.id)), _0x9157e4.tasks = [];
        });
      }
      async ['deletePrePhaseConversationAndPreserveQuery'](_0x18bf44) {
        let {
            conversationID: _0x52df02
          } = _0x18bf44,
          _0x2a969b = this._prePhaseConversations.findIndex(_0x5ed1b5 => _0x5ed1b5.id === _0x52df02);
        if (_0x2a969b === -1) throw new Error('Conversation with ID ' + _0x52df02 + ' not found');
        let _0x29bfeb = await this._prePhaseConversations[_0x2a969b].getUserQuery();
        await this.removePrePhaseConversationAndSubsequent(_0x52df02), await this.addPrePhaseConversation(_0x18bf44, _0x29bfeb, new AbortController());
      }
      async ["editPrePhaseConversation"](_0x374eae) {
        await this.removePrePhaseConversationAndSubsequent(_0x374eae);
      }
      async ["setStepState"](_0x27af62, _0x21df3c, _0x585d0d) {
        await this.getTask(_0x27af62).setStepState(_0x21df3c, _0x585d0d);
      }
      async ["addNewVerification"](_0xca78a5) {
        return _0xca78a5.addNewVerification();
      }
      async ["serializeToUIHeavy"](_0x5708bb) {
        return {
          id: this._id,
          isActive: this._id === _0x5708bb,
          tasks: await Promise.all(this._tasks.map(_0x186737 => _0x186737.serializeToUIHeavy(this.getActiveTaskId()))),
          prePhaseConversations: await Promise.all(this._prePhaseConversations.map(_0x23fb2e => _0x23fb2e.serializeToUIHeavy())),
          taskExecutionConfig: this._taskExecutionConfig,
          yoloModeState: this.yoloOrchestrator?.["getYoloModeState"]() ?? void 0
        };
      }
      async ['resetReverificationState'](_0x2cfe43) {
        await this.getTask(_0x2cfe43).resetReverificationState();
      }
      ["getActivePrePhaseConversationLight"]() {
        return this._prePhaseConversations?.['length'] === 0 ? null : {
          state: this.lastPrePhaseConversation.state
        };
      }
      ["getActiveTaskLight"]() {
        try {
          return {
            index: this.activeTaskIndex,
            steps: this.activeTask.steps,
            activePlanArtifactType: this.activeTask.activePlan.planArtifactType
          };
        } catch (_0x4592c3) {
          if (_0x4592c3 instanceof ActiveTaskNotFoundError) return null;
          throw _0x4592c3;
        }
      }
      async ["updateTaskTitle"](_0x3c323c, _0x17823e) {
        await this.getTask(_0x3c323c.taskID).updateTaskTitle(_0x17823e);
      }
      async ['updateTaskSummary'](_0x1200ea, _0x44aadc, _0x436ffb) {
        await this.getTask(_0x1200ea.taskID).updateSummaries(_0x1200ea, _0x44aadc, _0x436ffb);
      }
      async ['updateFailedOrAbortedConversationQuery'](_0x153491, _0x2f24f3) {
        let _0x3aa7b5 = this.getPrePhaseConversation(_0x153491);
        if (_0x3aa7b5.state === pe.FAILED || _0x3aa7b5.state === pe.ABORTED || _0x3aa7b5.state === pe.NOT_STARTED) await _0x3aa7b5.setUserQuery(_0x2f24f3, true);else throw new Error('Conversation ' + _0x153491 + " not in failed/aborted/not started state");
      }
      static async ['deserializeFromStorage'](_0x5dcddd, _0x2386f4, _0x419137, _0x3dd2e5, _0x3f4230, _0x13e30d, _0x2bb4db) {
        let _0x16c2a4 = new _0x5c880e(_0x5dcddd.id, [], [], _0x419137.getAdapter(_0x5dcddd.id), _0x3dd2e5, _0x3f4230, _0x13e30d, _0x2bb4db);
        _0x16c2a4._taskExecutionConfig = _0x5dcddd.taskExecutionConfig;
        let _0x1b033a = await Promise.all(_0x5dcddd.tasks.map(_0x1db15d => {
          if (_0x1db15d.isReferred) {
            let _0x329f40 = _0x2386f4.get(_0x1db15d.id);
            if (_0x329f40) return _0x329f40;
            throw new Error("Referred task " + _0x1db15d.id + ' not found');
          } else return qa.deserializeFromStorage(_0x1db15d, _0x16c2a4.taskStorage.getAdapter(_0x1db15d.id));
        }));
        _0x16c2a4._tasks = _0x1b033a;
        let _0x318d8c = _0x419137.getAdapter(_0x5dcddd.id),
          _0x2f37ca = new ZP(_0x318d8c);
        return _0x16c2a4._prePhaseConversations = await Promise.all(_0x5dcddd.prePhaseConversations.map(async _0x106475 => {
          let _0x5184ad = _0x2f37ca.getAdapter(_0x106475.id);
          return g0.deserializeFromStorage(_0x106475, _0x5184ad);
        })), await _0x16c2a4.validateAndFixupAgentReferences(), _0x16c2a4;
      }
      static ['persistedPhaseBreakdownFromPersistedTicket'](_0x335040, _0x38b27b, _0x3c05e6) {
        let _0xb28874 = Ut(),
          _0xf89fb6 = qa.persistedTaskFromPersistedTicket(_0xb28874, _0x38b27b, _0x335040, _0x3c05e6);
        return {
          id: Ut(),
          tasks: [_0xf89fb6],
          activeTaskId: _0xb28874,
          prePhaseConversations: [],
          yoloModeState: null,
          taskExecutionConfig: void 0
        };
      }
    };
  });
function findVerificationStepIndex(_0x5508b4, _0x488da1) {
  let _0x25a978 = _0x5508b4.phaseBreakdowns.findIndex(_0xa79f => _0xa79f.id === _0x488da1);
  if (_0x25a978 === -1) throw new Error('Phase breakdown with id ' + _0x488da1 + " not found within the task chain");
  return _0x25a978;
}
function getPhaseBreakdownById(_0x40f915, _0xf9ceb3) {
  let _0x5d6076 = findVerificationStepIndex(_0x40f915, _0xf9ceb3);
  return _0x40f915.phaseBreakdowns[_0x5d6076];
}
function updatePhaseBreakdown(_0x236c7c, _0x3707fb) {
  let _0x52fb40 = findVerificationStepIndex(_0x236c7c, _0x3707fb.id);
  _0x236c7c.phaseBreakdowns[_0x52fb40] = _0x3707fb;
}
function deletePhaseBreakdown(_0xbd4a7b, _0x3169ba) {
  let _0x6b47d4 = findVerificationStepIndex(_0xbd4a7b, _0x3169ba);
  _0xbd4a7b.phaseBreakdowns.splice(_0x6b47d4, 1);
}
var PhaseBreakdownStorageAPI = class {
    constructor(_0xca268d) {
      this.storageAPI = _0xca268d;
    }
    async ["read"](_0x1dbfeb) {
      let _0x43409d = await this.storageAPI.read();
      return getPhaseBreakdownById(_0x43409d, _0x1dbfeb);
    }
    async ['upsert'](_0x3a7c07, _0x3388c6) {
      let _0x1d0942 = await this.storageAPI.read();
      return updatePhaseBreakdown(_0x1d0942, _0x3a7c07), this.storageAPI.upsert(_0x1d0942, _0x3388c6);
    }
    async ["delete"](_0x294e9a, _0x4f8589) {
      let _0x1caea4 = await this.storageAPI.read();
      return deletePhaseBreakdown(_0x1caea4, _0x294e9a), this.storageAPI.upsert(_0x1caea4, _0x4f8589);
    }
    ["runInTransaction"](_0x293229) {
      return this.storageAPI.runInTransaction(_0x293229);
    }
    ['getAdapter'](_0xbd8072) {
      return new ConversationStorage(this, _0xbd8072);
    }
  },
  y0,
  initTaskChainDeps = __esmModule(() => {
    'use strict';

    initStatusBar(), initTaskOrchestrator(), y0 = class {
      constructor(_0x1b89e7) {
        this.dbStorageAPI = _0x1b89e7;
      }
      async ["updateLastUpdatedTime"]() {
        await this.upsertOnDisk(_0xd9af07 => {
          _0xd9af07.lastUpdatedTime = Date.now();
        }, false);
      }
      async ['upsertOnDisk'](_0x3d47a9, _0x4f4d42) {
        return this.dbStorageAPI.runInTransaction(async _0x34cd96 => {
          let _0x2d2567 = await this.dbStorageAPI.read();
          _0x3d47a9(_0x2d2567), _0x4f4d42 && (_0x2d2567.lastUpdatedTime = Date.now()), await this.dbStorageAPI.upsert(_0x2d2567, _0x34cd96);
        });
      }
      async ['deleteFromDisk']() {
        await this.dbStorageAPI.runInTransaction(async _0x5e005c => {
          await this.dbStorageAPI.delete(_0x5e005c);
        });
      }
      static async ['deserializeFromStorage'](_0x51ddaf, _0x188163, _0x3ed3ac, _0x5db341, _0x45c307, _0x5c5993) {
        let _0x107778 = new Map(),
          _0x45b807 = [];
        for (let key of _0x51ddaf.phaseBreakdowns) {
          let _0x569eb3 = await G_.deserializeFromStorage(key, _0x107778, _0x188163, _0x3ed3ac, _0x5db341, _0x45c307, _0x5c5993);
          _0x45b807.push(_0x569eb3), _0x569eb3.tasks.forEach(_0x15c0fa => {
            _0x107778.has(_0x15c0fa.id) || _0x107778.set(_0x15c0fa.id, _0x15c0fa);
          });
        }
        return _0x45b807;
      }
      static async ["persistedTaskChainFromPersistedTicket"](_0x2ea85d, _0x36f236, _0x550bc2) {
        let _0xc64c0d = Date.now(),
          _0x24053f = G_.persistedPhaseBreakdownFromPersistedTicket(_0x2ea85d, _0xc64c0d, _0x36f236),
          _0x474e86 = {
            workspaceFile: void 0,
            workspaceFolders: [{
              absolutePath: _0x550bc2,
              isDirectory: true
            }]
          };
        return {
          id: Ut(),
          phaseBreakdowns: [_0x24053f],
          activePhaseBreakdownId: _0x24053f.id,
          title: formatTicketReferenceDisplay(_0x2ea85d),
          creationTimestamp: _0xc64c0d,
          lastUpdatedTime: _0xc64c0d,
          displayState: 'SHOW_ACTIVE_TASK',
          workspaces: _0x474e86
        };
      }
    };
  });
function buildDirectoryTreeWithLimit(_0x380e4d, _0x322c56, _0x312928 = 2) {
  let _0x2c1006 = 0,
    _0x35a8f3 = [],
    _0x552993 = [];
  for (let key of _0x380e4d.subDirectories) {
    if (!key.path) continue;
    let _0x51c653 = {
      path: key.path
    };
    _0x35a8f3.push(_0x51c653), _0x552993.push({
      dir: key,
      dirEntry: _0x51c653,
      parent: _0x51c653
    });
  }
  for (; _0x552993.length > 0 && _0x2c1006 < _0x322c56;) {
    let _0x26bdd8 = _0x552993.reduce((_0xb90851, _0x5caf86) => _0xb90851 + _0x5caf86.dir.filePaths.length, 0),
      _0x15391a = _0x2c1006 + _0x26bdd8 - _0x322c56;
    if (_0x2c1006 + _0x26bdd8 > _0x322c56 && _0x15391a > _0x312928) {
      let _0xe61c1a = [];
      for (let key of _0x552993) {
        let _0x345853 = key.dir.filePaths.length;
        if (_0x345853 <= _0x312928 && _0x2c1006 + _0x345853 <= _0x322c56) {
          key.dirEntry.filePaths = {
            filePaths: key.dir.filePaths
          }, _0x2c1006 += _0x345853;
          for (let _0x94c649 of key.dir.subDirectories) {
            if (!_0x94c649.path) continue;
            let _0x372670 = {
              path: _0x94c649.path
            };
            key.dirEntry.subDirectoryList || (key.dirEntry.subDirectoryList = {
              subDirectories: []
            }), key.dirEntry.subDirectoryList.subDirectories.push(_0x372670), _0xe61c1a.push({
              dir: _0x94c649,
              dirEntry: _0x372670,
              parent: key.dirEntry
            });
          }
        } else key.dirEntry.fileCount = _0x345853, key.dirEntry.subDirectoryCount = key.dir.subDirectories.length;
      }
      _0x552993 = _0xe61c1a;
      continue;
    }
    let _0x55ca61 = [];
    _0x2c1006 += _0x26bdd8;
    for (let _0x2552c1 of _0x552993) {
      _0x2552c1.dirEntry.filePaths = {
        filePaths: _0x2552c1.dir.filePaths
      };
      for (let _0x398548 of _0x2552c1.dir.subDirectories) {
        if (!_0x398548.path) continue;
        let _0x55cc69 = {
          path: _0x398548.path
        };
        _0x2552c1.dirEntry.subDirectoryList || (_0x2552c1.dirEntry.subDirectoryList = {
          subDirectories: []
        }), _0x2552c1.dirEntry.subDirectoryList.subDirectories.push(_0x55cc69), _0x55ca61.push({
          dir: _0x398548,
          dirEntry: _0x55cc69,
          parent: _0x2552c1.dirEntry
        });
      }
    }
    _0x552993 = _0x55ca61;
  }
  return _0x35a8f3;
}
function buildDirectoryTreePreview(_0x50deb5, _0x499335, _0x5ddd0b = 2) {
  let _0x25a969 = [],
    _0x22c837 = 0;
  for (let key of _0x50deb5.filePaths) _0x25a969.push(key), _0x22c837++;
  if (_0x22c837 >= _0x499335) return {
    files: _0x25a969,
    subDirectories: _0x50deb5.subDirectories.map(_0x531188 => ({
      path: _0x531188.path,
      fileCount: _0x531188.filePaths.length,
      subDirectoryCount: _0x531188.subDirectories.length
    }))
  };
  let _0x773fa4 = buildDirectoryTreeWithLimit(_0x50deb5, _0x499335 - _0x22c837, _0x5ddd0b);
  return {
    files: _0x25a969,
    subDirectories: _0x773fa4
  };
}
async function getWorkspaceDirectoryPreviews(_0x31ed23) {
  if (!_0x31ed23.length) throw new Error("No folders found in workspace. Please open a folder");
  let _0x5ed535 = _0x31ed23.map(getWorkspaceDirectoryPreview);
  return (await Promise.all(_0x5ed535)).filter(_0x3e70cd => _0x3e70cd !== null);
}
async function getWorkspaceDirectoryPreview(_0x21eb51) {
  let _0x42f521 = {
      workspacePath: _0x21eb51.proto,
      files: [],
      directories: [],
      detectedRuleFiles: []
    },
    _0x13b954 = await listDirectoryWithAgentsMd(_0x21eb51.proto, true);
  if (!_0x13b954.directory) return null;
  let {
    files: _0x4cfad1,
    subDirectories: _0x416f3f
  } = buildDirectoryTreePreview(_0x13b954.directory, QUERY_THROTTLE_MS);
  return _0x42f521.files = _0x4cfad1, _0x42f521.directories = _0x416f3f, _0x42f521.detectedRuleFiles = _0x13b954.detectedRuleFiles, _0x42f521;
}
var QUERY_THROTTLE_MS,
  initQueryThrottleConfig = __esmModule(() => {
    'use strict';

    initQueryProcessor(), QUERY_THROTTLE_MS = 500;
  }),
  PlanOutputHandler,
  initPlanOutputHandler = __esmModule(() => {
    'use strict';

    initQueryThrottleConfig(), initPlanOutputModule(), PlanOutputHandler = class {
      constructor(_0x112918) {
        this.context = _0x112918;
      }
      ["getLastPrePhaseConversation"](_0x2fcef0) {
        let _0x291288 = _0x2fcef0[_0x2fcef0.length - 1];
        if (!_0x291288) throw new Error('No pre-phase conversation found');
        return _0x291288;
      }
      ["getPrePhaseConversation"](_0x35e876, _0x3e1002) {
        let _0x26cc55 = _0x3e1002.find(_0x3264d7 => _0x3264d7.id === _0x35e876);
        if (!_0x26cc55) throw new Error('Conversation with id ' + _0x35e876 + ' not found');
        return _0x26cc55;
      }
      async ["processPhaseRequest"](_0x17c5d8, _0x274871, _0x549fd1, _0x378e12, _0x5de798, _0x90c416) {
        if (_0x378e12 !== "SHOW_PRE_PHASE") throw new Error("Task chain is not in pre-phase display state");
        await _0x549fd1.setLastUpdatedTime(Date.now(), false), await _0x549fd1.setStepState(pe.IN_PROGRESS), await _0x5de798(false);
        let _0x328c06 = await _0x274871(_0x17c5d8, _0x549fd1.abortController, _0x90c416);
        return await _0x549fd1.handlePhaseGenerationResponse(_0x328c06), {
          output: _0x328c06.output,
          updatedDisplayState: _0x378e12
        };
      }
      async ["generatePhases"](_0x1295c8, _0x96a6ed, _0x1d859e, _0x16de73, _0x5f24ee, _0x49a9c4, _0x3cd4b1, _0x43b692, _0x20113d, _0x2c3f9c) {
        return this.processPhaseRequest({
          commonRequest: {
            phaseConversationIdentifier: _0x1295c8,
            userPrompt: await parseAndEnrichUserQuery(_0x1d859e),
            workspaceRepoMappings: await getWorkspaceDirectoryPreviews(_0x20113d),
            currentPhaseBreakdownConversation: _0x5f24ee,
            taskChainTitle: _0x3cd4b1,
            workspaces: _0x20113d.map(_0x698ff9 => _0x698ff9.serializeToWire())
          },
          llmInput: _0x49a9c4
        }, this.context.client.sendPhaseGenerationRequest.bind(this.context.client), _0x96a6ed, _0x16de73, _0x43b692, _0x2c3f9c);
      }
      async ["iteratePhases"](_0x1a7894, _0xbbc95b, _0x4a426c, _0x44e838, _0x30f1bb, _0x4dc6d4, _0x201a7c, _0x575b7d, _0x25d181, _0x48b9a2, _0x1398a2) {
        return this.processPhaseRequest({
          commonRequest: {
            phaseConversationIdentifier: _0x1a7894,
            userPrompt: await parseAndEnrichUserQuery(_0x4a426c),
            workspaceRepoMappings: await getWorkspaceDirectoryPreviews(_0x48b9a2),
            currentPhaseBreakdownConversation: _0x30f1bb,
            taskChainTitle: _0x575b7d,
            workspaces: _0x48b9a2.map(_0x338edf => _0x338edf.serializeToWire())
          },
          llmInput: _0x201a7c,
          previousPhaseBreakdowns: _0x4dc6d4
        }, this.context.client.sendPhaseIterationRequest.bind(this.context.client), _0xbbc95b, _0x44e838, _0x25d181, _0x1398a2);
      }
    };
  }),
  mD,
  initPlanGenerationHandler = __esmModule(() => {
    'use strict';

    initAnalytics(), initPlanContextModule(), initQueryThrottleConfig(), initPlanOutputModule(), initWorkspaceInfo(), mD = class {
      constructor(_0x4b5e6a) {
        this.context = _0x4b5e6a;
      }
      async ["generatePlan"](_0xe3ff75, _0x5cf23f, _0x2afacb, _0x1fc592, _0x40717b, _0x3f7b30, _0x44bbbe, _0x210062, _0x40c2f2, _0x326b6c, _0x146b84, _0x279db5 = false, _0x2be0f3) {
        let _0x57a15b = '',
          _0xd824ea = _0x5cf23f.getPlan(_0xe3ff75.planID);
        try {
          let {
            userQueryWithMentions: _0xdec5f3
          } = await parseAndFormatUserQuery(_0x40717b, workspace_info.getInstance().getPlatform());
          if (_0x57a15b = _0xdec5f3, _0x5cf23f.steps.planGeneration === pe.IN_PROGRESS) {
            Logger.warn('Plan is already getting generated', _0x5cf23f.id);
            return;
          }
          let _0x53a69c = _0x210062(_0xdec5f3);
          await _0x5cf23f.sendCreationMetrics(yn.getInstance(), _0x53a69c), await _0x326b6c(_0x5cf23f.id, 'planGeneration', pe.IN_PROGRESS), await _0x146b84(false);
          let _0x4247c7 = await parseAndEnrichUserQuery(_0x40717b),
            _0x52f40a = _0xe3ff75.phaseBreakdownIdentifier;
          if (!_0x52f40a) throw new Error('Phase breakdown identifier is required');
          let _0x135eb9 = await Promise.all(_0x3f7b30.map(_0x54c6c2 => _0x54c6c2.serializeToProto(false))),
            _0x1d04f8 = {
              allTasks: await Promise.all(_0x2afacb.slice(0, _0x2afacb.length).map(_0x260cdc => _0x260cdc.serializeToTaskProto(_0x52f40a))),
              userPrompt: _0x4247c7,
              planIdentifier: _0xe3ff75,
              workspaceRepoMappings: await getWorkspaceDirectoryPreviews(_0x2be0f3),
              taskTitle: _0x5cf23f.title,
              taskChainTitle: _0x1fc592,
              planArtifactType: _0x44bbbe,
              phaseBreakdownsTillCurrent: _0x135eb9,
              phaseConversation: []
            };
          await _0xd824ea.sendCreationMetrics(yn.getInstance(), _0x53a69c);
          let _0x4fd6e7 = await this.context.client.sendPlanGenerationRequest(_0x1d04f8, _0x5cf23f.abortController, _0x279db5),
            _0x2b2641 = _0x4fd6e7.plan;
          if (!_0x2b2641) throw new Error('Failed to generate plan for task');
          await this.handleTaskPlan(_0xe3ff75, _0x2b2641, _0x4fd6e7.llmInput, _0x5cf23f, _0x326b6c, _0x4fd6e7.isPayToRun, pe.COMPLETED), await _0xd824ea.setPayAsYouGo(_0x4fd6e7.isPayToRun);
        } catch (_0x26e340) {
          throw Logger.warn("Failed to generate plan for task", _0x26e340), await _0xd824ea.handlePlanGenerationFailure(), await _0x326b6c(_0x5cf23f.id, "planGeneration", pe.FAILED), _0x26e340 instanceof RateLimitExceededError ? _0x26e340 : (_0x26e340 instanceof UserAbortedError || isAbortError(_0x26e340) ? await _0x326b6c(_0x5cf23f.id, 'planGeneration', pe.FAILED) : (await _0x326b6c(_0x5cf23f.id, 'planGeneration', pe.FAILED), _0x40c2f2('Failed to generate plan for task \x22' + (_0x5cf23f.title || _0x57a15b) + '\x22 due to \x22' + _0x26e340 + '\x22')), new PlanGenerationFailedError(String(_0x26e340)));
        }
      }
      async ["planIteration"](_0x3e4145, _0x277237, _0x2871d3, _0x459095, _0x20b737, _0x54e10d, _0x4af206, _0x583d36, _0x5b5a11, _0x1bf33f, _0x1b5c02, _0x208b79) {
        if (_0x277237.steps.planGeneration === pe.IN_PROGRESS) {
          Logger.warn("Plan is already getting generated", _0x277237.id);
          return;
        }
        let _0x20842c = _0x277237.abortController,
          _0x15d855 = _0x277237.activePlan;
        await _0x5b5a11(_0x277237.id, 'planGeneration', pe.IN_PROGRESS);
        let _0x333e98 = {
          query: _0x20b737,
          status: 'pending'
        };
        _0x277237.failedPlanIterationQuery && (await _0x277237.resetFailedPlanIterationQuery()), _0x277237.planChatQuery = _0x333e98, await _0x1bf33f(false);
        let _0x5729f2 = Ut(),
          _0x10ac27 = {
            planIdentifier: _0x3e4145,
            newPlanID: _0x5729f2
          };
        try {
          let {
              userQueryWithMentions: _0x3f686f
            } = await parseAndFormatUserQuery(_0x20b737, workspace_info.getInstance().getPlatform()),
            _0x3bdfa5 = await parseAndEnrichUserQuery(_0x277237.getInitialUserQueryJSONContent()),
            _0x3153e0 = await parseAndEnrichUserQuery(_0x20b737),
            _0x3e82c6 = _0x15d855.mustGetPlanOutput,
            _0x3a4aac = _0x277237.plans.reduce((_0xdca0b0, _0x59a823) => _0xdca0b0 + _0x59a823.planConversations.length + 1, 0),
            _0x241052 = _0x3e4145.phaseBreakdownIdentifier;
          if (!_0x241052) throw new Error('Phase breakdown identifier is required');
          let _0x1b0657 = {
            root: {
              planWithUserPrompt: {
                plan: _0x3e82c6,
                userPrompt: _0x3bdfa5,
                identifier: _0x3e4145
              },
              llmInput: await _0x15d855.getLLMInput(),
              planArtifactType: _0x15d855.planArtifactType
            },
            previousTasks: await Promise.all(_0x2871d3.slice(0, _0x459095).map(_0x570d8b => _0x570d8b.serializeToTaskProto(_0x241052))),
            planChatIdentifier: _0x10ac27,
            userPrompt: _0x3153e0,
            priorPlanChatIterationCount: _0x3a4aac,
            workspaceRepoMappings: await getWorkspaceDirectoryPreviews(_0x1b5c02)
          };
          yn.getInstance().increment('task_plan_iteration', _0x4af206(_0x3f686f));
          let _0x41770c = await this.context.client.sendPlanChatRequest(_0x1b0657, _0x20842c, _0x208b79);
          if (!_0x41770c.plan) throw new Error("Failed to chat about plan for task");
          let _0x538260 = {
            ..._0x3e4145
          };
          _0x41770c.queryType === HO.ITERATION && (_0x538260.planID = _0x5729f2), await this.handleTaskPlan(_0x538260, _0x41770c.plan, _0x41770c.llmInput, _0x277237, _0x5b5a11, void 0, pe.COMPLETED);
        } catch (_0x369473) {
          Logger.warn('Failed to chat about plan for task', _0x369473), _0x277237.pendingPlanChat || _0x15d855.isPlanConvInProgress() && _0x15d855.removeActiveConversation(), await _0x277237.removePlan(_0x5729f2);
          let _0x4b7a69 = {
            query: _0x333e98.query,
            status: "failed"
          };
          if (await _0x277237.handlePlanIterationFailure(_0x4b7a69, _0x3e4145), !(_0x369473 instanceof UserAbortedError)) throw _0x583d36("Failed to chat about plan for task \"" + _0x54e10d + "\" due to \"" + _0x369473 + ', switching to previous plan\x22'), new Error('Failed to chat about plan for task', {
            cause: _0x369473
          });
        } finally {
          await _0x5b5a11(_0x277237.id, 'planGeneration', pe.COMPLETED), await _0x1bf33f(false);
        }
      }
      async ["handlePlanChatQueryType"](_0x39b1e9, _0x3356c6, _0x45759a, _0x33ce34, _0x5c1819, _0x3ae357, _0x3ad207) {
        let _0x946977 = _0x33ce34.consumePendingPlanChat();
        if (_0x946977) switch (_0x3356c6) {
          case HO.ITERATION:
            {
              let _0x10c7fb = _0x33ce34.getPlan(_0x39b1e9.planID),
                _0x3758b4 = {
                  ..._0x39b1e9,
                  planID: _0x45759a
                };
              await _0x5c1819(_0x3758b4, _0x946977.query, _0x10c7fb.planArtifactType, _0x10c7fb), await _0x3ad207(_0x33ce34.id, "planGeneration", pe.IN_PROGRESS);
              break;
            }
          case HO.EXPLANATION:
            {
              await _0x3ae357(_0x39b1e9, _0x946977.query);
              break;
            }
        }
      }
      async ["handleTaskPlan"](_0x38e250, _0x466ba9, _0x43501e, _0x5dc274, _0x552956, _0x1a9ac6, _0x2988b0) {
        await _0x5dc274.getPlan(_0x38e250.planID).handlePlanOutput(_0x466ba9, _0x43501e, _0x1a9ac6), await _0x552956(_0x5dc274.id, "planGeneration", _0x2988b0);
      }
    };
  }),
  VerificationHandler,
  initVerificationHandler = __esmModule(() => {
    'use strict';

    initQueryThrottleConfig(), VerificationHandler = class {
      constructor(_0x7c96ac) {
        this.context = _0x7c96ac;
      }
      async ['startTaskVerification'](_0x3ede1e, _0xbba6b3, _0x360b9b, _0x559edf, _0x793657, _0x408b27, _0x554e2b, _0x202c7c, _0xbc823a) {
        try {
          let _0x4403d6 = await _0x408b27(_0xbba6b3),
            _0x2bb232 = {
              phaseBreakdownIdentifier: _0x3ede1e.phaseBreakdownIdentifier,
              taskID: _0xbba6b3.id,
              verificationID: _0x4403d6.id
            };
          await _0x793657(_0xbba6b3.id, 'verification', pe.IN_PROGRESS), await _0x559edf(false);
          let _0x3403cd = _0x3ede1e.phaseBreakdownIdentifier;
          if (!_0x3403cd) throw new Error("Phase breakdown identifier is required");
          let _0x25eebd = {
              root: {
                allTasks: await Promise.all(_0x360b9b.map(_0x12a258 => _0x12a258.serializeToTaskProto(_0x3403cd))),
                workspaceRepoMappings: await getWorkspaceDirectoryPreviews(_0xbc823a),
                discardedComments: _0xbba6b3.discardedVerificationComments.map(_0x296267 => _0x296267.serializeToWire()),
                verificationIdentifier: _0x2bb232
              }
            },
            _0x2e2afe = await this.context.client.sendVerificationRequest(_0x25eebd, _0xbba6b3.abortController, _0x202c7c);
          if (!_0x2e2afe.output) throw new Error('Verification response is null');
          return await _0x4403d6.handleVerificationResponse(_0x2e2afe), await _0x793657(_0xbba6b3.id, 'verification', pe.COMPLETED), _0x4403d6;
        } catch (_0x196d40) {
          throw Logger.warn("Failed to start task verification", _0x196d40), await _0xbba6b3.handleFailedVerification(), _0x196d40 instanceof RateLimitExceededError ? _0x196d40 : (_0x554e2b("Failed to complete verification for task \"" + _0xbba6b3.title + '\x22 due to \x22' + _0x196d40 + '\x22'), new VerificationFailedError(String(_0x196d40)));
        }
      }
      async ['reVerifyTask'](_0x1ab55a, _0x4e2b34, _0x8e72c9, _0x448473, _0x167ef6, _0x41b276, _0x137f3b) {
        let _0x4bada4 = _0x4e2b34.verification;
        if (!_0x4bada4 || !_0x4bada4.verificationOutput) throw new Error("No verification found while re verifying task");
        if (_0x4bada4.verificationOutput.latestComments.length === 0) {
          let _0x4a1f19 = 'No comments to re-verify for task';
          throw Logger.error('No comments to re-verify for task'), new Error('No comments to re-verify for task');
        }
        let _0x352f2c = _0x4bada4.logs;
        try {
          await _0x4bada4.setReverificationState({
            hasFailed: false,
            isAborted: false,
            isRateLimited: false
          }), await _0x4bada4.clearLogs(), await _0x167ef6(_0x4e2b34.id, 'verification', pe.IN_PROGRESS), await _0x448473(false);
          let _0x3bb08a = _0x4bada4.verificationOutput.threads.map(_0x59075e => _0x59075e.serializeToWire()),
            _0x31b65e = _0x1ab55a.phaseBreakdownIdentifier;
          if (!_0x31b65e) throw new Error("Phase breakdown identifier is required");
          let [_0x404661, _0xd5a56d] = await Promise.all([Promise.all(_0x8e72c9.map(_0x2e0a33 => _0x2e0a33.serializeToTaskProto(_0x31b65e))), getWorkspaceDirectoryPreviews(_0x137f3b), _0x4bada4.verificationOutput.getVerificationFiles()]),
            _0x5ed73c = {
              root: {
                verificationIdentifier: _0x1ab55a,
                allTasks: _0x404661,
                workspaceRepoMappings: _0xd5a56d,
                discardedComments: _0x4e2b34.discardedVerificationComments.map(_0x36ee62 => _0x36ee62.serializeToWire())
              },
              verificationThreads: _0x3bb08a
            },
            _0x5424b8 = await this.context.client.sendReVerificationRequest(_0x5ed73c, _0x4e2b34.abortController);
          if (!_0x5424b8) throw new Error('Re-verification response is null');
          await _0x4bada4.handleReVerificationResponse(_0x5424b8), await _0x167ef6(_0x4e2b34.id, 'verification', pe.COMPLETED);
        } catch (_0x3331ee) {
          throw Logger.warn('Failed to re-verify task', _0x3331ee), await _0x4bada4.setLogs(_0x352f2c), await _0x167ef6(_0x4e2b34.id, "verification", pe.FAILED), _0x3331ee instanceof RateLimitExceededError ? (await _0x4bada4.setReverificationState({
            hasFailed: false,
            isAborted: false,
            isRateLimited: true
          }), _0x3331ee) : (_0x3331ee instanceof UserAbortedError || isAbortError(_0x3331ee) ? (await _0x4bada4.setReverificationState({
            hasFailed: false,
            isAborted: true,
            isRateLimited: false
          }), await _0x167ef6(_0x4e2b34.id, "verification", pe.FAILED)) : (await _0x4bada4.setReverificationState({
            hasFailed: true,
            isAborted: false,
            isRateLimited: false
          }), await _0x167ef6(_0x4e2b34.id, 'verification', pe.FAILED), _0x41b276("Failed to complete re-verification for task \"" + _0x4e2b34.title + '\x22 due to \x22' + _0x3331ee + '\x22')), new VerificationFailedError(String(_0x3331ee)));
        }
      }
    };
  }),
  v0,
  gD,
  initTaskChain = __esmModule(() => {
    'use strict';

    initIDEAgentManager(), initWorkspaceAssociation(), initWorkspaceInfo(), initTaskChainPersistence(), initCommentNavigatorDeps(), initTaskContext(), initTaskOrchestrator(), initTaskChainDeps(), initPlanOutputHandler(), initPlanGenerationHandler(), initVerificationHandler(), v0 = class _0x534a40 {
      constructor(_0x2ec0b7) {
        this._phaseBreakdowns = [], this._activePhaseBreakdownId = null, this.upsertOnUIWithTimestamp = _0x2bae97 => this.upsertOnUI(true, _0x2bae97), this.upsertOnUIWithoutTimestamp = _0x43959b => this.upsertOnUI(false, _0x43959b), this.client = _0x2ec0b7.client, this._id = _0x2ec0b7.id, this._title = _0x2ec0b7.title, this._displayState = _0x2ec0b7.displayState, this._creationTimestamp = _0x2ec0b7.creationTimestamp, this._lastUpdatedTime = _0x2ec0b7.lastUpdatedTime, this._workspaceScope = _0x2ec0b7.workspaceScope;
        let _0x42c45f = TaskChainPersistence.getInstance();
        this.dbStorageAPI = new gD(_0x42c45f, this.id), this.phaseBreakdownStorageAPI = new PhaseBreakdownStorageAPI(this.dbStorageAPI), this.uiAdapter = new TaskChainNotifier(Qe), this.context = {
          client: this.client,
          uiAdapter: this.uiAdapter,
          taskChain: this
        }, this.planGenerationService = new mD(this.context), this.phaseGenerationService = new PlanOutputHandler(this.context), this.persistenceManager = new y0(this.dbStorageAPI), this.verificationService = new VerificationHandler(this.context);
      }
      static async ["createNewInstance"](_0x1da058) {
        let _0xdec175 = new _0x534a40({
            ..._0x1da058
          }),
          _0x59c77b = {
            id: _0x1da058.id,
            title: _0x1da058.title,
            displayState: _0x1da058.displayState,
            creationTimestamp: _0x1da058.creationTimestamp,
            lastUpdatedTime: _0x1da058.lastUpdatedTime,
            phaseBreakdowns: [],
            activePhaseBreakdownId: null,
            workspaces: _0x1da058.persistedWS
          };
        return await _0xdec175.dbStorageAPI.runInTransaction(async _0x322d0f => {
          await _0xdec175.dbStorageAPI.upsert(_0x59c77b, _0x322d0f);
        }), _0xdec175;
      }
      async ["getTaskWorkspaces"]() {
        if (this._workspaceScope.association !== "current") throw new Error("Cannot access workspaces for out of workspace task chains");
        return (await workspace_info.getInstance().getCurrentWSInfo()).WSAssociation.workspaceFolders;
      }
      get ["workspaceScope"]() {
        return this._workspaceScope;
      }
      get ['id']() {
        return this._id;
      }
      get ['creationTimestamp']() {
        return this._creationTimestamp;
      }
      get ["lastUpdatedTime"]() {
        return this._lastUpdatedTime;
      }
      get ['title']() {
        return this._title || '';
      }
      get ["activePhaseBreakdownId"]() {
        if (!this._activePhaseBreakdownId) throw new ActivePhaseBreakdownNotFoundError();
        return this._activePhaseBreakdownId;
      }
      get ['activePhaseBreakdownIfExists']() {
        if (!(!this._activePhaseBreakdownId || !this.phaseBreakdowns.length)) return this.getPhaseBreakdownIfExists(this.activePhaseBreakdownId);
      }
      get ["activePhaseBreakdown"]() {
        let _0x59d628 = this.getPhaseBreakdownIfExists(this.activePhaseBreakdownId);
        if (!_0x59d628) throw new ActivePhaseBreakdownNotFoundError();
        return _0x59d628;
      }
      get ["displayState"]() {
        return this._displayState;
      }
      get ["phaseBreakdowns"]() {
        return this._phaseBreakdowns;
      }
      ["getPhaseBreakdown"](_0xca3fc5) {
        let _0x430568 = this.phaseBreakdowns.find(_0x5a90fb => _0x5a90fb.id === _0xca3fc5);
        if (!_0x430568) throw new Error('Phase breakdown with id ' + _0xca3fc5 + ' not found');
        return _0x430568;
      }
      ['getPhaseBreakdownIfExists'](_0x51a48c) {
        return this.phaseBreakdowns.find(_0x3a116f => _0x3a116f.id === _0x51a48c);
      }
      ['getPrePhaseConversation'](_0x360ed8, _0x52f4f3) {
        return this.getPhaseBreakdown(_0x360ed8).getPrePhaseConversation(_0x52f4f3);
      }
      async ["addPhaseBreakdown"](_0x5f4f2d, _0x123fe8) {
        let _0x3e627b = this.getPhaseBreakdownIfExists(_0x5f4f2d);
        if (_0x3e627b) {
          let _0x3a5353 = this.phaseBreakdowns.findIndex(_0x3e64ef => _0x3e64ef.id === _0x5f4f2d);
          return {
            newPhaseBreakdown: _0x3e627b,
            previousActivePhaseBreakdown: _0x3a5353 === 0 ? null : this.phaseBreakdowns[_0x3a5353 - 1]
          };
        }
        let _0x132153 = async _0x42f07b => {
            await this.persistenceManager.upsertOnDisk(_0x29412e => {
              _0x29412e.phaseBreakdowns.push(_0x42f07b), _0x29412e.activePhaseBreakdownId = _0x42f07b.id, _0x29412e.displayState = _0x123fe8;
            }, true);
          },
          _0x119a4f = await G_.createNewInstance(_0x5f4f2d, [], [], this.phaseBreakdownStorageAPI.getAdapter(_0x5f4f2d), this.context, this.planGenerationService, this.phaseGenerationService, this.verificationService, _0x132153),
          _0x497268 = null;
        return this._activePhaseBreakdownId && (_0x497268 = this.activePhaseBreakdown), this.phaseBreakdowns.push(_0x119a4f), this._activePhaseBreakdownId = _0x5f4f2d, this._displayState = _0x123fe8, {
          newPhaseBreakdown: _0x119a4f,
          previousActivePhaseBreakdown: _0x497268
        };
      }
      async ["insertTask"](_0x47e47e, _0x5e5808, _0x54f8ec, _0x411f08) {
        let _0x3bfc2d = _0x47e47e.phaseBreakdownIdentifier;
        if (!_0x3bfc2d) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0x3bfc2d.phaseBreakdownID).insertTask(_0x47e47e, _0x5e5808, _0x54f8ec, _0x411f08), await this.persistenceManager.upsertOnDisk(_0x5a26a6 => {
          _0x5a26a6.displayState = "SHOW_PHASES";
        }, true), await this.upsertOnUI(false, false);
      }
      async ["addNewVerification"](_0x58619e, _0x2288e2) {
        return _0x58619e.addNewVerification(_0x2288e2);
      }
      async ['startTaskVerification'](_0x59ce07, _0xa3bf2b) {
        try {
          let _0x411c78 = _0x59ce07.phaseBreakdownIdentifier;
          if (!_0x411c78) throw new Error("Phase breakdown identifier is required");
          let _0x10d4ce = this.getPhaseBreakdown(_0x411c78.phaseBreakdownID);
          await _0x10d4ce.startTaskVerification(_0x59ce07, _0xa3bf2b, this.upsertOnUIWithTimestamp, this.showNotification.bind(this), _0xe78e9a => this.addNewVerification(_0x10d4ce, _0xe78e9a), await this.getTaskWorkspaces());
        } finally {
          await this.upsertOnUI(true, false);
        }
      }
      async ["reVerifyTask"](_0x452d96) {
        let _0x3f4cd8 = _0x452d96.phaseBreakdownIdentifier;
        if (!_0x3f4cd8) throw new Error('Phase breakdown identifier is required');
        let _0x2d3d06 = this.getPhaseBreakdown(_0x3f4cd8.phaseBreakdownID);
        try {
          await _0x2d3d06.reVerifyTask(_0x452d96, this.upsertOnUIWithTimestamp, this.showNotification.bind(this), await this.getTaskWorkspaces());
        } finally {
          await this.upsertOnUI(true, false);
        }
      }
      async ["discardVerificationComment"](_0x475ba8, _0x716cf8) {
        let _0x30b24d = _0x475ba8.phaseBreakdownIdentifier;
        if (!_0x30b24d) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x30b24d.phaseBreakdownID).discardVerificationComment(_0x475ba8.taskID, _0x716cf8), await this.upsertOnUI(true, false);
      }
      async ['toggleVerificationCommentsApplied'](_0x1706c3, _0x414c66, _0x2cd439) {
        let _0x127d97 = _0x1706c3.phaseBreakdownIdentifier;
        if (!_0x127d97) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0x127d97.phaseBreakdownID).toggleVerificationCommentsApplied(_0x1706c3, _0x414c66, _0x2cd439), await this.upsertOnUI(true, false);
      }
      async ["deleteTask"](_0x946d6) {
        let _0x4e8936 = _0x946d6.phaseBreakdownIdentifier;
        if (!_0x4e8936) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x4e8936.phaseBreakdownID).deleteTask(_0x946d6.taskID), await this.upsertOnUI(true, false);
      }
      async ["dispose"]() {
        await Promise.all(this.phaseBreakdowns.map(async _0x351687 => {
          await _0x351687.dispose();
        })), await this.persistenceManager.deleteFromDisk();
      }
      async ["abortPrePhase"](_0x1dc44c) {
        await this.getPhaseBreakdown(_0x1dc44c.phaseBreakdownID).abortPrePhase(), await this.upsertOnUI(true, false);
      }
      async ["deletePhaseConversation"](_0x443f1d) {
        let {
          phaseBreakdownIdentifier: _0x329c00
        } = _0x443f1d;
        if (!_0x329c00) throw new Error('Phase breakdown identifier is required');
        let _0x61b402 = this.getPhaseBreakdown(_0x329c00.phaseBreakdownID),
          _0x22b697 = this.phaseBreakdowns.findIndex(_0x345b57 => _0x345b57.id === _0x329c00.phaseBreakdownID),
          _0x3482d0 = false;
        if (_0x22b697 !== this.phaseBreakdowns.length - 1) {
          let _0x12f3be = this.phaseBreakdowns.splice(_0x22b697 + 1);
          await Promise.all(_0x12f3be.map(_0x4556a1 => _0x4556a1.dispose())), _0x3482d0 = true;
        }
        let _0x3bd179 = this._displayState;
        _0x22b697 > 0 && _0x61b402.prePhaseConversations.length === 1 ? (_0x3bd179 = 'SHOW_PHASES', this._activePhaseBreakdownId = this.phaseBreakdowns[_0x22b697 - 1].id) : (this._activePhaseBreakdownId = _0x61b402.id, _0x3bd179 = 'SHOW_PRE_PHASE'), this._displayState = _0x3bd179, await _0x61b402.deletePrePhaseConversationAndPreserveQuery(_0x443f1d), await this.persistenceManager.upsertOnDisk(_0x5f2820 => {
          _0x5f2820.activePhaseBreakdownId = this._activePhaseBreakdownId, _0x5f2820.displayState = _0x3bd179, _0x3482d0 && _0x5f2820.phaseBreakdowns.splice(_0x22b697 + 1);
        }, true), await this.upsertOnUI(false, false);
      }
      async ["exportPhaseBreakdown"](_0xd00bad, _0x350af4, _0x223f9b) {
        let _0x3f76fc = this.getPhaseBreakdown(_0xd00bad.phaseBreakdownID),
          _0x43755e = await _0x3f76fc.serializeToUIHeavy(_0xd00bad.phaseBreakdownID),
          _0x32f099 = formatPhaseBreakdownToMarkdown(_0x43755e, _0x223f9b, workspace_info.getInstance().getPlatform());
        await debounce(_0x32f099, "phase-breakdown", _0x350af4, {
          taskId: _0x3f76fc.tasks?.[0]?.['id'] ?? '',
          taskChainId: this.id,
          phaseBreakdownId: _0x3f76fc.id
        });
      }
      async ['abortTask'](_0x2f9e7d) {
        let _0x5bca85 = _0x2f9e7d.phaseBreakdownIdentifier;
        if (!_0x5bca85) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x5bca85.phaseBreakdownID).abortTask(_0x2f9e7d.taskID), await this.upsertOnUI(true, false);
      }
      async ['executeInIDE'](_0x30f28a, _0x138d95, _0x460c35) {
        let _0x1ae801 = _0x30f28a.phaseBreakdownIdentifier;
        if (!_0x1ae801) throw new Error('Phase breakdown identifier is required');
        await this.markPlanAsActive(_0x30f28a), await this.getPhaseBreakdown(_0x1ae801.phaseBreakdownID).executeInIDE(_0x30f28a, _0x138d95, _0x460c35), await Vt.getInstance().setLastUsedIDEAgents("plan", _0x138d95), await this.upsertOnUI(true, false);
      }
      async ["executeQueryDirectlyInIDE"](_0x2c4b03, _0x45cdd7, _0x4d49aa, _0x42160b, _0x4f332d) {
        let _0x355454 = _0x2c4b03.phaseBreakdownIdentifier;
        if (!_0x355454) throw new Error("Phase breakdown identifier is required");
        await this.markPlanAsActive(_0x2c4b03), await this.getPhaseBreakdown(_0x355454.phaseBreakdownID).executeQueryDirectlyInIDE(_0x2c4b03, _0x45cdd7, _0x4d49aa, _0x42160b, _0x4f332d), await Vt.getInstance().setLastUsedIDEAgents('userQuery', _0x45cdd7), await this.upsertOnUI(true, false);
      }
      async ["disposeVerification"](_0x24ad01) {
        let _0x1d3624 = _0x24ad01.phaseBreakdownIdentifier;
        if (!_0x1d3624) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0x1d3624.phaseBreakdownID).getTask(_0x24ad01.taskID).resetVerification(), await this.upsertOnUI(true, false);
      }
      async ["discardPlan"](_0x2c5b5d) {
        let _0xed82ae = _0x2c5b5d.phaseBreakdownIdentifier;
        if (!_0xed82ae) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0xed82ae.phaseBreakdownID).getTask(_0x2c5b5d.taskID).discardPlan(), await this.upsertOnUI(true, false);
      }
      async ["markPlanAsExecuted"](_0x17f414) {
        let _0x49e85d = _0x17f414.phaseBreakdownIdentifier;
        if (!_0x49e85d) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x49e85d.phaseBreakdownID).getTask(_0x17f414.taskID).markPlanAsExecuted(_0x17f414.planID), await this.upsertOnUI(true, false);
      }
      async ["updateStepState"](_0x5e8b43, _0x240e1b, _0x5b8e26, _0x3a493d) {
        let _0xe345d1 = _0x5e8b43.phaseBreakdownIdentifier;
        if (!_0xe345d1) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0xe345d1.phaseBreakdownID).setStepState(_0x5e8b43.taskID, _0x240e1b, _0x5b8e26), await this.upsertOnUI(false, _0x3a493d);
      }
      async ["showNotification"](_0x4ee90d) {
        let _0x53c769 = await this.serializeToUI();
        await this.uiAdapter.showTaskNotificationWithViewOption(_0x4ee90d, _0x53c769);
      }
      ['serializeToUILight']() {
        return {
          id: this._id,
          title: this._title,
          userQuery: this._phaseBreakdowns[0]?.['initialUserQuery'] ?? this.activePhaseBreakdown.initialUserQuery,
          activeTask: this.activePhaseBreakdownIfExists?.["getActiveTaskLight"]() ?? null,
          taskLength: this.activePhaseBreakdownIfExists?.["tasks"]['length'] ?? 0,
          activePrePhaseConversation: this.activePhaseBreakdownIfExists?.["getActivePrePhaseConversationLight"]() ?? null,
          creationTimestamp: this.creationTimestamp,
          lastUpdated: this.lastUpdatedTime,
          displayState: this._displayState,
          workspaceScope: this.workspaceScope
        };
      }
      async ['resetReverificationState'](_0x5a6701) {
        let _0x561927 = _0x5a6701.phaseBreakdownIdentifier;
        if (!_0x561927) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x561927.phaseBreakdownID).resetReverificationState(_0x5a6701.taskID), await this.upsertOnUI(true, false);
      }
      async ['serializeToUI']() {
        return {
          id: this._id,
          title: this._title,
          phaseBreakdowns: await Promise.all(this.phaseBreakdowns.map(_0x4b5f51 => _0x4b5f51.serializeToUIHeavy(this._activePhaseBreakdownId ?? ''))),
          creationTimestamp: this.creationTimestamp,
          lastUpdated: this.lastUpdatedTime,
          displayState: this._displayState,
          workspaceScope: this.workspaceScope
        };
      }
      static async ["deserializeFromStorage"](_0x455086, _0x29d3a4) {
        let _0x328b26 = _0x455086.phaseBreakdowns.find(_0x525002 => _0x525002.id === _0x455086.activePhaseBreakdownId),
          _0xef32d2 = _0x328b26?.['tasks'] ?? [],
          _0x46b0e5 = _0x328b26?.["prePhaseConversations"] ?? [];
        _0x455086.displayState = _0xef32d2.length > 0 ? _0xef32d2.length === 1 && _0x46b0e5.length === 0 ? "SHOW_ACTIVE_TASK" : 'SHOW_PHASES' : 'SHOW_PRE_PHASE';
        let _0x26ae5e = new _0x534a40({
            client: _0x29d3a4,
            id: _0x455086.id,
            title: _0x455086.title,
            displayState: _0x455086.displayState,
            creationTimestamp: _0x455086.creationTimestamp,
            lastUpdatedTime: _0x455086.lastUpdatedTime,
            workspaceScope: await (await Pf.deserialize(_0x455086.workspaces)).determineWorkspaceScope()
          }),
          _0x41be9a = await y0.deserializeFromStorage(_0x455086, new PhaseBreakdownStorageAPI(_0x26ae5e.dbStorageAPI), _0x26ae5e.context, _0x26ae5e.planGenerationService, _0x26ae5e.phaseGenerationService, _0x26ae5e.verificationService);
        return _0x26ae5e._phaseBreakdowns = _0x41be9a, _0x26ae5e._activePhaseBreakdownId = _0x455086.activePhaseBreakdownId, _0x26ae5e;
      }
      static async ["deserializeFromPersistedTicket"](_0x23a663, _0x1458b3, _0x5eae2e, _0x40a044) {
        let _0x2a53c5 = await y0.persistedTaskChainFromPersistedTicket(_0x23a663, _0x1458b3, _0x40a044),
          _0x1d97e2 = TaskChainPersistence.getInstance(),
          _0x54d863 = new gD(_0x1d97e2, _0x2a53c5.id);
        return await _0x54d863.runInTransaction(async _0x5d8387 => {
          await _0x54d863.upsert(_0x2a53c5, _0x5d8387);
        }), await _0x534a40.deserializeFromStorage(_0x2a53c5, _0x5eae2e);
      }
      async ["markPlanAsActive"](_0x44d656, _0x31961c = true) {
        let {
          phaseBreakdownIdentifier: _0xb25d6a
        } = _0x44d656;
        if (!_0xb25d6a) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0xb25d6a.phaseBreakdownID).markPlanAsActive(_0x44d656, _0x31961c);
      }
      async ["reorderTasks"](_0x2427ad, _0x477cdf) {
        await this.getPhaseBreakdown(_0x2427ad.phaseBreakdownID).reorderTasks(_0x477cdf), await this.upsertOnUI(true, false);
      }
      async ['updateTaskQuery'](_0x5776b2, _0x321e98, _0x178118) {
        let {
          phaseBreakdownIdentifier: _0x2a22fe
        } = _0x5776b2;
        if (!_0x2a22fe) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x2a22fe.phaseBreakdownID).updateTaskQuery(_0x5776b2, _0x321e98, _0x178118), await this.upsertOnUI(true, false);
      }
      async ['editPrePhaseConversation'](_0x21c8af, _0x2dfdf6, _0x1bdd16, _0x581d7b) {
        let {
          phaseBreakdownIdentifier: _0x50c009
        } = _0x21c8af;
        if (!_0x50c009) throw new Error("Phase breakdown identifier is required");
        let _0xda2cd3 = this.getPhaseBreakdown(_0x50c009.phaseBreakdownID);
        await _0xda2cd3.editPrePhaseConversation(_0x21c8af.conversationID);
        let _0x22c037 = this.phaseBreakdowns.findIndex(_0x59d8eb => _0x59d8eb.id === _0x50c009.phaseBreakdownID),
          _0x535547 = this.phaseBreakdowns.splice(_0x22c037 + 1);
        await Promise.all(_0x535547.map(async _0x5d7914 => {
          await _0x5d7914.dispose();
        })), this._activePhaseBreakdownId = _0xda2cd3.id, this._displayState = 'SHOW_PRE_PHASE', await this.persistenceManager.upsertOnDisk(_0x15e4fb => {
          _0x15e4fb.displayState = "SHOW_PRE_PHASE", _0x15e4fb.activePhaseBreakdownId = _0xda2cd3.id, _0x15e4fb.phaseBreakdowns.splice(_0x22c037 + 1);
        }, true), await this.generatePhases(_0x21c8af, _0x2dfdf6, _0x1bdd16, _0x581d7b);
      }
      async ['updateFailedPlanIterationQuery'](_0x35832a, _0x4b7085) {
        let {
          phaseBreakdownIdentifier: _0x200924
        } = _0x35832a;
        if (!_0x200924) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0x200924.phaseBreakdownID).getTask(_0x35832a.taskID).updateFailedPlanIterationQuery(_0x4b7085), await this.upsertOnUI(true, false);
      }
      async ['updateFailedOrAbortedConversationQuery'](_0x433b6e, _0xd8d896) {
        let {
          phaseBreakdownIdentifier: _0x38267d
        } = _0x433b6e;
        if (!_0x38267d) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0x38267d.phaseBreakdownID).updateFailedOrAbortedConversationQuery(_0x433b6e.conversationID, _0xd8d896), await this.upsertOnUI(true, false);
      }
      async ["planIteration"](_0x54522f, _0x3ab491, _0x2681fb) {
        let {
          phaseBreakdownIdentifier: _0x583176
        } = _0x54522f;
        if (!_0x583176) throw new Error('Phase breakdown identifier is required');
        let _0x1676f1 = this.getPhaseBreakdown(_0x583176.phaseBreakdownID);
        await this.markPlanAsActive(_0x54522f, true);
        try {
          await _0x1676f1.planIteration(_0x54522f, this.title, _0x3ab491, this.upsertOnUIWithTimestamp, this.showNotification.bind(this), await this.getTaskWorkspaces(), _0x2681fb);
        } finally {
          await this.upsertOnUI(true, false);
        }
      }
      async ['generatePhases'](_0xe81d0f, _0x4b753c, _0x3f0b5b, _0x13e6ef) {
        let {
          phaseBreakdownIdentifier: _0x36def4
        } = _0xe81d0f;
        if (!_0x36def4) throw new Error('Phase breakdown identifier is required');
        let _0x9f40ba = this.getPhaseBreakdownIfExists(_0x36def4.phaseBreakdownID);
        if (_0x13e6ef) {
          let _0x9c5a29 = _0x9f40ba?.['lastPrePhaseConversation'];
          _0x9c5a29 && (await _0x9c5a29.saveInterviewAnswers(_0x13e6ef));
        }
        _0x9f40ba?.['tasks']["length"] && (_0x36def4.phaseBreakdownID = Ut());
        let {
            newPhaseBreakdown: _0x1b55db,
            previousActivePhaseBreakdown: _0xf742cb
          } = await this.addPhaseBreakdown(_0x36def4.phaseBreakdownID, "SHOW_PRE_PHASE"),
          _0x220ef9 = null;
        _0x1b55db.prePhaseConversations.length > 0 ? _0x220ef9 = await _0x1b55db.lastPrePhaseConversation.getLLMInput() : _0xf742cb && _0xf742cb.prePhaseConversations.length > 0 && (_0x220ef9 = await _0xf742cb.lastPrePhaseConversation.getLLMInput());
        let _0x617abc = this.phaseBreakdowns.findIndex(_0xcf24a0 => _0xcf24a0.id === _0x36def4.phaseBreakdownID),
          _0x7c6291 = this.phaseBreakdowns.slice(0, _0x617abc),
          _0x4e028a = await Promise.all(_0x7c6291.map((_0x459251, _0x3a5716) => _0x459251.serializeToProto(_0x3a5716 === _0x7c6291.length - 1)));
        try {
          _0xf742cb ? await _0x1b55db.iteratePhases(_0xe81d0f, this.title, this.displayState, _0x4b753c, _0x4e028a, _0xf742cb.tasks, _0x220ef9, this.upsertOnUIWithTimestamp, this.showNotification.bind(this), this.updateDisplayState.bind(this), await this.getTaskWorkspaces(), _0x3f0b5b) : await _0x1b55db.generatePhases(_0xe81d0f, this.title, this.displayState, _0x4b753c, _0x220ef9, this.upsertOnUIWithTimestamp, this.showNotification.bind(this), this.updateDisplayState.bind(this), await this.getTaskWorkspaces(), _0x3f0b5b);
        } finally {
          await this.upsertOnUI(false, false);
        }
      }
      async ['updateDisplayState'](_0x4cff6a) {
        this._displayState = _0x4cff6a, await this.persistenceManager.upsertOnDisk(_0x4d61e0 => {
          _0x4d61e0.displayState = _0x4cff6a;
        }, true);
      }
      async ['generatePlan'](_0x63f50a, _0x175d93, _0xe6c92c, _0x343f3d = false) {
        try {
          let {
            phaseBreakdownIdentifier: _0x5cb89f
          } = _0x63f50a;
          if (!_0x5cb89f) throw new Error("Phase breakdown identifier is required");
          let {
              newPhaseBreakdown: _0x488366
            } = await this.addPhaseBreakdown(_0x5cb89f.phaseBreakdownID, "SHOW_ACTIVE_TASK"),
            _0x5e183c = this.phaseBreakdowns.findIndex(_0x1e5c03 => _0x1e5c03.id === _0x5cb89f.phaseBreakdownID),
            _0x105c65 = this.phaseBreakdowns.slice(0, _0x5e183c + 1);
          await _0x488366.generatePlan(_0x63f50a, this.title, _0x105c65, _0x175d93, _0xe6c92c, _0x343f3d, this.upsertOnUIWithTimestamp, this.showNotification.bind(this), await this.getTaskWorkspaces()), _0x488366.tasks.length > 1 && this.displayState !== "SHOW_PHASES" && (await this.updateDisplayState('SHOW_PHASES'));
        } finally {
          await this.upsertOnUI(true, false);
        }
      }
      async ['executeVerificationCommentsInIDE'](_0xab6820, _0x166807, _0x29f41d, _0x2a62d2) {
        let {
          phaseBreakdownIdentifier: _0x25a84a
        } = _0xab6820;
        if (!_0x25a84a) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0x25a84a.phaseBreakdownID).executeVerificationCommentsInIDE(_0xab6820, _0x166807, _0x29f41d, _0x2a62d2, this.upsertOnUIWithoutTimestamp);
      }
      async ['executeAllVerificationCommentsInIDE'](_0x3382f0, _0x4cad6b, _0x46f720, _0x4583b9) {
        let {
          phaseBreakdownIdentifier: _0x381137
        } = _0x3382f0;
        if (!_0x381137) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x381137.phaseBreakdownID).executeAllVerificationCommentsInIDE(_0x3382f0, _0x46f720, _0x4583b9, _0x4cad6b, this.upsertOnUIWithoutTimestamp);
      }
      async ["executeReviewCommentsInIDE"](_0x200caf, _0x53b83b, _0x318b04, _0x424d85) {
        let {
          phaseBreakdownIdentifier: _0x3b6254
        } = _0x200caf;
        if (!_0x3b6254) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x3b6254.phaseBreakdownID).executeReviewCommentsInIDE(_0x200caf, _0x53b83b, _0x318b04, _0x424d85), await this.upsertOnUI(true, false);
      }
      async ['executeAllReviewCommentsInIDE'](_0x2d7cca, _0x321b80, _0x3ff7ff, _0x3fd036) {
        let {
          phaseBreakdownIdentifier: _0xbb61d8
        } = _0x2d7cca;
        if (!_0xbb61d8) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0xbb61d8.phaseBreakdownID).executeAllReviewCommentsInIDE(_0x2d7cca, _0x3ff7ff, _0x3fd036, _0x321b80), await this.upsertOnUI(true, false);
      }
      async ["discardReviewComment"](_0x13def1, _0x3cbf7f) {
        let {
          phaseBreakdownIdentifier: _0x524e3f
        } = _0x13def1;
        if (!_0x524e3f) throw new Error('Phase breakdown identifier is required');
        this.getPhaseBreakdown(_0x524e3f.phaseBreakdownID).discardReviewComment(_0x13def1, _0x3cbf7f), await this.upsertOnUI(true, false);
      }
      async ["toggleReviewCommentsApplied"](_0x5d9f81, _0x3be7b5, _0x441e4c) {
        let {
          phaseBreakdownIdentifier: _0x2a6371
        } = _0x5d9f81;
        if (!_0x2a6371) throw new Error("Phase breakdown identifier is required");
        await this.getPhaseBreakdown(_0x2a6371.phaseBreakdownID).toggleReviewCommentsApplied(_0x5d9f81, _0x3be7b5, _0x441e4c), await this.upsertOnUI(true, false);
      }
      async ['setStepState'](_0x1d3fd3, _0x234b26, _0x5a0b7a) {
        let {
          phaseBreakdownIdentifier: _0x5b66a0
        } = _0x1d3fd3;
        if (!_0x5b66a0) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x5b66a0.phaseBreakdownID).setStepState(_0x1d3fd3.taskID, _0x234b26, _0x5a0b7a);
      }
      async ["handleThinkingStream"](_0x238a65, _0x453613, _0x135e1c) {
        await this.getPhaseBreakdown(_0x238a65.phaseBreakdownID).handleThinkingStream(_0x453613, _0x135e1c);
      }
      async ['handlePlanChatQueryType'](_0x596625, _0x28bbc7, _0x36a6a0) {
        let {
          phaseBreakdownIdentifier: _0x2e69f2
        } = _0x596625;
        if (!_0x2e69f2) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x2e69f2.phaseBreakdownID).handlePlanChatQueryType(_0x596625, _0x28bbc7, _0x36a6a0, this.upsertOnUIWithoutTimestamp), await this.upsertOnUI(false, false);
      }
      async ["handleImplementationPlanDelta"](_0x472f3e, _0xcb91c9) {
        let {
          phaseBreakdownIdentifier: _0x40ba13
        } = _0x472f3e;
        if (!_0x40ba13) throw new Error("Phase breakdown identifier is required");
        let _0x5eb0aa = await this.getPhaseBreakdown(_0x40ba13.phaseBreakdownID).handleImplementationPlanDelta(_0x472f3e, _0xcb91c9);
        await this.uiAdapter.postToUIPlanDelta(_0x472f3e, _0x5eb0aa);
      }
      async ['updateLastUpdatedTime']() {
        this._lastUpdatedTime = Date.now(), await this.persistenceManager.updateLastUpdatedTime();
      }
      async ['upsertOnUI'](_0x177160, _0x575488) {
        _0x177160 && (await this.updateLastUpdatedTime()), await this.postToUILight(_0x575488);
      }
      async ["postToUIHeavy"](_0x333b61) {
        let _0x2cc652 = await this.serializeToUI();
        await this.uiAdapter.postToUIHeavy(_0x2cc652, _0x333b61);
      }
      async ['postToUILight'](_0x117956) {
        let _0x2efbd7 = this.serializeToUILight();
        await this.uiAdapter.postToUILight(_0x2efbd7, _0x117956);
      }
      async ['updateTaskTitle'](_0x244929, _0x2894b7) {
        let {
          phaseBreakdownIdentifier: _0x40aab2
        } = _0x244929;
        if (!_0x40aab2) throw new Error("Phase breakdown identifier is required");
        return await this.getPhaseBreakdown(_0x40aab2.phaseBreakdownID).updateTaskTitle(_0x244929, _0x2894b7), this.upsertOnUI(false, false);
      }
      async ['updateTaskChainTitle'](_0x218b75) {
        return this._title = _0x218b75, await this.persistenceManager.upsertOnDisk(_0x4deda4 => {
          _0x4deda4.title = _0x218b75;
        }, true), this.upsertOnUI(false, false);
      }
      async ['updateTaskSummary'](_0x535a9d, _0x197bb9, _0x5d80d2) {
        let {
          phaseBreakdownIdentifier: _0x3973d9
        } = _0x535a9d;
        if (!_0x3973d9) throw new Error('Phase breakdown identifier is required');
        return await this.getPhaseBreakdown(_0x3973d9.phaseBreakdownID).updateTaskSummary(_0x535a9d, _0x197bb9, _0x5d80d2), this.upsertOnUI(false, false);
      }
      async ['startYoloMode'](_0x18f1c8, _0x419413) {
        let _0x2d1965 = this.getPhaseBreakdown(_0x18f1c8);
        if (_0x2d1965.tasks.length === 0) {
          vscode_module.window.showErrorMessage("Cannot start YOLO mode: No tasks available in phase breakdown");
          return;
        }
        await _0x2d1965.startYoloMode(_0x419413), await this.upsertOnUI(true, false);
      }
      async ['stopYoloMode'](_0x13780f) {
        await this.getPhaseBreakdown(_0x13780f).stopYoloMode(), await this.upsertOnUI(false, false);
      }
      async ["stopWaitingForExecution"](_0x426022, _0x337b99) {
        let {
          phaseBreakdownIdentifier: _0x2c9ff9
        } = _0x426022;
        if (!_0x2c9ff9) throw new Error('Phase breakdown identifier is required');
        await this.getPhaseBreakdown(_0x2c9ff9.phaseBreakdownID).stopWaitingForExecution(_0x426022, _0x337b99), await this.upsertOnUI(true, false);
      }
      async ["setTaskExecutionConfig"](_0x2b08d2, _0x44ae40, _0x1cba93, _0x35017b, _0x2ac6e9) {
        let _0x4ddef3 = this.getPhaseBreakdown(_0x2b08d2);
        if (!_0x4ddef3.getTask(_0x44ae40)) throw new Error("Task " + _0x44ae40 + " not found");
        if (_0x35017b && (await Vt.getInstance().setDefaultTaskExecutionConfig(_0x1cba93)), _0x2ac6e9) {
          for (let key of _0x4ddef3.tasks) await _0x4ddef3.setTaskExecutionConfig(key.id, _0x1cba93);
        } else await _0x4ddef3.setTaskExecutionConfig(_0x44ae40, _0x1cba93);
        await this.upsertOnUI(false, false);
      }
      async ['validateAndFixupAgentReferences']() {
        for (let key of this._phaseBreakdowns) await key.validateAndFixupAgentReferences();
        await this.upsertOnUI(false, false);
      }
    }, gD = class extends BaseStorage {
      async ["upsert"](_0x59d967, _0x9d752c) {
        let _0x13f0c4 = {
          ..._0x59d967,
          workspaces: (await workspace_info.getInstance().getCurrentWSInfo()).persistedWSAssociation
        };
        return super.upsert(_0x13f0c4, _0x9d752c);
      }
    };
  }),
  yD,
  initTaskChainExports = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initAnalytics(), initStatusBar(), initTaskChainPersistence(), initTaskChain(), yD = class {
      constructor(_0x281b2f) {
        this._activeTaskChains = new Map(), this._currentVisibleTaskChains = new lru_map_module.LRUMap(5), this._operationCounter = 0, this._taskChainIDs = new Set(), this._currentVisibleTaskChainMutex = new Mutex(), this._activeTaskChainsMutex = new Map(), this._pendingUIRequests = new Set(), this._inflightUIRequests = new Map(), this._client = _0x281b2f;
      }
      get ['taskChainIDs']() {
        return this._taskChainIDs;
      }
      get ['activeAndVisibleTaskChainIDs']() {
        let _0x5dc728 = new Set(this._activeTaskChains.keys());
        for (let [_0x365fb8] of this._currentVisibleTaskChains) _0x5dc728.add(_0x365fb8);
        return _0x5dc728;
      }
      ['deregisterTaskChainID'](_0x5f325d) {
        this._taskChainIDs.delete(_0x5f325d), this._pendingUIRequests.delete(_0x5f325d), this._inflightUIRequests.delete(_0x5f325d), this._currentVisibleTaskChains.delete(_0x5f325d), this._activeTaskChains.delete(_0x5f325d), this._activeTaskChainsMutex.delete(_0x5f325d);
      }
      ['registerTaskChainID'](_0x480c1) {
        this._taskChainIDs.add(_0x480c1);
      }
      async ['createNewTaskChain'](_0x555ed5) {
        let {
            taskChainID: _0x2ca37b,
            title: _0x1190db,
            displayState: _0xec7454
          } = _0x555ed5,
          _0x3f2eff = await workspace_info.getInstance().getCurrentWSInfo(),
          _0x5d9e1c = await v0.createNewInstance({
            client: this._client,
            id: _0x2ca37b,
            title: _0x1190db,
            displayState: _0xec7454,
            creationTimestamp: Date.now(),
            lastUpdatedTime: Date.now(),
            persistedWS: _0x3f2eff.persistedWSAssociation,
            workspaceScope: _0x3f2eff.workspaceScope
          });
        return this._currentVisibleTaskChains.set(_0x2ca37b, _0x5d9e1c), this._taskChainIDs.add(_0x2ca37b), yn.getInstance().increment("task_chain_creation", null), _0x5d9e1c;
      }
      async ["addTaskChainFromPersistedTicket"](_0x4ec097, _0x16067d, _0x5b97b0) {
        let _0xda9046 = await v0.deserializeFromPersistedTicket(_0x16067d, _0x4ec097, this._client, _0x5b97b0);
        return this._currentVisibleTaskChains.set(_0xda9046.id, _0xda9046), this._taskChainIDs.add(_0xda9046.id), await _0xda9046.upsertOnUI(true, false), _0xda9046;
      }
      async ["getAndResetCurrentlyVisibleTaskChain"](_0x228395) {
        let _0x2355c7 = this._currentVisibleTaskChains.get(_0x228395);
        if (_0x2355c7) return _0x2355c7;
        let _0x37665d = await this._currentVisibleTaskChainMutex.acquire();
        try {
          let _0x47771f = this._activeTaskChains.get(_0x228395);
          if (_0x47771f?.['taskChain']) return this._currentVisibleTaskChains.set(_0x228395, _0x47771f.taskChain), _0x47771f.taskChain;
          {
            let _0x10d753 = await this.getTaskChainFromPersistence(_0x228395);
            return this._currentVisibleTaskChains.set(_0x228395, _0x10d753), _0x10d753;
          }
        } finally {
          _0x37665d();
        }
      }
      async ['heavySyncTaskChainToUI'](_0x1d0035, _0x186e44) {
        if (this._pendingUIRequests.has(_0x1d0035)) return;
        if (this._pendingUIRequests.add(_0x1d0035), this._inflightUIRequests.has(_0x1d0035)) try {
          await this._inflightUIRequests.get(_0x1d0035);
        } catch (_0x4758c7) {
          Logger.warn('Error updating task chain ' + _0x1d0035 + " to UI: " + _0x4758c7);
        } finally {
          this._inflightUIRequests.delete(_0x1d0035);
        }
        let _0x4ddf5d = (async () => (await this.getAndResetCurrentlyVisibleTaskChain(_0x1d0035)).postToUIHeavy(_0x186e44))();
        return this._inflightUIRequests.set(_0x1d0035, _0x4ddf5d), this._pendingUIRequests.delete(_0x1d0035), _0x4ddf5d;
      }
      ['getActiveTaskChain'](_0x13478e) {
        let _0x2763e6 = this._activeTaskChains.get(_0x13478e);
        if (_0x2763e6?.['taskChain']) return _0x2763e6.taskChain;
        throw new Error('Task chain with id ' + _0x13478e + ' not found');
      }
      async ["withConnectionTracking"](_0x58a521, _0x10c875) {
        let _0x5adf9e = _0x58a521?.["taskChainID"];
        if (!_0x5adf9e) throw new Error('Task chain ID is required');
        let _0x10a5d2 = '' + ++this._operationCounter,
          _0x49100c = await this.getAndRegisterTaskChain(_0x5adf9e, _0x10a5d2);
        try {
          return await _0x10c875(_0x49100c);
        } finally {
          await this.deregisterConnection(_0x5adf9e, _0x10a5d2);
        }
      }
      ['hasActiveConnection'](_0x37cb4a) {
        let _0x30403c = _0x37cb4a?.['taskChainID'];
        return _0x30403c ? this._activeTaskChains.get(_0x30403c)?.['taskChain'] !== null : false;
      }
      ["dispose"]() {
        this._activeTaskChains.clear(), this._currentVisibleTaskChains.clear(), this._operationCounter = 0;
      }
      async ['getAndRegisterTaskChain'](_0x30d3b6, _0x1cb95a) {
        let _0x2b35f0 = this._currentVisibleTaskChains.get(_0x30d3b6);
        if (_0x2b35f0) {
          let _0xf55397 = this._activeTaskChains.get(_0x30d3b6);
          return _0xf55397 ? _0xf55397.connections.add(_0x1cb95a) : this._activeTaskChains.set(_0x30d3b6, {
            connections: new Set([_0x1cb95a]),
            taskChain: _0x2b35f0
          }), _0x2b35f0;
        }
        let _0x19ef86 = this._activeTaskChains.get(_0x30d3b6);
        if (_0x19ef86?.['taskChain']) return _0x19ef86.connections.add(_0x1cb95a), _0x19ef86.taskChain;
        {
          let _0x20b5ce = await this.getOrCreateActiveTaskChainsMutex(_0x30d3b6).acquire();
          try {
            let _0x1bd7ea = await this.getTaskChainFromPersistence(_0x30d3b6),
              _0x58503c = {
                connections: new Set([...(_0x19ef86?.["connections"] || []), _0x1cb95a]),
                taskChain: _0x1bd7ea
              };
            return this._activeTaskChains.set(_0x30d3b6, _0x58503c), _0x1bd7ea;
          } finally {
            _0x20b5ce();
          }
        }
      }
      ["getOrCreateActiveTaskChainsMutex"](_0x5abeeb) {
        let _0x324183 = this._activeTaskChainsMutex.get(_0x5abeeb);
        return _0x324183 || (_0x324183 = new Mutex(), this._activeTaskChainsMutex.set(_0x5abeeb, _0x324183)), _0x324183;
      }
      async ["getTaskChainFromPersistence"](_0x32a1d9) {
        let _0x180b51 = await TaskChainPersistence.getInstance().read(_0x32a1d9);
        return v0.deserializeFromStorage(_0x180b51, this._client);
      }
      async ["deregisterConnection"](_0x1f6806, _0xe78ee5) {
        let _0x29bb31 = await this.getOrCreateActiveTaskChainsMutex(_0x1f6806).acquire();
        try {
          let _0x150e7c = this._activeTaskChains.get(_0x1f6806);
          _0x150e7c && (_0x150e7c.connections.delete(_0xe78ee5), _0x150e7c.connections.size === 0 && (_0x150e7c.taskChain = null, this._activeTaskChains.delete(_0x1f6806), this._activeTaskChainsMutex.delete(_0x1f6806)));
        } finally {
          _0x29bb31();
        }
      }
    };
  }),
  zn,
  initTaskRunner = __esmModule(() => {
    'use strict';

    initTaskChainPersistence(), initTaskPlanExports(), initCommentNavigatorDeps(), initMcpHandler(), initTaskChainExports(), zn = class _0x17835e {
      constructor(_0x48dab9) {
        this._isBootstrapping = false, this.client = _0x48dab9, this.taskChainMemoryManager = new yD(_0x48dab9);
      }
      static ['getInstance'](_0x583b66) {
        if (!_0x17835e.instance) {
          if (!_0x583b66) throw new Error('Need client to initalize task chain tracker the first time.');
          _0x17835e.instance = new _0x17835e(_0x583b66);
        }
        return _0x17835e.instance;
      }
      async ['setIsBootstrapping'](_0x5a8a6b) {
        return this._isBootstrapping = _0x5a8a6b, this.postIsBootstrappingToUI();
      }
      ["postIsBootstrappingToUI"]() {
        Bf.getInstance().enqueueOrSendToCommentNavigator({
          type: _n.TASK_LIST_BOOTSTRAPPING,
          isLoading: this._isBootstrapping
        });
      }
      ["dispose"]() {
        this.taskChainMemoryManager.dispose();
      }
      async ["abortTask"](_0x47ab21) {
        let {
            planIdentifier: _0x467fc3
          } = _0x47ab21,
          _0x2ac590 = _0x467fc3.phaseBreakdownIdentifier;
        if (this.taskChainMemoryManager.hasActiveConnection(_0x2ac590)) return this.taskChainMemoryManager.withConnectionTracking(_0x2ac590, async _0xf0db1d => {
          await _0xf0db1d.abortTask(_0x467fc3);
        });
        throw new Error('Task chain ' + _0x2ac590?.["taskChainID"] + " does not have an active connection");
      }
      async ['abortPrePhase'](_0x10d06c) {
        let {
          phaseBreakdownIdentifier: _0x346897
        } = _0x10d06c;
        if (this.taskChainMemoryManager.hasActiveConnection(_0x346897)) return this.taskChainMemoryManager.withConnectionTracking(_0x346897, async _0x57a962 => {
          await _0x57a962.abortPrePhase(_0x346897);
        });
        throw new Error("Task chain " + _0x346897?.['taskChainID'] + ' does not have an active connection');
      }
      async ["deletePhaseConversation"](_0x43468b) {
        let {
          phaseConversationIdentifier: _0xb00c63
        } = _0x43468b;
        return this.taskChainMemoryManager.withConnectionTracking(_0xb00c63.phaseBreakdownIdentifier, async _0x3a022e => {
          await _0x3a022e.deletePhaseConversation(_0xb00c63);
        });
      }
      async ["exportPhaseBreakdown"](_0x542b07) {
        let {
          phaseBreakdownIdentifier: _0x2c5f66,
          selectedPhaseIds: _0x4389ce,
          agent: _0x4969ea
        } = _0x542b07;
        return this.taskChainMemoryManager.withConnectionTracking(_0x2c5f66, async _0x5a5125 => {
          await _0x5a5125.exportPhaseBreakdown(_0x2c5f66, _0x4969ea, _0x4389ce);
        });
      }
      async ["startTaskVerification"](_0x47a312) {
        let {
          taskIdentifier: _0x454c61,
          isPayAsYouGo: _0x48d16e
        } = _0x47a312;
        return this.taskChainMemoryManager.withConnectionTracking(_0x454c61.phaseBreakdownIdentifier, async _0x364751 => {
          await _0x364751.startTaskVerification(_0x454c61, _0x48d16e);
        });
      }
      async ["skipTaskVerification"](_0x2fe16f) {
        let {
          taskIdentifier: _0x4bae80
        } = _0x2fe16f;
        return this.taskChainMemoryManager.withConnectionTracking(_0x4bae80.phaseBreakdownIdentifier, async _0x8f8ddb => {
          await _0x8f8ddb.setStepState(_0x4bae80, 'verification', pe.SKIPPED), await _0x8f8ddb.upsertOnUI(true, false);
        });
      }
      async ["reVerifyTask"](_0x2c3806) {
        let {
          verificationIdentifier: _0xe0d1bf
        } = _0x2c3806;
        return this.taskChainMemoryManager.withConnectionTracking(_0xe0d1bf.phaseBreakdownIdentifier, async _0xd75a79 => {
          await _0xd75a79.reVerifyTask(_0xe0d1bf);
        });
      }
      async ["discardVerificationComment"](_0x31382a) {
        let {
          verificationIdentifier: _0x5b2f9e,
          verificationCommentIDs: _0x499a8f
        } = _0x31382a;
        return this.taskChainMemoryManager.withConnectionTracking(_0x5b2f9e.phaseBreakdownIdentifier, async _0x3bfd45 => {
          await _0x3bfd45.discardVerificationComment(_0x5b2f9e, _0x499a8f);
        });
      }
      async ['toggleVerificationCommentsApplied'](_0x15521a) {
        let {
          verificationIdentifier: _0x336ff2,
          verificationCommentIDs: _0x10be06,
          makeApplied: _0x527af8
        } = _0x15521a;
        if (_0x10be06.length !== 0) return this.taskChainMemoryManager.withConnectionTracking(_0x336ff2.phaseBreakdownIdentifier, async _0x32f385 => {
          await _0x32f385.toggleVerificationCommentsApplied(_0x336ff2, _0x10be06, _0x527af8);
        });
      }
      async ['executeVerificationCommentsInIDE'](_0x2b0d17) {
        let {
          verificationIdentifier: _0x31145f,
          verificationCommentIDs: _0x2bb8dd,
          agent: _0x23c38a,
          promptTemplateFilePath: _0x8dcd79
        } = _0x2b0d17;
        return this.taskChainMemoryManager.withConnectionTracking(_0x31145f.phaseBreakdownIdentifier, async _0x5a48e7 => {
          await _0x5a48e7.executeVerificationCommentsInIDE(_0x31145f, _0x2bb8dd, _0x23c38a, _0x8dcd79);
        });
      }
      async ['executeAllVerificationCommentsInIDE'](_0x2b54bb) {
        let {
          verificationIdentifier: _0x5b836c,
          agent: _0x17704a,
          filter: _0x1f9d46,
          promptTemplateFilePath: _0xf39fd3
        } = _0x2b54bb;
        return this.taskChainMemoryManager.withConnectionTracking(_0x5b836c.phaseBreakdownIdentifier, async _0x211a15 => {
          await _0x211a15.executeAllVerificationCommentsInIDE(_0x5b836c, _0x1f9d46, _0x17704a, _0xf39fd3);
        });
      }
      async ["executeReviewCommentsInIDE"](_0x1e2c86) {
        let {
          planIdentifier: _0x40ba9b,
          reviewCommentIDs: _0x135939,
          agent: _0x4df598,
          promptTemplateFilePath: _0x5826bc
        } = _0x1e2c86;
        return this.taskChainMemoryManager.withConnectionTracking(_0x40ba9b.phaseBreakdownIdentifier, async _0x5070e4 => {
          await _0x5070e4.executeReviewCommentsInIDE(_0x40ba9b, _0x135939, _0x4df598, _0x5826bc);
        });
      }
      async ["executeAllReviewCommentsInIDE"](_0x525e87) {
        let {
          planIdentifier: _0x1b13cb,
          filter: _0x54eb27,
          agent: _0x27c430,
          promptTemplateFilePath: _0x12c4d0
        } = _0x525e87;
        return this.taskChainMemoryManager.withConnectionTracking(_0x1b13cb.phaseBreakdownIdentifier, async _0x4dad83 => {
          await _0x4dad83.executeAllReviewCommentsInIDE(_0x1b13cb, _0x54eb27, _0x27c430, _0x12c4d0);
        });
      }
      async ["discardReviewComment"](_0x52b75a) {
        let {
          planIdentifier: _0x1a855b,
          reviewCommentIDs: _0x76ba2c
        } = _0x52b75a;
        return this.taskChainMemoryManager.withConnectionTracking(_0x1a855b.phaseBreakdownIdentifier, async _0xc99741 => {
          await _0xc99741.discardReviewComment(_0x1a855b, _0x76ba2c);
        });
      }
      async ["toggleReviewCommentsApplied"](_0x1fef3a) {
        let {
          planIdentifier: _0x57871d,
          reviewCommentIDs: _0x4ba7a5,
          makeApplied: _0x1d1470
        } = _0x1fef3a;
        if (_0x4ba7a5.length !== 0) return this.taskChainMemoryManager.withConnectionTracking(_0x57871d.phaseBreakdownIdentifier, async _0x54c32d => {
          await _0x54c32d.toggleReviewCommentsApplied(_0x57871d, _0x4ba7a5, _0x1d1470);
        });
      }
      async ['addTaskChainFromPersistedTicket'](_0x26fe00, _0x41c3e3, _0x4686f6) {
        return this.taskChainMemoryManager.addTaskChainFromPersistedTicket(_0x26fe00, _0x41c3e3, _0x4686f6);
      }
      async ["getOrCreateTaskChain"](_0x44e2b6, _0x362d53) {
        let _0x14198a = _0x44e2b6?.["taskChainID"];
        if (!_0x14198a) throw new Error("Task chain ID is required");
        return this.taskChainMemoryManager.taskChainIDs.has(_0x14198a) ? this.taskChainMemoryManager.getAndResetCurrentlyVisibleTaskChain(_0x14198a) : this.taskChainMemoryManager.createNewTaskChain({
          taskChainID: _0x14198a,
          title: '',
          displayState: _0x362d53
        });
      }
      async ['insertTask'](_0x5afa64) {
        let {
          planIdentifier: _0x190cf6,
          queryContent: _0x417b56,
          taskIndex: _0x3f0bb2,
          planArtifactType: _0x5e62e1
        } = _0x5afa64;
        return this.taskChainMemoryManager.withConnectionTracking(_0x190cf6.phaseBreakdownIdentifier, async _0x3cc077 => {
          await _0x3cc077.insertTask(_0x190cf6, _0x417b56, _0x5e62e1, _0x3f0bb2);
        });
      }
      async ["newTask"](_0x53db0f) {
        let {
          planIdentifier: _0x18bca4,
          queryContent: _0x20ea15,
          isPayAsYouGo: _0x22d0c4,
          planArtifactType: _0x3f533f
        } = _0x53db0f;
        return await this.getOrCreateTaskChain(_0x18bca4.phaseBreakdownIdentifier, 'SHOW_ACTIVE_TASK'), this.taskChainMemoryManager.withConnectionTracking(_0x18bca4.phaseBreakdownIdentifier, async _0x21410c => {
          try {
            await _0x21410c.generatePlan(_0x18bca4, _0x20ea15, _0x3f533f, _0x22d0c4);
          } catch (_0x1298e8) {
            throw Logger.error(_0x1298e8, 'Error creating new task', formatErrorToString(_0x1298e8)), !(_0x1298e8 instanceof PlanGenerationFailedError) && !(_0x1298e8 instanceof PlanExecutionFailedError) && vscode_module.window.showErrorMessage("Failed to create new task: " + (_0x1298e8 instanceof Error ? _0x1298e8.message : String(_0x1298e8))), _0x1298e8 instanceof GenericPlanError && _0x21410c && (await _0x21410c.updateStepState(_0x18bca4, 'planGeneration', pe.NOT_STARTED, true)), new Error('Failed to create new task: ' + (_0x1298e8 instanceof Error ? _0x1298e8.message : String(_0x1298e8)), {
              cause: _0x1298e8
            });
          }
        });
      }
      async ['newTaskBreakdown'](_0x46a0a6) {
        let {
          phaseConversationIdentifier: _0x419c94,
          queryContent: _0x9069a3,
          interviewQuestionAnswers: _0x4eebc5
        } = _0x46a0a6;
        return await this.getOrCreateTaskChain(_0x419c94.phaseBreakdownIdentifier, "SHOW_PRE_PHASE"), this.taskChainMemoryManager.withConnectionTracking(_0x419c94.phaseBreakdownIdentifier, async _0x1f9dc5 => {
          await _0x1f9dc5.generatePhases(_0x419c94, _0x9069a3, false, _0x4eebc5);
        });
      }
      async ['reorderTasks'](_0x3fb2e4) {
        let {
          phaseBreakdownIdentifier: _0x4c2c7b,
          tasks: _0x30a2be
        } = _0x3fb2e4;
        return this.taskChainMemoryManager.withConnectionTracking(_0x4c2c7b, async _0x55422a => {
          await _0x55422a.reorderTasks(_0x4c2c7b, _0x30a2be);
        });
      }
      async ['updateTaskQuery'](_0x53efb1) {
        let {
          planIdentifier: _0x56b626,
          queryContent: _0x126929,
          planArtifactType: _0x554156
        } = _0x53efb1;
        return this.taskChainMemoryManager.withConnectionTracking(_0x56b626.phaseBreakdownIdentifier, async _0x353433 => {
          await _0x353433.updateTaskQuery(_0x56b626, _0x126929, _0x554156);
        });
      }
      async ['editPrePhaseConversation'](_0x2f014) {
        let {
          phaseConversationIdentifier: _0xf66224,
          queryContent: _0x2e6087,
          isPayAsYouGo: _0x3cf589,
          interviewQuestionAnswers: _0x5398a4
        } = _0x2f014;
        return this.taskChainMemoryManager.withConnectionTracking(_0xf66224.phaseBreakdownIdentifier, async _0x543e94 => {
          await _0x543e94.editPrePhaseConversation(_0xf66224, _0x2e6087, _0x3cf589, _0x5398a4);
        });
      }
      async ['planIterationUserQuery'](_0x17fe20) {
        let {
          planIdentifier: _0x4279e5,
          queryContent: _0x43f9fa,
          isPayAsYouGo: _0x39d077
        } = _0x17fe20;
        return this.taskChainMemoryManager.withConnectionTracking(_0x4279e5.phaseBreakdownIdentifier, async _0x8bf80b => {
          await _0x8bf80b.planIteration(_0x4279e5, _0x43f9fa, _0x39d077);
        });
      }
      async ["updateFailedPlanIterationQuery"](_0x22a6ac) {
        let {
          planIdentifier: _0x186986,
          queryContent: _0xd5aa8e
        } = _0x22a6ac;
        return this.taskChainMemoryManager.withConnectionTracking(_0x186986.phaseBreakdownIdentifier, async _0x3e0c06 => {
          await _0x3e0c06.updateFailedPlanIterationQuery(_0x186986, _0xd5aa8e);
        });
      }
      async ['updateFailedOrAbortedConversationQuery'](_0x3c8262) {
        let {
          phaseConversationIdentifier: _0xce386d,
          queryContent: _0x63d3d2
        } = _0x3c8262;
        return this.taskChainMemoryManager.withConnectionTracking(_0xce386d.phaseBreakdownIdentifier, async _0x5a329d => {
          await _0x5a329d.updateFailedOrAbortedConversationQuery(_0xce386d, _0x63d3d2);
        });
      }
      async ['disposeVerification'](_0x3969d) {
        let {
          planIdentifier: _0x5909f7
        } = _0x3969d;
        return this.taskChainMemoryManager.withConnectionTracking(_0x5909f7.phaseBreakdownIdentifier, async _0x22be50 => {
          await _0x22be50.disposeVerification(_0x5909f7);
        });
      }
      async ["discardPlan"](_0x48e49d) {
        let {
          planIdentifier: _0x53e29b
        } = _0x48e49d;
        return this.taskChainMemoryManager.withConnectionTracking(_0x53e29b.phaseBreakdownIdentifier, async _0x5ea677 => {
          await _0x5ea677.discardPlan(_0x53e29b);
        });
      }
      async ['markPlanAsExecuted'](_0x2a4a17) {
        let {
          planIdentifier: _0xae3cb3
        } = _0x2a4a17;
        return this.taskChainMemoryManager.withConnectionTracking(_0xae3cb3.phaseBreakdownIdentifier, async _0x2391ce => {
          await _0x2391ce.markPlanAsExecuted(_0xae3cb3);
        });
      }
      async ["deleteTaskChainById"](_0x5134f9) {
        await TaskChainPersistence.getInstance().deleteItem(_0x5134f9), this.taskChainMemoryManager.deregisterTaskChainID(_0x5134f9);
      }
      async ['deleteTask'](_0x47548f) {
        let {
          taskIdentifier: _0x143b99
        } = _0x47548f;
        return this.taskChainMemoryManager.withConnectionTracking(_0x143b99.phaseBreakdownIdentifier, async _0x3ab50a => {
          await _0x3ab50a.deleteTask(_0x143b99);
        });
      }
      async ["deleteTaskChain"](_0x390986) {
        let _0x4af027 = _0x390986.taskChainIDs.map(_0x2f53f4 => this.deleteTaskChainById(_0x2f53f4));
        await Promise.all(_0x4af027);
      }
      async ["updateTaskSummary"](_0x2e03bc) {
        let {
          planIdentifier: _0x26eb07,
          attachmentSummaries: _0x2156fd,
          planSummary: _0x340046
        } = _0x2e03bc;
        if (!_0x26eb07) throw new Error('Plan identifier is required');
        return this.taskChainMemoryManager.withConnectionTracking(_0x26eb07.phaseBreakdownIdentifier, async _0x123b93 => {
          await _0x123b93.updateTaskSummary(_0x26eb07, _0x2156fd, _0x340046);
        });
      }
      async ["handleTaskTitle"](_0x18e19c) {
        let {
          title: _0x3c94c1,
          taskIdentifier: _0x210036
        } = _0x18e19c;
        if (!_0x210036) throw new Error('Plan identifier is required');
        return this.taskChainMemoryManager.withConnectionTracking(_0x210036.phaseBreakdownIdentifier, async _0x1e9487 => {
          await _0x1e9487.updateTaskTitle(_0x210036, _0x3c94c1);
        });
      }
      async ['handleTaskChainTitle'](_0x5531b6) {
        let {
          title: _0x42444f,
          taskChainID: _0x2dc6be
        } = _0x5531b6;
        return this.taskChainMemoryManager.withConnectionTracking({
          taskChainID: _0x2dc6be,
          phaseBreakdownID: ''
        }, async _0x6f1f63 => {
          await _0x6f1f63.updateTaskChainTitle(_0x42444f);
        });
      }
      async ["executeInIDE"](_0x35d9ae) {
        let {
          planIdentifier: _0x29cefd,
          agent: _0x2f9757,
          promptTemplateFilePath: _0x3bc590
        } = _0x35d9ae;
        return this.taskChainMemoryManager.withConnectionTracking(_0x29cefd.phaseBreakdownIdentifier, async _0x270b2d => {
          await _0x270b2d.executeInIDE(_0x29cefd, _0x2f9757, _0x3bc590);
        });
      }
      async ["postTaskChainToUI"](_0x592249) {
        let {
          taskChainID: _0x1fa22c,
          silentlyUpdateUI: _0x361bf4
        } = _0x592249;
        return this.taskChainMemoryManager.heavySyncTaskChainToUI(_0x1fa22c, _0x361bf4);
      }
      async ['handleImplementationPlanDelta'](_0x997f4a) {
        let {
          planIdentifier: _0x101e60,
          outputDelta: _0x1b9453
        } = _0x997f4a;
        if (!_0x101e60) throw new Error('Plan identifier is required');
        let {
          phaseBreakdownIdentifier: _0x262bb2
        } = _0x101e60;
        if (!_0x262bb2) throw new Error("Phase breakdown identifier is required");
        return this.taskChainMemoryManager.getActiveTaskChain(_0x262bb2.taskChainID).handleImplementationPlanDelta(_0x101e60, _0x1b9453);
      }
      async ["handleThinkingStream"](_0x33a8c0) {
        let {
          artifactIdentifier: _0x18daab,
          thinking: _0x28e77c
        } = _0x33a8c0;
        if (!_0x18daab) throw new Error("Artifact identifier is required");
        if (!_0x28e77c) throw new Error("Thinking is required");
        let _0x52bd78;
        if (_0x18daab.phaseConversationIdentifier) _0x52bd78 = _0x18daab.phaseConversationIdentifier.phaseBreakdownIdentifier;else {
          if (_0x18daab.planIdentifier) _0x52bd78 = _0x18daab.planIdentifier.phaseBreakdownIdentifier;else {
            if (_0x18daab.verificationIdentifier) _0x52bd78 = _0x18daab.verificationIdentifier.phaseBreakdownIdentifier;else {
              if (_0x18daab.planChatIdentifier) _0x52bd78 = _0x18daab.planChatIdentifier.planIdentifier?.['phaseBreakdownIdentifier'];else {
                if (_0x18daab.taskIdentifier) _0x52bd78 = _0x18daab.taskIdentifier.phaseBreakdownIdentifier;else throw new Error("Invalid artifact identifier");
              }
            }
          }
        }
        if (!_0x52bd78) throw new Error("Phase breakdown identifier is required");
        return this.taskChainMemoryManager.getActiveTaskChain(_0x52bd78.taskChainID).handleThinkingStream(_0x52bd78, _0x18daab, _0x28e77c);
      }
      async ["handlePlanChatQueryType"](_0x40ba4e) {
        let {
            planChatIdentifier: _0x3cd6ff,
            queryType: _0x338fc3
          } = _0x40ba4e,
          _0x6fea54 = _0x3cd6ff?.["planIdentifier"];
        if (!_0x6fea54) throw new Error('Plan chat identifier is required');
        let {
          phaseBreakdownIdentifier: _0x238452
        } = _0x6fea54;
        if (!_0x238452) throw new Error("Phase breakdown identifier is required");
        return this.taskChainMemoryManager.getActiveTaskChain(_0x238452.taskChainID).handlePlanChatQueryType(_0x6fea54, _0x338fc3, _0x3cd6ff.newPlanID);
      }
      async ["addLightTaskChainFromStorage"](_0x219ccd) {
        let _0x1fe64f = await HM.fromPersisted(_0x219ccd);
        this.taskChainMemoryManager.registerTaskChainID(_0x1fe64f.id), await new TaskChainNotifier(Qe).postToUILight(_0x1fe64f, true);
      }
      async ["fetchTaskHistory"]() {
        if (!this._isBootstrapping) {
          await this.setIsBootstrapping(true);
          try {
            await TaskChainPersistence.getInstance().bootstrapFromDisk();
          } finally {
            await this.setIsBootstrapping(false);
          }
        }
      }
      ["getAllTaskChainIDs"]() {
        return Array.from(this.taskChainMemoryManager.taskChainIDs.keys());
      }
      ["getAllActiveAndVisibleTaskChainIDs"]() {
        return this.taskChainMemoryManager.activeAndVisibleTaskChainIDs;
      }
      async ["executeQueryDirectlyInIDE"](_0x4c3e8a) {
        let {
          planIdentifier: _0x5ed33f,
          agent: _0x4a5a24,
          promptTemplateFilePath: _0x367eb2,
          queryContent: _0x186678,
          planArtifactType: _0x46f963
        } = _0x4c3e8a;
        return this.taskChainMemoryManager.withConnectionTracking(_0x5ed33f.phaseBreakdownIdentifier, async _0x28c671 => {
          await _0x28c671.executeQueryDirectlyInIDE(_0x5ed33f, _0x4a5a24, _0x367eb2, _0x186678, _0x46f963);
        });
      }
      async ['startYoloMode'](_0x31a79e) {
        let {
          phaseBreakdownIdentifier: _0x5bff00,
          yoloTaskIds: _0x47dd6f
        } = _0x31a79e;
        return this.taskChainMemoryManager.withConnectionTracking(_0x5bff00, async _0x45213f => {
          await _0x45213f.startYoloMode(_0x5bff00.phaseBreakdownID, _0x47dd6f);
        });
      }
      async ["stopYoloMode"](_0xdd43f) {
        let {
          phaseBreakdownIdentifier: _0x3f0bf8
        } = _0xdd43f;
        return this.taskChainMemoryManager.withConnectionTracking(_0x3f0bf8, async _0x263ceb => {
          await _0x263ceb.stopYoloMode(_0x3f0bf8.phaseBreakdownID);
        });
      }
      async ["setTaskExecutionConfig"](_0x6b63c1) {
        let {
          phaseBreakdownIdentifier: _0x2b04df,
          taskId: _0x30750e,
          executionConfig: _0xa8f0ef,
          setAsDefault: _0x44fb5e,
          applyToAllTasks: _0x5dca64
        } = _0x6b63c1;
        return this.taskChainMemoryManager.withConnectionTracking(_0x2b04df, async _0x20bf8b => {
          await _0x20bf8b.setTaskExecutionConfig(_0x2b04df.phaseBreakdownID, _0x30750e, _0xa8f0ef, _0x44fb5e, _0x5dca64);
        });
      }
      async ['stopWaitingForExecution'](_0x5bd229) {
        let {
          planIdentifier: _0x19da0b,
          step: _0x1b48f5
        } = _0x5bd229;
        return this.taskChainMemoryManager.withConnectionTracking(_0x19da0b.phaseBreakdownIdentifier, async _0x250c97 => {
          await _0x250c97.stopWaitingForExecution(_0x19da0b, _0x1b48f5);
        });
      }
      async ["resetReverificationState"](_0x29b435) {
        let {
          planIdentifier: _0x9beaa8
        } = _0x29b435;
        return this.taskChainMemoryManager.withConnectionTracking(_0x9beaa8.phaseBreakdownIdentifier, async _0x17a604 => {
          await _0x17a604.resetReverificationState(_0x9beaa8);
        });
      }
      async ['validateAndFixupAgentReferences']() {
        let _0x25f637 = this.getAllActiveAndVisibleTaskChainIDs();
        await Promise.all(Array.from(_0x25f637).map(async _0x2337dd => {
          await this.taskChainMemoryManager.withConnectionTracking({
            taskChainID: _0x2337dd,
            phaseBreakdownID: ''
          }, async _0x4ee0dc => {
            await _0x4ee0dc.validateAndFixupAgentReferences();
          });
        }));
      }
    };
  }),
  Vt,
  initTaskContext = __esmModule(() => {
    'use strict';

    initIDEAgentManager(), initWorkspaceInfo(), initWorkspaceSettingsPersistence(), initStatusBar(), initTaskRunner(), initTemplateManager(), initUsageInfoHandler(), Vt = class _0x43a5b4 {
      static {
        this.instance = null;
      }
      static ["getInstance"]() {
        if (!_0x43a5b4.instance) {
          let _0x402f9e = workspace_info.getInstance().getWorkspaceDirs();
          if (_0x402f9e.length === 0) throw new Error('No workspace found');
          let _0x1c6724 = _0x402f9e[0];
          _0x43a5b4.instance = new _0x43a5b4(_0x1c6724);
        }
        return _0x43a5b4.instance;
      }
      constructor(_0xd1c244, _0x3ad3cb = null, _0x5b3263 = null, _0x53c3aa = null, _0x2c16c9 = null, _0xa69d1f = false) {
        this._workspaceId = _0xd1c244, this._selectedMCPParent = _0x3ad3cb, this._activePromptTemplates = _0x5b3263, this._lastUsedIDEAgents = _0x53c3aa, this._defaultTaskExecutionConfig = _0x2c16c9, this._interviewTextOnlyMode = _0xa69d1f;
        let _0xc20a12 = WorkspaceSettingsPersistence.getInstance();
        this.storageAPI = new AttachmentStorage(_0xc20a12, this._workspaceId);
      }
      get ['workspaceId']() {
        return this._workspaceId;
      }
      get ['selectedMCPParent']() {
        return this._selectedMCPParent;
      }
      get ["interviewTextOnlyMode"]() {
        return this._interviewTextOnlyMode;
      }
      get ['activePromptTemplates']() {
        return this._activePromptTemplates || (this._activePromptTemplates = {
          plan: null,
          verification: null,
          generic: null,
          review: null,
          userQuery: null
        }), this._activePromptTemplates;
      }
      get ["lastUsedIDEAgents"]() {
        return this._lastUsedIDEAgents || (this._lastUsedIDEAgents = {
          plan: workspace_info.getInstance().getIdeAgentInfo(),
          verification: workspace_info.getInstance().getIdeAgentInfo(),
          review: workspace_info.getInstance().getIdeAgentInfo(),
          userQuery: workspace_info.getInstance().getIdeAgentInfo()
        }, this.upsertToStorageInBackground()), this._lastUsedIDEAgents;
      }
      get ["defaultTaskExecutionConfig"]() {
        if (!this._defaultTaskExecutionConfig) {
          let _0x3040e2 = getAllAvailableAgents();
          this._defaultTaskExecutionConfig = {
            plan: {
              ideAgent: _0x3040e2.find(_0xafccc0 => isTerminalAgent(_0xafccc0)) ?? this.lastUsedIDEAgents.plan,
              skipStep: false,
              promptTemplateFilePath: this.activePromptTemplates.plan?.["filePath"] ?? this.activePromptTemplates.generic?.["filePath"] ?? br.getInstance().getDefaultPromptTemplateFilePath("plan"),
              executionTimeoutMinutes: 10
            },
            review: {
              ideAgent: _0x3040e2.find(_0x4c40f8 => isTerminalAgent(_0x4c40f8)) ?? this.lastUsedIDEAgents.review,
              skipStep: false,
              promptTemplateFilePath: this.activePromptTemplates.review?.["filePath"] ?? this.activePromptTemplates.generic?.["filePath"] ?? br.getInstance().getDefaultPromptTemplateFilePath('review'),
              reviewCategories: [],
              executionTimeoutMinutes: 10
            },
            verification: {
              ideAgent: _0x3040e2.find(_0x206dea => isTerminalAgent(_0x206dea)) ?? this.lastUsedIDEAgents.verification,
              skipStep: false,
              promptTemplateFilePath: this.activePromptTemplates.verification?.["filePath"] ?? this.activePromptTemplates.generic?.['filePath'] ?? br.getInstance().getDefaultPromptTemplateFilePath('verification'),
              verificationSeverities: [],
              maxReVerificationAttempts: 3,
              executionTimeoutMinutes: 10
            },
            userQuery: {
              ideAgent: _0x3040e2.find(_0x2bf511 => isTerminalAgent(_0x2bf511)) ?? this.lastUsedIDEAgents.userQuery,
              skipStep: false,
              promptTemplateFilePath: this.activePromptTemplates.userQuery?.['filePath'] ?? this.activePromptTemplates.generic?.["filePath"] ?? br.getInstance().getDefaultPromptTemplateFilePath('userQuery'),
              executionTimeoutMinutes: 10
            }
          }, this.upsertToStorageInBackground();
        }
        return this._defaultTaskExecutionConfig;
      }
      ['getSelectedOrDefaultMCPParent'](_0x3b2ead) {
        if (this._selectedMCPParent) return this._selectedMCPParent;
        if (!_0x3b2ead) throw new Error('No authenticated user found');
        return _0x3b2ead.organizationSubscription && _0x3b2ead.organizationSubscription.organization ? {
          id: _0x3b2ead.organizationSubscription.organization.id,
          providerHandle: _0x3b2ead.organizationSubscription.organization.providerHandle,
          type: jO.ORGANIZATION
        } : {
          id: _0x3b2ead.user.id,
          providerHandle: _0x3b2ead.user.providerHandle,
          type: jO.USER
        };
      }
      async ['setSelectedMCPParent'](_0x3a4b43) {
        this._selectedMCPParent = _0x3a4b43, await this.upsertInStorage();
      }
      async ['setActivePromptTemplates'](_0x51104e) {
        this._activePromptTemplates = _0x51104e, await this.upsertInStorage();
      }
      async ["setInterviewTextOnlyMode"](_0x58b505) {
        this._interviewTextOnlyMode = _0x58b505, await this.upsertInStorage();
      }
      async ['setLastUsedIDEAgents'](_0x5d456b, _0x2fd721) {
        let _0x1c195d = this.lastUsedIDEAgents;
        switch (_0x5d456b) {
          case 'plan':
            _0x1c195d.plan = _0x2fd721;
            break;
          case "verification":
            _0x1c195d.verification = _0x2fd721;
            break;
          case "review":
            _0x1c195d.review = _0x2fd721;
            break;
          case "userQuery":
            _0x1c195d.userQuery = _0x2fd721;
            break;
          default:
            throw new Error('Invalid context type: ' + _0x5d456b);
        }
        this._lastUsedIDEAgents = _0x1c195d, await this.upsertInStorage(), Xr.syncStateToWebview();
      }
      async ['setDefaultTaskExecutionConfig'](_0x1b2170) {
        this._defaultTaskExecutionConfig = _0x1b2170 ? structuredClone(_0x1b2170) : null, await this.upsertInStorage(), Xr.syncDefaultTaskExecutionConfigToWebview();
      }
      ['getActiveIDEAgentForContext'](_0xfdf56) {
        let _0x220fdb = this.lastUsedIDEAgents,
          _0x3a8b08;
        switch (_0xfdf56) {
          case 'plan':
            _0x3a8b08 = _0x220fdb.plan;
            break;
          case 'verification':
            _0x3a8b08 = _0x220fdb.verification;
            break;
          case 'review':
            _0x3a8b08 = _0x220fdb.review;
            break;
          case "userQuery":
            _0x3a8b08 = _0x220fdb.userQuery;
            break;
          default:
            throw new Error('Invalid context type: ' + _0xfdf56);
        }
        return _0x3a8b08 || (_0x3a8b08 = getAgentIcon("copy")), _0x3a8b08;
      }
      async ['validateAndFixupAgentReferences']() {
        let _0x1fadd8 = false,
          _0x122c8 = AgentRegistry.getInstance(),
          _0x576bd5 = _0x122c8.getBuiltInCLIAgents(),
          _0x123a38 = _0x576bd5.length > 0 ? _0x576bd5[0] : getAgentIcon("claude-code"),
          _0x2e0978 = _0x4fa08c => _0x122c8.getAgent(_0x4fa08c.id) ? _0x4fa08c : (_0x1fadd8 = true, _0x123a38),
          _0x5e51cd = this.lastUsedIDEAgents;
        _0x5e51cd.plan = _0x2e0978(_0x5e51cd.plan), _0x5e51cd.verification = _0x2e0978(_0x5e51cd.verification), _0x5e51cd.review = _0x2e0978(_0x5e51cd.review), _0x5e51cd.userQuery = _0x2e0978(_0x5e51cd.userQuery), this._lastUsedIDEAgents = _0x5e51cd, this._defaultTaskExecutionConfig && (this._defaultTaskExecutionConfig.plan.ideAgent = _0x2e0978(this._defaultTaskExecutionConfig.plan.ideAgent), this._defaultTaskExecutionConfig.verification.ideAgent = _0x2e0978(this._defaultTaskExecutionConfig.verification.ideAgent), this._defaultTaskExecutionConfig.review.ideAgent = _0x2e0978(this._defaultTaskExecutionConfig.review.ideAgent), this._defaultTaskExecutionConfig.userQuery.ideAgent = _0x2e0978(this._defaultTaskExecutionConfig.userQuery.ideAgent)), _0x1fadd8 && (await this.upsertInStorage(), Xr.syncStateToWebview()), await zn.getInstance().validateAndFixupAgentReferences();
      }
      async ['fetchFromStorage']() {
        try {
          let _0x44be63 = await this.storageAPI.read();
          this._selectedMCPParent = _0x44be63.selectedMCPParent, this._workspaceId = _0x44be63.id, this._activePromptTemplates = _0x44be63.activePromptTemplates, this._lastUsedIDEAgents = _0x44be63.lastUsedIDEAgents, this._defaultTaskExecutionConfig = _0x44be63.defaultTaskExecutionConfig, this._interviewTextOnlyMode = _0x44be63.interviewTextOnlyMode;
        } catch {
          await this.upsertInStorage();
        }
      }
      ['serializeToStorage']() {
        return {
          id: this._workspaceId,
          selectedMCPParent: this._selectedMCPParent,
          activePromptTemplates: this._activePromptTemplates,
          lastUsedIDEAgents: this.lastUsedIDEAgents,
          defaultTaskExecutionConfig: this._defaultTaskExecutionConfig,
          interviewTextOnlyMode: this._interviewTextOnlyMode
        };
      }
      async ["upsertToStorageInBackground"]() {
        try {
          await this.upsertInStorage();
        } catch (_0x65894) {
          Logger.error(_0x65894, "Failed to upsert workspace settings to storage");
        }
      }
      async ["upsertInStorage"]() {
        let _0x281019 = this.serializeToStorage();
        return this.storageAPI.runInTransaction(async _0x5c475e => this.storageAPI.upsert(_0x281019, _0x5c475e));
      }
    };
  }),
  Xr,
  initUsageInfoHandler = __esmModule(() => {
    'use strict';

    initSearchConfig(), initTaskContext(), initCommentNavigatorDeps(), Xr = class _0x3b1630 {
      async ["handle"](_0x529100) {
        switch (_0x529100.type) {
          case Ou.GET_TASK_SETTINGS_STATE:
            _0x3b1630.syncStateToWebview();
            break;
          case Ou.UPDATE_LAST_SELECTED_IDE_AGENT:
            await _0x3b1630.updateLastSelectedIDEAgent(_0x529100.agent, _0x529100.contextType);
            break;
          case Ou.UPDATE_ALWAYS_ALLOW_PAY_TO_RUN:
            _0x3b1630.updateAlwaysAllowPayToRun(_0x529100.alwaysAllowPayToRun);
            break;
          case Ou.GET_DEFAULT_TASK_EXECUTION_CONFIG:
            _0x3b1630.syncDefaultTaskExecutionConfigToWebview();
            break;
          case Ou.SET_DEFAULT_TASK_EXECUTION_CONFIG:
            await _0x3b1630.updateDefaultTaskExecutionConfig(_0x529100.config);
            break;
          case Ou.TOGGLE_INTERVIEW_TEXT_ONLY_MODE:
            await _0x3b1630.toggleInterviewTextOnlyMode(_0x529100.interviewTextOnlyMode);
            break;
          case Ou.OPEN_SETTINGS:
            vscode_module.commands.executeCommand("traycer.openSettings");
            break;
        }
      }
      static ['updateRateLimitTimestamp'](_0x4d5f6e) {
        config.retryAfterTimestamp = _0x4d5f6e ? new Date().getTime() + _0x4d5f6e * 1000 : void 0, _0x3b1630.syncStateToWebview();
      }
      static ["syncStateToWebview"]() {
        Qe.postToCommentNavigator({
          type: Av.SYNC_TASK_SETTINGS,
          taskSettings: getExtensionSettings()
        }), _0x3b1630.syncDefaultTaskExecutionConfigToWebview();
      }
      static async ['updateLastSelectedIDEAgent'](_0xbcfbb2, _0x56f275) {
        let _0x4e504d = Vt.getInstance(),
          _0x3f6517 = _0x4e504d.lastUsedIDEAgents;
        switch (_0x56f275) {
          case 'plan':
            _0x3f6517.plan = _0xbcfbb2;
            break;
          case 'verification':
            _0x3f6517.verification = _0xbcfbb2;
            break;
          case 'review':
            _0x3f6517.review = _0xbcfbb2;
            break;
          case 'userQuery':
            _0x3f6517.userQuery = _0xbcfbb2;
            break;
          default:
            throw new Error("Invalid context type: " + _0x56f275);
        }
        await _0x4e504d.upsertInStorage(), _0x3b1630.syncStateToWebview();
      }
      static ['updateAlwaysAllowPayToRun'](_0x513697) {
        config.setAlwaysAllowPayToRun(_0x513697);
      }
      static ['syncDefaultTaskExecutionConfigToWebview']() {
        let _0x5333ac = Vt.getInstance().defaultTaskExecutionConfig;
        Qe.postToCommentNavigator({
          type: Av.SYNC_DEFAULT_TASK_EXECUTION_CONFIG,
          defaultTaskExecutionConfig: _0x5333ac
        });
      }
      static async ['updateDefaultTaskExecutionConfig'](_0x520f5f) {
        await Vt.getInstance().setDefaultTaskExecutionConfig(_0x520f5f), _0x3b1630.syncDefaultTaskExecutionConfigToWebview();
      }
      static async ['toggleInterviewTextOnlyMode'](_0x2b877f) {
        await Vt.getInstance().setInterviewTextOnlyMode(_0x2b877f), _0x3b1630.syncStateToWebview();
      }
    };
  }),
  Gf,
  initTaskSettingsHandler = __esmModule(() => {
    'use strict';

    initCommentNavigatorDeps(), initUsageInfoHandler(), Gf = class _0x1bea46 {
      constructor(_0x521c64) {
        this.auth = _0x521c64;
      }
      ["handle"](_0x1c220b) {
        switch (_0x1c220b.type) {
          case il.FETCH_SUBSCRIPTION:
            return _0x1bea46.postSubscriptionInfo(this.auth);
          case il.VALIDATE_INVOICE:
            return this.validateInvoice();
          case il.REFRESH_USER:
            return this.refreshUser();
        }
      }
      async ['validateInvoice']() {
        return await this.auth.validateInvoice(), _0x1bea46.postSubscriptionInfo(this.auth);
      }
      async ['refreshUser']() {
        return await this.auth.refreshTraycerToken(), Xr.updateRateLimitTimestamp(void 0), _0x1bea46.postSubscriptionInfo(this.auth);
      }
      static ["postSubscriptionInfo"](_0x548550) {
        let _0x6d1e68 = _0x548550.traycerUser?.["organizationSubscription"] ?? _0x548550.traycerUser?.['userSubscription'],
          _0x4181a8 = {
            user: _0x548550.traycerUser,
            isInTrial: _0x6d1e68?.["isInTrial"] ?? false,
            subscriberId: _0x6d1e68?.['orgID'] ?? _0x6d1e68?.['userID'] ?? '',
            allowPayAsYouGo: _0x548550.traycerUser?.["payAsYouGoUsage"]?.['allowPayAsYouGo'] || false,
            invoiceUrl: _0x548550.traycerUser?.['payAsYouGoUsage']?.['meteredUsage']?.["invoiceUrl"] ?? '',
            isBusinessPlan: (_0x6d1e68?.["orgID"] ?? null) !== null && (_0x6d1e68?.['userID'] ?? null) === null,
            subscriptionStatus: _0x6d1e68?.["subscriptionStatus"],
            email: _0x548550.traycerUser?.['user']?.["email"] ?? null
          },
          _0x3056ab = {
            type: yw.POST_SUBSCRIPTION,
            subscription: _0x4181a8,
            sendToViewImmediately: true
          };
        return Qe.postToCommentNavigator(_0x3056ab);
      }
      ['getSubscriptionMetrics']() {
        let _0x37df99 = this.auth.traycerUser?.['organizationSubscription'] ?? this.auth.traycerUser?.['userSubscription'];
        return {
          orgID: _0x37df99?.["orgID"] ?? null,
          subscriptionStatus: _0x37df99?.['subscriptionStatus'] || "UNKNOWN",
          trialEndDate: _0x37df99?.["trialEndsAt"]?.['toDateString']() || 'NA',
          subscriptionExpiresAt: _0x37df99?.['subscriptionExpiry']?.["toDateString"]() || "UNKNOWN"
        };
      }
    };
  }),
  ED,
  initWebviewStatusHandler = __esmModule(() => {
    'use strict';

    initSearchUtils(), initDocumentManager(), initWorkspaceInfo(), initTaskRunner(), initCommentNavigatorDeps(), ED = class {
      constructor() {}
      ["handle"](_0x191b6f) {
        let _0x46fa50 = zn.getInstance();
        switch (_0x191b6f.type) {
          case vt.NEW_TASK:
            return _0x46fa50.newTask(_0x191b6f);
          case vt.NEW_TASK_BREAKDOWN:
            return _0x46fa50.newTaskBreakdown(_0x191b6f);
          case vt.PLAN_ITERATION_USER_QUERY:
            return _0x46fa50.planIterationUserQuery(_0x191b6f);
          case vt.DELETE_TASK_CHAIN:
            return _0x46fa50.deleteTaskChain(_0x191b6f);
          case vt.DELETE_TASK:
            return _0x46fa50.deleteTask(_0x191b6f);
          case vt.FETCH_TASK_CHAIN:
            return _0x46fa50.postTaskChainToUI(_0x191b6f);
          case vt.FETCH_FILE_AND_FOLDER:
            return this.fetchFilesAndFolders(_0x191b6f);
          case vt.FETCH_GIT_CONTEXT:
            return this.fetchGitContext(_0x191b6f);
          case vt.OPEN_FILE:
            return this.openFile(_0x191b6f);
          case vt.ABORT_TASK:
            return _0x46fa50.abortTask(_0x191b6f);
          case vt.ABORT_PRE_PHASE:
            return _0x46fa50.abortPrePhase(_0x191b6f);
          case vt.OPEN_EXTERNAL_LINK:
            return this.openExternalLink(_0x191b6f);
          case vt.OPEN_ATTACHMENT:
            return this.openAttachment(_0x191b6f);
          case vt.EXECUTE_IN_PLATFORM:
            return _0x46fa50.executeInIDE(_0x191b6f);
          case vt.REORDER_TASKS:
            return _0x46fa50.reorderTasks(_0x191b6f);
          case vt.UPDATE_TASK_QUERY:
            return _0x46fa50.updateTaskQuery(_0x191b6f);
          case vt.INSERT_TASK:
            return _0x46fa50.insertTask(_0x191b6f);
          case vt.TASK_LIST_BOOTSTRAPPING:
            return _0x46fa50.postIsBootstrappingToUI();
          case vt.START_TASK_VERIFICATION:
            return _0x46fa50.startTaskVerification(_0x191b6f);
          case vt.SKIP_TASK_VERIFICATION:
            return _0x46fa50.skipTaskVerification(_0x191b6f);
          case vt.REVERIFY_TASK:
            return _0x46fa50.reVerifyTask(_0x191b6f);
          case vt.EXECUTE_VERIFICATION_COMMENT_IN_IDE:
            return _0x46fa50.executeVerificationCommentsInIDE(_0x191b6f);
          case vt.DISCARD_VERIFICATION_COMMENT:
            return _0x46fa50.discardVerificationComment(_0x191b6f);
          case vt.TOGGLE_VERIFICATION_COMMENTS_APPLIED:
            return _0x46fa50.toggleVerificationCommentsApplied(_0x191b6f);
          case vt.EXECUTE_ALL_VERIFICATION_COMMENTS_IN_IDE:
            return _0x46fa50.executeAllVerificationCommentsInIDE(_0x191b6f);
          case vt.EXECUTE_REVIEW_COMMENTS_IN_IDE:
            return _0x46fa50.executeReviewCommentsInIDE(_0x191b6f);
          case vt.EXECUTE_ALL_REVIEW_COMMENTS_IN_IDE:
            return _0x46fa50.executeAllReviewCommentsInIDE(_0x191b6f);
          case vt.DISCARD_REVIEW_COMMENT:
            return _0x46fa50.discardReviewComment(_0x191b6f);
          case vt.TOGGLE_REVIEW_COMMENTS_APPLIED:
            return _0x46fa50.toggleReviewCommentsApplied(_0x191b6f);
          case vt.EDIT_PRE_PHASE_CONVERSATION:
            return _0x46fa50.editPrePhaseConversation(_0x191b6f);
          case vt.UPDATE_FAILED_PLAN_ITERATION_QUERY:
            return _0x46fa50.updateFailedPlanIterationQuery(_0x191b6f);
          case vt.UPDATE_FAILED_OR_ABORTED_CONVERSATION_QUERY:
            return _0x46fa50.updateFailedOrAbortedConversationQuery(_0x191b6f);
          case vt.DELETE_PHASE_CONVERSATION:
            return _0x46fa50.deletePhaseConversation(_0x191b6f);
          case vt.DISPOSE_VERIFICATION:
            return _0x46fa50.disposeVerification(_0x191b6f);
          case vt.FETCH_TASK_HISTORY:
            return _0x46fa50.fetchTaskHistory();
          case vt.EXECUTE_QUERY_DIRECTLY_IN_IDE:
            return _0x46fa50.executeQueryDirectlyInIDE(_0x191b6f);
          case vt.DISCARD_PLAN:
            return _0x46fa50.discardPlan(_0x191b6f);
          case vt.MARK_PLAN_AS_EXECUTED:
            return _0x46fa50.markPlanAsExecuted(_0x191b6f);
          case vt.START_YOLO_MODE:
            return _0x46fa50.startYoloMode(_0x191b6f);
          case vt.STOP_YOLO_MODE:
            return _0x46fa50.stopYoloMode(_0x191b6f);
          case vt.SET_TASK_EXECUTION_CONFIG:
            return _0x46fa50.setTaskExecutionConfig(_0x191b6f);
          case vt.STOP_WAITING_FOR_EXECUTION:
            return _0x46fa50.stopWaitingForExecution(_0x191b6f);
          case vt.RESET_REVERIFICATION_STATE:
            return _0x46fa50.resetReverificationState(_0x191b6f);
          case vt.EXPORT_PHASE_BREAKDOWN:
            return _0x46fa50.exportPhaseBreakdown(_0x191b6f);
        }
      }
      async ['openAttachment'](_0x32b591) {
        let {
            base64Content: _0x379cb6,
            attachmentFileName: _0x44c878
          } = _0x32b591,
          _0x27602e = _0x44c878.split('/').pop() ?? _0x44c878,
          _0x2d2f60 = parseGitignoreContent(_0x379cb6);
        _0x27602e.toLowerCase().endsWith('.' + _0x2d2f60.split('/')[1]) || (_0x27602e = _0x27602e + '.' + _0x2d2f60.split('/')[1]);
        let _0x4faa19 = vscode_module.Uri.parse(_0x27602e);
        MediaFileSystem.getInstance().createFile(_0x4faa19, _0x379cb6);
        let _0x9bc8a7 = MediaFileSystem.getInstance().uriConverter(_0x4faa19);
        await vscode_module.commands.executeCommand("vscode.open", _0x9bc8a7);
      }
      async ['openExternalLink'](_0x1a556f) {
        await workspace_info.getInstance().openExternalLink(_0x1a556f.url);
      }
      async ['openFile'](_0x4c897f) {
        let _0x48f725 = TraycerPath.fromPathProto(_0x4c897f.fsPath),
          _0x4f1626 = await In.getTextDocument(_0x48f725.absPath);
        await vscode_module.window.showTextDocument(_0x4f1626);
      }
      async ['fetchFilesAndFolders'](_0x10b914) {
        let _0x2b73e2 = [],
          _0x1d68de = [];
        try {
          let _0x4969cd = await searchFilesAndFoldersQueued(_0x10b914.userQuery, _0x10b914.contextType);
          _0x2b73e2 = [..._0x4969cd.files], _0x1d68de = [..._0x4969cd.folders], Logger.debug('Fetched file and folder list', {
            files: _0x2b73e2,
            folders: _0x1d68de
          });
        } catch (_0x5be011) {
          Logger.warn("Failed to fetch file and folder list", _0x5be011);
        }
        let _0xcb6976 = {
          type: _n.FETCH_FILE_AND_FOLDER,
          files: _0x2b73e2,
          folders: _0x1d68de
        };
        return Qe.postToAllWebviews(_0xcb6976);
      }
      async ['fetchGitContext'](_0x5754fa) {
        let _0x5c688a;
        if (_0x5754fa.workspaceUri) _0x5c688a = vscode_module.Uri.parse(_0x5754fa.workspaceUri);else {
          let _0x174bf0 = vscode_module.workspace.workspaceFolders;
          if (!_0x174bf0 || _0x174bf0.length === 0) throw new Error('No workspace folder available');
          _0x5c688a = _0x174bf0[0].uri;
        }
        let _0x34ad07 = await getGitCommitInfo(_0x5c688a),
          _0x3c7f35 = await getDefaultGitBranch(_0x5c688a),
          _0x5c1f66 = await hasUncommittedChanges(_0x5c688a),
          _0x28a4b2 = await getGitDiff(_0x5c688a, 50),
          _0x445524 = {
            type: _n.FETCH_GIT_CONTEXT,
            branches: _0x34ad07,
            defaultBranch: _0x3c7f35,
            hasUncommittedChanges: _0x5c1f66,
            recentCommits: _0x28a4b2
          };
        return Qe.postToAllWebviews(_0x445524);
      }
    };
  }),
  

  PromptTemplateFactory,
  initPromptTemplateFactory = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), PromptTemplateFactory = class {
      static ["createMetadata"](_0x5c6012) {
        return {
          displayName: workspace_info.getInstance().getFileNameWithoutExtension(_0x5c6012)
        };
      }
      static ["createBuiltInAgentMetadata"](_0x39ca4f) {
        return {
          displayName: wm[_0x39ca4f].displayName
        };
      }
      static ["instantiateTemplate"](_0x47e592, _0x2f731a, _0x572c08, _0x289b48, _0x5ee6e7, _0x44b2d7) {
        let _0x22dade = _0x2f731a.displayName || workspace_info.getInstance().getFileNameWithoutExtension(_0x47e592);
        return new PromptTemplate(_0x22dade, _0x47e592, _0x5ee6e7, _0x2f731a, _0x572c08, _0x289b48, _0x44b2d7);
      }
      static async ["createTemplateOnDisk"](_0x234b05, _0x5a7b5d, _0x373feb) {
        let _0x373c62 = path_module.dirname(_0x234b05);
        await fs_promises_module.mkdir(_0x373c62, {
          recursive: true
        }), await fs_promises_module.writeFile(_0x234b05, _0x5a7b5d, "utf8");
        let _0x5e08e5 = _0x373feb === ".sh" ? 493 : 420;
        await fs_promises_module.chmod(_0x234b05, _0x5e08e5);
      }
      static ['getAgentTemplateContent'](_0x1ac0e4, _0x204b5d) {
        let _0x2c2e85;
        switch (_0x1ac0e4) {
          case "claude-code":
            _0x2c2e85 = 'claude';
            break;
          case "gemini":
            _0x2c2e85 = 'gemini -p';
            break;
          case "codex":
            _0x2c2e85 = "codex";
            break;
          default:
            throw new Error("Unsupported agent ID: " + _0x1ac0e4);
        }
        let _0xe1332a = _0x204b5d === '.sh',
          _0x25ee5e = _0xe1332a ? '\x22$' + PROMPT_ENV_VAR + '\x22' : "\"$env:" + PROMPT_ENV_VAR + '\x22',
          _0x3c3ae9 = _0x2c2e85 ? _0x2c2e85 + ' ' + _0x25ee5e : "echo " + _0x25ee5e;
        return (_0xe1332a ? PromptTemplate.buildShellCommentBlock() : PromptTemplate.buildBatCommentBlock()) + '\x0a\x0a' + _0x3c3ae9 + '\x0a';
      }
      static ["createBuiltInAgentTemplateOnVirtualFileSystem"](_0xee4232, _0x594943) {
        let _0x371496 = this.getAgentTemplateContent(_0xee4232, _0x594943),
          _0x45c23e = '' + _0xee4232 + _0x594943,
          _0x59ddc7 = vscode_module.Uri.joinPath(PromptTemplate.DEFAULT_CLI_AGENTS_DIR_PATH, _0x45c23e);
        TraycerFileSystem.getInstance().createFile(_0x59ddc7, Buffer.from(_0x371496, "utf8"));
      }
      static async ['createNewTemplate'](_0x1d922c, _0x54216c, _0x14a871, _0x15dd19) {
        let _0x2adfc2 = this.createMetadata(_0x1d922c),
          _0x1cf51d = _0x15dd19 || (_0x14a871 === ".sh" ? PromptTemplate.DEFAULT_SHELL_TEMPLATE_CONTENT : PromptTemplate.DEFAULT_BAT_TEMPLATE_CONTENT);
        await this.createTemplateOnDisk(_0x1d922c, _0x1cf51d, _0x14a871);
        let _0x3c2b6b = await fs_promises_module.readFile(_0x1d922c, 'utf8'),
          _0x3c7828 = this.instantiateTemplate(_0x1d922c, _0x2adfc2, _0x54216c, _0x14a871, _0x3c2b6b, false);
        return _0x3c7828.validateTemplate(), _0x3c7828;
      }
      static async ["loadTemplateFromDisk"](_0x3983bc, _0x2ba604, _0xecdc1b, _0x5ec11c) {
        let _0x13c56d = await fs_promises_module.readFile(_0x3983bc, 'utf8'),
          _0x39e150 = this.instantiateTemplate(_0x3983bc, _0x2ba604, _0xecdc1b, _0x5ec11c, _0x13c56d, false);
        return _0x39e150.validateTemplate(), _0x39e150;
      }
      static ["createBuiltInAgentTemplate"](_0x240aed, _0x15e225) {
        this.createBuiltInAgentTemplateOnVirtualFileSystem(_0x240aed, _0x15e225);
        let _0x220f59 = this.getAgentTemplateContent(_0x240aed, _0x15e225),
          _0x4cc282 = '' + _0x240aed + _0x15e225,
          _0x593ef3 = vscode_module.Uri.joinPath(PromptTemplate.DEFAULT_CLI_AGENTS_DIR_PATH, _0x4cc282);
        return this.instantiateTemplate(_0x593ef3.toString(), this.createBuiltInAgentMetadata(_0x240aed), 'user', _0x15e225, _0x220f59, true);
      }
    };
  }),
  ii,
  initCliAgentService = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initUsageInfoHandler(), initCommentNavigator(), initTaskContext(), initPromptTemplateFactory(), ii = class _0x3e7e8c {
      constructor() {
        this.userCLIAgents = new Map(), this.workspaceCLIAgents = new Map(), this.defaultCLIAgents = new Map(), this.invalidTemplates = new Set(), this.globalWatcher = null;
      }
      static {
        this.instance = null;
      }
      static {
        this.DEFAULT_CLI_AGENTS_DIR_NAME = "cli-agents";
      }
      static {
        this.DEFAULT_CLI_AGENTS_DIR = path_module.join(os_module.homedir(), ".traycer", _0x3e7e8c.DEFAULT_CLI_AGENTS_DIR_NAME);
      }
      static ['getInstance']() {
        return _0x3e7e8c.instance || (_0x3e7e8c.instance = new _0x3e7e8c()), _0x3e7e8c.instance;
      }
      ['resolveCLIAgentPath'](_0x165634) {
        let _0x3854d9 = [...Array.from(this.userCLIAgents.values()), ...Array.from(this.workspaceCLIAgents.values()), ...Array.from(this.defaultCLIAgents.values())];
        for (let key of _0x3854d9) if (key.name === _0x165634 || workspace_info.getInstance().getFileNameWithoutExtension(key.filePath) === _0x165634) return key.filePath;
      }
      async ["validateCLIAgentFile"](_0x2ea826) {
        if (!(await workspace_info.getInstance().fileExists(_0x2ea826))) throw new TemplateFileNotFoundError(_0x2ea826);
        let _0x4616d0 = workspace_info.getInstance().getPlatform() === xr.WINDOWS,
          _0x5eaa7c = path_module.extname(_0x2ea826);
        if (_0x4616d0 && _0x5eaa7c.toLowerCase() !== ".bat") throw new CLIAgentInvalidPlatformError(_0x5eaa7c, xr.WINDOWS, '.bat');
        if (!_0x4616d0 && _0x5eaa7c.toLowerCase() !== ".sh") throw new CLIAgentInvalidPlatformError(_0x5eaa7c, xr.POSIX, ".sh");
        if (!(await workspace_info.getInstance().readFile(_0x2ea826)).length) throw new TemplateFileEmptyError();
      }
      async ["createUserCLIAgent"](_0x42ea21, _0x90e3ab, _0x3bd927) {
        let _0x482ae5 = path_module.join(_0x3e7e8c.DEFAULT_CLI_AGENTS_DIR, '' + _0x42ea21 + _0x90e3ab);
        await this.createCLIAgent(_0x482ae5, _0x42ea21, _0x90e3ab, 'user', _0x3bd927);
      }
      async ["createWorkspaceCLIAgent"](_0x19874c, _0xd9418c, _0x33d31e, _0x5716f3) {
        let _0x19fefd = path_module.join(_0x33d31e, ".traycer", "cli-agents", '' + _0x19874c + _0xd9418c);
        await this.createCLIAgent(_0x19fefd, _0x19874c, _0xd9418c, "workspace", _0x5716f3);
      }
      ['getCLIAgentByName'](_0x48b5cc) {
        let _0x257a37 = this.resolveCLIAgentPath(_0x48b5cc);
        if (_0x257a37) return this.getCLIAgent(_0x257a37);
      }
      async ["createCLIAgent"](_0x52de30, _0x8b3c7a, _0x43d594, _0x3ab378, _0xf9c93) {
        if (!(await this.isNameAllowed(_0x8b3c7a, _0x43d594, path_module.dirname(_0x52de30)))) throw new TemplateNameNotAllowedError(_0x52de30);
        let _0x144f69 = workspace_info.getInstance().getPlatform() === xr.WINDOWS;
        if (_0x144f69 && _0x43d594 !== '.bat') throw new CLIAgentInvalidPlatformError(_0x43d594, xr.WINDOWS, '.bat');
        if (!_0x144f69 && _0x43d594 !== ".sh") throw new CLIAgentInvalidPlatformError(_0x43d594, xr.POSIX, ".sh");
        let _0x225839 = _0xf9c93 ? this.getCLIAgent(_0xf9c93).content : void 0;
        await PromptTemplateFactory.createNewTemplate(_0x52de30, _0x3ab378, _0x43d594, _0x225839), await this.openCLIAgent(_0x52de30);
      }
      async ['openCLIAgent'](_0x4f3c2d) {
        let _0x408eec = vscode_module.Uri.parse(_0x4f3c2d);
        workspace_info.getInstance().isVirtualUri(_0x408eec) || (_0x408eec = vscode_module.Uri.file(_0x4f3c2d)), await vscode_module.commands.executeCommand("vscode.open", _0x408eec);
      }
      async ["isUserCLIAgentNameAllowed"](_0x44a861, _0x29c97f) {
        let _0x3f6a8f = await this.isNameAllowed(_0x44a861, _0x29c97f, _0x3e7e8c.DEFAULT_CLI_AGENTS_DIR),
          _0x2da13b = {
            type: Um.IS_USER_CLI_AGENT_NAME_ALLOWED,
            templateName: _0x44a861,
            fileExtension: _0x29c97f,
            isAllowed: _0x3f6a8f
          };
        Qe.postToCommentNavigator(_0x2da13b);
      }
      async ["isWorkspaceCLIAgentNameAllowed"](_0x33834e, _0x4146cc, _0x2fdbfd) {
        let _0x2ef4ce = await this.isNameAllowed(_0x33834e, _0x4146cc, path_module.join(_0x2fdbfd, ".traycer", 'cli-agents')),
          _0x320bc4 = {
            type: Um.IS_WORKSPACE_CLI_AGENT_NAME_ALLOWED,
            templateName: _0x33834e,
            fileExtension: _0x4146cc,
            workspaceDirPath: _0x2fdbfd,
            isAllowed: _0x2ef4ce
          };
        Qe.postToCommentNavigator(_0x320bc4);
      }
      async ['isNameAllowed'](_0x5be920, _0x46ca69, _0x3845c9) {
        let _0x23ca5e = true;
        if (_0x5be920.endsWith(".sh") || _0x5be920.endsWith('.bat')) _0x23ca5e = false;else {
          if (AgentRegistry.getInstance().getConflictingWithBuiltInAgent(_0x5be920)) _0x23ca5e = false;else {
            let _0x5a9212 = _0x5be920.toLowerCase(),
              _0x2ada58 = [...Array.from(this.userCLIAgents.values()), ...Array.from(this.workspaceCLIAgents.values()), ...Array.from(this.defaultCLIAgents.values())];
            for (let key of _0x2ada58) if (key.name.toLowerCase() === _0x5a9212) {
              _0x23ca5e = false;
              break;
            }
            if (_0x23ca5e) {
              let _0x3809ef = path_module.join(_0x3845c9, '' + _0x5be920 + _0x46ca69);
              _0x23ca5e = !(await workspace_info.getInstance().fileExists(_0x3809ef));
            }
          }
        }
        return _0x23ca5e;
      }
      async ["loadCLIAgentFromDisk"](_0x40e697) {
        let _0x53e52d = this.userCLIAgents.get(_0x40e697) ?? this.workspaceCLIAgents.get(_0x40e697);
        _0x53e52d && AgentRegistry.getInstance().unregisterAgent(_0x53e52d.name), this.userCLIAgents.has(_0x40e697) ? this.userCLIAgents.delete(_0x40e697) : this.workspaceCLIAgents.has(_0x40e697) && this.workspaceCLIAgents.delete(_0x40e697), await this.validateCLIAgentFile(_0x40e697);
        let _0x4d30a3 = workspace_info.getInstance().getFileNameWithoutExtension(_0x40e697),
          _0x3ea929 = AgentRegistry.getInstance().getConflictingWithBuiltInAgent(_0x4d30a3);
        if (_0x3ea929) throw new CLIAgentNameConflictsWithBuiltInAgentError(_0x4d30a3, _0x3ea929.displayName);
        let _0x56d9ff = path_module.extname(_0x40e697);
        if (isWindows && _0x56d9ff !== '.bat') throw new CLIAgentInvalidPlatformError(_0x56d9ff, xr.WINDOWS, '.bat');
        if (!isWindows && _0x56d9ff !== '.sh') throw new CLIAgentInvalidPlatformError(_0x56d9ff, xr.POSIX, '.sh');
        let _0x2e5f1f = this.determineScopeFromFilePath(_0x40e697),
          _0x33f51c = await PromptTemplateFactory.loadTemplateFromDisk(_0x40e697, {
            displayName: _0x4d30a3
          }, _0x2e5f1f, _0x56d9ff);
        return _0x2e5f1f === 'user' ? this.userCLIAgents.set(_0x33f51c.filePath, _0x33f51c) : this.workspaceCLIAgents.set(_0x33f51c.filePath, _0x33f51c), _0x33f51c.validationResult.isValid && (AgentRegistry.getInstance().registerAgent({
          id: _0x33f51c.name,
          displayName: _0x33f51c.name,
          type: 'terminal',
          source: _0x2e5f1f === "user" ? 'user' : "workspace"
        }), Xr.syncStateToWebview()), _0x33f51c;
      }
      async ['sendCLIAgentsToUI']() {
        let _0x210f09 = [...Array.from(this.userCLIAgents.values()), ...Array.from(this.defaultCLIAgents.values())],
          _0x1349a6 = {
            type: Um.LIST_CLI_AGENTS,
            userCLIAgents: _0x210f09.map(_0x231f1a => _0x231f1a.serializeToUI()),
            workspaceCLIAgents: Array.from(this.workspaceCLIAgents.values()).map(_0x284872 => _0x284872.serializeToUI()),
            invalidTemplates: Array.from(this.invalidTemplates)
          };
        Qe.postToCommentNavigator(_0x1349a6), Xr.syncStateToWebview();
      }
      ["getCLIAgent"](_0x4b6a2a) {
        let _0x30279d = this.userCLIAgents.get(_0x4b6a2a) ?? this.workspaceCLIAgents.get(_0x4b6a2a) ?? this.defaultCLIAgents.get(_0x4b6a2a);
        if (_0x30279d) return _0x30279d;
        throw new TemplateNotFoundError(_0x4b6a2a);
      }
      ['dispose']() {
        this.globalWatcher?.["close"](), _0x3e7e8c.instance = null, this.userCLIAgents.clear(), this.workspaceCLIAgents.clear(), this.defaultCLIAgents.clear(), this.invalidTemplates.clear();
      }
      async ["deleteCLIAgent"](_0x4a6c58) {
        if (this.defaultCLIAgents.has(_0x4a6c58)) throw new Error('Cannot delete default CLI agent template');
        try {
          await (0, fs_promises_module.unlink)(_0x4a6c58);
        } catch (_0x4de87c) {
          if (_0x4de87c && typeof _0x4de87c == 'object' && 'code' in _0x4de87c && _0x4de87c.code === "ENOENT") Logger.info('Valid template file not found during deletion: ' + _0x4a6c58);else throw Logger.error(_0x4de87c, "Error deleting valid template file: " + _0x4a6c58), _0x4de87c;
        }
      }
      ['createDefaultTemplates']() {
        let _0x35e782 = workspace_info.getInstance().getPlatform() === xr.WINDOWS ? ".bat" : '.sh',
          _0x2be827 = ["claude-code", 'gemini', "codex"];
        for (let key of _0x2be827) {
          let _0x19a1c8 = PromptTemplateFactory.createBuiltInAgentTemplate(key, _0x35e782);
          AgentRegistry.getInstance().registerAgent({
            id: key,
            displayName: getAgentIcon(key).displayName,
            type: "terminal",
            source: 'builtin'
          }), this.defaultCLIAgents.set(_0x19a1c8.filePath, _0x19a1c8);
        }
      }
      async ['initialize']() {
        this.globalWatcher || (this.createDefaultTemplates(), await this.startGlobalWatcher(), await this.loadWorkspaceTemplateDirectories());
      }
      async ['handleFileUpsert'](_0x354de9) {
        let _0x352fea = !this.invalidTemplates.has(_0x354de9),
          _0x56ad0e = false;
        try {
          this.invalidTemplates.delete(_0x354de9);
          try {
            let _0x58a61b = await this.loadCLIAgentFromDisk(_0x354de9);
            _0x58a61b.validationResult.isValid ? TemplateErrorManager.removeTemplateErrors(vscode_module.Uri.file(_0x354de9)) : (TemplateErrorManager.addTemplateErrors(vscode_module.Uri.file(_0x354de9), _0x58a61b.validationResult.errors), _0x352fea && (_0x56ad0e = true));
          } catch (_0x3f1584) {
            this.invalidTemplates.add(_0x354de9);
            let _0xc2bf7e = this.userCLIAgents.get(_0x354de9) ?? this.workspaceCLIAgents.get(_0x354de9);
            throw _0xc2bf7e && AgentRegistry.getInstance().unregisterAgent(_0xc2bf7e.name), this.userCLIAgents.delete(_0x354de9), this.workspaceCLIAgents.delete(_0x354de9), TemplateErrorManager.addTemplateErrors(vscode_module.Uri.file(_0x354de9), _0x3f1584 instanceof Error ? [_0x3f1584.message] : [String(_0x3f1584)]), _0x352fea && (_0x56ad0e = true), await Vt.getInstance().validateAndFixupAgentReferences(), _0x3f1584;
          }
        } catch (_0x1257ac) {
          Logger.error(_0x1257ac, 'Failed to load created CLI agent template: ' + _0x354de9);
        } finally {
          _0x56ad0e && (await Vt.getInstance().validateAndFixupAgentReferences());
        }
      }
      async ['handleFileDelete'](_0x2dd086) {
        try {
          let _0x52b4d8 = this.userCLIAgents.get(_0x2dd086) ?? this.workspaceCLIAgents.get(_0x2dd086);
          _0x52b4d8 && !this.defaultCLIAgents.get(_0x2dd086) && (AgentRegistry.getInstance().unregisterAgent(_0x52b4d8.name), Xr.syncStateToWebview()), this.userCLIAgents.delete(_0x2dd086), this.workspaceCLIAgents.delete(_0x2dd086), this.invalidTemplates.delete(_0x2dd086), TemplateErrorManager.removeTemplateErrors(vscode_module.Uri.file(_0x2dd086)), await this.sendCLIAgentsToUI(), await Vt.getInstance().validateAndFixupAgentReferences();
        } catch (_0x40a673) {
          Logger.error(_0x40a673, 'Failed to handle CLI agent template deletion: ' + _0x2dd086);
        }
      }
      ["doesPathMatch"](_0x3dcde9, _0x3f3eea) {
        return _0x3dcde9 === _0x3f3eea || _0x3dcde9.startsWith(_0x3f3eea + path_module.sep);
      }
      async ['handleDirectoryDelete'](_0x43c7a0) {
        let _0x2a34d4 = [];
        for (let [_0x45a297] of this.workspaceCLIAgents) this.doesPathMatch(_0x45a297, _0x43c7a0) && _0x2a34d4.push(_0x45a297);
        for (let key of this.invalidTemplates) this.doesPathMatch(key, _0x43c7a0) && _0x2a34d4.push(key);
        for (let key of _0x2a34d4) await this.handleFileDelete(key);
      }
      async ['watchWorkspaceCLIAgentsPath'](_0x21d388, _0x529e52) {
        if (!_0x21d388.includes(".traycer")) return;
        let _0x10bfe8 = workspace_info.getInstance().getWorkspaceDirs(),
          _0x94cb1f = false;
        if (_0x10bfe8.some(_0x4f0a70 => {
          let _0x1d0309 = path_module.join(_0x4f0a70, '.traycer', _0x3e7e8c.DEFAULT_CLI_AGENTS_DIR_NAME);
          return this.doesPathMatch(_0x21d388, _0x1d0309) ? (_0x94cb1f = _0x21d388 === _0x1d0309, true) : false;
        })) {
          if (_0x529e52 === "upsert") {
            if (!_0x94cb1f) await this.handleFileUpsert(_0x21d388);else {
              let _0x104bce = await (0, fs_promises_module.readdir)(_0x21d388);
              for (let key of _0x104bce) await this.handleFileUpsert(path_module.join(_0x21d388, key));
            }
          } else _0x529e52 === 'delete' && (_0x94cb1f ? await this.handleDirectoryDelete(_0x21d388) : await this.handleFileDelete(_0x21d388));
          await this.sendCLIAgentsToUI();
        }
      }
      ["getWorkspaceCLIAgentsPaths"]() {
        let _0x324e21 = workspace_info.getInstance().getWorkspaceDirs();
        return _0x324e21 ? _0x324e21.map(_0x2d8b10 => path_module.join(_0x2d8b10, '.traycer', 'cli-agents')) : [];
      }
      async ['loadWorkspaceTemplateDirectories']() {
        let _0x3aa448 = workspace_info.getInstance().getPlatform() === xr.WINDOWS ? '.bat' : '.sh',
          _0x160b37 = this.getWorkspaceCLIAgentsPaths();
        for (let key of _0x160b37) if (await workspace_info.getInstance().fileExists(key)) {
          let _0x2cda8a = await (0, fs_promises_module.readdir)(key);
          for (let _0x1c9850 of _0x2cda8a) if (_0x1c9850.endsWith(_0x3aa448)) {
            let _0x349372 = path_module.join(key, _0x1c9850);
            await this.loadCLIAgentFromDisk(_0x349372);
          }
        }
        await this.sendCLIAgentsToUI();
      }
      ["determineScopeFromFilePath"](_0x4c347c) {
        let _0x182e8b = path_module.normalize(_0x4c347c),
          _0x10e55a = path_module.normalize(_0x3e7e8c.DEFAULT_CLI_AGENTS_DIR);
        if (_0x182e8b.startsWith(_0x10e55a)) return 'user';
        if (workspace_info.getInstance().getWorkspaceDirs().some(_0x2b0636 => _0x182e8b.startsWith(_0x2b0636))) return "workspace";
        throw new Error('Invalid file path: ' + _0x4c347c);
      }
      async ['startGlobalWatcher']() {
        (await workspace_info.getInstance().fileExists(_0x3e7e8c.DEFAULT_CLI_AGENTS_DIR)) || (await (0, fs_promises_module.mkdir)(_0x3e7e8c.DEFAULT_CLI_AGENTS_DIR, {
          recursive: true
        }));
        let _0x11fdb6 = workspace_info.getInstance().getPlatform() === xr.WINDOWS ? '.bat' : '.sh',
          _0x15f10e = chokidar_module.watch(_0x3e7e8c.DEFAULT_CLI_AGENTS_DIR, {
            ignoreInitial: false,
            followSymlinks: false,
            atomic: true,
            ignorePermissionErrors: true,
            ignored: _0x3409d5 => {
              let _0x284c56 = path_module.extname(_0x3409d5).toLowerCase();
              return _0x284c56 !== '' && _0x284c56 !== _0x11fdb6;
            },
            persistent: true
          });
        return this.setupWatcherEvents(_0x15f10e), this.globalWatcher = _0x15f10e, new Promise(_0x5d466e => {
          _0x15f10e.on('ready', () => {
            _0x5d466e();
          });
        });
      }
      ["setupWatcherEvents"](_0x431773) {
        _0x431773.on("add", async _0x31f30d => {
          try {
            await this.handleFileUpsert(_0x31f30d);
          } catch (_0x161e2b) {
            Logger.error(_0x161e2b, "Failed to handle file create CLI tool template: " + _0x31f30d);
          } finally {
            await this.sendCLIAgentsToUI();
          }
        }), _0x431773.on('change', async _0x150d3f => {
          try {
            await this.handleFileUpsert(_0x150d3f);
          } catch (_0x5c38c9) {
            Logger.error(_0x5c38c9, 'Failed to handle file update CLI tool template: ' + _0x150d3f);
          } finally {
            await this.sendCLIAgentsToUI();
          }
        }), _0x431773.on("unlink", async _0x489314 => {
          try {
            await this.handleFileDelete(_0x489314);
          } catch (_0x385bc8) {
            Logger.error(_0x385bc8, 'Failed to handle file delete CLI tool template: ' + _0x489314);
          } finally {
            await this.sendCLIAgentsToUI();
          }
        });
      }
    };
  }),
  bD,
  initPromptTemplateHandler = __esmModule(() => {
    'use strict';

    initCliAgentService(), bD = class {
      async ['handle'](_0xd3e916) {
        switch (_0xd3e916.type) {
          case Ru.CREATE_USER_CLI_AGENT:
            await this.createUserCLIAgent(_0xd3e916.templateName, _0xd3e916.fileExtension, _0xd3e916.cloneTemplatePath);
            break;
          case Ru.CREATE_WORKSPACE_CLI_AGENT:
            await this.createWorkspaceCLIAgent(_0xd3e916.templateName, _0xd3e916.fileExtension, _0xd3e916.workspaceDirPath, _0xd3e916.cloneTemplatePath);
            break;
          case Ru.DELETE_CLI_AGENT:
            await this.deleteCLIAgent(_0xd3e916.filePath);
            break;
          case Ru.REFRESH_CLI_AGENTS:
            await this.refreshCLIAgents();
            break;
          case Ru.OPEN_CLI_AGENT:
            await this.openCLIAgent(_0xd3e916.filePath);
            break;
          case Ru.IS_USER_CLI_AGENT_NAME_ALLOWED:
            await this.isUserCLIAgentNameAllowed(_0xd3e916.templateName, _0xd3e916.fileExtension);
            break;
          case Ru.IS_WORKSPACE_CLI_AGENT_NAME_ALLOWED:
            await this.isWorkspaceCLIAgentNameAllowed(_0xd3e916.templateName, _0xd3e916.fileExtension, _0xd3e916.workspaceDirPath);
            break;
        }
      }
      async ["createUserCLIAgent"](_0x213763, _0x28d935, _0x2c0703) {
        return ii.getInstance().createUserCLIAgent(_0x213763, _0x28d935, _0x2c0703);
      }
      async ['createWorkspaceCLIAgent'](_0x5a6023, _0x202e09, _0x127b5d, _0x1a495d) {
        return ii.getInstance().createWorkspaceCLIAgent(_0x5a6023, _0x202e09, _0x127b5d, _0x1a495d);
      }
      async ['deleteCLIAgent'](_0x26c1cc) {
        return ii.getInstance().deleteCLIAgent(_0x26c1cc);
      }
      async ["refreshCLIAgents"]() {
        return ii.getInstance().sendCLIAgentsToUI();
      }
      async ['openCLIAgent'](_0x5794f8) {
        return ii.getInstance().openCLIAgent(_0x5794f8);
      }
      async ['isUserCLIAgentNameAllowed'](_0x14e477, _0xbd7ec8) {
        return ii.getInstance().isUserCLIAgentNameAllowed(_0x14e477, _0xbd7ec8);
      }
      async ['isWorkspaceCLIAgentNameAllowed'](_0x270369, _0x3c17ee, _0x35a47e) {
        return ii.getInstance().isWorkspaceCLIAgentNameAllowed(_0x270369, _0x3c17ee, _0x35a47e);
      }
    };
  }),
  S0,
  initCliAgentHandler = __esmModule(() => {
    'use strict';

    initSearchConfig(), initCommentNavigator(), S0 = class _0x38838b {
      constructor() {}
      ['handle'](_0xdf6e40) {
        switch (_0xdf6e40.type) {
          case bO.ACTIVATION_STATUS:
            return _0x38838b.sendExtensionActivationStatus();
        }
      }
      static async ['sendExtensionActivationStatus']() {
        let _0x30da54 = {
          type: kO.ACTIVATED,
          isActivated: config.activated,
          sendToViewImmediately: true
        };
        await Qe.postToCommentNavigator(_0x30da54);
      }
    };
  }),
  CD,
  initGitHubAuthHandler = __esmModule(() => {
    'use strict';

    initTaskContext(), initCommentNavigator(), CD = class {
      constructor(_0x17cb20) {
        this.auth = _0x17cb20;
      }
      async ["handle"](_0x2fee81) {
        switch (_0x2fee81.type) {
          case mw.STATUS_REFRESH:
            await this.handleStatusRefresh();
            break;
          case mw.SET_ACTIVE_ACCOUNT_FOR_MCP_SERVER:
            await this.handleSetActiveAccountForMCPServer(_0x2fee81);
            break;
        }
      }
      async ['handleStatusRefresh']() {
        let _0x2cfa72 = await this.auth.listAllMCPServers(),
          _0x34660d = Vt.getInstance().selectedMCPParent,
          _0x316c0d = {
            type: vw.SYNC_MCP_SERVERS,
            mcpServersResponse: _0x2cfa72,
            selectedMCPParent: _0x34660d
          };
        return Qe.postToCommentNavigator(_0x316c0d);
      }
      async ["handleSetActiveAccountForMCPServer"](_0x33fec5) {
        await Vt.getInstance().setSelectedMCPParent(_0x33fec5.mcpAccountIdentifier), await this.ackSetActiveAccountForMCPServer(_0x33fec5.mcpAccountIdentifier);
      }
      async ["ackSetActiveAccountForMCPServer"](_0x4bc463) {
        let _0x99e122 = {
          type: vw.ACKNOWLEDGE_SET_ACTIVE_ACCOUNT_FOR_MCP_SERVER,
          accountIdentifier: _0x4bc463
        };
        return Qe.postToCommentNavigator(_0x99e122);
      }
    };
  }),
  ID,
  initCloudUIAuthHandler = __esmModule(() => {
    'use strict';

    initTemplateManager(), ID = class {
      async ["handle"](_0x29a803) {
        switch (_0x29a803.type) {
          case ea.CREATE_USER_PROMPT_TEMPLATE:
            await this.createUserPromptTemplate(_0x29a803.templateName, _0x29a803.templateType, _0x29a803.cloneTemplatePath);
            break;
          case ea.CREATE_WORKSPACE_PROMPT_TEMPLATE:
            await this.createWorkspacePromptTemplate(_0x29a803.templateName, _0x29a803.templateType, _0x29a803.workspaceDirPath, _0x29a803.cloneTemplatePath);
            break;
          case ea.ACTIVATE_PROMPT_TEMPLATE:
            await this.activateTemplate(_0x29a803.filePath);
            break;
          case ea.DEACTIVATE_PROMPT_TEMPLATE:
            await this.deactivateTemplate(_0x29a803.filePath);
            break;
          case ea.DELETE_PROMPT_TEMPLATE:
            await this.deleteTemplate(_0x29a803.filePath);
            break;
          case ea.REFRESH_PROMPT_TEMPLATES:
            await this.refreshTemplates();
            break;
          case ea.OPEN_PROMPT_TEMPLATE:
            await this.openTemplate(_0x29a803.filePath);
            break;
          case ea.IS_USER_PROMPT_TEMPLATE_NAME_ALLOWED:
            await this.isUserPromptTemplateNameAllowed(_0x29a803.templateName);
            break;
          case ea.IS_WORKSPACE_PROMPT_TEMPLATE_NAME_ALLOWED:
            await this.isWorkspacePromptTemplateNameAllowed(_0x29a803.templateName, _0x29a803.workspaceDirPath);
            break;
          case ea.LIST_WORKSPACE_DIRECTORIES:
            await this.listWorkspaceDirectories();
            break;
        }
      }
      async ['createUserPromptTemplate'](_0xfd8aeb, _0x21115e, _0x386466) {
        return br.getInstance().createUserPromptTemplate(_0xfd8aeb, _0x21115e, _0x386466);
      }
      async ["createWorkspacePromptTemplate"](_0xc80ba, _0x189301, _0x278912, _0x5b237e) {
        return br.getInstance().createWorkspacePromptTemplate(_0xc80ba, _0x189301, _0x278912, _0x5b237e);
      }
      async ["activateTemplate"](_0x5d0903) {
        return br.getInstance().activatePromptTemplate(_0x5d0903);
      }
      async ["deactivateTemplate"](_0x5df769) {
        return br.getInstance().deactivatePromptTemplate(_0x5df769);
      }
      async ["deleteTemplate"](_0x23f682) {
        return br.getInstance().deletePromptTemplate(_0x23f682);
      }
      async ["refreshTemplates"]() {
        await br.getInstance().refreshPromptTemplates();
      }
      async ['openTemplate'](_0x26ec4b) {
        return br.getInstance().openPromptTemplate(_0x26ec4b);
      }
      async ["isUserPromptTemplateNameAllowed"](_0x30fe77) {
        return br.getInstance().isUserPromptTemplateNameAllowed(_0x30fe77);
      }
      async ['isWorkspacePromptTemplateNameAllowed'](_0xb9df70, _0xcfbad8) {
        return br.getInstance().isWorkspacePromptTemplateNameAllowed(_0xb9df70, _0xcfbad8);
      }
      async ['listWorkspaceDirectories']() {
        return br.getInstance().listWorkspaceDirectories();
      }
    };
  }),
  UsageTracker,
  initUsageTracker = __esmModule(() => {
    'use strict';

    initCommentNavigatorDeps(), initUsageInfoHandler(), UsageTracker = class _0x10574b {
      constructor(_0x188c71) {
        this.reFetchTimer = null, this.isFetching = false, this.lastSentMessage = null, this.lastSentFetchStatus = null, this.client = _0x188c71, this._latestRateLimitInfo = {
          remainingTokens: 0,
          totalTokens: 0,
          retryAfter: 0
        };
      }
      static ['getInstance'](_0x367117) {
        if (!_0x10574b.instance) {
          if (!_0x367117) throw new Error('Need client to initialize usage information tracker the first time.');
          _0x10574b.instance = new _0x10574b(_0x367117);
        }
        return _0x10574b.instance;
      }
      ["dispose"]() {
        this.reFetchTimer && (clearTimeout(this.reFetchTimer), this.reFetchTimer = null);
      }
      set ["latestRateLimitInfo"](_0xfd58e5) {
        this._latestRateLimitInfo = _0xfd58e5, _0xfd58e5.retryAfter && _0xfd58e5.remainingTokens < 1 && Xr.updateRateLimitTimestamp(_0xfd58e5.retryAfter), _0xfd58e5.remainingTokens >= 1 && Xr.updateRateLimitTimestamp(void 0);
      }
      get ["latestRateLimitInfo"]() {
        return this._latestRateLimitInfo;
      }
      async ['setIsFetching'](_0x10e492) {
        this.isFetching = _0x10e492, await this.sendFetchStatusToWebview();
      }
      ["startRetryTimer"](_0x1ba6c5) {
        this.reFetchTimer && clearTimeout(this.reFetchTimer), this.reFetchTimer = setTimeout(async () => {
          this.isFetching || (await this.fetchRateLimitUsage(false, false));
        }, (_0x1ba6c5 + 1) * 1000);
      }
      async ["fetchRateLimitUsageInBackground"](_0x6dd17, _0x12aa51) {
        try {
          await this.fetchRateLimitUsage(_0x6dd17, _0x12aa51);
        } catch (_0x214343) {
          Logger.warn('Error fetching rate limit usage in background', _0x214343);
        }
      }
      async ['fetchRateLimitUsage'](_0x2190fe, _0x58b060) {
        await this.setIsFetching(true);
        try {
          let _0x3a7c9f = {},
            _0x12ce41 = new AbortController();
          _0x2190fe && (await this.client.auth.refreshTraycerToken());
          let _0x1e78c1 = await this.client.sendGetRateLimitUsageRequest(_0x3a7c9f, _0x12ce41);
          _0x1e78c1.rateLimitInfo && (this.latestRateLimitInfo = _0x1e78c1.rateLimitInfo, await this.sendUsageInformationToWebview(_0x58b060));
        } finally {
          await this.setIsFetching(false);
        }
      }
      async ["handleSyncRateLimitUsage"](_0x3cb28b) {
        this.latestRateLimitInfo = _0x3cb28b, await this.sendUsageInformationToWebview(false);
      }
      async ["handleSendIsFetchingStatus"]() {
        return this.sendFetchStatusToWebview();
      }
      async ["sendFetchStatusToWebview"]() {
        let _0x461cac = {
          type: Tw.SEND_FETCH_STATUS,
          isFetching: this.isFetching
        };
        this.lastSentFetchStatus && (0, lodash_module.isEqual)(this.lastSentFetchStatus, _0x461cac) || (this.lastSentFetchStatus = _0x461cac, await Qe.postToCommentNavigator(_0x461cac));
      }
      async ['sendUsageInformationToWebview'](_0x2d71e2) {
        let _0x5c56e3 = this.convertToUsageInformation(this.latestRateLimitInfo),
          _0x1451f7 = {
            type: Tw.SEND_USAGE_INFORMATION,
            usageInformation: _0x5c56e3
          };
        this.deduplicateMessage(_0x1451f7) && !_0x2d71e2 || (this.lastSentMessage = _0x1451f7, this.latestRateLimitInfo.retryAfter && this.startRetryTimer(this.latestRateLimitInfo.retryAfter), await Qe.postToCommentNavigator(_0x1451f7));
      }
      ["deduplicateMessage"](_0x36debc) {
        return !!(this.lastSentMessage && (0, lodash_module.isEqual)(this.lastSentMessage, _0x36debc));
      }
      ["convertToUsageInformation"](_0x18d114) {
        return {
          totalTokens: _0x18d114.totalTokens ?? 0,
          remainingTokens: Number((_0x18d114.remainingTokens ?? 0).toFixed(3)),
          retryAfter: _0x18d114.retryAfter ?? null
        };
      }
    };
  }),
  AD,
  initSubscriptionHandler = __esmModule(() => {
    'use strict';

    initUsageTracker(), AD = class {
      constructor() {}
      async ['handle'](_0x5679fc) {
        switch (_0x5679fc.type) {
          case _w.FETCH_USAGE_INFORMATION:
            await this.fetchUsageInformation(_0x5679fc);
            break;
          case _w.SEND_FETCH_STATUS:
            await this.sendFetchStatus();
            break;
          default:
            Logger.warn("Invalid usage information message received from webview:", _0x5679fc);
        }
      }
      async ['fetchUsageInformation'](_0x4dc061) {
        await UsageTracker.getInstance().fetchRateLimitUsage(_0x4dc061.refreshTraycerToken, true);
      }
      async ['sendFetchStatus']() {
        await UsageTracker.getInstance().handleSendIsFetchingStatus();
      }
    };
  }),
  kD,
  initExtensionActivationHandler = __esmModule(() => {
    'use strict';

    initMcpHandler(), kD = class {
      ["handle"](_0x1b8045) {
        switch (_0x1b8045.type) {
          case IO.LISTENERS_READY:
            _0x1b8045.webviewChannel === 'commentNavigator' && Bf.getInstance().markNavigatorReady();
            break;
          default:
            throw new Error("Unknown message type: " + _0x1b8045.type);
        }
      }
    };
  }),
  H_,
  initTrackMetricsHandler = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initCommentNavigator(), H_ = class _0xc83630 {
      constructor() {}
      static ["getInstance"]() {
        return this.instance || (this.instance = new _0xc83630()), this.instance;
      }
      ['handle'](_0x46b20d) {
        switch (_0x46b20d.type) {
          case gw.OPEN_FOLDER:
            return this.openFolder(_0x46b20d.workspace);
          case gw.GET_WORKSPACE_STATUS:
            return this.sendWorkspaceStatus();
        }
      }
      async ["openFolder"](_0xdce967) {
        if (_0xdce967) {
          let _0x3dfe03 = vscode_module.Uri.file(_0xdce967);
          await vscode_module.commands.executeCommand('vscode.openFolder', _0x3dfe03, {
            forceNewWindow: true
          });
        } else await vscode_module.commands.executeCommand('vscode.openFolder');
      }
      async ['sendWorkspaceStatus']() {
        let _0x40b61e = workspace_info.getInstance().getWorkspaceDirs().length > 0,
          _0x21db31 = {
            type: RO.WORKSPACE_STATUS,
            hasOpenedFolder: _0x40b61e,
            sendToViewImmediately: true
          };
        await Qe.postToCommentNavigator(_0x21db31);
      }
    };
  });
function normalizePathSeparators() {
  let _0x542ee4 = '',
    _0x1b8d81 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let _0x266123 = 0; _0x266123 < 32; _0x266123++) _0x542ee4 += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.length));
  return _0x542ee4;
}
var Qe,
  initCommentNavigator = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initAnalytics(), initFilePathHandler(), initMetricsHandler(), initTaskSettingsHandler(), initWebviewStatusHandler(), initUsageInfoHandler(), initMcpHandler(), initPromptTemplateHandler(), initCliAgentHandler(), initGitHubAuthHandler(), initCloudUIAuthHandler(), initSubscriptionHandler(), initExtensionActivationHandler(), initTrackMetricsHandler(), Qe = class _0x23672d {
      constructor(_0x2c906e) {
        this.context = _0x2c906e;
        let _0x5b9eb1 = vscode_module.window.registerWebviewViewProvider(COMMENT_NAVIGATOR_WEBVIEW_ID, this, {
          webviewOptions: {
            retainContextWhenHidden: true
          }
        });
        _0x2c906e.subscriptions.push(_0x5b9eb1);
      }
      static set ['commentNavigatorView'](_0x4a0c80) {
        _0x23672d._commentNavigatorView = _0x4a0c80;
      }
      static get ["commentNavigatorView"]() {
        return _0x23672d._commentNavigatorView;
      }
      static ["getInstance"](_0x5b07df, _0x5b3c9a) {
        return _0x23672d.instance ? _0x23672d.instance.context = _0x5b07df : _0x23672d.instance = new _0x23672d(_0x5b07df), _0x23672d.instance.taskHandler = new ED(), _0x23672d.instance.extensionActivationHandler = new S0(), _0x23672d.instance.subscriptionHandler = new Gf(_0x5b3c9a), _0x23672d.instance.trackMetricsHandler = new U1(), _0x23672d.instance.gitHubAuthenticationHandler = new GitHubAuthHandler(_0x5b3c9a), _0x23672d.instance.cloudUIAuthenticationHandler = new CloudAuthHandler(_0x5b3c9a), _0x23672d.instance.taskSettingsHandler = new Xr(), _0x23672d.instance.webviewStatusMessageHandler = new kD(), _0x23672d.instance.usageInformationHandler = new AD(), _0x23672d.instance.mcpHandler = new CD(_0x5b3c9a), _0x23672d.instance.promptTemplateHandler = new ID(), _0x23672d.instance.cliAgentHandler = new bD(), _0x23672d.instance.fileHandler = na.getInstance(), _0x23672d.instance;
      }
      ["dispose"]() {
        this._visibilityChangeWatcher?.['dispose']();
      }
      ['getCommentNavigatorContext']() {
        return this._commentNavigatorContext;
      }
      async ['resolveWebviewView'](_0x17a040, _0x493e44) {
        _0x17a040.viewType === COMMENT_NAVIGATOR_WEBVIEW_ID && (this._commentNavigatorContext = _0x493e44, this._commentNavigatorState = _0x493e44.state, yn.getInstance().increment("navigator_view", null), this._visibilityChangeWatcher = _0x17a040.onDidChangeVisibility(() => {
          _0x17a040.visible && yn.getInstance().increment('navigator_view', null);
        }), _0x23672d.commentNavigatorView = _0x17a040), _0x17a040.webview.options = {
          enableScripts: true,
          localResourceRoots: [this.context.extensionUri]
        }, _0x17a040.webview.html = await this._getHtmlForWebview(_0x17a040), _0x17a040.webview.onDidReceiveMessage(_0x20fdf5 => {
          this.handleWebviewMessage(_0x20fdf5);
        });
      }
      async ["handleWebviewMessage"](_0x5d8d24) {
        try {
          await this.handleWebviewMessageImpl(_0x5d8d24);
        } catch (_0x45bb23) {
          Logger.error("Error handling webview message: " + formatErrorToString(_0x45bb23));
        }
      }
      async ["handleWebviewMessageImpl"](_0x33aaff) {
        let _0x32d382 = _0x33aaff.type;
        switch (true) {
          case getGitignorePath(_0x32d382):
            return this.webviewStatusMessageHandler?.["handle"](_0x33aaff);
          case isGitignoreLoaded(_0x32d382):
            return this.gitHubAuthenticationHandler?.["handle"](_0x33aaff);
          case loadGitignoreFromPath(_0x32d382):
            return this.cloudUIAuthenticationHandler?.['handle'](_0x33aaff);
          case reloadGitignore(_0x32d382):
            return this.extensionActivationHandler?.['handle'](_0x33aaff);
          case removeGitignorePatterns(_0x32d382):
            return this.taskSettingsHandler?.["handle"](_0x33aaff);
          case hasGitignoreFile(_0x32d382):
            return this.trackMetricsHandler?.['handle'](_0x33aaff);
          case clearGitignoreCache(_0x32d382):
            return this.subscriptionHandler?.["handle"](_0x33aaff);
          case getGitignorePatterns(_0x32d382):
            return this.taskHandler?.["handle"](_0x33aaff);
          case setGitignorePath(_0x32d382):
            return this.usageInformationHandler?.["handle"](_0x33aaff);
          case getGitignoreStats(_0x32d382):
            return H_.getInstance().handle(_0x33aaff);
          case resetGitignoreState(_0x32d382):
            return this.mcpHandler?.['handle'](_0x33aaff);
          case initGitignoreWatcher(_0x32d382):
            return this.promptTemplateHandler?.["handle"](_0x33aaff);
          case disposeGitignoreWatcher(_0x32d382):
            return this.cliAgentHandler?.["handle"](_0x33aaff);
          case onGitignoreChange(_0x32d382):
            return this.fileHandler?.["handle"](_0x33aaff);
          default:
            throw new Error("Unknown message type: " + _0x32d382);
        }
      }
      static ['postToAllWebviews'](_0x13ff8d) {
        return this.postToCommentNavigator(_0x13ff8d);
      }
      static async ['postToCommentNavigator'](_0x35d0fd) {
        return Bf.getInstance().enqueueOrSendToCommentNavigator(_0x35d0fd);
      }
      static async ["openCommentNavigator"]() {
        await vscode_module.commands.executeCommand(COMMENT_NAVIGATOR_WEBVIEW_ID + ".focus");
        let _0xe2668f = 0;
        for (; !_0x23672d.commentNavigatorView && _0xe2668f < 20;) await new Promise(_0x553dd3 => setTimeout(_0x553dd3, 200)), _0xe2668f++;
      }
      ["getCommentNavigatorState"]() {
        return this._commentNavigatorState || {};
      }
      async ['getReactApp'](_0x1aa01e) {
        let _0x535b51 = vscode_module.Uri.joinPath(this.context.extensionUri, 'traycer-views', "dist", "assets"),
          _0x2136e7 = _0x1aa01e.webview.asWebviewUri(vscode_module.Uri.joinPath(_0x535b51, "commentNavigator.js")),
          _0x12c129 = _0x1aa01e.webview.asWebviewUri(vscode_module.Uri.joinPath(_0x535b51, 'commentNavigator.css')),
          _0x274c8a = _0x1aa01e.webview.asWebviewUri(vscode_module.Uri.joinPath(_0x535b51, "global.js")),
          _0x29e1cb = _0x1aa01e.webview.asWebviewUri(vscode_module.Uri.joinPath(_0x535b51, 'global.css')),
          _0x507afa = normalizePathSeparators(),
          _0x570ae4 = workspace_info.getInstance().getIdeInfo().name;
        return "<!DOCTYPE html>\n    <html lang=\"en\">\n      <head>\n        <title>Traycer</title>\n        <meta charset=\"utf-8\" />\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n        <meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src " + _0x1aa01e.webview.cspSource + ' \x27unsafe-inline\x27; script-src \x27nonce-' + _0x507afa + "'; img-src " + _0x1aa01e.webview.cspSource + " https://avatars.githubusercontent.com/ https://github.com/ data:;\">\n        <meta\n          name=\"description\"\n          content=\"Traycer is a vscode extension that trace your code and provide you valuable insights.\"\n        />\n        <meta\n          name=\"traycerDetectedPlatform\"\n          content=" + process.platform + "\n        />\n        <meta\n          name=\"traycerDetectedIDE\"\n          content=" + _0x570ae4 + '\x0a        />\x0a        <title>Traycer</title>\x0a        <link href=\x22' + _0x12c129 + '\x22 rel=\x22stylesheet\x22 />\x0a        <link href=\x22' + _0x29e1cb + '\x22 rel=\x22stylesheet\x22 />\x0a        <script nonce=\x22' + _0x507afa + "\" type=\"module\" defer=\"defer\" src=\"" + _0x2136e7 + "\"></script>\n        <script nonce=\"" + _0x507afa + "\" type=\"module\" defer=\"defer\" src=\"" + _0x274c8a + '\x22></script>\x0a      </head>\x0a      <body>\x0a        <div id=\x22root\x22></div>\x0a      </body>\x0a    </html>';
      }
      ["_getHtmlForWebview"](_0x28f2cd) {
        return this.getReactApp(_0x28f2cd);
      }
    };
  })
  /* [dead-code] ob removed */
  /* [dead-code] lj removed */
  /* [dead-code] zt removed */
  /* [dead-code] ur removed */
  /* [dead-code] zd removed */
  /* [dead-code] fb removed */
  /* [dead-code] cye removed */
  /* [dead-code] Ij removed */
  /* [dead-code] Aj removed */
  /* [dead-code] hb removed */
  /* [dead-code] _ye removed */
  /* [dead-code] Fo removed */
  /* [dead-code] Eye removed */
  /* [dead-code] wye removed */
  /* [dead-code] Nj removed */
  /* [dead-code] Cye removed */
  /* [dead-code] mb removed */
  /* [dead-code] yb removed */
  /* [dead-code] GD removed */
  /* [dead-code] vb removed */
  /* [dead-code] WD removed */
  /* [dead-code] Hye removed */
  /* [dead-code] Yj removed */
  /* [dead-code] tve removed */
  /* [dead-code] ive removed */
  /* [dead-code] ave removed */
  /* [dead-code] hve removed */
  /* [dead-code] mve removed */
  /* [dead-code] vve removed */
  /* [dead-code] Tve removed */
  /* [dead-code] Eve removed */
  /* [dead-code] Sve removed */
  /* [dead-code] Pve removed */
  /* [dead-code] bve removed */
  /* [dead-code] Cve removed */
  /* [dead-code] Ive removed */
  /* [dead-code] Ave removed */
  /* [dead-code] kve removed */
  /* [dead-code] tN removed */
  /* [dead-code] Ove removed */
  /* [dead-code] xve removed */
  /* [dead-code] Mve removed */
  /* [dead-code] Dve removed */
  /* [dead-code] v8 removed */
  /* [dead-code] T8 removed */
  /* [dead-code] Uve removed */
  /* [dead-code] Bve removed */
  /* [dead-code] qve removed */
  /* [dead-code] Wve removed */
  /* [dead-code] Hve removed */
  /* [dead-code] I8 removed */
  /* [dead-code] Kve removed */
  /* [dead-code] Zve removed */
  /* [dead-code] e0e removed */
  /* [dead-code] t0e removed */
  /* [dead-code] r0e removed */
  /* [dead-code] n0e removed */
  /* [dead-code] a0e removed */
  /* [dead-code] o0e removed */
  /* [dead-code] u0e removed */
  /* [dead-code] c0e removed */
  /* [dead-code] l0e removed */
  /* [dead-code] d0e removed */
  /* [dead-code] f0e removed */
  /* [dead-code] m0e removed */
  /* [dead-code] g0e removed */
  /* [dead-code] y0e removed */;
/* [unbundle] ajv 已移至顶部导入区 */

/* [dead-code] ajv/gray-matter 相关 dead-code 已清理 */
/* [unbundle] gray-matter 已移至顶部导入区 */
function parseJsonSafe() {
  return oH || (oH = new ajv_module()), oH;
}
var oH,
  TemplateFile,
  initTemplateFile = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), oH = null, TemplateFile = class {
      constructor(_0x38c1e6, _0xd68cca, _0x2af77d) {
        this._filePath = _0x38c1e6, this._metadata = _0xd68cca, this._validationResult = _0x2af77d;
      }
      get ['filePath']() {
        return this._filePath;
      }
      get ['metadata']() {
        return this._metadata;
      }
      get ["validationResult"]() {
        return this._validationResult;
      }
      async ['getContent']() {
        let _0x3af6ff = await workspace_info.getInstance().readFile(this.filePath);
        return (0, gray_matter_module)(_0x3af6ff).content.replaceAll(/<!--[\s\S]*?-->\s*/g, '').trim();
      }
      async ["createOnDisk"](_0x5c95b5) {
        if (await workspace_info.getInstance().fileExists(this.filePath)) throw new TemplateFileAlreadyExistsError(this.filePath);
        let _0x2f836e = gray_matter_module.stringify(_0x5c95b5, this.metadata);
        await (0, fs_promises_module.mkdir)(path_module.dirname(this.filePath), {
          recursive: true
        }), await (0, fs_promises_module.writeFile)(this.filePath, _0x2f836e, {
          mode: 420
        });
      }
      static async ['validateTemplateFile'](_0x49c732, _0x45712a) {
        if (!(await workspace_info.getInstance().fileExists(_0x49c732))) throw new TemplateFileNotFoundError(_0x49c732);
        if (path_module.extname(_0x49c732).toLowerCase() !== '.md') throw new TemplateFileNotMarkdownError();
        let _0x4e31e2 = await workspace_info.getInstance().readFile(_0x49c732);
        if (!_0x4e31e2.length) throw new TemplateFileEmptyError();
        if (!gray_matter_module.test(_0x4e31e2)) throw new TemplateMissingMetadataError();
        let _0x5e0a45 = (0, gray_matter_module)(_0x4e31e2),
          _0x5cfe6c = parseJsonSafe().compile(_0x45712a);
        if (!_0x5cfe6c(_0x5e0a45.data)) {
          let _0x5a07e5 = _0x5cfe6c.errors?.['map'](_0x45bda9 => {
            if (_0x45bda9.keyword === "enum" && _0x45bda9.params && "allowedValues" in _0x45bda9.params) {
              let _0x2934ce = _0x45bda9.params.allowedValues.join(', ');
              return ((_0x45bda9.instancePath ? _0x45bda9.instancePath.substring(1) : _0x45bda9.schemaPath) || "field") + ' should be equal to one of the allowed values: ' + _0x2934ce;
            }
            return _0x45bda9.message;
          })['join'](', ');
          throw new TemplateInvalidMetadataError(_0x5a07e5);
        }
        return _0x5e0a45.data;
      }
    };
  }),
  PromptMetadata,
  initPromptMetadata = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), PromptMetadata = class {
      static ['createMetadata'](_0x4ed3ea, _0x590039) {
        return {
          displayName: workspace_info.getInstance().getFileNameWithoutExtension(_0x4ed3ea),
          applicableFor: _0x590039
        };
      }
      static ['createDefaultMetadata'](_0x2a5182) {
        return {
          displayName: 'Default',
          applicableFor: _0x2a5182
        };
      }
      static ["createValidationResult"]() {
        return {
          isValid: true,
          errors: []
        };
      }
      static ['instantiateTemplate'](_0x479455, _0x4d8a30, _0x4a6bec, _0x5d529d, _0x5a2ead, _0x1e5452) {
        return new _0x479455(_0x4d8a30, _0x4a6bec, _0x5d529d, _0x5a2ead, _0x1e5452);
      }
      static async ['createTemplateOnDisk'](_0x1b5b87, _0x28a1fe) {
        await _0x1b5b87.createOnDisk(_0x28a1fe);
      }
      static ['createDefaultContent'](_0x5a1b9c, _0x4b4972) {
        return '\x0a<!--\x0a' + _0x5a1b9c + '\x0a\x0aAllowed tags:\x0a' + _0x4b4972.map(_0x18cab1 => '- {{' + _0x18cab1 + '}}').join('\x0a').trimEnd() + '\x0a-->\x0a';
      }
      static ['createDefaultTemplateOnVirtualFileSystem'](_0x1e7521) {
        let _0x25df35 = this.createDefaultMetadata(_0x1e7521.PROMPT_TEMPLATE_TYPE),
          _0x3927eb = gray_matter_module.stringify(_0x1e7521.DEFAULT_TEMPLATE_CONTENT, _0x25df35);
        TraycerFileSystem.getInstance().createFile(_0x1e7521.DEFAULT_TEMPLATE_FILE_PATH, Buffer.from(_0x3927eb, 'utf8'));
      }
      static async ["createNewTemplate"](_0x2f1dc2, _0x1ab583, _0x5506e4, _0x370587) {
        let _0x37849f = this.createMetadata(_0x2f1dc2, _0x5506e4.PROMPT_TEMPLATE_TYPE),
          _0x28a558 = this.createValidationResult(),
          _0x2f88cd = this.instantiateTemplate(_0x5506e4, _0x2f1dc2, _0x37849f, _0x28a558, _0x1ab583, false),
          _0x74db14 = _0x370587 || this.createDefaultContent(_0x5506e4.PROMPT_TEMPLATE_INITIAL_COMMENT, _0x2f88cd.getAllowedFields());
        return await this.createTemplateOnDisk(_0x2f88cd, _0x74db14), _0x2f88cd;
      }
      static async ['loadTemplateFromDisk'](_0x3477d5, _0x4e1b05, _0x1d626e, _0x4ca9b9) {
        let _0x172ac5 = this.instantiateTemplate(_0x4ca9b9, _0x3477d5, _0x4e1b05, this.createValidationResult(), _0x1d626e, false);
        return await _0x172ac5.validateTemplate(), _0x172ac5;
      }
      static ["createDefaultTemplate"](_0x39c62c) {
        let _0x38bb22 = this.createValidationResult();
        return this.createDefaultTemplateOnVirtualFileSystem(_0x39c62c), this.instantiateTemplate(_0x39c62c, _0x39c62c.DEFAULT_TEMPLATE_FILE_PATH.toString(), this.createDefaultMetadata(_0x39c62c.PROMPT_TEMPLATE_TYPE), _0x38bb22, 'user', true);
      }
    };
  }),
  TemplateFileBase,
  initTemplateFileBase = __esmModule(() => {
    'use strict';

    initTemplateFile(), TemplateFileBase = class extends TemplateFile {
      constructor(_0x2ecbc2, _0x5a1084, _0x5b4717, _0x245384, _0xd45d53) {
        super(_0x2ecbc2, _0x5a1084, _0x5b4717), this._scope = _0x245384, this._isDefault = _0xd45d53;
      }
      get ["scope"]() {
        return this._scope;
      }
      get ['isDefault']() {
        return this._isDefault;
      }
      ['serializeToUI']() {
        return {
          filePath: this.filePath,
          metadata: this.metadata,
          validationResult: this.validationResult,
          allowedFields: this.getAllowedFields(),
          scope: this.scope,
          isDefault: this.isDefault
        };
      }
      async ["validateTemplate"]() {
        let _0x1bbec3 = await this.getContent(),
          _0xedf2e4 = [],
          _0x3b88a0 = this.getAllowedFields();
        _0x3b88a0.some(_0x5f07c7 => _0x1bbec3.includes('{{' + _0x5f07c7 + '}}')) ? (this.validationResult.isValid = true, this.validationResult.errors = []) : (_0xedf2e4.push("At least one of the tags must be present in the template.\n\nAllowed tags: " + _0x3b88a0.map(_0x3cdbcc => '{{' + _0x3cdbcc + '}}').join(', ')), this.validationResult.isValid = false, this.validationResult.errors = _0xedf2e4);
      }
      ['sanitizeForCLI'](_0x2205a4) {
        return _0x2205a4.trimStart().startsWith('-') ? '\x0a' + _0x2205a4 : _0x2205a4;
      }
      async ['applyTemplate'](_0x5cae0e) {
        if (typeof _0x5cae0e != 'string') throw new Error('Method should be overridden in the subclass');
        let _0x11761b = await this.getContent();
        for (let key of this.getAllowedFields()) _0x11761b = _0x11761b.replace('{{' + key + '}}', _0x5cae0e);
        return this.sanitizeForCLI(_0x11761b);
      }
    };
  }),
  GenericTemplate,
  initGenericTemplate = __esmModule(() => {
    'use strict';

    initTaskExecution(), initTemplateFileBase(), GenericTemplate = class extends TemplateFileBase {
      constructor() {
        super(...arguments), this.allowedFields = ["basePrompt"];
      }
      static {
        this.PROMPT_TEMPLATE_INITIAL_COMMENT = "Template to use while doing hand-off to any agent for code generation.";
      }
      static {
        this.DEFAULT_TEMPLATE_FILE_PATH = vscode_module.Uri.parse(EXTENSION_ID + ":/.traycer/default-templates/generic.md");
      }
      static {
        this.DEFAULT_TEMPLATE_CONTENT = '';
      }
      static {
        this.PROMPT_TEMPLATE_TYPE = 'generic';
      }
      ['getAllowedFields']() {
        return this.allowedFields;
      }
      async ["applyTemplate"](_0x4fbeee) {
        let _0x218fc7 = _0x4fbeee;
        return _0x4fbeee instanceof Uf && (_0x218fc7 = await _0x4fbeee.getMarkdown()), super.applyTemplate(_0x218fc7);
      }
    };
  }),
  UserQueryTemplate,
  initUserQueryTemplate = __esmModule(() => {
    'use strict';

    initTemplateFileBase(), UserQueryTemplate = class extends TemplateFileBase {
      constructor() {
        super(...arguments), this.allowedFields = ["userQuery"];
      }
      static {
        this.DEFAULT_TEMPLATE_FILE_PATH = vscode_module.Uri.parse(EXTENSION_ID + ':/.traycer/default-templates/user-query.md');
      }
      static {
        this.DEFAULT_TEMPLATE_CONTENT = '\x0aI have the following user query that I want you to help me with. Please implement the requested functionality following best practices.\x0a\x0a{{userQuery}}';
      }
      static {
        this.PROMPT_TEMPLATE_INITIAL_COMMENT = 'Template to use while executing a user query directly in any agent.';
      }
      static {
        this.PROMPT_TEMPLATE_TYPE = "userQuery";
      }
      ['getAllowedFields']() {
        return this.allowedFields;
      }
    };
  }),
  PlanTemplate,
  initPlanTemplate = __esmModule(() => {
    'use strict';

    initTemplateFileBase(), PlanTemplate = class extends TemplateFileBase {
      constructor() {
        super(...arguments), this.allowedFields = ["planMarkdown"];
      }
      static {
        this.DEFAULT_TEMPLATE_FILE_PATH = vscode_module.Uri.parse(EXTENSION_ID + ":/.traycer/default-templates/plan.md");
      }
      static {
        this.DEFAULT_TEMPLATE_CONTENT = "\nI have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.\n\n{{planMarkdown}}";
      }
      static {
        this.PROMPT_TEMPLATE_INITIAL_COMMENT = 'Template to use while executing a plan in any agent.';
      }
      static {
        this.PROMPT_TEMPLATE_TYPE = 'plan';
      }
      ["getAllowedFields"]() {
        return this.allowedFields;
      }
      async ["applyTemplate"](_0x1e3fbb) {
        let _0x4f7ffe = await _0x1e3fbb.getMarkdown(),
          _0xaa8b95 = await this.getContent();
        for (let key of this.getAllowedFields()) _0xaa8b95 = _0xaa8b95.replace('{{' + key + '}}', _0x4f7ffe);
        return this.sanitizeForCLI(_0xaa8b95);
      }
    };
  }),
  ReviewTemplate,
  initReviewTemplate = __esmModule(() => {
    'use strict';

    initTemplateFileBase(), ReviewTemplate = class extends TemplateFileBase {
      constructor() {
        super(...arguments), this.allowedFields = ['reviewComments'];
      }
      static {
        this.DEFAULT_TEMPLATE_FILE_PATH = vscode_module.Uri.parse(EXTENSION_ID + ":/.traycer/default-templates/review.md");
      }
      static {
        this.DEFAULT_TEMPLATE_CONTENT = "\nI have the following comments after thorough review of file. Implement the comments by following the instructions verbatim.\n\n{{reviewComments}}";
      }
      static {
        this.PROMPT_TEMPLATE_INITIAL_COMMENT = 'Template to use while doing hand-off to any agent for code generation of review comments.';
      }
      static {
        this.PROMPT_TEMPLATE_TYPE = "review";
      }
      ['getAllowedFields']() {
        return this.allowedFields;
      }
    };
  }),
  VerificationTemplate,
  initVerificationTemplate = __esmModule(() => {
    'use strict';

    initTemplateFileBase(), VerificationTemplate = class extends TemplateFileBase {
      constructor() {
        super(...arguments), this.allowedFields = ['comments'];
      }
      static {
        this.DEFAULT_TEMPLATE_FILE_PATH = vscode_module.Uri.parse(EXTENSION_ID + ':/.traycer/default-templates/verification.md');
      }
      static {
        this.DEFAULT_TEMPLATE_CONTENT = '\x0aI have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.\x0a\x0a{{comments}}';
      }
      static {
        this.PROMPT_TEMPLATE_INITIAL_COMMENT = "Template to use while doing hand-off to any agent for code generation of verification comments.";
      }
      static {
        this.PROMPT_TEMPLATE_TYPE = "verification";
      }
      ['getAllowedFields']() {
        return this.allowedFields;
      }
    };
  }),
  Sl,
  initPromptTemplateService = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initCommentNavigator(), initTaskContext(), initTemplateFile(), initPromptMetadata(), initGenericTemplate(), initUserQueryTemplate(), initPlanTemplate(), initReviewTemplate(), initVerificationTemplate(), Sl = class _0x389cf0 {
      constructor() {
        this.userPromptTemplates = new Map(), this.workspacePromptTemplates = new Map(), this.defaultPromptTemplates = new Map(), this.invalidTemplates = new Set(), this.globalWatcher = null;
      }
      static {
        this.instance = null;
      }
      static {
        this.DEFAULT_PROMPT_TEMPLATE_DIR_NAME = "prompt-templates";
      }
      static {
        this.DEFAULT_PROMPT_TEMPLATE_DIR = path_module.join(os_module.homedir(), '.traycer', _0x389cf0.DEFAULT_PROMPT_TEMPLATE_DIR_NAME);
      }
      static ['getInstance']() {
        return _0x389cf0.instance || (_0x389cf0.instance = new _0x389cf0()), _0x389cf0.instance;
      }
      async ['createUserPromptTemplate'](_0x554044, _0x1f523d, _0x46f797) {
        let _0x4e0064 = path_module.join(_0x389cf0.DEFAULT_PROMPT_TEMPLATE_DIR, _0x554044 + '.md');
        await this.createPromptTemplate(_0x4e0064, _0x1f523d, 'user', _0x46f797);
      }
      async ["createWorkspacePromptTemplate"](_0xe5defa, _0x542106, _0x4aa815, _0x2be926) {
        let _0x1ad17e = path_module.join(_0x4aa815, ".traycer", _0x389cf0.DEFAULT_PROMPT_TEMPLATE_DIR_NAME, _0xe5defa + '.md');
        await this.createPromptTemplate(_0x1ad17e, _0x542106, 'workspace', _0x2be926);
      }
      async ["createPromptTemplate"](_0x552021, _0x104833, _0x47ecc0, _0x2d18a1) {
        let _0x1056c9 = _0x2d18a1 ? await this.getPromptTemplate(_0x2d18a1).getContent() : void 0;
        switch (_0x104833) {
          case "plan":
            await PromptMetadata.createNewTemplate(_0x552021, _0x47ecc0, PlanTemplate, _0x1056c9);
            break;
          case "verification":
            await PromptMetadata.createNewTemplate(_0x552021, _0x47ecc0, VerificationTemplate, _0x1056c9);
            break;
          case 'generic':
            await PromptMetadata.createNewTemplate(_0x552021, _0x47ecc0, GenericTemplate, _0x1056c9);
            break;
          case "review":
            await PromptMetadata.createNewTemplate(_0x552021, _0x47ecc0, ReviewTemplate, _0x1056c9);
            break;
          case 'userQuery':
            await PromptMetadata.createNewTemplate(_0x552021, _0x47ecc0, UserQueryTemplate, _0x1056c9);
            break;
          default:
            throw new Error("Unsupported template type: " + _0x104833);
        }
        await this.openPromptTemplate(_0x552021);
      }
      async ['openPromptTemplate'](_0x11024c) {
        let _0x3ad791 = vscode_module.Uri.parse(_0x11024c);
        workspace_info.getInstance().isVirtualUri(_0x3ad791) || (_0x3ad791 = vscode_module.Uri.file(_0x11024c)), await vscode_module.commands.executeCommand('vscode.open', _0x3ad791);
      }
      async ["isUserPromptTemplateNameAllowed"](_0x3cf1a6) {
        let _0x2fc739 = await this.isNameAllowed(_0x3cf1a6, _0x389cf0.DEFAULT_PROMPT_TEMPLATE_DIR);
        await Qe.postToCommentNavigator({
          type: Ef.IS_USER_PROMPT_TEMPLATE_NAME_ALLOWED,
          templateName: _0x3cf1a6,
          isAllowed: _0x2fc739
        });
      }
      async ['isWorkspacePromptTemplateNameAllowed'](_0xea2bee, _0xd3d9cb) {
        let _0x2060d9 = await this.isNameAllowed(_0xea2bee, path_module.join(_0xd3d9cb, ".traycer", 'prompt-templates'));
        await Qe.postToCommentNavigator({
          type: Ef.IS_WORKSPACE_PROMPT_TEMPLATE_NAME_ALLOWED,
          templateName: _0xea2bee,
          workspaceDirPath: _0xd3d9cb,
          isAllowed: _0x2060d9
        });
      }
      async ["isNameAllowed"](_0xf263f5, _0x155411) {
        let _0x1585c7 = true;
        if (_0xf263f5.endsWith('.md')) _0x1585c7 = false;else {
          if (_0xf263f5.toLocaleLowerCase() === 'default') _0x1585c7 = false;else {
            let _0x2bbf1f = path_module.join(_0x155411, _0xf263f5 + ".md");
            _0x1585c7 = !(await workspace_info.getInstance().fileExists(_0x2bbf1f));
          }
        }
        return _0x1585c7;
      }
      async ["loadPromptTemplateFromDisk"](_0x54a4fd) {
        try {
          this.userPromptTemplates.has(_0x54a4fd) ? this.userPromptTemplates.delete(_0x54a4fd) : this.workspacePromptTemplates.has(_0x54a4fd) && this.workspacePromptTemplates.delete(_0x54a4fd);
          let _0x64cf4d = await TemplateFile.validateTemplateFile(_0x54a4fd, ice);
          _0x64cf4d.displayName || (_0x64cf4d.displayName = workspace_info.getInstance().getFileNameWithoutExtension(_0x54a4fd));
          let _0x132c2a = this.determineScopeFromFilePath(_0x54a4fd),
            _0x48a23b;
          switch (_0x64cf4d.applicableFor) {
            case 'plan':
              _0x48a23b = await PromptMetadata.loadTemplateFromDisk(_0x54a4fd, _0x64cf4d, _0x132c2a, PlanTemplate);
              break;
            case 'verification':
              _0x48a23b = await PromptMetadata.loadTemplateFromDisk(_0x54a4fd, _0x64cf4d, _0x132c2a, VerificationTemplate);
              break;
            case "generic":
              _0x48a23b = await PromptMetadata.loadTemplateFromDisk(_0x54a4fd, _0x64cf4d, _0x132c2a, GenericTemplate);
              break;
            case "review":
              _0x48a23b = await PromptMetadata.loadTemplateFromDisk(_0x54a4fd, _0x64cf4d, _0x132c2a, ReviewTemplate);
              break;
            case 'userQuery':
              _0x48a23b = await PromptMetadata.loadTemplateFromDisk(_0x54a4fd, _0x64cf4d, _0x132c2a, UserQueryTemplate);
              break;
            default:
              throw new Error('Unsupported template type: ' + _0x64cf4d.applicableFor);
          }
          return await _0x48a23b.validateTemplate(), _0x132c2a === 'user' ? this.userPromptTemplates.set(_0x48a23b.filePath, _0x48a23b) : this.workspacePromptTemplates.set(_0x48a23b.filePath, _0x48a23b), _0x48a23b;
        } catch (_0x2941d0) {
          throw this.invalidTemplates.add(_0x54a4fd), _0x2941d0;
        }
      }
      async ['sendPromptTemplatesToUI']() {
        let _0x2ed249 = [...Array.from(this.userPromptTemplates.values()), ...Array.from(this.defaultPromptTemplates.values())],
          _0x233246 = {
            type: Ef.LIST_PROMPT_TEMPLATES,
            userPromptTemplates: _0x2ed249.map(_0xd94801 => _0xd94801.serializeToUI()),
            workspacePromptTemplates: Array.from(this.workspacePromptTemplates.values()).map(_0x54d0ca => _0x54d0ca.serializeToUI()),
            invalidTemplates: Array.from(this.invalidTemplates),
            activeTemplates: this.getActivePromptTemplates()
          };
        await Qe.postToCommentNavigator(_0x233246);
      }
      ["getPromptTemplate"](_0x11fbf9) {
        let _0x376e0b = this.userPromptTemplates.get(_0x11fbf9) ?? this.workspacePromptTemplates.get(_0x11fbf9) ?? this.defaultPromptTemplates.get(_0x11fbf9);
        if (_0x376e0b) return _0x376e0b;
        throw new TemplateNotFoundError(_0x11fbf9);
      }
      ["dispose"]() {
        this.globalWatcher?.["close"](), _0x389cf0.instance = null, this.userPromptTemplates.clear(), this.workspacePromptTemplates.clear(), this.defaultPromptTemplates.clear(), this.invalidTemplates.clear();
      }
      ["getDefaultPromptTemplateFilePath"](_0x5e9627) {
        switch (_0x5e9627) {
          case 'plan':
            return PlanTemplate.DEFAULT_TEMPLATE_FILE_PATH.toString();
          case 'verification':
            return VerificationTemplate.DEFAULT_TEMPLATE_FILE_PATH.toString();
          case 'review':
            return ReviewTemplate.DEFAULT_TEMPLATE_FILE_PATH.toString();
          case 'userQuery':
            return UserQueryTemplate.DEFAULT_TEMPLATE_FILE_PATH.toString();
          default:
            throw new Error("Unsupported template type: " + _0x5e9627);
        }
      }
      async ['activatePromptTemplate'](_0x4401f4) {
        let _0x589455 = Vt.getInstance(),
          _0x578879 = _0x589455.activePromptTemplates,
          _0x25ed4d = this.getPromptTemplate(_0x4401f4);
        switch (_0x25ed4d.metadata.applicableFor) {
          case "plan":
            _0x578879.plan = {
              filePath: _0x4401f4
            };
            break;
          case 'verification':
            _0x578879.verification = {
              filePath: _0x4401f4
            };
            break;
          case 'generic':
            _0x578879.generic = {
              filePath: _0x4401f4
            }, _0x578879.plan = null, _0x578879.verification = null, _0x578879.review = null, _0x578879.userQuery = null;
            break;
          case 'review':
            _0x578879.review = {
              filePath: _0x4401f4
            };
            break;
          case "userQuery":
            _0x578879.userQuery = {
              filePath: _0x4401f4
            };
            break;
          default:
            throw new Error('Unsupported template type: ' + _0x25ed4d.metadata.applicableFor);
        }
        await _0x589455.setActivePromptTemplates(_0x578879), await this.sendPromptTemplatesToUI();
      }
      async ['deactivatePromptTemplate'](_0x43e6f6) {
        let _0x51a60a = Vt.getInstance(),
          _0x1e1479 = _0x51a60a.activePromptTemplates,
          _0x6b3786 = this.getPromptTemplate(_0x43e6f6);
        _0x1e1479[_0x6b3786.metadata.applicableFor] = null, await _0x51a60a.setActivePromptTemplates(_0x1e1479), await this.sendPromptTemplatesToUI();
      }
      async ["deletePromptTemplate"](_0x45b168) {
        await (0, fs_promises_module.unlink)(_0x45b168), await this.sendPromptTemplatesToUI();
      }
      async ['createDefaultTemplates']() {
        let _0x165ebb = PromptMetadata.createDefaultTemplate(PlanTemplate),
          _0x3c79b1 = PromptMetadata.createDefaultTemplate(ReviewTemplate),
          _0x2d2d4c = PromptMetadata.createDefaultTemplate(VerificationTemplate),
          _0x44a5df = PromptMetadata.createDefaultTemplate(UserQueryTemplate);
        this.defaultPromptTemplates.set(_0x165ebb.filePath, _0x165ebb), this.defaultPromptTemplates.set(_0x3c79b1.filePath, _0x3c79b1), this.defaultPromptTemplates.set(_0x2d2d4c.filePath, _0x2d2d4c), this.defaultPromptTemplates.set(_0x44a5df.filePath, _0x44a5df);
      }
      async ["initialize"]() {
        this.globalWatcher || (await this.createDefaultTemplates(), await this.startGlobalWatcher(), await this.loadWorkspaceTemplateDirectories());
      }
      async ["handleFileUpsert"](_0x32ccc7) {
        try {
          this.invalidTemplates.delete(_0x32ccc7);
          let _0x350a37 = await this.loadPromptTemplateFromDisk(_0x32ccc7);
          _0x350a37.validationResult.isValid ? TemplateErrorManager.removeTemplateErrors(vscode_module.Uri.file(_0x32ccc7)) : TemplateErrorManager.addTemplateErrors(vscode_module.Uri.file(_0x32ccc7), _0x350a37.validationResult.errors);
        } catch (_0x15dda7) {
          this.invalidTemplates.add(_0x32ccc7), this.userPromptTemplates.delete(_0x32ccc7), this.workspacePromptTemplates.delete(_0x32ccc7), TemplateErrorManager.addTemplateErrors(vscode_module.Uri.file(_0x32ccc7), _0x15dda7 instanceof Error ? [_0x15dda7.message] : [String(_0x15dda7)]), Logger.error(_0x15dda7, 'Failed to load created prompt template: ' + _0x32ccc7);
        }
      }
      async ['handleFileDelete'](_0x16f9bb) {
        try {
          this.userPromptTemplates.delete(_0x16f9bb), this.workspacePromptTemplates.delete(_0x16f9bb), this.invalidTemplates.delete(_0x16f9bb);
          let _0x3d3ffc = Vt.getInstance().activePromptTemplates,
            _0x28814e = false;
          _0x3d3ffc.plan?.['filePath'] === _0x16f9bb ? (_0x3d3ffc.plan = null, _0x28814e = true) : _0x3d3ffc.verification?.["filePath"] === _0x16f9bb ? (_0x3d3ffc.verification = null, _0x28814e = true) : _0x3d3ffc.generic?.['filePath'] === _0x16f9bb ? (_0x3d3ffc.generic = null, _0x28814e = true) : _0x3d3ffc.review?.['filePath'] === _0x16f9bb && (_0x3d3ffc.review = null, _0x28814e = true), _0x28814e && (await Vt.getInstance().setActivePromptTemplates(_0x3d3ffc)), TemplateErrorManager.removeTemplateErrors(vscode_module.Uri.file(_0x16f9bb)), await this.sendPromptTemplatesToUI();
        } catch (_0x45df40) {
          Logger.error(_0x45df40, 'Failed to handle prompt template deletion: ' + _0x16f9bb);
        }
      }
      ["doesPathMatch"](_0x5693d5, _0x8a0b7b) {
        return _0x5693d5 === _0x8a0b7b || _0x5693d5.startsWith(_0x8a0b7b + path_module.sep);
      }
      async ['handleDirectoryDelete'](_0x5e2c9f) {
        let _0x10590e = [];
        for (let [_0x572d5c] of this.workspacePromptTemplates) this.doesPathMatch(_0x572d5c, _0x5e2c9f) && _0x10590e.push(_0x572d5c);
        for (let key of this.invalidTemplates) this.doesPathMatch(key, _0x5e2c9f) && _0x10590e.push(key);
        for (let key of _0x10590e) await this.handleFileDelete(key);
      }
      ['getActivePromptTemplates']() {
        let _0x12abca = Vt.getInstance().activePromptTemplates;
        return {
          plan: this.getActivePlanTemplate(_0x12abca),
          verification: this.getActiveVerificationTemplate(_0x12abca),
          review: this.getActiveReviewTemplate(_0x12abca),
          generic: this.getActiveGenericTemplate(_0x12abca),
          userQuery: this.getActiveHandoffQueryTemplate(_0x12abca)
        };
      }
      ['getActivePlanTemplate'](_0x1840ec) {
        let _0x283d11 = this.getPromptTemplateIfValid(_0x1840ec.plan?.['filePath']);
        return _0x283d11 || (_0x283d11 = this.getPromptTemplateIfValid(_0x1840ec.generic?.['filePath']), _0x283d11) ? _0x283d11 : PlanTemplate.DEFAULT_TEMPLATE_FILE_PATH.toString();
      }
      ["getActiveGenericTemplate"](_0xacebf4) {
        return this.getPromptTemplateIfValid(_0xacebf4.generic?.["filePath"]);
      }
      ['getActiveVerificationTemplate'](_0x5685a4) {
        let _0x4793ba = this.getPromptTemplateIfValid(_0x5685a4.verification?.["filePath"]);
        return _0x4793ba || (_0x4793ba = this.getPromptTemplateIfValid(_0x5685a4.generic?.["filePath"]), _0x4793ba) ? _0x4793ba : VerificationTemplate.DEFAULT_TEMPLATE_FILE_PATH.toString();
      }
      ['getActiveReviewTemplate'](_0x62248e) {
        let _0x3c724b = this.getPromptTemplateIfValid(_0x62248e.review?.['filePath']);
        return _0x3c724b || (_0x3c724b = this.getPromptTemplateIfValid(_0x62248e.generic?.["filePath"]), _0x3c724b) ? _0x3c724b : ReviewTemplate.DEFAULT_TEMPLATE_FILE_PATH.toString();
      }
      ['getActiveHandoffQueryTemplate'](_0x4d029c) {
        let _0xd1e779 = this.getPromptTemplateIfValid(_0x4d029c.userQuery?.["filePath"]);
        return _0xd1e779 || (_0xd1e779 = this.getPromptTemplateIfValid(_0x4d029c.generic?.['filePath']), _0xd1e779) ? _0xd1e779 : UserQueryTemplate.DEFAULT_TEMPLATE_FILE_PATH.toString();
      }
      ["getPromptTemplateIfValid"](_0x4a29cf) {
        if (!_0x4a29cf) return null;
        let _0x2216a8 = this.userPromptTemplates.get(_0x4a29cf) ?? this.workspacePromptTemplates.get(_0x4a29cf) ?? this.defaultPromptTemplates.get(_0x4a29cf);
        return _0x2216a8?.['validationResult']["isValid"] ? _0x2216a8.filePath : null;
      }
      async ["watchWorkspaceTemplatePath"](_0x87eed8, _0x5d58d6) {
        if (!_0x87eed8.includes('.traycer')) return;
        let _0x52d998 = workspace_info.getInstance().getWorkspaceDirs(),
          _0x71c6fc = false;
        if (_0x52d998.some(_0x66eee5 => {
          let _0x4f6e6d = path_module.join(_0x66eee5, '.traycer', _0x389cf0.DEFAULT_PROMPT_TEMPLATE_DIR_NAME);
          if (this.doesPathMatch(_0x87eed8, _0x4f6e6d)) return _0x71c6fc = _0x87eed8 === _0x4f6e6d, true;
          if (_0x5d58d6 === "upsert") return false;
          let _0xe94d7d = path_module.join(_0x66eee5, ".traycer");
          return this.doesPathMatch(_0x87eed8, _0xe94d7d) ? (_0x71c6fc = _0x87eed8 === _0xe94d7d, Logger.info('File is in traycer root: ' + _0x87eed8), true) : false;
        })) {
          if (_0x5d58d6 === "upsert") {
            if (!_0x71c6fc) await this.handleFileUpsert(_0x87eed8);else {
              let _0x3fbc2b = await (0, fs_promises_module.readdir)(_0x87eed8);
              for (let key of _0x3fbc2b) await this.handleFileUpsert(path_module.join(_0x87eed8, key));
            }
          } else _0x5d58d6 === 'delete' && (_0x71c6fc ? await this.handleDirectoryDelete(_0x87eed8) : await this.handleFileDelete(_0x87eed8));
          await this.sendPromptTemplatesToUI();
        }
      }
      ['getWorkspaceTemplatePaths']() {
        let _0x428286 = workspace_info.getInstance().getWorkspaceDirs();
        return _0x428286 ? _0x428286.map(_0x4b51fc => path_module.join(_0x4b51fc, ".traycer", "prompt-templates")) : [];
      }
      async ["loadWorkspaceTemplateDirectories"]() {
        let _0x3dbc5b = this.getWorkspaceTemplatePaths();
        for (let key of _0x3dbc5b) if (await workspace_info.getInstance().fileExists(key)) {
          let _0x20b90f = await (0, fs_promises_module.readdir)(key);
          for (let _0x5eb3e8 of _0x20b90f) {
            let _0xdb2375 = path_module.join(key, _0x5eb3e8);
            await this.loadPromptTemplateFromDisk(_0xdb2375);
          }
        }
        await this.sendPromptTemplatesToUI();
      }
      ['determineScopeFromFilePath'](_0x3cc8d6) {
        let _0x2e9642 = path_module.normalize(_0x3cc8d6),
          _0x431280 = path_module.normalize(_0x389cf0.DEFAULT_PROMPT_TEMPLATE_DIR);
        if (_0x2e9642.startsWith(_0x431280)) return "user";
        if (workspace_info.getInstance().getWorkspaceDirs().some(_0x58f4fe => _0x2e9642.startsWith(_0x58f4fe))) return "workspace";
        throw new Error("Invalid file path: " + _0x3cc8d6);
      }
      async ["startGlobalWatcher"]() {
        (await workspace_info.getInstance().fileExists(_0x389cf0.DEFAULT_PROMPT_TEMPLATE_DIR)) || (await (0, fs_promises_module.mkdir)(_0x389cf0.DEFAULT_PROMPT_TEMPLATE_DIR, {
          recursive: true
        }));
        let _0x365491 = chokidar_module.watch(_0x389cf0.DEFAULT_PROMPT_TEMPLATE_DIR, {
          ignoreInitial: false,
          followSymlinks: false,
          atomic: true,
          ignorePermissionErrors: true,
          persistent: true,
          ignored: ["**/*", "!*.md"]
        });
        this.setupWatcherEvents(_0x365491), this.globalWatcher = _0x365491;
      }
      ["setupWatcherEvents"](_0x365a09) {
        _0x365a09.on("add", async _0x39f4d1 => {
          try {
            await this.handleFileUpsert(_0x39f4d1);
          } catch (_0xe41975) {
            Logger.error(_0xe41975, "Failed to handle file create prompt template: " + _0x39f4d1);
          } finally {
            await this.sendPromptTemplatesToUI();
          }
        }), _0x365a09.on('change', async _0x6fc0b7 => {
          try {
            await this.handleFileUpsert(_0x6fc0b7);
          } catch (_0x3fd5e9) {
            Logger.error(_0x3fd5e9, 'Failed to handle file update prompt template: ' + _0x6fc0b7);
          } finally {
            await this.sendPromptTemplatesToUI();
          }
        }), _0x365a09.on("unlink", async _0x3346d8 => {
          try {
            await this.handleFileDelete(_0x3346d8);
          } catch (_0x3b1b8f) {
            Logger.error(_0x3b1b8f, 'Failed to handle file delete prompt template: ' + _0x3346d8);
          } finally {
            await this.sendPromptTemplatesToUI();
          }
        });
      }
      async ['listWorkspaceDirectories']() {
        let _0x3cf66a = workspace_info.getInstance().getWorkspaceDirs();
        await Qe.postToCommentNavigator({
          type: Ef.LIST_WORKSPACE_DIRECTORIES,
          workspaceDirectories: _0x3cf66a
        });
      }
    };
  }),
  br,
  initTemplateManager = __esmModule(() => {
    'use strict';

    initPromptTemplateService(), initCliAgentService(), br = class _0x3bf0d8 {
      static {
        this.instance = null;
      }
      constructor() {
        this.promptTemplateService = Sl.getInstance(), this.cliAgentTemplateService = ii.getInstance();
      }
      static ["getInstance"]() {
        return _0x3bf0d8.instance || (_0x3bf0d8.instance = new _0x3bf0d8()), _0x3bf0d8.instance;
      }
      ['dispose']() {
        this.promptTemplateService.dispose(), this.cliAgentTemplateService.dispose(), _0x3bf0d8.instance = null;
      }
      ['getPromptTemplate'](_0x3486e4) {
        return this.promptTemplateService.getPromptTemplate(_0x3486e4);
      }
      ['getCLIAgentTemplate'](_0x2add76) {
        return this.cliAgentTemplateService.getCLIAgent(_0x2add76);
      }
      ['getCLIAgentTemplateByName'](_0x252051) {
        return this.cliAgentTemplateService.getCLIAgentByName(_0x252051);
      }
      async ["startWatcher"]() {
        await this.promptTemplateService.initialize(), await this.promptTemplateService.sendPromptTemplatesToUI(), await this.cliAgentTemplateService.initialize(), await this.cliAgentTemplateService.sendCLIAgentsToUI();
      }
      async ["createUserPromptTemplate"](_0x410e3e, _0xfff37, _0x1fd040) {
        await this.promptTemplateService.createUserPromptTemplate(_0x410e3e, _0xfff37, _0x1fd040);
      }
      async ['createUserCLIAgentTemplate'](_0x53731e, _0x225f94, _0xef6d1b) {
        await this.cliAgentTemplateService.createUserCLIAgent(_0x53731e, _0x225f94, _0xef6d1b);
      }
      async ["createWorkspacePromptTemplate"](_0x4f4b54, _0xab15e1, _0x18b678, _0x2e0f40) {
        await this.promptTemplateService.createWorkspacePromptTemplate(_0x4f4b54, _0xab15e1, _0x18b678, _0x2e0f40);
      }
      async ["createWorkspaceCLIAgentTemplate"](_0x56aee7, _0x28f145, _0x187870, _0x143ed4) {
        await this.cliAgentTemplateService.createWorkspaceCLIAgent(_0x56aee7, _0x28f145, _0x187870, _0x143ed4);
      }
      ["getDefaultPromptTemplateFilePath"](_0x419c72) {
        return this.promptTemplateService.getDefaultPromptTemplateFilePath(_0x419c72);
      }
      async ['activatePromptTemplate'](_0x38f73d) {
        return this.promptTemplateService.activatePromptTemplate(_0x38f73d);
      }
      async ['deactivatePromptTemplate'](_0x163e16) {
        return this.promptTemplateService.deactivatePromptTemplate(_0x163e16);
      }
      async ['deletePromptTemplate'](_0x530042) {
        return this.promptTemplateService.deletePromptTemplate(_0x530042);
      }
      async ["deleteCLIAgentTemplate"](_0xa69b3b) {
        return this.cliAgentTemplateService.deleteCLIAgent(_0xa69b3b);
      }
      async ["refreshPromptTemplates"]() {
        return this.promptTemplateService.sendPromptTemplatesToUI();
      }
      async ["refreshCLIAgentTemplates"]() {
        return this.cliAgentTemplateService.sendCLIAgentsToUI();
      }
      async ['openPromptTemplate'](_0x319b23) {
        return this.promptTemplateService.openPromptTemplate(_0x319b23);
      }
      async ["openCLIAgentTemplate"](_0x13cef0) {
        return this.cliAgentTemplateService.openCLIAgent(_0x13cef0);
      }
      async ['isUserPromptTemplateNameAllowed'](_0x3212c9) {
        return this.promptTemplateService.isUserPromptTemplateNameAllowed(_0x3212c9);
      }
      async ["isUserCLIAgentTemplateNameAllowed"](_0x1d2327, _0x1585bc) {
        return this.cliAgentTemplateService.isUserCLIAgentNameAllowed(_0x1d2327, _0x1585bc);
      }
      async ['isWorkspacePromptTemplateNameAllowed'](_0x274983, _0x3c23c5) {
        return this.promptTemplateService.isWorkspacePromptTemplateNameAllowed(_0x274983, _0x3c23c5);
      }
      async ['isWorkspaceCLIAgentTemplateNameAllowed'](_0x8ba270, _0x5e7f6b, _0x4a80c0) {
        return this.cliAgentTemplateService.isWorkspaceCLIAgentNameAllowed(_0x8ba270, _0x5e7f6b, _0x4a80c0);
      }
      async ['listWorkspaceDirectories']() {
        await this.promptTemplateService.listWorkspaceDirectories();
      }
    };
  }),
  BasePromptTemplate = class {
    constructor(_0xe85d2e) {
      this.prompt = _0xe85d2e;
    }
  },
  PN,
  initTemplateManagerDeps = __esmModule(() => {
    'use strict';

    initTemplateManager(), /* [unbundle] bN=require('node:fs/promises'), ZEe=require('node:os'), eSe=require('node:path'), tSe=require('node:crypto') 已移至顶部导入区 */PN = class _0x18a868 extends BasePromptTemplate {
      constructor(_0x58e202, _0x4a74c6, _0x37a2ed, _0x5811bd) {
        super(_0x58e202), this.name = _0x4a74c6, this.title = _0x37a2ed, this.sessionIDs = _0x5811bd;
      }
      static ["isTmpFileReferenced"](_0x1d627f) {
        let _0x5046b0 = /\$env:TRAYCER_PROMPT_TMP_FILE/i,
          _0x3cd631 = /\$\{?TRAYCER_PROMPT_TMP_FILE\}?/;
        return _0x5046b0.test(_0x1d627f) || _0x3cd631.test(_0x1d627f);
      }
      async ["setupTempFile"](_0x3bbeb4) {
        let _0x17d262 = "traycer-prompt-" + (0, crypto_module.randomUUID)() + '.txt',
          _0x2499a6 = (0, path_module.join)((0, os_module.tmpdir)(), _0x17d262);
        return await (0, fs_promises_module.writeFile)(_0x2499a6, _0x3bbeb4, 'utf-8'), setTimeout(async () => {
          try {
            await (0, fs_promises_module.unlink)(_0x2499a6);
          } catch (_0x25fd64) {
            Logger.error(_0x25fd64, "Failed to cleanup temp file: " + _0x2499a6);
          }
        }, 30000), _0x2499a6;
      }
      async ['handle']() {
        try {
          let _0x81d6cf = br.getInstance().getCLIAgentTemplateByName(this.name);
          if (!_0x81d6cf) throw new Error("CLI agent template not found: " + this.name);
          let _0x4ef827 = _0x81d6cf.getContent(),
            _0x4324e3 = _0x18a868.isTmpFileReferenced(_0x4ef827),
            _0x341d47 = this.prompt.replace(/\\/g, '\x5c\x5c').replace(/\$/g, '\x5c$').replace(/"/g, '\x5c\x22').replace(/`/g, '\x5c`'),
            _0x1be877 = {
              TRAYCER_PROMPT: _0x341d47,
              TRAYCER_PHASE_ID: this.sessionIDs.taskId,
              TRAYCER_PHASE_BREAKDOWN_ID: this.sessionIDs.phaseBreakdownId,
              TRAYCER_TASK_ID: this.sessionIDs.taskChainId,
              TRAYCER_PROMPT_TMP_FILE: _0x4324e3 ? await this.setupTempFile(_0x341d47) : ''
            },
            _0x50cce7 = await this.createTerminalForPlatform(_0x1be877);
          _0x50cce7.show(), _0x50cce7.sendText(_0x4ef827, true), vscode_module.window.showInformationMessage('Sent instruction to \x27' + this.name + '\x27 to CLI agent');
        } catch (_0x3bad9a) {
          await this.handleExecutionError(_0x3bad9a);
        }
      }
      async ["createTerminalForPlatform"](_0x30b25e) {
        let _0x50ea18 = "Traycer : " + this.title + ' : ' + this.name;
        return vscode_module.window.createTerminal({
          name: _0x50ea18,
          env: _0x30b25e
        });
      }
      async ["handleExecutionError"](_0x2f3039) {
        throw await vscode_module.window.showErrorMessage('Failed to execute CLI tool: ' + this.name + ', ' + _0x2f3039), _0x2f3039;
      }
    };
  }),
  CopyToClipboardHandler = class extends BasePromptTemplate {
    async ["handle"]() {
      await vscode_module.env.clipboard.writeText(this.prompt), vscode_module.window.showInformationMessage('Copied to clipboard');
    }
  },
  ExportHandler,
  initExportHandler = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), ExportHandler = class extends BasePromptTemplate {
      constructor(_0x3d33b1, _0x2dcdb8) {
        super(_0x3d33b1), this.title = _0x2dcdb8;
      }
      ["getDefaultFilename"]() {
        let _0x3104f7 = this.title.replaceAll(' ', '-').toLocaleLowerCase() + '.' + this.getFileExtension(),
          _0x35e01e = workspace_info.getInstance().getWorkspaceDirs();
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
  }),
  kN,
  initExportHandlerExports = __esmModule(() => {
    'use strict';

    initExportHandler(), kN = class extends ExportHandler {
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
  }),
  ExtensionHelper,
  initExtensionHelper = __esmModule(() => {
    'use strict';

    ExtensionHelper = class _0x1b08c2 {
      static async ["getExtension"](_0x32bbbf, _0x3086a8, _0x38b259) {
        let _0x1cc010 = vscode_module.extensions.getExtension(_0x32bbbf);
        if (!_0x1cc010) throw Logger.warn("Extension not found", _0x32bbbf), (await vscode_module.window.showInformationMessage("You have selected to use " + _0x3086a8 + " for execution, but the " + (_0x38b259 ?? _0x3086a8) + ' extension is not installed. Would you like to install it from the marketplace?', "View in Marketplace", 'Cancel')) === "View in Marketplace" && (Logger.info('Opening marketplace for extension', _0x32bbbf), await vscode_module.commands.executeCommand("workbench.extensions.search", _0x32bbbf)), new Error(_0x3086a8 + ' extension not found');
        return _0x1cc010;
      }
      static async ["activateExtension"](_0x11bb96, _0x7fdf14, _0x35625d) {
        let _0x4e762c = await _0x1b08c2.getExtension(_0x11bb96, _0x7fdf14, _0x35625d);
        return await _0x4e762c.activate(), _0x4e762c;
      }
    };
  }),
  ExtensionTaskHandler,
  initExtensionTaskHandler = __esmModule(() => {
    'use strict';

    initExtensionHelper(), ExtensionTaskHandler = class extends BasePromptTemplate {
      constructor(_0xfc2970, _0x106908) {
        super(_0xfc2970), this.config = _0x106908;
      }
      async ['handle']() {
        let _0x28df03 = await ExtensionHelper.getExtension(this.config.extensionId, this.config.displayName, this.config.extensionName);
        await this.startTask(_0x28df03.exports), this.config.sidebarCommand && (await vscode_module.commands.executeCommand(this.config.sidebarCommand));
      }
    };
  }),
  xN,
  initWindsurfHandler = __esmModule(() => {
    'use strict';

    initExtensionTaskHandler(), xN = class extends ExtensionTaskHandler {
      constructor(_0x631674) {
        super(_0x631674, {
          extensionId: 'saoudrizwan.claude-dev',
          displayName: 'Cline',
          sidebarCommand: 'claude-dev.SidebarProvider.focus'
        });
      }
      async ['startTask'](_0x328db1) {
        await _0x328db1.startNewTask(this.prompt);
      }
    };
  }),
  MN,
  initCursorHandler = __esmModule(() => {
    'use strict';

    initExtensionTaskHandler(), MN = class extends ExtensionTaskHandler {
      constructor(_0x497b60) {
        super(_0x497b60, {
          extensionId: "kilocode.Kilo-Code",
          displayName: "Kilo Code",
          extensionName: 'Kilo Code',
          sidebarCommand: "kilo-code.SidebarProvider.focus"
        });
      }
      async ['startTask'](_0x411c91) {
        await _0x411c91.startNewTask({
          configuration: {},
          text: this.prompt
        });
      }
    };
  }),
  DN,
  initZedHandler = __esmModule(() => {
    'use strict';

    initExtensionTaskHandler(), DN = class extends ExtensionTaskHandler {
      constructor(_0x94a6f0) {
        super(_0x94a6f0, {
          extensionId: "RooVeterinaryInc.roo-cline",
          displayName: 'Roo Code',
          extensionName: "Roo Code",
          sidebarCommand: "roo-cline.SidebarProvider.focus"
        });
      }
      async ["startTask"](_0x161c28) {
        await _0x161c28.startNewTask({
          configuration: {},
          text: this.prompt
        });
      }
    };
  }),
  ClipboardPromptHandler = class extends BasePromptTemplate {
    constructor() {
      super(...arguments), this.customDelay = 100;
    }
    async ["handle"]() {
      let _0x347f85 = await vscode_module.env.clipboard.readText();
      for (let key of this.getPreCommandsToRun()) await vscode_module.commands.executeCommand(key), await new Promise(_0x28b0d7 => setTimeout(_0x28b0d7, this.customDelay));
      await vscode_module.env.clipboard.writeText(this.prompt), await vscode_module.commands.executeCommand("editor.action.clipboardPasteAction"), await new Promise(_0x1245aa => setTimeout(_0x1245aa, 200)), await vscode_module.env.clipboard.writeText(_0x347f85);
    }
  },
  NN,
  initClineHandler = __esmModule(() => {
    'use strict';

    initExtensionHelper(), NN = class extends ClipboardPromptHandler {
      constructor() {
        super(...arguments), this.customDelay = 400, this.config = {
          extensionId: 'sourcegraph.amp',
          displayName: 'Amp',
          extensionName: 'Amp'
        };
      }
      ["getPreCommandsToRun"]() {
        return ["amp.agent.newThread"];
      }
      async ['handle']() {
        return await ExtensionHelper.getExtension(this.config.extensionId, this.config.displayName, this.config.extensionName), super.handle();
      }
    };
  }),
  LN,
  initAiderHandler = __esmModule(() => {
    'use strict';

    initExtensionHelper(), LN = class extends ClipboardPromptHandler {
      constructor() {
        super(...arguments), this.config = {
          extensionId: "augment.vscode-augment",
          displayName: "Augment",
          extensionName: "Augment"
        };
      }
      ['getPreCommandsToRun']() {
        return ["vscode-augment.startNewChat"];
      }
      async ['handle']() {
        return await ExtensionHelper.activateExtension(this.config.extensionId, this.config.displayName, this.config.extensionName), super.handle();
      }
    };
  }),
  FN,
  initCopilotHandler = __esmModule(() => {
    'use strict';

    initExtensionHelper(), FN = class extends ClipboardPromptHandler {
      constructor() {
        super(...arguments), this.customDelay = 2000, this.config = {
          extensionId: 'anthropic.claude-code',
          displayName: 'Claude Code Extension',
          extensionName: "Claude Code"
        };
      }
      ["getPreCommandsToRun"]() {
        return ["claude-vscode.editor.open"];
      }
      async ['handle']() {
        return await ExtensionHelper.getExtension(this.config.extensionId, this.config.displayName, this.config.extensionName), super.handle();
      }
    };
  }),
  UN,
  initContinueHandler = __esmModule(() => {
    'use strict';

    initExtensionHelper(), UN = class extends ClipboardPromptHandler {
      constructor() {
        super(...arguments), this.customDelay = 2000, this.config = {
          extensionId: "openai.chatgpt",
          displayName: 'Codex Extension',
          extensionName: "Codex"
        };
      }
      ["getPreCommandsToRun"]() {
        return ['chatgpt.newCodexPanel'];
      }
      async ['handle']() {
        return await ExtensionHelper.getExtension(this.config.extensionId, this.config.displayName, this.config.extensionName), super.handle();
      }
    };
  }),
  CopilotPromptHandler = class extends ClipboardPromptHandler {
    ['getPreCommandsToRun']() {
      return [];
    }
    async ["handle"]() {
      await vscode_module.commands.executeCommand("workbench.action.chat.open", {
        mode: 'agent',
        query: this.prompt,
        isPartialQuery: false
      });
    }
  },
  CursorPromptHandler = class extends ClipboardPromptHandler {
    ["getPreCommandsToRun"]() {
      return ["composer.createNewComposerTab", "composerMode.agent", "aichat.newfollowupaction"];
    }
  },
  AugmentPromptHandler = class extends ClipboardPromptHandler {
    ["getPreCommandsToRun"]() {
      return ['workbench.action.chat.icube.open', "workbench.action.icube.aiChatSidebar.createNewSession", "workbench.panel.chat.view.ai-chat.focus"];
    }
  },
  WindsurfPromptHandler = class extends ClipboardPromptHandler {
    ["getPreCommandsToRun"]() {
      return ['windsurf.prioritized.chat.openNewConversation'];
    }
    async ['handle']() {
      for (let key of this.getPreCommandsToRun()) await vscode_module.commands.executeCommand(key), await new Promise(_0x51eca3 => setTimeout(_0x51eca3, 200));
      await vscode_module.env.clipboard.writeText(this.prompt), vscode_module.window.showInformationMessage("Prompt copied to clipboard. Paste it into Cascade to start the execution.");
    }
  },
  $N,
  initRooHandler = __esmModule(() => {
    'use strict';

    initExtensionHelper(), $N = class extends ClipboardPromptHandler {
      constructor() {
        super(...arguments), this.customDelay = 400, this.config = {
          extensionId: "zencoderai.zencoder",
          displayName: "ZenCoder",
          extensionName: 'ZenCoder'
        };
      }
      ["getPreCommandsToRun"]() {
        return ["zencoder.insert-into-chat"];
      }
      async ["handle"]() {
        return await ExtensionHelper.getExtension(this.config.extensionId, this.config.displayName, this.config.extensionName), super.handle();
      }
    };
  }),
  AntigravityPromptHandler = class extends ClipboardPromptHandler {
    ['getPreCommandsToRun']() {
      return ['antigravity.prioritized.chat.open', 'antigravity.prioritized.chat.openNewConversation'];
    }
  };
async function debounce(_0xad5586, _0x184124, _0x2514c4, _0x227745) {
  if (!AgentRegistry.getInstance().getAgent(_0x2514c4.id)) throw new Error("Agent or handler not found: " + _0x2514c4);
  let _0xacd5a9;
  if (_0x2514c4.type !== "terminal") switch (_0x2514c4.id) {
    case 'cursor':
      _0xacd5a9 = new CursorPromptHandler(_0xad5586);
      break;
    case 'windsurf':
      _0xacd5a9 = new WindsurfPromptHandler(_0xad5586);
      break;
    case "visualstudiocode":
    case "visualstudiocode-insiders":
    case 'code-server':
      _0xacd5a9 = new CopilotPromptHandler(_0xad5586);
      break;
    case 'trae':
      _0xacd5a9 = new AugmentPromptHandler(_0xad5586);
      break;
    case 'claude-code-extension':
      _0xacd5a9 = new FN(_0xad5586);
      break;
    case "codex-extension":
      _0xacd5a9 = new UN(_0xad5586);
      break;
    case "kilo-code":
      _0xacd5a9 = new MN(_0xad5586);
      break;
    case "roo-code":
      _0xacd5a9 = new DN(_0xad5586);
      break;
    case "cline":
      _0xacd5a9 = new xN(_0xad5586);
      break;
    case "copy":
      _0xacd5a9 = new CopyToClipboardHandler(_0xad5586);
      break;
    case 'markdown-export':
      _0xacd5a9 = new kN(_0xad5586, _0x184124);
      break;
    case 'augment':
      _0xacd5a9 = new LN(_0xad5586);
      break;
    case "zencoder":
      _0xacd5a9 = new $N(_0xad5586);
      break;
    case "amp":
      _0xacd5a9 = new NN(_0xad5586);
      break;
    case "antigravity":
      _0xacd5a9 = new AntigravityPromptHandler(_0xad5586);
      break;
    default:
      throw new Error("Unsupported agent: " + _0x2514c4);
  } else _0xacd5a9 = new PN(_0xad5586, _0x2514c4.id, _0x184124, _0x227745);
  await _0xacd5a9.handle();
}
function getAllAvailableAgents() {
  let _0x4fac27 = AgentRegistry.getInstance(),
    _0x2174d4 = [getAgentIcon("copy"), getAgentIcon("markdown-export"), workspace_info.getInstance().getIdeAgentInfo()],
    _0x81c382 = vscode_module.workspace.getConfiguration("traycer").get('additionalAgents') || [],
    _0x673545 = [];
  for (let key of _0x81c382) {
    let _0x1362c1 = getAgentIconByDisplayName(key);
    _0x1362c1 && !_0x2174d4.some(_0x56e8f9 => _0x56e8f9.id === _0x1362c1.id) && !_0x673545.some(_0x174457 => _0x174457.id === _0x1362c1.id) && _0x673545.push(_0x1362c1);
  }
  let _0x505af5 = [..._0x4fac27.getUserAgents(), ..._0x4fac27.getWorkspaceAgents(), ..._0x4fac27.getBuiltInCLIAgents()];
  return [..._0x673545, ..._0x505af5, ..._0x2174d4].filter((_0x4fe974, _0x1970ca, _0x27a477) => _0x1970ca === _0x27a477.findIndex(_0x4014a5 => _0x4014a5.id === _0x4fe974.id));
}
var initIDEAgentManager = __esmModule(() => {
  'use strict';

  initWorkspaceInfo(), initTemplateManagerDeps(), initExportHandlerExports(), initWindsurfHandler(), initCursorHandler(), initZedHandler(), initClineHandler(), initAiderHandler(), initCopilotHandler(), initContinueHandler(), initRooHandler();
});
function getExtensionSettings() {
  let _0x24a484 = Vt.getInstance();
  return {
    sendKey: config.sendKey,
    supportedIDEAgents: getAllAvailableAgents(),
    lastUsedIDEAgents: {
      plan: _0x24a484.getActiveIDEAgentForContext('plan'),
      verification: _0x24a484.getActiveIDEAgentForContext('verification'),
      review: _0x24a484.getActiveIDEAgentForContext("review"),
      userQuery: _0x24a484.getActiveIDEAgentForContext('userQuery')
    },
    alwaysAllowPayToRun: config.alwaysAllowPayToRun,
    enablePromptTemplateSelector: config.enablePromptTemplateSelector,
    retryAfterTimestamp: config.retryAfterTimestamp,
    defaultTaskExecutionConfig: _0x24a484.defaultTaskExecutionConfig,
    interviewTextOnlyMode: _0x24a484.interviewTextOnlyMode
  };
}
/* [unbundle] ripgrepBinaryPath, resolveRipgrepPath 已移至 config.js */
var initSearchConfig = __esmModule(() => {
  'use strict';

  initIDEAgentManager(), initStatusBar(), initTaskContext();
});
var AuthCallbackHandler = class _0x456dfa {
  constructor(_0x35742c) {
    this.credentials = _0x35742c;
  }
  static ["getInstance"](_0x544a1e) {
    if (!_0x456dfa.instance) {
      if (!_0x544a1e) throw new Error('Credentials are required');
      _0x456dfa.instance = new _0x456dfa(_0x544a1e);
    }
    return _0x456dfa.instance;
  }
  async ['handleAuthCallback'](_0x5450d9) {
    let _0xdc5e1b = new URLSearchParams(_0x5450d9.query).get('traycer-tokens');
    if (_0xdc5e1b) return this.credentials.authenticateWithTraycerToken(_0xdc5e1b);
    await vscode_module.window.showErrorMessage('Invalid response received while authenticating with Traycer. Please try again.');
  }
};
async function registerVscodeCommand(_0x2acc8f, _0xb621c1, _0x23c705, _0x2cc0a0 = false, _0x3a24ba) {
  try {
    if ((await vscode_module.commands.getCommands(true)).includes(_0xb621c1)) {
      if (_0x2cc0a0) {
        commandRegistry.get(_0xb621c1)?.["dispose"]();
        let _0x36fb7b = vscode_module.commands.registerCommand(_0xb621c1, _0x23c705, _0x3a24ba);
        _0x2acc8f.subscriptions.push(_0x36fb7b), commandRegistry.set(_0xb621c1, _0x36fb7b);
      }
    } else {
      let _0x43bc3c = vscode_module.commands.registerCommand(_0xb621c1, _0x23c705, _0x3a24ba);
      _0x2acc8f.subscriptions.push(_0x43bc3c), commandRegistry.set(_0xb621c1, _0x43bc3c);
    }
  } catch (_0x2c7b9d) {
    return Logger.warn('Failed to register command: ' + _0xb621c1, _0x2c7b9d), Promise.reject(_0x2c7b9d);
  }
}
var RSe,
  Kwr,
  initRepoSettingsSchema = __esmModule(() => {
    RSe = prisma, Kwr = {
      type: 'object',
      required: ["repoID", 'providerType', "settings"],
      properties: {
        repoID: {
          type: "string"
        },
        providerType: {
          type: "string",
          enum: Object.values(RSe.ProviderType)
        },
        settings: {
          type: 'object',
          required: ["targetBranch", 'planCreation', "trigger", 'labels'],
          properties: {
            targetBranch: {
              type: "string"
            },
            planCreation: {
              type: "boolean"
            },
            trigger: {
              type: "string",
              enum: ['creation', 'assign']
            },
            labels: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        }
      }
    };
  });
function parseDateFromJson(_0x265b18, _0x4b3b79) {
  if (Mit.test(_0x4b3b79)) {
    let _0x1a9765 = new Date(_0x4b3b79);
    return isNaN(_0x1a9765.getTime()) ? _0x4b3b79 : _0x1a9765;
  }
  return _0x4b3b79;
}
function parseJsonWithDates(_0xe6dfc) {
  return JSON.parse(_0xe6dfc, parseDateFromJson);
}
var Mit = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:Z|[-+]\d{2}:?\d{2})?$/,
  ApiClient = class {
    constructor(_0x539fdd, _0x12f1db, _0x3a1735) {
      this.token = _0x12f1db, this.headers = _0x3a1735, _0x539fdd.pathname.endsWith('/') ? this.base = _0x539fdd : this.base = new URL(_0x539fdd.href + '/'), this.base.pathname.includes('api') || (this.base.pathname = this.base.pathname + "api/");
    }
    ["base"];
    ["clientUrl"](_0x5b75fc, _0x5ae899) {
      let _0x24ee36 = new URL(_0x5b75fc.replace(/^\/+/, ''), this.base);
      if (_0x5ae899) {
        for (let [_0x26812c, _0x13dd5f] of Object.entries(_0x5ae899)) _0x13dd5f instanceof Date ? _0x24ee36.searchParams.set(_0x26812c, _0x13dd5f.toISOString()) : _0x24ee36.searchParams.set(_0x26812c, String(_0x13dd5f));
      }
      return _0x24ee36;
    }
    async ['get'](_0xb9790a, _0x5ed437 = this.getHeaders(this.headers), _0x3ad2b0) {
      let _0x4a2cf7 = await fetch(_0xb9790a, {
        headers: _0x5ed437,
        method: 'GET',
        signal: _0x3ad2b0
      });
      return this.handleResponse(_0x4a2cf7);
    }
    async ["post"](_0x2e0891, _0x167b04, _0x5952f6 = this.postHeaders(this.headers), _0x1b32f5) {
      let _0x5a72bd = await fetch(_0x2e0891, {
        headers: _0x5952f6,
        method: 'POST',
        body: JSON.stringify(_0x167b04),
        signal: _0x1b32f5
      });
      return this.handleResponse(_0x5a72bd);
    }
    async ["put"](_0x239142, _0x16b25e, _0x48a090 = this.postHeaders(this.headers)) {
      let _0x1a402a = await fetch(_0x239142, {
        headers: _0x48a090,
        method: 'PUT',
        body: JSON.stringify(_0x16b25e)
      });
      return this.handleResponse(_0x1a402a);
    }
    async ['delete'](_0x3ab41a, _0x5d320e, _0x577924 = this.getHeaders(this.headers)) {
      let _0x2e2dfb = await fetch(_0x3ab41a, {
        headers: _0x577924,
        method: 'DELETE',
        body: JSON.stringify(_0x5d320e)
      });
      return this.handleResponse(_0x2e2dfb);
    }
    ["setAuthToken"](_0x1a7ff7) {
      !_0x1a7ff7.has("Authorization") && this.token && _0x1a7ff7.set("Authorization", 'Bearer ' + this.token);
    }
    async ["handleResponse"](_0x118d66) {
      return _0x118d66.json = async () => parseJsonWithDates(await _0x118d66.text()), _0x118d66;
    }
    ["getHeaders"](_0x274fb9) {
      let _0x3f5075 = new Headers(_0x274fb9);
      return this.setAuthToken(_0x3f5075), _0x3f5075.has('Accept') || _0x3f5075.set('Accept', "application/json"), _0x3f5075;
    }
    ["postHeaders"](_0x5e6f93) {
      let _0x16ee75 = new Headers(_0x5e6f93);
      return this.setAuthToken(_0x16ee75), _0x16ee75.has('Content-Type') || _0x16ee75.set('Content-Type', 'application/json'), _0x16ee75;
    }
  },
  TraycerApiClient = class extends ApiClient {
    ["githubLogin"](_0x170b1a, _0x47ec9a, _0x52c6cf) {
      let _0x40da80 = this.clientUrl('/github/sign-in', {
        source: _0x47ec9a,
        email: _0x52c6cf
      });
      return this.get(_0x40da80, _0x170b1a);
    }
    ["getUser"](_0x404f8c) {
      let _0x4259f5 = this.clientUrl('/user');
      return this.get(_0x4259f5, _0x404f8c);
    }
    ["getSubscription"](_0x14b5f2) {
      let _0x1b82a0 = this.clientUrl("/user/subscription");
      return this.get(_0x1b82a0, _0x14b5f2);
    }
    ['cancelUserSubscription'](_0x3cd03d, _0x49ffea) {
      let _0x5d3edf = this.clientUrl('/user/cancel-subscription');
      return this.post(_0x5d3edf, _0x3cd03d, _0x49ffea);
    }
    ["cancelUserUpcomingSubscription"](_0x43f002) {
      let _0x137528 = this.clientUrl("/user/cancel-upcoming");
      return this.post(_0x137528, {}, _0x43f002);
    }
    ["resumeUserSubscription"](_0x598de7) {
      let _0x1f8b1b = this.clientUrl("/user/resume-subscription");
      return this.post(_0x1f8b1b, {}, _0x598de7);
    }
    ['listOrganizations'](_0x531924) {
      let _0x43909a = this.clientUrl('/user/list-organizations');
      return this.get(_0x43909a, _0x531924);
    }
    ["listPrices"](_0x3e77a2) {
      let _0x4d6eaa = this.clientUrl("/user/list-prices");
      return this.get(_0x4d6eaa, _0x3e77a2);
    }
    ['generateCustomerPortalLink'](_0x331fc0, _0x1a329b) {
      let _0xc227f9 = this.clientUrl('/user/customer-portal');
      return this.post(_0xc227f9, _0x331fc0, _0x1a329b);
    }
    ['updatePrivacyMode'](_0x3ce159, _0x4b37bb) {
      let _0x5f530a = this.clientUrl("/user/update-privacy-mode");
      return this.post(_0x5f530a, _0x3ce159, _0x4b37bb);
    }
    ['applyCoupon'](_0x311378, _0xd2fbec) {
      let _0x40ecf4 = this.clientUrl('/user/apply-coupon');
      return this.post(_0x40ecf4, _0x311378, _0xd2fbec);
    }
    ['updateUserSubscription'](_0x15946d, _0x211c92) {
      let _0x11a628 = this.clientUrl("/user/update-subscription");
      return this.post(_0x11a628, _0x15946d, _0x211c92);
    }
    ['calculateUserPrice'](_0x2c2a23, _0x26b075) {
      let _0x5dfd06 = this.clientUrl("/user/calculate-price");
      return this.post(_0x5dfd06, _0x2c2a23, _0x26b075);
    }
    ["createUserCheckoutSession"](_0x152773, _0x5c22e6) {
      let _0x323773 = this.clientUrl('/user/create-checkout-session');
      return this.post(_0x323773, _0x152773, _0x5c22e6);
    }
    ["createUserSetupIntent"](_0x50b41c) {
      let _0x3df79d = this.clientUrl('/user/setup-intent');
      return this.post(_0x3df79d, {}, _0x50b41c);
    }
    ["validateUserCoupon"](_0x22655e, _0x5ce986) {
      let _0xc9d031 = this.clientUrl('/user/validate-coupon');
      return this.post(_0xc9d031, _0x22655e, _0x5ce986);
    }
    ['updateUserEmail'](_0x161736, _0x2ff343) {
      let _0x4f5ee3 = this.clientUrl("/user/update-email");
      return this.post(_0x4f5ee3, _0x161736, _0x2ff343);
    }
    ["sendUserVerificationEmail"](_0x3ca145, _0x33d0d9) {
      let _0xada44a = this.clientUrl('/user/email-verification');
      return this.post(_0xada44a, _0x3ca145, _0x33d0d9);
    }
    ['sendOrganizationVerificationEmail'](_0x2560d, _0xecaca9, _0x39dfd4) {
      let _0x3ac091 = this.clientUrl('/organization/' + _0xecaca9 + '/email-verification');
      return this.post(_0x3ac091, _0x2560d, _0x39dfd4);
    }
    ["updateOrganizationEmail"](_0x1fe582, _0x2be7b4, _0x5a6196) {
      let _0x243c5d = this.clientUrl("/organization/" + _0x1fe582 + "/update-email");
      return this.post(_0x243c5d, _0x2be7b4, _0x5a6196);
    }
    ['fetchOrganizationInfo'](_0x44c937, _0x3d368e) {
      let _0x534fb7 = this.clientUrl("/organization/" + _0x44c937);
      return this.get(_0x534fb7, _0x3d368e);
    }
    ["fetchOrganizationSeats"](_0x195817, _0x2152c6) {
      let _0x97badf = this.clientUrl('/organization/' + _0x195817 + '/seat-management');
      return this.get(_0x97badf, _0x2152c6);
    }
    ["fetchOrganizationSubscription"](_0x1b92fa, _0x2b6010) {
      let _0x4b43ae = this.clientUrl("/organization/" + _0x1b92fa + "/subscription");
      return this.get(_0x4b43ae, _0x2b6010);
    }
    ["listOrganizationPrices"](_0x208719, _0x31ac3d) {
      let _0x4cb367 = this.clientUrl("/organization/" + _0x208719 + "/list-prices");
      return this.get(_0x4cb367, _0x31ac3d);
    }
    ['generateOrganizationCustomerPortalLink'](_0x4295, _0x570c80, _0x4ad160) {
      let _0x52d51a = this.clientUrl("/organization/" + _0x570c80 + '/customer-portal');
      return this.post(_0x52d51a, _0x4295, _0x4ad160);
    }
    ['updateOrganizationSeatAssignmentType'](_0x224417, _0xc3be67, _0x37f45c) {
      let _0x54925c = this.clientUrl("/organization/" + _0x224417 + "/update-seat-assignment-type");
      return this.post(_0x54925c, _0xc3be67, _0x37f45c);
    }
    ['startOrganizationTrial'](_0x2b6f69, _0x3d97f5) {
      let _0x292651 = this.clientUrl("/organization/" + _0x2b6f69 + "/start-trial");
      return this.post(_0x292651, {}, _0x3d97f5);
    }
    ['updateOrganizationSubscription'](_0x5405ba, _0x120507, _0x599a4b) {
      let _0x1b4bff = this.clientUrl('/organization/' + _0x5405ba + "/update-subscription");
      return this.post(_0x1b4bff, _0x120507, _0x599a4b);
    }
    ["resumeOrganizationSubscription"](_0x3c9dd8, _0x579722) {
      let _0x5cafec = this.clientUrl('/organization/' + _0x3c9dd8 + "/resume-subscription");
      return this.post(_0x5cafec, {}, _0x579722);
    }
    ["calculateOrganizationPrice"](_0x1d9c1d, _0x26cf1b, _0x2377a0) {
      let _0x56e6fc = this.clientUrl('/organization/' + _0x1d9c1d + '/calculate-price');
      return this.post(_0x56e6fc, _0x26cf1b, _0x2377a0);
    }
    ["applyOrganizationCoupon"](_0x4aeb53, _0x593925, _0x319631) {
      let _0x5e7d66 = this.clientUrl("/organization/" + _0x4aeb53 + '/apply-coupon');
      return this.post(_0x5e7d66, _0x593925, _0x319631);
    }
    ["cancelOrganizationSubscription"](_0x547cf6, _0x47d409, _0x23425d) {
      let _0x4a0cd3 = this.clientUrl('/organization/' + _0x547cf6 + "/cancel-subscription");
      return this.post(_0x4a0cd3, _0x47d409, _0x23425d);
    }
    ['cancelOrganizationUpcomingSubscription'](_0x349961, _0xff0b31) {
      let _0x38508c = this.clientUrl('/organization/' + _0x349961 + '/cancel-upcoming');
      return this.post(_0x38508c, {}, _0xff0b31);
    }
    ["updateOrganizationSeats"](_0x249f61, _0x1a0690, _0x5a1257) {
      let _0xaa8604 = this.clientUrl("/organization/" + _0x249f61 + '/seat-management');
      return this.post(_0xaa8604, _0x1a0690, _0x5a1257);
    }
    ['createOrganizationCheckoutSession'](_0x4d9853, _0x51a0ad, _0x7f4fe2) {
      let _0x49eb4e = this.clientUrl('/organization/' + _0x4d9853 + "/create-checkout-session");
      return this.post(_0x49eb4e, _0x51a0ad, _0x7f4fe2);
    }
    ["createOrganizationSetupIntent"](_0x9ae7e8, _0x158d1b) {
      let _0x4a9853 = this.clientUrl('/organization/' + _0x9ae7e8 + '/setup-intent');
      return this.post(_0x4a9853, {}, _0x158d1b);
    }
    ['validateOrganizationCoupon'](_0x1e9791, _0xaa2b2c, _0x4a0f3b) {
      let _0x430173 = this.clientUrl("/organization/" + _0x1e9791 + "/validate-coupon");
      return this.post(_0x430173, _0xaa2b2c, _0x4a0f3b);
    }
    ["getOrgRepo"](_0x357489, _0xb42b32) {
      let _0x3ae0a7 = this.clientUrl("/repositories/" + _0x357489 + "/list-repos");
      return this.get(_0x3ae0a7, _0xb42b32);
    }
    ["getUserRepo"](_0x28b4f9) {
      let _0x22b0a1 = this.clientUrl('/repositories/list-repos');
      return this.get(_0x22b0a1, _0x28b4f9);
    }
    ['getOrgRepoLabels'](_0xeaac, _0x2f7aa1, _0x5c13a4) {
      let _0x398abe = this.clientUrl("/repositories/" + _0xeaac + '/labels');
      return this.post(_0x398abe, _0x2f7aa1, _0x5c13a4);
    }
    ['getUserRepoLabels'](_0x520d17, _0x2a6ce9) {
      let _0x1e86c3 = this.clientUrl("/repositories/labels");
      return this.post(_0x1e86c3, _0x520d17, _0x2a6ce9);
    }
    ["updateRepoSettings"](_0x161e57, _0x81cee0, _0x3fbe93) {
      let _0x5d7769 = this.clientUrl("/repositories/update-settings");
      return this.post(_0x5d7769, _0x81cee0, _0x3fbe93);
    }
    ["increaseMeteredUsageCount"](_0x4cfe31) {
      let _0x46b106 = this.clientUrl('/user/increase-metered-usage-count');
      return this.post(_0x46b106, {}, _0x4cfe31);
    }
    ['increaseMeteredUsageCountInBackground'](_0x5794ae) {
      this.increaseMeteredUsageCount(_0x5794ae).catch(() => {});
    }
    ["validateInvoice"](_0x14a375) {
      let _0x4428ae = this.clientUrl('/user/validate-invoice');
      return this.post(_0x4428ae, {}, _0x14a375);
    }
    ['generateMeteredInvoice'](_0x4d68ab) {
      let _0x153cde = this.clientUrl("/user/generate-metered-invoice");
      return this.post(_0x153cde, {}, _0x4d68ab);
    }
    ['refreshToken'](_0x5b470e) {
      let _0x369581 = this.clientUrl("/auth/refresh");
      return this.post(_0x369581, {}, _0x5b470e);
    }
    ['exchangeToken'](_0x428df0) {
      let _0x132061 = this.clientUrl("/user/exchange-token");
      return this.post(_0x132061, {}, _0x428df0);
    }
    ["installMCPServer"](_0x5e232d, _0x14bff7) {
      let _0x42e455 = this.clientUrl('/user/mcp-servers/install');
      return this.post(_0x42e455, _0x5e232d, _0x14bff7);
    }
    ['updateMCPServer'](_0x2c8ebf, _0x41eb13, _0x4b152e) {
      let _0x3a93d0 = this.clientUrl("/user/mcp-servers/" + _0x2c8ebf + '/update');
      return this.post(_0x3a93d0, _0x41eb13, _0x4b152e);
    }
    ["connectMCPServer"](_0x1f45d7, _0x35ddc3) {
      let _0xb784bf = this.clientUrl("/user/mcp-servers/" + _0x1f45d7 + "/connect");
      return this.post(_0xb784bf, {}, _0x35ddc3);
    }
    ['listMCPServers'](_0x4b4af5) {
      let _0x592f87 = this.clientUrl('/user/mcp-servers/list');
      return this.get(_0x592f87, _0x4b4af5);
    }
    ['refreshMCPServers'](_0x363bdd) {
      let _0x5e3bd4 = this.clientUrl("/user/mcp-servers/refresh");
      return this.post(_0x5e3bd4, {}, _0x363bdd);
    }
    ["listAllMCPServers"](_0x1a2291) {
      let _0x467ce4 = this.clientUrl("/user/mcp-servers/list-all");
      return this.get(_0x467ce4, _0x1a2291);
    }
    ['disconnectMCPServer'](_0x3deff4, _0x1a7b74) {
      let _0x89f171 = this.clientUrl('/user/mcp-servers/' + _0x3deff4 + '/disconnect');
      return this.post(_0x89f171, {}, _0x1a7b74);
    }
    ['deleteMCPServer'](_0x3ba910, _0x427809) {
      let _0x31434c = this.clientUrl("/user/mcp-servers/" + _0x3ba910);
      return this.delete(_0x31434c, {}, _0x427809);
    }
    ['oauthCallback'](_0x5002ba, _0x36da2c) {
      let _0xa8b71c = this.clientUrl("/mcp-servers/oauth/callback", _0x5002ba);
      return this.post(_0xa8b71c, {}, _0x36da2c);
    }
    ['executeMCPServerTool'](_0xaed4d, _0x264dd6, _0x86d24d) {
      let _0x2c9cd9 = this.clientUrl("/user/mcp-servers/" + _0xaed4d + '/execute-tool');
      return this.post(_0x2c9cd9, _0x264dd6, _0x86d24d);
    }
    ["listMCPServerTools"](_0x31805a, _0x43e4f6) {
      let _0x17b4e2 = this.clientUrl("/user/mcp-servers/" + _0x31805a + "/list-tools");
      return this.get(_0x17b4e2, _0x43e4f6);
    }
    ['installOrganizationMCPServer'](_0x12e80c, _0x1a7992, _0x44e2ff) {
      let _0x51e20b = this.clientUrl('/organization/' + _0x12e80c + '/mcp-servers/install');
      return this.post(_0x51e20b, _0x1a7992, _0x44e2ff);
    }
    ["updateOrganizationMCPServer"](_0x1d4a87, _0x57348b, _0x30f62f, _0x365181) {
      let _0xc5d723 = this.clientUrl('/organization/' + _0x1d4a87 + '/mcp-servers/' + _0x57348b + '/update');
      return this.post(_0xc5d723, _0x30f62f, _0x365181);
    }
    ["connectOrganizationMCPServer"](_0x1633c3, _0x2d32ad, _0x44003a) {
      let _0x3ab88e = this.clientUrl("/organization/" + _0x1633c3 + "/mcp-servers/" + _0x2d32ad + '/connect');
      return this.post(_0x3ab88e, {}, _0x44003a);
    }
    ['listOrganizationMCPServers'](_0xfb065d, _0x37f3aa) {
      let _0x26d4c5 = this.clientUrl('/organization/' + _0xfb065d + "/mcp-servers/list");
      return this.get(_0x26d4c5, _0x37f3aa);
    }
    ['refreshOrganizationMCPServers'](_0x1c6097, _0x196bb4) {
      let _0x52a40d = this.clientUrl('/organization/' + _0x1c6097 + '/mcp-servers/refresh');
      return this.post(_0x52a40d, {}, _0x196bb4);
    }
    ["disconnectOrganizationMCPServer"](_0x515fae, _0x3f6c2b, _0x20c57e) {
      let _0x292629 = this.clientUrl("/organization/" + _0x515fae + '/mcp-servers/' + _0x3f6c2b + '/disconnect');
      return this.post(_0x292629, {}, _0x20c57e);
    }
    ['deleteOrganizationMCPServer'](_0x8c21d8, _0x36daab, _0x37c1db) {
      let _0x1fb29e = this.clientUrl("/organization/" + _0x8c21d8 + '/mcp-servers/' + _0x36daab);
      return this.delete(_0x1fb29e, {}, _0x37c1db);
    }
    ['executeOrganizationMCPServerTool'](_0x3ec65b, _0x430b07, _0x9640a0, _0x2b9a5c) {
      let _0x3c4aa4 = this.clientUrl("/organization/" + _0x3ec65b + '/mcp-servers/' + _0x430b07 + '/execute-tool');
      return this.post(_0x3c4aa4, _0x9640a0, _0x2b9a5c);
    }
    ["listOrganizationMCPServerTools"](_0x36c58c, _0x513a18, _0x190481) {
      let _0x533e84 = this.clientUrl('/organization/' + _0x36c58c + '/mcp-servers/' + _0x513a18 + "/list-tools");
      return this.get(_0x533e84, _0x190481);
    }
  },
  initRepoSettingsExports = __esmModule(() => {
    initRepoSettingsSchema();
  }),
  AuthStatusHandler,
  initAuthStatusHandler = __esmModule(() => {
    'use strict';

    initCommentNavigatorDeps(), AuthStatusHandler = class {
      static async ['sendAuthStatus'](_0x42b2df) {
        let _0x5efd6e = {
          type: _0x42b2df,
          sendToViewImmediately: true
        };
        await Qe.postToCommentNavigator(_0x5efd6e);
      }
      static async ["sendSigningInMessage"]() {
        await this.sendAuthStatus(Iv.SIGNING_IN);
      }
      static async ["sendSignedInMessage"]() {
        await this.sendAuthStatus(Iv.SIGNED_IN);
      }
      static async ['sendSignedOutMessage']() {
        await this.sendAuthStatus(Iv.SIGNED_OUT);
      }
      static async ["updateVSCodeContext"](_0x18f442) {
        _0x18f442 ? await this.setSignedInContext() : await this.setSignedOutContext();
      }
      static async ['setSignedInContext']() {
        await vscode_module.commands.executeCommand("setContext", "traycer.isSignedOut", false);
      }
      static async ['setSignedOutContext']() {
        return vscode_module.commands.executeCommand("setContext", 'traycer.isSignedOut', true);
      }
    };
  }),
  AuthStatusHandlerExports,
  initAuthStatusHandlerExports = __esmModule(() => {
    'use strict';

    initAuthStatusHandler(), AuthStatusHandlerExports = class {
      constructor() {
        this.currentState = "SignedOut";
      }
      async ["setState"](_0x572b9b) {
        await this.performStateTransition(_0x572b9b);
      }
      async ['performStateTransition'](_0x58dcd2) {
        switch (_0x58dcd2) {
          case "SignedOut":
            await AuthStatusHandler.sendSignedOutMessage();
            break;
          case "SigningIn":
            await AuthStatusHandler.sendSigningInMessage();
            break;
          case "SignedIn":
            await AuthStatusHandler.sendSignedInMessage();
            break;
        }
        this.currentState = _0x58dcd2;
      }
      ["isInProgress"]() {
        return this.currentState === 'SigningIn';
      }
      ["isSignedOut"]() {
        return this.currentState === 'SignedOut';
      }
      ["isWaitingForUserConfirmation"]() {
        return this.currentState === 'WaitingForUserConfirmation';
      }
    };
  }),
  ContextStorageManager,
  initContextStorageManager = __esmModule(() => {
    'use strict';

    initSearchConfig(), ContextStorageManager = class {
      constructor(_0x5d3aec) {
        this.context = _0x5d3aec;
      }
      ["getTokenKey"]() {
        return config.nodeEnv === 'production' ? AUTH_TOKEN_KEY : config.nodeEnv + ':' + AUTH_TOKEN_KEY;
      }
      ["getLegacyTokenKey"]() {
        return ACCESS_TOKEN_KEY;
      }
      async ["storeToken"](_0x3932a6) {
        await this.context.secrets.store(this.getTokenKey(), _0x3932a6);
      }
      async ["getToken"]() {
        return await this.context.secrets.get(this.getTokenKey());
      }
      async ["getLegacyToken"]() {
        return await this.context.secrets.get(this.getLegacyTokenKey());
      }
      async ["removeLegacyToken"]() {
        await this.context.secrets.delete(this.getLegacyTokenKey());
      }
      async ['deleteToken']() {
        await this.context.secrets.delete(this.getTokenKey());
      }
    };
  })
 
async function fetchGoogleIapToken() {
  let _0x1f74ad = config.iapTargetAudience;
  if (!_0x1f74ad?.["trim"]()) return Logger.warn("No target audience provided"), null;
  let _0x4c233f = null;
  try {
    _0x4c233f = await new google_auth_module.GoogleAuth({
      keyFilename: getGoogleCredentialsPath()
    }).getClient();
  } catch (_0xd568ff) {
    return Logger.warn('Failed to get iap token', _0xd568ff), null;
  }
  try {
    if (!_0x4c233f?.["fetchIdToken"]) return Logger.warn("Cannot fetch ID token in this environment", "Use GCE or set the GOOGLE_APPLICATION_CREDENTIALS environment variable to a service account credentials JSON file"), null;
    let _0x42f0c4 = await _0x4c233f.fetchIdToken(_0x1f74ad).catch(_0x1f6edf => (Logger.warn('Failed to fetch IAP token', _0x1f6edf), null));
    return Logger.debug("Fetched IAP token"), _0x42f0c4;
  } catch (_0x43ae33) {
    return Logger.warn("Failed to get IAP token", _0x43ae33), null;
  }
}
var initGoogleAuth = __esmModule(() => {
    'use strict';

    initSearchConfig();
  }),
  ult = 'Server disconnected',
  bT = class extends Error {
    constructor() {
      super('' + ult), this.name = "ServerDisconnectedError";
    }
  },
  _a = class extends Error {
    constructor(_0x46a7ec = 'Unauthorized access') {
      super(_0x46a7ec), this.name = "UnauthorizedError";
    }
  },
  lh = class extends Error {
    constructor(_0x18b92d) {
      super(_0x18b92d), this.name = 'NetworkError';
    }
  },
  bC = class extends Error {
    constructor(_0x19070d = "User cancelled the operation") {
      super(_0x19070d), this.name = 'UserCancelledError';
    }
  },
  RetryExecutor,
  initRetryExecutor = __esmModule(() => {
    'use strict';

    RetryExecutor = class _0x38d06e {
      static {
        this.DEFAULT_RETRIES = 4;
      }
      static async ["executeWithRetry"](_0x25e662, _0x846566) {
        let {
          shouldRetry: _0x5422ec,
          signal: _0xdb76cd
        } = _0x846566;
        if (_0xdb76cd?.['aborted']) throw new bC();
        return (await p_retry_module.default)(_0x25e662, {
          retries: _0x846566.retries,
          signal: _0xdb76cd,
          onFailedAttempt: _0x490a84 => {
            if (!_0x5422ec(_0x490a84)) throw _0x490a84;
            let _0x12ed6e = calculateRetryDelay(10, _0x490a84.attemptNumber);
            return Logger.warn('Failed attempt ' + _0x490a84.attemptNumber + " due to error: " + _0x490a84.message + ", retrying in " + _0x12ed6e.retryAfter + "ms."), new Promise(_0x1b5f9f => setTimeout(_0x1b5f9f, _0x12ed6e.retryAfter));
          }
        });
      }
      static async ["executeTokenValidation"](_0x1ee821, _0x5a13c7) {
        return this.executeWithRetry(_0x1ee821, {
          retries: _0x38d06e.DEFAULT_RETRIES,
          shouldRetry: this.shouldRetryTokenOperation,
          signal: _0x5a13c7
        });
      }
      static ["shouldRetryTokenOperation"](_0x4d9b04) {
        return !(_0x4d9b04 instanceof _a || _0x4d9b04 instanceof bC);
      }
    };
  }),
  IC,
  initTokenValidator = __esmModule(() => {
    'use strict';

    initGoogleAuth(), initSearchConfig(), initRetryExecutor(), IC = class {
      constructor(_0x292285) {
        this.authClient = _0x292285;
      }
      async ["validateToken"](_0x5271b0, _0x572775) {
        return await RetryExecutor.executeTokenValidation(async () => {
          let _0x32a19b = await this.prepareHeaders(_0x5271b0),
            _0x2cd779 = await this.authClient.getUser(_0x32a19b);
          if (_0x2cd779.status === 404 || _0x2cd779.status === 401) throw new _a('Failed to validate token: ' + _0x2cd779.status);
          if (!_0x2cd779.ok) throw new lh('Failed to validate token: ' + _0x2cd779.status);
          return await _0x2cd779.json();
        }, _0x572775);
      }
      async ["validateInvoice"](_0x5f17ed) {
        let _0x4af531 = await this.prepareHeaders(_0x5f17ed),
          _0x146513 = await this.authClient.validateInvoice(_0x4af531);
        if (_0x146513.status === 401) throw new _a();
        if (!_0x146513.ok) throw new lh("Failed to validate invoice: " + _0x146513.status);
        return await _0x146513.json();
      }
      async ['refreshToken'](_0x28c298, _0x4bba86) {
        return await RetryExecutor.executeTokenValidation(async () => {
          let _0x5382b2 = await this.prepareHeaders(_0x28c298),
            _0x35b8da = await this.authClient.refreshToken(_0x5382b2);
          if (_0x35b8da.status === 401) throw new _a("Failed to refresh token: " + _0x35b8da.status);
          if (!_0x35b8da.ok) throw new lh('Failed to refresh token: ' + _0x35b8da.status);
          return await _0x35b8da.json();
        }, _0x4bba86);
      }
      async ["exchangeToken"](_0x5081f8, _0x512117) {
        return await RetryExecutor.executeTokenValidation(async () => {
          let _0x204cba = await this.prepareHeaders(_0x5081f8),
            _0xfc53b9 = await this.authClient.exchangeToken(_0x204cba);
          if (_0xfc53b9.status === 401) throw new _a("Failed to exchange token: " + _0xfc53b9.status);
          if (!_0xfc53b9.ok) throw new lh('Failed to exchange token: ' + _0xfc53b9.status);
          return await _0xfc53b9.json();
        }, _0x512117);
      }
      async ["listAllMCPServers"](_0x4340bd) {
        let _0x45629c = await this.prepareHeaders(_0x4340bd),
          _0x347d8d = await this.authClient.listAllMCPServers(_0x45629c);
        if (_0x347d8d.status === 401) throw new _a();
        if (!_0x347d8d.ok) throw new lh("Failed to list MCP servers: " + _0x347d8d.status);
        return await _0x347d8d.json();
      }
      async ['prepareHeaders'](_0x78fd79) {
        let _0x2230d7 = null;
        if (config.nodeEnv === 'development' && (_0x2230d7 = await fetchGoogleIapToken().catch(_0x3d17e3 => (Logger.warn("Failed to get IAP token for validation", _0x3d17e3), null)), !_0x2230d7)) throw Logger.warn('IAP token not received for validation'), new Error('Failed to get IAP token for validation');
        let _0x54058b = new Headers();
        return _0x2230d7 && _0x54058b.set("Proxy-Authorization", 'Bearer ' + _0x2230d7), _0x54058b.set("Authorization", 'Bearer ' + _0x78fd79), _0x54058b;
      }
    };
  }),
  initAuthModule = __esmModule(() => {
    'use strict';

    initAuthStatusHandlerExports(), initContextStorageManager(), initTokenValidator(), initAuthStatusHandler();
  }),
  IT = 'traycer.traycer-vscode',
  TraycerCredentials,
  initTraycerCredentials = __esmModule(() => {
    'use strict';

    initSearchConfig(), initWorkspaceInfo(), initUsageTracker(), initRepoSettingsExports(), initAuthModule(), TraycerCredentials = class TraycerCredentials {
      constructor(context, onActivation, onDeactivation) {
        this.context = context, this._traycerUser = null, this._traycerToken = null, this.currentAuthController = null, Logger.info("Initializing Traycer credentials"), this.authClient = new TraycerApiClient(new URL(config.authnApiUrl)), this.onActivation = onActivation, this.onDeactivation = onDeactivation, this.authStateManager = new AuthStatusHandlerExports(), this.contextStorageManager = new ContextStorageManager(context), this.tokenManager = new IC(this.authClient);
      }
      static {
        this.SIGN_IN_COMMAND = "traycer.signIn";
      }
      static {
        this.SIGN_OUT_COMMAND = "traycer.signOut";
      }
      async ['handleActivation'](token, user) {
        await this.authStateManager.setState("SignedIn"), this._traycerUser = user, this._traycerToken = token, await this.contextStorageManager.storeToken(token), await AuthStatusHandler.updateVSCodeContext(user), await vscode_module.commands.executeCommand("setContext", 'traycer.enableCommands', true), await this.onActivation(), await UsageTracker.getInstance().fetchRateLimitUsage(false, true);
      }
      async ['handleDeactivation']() {
        this.currentAuthController?.['abort'](), this.currentAuthController = null, await this.authStateManager.setState("SignedOut"), await this.contextStorageManager.deleteToken(), this._traycerUser = null, this._traycerToken = null, await AuthStatusHandler.updateVSCodeContext(void 0), await vscode_module.commands.executeCommand('setContext', "traycer.enableCommands", false), await this.onDeactivation();
      }
      get ['authnClient']() {
        return this.authClient;
      }
      get ['traycerToken']() {
        return this._traycerToken;
      }
      get ["traycerUser"]() {
        return this._traycerUser;
      }
      async ["setupAuth"]() {
        this.currentAuthController?.["abort"]();
        let abortSignal = this.beginAuthOperation();
        await this.authStateManager.setState('SigningIn'), await registerVscodeCommand(this.context, TraycerCredentials.SIGN_IN_COMMAND, async () => {
          try {
            await this.promptSignIn();
          } catch (_0x28168a) {
            Logger.error(_0x28168a, 'Error during sign in command'), this.handleDeactivation();
            return;
          }
        }), await registerVscodeCommand(this.context, TraycerCredentials.SIGN_OUT_COMMAND, async () => {
          try {
            await this.handleDeactivation();
          } catch (_0x360ed6) {
            Logger.error(_0x360ed6, 'Error during sign out command');
            return;
          }
        });
        let storedToken = await this.contextStorageManager.getToken();
        if (storedToken?.["length"]) {
          if (await this.validateTraycerToken(storedToken, abortSignal)) return;
          Logger.warn("Invalid tokens, removing stored tokens"), await this.contextStorageManager.deleteToken();
        } else {
          let legacyToken = await this.contextStorageManager.getLegacyToken();
          if (legacyToken?.["length"]) {
            if (await this.exchangeTraycerToken(legacyToken, abortSignal)) return;
            await this.contextStorageManager.removeLegacyToken();
          }
        }
        this.handleDeactivation();
      }
      async ['authenticateWithTraycerToken'](token) {
        let abortSignal = this.beginAuthOperation();
        (await this.validateTraycerToken(token, abortSignal)) || (await this.handleDeactivation());
      }
      async ['validateTraycerToken'](token, abortSignal) {
        try {
          let validatedUser = await this.tokenManager.validateToken(token, abortSignal);
          return await this.handleActivation(token, validatedUser), true;
        } catch (error) {
          return Logger.warn("Error validating Traycer token", formatErrorToString(error)), isAbortError(error) ? false : error instanceof _a && (await this.refreshTraycerTokenInternal(token, abortSignal)) && this._traycerToken ? this.validateTraycerToken(this._traycerToken, abortSignal) : false;
        }
      }
      async ["exchangeTraycerToken"](legacyToken, abortSignal) {
        try {
          let exchangeResult = await this.tokenManager.exchangeToken(legacyToken, abortSignal);
          return await this.handleActivation(exchangeResult.token, exchangeResult.user), await this.contextStorageManager.removeLegacyToken(), true;
        } catch (_0x12a302) {
          return Logger.warn("Token exchange failed", _0x12a302), false;
        }
      }
      async ['refreshTraycerToken']() {
        let currentToken = this.traycerToken;
        return currentToken ? this.refreshTraycerTokenInternal(currentToken, this.beginAuthOperation()) : false;
      }
      async ["refreshTraycerTokenInternal"](token, abortSignal) {
        try {
          let refreshResult = await this.tokenManager.refreshToken(token, abortSignal);
          return await this.contextStorageManager.storeToken(refreshResult.token), this._traycerToken = refreshResult.token, true;
        } catch (_0x33b548) {
          return Logger.warn('Token refresh failed', _0x33b548), false;
        }
      }
      async ['validateInvoice']() {
        let user = this.traycerUser,
          token = this.traycerToken;
        if (!user || !token) throw new Error("Traycer user or access token not set");
        try {
          let usage = await this.tokenManager.validateInvoice(token);
          user.payAsYouGoUsage = usage;
        } catch (_0x3b5915) {
          if (_0x3b5915 instanceof _a) {
            if (await this.refreshTraycerTokenInternal(token, this.beginAuthOperation())) return this.validateInvoice();
            this.handleDeactivation();
            return;
          }
          throw _0x3b5915;
        }
      }
      async ['listAllMCPServers']() {
        let token = this.traycerToken;
        if (!token) throw new Error('Traycer user or access token not set');
        try {
          return await this.tokenManager.listAllMCPServers(token);
        } catch (_0x19fa96) {
          if (_0x19fa96 instanceof _a) {
            if (await this.refreshTraycerTokenInternal(token, this.beginAuthOperation())) return this.listAllMCPServers();
            throw this.handleDeactivation(), new Error("Failed to list MCP servers");
          }
          throw _0x19fa96;
        }
      }
      async ["sendAuthenticationStatus"]() {
        return this.traycerUser && this.traycerToken ? AuthStatusHandler.sendSignedInMessage() : this.authStateManager.isInProgress() ? AuthStatusHandler.sendSigningInMessage() : AuthStatusHandler.sendSignedOutMessage();
      }
      ["dispose"]() {
        this.currentAuthController?.['abort']();
      }
      ["beginAuthOperation"]() {
        return this.currentAuthController?.['abort'](), this.currentAuthController = new AbortController(), this.currentAuthController.signal;
      }
      async ['promptSignIn']() {
        await this.authStateManager.setState("SignedOut");
        let loginMessage = "Login to use Traycer",
          signInOption = "Sign in with Traycer",
          pasteOption = "Paste token";
        await this.authStateManager.setState('WaitingForUserConfirmation');
        let selection = await vscode_module.window.showInformationMessage("Login to use Traycer", "Sign in with Traycer", "Paste token");
        selection === "Sign in with Traycer" ? (await this.authStateManager.setState("SigningIn"), await this.openCloudUI()) : selection === "Paste token" && (await this.promptPasteToken());
      }
      async ['openCloudUI']() {
        let callbackUri = workspace_info.getInstance().getIdeInfo().uriScheme + "://" + IT + '/' + AUTH_CALLBACK_COMMAND,
          cloudUrl = config.cloudUIUrl + '?redirect_uri=' + encodeURIComponent(callbackUri);
        await workspace_info.getInstance().openExternalLink(cloudUrl);
      }
      async ['promptPasteToken']() {
        let pastedToken = await vscode_module.window.showInputBox({
          prompt: "Paste the token copied from the browser",
          placeHolder: "Paste the token copied from the browser",
          ignoreFocusOut: true,
          password: true
        });
        if (pastedToken && pastedToken.trim()) try {
          if (await this.validateTraycerToken(pastedToken, this.beginAuthOperation())) return;
        } catch (_0x5c2322) {
          Logger.error('Error processing pasted token', _0x5c2322 instanceof Error ? _0x5c2322.message : String(_0x5c2322));
        }
        await this.promptSignIn();
      }
    };
  }),
  m2 = class extends Error {
    constructor(_0x3346da, _0xff57ae) {
      super(_0x3346da), this.name = "ServerDisconnectedError", this.count = _0xff57ae;
    }
  },
  maxMissedPings,
  GrpcMessageTracker,
  initGrpcMessageTracker = __esmModule(() => {
    'use strict';

    maxMissedPings = un.MAX_MISSED_PINGS, GrpcMessageTracker = class {
      constructor() {
        this.messageMap = new Map(), this.grpcConnectionsMap = new Map(), this.messageId = 1;
      }
      get ['inflightGrpcConnections']() {
        return this.grpcConnectionsMap;
      }
      ['trackNewMessage'](_0x12b576) {
        let _0xb10d2 = this.messageId++,
          _0x28b6fa = new Promise((_0xa2f64e, _0x4c9c5c) => {
            this.grpcConnectionsMap.set(_0xb10d2, _0x12b576), this.messageMap.set(_0xb10d2, {
              resolve: _0xa2f64e,
              reject: _0x4c9c5c
            });
          });
        return [_0xb10d2, _0x28b6fa];
      }
      ["resolveMessage"](_0x284963, _0x2a54a3) {
        let _0x8b4267 = this.messageMap.get(_0x284963);
        _0x8b4267 ? (_0x8b4267.resolve(_0x2a54a3), this.cleanUpMessage(_0x284963)) : Logger.warn("No tracked message with ID " + _0x284963);
      }
      ["rejectMessage"](_0x59e2d9, _0x34b1c2) {
        let _0x1b76c3 = this.messageMap.get(_0x59e2d9);
        _0x1b76c3 ? (_0x1b76c3.reject(_0x34b1c2), this.cleanUpMessage(_0x59e2d9)) : Logger.warn("No tracked message with ID " + _0x59e2d9);
      }
      ["cleanUpMessage"](_0x52c4c8) {
        let _0x16d48e = this.grpcConnectionsMap.get(_0x52c4c8);
        _0x16d48e && (_0x16d48e.pingState.pingIntervalTimer && (clearInterval(_0x16d48e.pingState.pingIntervalTimer), _0x16d48e.pingState.pingIntervalTimer = null), _0x16d48e.streamHandler.cleanup(), _0x16d48e.stream.end(), _0x16d48e.client.close(), this.grpcConnectionsMap.delete(_0x52c4c8)), this.messageMap.delete(_0x52c4c8);
      }
      ['clearAll']() {
        this.messageMap.forEach((_0x509aaa, _0x221e99) => {
          _0x509aaa.reject(new m2("Server disconnected")), this.cleanUpMessage(_0x221e99);
        });
      }
    };
  }),
  g2 = class extends Error {
    constructor(_0x324709) {
      super(_0x324709), this.name = "ResourceExhaustedError";
    }
  };
async function handleListFilesRequest(_0x2de2bc) {
  let {
    pattern: _0x366821,
    directory: _0x3c7ed8
  } = _0x2de2bc;
  return {
    filePaths: await listFilesFromPathProto(_0x3c7ed8, _0x366821)
  };
}
async function handleGetDiagnosticsRequest(_0x2abd42) {
  let {
      includePattern: _0x34498c,
      directories: _0x51cba3,
      severity: _0x8a77a5
    } = _0x2abd42,
    _0x4cc583 = [];
  try {
    let _0x36befd = _0x51cba3.map(_0x5c7af6 => TraycerPath.fromPathProto(_0x5c7af6).absPath);
    for (let key of _0x36befd) try {
      let _0x4de78c = await listFilesInDirectory(key, _0x34498c ?? void 0);
      for (let _0x4e15ca of _0x4de78c) try {
        let _0x132ef8 = await getDiagnosticsForFile(_0x4e15ca, _0x8a77a5);
        _0x132ef8.diagnostics.length > 0 && _0x4cc583.push({
          path: _0x4e15ca,
          diagnostics: _0x132ef8.diagnostics
        });
      } catch (_0x4336ca) {
        let _0x504444 = 'Failed to process file: ' + _0x4e15ca;
        Logger.warn(_0x504444, _0x4336ca);
      }
    } catch (_0x297af8) {
      Logger.error(_0x297af8, "Failed to process directory: " + key);
    }
    return {
      filePathDiagnostics: _0x4cc583
    };
  } catch (_0x49fea6) {
    let _0x169542 = 'Failed to get diagnostics with pattern: ' + _0x34498c;
    throw Logger.error(_0x49fea6, _0x169542), new Error(_0x169542);
  }
}
var initSymbolSearchExports = __esmModule(() => {
  'use strict';

  initSymbolSearch();
});
async function getUncommittedDiffForFile(_0x18bd48) {
  let {
    filePath: _0xca7ad2
  } = _0x18bd48;
  if (!_0xca7ad2) throw new Error("filePath is required for uncommitted diff request");
  let _0x42f573 = TraycerPath.fromPathProto(_0xca7ad2),
    _0x62060f = _0x42f573.workspaceUri,
    _0x14b59a = _0x42f573.relPath,
    _0x53addc = _0x14b59a.length > 0 ? _0x14b59a : void 0;
  return {
    gitDiffAgainstUncommitted: {
      fileDeltas: await getUncommittedFileDeltas(_0x62060f, _0x53addc)
    }
  };
}
async function handleRevisionDiffRequest(_0xf6948) {
  let {
    filePath: _0x18cc42,
    revisionSpec: _0x56eafc
  } = _0xf6948;
  if (!_0x18cc42) throw new Error('filePath is required for revision diff request');
  if (!_0x56eafc) throw new Error('revisionSpec is required for revision diff request');
  let _0x707b24 = TraycerPath.fromPathProto(_0x18cc42),
    _0x228dc0 = _0x707b24.workspaceUri,
    _0x3bed18 = _0x707b24.relPath,
    _0x5d670c = _0x3bed18.length > 0 ? _0x3bed18 : void 0,
    _0x54416c = await getRevisionDiffWithContent(_0x228dc0, _0x56eafc, _0x5d670c);
  return {
    gitDiffAgainstRevision: {
      revisionSpec: _0x56eafc,
      fileDeltas: _0x54416c
    }
  };
}
async function handleGetGitDiffRequest(_0x5085f0) {
  let {
    getGitUncommittedDiffRequest: _0x1ff57f,
    getGitRevisionDiffRequest: _0x8ea1c9
  } = _0x5085f0;
  if (!_0x1ff57f && !_0x8ea1c9) throw new Error("GetGitDiffRequest must have one of: getGitUncommittedDiffRequest or getGitRevisionDiffRequest");
  let _0x568e6f;
  if (_0x1ff57f) _0x568e6f = await getUncommittedDiffForFile(_0x1ff57f);else {
    if (_0x8ea1c9) _0x568e6f = await handleRevisionDiffRequest(_0x8ea1c9);else throw new Error('No valid git diff request variant found');
  }
  return {
    gitDiff: _0x568e6f
  };
}
var initGitInfoModule = __esmModule(() => {
  'use strict';

  ;
});
async function handleGetGitInfoRequest(_0x50061e) {
  let {
    filePath: _0x4aced2,
    numBranches: _0x1635f9,
    numCommits: _0x470284
  } = _0x50061e;
  if (!_0x4aced2) throw new Error("filePath is required for git info request");
  let _0x24a89b = _0x1635f9 ?? 10,
    _0x45f88a = _0x470284 ?? 50,
    _0x1012eb = TraycerPath.fromPathProto(_0x4aced2).workspaceUri,
    [_0x47a335, _0x4b37de, _0x233506, _0x4aa10d] = await Promise.all([getGitFileRelativePath(_0x1012eb), getGitRemoteUrl(_0x1012eb), getGitCommitInfo(_0x1012eb), getGitDiff(_0x1012eb, _0x45f88a)]),
    _0x23948b = _0x233506.slice(0, _0x24a89b),
    _0x4ca16b = _0x4aa10d.map(_0x2b7add => ({
      hash: _0x2b7add.hash,
      message: _0x2b7add.message,
      author: _0x2b7add.author,
      date: _0x2b7add.date
    }));
  return {
    gitInfo: {
      currentBranch: _0x47a335,
      currentCommitHash: _0x4b37de,
      recentBranches: _0x23948b,
      recentCommits: _0x4ca16b
    }
  };
}
var initGitInfoExports = __esmModule(() => {
  'use strict';

  ;
});
/* [unbundle] fuzzysort 已移至顶部导入区 */
async function handleListFilesAndFoldersRequest(_0x199565) {
  let {
    directory: _0x599c4c,
    recursive: _0x38637b
  } = _0x199565;
  try {
    return await listDirectoryOrThrow(_0x599c4c, _0x38637b);
  } catch (_0x1e09a3) {
    Logger.warn('Failed to list files and folders at ' + JSON.stringify(_0x599c4c) + '.', _0x1e09a3), await throwFolderNotFoundError(_0x599c4c);
  }
}
async function listDirectoryOrThrow(_0x4ed450, _0x3c698b) {
  let _0x2af3c6 = await listDirectoryWithAgentsMd(_0x4ed450, _0x3c698b);
  if (!_0x2af3c6?.["directory"]?.['filePaths']?.["length"] && !_0x2af3c6?.["directory"]?.["subDirectories"]?.['length']) throw new Error("No files or folders found at " + _0x4ed450?.['absolutePath'] + '.');
  return {
    directory: _0x2af3c6.directory,
    detectedRuleFiles: _0x2af3c6.detectedRuleFiles
  };
}
async function throwFolderNotFoundError(_0xea7770) {
  let _0x42670b = TraycerPath.fromPathProto(_0xea7770),
    _0x53261c = workspace_info.getInstance().getWorkspaceDirs(),
    _0x43df9b = await Promise.all(_0x53261c.map(async _0x43e7ca => await searchFoldersWithRipgrep(_0x43e7ca, '', null, Number.MAX_SAFE_INTEGER, true))),
    _0x5c3cdd = (0, fuzzysort_module.go)(_0x42670b.absPath, _0x43df9b.flat(), {
      limit: 5,
      threshold: 0.1
    }),
    _0x58ef0a = _0x5c3cdd.length > 0 ? ' Did you mean: ' + _0x5c3cdd.map(_0x3e7f4b => _0x3e7f4b.target).join(', ') + '?' : " No similar folders found.";
  throw new Error('Failed to list files and folders at ' + _0x42670b.absPath + '. ' + _0x58ef0a);
}
var initSymbolSearchHandler = __esmModule(() => {
  'use strict';

  initSearchUtils(), initWorkspaceInfo(), initQueryProcessor();
});
async function enqueueLanguageRequest(_0x40b48a, _0x43314f) {
  if (!AC.has(_0x43314f)) {
    if (_0x43314f === 'python') {
      let _0x398ce1 = vscode_module.workspace.getConfiguration("python").get("languageServer"),
        _0x395b16 = vscode_module.extensions.getExtension('ms-python.vscode-pylance');
      (_0x398ce1 === 'Pylance' || _0x398ce1 === 'Default') && _0x395b16 && _0x395b16.isActive ? AC.set(_0x43314f, new RequestQueue(5, 200, 2000)) : AC.set(_0x43314f, new RequestQueue(3, 500, 2000));
    } else AC.set(_0x43314f, new RequestQueue(10, 100, 2000));
  }
  return AC.get(_0x43314f).enqueueRequest(_0x40b48a);
}
var AC,
  initRequestQueueHelper = __esmModule(() => {
    'use strict';

    AC = new Map();
  });
async function enqueueDefinitionRequest(_0x5144cc, _0x34e08b) {
  return enqueueLanguageRequest(() => getDefinitionLocation(_0x5144cc), _0x34e08b);
}
async function getDefinitionLocation(_0x517b7d) {
  let {
    filePath: _0x2bb2f8,
    line: _0x21930e,
    character: _0x3426c2
  } = _0x517b7d;
  if (!_0x2bb2f8 || isNaN(_0x21930e) || isNaN(_0x3426c2)) throw new Error('Invalid parameters');
  let _0x309d6c = vscode_module.Uri.file(_0x2bb2f8.absPath);
  try {
    let _0x3fd882 = new vscode_module.Position(_0x21930e, _0x3426c2),
      _0x25bb43 = await vscode_module.commands.executeCommand("vscode.executeDefinitionProvider", _0x309d6c, _0x3fd882),
      _0x23f75a,
      _0x202019,
      _0x554c40 = _0x25bb43?.[0];
    _0x554c40 instanceof vscode_module.Location ? (_0x23f75a = _0x554c40.uri.fsPath, _0x202019 = {
      startLine: _0x554c40.range.start.line,
      startCharacter: _0x554c40.range.start.character,
      endLine: _0x554c40.range.end.line,
      endCharacter: _0x554c40.range.end.character
    }) : (_0x554c40 = _0x554c40, _0x23f75a = _0x554c40.targetUri.fsPath, _0x202019 = {
      startLine: _0x554c40.targetRange.start.line,
      startCharacter: _0x554c40.targetRange.start.character,
      endLine: _0x554c40.targetRange.end.line,
      endCharacter: _0x554c40.targetRange.end.character
    });
    let _0x11604a = await TraycerPath.fromPath(_0x23f75a);
    return _0x25bb43?.[0] ? {
      filePath: _0x11604a,
      range: _0x202019
    } : void 0;
  } catch (_0x5718d9) {
    throw new Error("Error retrieving definitions: " + _0x5718d9);
  }
}
var initFileCache = __esmModule(() => {
  'use strict';

  initRequestQueueHelper();
});
async function enqueueImplementationRequest(_0x4dfd2a, _0x417b43) {
  return enqueueLanguageRequest(() => getImplementationLocations(_0x4dfd2a), _0x417b43);
}
async function getImplementationLocations(_0x31e5a4) {
  let {
    filePath: _0x4216cf,
    line: _0x1ed524,
    character: _0x2b6801
  } = _0x31e5a4;
  if (!_0x4216cf || isNaN(_0x1ed524) || isNaN(_0x2b6801)) throw new Error('Invalid parameters');
  let _0x3e1172 = vscode_module.Uri.file(_0x4216cf.absPath);
  try {
    let _0x54c22e = new vscode_module.Position(_0x1ed524, _0x2b6801),
      _0x833ee2 = await vscode_module.commands.executeCommand("vscode.executeImplementationProvider", _0x3e1172, _0x54c22e),
      _0x349d7a = [];
    return await Promise.all(_0x833ee2.map(async _0x45b9a2 => {
      _0x45b9a2 instanceof vscode_module.Location ? _0x349d7a.push({
        filePath: await TraycerPath.fromPath(_0x45b9a2.uri.fsPath),
        range: {
          startLine: _0x45b9a2.range.start.line,
          startCharacter: _0x45b9a2.range.start.character,
          endLine: _0x45b9a2.range.end.line,
          endCharacter: _0x45b9a2.range.end.character
        }
      }) : _0x349d7a.push({
        filePath: await TraycerPath.fromPath(_0x45b9a2.targetUri.fsPath),
        range: {
          startLine: _0x45b9a2.targetRange.start.line,
          startCharacter: _0x45b9a2.targetRange.start.character,
          endLine: _0x45b9a2.targetRange.end.line,
          endCharacter: _0x45b9a2.targetRange.end.character
        }
      });
    })), _0x349d7a;
  } catch (_0x5eeaf6) {
    throw new Error('Error retrieving implementations: ' + _0x5eeaf6);
  }
}
var initDirCache = __esmModule(() => {
  'use strict';

  initRequestQueueHelper();
});
async function enqueueReferenceRequest(_0xe0d6e3, _0x3a594e = -1, _0x336b00) {
  return enqueueLanguageRequest(() => getReferenceLocations(_0xe0d6e3, _0x3a594e), _0x336b00);
}
async function getReferenceLocations(_0x2f24cd, _0x502375) {
  let {
    filePath: _0x45fccd,
    line: _0x17a087,
    character: _0x2cface
  } = _0x2f24cd;
  if (!_0x45fccd || isNaN(_0x17a087) || isNaN(_0x2cface)) throw new Error('Invalid parameters');
  let _0x1c9c02 = vscode_module.Uri.file(_0x45fccd.absPath);
  try {
    let _0x27c7f7 = new vscode_module.Position(_0x17a087, _0x2cface),
      _0x1782d0 = await vscode_module.commands.executeCommand('vscode.executeReferenceProvider', _0x1c9c02, _0x27c7f7),
      _0x447468 = _0x1782d0 ? await Promise.all(_0x1782d0.map(async _0x31005e => ({
        filePath: await TraycerPath.fromPath(_0x31005e.uri.fsPath),
        range: {
          startLine: _0x31005e.range.start.line,
          startCharacter: _0x31005e.range.start.character,
          endLine: _0x31005e.range.end.line,
          endCharacter: _0x31005e.range.end.character
        }
      }))) : [];
    return _0x502375 > 0 && _0x447468.length > _0x502375 ? _0x447468.slice(0, _0x502375) : _0x447468;
  } catch (_0x1a42ce) {
    throw new Error("Error retrieving references: " + _0x1a42ce);
  }
}
var initSymbolCache = __esmModule(() => {
    'use strict';

    initRequestQueueHelper();
  }),
  SnippetContextProvider,
  initSnippetContextProvider = __esmModule(() => {
    'use strict';

    initDocumentManager(), SnippetContextProvider = class _0x303f28 {
      static ['getInstance']() {
        return this.instance || (this.instance = new _0x303f28()), this.instance;
      }
      async ['getSnippetContextsFromLocalSymbol'](_0x2cf233) {
        let _0x41a4f6 = await In.getSourceCode(_0x2cf233.filePath.absPath),
          _0x53b621 = createCodeSnippetFromRange(_0x2cf233.filePath.proto, _0x41a4f6, {
            line: _0x2cf233.range.startLine,
            context: 5
          }, {
            line: _0x2cf233.range.endLine,
            context: 10
          });
        return {
          path: _0x2cf233.filePath.proto,
          content: _0x53b621.content,
          range: _0x53b621.range,
          diagnostics: _0x53b621.diagnostics
        };
      }
    };
  }),
  FileCacheBadStateError = class extends Error {
    constructor(_0x38e2c2) {
      super(_0x38e2c2), this.name = "FileCacheBadStateError";
    }
  },
  /* [unbundle] web-tree-sitter 已移至顶部导入区 */
  INVALID_BLOCK_ID,
  CodeBlockCache,
  initCodeBlockCache = __esmModule(() => {
    'use strict';

    INVALID_BLOCK_ID = -1, CodeBlockCache = class {
      constructor() {
        this.codeBlockCounter = 0, this.codeBlocks = new Map(), this.fullFileAtLastParse = '', this.lineToBlock = [], this.mutex = new Mutex();
      }
      ['syncCache'](_0x5c529d, _0x4d8956) {
        let _0x5b2544 = Math.min(..._0x5c529d.added.map(_0x30c71d => _0x30c71d.startLine), ..._0x5c529d.removed.map(_0x2c3533 => _0x2c3533.startLine)),
          _0x330b6b = Math.max(..._0x5c529d.added.map(_0x57ad61 => _0x57ad61.endLine), ..._0x5c529d.removed.map(_0x3725a8 => _0x3725a8.startLine)),
          _0x36189f = Math.max(..._0x5c529d.added.map(_0x4f9964 => _0x4f9964.startLine), ..._0x5c529d.removed.map(_0x22b7d2 => _0x22b7d2.endLine)),
          _0x16b062 = this.getIntersectingCodeBlockIDs(_0x5b2544, _0x36189f, true, true),
          _0x4f6e5d = _0x4d8956.split('\x0a'),
          _0x41bf6a = this.lineToBlock.map(_0x8b7b3 => ({
            ..._0x8b7b3
          }));
        for (let _0x3f3f7d = 0; _0x3f3f7d < _0x41bf6a.length; _0x3f3f7d++) {
          let _0x488fba = _0x41bf6a[_0x3f3f7d];
          _0x16b062.has(_0x488fba.blockID) && (_0x41bf6a[_0x3f3f7d] = {
            blockID: INVALID_BLOCK_ID,
            isTrivial: false
          });
        }
        let _0x50ec9b = this.lineToBlock.length,
          _0x10ed9c = _0x4f6e5d.length - _0x50ec9b;
        _0x10ed9c > 0 ? _0x41bf6a.splice(_0x5b2544, 0, ...Array(_0x10ed9c).fill({
          blockID: INVALID_BLOCK_ID,
          isTrivial: false
        })) : _0x10ed9c < 0 && _0x41bf6a.splice(_0x5b2544, -_0x10ed9c);
        let {
          decomposeStartLine: _0x346892,
          decomposeEndLine: _0x38972d
        } = this.findInvalidRange(_0x5b2544, _0x330b6b, _0x41bf6a);
        return {
          decompositionRange: LineRange.fromEndLine(_0x346892, _0x38972d),
          updatedLineToBlock: _0x41bf6a,
          codeBlockIDsToInvalidate: [..._0x16b062.values()]
        };
      }
      ["updateFileAndBlocks"](_0xde09eb, _0x5dc891, _0x1422e3, _0x74b442) {
        this.lineToBlock = _0x1422e3, this.setFullFileAtLastParse(_0xde09eb);
        let _0x521c51 = _0xde09eb.split('\x0a');
        _0x74b442.forEach(_0x2d3408 => {
          this.codeBlocks.delete(_0x2d3408);
        }), this.insertCodeBlocks(_0x5dc891, _0x521c51);
      }
      ["getCodeBlocks"](_0x28cf5f, _0x21aa7c) {
        let _0x44498c = new Map();
        _0x21aa7c || (_0x21aa7c = [LineRange.fromCount(0, this.lineToBlock.length)]);
        for (let key of _0x21aa7c) {
          let _0x53277f = this.getIntersectingCodeBlockIDs(key.startLine, key.endLine, false, _0x28cf5f);
          for (let _0x54c027 of _0x53277f.values()) {
            let _0x2f5587 = this.codeBlocks.get(_0x54c027);
            _0x44498c.set(_0x54c027, _0x2f5587);
          }
        }
        return _0x44498c;
      }
      ["codeBlocksToInfoBlocks"](_0x1071f3) {
        let _0x4b1f80 = [],
          _0x1e2a65 = -1;
        for (let _0x53c2d1 = 0; _0x53c2d1 < this.lineToBlock.length; _0x53c2d1++) {
          let _0x5388f2 = this.lineToBlock[_0x53c2d1];
          if (_0x5388f2.blockID !== INVALID_BLOCK_ID && _0x1071f3.has(_0x5388f2.blockID)) {
            if (_0x1e2a65 === -1 && (_0x1e2a65 = _0x53c2d1), _0x53c2d1 === this.lineToBlock.length - 1 || _0x5388f2.blockID !== this.lineToBlock[_0x53c2d1 + 1].blockID) {
              let _0xb2d597 = LineRange.fromEndLine(_0x1e2a65, _0x53c2d1),
                _0x2d56d2 = _0x1071f3.get(_0x5388f2.blockID);
              !_0x2d56d2 && !_0x5388f2.isTrivial && Logger.debug('a non-trivial codeblock with no codeBlockCache mapping encountered'), _0x4b1f80.push({
                range: _0xb2d597,
                codeBlock: _0x2d56d2
              }), _0x1e2a65 = -1;
            }
          } else _0x1e2a65 = -1;
        }
        return _0x4b1f80;
      }
      ["getIntersectingCodeBlockIDs"](_0x1501ad, _0x375d50, _0x1b820a, _0xf2654f) {
        let _0x47485c = new Set();
        for (let _0x1c2b9c = _0x1501ad; _0x1c2b9c < this.lineToBlock.length && _0x1c2b9c <= _0x375d50; _0x1c2b9c++) {
          let _0x5401ce = this.lineToBlock[_0x1c2b9c];
          _0x5401ce.blockID !== INVALID_BLOCK_ID && (_0xf2654f || _0x5401ce.isTrivial === false) && _0x47485c.add(_0x5401ce.blockID);
        }
        let _0x4a4a02 = () => {
            let _0x4132d9 = this.lineToBlock[_0x1501ad],
              _0x1352fa = _0x1501ad - 1;
            if (!(_0x1352fa >= 0 && this.lineToBlock[_0x1352fa] === _0x4132d9 && _0x4132d9.blockID !== INVALID_BLOCK_ID)) {
              for (; _0x1352fa >= 0 && this.lineToBlock[_0x1352fa].blockID === INVALID_BLOCK_ID; _0x1352fa--);
              if (_0x1352fa >= 0) {
                let _0x4491ef = this.lineToBlock[_0x1352fa];
                _0x47485c.add(_0x4491ef.blockID);
              }
            }
          },
          _0x5c6b25 = () => {
            let _0x456e66 = this.lineToBlock[_0x375d50],
              _0x6f5079 = _0x375d50 + 1;
            if (!(_0x6f5079 < this.lineToBlock.length && this.lineToBlock[_0x6f5079] === _0x456e66 && _0x456e66.blockID !== INVALID_BLOCK_ID)) {
              for (; _0x6f5079 < this.lineToBlock.length && this.lineToBlock[_0x6f5079].blockID === INVALID_BLOCK_ID; _0x6f5079++);
              if (_0x375d50 < this.lineToBlock.length) {
                let _0x12f6c4 = this.lineToBlock[_0x375d50];
                _0x47485c.add(_0x12f6c4.blockID);
              }
            }
          };
        return _0x1b820a && (_0x4a4a02(), _0x5c6b25()), _0x47485c;
      }
      ['findInvalidRange'](_0x20eb02, _0x4db016, _0x4d3e96) {
        let _0x1c15ba = _0x20eb02;
        for (let _0x39a3d8 = _0x20eb02; _0x39a3d8 >= 0 && _0x4d3e96[_0x39a3d8].blockID === INVALID_BLOCK_ID; _0x39a3d8--) _0x1c15ba = _0x39a3d8;
        let _0x3c5f90 = _0x4db016;
        for (let _0x5035a6 = _0x4db016; _0x5035a6 < _0x4d3e96.length && _0x4d3e96[_0x5035a6].blockID === INVALID_BLOCK_ID; _0x5035a6++) _0x3c5f90 = _0x5035a6;
        return {
          decomposeStartLine: _0x1c15ba,
          decomposeEndLine: _0x3c5f90
        };
      }
      ["insertCodeBlocks"](_0x5ec76c, _0x3b3859) {
        mergeOverlappingLineRanges(_0x5ec76c.map(_0x4eed8e => LineRange.fromCount(_0x4eed8e.startLine, _0x4eed8e.count))).forEach(_0x4cd2de => {
          let _0x1d3b7a = {
              codeBlockContent: _0x3b3859.slice(_0x4cd2de.startLine, _0x4cd2de.endLine + 1).join('\x0a')
            },
            _0x4b2b5e = this.codeBlockCounter++;
          this.codeBlocks.set(_0x4b2b5e, _0x1d3b7a);
          for (let _0x406a7a = _0x4cd2de.startLine; _0x406a7a <= _0x4cd2de.endLine; _0x406a7a++) this.lineToBlock[_0x406a7a] = {
            blockID: _0x4b2b5e,
            isTrivial: false
          };
        });
        let _0x7d9185 = _0xaee13f => _0xaee13f.blockID !== INVALID_BLOCK_ID && !_0xaee13f.isTrivial,
          _0x31b3c0 = () => {
            let _0x4db9e5 = this.codeBlockCounter++,
              _0xd3287d = {
                blockID: _0x4db9e5,
                isTrivial: true
              };
            this.lineToBlock.fill(_0xd3287d, _0x1df47c, _0x28f2cb + 1);
            let _0x15a3e2 = _0x3b3859.slice(_0x1df47c, _0x28f2cb + 1).join('\x0a');
            this.codeBlocks.set(_0x4db9e5, {
              codeBlockContent: _0x15a3e2
            }), _0x510c07 = false;
          },
          _0x1df47c = -1,
          _0x28f2cb = -1,
          _0x510c07 = false;
        for (let _0x2ce0f9 = 0; _0x2ce0f9 < this.lineToBlock.length; _0x2ce0f9++) {
          let _0x312e6e = this.lineToBlock[_0x2ce0f9];
          _0x7d9185(_0x312e6e) ? _0x510c07 && _0x31b3c0() : (_0x510c07 || (_0x1df47c = _0x2ce0f9, _0x510c07 = true), _0x28f2cb = _0x2ce0f9);
        }
        _0x510c07 && _0x31b3c0();
      }
      ['getFullFileAtLastParse']() {
        return this.fullFileAtLastParse;
      }
      ["acquireMutex"]() {
        return this.mutex.acquire();
      }
      ['setFullFileAtLastParse'](_0x7d1939) {
        this.fullFileAtLastParse = _0x7d1939;
      }
    };
  }),
  TreeSitterFileParser,
  initTreeSitterParser = __esmModule(() => {
    'use strict';

    initDocumentManager(), initStatusBar(), initCodeBlockCache(), TreeSitterFileParser = class {
      constructor(uri, grammarFileName) {
        this.initMutex = new Mutex(), this.treeSitterCache = new lru_map_module.LRUMap(100), this.analyzedBlocks = new lru_map_module.LRUMap(200), this.uri = uri, this.grammarFileName = grammarFileName;
      }
      async ["parseFile"](filePath, content) {
        try {
          let tree = (await this.getParser()).parse(content, this.treeSitterCache.get(filePath));
          return this.treeSitterCache.set(filePath, tree), tree;
        } catch (_0x413820) {
          throw new Error('Error parsing source code: ' + _0x413820);
        }
      }
      async ["getUpdatedDecomposedSnippets"](content, uri) {
        let tree = await this.parseFile(uri.fsPath, content),
          codeBlocks = this.allCodeBlocks(tree.rootNode),
          ranges = [];
        for (let key of codeBlocks) ranges.push(LineRange.fromCount(key.startLine, key.count));
        return ranges;
      }
      static ["getBlacklistedLanguages"]() {
        return ["code-text-binary", 'Log', "log", 'diff', "git-commit", 'git-rebase', 'search-result', 'dotenv', "code-referencing", 'go.mod', "go.work", 'go.sum', "raw"];
      }
      async ["reloadTreeSitterCache"](changeEvent) {
        let {
            document: document,
            contentChanges: contentChanges
          } = changeEvent,
          fullText = document.getText(),
          cachedTree = this.treeSitterCache.get(document.uri.fsPath);
        if (cachedTree) {
          Logger.debug('Reloading cache for ' + document.uri.fsPath);
          for (let key of contentChanges) {
            let startOffset = key.rangeOffset,
              oldEndOffset = key.rangeOffset + key.rangeLength,
              newEndOffset = key.rangeOffset + key.text.length,
              startPosition = document.positionAt(startOffset),
              oldEndPosition = document.positionAt(oldEndOffset),
              newEndPosition = document.positionAt(newEndOffset),
              startPoint = this.asPoint(startPosition),
              oldEndPoint = this.asPoint(oldEndPosition),
              newEndPoint = this.asPoint(newEndPosition);
            cachedTree.edit({
              startIndex: startOffset,
              oldEndIndex: oldEndOffset,
              newEndIndex: newEndOffset,
              startPosition: startPoint,
              oldEndPosition: oldEndPoint,
              newEndPosition: newEndPoint
            });
          }
          try {
            let newTree = (await this.getParser()).parse(fullText, cachedTree);
            this.treeSitterCache.set(document.uri.fsPath, newTree);
          } catch (_0x5403d) {
            Logger.warn("Error reloading cache", _0x5403d);
          }
        }
      }
      ["asPoint"](position) {
        return {
          row: position.line,
          column: position.character
        };
      }
      async ['getParser']() {
        let release = await this.initMutex.acquire();
        try {
          if (this.parser) return this.parser;
          let wasmDir = vscode_module.Uri.joinPath(this.uri, "out", 'tree-sitter-wasm');
          return await tree_sitter_module.init({
            locateFile(filename, prefix) {
              return filename.endsWith(".wasm") ? path_module.join(wasmDir.fsPath, filename) : prefix + filename;
            }
          }).then(async () => {
            let grammarPath = vscode_module.Uri.joinPath(wasmDir, this.grammarFileName).fsPath,
              language = await tree_sitter_module.Language.load(grammarPath);
            try {
              return this.parser = new tree_sitter_module(), this.parser.setLanguage(language), this.parser;
            } catch (_0x5d05b2) {
              throw new Error('Error initializing parser: ' + _0x5d05b2);
            }
          }).catch(_0x45e4db => {
            throw new Error('Error initializing parser: ' + _0x45e4db);
          });
        } finally {
          release();
        }
      }
      async ["decomposeFileContent"](_0x4ad5e9, _0xfdb72f) {
        let _0x4605da = this.getOrCreateFileCache(_0x4ad5e9),
          _0x3a876e = await _0x4605da.acquireMutex();
        try {
          if (_0xfdb72f === _0x4605da.getFullFileAtLastParse()) return _0x4605da;
          let _0x43597d = await WorkerPoolManager.exec("diff-utils.cjs", 'getChanges', [_0x4605da.getFullFileAtLastParse(), _0xfdb72f]),
            _0x549cea = _0x4605da.syncCache(_0x43597d, _0xfdb72f),
            _0xa14fc0 = await this.getUpdatedDecomposedSnippets(_0xfdb72f, _0x4ad5e9);
          _0x4605da.updateFileAndBlocks(_0xfdb72f, _0xa14fc0, _0x549cea.updatedLineToBlock, _0x549cea.codeBlockIDsToInvalidate);
        } finally {
          _0x3a876e();
        }
        return _0x4605da;
      }
      ["getOrCreateFileCache"](_0x5e8327) {
        let _0x58a496 = _0x5e8327.fsPath,
          _0x56a9b0 = this.analyzedBlocks.get(_0x58a496);
        return _0x56a9b0 || (_0x56a9b0 = new CodeBlockCache(), this.analyzedBlocks.set(_0x5e8327.fsPath, _0x56a9b0)), _0x56a9b0;
      }
      async ['getSnippetAtLineFromFile'](_0x524606, _0x5548c7, _0x5be2b6) {
        let _0x6f2693 = vscode_module.Uri.file(_0x524606),
          _0x3ba092 = {
            absolutePath: _0x524606,
            isDirectory: false
          },
          _0x36c476 = await this.decomposeFileContent(_0x6f2693, _0x5548c7),
          _0x1bf168 = _0x36c476.getCodeBlocks(true, [_0x5be2b6]),
          _0x1af670 = _0x36c476.codeBlocksToInfoBlocks(_0x1bf168);
        if (!_0x1af670.length) throw new FileCacheBadStateError('No code blocks found for range ' + _0x5be2b6.toString() + " in file " + _0x524606);
        let _0x7e6952, _0x405d7f;
        for (let key of _0x1af670) (_0x7e6952 === void 0 || key.range.startLine < _0x7e6952) && (_0x7e6952 = key.range.startLine), (_0x405d7f === void 0 || key.range.endLine > _0x405d7f) && (_0x405d7f = key.range.endLine);
        if (_0x7e6952 === void 0 || _0x405d7f === void 0) throw new FileCacheBadStateError('No valid lines found in file cache');
        return createCodeSnippetFromRange(_0x3ba092, _0x5548c7, {
          line: _0x7e6952
        }, {
          line: _0x405d7f
        });
      }
      async ["getSnippetContextsFromLocalSymbol"](_0x84ee3c) {
        let _0x3a516f = vscode_module.Uri.file(_0x84ee3c.filePath.absPath),
          _0x3a3293 = await In.getSourceCode(_0x3a516f.fsPath),
          _0x378688 = await this.getSnippetAtLineFromFile(_0x84ee3c.filePath.absPath, _0x3a3293, LineRange.fromEndLine(_0x84ee3c.range.startLine, _0x84ee3c.range.endLine));
        return {
          path: _0x84ee3c.filePath.proto,
          content: _0x378688.content,
          range: LineRange.fromEndLine(_0x84ee3c.range.startLine, _0x84ee3c.range.endLine),
          diagnostics: []
        };
      }
    };
  });
function hasTreeSitterError(_0x12f21e) {
  if (_0x12f21e.isError) return true;
  let _0x1e676b = _0x12f21e.walk(),
    _0x571e28 = _0x1e676b.gotoFirstChild();
  for (; _0x571e28;) {
    let _0x472736 = _0x1e676b.currentNode;
    if (_0x472736.isError || _0x472736.childCount > 0 && hasTreeSitterError(_0x472736)) return true;
    _0x571e28 = _0x1e676b.gotoNextSibling();
  }
  return false;
}
function createLineRangeFromTreeNode(_0x27680e) {
  if (hasTreeSitterError(_0x27680e)) {
    Logger.warn('There are some errors in the node ' + _0x27680e.type + ". Skipping it.");
    return;
  }
  return LineRange.fromEndLine(_0x27680e.startPosition.row, _0x27680e.endPosition.row);
}
var initParserBase = __esmModule(() => {
    'use strict';
  }),
  MT,
  initGoParser = __esmModule(() => {
    'use strict';

    initLanguageParsers(), initTreeSitterParser(), initParserBase(), MT = class _0x1b3373 extends TreeSitterFileParser {
      constructor(_0x4ec59a) {
        super(_0x4ec59a, "tree-sitter-go.wasm");
      }
      ["allCodeBlocks"](_0xd824e3) {
        let _0x4d1b2f = [],
          _0x2ee2b4 = [];
        if (_0xd824e3.isError) return Logger.warn("There are some errors in the node " + _0xd824e3.type + '. Skipping it.'), _0x4d1b2f;
        let _0x9f3633 = _0xd824e3.walk(),
          _0x5441ea = _0x9f3633.gotoFirstChild();
        for (; _0x5441ea;) {
          let _0x4ac0d1 = _0x9f3633.currentNode;
          if (_0x4ac0d1.type.includes('import_') || _0x4ac0d1.type === "comment" || _0x4ac0d1.type.includes('package_') || _0x4ac0d1.type.trim() === '') {
            _0x5441ea = _0x9f3633.gotoNextSibling();
            continue;
          }
          if (_0x4ac0d1.type === "function_declaration" || _0x4ac0d1.type === "method_declaration") {
            _0x2ee2b4.length > 0 && (_0x4d1b2f.push(mergeLineRanges(_0x2ee2b4)), _0x2ee2b4 = []);
            let _0x3b63a6 = createLineRangeFromTreeNode(_0x4ac0d1);
            _0x3b63a6 && _0x4d1b2f.push(_0x3b63a6);
          } else {
            let _0xbeb159 = createLineRangeFromTreeNode(_0x4ac0d1);
            _0xbeb159 && _0x2ee2b4.push(_0xbeb159);
          }
          _0x5441ea = _0x9f3633.gotoNextSibling();
        }
        return _0x2ee2b4.length > 0 && _0x4d1b2f.push(mergeLineRanges(_0x2ee2b4)), _0x4d1b2f;
      }
      static ['getInstance'](_0x5db06a) {
        if (!_0x1b3373.instance) {
          if (!_0x5db06a) throw new Error("Base URI is not provided");
          _0x1b3373.instance = new _0x1b3373(_0x5db06a);
        }
        return _0x1b3373.instance;
      }
    };
  }),
  DT,
  initJavaScriptParser = __esmModule(() => {
    'use strict';

    initLanguageParsers(), initTreeSitterParser(), initParserBase(), DT = class _0x800683 extends TreeSitterFileParser {
      constructor(_0xceea01) {
        super(_0xceea01, 'tree-sitter-javascript.wasm');
      }
      ['checkIfNodeIsRequire'](_0x5da926) {
        if (_0x5da926.type === "call_expression") {
          let _0x399ef0 = _0x5da926.firstChild;
          if (_0x399ef0 && _0x399ef0.type === 'identifier') return _0x399ef0.text === 'require';
        }
        if (_0x5da926.namedChildren.length > 0) {
          for (let key of _0x5da926.namedChildren) if (this.checkIfNodeIsRequire(key)) return true;
        }
        return false;
      }
      ['checkIfModuleExports'](_0x153caf) {
        if (_0x153caf.type === 'property_identifier' && _0x153caf.text === "exports" && _0x153caf.parent) {
          let _0x39340a = _0x153caf.parent;
          if (_0x39340a.type === 'member_expression' && _0x39340a.text === "module.exports") return true;
        }
        if (_0x153caf.namedChildren.length > 0) {
          for (let key of _0x153caf.namedChildren) if (this.checkIfModuleExports(key)) return true;
        }
        return false;
      }
      ['allCodeBlocks'](_0x4247da) {
        let _0x5a8744 = [],
          _0x1ccc37 = [];
        if (_0x4247da.isError) return Logger.warn('There are some errors in the node ' + _0x4247da.type + '. Skipping it.'), _0x5a8744;
        let _0x198a10 = _0x4247da.walk(),
          _0x204f56 = _0x198a10.gotoFirstChild();
        for (; _0x204f56;) {
          let _0x2b61aa = _0x198a10.currentNode;
          if (_0x2b61aa.type.includes('import') || _0x2b61aa.type.includes('comment')) {
            _0x204f56 = _0x198a10.gotoNextSibling();
            continue;
          }
          if (_0x2b61aa.type === 'export_statement' || _0x2b61aa.type === "export" || _0x2b61aa.type === "class_body") {
            if (_0x2b61aa.children.some(_0x2ff4c5 => _0x2ff4c5.type === 'default')) {
              _0x204f56 = _0x198a10.gotoNextSibling();
              continue;
            }
            _0x1ccc37.length > 0 && (_0x5a8744.push(mergeLineRanges(_0x1ccc37)), _0x1ccc37 = []);
            let _0xc6fd3a = this.allCodeBlocks(_0x2b61aa);
            _0x5a8744.push(..._0xc6fd3a);
          } else {
            if (_0x2b61aa.type === 'method_definition' || _0x2b61aa.type === 'function_declaration' || _0x2b61aa.type === "function_expression" || _0x2b61aa.type === "class_declaration" || _0x2b61aa.type === 'generator_function' || _0x2b61aa.type === "generator_function_declaration") {
              if (_0x1ccc37.length > 0 && (_0x5a8744.push(mergeLineRanges(_0x1ccc37)), _0x1ccc37 = []), _0x2b61aa.type === 'function_declaration' || _0x2b61aa.type === "method_definition" || _0x2b61aa.type === "function_expression" || _0x2b61aa.type === "generator_function" || _0x2b61aa.type === 'generator_function_declaration') {
                let _0x483655 = createLineRangeFromTreeNode(_0x2b61aa);
                _0x483655 && _0x5a8744.push(_0x483655);
              } else {
                let _0x31f510 = this.allCodeBlocks(_0x2b61aa);
                _0x5a8744.push(..._0x31f510);
              }
            } else {
              if (_0x2b61aa.parent?.['type'] !== "class_declaration") {
                if (this.checkIfNodeIsRequire(_0x2b61aa) || this.checkIfModuleExports(_0x2b61aa)) {
                  _0x204f56 = _0x198a10.gotoNextSibling();
                  continue;
                }
                let _0x4772a4 = createLineRangeFromTreeNode(_0x2b61aa);
                _0x4772a4 && _0x1ccc37.push(_0x4772a4);
              }
            }
          }
          _0x204f56 = _0x198a10.gotoNextSibling();
        }
        return _0x1ccc37.length > 0 && _0x5a8744.push(mergeLineRanges(_0x1ccc37)), _0x5a8744;
      }
      static ["getInstance"](_0x209e24) {
        if (!_0x800683.instance) {
          if (!_0x209e24) throw new Error('Base URI is not provided');
          _0x800683.instance = new _0x800683(_0x209e24);
        }
        return _0x800683.instance;
      }
      ["getParentTypeExclusionList"]() {
        return ["required_parameter", 'optional_parameter'];
      }
      ["getPreviousSiblingInclusionList"]() {
        return ['identifier', "property_identifier", '.', 'this', 'super'];
      }
    };
  }),
  Cg,
  initPythonParser = __esmModule(() => {
    'use strict';

    initLanguageParsers(), initTreeSitterParser(), initParserBase(), Cg = class _0x47a743 extends TreeSitterFileParser {
      static {
        this.fileExtensions = ['py', 'pyw'];
      }
      constructor(_0x1cb8a8) {
        super(_0x1cb8a8, 'tree-sitter-python.wasm');
      }
      ['allCodeBlocks'](_0x263a66) {
        let _0x48941f = [],
          _0x2967b3 = [];
        if (_0x263a66.isError) return Logger.warn('There are some errors in the node ' + _0x263a66.type + ". Skipping it."), _0x48941f;
        let _0x292b21 = _0x263a66.walk(),
          _0x3d20d5 = _0x292b21.gotoFirstChild();
        for (; _0x3d20d5;) {
          let _0x5ed80b = _0x292b21.currentNode;
          if (_0x5ed80b.type.includes('import_') || _0x5ed80b.type === "comment" || _0x5ed80b.type.trim() === '' || _0x5ed80b.type === "expression_statement" && (_0x5ed80b.text.trim().startsWith('\x22\x22\x22') || _0x5ed80b.text.trim().startsWith('\x27\x27\x27'))) {
            _0x3d20d5 = _0x292b21.gotoNextSibling();
            continue;
          }
          if (_0x5ed80b.type === "block") {
            let _0x492909 = this.allCodeBlocks(_0x5ed80b);
            _0x48941f.push(..._0x492909);
          } else {
            if (_0x5ed80b.type === "class_definition" || _0x5ed80b.type === "function_definition" || _0x5ed80b.type === "decorated_definition") {
              if (_0x2967b3.length > 0 && (_0x48941f.push(mergeLineRanges(_0x2967b3)), _0x2967b3 = []), _0x5ed80b.type === "function_definition" || _0x5ed80b.type === 'decorated_definition' && _0x5ed80b.namedChildren.map(_0x584b82 => _0x584b82.type).includes("function_definition")) {
                Logger.debug('Found function snippet');
                let _0x24ab82 = createLineRangeFromTreeNode(_0x5ed80b);
                _0x24ab82 && _0x48941f.push(_0x24ab82);
              } else {
                Logger.debug("Found class snippet or decorated definition for class snippet");
                let _0x1f8b52 = this.allCodeBlocks(_0x5ed80b);
                _0x48941f.push(..._0x1f8b52);
              }
            } else {
              if (_0x5ed80b.parent?.["type"] !== "class_definition") {
                let _0x1b5b23 = createLineRangeFromTreeNode(_0x5ed80b);
                _0x1b5b23 && _0x2967b3.push(_0x1b5b23);
              }
            }
          }
          _0x3d20d5 = _0x292b21.gotoNextSibling();
        }
        return _0x2967b3.length > 0 && _0x48941f.push(mergeLineRanges(_0x2967b3)), _0x48941f;
      }
      static ["getInstance"](_0x536c89) {
        if (!_0x47a743.instance) {
          if (!_0x536c89) throw new Error('Base URI is not provided');
          _0x47a743.instance = new _0x47a743(_0x536c89);
        }
        return _0x47a743.instance;
      }
    };
  }),
  NT,
  initRustParser = __esmModule(() => {
    'use strict';

    initLanguageParsers(), initTreeSitterParser(), initParserBase(), NT = class _0x26957b extends TreeSitterFileParser {
      constructor(_0x327978) {
        super(_0x327978, "tree-sitter-rust.wasm");
      }
      ['allCodeBlocks'](_0x3e8a4d) {
        let _0x463e83 = [],
          _0x2f3403 = [];
        if (_0x3e8a4d.isError) return Logger.warn('There are some errors in the node ' + _0x3e8a4d.type + '. Skipping it.'), _0x463e83;
        let _0x40455b = _0x3e8a4d.walk(),
          _0x2e9d01 = _0x40455b.gotoFirstChild();
        for (; _0x2e9d01;) {
          let _0x3b898a = _0x40455b.currentNode;
          if (_0x3b898a.type.includes('shebang') || _0x3b898a.type.includes("extern_crate_declaration") || _0x3b898a.type.includes("use_as_clause") || _0x3b898a.type.includes('use_declaration') || _0x3b898a.type.includes('line_comment') || _0x3b898a.type.includes("block_comment") || _0x3b898a.type.includes("attribute_item") || _0x3b898a.type === '{' || _0x3b898a.type === '}' || _0x3b898a.type.trim() === '') {
            _0x2e9d01 = _0x40455b.gotoNextSibling();
            continue;
          }
          if (_0x3b898a.type === "declaration_list") {
            let _0x457169 = this.allCodeBlocks(_0x3b898a);
            _0x463e83.push(..._0x457169);
          } else {
            if (_0x3b898a.type === 'function_item') {
              _0x2f3403.length > 0 && (_0x463e83.push(mergeLineRanges(_0x2f3403)), _0x2f3403 = []);
              let _0xa8309b = createLineRangeFromTreeNode(_0x3b898a);
              _0xa8309b && _0x463e83.push(_0xa8309b);
            } else {
              if (_0x3b898a.type === "mod_item" || _0x3b898a.type === "impl_item" || _0x3b898a.type === "trait_item") {
                let _0x23ec47 = _0x3b898a.namedChildren.find(_0x3b4c66 => _0x3b4c66.type === "declaration_list");
                if (_0x23ec47) {
                  let _0x390fb7 = this.allCodeBlocks(_0x23ec47);
                  _0x463e83.push(..._0x390fb7);
                }
                _0x2e9d01 = _0x40455b.gotoNextSibling();
                continue;
              } else {
                let _0x12e0c3 = createLineRangeFromTreeNode(_0x3b898a);
                _0x12e0c3 && _0x2f3403.push(_0x12e0c3);
              }
            }
          }
          _0x2e9d01 = _0x40455b.gotoNextSibling();
        }
        return _0x2f3403.length > 0 && _0x463e83.push(mergeLineRanges(_0x2f3403)), _0x463e83;
      }
      static ["getInstance"](_0x2d045c) {
        if (!_0x26957b.instance) {
          if (!_0x2d045c) throw new Error('Base URI is not provided');
          _0x26957b.instance = new _0x26957b(_0x2d045c);
        }
        return _0x26957b.instance;
      }
    };
  }),
  hh,
  initTypeScriptParser = __esmModule(() => {
    'use strict';

    initLanguageParsers(), initTreeSitterParser(), initParserBase(), hh = class _0x3507b7 extends TreeSitterFileParser {
      constructor(_0x545b0c, _0x13a498 = 'tree-sitter-typescript.wasm') {
        super(_0x545b0c, _0x13a498);
      }
      ["allCodeBlocks"](_0x5959dd) {
        let _0x3305c3 = [],
          _0x5878a4 = [];
        if (_0x5959dd.isError) return Logger.warn("There are some errors in the node " + _0x5959dd.type + ". Skipping it."), _0x3305c3;
        let _0x2678fd = _0x5959dd.walk(),
          _0x5be2d1 = _0x2678fd.gotoFirstChild();
        for (; _0x5be2d1;) {
          let _0x2ad395 = _0x2678fd.currentNode;
          if (_0x2ad395.type.includes("import") || _0x2ad395.type.includes('comment') || _0x2ad395.type === '{' || _0x2ad395.type === '}') {
            _0x5be2d1 = _0x2678fd.gotoNextSibling();
            continue;
          }
          if (_0x2ad395.type === 'export_statement' || _0x2ad395.type === "export" || _0x2ad395.type === 'class_body') {
            _0x5878a4.length > 0 && (_0x3305c3.push(mergeLineRanges(_0x5878a4)), _0x5878a4 = []);
            let _0x375ec9 = this.allCodeBlocks(_0x2ad395);
            _0x3305c3.push(..._0x375ec9);
          } else {
            if (_0x2ad395.type === 'method_definition' || _0x2ad395.type === 'function_declaration' || _0x2ad395.type === 'function_expression' || _0x2ad395.type === 'class_declaration' || _0x2ad395.type === "abstract_class_declaration" || _0x2ad395.type === 'generator_function' || _0x2ad395.type === "generator_function_declaration") {
              if (_0x5878a4.length > 0 && (_0x3305c3.push(mergeLineRanges(_0x5878a4)), _0x5878a4 = []), _0x2ad395.type === 'function_declaration' || _0x2ad395.type === "method_definition" || _0x2ad395.type === "function_expression" || _0x2ad395.type === "generator_function" || _0x2ad395.type === "generator_function_declaration") {
                let _0x5db0d0 = createLineRangeFromTreeNode(_0x2ad395);
                _0x5db0d0 && _0x3305c3.push(_0x5db0d0);
              } else {
                let _0x582a6d = this.allCodeBlocks(_0x2ad395);
                _0x3305c3.push(..._0x582a6d);
              }
            } else {
              if (_0x2ad395.parent?.["type"] !== 'class_declaration' && _0x2ad395.parent?.["type"] !== "abstract_class_declaration") {
                Logger.debug("Found non-function snippet, type", _0x2ad395.type);
                let _0x26bcff = createLineRangeFromTreeNode(_0x2ad395);
                _0x26bcff && _0x5878a4.push(_0x26bcff);
              }
            }
          }
          _0x5be2d1 = _0x2678fd.gotoNextSibling();
        }
        return _0x5878a4.length > 0 && _0x3305c3.push(mergeLineRanges(_0x5878a4)), _0x3305c3;
      }
      static ["getInstance"](_0x893408) {
        if (!_0x3507b7.instance) {
          if (!_0x893408) throw new Error("Base URI is not provided");
          _0x3507b7.instance = new _0x3507b7(_0x893408);
        }
        return _0x3507b7.instance;
      }
    };
  }),
  LT,
  initTypeScriptParserExports = __esmModule(() => {
    'use strict';

    initTypeScriptParser(), LT = class _0x36a311 extends hh {
      constructor(_0x10eecc) {
        super(_0x10eecc, 'tree-sitter-typescript-jsx.wasm');
      }
      static ["getInstance"](_0x5a8b43) {
        if (!_0x36a311.instance) {
          if (!_0x5a8b43) throw new Error("Base URI is not provided");
          _0x36a311.instance = new _0x36a311(_0x5a8b43);
        }
        return _0x36a311.instance;
      }
    };
  });
function getParserForLanguage(_0x4fd726, _0x11c195) {
  switch (_0x4fd726) {
    case 'python':
      {
        let _0x542d2a = _0x11c195.split('.').pop();
        if (_0x542d2a && Cg.fileExtensions.includes(_0x542d2a)) return Cg.getInstance();
        break;
      }
    case "typescript":
      return hh.getInstance();
    case 'typescriptreact':
      return LT.getInstance();
    case 'javascript':
      return DT.getInstance();
    case 'go':
      return MT.getInstance();
    case "rust":
      return NT.getInstance();
  }
  return SnippetContextProvider.getInstance();
}
function mergeLineRanges(_0x80c5a2) {
  if (_0x80c5a2.length === 0) return LineRange.fromEndLine(0, 0);
  let _0x1174bb = _0x80c5a2[0].startLine,
    _0x46fe17 = _0x80c5a2[_0x80c5a2.length - 1].startLine - _0x80c5a2[0].startLine + _0x80c5a2[_0x80c5a2.length - 1].count;
  return LineRange.fromCount(_0x1174bb, _0x46fe17);
}
var initLanguageParsers = __esmModule(() => {
  'use strict';

  initSnippetContextProvider(), initGoParser(), initJavaScriptParser(), initPythonParser(), initRustParser(), initTypeScriptParserExports(), initTypeScriptParser();
});
async function handleFindSymbolReferencesRequest(_0x50845c) {
  let {
      filePath: _0x4af665,
      lineNumber: _0x3e0132,
      lineText: _0xb6b7c2,
      word: _0x1ff2e2,
      type: _0x36cbef
    } = _0x50845c,
    _0x2358b1 = _0x3e0132 - 1;
  return findSymbolReferencesInFile(_0x4af665, _0x2358b1, _0xb6b7c2, _0x1ff2e2, _0x36cbef);
}
async function findSymbolReferencesInFile(_0x349e72, _0x1ad2d6, _0x3d75d2, _0x5c2f09, _0xa9dde0) {
  let _0x2e656c = TraycerPath.fromPathProto(_0x349e72),
    _0x3d7763 = await In.getTextDocument(_0x2e656c.absPath),
    _0xe0cb70 = findFuzzyTextPosition(_0x3d7763.getText(), _0x1ad2d6, _0x3d75d2, _0x5c2f09),
    _0x41cfc4;
  switch (_0xa9dde0) {
    case WO.DEFINITION:
      {
        let _0x560bc4 = await enqueueDefinitionRequest({
          filePath: _0x2e656c,
          character: _0xe0cb70.character,
          line: _0xe0cb70.lineNumber
        }, _0x3d7763.languageId);
        _0x560bc4 && (_0x41cfc4 = [_0x560bc4]);
        break;
      }
    case WO.REFERENCE:
      {
        _0x41cfc4 = await enqueueReferenceRequest({
          filePath: _0x2e656c,
          character: _0xe0cb70.character,
          line: _0xe0cb70.lineNumber
        }, void 0, _0x3d7763.languageId);
        break;
      }
    case WO.IMPLEMENTATION:
      {
        _0x41cfc4 = await enqueueImplementationRequest({
          filePath: _0x2e656c,
          character: _0xe0cb70.character,
          line: _0xe0cb70.lineNumber
        }, _0x3d7763.languageId);
        break;
      }
  }
  if (!_0x41cfc4?.['length']) return {
    matchingFileSnippets: []
  };
  let _0x166df1 = [];
  for (let key of _0x41cfc4) {
    let _0xe931 = await In.getTextDocument(key.filePath.absPath),
      _0x2201ac = getParserForLanguage(_0xe931.languageId, key.filePath.absPath);
    _0x166df1.push(_0x2201ac.getSnippetContextsFromLocalSymbol(key));
  }
  let _0x2b36e = (await Promise.allSettled(_0x166df1)).map(_0x2deb77 => {
    if (_0x2deb77.status === "fulfilled") return _0x2deb77.value;
    Logger.warn('Error while preparing reference search response', _0x2deb77.reason);
  }).filter(_0x157a1a => !!_0x157a1a);
  return {
    matchingFileSnippets: distributeItemsAcrossGroups(_0x323463 => TraycerPath.fromPathProto(_0x323463).absPath, _0x2b36e, 50)
  };
}
var initFileReadModule = __esmModule(() => {
  'use strict';

  initFileCache(), initDirCache(), initSymbolCache(), initDocumentManager(), initLanguageParsers();
});
async function handleReadFilesRequest(_0x264761) {
  if (!_0x264761.fileRequests.length) throw new Error("Need at least one file path to read");
  return readMultipleFilesWithMetadata(_0x264761.fileRequests);
}
async function readMultipleFilesWithMetadata(_0x9a3d1e) {
  let _0x305b2b = _0x9a3d1e.map(async _0x5cc73c => {
      if (!_0x5cc73c.path) throw new Error('File path is required');
      let _0x13326d = TraycerPath.fromPathProto(_0x5cc73c.path),
        _0x91e1dd = _0x13326d.absPath;
      if (await workspace_info.getInstance().fileExists(_0x91e1dd)) {
        let _0xa10ee4 = await In.getSourceCode(_0x91e1dd),
          _0x4c4a45 = await (await LlmCacheHandler.getInstance()).getSummaryFromCache(_0x91e1dd, _0xa10ee4),
          _0x5af019 = config.enableAgentsMd ? await getAgentsMdContent(_0x91e1dd) : [];
        return {
          path: _0x5cc73c.path,
          content: _0xa10ee4,
          summary: _0x4c4a45,
          diagnostics: _0x5cc73c.includeDiagnostics ? (await getDiagnosticsForFile(_0x5cc73c.path, void 0)).diagnostics : [],
          customInstructions: _0x5af019
        };
      } else return createFileNotFoundResponse(_0x13326d);
    }),
    _0x1e9b39 = await Promise.all(_0x305b2b),
    _0x10ef75 = new CustomSet((_0x1669bc, _0x96b695) => TraycerPath.equals(TraycerPath.fromPathProto(_0x1669bc.path), TraycerPath.fromPathProto(_0x96b695.path)));
  return _0x1e9b39.forEach(_0x2466b6 => {
    _0x2466b6.customInstructions && _0x2466b6.customInstructions.forEach(_0x326fc5 => {
      _0x10ef75.add(_0x326fc5);
    });
  }), {
    fileContents: _0x1e9b39.map(_0x2da548 => ({
      content: _0x2da548.content,
      path: _0x2da548.path,
      range: null,
      diagnostics: _0x2da548.diagnostics,
      summary: _0x2da548.summary
    })),
    detectedRuleFiles: _0x10ef75.values()
  };
}
async function createFileNotFoundResponse(_0x1475ef) {
  let _0xe12f56 = await searchFilesWithRipgrep(_0x1475ef.workspacePath, '', void 0, null, void 0, true),
    _0x2bb7e7 = (0, fuzzysort_module.go)(_0x1475ef.relPath, _0xe12f56.split('\x0a'), {
      limit: 5,
      threshold: 0.1
    }),
    _0x2218d3 = _0x2bb7e7.length > 0 ? " Did you mean: " + _0x2bb7e7.map(_0x5854d9 => _0x5854d9.target).join(', ') + '?' : ' No similar files found.';
  return {
    path: _0x1475ef.proto,
    content: 'File not found at path: ' + _0x1475ef.relPath + '. ' + _0x2218d3,
    summary: '',
    diagnostics: [],
    customInstructions: []
  };
}
var initFileReadHandler = __esmModule(() => {
  'use strict';

  initSearchUtils(), initSearchConfig(), initDocumentManager(), initWorkspaceInfo(), initGitLogModule(), initLlmCacheHandler(), initSymbolSearch();
});
async function handleRipgrepSearchRequest(_0x2dfbb8) {
  let {
    regex: _0x354474,
    directory: _0x5aad77,
    includeFilesPattern: _0x306b20,
    ignoreFilePatterns: _0x1b9856
  } = _0x2dfbb8;
  if (!_0x5aad77) throw new Error('Directory not provided');
  let _0x2f3279 = TraycerPath.fromPathProto(_0x5aad77);
  return executeRipgrepSearch(_0x354474, _0x2f3279, _0x306b20, _0x1b9856);
}
async function executeRipgrepSearch(_0x69db30, _0x52ce70, _0x2c2ca8, _0x4e227c) {
  let _0x5a92ab = await config.getRipgrepBinPath();
  if (!_0x5a92ab) throw new Error('ripgrep binary not found');
  let _0x4b7770 = async (_0x37fa24, _0x1a4055, _0xa9ab3a) => WorkerPoolManager.exec("ripgrep-processor.cjs", "processRipgrepOutput", [_0x37fa24, _0x1a4055, _0xa9ab3a]);
  return formatCodeBlockContent(workspace_info.getInstance(), _0x5a92ab, _0x69db30, _0x52ce70, _0x2c2ca8, _0x4e227c, workspace_info.getInstance().getPlatform(), _0x4b7770);
}
var initRipgrepSearchModule = __esmModule(() => {
    'use strict';

    initSearchConfig(), initWorkspaceInfo(), initStatusBar();
  }),
  MAX_WRITE_RETRIES,
  GrpcStreamHandler,
  GrpcClient,
  initGrpcClient = __esmModule(() => {
    'use strict';

    initGoogleAuth(), initGrpcMessageTracker(), initSearchConfig(), initStatusBar(), initLlmCacheHandler(), initSymbolSearch(), initSymbolSearchExports(), initGitInfoModule(), initGitInfoExports(), initSymbolSearchHandler(), initFileReadModule(), initFileReadHandler(), initRipgrepSearchModule(), initTaskRunner(), initUsageTracker(), initTaskContext(), MAX_WRITE_RETRIES = un.MAX_WRITE_RETRIES, GrpcStreamHandler = class extends StreamMessageHandler {
      constructor(_0x30dd48, _0x34bdfa) {
        super(_0x30dd48, Logger), this.grpcConnection = null, this.id = null, this.client = _0x34bdfa;
      }
      async ['processMessage'](_0x1731d7) {
        if (!this.grpcConnection || !this.id) throw new Error("GrpcConnection or id not set");
        await this.client.streamDataHandler(_0x1731d7, this.grpcConnection);
      }
      ["updateConnectionInfo"](_0x5be7b1, _0x1c29dd) {
        this.grpcConnection = _0x5be7b1, this.id = _0x1c29dd;
      }
      ["cleanup"]() {
        super.cleanup(), this.grpcConnection?.['pingState']['pingIntervalTimer'] && (clearInterval(this.grpcConnection.pingState.pingIntervalTimer), this.grpcConnection.pingState.pingIntervalTimer = null);
      }
    }, GrpcClient = class _0x2d3111 {
      static {
        this.streamPackage = null;
      }
      constructor(_0xcd767f, _0x1f5ad8, _0x2b1496 = config.serverUrl, _0x2cf9c3) {
        this.rpcTracker = new GrpcMessageTracker(), this.channelCredentials = _0xcd767f, this.address = _0x2b1496, this._auth = _0x1f5ad8, this.proto = _0x2cf9c3;
      }
      get ['auth']() {
        return this._auth;
      }
      ["isAuthError"](_0x21e1ee) {
        return Logger.warn('Checking if error is auth error', JSON.stringify(_0x21e1ee)), _0x21e1ee !== null && typeof _0x21e1ee == 'object' && "code" in _0x21e1ee && _0x21e1ee.code === grpc_module.status.UNAUTHENTICATED;
      }
      ["isResourceExhaustedError"](_0x2e5a8f) {
        return _0x2e5a8f !== null && typeof _0x2e5a8f == 'object' && "code" in _0x2e5a8f && _0x2e5a8f.code === grpc_module.status.RESOURCE_EXHAUSTED;
      }
      async ['executeWithAuthRetry'](_0x541b32, _0x3ffe4b) {
        try {
          return await _0x541b32();
        } catch (_0x3e7f52) {
          if (this.isAuthError(_0x3e7f52)) {
            if (await this._auth.refreshTraycerToken()) return Logger.info('Token refresh successful, will retry operation'), _0x541b32();
            Logger.warn("Token refresh failed, triggering auth setup"), await this._auth.handleDeactivation();
          } else _0x3ffe4b && UsageTracker.getInstance().fetchRateLimitUsageInBackground(false, false);
          throw Logger.warn('Error executing operation with auth retry', _0x3e7f52), _0x3e7f52;
        }
      }
      async ["waitForClientReady"](_0x3a6e4a) {
        return new Promise((_0x2a9f9e, _0x17b339) => {
          _0x3a6e4a.waitForReady(Date.now() + 30000, _0x1f0c2d => {
            if (_0x1f0c2d) {
              _0x17b339(_0x1f0c2d);
              return;
            }
            _0x2a9f9e();
          });
        });
      }
      async ['isClientConnected'](_0x30abd6) {
        try {
          return await this.waitForClientReady(_0x30abd6), _0x30abd6.getChannel().getConnectivityState(true) === grpc_module.connectivityState.READY;
        } catch (_0x226656) {
          return Logger.debug('Error checking if client is connected', _0x226656), false;
        }
      }
      async ["connectToServer"]() {
        let _0x16aa69 = null;
        if (config.nodeEnv === 'development' && (_0x16aa69 = await fetchGoogleIapToken(), _0x16aa69 === null)) throw new Error("No IAP token found");
        let _0x2cd303 = this.channelCredentials;
        if (this._auth.traycerToken === null) throw new Error("No access token found");
        _0x2cd303 = grpc_module.credentials.combineChannelCredentials(_0x2cd303, grpc_module.credentials.createFromMetadataGenerator((_0x20d9b2, _0x1446c0) => {
          let _0x1c521f = new grpc_module.Metadata();
          _0x1c521f.set("Authorization", 'Bearer ' + this._auth.traycerToken), _0x1c521f.set('traycer-vscode-version', config.version), _0x16aa69 !== null && _0x1c521f.set('Proxy-Authorization', "Bearer " + _0x16aa69), _0x1c521f.set('platform', isAuthenticated()), _0x1446c0(null, _0x1c521f);
        }));
        let _0x23288d = {
            loadBalancingConfig: [{
              round_robin: {}
            }],
            methodConfig: [{
              name: [{
                service: ''
              }],
              maxRequestBytes: -1,
              maxResponseBytes: -1,
              timeout: {
                seconds: 3600,
                nanos: 0
              },
              retryPolicy: {
                maxAttempts: 10,
                initialBackoff: '0.1s',
                maxBackoff: "60s",
                backoffMultiplier: 1.5,
                retryableStatusCodes: [grpc_module.status.ABORTED, grpc_module.status.ALREADY_EXISTS, grpc_module.status.CANCELLED, grpc_module.status.DEADLINE_EXCEEDED, grpc_module.status.FAILED_PRECONDITION, grpc_module.status.INTERNAL, grpc_module.status.UNAVAILABLE, grpc_module.status.UNKNOWN, grpc_module.status.RESOURCE_EXHAUSTED, grpc_module.status.OUT_OF_RANGE]
              }
            }],
            retryThrottling: {
              maxTokens: 10,
              tokenRatio: 0.1
            }
          },
          _0x227875 = new this.proto.traycer.stream.v3.CodeDebugService(this.address, _0x2cd303, {
            'grpc.enable_retries': 1,
            'grpc.service_config': JSON.stringify(_0x23288d),
            'grpc.max_receive_message_length': -1,
            'grpc.max_send_message_length': -1
          });
        return (await this.isClientConnected(_0x227875)) ? _0x227875 : (Logger.error('Failed to connect to server after 30 seconds'), Promise.reject(new bT()));
      }
      async ['streamDataHandler'](_0x4858af, _0x16315d) {
        try {
          await this.streamDataHandlerImpl(_0x4858af, _0x16315d);
        } catch (_0x4f398c) {
          Logger.warn('Error handling stream data', _0x4f398c);
        }
      }
      async ["streamDataHandlerImpl"](_0x136873, _0x4e4213) {
        let _0xd625cd = _0x4e4213.stream;
        if (_0x136873.pong) return this.handlePongResponse(_0x4e4213);
        if (_0x136873.reverseRPCRequest) {
          let _0xaef6b = await this.handleReverseRPC(_0x136873.reverseRPCRequest);
          try {
            await writeChunkedMessageWithRetry(_0xd625cd, {
              reverseRPCResponse: _0xaef6b
            }, Logger, MAX_WRITE_RETRIES, true, this.chunkMessage.bind(this));
          } catch (_0x371c21) {
            throw Logger.error(_0x371c21, "Error sending reverse RPC response to server"), _0x371c21;
          }
        }
        if (_0x136873.rpcResponse) {
          let _0x384fe4 = _0x136873.rpcResponse;
          _0x384fe4?.['id'] && this.rpcTracker.resolveMessage(_0x384fe4.id, _0x384fe4);
        }
        if (_0x136873.syncTaskTitle && (await zn.getInstance().handleTaskTitle(_0x136873.syncTaskTitle)), _0x136873.syncTaskChainTitle && (await zn.getInstance().handleTaskChainTitle(_0x136873.syncTaskChainTitle)), _0x136873.syncTaskSummary && (await zn.getInstance().updateTaskSummary(_0x136873.syncTaskSummary)), _0x136873.streamThinking && (await zn.getInstance().handleThinkingStream(_0x136873.streamThinking)), _0x136873.streamImplementationPlanDelta && (await zn.getInstance().handleImplementationPlanDelta(_0x136873.streamImplementationPlanDelta)), _0x136873.syncPlanChatQueryType && (await zn.getInstance().handlePlanChatQueryType(_0x136873.syncPlanChatQueryType)), _0x136873.syncRateLimitUsageRequest?.["rateLimitInfo"] && (await UsageTracker.getInstance().handleSyncRateLimitUsage(_0x136873.syncRateLimitUsageRequest.rateLimitInfo)), _0x136873.syncFileSummary) {
          let _0x4f1d2e = await LlmCacheHandler.getInstance();
          _0x136873.syncFileSummary.path && (await _0x4f1d2e.setSummaryToCache(_0x136873.syncFileSummary.path, _0x136873.syncFileSummary.summary));
        }
      }
      async ['chunkMessage'](_0x54200b) {
        let _0x1ab69f = await WorkerPoolManager.exec('json-operations.cjs', 'stringifyJSON', [_0x54200b]);
        return Buffer.from(_0x1ab69f, "utf-8");
      }
      async ['handleReverseRPC'](_0x2fcb7c) {
        try {
          return await this.handleReverseRPCImpl(_0x2fcb7c);
        } catch (_0x147e39) {
          return Logger.warn("Error handling reverse RPC:", _0x147e39), {
            id: _0x2fcb7c.id,
            error: {
              message: '' + _0x147e39
            }
          };
        }
      }
      async ["handleReverseRPCImpl"](_0x417e51) {
        let _0x944be6 = {
          id: _0x417e51.id
        };
        switch (true) {
          case !!_0x417e51.readFilesRequest?.["fileRequests"]:
            _0x944be6.readFilesResponse = await handleReadFilesRequest(_0x417e51.readFilesRequest);
            break;
          case !!_0x417e51.listFilesRequest?.['directory']:
            _0x944be6.listFilesResponse = await handleListFilesAndFoldersRequest(_0x417e51.listFilesRequest);
            break;
          case !!_0x417e51.fileGlobSearchRequest?.["pattern"]:
            _0x944be6.fileGlobSearchResponse = await handleListFilesRequest(_0x417e51.fileGlobSearchRequest);
            break;
          case !!_0x417e51.getDiagnosticsRequest?.['directories']:
            _0x944be6.getDiagnosticsResponse = await handleGetDiagnosticsRequest(_0x417e51.getDiagnosticsRequest);
            break;
          case !!_0x417e51.regexSearchRequest?.["directory"] && !!_0x417e51.regexSearchRequest?.["regex"]:
            _0x944be6.regexSearchResponse = await handleRipgrepSearchRequest(_0x417e51.regexSearchRequest);
            break;
          case !!_0x417e51.lspSearchRequest?.["filePath"]:
            _0x944be6.lspSearchResponse = await handleFindSymbolReferencesRequest(_0x417e51.lspSearchRequest);
            break;
          case !!_0x417e51.getGitDiffRequest:
            _0x944be6.getGitDiffResponse = await handleGetGitDiffRequest(_0x417e51.getGitDiffRequest);
            break;
          case !!_0x417e51.getGitInfoRequest:
            _0x944be6.getGitInfoResponse = await handleGetGitInfoRequest(_0x417e51.getGitInfoRequest);
            break;
          default:
            throw new Error("Unhandled reverseRPCRequest " + JSON.stringify(_0x417e51));
        }
        return _0x944be6;
      }
      static async ['open'](_0x28796d, _0x316ddb, _0x143f68) {
        _0x2d3111.streamPackage === null && (_0x2d3111.streamPackage = await (0, proto_loader_module.load)(getRpcProtoPath(), {
          defaults: true,
          longs: String,
          includeDirs: [normalizeLineEndings()]
        }));
        let _0x4a0180 = (0, grpc_module.loadPackageDefinition)(_0x2d3111.streamPackage);
        return new _0x2d3111(_0x316ddb, _0x28796d, _0x143f68, _0x4a0180);
      }
      ['handleRPCError'](_0x4e1c9d) {
        switch (_0x4e1c9d.errorType) {
          case l4.RATE_LIMIT_EXCEEDED:
            throw new RateLimitExceededError(_0x4e1c9d.retryAfter ?? 0, _0x4e1c9d.allowPayToRun ?? false, _0x4e1c9d.invoiceUrl);
          case l4.USER_ABORTED:
            throw new UserAbortedError();
          default:
            return Promise.reject(_0x4e1c9d.message);
        }
      }
      async ['kickChannel'](_0x13af0f, _0x453f20) {
        let _0x53dae0 = _0x13af0f.client.getChannel().getConnectivityState(true);
        if (_0x53dae0 !== grpc_module.connectivityState.SHUTDOWN) {
          if (_0x53dae0 === grpc_module.connectivityState.TRANSIENT_FAILURE) {
            Logger.error("Channel in transient failure state", _0x53dae0.toString()), this.rpcTracker.rejectMessage(_0x453f20, new bT());
            return;
          }
          _0x13af0f.client.getChannel().watchConnectivityState(_0x53dae0, 1 / 0, this.kickChannel.bind(this, _0x13af0f, _0x453f20));
        }
      }
      async ['getGrpcConnection']() {
        let _0x5f000d = await this.connectToServer(),
          _0xbb3347 = _0x5f000d.Stream(),
          _0x156d02 = {
            pingIntervalTimer: null,
            pingInFlight: false,
            missedPings: 0
          },
          _0x207af9 = new GrpcStreamHandler(_0xbb3347, this),
          _0x451658 = {
            client: _0x5f000d,
            stream: _0xbb3347,
            pingState: _0x156d02,
            streamHandler: _0x207af9
          },
          [_0x3d6a8f, _0x47be2b] = this.rpcTracker.trackNewMessage(_0x451658);
        return _0x207af9.updateConnectionInfo(_0x451658, _0x3d6a8f), _0x207af9.startMessageConsumption(), _0xbb3347.on('end', () => {
          Logger.debug('Stream end'), _0x207af9.cleanup();
        }), _0xbb3347.on("error", async _0x289185 => {
          Logger.error(_0x289185, 'Stream error: ' + _0x289185.message), this.rpcTracker.rejectMessage(_0x3d6a8f, _0x289185), _0x207af9.cleanup(), _0xbb3347.end();
        }), await this.kickChannel(_0x451658, _0x3d6a8f), await this.startPingMechanism(_0x451658), {
          grpcConnection: _0x451658,
          id: _0x3d6a8f,
          promise: _0x47be2b
        };
      }
      async ["startPingMechanism"](_0x1ab7b6) {
        let _0x392186 = un.PING_INTERVAL_MS;
        _0x1ab7b6.pingState.pingIntervalTimer && clearInterval(_0x1ab7b6.pingState.pingIntervalTimer), _0x1ab7b6.pingState.pingInFlight = false, await this.sendPing(_0x1ab7b6), _0x1ab7b6.pingState.pingIntervalTimer = setInterval(async () => {
          _0x1ab7b6.pingState.pingInFlight ? (_0x1ab7b6.pingState.missedPings++, Logger.warn("Missed ping " + _0x1ab7b6.pingState.missedPings + '/' + un.MAX_MISSED_PINGS), _0x1ab7b6.pingState.missedPings >= un.MAX_MISSED_PINGS && (Logger.error("Exceeded maximum missed pings (" + un.MAX_MISSED_PINGS + "). Disconnecting."), await this.handleServerDisconnection(_0x1ab7b6, bu.PING_TIMEOUT))) : await this.sendPing(_0x1ab7b6);
        }, _0x392186);
      }
      async ["sendPing"](_0x1c642e) {
        if (_0x1c642e.stream.writable) try {
          await writeChunkedMessageWithRetry(_0x1c642e.stream, {
            ping: {}
          }, Logger, MAX_WRITE_RETRIES, false, this.chunkMessage.bind(this)), _0x1c642e.pingState.pingInFlight = true;
        } catch (_0x2f0bf7) {
          Logger.error(_0x2f0bf7, 'Failed sending ping to server'), await this.handleServerDisconnection(_0x1c642e, bu.PING_WRITE_FAILURE);
        } else Logger.error("Failed sending ping to server. Stream is not writable"), await this.handleServerDisconnection(_0x1c642e, bu.PING_WRITE_FAILURE);
      }
      ["handlePongResponse"](_0x2b1f09) {
        _0x2b1f09.pingState.pingInFlight = false, _0x2b1f09.pingState.missedPings = 0;
      }
      async ['handleServerDisconnection'](_0x1969bb, _0x21b022) {
        let _0x54cc08 = [];
        this.rpcTracker.inflightGrpcConnections.forEach((_0x15dd26, _0x354478) => {
          if (_0x15dd26.stream === _0x1969bb.stream) {
            let _0x1ff74a = async () => {
              try {
                await this.sendAbortRPC(_0x354478, _0x15dd26.stream, _0x21b022);
              } catch (_0x3cf5f7) {
                Logger.error(_0x3cf5f7, 'Failed to send abort RPC to server');
              } finally {
                this.rpcTracker.rejectMessage(_0x354478, new bT());
              }
            };
            _0x54cc08.push(_0x1ff74a());
          }
        }), await Promise.all(_0x54cc08);
      }
      async ["sendGenericRequest"](_0x128d30, _0x3d9fb0, _0x55be2f, _0xc69241, _0x2b3641) {
        if (_0xc69241.signal.aborted) throw new UserAbortedError();
        let _0x28566d = async () => {
          let {
              grpcConnection: _0x538741,
              id: _0x13ef52,
              promise: _0x2f71d0
            } = await this.getGrpcConnection(),
            _0x4a8acb = {
              [_0x128d30]: _0x3d9fb0,
              id: _0x13ef52,
              platform: isConnected(),
              isPayToRun: config.alwaysAllowPayToRun || _0x2b3641,
              selectedMCPParent: Vt.getInstance().getSelectedOrDefaultMCPParent(this.auth.traycerUser) ?? void 0,
              languagePreference: config.languagePreference
            };
          Logger.debug('Sending ' + _0x128d30 + " request with ID " + _0x13ef52);
          let _0xa5ac5f = await this.sendRPCRequest(_0x538741, _0x4a8acb, _0x2f71d0, _0xc69241);
          return _0xa5ac5f[_0x55be2f] ? _0xa5ac5f[_0x55be2f] : Promise.reject("No " + String(_0x55be2f) + " found in RPC response");
        };
        try {
          return await this.executeWithAuthRetry(_0x28566d, _0x128d30 !== "getRateLimitUsageRequest");
        } catch (_0x18c20a) {
          throw this.isAuthError(_0x18c20a) && (await this._auth.handleDeactivation()), this.isResourceExhaustedError(_0x18c20a) ? new g2("Unable to send request to the server potentially due to large files mentioned in the query; try smaller files or reduce selection.") : _0x18c20a;
        }
      }
      async ['sendAbortRPC'](_0x3a0708, _0x53f16b, _0x535cc1) {
        let _0xa2606f = {
          abortRPC: {
            id: _0x3a0708,
            reason: _0x535cc1
          }
        };
        if (_0x53f16b.writable) try {
          await writeChunkedMessageWithRetry(_0x53f16b, _0xa2606f, Logger, MAX_WRITE_RETRIES, false, this.chunkMessage.bind(this));
        } catch (_0x2a6418) {
          throw Logger.error(_0x2a6418, 'Error sending abort RPC to server'), _0x2a6418;
        }
      }
      async ["sendRPCRequest"](_0x2cd718, _0x494c25, _0x58678a, _0x483d66) {
        if (_0x483d66.signal.aborted) this.rpcTracker.rejectMessage(_0x494c25.id, new UserAbortedError());else {
          let _0x34c148 = _0x2cd718.stream;
          _0x483d66.signal.addEventListener("abort", () => {
            this.sendAbortRPC(_0x494c25.id, _0x34c148, bu.USER_ABORT);
          });
          let _0x42202f = {
            rpcRequest: _0x494c25
          };
          try {
            await writeChunkedMessageWithRetry(_0x34c148, _0x42202f, Logger, MAX_WRITE_RETRIES, true, this.chunkMessage.bind(this));
          } catch (_0x242be9) {
            return Logger.error(_0x242be9, "Failed to send RPC request"), Promise.reject(_0x242be9);
          }
        }
        try {
          let _0x3e862d = await _0x58678a;
          return _0x3e862d.error ? this.handleRPCError(_0x3e862d.error) : _0x3e862d;
        } catch (_0x1c13e7) {
          return Logger.warn('Failed to get rpc response', String(_0x1c13e7)), Promise.reject(_0x1c13e7);
        }
      }
      async ["sendPlanGenerationRequest"](_0x301323, _0x4332e2, _0x467ea1) {
        return this.sendGenericRequest('planGenerationRequest', _0x301323, "planGenerationResponse", _0x4332e2, _0x467ea1);
      }
      async ['sendPhaseGenerationRequest'](_0x52df05, _0xa274e0, _0x4c3cdd) {
        return this.sendGenericRequest("phaseGenerationRequest", _0x52df05, 'phaseBreakdownResponse', _0xa274e0, _0x4c3cdd);
      }
      async ['sendPhaseIterationRequest'](_0x1b40b9, _0x3f061d, _0x540212) {
        return this.sendGenericRequest('phaseIterationRequest', _0x1b40b9, "phaseBreakdownResponse", _0x3f061d, _0x540212);
      }
      async ['sendPlanChatRequest'](_0x1f7fb0, _0x39b230, _0x1067fe) {
        return this.sendGenericRequest("planChatRequest", _0x1f7fb0, "planChatResponse", _0x39b230, _0x1067fe);
      }
      async ['sendVerificationRequest'](_0x1ecf38, _0x3b7f54, _0xc3982d) {
        return this.sendGenericRequest("verificationRequest", _0x1ecf38, "verificationResponse", _0x3b7f54, _0xc3982d);
      }
      async ['sendReVerificationRequest'](_0x116888, _0x50a2bc) {
        return this.sendGenericRequest('reVerificationRequest', _0x116888, "reVerificationResponse", _0x50a2bc, false);
      }
      async ["sendImportPersistedTicketRequest"](_0xb2e815, _0xdcaf9c) {
        return this.sendGenericRequest("importPersistedTicketRequest", _0xb2e815, "importPersistedTicketResponse", _0xdcaf9c, false);
      }
      async ['sendGetRateLimitUsageRequest'](_0x4a43e3, _0x1a32f1) {
        return this.sendGenericRequest('getRateLimitUsageRequest', _0x4a43e3, 'getRateLimitUsageResponse', _0x1a32f1, false);
      }
      ["close"]() {
        this.rpcTracker.inflightGrpcConnections.forEach((_0x3f5ee4, _0x4eb909) => {
          this.sendAbortRPC(_0x4eb909, _0x3f5ee4.stream, bu.EXTENSION_CLOSED);
        }), this.rpcTracker.clearAll();
      }
    };
  });
async function navigateToTaskWithPrefill(_0x3c9b57) {
  let _0x29a0da = {
    type: sl.NAVIGATE_TO_TASK_LANDING_WITH_PREFILL,
    queryContent: _0x3c9b57,
    switchToReview: true
  };
  await Qe.openCommentNavigator(), await Qe.postToCommentNavigator(_0x29a0da);
}
async function triggerManualAnalysisFile() {
  try {
    let _0x193347 = vscode_module.window.activeTextEditor;
    if (!_0x193347) {
      vscode_module.window.showInformationMessage('No active file to analyze');
      return;
    }
    let _0x1ef11b = _0x193347.document.uri.fsPath,
      _0x5a00ec = await TraycerPath.fromPath(_0x1ef11b),
      _0x1257fb = {
        type: "doc",
        content: [{
          type: "paragraph",
          content: [{
            type: 'text',
            text: "Review "
          }, {
            type: "mention",
            attrs: {
              contextType: _0x5a00ec.isDirectory ? 'folder' : "file",
              id: _0x5a00ec.absPath,
              label: _0x5a00ec.name,
              absolutePath: _0x5a00ec.absPath,
              isDirectory: _0x5a00ec.isDirectory
            }
          }]
        }]
      };
    await navigateToTaskWithPrefill(_0x1257fb);
  } catch (_0x157528) {
    Logger.error(_0x157528, 'Error in TRIGGER_MANUAL_ANALYSIS_FILE');
  }
}
async function triggerManualAnalysisChanges() {
  try {
    let _0x19bfff = vscode_module.window.activeTextEditor;
    if (!_0x19bfff) {
      vscode_module.window.showInformationMessage('No active file to analyze');
      return;
    }
    let _0x3c8265 = _0x19bfff.document.uri.fsPath,
      _0x43bd43 = await TraycerPath.fromPath(_0x3c8265),
      _0x7f27b4 = {
        type: "doc",
        content: [{
          type: 'paragraph',
          content: [{
            type: "text",
            text: 'Review uncommitted changes in '
          }, {
            type: "mention",
            attrs: {
              contextType: _0x43bd43.isDirectory ? 'folder' : "file",
              id: _0x43bd43.absPath,
              label: _0x43bd43.name,
              absolutePath: _0x43bd43.absPath,
              isDirectory: _0x43bd43.isDirectory
            }
          }]
        }]
      };
    await navigateToTaskWithPrefill(_0x7f27b4);
  } catch (_0x43b5c4) {
    Logger.error(_0x43b5c4, "Error in TRIGGER_MANUAL_ANALYSIS_CHANGES");
  }
}
async function triggerManualAnalysisAllChanges() {
  try {
    let _0x42c6de = {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: 'Review all uncommitted changes in the workspace '
        }, {
          type: 'mention',
          attrs: {
            contextType: 'git',
            id: 'against_uncommitted_changes',
            label: "Diff against uncommitted changes",
            gitType: "against_uncommitted_changes"
          }
        }]
      }]
    };
    await navigateToTaskWithPrefill(_0x42c6de);
  } catch (_0x9285bc) {
    Logger.error(_0x9285bc, 'Error in TRIGGER_MANUAL_ANALYSIS_ALL_CHANGES');
  }
}
async function registerExtensionCommands(_0x2ed719) {
  await registerVscodeCommand(_0x2ed719, OPEN_SETTINGS_COMMAND, () => {
    vscode_module.commands.executeCommand("workbench.action.openSettings", "@ext:Traycer.traycer-vscode");
  }), await registerVscodeCommand(_0x2ed719, START_NEW_TASK_COMMAND, async () => {
    let _0x44aa1c = {
      type: sl.NAVIGATE_TO_NEW_TASK
    };
    await Qe.postToCommentNavigator(_0x44aa1c);
  }), await registerVscodeCommand(_0x2ed719, OPEN_TASK_HISTORY_COMMAND, async () => {
    let _0x5b8fdc = {
      type: sl.NAVIGATE_TO_TASK_HISTORY
    };
    await Qe.postToCommentNavigator(_0x5b8fdc);
  }), await registerVscodeCommand(_0x2ed719, LIST_MCP_SERVERS_COMMAND, async () => {
    let _0x2e5cd9 = {
      type: sl.NAVIGATE_TO_MCP_SERVERS
    };
    await Qe.postToCommentNavigator(_0x2e5cd9);
  }), await registerVscodeCommand(_0x2ed719, MANAGE_PROMPT_TEMPLATES_COMMAND, async () => {
    let _0xa15a6c = {
      type: sl.NAVIGATE_TO_PROMPT_TEMPLATES
    };
    await Qe.postToCommentNavigator(_0xa15a6c);
  }), await registerVscodeCommand(_0x2ed719, MANAGE_CLI_AGENTS_COMMAND, async () => {
    let _0x1b87b4 = {
      type: sl.NAVIGATE_TO_CLI_AGENTS
    };
    await Qe.postToCommentNavigator(_0x1b87b4);
  }), await registerVscodeCommand(_0x2ed719, TRIGGER_MANUAL_ANALYSIS_FILE_COMMAND, triggerManualAnalysisFile), await registerVscodeCommand(_0x2ed719, TRIGGER_MANUAL_ANALYSIS_CHANGES_COMMAND, triggerManualAnalysisChanges), await registerVscodeCommand(_0x2ed719, TRIGGER_MANUAL_ANALYSIS_ALL_CHANGES_COMMAND, triggerManualAnalysisAllChanges);
}
var initExtensionCommands = __esmModule(() => {
  'use strict';

  initCommentNavigatorDeps();
});
async function registerShowTemplateErrorsCommand(_0x50b7bd) {
  await registerVscodeCommand(_0x50b7bd, SHOW_TEMPLATE_ERRORS_COMMAND, (..._0x5ead29) => {
    vscode_module.window.showErrorMessage("Template errors: " + _0x5ead29.join(', '));
  });
}
var TicketLoadingNotifier,
  initTicketLoadingNotifier = __esmModule(() => {
    'use strict';

    initCommentNavigator(), TicketLoadingNotifier = class {
      async ['notifyLoading'](_0x448f67, _0x4492c7) {
        let _0xf26ff7 = {
          type: _n.TICKET_LOADING,
          isLoading: _0x448f67,
          ticketSource: _0x4492c7
        };
        await Qe.postToCommentNavigator(_0xf26ff7);
      }
      async ['notifyTaskOpened'](_0x3f05bc) {
        let _0x572243 = {
          type: _n.OPEN_TASK,
          taskChain: _0x3f05bc
        };
        await Qe.postToCommentNavigator(_0x572243);
      }
    };
  }),
  Xg,
  initPersistedTicketLoading = __esmModule(() => {
    'use strict';

    initSearchConfig(), initWorkspaceInfo(), initTaskChainManager(), initFileOperations(), initCommentNavigatorDeps(), Xg = class _0x1c824e extends ol {
      constructor(_0x21c199, _0x49d2fc) {
        super(_0x21c199, 'PersistedTicketLoading', _0x49d2fc, config.CURRENT_IMPORT_TICKET_VERSION, config.IMPORT_TICKET_SIZE), this.shouldInvalidateData = false, this.shouldInvalidateData = false;
      }
      static {
        this.instance = null;
      }
      static ["getInstance"](_0x596ecf, _0x2c6b37) {
        if (!_0x1c824e.instance) {
          if (!_0x596ecf || !_0x2c6b37) throw new Error("Context and appAssetsDB are required");
          _0x1c824e.instance = new _0x1c824e(_0x596ecf, _0x2c6b37);
        }
        return _0x1c824e.instance;
      }
      async ["_addFromStorage"](_0x11366f) {
        return Promise.allSettled(_0x11366f.map(async _0x28e650 => {
          if (workspace_info.getInstance().isWorkspaceOpen(_0x28e650.workspacePath)) try {
            await Qe.openCommentNavigator();
            let _0x4d1dd8 = await Nh.getInstance().addTaskChainForPersistedTicket(_0x28e650.persistedTicket, _0x28e650.workspacePath, _0x28e650.ticketReferenceInfo);
            _0x4d1dd8.showNotification("Imported plan for ticket: " + _0x4d1dd8.activePhaseBreakdown.activeTask.title);
          } finally {
            await this.deleteItem(_0x28e650.id);
          }
        }));
      }
      ['getLiveItemIDs']() {
        return [];
      }
      ["migrateItem"](_0x4d1380) {
        return {
          ..._0x4d1380,
          serializedItem: _0x4d1380.serializedItem
        };
      }
      ["getRequiredFiles"](_0xfc3a1f) {
        return [];
      }
    };
  }),
  Nh,
  initTaskChainManager = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initTicketLoadingNotifier(), initAnalytics(), initPersistedTicketLoading(), initRepoMappingManager(), initTaskRunner(), initCommentNavigatorDeps(), Nh = class _0x21dae1 {
      constructor(_0xaabdf) {
        this.client = _0xaabdf, this.uiNotifier = new TicketLoadingNotifier();
      }
      static ["getInstance"](_0x137b3e) {
        if (!_0x21dae1.instance) {
          if (!_0x137b3e) throw new Error("Need client to initialize import ticket handler the first time.");
          _0x21dae1.instance = new _0x21dae1(_0x137b3e);
        }
        return _0x21dae1.instance;
      }
      async ["importPersistedTicket"](_0x23ea02) {
        yn.getInstance().increment('ticket_imported', {
          defaultProperties: {
            source: formatPathForDisplay(_0x23ea02.ticketSource)
          },
          userProperties: {}
        }), await Qe.openCommentNavigator(), await this.uiNotifier.notifyLoading(true, _0x23ea02.ticketSource);
        try {
          let _0x254fe4 = await this.importTicketFromServer(this.client, _0x23ea02);
          if (!_0x254fe4.ticket) throw new Error("Ticket not found");
          await this.handleTicketResponse(_0x23ea02, _0x254fe4.ticket, this.extractTicketInfo(_0x23ea02.ticketSource, _0x254fe4));
        } catch (_0x5a6ba4) {
          throw Logger.error("Failed to import ticket: " + String(_0x5a6ba4)), await Xg.getInstance().deleteItem(_0x23ea02.ticketId), _0x5a6ba4;
        } finally {
          await this.uiNotifier.notifyLoading(false, _0x23ea02.ticketSource);
        }
      }
      async ['handleTicketResponse'](_0x487948, _0x32069c, _0x35c9d1) {
        if (!_0x32069c) throw new Error('Ticket not found');
        let _0x274b57;
        try {
          let _0x58d4ec, _0x161696;
          switch (_0x35c9d1.ticketSource) {
            case TICKET_SOURCE.GITHUB_TICKET:
              {
                let _0x2aa3b6 = _0x35c9d1.githubTicketRef?.['organizationLogin'] ?? _0x35c9d1.githubTicketRef?.['userLogin'];
                if (!_0x35c9d1.githubTicketRef || !_0x2aa3b6) throw new Error('GitHub ticket reference not found');
                _0x58d4ec = _0x35c9d1.githubTicketRef.repositoryName, _0x161696 = _0x2aa3b6;
                break;
              }
            default:
              throw new Error("Unsupported ticket source: " + _0x35c9d1.ticketSource);
          }
          _0x274b57 = await Du.getInstance().fetchRepoMapping(_0x58d4ec, _0x161696);
        } catch (_0x4765f4) {
          Logger.error("Failed to fetch repo mapping: " + String(_0x4765f4)), vscode_module.window.showErrorMessage("Failed to import ticket due to locally cloned repository not found. Please clone the repository manually and try again.");
          return;
        }
        workspace_info.getInstance().isWorkspaceOpen(_0x274b57.gitRoot) ? await this.addTaskChainForPersistedTicket(_0x32069c, _0x274b57.gitRoot, _0x35c9d1) : await this.openNewWorkspace(_0x487948, _0x274b57.gitRoot, _0x32069c, _0x35c9d1);
      }
      async ['openNewWorkspace'](_0x55434e, _0x35a82c, _0x16a01e, _0x4d0f71) {
        let _0x3e597f = {
          persistedTicket: _0x16a01e,
          workspacePath: _0x35a82c,
          id: _0x55434e.ticketId,
          ticketReferenceInfo: _0x4d0f71
        };
        await this.persistImportTicket(_0x3e597f), await vscode_module.commands.executeCommand("vscode.openFolder", vscode_module.Uri.file(_0x35a82c), {
          forceNewWindow: true
        });
      }
      async ["persistImportTicket"](_0x29325c) {
        let _0x262c18 = Xg.getInstance(),
          _0x33d782 = new TaskStorage(_0x262c18, _0x29325c.id);
        return _0x33d782.runInTransaction(async _0x6bcf3a => {
          await _0x33d782.upsert(_0x29325c, _0x6bcf3a);
        });
      }
      async ['addTaskChainForPersistedTicket'](_0x38ee44, _0x56557a, _0x46e246) {
        let _0x139de3 = await zn.getInstance().addTaskChainFromPersistedTicket(_0x38ee44, _0x46e246, _0x56557a);
        return await this.uiNotifier.notifyTaskOpened(await _0x139de3.serializeToUI()), _0x139de3;
      }
      async ["importTicketFromServer"](_0x3add29, _0x364687) {
        if (_0x364687.ticketSource === void 0 || !Object.values(yo).includes(_0x364687.ticketSource)) throw new Error('Invalid provider type: ' + _0x364687.ticketSource);
        await this.uiNotifier.notifyLoading(true, _0x364687.ticketSource);
        let _0x1d3bd5 = {
          ticketID: _0x364687.ticketId,
          github: {
            organizationID: _0x364687.orgId ?? void 0,
            repositoryID: _0x364687.repoId,
            userID: _0x364687.userId ?? void 0,
            issueNumber: _0x364687.ticketId
          }
        };
        return await _0x3add29.sendImportPersistedTicketRequest(_0x1d3bd5, new AbortController());
      }
      ['extractTicketInfo'](_0x8f5394, _0x89ddfd) {
        switch (_0x8f5394) {
          case TICKET_SOURCE.GITHUB_TICKET:
            if (!_0x89ddfd.github) throw new Error("GitHub ticket reference not found");
            return {
              ticketSource: _0x8f5394,
              githubTicketRef: {
                organizationLogin: _0x89ddfd.github.organizationLogin,
                userLogin: _0x89ddfd.github.userLogin,
                repositoryName: _0x89ddfd.github.repositoryName,
                issueNumber: _0x89ddfd.github.issueNumber
              }
            };
          default:
            throw new Error("Unsupported ticket source: " + _0x8f5394);
        }
      }
    };
  });
async function registerTaskChainCommands(_0x593629) {
  return Promise.all([registerImportPersistedTicketCommand(_0x593629)]);
}
async function registerImportPersistedTicketCommand(_0x5071e1) {
  await registerVscodeCommand(_0x5071e1, COMMAND_IDS.IMPORT_TICKET, async (..._0x2e5439) => {
    let _0x4ed022 = parseQueryParams(_0x2e5439);
    _0x4ed022.ticketSource = Number(_0x4ed022.ticketSource), await Nh.getInstance().importPersistedTicket(_0x4ed022);
  });
}
var initTaskChainCommands = __esmModule(() => {
    'use strict';

    initTaskChainManager(), initStatusBar();
  }),
  PersistenceManager,
  initPersistenceManager = __esmModule(() => {
    'use strict';

    initPersistedTicketLoading(), initGitOperationsExports(), initProgressReporter(), initTaskChainPersistence(), initTaskRunner(), initWorkspaceSettingsPersistence(), PersistenceManager = class _0x445c6c {
      constructor(_0x3cadc4, _0x3a4ec8, _0x195da7, _0x32a455, _0x1ea497) {
        this._taskHistory = _0x3cadc4, this._repoWorkspaceMappings = _0x3a4ec8, this._appAssetsDB = _0x32a455, this._importTicket = _0x195da7, this._workspaceSettings = _0x1ea497;
      }
      static async ["getInstancePromise"](_0x427e3a, _0x244c81) {
        if (!_0x445c6c.instancePromise) {
          if (!_0x427e3a || !_0x244c81) throw new Error("PersistenceManager has not been initialized. Pass in all arguments to getInstance().");
          _0x445c6c.instancePromise = _0x445c6c.getInstanceImpl(_0x427e3a, _0x244c81);
        }
        return _0x445c6c.instancePromise;
      }
      static async ["getInstanceImpl"](_0x55b6a2, _0x40a478) {
        let _0x482fdf = await ox.getInstance();
        await SqliteMigrator.migrateToSqlite(_0x55b6a2, _0x482fdf);
        let _0x5fb830 = TaskChainPersistence.getInstance(_0x55b6a2, _0x40a478, _0x482fdf),
          _0x7db756 = Qm.getInstance(_0x55b6a2, _0x482fdf),
          _0x478e57 = Xg.getInstance(_0x55b6a2, _0x482fdf),
          _0x3efe36 = WorkspaceSettingsPersistence.getInstance(_0x55b6a2, _0x482fdf);
        return new _0x445c6c(_0x5fb830, _0x7db756, _0x478e57, _0x482fdf, _0x3efe36);
      }
      async ['loadDataFromDisk']() {
        try {
          await this.loadInBackground();
        } catch (_0x3d68a5) {
          Logger.error(_0x3d68a5, "Failed to load data from disk");
        }
      }
      async ['loadInBackground']() {
        let _0x597af7 = zn.getInstance();
        await _0x597af7.setIsBootstrapping(true);
        let _0x1df02f = [{
            name: "taskHistory",
            promise: this.taskHistory.bootstrapFromDisk().finally(() => {
              _0x597af7.setIsBootstrapping(false);
            })
          }, {
            name: 'repoWorkspaceMappings',
            promise: this.repoWorkspaceMappings.bootstrapFromDisk()
          }, {
            name: 'importTicket',
            promise: this.importTicket.bootstrapFromDisk()
          }, {
            name: "workspaceSettings",
            promise: this.workspaceSettings.bootstrapFromDisk()
          }],
          _0x10bf6f = await Promise.allSettled(_0x1df02f.map(_0x4cd814 => _0x4cd814.promise));
        for (let _0x342f70 = 0; _0x342f70 < _0x10bf6f.length; _0x342f70++) {
          let _0x124053 = _0x10bf6f[_0x342f70];
          _0x124053.status === 'rejected' && Logger.warn("Bootstrap failed for " + _0x1df02f[_0x342f70].name + ':', _0x124053.reason);
        }
      }
      get ['workspaceSettings']() {
        if (!this._workspaceSettings) throw new Error('workspaceSettings is not initialized yet.');
        return this._workspaceSettings;
      }
      set ["workspaceSettings"](_0x4811de) {
        this._workspaceSettings = _0x4811de;
      }
      get ["taskHistory"]() {
        if (!this._taskHistory) throw new Error("taskHistoryPersistence is not initialized yet.");
        return this._taskHistory;
      }
      set ["taskHistory"](_0x49dcd5) {
        this._taskHistory = _0x49dcd5;
      }
      get ["repoWorkspaceMappings"]() {
        if (!this._repoWorkspaceMappings) throw new Error('repoWorkspaceMappings is not initialized yet.');
        return this._repoWorkspaceMappings;
      }
      set ['repoWorkspaceMappings'](_0x3592c3) {
        this._repoWorkspaceMappings = _0x3592c3;
      }
      get ['importTicket']() {
        if (!this._importTicket) throw new Error('importTicket is not initialized yet.');
        return this._importTicket;
      }
      set ['importTicket'](_0x4bc67c) {
        this._importTicket = _0x4bc67c;
      }
    };
  }),
  U3,
  initMigrationLogger = __esmModule(() => {
    'use strict';

    U3 = class {
      async ["handleUri"](_0x416157) {
        if (_0x416157.scheme !== vscode_module.env.uriScheme) return;
        let _0x20eab0 = _0x416157.path.slice(1),
          _0x1ec280 = _0x416157.query.split('&');
        switch (_0x20eab0) {
          case COMMAND_IDS.OPEN_SETTINGS:
          case COMMAND_IDS.IMPORT_TICKET:
            await this.triggerCommand(_0x20eab0, _0x1ec280);
            break;
          case COMMAND_IDS.AUTH_CALLBACK:
            await AuthCallbackHandler.getInstance().handleAuthCallback(_0x416157);
            break;
          default:
            Logger.warn('Unsupported command on URI handler: ' + _0x20eab0);
            break;
        }
      }
      async ['triggerCommand'](_0x25dc15, _0xc592a8) {
        return vscode_module.commands.executeCommand(_0x25dc15, ..._0xc592a8);
      }
    };
  }),
  ConfigWatcher,
  initConfigWatcher = __esmModule(() => {
    'use strict';

    initSearchConfig(), initUsageInfoHandler(), ConfigWatcher = class {
      constructor(_0xc8ac36) {
        this.auth = _0xc8ac36;
      }
      ["activate"](_0xfb44e5) {
        this.changeConfigurationWatcher = vscode_module.workspace.onDidChangeConfiguration(_0x1f65ee => {
          let _0x36062c = config.extensionName;
          _0x1f65ee.affectsConfiguration(_0x36062c + ".sendKey") && this.handleSendKeyChange(), _0x1f65ee.affectsConfiguration(_0x36062c + ".outputLevel") && this.handleOutputLevelChange(), _0x1f65ee.affectsConfiguration(_0x36062c + '.autoOpenDiffOnApply') && this.handleAutoOpenDiffOnApplyChange(), _0x1f65ee.affectsConfiguration(_0x36062c + ".alwaysAllowPayToRun") && this.handleAlwaysAllowPayToRunChange(), _0x1f65ee.affectsConfiguration(_0x36062c + ".enablePromptTemplateSelector") && this.handleEnablePromptSelectionTemplatePopoverChange(), _0x1f65ee.affectsConfiguration(_0x36062c + ".languagePreference") && this.handleLanguagePreferenceChange(), _0x1f65ee.affectsConfiguration(_0x36062c + ".enableAgentsMd") && this.handleEnableAgentsMdChange();
        }), _0xfb44e5.subscriptions.push(this.changeConfigurationWatcher);
      }
      ['deactivate']() {
        this.changeConfigurationWatcher?.["dispose"]();
      }
      ["handleSendKeyChange"]() {
        let _0x2830cb = vscode_module.workspace.getConfiguration(config.extensionName).get("sendKey");
        config.sendKey = _0x2830cb, Xr.syncStateToWebview(), Logger.debug('Send key preference changed to', config.sendKey);
      }
      ['handleAutoOpenDiffOnApplyChange']() {
        config.autoOpenDiffOnApply = vscode_module.workspace.getConfiguration(config.extensionName).get("autoOpenDiffOnApply"), Logger.debug("Auto open diff on apply changed to", config.autoOpenDiffOnApply);
      }
      ['handleAlwaysAllowPayToRunChange']() {
        let _0x509a1a = vscode_module.workspace.getConfiguration(config.extensionName).get('alwaysAllowPayToRun');
        config.alwaysAllowPayToRun !== _0x509a1a && (config.alwaysAllowPayToRun = _0x509a1a, Xr.syncStateToWebview(), Logger.debug('Auto allow pay to run changed to', config.alwaysAllowPayToRun));
      }
      ["handleEnablePromptSelectionTemplatePopoverChange"]() {
        config.enablePromptTemplateSelector = vscode_module.workspace.getConfiguration(config.extensionName).get('enablePromptTemplateSelector'), Logger.debug('Enable prompt selection template popover changed to', config.enablePromptTemplateSelector), Xr.syncStateToWebview();
      }
      ["handleLanguagePreferenceChange"]() {
        let _0x400b0b = vscode_module.workspace.getConfiguration(config.extensionName).get('languagePreference') ?? 'en',
          _0x566bad = parseLanguagePreference(_0x400b0b);
        config.languagePreference = _0x566bad;
      }
      ["handleEnableAgentsMdChange"]() {
        config.enableAgentsMd = vscode_module.workspace.getConfiguration(config.extensionName).get('enableAgentsMd'), Logger.debug("Enable AGENTS.md changed to", config.enableAgentsMd);
      }
      ["handleOutputLevelChange"]() {
        config.logLevel = vscode_module.workspace.getConfiguration(config.extensionName).get('outputLevel'), Logger.logLevel = config.logLevel;
      }
    };
  }),
  DocsWatcher,
  initDocsWatcher = __esmModule(() => {
    'use strict';

    initLanguageParsers(), initTreeSitterParser(), DocsWatcher = class {
      constructor() {
        this.pendingRequests = new Set(), this.inflightRequests = new Map();
      }
      ['activate'](_0x55ed7d) {
        Logger.info("Activating DocsWatcher"), this.changeSubscription = vscode_module.workspace.onDidChangeTextDocument(async _0x4ed18b => {
          let _0x582c97 = _0x4ed18b.document;
          if (!(_0x582c97.languageId === "log" || _0x4ed18b.contentChanges.length === 0 || _0x582c97.uri.scheme === EXTENSION_ID || _0x582c97.uri.scheme === EDITABLE_DIFF_VIEW_ID)) try {
            return this.handleThreadChange(_0x4ed18b);
          } catch (_0x178265) {
            Logger.warn('Error while handling review thread change for ' + _0x4ed18b.document.uri.fsPath, _0x178265);
          }
        }), _0x55ed7d.subscriptions.push(this.changeSubscription);
      }
      ["deactivate"]() {
        this.changeSubscription?.['dispose']();
      }
      async ["handleThreadChange"](_0x124bae) {
        let _0x28610b = _0x124bae.document,
          _0x4007dd = _0x28610b.uri.fsPath;
        if (TreeSitterFileParser.getBlacklistedLanguages().includes(_0x28610b.languageId)) {
          let _0x332128 = 'Unsupported language: ' + _0x28610b.languageId + " - " + _0x28610b.uri.fsPath;
          Logger.debug(_0x332128);
          return;
        }
        try {
          let _0x12442e = getParserForLanguage(_0x28610b.languageId, _0x28610b.uri.fsPath);
          if (_0x12442e instanceof TreeSitterFileParser) try {
            await _0x12442e.reloadTreeSitterCache(_0x124bae);
          } catch (_0x41cad7) {
            throw Logger.warn("Error while reloading cache for " + _0x124bae.document.uri.fsPath, _0x41cad7), _0x41cad7;
          }
        } catch (_0x4a3792) {
          throw Logger.warn('Error while getting parser for ' + _0x124bae.document.uri.fsPath, _0x4a3792), _0x4a3792;
        }
        if (!this.pendingRequests.has(_0x4007dd)) {
          if (this.pendingRequests.add(_0x4007dd), this.inflightRequests.has(_0x4007dd)) try {
            await this.inflightRequests.get(_0x4007dd);
          } finally {
            this.inflightRequests.delete(_0x4007dd);
          }
          this.pendingRequests.delete(_0x4007dd);
        }
      }
    };
  }),
  FileWatcher,
  initFileWatcher = __esmModule(() => {
    'use strict';

    initCliAgentService(), initPromptTemplateService(), initFilePathHandler(), FileWatcher = class {
      constructor() {
        this.ignoreFilePatterns = getGlobalIgnoreInstance().add(rue);
      }
      ['activate'](_0x5a0c45) {
        this.fileSystemWatcher = vscode_module.workspace.createFileSystemWatcher(vscode_module.workspace.asRelativePath("**/*"), false, false, false), this.fileSystemWatcher.onDidChange(async _0x2582a1 => {
          await Promise.all([Sl.getInstance().watchWorkspaceTemplatePath(_0x2582a1.fsPath, "upsert"), ii.getInstance().watchWorkspaceCLIAgentsPath(_0x2582a1.fsPath, "upsert"), na.getInstance().invalidatePath(_0x2582a1.fsPath)]);
        }), this.fileSystemWatcher.onDidCreate(async _0xf17a5c => {
          await Promise.all([Sl.getInstance().watchWorkspaceTemplatePath(_0xf17a5c.fsPath, "upsert"), ii.getInstance().watchWorkspaceCLIAgentsPath(_0xf17a5c.fsPath, "upsert"), na.getInstance().invalidatePath(_0xf17a5c.fsPath)]);
        }), this.fileSystemWatcher.onDidDelete(async _0x3ef5e6 => {
          await Promise.all([Sl.getInstance().watchWorkspaceTemplatePath(_0x3ef5e6.fsPath, 'delete'), ii.getInstance().watchWorkspaceCLIAgentsPath(_0x3ef5e6.fsPath, 'delete'), na.getInstance().invalidatePath(_0x3ef5e6.fsPath)]);
        }), this.fileRenameWatcher = vscode_module.workspace.onDidRenameFiles(async _0x1e1398 => {
          await Promise.all(_0x1e1398.files.flatMap(_0x24923e => [Sl.getInstance().watchWorkspaceTemplatePath(_0x24923e.oldUri.fsPath, 'delete'), Sl.getInstance().watchWorkspaceTemplatePath(_0x24923e.newUri.fsPath, "upsert"), ii.getInstance().watchWorkspaceCLIAgentsPath(_0x24923e.oldUri.fsPath, "delete"), ii.getInstance().watchWorkspaceCLIAgentsPath(_0x24923e.newUri.fsPath, 'upsert'), na.getInstance().invalidatePath(_0x24923e.oldUri.fsPath), na.getInstance().invalidatePath(_0x24923e.newUri.fsPath)]));
        }), _0x5a0c45.subscriptions.push(this.fileRenameWatcher), _0x5a0c45.subscriptions.push(this.fileSystemWatcher);
      }
      ['deactivate']() {
        this.fileRenameWatcher?.['dispose'](), this.fileSystemWatcher?.['dispose']();
      }
      static async ["isFileToWatch"](_0x430c18, _0x35a36f, _0x1de481) {
        try {
          let _0x45aa37 = TraycerPath.getRelativePath(_0x35a36f);
          if (_0x430c18.ignores(_0x45aa37)) return false;
          try {
            if (!(await fs_promises_module.stat(_0x35a36f)).isFile()) return false;
          } catch {
            if (!_0x1de481) return false;
          }
          return !(await isFileIgnoredByGit(vscode_module.Uri.file(_0x35a36f)));
        } catch (_0x284e6a) {
          return Logger.trace("Failed to check file existence: " + formatErrorToString(_0x284e6a)), false;
        }
      }
    };
  }),
  TabChangeWatcher,
  initFileSystemProviders = __esmModule(() => {
    'use strict';

    TabChangeWatcher = class {
      activate(context) {
        this.tabChangeWatcher = vscode_module.window.tabGroups.onDidChangeTabs(event => {
          this.handleTabChangeEvent(event);
        }), context.subscriptions.push(this.tabChangeWatcher);
      }
      deactivate() {
        this.tabChangeWatcher?.dispose();
      }
      handleTabChangeEvent(tabChangeEvent) {
        tabChangeEvent.closed.forEach(closedTab => {
          let tabUri = closedTab.input?.uri;
          tabUri instanceof vscode_module.Uri && MediaFileSystem.getInstance().delete(tabUri);
          let tabInput = closedTab.input;
          tabInput?.textDiffs?.length && tabInput.textDiffs.forEach(textDiff => {
            !(textDiff?.modified instanceof vscode_module.Uri) || !(textDiff?.original instanceof vscode_module.Uri) || (EditableFileSystem.getInstance().delete(textDiff.modified), TraycerFileSystem.getInstance().delete(textDiff.original));
          });
        });
      }
    };
  }),
  WorkspaceWatcher,
  initWorkspaceWatcher = __esmModule(() => {
    'use strict';

    initWorkspaceInfo(), initFilePathHandler(), WorkspaceWatcher = class {
      ['activate'](_0x5514e4) {
        this.workspaceChangeWatcher = vscode_module.workspace.onDidChangeWorkspaceFolders(_0x5251fa => this.handleWorkspaceChange()), _0x5514e4.subscriptions.push(this.workspaceChangeWatcher);
      }
      ["deactivate"]() {
        this.workspaceChangeWatcher?.['dispose']();
      }
      async ["handleWorkspaceChange"]() {
        na.getInstance().clearCache(), workspace_info.getInstance().invalidateWSInfo();
      }
    };
  }),
  wE = {
    mainWebsite: 'https://traycer.ai',
    mainWebsitePricing: "https://traycer.ai/#pricing1",
    mainWebsiteFAQ: "https://traycer.ai/#faq",
    mainWebsiteTasks: "https://traycer.ai/tasks",
    mainWebsiteReviews: 'https://traycer.ai/reviews',
    platformWebsite: 'https://platform.traycer.ai',
    platformWebsiteSettings: 'https://platform.traycer.ai/settings',
    openVsxMarketplaceWebsite: "https://open-vsx.org/extension/Traycer/traycer-vscode",
    vscMarketplaceWebsite: "https://marketplace.visualstudio.com/items?itemName=" + IT,
    privacyPolicy: "https://traycer.ai/privacy-policy",
    termsOfService: 'https://traycer.ai/terms-of-service',
    twitter: 'https://x.com/traycerai',
    twitterFollowIntent: 'https://x.com/intent/follow?screen_name=traycerai',
    github: 'https://github.com/traycerai',
    supportEmail: "support@traycer.ai",
    discord: 'https://traycer.ai/discord',
    linkedin: "https://www.linkedin.com/company/traycer"
  };
async function showReleaseNotesPanel(_0x2347a1, _0x56df76) {
  try {
    let _0x50fa66 = path_module.join(_0x2347a1.extensionPath, "resources", "changelog.md"),
      _0x54ed5 = await workspace_info.getInstance().readFile(_0x50fa66, false),
      _0x6b164a = _0x56df76.organizationSubscription ?? _0x56df76.userSubscription;
    _0x54ed5 = _0x54ed5 + '\x0a\x0a<hr>\x0a\x0a## Your Subscription Status: **' + createUuid(!_0x6b164a?.['orgID'], _0x6b164a.subscriptionStatus, _0x6b164a.isInTrial) + '**\x0a';
    let _0x45ad27 = _0x6b164a?.['subscriptionStatus'];
    if (_0x6b164a.isInTrial && _0x6b164a.trialEndsAt) {
      let _0x3992e1 = Math.ceil((_0x6b164a.trialEndsAt.getTime() - Date.now()) / 86400000);
      _0x54ed5 = _0x54ed5 + "\n- You are currently in a trial period of " + (_0x6b164a?.['orgID'] ? 'Business Pro' : 'Pro') + ' plan for Traycer which will end after ' + _0x3992e1 + ' days.\x0a';
    } else _0x45ad27 === prisma.SubscriptionStatus.PRO || _0x45ad27 === prisma.SubscriptionStatus.PRO_PLUS || _0x45ad27 === prisma.SubscriptionStatus.LITE || _0x45ad27 === prisma.SubscriptionStatus.PRO_LEGACY || _0x45ad27 === prisma.SubscriptionStatus.PRO_V2 || _0x45ad27 === prisma.SubscriptionStatus.PRO_PLUS_V2 || _0x45ad27 === prisma.SubscriptionStatus.LITE_V2 ? _0x54ed5 = '' + _0x54ed5 : _0x54ed5 = _0x54ed5 + '\x0a- You don\x27t have an active subscription. Upgrade to one of our [paid plans](' + wE.mainWebsitePricing + ") to continue using Traycer.";
    let _0x578e91 = vscode_module.window.createWebviewPanel("traycer.showReleaseNotes", "What's New", vscode_module.ViewColumn.One, {
      enableScripts: true
    });
    _0x578e91.webview.html = generateReleaseNotesHtml(_0x54ed5);
  } catch (_0x46b89f) {
    Logger.warn("Failed to show release notes", _0x46b89f);
  }
}
function generateReleaseNotesHtml(_0x56f4a6) {
  return "\n      <!DOCTYPE html>\n      <html lang=\"en\">\n      <head>\n          <meta charset=\"UTF-8\">\n          <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n          <style>\n              body {\n                padding: 10px 20px;\n                line-height: 22px;\n                max-width: 850px;\n                margin: 0 auto;\n            }\n\n            body *:last-child {\n                margin-bottom: 0;\n            }\n\n            img {\n                max-width: 100%;\n                max-height: 100%;\n            }\n\n            a {\n                text-decoration: var(--text-link-decoration);\n            }\n\n            a:hover {\n                text-decoration: underline;\n            }\n\n            a:focus,\n            input:focus,\n            select:focus,\n            textarea:focus {\n                outline: 1px solid -webkit-focus-ring-color;\n                outline-offset: -1px;\n            }\n\n            hr {\n                border: 0;\n                height: 1px;\n                border-bottom: 2px solid;\n            }\n\n            h1 {\n                padding-bottom: 0.3em;\n                line-height: 1.2;\n                border-bottom-width: 1px;\n                border-bottom-style: solid;\n                display: flex;\n                align-items: center;\n                gap: 2px;\n            }\n\n            h1, h2, h3 {\n                font-weight: normal;\n            }\n\n            table {\n                border-collapse: collapse;\n            }\n\n            th {\n                text-align: left;\n                border-bottom: 1px solid;\n            }\n\n            th,\n            td {\n                padding: 5px 10px;\n            }\n\n            table > tbody > tr + tr > td {\n                border-top-width: 1px;\n                border-top-style: solid;\n            }\n\n            blockquote {\n                margin: 0 7px 0 5px;\n                padding: 0 16px 0 10px;\n                border-left-width: 5px;\n                border-left-style: solid;\n            }\n\n            code {\n                font-family: \"SF Mono\", Monaco, Menlo, Consolas, \"Ubuntu Mono\", \"Liberation Mono\", \"DejaVu Sans Mono\", \"Courier New\", monospace;\n            }\n\n            pre {\n                padding: 16px;\n                border-radius: 3px;\n                overflow: auto;\n            }\n\n            pre code {\n                font-family: var(--vscode-editor-font-family);\n                font-weight: var(--vscode-editor-font-weight);\n                font-size: var(--vscode-editor-font-size);\n                line-height: 1.5;\n                color: var(--vscode-editor-foreground);\n                tab-size: 4;\n            }\n\n            .monaco-tokenized-source {\n                white-space: pre;\n            }\n\n            /** Theming */\n\n            .pre {\n                background-color: var(--vscode-textCodeBlock-background);\n            }\n\n            .vscode-high-contrast h1 {\n                border-color: rgb(0, 0, 0);\n            }\n\n            .vscode-light th {\n                border-color: rgba(0, 0, 0, 0.69);\n            }\n\n            .vscode-dark th {\n                border-color: rgba(255, 255, 255, 0.69);\n            }\n\n            .vscode-light h1,\n            .vscode-light hr,\n            .vscode-light td {\n                border-color: rgba(0, 0, 0, 0.18);\n            }\n\n            .vscode-dark h1,\n            .vscode-dark hr,\n            .vscode-dark td {\n                border-color: rgba(255, 255, 255, 0.18);\n            }\n\n            @media (forced-colors: active) and (prefers-color-scheme: light){\n                body {\n                    forced-color-adjust: none;\n                }\n            }\n\n            @media (forced-colors: active) and (prefers-color-scheme: dark){\n                body {\n                    forced-color-adjust: none;\n                }\n            }\n\n\n            .mtk1 { color: #d4d4d4; }\n            .mtk2 { color: #1e1e1e; }\n            .mtk3 { color: #000080; }\n            .mtk4 { color: #6a9955; }\n            .mtk5 { color: #569cd6; }\n            .mtk6 { color: #b5cea8; }\n            .mtk7 { color: #646695; }\n            .mtk8 { color: #d7ba7d; }\n            .mtk9 { color: #9cdcfe; }\n            .mtk10 { color: #f44747; }\n            .mtk11 { color: #ce9178; }\n            .mtk12 { color: #6796e6; }\n            .mtk13 { color: #808080; }\n            .mtk14 { color: #d16969; }\n            .mtk15 { color: #dcdcaa; }\n            .mtk16 { color: #4ec9b0; }\n            .mtk17 { color: #c586c0; }\n            .mtk18 { color: #4fc1ff; }\n            .mtk19 { color: #c8c8c8; }\n            .mtk20 { color: #cd9731; }\n            .mtk21 { color: #b267e6; }\n            .mtki { font-style: italic; }\n            .mtkb { font-weight: bold; }\n            .mtku { text-decoration: underline; text-underline-position: under; }\n            .mtks { text-decoration: line-through; }\n            .mtks.mtku { text-decoration: underline line-through; text-underline-position: under; }\n\n            /* codesetting */\n\n            code:has(.codesetting)+code:not(:has(.codesetting)) {\n                display: none;\n            }\n\n            code:has(.codesetting) {\n                background-color: var(--vscode-textPreformat-background);\n                color: var(--vscode-textPreformat-foreground);\n                padding-left: 1px;\n                margin-right: 3px;\n                padding-right: 0px;\n            }\n\n            code:has(.codesetting):focus {\n                border: 1px solid var(--vscode-button-border, transparent);\n            }\n\n            .codesetting {\n                color: var(--vscode-textPreformat-foreground);\n                padding: 0px 1px 1px 0px;\n                font-size: 0px;\n                overflow: hidden;\n                text-overflow: ellipsis;\n                outline-offset: 2px !important;\n                box-sizing: border-box;\n                text-align: center;\n                cursor: pointer;\n                display: inline;\n                margin-right: 3px;\n            }\n            .codesetting svg {\n                font-size: 12px;\n                text-align: center;\n                cursor: pointer;\n                border: 1px solid var(--vscode-button-secondaryBorder, transparent);\n                outline: 1px solid transparent;\n                line-height: 9px;\n                margin-bottom: -5px;\n                padding-left: 0px;\n                padding-top: 2px;\n                padding-bottom: 2px;\n                padding-right: 2px;\n                display: inline-block;\n                text-decoration: none;\n                text-rendering: auto;\n                text-transform: none;\n                -webkit-font-smoothing: antialiased;\n                -moz-osx-font-smoothing: grayscale;\n                user-select: none;\n                -webkit-user-select: none;\n            }\n            .codesetting .setting-name {\n                font-size: 13px;\n                padding-left: 2px;\n                padding-right: 3px;\n                padding-top: 1px;\n                padding-bottom: 1px;\n                margin-left: -5px;\n                margin-top: -3px;\n            }\n            .codesetting:hover {\n                color: var(--vscode-textPreformat-foreground) !important;\n                text-decoration: none !important;\n            }\n            code:has(.codesetting):hover {\n                filter: brightness(140%);\n                text-decoration: none !important;\n            }\n            .codesetting:focus {\n                outline: 0 !important;\n                text-decoration: none !important;\n                color: var(--vscode-button-hoverForeground) !important;\n            }\n            .codesetting .separator {\n                width: 1px;\n                height: 14px;\n                margin-bottom: -3px;\n                display: inline-block;\n                background-color: var(--vscode-editor-background);\n                font-size: 12px;\n                margin-right: 8px;\n            }\n\n            header { display: flex; align-items: center; padding-top: 1em; }\n\n            .experimental-tag {\n                background-color: #4d4d4d;\n                padding: 2px 6px;\n                border-radius: 3px;\n                font-family: monospace;\n                font-size: 0.9em;\n            }\n\n            .coupon-code {\n                display: inline-block;\n                background-color: #3794ff;\n                color: #fff;\n                padding: 4px 8px;\n                border-radius: 3px;\n                font-family: monospace;\n                cursor: pointer;\n            }\n\n            .copied-message {\n                color: #73c991;\n                margin-left: 8px;\n                opacity: 0;\n                transition: opacity 0.2s;\n            }\n\n            .copied-message.active {\n                opacity: 1;\n            }\n\n            footer {\n                margin-top: 20px;\n                padding-top: 20px;\n                border-top: 1px solid #3d3d3d;\n                color: #888888;\n            }\n            .footer-buttons {\n            display: flex;\n            justify-content: center;\n            gap: 16px;\n            }\n          </style>\n      </head>\n        <body class=\"vscode-dark\">\n            <div class=\"content\">\n                " + markdown_it_module({
    html: true
  }).render(_0x56f4a6) + '\x0a            </div>\x0a\x0a            <!-- Footer section with buttons -->\x0a            <footer>\x0a                <div class=\x22footer-buttons\x22>\x0a                    <a href=\x22' + wE.mainWebsitePricing + '\x22 target=\x22_blank\x22>Plans & Pricing</a>\x0a                    <a href=\x22' + wE.mainWebsiteFAQ + '\x22 target=\x22_blank\x22>FAQs</a>\x0a                    <a href=\x22' + wE.discord + "\" target=\"_blank\">Join Discord</a>\n                    <a href=\"" + wE.twitter + "\" target=\"_blank\">Follow on X (Twitter)</a>\n                </div>\n            </footer>\n        </body>\n        <script>\n            function copyCouponCode() {\n                const couponCodeElement = document.getElementById('coupon-code');\n                const couponCode = couponCodeElement.innerText;\n                const copiedMessage = document.getElementById('copied-message');\n\n                // Create a temporary input element\n                const tempInput = document.createElement('input');\n                tempInput.style.position = 'absolute';\n                tempInput.style.left = '-9999px';\n                tempInput.value = couponCode;\n\n                // Append the input element to the document body\n                document.body.appendChild(tempInput);\n\n                // Select the content of the input\n                tempInput.select();\n                tempInput.setSelectionRange(0, 99999); // For mobile devices\n\n                // Try to execute the copy command\n                try {\n                    document.execCommand('copy');\n\n                    // Show the \"Copied!\" message\n                    copiedMessage.classList.add('active');\n\n                    // Hide the message after 2 seconds\n                    setTimeout(() => {\n                        copiedMessage.classList.remove('active');\n                    }, 2000);\n                } catch (err) {\n                    console.error('Failed to copy the coupon code: ', err);\n                    alert('Failed to copy the coupon code.');\n                }\n\n                // Remove the temporary input element\n                document.body.removeChild(tempInput);\n            }\n        </script>\n      </html>\n      ";
}
var xQ = {};
__export(xQ, {
  activateExtension: () => initializeExtensionWithAuth,
  deactivateExtension: () => cleanupExtensionResources
});
async function initializeExtensionWithAuth(vscode_context) {
  initializeSentryClient();
  Logger.configure({
    name: '' + vscode_context.extension.packageJSON.displayName,
    createChannel: function (_0x1940f1) {
      return vscode_module.window.createOutputChannel(_0x1940f1, {
        log: true
      });
    }
  }, config.logLevel, vscode_context.extensionMode === vscode_module.ExtensionMode.Development);
  vscode_context.subscriptions.push(Logger);
  config.version = vscode_context.extension.packageJSON.version;
  // setSentryTag('Traycer Version', config.version);
  let _0x17e4bf = async () => {
      Logger.debug('Initializing Traycer subscriptions'), await H_.getInstance().sendWorkspaceStatus(), disposables.length || (await initializeExtensionServices(vscode_context, _0x2feb83));
    },
    _0x41b689 = async () => {
      Logger.debug('Disposing Traycer subscriptions'), vscode_module.Disposable.from(...disposables).dispose(), disposables = [];
    },
    _0x2feb83 = new TraycerCredentials(vscode_context, _0x17e4bf, _0x41b689);
  AuthCallbackHandler.getInstance(_0x2feb83);
  let _0x1655f7 = vscode_module.window.registerUriHandler(new U3());
  vscode_context.subscriptions.push(_0x1655f7), extensionContext = _0x2feb83;
  let _0x39ac3c = Qe.getInstance(vscode_context, _0x2feb83);
  await H_.getInstance().sendWorkspaceStatus(), (vscode_module.workspace.workspaceFolders?.['length'] ?? 0) !== 0 && (vscode_context.subscriptions.push(_0x39ac3c), _0x2feb83.setupAuth().catch(_0x3728ea => {
    Logger.error(_0x3728ea, "Failed to activate Traycer"), vscode_module.Disposable.from(...disposables).dispose(), disposables = [];
  }));
}
async function cleanupExtensionResources() {
  try {
    await WorkerPoolManager.cleanup(), Logger.trace("Worker pool cleanup completed");
  } catch (_0x271e46) {
    Logger.error(_0x271e46, "Failed to cleanup worker pool");
  }
  if (extensionContext) {
    try {
      extensionContext.dispose(), Logger.trace("Credentials instance disposed");
    } catch (_0x1fbfcc) {
      Logger.error(_0x1fbfcc, 'Failed to dispose credentials instance');
    }
    extensionContext = null;
  }
  vscode_module.Disposable.from(...disposables).dispose(), closeSentryClient().catch(_0x3e450a => {
    Logger.error(_0x3e450a, "Failed to close Sentry");
  });
}
async function initializeExtensionServices(context, authState_local) {
  // 获取认证令牌和用户信息
  let traycerToken = authState_local.traycerToken,
    traycerUser = authState_local.traycerUser;
  if (!traycerToken || !traycerUser) return;

  // 检查并显示更新说明,加载最后选择的Agent
  checkAndShowReleaseNotes(context, traycerUser);
  loadLastSelectedAgent(context);

  // 获取用户的providerHandle
  let providerHandle = traycerUser.user.providerHandle;
  providerHandle || (providerHandle = traycerUser.user.providerHandle);
  //setSentryTag("User", providerHandle);

  // 初始化WorkerPool
  await WorkerPoolManager.initWorkerPool();

  // 初始化PostHog分析实例
  yn.getInstance(providerHandle, traycerUser.user.email ?? void 0, traycerUser.user.privacyMode);

  // 创建gRPC凭证
  let grpcCredentials = config.nodeEnv !== 'local' ? grpc_module.ChannelCredentials.createSsl() : grpc_module.credentials.createSsl(null, null, null, {
      rejectUnauthorized: false,
      checkServerIdentity: () => {}
    }),
    grpcClient = await GrpcClient.open(authState_local, grpcCredentials),
    grpcDisposable = {
      dispose: () => grpcClient.close()
    };

  // 初始化各种管理器
  disposables.push(grpcDisposable);
  Nh.getInstance(grpcClient);
  initializeLanguageParsers(context);

  // 注册Traycer文件系统提供者
  let traycerFsProvider = vscode_module.workspace.registerFileSystemProvider(EXTENSION_ID, TraycerFileSystem.getInstance(), {
    isCaseSensitive: true,
    isReadonly: true
  });
  disposables.push(traycerFsProvider);

  // 注册Media文件系统提供者
  let mediaFsProvider = vscode_module.workspace.registerFileSystemProvider(MEDIA_VIEW_ID, MediaFileSystem.getInstance(), {
    isCaseSensitive: false,
    isReadonly: true
  });
  disposables.push(mediaFsProvider);

  // 注册可编辑Diff视图文件系统提供者
  let editableDiffFsProvider = vscode_module.workspace.registerFileSystemProvider(EDITABLE_DIFF_VIEW_ID, EditableFileSystem.getInstance(context), {
    isCaseSensitive: true
  });
  disposables.push(editableDiffFsProvider);

  // 初始化存储服务
  let storageService = zn.getInstance(grpcClient),
    persistenceManager = await PersistenceManager.getInstancePromise(context, storageService);

  // 从存储加载数据
  await Vt.getInstance().fetchFromStorage();

  // 获取订阅信息
  new Gf(authState_local).handle({
    type: il.FETCH_SUBSCRIPTION
  }).catch(subscriptionError => {
    Logger.error(subscriptionError, "Failed to fetch subscription");
  });

  // 初始化使用量追踪器并获取速率限制
  let usageTracker = UsageTracker.getInstance(grpcClient);
  usageTracker.fetchRateLimitUsage(false, false).catch(rateLimitError => {
    Logger.error(rateLimitError, "Failed to fetch rate limit usage");
  });
  let usageTrackerDisposable = {
    dispose: () => usageTracker.dispose()
  };
  disposables.push(usageTrackerDisposable);

  // 更新仓库映射
  await Du.getInstance().upsertRepoMappings();

  // 创建文件监视器
  let {
    disposables: watcherDisposables
  } = createWatchers(context, authState_local);
  disposables.push(...watcherDisposables);

  // 注册所有VSCode命令
  await registerAllVscodeCommands(context);

  // 监听配置变化
  let configChangeDisposable = vscode_module.workspace.onDidChangeConfiguration(configEvent => {
    configEvent.affectsConfiguration("traycer.additionalAgents") && Xr.syncStateToWebview();
  });
  disposables.push(configChangeDisposable);

  // 初始化LLM缓存处理器
  let llmCacheHandler = await LlmCacheHandler.getInstance(),
    llmCacheDisposable = {
      dispose: () => llmCacheHandler.shutdown()
    };
  disposables.push(llmCacheDisposable);

  // 从磁盘加载持久化数据
  persistenceManager.loadDataFromDisk();

  // 初始化文件监视器管理器
  let fileWatcherManager = br.getInstance();
  await fileWatcherManager.startWatcher();
  let fileWatcherDisposable = {
    dispose: () => fileWatcherManager.dispose()
  };
  disposables.push(fileWatcherDisposable);

  // 初始化Yolo产物管理器
  let yoloArtifactManager = YoloArtifactManager.getInstance(),
    yoloDisposable = {
      dispose: () => yoloArtifactManager.dispose()
    };
  disposables.push(yoloDisposable);

  // 将所有disposables添加到context订阅
  context.subscriptions.push(...disposables);

  // 标记为已激活
  config.activated = true;

  // 发送扩展激活状态
  await S0.sendExtensionActivationStatus();
}
function loadLastSelectedAgent(_0x144cda) {
  let _0x466f4e = _0x144cda.globalState.get(LAST_SELECTED_IDE_AGENT_KEY);
  _0x466f4e && (config.lastUsedIDEAgent = _0x466f4e);
}
function checkAndShowReleaseNotes(_0x938fbe, _0xdaf2b7) {
  let _0x270e06 = _0x938fbe.globalState.get('traycer.installedVersion'),
    _0x3992e3 = config.version;
  (!_0x270e06 || _0x270e06 !== _0x3992e3 && isMinorOrMajorVersionChange(_0x270e06, _0x3992e3) || _0x938fbe.extensionMode === vscode_module.ExtensionMode.Development) && showReleaseNotesPanel(_0x938fbe, _0xdaf2b7), _0x938fbe.extensionMode !== vscode_module.ExtensionMode.Development && _0x270e06 !== _0x3992e3 && _0x938fbe.globalState.update("traycer.installedVersion", _0x3992e3);
}
function isMinorOrMajorVersionChange(_0x2192e4, _0x4068d2) {
  let _0x2fa6b5 = (0, semver_module.parse)(_0x2192e4),
    _0x40b882 = (0, semver_module.parse)(_0x4068d2);
  return !_0x2fa6b5 || !_0x40b882 ? false : _0x2fa6b5.major !== _0x40b882.major || _0x2fa6b5.minor !== _0x40b882.minor;
}
function initializeLanguageParsers(_0x1c0698) {
  Cg.getInstance(_0x1c0698.extensionUri), hh.getInstance(_0x1c0698.extensionUri), LT.getInstance(_0x1c0698.extensionUri), DT.getInstance(_0x1c0698.extensionUri), MT.getInstance(_0x1c0698.extensionUri), NT.getInstance(_0x1c0698.extensionUri), SnippetContextProvider.getInstance();
}
function createWatchers(_0x350ec6, _0x1620ee) {
  let _0xc4def2 = new DocsWatcher();
  _0xc4def2.activate(_0x350ec6);
  let _0x2fdafe = {
      dispose: () => _0xc4def2.deactivate()
    },
    _0x2615c4 = new ConfigWatcher(_0x1620ee);
  _0x2615c4.activate(_0x350ec6);
  let _0x33b7e3 = {
      dispose: () => _0x2615c4.deactivate()
    },
    _0x38c982 = new FileWatcher();
  _0x38c982.activate(_0x350ec6);
  let _0x3a71cf = {
      dispose: () => _0x38c982.deactivate()
    },
    _0x597385 = new TabChangeWatcher();
  _0x597385.activate(_0x350ec6);
  let _0x597338 = {
      dispose: () => _0x597385.deactivate()
    },
    _0x3d5053 = new WorkspaceWatcher();
  return _0x3d5053.activate(_0x350ec6), {
    disposables: [_0x2fdafe, _0x33b7e3, _0x3a71cf, _0x597338, {
      dispose: () => _0x3d5053.deactivate()
    }],
    docsWatcher: _0xc4def2,
    configChangeWatcher: _0x2615c4,
    stateWatcher: _0x38c982,
    tabChangeWatcher: _0x597385,
    workspaceChangeWatcher: _0x3d5053
  };
}
async function registerAllVscodeCommands(_0xd4420e) {
  return Promise.all([registerExtensionCommands(_0xd4420e), registerTaskChainCommands(_0xd4420e), registerShowTemplateErrorsCommand(_0xd4420e)]);
}
var disposables,
  extensionContext,
  initExtension = __esmModule(() => {
    'use strict';

    initTraycerCredentials(), initGrpcClient(), initExtensionCommands(), initTaskChainCommands(), initSearchConfig(), initTaskChainManager(), initAnalytics(), initSnippetContextProvider(), initGoParser(), initJavaScriptParser(), initPythonParser(), initRustParser(), initTypeScriptParserExports(), initTypeScriptParser(), initPersistenceManager(), initStatusBar(), initLlmCacheHandler(), initRepoMappingManager(), initTaskRunner(), initTemplateManager(), initMigrationLogger(), initUsageTracker(), initConfigWatcher(), initDocsWatcher(), initFileWatcher(), initFileSystemProviders(), initWorkspaceWatcher(), initCommentNavigatorDeps(), initCliAgentHandler(), initTaskSettingsHandler(), initUsageInfoHandler(), initTrackMetricsHandler(), initWorkspaceInfo(), initTaskContext(), disposables = [], extensionContext = null;
  }),
  sSt = {};
__export(sSt, {
  activate: () => activateExtension,
  deactivate: () => deactivateExtension
}), module.exports = __toCommonJS(sSt);
async function activateExtensionAsync(_0x426cfb) {
  let {
    activateExtension: _0x3cce95
  } = await Promise.resolve().then(() => (initExtension(), xQ));
  return _0x3cce95(_0x426cfb);
}
async function deactivateExtensionAsync() {
  let {
    deactivateExtension: _0x5cadab
  } = await Promise.resolve().then(() => (initExtension(), xQ));
  return _0x5cadab();
}
async function activateExtension(_0x1a0601) {
  try {
    await activateExtensionAsync(_0x1a0601);
  } catch (_0x3614e3) {
    Logger.error('Error activating Traycer: ', formatErrorToString(_0x3614e3));
  }
}
async function deactivateExtension() {
  try {
    await deactivateExtensionAsync();
  } catch (_0x5e13f5) {
    Logger.warn("Error deactivating Traycer: ", _0x5e13f5);
  }
}
0 && (module.exports = {
  activate: activate,
  deactivate: deactivate
});

/*! Bundled license information:

@posthog/core/dist/vendor/uuidv7.js:
  (*! For license information please see uuidv7.js.LICENSE.txt *)
  (**
   * uuidv7: An experimental implementation of the proposed UUID Version 7
   *
   * @license Apache-2.0
   * @copyright 2021-2023 LiosK
   * @packageDocumentation
   *)

chokidar/esm/index.js:
  (*! chokidar - MIT License (c) 2012 Paul Miller (paulmillr.com) *)

lodash/lodash.js:
  (**
   * @license
   * Lodash <https://lodash.com/>
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *)

is-extendable/index.js:
  (*!
   * is-extendable <https://github.com/jonschlinkert/is-extendable>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   *)

strip-bom-string/index.js:
  (*!
   * strip-bom-string <https://github.com/jonschlinkert/strip-bom-string>
   *
   * Copyright (c) 2015, 2017, Jon Schlinkert.
   * Released under the MIT License.
   *)

web-streams-polyfill/dist/ponyfill.es2018.js:
  (**
   * @license
   * web-streams-polyfill v3.3.3
   * Copyright 2024 Mattias Buelens, Diwank Singh Tomer and other contributors.
   * This code is released under the MIT license.
   * SPDX-License-Identifier: MIT
   *)

fetch-blob/index.js:
  (*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)

formdata-polyfill/esm.min.js:
  (*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)

node-domexception/index.js:
  (*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)

gtoken/build/cjs/src/index.cjs:
  (*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE *)

@grpc/proto-loader/build/src/util.js:
@grpc/proto-loader/build/src/index.js:
  (**
   * @license
   * Copyright 2018 gRPC authors.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *
   *)

long/umd/index.js:
  (**
   * @license
   * Copyright 2009 The Closure Library Authors
   * Copyright 2020 Daniel Wirtz / The long.js Authors.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *
   * SPDX-License-Identifier: Apache-2.0
   *)
*/