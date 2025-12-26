

const child_process_module = require("child_process");
const { isWindows } = require("./config.js");

function addGitignorePatterns(_0x242051) {
    let _0x58830f = isWindows ? '\x22' : '\x27';
    return _0x242051.map(_0x1dee75 => _0x1dee75.map(_0x3a169a => _0x3a169a.includes('\x20') && !_0x3a169a.startsWith(_0x58830f) && !_0x3a169a.endsWith(_0x58830f) ? '' + _0x58830f + _0x3a169a + _0x58830f : _0x3a169a).join('\x20')).join('\x20|\x20');
  }


class RipgrepCommandBuilder{
      ['baseCommand'];
      ['quote'];
      constructor(_0x8b063a) {
        this.quote = isWindows ? '\x22' : '\x27', this.baseCommand = [_0x8b063a];
      }
      ['withIncludePatterns'](_0x3e2c53) {
        return _0x3e2c53.forEach(_0x5545eb => {
          this.baseCommand.push('-g', '' + this.quote + _0x5545eb + this.quote);
        }), this;
      }
      ['withIgnorePatterns'](_0x4b138e) {
        return _0x4b138e.forEach(_0x531751 => {
          this.baseCommand.push('-g', this.quote + '!' + _0x531751 + this.quote);
        }), this;
      }
      ["withCaseInsensitive"]() {
        return this.baseCommand.push('-i'), this;
      }
      ['withAdditionalArgs'](_0xea5258) {
        return this.baseCommand.push(..._0xea5258), this;
      }
      ["withMaxResults"](_0x165f0c) {
        return this.baseCommand.push('-m', _0x165f0c.toString()), this;
      }
      ["withRegex"](_0x3ae9aa) {
        return this.baseCommand.push('-e'), this.baseCommand.push('' + this.quote + this.sanitizeRegex(_0x3ae9aa) + this.quote), this;
      }
      ['withQuery'](_0x1c6d54) {
        return this.baseCommand.push('' + this.quote + _0x1c6d54 + this.quote), this;
      }
      ["sanitizeRegex"](_0x466f67) {
        return _0x466f67.replaceAll(new RegExp(this.quote, 'g'), '.');
      }
      ["build"]() {
        return [...this.baseCommand];
      }
    }
class RipgrepExecutor{
      static async ['execute'](_0x40fc62, _0x4254b2 = {}) {
        return new Promise((_0x40d5d9, _0x63b10) => {
          let {
              cwd: _0x59d868,
              timeout: _0x180384,
              abortSignal: _0x59f4bd,
              encoding: _0x5db516 = 'utf8'
            } = _0x4254b2,
            _0x31cf57 = addGitignorePatterns(_0x40fc62),
            _0x1b00c0 = (0, child_process_module.spawn)(_0x31cf57, [], {
              cwd: _0x59d868,
              shell: true
            }),
            _0x52e319 = '',
            _0x267f7f = null;
          _0x180384 && (_0x267f7f = setTimeout(() => {
            _0x1b00c0.kill(), _0x63b10(new Error("ripgrep process timed out"));
          }, _0x180384)), _0x1b00c0.stdout.setEncoding(_0x5db516), _0x1b00c0.stdout.on('data', _0x1b4d2f => {
            _0x52e319 += _0x1b4d2f;
          }), _0x1b00c0.on("error", _0x1b2f82 => {
            _0x267f7f && clearTimeout(_0x267f7f), _0x63b10(new Error("ripgrep process error: " + _0x1b2f82.message));
          }), _0x1b00c0.on('close', _0x1cde0e => {
            _0x267f7f && clearTimeout(_0x267f7f), _0x1cde0e !== 0 && _0x1cde0e !== 1 ? _0x63b10(new Error("ripgrep process exited with code " + _0x1cde0e)) : _0x40d5d9(_0x52e319);
          }), _0x59f4bd && _0x59f4bd.addEventListener('abort', () => {
            _0x1b00c0.kill(), _0x63b10(new Error("ripgrep process aborted"));
          });
        });
      }
    };

module.exports = {
  RipgrepCommandBuilder,
  RipgrepExecutor
}