// config.js - 配置模块
const path = require("path");
const fs = require("fs");
const staticConfig = require("../config.json");
const vscode_module = require("vscode");
const ignore_module = require("ignore");
const vscode_ripgrep_module = require("@vscode/ripgrep");

// ============ Language Constants ============
const Ht = {
  EN: 0,
  CA: 1,
  DE: 2,
  ES: 3,
  FR: 4,
  HI: 5,
  ID: 6,
  IT: 7,
  JA: 8,
  KO: 9,
  NL: 10,
  PL: 11,
  PT_BR: 12,
  RU: 13,
  TR: 14,
  VI: 15,
  ZH_CN: 16,
  ZH_TW: 17
};

/**
 * 语言名称到枚举值的映射表（预计算）
 * 从语言名称的小写形式映射到对应的 Ht 枚举值
 */
const LANGUAGE_NAME_TO_ENUM = {
  'english': 0,        // Ht.EN
  'català': 1,         // Ht.CA
  'deutsch': 2,        // Ht.DE
  'español': 3,        // Ht.ES
  'français': 4,       // Ht.FR
  'हिन्दी': 5,         // Ht.HI
  'bahasa indonesia': 6, // Ht.ID
  'italiano': 7,       // Ht.IT
  '日本語': 8,         // Ht.JA
  '한국어': 9,          // Ht.KO
  'nederlands': 10,    // Ht.NL
  'polski': 11,        // Ht.PL
  'português': 12,     // Ht.PT_BR
  'русский': 13,       // Ht.RU
  'türkçe': 14,        // Ht.TR
  'tiếng việt': 15,    // Ht.VI
  '简体中文': 16,      // Ht.ZH_CN
  '繁體中文': 17       // Ht.ZH_TW
};

/**
 * 将语言偏好字符串转换为枚举值
 * @param {string} languageStr - 语言字符串（例如：'english', 'español', '简体中文'）
 * @returns {number} 语言枚举值
 */
function parseLanguagePreference(languageStr) {
  return LANGUAGE_NAME_TO_ENUM[languageStr.toLocaleLowerCase()] ?? 0; // 默认返回英语 (Ht.EN = 0)
}

// ============ Ignore Patterns ============
const IGNORE_DIRECTORIES = [
  '.git/', ".svn/", ".hg/", '.cvs/', '.vscode/', '.idea/', '.vs/', '.eclipse/', ".settings/",
  "node_modules/", '.yarn/', 'pip-wheel-metadata/', ".pnpm/", "venv/", '.venv/', 'env/', '.env/',
  'site-packages/', '.bundle/', ".gradle/", '.mvn/', 'dist/', "build/", 'Build/', "target/",
  "out/", "bin/", "obj/", '.output/', '.next/', '.nuxt/', '.cache/', '.parcel-cache/', '.coverage/',
  ".nyc_output/", ".pytest_cache/", ".vscode-test/", ".continue/", '__pycache__/', '.mypy_cache/',
  ".ipynb_checkpoints/", '.phpunit.cache/', ".sass-cache/", "tmp/cache/", '.gradle-build/', ".nx/",
  '.rush/', '.turbo/', ".verdaccio/", '.helm/', ".terraform/", 'gems/', 'vendor/'
];

