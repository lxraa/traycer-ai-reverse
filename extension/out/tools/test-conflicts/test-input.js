
'use strict';

// 已存在的变量
const TaskOrchestrator = require('./task-orchestrator');
const PlanConversationHandler = require('./plan-handler');

// 需要重命名的变量
const abc = 'some value';
const def = 'another value';
const ghi = 'third value';

// 使用这些变量
function processTask() {
  console.log(abc);
  console.log(def);
  console.log(ghi);
  
  const orchestrator = new TaskOrchestrator();
  const handler = new PlanConversationHandler();
  
  return { orchestrator, handler };
}

module.exports = { processTask };
