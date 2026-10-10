<p align="center">
  <img src="./assets/icon.png" alt="PgQnA Browser Extension Icon" width="200" height="200" />
</p>

# PgQnA — Page Questions and Answers

**PgQnA** is a browser extension that uses **Jev AI Classifier** to answer questions based on the content of the current webpage. Questions can use TypeSafe's Choice, Score, and Noul primitives to select from options, rate an ordered scale, or judge a yes/no statement.

## 🛠️ Tech Stack

- [WXT](https://wxt.dev/) — Browser extension framework
- [React](https://react.dev/) — UI development
- [TypeScript](https://www.typescriptlang.org/) — Type-safe development
- **Jev** — TypeSafe AI's System-1 AI model for question classification and answering

## 🔧 Tools

- [Chrome Extension Icon Generator](https://alexleybourne.github.io/chrome-extension-icon-generator/) — Generate icons in the required browser extension sizes.

## Extension Workflow

### 1. Installation and Initial Setup

1. The user installs the browser extension.
2. When the user clicks the extension icon:
   - If the extension has not been configured, open the **Setup Page** in a new browser tab.
   - If the setup is complete, display the appropriate popup based on the current website.

### 2. Setup Page

The Setup Page contains two tabs: **Setup** and **QnA**.

#### 2.1 Setup Tab

- Allow the user to enter and save their **Jev API Key**.
- Store the API key and website QnA configurations in `chrome.storage.local`.
- Restrict local storage access to trusted extension contexts with
  `chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })`,
  preventing webpage content scripts from reading the API key. This does not
  encrypt the key against access to the browser profile or other extension pages.
- Validate the API key if the Jev API supports validation.
- Persist the configuration so the user does not need to enter the key every time.

#### 2.2 QnA Tab

Display a list of configured website domains. Selecting a domain opens its associated QnA configuration.

Each domain's QnA configuration page should include an **Add New** button for creating a new QnA entry.

##### Adding a QnA Configuration

Each entry should support the following fields:

- **Website Domain (required):** The domain for which the QnA configuration applies (e.g., `linkedin.com`).
- **Specific CSS Selector (optional):** A CSS selector identifying the portion of the page to extract. If provided, only the matching element's content will be used. If omitted, the extension will use the entire page's content, which may increase token usage and processing costs.
- **Questions (required):** Each question has an ID, a `type`, and `instructions`. Choice questions use a `criteria` map of option labels, Score questions use an ordered `criteria` list of at least two levels, and Noul questions may use `criteria.true` and `criteria.false` to describe yes and no. The saved `questions` object is keyed by question ID and uses the TypeSafe question shape:

  ```json
  {
    "candidate_role": {
      "type": "choice",
      "instructions": "Which role best matches the page?",
      "criteria": {
        "engineer": null,
        "designer": null,
        "other": null
      }
    }
  }
  ```

  See the [TypeSafe primitives documentation](https://docs.typesafe.ai/primitives) for the question types and criteria format.

Users should be able to save and manage QnA configurations for each domain.

### 3. Extension Popup Behavior

When the user clicks the extension icon, the extension checks the current website's domain and determines which popup to display.

#### 3.1 Website Has No QnA Configuration

If the current domain does not have a matching QnA configuration, display a small popup indicating that no questions are configured for the current website.

#### 3.2 Website Has a QnA Configuration

If a matching configuration exists:

1. Retrieve the configured CSS selector, if any.
2. Extract the current page's content:
   - If a selector is configured, extract content from the matching element.
   - Otherwise, extract content from the entire page.
   - For debugging, the extracted content is logged in the extension popup's
     developer console.
3. Use the **TypeSafe SDK** to invoke **Jev AI** with the extracted page content and the configured questions and answer options.
4. Display the results in the extension popup.

The popup should clearly associate each answer with its corresponding question and present the results in a readable format.
Yes/no answers are colored green or red by polarity; choices without an
unambiguous yes/no label and intermediate scores use a neutral style.

### 3.3 Page Access and Data Transmission

PgQnA requests access to the active tab only when the extension is clicked.
It reads the configured selector's text, or the full visible page text if no
selector is set, and sends that text and the configured questions to
`https://api.typesafe.ai` using the saved Jev API key. The API key stays in
trusted extension storage and is not exposed to the page content script. The
extracted text is also logged in the extension popup console.

### 4. Key Requirements

- Persist the API key and QnA configurations across browser sessions.
- Match website configurations against the current domain.
- Support multiple website domains, each with its own QnA configurations.
- Treat the CSS selector as optional and fall back to full-page content extraction when it is not provided.
- Follow the [TypeSafe primitives documentation](https://docs.typesafe.ai/primitives) for question and criteria formatting.
- Handle missing configurations, invalid API keys, content extraction failures, and API errors gracefully.
- Provide clear loading, success, and error states in the extension popup.

## How to see the console logs for extension popup

Read skill `wxt-browser-extensions`

I’ll check the project’s extension entrypoints so I can point you to the right DevTools console for the logs from this file.

Ran terminal command: graft ask "Where does entrypoints/setup/App.tsx run, and how can I view its console logs in the extension?" --source

Ran terminal command: graft ask "Which console.log, console.error, or console.warn calls are in entrypoints/setup/App.tsx, and where is the setup page loaded?" --source --full

Ran terminal command: graft grep "console."

In this codebase, the page-content debug log is in the **popup**, not `entrypoints/setup/App.tsx`: `entrypoints/popup/App.tsx` logs `[PgQnA] Extracted page content`.

To view it in Chrome:

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Open PgQnA’s popup, then click **Inspect popup** on the extension’s card.
3. In the DevTools **Console**, reproduce the action and look for `[PgQnA]`.

The setup page runs in its own tab, so to see logs from that page, open its tab and open DevTools for that tab (right-click the page and choose **Inspect**, or press **⌘⌥I** on Mac). Console output is separate for each extension context; the website’s own DevTools console won’t show logs from the popup. Note that the setup component itself currently has no `console.*` calls.
