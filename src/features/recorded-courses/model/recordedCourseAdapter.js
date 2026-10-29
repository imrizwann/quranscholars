import { trailerPlaybackSource } from "../../../lib/trailer-playback.js";

const formatDuration = (totalSeconds = 0) => {
  const totalMinutes = Math.round(Math.max(0, Number(totalSeconds) || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

const normalizeLesson = (lesson, sectionId, index) => ({
  sectionId,
  id: lesson?._id || lesson?.id || `${sectionId}-lesson-${index + 1}`,
  title: lesson?.title || `Lesson ${index + 1}`,
  description: lesson?.description || "",
  durationSeconds: Number(lesson?.durationSeconds) > 0 ? Number(lesson.durationSeconds) : null,
  durationLabel: Number(lesson?.durationSeconds) > 0 ? formatDuration(Number(lesson.durationSeconds)) : "Duration not listed",
  order: Number(lesson?.order || index + 1),
  previewable: Boolean(lesson?.previewable),
  videoUrl: playbackUrl(lesson?.playbackUrl || lesson?.videoUrl),
  resources: Array.isArray(lesson?.resources) ? lesson.resources : [],
});

// Never interpret storage keys or processing metadata as playable media.
const playbackUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;

export const resolveCourseImage = (
  value,
  baseUrl = import.meta.env?.VITE_COURSE_MEDIA_BASE_URL,
) => {
  if (typeof value !== "string" || !value.trim()) return null;
  if (playbackUrl(value)) return value;
  // Thumbnails are R2 object keys. Only resolve them against an explicitly configured public media origin.
  if (!playbackUrl(baseUrl)) return null;
  return `${baseUrl.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
};

const adaptRecordedCourse = (record = {}) => {
  const sections = (Array.isArray(record.sections) ? record.sections : []).map(
    (section, index) => {
      const id = section?._id || section?.id || `section-${index + 1}`;
      return {
        id,
        title: section?.title || `Section ${index + 1}`,
        description: section?.description || "",
        order: Number(section?.order || index + 1),
        lessons: (Array.isArray(section?.lessons) ? section.lessons : []).map(
          (lesson, lessonIndex) => normalizeLesson(lesson, id, lessonIndex),
        ),
      };
    },
  );
  const lessons = sections.flatMap((section) => section.lessons);
  const originalPrice = Number(
    record?.price?.original ?? record?.originalPrice ?? 0,
  );
  const saleValue = record?.price?.sale ?? record?.salePrice;
  const salePrice =
    saleValue === null || saleValue === undefined ? null : Number(saleValue);
  const currentPrice = salePrice === null ? originalPrice : salePrice;

  return {
    id: record?._id || record?.id || null,
    learningType: "recorded",
    title: record?.title || "Untitled course",
    slug: record?.slug || "",
    shortDescription: record?.shortDescription || record?.description || "",
    description: record?.description || record?.shortDescription || "",
    category:
      record?.category?.name ||
      (typeof record.category === "string" ? record.category : "Uncategorized"),
    categorySlug: record?.category?.slug || "",
    instructor: {
      id: record?.instructor?.id || record?.instructor?._id || "",
      name: record?.instructor?.name || "Instructor not listed",
      title: record?.instructor?.title || "Instructor",
      bio: record?.instructor?.bio || "",
      avatar: record?.instructor?.avatar || null,
    },
    thumbnail: resolveCourseImage(record?.thumbnailUrl || record?.thumbnail),
    trailerVideo: trailerPlaybackSource(record)?.src || null,
    language: record?.language || "Not specified",
    level: record?.level || "Not specified",
    price: {
      original: originalPrice,
      sale: salePrice,
      current: currentPrice,
      currency: record?.price?.currency || record?.currency || "INR",
      discounted: salePrice !== null && salePrice < originalPrice,
    },
    totalDurationSeconds:
      record.totalDuration == null ? null : Number(record.totalDuration),
    durationLabel:
      record.totalDuration == null
        ? "Duration not listed"
        : formatDuration(record.totalDuration),
    totalSections:
      record?.stats?.totalSections == null
        ? null
        : Number(record.stats.totalSections),
    totalLessons:
      record?.stats?.totalLessons == null
        ? null
        : Number(record.stats.totalLessons),
    rating: Number(record?.averageRating || record?.rating || 0),
    totalReviews: Number(record?.totalReviews || 0),
    totalStudents: Number(record?.totalStudents || 0),
    tags: Array.isArray(record?.tags) ? record.tags : [],
    featured: Boolean(record?.featured),
    bestseller: Boolean(record?.bestseller),
    updatedAt: record?.updatedAt || null,
    outcomes: Array.isArray(record?.outcomes) ? record.outcomes : [],
    requirements: Array.isArray(record?.requirements)
      ? record.requirements
      : [],
    audience: Array.isArray(record?.audience) ? record.audience : [],
    sections,
    lessons,
  };
};

export { adaptRecordedCourse, formatDuration };
