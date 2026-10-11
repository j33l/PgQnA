import { useState } from "react";
import iconUrl from "../../assets/icon.png";
import { ApiKeySection } from "./ApiKeySection";
import "./App.css";
import { SetupTransferSection } from "./SetupTransferSection";
import { WebsiteConfigForm } from "./WebsiteConfigForm";
import { WebsiteList } from "./WebsiteList";
import type { WebsiteConfig } from "./storage";
import { useSetupSettings } from "./useSetupSettings";

type SetupTab = "setup" | "qna";

function App() {
  const [activeTab, setActiveTab] = useState<SetupTab>("setup");
  const [isAddingWebsite, setIsAddingWebsite] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<WebsiteConfig | null>(
    null
  );
  const {
    apiKey,
    clearFeedback,
    deleteWebsite,
    error,
    importWebsites,
    inputTokenRatePerMillion,
    isSaving,
    notice,
    saveSettings,
    saveWebsite,
    setApiKey,
    setError,
    setInputTokenRatePerMillion,
    settings,
  } = useSetupSettings();

  function startNewWebsite() {
    setEditingWebsite(null);
    setIsAddingWebsite(true);
    clearFeedback();
  }

  function startEditingWebsite(website: WebsiteConfig) {
    setEditingWebsite(website);
    setIsAddingWebsite(true);
    clearFeedback();
  }

  async function handleSaveWebsite(
    website: WebsiteConfig,
    previousDomain: string | null
  ) {
    const saved = await saveWebsite(website, previousDomain);
    if (saved) {
      setIsAddingWebsite(false);
      setEditingWebsite(null);
    }
    return saved;
  }

  return (
    <div className="setup-page">
      <header className="topbar">
        <a className="brand" href="#" aria-label="PgQnA home">
          <img alt="" className="brand-mark" src={iconUrl} />
          <span>PgQnA</span>
        </a>
        <span className="topbar-label">Getting started</span>
      </header>

      <main className="page-content">
        <div className="intro">
          <p className="eyebrow">YOUR ANSWERS, ONE CLICK AWAY</p>
          <h1>Let’s get you set up.</h1>
          <p className="intro-copy">
            Connect Jev and choose what PgQnA should look for on your favorite
            websites.
          </p>
        </div>

        <section className="setup-panel" aria-label="PgQnA setup">
          <div className="tab-list" role="tablist" aria-label="Setup sections">
            <button
              id="setup-tab"
              aria-controls="setup-panel"
              aria-selected={activeTab === "setup"}
              className={`tab ${activeTab === "setup" ? "active" : ""}`}
              onClick={() => setActiveTab("setup")}
              role="tab"
              type="button"
            >
              <span className="tab-number">1</span>
              Setup
            </button>
            <button
              id="qna-tab"
              aria-controls="qna-panel"
              aria-selected={activeTab === "qna"}
              className={`tab ${activeTab === "qna" ? "active" : ""}`}
              onClick={() => setActiveTab("qna")}
              role="tab"
              type="button"
            >
              <span className="tab-number">2</span>
              QnA
            </button>
          </div>

          {settings === null ? (
            <div
              className="tab-content storage-state"
              role={error ? "alert" : "status"}
            >
              <p className={error ? "error-copy" : "section-description"}>
                {error || "Loading saved setup…"}
              </p>
              {error && (
                <button
                  className="secondary-button"
                  onClick={() => window.location.reload()}
                  type="button"
                >
                  Try again
                </button>
              )}
            </div>
          ) : (
            <>
              {error && (
                <div className="feedback error-feedback" role="alert">
                  {error}
                </div>
              )}
              {notice && (
                <div className="feedback success-feedback" role="status">
                  {notice}
                </div>
              )}
              {activeTab === "setup" ? (
                <ApiKeySection
                  apiKey={apiKey}
                  hasApiKey={Boolean(settings.apiKey)}
                  inputTokenRatePerMillion={inputTokenRatePerMillion}
                  isLoaded={settings !== null}
                  isSaving={isSaving}
                  onApiKeyChange={setApiKey}
                  onInputTokenRatePerMillionChange={setInputTokenRatePerMillion}
                  onSave={saveSettings}
                />
              ) : (
                <>
                  <section
                    id="qna-panel"
                    aria-labelledby="qna-tab"
                    className="tab-content"
                    role="tabpanel"
                  >
                    <div className="section-heading qna-heading">
                      <div>
                        <p className="section-kicker">STEP 2 OF 2</p>
                        <h2>Your website questions</h2>
                        <p className="section-description">
                          Create TypeSafe Choice questions, ordered Score
                          rubrics, or yes/no Noul questions for each website.
                        </p>
                      </div>
                      {!isAddingWebsite && (
                        <button
                          className="secondary-button"
                          onClick={startNewWebsite}
                          type="button"
                        >
                          <span aria-hidden="true">+</span>
                          Add new
                        </button>
                      )}
                    </div>

                    {isAddingWebsite ? (
                      <WebsiteConfigForm
                        key={editingWebsite?.domain ?? "new"}
                        editingWebsite={editingWebsite}
                        isSaving={isSaving}
                        onCancel={() => setIsAddingWebsite(false)}
                        onError={setError}
                        onSave={handleSaveWebsite}
                      />
                    ) : (
                      <WebsiteList
                        isSaving={isSaving}
                        onAdd={startNewWebsite}
                        onDelete={(domain) => void deleteWebsite(domain)}
                        onEdit={startEditingWebsite}
                        websites={settings.websites}
                      />
                    )}
                  </section>

                  <SetupTransferSection
                    isSaving={isSaving}
                    onError={(message) => {
                      clearFeedback();
                      setError(message);
                    }}
                    onImport={importWebsites}
                    websites={settings.websites}
                  />
                </>
              )}
            </>
          )}
        </section>

        <footer className="page-footer">
          <span>PgQnA</span>
          <a
            href="https://github.com/j33l/PgQnA"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            href="https://github.com/j33l/PgQnA/releases"
            rel="noreferrer"
            target="_blank"
          >
            Releases
          </a>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScUG_cYAu9vvRk3fLlamCyeBqhR3G5WcX1oQt6Fni5Yyripug/viewform?usp=publish-editor"
            rel="noreferrer"
            target="_blank"
          >
            Share your use case
          </a>
        </footer>
      </main>
    </div>
  );
}

export default App;
