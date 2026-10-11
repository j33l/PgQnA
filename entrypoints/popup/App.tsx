import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Info, RefreshCw } from "lucide-react";
import {
  answerWebsiteQuestions,
  type QuestionAnswer,
  type QuestionAnswerResult,
} from "./ai";
import "./App.css";
import { loadSetupSettings } from "../setup/storage";
import type { WebsiteConfig } from "../setup/storage";
import iconUrl from "../../assets/icon.png";

type PopupView =
  | { status: "loading"; message: string }
  | { status: "error"; message: string }
  | { status: "not-configured"; domain: string }
  | {
      status: "answers";
      domain: string;
      answers: QuestionAnswer[];
      usage: QuestionAnswerResult["usage"];
      inputTokenRatePerMillion: number;
    };

const ANSWER_CACHE_KEY = "pgqnaAnswerCache";
const ANSWER_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedAnswers {
  cacheKey: string;
  cachedAt: number;
  view: Extract<PopupView, { status: "answers" }>;
}

function App() {
  const [view, setView] = useState<PopupView>({
    status: "loading",
    message: "Checking this page…",
  });
  const initialization = useRef<Promise<PopupView | null> | null>(null);
  const isRefreshing = useRef(false);
  const setupUrl = browser.runtime.getURL("/setup.html");

  const openSetup = useCallback(async () => {
    try {
      await browser.tabs.create({ url: setupUrl });
    } catch (error: unknown) {
      console.error("Unable to open the PgQnA setup page.", error);
      setView({ status: "error", message: "Could not open PgQnA setup." });
    }
  }, [setupUrl]);

  const loadAnswers = useCallback(
    async (forceRefresh = false): Promise<PopupView | null> => {
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

        const cacheKey = await createAnswerCacheKey(
          tab.id,
          tab.url,
          website,
          settings.inputTokenRatePerMillion
        );
        if (!forceRefresh) {
          const cached = await loadCachedAnswers(cacheKey);
          if (cached) return cached;
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

        // console.log("[PgQnA] Extracted page content:", pageContent);
        setView({ status: "loading", message: "Finding your answers…" });
        const result = await answerWebsiteQuestions(
          settings.apiKey,
          website,
          pageContent
        );
        const answersView: Extract<PopupView, { status: "answers" }> = {
          status: "answers",
          domain: website.domain,
          answers: result.answers,
          usage: result.usage,
          inputTokenRatePerMillion: settings.inputTokenRatePerMillion,
        };
        await browser.storage.session.set({
          [ANSWER_CACHE_KEY]: {
            cacheKey,
            cachedAt: Date.now(),
            view: answersView,
          } satisfies CachedAnswers,
        });
        return answersView;
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
    },
    [setupUrl]
  );

  useEffect(() => {
    let isMounted = true;
    initialization.current ??= loadAnswers();
    void initialization.current.then((result) => {
      if (isMounted && result) setView(result);
    });
    return () => {
      isMounted = false;
    };
  }, [loadAnswers]);

  async function refreshAnswers() {
    if (isRefreshing.current || view.status === "loading") return;
    isRefreshing.current = true;
    setView({ status: "loading", message: "Refreshing answers…" });
    try {
      initialization.current = loadAnswers(true);
      const result = await initialization.current;
      if (result) setView(result);
    } finally {
      initialization.current = null;
      isRefreshing.current = false;
    }
  }

  const binaryAnswers =
    view.status === "answers"
      ? view.answers.filter((answer) => answer.type === "noul")
      : [];
  const allBinaryAnswersGood =
    binaryAnswers.length > 0 &&
    binaryAnswers.every((answer) => answer.sentiment === "positive");

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
          <button
            className="primary-button"
            onClick={() => void refreshAnswers()}
            type="button"
          >
            Refresh answers
          </button>
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
        <section
          className={`answers-panel${
            allBinaryAnswersGood ? " answers-panel--all-binary-good" : ""
          }`}
        >
          <div className="results-heading">
            <div>
              <p className="eyebrow">ANSWERS FOR</p>
              <h1>{view.domain}</h1>
            </div>
            <div className="results-actions">
              <div className="button-tooltip-wrapper">
                <button
                  aria-describedby="refresh-tooltip"
                  aria-label="Refresh answers"
                  className="icon-button refresh-button"
                  onClick={() => void refreshAnswers()}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={16} strokeWidth={2} />
                </button>
                <div
                  className="button-tooltip"
                  id="refresh-tooltip"
                  role="tooltip"
                >
                  Refresh answers
                </div>
              </div>
              <div className="button-tooltip-wrapper">
                <button
                  aria-describedby="usage-tooltip"
                  aria-label="Token usage and cost details"
                  className="icon-button usage-info"
                  type="button"
                >
                  <Info aria-hidden="true" size={16} strokeWidth={2} />
                </button>
                <div
                  className="button-tooltip usage-tooltip"
                  id="usage-tooltip"
                  role="tooltip"
                >
                  <p>Input tokens: {view.usage.inputTokens.toLocaleString()}</p>
                  <p>
                    Output tokens: {view.usage.outputTokens.toLocaleString()}
                  </p>
                  <p>
                    Total tokens:{" "}
                    {(
                      view.usage.inputTokens + view.usage.outputTokens
                    ).toLocaleString()}
                  </p>
                  <p>
                    Rate: $
                    {view.inputTokenRatePerMillion.toLocaleString(undefined, {
                      maximumFractionDigits: 9,
                    })}{" "}
                    / 1 million input tokens
                  </p>
                  <p>
                    Estimated cost:{" "}
                    {formatUsd(
                      (view.usage.inputTokens * view.inputTokenRatePerMillion) /
                        1_000_000
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {allBinaryAnswersGood && (
            <div className="all-binary-good" role="status">
              <span aria-hidden="true" className="all-binary-good__icon">
                <Check size={12} strokeWidth={3} />
              </span>
              All Noul answers look good
            </div>
          )}
          <p className="console-note">
            Just like humans, AI can make mistakes. Verify answers.
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

function formatUsd(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 9,
  }).format(amount);
}

async function createAnswerCacheKey(
  tabId: number,
  pageUrl: string,
  website: WebsiteConfig,
  inputTokenRatePerMillion: number
): Promise<string> {
  const request = JSON.stringify([
    tabId,
    pageUrl,
    website,
    inputTokenRatePerMillion,
  ]);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(request)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

async function loadCachedAnswers(
  cacheKey: string
): Promise<Extract<PopupView, { status: "answers" }> | undefined> {
  const stored: Record<string, unknown> = await browser.storage.session.get(
    ANSWER_CACHE_KEY
  );
  const value = stored[ANSWER_CACHE_KEY];
  if (!isCachedAnswers(value)) {
    if (value !== undefined) {
      await browser.storage.session.remove(ANSWER_CACHE_KEY);
    }
    return undefined;
  }

  const age = Date.now() - value.cachedAt;
  if (value.cacheKey !== cacheKey || age < 0 || age >= ANSWER_CACHE_TTL_MS) {
    await browser.storage.session.remove(ANSWER_CACHE_KEY);
    return undefined;
  }
  return value.view;
}

function isCachedAnswers(value: unknown): value is CachedAnswers {
  if (typeof value !== "object" || value === null) return false;
  const cache = value as Record<string, unknown>;
  return (
    typeof cache.cacheKey === "string" &&
    typeof cache.cachedAt === "number" &&
    Number.isFinite(cache.cachedAt) &&
    isAnswersView(cache.view)
  );
}

function isAnswersView(
  value: unknown
): value is Extract<PopupView, { status: "answers" }> {
  if (typeof value !== "object" || value === null) return false;
  const view = value as Record<string, unknown>;
  if (
    view.status !== "answers" ||
    typeof view.domain !== "string" ||
    !Array.isArray(view.answers) ||
    typeof view.usage !== "object" ||
    view.usage === null ||
    typeof view.inputTokenRatePerMillion !== "number" ||
    !Number.isFinite(view.inputTokenRatePerMillion)
  ) {
    return false;
  }

  const usage = view.usage as Record<string, unknown>;
  return (
    typeof usage.inputTokens === "number" &&
    Number.isFinite(usage.inputTokens) &&
    typeof usage.outputTokens === "number" &&
    Number.isFinite(usage.outputTokens) &&
    view.answers.every((answer: unknown) => {
      if (typeof answer !== "object" || answer === null) return false;
      const item = answer as Record<string, unknown>;
      return (
        typeof item.id === "string" &&
        (item.type === "choice" ||
          item.type === "score" ||
          item.type === "noul") &&
        typeof item.instructions === "string" &&
        typeof item.value === "string" &&
        typeof item.confidence === "number" &&
        Number.isFinite(item.confidence) &&
        (item.sentiment === "positive" ||
          item.sentiment === "negative" ||
          item.sentiment === "neutral")
      );
    })
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
