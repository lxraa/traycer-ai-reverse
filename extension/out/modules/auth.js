const {ACCESS_TOKEN_KEY, AUTH_TOKEN_KEY, AUTH_CALLBACK_COMMAND} = require('./constants.js');
const {config} = require('./config.js');
const {AuthenticationWebViewMessages, UsageInformationWebViewMessages, UsageInformationActions} = require('./webview_messages.js');
const vscode_module = require('vscode');
const {TokenManager} = require('./token_manager.js');
const {UnauthorizedError, RequestAbortedError} = require('./retry_executor.js');
const {WorkspaceInfoManager, formatErrorToString} = require('./workspace_info.js');
const {commandRegistry} = require('./command_registry.js');
const {Logger} = require('./logger.js');
const lodash_module = require('lodash');

/**
 * 判断是否为中止错误
 */
function isAbortError(error) {
  return error instanceof Error && 
         (error.name === "AbortError" || 
          error.name === 'AbortedError' || 
          RequestAbortedError.matches(error));
}

/**
 * 注册 VSCode 命令
 */
async function registerVscodeCommand(context, commandId, handler, allowOverride = false, thisArg) {
  try {
    if ((await vscode_module.commands.getCommands(true)).includes(commandId)) {
      if (allowOverride) {
        commandRegistry.get(commandId)?.dispose();
        let disposable = vscode_module.commands.registerCommand(commandId, handler, thisArg);
        context.subscriptions.push(disposable);
        commandRegistry.set(commandId, disposable);
      }
    } else {
      let disposable = vscode_module.commands.registerCommand(commandId, handler, thisArg);
      context.subscriptions.push(disposable);
      commandRegistry.set(commandId, disposable);
    }
  } catch (error) {
    Logger.warn('Failed to register command: ' + commandId, error);
    return Promise.reject(error);
  }
}

/**
 * UsageTracker - 使用情况跟踪器
 * 单例模式，用于管理和跟踪 Traycer 的使用率限制信息
 */
class UsageTracker {
  static instance = null;

  constructor(client) {
    this.reFetchTimer = null;
    this.isFetching = false;
    this.lastSentMessage = null;
    this.lastSentFetchStatus = null;
    this.client = client;
    this._latestRateLimitInfo = {
      remainingTokens: 0,
      totalTokens: 0,
      retryAfter: 0
    };
  }

  static getInstance(client) {
    if (!UsageTracker.instance) {
      if (!client) throw new Error('Need client to initialize usage information tracker the first time.');
      UsageTracker.instance = new UsageTracker(client);
    }
    return UsageTracker.instance;
  }

  dispose() {
    if (this.reFetchTimer) {
      clearTimeout(this.reFetchTimer);
      this.reFetchTimer = null;
    }
  }

  set latestRateLimitInfo(info) {
    this._latestRateLimitInfo = info;
    // Note: RateLimitHandler.updateRateLimitTimestamp 需要在主文件中调用
    // 这里暂时保留原有逻辑的引用方式
    if (info.retryAfter && info.remainingTokens < 1) {
      // RateLimitHandler 会在主文件中定义
      if (typeof RateLimitHandler !== 'undefined') {
        RateLimitHandler.updateRateLimitTimestamp(info.retryAfter);
      }
    }
    if (info.remainingTokens >= 1) {
      if (typeof RateLimitHandler !== 'undefined') {
        RateLimitHandler.updateRateLimitTimestamp(void 0);
      }
    }
  }

  get latestRateLimitInfo() {
    return this._latestRateLimitInfo;
  }

  async setIsFetching(isFetching) {
    this.isFetching = isFetching;
    await this.sendFetchStatusToWebview();
  }

  startRetryTimer(retryAfter) {
    if (this.reFetchTimer) clearTimeout(this.reFetchTimer);
    this.reFetchTimer = setTimeout(async () => {
      if (!this.isFetching) {
        await this.fetchRateLimitUsage(false, false);
      }
    }, (retryAfter + 1) * 1000);
  }

  async fetchRateLimitUsageInBackground(refreshToken, force) {
    try {
      await this.fetchRateLimitUsage(refreshToken, force);
    } catch (error) {
      Logger.warn('Error fetching rate limit usage in background', error);
    }
  }

  async fetchRateLimitUsage(refreshToken, force) {
    await this.setIsFetching(true);
    try {
      let headers = {};
      let abortController = new AbortController();
      
      if (refreshToken) {
        await this.client.auth.refreshTraycerToken();
      }
      
      let response = await this.client.sendGetRateLimitUsageRequest(headers, abortController);
      
      if (response.rateLimitInfo) {
        this.latestRateLimitInfo = response.rateLimitInfo;
        await this.sendUsageInformationToWebview(force);
      }
    } finally {
      await this.setIsFetching(false);
    }
  }

  async handleSyncRateLimitUsage(rateLimitInfo) {
    this.latestRateLimitInfo = rateLimitInfo;
    await this.sendUsageInformationToWebview(false);
  }

  async handleSendIsFetchingStatus() {
    return this.sendFetchStatusToWebview();
  }

