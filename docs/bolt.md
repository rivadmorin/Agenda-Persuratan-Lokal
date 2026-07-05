# Bolt Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]

## 2026-07-05 - [Optimistic UI Updates for User Management]
**Learning:** In local applications, even minor network latency during local API calls feels sluggish. Waiting for requests to resolve before updating the state ruins perceived performance.
**Action:** Always implement Optimistic Updates for simple CRUD operations—update the React state immediately, and only rollback if the fetch promise explicitly rejects.
