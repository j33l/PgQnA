export type QuestionType = "choice" | "score" | "noul";

export interface ChoiceQuestionConfig {
  type: "choice";
  instructions: string;
  criteria: Record<string, string | null>;
}

export interface ScoreQuestionConfig {
  type: "score";
  instructions: string;
  criteria: string[];
}

export interface NoulQuestionConfig {
  type: "noul";
  instructions: string;
  criteria?: {
    true?: string;
    false?: string;
  } | null;
}

export type QuestionConfig =
  | ChoiceQuestionConfig
  | ScoreQuestionConfig
  | NoulQuestionConfig;

export interface WebsiteConfig {
  domain: string;
  selector: string;
  stateContent: string;
  questions: Record<string, QuestionConfig>;
}

export interface SetupSettings {
  apiKey: string;
  websites: WebsiteConfig[];
}

export interface SetupExport {
  format: "pgqna-setup";
  version: 1;
  websites: WebsiteConfig[];
}

const SETTINGS_KEY = "pgqnaSetup";
const EMPTY_SETTINGS: SetupSettings = { apiKey: "", websites: [] };
let accessLevelPromise: Promise<void> | undefined;

export function restrictSetupStorageAccess(): Promise<void> {
  if (typeof browser.storage.local.setAccessLevel !== "function") {
    return Promise.reject(
      new Error(
        "This browser does not support restricted local storage. Use a supported Chromium browser.",
      ),
    );
  }
  accessLevelPromise ??= browser.storage.local.setAccessLevel({
    accessLevel: "TRUSTED_CONTEXTS",
  });
  return accessLevelPromise;
}

export async function loadSetupSettings(): Promise<SetupSettings> {
  await restrictSetupStorageAccess();
  const stored = await browser.storage.local.get(SETTINGS_KEY);
  const value: unknown = stored[SETTINGS_KEY];
  if (value === undefined) return EMPTY_SETTINGS;
  return parseSetupSettings(value);
}

export async function saveSetupSettings(
  settings: SetupSettings,
): Promise<void> {
  await restrictSetupStorageAccess();
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
}

export function createSetupExport(websites: WebsiteConfig[]): SetupExport {
  return {
    format: "pgqna-setup",
    version: 1,
    websites,
  };
}

export function parseSetupExport(value: unknown): WebsiteConfig[] {
  if (typeof value !== "object" || value === null) {
    throw new Error("The selected file is not a PgQnA setup export.");
  }

  const setupExport = value as Record<string, unknown>;
  if (
    setupExport.format !== "pgqna-setup" ||
    setupExport.version !== 1 ||
    !Array.isArray(setupExport.websites)
  ) {
    throw new Error("The selected file is not a supported PgQnA setup export.");
  }

  return setupExport.websites.map(parseWebsiteConfig);
}

function parseSetupSettings(value: unknown): SetupSettings {
  if (typeof value !== "object" || value === null) {
    throw new Error(
      "Saved setup data is invalid. Remove it and set up PgQnA again.",
    );
  }
  const settings = value as Record<string, unknown>;
  if (
    typeof settings.apiKey !== "string" ||
    !Array.isArray(settings.websites)
  ) {
    throw new Error(
      "Saved setup data is invalid. Remove it and set up PgQnA again.",
    );
  }

  return {
    apiKey: settings.apiKey,
    websites: settings.websites.map(parseWebsiteConfig),
  };
}

function parseWebsiteConfig(value: unknown): WebsiteConfig {
  if (typeof value !== "object" || value === null) {
    throw new Error(
      "Saved setup data is invalid. Remove it and set up PgQnA again.",
    );
  }
  const website = value as Record<string, unknown>;
  if (
    typeof website.domain !== "string" ||
    typeof website.selector !== "string" ||
    (website.stateContent !== undefined &&
      typeof website.stateContent !== "string")
  ) {
    throw new Error(
      "Saved setup data is invalid. Remove it and set up PgQnA again.",
    );
  }

  return {
    domain: website.domain,
    selector: website.selector,
    stateContent:
      typeof website.stateContent === "string" ? website.stateContent : "",
    questions: parseQuestions(website.questions),
  };
}

function parseQuestions(value: unknown): Record<string, QuestionConfig> {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value.map((item, index) => {
        if (!isLegacyQuestionConfig(item)) {
          throw new Error(
            "Saved setup data is invalid. Remove it and set up PgQnA again.",
          );
        }
        const criteria = Object.fromEntries(
          item.options.map((option) => [option, null]),
        );
        if (Object.keys(criteria).length < 2) {
          throw new Error(
            "Saved setup data is invalid. Remove it and set up PgQnA again.",
          );
        }
        return [
          `question_${index + 1}`,
          {
            type: "choice",
            instructions: item.question,
            criteria,
          },
        ];
      }),
    );
  }

  if (typeof value !== "object" || value === null) {
    throw new Error(
      "Saved setup data is invalid. Remove it and set up PgQnA again.",
    );
  }
  const questions = value as Record<string, unknown>;
  if (
    !Object.keys(questions).length ||
    Object.keys(questions).some((id) => !id.trim()) ||
    !Object.values(questions).every(isQuestionConfig)
  ) {
    throw new Error(
      "Saved setup data is invalid. Remove it and set up PgQnA again.",
    );
  }
  return questions as Record<string, QuestionConfig>;
}

function isLegacyQuestionConfig(
  value: unknown,
): value is { question: string; options: string[] } {
  if (typeof value !== "object" || value === null) return false;
  const question = value as Record<string, unknown>;
  return (
    typeof question.question === "string" &&
    Array.isArray(question.options) &&
    question.options.every((option) => typeof option === "string")
  );
}

function isQuestionConfig(value: unknown): value is QuestionConfig {
  if (typeof value !== "object" || value === null) return false;
  const question = value as Record<string, unknown>;
  if (
    typeof question.instructions !== "string" ||
    !question.instructions.trim()
  ) {
    return false;
  }

  if (question.type === "choice") {
    if (
      typeof question.criteria !== "object" ||
      question.criteria === null ||
      Array.isArray(question.criteria)
    ) {
      return false;
    }
    return (
      Object.keys(question.criteria).length >= 2 &&
      Object.keys(question.criteria).every((label) => Boolean(label.trim())) &&
      Object.values(question.criteria).every(
        (description) =>
          description === null || typeof description === "string",
      )
    );
  }

  if (question.type === "score") {
    return (
      Array.isArray(question.criteria) &&
      question.criteria.length >= 2 &&
      question.criteria.every(
        (criterion) =>
          typeof criterion === "string" && Boolean(criterion.trim()),
      )
    );
  }

  if (question.type === "noul") {
    if (question.criteria === undefined) return true;
    if (question.criteria === null) return true;
    if (
      typeof question.criteria !== "object" ||
      question.criteria === null ||
      Array.isArray(question.criteria)
    ) {
      return false;
    }
    const criteria = question.criteria as Record<string, unknown>;
    return (
      Object.keys(criteria).every((key) => key === "true" || key === "false") &&
      (criteria.true === undefined || typeof criteria.true === "string") &&
      (criteria.false === undefined || typeof criteria.false === "string")
    );
  }

  return false;
}
