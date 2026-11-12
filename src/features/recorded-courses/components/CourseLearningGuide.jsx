export default function CourseLearningGuide() {
  return (
      <section
        id="how-courses-work"
        aria-labelledby="how-courses-title"
        className="scroll-mt-24 border-t border-[#dfe6e2] bg-white px-4 py-14 sm:px-6"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">
            Your learning journey
          </p>
          <h2
            id="how-courses-title"
            className="mt-2 font-display text-3xl font-black"
          >
            How courses work
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              [
                "Choose your subject",
                "Browse by subject and level to find a course that fits your interests and experience.",
              ],
              [
                "Explore the course",
                "Review the learning outcomes, video lesson outline, instructor, price and access terms before enrolling.",
              ],
              [
                "Learn at your own pace",
                "Follow the recorded lessons in order and revisit topics as you build your understanding.",
              ],
            ].map(([title, description], index) => (
              <li
                key={title}
                className="rounded-xl border border-[#dfe6e2] p-6"
              >
                <span className="text-sm font-black text-primary">
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-display text-xl font-black">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#68766f]">
                  {description}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 max-w-3xl space-y-3">
            {[
              [
                "What does a course include?",
                "Each course has its own recorded lesson outline. Check its details for included resources, prerequisites and learning outcomes.",
              ],
              [
                "How long can I access a course?",
                "Review the access terms on the course details page before enrolling. Access duration and pricing depend on the course.",
              ],
              [
                "Where do I continue learning?",
                "Open My Learning from your account to find your enrolled courses and continue your lessons.",
              ],
            ].map(([question, answer]) => (
              <details
                key={question}
                className="rounded-xl border border-[#dfe6e2] p-5"
              >
                <summary className="cursor-pointer font-bold">
                  {question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-[#68766f]">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
  );
}