  async sendFetchStatusToWebview() {
    // CommentNavigator 会在主文件中定义
    if (typeof CommentNavigator === 'undefined') return;
    
    let message = {
      type: UsageInformationWebViewMessages.SEND_FETCH_STATUS,
      isFetching: this.isFetching
    };
    
    if (!this.lastSentFetchStatus || !(0, lodash_module.isEqual)(this.lastSentFetchStatus, message)) {
      this.lastSentFetchStatus = message;
      await CommentNavigator.postToCommentNavigator(message);
    }
  }

  async sendUsageInformationToWebview(force) {
    // CommentNavigator 会在主文件中定义
    if (typeof CommentNavigator === 'undefined') return;
    
    let usageInfo = this.convertToUsageInformation(this.latestRateLimitInfo);
    let message = {
      type: UsageInformationWebViewMessages.SEND_USAGE_INFORMATION,
      usageInformation: usageInfo
    };
    
    if (!this.deduplicateMessage(message) || force) {
      this.lastSentMessage = message;
      if (this.latestRateLimitInfo.retryAfter) {
        this.startRetryTimer(this.latestRateLimitInfo.retryAfter);
      }
      await CommentNavigator.postToCommentNavigator(message);
    }
  }

  deduplicateMessage(message) {
    return !!(this.lastSentMessage && (0, lodash_module.isEqual)(this.lastSentMessage, message));
  }

  convertToUsageInformation(rateLimitInfo) {
    return {
      totalTokens: rateLimitInfo.totalTokens ?? 0,
      remainingTokens: Number((rateLimitInfo.remainingTokens ?? 0).toFixed(3)),
      retryAfter: rateLimitInfo.retryAfter ?? null
    };
  }
}

function parseJsonWithDates(_0xe6dfc) {
    return JSON.parse(_0xe6dfc, parseDateFromJson);
}
var ISO8601_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:Z|[-+]\d{2}:?\d{2})?$/;
function parseDateFromJson(_0x265b18, _0x4b3b79) {
    if (ISO8601_DATETIME_REGEX.test(_0x4b3b79)) {
      let _0x1a9765 = new Date(_0x4b3b79);
      return isNaN(_0x1a9765.getTime()) ? _0x4b3b79 : _0x1a9765;
    }
    return _0x4b3b79;
  }
class ApiClient {
    constructor(_0x539fdd, _0x12f1db, _0x3a1735) {
      this.token = _0x12f1db, this.headers = _0x3a1735, _0x539fdd.pathname.endsWith('/') ? this.base = _0x539fdd : this.base = new URL(_0x539fdd.href + '/'), this.base.pathname.includes('api') || (this.base.pathname = this.base.pathname + "api/");
    }
    ["base"];
    ["clientUrl"](_0x5b75fc, _0x5ae899) {
      let _0x24ee36 = new URL(_0x5b75fc.replace(/^\/+/, ''), this.base);
      if (_0x5ae899) {
        for (let [_0x26812c, _0x13dd5f] of Object.entries(_0x5ae899)) _0x13dd5f instanceof Date ? _0x24ee36.searchParams.set(_0x26812c, _0x13dd5f.toISOString()) : _0x24ee36.searchParams.set(_0x26812c, String(_0x13dd5f));
      }
      return _0x24ee36;
    }
    async ['get'](_0xb9790a, _0x5ed437 = this.getHeaders(this.headers), _0x3ad2b0) {
      let _0x4a2cf7 = await fetch(_0xb9790a, {
        headers: _0x5ed437,
        method: 'GET',
        signal: _0x3ad2b0
      });
      return this.handleResponse(_0x4a2cf7);
    }
    async ["post"](_0x2e0891, _0x167b04, _0x5952f6 = this.postHeaders(this.headers), _0x1b32f5) {
      let _0x5a72bd = await fetch(_0x2e0891, {
        headers: _0x5952f6,
        method: 'POST',
        body: JSON.stringify(_0x167b04),
        signal: _0x1b32f5
      });
      return this.handleResponse(_0x5a72bd);
    }
    async ["put"](_0x239142, _0x16b25e, _0x48a090 = this.postHeaders(this.headers)) {
      let _0x1a402a = await fetch(_0x239142, {
        headers: _0x48a090,
        method: 'PUT',
        body: JSON.stringify(_0x16b25e)
      });
      return this.handleResponse(_0x1a402a);
    }
    async ['delete'](_0x3ab41a, _0x5d320e, _0x577924 = this.getHeaders(this.headers)) {
      let _0x2e2dfb = await fetch(_0x3ab41a, {
        headers: _0x577924,
        method: 'DELETE',
        body: JSON.stringify(_0x5d320e)
      });
      return this.handleResponse(_0x2e2dfb);
    }
    ["setAuthToken"](_0x1a7ff7) {
      !_0x1a7ff7.has("Authorization") && this.token && _0x1a7ff7.set("Authorization", 'Bearer ' + this.token);
    }
    async ["handleResponse"](_0x118d66) {
      return _0x118d66.json = async () => parseJsonWithDates(await _0x118d66.text()), _0x118d66;
    }
    ["getHeaders"](_0x274fb9) {
      let _0x3f5075 = new Headers(_0x274fb9);
      return this.setAuthToken(_0x3f5075), _0x3f5075.has('Accept') || _0x3f5075.set('Accept', "application/json"), _0x3f5075;
    }
    ["postHeaders"](_0x5e6f93) {
      let _0x16ee75 = new Headers(_0x5e6f93);
      return this.setAuthToken(_0x16ee75), _0x16ee75.has('Content-Type') || _0x16ee75.set('Content-Type', 'application/json'), _0x16ee75;
    }
  };

