import type {
  QuestionConfig,
  QuestionType,
  WebsiteConfig,
} from "./storage";

export interface QuestionDraft {
  id: string;
  type: QuestionType;
  instructions: string;
  criteria: string;
  yesCriteria: string;
  noCriteria: string;
}

export function createQuestionDraft(id = "question_1"): QuestionDraft {
  return {
    id,
    type: "choice",
    instructions: "",
    criteria: "",
    yesCriteria: "",
    noCriteria: "",
  };
}

export function normalizeDomain(input: string): string | null {
  const value = input.trim().toLowerCase().replace(/^https?:\/\//, "");
  if (
    !value ||
    value.includes("/") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("@") ||
    value.includes(":") ||
    value.startsWith(".") ||
    value.endsWith(".") ||
    value.includes("..") ||
    !/^[a-z0-9.-]+$/.test(value)
  ) {
    return null;
  }

  const labels = value.split(".");
  if (
    labels.some(
      (label) =>
        !label ||
        label.startsWith("-") ||
        label.endsWith("-") ||
        label.length > 63,
    )
  ) {
    return null;
  }

  return value;
}

export function buildWebsiteConfig(
  domainInput: string,
  selectorInput: string,
  stateContentInput: string,
  drafts: QuestionDraft[],
): WebsiteConfig {
  const domain = normalizeDomain(domainInput);
  if (!domain) {
    throw new Error("Enter a valid domain, such as linkedin.com.");
  }

  const selector = selectorInput.trim();
  if (selector) {
    try {
      document.querySelector(selector);
    } catch {
      throw new Error("Enter a valid CSS selector.");
    }
  }

  const questionEntries: [string, QuestionConfig][] = [];
  const questionIds = new Set<string>();
  for (const [index, draft] of drafts.entries()) {
    const id = draft.id.trim();
    const instructions = draft.instructions.trim();
    const criteria = draft.criteria
      .split("\n")
      .map((criterion) => criterion.trim())
      .filter(Boolean);
    const yesCriteria = draft.yesCriteria.trim();
    const noCriteria = draft.noCriteria.trim();
    const hasContent =
      criteria.length > 0 || Boolean(yesCriteria) || Boolean(noCriteria);

    if (!instructions && !hasContent) continue;
    if (!id) {
      throw new Error(`Enter an ID for question ${index + 1}.`);
    }
    if (questionIds.has(id)) {
      throw new Error(`Question ID "${id}" is used more than once.`);
    }
    questionIds.add(id);
    if (!instructions) {
      throw new Error(`Enter instructions for question ${index + 1}.`);
    }

    if (draft.type === "choice") {
      if (criteria.length < 2) {
        throw new Error(
          `Question ${index + 1} needs at least two choice options.`,
        );
      }
      if (new Set(criteria).size !== criteria.length) {
        throw new Error(`Question ${index + 1} has duplicate choice options.`);
      }
      questionEntries.push([
        id,
        {
          type: "choice",
          instructions,
          criteria: Object.fromEntries(criteria.map((option) => [option, null])),
        },
      ]);
      continue;
    }

    if (draft.type === "score") {
      if (criteria.length < 2) {
        throw new Error(
          `Question ${index + 1} needs at least two ordered score levels.`,
        );
      }
      questionEntries.push([
        id,
        { type: "score", instructions, criteria },
      ]);
      continue;
    }

    const noulCriteria = {
      ...(yesCriteria ? { true: yesCriteria } : {}),
      ...(noCriteria ? { false: noCriteria } : {}),
    };
    questionEntries.push([
      id,
      {
        type: "noul",
        instructions,
        ...(Object.keys(noulCriteria).length ? { criteria: noulCriteria } : {}),
      },
    ]);
  }

  if (!questionEntries.length) {
    throw new Error("Add at least one question with instructions.");
  }

  return {
    domain,
    selector,
    stateContent: stateContentInput.trim(),
    questions: Object.fromEntries(questionEntries),
  };
}

export function toQuestionDrafts(website: WebsiteConfig): QuestionDraft[] {
  const drafts = Object.entries(website.questions).map(([id, question]) => {
    if (question.type === "choice") {
      return {
        ...createQuestionDraft(id),
        type: "choice" as const,
        instructions: question.instructions,
        criteria: Object.keys(question.criteria).join("\n"),
      };
    }

    if (question.type === "score") {
      return {
        ...createQuestionDraft(id),
        type: "score" as const,
        instructions: question.instructions,
        criteria: question.criteria.join("\n"),
      };
    }

    return {
      ...createQuestionDraft(id),
      type: "noul" as const,
      instructions: question.instructions,
      yesCriteria: question.criteria?.true ?? "",
      noCriteria: question.criteria?.false ?? "",
    };
  });

  return drafts.length ? drafts : [createQuestionDraft()];
}
