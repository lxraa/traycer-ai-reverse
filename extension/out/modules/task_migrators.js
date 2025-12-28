'use strict';

/**
 * Task 数据迁移器模块
 * 包含 WorkspaceMigrator 和各版本 TaskMigrator (V10-V15)
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

// CommonJS 导出
module.exports = {
  WorkspaceMigrator,
  TaskMigratorV10,
  TaskMigratorV11,
  TaskMigratorV12,
  TaskMigratorV13,
  TaskMigratorV14,
  TaskMigratorV15
};