class TraycerApiClient extends ApiClient {
    ["githubLogin"](_0x170b1a, _0x47ec9a, _0x52c6cf) {
      let _0x40da80 = this.clientUrl('/github/sign-in', {
        source: _0x47ec9a,
        email: _0x52c6cf
      });
      return this.get(_0x40da80, _0x170b1a);
    }
    ["getUser"](_0x404f8c) {
      let _0x4259f5 = this.clientUrl('/user');
      return this.get(_0x4259f5, _0x404f8c);
    }
    ["getSubscription"](_0x14b5f2) {
      let _0x1b82a0 = this.clientUrl("/user/subscription");
      return this.get(_0x1b82a0, _0x14b5f2);
    }
    ['cancelUserSubscription'](_0x3cd03d, _0x49ffea) {
      let _0x5d3edf = this.clientUrl('/user/cancel-subscription');
      return this.post(_0x5d3edf, _0x3cd03d, _0x49ffea);
    }
    ["cancelUserUpcomingSubscription"](_0x43f002) {
      let _0x137528 = this.clientUrl("/user/cancel-upcoming");
      return this.post(_0x137528, {}, _0x43f002);
    }
    ["resumeUserSubscription"](_0x598de7) {
      let _0x1f8b1b = this.clientUrl("/user/resume-subscription");
      return this.post(_0x1f8b1b, {}, _0x598de7);
    }
    ['listOrganizations'](_0x531924) {
      let _0x43909a = this.clientUrl('/user/list-organizations');
      return this.get(_0x43909a, _0x531924);
    }
    ["listPrices"](_0x3e77a2) {
      let _0x4d6eaa = this.clientUrl("/user/list-prices");
      return this.get(_0x4d6eaa, _0x3e77a2);
    }
    ['generateCustomerPortalLink'](_0x331fc0, _0x1a329b) {
      let _0xc227f9 = this.clientUrl('/user/customer-portal');
      return this.post(_0xc227f9, _0x331fc0, _0x1a329b);
    }
    ['updatePrivacyMode'](_0x3ce159, _0x4b37bb) {
      let _0x5f530a = this.clientUrl("/user/update-privacy-mode");
      return this.post(_0x5f530a, _0x3ce159, _0x4b37bb);
    }
    ['applyCoupon'](_0x311378, _0xd2fbec) {
      let _0x40ecf4 = this.clientUrl('/user/apply-coupon');
      return this.post(_0x40ecf4, _0x311378, _0xd2fbec);
    }
    ['updateUserSubscription'](_0x15946d, _0x211c92) {
      let _0x11a628 = this.clientUrl("/user/update-subscription");
      return this.post(_0x11a628, _0x15946d, _0x211c92);
    }
    ['calculateUserPrice'](_0x2c2a23, _0x26b075) {
      let _0x5dfd06 = this.clientUrl("/user/calculate-price");
      return this.post(_0x5dfd06, _0x2c2a23, _0x26b075);
    }
    ["createUserCheckoutSession"](_0x152773, _0x5c22e6) {
      let _0x323773 = this.clientUrl('/user/create-checkout-session');
      return this.post(_0x323773, _0x152773, _0x5c22e6);
    }
    ["createUserSetupIntent"](_0x50b41c) {
      let _0x3df79d = this.clientUrl('/user/setup-intent');
      return this.post(_0x3df79d, {}, _0x50b41c);
    }
    ["validateUserCoupon"](_0x22655e, _0x5ce986) {
      let _0xc9d031 = this.clientUrl('/user/validate-coupon');
      return this.post(_0xc9d031, _0x22655e, _0x5ce986);
    }
    ['updateUserEmail'](_0x161736, _0x2ff343) {
      let _0x4f5ee3 = this.clientUrl("/user/update-email");
      return this.post(_0x4f5ee3, _0x161736, _0x2ff343);
    }
    ["sendUserVerificationEmail"](_0x3ca145, _0x33d0d9) {
      let _0xada44a = this.clientUrl('/user/email-verification');
      return this.post(_0xada44a, _0x3ca145, _0x33d0d9);
    }
    ['sendOrganizationVerificationEmail'](_0x2560d, _0xecaca9, _0x39dfd4) {
      let _0x3ac091 = this.clientUrl('/organization/' + _0xecaca9 + '/email-verification');
      return this.post(_0x3ac091, _0x2560d, _0x39dfd4);
    }
    ["updateOrganizationEmail"](_0x1fe582, _0x2be7b4, _0x5a6196) {
      let _0x243c5d = this.clientUrl("/organization/" + _0x1fe582 + "/update-email");
      return this.post(_0x243c5d, _0x2be7b4, _0x5a6196);
    }
    ['fetchOrganizationInfo'](_0x44c937, _0x3d368e) {
      let _0x534fb7 = this.clientUrl("/organization/" + _0x44c937);
      return this.get(_0x534fb7, _0x3d368e);
    }
    ["fetchOrganizationSeats"](_0x195817, _0x2152c6) {
      let _0x97badf = this.clientUrl('/organization/' + _0x195817 + '/seat-management');
      return this.get(_0x97badf, _0x2152c6);
    }
    ["fetchOrganizationSubscription"](_0x1b92fa, _0x2b6010) {
      let _0x4b43ae = this.clientUrl("/organization/" + _0x1b92fa + "/subscription");
      return this.get(_0x4b43ae, _0x2b6010);
    }
    ["listOrganizationPrices"](_0x208719, _0x31ac3d) {
      let _0x4cb367 = this.clientUrl("/organization/" + _0x208719 + "/list-prices");
      return this.get(_0x4cb367, _0x31ac3d);
    }
    ['generateOrganizationCustomerPortalLink'](_0x4295, _0x570c80, _0x4ad160) {
      let _0x52d51a = this.clientUrl("/organization/" + _0x570c80 + '/customer-portal');
      return this.post(_0x52d51a, _0x4295, _0x4ad160);
    }
    ['updateOrganizationSeatAssignmentType'](_0x224417, _0xc3be67, _0x37f45c) {
      let _0x54925c = this.clientUrl("/organization/" + _0x224417 + "/update-seat-assignment-type");
      return this.post(_0x54925c, _0xc3be67, _0x37f45c);
    }
    ['startOrganizationTrial'](_0x2b6f69, _0x3d97f5) {
      let _0x292651 = this.clientUrl("/organization/" + _0x2b6f69 + "/start-trial");
      return this.post(_0x292651, {}, _0x3d97f5);
    }
    ['updateOrganizationSubscription'](_0x5405ba, _0x120507, _0x599a4b) {
      let _0x1b4bff = this.clientUrl('/organization/' + _0x5405ba + "/update-subscription");
      return this.post(_0x1b4bff, _0x120507, _0x599a4b);
    }
    ["resumeOrganizationSubscription"](_0x3c9dd8, _0x579722) {
      let _0x5cafec = this.clientUrl('/organization/' + _0x3c9dd8 + "/resume-subscription");
      return this.post(_0x5cafec, {}, _0x579722);
    }
    ["calculateOrganizationPrice"](_0x1d9c1d, _0x26cf1b, _0x2377a0) {
      let _0x56e6fc = this.clientUrl('/organization/' + _0x1d9c1d + '/calculate-price');
      return this.post(_0x56e6fc, _0x26cf1b, _0x2377a0);
    }
    ["applyOrganizationCoupon"](_0x4aeb53, _0x593925, _0x319631) {
      let _0x5e7d66 = this.clientUrl("/organization/" + _0x4aeb53 + '/apply-coupon');
      return this.post(_0x5e7d66, _0x593925, _0x319631);
    }
    ["cancelOrganizationSubscription"](_0x547cf6, _0x47d409, _0x23425d) {
      let _0x4a0cd3 = this.clientUrl('/organization/' + _0x547cf6 + "/cancel-subscription");
      return this.post(_0x4a0cd3, _0x47d409, _0x23425d);
    }
    ['cancelOrganizationUpcomingSubscription'](_0x349961, _0xff0b31) {
      let _0x38508c = this.clientUrl('/organization/' + _0x349961 + '/cancel-upcoming');
      return this.post(_0x38508c, {}, _0xff0b31);
    }
    ["updateOrganizationSeats"](_0x249f61, _0x1a0690, _0x5a1257) {
      let _0xaa8604 = this.clientUrl("/organization/" + _0x249f61 + '/seat-management');
      return this.post(_0xaa8604, _0x1a0690, _0x5a1257);
    }
    ['createOrganizationCheckoutSession'](_0x4d9853, _0x51a0ad, _0x7f4fe2) {
      let _0x49eb4e = this.clientUrl('/organization/' + _0x4d9853 + "/create-checkout-session");
      return this.post(_0x49eb4e, _0x51a0ad, _0x7f4fe2);
    }
    ["createOrganizationSetupIntent"](_0x9ae7e8, _0x158d1b) {
      let _0x4a9853 = this.clientUrl('/organization/' + _0x9ae7e8 + '/setup-intent');
      return this.post(_0x4a9853, {}, _0x158d1b);
    }
    ['validateOrganizationCoupon'](_0x1e9791, _0xaa2b2c, _0x4a0f3b) {
      let _0x430173 = this.clientUrl("/organization/" + _0x1e9791 + "/validate-coupon");
      return this.post(_0x430173, _0xaa2b2c, _0x4a0f3b);
    }
    ["getOrgRepo"](_0x357489, _0xb42b32) {
      let _0x3ae0a7 = this.clientUrl("/repositories/" + _0x357489 + "/list-repos");
      return this.get(_0x3ae0a7, _0xb42b32);
    }
    ["getUserRepo"](_0x28b4f9) {
      let _0x22b0a1 = this.clientUrl('/repositories/list-repos');
      return this.get(_0x22b0a1, _0x28b4f9);
    }
    ['getOrgRepoLabels'](_0xeaac, _0x2f7aa1, _0x5c13a4) {
      let _0x398abe = this.clientUrl("/repositories/" + _0xeaac + '/labels');
      return this.post(_0x398abe, _0x2f7aa1, _0x5c13a4);
    }
    ['getUserRepoLabels'](_0x520d17, _0x2a6ce9) {
      let _0x1e86c3 = this.clientUrl("/repositories/labels");
      return this.post(_0x1e86c3, _0x520d17, _0x2a6ce9);
    }
    ["updateRepoSettings"](_0x161e57, _0x81cee0, _0x3fbe93) {
      let _0x5d7769 = this.clientUrl("/repositories/update-settings");
      return this.post(_0x5d7769, _0x81cee0, _0x3fbe93);
    }
    ["increaseMeteredUsageCount"](_0x4cfe31) {
      let _0x46b106 = this.clientUrl('/user/increase-metered-usage-count');
      return this.post(_0x46b106, {}, _0x4cfe31);
    }
    ['increaseMeteredUsageCountInBackground'](_0x5794ae) {
      this.increaseMeteredUsageCount(_0x5794ae).catch(() => {});
    }
    ["validateInvoice"](_0x14a375) {
      let _0x4428ae = this.clientUrl('/user/validate-invoice');
      return this.post(_0x4428ae, {}, _0x14a375);
    }
    ['generateMeteredInvoice'](_0x4d68ab) {
      let _0x153cde = this.clientUrl("/user/generate-metered-invoice");
      return this.post(_0x153cde, {}, _0x4d68ab);
    }
    ['refreshToken'](_0x5b470e) {
      let _0x369581 = this.clientUrl("/auth/refresh");
      return this.post(_0x369581, {}, _0x5b470e);
    }
    ['exchangeToken'](_0x428df0) {
      let _0x132061 = this.clientUrl("/user/exchange-token");
      return this.post(_0x132061, {}, _0x428df0);
    }
    ["installMCPServer"](_0x5e232d, _0x14bff7) {
      let _0x42e455 = this.clientUrl('/user/mcp-servers/install');
      return this.post(_0x42e455, _0x5e232d, _0x14bff7);
    }
    ['updateMCPServer'](_0x2c8ebf, _0x41eb13, _0x4b152e) {
      let _0x3a93d0 = this.clientUrl("/user/mcp-servers/" + _0x2c8ebf + '/update');
      return this.post(_0x3a93d0, _0x41eb13, _0x4b152e);
    }
    ["connectMCPServer"](_0x1f45d7, _0x35ddc3) {
      let _0xb784bf = this.clientUrl("/user/mcp-servers/" + _0x1f45d7 + "/connect");
      return this.post(_0xb784bf, {}, _0x35ddc3);
    }
    ['listMCPServers'](_0x4b4af5) {
      let _0x592f87 = this.clientUrl('/user/mcp-servers/list');
      return this.get(_0x592f87, _0x4b4af5);
    }
    ['refreshMCPServers'](_0x363bdd) {
      let _0x5e3bd4 = this.clientUrl("/user/mcp-servers/refresh");
      return this.post(_0x5e3bd4, {}, _0x363bdd);
    }
    ["listAllMCPServers"](_0x1a2291) {
      let _0x467ce4 = this.clientUrl("/user/mcp-servers/list-all");
      return this.get(_0x467ce4, _0x1a2291);
    }
    ['disconnectMCPServer'](_0x3deff4, _0x1a7b74) {
      let _0x89f171 = this.clientUrl('/user/mcp-servers/' + _0x3deff4 + '/disconnect');
      return this.post(_0x89f171, {}, _0x1a7b74);
    }
    ['deleteMCPServer'](_0x3ba910, _0x427809) {
      let _0x31434c = this.clientUrl("/user/mcp-servers/" + _0x3ba910);
      return this.delete(_0x31434c, {}, _0x427809);
    }
    ['oauthCallback'](_0x5002ba, _0x36da2c) {
      let _0xa8b71c = this.clientUrl("/mcp-servers/oauth/callback", _0x5002ba);
      return this.post(_0xa8b71c, {}, _0x36da2c);
    }
    ['executeMCPServerTool'](_0xaed4d, _0x264dd6, _0x86d24d) {
      let _0x2c9cd9 = this.clientUrl("/user/mcp-servers/" + _0xaed4d + '/execute-tool');
      return this.post(_0x2c9cd9, _0x264dd6, _0x86d24d);
    }
    ["listMCPServerTools"](_0x31805a, _0x43e4f6) {
      let _0x17b4e2 = this.clientUrl("/user/mcp-servers/" + _0x31805a + "/list-tools");
      return this.get(_0x17b4e2, _0x43e4f6);
    }
    ['installOrganizationMCPServer'](_0x12e80c, _0x1a7992, _0x44e2ff) {
      let _0x51e20b = this.clientUrl('/organization/' + _0x12e80c + '/mcp-servers/install');
      return this.post(_0x51e20b, _0x1a7992, _0x44e2ff);
    }
    ["updateOrganizationMCPServer"](_0x1d4a87, _0x57348b, _0x30f62f, _0x365181) {
      let _0xc5d723 = this.clientUrl('/organization/' + _0x1d4a87 + '/mcp-servers/' + _0x57348b + '/update');
      return this.post(_0xc5d723, _0x30f62f, _0x365181);
    }
    ["connectOrganizationMCPServer"](_0x1633c3, _0x2d32ad, _0x44003a) {
      let _0x3ab88e = this.clientUrl("/organization/" + _0x1633c3 + "/mcp-servers/" + _0x2d32ad + '/connect');
      return this.post(_0x3ab88e, {}, _0x44003a);
    }
    ['listOrganizationMCPServers'](_0xfb065d, _0x37f3aa) {
      let _0x26d4c5 = this.clientUrl('/organization/' + _0xfb065d + "/mcp-servers/list");
      return this.get(_0x26d4c5, _0x37f3aa);
    }
    ['refreshOrganizationMCPServers'](_0x1c6097, _0x196bb4) {
      let _0x52a40d = this.clientUrl('/organization/' + _0x1c6097 + '/mcp-servers/refresh');
      return this.post(_0x52a40d, {}, _0x196bb4);
    }
    ["disconnectOrganizationMCPServer"](_0x515fae, _0x3f6c2b, _0x20c57e) {
      let _0x292629 = this.clientUrl("/organization/" + _0x515fae + '/mcp-servers/' + _0x3f6c2b + '/disconnect');
      return this.post(_0x292629, {}, _0x20c57e);
    }
    ['deleteOrganizationMCPServer'](_0x8c21d8, _0x36daab, _0x37c1db) {
      let _0x1fb29e = this.clientUrl("/organization/" + _0x8c21d8 + '/mcp-servers/' + _0x36daab);
      return this.delete(_0x1fb29e, {}, _0x37c1db);
    }
    ['executeOrganizationMCPServerTool'](_0x3ec65b, _0x430b07, _0x9640a0, _0x2b9a5c) {
      let _0x3c4aa4 = this.clientUrl("/organization/" + _0x3ec65b + '/mcp-servers/' + _0x430b07 + '/execute-tool');
      return this.post(_0x3c4aa4, _0x9640a0, _0x2b9a5c);
    }
    ["listOrganizationMCPServerTools"](_0x36c58c, _0x513a18, _0x190481) {
      let _0x533e84 = this.clientUrl('/organization/' + _0x36c58c + '/mcp-servers/' + _0x513a18 + "/list-tools");
      return this.get(_0x533e84, _0x190481);
    }
  };



