'use strict';

/**
 * Task 数据迁移器模块
 * 包含 WorkspaceMigrator 和各版本 TaskMigrator (V0-V36)
 * 用于处理任务数据在不同版本间的迁移
 */

// 任务步骤状态枚举
const TaskStepStatus = {
  NOT_STARTED: 0,
  RATE_LIMITED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  FAILED: 4,
  ABORTING: 5,
  ABORTED: 6,
  SKIPPED: 7,
  WAITING_FOR_EXECUTION: 8
};

// 计划产物类型枚举
const PlanArtifactType = {
  IMPLEMENTATION_ARTIFACT: 0,
  REVIEW_ARTIFACT: 1
};

// 验证评论严重性枚举
const CommentSeverity = {
  MINOR: 0,
  MAJOR: 1,
  CRITICAL: 2
};

// 代理模式枚举
const AgentMode = {
  SINGLE_AGENT: 0,
  MULTI_AGENT: 1,
  QUICK_AGENT: 2
};

// 阶段大小枚举
const PhaseSize = {
  ISSUE: 0,
  STORY: 1,
  EPIC: 2
};

// 文件操作类型枚举
const FileOperation = {
  MODIFY: 0,
  NEW: 1,
  DELETE: 2,
  RENAME: 3
};

// ============= 辅助函数 =============

/**
 * 创建 UUID 的函数引用
 * 需要从主文件注入
 */
let createUuid = null;

/**
 * 设置 createUuid 函数引用
 */
function setCreateUuid(fn) {
  createUuid = fn;
}

/**
 * 创建文本 DocNode
 */
function createTextDocNode(text) {
  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: "text",
        text: text
      }]
    }]
  };
}

/**
 * 将查询转换为 DocNode
 */
function convertQueryToDocNode(query) {
  let userQuery = query.userQuery;
  let docNode = userQuery ? createTextDocNode(userQuery) : {
    type: 'doc',
    content: []
  };
  return {
    ...query,
    userQuery: docNode
  };
}

/**
 * 格式化计划步骤为 Markdown
 */
function formatPlanStepToMarkdown(planStep) {
  let traycerResponse = planStep.traycerResponse;
  let formattedResponse;
  if (traycerResponse) {
    formattedResponse = {
      ...traycerResponse,
      afterApply: traycerResponse?.commentProto?.codeComment?.fileEdit?.newFileContent || '',
      beforeApply: traycerResponse?.commentProto?.codeComment?.fileEdit?.oldFileContent || ''
    };
  }
  return {
    ...planStep,
    traycerResponse: formattedResponse
  };
}

/**
 * 获取活动工作区路径
 * 依赖 TaskStepStatus 枚举
 */
function getActiveWorkspacePath(status) {
  return TaskStepStatus[status];
}

// ============= 类定义 =============

/**
 * WorkspaceMigrator - 工作区迁移器
 * 将旧版本的工作区路径数据迁移到新格式
 * 
 * 注意：此类需要在初始化时设置 extractWorkspacePathsFromPhases 函数引用
 */
class WorkspaceMigrator {
  static extractWorkspacePathsFromPhasesFn = null;

  /**
   * 设置 extractWorkspacePathsFromPhases 函数引用
   * 该函数依赖主文件中的其他函数，因此需要从外部注入
   */
  static setExtractFunction(fn) {
    this.extractWorkspacePathsFromPhasesFn = fn;
  }

  static migrate(taskData) {
    if (!this.extractWorkspacePathsFromPhasesFn) {
      throw new Error('WorkspaceMigrator.extractWorkspacePathsFromPhasesFn must be set before calling migrate()');
    }
    return {
      ...taskData,
      workspaces: {
        workspaceFile: void 0,
        workspaceFolders: this.extractWorkspacePathsFromPhasesFn(taskData)
      }
    };
  }
}

/**
 * TaskMigratorV10 - 任务迁移器 V10
 * 迁移版本：v32 -> v33
 * 主要变更：添加 planArtifactType 和 isQueryExecutedDirectly 字段
 */
class TaskMigratorV10 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      planConversations: plan.planConversations.map(conv => this.migratePlanConversation(conv)),
      generatedPlan: this.migratePlanProto(plan.generatedPlan),
      planArtifactType: PlanArtifactType.IMPLEMENTATION_ARTIFACT,
      isQueryExecutedDirectly: false
    };
  }

  static migratePlanConversation(conversation) {
    return {
      ...conversation,
      plan: this.migratePlanProto(conversation.plan)
    };
  }

  static migratePlanProto(planProto) {
    return planProto ? {
      ...planProto,
      reviewOutput: null
    } : null;
  }
}

/**
 * TaskMigratorV11 - 任务迁移器 V11
 * 迁移版本：v33 -> v34
 * 主要变更：添加 retryAfterTimestamp 字段
 */
class TaskMigratorV11 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task)),
      prePhaseConversations: breakdown.prePhaseConversations.map(conv => this.migratePhaseConversation(conv))
    };
  }

  static migratePhaseConversation(conversation) {
    return {
      ...conversation,
      retryAfterTimestamp: void 0
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      failedPlanIterationQuery: task.failedPlanIterationQuery ? {
        ...task.failedPlanIterationQuery,
        retryAfterTimestamp: void 0
      } : void 0
    };
  }
}

