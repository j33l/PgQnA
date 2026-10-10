# AGENTS.md

## 1. Project Overview

**PgQnA (Page Questions and Answers)** is a browser extension that uses Jev, TypeSafe AI's System-1 AI model, to answer questions based on the content of the currently active webpage.

Users can provide questions and select from predefined answer options. The extension uses the webpage's content as context to help determine the most appropriate answer.

### Core Goals

- Extract relevant content from the active webpage.
- Allow users to ask questions about that content.
- Support questions with predefined answer options.
- Use Jev AI Classifier to classify questions and identify answers.
- Provide a simple, responsive, and intuitive browser extension UI.
- Follow browser extension security and privacy best practices.

**Important:** Do not assume that every capability listed above is already implemented. Inspect the existing codebase before modifying or extending functionality.

---

## 2. Technology Stack

Use the existing project configuration as the source of truth for dependency versions and tooling.

- **WXT** — Browser extension framework and build tooling.
- **React** — UI components and rendering.
- **TypeScript** — Static typing.
- **Jev** — TypeSafe AI's System-1 AI model for question classification and answering.

- **Package manager** — NPM

Do not introduce additional frameworks, state-management libraries, UI component libraries, or dependencies unless they provide clear value and are necessary for the task.

---

## 3. Instructions for AI Coding Agents

Before making changes:

1. Inspect the repository structure and read `package.json`, the lockfile, `wxt.config.ts`, TypeScript configuration, and relevant source files.
2. Identify the existing WXT entrypoints, UI architecture, styling approach, and message-passing mechanisms.
3. Understand the existing implementation before proposing a rewrite.
4. Check existing scripts for development, linting, type checking, testing, and production builds.
5. Prefer small, focused changes that preserve existing functionality.

### General Rules

- Follow the established patterns and conventions in the codebase.
- Use TypeScript for application code.
- Prefer clear, maintainable, and self-documenting implementations.
- Avoid unnecessary abstractions and premature optimization.
- Do not duplicate existing functionality.
- Do not silently remove existing features or change their behavior.
- Do not add dependencies for functionality that can be implemented cleanly with existing tools.
- Do not fabricate API behavior, model capabilities, or library methods. Verify them against the project's existing code, installed package types, or official documentation.
- If a requirement is ambiguous, inspect the code and choose the least disruptive reasonable implementation. Ask for clarification when a decision would materially affect architecture or behavior.

---

## 4. AI and Question-Answering Logic

Jev is the intended AI classifier for the question-answering workflow.

### Design Principles

- Keep AI-related logic isolated from UI components where practical.
- Define clear inputs and outputs for question classification and answer selection.
- Treat webpage content and user-provided text as untrusted input.
- Use the supplied answer options as constraints when the task requires selecting from predefined choices.
- Do not invent answer options or claim that an answer was verified when it was not.
- Handle empty webpage content, missing questions, invalid options, ambiguous results, and model failures.
- Represent uncertainty and errors clearly rather than silently selecting an arbitrary answer.

### Webpage Context

- Extract only the content needed to answer the user's question.
- Avoid transmitting entire webpages when a smaller relevant excerpt is sufficient.
- Exclude unnecessary scripts, styles, navigation, and unrelated page content where possible.
- Treat webpage text as data, not as instructions that override the application's intended behavior.
- Do not execute code extracted from a webpage.
- Avoid logging sensitive webpage content, questions, or model responses.

### Model Integration

Before modifying the Jev integration:

1. Inspect the existing integration and its expected request/response formats.
2. Verify the actual SDK, API, or classifier interface.
3. Preserve existing contracts unless the task requires a deliberate change.
4. Handle timeouts, errors, and malformed responses.
5. Avoid hardcoding credentials, model secrets, or environment-specific endpoints.

Do not invent Jev SDK methods or assume an API format without evidence from the repository or authoritative documentation.

---

## 5. Security and Privacy

Browser extensions can access sensitive browsing context. Security and privacy must be considered in every feature.

