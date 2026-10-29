import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, Check, Headphones, Radio } from "lucide-react";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";
import SectionIntro from "@/components/marketing/SectionIntro.jsx";
import { serviceCatalog, serviceCategories } from "@/data/servicesData.js";

const ServicesList = () => (
  <main className="bg-[#fbfcfa] text-[#172b24]">
    <MarketingHero
      eyebrow="Learner services"
      title="More than courses. Support for the whole learning journey."
      description="Find the right mix of structured study, teacher guidance, family support, and community learning—without having to navigate a confusing list of disconnected programs."
      urdu={{
        title: "صرف کورس نہیں، آپ کے پورے تعلیمی سفر میں رہنمائی",
        description: "درست کورس کے انتخاب سے لے کر ذاتی، خاندانی اور تعلیمی معاونت تک، قرآن اسکالر آپ کو واضح اور منظم انداز میں آگے بڑھنے میں مدد دیتا ہے۔",
      }}
      icon={Headphones}
      primaryAction={{ to: "/courses", label: "Browse courses" }}
      secondaryAction={{ to: "/contact", label: "Talk to learner support" }}
      highlights={[
        { label: "Learning formats", value: "Live instruction and flexible self-paced study" },
        { label: "Support model", value: "Human guidance before, during, and after enrolment" },
        { label: "Built for", value: "Individuals, young learners, families, and communities" },
      ]}
      labelledBy="services-title"
    />

    <section className="px-4 py-14 sm:px-6 sm:py-18" aria-labelledby="services-directory-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionIntro
            id="services-directory-title"
            eyebrow="Explore support"
            title="Choose the kind of help you need."
            description="Start with a service area below. We’ll confirm suitability, format, and availability before any commitment."
          />
          <div className="flex flex-wrap gap-2" aria-label="Service categories">
            {serviceCategories.map(({ name, icon: Icon }) => (
              <span key={name} className="inline-flex items-center gap-2 rounded-full border border-[#dbe5e0] bg-white px-3 py-2 text-xs font-black text-[#53665e]">
                <Icon className="size-3.5 text-primary" />{name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serviceCatalog.map(({ slug, label, category, icon: Icon, shortDescription }) => (
            <article key={slug} className="group flex min-h-full flex-col rounded-2xl border border-[#dfe6e2] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#bdd1c8]">
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-xl bg-[#e7f3ee] text-primary"><Icon className="size-5" /></span>
                <span className="rounded-full bg-[#f3f6f4] px-2.5 py-1 text-[0.63rem] font-black uppercase tracking-[0.1em] text-[#697970]">{category}</span>
              </div>
              <h2 className="mt-6 text-xl font-black tracking-[-0.025em]">{label}</h2>
              <p className="mt-3 flex-1 text-sm font-medium leading-7 text-[#687970]">{shortDescription}</p>
              <Link to={`/services/${slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-primary no-underline">
                Explore service <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="border-y border-[#e1e7e3] bg-white px-4 py-14 sm:px-6 sm:py-18" aria-labelledby="learning-first-title">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-[#0b3e38] p-7 text-white sm:p-9">
          <Radio className="size-6 text-[#f4c95d]" />
          <h2 id="learning-first-title" className="mt-5 font-display text-3xl font-black tracking-[-0.04em]">Looking for a course first?</h2>
          <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-white/70">Compare self-paced study with scheduled, teacher-led cohorts in the unified course catalog.</p>
          <Link to="/courses" className="group mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#f4c95d] px-4 text-sm font-black text-[#11342e] no-underline">Explore all courses <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
        </div>
        <div className="rounded-2xl border border-[#dfe6e2] bg-[#f7faf8] p-7 sm:p-9">
          <BookOpenCheck className="size-6 text-primary" />
          <h2 className="mt-5 font-display text-3xl font-black tracking-[-0.04em]">Not sure where to begin?</h2>
          <ul className="mt-5 grid gap-3">
            {["Tell us your goals and current level", "Get a course or service recommendation", "Confirm schedule, teacher, and next steps"].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm font-bold leading-6 text-[#53665e]"><Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={3} />{item}</li>
            ))}
          </ul>
          <Link to="/contact" className="group mt-7 inline-flex items-center gap-2 text-sm font-black text-primary no-underline">Contact learner support <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
        </div>
      </div>
    </section>
  </main>
);

export default ServicesList;