class AuthStatusHandler {
    // CommentNavigator 依赖注入
    static _commentNavigator = null;
    
    /**
     * 初始化 AuthStatusHandler，注入 CommentNavigator 依赖
     * @param {Object} commentNavigator - CommentNavigator 实例
     */
    static initialize(commentNavigator) {
      this._commentNavigator = commentNavigator;
    }
    
    static async ['sendAuthStatus'](_0x42b2df) {
      if (!this._commentNavigator) {
        throw new Error('AuthStatusHandler not initialized. Call AuthStatusHandler.initialize(commentNavigator) first.');
      }
      let _0x5efd6e = {
        type: _0x42b2df,
        sendToViewImmediately: true
      };
      await this._commentNavigator.postToCommentNavigator(_0x5efd6e);
    }
    static async ["sendSigningInMessage"]() {
      await this.sendAuthStatus(AuthenticationWebViewMessages.SIGNING_IN);
    }
    static async ["sendSignedInMessage"]() {
      await this.sendAuthStatus(AuthenticationWebViewMessages.SIGNED_IN);
    }
    static async ['sendSignedOutMessage']() {
      await this.sendAuthStatus(AuthenticationWebViewMessages.SIGNED_OUT);
    }
    static async ["updateVSCodeContext"](_0x18f442) {
      _0x18f442 ? await this.setSignedInContext() : await this.setSignedOutContext();
    }
    static async ['setSignedInContext']() {
      await vscode_module.commands.executeCommand("setContext", "traycer.isSignedOut", false);
    }
    static async ['setSignedOutContext']() {
      return vscode_module.commands.executeCommand("setContext", 'traycer.isSignedOut', true);
    }
  };

