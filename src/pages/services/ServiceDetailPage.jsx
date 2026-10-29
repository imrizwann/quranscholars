import { Link } from "react-router-dom";
import { ArrowRight, Check, CircleHelp, Clock3, ShieldCheck } from "lucide-react";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";
import SectionIntro from "@/components/marketing/SectionIntro.jsx";
import ServiceBreadcrumb from "@/components/navigation/ServiceBreadcrumb.jsx";

const ServiceDetailPage = ({ service }) => {
  const Icon = service.icon;

  return (
    <main className="bg-[#fbfcfa] text-[#172b24]">
      <MarketingHero
        eyebrow={service.category}
        title={service.hero}
        description={service.shortDescription}
        urdu={{
          title: service.urduTitle,
          description: service.urduDescription,
        }}
        icon={Icon}
        primaryAction={{ to: "/contact", label: "Discuss your needs" }}
        secondaryAction={{ to: "/services", label: "Explore all services" }}
        highlights={[
          { label: "Designed for", value: service.audience },
          { label: "Availability", value: service.delivery },
        ]}
        labelledBy={`${service.slug}-title`}
      />

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <ServiceBreadcrumb currentLabel={service.label} />
      </div>

      <section className="px-4 py-14 sm:px-6 sm:py-18" aria-labelledby={`${service.slug}-outcomes`}>
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            id={`${service.slug}-outcomes`}
            eyebrow="What this service supports"
            title="A focused experience with clear learner outcomes."
            description="Every support service is designed to complement structured learning—not add more noise to your schedule."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {service.outcomes.map((outcome, index) => (
              <article key={outcome} className="rounded-2xl border border-[#dfe6e2] bg-white p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-[#e7f3ee] text-sm font-black text-primary">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 text-lg font-black tracking-[-0.02em]">{outcome}</h3>
                <p className="mt-2 text-sm font-medium leading-7 text-[#697970]">Supported through teacher direction, appropriate resources, and a practical next step.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e1e7e3] bg-white px-4 py-14 sm:px-6 sm:py-18" aria-labelledby={`${service.slug}-included`}>
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(22rem,1.2fr)] lg:items-start">
          <SectionIntro
            id={`${service.slug}-included`}
            eyebrow="How it works"
            title="Support that stays connected to your learning path."
            description={service.delivery}
          />
          <div className="rounded-2xl border border-[#dfe6e2] bg-[#f7faf8] p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">What may be included</p>
            <ul className="mt-5 grid gap-3">
              {service.includes.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-[#e2e9e5] bg-white px-4 py-3.5 text-sm font-bold leading-6 text-[#43584f]">
                  <Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-3 border-t border-[#dfe6e2] pt-5 sm:grid-cols-2">
              <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-[#65756e]"><Clock3 className="mt-0.5 size-4 shrink-0 text-primary" />Timing and format are confirmed before you commit.</p>
              <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-[#65756e]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />Teacher availability and learner fit are reviewed first.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-18">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-2xl bg-[#0b3e38] p-7 text-white sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-[#9ed6c8]"><CircleHelp className="size-4 text-[#f4c95d]" />Not sure if this is the right fit?</p>
            <h2 className="mt-3 text-balance font-display text-2xl font-black tracking-[-0.03em] sm:text-3xl">Tell us what you want to learn. We’ll help you find the clearest route.</h2>
          </div>
          <Link to="/contact" className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#f4c95d] px-5 text-sm font-black text-[#11342e] no-underline transition hover:bg-[#ffda79]">Contact learner support <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
        </div>
      </section>
    </main>
  );
};

export default ServiceDetailPage;
