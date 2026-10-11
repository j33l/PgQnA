import { useEffect, useState } from "react";
import {
  loadSetupSettings,
  parseSetupExport,
  saveSetupSettings,
  DEFAULT_INPUT_TOKEN_RATE_PER_MILLION,
  type SetupSettings,
  type WebsiteConfig,
} from "./storage";
import { normalizeDomain } from "./website-config";

export function useSetupSettings() {
  const [settings, setSettings] = useState<SetupSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [inputTokenRatePerMillion, setInputTokenRatePerMillion] = useState(
    String(DEFAULT_INPUT_TOKEN_RATE_PER_MILLION),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;
    loadSetupSettings()
      .then((saved) => {
        if (!isMounted) return;
        setSettings(saved);
        setApiKey(saved.apiKey);
        setInputTokenRatePerMillion(
          String(saved.inputTokenRatePerMillion),
        );
      })
      .catch((loadError: unknown) => {
        if (!isMounted) return;
        setError(`Could not load setup data: ${getErrorMessage(loadError)}`);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function clearFeedback() {
    setError("");
    setNotice("");
  }

  async function saveSettings() {
    if (!settings) return;
    clearFeedback();
    const parsedRate = Number(inputTokenRatePerMillion);
    if (
      inputTokenRatePerMillion.trim() === "" ||
      !Number.isFinite(parsedRate) ||
      parsedRate < 0
    ) {
      setError("Enter a valid nonnegative cost rate per million input tokens.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = {
        ...settings,
        apiKey: apiKey.trim(),
        inputTokenRatePerMillion: parsedRate,
      };
      await saveSetupSettings(updated);
      setSettings(updated);
      setApiKey(updated.apiKey);
      setInputTokenRatePerMillion(String(updated.inputTokenRatePerMillion));
      setNotice(
        updated.apiKey
          ? "Jev API key and input-token rate saved in this browser."
          : "Jev API key removed; input-token rate saved in this browser.",
      );
    } catch (saveError: unknown) {
      setError(`Could not save setup settings: ${getErrorMessage(saveError)}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveWebsite(
    website: WebsiteConfig,
    editingDomain: string | null,
  ): Promise<boolean> {
    if (!settings) return false;
    clearFeedback();

    const duplicate = settings.websites.some(
      (item) =>
        item.domain === website.domain && item.domain !== editingDomain,
    );
    if (duplicate) {
      setError(`A configuration for ${website.domain} already exists.`);
      return false;
    }

    setIsSaving(true);
    try {
      const updated: SetupSettings = {
        ...settings,
        websites: [
          ...settings.websites.filter(
            (item) => item.domain !== editingDomain,
          ),
          website,
        ].sort((a, b) => a.domain.localeCompare(b.domain)),
      };
      await saveSetupSettings(updated);
      setSettings(updated);
      setNotice(`${website.domain} configuration saved.`);
      return true;
    } catch (saveError: unknown) {
      setError(
        `Could not save website configuration: ${getErrorMessage(saveError)}`,
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteWebsite(domain: string) {
    if (!settings) return;
    clearFeedback();
    setIsSaving(true);
    try {
      const updated = {
        ...settings,
        websites: settings.websites.filter(
          (website) => website.domain !== domain,
        ),
      };
      await saveSetupSettings(updated);
      setSettings(updated);
      setNotice(`${domain} configuration deleted.`);
    } catch (saveError: unknown) {
      setError(
        `Could not delete website configuration: ${getErrorMessage(saveError)}`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function importWebsites(contents: string) {
    if (!settings) return;
    clearFeedback();
    setIsSaving(true);
    try {
      const websites = parseSetupExport(JSON.parse(contents) as unknown);
      const seenDomains = new Set(
        settings.websites.map((website) => website.domain),
      );
      for (const website of websites) {
        if (normalizeDomain(website.domain) !== website.domain) {
          throw new Error(`"${website.domain}" is not a valid website domain.`);
        }
        if (seenDomains.has(website.domain)) {
          throw new Error(
            `A configuration for ${website.domain} already exists. Remove it before importing this setup.`,
          );
        }
        seenDomains.add(website.domain);
      }

      const updated: SetupSettings = {
        ...settings,
        websites: [...settings.websites, ...websites].sort((a, b) =>
          a.domain.localeCompare(b.domain),
        ),
      };
      await saveSetupSettings(updated);
      setSettings(updated);
      setNotice(
        `${websites.length} website configuration${websites.length === 1 ? "" : "s"} imported. Your Jev API key was unchanged.`,
      );
    } catch (importError: unknown) {
      setError(`Could not import setup: ${getErrorMessage(importError)}`);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    apiKey,
    clearFeedback,
    deleteWebsite,
    error,
    importWebsites,
    isSaving,
    notice,
    saveSettings,
    saveWebsite,
    setApiKey,
    inputTokenRatePerMillion,
    setInputTokenRatePerMillion,
    setError,
    settings,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown storage error.";
}
