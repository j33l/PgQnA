import type { WebsiteConfig } from "./storage";

interface WebsiteListProps {
  isSaving: boolean;
  onAdd: () => void;
  onDelete: (domain: string) => void;
  onEdit: (website: WebsiteConfig) => void;
  websites: WebsiteConfig[];
}

export function WebsiteList({
  isSaving,
  onAdd,
  onDelete,
  onEdit,
  websites,
}: WebsiteListProps) {
  if (!websites.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          <svg fill="none" height="28" viewBox="0 0 28 28" width="28">
            <rect
              height="19"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.5"
              width="17"
              x="5.5"
              y="4.5"
            />
            <path
              d="M9 10h10M9 14h6M9 18h4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
            <circle
              cx="21"
              cy="20"
              fill="white"
              r="4.25"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M21 18v4m-2-2h4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        <h3>No websites yet</h3>
        <p>
          Add a website to give PgQnA questions and answer choices tailored to
          that page.
        </p>
        <button className="text-button" onClick={onAdd} type="button">
          Add your first website <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="website-list">
      {websites.map((website) => (
        <article className="website-card" key={website.domain}>
          <div>
            <h3>{website.domain}</h3>
            <p>
              {Object.keys(website.questions).length}{" "}
              {Object.keys(website.questions).length === 1
                ? "question"
                : "questions"}
              {website.selector ? ` · ${website.selector}` : " · Full page"}
            </p>
          </div>
          <div className="website-actions">
            <button
              className="website-action"
              disabled={isSaving}
              onClick={() => onEdit(website)}
              type="button"
            >
              Edit
            </button>
            <button
              className="website-action delete-action"
              disabled={isSaving}
              onClick={() => onDelete(website.domain)}
              type="button"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
