# 验证检查清单

## 测试执行前

- [ ] 开发服务器已启动且 MCP 可连接（调用 `get_project_metadata`）
- [ ] 测试计划已覆盖 Story 所有 AC
- [ ] Playwright 浏览器实例可用

## 测试执行中（每条用例）

- [ ] 导航到目标路由
- [ ] 等待页面加载完成（hydration）
- [ ] 执行交互操作
- [ ] 截图记录关键状态
- [ ] 收集 console 错误

## 测试执行后

- [ ] 调用 `get_errors` 检查 Next.js 编译/运行时错误
- [ ] 调用 `browser_console_messages` (level: "error") 收集前端错误
- [ ] 所有测试用例结果已记录（PASS/FAIL + 证据）
- [ ] 待修复问题清单已生成

## 循环退出条件

所有以下条件必须满足：
- [ ] 所有 Happy Path 用例 PASS
- [ ] 所有 AC 对应的验证用例 PASS
- [ ] 无编译错误
- [ ] 无前端运行时错误（console.error 级别）

> 边缘情况用例可以有 FAIL，但必须记录在案并在 Story 文件中注明 "已知限制"。
