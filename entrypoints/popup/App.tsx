import { useCallback, useEffect, useRef, useState } from "react";
import { answerWebsiteQuestions, type QuestionAnswer } from "./ai";
import "./App.css";
import { loadSetupSettings } from "../setup/storage";
import type { WebsiteConfig } from "../setup/storage";
import iconUrl from "../../assets/icon.png";

type PopupView =
  | { status: "loading"; message: string }
  | { status: "error"; message: string }
  | { status: "not-configured"; domain: string }
  | { status: "answers"; domain: string; answers: QuestionAnswer[] };

function App() {
  const [view, setView] = useState<PopupView>({
    status: "loading",
    message: "Checking this page…",
  });
  const initialization = useRef<Promise<PopupView | null> | null>(null);
  const setupUrl = browser.runtime.getURL("/setup.html");

  const openSetup = useCallback(async () => {
    try {
      await browser.tabs.create({ url: setupUrl });
    } catch (error: unknown) {
      console.error("Unable to open the PgQnA setup page.", error);
      setView({ status: "error", message: "Could not open PgQnA setup." });
    }
  }, [setupUrl]);

  useEffect(() => {
    let isMounted = true;

    async function loadAnswers(): Promise<PopupView | null> {
      try {
        const settings = await loadSetupSettings();
        if (!settings.apiKey.trim()) {
          try {
            await browser.tabs.create({ url: setupUrl });
            window.close();
            return null;
          } catch (error: unknown) {
            console.error("Unable to open the PgQnA setup page.", error);
            return {
              status: "error",
              message: "Could not open PgQnA setup.",
            };
          }
        }

        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.id === undefined || !tab.url) {
          throw new Error("Could not read the active browser tab.");
        }

        const pageUrl = new URL(tab.url);
        if (pageUrl.protocol !== "http:" && pageUrl.protocol !== "https:") {
          throw new Error("Open a regular website to use PgQnA.");
        }

        const website = findWebsiteConfig(
          settings.websites,
          pageUrl.hostname.toLowerCase()
        );
        if (!website) {
          return {
            status: "not-configured",
            domain: pageUrl.hostname,
          };
        }

        setView({ status: "loading", message: "Reading page content…" });
        const [injection] = await browser.scripting.executeScript({
          target: { tabId: tab.id },
          func: (selector: string) => {
            const element = selector
              ? document.querySelector(selector)
              : document.body;
            if (!element) {
              throw new Error(
                selector
                  ? `The configured selector "${selector}" was not found on this page.`
                  : "No readable page content was found."
              );
            }
            return element instanceof HTMLElement
              ? element.innerText.trim()
              : (element.textContent ?? "").trim();
          },
          args: [website.selector],
        });
        const pageContent = injection?.result;
        if (!pageContent) {
          throw new Error("No readable page content was found.");
        }

        console.log("[PgQnA] Extracted page content:", pageContent);
        setView({ status: "loading", message: "Finding your answers…" });
        const answers = await answerWebsiteQuestions(
          settings.apiKey,
          website,
          pageContent
        );
        return {
          status: "answers",
          domain: website.domain,
          answers,
        };
      } catch (error: unknown) {
        console.error("Unable to answer questions for the active page.", error);
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "PgQnA could not answer questions for this page.",
        };
      }
    }

    initialization.current ??= loadAnswers();
    void initialization.current.then((result) => {
      if (isMounted && result) setView(result);
    });
    return () => {
      isMounted = false;
    };
  }, [openSetup, setupUrl]);

  return (
    <main className="popup">
      <header className="popup-header">
        <div>
          <img alt="PgQnA Logo" className="brand-mark" src={iconUrl} />
          <span className="brand-name">PgQnA</span>
        </div>
        <button
          className="settings-button"
          onClick={() => void openSetup()}
          type="button"
        >
          Setup
        </button>
      </header>

      {view.status === "loading" && (
        <section aria-live="polite" className="status-panel">
          <span className="loader" aria-hidden="true" />
          <p>{view.message}</p>
        </section>
      )}

      {view.status === "error" && (
        <section aria-live="assertive" className="status-panel error-panel">
          <h1>Couldn’t get answers</h1>
          <p>{view.message}</p>
        </section>
      )}

      {view.status === "not-configured" && (
        <section className="status-panel">
          <h1>No questions for this site</h1>
          <p>
            <strong>{view.domain}</strong> isn’t in your website list yet.
          </p>
          <button
            className="primary-button"
            onClick={() => void openSetup()}
            type="button"
          >
            Configure a website
          </button>
        </section>
      )}

      {view.status === "answers" && (
        <section className="answers-panel">
          <div className="results-heading">
            <p className="eyebrow">ANSWERS FOR</p>
            <h1>{view.domain}</h1>
          </div>
          <p className="console-note">
            Page text is also logged in the extension console for debugging.
          </p>
          <div className="answer-list">
            {view.answers.map((answer) => (
              <article className="answer-card" key={answer.id}>
                <h2>{answer.instructions}</h2>
                <div
                  className={`answer-value answer-value--${answer.sentiment}`}
                >
                  <span>{answer.value}</span>
                  <span className="confidence">
                    {Math.round(answer.confidence * 100)}% confidence
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function findWebsiteConfig(
  websites: WebsiteConfig[],
  hostname: string
): WebsiteConfig | undefined {
  return websites
    .filter(
      (website) =>
        hostname === website.domain || hostname.endsWith(`.${website.domain}`)
    )
    .sort((left, right) => right.domain.length - left.domain.length)[0];
}

export default App;