class AuthStatusHandlerExports {
    constructor() {
      this.currentState = "SignedOut";
    }
    async ["setState"](_0x572b9b) {
      await this.performStateTransition(_0x572b9b);
    }
    async ['performStateTransition'](_0x58dcd2) {
      switch (_0x58dcd2) {
        case "SignedOut":
          await AuthStatusHandler.sendSignedOutMessage();
          break;
        case "SigningIn":
          await AuthStatusHandler.sendSigningInMessage();
          break;
        case "SignedIn":
          await AuthStatusHandler.sendSignedInMessage();
          break;
      }
      this.currentState = _0x58dcd2;
    }
    ["isInProgress"]() {
      return this.currentState === 'SigningIn';
    }
    ["isSignedOut"]() {
      return this.currentState === 'SignedOut';
    }
    ["isWaitingForUserConfirmation"]() {
      return this.currentState === 'WaitingForUserConfirmation';
    }
  };


class ContextStorageManager{
    constructor(_0x5d3aec) {
      this.context = _0x5d3aec;
    }
    ["getTokenKey"]() {
      return config.nodeEnv === 'production' ? AUTH_TOKEN_KEY : config.nodeEnv + ':' + AUTH_TOKEN_KEY;
    }
    ["getLegacyTokenKey"]() {
      return ACCESS_TOKEN_KEY;
    }
    async ["storeToken"](_0x3932a6) {
      await this.context.secrets.store(this.getTokenKey(), _0x3932a6);
    }
    async ["getToken"]() {
      return await this.context.secrets.get(this.getTokenKey());
    }
    async ["getLegacyToken"]() {
      return await this.context.secrets.get(this.getLegacyTokenKey());
    }
    async ["removeLegacyToken"]() {
      await this.context.secrets.delete(this.getLegacyTokenKey());
    }
    async ['deleteToken']() {
      await this.context.secrets.delete(this.getTokenKey());
    }
  };

