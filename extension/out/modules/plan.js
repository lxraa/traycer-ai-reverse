'use strict';

/**
 * Plan Module - 管理任务计划的生成、存储和执行
 * 
 * 主要类:
 * - PlanStepManager: 计划步骤管理器
 * - PlanConversation: 计划对话
 * - BasePlanOutput: 计划输出基类
 * - ImplementationPlanOutput: 实现计划输出
 * - PlanOutputWithReview: 带审查的计划输出
 * - PlanOutputFactory: 计划输出工厂
 */

// 导入外部依赖
const { AgentRegistry } = require("./agent_registry.js");
const { WorkspaceInfoManager, BaseStorage ,getGitRootAndRelativePath,executeGitCommand} = require("./workspace_info.js");
const { Logger } = require("./logger.js");
const { StorageSerializer } = require("./task_migrators.js");
const { FilePathHandler } = require("./file_path_handler.js");
const uuid_module = require("uuid");
const {GitHubTicketQueryBuilder,TICKET_SOURCE} = require("./github_ticket_query_builder.js");
const vscode_module = require("vscode");
const {TraycerPath,FilePath} = require("./path_types.js");
const createUuid = uuid_module.v4;
const path_module = require("path");
const {DocumentManager,getGitFileRelativePath,searchFilesWithRipgrep} = require("./workspace_info.js");
const {LlmCacheHandler} = require("./llm_cache_handler.js");
const {config, isWindows, DEFAULT_RG_ARGS, MAX_SEARCH_RESULTS} = require("./config.js");
const {IMAGE_MIME_TYPES,MAX_FILE_SIZE} = require("./constants.js")
const {
  RipgrepCommandBuilder,
  RipgrepExecutor
} = require("./ripgrep.js");
const {WorkerPoolManager} = require("./workerpool.js");


