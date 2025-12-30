function isValidAgentType(agentType) {
    return Object.keys(agentRegistry).includes(agentType);
  }
  function getAgentIconByDisplayName(displayName) {
    for (let [agentKey, agentInfo] of Object.entries(agentRegistry)) if (agentInfo.displayName === displayName) return getAgentIcon(agentKey);
    return null;
  }
  function getAgentIcon(agentType) {
    return Object.keys(agentRegistry).includes(agentType) ? agentRegistry[agentType] : agentRegistry.copy;
  }
  function isUtilityAgent(agentObj) {
    return agentObj.type === "utility";
  }
  function isTerminalAgent(agentObj) {
    return agentObj.type === "terminal";
  }
  var agentRegistry = Object.freeze({
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

  // AgentRegistry class for managing dynamic agents
  var AgentRegistry = class _0x98f6f0 {
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

  module.exports = {
    agentRegistry,
    isValidAgentType,
    getAgentIconByDisplayName,
    getAgentIcon,
    isUtilityAgent,
    isTerminalAgent,
    AgentRegistry
  };