/**
 * TaskMigratorV12 - 任务迁移器 V12
 * 迁移版本：v34 -> v35
 * 主要变更：添加 yoloModeState、taskExecutionConfig 和 reverificationState 字段
 */
class TaskMigratorV12 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      yoloModeState: null,
      taskExecutionConfig: void 0,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      verification: task.verification ? this.migrateVerification(task.verification, task.steps.verification) : null
    };
  }

  static migrateVerification(verification, verificationStep) {
    return {
      ...verification,
      reverificationState: verification.verificationOutput && verificationStep === TaskStepStatus.FAILED ? {
        hasFailed: true,
        isAborted: false,
        isRateLimited: false
      } : null
    };
  }
}

/**
 * TaskMigratorV13 - 任务迁移器 V13
 * 迁移版本：v35 -> v36
 * 主要变更：添加 executedWithAgent 字段
 */
class TaskMigratorV13 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      executedWithAgent: plan.executedWithAgent ?? null
    };
  }
}

/**
 * TaskMigratorV14 - 任务迁移器 V14
 * 迁移版本：v36 -> v37
 * 主要变更：添加 planSummary 字段
 */
class TaskMigratorV14 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      planSummary: void 0
    };
  }
}

/**
 * TaskMigratorV15 - 任务迁移器 V15
 * 迁移版本：v37 -> v38
 * 主要变更：添加 interviewAnswers 字段和 interview questions
 */
class TaskMigratorV15 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      prePhaseConversations: breakdown.prePhaseConversations.map(conv => this.migratePhaseConversation(conv))
    };
  }

  static migratePhaseConversation(conversation) {
    return {
      ...conversation,
      output: conversation.output ? this.migrateTaskOrchestratorOutput(conversation.output) : conversation.output,
      interviewAnswers: null
    };
  }

  static migrateTaskOrchestratorOutput(output) {
    return {
      ...output,
      interview: output.interview ? this.migrateInterviewOutput(output.interview) : output.interview
    };
  }

  static migrateInterviewOutput(interviewOutput) {
    return {
      ...interviewOutput,
      questions: []
    };
  }
}

/**
 * TaskMigratorV0 - 任务迁移器 V0
 * 迁移版本：v2 -> v3
 * 主要变更：将单个任务转换为任务数组，添加 fileSummaries
 */
class TaskMigratorV0 {
  static migrate(taskData) {
    let migratedTask = TaskMigratorV0.migrateTask(taskData);
    return {
      id: taskData.id,
      tasks: [migratedTask],
      title: taskData.title
    };
  }

  static migrateTask(task) {
    let plans = task.plans?.map(p => TaskMigratorV0.migratePlan(p)) || [];
    return {
      id: createUuid(),
      title: task.title,
      threads: task.threads,
      steps: task.steps,
      plans: plans,
      creationTime: task.creationTime,
      lastUpdated: task.lastUpdated,
      retryAfterTimestamp: task.retryAfterTimestamp,
      isPayAsYouGo: task.isPayAsYouGo,
      isActive: true,
      fileSummaries: []
    };
  }

  static migratePlan(plan) {
    return {
      planID: createUuid(),
      isActive: plan.isActive,
      logs: plan.logs,
      generatedPlan: plan.generatedPlan,
      userModifiedPlan: plan.userModifiedPlan,
      queryJsonContent: plan.userQuery
    };
  }
}

/**
 * TaskMigratorV1 - 任务迁移器 V1
 * 迁移版本：v3 -> v4
 * 主要变更：将计划步骤格式化为 Markdown
 */
class TaskMigratorV1 {
  static migrate(taskData) {
    return {
      id: taskData.id,
      tasks: taskData.tasks.map(t => TaskMigratorV1.migrateTask(t)),
      title: taskData.title
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      threads: task.threads.map(thread => TaskMigratorV1.migrateThread(thread))
    };
  }

  static migrateThread(thread) {
    return {
      ...thread,
      conversation: thread.conversation.map(conv => formatPlanStepToMarkdown(conv))
    };
  }
}

/**
 * TaskMigratorV2 - 任务迁移器 V2
 * 迁移版本：v4 -> v5
 * 主要变更：将日志转换为带 ID 和 thinking 的格式
 */
class TaskMigratorV2 {
  static migrate(taskData) {
    return {
      ...taskData,
      tasks: taskData.tasks.map(t => TaskMigratorV2.migrateTask(t))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans?.map(p => TaskMigratorV2.migratePlan(p)) ?? void 0
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      logs: plan.logs.map(log => ({
        id: createUuid(),
        title: log,
        thinking: ''
      }))
    };
  }
}

/**
 * TaskMigratorV3 - 任务迁移器 V3
 * 迁移版本：v5 -> v6
 * 主要变更：将用户查询转换为 DocNode 格式
 */
