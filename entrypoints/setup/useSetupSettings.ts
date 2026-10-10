import { useEffect, useState } from "react";
import {
  loadSetupSettings,
  saveSetupSettings,
  type SetupSettings,
  type WebsiteConfig,
} from "./storage";

export function useSetupSettings() {
  const [settings, setSettings] = useState<SetupSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
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

  async function saveApiKey() {
    if (!settings) return;
    clearFeedback();
    setIsSaving(true);
    try {
      const updated = { ...settings, apiKey: apiKey.trim() };
      await saveSetupSettings(updated);
      setSettings(updated);
      setApiKey(updated.apiKey);
      setNotice(
        updated.apiKey
          ? "Jev API key saved in this browser."
          : "Jev API key removed.",
      );
    } catch (saveError: unknown) {
      setError(`Could not save API key: ${getErrorMessage(saveError)}`);
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

  return {
    apiKey,
    clearFeedback,
    deleteWebsite,
    error,
    isSaving,
    notice,
    saveApiKey,
    saveWebsite,
    setApiKey,
    setError,
    settings,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown storage error.";
}
