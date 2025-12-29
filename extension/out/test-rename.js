// 测试文件：验证重命名脚本的行为

// 导入的变量（不应该被重命名）
const { PhaseSize, CommentSeverity, AgentMode } = require("./modules/task_migrators.js");

// 文件内部声明的变量（应该被重命名）
var $c = {
  SMALL: 0,
  MEDIUM: 1,
  LARGE: 2
};

var tv = {
  INFO: 0,
  WARNING: 1,
  ERROR: 2
};

// 使用导入的变量（不应该被重命名）
function useImported() {
  console.log(PhaseSize.ISSUE);
  console.log(CommentSeverity.INFO);
  console.log(AgentMode.MULTI_AGENT);
}

// 使用内部变量（应该被重命名）
function useInternal() {
  console.log($c.SMALL);
  console.log(tv.INFO);
}

// 引用导入变量的语句（不应该被重命名）
var myPhaseSize = PhaseSize;
var mySeverity = CommentSeverity;

// 引用内部变量的语句（应该被重命名）
var mySize = $c;
var myType = tv;

