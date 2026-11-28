import {
  Atom,
  BookOpenCheck,
  BookOpenText,
  CirclePlay,
  Languages,
  ListChecks,
  Monitor,
  NotebookPen,
  RotateCcw,
  Sigma,
  UserRoundPlus,
} from "lucide-react";

// All home page copy lives here so it can be reviewed and edited in one place.
// Course specifics (title, lessons, outline, price, teacher) always come from the API.
// Brand-level copy stays subject-neutral: DarsLearn launches with Quran recitation,
// and more subjects follow.

export const heroContent = {
  // MVP launch: one beginner Quran recitation course.
  featured: {
    eyebrow: "Quran recitation for beginners",
    titleLead: "Learn to Recite the Quran with",
    titleAccent: "Confidence",
    lead: "Clear, step-by-step Tajweed lessons for beginners. Start with the basics, follow your teacher's demonstrations, and build confident recitation at your own pace.",
    points: ["Beginner friendly", "Short video lessons", "Progress saved on any device"],
  },
  // Full catalogue (VITE_CATALOGUE_LAYOUT=full): enable once there are 10+ courses.
  full: {
    eyebrow: "Online courses for every learner",
    titleLead: "Learn something new,",
    titleAccent: "one clear lesson at a time.",
    lead: "Structured video courses taught by qualified teachers. Learn at your own pace, practise what you learn, and pick up where you left off on any device.",
    points: ["Learn at your own pace", "Qualified teachers", "Progress saved on any device"],
  },
};

// MVP only. Once the full catalogue is live, replace with categories from the API.
export const subjects = [
  { icon: BookOpenText, name: "Quran & Tajweed", available: true },
  { icon: Monitor, name: "Computer Science" },
  { icon: Languages, name: "English" },
  { icon: Sigma, name: "Mathematics" },
  { icon: Atom, name: "Science" },
];

export const steps = [
  {
    icon: CirclePlay,
    title: "Preview the course",
    text: "Read the lesson outline, meet your teacher and watch the introduction video before you decide.",
  },
  {
    icon: UserRoundPlus,
    title: "Enroll in a few minutes",
    text: "Create a free account and pay securely online. Your lessons open as soon as your enrollment is confirmed.",
  },
  {
    icon: BookOpenCheck,
    title: "Learn at your own pace",
    text: "Watch a lesson, practise what you learn, and come back whenever you are ready. Your place is always saved.",
  },
];

export const experienceFeatures = [
  {
    icon: ListChecks,
    title: "One clear path",
    text: "Lessons are grouped into short sections that build on each other, so you always know what comes next.",
  },
  {
    icon: RotateCcw,
    title: "Continue where you left off",
    text: "Your last lesson and video position are saved, so you can switch between your phone and computer.",
  },
  {
    icon: BookOpenCheck,
    title: "Check your understanding",
    text: "Short section quizzes help you review the key points before you move on.",
  },
  {
    icon: NotebookPen,
    title: "Notes and lesson resources",
    text: "Write notes while you watch and download the practice material your teacher shares.",
  },
];

// Only answers that are not already covered by a section on the home page.
export const faqs = [
  {
    question: "Is the Quran recitation course suitable for complete beginners?",
    answer: "Yes. The course starts with the basics and explains each Tajweed rule step by step, so no previous experience is needed.",
  },
  {
    question: "How long can I access a course?",
    answer: "One payment gives you access to the course's recorded video lessons with no fixed expiry, on all your devices.",
  },
  {
    question: "Can I get a refund?",
    answer: "Yes. You can request a refund within 7 days of purchase if you have not started the course. Watching the free trailer does not count.",
  },
  {
    question: "What if I need help?",
    answer: "Our team can help with enrolling, payments or opening your lessons. Send us a message from the contact page and we will get back to you.",
  },
];
