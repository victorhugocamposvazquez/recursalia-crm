import type { QuizQuestionRecord } from '@/types';

export type AnswerInput = { questionId: string; given: unknown };

export function scoreQuizAttempt(
  questions: QuizQuestionRecord[],
  answers: AnswerInput[]
): { score: number; passed: boolean; graded: { question_id: string; given: unknown; correct: boolean }[] } {
  if (questions.length === 0) {
    return { score: 0, passed: false, graded: [] };
  }

  let correctCount = 0;
  const graded: { question_id: string; given: unknown; correct: boolean }[] = [];

  for (const q of questions) {
    const given = answers.find((a) => a.questionId === q.id)?.given;
    const correct = gradeQuestion(q, given);
    graded.push({ question_id: q.id, given, correct });
    if (correct) correctCount += 1;
  }

  const score = correctCount / questions.length;
  return { score, passed: score >= 0.7, graded };
}

function gradeQuestion(q: QuizQuestionRecord, given: unknown): boolean {
  const payload = q.payload as Record<string, unknown>;
  if (q.kind === 'tf') {
    return given === payload.correct;
  }
  if (q.kind === 'single' || q.kind === 'image') {
    return given === payload.correct;
  }
  if (q.kind === 'multi') {
    const expected = payload.correct as string[];
    const got = Array.isArray(given) ? [...given].sort() : [];
    const exp = [...expected].sort();
    return JSON.stringify(got) === JSON.stringify(exp);
  }
  if (q.kind === 'order') {
    const expected = payload.correct_order as string[];
    const got = Array.isArray(given) ? given : [];
    return JSON.stringify(got) === JSON.stringify(expected);
  }
  return false;
}

export function xpForScore(score: number, isFinal: boolean): number {
  const base = Math.round(score * 100);
  return isFinal ? base + 50 : base + 15;
}
