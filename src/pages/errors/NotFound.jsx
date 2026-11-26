import { Link } from "react-router-dom";
import { ArrowRight, Compass, Home, Search } from "lucide-react";

const NotFound = () => (
  <main className="grid min-h-[68vh] place-items-center bg-[#fbfcfa] px-4 py-16 text-[#172b24] sm:px-6">
    <section className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#dfe6e2] bg-white shadow-[0_22px_60px_rgba(21,54,44,.08)]" aria-labelledby="not-found-title">
      <div className="bg-[#082f2b] px-7 py-9 text-white sm:px-10 sm:py-11">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#9ed6c8]"><Compass className="size-4 text-[#f4c95d]" />Error 404</p>
        <h1 id="not-found-title" className="mt-4 text-balance font-display text-4xl font-black tracking-[-0.045em] sm:text-5xl">This page could not be found.</h1>
        <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/70 sm:text-base">The link may be outdated, or the page may have moved as DarsLearn’s course and service structure evolved.</p>
      </div>
      <div className="p-7 sm:p-10">
        <p className="text-sm font-bold text-[#52655c]">Choose a reliable place to continue:</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link to="/" className="group rounded-xl border border-[#dfe6e2] p-4 text-[#29443a] no-underline transition hover:border-[#bcd1c7] hover:bg-[#f4f8f6]"><Home className="size-5 text-primary" /><span className="mt-3 block font-black">Home</span><span className="mt-1 block text-xs font-medium text-[#718078]">Return to the platform overview.</span></Link>
          <Link to="/courses" className="group rounded-xl border border-[#dfe6e2] p-4 text-[#29443a] no-underline transition hover:border-[#bcd1c7] hover:bg-[#f4f8f6]"><Search className="size-5 text-primary" /><span className="mt-3 block font-black">Course catalog</span><span className="mt-1 block text-xs font-medium text-[#718078]">Explore structured video courses.</span></Link>
          <Link to="/contact" className="group rounded-xl border border-[#dfe6e2] p-4 text-[#29443a] no-underline transition hover:border-[#bcd1c7] hover:bg-[#f4f8f6]"><ArrowRight className="size-5 text-primary" /><span className="mt-3 block font-black">Contact support</span><span className="mt-1 block text-xs font-medium text-[#718078]">Ask for help finding a page.</span></Link>
        </div>
      </div>
    </section>
  </main>
);

export default NotFound;