class TaskMigratorV3 {
  static migrate(taskData) {
    return {
      id: taskData.id,
      tasks: taskData.tasks.map(t => TaskMigratorV3.migrateTask(t)),
      title: taskData.title
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      threads: task.threads.map(thread => TaskMigratorV3.migrateThread(thread))
    };
  }

  static migrateThread(thread) {
    return {
      ...thread,
      conversation: thread.conversation.map(conv => convertQueryToDocNode(conv))
    };
  }
}

/**
 * TaskMigratorV4 - 任务迁移器 V4
 * 迁移版本：v6 -> v7
 * 主要变更：添加计划的新字段（observations, approach, howDidIGetHere, joke, mermaid）
 */
class TaskMigratorV4 {
  static migrate(taskData) {
    return {
      ...taskData,
      tasks: taskData.tasks.map(t => TaskMigratorV4.migrateTask(t))
    };
  }

  static migrateTask(task) {
    let plans = task.plans || [];
    return {
      ...task,
      plans: plans.map(p => TaskMigratorV4.migratePlan(p))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      generatedPlan: plan.generatedPlan ? {
        ...plan.generatedPlan,
        observations: plan.generatedPlan.summary,
        approach: '',
        howDidIGetHere: '',
        joke: '',
        mermaid: ''
      } : void 0,
      userModifiedPlan: plan.userModifiedPlan ? {
        ...plan.userModifiedPlan,
        observations: plan.userModifiedPlan.summary,
        approach: '',
        howDidIGetHere: '',
        joke: '',
        mermaid: ''
      } : void 0
    };
  }
}

/**
 * TaskMigratorV5 - 任务迁移器 V5
 * 迁移版本：v10 -> v11
 * 主要变更：添加 referredAttachmentNames 字段
 */
class TaskMigratorV5 {
  static migrate(taskData) {
    return {
      ...taskData,
      tasks: taskData.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      generatedPlan: plan.generatedPlan ? {
        ...plan.generatedPlan,
        implementationPlan: plan.generatedPlan.implementationPlan ? {
          ...plan.generatedPlan.implementationPlan,
          fileChanges: plan.generatedPlan.implementationPlan.fileChanges.map(fc => ({
            ...fc,
            referredAttachmentNames: fc.referredAttachments.map(att => 
              att.fileAttachments ? att.fileAttachments.fileName : 
              att.urlAttachments ? att.urlAttachments.url : ''
            ).filter(name => name !== '')
          }))
        } : null
      } : void 0,
      userModifiedPlan: plan.userModifiedPlan ? {
        ...plan.userModifiedPlan,
        implementationPlan: plan.userModifiedPlan.implementationPlan ? {
          ...plan.userModifiedPlan.implementationPlan,
          fileChanges: plan.userModifiedPlan.implementationPlan.fileChanges.map(fc => ({
            ...fc,
            referredAttachmentNames: fc.referredAttachments.map(att => 
              att.fileAttachments ? att.fileAttachments.fileName : 
              att.urlAttachments ? att.urlAttachments.url : ''
            ).filter(name => name !== '')
          }))
        } : null
      } : void 0
    };
  }
}

/**
 * TaskMigratorV6 - 任务迁移器 V6
 * 迁移版本：v11 -> v12
 * 主要变更：添加 llmInput 字段
 */
class TaskMigratorV6 {
  static migrate(taskData) {
    return {
      ...taskData,
      tasks: taskData.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      llmInput: null
    };
  }
}

/**
 * TaskMigratorV7 - 任务迁移器 V7
 * 迁移版本：v12 -> v13
 * 主要变更：添加 planConversations 字段
 */
class TaskMigratorV7 {
  static migrate(taskData) {
    return {
      ...taskData,
      tasks: taskData.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      planConversations: []
    };
  }
}

/**
 * TaskMigratorV8 - 任务迁移器 V8
 * 迁移版本：v13 -> v14
 * 主要变更：将 planID 重命名为 id
 */
