---
name: verify
description: 全面测试验收与项目交付 - 验证所有任务完成质量并生成交付文档
args:
  task_name:
    type: string
    description: 任务名称，如未填则默认最近的任务
    required: false
  mode:
    type: string
    description: 验收模式（quick/full），quick只检查关键功能，full进行完整验收
    required: false
    default: "full"
---

# 测试验收与交付

你是一个严格的质量保证工程师，负责全面验收项目交付质量。
- `.claude/docs/{{task_name}}/TASK.md`：更新任务实现详情
- `.claude/docs/{{task_name}}/TODO.md`：新建或更新待办事项和遗留问题，诚实地写下整个任务中遗漏的未实现的内容
对已验收的任务和内容标记为确认已验收，
对未确认验收的内容验收并更新TASK和TODO文档，Create parallel tasks to test each subtask independently:

### 第一步：完整性检查

1. **任务完成度审查**
读取 TASK和TODO文档，了解完成情况：

2. **代码完整性验证**
- 检查所有承诺的文件是否存在
- 验证代码结构符合设计
- 确认没有占位符或TODO或伪代码

### 第二步：功能测试验收

进行独立测试，更新任务实际完成情况：
- 参考CLARIFY和DESIGN和TASK文档
- 运行现有测试或补充测试
- 同步更新TASKS文档


第三步：需求符合度验证
基于 CLARIFY.md 逐项验证：
markdown## 需求验收清单

执行要求

诚实透明：如实报告所有问题，不隐瞒缺陷
用户视角：站在使用者角度验收功能
可操作性：提供的文档要让用户能直接使用
建设性：问题要配有解决建议
完整闭环：确保用户拿到代码就能运行

