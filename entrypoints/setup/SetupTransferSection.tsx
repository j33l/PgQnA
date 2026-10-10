import { useRef, type ChangeEvent } from "react";
import {
  createSetupExport,
  type WebsiteConfig,
} from "./storage";

interface SetupTransferSectionProps {
  isSaving: boolean;
  onError: (message: string) => void;
  onImport: (contents: string) => Promise<void>;
  websites: WebsiteConfig[];
}

export function SetupTransferSection({
  isSaving,
  onError,
  onImport,
  websites,
}: SetupTransferSectionProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await onImport(await file.text());
    } catch (error: unknown) {
      onError(
        `Could not read setup file: ${
          error instanceof Error ? error.message : "Unknown file error."
        }`,
      );
    } finally {
      input.value = "";
    }
  }

  function exportSetup() {
    const contents = JSON.stringify(createSetupExport(websites), null, 2);
    const file = new Blob([contents], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pgqna-setup.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section className="setup-transfer" aria-labelledby="setup-transfer-title">
      <div className="section-heading">
        <div>
          <h2 id="setup-transfer-title">Import or export setup</h2>
          <p className="section-description">
            Transfer your website questions and selectors as a JSON file. Your
            Jev API key is never included. Importing appends configurations and
            keeps your existing setup.
          </p>
        </div>
      </div>
      <div className="setup-transfer-actions">
        <input
          accept=".json,application/json"
          aria-label="Choose a PgQnA setup JSON file to import"
          className="visually-hidden"
          disabled={isSaving}
          onChange={(event) => void handleFileChange(event)}
          ref={fileInput}
          type="file"
        />
        <button
          className="secondary-button"
          disabled={isSaving}
          onClick={() => fileInput.current?.click()}
          type="button"
        >
          Import JSON
        </button>
        <button
          className="secondary-button"
          disabled={isSaving}
          onClick={exportSetup}
          type="button"
        >
          Export JSON
        </button>
      </div>
    </section>
  );
}
