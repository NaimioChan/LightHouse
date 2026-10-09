# 领域文档

工程技能探索这个仓库时，怎么消费它的领域文档。

## 探索前先读

- 根目录的 **`GLOSSARY.md`**。本仓库是单上下文，没有 `GLOSSARY-MAP.md`。
- **`docs/adr/`**：读跟你接下来要动的地方相关的 ADR。

文件不存在就**静默跳过**。不要指出缺了什么，也不要主动建议先把它们建起来。`/domain-modeling` 技能（从 `/grill-with-docs`、`/improve-codebase-architecture` 进来）会在术语或决策真正定下来时惰性创建。

## 目录形状（单上下文）

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-....md
│   └── 0002-....md
└── …
```

本仓库已有的编号文档（`docs/01-merge-architecture.md`、`docs/04-mobile-layout.md` 等）是设计说明，不是 ADR。ADR 放 `docs/adr/`，一条记一个决策。

## 用词表里的词

输出里点到领域概念时（issue 标题、重构提议、假设、测试名），用 `GLOSSARY.md` 里的说法，别漂到自造的同义词。

要用的概念词表里没有，是个信号：要么你在发明这个项目不用的词（重新想），要么真有缺口（记下来给 `/domain-modeling`）。

## ADR 冲突要显式提

输出跟已有 ADR 冲突时，明说，别偷偷覆盖：

> 与 ADR-0007（event-sourced orders）冲突，但值得重开，因为……