const IGNORE_FILES = [
  '*.DS_Store', '*-lock.json', "*.lock", 'go.sum', 'go.mod', '*.log', "npm-debug.log*",
  'yarn-debug.log*', 'yarn-error.log*', "debug.log", "lerna-debug.log", "*.tsbuildinfo",
  "*.js.map", "*.min.js", "*.min.css", "*.d.ts", "*.map", '*.bundle.js', '*.bundle.css',
  "*.bundle.min.js", '*.bundle.min.css', "dependency-reduced-pom.xml", 'gradle-wrapper.jar',
  'maven-wrapper.jar', 'composer.phar', '*.py[cod]', '*.so', "*.egg*", "*.mo",
  "celerybeat-schedule*", "*.userprefs", "*.tmp", "*.temp", 'thumbs.db', "*.swp", "*.swo",
  '~$*', ".project", '.classpath', ".factorypath", '*.sublime-*', "*.ttf", '*.png', "*.jpg",
  '*.jpeg', "*.gif", "*.mp4", "*.svg", "*.ico", '*.pdf', '*.woff', "*.woff2", "*.eot",
  "*.cur", "*.avi", '*.mpg', '*.mpeg', '*.mov', "*.mp3", "*.mkv", "*.webm", "*.wav",
  '*.webp', "*.zip", "*.gz", '*.tar', "*.dmg", '*.tgz', "*.rar", "*.7z", "*.exe", '*.dll',
  "*.obj", '*.o', '*.o.d', '*.a', "*.lib", "*.dylib", "*.ncb", '*.sdf', '*.jar', "*.onnx",
  "*.wasm", '*.plist', "*.profraw", '*.gcda', "*.gcno", '*.pdb', '*.bin', '*.parquet',
  '*.pqt', '*.db', "*.sqlite", "*.csv", '*.uasset', "*.shp", "*.shx", '*.dbf', '*.env',
  "*.gitignore", "*.gitkeep", "*.continueignore", 'config.json'
];

const IGNORE_ALL_PATTERNS = [...IGNORE_DIRECTORIES, ...IGNORE_FILES];

let globalIgnoreInstance = null;

/**
 * 获取全局 ignore 实例
 * @returns {object} ignore 实例
 */
function getGlobalIgnoreInstance() {
  if (!globalIgnoreInstance) {
    globalIgnoreInstance = ignore_module().add(IGNORE_FILES);
  }
  return globalIgnoreInstance;
}

// ============ Ripgrep Config ============
const isWindows = /^win/.test(process.platform);
const RG_BINARY_NAME = isWindows ? "rg.exe" : "rg";
const MAX_SEARCH_RESULTS = 10000;
const QUOTE_CHAR = isWindows ? '"' : "'";

// ============ Ripgrep Path Resolution ============
let ripgrepBinaryPath = null;

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} 文件是否存在
 */
async function fileExists(filePath) {
  return new Promise(resolve => {
    fs.access(filePath, err => {
      resolve(err === null);
    });
  });
}

/**
 * 查找 ripgrep 二进制文件路径
 * @param {string} appRoot - VS Code 应用根目录
 * @returns {Promise<string>} ripgrep 二进制文件路径
 */
async function findRipgrepBinaryPath(appRoot) {
  const checkPath = async (subPath) => {
    const fullPath = path.join(appRoot, subPath, RG_BINARY_NAME);
    return (await fileExists(fullPath)) ? fullPath : void 0;
  };
  return (await checkPath("node_modules/@vscode/ripgrep/bin/")) ||
    (await checkPath('node_modules/vscode-ripgrep/bin')) ||
    (await checkPath('node_modules.asar.unpacked/vscode-ripgrep/bin/')) ||
    (await checkPath('node_modules.asar.unpacked/@vscode/ripgrep/bin/')) ||
    vscode_ripgrep_module.rgPath;
}

/**
 * 解析 ripgrep 路径（带缓存）
 * @returns {Promise<string>} ripgrep 二进制文件路径
 */
async function resolveRipgrepPath() {
  if (!ripgrepBinaryPath) {
    ripgrepBinaryPath = await findRipgrepBinaryPath(vscode_module.env.appRoot);
  }
  return ripgrepBinaryPath;
}

