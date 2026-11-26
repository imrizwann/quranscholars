// Copy for the public course page. Keep claims in line with /course-policy.

export const courseSections = [
  { id: "course-overview", label: "Overview" },
  { id: "course-curriculum", label: "Curriculum" },
  { id: "course-instructor", label: "Instructor" },
  { id: "course-reviews", label: "Reviews" },
  { id: "course-faq", label: "FAQ" },
];

export const courseFaqs = [
  {
    question: "How long can I access this course?",
    answer: "One payment gives you access to the course's recorded video lessons with no fixed expiry, on all your devices.",
  },
  {
    question: "Can I learn on my phone?",
    answer: "Yes. Lessons play in your browser on a phone, tablet or computer. Your progress is saved to your account, so you can pick up where you left off on any device.",
  },
  {
    question: "How do I start after enrolling?",
    answer: "As soon as your enrollment is confirmed, the course appears in My learning. Open it and begin with the first lesson.",
  },
  {
    question: "Can I get a refund?",
    answer: "Yes. You can request a change-of-mind refund within 7 days of payment if you have watched less than 20% of the course.",
    link: { to: "/course-policy", label: "Read the access and refund policy" },
    paidOnly: true,
  },
];

// Show this many outcomes before "Show all".
export const OUTCOME_PREVIEW = 8;