class TaskMigratorV8 {
  static migrate(taskData) {
    return {
      ...taskData,
      tasks: taskData.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    let { planID, ...rest } = plan;
    return {
      id: planID,
      ...rest
    };
  }
}

/**
 * TaskMigratorV9 - 任务迁移器 V9
 * 迁移版本：v14 -> v15
 * 主要变更：添加 activeTaskId 和 activePlanId，移除 isActive 字段
 */
class TaskMigratorV9 {
  static migrate(taskData) {
    let activeTask = taskData.tasks.find(t => t.isActive);
    let activeTaskId = activeTask ? activeTask.id : null;
    if (!activeTaskId) {
      activeTaskId = taskData.tasks[taskData.tasks.length - 1].id;
    }
    return {
      ...taskData,
      activeTaskId: activeTaskId,
      tasks: taskData.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    let activePlan = task.plans.find(p => p.isActive);
    let activePlanId = activePlan ? activePlan.id : null;
    if (!activePlanId) {
      activePlanId = task.plans[task.plans.length - 1].id;
    }
    let { isActive, ...rest } = task;
    return {
      ...rest,
      activePlanId: activePlanId,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    let { isActive, ...rest } = plan;
    return rest;
  }
}

/**
 * StorageSerializer - 存储序列化器
 * 用于在存储格式之间转换数据
 */
class StorageSerializer {
  static toStorage(data) {
    if (!data) return null;
    let buffer = Buffer.isBuffer(data.data) ? data.data : Buffer.from(data.data);
    return {
      data: buffer.toString("base64"),
      version: data.version
    };
  }

  static fromStorage(data) {
    if (!data) return null;
    let encoding = /^[A-Za-z0-9+/]*={0,2}$/.test(data.data) ? "base64" : 'utf-8';
    return {
      data: Buffer.from(data.data, encoding),
      version: data.version
    };
  }
}

/**
 * TaskMigratorV16 - 任务迁移器 V16
 * 迁移版本：v15 -> v16
 * 主要变更：添加 phaseBreakdowns、prePhaseConversations、displayState、creationTimestamp
 */
class TaskMigratorV16 {
  static migrate(taskData) {
    let migratedTasks = taskData.tasks.map(task => this.migrateTask(task));
    let creationTimestamp = migratedTasks[0]?.creationTime ?? Date.now();
    return {
      ...taskData,
      tasks: migratedTasks,
      prePhaseConversations: [],
      displayState: "SHOW_ACTIVE_TASK",
      creationTimestamp: creationTimestamp
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan, task.activePlanId, task.steps.code_changes)),
      verification: null,
      steps: {
        userQuery: getActiveWorkspacePath(task.steps.user_query),
        planGeneration: getActiveWorkspacePath(task.steps.plan_generation),
        codeChanges: getActiveWorkspacePath(task.steps.code_changes),
        verification: TaskStepStatus.NOT_STARTED
      }
    };
  }

  static migratePlan(plan, activePlanId, codeChangesStatus) {
    return {
      ...plan,
      planConversations: plan.planConversations.map(conv => this.migratePlanConversation(conv)),
      isExecuted: plan.id === activePlanId && codeChangesStatus === 'COMPLETED'
    };
  }

  static migratePlanConversation(conversation) {
    return {
      ...conversation,
      llmInput: void 0
    };
  }
}

/**
 * TaskMigratorV17 - 任务迁移器 V17
 * 迁移版本：v16 -> v17
 * 主要变更：引入 phaseBreakdowns 结构，合并 userModifiedPlan 到 generatedPlan
 */
class TaskMigratorV17 {
  static migrate(taskData) {
    let migratedTasks = taskData.tasks.map(task => this.migrateTask(task));
    let phaseId = createUuid();
    return {
      creationTimestamp: taskData.creationTimestamp,
      displayState: taskData.displayState,
      id: taskData.id,
      title: taskData.title,
      phaseBreakdowns: [{
        id: phaseId,
        prePhaseConversations: taskData.prePhaseConversations,
        tasks: migratedTasks,
        activeTaskId: taskData.activeTaskId
      }],
      activePhaseBreakdownId: phaseId,
      lastUpdatedTime: migratedTasks.find(t => t.id === taskData.activeTaskId)?.lastUpdated ?? Date.now()
    };
  }

  static migrateTask(task) {
    return {
      activePlanId: task.activePlanId,
      id: task.id,
      steps: task.steps,
      threads: task.threads,
      title: task.title,
      plans: task.plans.map(plan => this.migratePlan(plan)),
      attachmentSummaries: task.attachmentSummaries,
      creationTime: task.creationTime,
      fileSummaries: task.fileSummaries,
      lastUpdated: task.lastUpdated,
      verification: task.verification
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      generatedPlan: plan.userModifiedPlan ?? plan.generatedPlan,
      executedWithAgent: null,
      llmInput: plan.llmInput ? StorageSerializer.toStorage(plan.llmInput) : null
    };
  }
}

/**
 * TaskMigratorV18 - 任务迁移器 V18
 * 迁移版本：v17 -> v18
 * 主要变更：为验证评论添加 isApplied 字段
 */
class TaskMigratorV18 {
  static migrate(taskData) {
    let phaseBreakdowns = taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown));
    return {
      ...taskData,
      phaseBreakdowns: phaseBreakdowns
    };
  }

  static migratePhaseBreakdown(breakdown) {
    let tasks = breakdown.tasks.map(task => this.migrateTask(task));
    return {
      ...breakdown,
      tasks: tasks
    };
  }

  static migrateTask(task) {
    let verification = task.verification ? this.migrateVerification(task.verification) : null;
    return {
      ...task,
      verification: verification
    };
  }

  static migrateVerification(verification) {
    let verificationOutput = verification.verificationOutput ? {
      ...verification.verificationOutput,
      comments: verification.verificationOutput.comments.map(comment => ({
        ...comment,
        isApplied: false
      }))
    } : null;
    return {
      ...verification,
      verificationOutput: verificationOutput
    };
  }
}

/**
 * TaskMigratorV19 - 任务迁移器 V19
 * 迁移版本：v18 -> v19
 * 主要变更：添加 agentMode 字段
 */
