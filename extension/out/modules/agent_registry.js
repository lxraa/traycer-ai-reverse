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

  module.exports = {
    agentRegistry,
    isValidAgentType,
    getAgentIconByDisplayName,
    getAgentIcon,
    isUtilityAgent,
    isTerminalAgent
  };