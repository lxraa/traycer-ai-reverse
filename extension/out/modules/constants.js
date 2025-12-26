'use strict';

// ============== Traycer 常量定义 ==============

// 数据库错误匹配模式
var DATABASE_ERROR_PATTERNS = [
  /SQLITE_CORRUPT/, 
  /SQLITE_IOERR/, 
  /SQLITE_CONSTRAINT/, 
  /SQLITE_ERROR/, 
  /SQLITE_FULL/, 
  /Invalid argument error: Values length (\d+) is less than the length ((\d+)) multiplied by the value size (\d+)/, 
  /Table .* was not found/, 
  /Table ?.+? doesn't exist/, 
  /ER_BAD_TABLE_ERROR/, 
  /MySQL server has gone away/, 
  /Lock wait timeout exceeded/, 
  /Deadlock found when trying to get lock/, 
  /ER_LOCK_DEADLOCK/, 
  /(?:Connection\s+pool|pool).*?(?:closed|exhausted|drained|destroyed)/i, 
  /No\s+available\s+connection/i, 
  /Failed\s+to\s+acquire\s+connection/i, 
  /(?:Transaction\s+pool|transaction).*?(?:closed|exhausted|error|failed)/i, 
  /Failed\s+to\s+acquire\s+transaction\s+connection/i
];

// 图片 MIME 类型映射
var IMAGE_MIME_TYPES = new Map([
  ['.png', "image/png"], 
  [".jpeg", 'image/jpeg'], 
  [".jpg", "image/jpg"]
]);

// 文件大小限制 (2MB)
var MAX_FILE_SIZE = 2097152;

// 文件 scheme
var TRAYCER_FILE_SCHEME = 'traycer-file';

// VS Code 命令 ID
var OPEN_SETTINGS_COMMAND = 'traycer.openSettings';
var AUTH_CALLBACK_COMMAND = "traycer.authCallback";
var START_NEW_TASK_COMMAND = 'traycer.startNewTask';
var OPEN_TASK_HISTORY_COMMAND = 'traycer.openTaskHistory';
var LIST_MCP_SERVERS_COMMAND = 'traycer.listMCPServers';
var MANAGE_PROMPT_TEMPLATES_COMMAND = 'traycer.managePromptTemplates';
var MANAGE_CLI_AGENTS_COMMAND = "traycer.manageCLIAgents";
var TRIGGER_MANUAL_ANALYSIS_FILE_COMMAND = 'traycer.triggerManualAnalysisFile';
var TRIGGER_MANUAL_ANALYSIS_CHANGES_COMMAND = 'traycer.triggerManualAnalysisChanges';
var TRIGGER_MANUAL_ANALYSIS_ALL_CHANGES_COMMAND = 'traycer.triggerManualAnalysisAllChanges';
var SHOW_TEMPLATE_ERRORS_COMMAND = "traycer.showTemplateErrors";

var COMMAND_IDS = {
  OPEN_SETTINGS: OPEN_SETTINGS_COMMAND,
  IMPORT_TICKET: "traycer.importTicket",
  AUTH_CALLBACK: AUTH_CALLBACK_COMMAND
};

// 视图 ID
var MEDIA_VIEW_ID = "traycer-media-view";
var EXTENSION_ID = 'traycer';
var EDITABLE_DIFF_VIEW_ID = "traycer-editable-diff-view";
var COMMENT_NAVIGATOR_WEBVIEW_ID = "traycer.commentNavigatorWebview";

// 存储键
var ACCESS_TOKEN_KEY = "traycer-access-token";
var AUTH_TOKEN_KEY = 'traycer-auth-token';
var LAST_SELECTED_IDE_AGENT_KEY = 'traycer.lastSelectedIDEAgent';

// 标签
var VIEW_COMMENT_LABEL = 'View Comment';

// 枚举: 存储键
var StorageKey = (enumValue => (
  enumValue.AnalysisHistory = "AnalysisHistory", 
  enumValue.TaskHistory = 'TaskHistory', 
  enumValue.RepoMapping = 'RepoMapping', 
  enumValue.WorkspaceSettings = "WorkspaceSettings", 
  enumValue.TicketLoadingState = "PersistedTicketLoading", 
  enumValue
))({});

// 枚举: 审查操作
var ReviewAction = (actionValue => (
  actionValue.ACCEPT = "Traycer: Accept", 
  actionValue.DECLINE = "Decline", 
  actionValue.SHOW_DIFF = "Show Diff", 
  actionValue.OPEN_REVIEW_THREAD = "Traycer: " + VIEW_COMMENT_LABEL, 
  actionValue.TEMPLATE_ERROR = 'Template Error', 
  actionValue
))({});

module.exports = {
  // 数据库错误模式 (原名 cte)
  DATABASE_ERROR_PATTERNS,
  cte: DATABASE_ERROR_PATTERNS,
  
  // 图片类型 (原名 Hk)
  IMAGE_MIME_TYPES,
  Hk: IMAGE_MIME_TYPES,
  
  // 文件大小限制 (原名 nq)
  MAX_FILE_SIZE,
  nq: MAX_FILE_SIZE,
  
  // 文件 scheme (原名 RS)
  TRAYCER_FILE_SCHEME,
  RS: TRAYCER_FILE_SCHEME,
  
  // 命令 ID
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
  
  // 视图 ID
  MEDIA_VIEW_ID,
  EXTENSION_ID,
  EDITABLE_DIFF_VIEW_ID,
  COMMENT_NAVIGATOR_WEBVIEW_ID,
  
  // 存储键
  ACCESS_TOKEN_KEY,
  AUTH_TOKEN_KEY,
  LAST_SELECTED_IDE_AGENT_KEY,
  
  // 标签
  VIEW_COMMENT_LABEL,
  
  // 枚举
  StorageKey,
  ReviewAction
};

