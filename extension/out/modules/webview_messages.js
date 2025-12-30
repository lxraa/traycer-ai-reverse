// WebView Messages and Actions
// 统一管理所有与 WebView 通信相关的消息类型

// Subscription related WebView actions
var SubscriptionWebViewActions = {
  POST_SUBSCRIPTION: 'postSubscription'
};

// Task related WebView messages
var TaskWebViewMessages = {
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
};

// Path conversion WebView messages
var PathConversionWebViewMessages = {
  FILE_PATH_CONVERTED: "filePathConverted"
};

// Activation WebView messages
var ActivationWebViewMessages = {
  ACTIVATED: "activated"
};

// Authentication WebView messages
var AuthenticationWebViewMessages = {
  SIGNING_IN: 'signingIn',
  SIGNED_OUT: "signedOut",
  SIGNED_IN: "signedIn"
};

// MCP Server WebView messages
var MCPServerWebViewMessages = {
  SYNC_MCP_SERVERS: 'syncMCPServers',
  ACKNOWLEDGE_SET_ACTIVE_ACCOUNT_FOR_MCP_SERVER: "acknowledgeSetActiveAccountForMCPServer"
};

// CLI Agent WebView messages
var CLIAgentWebViewMessages = {
  LIST_CLI_AGENTS: 'listCLIAgents',
  IS_USER_CLI_AGENT_NAME_ALLOWED: 'isUserCLIAgentNameAllowed',
  IS_WORKSPACE_CLI_AGENT_NAME_ALLOWED: 'isWorkspaceCLIAgentNameAllowed'
};

// Navigation messages
var NavigationMessages = {
  NAVIGATE_TO_NEW_TASK: 'navigateToNewTask',
  NAVIGATE_TO_TASK_HISTORY: "navigateToTaskHistory",
  NAVIGATE_TO_MCP_SERVERS: 'navigateToMCPServers',
  NAVIGATE_TO_PROMPT_TEMPLATES: 'navigateToPromptTemplates',
  NAVIGATE_TO_CLI_AGENTS: 'navigateToCLIAgents',
  NAVIGATE_TO_TASK_LANDING_WITH_PREFILL: "navigateToTaskLandingWithPrefill"
};

// Prompt Template WebView messages
var PromptTemplateWebViewMessages = {
  LIST_PROMPT_TEMPLATES: "listPromptTemplates",
  IS_USER_PROMPT_TEMPLATE_NAME_ALLOWED: "isUserPromptTemplateNameAllowed",
  IS_WORKSPACE_PROMPT_TEMPLATE_NAME_ALLOWED: 'isWorkspacePromptTemplateNameAllowed',
  LIST_WORKSPACE_DIRECTORIES: "listWorkspaceDirectories"
};

// Task Settings WebView messages
var TaskSettingsWebViewMessages = {
  SYNC_TASK_SETTINGS: "sync-task-settings",
  SYNC_DEFAULT_TASK_EXECUTION_CONFIG: "sync-default-task-execution-config"
};

// Usage Information WebView messages
var UsageInformationWebViewMessages = {
  SEND_USAGE_INFORMATION: 'sendUsageInformation',
  SEND_FETCH_STATUS: 'SEND_FETCH_STATUS'
};

// Workspace WebView messages
var WorkspaceWebViewMessages = {
  WORKSPACE_STATUS: "workspaceStatus"
};

module.exports = {
  SubscriptionWebViewActions,
  TaskWebViewMessages,
  PathConversionWebViewMessages,
  ActivationWebViewMessages,
  AuthenticationWebViewMessages,
  MCPServerWebViewMessages,
  CLIAgentWebViewMessages,
  NavigationMessages,
  PromptTemplateWebViewMessages,
  TaskSettingsWebViewMessages,
  UsageInformationWebViewMessages,
  WorkspaceWebViewMessages
};

