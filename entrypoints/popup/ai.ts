import {
  choice,
  noul,
  score,
  TypeSafeClient,
  type Question,
} from "@typesafe-ai/sdk";
import type { QuestionConfig, WebsiteConfig } from "../setup/storage";

export type AnswerSentiment = "positive" | "negative" | "neutral";

export interface QuestionAnswer {
  id: string;
  instructions: string;
  value: string;
  confidence: number;
  sentiment: AnswerSentiment;
}

export async function answerWebsiteQuestions(
  apiKey: string,
  website: WebsiteConfig,
  pageContent: string,
): Promise<QuestionAnswer[]> {
  if (!apiKey.trim()) {
    throw new Error("Save your Jev API key in setup before asking questions.");
  }

  const questions: Record<string, Question> = Object.fromEntries(
    Object.entries(website.questions).map(([id, question]) => [
      id,
      toJevQuestion(question),
    ]),
  );
  const client = new TypeSafeClient({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
  const { answers } = await client.systemOne({
    state: pageContent,
    questions,
  });

  return Object.entries(website.questions).map(([id, question]) => {
    const answer = answers[id];
    if (!answer) {
      throw new Error(`Jev did not return an answer for "${id}".`);
    }

    if (answer.type === "noul") {
      const positive = answer.noul > 0.5;
      const negative = answer.noul < 0.5;
      return {
        id,
        instructions: question.instructions,
        value:
          answer.noul === 0.5
            ? "Uncertain (50%)"
            : `${positive ? "Yes" : "No"} (${Math.round(
                Math.max(answer.noul, 1 - answer.noul) * 100,
              )}%)`,
        confidence: Math.max(answer.noul, 1 - answer.noul),
        sentiment: positive
          ? "positive"
          : negative
            ? "negative"
            : "neutral",
      };
    }

    if (answer.type === "choice") {
      return {
        id,
        instructions: question.instructions,
        value: answer.choice,
        confidence: answer.confidence,
        sentiment: getChoiceSentiment(answer.choice),
      };
    }

    if (question.type !== "score") {
      throw new Error(`Jev returned an unexpected answer type for "${id}".`);
    }
    const highestScore = question.criteria.length - 1;
    return {
      id,
      instructions: question.instructions,
      value: `${answer.score.toFixed(2)} / ${highestScore}`,
      confidence: answer.confidence,
      sentiment:
        answer.score === 0
          ? "negative"
          : answer.score === highestScore
            ? "positive"
            : "neutral",
    };
  });
}

function toJevQuestion(question: QuestionConfig): Question {
  if (question.type === "choice") {
    return choice(question.instructions, question.criteria);
  }
  if (question.type === "noul") {
    return noul(question.instructions, question.criteria ?? undefined);
  }

  const [first, second] = question.criteria;
  if (first === undefined || second === undefined) {
    throw new Error("A score question must have at least two score levels.");
  }
  const criteria: [string, string, ...string[]] = [
    first,
    second,
    ...question.criteria.slice(2),
  ];
  return score(question.instructions, criteria);
}

function getChoiceSentiment(value: string): AnswerSentiment {
  const normalized = value.trim().toLowerCase();
  if (["yes", "true", "positive"].includes(normalized)) return "positive";
  if (["no", "false", "negative"].includes(normalized)) return "negative";
  return "neutral";
}
