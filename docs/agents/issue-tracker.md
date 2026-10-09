# Issue tracker: GitHub

本仓库的 issue 与 spec 都是 GitHub Issues，仓库 `NaimioChan/LightHouse`。所有操作走 `gh` CLI。

## 约定

- **建 issue**：`gh issue create --title "..." --body "..."`。多行正文用 heredoc。
- **读 issue**：`gh issue view <number> --json number,title,body,labels,comments`。
- **列 issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，配 `--label` / `--state` 过滤。
- **挂成子 issue**：`gh issue create --parent <parent> ...`，或事后 `gh issue edit <parent> --add-sub-issue <child>`（gh 2.94+）。旧版 gh：`gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`（数据库 id，见下面的「阻塞」）。不支持子 issue 时，在子 issue 正文顶部写 `Part of #<parent>`。
- **评论**：`gh issue comment <number> --body "..."`。
- **加/去标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`。
- **关闭**：`gh issue close <number> --comment "..."`。

仓库从 `git remote -v` 推断；在克隆里跑 `gh` 会自动认。

## 本机注意（Windows）

- GitHub 直连被墙：每条 `gh` 命令前加 `HTTPS_PROXY=http://127.0.0.1:7897`。
- `gh.exe` 在 `C:\Program Files\GitHub CLI\`，不在 bash 默认 PATH 里：先 `export PATH="$PATH:/c/Program Files/GitHub CLI"`，或者写全路径。
- 凭据：已用 `gh auth login --hostname github.com --git-protocol https --web` 登录（2026-10-09）。token 存在 Windows 凭据管理器里，`gh auth status` 的 backend 显示 `keyring`，scope 是 `gist, read:org, repo, workflow`；不需要再设 `GH_TOKEN`。注意 gh 在 Windows 上只读 `%APPDATA%\GitHub CLI\`，写 `~/.config/gh/hosts.yml` 不生效。若某次命令报 401，先看 `gh auth status`：backend 退回 `hosts.yml` 说明凭据被写成了文件里的明文，重跑一次上面的登录即可。

## 与 docs/agent-log.md 的分工

issue 是长期工作面：谁要做什么、做到哪一步。`docs/agent-log.md` 是每个 session 的交接记录：这次改了哪些文件、验证结果、遗留什么，Hermes 与 OpenCode 共用。两者都要写，不互相替代。

## Pull requests 作为 triage 面

**PRs as a request surface: no.**（本仓库不把外部 PR 当功能请求。要改就把这一行改成 `yes`，`/triage` 读的是这里。）

改成 `yes` 后，PR 与 issue 走同一套标签与状态，用 `gh pr` 的对应命令：

- **读 PR**：`gh pr view <number> --comments`；diff 用 `gh pr diff <number>`。
- **列待 triage 的外部 PR**：`gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`。
- **评论 / 打标签 / 关**：`gh pr comment`、`gh pr edit --add-label` / `--remove-label`、`gh pr close`。

GitHub 的 issue 与 PR 共用一个编号空间，裸的 `#42` 两种都可能：先 `gh pr view 42`，不行再 `gh issue view 42`。

## 当技能说「publish to the issue tracker」

建一个 GitHub issue。

## 当技能说「fetch the relevant ticket」

按上面的**读 issue**读。

## Wayfinding 操作

`/wayfinder` 用。**map** 是一个 issue，**子票**是它的子 issue。

- **Map**：一个带 `wayfinder:map` 标签的 issue，正文装 Notes / Decisions-so-far / Fog。`gh issue create --label wayfinder:map`。
- **子票**：作为 GitHub 子 issue 挂到 map 上（见上面的**挂成子 issue**）。没开子 issue 的地方，把子票加进 map 正文的任务清单，并在子票正文顶部写 `Part of #<map>`。标签 `wayfinder:<type>`（`research` / `prototype` / `grilling` / `task`）。认领后 assign 给动手的人。
- **阻塞**：用 GitHub 原生的 issue dependencies，这是 UI 里看得见的正规表示。加边：`gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`，其中 `<blocker-db-id>` 是阻塞者的数字**数据库 id**（`gh api repos/<owner>/<repo>/issues/<n> --jq .id`，不是 `#number`，也不是 `node_id`）。GitHub 的 `issue_dependencies_summary.blocked_by` 只算还开着的阻塞者，是真正的门。该功能不可用时退回在子票正文顶部写 `Blocked by: #<n>, #<n>`。所有阻塞者都关了，票才算解锁。
- **Frontier 查询**：列 map 的 open 子票（`gh issue list --state open`，范围是 map 的子 issue / 任务清单），去掉还有 open 阻塞者的（`issue_dependencies_summary.blocked_by > 0`，或 `Blocked by` 行里躺着 open 的）以及已有 assignee 的；map 顺序里第一个胜出。
- **认领**：`gh issue edit <n> --add-assignee @me`，这是这次 session 的第一次写操作。
- **结票**：`gh issue comment <n> --body "<答案>"`，再 `gh issue close <n>`，然后把上下文指针（要点 + 链接）追加到 map 的 Decisions-so-far。
