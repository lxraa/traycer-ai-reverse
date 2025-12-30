// ============== 导入区 ==============
const vscode_module = require("vscode");
const tree_sitter_module = require("web-tree-sitter");
const path_module = require("path");
const lru_map_module = require("lru_map");

const { Mutex } = require("./mutex.js");
const { Logger } = require("./logger.js");
const { WorkerPoolManager } = require("./workerpool.js");
const { DocumentManager } = require("./workspace_info.js");

// ============== 工具类定义 ==============

// LineRange 类 - 表示代码行范围
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

// FileContent 类 - 表示文件内容
const createErrorFromMessage = _0x472706 => new Error(_0x472706);

class FileContent {
  ["_lines"];
  constructor(_0x3743aa) {
    this._lines = _0x3743aa;
  }
  get ['lines']() {
    return this._lines;
  }
  ['getLines'](_0x19cec2, _0x4c789a = createErrorFromMessage) {
    if (!_0x19cec2) return this._lines;
    if (_0x19cec2.startLine < 0 || _0x19cec2.endLine >= this._lines.length) throw _0x4c789a('Line range: (' + _0x19cec2.startLine + ', ' + _0x19cec2.endLine + ") is out of bounds for file with " + this._lines.length + " lines");
    return this._lines.slice(_0x19cec2.startLine, _0x19cec2.endLine + 1);
  }
  ["getContent"](_0x3a4d91, _0x4c3743 = createErrorFromMessage) {
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
    return new FileContent(_0x4cae84.split('\x0a'));
  }
  static ["fromLines"](_0x23c94b) {
    return new FileContent(_0x23c94b);
  }
}

// 工具函数：创建代码片段
function createCodeSnippetFromRange(_0x3d9552, _0x24123c, _0x309720, _0x2b83a8) {
  let _0x352f6c = FileContent.fromFile(_0x24123c),
    _0x3267d9 = _0x309720.line,
    _0x596fe5 = _0x2b83a8.line;
  _0x309720.context && (_0x3267d9 = Math.max(0, _0x309720.line - _0x309720.context)), _0x2b83a8.context && (_0x596fe5 = Math.min(_0x352f6c.length - 1, _0x2b83a8.line + _0x2b83a8.context));
  let _0x5b19be = LineRange.fromEndLine(_0x3267d9, _0x596fe5);
  return {
    path: _0x3d9552,
    content: _0x352f6c.getContent(_0x5b19be),
    range: _0x5b19be.rangeOutput,
    diagnostics: []
  };
}

// 工具函数：合并重叠的行范围
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

// ============== 语言解析器类 ==============

class SnippetContextProvider {
    static ['getInstance']() {
      return this.instance || (this.instance = new SnippetContextProvider()), this.instance;
    }
    async ['getSnippetContextsFromLocalSymbol'](_0x2cf233) {
      let _0x41a4f6 = await DocumentManager.getSourceCode(_0x2cf233.filePath.absPath),
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


  class FileCacheBadStateError extends Error {
    constructor(_0x38e2c2) {
      super(_0x38e2c2), this.name = "FileCacheBadStateError";
    }
  }
var INVALID_BLOCK_ID = -1;
class CodeBlockCache {
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

class TreeSitterFileParser{
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
        _0x3a3293 = await DocumentManager.getSourceCode(_0x3a516f.fsPath),
        _0x378688 = await this.getSnippetAtLineFromFile(_0x84ee3c.filePath.absPath, _0x3a3293, LineRange.fromEndLine(_0x84ee3c.range.startLine, _0x84ee3c.range.endLine));
      return {
        path: _0x84ee3c.filePath.proto,
        content: _0x378688.content,
        range: LineRange.fromEndLine(_0x84ee3c.range.startLine, _0x84ee3c.range.endLine),
        diagnostics: []
      };
    }
  };

// ============== 导出 ==============
module.exports = {
  // 工具类
  LineRange,
  FileContent,
  
  // 工具函数
  createCodeSnippetFromRange,
  mergeOverlappingLineRanges,
  mergeOverlappingRanges,
  
  // 错误类
  FileCacheBadStateError,
  
  // 核心类
  SnippetContextProvider,
  CodeBlockCache,
  TreeSitterFileParser,
  
  // 常量
  INVALID_BLOCK_ID
};