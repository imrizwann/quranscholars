export const COURSE_COMPLETION_DESCRIPTION = "Complete all published lessons to finish a course. Quizzes are optional.";

// Display math only. Completed flags come from the authenticated progress API;
// neither browser storage nor quiz scores establish lesson completion.
export function completionPercentage(completedLessons, totalLessons) {
  if (!Number.isSafeInteger(totalLessons) || totalLessons <= 0 || !Number.isSafeInteger(completedLessons) || completedLessons < 0) return 0;
  return Math.floor(Math.min(completedLessons, totalLessons) * 100 / totalLessons);
}

export function lessonCompletionSummary(lessons) {
  const completedLessons = lessons.filter(lesson => lesson.completed === true).length;
  const totalLessons = lessons.length;
  return { completedLessons, totalLessons, completed: totalLessons > 0 && completedLessons === totalLessons,
    progressPercent: completionPercentage(completedLessons, totalLessons) };
}
