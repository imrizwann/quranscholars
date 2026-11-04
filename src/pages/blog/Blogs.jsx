import { useMemo, useState } from "react";
import { FiSearch, FiTag, FiClock } from "react-icons/fi";
import { motion } from "framer-motion";
import Steps from "@/assets/images/blog/steps.jpg";
import Tajweed from "@/assets/images/blog/tajweed.jpg";
import Sunnah from "@/assets/images/blog/sunnah.jpg";
import RighteousKids from "@/assets/images/blog/righteous-kids.webp";
import PillarsOfIslam from "@/assets/images/blog/pillars-of-islam.webp";
import VirtueOfKnowledge from "@/assets/images/blog/virtue-of-knowledge.jpg";
import HifzTips from "@/assets/images/blog/hifz-tips.jpg";
import KhushuSalah from "@/assets/images/blog/khushu-salah.jpg";
import AllahNames from "@/assets/images/blog/names-of-Allah.webp";
import OnlineClass from "@/assets/images/blog/online-class.jpeg";

const blogPosts = [
{
  title: "5 Simple Steps to Start Learning the Quran",
  description:
  "Start your Quranic journey with practical steps to build consistency, connection, and comprehension - even as a beginner.",
  image: Steps,
  link: "/blog/quran-learning",
  category: "Quran Learning",
  tags: ["Beginner", "Quran", "Tips"]
},
{
  title: "Importance of Tajweed in Daily Recitation",
  description:
  "Understand how Tajweed rules not only improve recitation but deepen your spiritual experience with the Quran.",
  image: Tajweed,
  link: "/blog/tajweed-importance",
  category: "Quran Recitation",
  tags: ["Tajweed", "Pronunciation", "Worship"]
},
{
  title: "Daily Sunnahs to Revive in Your Routine",
  description:
  "Discover practical daily Sunnahs of the Prophet you can bring into your life for blessings and barakah.",
  image: Sunnah,
  link: "/blog/daily-sunnahs",
  category: "Sunnah & Lifestyle",
  tags: ["Sunnah", "Daily Life", "Habits"]
},
{
  title: "Raising Righteous Children in Today's World",
  description:
  "Explore key Islamic parenting principles to help raise confident, faith-based children in modern society.",
  image: RighteousKids,
  link: "/blog/raising-righteous-children",
  category: "Family & Parenting",
  tags: ["Parenting", "Children", "Family"]
},
{
  title: "Virtues of Seeking Knowledge in Islam",
  description:
  "Uncover the significance of 'Ilm in Islam and how every Muslim is commanded to seek beneficial knowledge.",
  image: VirtueOfKnowledge,
  link: "/blog/virtue-of-knowledge",
  category: "Islamic Values",
  tags: ["Knowledge", "Hadith", "Learning"]
},
{
  title: "How to Memorize the Quran Effectively",
  description:
  "Strategies and advice for developing discipline, consistency, and love for Hifz from teachers and huffaz.",
  image: HifzTips,
  link: "/blog/quran-memorization",
  category: "Hifz & Memorization",
  tags: ["Hifz", "Memorization", "Discipline"]
},
{
  title: "Etiquettes of Attending Online Islamic Classes",
  description:
  "Adab for students learning remotely: how to maintain respect, focus, and spiritual readiness online.",
  image: OnlineClass,
  link: "/blog/online-class-etiquette",
  category: "Student Manners",
  tags: ["Adab", "Online Learning", "Students"]
},
{
  title: "Understanding the Pillars of Islam",
  description:
  "An overview of the five pillars that shape the Muslim's relationship with Allah and the community.",
  image: PillarsOfIslam,
  link: "/blog/pillars-of-islam",
  category: "Aqidah & Basics",
  tags: ["Islam Basics", "Pillars", "Foundations"]
},
{
  title: "How to Develop Khushu in Salah",
  description:
  "Tips and heart-softeners to improve focus, awareness, and humility in your daily prayers.",
  image: KhushuSalah,
  link: "/blog/khushu-salah",
  category: "Worship & Salah",
  tags: ["Salah", "Khushu", "Spirituality"]
},
{
  title: "Exploring Names and Attributes of Allah (Asma'ul Husna)",
  description:
  "Get closer to Allah by learning and reflecting on His beautiful names and their meanings.",
  image: AllahNames,
  link: "/blog/names-of-allah",
  category: "Aqidah & Theology",
  tags: ["Asmaul Husna", "Aqidah", "Faith"]
}];


