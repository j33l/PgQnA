<p align="center">
  <img src="./assets/icon.png" alt="PgQnA Browser Extension Icon" width="200" height="200" />
</p>

# PgQnA — Page Questions and Answers

**PgQnA** is a browser extension that uses **Jev AI Classifier** to answer questions based on the content of the current webpage. Users can ask questions and select from predefined answer options, making it easier to extract relevant information from web pages.

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
- Store the API key securely and make it available to the extension when needed.
- Validate the API key if the Jev API supports validation.
- Persist the configuration so the user does not need to enter the key every time.

#### 2.2 QnA Tab

Display a list of configured website domains. Selecting a domain opens its associated QnA configuration.

Each domain's QnA configuration page should include an **Add New** button for creating a new QnA entry.

##### Adding a QnA Configuration

Each entry should support the following fields:

- **Website Domain (required):** The domain for which the QnA configuration applies (e.g., `linkedin.com`).
- **Specific CSS Selector (optional):** A CSS selector identifying the portion of the page to extract. If provided, only the matching element's content will be used. If omitted, the extension will use the entire page's content, which may increase token usage and processing costs.
- **Questions and Answer Options (required):** Define the questions to be answered and their corresponding answer options, following the format and constraints specified in the Jev documentation.

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
3. Use the **TypeSafe SDK** to invoke **Jev AI** with the extracted page content and the configured questions and answer options.
4. Display the results in the extension popup.

The popup should clearly associate each answer with its corresponding question and present the results in a readable format.

### 4. Key Requirements

- Persist the API key and QnA configurations across browser sessions.
- Match website configurations against the current domain.
- Support multiple website domains, each with its own QnA configurations.
- Treat the CSS selector as optional and fall back to full-page content extraction when it is not provided.
- Follow the Jev documentation for question and answer-option formatting.
- Handle missing configurations, invalid API keys, content extraction failures, and API errors gracefully.
- Provide clear loading, success, and error states in the extension popup.
