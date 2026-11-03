import {
    BookOpen,
    Clapperboard,
    Clock3,
    Layers3,
    MessageCircleMore,
    MonitorPlay,
    Radio,
    Video,
} from "lucide-react";
import MuslimMan from "@/assets/images/muslim.png";
import HijabImage from "@/assets/images/hijab.png";
const showcaseStats = [
    {
        value: "Flexible",
        label: "study at your pace",
    },
    {
        value: "Guided",
        label: "structured lessons",
    },
    {
        value: "Online",
        label: "learn from anywhere",
    },
];

const showcasePath = [
    {
        icon: Clapperboard,
        title: "Record",
        text: "Studio lessons",
    },
    {
        icon: Video,
        title: "Process",
        text: "Adaptive playback",
    },
    {
        icon: BookOpen,
        title: "Teach",
        text: "Guided pathways",
    },
];

const learningFormats = [
    {
        icon: MonitorPlay,
        title: "On-demand courses",
        text: "Professionally produced lessons with chapters, resources, and saved progress.",
    },
    {
        icon: Radio,
        title: "Live scholar-led classes",
        text: "Learn in real time, ask questions, and receive personal guidance.",
    },
    {
        icon: Layers3,
        title: "Blended learning paths",
        text: "Combine self-paced study with live feedback for deeper understanding.",
    },
];

const featuredCourses = [
    {
        title: "Quran with Tajweed",
        description:
            "Build confident recitation through clear demonstrations, guided practice, and practical tajweed.",
        image: "/courses/quran-with-tajweed.svg",
        format: "Video course",
        level: "All levels",
        tone: "bg-[#e4f0eb]",
    },
    {
        title: "Foundations of Hadith",
        description:
            "Study the role, preservation, and everyday guidance of the Prophetic tradition.",
        image: "/courses/hadith.svg",
        format: "Self-paced",
        level: "Intermediate",
        tone: "bg-[#f3ead8]",
    },
    {
        title: "Live Quran Mentorship",
        description:
            "Receive direct correction, a personal study rhythm, and accountable scholar guidance.",
        image: "/courses/woman-in-qayeda.svg",
        format: "Live learning",
        level: "Personalised",
        tone: "bg-[#e7e5f3]",
    },
];

const platformFeatures = [
    {
        icon: Video,
        title: "Professional video, without the friction",
        text: "Lessons are prepared for smooth, adaptive playback across connection speeds and devices.",
    },
    {
        icon: BookOpen,
        title: "A clear path through every subject",
        text: "Move through sections, lessons, resources, and practice in a sequence that makes sense.",
    },
    {
        icon: Clock3,
        title: "Always know where to continue",
        text: "Your lesson position and course progress stay ready whenever you return.",
    },
    {
        icon: MessageCircleMore,
        title: "Guidance when self-study is not enough",
        text: "Move from self-paced learning into live classes and scholar support when you need it.",
    },
];

const teachers = [
    {
        name: "Farman Farooqui",
        role: "Qur'an & Tajweed mentor",
        focus: "Tajweed · Hifz · Makharij",
        image: MuslimMan,
    },
    {
        name: "Noori Fatima",
        role: "Hadith & Fiqh instructor",
        focus: "Hadith · Fiqh · Adab",
        image: HijabImage,
    },
    {
        name: "Rayyan Farooqui",
        role: "Youth learning mentor",
        focus: "Seerah · Reflection · Youth",
        image: MuslimMan,
    },
];

const testimonials = [
    {
        quote:
            "The structured tajweed lessons helped me understand what I was correcting and why. Learning finally feels consistent.",
        name: "Ahmed Al-Mansoori",
        role: "Quranic Studies learner",
    },
    {
        quote:
            "The teaching is welcoming without losing depth. Beginners are given a clear route into authentic Islamic learning.",
        name: "Fatimah Al-Zahra",
        role: "Islamic studies educator",
    },
    {
        quote:
            "Being able to learn together as a family, then continue individually, has made the experience practical for our home.",
        name: "Layla Hussain",
        role: "Parent and learner",
    },
];

const faqs = [
    {
        question: "Are courses live, self-paced, or both?",
        answer:
            "Both. You can study professionally produced self-paced courses and join live scholar-led classes. Blended pathways bring the two formats together.",
    },
    {
        question: "Do I need an Arabic or Islamic studies background?",
        answer:
            "No. Each course clearly communicates its level, and beginner pathways start from the foundations before moving into deeper study.",
    },
    {
        question: "Can I learn from my phone?",
        answer:
            "Yes. The learning experience is designed for phone, tablet, and desktop, with video playback that adapts to your screen and connection.",
    },
    {
        question: "Will my course progress be saved?",
        answer:
            "Self-paced courses are organised by sections and lessons, allowing you to resume learning and keep track of completed material.",
    },
    {
        question: "Can I choose a male or female instructor?",
        answer:
            "Live learning options include qualified male and female instructors, subject to the chosen programme and teacher availability.",
    },
];

export {
    showcaseStats,
    showcasePath,
    learningFormats,
    featuredCourses,
    platformFeatures,
    teachers,
    testimonials,
    faqs,
};
