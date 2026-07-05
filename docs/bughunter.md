# Bug Hunter Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]

## [$(date +"%Y-%m-%d")] UI Responsiveness, Dark Mode, and Deletion Fixes
**Bug:**
1. Dark Mode toggle in Sidebar was changing local state but not applying the `dark` class to the HTML document.
2. Clicking "Hapus PDF" inside `MailDrawer` during Edit mode only cleared the local preview state and didn't instruct the backend to delete the existing PDF file.
3. Clicking "Edit" or "View" on an item with a heavy PDF caused the application to freeze/jank during the slide-in animation of `MailDrawer` because the `iframe` was rendering synchronously.

**Learning:**
1. React's state management needs side effects (`useEffect`) to interact with the DOM (like `document.documentElement.classList.add('dark')`) and `localStorage` when handling application-wide concepts like themes. Tailwind v4 syntax requires `@custom-variant dark (&:is(.dark *));` to implement class-based dark mode effectively.
2. Form state needs to explicitly track when pre-existing server resources are intended to be deleted by the user, sending flags like `deletePdf` to the PUT endpoint instead of just omitting the file from the payload.
3. Expensive DOM elements like `<iframe src="data:application/pdf...">` should never be rendered during CSS transitions or framer-motion animations. They will block the main thread and drop frames. When using `setTimeout` to delay renders based on boolean state conditions, a `clearTimeout` cleanup function must be provided to prevent memory leaks or race conditions if the component closes before the timeout completes.

**Resolution:**
1. Added a `useEffect` hook in `App.tsx` that synchronizes `darkMode` state to `document.documentElement` (`.dark` class) and `localStorage`. Updated `src/index.css` to use Tailwind 4's `@custom-variant dark`.
2. Added `deletedPdf` state in `MailDrawer.tsx` that toggles true when "Hapus PDF" is clicked, and appended `deletePdf: deletedPdf` to the `onSave` payload to signal the backend.
3. Implemented a deferred render using `isAnimationComplete` state in `MailDrawer.tsx`. It waits 400ms (the duration of `ease-premium`) before rendering the heavy PDF `iframe`, showing a Material Circular Progress spinner in the meantime, with a strict `clearTimeout` applied to prevent race conditions during rapid state changes.
## 2025-03-06 - Fixing Form Deadlocks & MailTable Disabled Buttons
**Learning:** The `isSaving` state in form components (like `MailDrawer` and `UserDialog`) must use a `try...finally` block alongside an `async` `onSave` to guarantee that the loading state is reverted even if network issues or server errors occur. The `disabled` attribute on Material Web Custom Elements (`<md-icon-button>`) should be dynamically rendered based on the required conditions without entirely replacing the DOM element when handling interactions to ensure robust re-renderings.
**Action:** Always wrap form submission side effects in `try...catch/finally` blocks when tracking processing states and prefer conditional DOM properties over conditional element structures to handle dynamic states.

## 2025-02-28 - md-dialog React Re-render Bug
**Bug:**
When using `<md-dialog>` in React, opening it the first time works, and closing it by updating state (e.g., `setEditingColumn(null)`) visually hides the dialog because React strips the `open` prop. However, clicking edit again (setting `setEditingColumn(col)`) fails to re-open the dialog. The internal state of the custom element `<md-dialog>` becomes out of sync with React's render cycle when the `close()` method isn't explicitly called.

**Learning:**
React 19 passes the `open` prop successfully, but Material Web's `<md-dialog>` expects to be closed natively or unmounted. If it stays in the DOM without the `open` attribute but wasn't properly closed using its API, setting `open={true}` again might not trigger its internal opening logic correctly.
Alternatively, the `onClose` synthetic event in React does not properly handle the custom `<md-dialog>` close event loop, leaving the React state out of sync.

**Action:**
Wrap `<md-dialog>` elements with a conditional render block (e.g., `{editingColumn && <md-dialog ... />}`) when dealing with dynamic item editing. This forces React to unmount the custom element when closed and mount a fresh instance when opened again, entirely bypassing the custom element's broken internal state sync with React props.