/**
 * TraycerCredentials - 管理 Traycer 认证凭据
 */
class TraycerCredentials {
  static SIGN_IN_COMMAND = "traycer.signIn";
  static SIGN_OUT_COMMAND = "traycer.signOut";

  constructor(context, onActivation, onDeactivation) {
    this.context = context;
    this._traycerUser = null;
    this._traycerToken = null;
    this.currentAuthController = null;
    
    Logger.info("Initializing Traycer credentials");
    
    this.authClient = new TraycerApiClient(new URL(config.authnApiUrl));
    this.onActivation = onActivation;
    this.onDeactivation = onDeactivation;
    this.authStateManager = new AuthStatusHandlerExports();
    this.contextStorageManager = new ContextStorageManager(context);
    this.tokenManager = new TokenManager(this.authClient);
  }

  async handleActivation(token, user) {
    await this.authStateManager.setState("SignedIn");
    this._traycerUser = user;
    this._traycerToken = token;
    await this.contextStorageManager.storeToken(token);
    await AuthStatusHandler.updateVSCodeContext(user);
    await vscode_module.commands.executeCommand("setContext", 'traycer.enableCommands', true);
    await this.onActivation();
    await UsageTracker.getInstance().fetchRateLimitUsage(false, true);
  }

  async handleDeactivation() {
    this.currentAuthController?.abort();
    this.currentAuthController = null;
    await this.authStateManager.setState("SignedOut");
    await this.contextStorageManager.deleteToken();
    this._traycerUser = null;
    this._traycerToken = null;
    await AuthStatusHandler.updateVSCodeContext(void 0);
    await vscode_module.commands.executeCommand('setContext', "traycer.enableCommands", false);
    await this.onDeactivation();
  }

