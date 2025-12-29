const {
  PhaseSize,
  CommentSeverity
} = require("./modules/task_migrators.js");
const vscode_module = require("vscode");

// 内部声明的变量
var $c = 10;
var tv = 20;

// 使用导入的变量
console.log(PhaseSize);
console.log(CommentSeverity);

// 使用内部变量
console.log($c);
console.log(tv);

// 自赋值语句（模拟原问题）- 这行会导致重复声明错误
// var PhaseSize = PhaseSize;