class TaskMigratorV19 {
  static migrate(taskData) {
    let phaseBreakdowns = taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown));
    return {
      ...taskData,
      phaseBreakdowns: phaseBreakdowns
    };
  }

  static migratePhaseBreakdown(breakdown) {
    let tasks = breakdown.tasks.map(task => this.migrateTask(task));
    return {
      ...breakdown,
      tasks: tasks
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      agentMode: AgentMode.SINGLE_AGENT
    };
  }
}

/**
 * TaskMigratorV20 - 任务迁移器 V20
 * 迁移版本：v19 -> v20
 * 主要变更：添加 explanationPlan 字段
 */
class TaskMigratorV20 {
  static migrate(taskData) {
    let phaseBreakdowns = taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown));
    return {
      ...taskData,
      phaseBreakdowns: phaseBreakdowns
    };
  }

  static migratePhaseBreakdown(breakdown) {
    let tasks = breakdown.tasks.map(task => this.migrateTask(task));
    return {
      ...breakdown,
      tasks: tasks
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    let planConversations = plan.planConversations.map(conv => this.migratePlanConversation(conv));
    return {
      ...plan,
      generatedPlan: plan.generatedPlan ? this.migratePlanProto(plan.generatedPlan) : void 0,
      planConversations: planConversations
    };
  }

  static migratePlanConversation(conversation) {
    let planProto = null;
    if (conversation.plan) {
      planProto = this.migratePlanProto(conversation.plan);
    }
    return {
      ...conversation,
      plan: planProto
    };
  }

  static migratePlanProto(planProto) {
    if (planProto.implementationPlan?.summary && !planProto.implementationPlan.fileChanges.length) {
      return {
        explanationPlan: {
          text: planProto.implementationPlan.summary,
          mermaid: planProto.implementationPlan.mermaid,
          canProposePlan: false
        },
        implementationPlan: null
      };
    }
    return {
      ...planProto,
      explanationPlan: null
    };
  }
}

/**
 * TaskMigratorV21 - 任务迁移器 V21
 * 迁移版本：v20 -> v21
 * 主要变更：为验证评论添加 severity 字段
 */
class TaskMigratorV21 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      verification: task.verification ? this.migrateVerification(task.verification) : task.verification
    };
  }

  static migrateVerification(verification) {
    return {
      ...verification,
      verificationOutput: verification.verificationOutput ? this.migrateVerificationOutput(verification.verificationOutput) : verification.verificationOutput
    };
  }

  static migrateVerificationOutput(output) {
    return {
      ...output,
      comments: output.comments?.map(comment => this.migrateVerificationComment(comment)) || []
    };
  }

  static migrateVerificationComment(comment) {
    return {
      ...comment,
      severity: CommentSeverity.MAJOR
    };
  }
}

/**
 * TaskMigratorV22 - 任务迁移器 V22
 * 迁移版本：v21 -> v22
 * 主要变更：添加 isPayAsYouGo 字段到 plans 和 verification
 */
class TaskMigratorV22 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan, task.isPayAsYouGo)),
      verification: task.verification ? this.migrateVerification(task.verification) : task.verification
    };
  }

  static migratePlan(plan, isPayAsYouGo) {
    return {
      ...plan,
      isPayAsYouGo: isPayAsYouGo ?? false
    };
  }

  static migrateVerification(verification) {
    return {
      ...verification,
      isPayAsYouGo: false
    };
  }
}

/**
 * TaskMigratorV23 - 任务迁移器 V23
 * 迁移版本：v22 -> v23
 * 主要变更：添加 codeChanges 结构
 */
class TaskMigratorV23 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      codeChanges: {
        taskThreads: task.threads,
        isPayAsYouGo: false
      }
    };
  }
}

/**
 * TaskMigratorV24 - 任务迁移器 V24
 * 迁移版本：v23 -> v24
 * 主要变更：添加 parentPlanID 字段
 */
class TaskMigratorV24 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: this.migratePlans(task.plans ?? []),
      codeChanges: task.codeChanges,
      verification: task.verification ?? null
    };
  }

  static migratePlans(plans) {
    let migratedPlans = [];
    let parentPlanID = null;
    for (let plan of plans) {
      let migratedPlan = {
        ...plan,
        parentPlanID: parentPlanID
      };
      migratedPlans.push(migratedPlan);
      parentPlanID = migratedPlan.id;
    }
    return migratedPlans;
  }
}

/**
 * TaskMigratorV25 - 任务迁移器 V25
 * 迁移版本：v24 -> v25
 * 主要变更：添加 hasSentCreationMetrics 字段
 */
class TaskMigratorV25 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      hasSentCreationMetrics: !!task.plans.some(plan => plan.generatedPlan),
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      hasSentCreationMetrics: !!plan.generatedPlan
    };
  }
}

/**
 * TaskMigratorV26 - 任务迁移器 V26
 * 迁移版本：v25 -> v26
 * 主要变更：添加 toolCallInfo 字段到日志条目
 */
