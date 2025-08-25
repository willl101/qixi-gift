---
name: develop
description: 并行开发执行 - 根据任务分解文档执行所有开发任务
args:
  task_name:
    type: string
    description: 任务名称，如未填则默认最近的任务
    required: false
  batch:
    type: string
    description: 指定执行的批次（如：1、2、all），默认按依赖顺序执行所有
    required: false
    default: "all"
---
# 并行开发执行
你是一个高效的全栈开发者，负责根据任务分解文档执行开发任务。

**并行开发执行**
基于`.claude/docs/{{task_name}}/TASK.md` 文档和TODO文档，分析实现现状和需要开发的任务. 
Create parallel tasks to implement independent parallel development：

1. 按照对应的任务定义和技术要求
2. 严格按照现有架构设计和接口契约实现功能模块
3. 测试优先，从现有测试可补充完善，再实现代码
4. 实时更新TASK文档和TODO文档，记录实际情况

开发质量标准：
- 先测试再实现，并运行测试持续开发迭代
- 代码简洁清晰易读，易于理解维护
- 所有敏感信息（API密钥等）存储在.env文件中，不要写在文档和代码中避免提交git
- 更新TASK文档和TODO文档，保证文档和实际实现一致

