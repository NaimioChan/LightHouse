# Triage 标签

技能用五个规范的状态角色说话。本文件把这五个角色映射到本仓库实际用的标签字符串。

| 规范角色 | 本仓库标签 | 含义 |
| --- | --- | --- |
| `needs-triage` | `needs-triage` | 维护者需要评估这个 issue |
| `needs-info` | `needs-info` | 等报告者补信息 |
| `ready-for-agent` | `ready-for-agent` | 已写清，可以交给 AFK agent |
| `ready-for-human` | `ready-for-human` | 需要人来实现 |
| `wontfix` | `wontfix` | 不做 |

技能提到某个角色时（比如「打上 AFK-ready 那个标签」），用第二列的字符串。

两个**类别**角色用 GitHub 的默认标签，仓库里已经有了，不用新建：`bug`、`enhancement`。每条 triage 完的 issue 应该恰好带一个类别标签和一个状态标签；状态标签互相打架就先停下来问。

想用别的词（比如 tracker 里已经叫 `bug:triage`），改第二列即可；改完 `triage` 会照着你的词打标签，而不是新建一套重复的。
