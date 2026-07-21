## 2023-10-27 - React Re-renders Optimization with React.memo

**Learning:** The `MailTable` component, which performs expensive sorting, filtering, and pagination on the main thread, was re-rendering on every small state change in `App.tsx` (like opening the sidebar). This happened because `App.tsx` passed inline functions (e.g. `onAdd={() => { ... }}`) as props to `MailTable`. In React, inline functions create new object references on every render, causing the child component to re-render even if the actual data hasn't changed.

**Action:**
1. Use `React.memo` to wrap large components (like `MailTable`) that have expensive rendering/filtering logic.
2. Use `useCallback` in the parent component to stabilize callback functions passed as props to memoized components. Always check if inline arrow functions in JSX props are causing unnecessary re-renders in performance-critical sections.
