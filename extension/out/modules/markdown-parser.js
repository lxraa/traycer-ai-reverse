const markdown_it_module = require("markdown-it");

/* [unbundle] markdown-it 已移至顶部导入区 */
function createSimpleDocNode(_0x15162b) {
  return {
    type: 'doc',
    content: [_0x15162b === '' ? {
      type: 'paragraph'
    } : {
      type: "paragraph",
      content: [{
        type: "text",
        text: _0x15162b
      }]
    }]
  };
}
function createTextNode(_0x5ccabc, _0x128d74) {
  if (_0x5ccabc !== '') return {
    type: 'text',
    text: _0x5ccabc,
    ...(_0x128d74 && {
      marks: _0x128d74
    })
  };
}
function parseMarkdownToDoc(_0x336d0d) {
  try {
    let _0x2826fc = new markdown_it_module({
        html: false,
        breaks: true,
        linkify: false
      }).parse(_0x336d0d, {}),
      _0x800340 = parseMarkdownToDocNodes(_0x2826fc);
    return {
      type: 'doc',
      content: _0x800340.length > 0 ? _0x800340 : [{
        type: 'paragraph'
      }],
      traycerMarkdown: _0x336d0d
    };
  } catch (_0x1ada63) {
    return console.warn("Failed to parse markdown, falling back to plain text:", _0x1ada63), createSimpleDocNode(_0x336d0d);
  }
}
function parseMarkdownToDocNodes(_0x202c34) {
  let _0xcfda32 = [],
    _0x391302 = [];
  for (let _0x439cbb = 0; _0x439cbb < _0x202c34.length; _0x439cbb++) {
    let _0x533b74 = _0x202c34[_0x439cbb];
    switch (_0x533b74.type) {
      case "heading_open":
        {
          let _0xc7deb5 = {
            type: 'heading',
            attrs: {
              level: parseInt(_0x533b74.tag.substring(1))
            },
            content: []
          };
          _0x391302.push({
            node: _0xc7deb5,
            children: _0xc7deb5.content
          });
          break;
        }
      case "heading_close":
        if (_0x391302.length > 0) {
          let {
            node: _0x43b94e
          } = _0x391302.pop();
          _0x391302.length > 0 ? _0x391302[_0x391302.length - 1].children.push(_0x43b94e) : _0xcfda32.push(_0x43b94e);
        }
        break;
      case "paragraph_open":
        {
          let _0x4e0049 = {
            type: "paragraph",
            content: []
          };
          _0x391302.push({
            node: _0x4e0049,
            children: _0x4e0049.content
          });
          break;
        }
      case 'paragraph_close':
        if (_0x391302.length > 0) {
          let {
            node: _0x3b3931
          } = _0x391302.pop();
          _0x391302.length > 0 ? _0x391302[_0x391302.length - 1].children.push(_0x3b3931) : _0xcfda32.push(_0x3b3931);
        }
        break;
      case 'bullet_list_open':
        {
          let _0x2e3a0b = {
            type: 'bulletList',
            content: []
          };
          _0x391302.push({
            node: _0x2e3a0b,
            children: _0x2e3a0b.content
          });
          break;
        }
      case 'bullet_list_close':
        if (_0x391302.length > 0) {
          let {
            node: _0x27a603
          } = _0x391302.pop();
          _0x391302.length > 0 ? _0x391302[_0x391302.length - 1].children.push(_0x27a603) : _0xcfda32.push(_0x27a603);
        }
        break;
      case 'ordered_list_open':
        {
          let _0x10bcdb = {
            type: "orderedList",
            content: []
          };
          _0x391302.push({
            node: _0x10bcdb,
            children: _0x10bcdb.content
          });
          break;
        }
      case 'ordered_list_close':
        if (_0x391302.length > 0) {
          let {
            node: _0x1e4517
          } = _0x391302.pop();
          _0x391302.length > 0 ? _0x391302[_0x391302.length - 1].children.push(_0x1e4517) : _0xcfda32.push(_0x1e4517);
        }
        break;
      case "list_item_open":
        {
          let _0x43e0ac = {
            type: 'listItem',
            content: []
          };
          _0x391302.push({
            node: _0x43e0ac,
            children: _0x43e0ac.content
          });
          break;
        }
      case "list_item_close":
        if (_0x391302.length > 0) {
          let {
            node: _0x54f00b
          } = _0x391302.pop();
          _0x391302.length > 0 ? _0x391302[_0x391302.length - 1].children.push(_0x54f00b) : _0xcfda32.push(_0x54f00b);
        }
        break;
      case "blockquote_open":
        {
          let _0x182b59 = {
            type: "blockquote",
            content: []
          };
          _0x391302.push({
            node: _0x182b59,
            children: _0x182b59.content
          });
          break;
        }
      case 'blockquote_close':
        if (_0x391302.length > 0) {
          let {
            node: _0x15fe2c
          } = _0x391302.pop();
          _0x391302.length > 0 ? _0x391302[_0x391302.length - 1].children.push(_0x15fe2c) : _0xcfda32.push(_0x15fe2c);
        }
        break;
      case "code_block":
      case 'fence':
        {
          let _0x2f61b0 = {
              type: 'codeBlock',
              attrs: {
                language: _0x533b74.info || null
              }
            },
            _0x4eb32e = createTextNode(_0x533b74.content);
          _0x4eb32e && (_0x2f61b0.content = [_0x4eb32e]), _0x391302.length > 0 ? _0x391302[_0x391302.length - 1].children.push(_0x2f61b0) : _0xcfda32.push(_0x2f61b0);
          break;
        }
      case 'inline':
        {
          let _0x54df1e = parseMarkdownTokensToNodes(_0x533b74.children || []);
          _0x391302.length > 0 ? _0x391302[_0x391302.length - 1].children.push(..._0x54df1e) : _0x54df1e.length > 0 && _0xcfda32.push({
            type: "paragraph",
            content: _0x54df1e
          });
          break;
        }
      case "softbreak":
      case "hardbreak":
        {
          let _0x51b4f7 = {
            type: 'hardBreak'
          };
          _0x391302.length > 0 && _0x391302[_0x391302.length - 1].children.push(_0x51b4f7);
          break;
        }
      default:
        break;
    }
  }
  return _0xcfda32;
}
function parseMarkdownTokensToNodes(_0x8b6f93) {
  let _0x5f2604 = [],
    _0x40620a = [];
  for (let key of _0x8b6f93) switch (key.type) {
    case 'text':
      {
        let _0x1cedb6 = _0x40620a.length > 0 ? _0x40620a.map(_0x1a25ea => ({
            type: _0x1a25ea
          })) : void 0,
          _0x3cce8f = createTextNode(key.content, _0x1cedb6);
        _0x3cce8f && _0x5f2604.push(_0x3cce8f);
        break;
      }
    case 'code_inline':
      {
        let _0x62d4b8 = '`' + key.content + '`',
          _0x4a8aa9 = createTextNode(_0x62d4b8);
        _0x4a8aa9 && _0x5f2604.push(_0x4a8aa9);
        break;
      }
    case 'strong_open':
      _0x40620a.push('bold');
      break;
    case 'strong_close':
      {
        let _0x12d912 = _0x40620a.lastIndexOf("bold");
        _0x12d912 !== -1 && _0x40620a.splice(_0x12d912, 1);
        break;
      }
    case 'em_open':
      _0x40620a.push('italic');
      break;
    case 'em_close':
      {
        let _0x40453f = _0x40620a.lastIndexOf("italic");
        _0x40453f !== -1 && _0x40620a.splice(_0x40453f, 1);
        break;
      }
    case 'softbreak':
      _0x5f2604.push({
        type: 'hardBreak'
      });
      break;
    default:
      break;
  }
  return _0x5f2604;
}

module.exports = {
  parseMarkdownToDoc
}