const Blogs = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set();
    blogPosts.forEach((post) => set.add(post.category));
    return ["All", ...Array.from(set)];
  }, []);

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return blogPosts.filter((post) => {
      const matchesCategory =
      activeCategory === "All" || post.category === activeCategory;
      const haystack =
      `${post.title} ${post.description} ${post.tags.join(" ")}`.toLowerCase();
      const matchesTerm = term ? haystack.includes(term) : true;
      return matchesCategory && matchesTerm;
    });
  }, [search, activeCategory]);

  return (
    <main className="bg-[#fbfcfa] text-[#172b24]">
      <section className="relative isolate overflow-hidden bg-[#082f2b] px-4 py-14 text-white sm:px-6 sm:py-18" aria-labelledby="blog-title">
        <div className="absolute inset-0 -z-10 opacity-65 [background-image:radial-gradient(circle_at_88%_12%,rgba(116,201,178,.25),transparent_28%),radial-gradient(circle_at_4%_96%,rgba(244,201,93,.12),transparent_30%)]" aria-hidden="true" />
        <motion.div className="mx-auto max-w-7xl" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#a6dacf]"><FiTag className="text-[#f4c95d]" />Learning library</p>
          <h1 id="blog-title" className="mt-5 max-w-4xl text-balance font-display text-[clamp(2.65rem,6vw,5.1rem)] font-black leading-[1.01] tracking-[-0.05em]">Ideas that support learning beyond the lesson.</h1>
          <p className="mt-6 max-w-3xl text-pretty text-base font-medium leading-8 text-white/72 sm:text-lg">Explore practical study guidance, Quran and Tajweed foundations, family learning, and reflections for building consistent Islamic habits.</p>
        </motion.div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-[#dfe6e2] bg-white p-4 shadow-[0_12px_36px_rgba(21,54,44,.05)] sm:p-5">
            <label className="relative block">
              <span className="sr-only">Search articles</span>
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-primary" />
              <input id="resource-search" name="search" aria-label="Search articles" className="min-h-12 w-full rounded-xl border border-[#d8e2dd] bg-[#fbfcfa] pl-11 pr-4 text-sm font-semibold outline-none transition placeholder:text-[#98a59f] focus:border-primary focus:ring-4 focus:ring-[#0f766e]/10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics, tags, or keywords" />
            </label>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filter articles by category">
              {categories.map((category) => (
                <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={`min-h-9 shrink-0 rounded-full px-4 text-xs font-black transition ${activeCategory === category ? "bg-[#0f766e] text-white shadow-sm" : "border border-[#dce5e1] bg-white text-[#5b6f65] hover:border-[#b9cec4] hover:text-primary"}`}>{category}</button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Articles</p><h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">{filteredPosts.length} {filteredPosts.length === 1 ? "result" : "results"}</h2></div>
            {(search || activeCategory !== "All") && <button type="button" onClick={() => { setSearch(""); setActiveCategory("All"); }} className="text-sm font-black text-primary">Clear filters</button>}
          </div>

          {filteredPosts.length > 0 ? (
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post, index) => (
                <motion.article key={post.title} className="group overflow-hidden rounded-2xl border border-[#dfe6e2] bg-white shadow-[0_10px_32px_rgba(21,54,44,.045)]" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.3, delay: Math.min(index * 0.035, 0.18) }}>
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#e6f2ed]"><img src={post.image} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.035]" /><span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#082f2b]/90 px-3 py-1.5 text-[0.65rem] font-black text-white backdrop-blur"><FiClock />{post.category}</span></div>
                  <div className="p-6">
                    <h3 className="text-balance text-xl font-black leading-snug tracking-[-0.025em]">{post.title}</h3>
                    <p className="mt-3 text-sm font-medium leading-7 text-[#687970]">{post.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-[#edf4f1] px-2.5 py-1 text-[0.65rem] font-black text-[#547066]">{tag}</span>)}</div>
                    <div className="mt-6 border-t border-[#e5ebe8] pt-4"><span className="text-xs font-black uppercase tracking-[0.12em] text-[#7a8982]">Article library - Coming soon</span></div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-[#cad8d1] bg-white px-6 py-14 text-center"><FiSearch className="mx-auto text-2xl text-primary" /><h2 className="mt-4 text-xl font-black">No articles match those filters.</h2><p className="mt-2 text-sm font-medium text-[#687970]">Try another term or reset the category.</p></div>
          )}
        </div>
      </section>
    </main>);

};

export default Blogs;