class TaskMigratorV26 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task)),
      prePhaseConversations: breakdown.prePhaseConversations.map(conv => this.migratePhaseConversation(conv))
    };
  }

  static migratePhaseConversation(conversation) {
    return {
      ...conversation,
      logs: conversation.logs.map(log => this.migrateLogEntry(log))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      hasSentCreationMetrics: !!task.plans.some(plan => plan.generatedPlan),
      plans: task.plans.map(plan => this.migratePlan(plan)),
      verification: task.verification ? this.migrateVerification(task.verification) : null
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      hasSentCreationMetrics: !!plan.generatedPlan,
      logs: plan.logs.map(log => this.migrateLogEntry(log)),
      planConversations: plan.planConversations.map(conv => this.migratePlanConversation(conv))
    };
  }

  static migrateLogEntry(logEntry) {
    return {
      ...logEntry,
      toolCallInfo: null
    };
  }

  static migratePlanConversation(conversation) {
    return {
      ...conversation,
      logs: conversation.logs.map(log => this.migrateLogEntry(log))
    };
  }

  static migrateVerification(verification) {
    return {
      ...verification,
      logs: verification.logs.map(log => this.migrateLogEntry(log))
    };
  }
}

/**
 * TaskMigratorV27 - 任务迁移器 V27
 * 迁移版本：v26 -> v27
 * 主要变更：添加 discardedVerificationComments，将评论改为 threads 结构
 */
class TaskMigratorV27 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    let discardedComments = [];
    return {
      ...task,
      verification: task.verification ? this.migrateVerification(task.verification) : task.verification,
      discardedVerificationComments: discardedComments
    };
  }

  static migrateVerification(verification) {
    let verificationOutput = verification.verificationOutput;
    if (verificationOutput == null) {
      return {
        ...verification,
        verificationOutput: null
      };
    }
    let threads = [];
    for (let comment of verificationOutput.comments) {
      threads.push({
        id: createUuid(),
        comments: [comment],
        status: 0
      });
    }
    return {
      ...verification,
      verificationOutput: {
        markdown: verificationOutput.markdown,
        threads: threads
      }
    };
  }
}

/**
 * TaskMigratorV28 - 任务迁移器 V28
 * 迁移版本：v27 -> v28
 * 主要变更：将 planConversations 的 llmInput 序列化到存储格式
 */
class TaskMigratorV28 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      planConversations: plan.planConversations.map(conv => this.migratePlanConversation(conv))
    };
  }

  static migratePlanConversation(conversation) {
    return {
      ...conversation,
      llmInput: conversation.llmInput ? StorageSerializer.toStorage(conversation.llmInput) : null
    };
  }
}

/**
 * TaskMigratorV29 - 任务迁移器 V29
 * 迁移版本：v28 -> v29
 * 主要变更：添加 isReferred 字段以标记重复任务
 */
class TaskMigratorV29 {
  static migrate(taskData) {
    let taskMap = new Map();
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown, taskMap))
    };
  }

  static migratePhaseBreakdown(breakdown, taskMap) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task, taskMap))
    };
  }

  static migrateTask(task, taskMap) {
    let isReferred = false;
    if (taskMap.has(task.id)) {
      isReferred = true;
    } else {
      taskMap.set(task.id, task);
    }
    return {
      ...task,
      isReferred: isReferred
    };
  }
}

/**
 * TaskMigratorV30 - 任务迁移器 V30
 * 迁移版本：v29 -> v30
 * 主要变更：添加 lastModifiedTimestamp 到评论
 */
class TaskMigratorV30 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      codeChanges: this.migrateCodeChanges(task.codeChanges)
    };
  }

  static migrateCodeChanges(codeChanges) {
    return {
      ...codeChanges,
      taskThreads: codeChanges.taskThreads.map(thread => this.migrateTaskThread(thread))
    };
  }

  static migrateTaskThread(thread) {
    return {
      ...thread,
      conversation: thread.conversation.map(pair => this.migrateConvPair(pair))
    };
  }

  static migrateConvPair(pair) {
    return {
      ...pair,
      traycerResponse: pair.traycerResponse ? this.migrateComment(pair.traycerResponse) : void 0
    };
  }

  static migrateComment(comment) {
    return {
      ...comment,
      lastModifiedTimestamp: 0
    };
  }
}

/**
 * TaskMigratorV31 - 任务迁移器 V31
 * 迁移版本：v30 -> v31
 * 主要变更：添加 reasoning 和 phaseSize 字段到阶段输出
 */
class TaskMigratorV31 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      prePhaseConversations: breakdown.prePhaseConversations.map(conv => this.migratePhaseConversation(conv))
    };
  }

  static migratePhaseConversation(conversation) {
    return {
      ...conversation,
      output: conversation.output ? this.migrateTaskOrchestratorOutput(conversation.output) : conversation.output
    };
  }

  static migrateTaskOrchestratorOutput(output) {
    return {
      ...output,
      phase: output.phase ? this.migratePhaseOutput(output.phase) : output.phase
    };
  }

  static migratePhaseOutput(phaseOutput) {
    return {
      ...phaseOutput,
      reasoning: phaseOutput.howDidIGetHere,
      phases: phaseOutput.phases.map(phase => this.migratePhase(phase, phaseOutput.howDidIGetHere))
    };
  }

  static migratePhase(phase, reasoning) {
    return {
      ...phase,
      reasoning: reasoning,
      phaseSize: PhaseSize.ISSUE
    };
  }
}

