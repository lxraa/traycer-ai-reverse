const { getAgentIcon } = require("./agent_registry.js");


const {EXTENSION_ID, MEDIA_VIEW_ID, EDITABLE_DIFF_VIEW_ID} = require("./constants.js");

const {Logger} = require("./logger.js");

const {config,isWindows, DEFAULT_RG_ARGS, MAX_SEARCH_RESULTS } = require("./config.js");
const vscode_module = require("vscode");

const {TraycerPath,PlatformType } = require("./path_types.js");
const {
    RipgrepCommandBuilder,
    RipgrepExecutor
  } = require("./ripgrep.js");

// 缺失
const path_module = require("path");
const fs_promises_module = require("fs/promises");

// 缺失
const { Mutex } = require("./mutex.js");
const { RequestQueue } = require("./request_queue.js");
const util_module = require("util");
const child_process_module = require("child_process");
const lru_map_module = require("lru_map");

class RowParseError extends Error {
    constructor(_0x54d0db, _0x2ed8d5, _0x11573b) {
      super("Failed to parse row with ID=" + _0x54d0db + ' from table ' + _0x11573b + (_0x2ed8d5 ? ': ' + _0x2ed8d5 : '')), this.rowId = _0x54d0db, this.name = 'RowParseError', Object.setPrototypeOf(this, RowParseError.prototype);
    }
  };

function formatErrorToString(_0x78ccb6) {
    return _0x78ccb6 instanceof Error ? 'Error Name: ' + _0x78ccb6.name + '\x0aError Message: ' + _0x78ccb6.message + '\x0aError Stack: ' + _0x78ccb6.stack : '' + _0x78ccb6;
}

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

class InvalidRepoUrlError extends Error {
    constructor(_0x41024b) {
      super(_0x41024b), this.name = "InvalidRepoUrlError";
    }
  }


