import { useState, type FormEvent } from "react";

interface ApiKeySectionProps {
  apiKey: string;
  inputTokenRatePerMillion: string;
  isSaving: boolean;
  isLoaded: boolean;
  onApiKeyChange: (value: string) => void;
  onInputTokenRatePerMillionChange: (value: string) => void;
  onSave: () => Promise<void>;
  hasApiKey: boolean;
}

export function ApiKeySection({
  apiKey,
  inputTokenRatePerMillion,
  isSaving,
  isLoaded,
  onApiKeyChange,
  onInputTokenRatePerMillionChange,
  onSave,
  hasApiKey,
}: ApiKeySectionProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave();
  }

  return (
    <section
      id="setup-panel"
      aria-labelledby="setup-tab"
      className="tab-content"
      role="tabpanel"
    >
      <div className="section-heading">
        <div>
          <p className="section-kicker">STEP 1 OF 2</p>
          <h2>Connect your Jev account</h2>
          <p className="section-description">
            Add your API key so PgQnA can find answers in the pages you visit.
          </p>
        </div>
        <span className="required-badge">
          <span aria-hidden="true" className="status-dot" />
          {hasApiKey ? "Connected" : "Required"}
        </span>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="api-key">
          Jev API key
          <a
            href="https://console.typesafe.ai/keys"
            rel="noopener noreferrer"
            target="_blank"
            style={{ marginLeft: "0.5rem" }}
          >
            How to get your Jev API key?
          </a>
        </label>
        <div className="input-with-action">
          <input
            autoComplete="off"
            id="api-key"
            name="api-key"
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder="Paste your API key"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
          />
          <button
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
            className="input-action"
            onClick={() => setShowApiKey(!showApiKey)}
            type="button"
          >
            {showApiKey ? "Hide" : "Show"}
          </button>
        </div>
        <p className="field-help">
          Stored locally in this browser. Access is restricted to PgQnA
          extension pages, not webpage content scripts. The key is not encrypted
          against other local browser-profile access.
        </p>
        <label className="field-label" htmlFor="input-token-rate">
          Cost per 1 million input tokens (USD)
        </label>
        <input
          id="input-token-rate"
          min="0"
          name="input-token-rate"
          onChange={(event) =>
            onInputTokenRatePerMillionChange(event.target.value)
          }
          required
          step="any"
          type="number"
          value={inputTokenRatePerMillion}
        />
        <p className="field-help">
          Used to estimate each answer’s input-token cost. Output tokens are
          treated as free. The rate is stored locally in this browser.
        </p>
        <div className="panel-footer">
          <p className="prototype-note">
            PgQnA does not validate the key until Jev provides a verified
            validation flow.
          </p>
          <button
            className="primary-button"
            disabled={isSaving || !isLoaded}
            type="submit"
          >
            {isSaving ? "Saving…" : "Save settings"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </section>
  );
}