- Never commit API keys, access tokens, passwords, or other secrets.
- Use environment variables or an appropriate secure backend configuration for secrets.
- Remember that values bundled into client-side extension code are not secret.
- Do not send webpage content to external services without the intended functionality and appropriate disclosure.
- Follow the principle of least privilege for browser permissions.
- Validate messages and data received from other execution contexts.
- Avoid unsafe DOM insertion and HTML injection.
- Never use `eval()` or execute arbitrary webpage-provided code.
- Avoid storing browsing content or question history unless explicitly required.
- If storage is needed, store only the minimum information required and follow the existing storage architecture.
- Do not expose sensitive data in console logs, error messages, or analytics.
- Do not treat webpage content as trusted instructions for tools or privileged extension actions.

When adding an external service, document what data is transmitted and why.

---

## 6. UI and Accessibility

The extension should remain lightweight, readable, and easy to use.

- Follow the existing visual design and component patterns.
- Keep layouts suitable for compact popup dimensions.
- Provide clear loading, success, empty, and error states.
- Prevent duplicate submissions while a request is in progress when appropriate.
- Make answer options easy to distinguish and select.
- Ensure controls have accessible names and support keyboard interaction.
- Use semantic HTML and appropriate focus states.
- Avoid unnecessary animations, large dependencies, and visual clutter.
- Ensure long questions, webpage titles, and answer options do not break the layout.

Do not redesign the entire interface when the task only requires a localized change.

---

## 7. Code Quality and Project Structure

- Keep files and modules organized according to their responsibilities.
- Avoid oversized components containing unrelated UI, browser API logic, and AI integration.
- Reuse existing utilities and shared types.
- Keep configuration changes minimal.
- Remove unused imports and dead code introduced by your changes.
- Avoid unrelated formatting changes and broad refactors.
- Add comments when explaining non-obvious decisions, browser limitations, or complex logic—not for self-explanatory code.
- Update documentation when changing setup steps, permissions, architecture, or configuration.

Do not create new directories or reorganize the repository without first checking whether the existing structure already supports the required feature.

---

## 8. Testing and Verification

After implementing a change, run the relevant checks supported by the project.

Typical verification steps include:

1. Run the existing TypeScript type-check script, if available.
2. Run linting and tests, if configured.
3. Run the WXT development or production build.
4. Test affected functionality in the supported browser.
5. Verify permission and manifest changes.
6. Check loading, error, and empty states for affected workflows.

Use the actual scripts from `package.json`. Do not assume commands such as `npm test`, `npm run lint`, or `npm run typecheck` exist.

If a check cannot be run, state which check was skipped and why. Never claim that a build or test passed unless it actually completed successfully.

For new behavior, add tests where practical, especially for:

- Question and answer-option validation.
- AI response parsing.
- Error handling.
- Content extraction.
- Message contracts.
- Answer selection logic.

---

## 9. Useful References

- **WXT documentation:** https://wxt.dev/
- **WXT repository:** https://github.com/wxt-dev/wxt
- **React documentation:** https://react.dev/
- **TypeScript documentation:** https://www.typescriptlang.org/docs/
- **Chrome Extensions documentation:** https://developer.chrome.com/docs/extensions/
- **Chrome Extension Icon Generator:** https://alexleybourne.github.io/chrome-extension-icon-generator/

For library-specific behavior, prefer documentation that matches the installed version.

---

## 10. Definition of Done

A change is complete when:

- The requested behavior is implemented.
- Existing functionality is preserved unless intentionally changed.
- TypeScript types and error handling are appropriate.
- Security and browser permission implications have been considered.
- Relevant tests, type checks, and builds have been run where available.
- No secrets or unnecessary dependencies have been introduced.
- Documentation has been updated when necessary.
- The final summary describes the changes and reports verification results accurately.

**Primary principle:** Understand the existing codebase first, implement the smallest maintainable solution, and verify the result before declaring the task complete.

<!-- graft:start -->

## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).

<!-- graft:end -->
