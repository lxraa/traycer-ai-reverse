'use strict';

// 已存在的变量
const TaskOrchestrator = require('./task-orchestrator');
const PlanConversationHandler = require('./plan-handler');

// 需要重命名的变量
const TaskOrchestrator_1 = 'some value';
const PlanConversationHandler_1 = 'another value';
const processTask_1 = 'third value';

// 使用这些变量
function processTask() {
  console.log(TaskOrchestrator_1);
  console.log(PlanConversationHandler_1);
  console.log(processTask_1);
  const orchestrator = new TaskOrchestrator();
  const handler = new PlanConversationHandler();
  return {
    orchestrator,
    handler
  };
}
module.exports = {
  processTask
};