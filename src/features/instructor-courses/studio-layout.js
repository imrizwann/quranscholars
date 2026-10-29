export const studioTabs = [
  ["details", "Course Details"], ["curriculum", "Curriculum"],
  ["media", "Media"], ["pricing", "Pricing"], ["publish", "Publish"],
];

// Copy query data before sorting; order values remain internal and unchanged.
export function curriculumOrder(items = []) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a._id).localeCompare(String(b._id)));
}