// 构建 DEFAULT_RG_ARGS
const DEFAULT_RG_ARGS = [
  '--files',
  "--no-require-git",
  "--hidden",
  '-g', QUOTE_CHAR + "!**/.git" + QUOTE_CHAR,
  '-g', QUOTE_CHAR + '!**/.svn' + QUOTE_CHAR,
  '-g', QUOTE_CHAR + "!**/.hg" + QUOTE_CHAR,
  '-g', QUOTE_CHAR + '!**/CVS' + QUOTE_CHAR,
  '-g', QUOTE_CHAR + "!**/.DS_Store" + QUOTE_CHAR,
  '-g', QUOTE_CHAR + '!**/Thumbs.db' + QUOTE_CHAR,
  ...IGNORE_FILES.flatMap(pattern => ['-g', QUOTE_CHAR + '!' + pattern + QUOTE_CHAR]),
  ...IGNORE_DIRECTORIES.flatMap(pattern => ['-g', QUOTE_CHAR + '!' + pattern + QUOTE_CHAR])
];
/**
 * 创建扩展配置对象
 * @returns {object} 配置对象
 */
function createExtensionConfig() {
  const vsConfig = vscode_module.workspace.getConfiguration("traycer");
  const outputLevel = vsConfig.get('outputLevel');
  const autoOpenDiffOnApply = vsConfig.get('autoOpenDiffOnApply');
  const languagePreference = parseLanguagePreference(vsConfig.get('languagePreference') ?? 'en');
  const enableAgentsMd = vsConfig.get('enableAgentsMd');
  const lastUsedIDEAgent = vscode_module.env.appName.toLowerCase().replaceAll(' ', '');
  const assetsPath = vscode_module.Uri.joinPath(
    vscode_module.Uri.file(path.dirname(__dirname)),
    "resources",
    "assets"
  ).fsPath;
  const alwaysAllowPayToRun = vsConfig.get("alwaysAllowPayToRun");
  const sendKey = vsConfig.get("sendKey");
  const enablePromptTemplateSelector = vsConfig.get('enablePromptTemplateSelector');

  const config = {
    activated: false,
    lastUsedIDEAgent: lastUsedIDEAgent,
    alwaysAllowPayToRun: alwaysAllowPayToRun,
    sendKey: sendKey,
    enablePromptTemplateSelector: enablePromptTemplateSelector,
    logLevel: outputLevel,
    version: '',
    autoOpenDiffOnApply: autoOpenDiffOnApply,
    languagePreference: languagePreference,
    enableAgentsMd: enableAgentsMd,
    retryAfterTimestamp: void 0,
    assetsPath: assetsPath,
    getRipgrepBinPath: resolveRipgrepPath,
    // 从静态配置合并
    ...staticConfig,
    // setter 方法
    setAlwaysAllowPayToRun: (value) => {
      config.alwaysAllowPayToRun = value;
      vsConfig.update("alwaysAllowPayToRun", value, vscode_module.ConfigurationTarget.Global);
      vsConfig.update("alwaysAllowPayToRun", value, vscode_module.ConfigurationTarget.Workspace);
    },
    setEnablePromptSelectionTemplatePopover: (value) => {
      config.enablePromptTemplateSelector = value;
      vsConfig.update('enablePromptTemplateSelector', value, vscode_module.ConfigurationTarget.Global);
      vsConfig.update("enablePromptTemplateSelector", value, vscode_module.ConfigurationTarget.Workspace);
    }
  };

  return config;
}

// 创建并导出全局 config 实例
const config = createExtensionConfig();

module.exports = {
  createExtensionConfig,
  config, // 导出全局 config 实例
  // Language exports
  LANGUAGE_NAME_TO_ENUM,
  parseLanguagePreference,
  // Ignore patterns exports
  IGNORE_DIRECTORIES,
  IGNORE_FILES,
  IGNORE_ALL_PATTERNS,
  getGlobalIgnoreInstance,
  // Ripgrep config exports
  isWindows,
  RG_BINARY_NAME,
  MAX_SEARCH_RESULTS,
  QUOTE_CHAR,
  DEFAULT_RG_ARGS,
  // Ripgrep path resolution exports
  resolveRipgrepPath,
  findRipgrepBinaryPath,
  fileExists
};