/**
 * TaskMigratorV32 - 任务迁移器 V32
 * 迁移版本：v7 -> v8
 * 主要变更：添加 attachmentSummaries 和 referredAttachments 字段
 */
class TaskMigratorV32 {
  static migrate(taskData) {
    return {
      ...taskData,
      tasks: taskData.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan)),
      attachmentSummaries: []
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      generatedPlan: plan.generatedPlan ? {
        ...plan.generatedPlan,
        fileChanges: plan.generatedPlan?.fileChanges?.map(fc => ({
          ...fc,
          referredAttachments: []
        })) ?? []
      } : void 0,
      userModifiedPlan: plan.userModifiedPlan ? {
        ...plan.userModifiedPlan,
        fileChanges: plan.userModifiedPlan?.fileChanges?.map(fc => ({
          ...fc,
          referredAttachments: []
        })) ?? []
      } : void 0
    };
  }
}

/**
 * TaskMigratorV33 - 任务迁移器 V33
 * 迁移版本：v8 -> v9
 * 主要变更：将计划结构改为 implementationPlan 包装
 */
class TaskMigratorV33 {
  static migrate(taskData) {
    return {
      ...taskData,
      tasks: taskData.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan)),
      attachmentSummaries: []
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      generatedPlan: plan.generatedPlan ? {
        implementationPlan: plan.generatedPlan
      } : void 0,
      userModifiedPlan: plan.userModifiedPlan ? {
        implementationPlan: plan.userModifiedPlan
      } : void 0
    };
  }
}

/**
 * TaskMigratorV34 - 任务迁移器 V34
 * 迁移版本：v9 -> v10
 * 主要变更：添加 agentMode 字段（此版本）
 */
class TaskMigratorV34 {
  static migrate(taskData) {
    return {
      ...taskData,
      tasks: taskData.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      agentMode: AgentMode.SINGLE_AGENT
    };
  }
}

/**
 * TaskMigratorV35 - 任务迁移器 V35
 * 迁移版本：v38 -> v39
 * 主要变更：将路径从 V2 格式迁移到 V3 格式
 */
class TaskMigratorV35 {
  static migrate(taskData) {
    return {
      ...taskData,
      workspaces: this.migrateWorkspaces(taskData.workspaces),
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migrateWorkspaces(workspaces) {
    return {
      workspaceFile: workspaces.workspaceFile ? this.migratePathV2ToV3(workspaces.workspaceFile) : void 0,
      workspaceFolders: workspaces.workspaceFolders.map(folder => this.migratePathV2ToV3(folder))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task)),
      prePhaseConversations: breakdown.prePhaseConversations.map(conv => this.migratePhaseConversation(conv))
    };
  }

  static migratePhaseConversation(conversation) {
    return {
      ...conversation,
      output: conversation.output ? this.migrateTaskOrchestratorOutput(conversation.output) : conversation.output
    };
  }

  static migrateTaskOrchestratorOutput(output) {
    return {
      ...output,
      phase: output.phase ? this.migratePhaseOutput(output.phase) : output.phase
    };
  }

  static migratePhaseOutput(phaseOutput) {
    return {
      ...phaseOutput,
      phases: phaseOutput.phases.map(phase => this.migratePhase(phase))
    };
  }

  static migratePhase(phase) {
    return {
      ...phase,
      tasks: phase.tasks.map(task => this.migratePhaseTask(task))
    };
  }

  static migratePhaseTask(task) {
    return {
      ...task,
      fileSummaries: task.fileSummaries?.map(fs => this.migrateFileSummary(fs)) ?? []
    };
  }

