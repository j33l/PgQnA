import { useState, type FormEvent } from "react";
import type { QuestionType, WebsiteConfig } from "./storage";
import {
  buildWebsiteConfig,
  createQuestionDraft,
  toQuestionDrafts,
  type QuestionDraft,
} from "./website-config";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "choice", label: "Choice" },
  { value: "score", label: "Score" },
  { value: "noul", label: "Noul (yes/no)" },
];

interface WebsiteConfigFormProps {
  editingWebsite: WebsiteConfig | null;
  isSaving: boolean;
  onCancel: () => void;
  onError: (message: string) => void;
  onSave: (
    website: WebsiteConfig,
    editingDomain: string | null
  ) => Promise<boolean>;
}

export function WebsiteConfigForm({
  editingWebsite,
  isSaving,
  onCancel,
  onError,
  onSave,
}: WebsiteConfigFormProps) {
  const [domain, setDomain] = useState(editingWebsite?.domain ?? "");
  const [selector, setSelector] = useState(editingWebsite?.selector ?? "");
  const [stateContent, setStateContent] = useState(
    editingWebsite?.stateContent ?? ""
  );
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    editingWebsite ? toQuestionDrafts(editingWebsite) : [createQuestionDraft()]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const website = buildWebsiteConfig(
        domain,
        selector,
        stateContent,
        questions
      );
      await onSave(website, editingWebsite?.domain ?? null);
    } catch (error: unknown) {
      onError(
        error instanceof Error
          ? error.message
          : "Invalid website configuration."
      );
    }
  }

  function updateQuestion<K extends keyof QuestionDraft>(
    index: number,
    field: K,
    value: QuestionDraft[K]
  ) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question
      )
    );
  }

  function updateQuestionType(index: number, value: string) {
    const type = QUESTION_TYPES.find((option) => option.value === value)?.value;
    if (!type) return;
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index && question.type !== type
          ? {
              ...question,
              type,
              criteria: "",
              yesCriteria: "",
              noCriteria: "",
            }
          : question
      )
    );
  }

  function addQuestion() {
    setQuestions((current) => {
      let nextId = current.length + 1;
      while (current.some((question) => question.id === `question_${nextId}`)) {
        nextId++;
      }
      return [...current, createQuestionDraft(`question_${nextId}`)];
    });
  }

  return (
    <form className="form-card website-form" onSubmit={handleSubmit}>
      <div className="form-card-heading">
        <h3>{editingWebsite ? "Edit website" : "New website"}</h3>
        <button
          aria-label="Close website form"
          className="close-button"
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>
      <label className="field-label" htmlFor="website-domain">
        Website domain <span className="required-mark">*</span>
      </label>
      <input
        autoComplete="url"
        id="website-domain"
        name="website-domain"
        onChange={(event) => setDomain(event.target.value)}
        placeholder="e.g. linkedin.com"
        required
        type="text"
        value={domain}
      />

      <label className="field-label spaced-label" htmlFor="selector">
        HTML selector <span className="optional-label">Optional</span>
      </label>
      <input
        id="selector"
        name="selector"
        onChange={(event) => setSelector(event.target.value)}
        placeholder="e.g. #main-content"
        type="text"
        value={selector}
      />
      <p className="field-help">Leave blank to use the whole page content.</p>

      <label className="field-label spaced-label" htmlFor="state-content">
        Additional state content{" "}
        <span className="optional-label">Optional</span>
      </label>
      <textarea
        id="state-content"
        name="state-content"
        onChange={(event) => setStateContent(event.target.value)}
        placeholder="Add context to include whenever questions are answered for this website"
        rows={4}
        value={stateContent}
      />
      <p className="field-help">
        This content is sent to Jev alongside the selected page content.
      </p>

      <div className="question-block">
        {questions.map((question, index) => (
          <div className="question-editor" key={index}>
            <div className="question-editor-heading">
              <span className="field-label">Question {index + 1}</span>
              {questions.length > 1 && (
                <button
                  className="remove-question"
                  onClick={() =>
                    setQuestions((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
            <label className="field-label" htmlFor={`question-id-${index}`}>
              Question ID
            </label>
            <input
              id={`question-id-${index}`}
              onChange={(event) =>
                updateQuestion(index, "id", event.target.value)
              }
              placeholder="e.g. candidate_role"
              required
              type="text"
              value={question.id}
            />
            <p className="field-help">
              This key identifies the answer in the TypeSafe response.
            </p>
            <label
              className="field-label spaced-label"
              htmlFor={`question-type-${index}`}
            >
              Primitive type
            </label>
            <select
              id={`question-type-${index}`}
              onChange={(event) =>
                updateQuestionType(index, event.target.value)
              }
              value={question.type}
            >
              {QUESTION_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label
              className="field-label spaced-label"
              htmlFor={`instructions-${index}`}
            >
              Instructions
            </label>
            <input
              id={`instructions-${index}`}
              onChange={(event) =>
                updateQuestion(index, "instructions", event.target.value)
              }
              placeholder="Write a clear, specific question or statement to judge"
              required
              type="text"
              value={question.instructions}
            />
            {question.type === "choice" && (
              <>
                <label
                  className="field-label spaced-label"
                  htmlFor={`criteria-${index}`}
                >
                  Choice options
                </label>
                <textarea
                  id={`criteria-${index}`}
                  onChange={(event) =>
                    updateQuestion(index, "criteria", event.target.value)
                  }
                  placeholder={"Engineer\nDesigner\nOther"}
                  required
                  rows={3}
                  value={question.criteria}
                />
                <p className="field-help">
                  Add one option label per line. Each label becomes a Choice
                  criterion.
                </p>
              </>
            )}
            {question.type === "score" && (
              <>
                <label
                  className="field-label spaced-label"
                  htmlFor={`criteria-${index}`}
                >
                  Ordered score levels
                </label>
                <textarea
                  id={`criteria-${index}`}
                  onChange={(event) =>
                    updateQuestion(index, "criteria", event.target.value)
                  }
                  placeholder={"No experience\nSome familiarity\nExpert"}
                  required
                  rows={3}
                  value={question.criteria}
                />
                <p className="field-help">
                  Add at least two descriptions, from lowest to highest score.
                </p>
              </>
            )}
            {question.type === "noul" && (
              <>
                <label
                  className="field-label spaced-label"
                  htmlFor={`yes-criteria-${index}`}
                >
                  Yes outcome <span className="optional-label">Optional</span>
                </label>
                <input
                  id={`yes-criteria-${index}`}
                  onChange={(event) =>
                    updateQuestion(index, "yesCriteria", event.target.value)
                  }
                  placeholder="What a yes answer means"
                  type="text"
                  value={question.yesCriteria}
                />
                <label
                  className="field-label spaced-label"
                  htmlFor={`no-criteria-${index}`}
                >
                  No outcome <span className="optional-label">Optional</span>
                </label>
                <input
                  id={`no-criteria-${index}`}
                  onChange={(event) =>
                    updateQuestion(index, "noCriteria", event.target.value)
                  }
                  placeholder="What a no answer means"
                  type="text"
                  value={question.noCriteria}
                />
              </>
            )}
          </div>
        ))}
        <button
          className="add-question-button"
          onClick={addQuestion}
          type="button"
        >
          + Add another question
        </button>
      </div>

      <div className="form-actions">
        <p className="prototype-note">
          {editingWebsite
            ? `Updating ${editingWebsite.domain}`
            : "Questions are saved as TypeSafe Choice, Score, or Noul primitives."}{" "}
          <a
            href="https://docs.typesafe.ai/primitives"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>
        </p>
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save configuration"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