  get authnClient() {
    return this.authClient;
  }

  get traycerToken() {
    return this._traycerToken;
  }

  get traycerUser() {
    return this._traycerUser;
  }

  async setupAuth() {
    this.currentAuthController?.abort();
    let abortSignal = this.beginAuthOperation();
    
    await this.authStateManager.setState('SigningIn');
    
    await registerVscodeCommand(this.context, TraycerCredentials.SIGN_IN_COMMAND, async () => {
      try {
        await this.promptSignIn();
      } catch (error) {
        Logger.error(error, 'Error during sign in command');
        this.handleDeactivation();
        return;
      }
    });
    
    await registerVscodeCommand(this.context, TraycerCredentials.SIGN_OUT_COMMAND, async () => {
      try {
        await this.handleDeactivation();
      } catch (error) {
        Logger.error(error, 'Error during sign out command');
        return;
      }
    });
    
    let storedToken = await this.contextStorageManager.getToken();
    if (storedToken?.length) {
      if (await this.validateTraycerToken(storedToken, abortSignal)) return;
      Logger.warn("Invalid tokens, removing stored tokens");
      await this.contextStorageManager.deleteToken();
    } else {
      let legacyToken = await this.contextStorageManager.getLegacyToken();
      if (legacyToken?.length) {
        if (await this.exchangeTraycerToken(legacyToken, abortSignal)) return;
        await this.contextStorageManager.removeLegacyToken();
      }
    }
    
    this.handleDeactivation();
  }

  async authenticateWithTraycerToken(token) {
    let abortSignal = this.beginAuthOperation();
    (await this.validateTraycerToken(token, abortSignal)) || (await this.handleDeactivation());
  }

