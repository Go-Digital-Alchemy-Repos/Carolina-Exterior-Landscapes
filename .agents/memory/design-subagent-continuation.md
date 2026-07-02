---
name: DESIGN subagent budget exhaustion
description: What to do when a DESIGN subagent stops partway with "effort level restricted"
---

DESIGN subagents can stop partway through large multi-page redesigns with a "my effort level has been restricted, please continue" message. Once its session completes, `messageSubagentAndGetResponse` fails with "Subagent not found" — the session cannot be resumed.

**Why:** Observed during a site-wide redesign: first subagent only finished theme tokens before its budget ran out; messaging it afterward failed.

**How to apply:** Check `git diff --stat` to see what the partial run completed, then launch a FRESH subagent whose brief explicitly says what is already done ("build on those tokens, don't redo them") and lists the remaining items in priority order. Sequential handoff keeps the design direction coherent; avoid parallel subagents on shared files like index.css.