  static migrateFileSummary(fileSummary) {
    return {
      ...fileSummary,
      path: this.migratePathV2ToV3(fileSummary.path)
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      fileSummaries: task.fileSummaries?.map(fs => this.migrateFileSummary(fs)) ?? [],
      attachmentSummaries: task.attachmentSummaries?.map(as => this.migrateAttachmentSummary(as)) ?? [],
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migrateAttachmentSummary(attachmentSummary) {
    return {
      ...attachmentSummary,
      attachment: attachmentSummary.attachment ? this.migrateAttachment(attachmentSummary.attachment) : attachmentSummary.attachment
    };
  }

  static migrateAttachment(attachment) {
    if (attachment.fileAttachment) {
      return {
        ...attachment,
        fileAttachment: this.migrateFileAttachment(attachment.fileAttachment)
      };
    }
    return attachment;
  }

  static migrateFileAttachment(fileAttachment) {
    return {
      ...fileAttachment,
      path: this.migratePathV2ToV3(fileAttachment.path)
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      generatedPlan: plan.generatedPlan ? this.migrateAllPlanOutput(plan.generatedPlan) : null,
      planConversations: plan.planConversations.map(conv => this.migratePlanConversation(conv))
    };
  }

  static migratePlanConversation(conversation) {
    return {
      ...conversation,
      plan: conversation.plan ? this.migrateAllPlanOutput(conversation.plan) : null
    };
  }

  static migrateAllPlanOutput(output) {
    return {
      implementationPlan: output.implementationPlan ? this.migrateImplementationPlan(output.implementationPlan) : null,
      reviewOutput: output.reviewOutput
    };
  }

  static migrateImplementationPlan(plan) {
    return {
      ...plan,
      fileChanges: plan.fileChanges?.map(fc => this.migrateFileChange(fc)) ?? []
    };
  }

  static migrateFileChange(fileChange) {
    return {
      ...fileChange,
      path: fileChange.path ? this.migratePathV2ToV3(fileChange.path) : fileChange.path,
      newPath: fileChange.newPath ? this.migratePathV2ToV3(fileChange.newPath) : fileChange.newPath,
      referredFiles: fileChange.referredFiles?.map(rf => this.migratePathV2ToV3(rf)) ?? [],
      referredAttachments: fileChange.referredAttachments?.map(ra => this.migrateReferredAttachment(ra)) ?? []
    };
  }

  static migrateReferredAttachment(attachment) {
    if (attachment.fileAttachment) {
      return {
        ...attachment,
        fileAttachment: {
          ...attachment.fileAttachment,
          path: this.migratePathV2ToV3(attachment.fileAttachment.path)
        }
      };
    }
    return attachment;
  }

  static migratePathV2ToV3(pathV2) {
    return {
      absolutePath: pathV2.workspacePath ? 
        (pathV2.workspacePath + (pathV2.relPath ? '/' + pathV2.relPath : '')) : 
        (pathV2.relPath || ''),
      isDirectory: pathV2.isDirectory ?? false
    };
  }
}

/**
 * TaskMigratorV36 - 任务迁移器 V36
 * 迁移版本：v39 -> v40
 * 主要变更：将 implementationPlan.summary 改为 aiGeneratedSummary
 */
class TaskMigratorV36 {
  static migrate(taskData) {
    return {
      ...taskData,
      phaseBreakdowns: taskData.phaseBreakdowns.map(breakdown => this.migratePhaseBreakdown(breakdown))
    };
  }

  static migratePhaseBreakdown(breakdown) {
    return {
      ...breakdown,
      tasks: breakdown.tasks.map(task => this.migrateTask(task))
    };
  }

  static migrateTask(task) {
    return {
      ...task,
      plans: task.plans.map(plan => this.migratePlan(plan))
    };
  }

  static migratePlan(plan) {
    return {
      ...plan,
      planConversations: plan.planConversations.map(conv => this.migratePlanConversation(conv)),
      generatedPlan: plan.generatedPlan ? this.migrateAllPlanOutput(plan.generatedPlan) : null
    };
  }

  static migratePlanConversation(conversation) {
    return {
      ...conversation,
      plan: conversation.plan ? this.migrateAllPlanOutput(conversation.plan) : null
    };
  }

  static migrateAllPlanOutput(output) {
    return {
      implementationPlan: output.implementationPlan ? this.migrateImplementationPlan(output.implementationPlan) : null,
      reviewOutput: output.reviewOutput ? this.migrateReviewOutput(output.reviewOutput) : null
    };
  }

  static migrateImplementationPlan(plan) {
    let { summary, ...rest } = plan;
    return {
      ...rest,
      aiGeneratedSummary: summary
    };
  }

  static migrateReviewOutput(reviewOutput) {
    return {
      ...reviewOutput,
      aiGeneratedSummary: void 0
    };
  }
}

// CommonJS 导出
module.exports = {
  // 枚举
  TaskStepStatus,
  PlanArtifactType,
  CommentSeverity,
  AgentMode,
  PhaseSize,
  FileOperation,
  
  // 辅助函数
  setCreateUuid,
  createTextDocNode,
  convertQueryToDocNode,
  formatPlanStepToMarkdown,
  getActiveWorkspacePath,
  
  // 迁移器类
  WorkspaceMigrator,
  StorageSerializer,
  TaskMigratorV0,
  TaskMigratorV1,
  TaskMigratorV2,
  TaskMigratorV3,
  TaskMigratorV4,
  TaskMigratorV5,
  TaskMigratorV6,
  TaskMigratorV7,
  TaskMigratorV8,
  TaskMigratorV9,
  TaskMigratorV10,
  TaskMigratorV11,
  TaskMigratorV12,
  TaskMigratorV13,
  TaskMigratorV14,
  TaskMigratorV15,
  TaskMigratorV16,
  TaskMigratorV17,
  TaskMigratorV18,
  TaskMigratorV19,
  TaskMigratorV20,
  TaskMigratorV21,
  TaskMigratorV22,
  TaskMigratorV23,
  TaskMigratorV24,
  TaskMigratorV25,
  TaskMigratorV26,
  TaskMigratorV27,
  TaskMigratorV28,
  TaskMigratorV29,
  TaskMigratorV30,
  TaskMigratorV31,
  TaskMigratorV32,
  TaskMigratorV33,
  TaskMigratorV34,
  TaskMigratorV35,
  TaskMigratorV36
};