  async validateTraycerToken(token, abortSignal) {
    try {
      let validatedUser = await this.tokenManager.validateToken(token, abortSignal);
      await this.handleActivation(token, validatedUser);
      return true;
    } catch (error) {
      Logger.warn("Error validating Traycer token", formatErrorToString(error));
      
      if (isAbortError(error)) {
        return false;
      }
      
      if (error instanceof UnauthorizedError && 
          (await this.refreshTraycerTokenInternal(token, abortSignal)) && 
          this._traycerToken) {
        return this.validateTraycerToken(this._traycerToken, abortSignal);
      }
      
      return false;
    }
  }

  async exchangeTraycerToken(legacyToken, abortSignal) {
    try {
      let exchangeResult = await this.tokenManager.exchangeToken(legacyToken, abortSignal);
      await this.handleActivation(exchangeResult.token, exchangeResult.user);
      await this.contextStorageManager.removeLegacyToken();
      return true;
    } catch (error) {
      Logger.warn("Token exchange failed", error);
      return false;
    }
  }

  async refreshTraycerToken() {
    let currentToken = this.traycerToken;
    return currentToken ? this.refreshTraycerTokenInternal(currentToken, this.beginAuthOperation()) : false;
  }

  async refreshTraycerTokenInternal(token, abortSignal) {
    try {
      let refreshResult = await this.tokenManager.refreshToken(token, abortSignal);
      await this.contextStorageManager.storeToken(refreshResult.token);
      this._traycerToken = refreshResult.token;
      return true;
    } catch (error) {
      Logger.warn('Token refresh failed', error);
      return false;
    }
  }

  async validateInvoice() {
    let user = this.traycerUser;
    let token = this.traycerToken;
    
    if (!user || !token) throw new Error("Traycer user or access token not set");
    
    try {
      let usage = await this.tokenManager.validateInvoice(token);
      user.payAsYouGoUsage = usage;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        if (await this.refreshTraycerTokenInternal(token, this.beginAuthOperation())) {
          return this.validateInvoice();
        }
        this.handleDeactivation();
        return;
      }
      throw error;
    }
  }

  async listAllMCPServers() {
    let token = this.traycerToken;
    if (!token) throw new Error('Traycer user or access token not set');
    
    try {
      return await this.tokenManager.listAllMCPServers(token);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        if (await this.refreshTraycerTokenInternal(token, this.beginAuthOperation())) {
          return this.listAllMCPServers();
        }
        throw this.handleDeactivation(), new Error("Failed to list MCP servers");
      }
      throw error;
    }
  }

  async sendAuthenticationStatus() {
    return this.traycerUser && this.traycerToken 
      ? AuthStatusHandler.sendSignedInMessage() 
      : this.authStateManager.isInProgress() 
        ? AuthStatusHandler.sendSigningInMessage() 
        : AuthStatusHandler.sendSignedOutMessage();
  }

  dispose() {
    this.currentAuthController?.abort();
  }

  beginAuthOperation() {
    this.currentAuthController?.abort();
    this.currentAuthController = new AbortController();
    return this.currentAuthController.signal;
  }

  async promptSignIn() {
    await this.authStateManager.setState("SignedOut");
    await this.authStateManager.setState('WaitingForUserConfirmation');
    
    let selection = await vscode_module.window.showInformationMessage(
      "Login to use Traycer", 
      "Sign in with Traycer", 
      "Paste token"
    );
    
    if (selection === "Sign in with Traycer") {
      await this.authStateManager.setState("SigningIn");
      await this.openCloudUI();
    } else if (selection === "Paste token") {
      await this.promptPasteToken();
    }
  }

  async openCloudUI() {
    let callbackUri = WorkspaceInfoManager.getInstance().getIdeInfo().uriScheme + 
                      "://" + 
                      'traycer.traycer-vscode' + 
                      '/' + 
                      AUTH_CALLBACK_COMMAND;
    let cloudUrl = config.cloudUIUrl + '?redirect_uri=' + encodeURIComponent(callbackUri);
    await WorkspaceInfoManager.getInstance().openExternalLink(cloudUrl);
  }

  async promptPasteToken() {
    let pastedToken = await vscode_module.window.showInputBox({
      prompt: "Paste the token copied from the browser",
      placeHolder: "Paste the token copied from the browser",
      ignoreFocusOut: true,
      password: true
    });
    
    if (pastedToken && pastedToken.trim()) {
      try {
        if (await this.validateTraycerToken(pastedToken, this.beginAuthOperation())) {
          return;
        }
      } catch (error) {
        Logger.error(
          'Error processing pasted token', 
          error instanceof Error ? error.message : String(error)
        );
      }
    }
    
    await this.promptSignIn();
  }
}

// 导出所有类和函数
module.exports = {
  // API 客户端
  ApiClient,
  TraycerApiClient,
  
  // 认证状态处理
  AuthStatusHandler,
  AuthStatusHandlerExports,
  
  // 存储管理
  ContextStorageManager,
  
  // Token 管理
  TokenManager,
  
  // 认证凭据
  TraycerCredentials,
  
  // 使用情况跟踪
  UsageTracker,
  
  // 工具函数
  parseJsonWithDates,
  parseDateFromJson,
  isAbortError,
  registerVscodeCommand
};