class RepoMappingMigrator{
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

class BaseStorage {
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



class BaseStorageAPI {
    constructor(_0x593325, _0x401801, _0x54beb4, _0x40747b, _0x3a5601) {
      this.MAX_ITEMS_TO_PRE_FILL_IN_MEMORY_CACHE = 20, this.inMemoryCache = new lru_map_module.LRUMap(this.MAX_ITEMS_TO_PRE_FILL_IN_MEMORY_CACHE), this.context = _0x593325, this.tableName = _0x401801, this.appAssetsDB = _0x54beb4, this.currentVersion = _0x40747b, this.dataValidityDuration = BaseStorageAPI.DATA_VALIDITY_DURATION, this.maxItemsToPersist = _0x3a5601;
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
      for (let key of _0x4e7003) key instanceof RowParseError || _0x553b67.push(key);
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





class RepoMappingStorage extends BaseStorageAPI {
    constructor(_0x1fbe6c, _0xa0fc6) {
      super(_0x1fbe6c, 'RepoMapping', _0xa0fc6, config.CURRENT_REPO_WORKSPACE_MAPPING_VERSION, config.REPO_WORKSPACE_MAPPING_SIZE), this.shouldInvalidateData = false, this.shouldInvalidateData = false;
    }
    static {
      this.instance = null;
    }
    static ['getInstance'](_0x122d74, _0x25f934) {
      if (!RepoMappingStorage.instance) {
        if (!_0x122d74 || !_0x25f934) throw new Error("Context and appAssetsDB are required");
        RepoMappingStorage.instance = new RepoMappingStorage(_0x122d74, _0x25f934);
      }
      return RepoMappingStorage.instance;
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


class RepoMapping {
    constructor(_0x47594d, _0x4135bd) {
      this._repoUrl = _0x47594d, this._gitRoot = _0x4135bd, this._repoID = RepoMapping.getRepoID(this._repoUrl);
      let _0x53547a = RepoMappingStorage.getInstance();
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
      let _0x45f916 = RepoMapping.getRepoID(_0x21b7ab),
        _0x247a99 = RepoMappingStorage.getInstance(),
        _0x3c6027 = await new PlanStorage(_0x247a99, _0x45f916).read();
      return new RepoMapping(_0x3c6027.repoUrl, _0x3c6027.workspacePath);
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


async function getAllRepoMappingsFromUri(_0x7ca9c1) {
    try {
      let _0x408af2 = await getGitBranch(_0x7ca9c1),
        _0x77255c = (await executeGitCommand("remote -v | awk '{print $2}'", _0x408af2, true)).split('\x0a').map(_0x53ba85 => _0x53ba85.trim()).filter(_0x25b0e0 => _0x25b0e0 !== '');
      return Array.from(new Set(_0x77255c)).map(_0x591d81 => new RepoMapping(_0x591d81, _0x408af2));
    } catch (_0x545926) {
      throw Logger.debug("Failed to get all repo mappings", _0x545926), new InvalidRepoUrlError("Failed to get repo mappings for " + _0x7ca9c1.fsPath);
    }
  }

async function getRepoMappingFromUri(_0x21d9a6) {
    try {
      let _0x11698b = await getGitBranch(_0x21d9a6),
        _0x4bad89 = await executeGitCommand('config --get remote.origin.url', _0x11698b, true);
      return new RepoMapping(_0x4bad89, _0x11698b);
    } catch (_0xf03117) {
      throw Logger.debug("Failed to get repo mapping", _0xf03117), new InvalidRepoUrlError('Failed to get repo mapping for ' + _0x21d9a6.fsPath);
    }
  }

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

class DocumentManager {
    static {
      this.concurrencyLimiter = new RequestQueue(5, 200, 2000);
    }
    static async ["getSourceCode"](_0x37304d) {
      let _0x40d5e7 = await DocumentManager.getCachedTextDocument(_0x37304d);
      return _0x40d5e7 ? _0x40d5e7.getText() : WorkspaceInfoManager.getInstance().readFile(_0x37304d, false);
    }
    static async ['saveDocument'](_0xe4fa0a) {
      let _0x18ba5d = await DocumentManager.getTextDocument(_0xe4fa0a);
      _0x18ba5d.isDirty && (await _0x18ba5d.save());
    }
    static async ['getCachedTextDocument'](_0x8cd8c3) {
      let _0x46ace8 = vscode_module.Uri.file(_0x8cd8c3),
        _0x4ddba6 = vscode_module.workspace.textDocuments.find(_0x5aec35 => _0x5aec35.uri.toString() === _0x46ace8.toString());
      if (_0x4ddba6) return _0x4ddba6;
    }
    static async ["getTextDocument"](_0x1bfaca) {
      let _0x91bc78 = vscode_module.Uri.file(_0x1bfaca),
        _0x4c8a6e = await DocumentManager.getCachedTextDocument(_0x1bfaca);
      return _0x4c8a6e || DocumentManager.enqueueOpenTextDocument(_0x91bc78);
    }
    static async ['enqueueOpenTextDocument'](_0x1633d2) {
      return DocumentManager.concurrencyLimiter.enqueueRequest(() => DocumentManager.openDocumentWithTimeout(_0x1633d2));
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
      return DocumentManager.concurrencyLimiter.enqueueRequest(() => DocumentManager.openNotebookDocumentWithTimeout(_0x52d2d8));
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

async function searchFilesWithRipgrep(_0x5639f8, _0x5cdd49, _0x4b2c47, _0x4d5e92, _0x401908 = 50, _0x2cee82 = true) {
    let _0x4eeab0 = await config.getRipgrepBinPath();
    if (!_0x4eeab0) throw new Error('ripgrep binary not found');
    if (!(await WorkspaceInfoManager.getInstance().fileExists(_0x5639f8))) return Logger.warn('Path to list files in does not exist', _0x5639f8), '';
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

async function getGitRootAndRelativePath(_0x5ea10a) {
    let _0x13fd9a = await RepoMappingManager.getInstance().getRepoMapping(_0x5ea10a);
    if (!_0x13fd9a) throw new Error('File is not part of a git repo');
    let _0x1b4cb7 = _0x13fd9a.gitRoot,
      _0x2e00cb = isWindows ? _0x1b4cb7.toLowerCase().replace(/\//g, '\x5c') : _0x1b4cb7,
      _0x2cb7f0 = _0x5ea10a.fsPath.replace(_0x2e00cb, '').slice(1);
    return [_0x1b4cb7, isWindows ? _0x2cb7f0.replace(/\\/g, '/') : _0x2cb7f0];
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

function createRemoteOrLocalUri(_0x3faf3f) {
    let _0xc5a098 = _0x3faf3f;
    return vscode_module.env.remoteName ? (formatTimeAgo() && (_0xc5a098 = formatRelativeTime(_0x3faf3f)), vscode_module.Uri.parse("vscode-remote://" + vscode_module.env.remoteName + _0xc5a098)) : vscode_module.Uri.file(_0xc5a098);
  }

  
class RepoMappingManager {
    constructor() {
      this.repoMappings = new Map();
    }
    static ['getInstance']() {
      return RepoMappingManager.instance || (RepoMappingManager.instance = new RepoMappingManager()), RepoMappingManager.instance;
    }
    async ["getRepoMapping"](_0x56a2c9) {
      let _0x26bd4e = (await TraycerPath.fromPath(_0x56a2c9.fsPath)).absPath,
        _0xf4fc53 = this.repoMappings.get(_0x26bd4e);
      return _0xf4fc53 || (_0xf4fc53 = await getRepoMappingFromUri(_0x56a2c9), await _0xf4fc53.upsertInStorage(), this.repoMappings.set(_0x26bd4e, _0xf4fc53)), _0xf4fc53;
    }
    async ['upsertRepoMappings']() {
      let _0x3df180 = WorkspaceInfoManager.getInstance().getWorkspaceDirs();
      await Promise.allSettled(_0x3df180.map(async _0x4c5bbe => {
        let _0x5d1b1e = await getAllRepoMappingsFromUri(createRemoteOrLocalUri(_0x4c5bbe));
        await Promise.allSettled(_0x5d1b1e.map(async _0x399240 => {
          await _0x399240.upsertInStorage();
        }));
      }));
    }
    async ["fetchRepoMapping"](_0x2f7852, _0x1395cf) {
      let _0x3dd5cb = "https://github.com/" + _0x1395cf + '/' + _0x2f7852;
      return await RepoMapping.fetchFromStorage(_0x3dd5cb);
    }
  };


  function formatTimeAgo() {
    return vscode_module.env.remoteName !== void 0 && ['wsl', "ssh-remote", 'dev-container', "attached-container", "tunnel"].includes(vscode_module.env.remoteName) && process.platform === 'win32';
  }
  function formatRelativeTime(_0x1b8f4c) {
    let _0x54752f = _0x1b8f4c.split('\x5c').join('/');
    return _0x54752f[1] === ':' && (_0x54752f = _0x54752f.slice(2)), _0x54752f;
  }

function formatRangeSnippet(_0x352b00, _0xbfbdb3) {
    if (_0x352b00.workspaceFile === void 0) {
      let _0x257eec = new Set(_0x352b00.workspaceFolders.map(_0x1a8e0a => _0x1a8e0a.absPath)),
        _0x53c0f3 = new Set(WorkspaceInfoManager.getInstance().getWorkspaceDirs()),
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

class WorkspaceAssociation {
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
      return _0x3657dc && !(await WorkspaceInfoManager.getInstance().fileExists(_0x3657dc.absPath)) && (_0x3657dc = void 0), new WorkspaceAssociation(_0x3657dc, _0x3664a8);
    }
    async ["determineWorkspaceScope"]() {
      return formatRangeSnippet(this, (await WorkspaceInfoManager.getInstance().getCurrentWSInfo()).WSAssociation.workspaceFile);
    }
    ["serializeToStorage"]() {
      return {
        workspaceFile: this._workspaceFile ? this._workspaceFile.serializeToStorage() : void 0,
        workspaceFolders: this._workspaceFolders.map(_0x5764f1 => _0x5764f1.serializeToStorage())
      };
    }
  };

class WorkspaceInfoManager {
    constructor() {
      this.wsInfoInitLock = new Mutex(), this._currentWSInfo = void 0, this.concurrencyLimiter = new RequestQueue(10, 200, 5000);
    }
    static {
      this.MAX_BYTES = 100000;
    }
    static ["getInstance"]() {
      return WorkspaceInfoManager.instance || (WorkspaceInfoManager.instance = new WorkspaceInfoManager()), WorkspaceInfoManager.instance;
    }
    async ["getTreeSitterWasmDir"]() {
      return path_module.join(__dirname, '..', 'tree-sitter-wasm');
    }
    async ["getTiktokenWorkerPoolPath"]() {
      return path_module.join(__dirname, '..', '..', "resources", "tiktokenWorkerPool.js");
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
            _0x646619 = new WorkspaceAssociation(_0x3defff, _0x8e5081);
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
      return path_module.join(__dirname, '..', '..', "resources");
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
      return process.platform === 'win32' ? PlatformType.WINDOWS : PlatformType.POSIX;
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
        return _0x531515 ? new TextDecoder().decode(_0x4efa76.slice(0, WorkspaceInfoManager.MAX_BYTES)) : new TextDecoder().decode(_0x4efa76);
      } catch (_0x31717e) {
        if (Logger.debug('Error reading file', _0x31717e, _0x20f64c), !_0x3866a1) {
          let _0x475e98 = createRemoteOrLocalUri(_0x20f64c);
          try {
            let _0x3cb024 = await (0, fs_promises_module.lstat)(_0x475e98.fsPath);
            if (_0x3cb024.size > 10 * WorkspaceInfoManager.MAX_BYTES || _0x3cb024.isDirectory()) return '';
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
        let _0x3911b9 = await RepoMappingManager.getInstance().getRepoMapping(vscode_module.Uri.file(key));
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




  
  module.exports = {
    // 主要类
    WorkspaceInfoManager,
    WorkspaceAssociation,
    RepoMappingManager,
    DocumentManager,
    RepoMapping,
    
    // 存储相关类
    BaseStorage,
    ThreadStorage,
    ConversationStorage,
    TaskStorage,
    PlanStorage,
    AttachmentStorage,
    EmptyStorage,
    BaseStorageAPI,
    RepoMappingStorage,
    
    // 错误类
    RowParseError,
    InvalidRepoUrlError,
    
    // 迁移器
    RepoMappingMigrator,
    
    // Git 操作函数
    executeGitCommand,
    getGitBranch,
    getAllRepoMappingsFromUri,
    getRepoMappingFromUri,
    getGitRootAndRelativePath,
    getGitFileRelativePath,
    parseGitHubUrl,
    
    // 工作区辅助函数
    formatRangeSnippet,
    createRemoteOrLocalUri,
    searchFilesWithRipgrep,
    formatTimeAgo,
    formatRelativeTime,
    
    // 错误处理函数
    formatErrorToString,
    
    // 常量和枚举
    GitFileStatus,
  };