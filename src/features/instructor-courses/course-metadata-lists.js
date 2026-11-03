export const courseMetadataLists = [
  { key: "tags", label: "Tags", limit: 50, placeholder: "Quran recitation\nTajweed" },
  { key: "outcomes", label: "Learning outcomes", limit: 200, requiredForPublish: true, placeholder: "Recognize the Arabic alphabet\nRecite short passages with correct pronunciation" },
  { key: "requirements", label: "Requirements", limit: 200, placeholder: "No previous experience needed\nA few minutes each day for practice" },
  { key: "audience", label: "Who this course is for", limit: 200, placeholder: "Beginners learning to read the Quran\nLearners refreshing their recitation" },
];

export const courseLearningLists = courseMetadataLists.filter(({ key }) => key !== "tags");

export function parseCourseMetadataLists(values, fields = courseMetadataLists) {
  const lists = {}, errors = {};
  for (const { key, label, limit } of fields) {
    lists[key] = String(values[key] ?? "").split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    if (lists[key].length > 20 || lists[key].some(item => item.length > limit)) {
      errors[key] = `${label}: use up to 20 lines, with no more than ${limit} characters per line.`;
    }
  }
  return { lists, errors };
}
