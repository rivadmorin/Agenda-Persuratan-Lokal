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
## 2026-07-05 - Fix Settings Save Dead Click and State Desync
**Bug:** Clicking "Simpan Perubahan" in the Settings panel immediately showed a "Pengaturan sistem berhasil disimpan" notification, even if the backend save operation failed or was delayed. The button did not show any loading state, leading to potential double-clicks or "dead click" experiences if the network was slow.
**Learning:** `handleSaveConfig` in `App.tsx` handled errors by displaying a modal, but did not return a value indicating success/failure, causing the synchronous `handleSave` in `Settings.tsx` to assume success immediately. Component interactions that trigger backend mutations must await the async process and use local loading state (`isSaving`) to give visual feedback and guard against duplicate requests.
**Resolution:** Updated `handleSaveConfig` in `App.tsx` to return a boolean indicating success. Refactored `handleSave` in `Settings.tsx` to be asynchronous, use a `try/finally` block to manage an `isSaving` state, and only show the success notification if the return value is `true`. Added a disabled state with `md-circular-progress` to the save button.