class CustomSet {
  ['items'] = [];
  ["equals"];
  constructor(equalsFunc, initialItems) {
    if (this.equals = equalsFunc, this.items = [], initialItems && initialItems.length > 0) {
      for (let key of initialItems) this.add(key);
    }
  }
  ["add"](item) {
    this.has(item) || this.items.push(item);
  }
  ['has'](item) {
    return this.items.some(existingItem => this.equals(existingItem, item));
  }
  ["values"]() {
    return [...this.items];
  }
  ['union'](otherSet) {
    let result = new CustomSet(this.equals);
    return this.values().forEach(item => result.add(item)), otherSet.values().forEach(item => result.add(item)), result;
  }
  ['intersection'](otherSet) {
    let result = new CustomSet(this.equals);
    return this.values().forEach(item => {
      otherSet.has(item) && result.add(item);
    }), result;
  }
  ['difference'](otherSet) {
    let result = new CustomSet(this.equals);
    return this.values().forEach(item => {
      otherSet.has(item) || result.add(item);
    }), result;
  }
  ['isSubsetOf'](otherSet) {
    return this.values().every(item => otherSet.has(item));
  }
  ['clear']() {
    this.items = [];
  }
  get ["size"]() {
    return this.items.length;
  }
}
async function searchFoldersWithRipgrep(_0x10d4d2, _0x249521, _0x1d3546, _0x4ffec6 = 50, _0x1850be = true) {
  let _0x1ff9c5 = await config.getRipgrepBinPath();
  if (!_0x1ff9c5) throw new Error('ripgrep binary not found');
  if (!(await WorkspaceInfoManager.getInstance().fileExists(_0x10d4d2))) return Logger.warn("Path to list folders in does not exist", _0x10d4d2), [];
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

const SUPPORTED_IMAGE_TYPES_STRING = Array.from(IMAGE_MIME_TYPES.keys()).join(', ');
class UnsupportedImageTypeError extends Error {
    constructor(imageType) {
      super("Attached image is not supported." + ' ' + imageType + ". Supported types are " + SUPPORTED_IMAGE_TYPES_STRING + '.'), this.name = 'UnsupportedImageTypeError';
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

async function getGitRootPath(_0x1783be) {
  try {
    let [_0x27af39, _0x4a7964] = await getGitRootAndRelativePath(_0x1783be);
    return await executeGitCommand("show HEAD:" + _0x4a7964, _0x27af39, false);
  } catch (_0x11e2e5) {
    return Logger.debug("Failed to get file contents", _0x11e2e5), '';
  }
}
function parseDiffStatusChar(_0x2072d3) {
  switch (_0x2072d3) {
    case 'A':
      return GitFileStatus.INDEX_ADDED;
    case 'M':
      return GitFileStatus.MODIFIED;
    case 'D':
      return GitFileStatus.DELETED;
    case 'R':
      return GitFileStatus.INDEX_RENAMED;
    case 'C':
      return GitFileStatus.INDEX_COPIED;
    case 'T':
      return GitFileStatus.TYPE_CHANGED;
    case 'U':
      return GitFileStatus.BOTH_MODIFIED;
    default:
      return Logger.debug('Unrecognized diff status: ' + _0x2072d3), GitFileStatus.UNKNOWN_STATUS;
  }
}

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
  let _0x5f088e = await WorkspaceInfoManager.getInstance().readFile(_0x5f17a7, false);
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
async function listDirectoriesWithRuleFiles(_0x55874b) {
  let _0x37518b = [..._0x55874b.map(_0x1e29f3 => ({
      fsPath: TraycerPath.fromPathProto(_0x1e29f3.path),
      directory: _0x1e29f3
    }))].sort((_0x3ce35b, _0x24c93c) => _0x3ce35b.fsPath.absPath.length > _0x24c93c.fsPath.absPath.length ? 1 : _0x3ce35b.fsPath.absPath.length < _0x24c93c.fsPath.absPath.length ? -1 : 0),
    _0x1b6d8f = [],
    _0x5812ba = [];
  for (let key of _0x37518b) {
    if (isPathContainedInDirectories(key.fsPath, _0x1b6d8f)) continue;
    if (!(await WorkspaceInfoManager.getInstance().fileExists(key.fsPath.absPath))) {
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
        _0x59321b !== GitFileStatus.DELETED && _0x59321b !== GitFileStatus.INDEX_DELETED && (_0x3a8602 = await getFileContentAtRef(_0x3ef3bf, _0x453b4e, key.filePath)), _0x59321b !== GitFileStatus.INDEX_ADDED && _0x59321b !== GitFileStatus.UNTRACKED && (_0x4ae3f6 = await getFileContentAtRef(_0x3ef3bf, _0x57a26c, key.previousPath || key.filePath));
      } else {
        if (_0x59321b !== GitFileStatus.DELETED && _0x59321b !== GitFileStatus.INDEX_DELETED) {
          let _0x1f028f = path_module.join(_0x860a51, key.filePath);
          _0x3a8602 = await DocumentManager.getSourceCode(_0x1f028f);
        }
        _0x59321b !== GitFileStatus.INDEX_ADDED && _0x59321b !== GitFileStatus.UNTRACKED && (_0x4ae3f6 = await getFileContentAtRef(_0x3ef3bf, _0x2b4220, key.previousPath || key.filePath));
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


async function createUntrackedFileDiff(_0x3d2f01, _0x1d7278) {
  try {
    let _0x162430 = path_module.join(_0x3d2f01, _0x1d7278),
      _0x39ccf2 = '';
    try {
      _0x39ccf2 = await DocumentManager.getSourceCode(_0x162430);
    } catch (_0x1f71f6) {
      Logger.debug('Failed to get untracked file content', {
        error: _0x1f71f6,
        filePath: _0x1d7278
      });
    }
    let _0x1723da = createNewFileDiff(_0x39ccf2, _0x1d7278);
    return createFileChangeInfo(_0x3d2f01, _0x1d7278, _0x1723da, GitFileStatus.UNTRACKED, _0x39ccf2, void 0, void 0);
  } catch (_0x13833d) {
    return Logger.debug("Failed to create FileDelta for untracked file", {
      error: _0x13833d,
      filePath: _0x1d7278
    }), createFileChangeInfo(_0x3d2f01, _0x1d7278, '', GitFileStatus.UNTRACKED, '', void 0, void 0);
  }
}


async function createFileDeltaFromStatus(_0x1e821c, _0x132241, _0x462b16, _0x336590, _0x52e6f7) {
  try {
    if (_0x336590 === GitFileStatus.UNTRACKED) return await createUntrackedFileDiff(_0x1e821c, _0x462b16);
    let _0x2f5f0f = path_module.join(_0x1e821c, _0x462b16),
      _0x567180 = '';
    try {
      _0x567180 = await DocumentManager.getSourceCode(_0x2f5f0f);
    } catch (_0x23ebc6) {
      Logger.debug('Failed to get current file content', {
        error: _0x23ebc6,
        filePath: _0x462b16
      });
    }
    let _0x4ab882;
    if (_0x336590 !== GitFileStatus.DELETED && _0x336590 !== GitFileStatus.INDEX_DELETED) {
      let _0x17e942 = _0x52e6f7 || _0x462b16,
        _0x426d52 = vscode_module.Uri.file(path_module.join(_0x1e821c, _0x17e942));
      _0x4ab882 = await getGitRootPath(_0x426d52);
    }
    let _0x2cc5d2 = '';
    try {
      _0x336590 === GitFileStatus.DELETED || _0x336590 === GitFileStatus.INDEX_DELETED ? _0x2cc5d2 = await executeGitCommand('diff HEAD -- \x22' + _0x462b16 + '\x22', _0x1e821c, false) : _0x336590 === GitFileStatus.INDEX_RENAMED && _0x52e6f7 ? _0x2cc5d2 = await executeGitCommand("diff HEAD -- \"" + _0x52e6f7 + '\x22 \x22' + _0x462b16 + '\x22', _0x1e821c, false) : _0x2cc5d2 = await executeGitCommand("diff HEAD -- \"" + _0x462b16 + '\x22', _0x1e821c, false);
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

const GitFileStatus = {
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

async function enrichAttachmentContext(_0x23ee1e) {
  let _0x316721 = await LlmCacheHandler.getInstance(),
    _0x11c9dd = await Promise.all(_0x23ee1e.files.map(async _0xbd0fd => {
      let _0x3128a4 = TraycerPath.fromPathProto(_0xbd0fd.path);
      try {
        let _0x56e628 = _0xbd0fd.content || (await DocumentManager.getSourceCode(_0x3128a4.absPath));
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

function formatContextFileContent(_0x6b6682) {
  if (_0x6b6682.file?.["b64content"]) {
    let _0x2f6258 = path_module.extname(_0x6b6682.file.fileName);
    if (IMAGE_MIME_TYPES.has(_0x2f6258.toLowerCase())) {
      if (_0x6b6682.file.b64content.length > MAX_FILE_SIZE) throw new Error("Attached image " + _0x6b6682.file.fileName + " is too large. Maximum size is " + MAX_FILE_SIZE + " bytes.");
    } else throw new UnsupportedImageTypeError(_0x6b6682.file.fileName);
  }
}

function parseGitStatusCode(_0x2a340d) {
  if (_0x2a340d.length !== 2) return Logger.debug('Invalid git status code length: ' + _0x2a340d), GitFileStatus.UNKNOWN_STATUS;
  let _0x2a22f0 = _0x2a340d[0],
    _0x373619 = _0x2a340d[1];
  return _0x2a340d === '??' ? GitFileStatus.UNTRACKED : _0x2a340d === '!!' ? GitFileStatus.IGNORED : _0x2a340d === 'DD' ? GitFileStatus.BOTH_DELETED : _0x2a340d === 'AU' ? GitFileStatus.ADDED_BY_US : _0x2a340d === 'UD' ? GitFileStatus.DELETED_BY_THEM : _0x2a340d === 'UA' ? GitFileStatus.ADDED_BY_THEM : _0x2a340d === 'DU' ? GitFileStatus.DELETED_BY_US : _0x2a340d === 'AA' ? GitFileStatus.BOTH_ADDED : _0x2a340d === 'UU' ? GitFileStatus.BOTH_MODIFIED : _0x2a22f0 === 'M' ? GitFileStatus.INDEX_MODIFIED : _0x2a22f0 === 'A' ? GitFileStatus.INDEX_ADDED : _0x2a22f0 === 'D' ? GitFileStatus.INDEX_DELETED : _0x2a22f0 === 'R' ? GitFileStatus.INDEX_RENAMED : _0x2a22f0 === 'C' ? GitFileStatus.INDEX_COPIED : _0x2a22f0 === 'T' ? GitFileStatus.TYPE_CHANGED : _0x2a22f0 === 'I' ? GitFileStatus.INTENT_TO_ADD : _0x373619 === 'M' ? GitFileStatus.MODIFIED : _0x373619 === 'D' ? GitFileStatus.DELETED : _0x373619 === 'T' ? GitFileStatus.TYPE_CHANGED : (Logger.debug("Unrecognized git status code: " + _0x2a340d), GitFileStatus.UNKNOWN_STATUS);
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

// 从主文件导入的依赖（需要在主文件中定义）
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

async function resolveGitMentions(_0x346575) {
  if (_0x346575.length === 0) return [];
  let _0x2e19c4 = [],
    _0x2e2123 = new Set(),
    _0x489433 = vscode_module.Uri.file(WorkspaceInfoManager.getInstance().getWorkspaceDirs()[0]);
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
async function parseAndFormatUserQuery(_0x2bd6eb, _0x253e4d) {
  let _0x4b797c = parseUserQueryContent(_0x2bd6eb, _0x253e4d);
  if (_0x4b797c.attachments.length > 0) {
    for (let key of _0x4b797c.attachments) formatContextFileContent(key);
  }
  return _0x4b797c;
}


async function parseAndEnrichUserQuery(_0x469cbe) {
  let {
      userQuery: _0x5d2bff,
      sourceContext: _0x58dd0a,
      attachments: _0x161ff0,
      githubTicketRef: _0x4d0ac8,
      gitMentions: _0x9ccb80
    } = await parseAndFormatUserQuery(_0x469cbe, WorkspaceInfoManager.getInstance().getPlatform()),
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
function formatVerificationResult(_0x219b5a) {
  switch (_0x219b5a.ticketSource) {
    case TICKET_SOURCE.GITHUB_TICKET:
      return new GitHubTicketQueryBuilder(_0x219b5a);
    default:
      throw new Error("Unsupported ticket source: " + _0x219b5a.ticketSource);
  }
}

// ==================== 枚举和常量 ====================

/**
 * 制品类型枚举
 */
const ArtifactType = {
  IMPLEMENTATION_ARTIFACT: 0,
  REVIEW_ARTIFACT: 1
};

// ==================== 存储API辅助函数 ====================

function findPlanConversationIndex(planData, conversationId) {
  let index = planData.planConversations.findIndex(conv => conv.id === conversationId);
  if (index === -1) {
    throw new Error("Plan conversation storage API: Plan conversation with id " + conversationId + ' not found in plan.');
  }
  return index;
}

function getPlanConversationById(planData, conversationId) {
  let index = findPlanConversationIndex(planData, conversationId);
  return planData.planConversations[index];
}

function updatePlanConversation(planData, conversation) {
  let index = findPlanConversationIndex(planData, conversation.id);
  planData.planConversations[index] = conversation;
}

function deletePlanConversation(planData, conversationId) {
  let index = findPlanConversationIndex(planData, conversationId);
  planData.planConversations.splice(index, 1);
}

/**
 * 计划对话存储API
 */
class PlanConversationStorageAPI {
  constructor(planStorageAPI) {
    this.planStorageAPI = planStorageAPI;
  }

  async read(conversationId) {
    let planData = await this.planStorageAPI.read();
    return getPlanConversationById(planData, conversationId);
  }

  async upsert(conversation, transaction) {
    let planData = await this.planStorageAPI.read();
    updatePlanConversation(planData, conversation);
    await this.planStorageAPI.upsert(planData, transaction);
  }

  async runInTransaction(callback) {
    return this.planStorageAPI.runInTransaction(callback);
  }

  async delete(conversationId, transaction) {
    let planData = await this.planStorageAPI.read();
    deletePlanConversation(planData, conversationId);
    await this.planStorageAPI.upsert(planData, transaction);
  }

  getAdapter(conversationId) {
    return new PlanConversationStorageAdapter(this, conversationId);
  }
}

/**
 * 计划对话存储适配器
 */
class PlanConversationStorageAdapter extends BaseStorage {}

// ==================== 错误类 ====================

/**
 * 实现计划未找到错误
 */
class ImplementationPlanNotFoundError extends Error {
  constructor(message = "Implementation plan not found") {
    super(message);
    this.name = "ImplementationPlanNotFoundError";
  }
}

/**
 * 审查输出未找到错误
 */
class ReviewOutputNotFoundError extends Error {
  constructor(message = 'Review output not found in plan output') {
    super(message);
    this.name = 'ReviewOutputNotFoundError';
  }
}

/**
 * 无效计划输出错误
 */
class InvalidPlanOutputError extends Error {
  constructor(message = 'No valid output type found in plan output') {
    super(message);
    this.name = 'InvalidPlanOutputError';
  }
}

// ==================== 计划输出类 ====================

/**
 * 计划输出基类
 */
class BasePlanOutput {
  constructor(planOutput) {
    this.planOutput = planOutput;
    this.validateOutput();
  }

  validateOutput() {
    if (!this.planOutput) {
      throw new Error("Plan output cannot be null or undefined");
    }
  }

  throwNotFoundError(itemName) {
    throw new Error(itemName + " not found in plan output");
  }
}

/**
 * 实现计划输出
 */
class ImplementationPlanOutput extends BasePlanOutput {
  constructor(planOutput) {
    super(planOutput);
  }

  validateOutput() {
    super.validateOutput();
    if (!this.planOutput.implementationPlan) {
      throw new ImplementationPlanNotFoundError();
    }
  }

  setPlanSummary(summary) {
    if (!this.planOutput.implementationPlan) {
      throw new ImplementationPlanNotFoundError();
    }
    this.planOutput.implementationPlan.aiGeneratedSummary = summary;
  }

  getImplementationPlan() {
    if (!this.planOutput.implementationPlan) {
      this.throwNotFoundError("ImplementationPlan");
    }
    return this.planOutput.implementationPlan;
  }

  serializeToStorage() {
    return {
      implementationPlan: this.getImplementationPlan(),
      reviewOutput: null
    };
  }

  async serializeToUI() {
    let plan = this.getImplementationPlan();
    return {
      implementationPlan: {
        ...plan,
        output: await FilePathHandler.convertFilePath(plan.output)
      },
      reviewOutput: void 0
    };
  }

  serializeToWire() {
    return this.getImplementationPlan();
  }
}

/**
 * 带审查的计划输出
 * 注意: 这个类依赖很多主文件中的类和函数,暂时保留桩
 */
class PlanOutputWithReview extends BasePlanOutput {
  constructor(planOutput) {
    super(planOutput);
    this.initializeReviewOutput();
  }

  validateOutput() {
    super.validateOutput();
    if (!this.planOutput.reviewOutput) {
      throw new ReviewOutputNotFoundError();
    }
  }

  initializeReviewOutput() {
    let reviewOutput = this.planOutput.reviewOutput;
    if (!reviewOutput) {
      throw new ReviewOutputNotFoundError("ReviewOutput not found in plan output");
    }
    // TODO: 需要 ReviewOutput.createFromProto
    // this.reviewOutputInstance = ReviewOutput.createFromProto(reviewOutput);
  }

  setPlanSummary(summary) {
    if (!this.planOutput.reviewOutput) {
      throw new ReviewOutputNotFoundError();
    }
    this.planOutput.reviewOutput.aiGeneratedSummary = summary;
  }

  getReviewOutputProto() {
    if (!this.planOutput.reviewOutput) {
      throw new ReviewOutputNotFoundError('ReviewOutput not found in plan output');
    }
    return this.planOutput.reviewOutput;
  }

  serializeToStorage() {
    return {
      reviewOutput: this.planOutput.reviewOutput,
      implementationPlan: null
    };
  }

  async serializeToUI() {
    return {
      reviewOutput: this.planOutput.reviewOutput,
      implementationPlan: void 0
    };
  }

  serializeToWire() {
    return this.getReviewOutputProto();
  }
}

/**
 * 计划输出工厂
 */
class PlanOutputFactory {
  static createHandler(planOutput) {
    if (!planOutput) {
      throw new InvalidPlanOutputError('Plan output cannot be null or undefined');
    }

    let outputCount = [
      planOutput.implementationPlan != null,
      planOutput.reviewOutput != null
    ].filter(Boolean).length;

    if (outputCount === 0) {
      throw new InvalidPlanOutputError(
        'No output found: expected one of explanationPlan or implementationPlan, reviewOutput'
      );
    }

    if (outputCount > 1) {
      throw new InvalidPlanOutputError(
        'Multiple outputs present: plan output must be mutually exclusive. One of explanationPlan or implementationPlan, reviewOutput'
      );
    }

    if (planOutput.implementationPlan !== void 0 && planOutput.implementationPlan !== null) {
      return new ImplementationPlanOutput(planOutput);
    }

    if (planOutput.reviewOutput !== void 0 && planOutput.reviewOutput !== null) {
      return new PlanOutputWithReview(planOutput);
    }

    throw new InvalidPlanOutputError(
      'No valid output type found. Plan output must contain one of: explanationPlan, implementationPlan, or reviewOutput'
    );
  }
}

// ==================== 用户查询消息类 ====================

/**
 * 用户查询消息基类
 */
class UserQueryMessage {
  constructor(
    queryContent,
    payload,
    llmInput,
    logs,
    isStreaming,
    isAborted,
    hasFailed,
    id
  ) {
    this._queryJSONContent = null;
    this._id = id;

    let { userQueryWithMentions, attachments } = parseUserQueryContent(
      queryContent,
      WorkspaceInfoManager.getInstance().getPlatform()
    );

    if (!attachments.length || isStreaming) {
      this._queryJSONContent = queryContent;
    }

    this._queryWithMentions = userQueryWithMentions;
    this._payload = payload;
    this._llmInput = llmInput;
    this._logs = logs;
    this._isStreaming = isStreaming;
    this._isAborted = isAborted;
    this._hasFailed = hasFailed;
  }

  get id() {
    return this._id;
  }

  get queryWithMentions() {
    return this._queryWithMentions;
  }

  get payload() {
    return this._payload;
  }

  get isStreaming() {
    return this._isStreaming;
  }

  get isAborted() {
    return this._isAborted;
  }

  get hasFailed() {
    return this._hasFailed;
  }

  get logs() {
    return this._logs;
  }

  findLogEntry(logId) {
    return this._logs.find(log => log.id === logId);
  }

  updateLog(logEntry) {
    let existingLog = this.findLogEntry(logEntry.id);
    if (existingLog) {
      existingLog.content = logEntry.content;
      existingLog.childrenThinkings = logEntry.childrenThinkings;
      existingLog.isCompleted = logEntry.isCompleted;
    } else {
      this._logs.push(logEntry);
    }
    return this._logs;
  }
}

/**
 * 计划对话类
 */
class PlanConversation extends UserQueryMessage {
  constructor(storageAPI, userQuery, llmInput, options = {}) {
    super(
      userQuery,
      options.plan,
      llmInput,
      options.logs ?? [],
      options.isStreaming ?? false,
      options.isAborted ?? false,
      options.hasFailed ?? false,
      options.id ?? createUuid()
    );
    this._storageAPI = storageAPI;
  }

  static async createNewInstance(storageAPI, userQuery, llmInput, upsertCallback, options = {}) {
    let instance = new PlanConversation(storageAPI, userQuery, llmInput, options);
    await upsertCallback({
      id: instance.id,
      userQuery: userQuery,
      llmInput: StorageSerializer.toStorage(llmInput),
      plan: null,
      logs: []
    });
    return instance;
  }

  get storageAPI() {
    return this._storageAPI;
  }

  async setIsStreaming(value) {
    this._isStreaming = value;
  }

  async setIsAborted(value) {
    this._isAborted = value;
  }

  async setHasFailed(value) {
    this._hasFailed = value;
  }

  async getUserQuery() {
    if (this._queryJSONContent) {
      return this._queryJSONContent;
    }
    return (await this.storageAPI.read()).userQuery;
  }

  async setUserQuery(queryContent, persist) {
    let { userQueryWithMentions, attachments } = parseUserQueryContent(
      queryContent,
      WorkspaceInfoManager.getInstance().getPlatform()
    );

    this._queryWithMentions = userQueryWithMentions;

    if (!attachments.length || this._isStreaming) {
      this._queryJSONContent = queryContent;
    } else {
      this._queryJSONContent = null;
    }

    if (persist) {
      return this.upsertOnDisk(data => {
        data.userQuery = queryContent;
      });
    }
  }

  async getLLMInput() {
    let data = await this.storageAPI.read();
    return StorageSerializer.fromStorage(data.llmInput);
  }

  async setLLMInput(llmInput) {
    return this.upsertOnDisk(data => {
      data.llmInput = StorageSerializer.toStorage(llmInput);
    });
  }

  async serializeToUIHeavy() {
    return {
      id: this.id,
      userQuery: await this.getUserQuery(),
      plan: this.payload ?? void 0,
      logs: this._logs,
      isStreaming: this._isStreaming
    };
  }

  async handlePlanOutput(planOutput, llmInput) {
    this._isStreaming = false;
    this._payload = planOutput;

    if (this._queryJSONContent) {
      await this.setUserQuery(this._queryJSONContent, false);
    }

    await this.upsertOnDisk(data => {
      data.plan = {
        implementationPlan: planOutput.implementationPlan ?? null,
        reviewOutput: planOutput.reviewOutput ?? null
      };
      data.llmInput = StorageSerializer.toStorage(llmInput);
      data.logs = this._logs;
    });
  }

  static async deserializeFromStorage(storedData, storageAPI) {
    return new PlanConversation(
      storageAPI,
      storedData.userQuery,
      StorageSerializer.fromStorage(storedData.llmInput),
      {
        id: storedData.id,
        logs: storedData.logs,
        isStreaming: false,
        isAborted: false,
        hasFailed: false,
        plan: storedData.plan
      }
    );
  }

  async dispose() {}

  async upsertOnDisk(updateFn) {
    return this.storageAPI.runInTransaction(async (transaction) => {
      let data = await this.storageAPI.read();
      updateFn(data);
      await this.storageAPI.upsert(data, transaction);
    });
  }
}

// ==================== 计划步骤管理器 ====================

/**
 * 计划步骤管理器
 */
class PlanStepManager {
  constructor(
    parentPlan,
    planStorageAdapter,
    planArtifactType,
    generatedPlan,
    queryContent,
    isStreaming,
    planSummary,
    options = {}
  ) {
    this._parentPlan = parentPlan;
    this._planStorageAdapter = planStorageAdapter;
    this._planArtifactType = planArtifactType;
    this._generatedPlan = null;
    this._queryJSONContent = null;
    this._isExecuted = false;
    this._executedWithAgent = null;
    this._isPayAsYouGo = false;
    this._planOutputHandler = null;
    this._isQueryExecutedDirectly = false;

    this._id = options.id ?? createUuid();
    this._planConversations = options.planConversations ?? [];
    this._executedWithAgent = options.executedWithAgent
      ? AgentRegistry.getInstance().getAgentInfoIfExists(options.executedWithAgent)
      : null;
    this._isExecuted = options.isExecuted ?? false;
    this._isPayAsYouGo = options.isPayAsYouGo ?? false;
    this._logs = options.logs ?? [];
    this._hasSentCreationMetrics = options.hasSentCreationMetrics ?? false;
    this._generatedPlan = generatedPlan;

    let { userQueryWithMentions, attachments } = parseUserQueryContent(
      queryContent,
      WorkspaceInfoManager.getInstance().getPlatform()
    );

    if (!attachments.length || isStreaming) {
      this._queryJSONContent = queryContent;
    }

    this._queryWithMentions = userQueryWithMentions;
    this._isStreaming = isStreaming;
    this._isQueryExecutedDirectly = options.isQueryExecutedDirectly ?? false;
  }

  static async createNewInstance(
    artifactType,
    parentPlan,
    storageAdapter,
    queryContent,
    isStreaming,
    upsertCallback,
    options = {}
  ) {
    let instance = new PlanStepManager(
      parentPlan,
      storageAdapter,
      artifactType,
      null,
      queryContent,
      isStreaming,
      void 0,
      options
    );

    await upsertCallback({
      id: instance.id,
      queryJsonContent: queryContent,
      llmInput: null,
      isExecuted: false,
      isPayAsYouGo: false,
      hasSentCreationMetrics: false,
      executedWithAgent: null,
      logs: [],
      planConversations: [],
      parentPlanID: parentPlan?.id ?? null,
      generatedPlan: null,
      planArtifactType: artifactType,
      isQueryExecutedDirectly: false,
      planSummary: void 0
    });

    return instance;
  }

  // ==================== Getters ====================

  get id() {
    return this._id;
  }

  get isExecuted() {
    return this._isExecuted;
  }

  get executedWithAgent() {
    return this._executedWithAgent;
  }

  get isPayAsYouGo() {
    return this._isPayAsYouGo;
  }

  get isQueryExecutedDirectly() {
    return this._isQueryExecutedDirectly;
  }

  get parentPlan() {
    return this._parentPlan;
  }

  get generatedPlan() {
    return this._generatedPlan;
  }

  get planArtifactType() {
    return this._planArtifactType;
  }

  get storageAPI() {
    return this._planStorageAdapter;
  }

  get hasSentCreationMetrics() {
    return this._hasSentCreationMetrics;
  }

  get logs() {
    return this._logs;
  }

  get queryWithMentions() {
    return this._queryWithMentions;
  }

  get planConversations() {
    return this._planConversations;
  }

  get activeConversation() {
    return this._activeConversation;
  }

  get outputHandler() {
    if (this._planOutputHandler) {
      return this._planOutputHandler;
    }
    return this.createOutputHandler();
  }

  get mustGetPlanOutput() {
    if (!this._generatedPlan) {
      throw new ImplementationPlanNotFoundError();
    }
    return this._generatedPlan;
  }

  // ==================== 输出处理器方法 ====================

  createOutputHandler() {
    if (!this._generatedPlan) {
      return null;
    }
    let handler = PlanOutputFactory.createHandler(this._generatedPlan);
    this._planOutputHandler = handler;
    return handler;
  }

  mustGetOutputHandler() {
    let handler = this.outputHandler;
    if (!handler) {
      throw new Error("Output handler not found");
    }
    return handler;
  }

  mustGetReviewOutput() {
    let handler = this.mustGetOutputHandler();
    if (handler instanceof PlanOutputWithReview) {
      return handler.getReviewOutputProto();
    }
    throw new ReviewOutputNotFoundError();
  }

  mustGetReviewOutputHandler() {
    let handler = this.mustGetOutputHandler();
    if (handler instanceof PlanOutputWithReview) {
      return handler;
    }
    throw new ReviewOutputNotFoundError();
  }

  mustGetImplementationPlan() {
    let handler = this.mustGetOutputHandler();
    if (handler instanceof ImplementationPlanOutput) {
      return handler.getImplementationPlan();
    }
    throw new ImplementationPlanNotFoundError();
  }

  // ==================== 计划摘要 ====================

  async setPlanSummary(summary) {
    let handler = this.mustGetOutputHandler();
    handler.setPlanSummary(summary);
    await this.upsertToDisk(data => {
      data.generatedPlan = handler.serializeToStorage();
    });
  }

  // ==================== 指标相关 ====================

  async sendCreationMetrics(metricsHandler, metricsData) {
    try {
      if (!this._hasSentCreationMetrics) {
        metricsHandler.increment("task_plan_generation", metricsData);
        this._hasSentCreationMetrics = true;
        await this.upsertToDisk(data => {
          data.hasSentCreationMetrics = true;
        });
      }
    } catch (error) {
      Logger.warn('Failed to send creation metrics for plan ' + this.id, error);
    }
  }

  // ==================== 执行状态 ====================

  async setIsExecuted(value, persist) {
    this._isExecuted = value;
    if (persist) {
      await this.upsertToDisk(data => {
        data.isExecuted = value;
      });
    }
  }

  async setExecutedWithAgent(agentId) {
    this._executedWithAgent = agentId
      ? AgentRegistry.getInstance().getAgentInfo(agentId)
      : null;

    if (agentId) {
      this._isExecuted = true;
    } else {
      this._isExecuted = false;
    }

    await this.upsertToDisk(data => {
      data.executedWithAgent = agentId;
      data.isExecuted = this._isExecuted;
    });
  }

  async setPayAsYouGo(value) {
    this._isPayAsYouGo = value;
    await this.upsertToDisk(data => {
      data.isPayAsYouGo = value;
    });
  }

  async setQueryExecutedDirectly(value) {
    this._isQueryExecutedDirectly = value;
    await this.upsertToDisk(data => {
      data.isQueryExecutedDirectly = value;
    });
  }

  // ==================== 查询内容 ====================

  async getQueryJSONContent() {
    if (this._queryJSONContent) {
      return this._queryJSONContent;
    }
    return (await this.storageAPI.read()).queryJsonContent;
  }

  async setQueryJSONContent(queryContent, persist) {
    let { userQueryWithMentions, attachments } = parseUserQueryContent(
      queryContent,
      WorkspaceInfoManager.getInstance().getPlatform()
    );

    if (!attachments.length || this._isStreaming) {
      this._queryJSONContent = queryContent;
    } else {
      this._queryJSONContent = null;
    }

    this._queryWithMentions = userQueryWithMentions;

    if (persist) {
      await this.upsertToDisk(data => {
        data.queryJsonContent = queryContent;
      });
    }
  }

  async setQueryJSONContentAndArtifactType(queryContent, artifactType, persist) {
    await this.setQueryJSONContent(queryContent, false);
    await this.setPlanArtifactType(artifactType, false);

    if (persist) {
      await this.upsertToDisk(data => {
        data.queryJsonContent = queryContent;
        data.planArtifactType = artifactType;
      });
    }
  }

  async setPlanArtifactType(artifactType, persist) {
    this._planArtifactType = artifactType;
    if (persist) {
      await this.upsertToDisk(data => {
        data.planArtifactType = artifactType;
      });
    }
  }

  async updateQueryAndPlanArtifactType(queryContent, artifactType) {
    await this.setQueryJSONContent(queryContent, false);
    await this.setPlanArtifactType(artifactType, false);
    await this.upsertToDisk(data => {
      data.queryJsonContent = queryContent;
      data.planArtifactType = artifactType;
    });
  }

  // ==================== LLM 输入 ====================

  async getLLMInput() {
    if (this._planConversations.length) {
      return this._planConversations[this._planConversations.length - 1].getLLMInput();
    }
    let data = await this.storageAPI.read();
    return StorageSerializer.fromStorage(data.llmInput);
  }

  async setLLMInput(llmInput) {
    if (this._activeConversation) {
      await this._activeConversation.setLLMInput(llmInput);
    } else {
      await this.upsertToDisk(data => {
        data.llmInput = StorageSerializer.toStorage(llmInput);
      });
    }
  }

  // ==================== 计划输出处理 ====================

  async handlePlanOutput(planOutput, llmInput, isPayAsYouGo) {
    let isConversationOutput = false;

    this._isStreaming = false;

    if (this._activeConversation) {
      await this._activeConversation.handlePlanOutput(planOutput, llmInput);
      isConversationOutput = true;
    } else {
      this._generatedPlan = planOutput;
      this.createOutputHandler();

      if (this._queryJSONContent) {
        await this.setQueryJSONContent(this._queryJSONContent, false);
      }
    }

    this.disposeActiveConversation();

    if (isPayAsYouGo !== void 0) {
      this._isPayAsYouGo = isPayAsYouGo;
    }

    await this.upsertToDisk(data => {
      if (isPayAsYouGo !== void 0) {
        data.isPayAsYouGo = isPayAsYouGo;
      }

      if (!isConversationOutput) {
        data.logs = this._logs;
        data.llmInput = StorageSerializer.toStorage(llmInput);
        data.generatedPlan = this.mustGetOutputHandler().serializeToStorage();
      }
    });
  }

  async handleImplementationPlanDelta(delta) {
    if (!this._generatedPlan) {
      this._generatedPlan = {
        implementationPlan: {
          output: ''
        }
      };
    }

    let plan = this.mustGetImplementationPlan();
    plan.output += delta;
    return this.mustGetOutputHandler().serializeToUI();
  }

  async handlePlanGenerationFailure() {
    this._isPayAsYouGo = false;
    this._isStreaming = false;
    this._logs = [];

    if (this._queryJSONContent) {
      await this.setQueryJSONContent(this._queryJSONContent, false);
    }

    await this.upsertToDisk(data => {
      data.isPayAsYouGo = false;
      data.logs = [];
    });
  }

  // ==================== 日志 ====================

  findLogEntry(logId) {
    return this._logs.find(log => log.id === logId);
  }

  updateLog(logEntry) {
    if (this._activeConversation) {
      this._activeConversation.updateLog(logEntry);
    } else {
      let existingLog = this.findLogEntry(logEntry.id);
      if (existingLog) {
        existingLog.content = logEntry.content;
        existingLog.childrenThinkings = logEntry.childrenThinkings;
        existingLog.isCompleted = logEntry.isCompleted;
      } else {
        this._logs.push(logEntry);
      }
    }
    return this._logs;
  }

  // ==================== 对话管理 ====================

  isPlanConvInProgress() {
    return !!this._activeConversation;
  }

  removeActiveConversation() {
    this._planConversations.pop();
    this._activeConversation = void 0;
  }

  async startNewConversation(userQuery) {
    let conversationId = createUuid();

    let upsertCallback = async (data) => {
      await this.upsertToDisk(storedData => {
        storedData.planConversations.push(data);
      });
    };

    let conversation = await PlanConversation.createNewInstance(
      new PlanConversationStorageAPI(this.storageAPI).getAdapter(conversationId),
      userQuery,
      null,
      upsertCallback,
      {
        id: conversationId,
        hasFailed: false,
        isAborted: false,
        isStreaming: true
      }
    );

    this._activeConversation = conversation;
    this._planConversations.push(conversation);
    return conversation;
  }

  disposeActiveConversation() {
    if (this._activeConversation) {
      this._activeConversation = void 0;
    }
  }

  // ==================== Markdown ====================

  async getMarkdown() {
    return this.mustGetImplementationPlan().output;
  }

  // ==================== 重置计划 ====================

  async resetPlan(queryContent, artifactType) {
    let { userQueryWithMentions } = parseUserQueryContent(
      queryContent,
      WorkspaceInfoManager.getInstance().getPlatform()
    );

    this._logs = [];
    this._generatedPlan = null;
    this._planOutputHandler = null;
    this._queryWithMentions = userQueryWithMentions;
    this._isQueryExecutedDirectly = false;
    this._isExecuted = false;
    this._executedWithAgent = null;

    await this.setQueryJSONContent(queryContent, false);

    await Promise.all(this._planConversations.map(conv => conv.dispose()));
    this._planConversations = [];
    this._activeConversation = void 0;
    this._planArtifactType = artifactType;

    await this.upsertToDisk(data => {
      data.logs = [];
      data.queryJsonContent = queryContent;
      data.isExecuted = false;
      data.executedWithAgent = null;
      data.planConversations = [];
      data.logs = [];
      data.llmInput = null;
      data.generatedPlan = null;
      data.isQueryExecutedDirectly = false;
      data.planArtifactType = artifactType;
    });
  }

  // ==================== 序列化 ====================

  async serializeToUIHeavy(activePlanId) {
    return {
      id: this.id,
      queryWithMentions: this.queryWithMentions,
      queryJsonContent: await this.getQueryJSONContent(),
      logs: this._logs,
      generatedPlan: await this.outputHandler?.serializeToUI(),
      isActive: activePlanId === this.id,
      planConversations: await Promise.all(
        this._planConversations.map(conv => conv.serializeToUIHeavy())
      ),
      isExecuted: this._isExecuted,
      executedWithAgent: this._executedWithAgent,
      isPayAsYouGo: this._isPayAsYouGo,
      planArtifactType: this._planArtifactType,
      isQueryExecutedDirectly: this._isQueryExecutedDirectly
    };
  }

  async serializeToPlanWithUserPrompt(identifier) {
    let queryContent = await this.getQueryJSONContent();
    let planOutput = this.mustGetPlanOutput;

    return {
      userPrompt: await parseAndEnrichUserQuery(queryContent),
      plan: planOutput,
      identifier: {
        ...identifier,
        planID: this.id
      }
    };
  }

  async persistOutput() {
    await this.upsertToDisk(data => {
      data.generatedPlan = this.mustGetOutputHandler().serializeToStorage();
    });
  }

  // ==================== 反序列化 ====================

  static async deserializeFromStorage(storedData, parentPlan, storageAdapter) {
    if (storedData.parentPlanID !== void 0 && storedData.parentPlanID !== null) {
      if (parentPlan !== null && parentPlan.id !== storedData.parentPlanID) {
        Logger.warn(
          "Parent plan mismatch while deserializing plan " + storedData.id +
          ". Expected parent " + storedData.parentPlanID +
          ", but got " + parentPlan.id + '.'
        );
      }
    }

    let conversations = storedData.planConversations;

    // 清理未完成的对话
    if (conversations.length > 0) {
      let lastConv = conversations[conversations.length - 1];
      if (lastConv.userQuery && !lastConv.plan) {
        conversations.pop();
      }
    }

    let generatedPlan = null;
    if (storedData.generatedPlan) {
      generatedPlan = storedData.generatedPlan;
    }

    let artifactType = storedData.planArtifactType;
    if (generatedPlan) {
      if (generatedPlan.reviewOutput) {
        artifactType = ArtifactType.REVIEW_ARTIFACT;
      } else {
        artifactType = ArtifactType.IMPLEMENTATION_ARTIFACT;
      }
    }

    return new PlanStepManager(
      parentPlan,
      storageAdapter,
      artifactType,
      generatedPlan,
      storedData.queryJsonContent,
      false,
      storedData.planSummary,
      {
        id: storedData.id,
        planConversations: await Promise.all(
          conversations.map(conv =>
            PlanConversation.deserializeFromStorage(
              conv,
              new PlanConversationStorageAPI(storageAdapter).getAdapter(conv.id)
            )
          )
        ),
        isExecuted: storedData.isExecuted,
        executedWithAgent: storedData.executedWithAgent ?? void 0,
        isPayAsYouGo: storedData.isPayAsYouGo,
        hasSentCreationMetrics: storedData.hasSentCreationMetrics,
        isQueryExecutedDirectly: storedData.isQueryExecutedDirectly,
        logs: storedData.logs
      }
    );
  }

  static persistedPlanFromPersistedTicketPlan(ticketInput, persistedTicket) {
    if (!persistedTicket.ticketInput) {
      throw new Error("No ticket input found");
    }

    let queryContent = formatVerificationResult(ticketInput).constructJsonQuery(persistedTicket);

    return {
      id: createUuid(),
      queryJsonContent: queryContent,
      logs: persistedTicket.thinkings,
      planConversations: [],
      llmInput: null,
      isExecuted: false,
      executedWithAgent: null,
      hasSentCreationMetrics: false,
      generatedPlan: {
        implementationPlan: persistedTicket?.plan?.implementationPlan ?? null,
        reviewOutput: persistedTicket?.plan?.reviewOutput ?? null
      },
      isPayAsYouGo: false,
      parentPlanID: null,
      planArtifactType: ArtifactType.IMPLEMENTATION_ARTIFACT,
      isQueryExecutedDirectly: false,
      planSummary: void 0
    };
  }

  // ==================== 存储 ====================

  async upsertToDisk(updateFn) {
    return this._planStorageAdapter.runInTransaction(async (transaction) => {
      let data = await this.storageAPI.read();
      updateFn(data);
      await this._planStorageAdapter.upsert(data, transaction);
    });
  }

  // ==================== 清理 ====================

  async dispose() {
    this._logs = [];
    this._planConversations = [];
    this._activeConversation = void 0;
    this._queryWithMentions = '';
    this._isExecuted = false;
    this._isQueryExecutedDirectly = false;
    this._executedWithAgent = null;
    this._isPayAsYouGo = false;
  }
}

// ==================== 导出 ====================

module.exports = {
  // 主要类
  PlanStepManager,
  PlanConversation,
  UserQueryMessage,

  // 输出类
  BasePlanOutput,
  ImplementationPlanOutput,
  PlanOutputWithReview,
  PlanOutputFactory,

  // 错误类
  ImplementationPlanNotFoundError,
  ReviewOutputNotFoundError,
  InvalidPlanOutputError,

  // 枚举和常量
  ArtifactType,

  // 工具类
  CustomSet,

  // 存储类
  PlanConversationStorageAPI,
  PlanConversationStorageAdapter,

  // 工具函数
  parseUserQueryContent,
  parseAndFormatUserQuery,
  parseAndEnrichUserQuery,
  formatVerificationResult,
  enrichAttachmentContext,
  resolveGitMentions,
  getUncommittedFileDeltas,
  searchFoldersWithRipgrep,
  listDirectoryWithAgentsMd,
  isPathContainedInDirectories,
  getAgentsMdContent
};

