import { BookOpen, Clock3, Languages } from "lucide-react";

export const easeOut = [0.16, 1, 0.3, 1];

// Short, factual course details shown on the featured course card.
export function courseFacts(course) {
  const facts = [];
  if (course.totalLessons > 0) facts.push({ icon: BookOpen, label: `${course.totalLessons} ${course.totalLessons === 1 ? "lesson" : "lessons"}` });
  if (course.totalDurationSeconds > 0) facts.push({ icon: Clock3, label: course.durationLabel });
  if (course.language && course.language !== "Not specified") facts.push({ icon: Languages, label: course.language });
  return facts;
}

export const hasInstructor = course => Boolean(course?.instructor?.name) && course.instructor.name !== "Instructor not listed";

export const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

// Milestones for the learning-path hero: course sections when there are several,
// otherwise the lessons of the only section.
export function buildMilestones(details, max = 4) {
  const sections = (details?.sections || []).filter(section => section.lessons.length);
  if (sections.length >= 2) {
    return sections.slice(0, max).map((section, index) => ({ id: section.id, kicker: `Section ${index + 1}`, title: section.title, meta: plural(section.lessons.length, "lesson") }));
  }
  return (sections[0]?.lessons || []).slice(0, max).map((lesson, index) => ({ id: lesson.id, kicker: `Lesson ${index + 1}`, title: lesson.title, meta: lesson.durationSeconds ? lesson.durationLabel : "" }));
}
