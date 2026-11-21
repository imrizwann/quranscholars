// Match the instructor API's constraints and identify the field to correct.
export function validateQuizDraft(draft) {
  const length = value => value.trim().length;
  if (length(draft.title) < 3 || length(draft.title) > 150) return { field: "title", message: "Enter a quiz title between 3 and 150 characters." };
  const pass = Number(draft.passingPercent);
  if (!Number.isInteger(pass) || pass < 1 || pass > 100) return { field: "passingPercent", message: "Enter a whole-number pass mark from 1 to 100." };
  for (const [index, question] of draft.questions.entries()) {
    const field = `questions[${index}]`;
    if (length(question.prompt) < 3 || length(question.prompt) > 1000) return { field: `${field}[prompt]`, message: `Question ${index + 1}: enter a question between 3 and 1,000 characters.` };
    const seen = new Set();
    for (const [optionIndex, option] of question.options.entries()) {
      const normalized = option.trim().toLocaleLowerCase();
      if (!normalized || length(option) > 400) return { field: `${field}[options][${optionIndex}]`, message: `Question ${index + 1}: enter option ${optionIndex + 1} (up to 400 characters), or remove the unused option.` };
      if (seen.has(normalized)) return { field: `${field}[options][${optionIndex}]`, message: `Question ${index + 1}: each answer option must be different.` };
      seen.add(normalized);
    }
  }
  return null;
}
