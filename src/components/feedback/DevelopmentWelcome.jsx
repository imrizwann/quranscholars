import { useEffect, useRef } from "react";
import { BookOpen, Heart, X } from "lucide-react";

// Mounted once by App: shown on fresh loads, not on client-side navigation.
export default function DevelopmentWelcome() {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const restoreScroll = () => {
      if (dialog.open) return;
      document.body.style.overflow = previousOverflow;
    };

    dialog.addEventListener("close", restoreScroll);
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.removeEventListener("close", restoreScroll);
      dialog.close();
      restoreScroll();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="development-welcome-title"
      aria-describedby="development-welcome-description"
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg overflow-x-hidden overflow-y-auto rounded-3xl border border-[#dfe6e2] bg-[#fbfcfa] p-0 text-[#172b24] shadow-2xl backdrop:bg-[#041e1a]/70 backdrop:backdrop-blur-sm"
    >
      <div className="relative bg-[#082f2b] px-6 pb-8 pt-10 text-white sm:px-9">
        <button
          type="button"
          onClick={() => dialogRef.current.close()}
          aria-label="Close welcome message"
          className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c95d]"
        >
          <X className="size-5" />
        </button>
        <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-white/10 text-[#f4c95d]">
          <BookOpen className="size-7" aria-hidden="true" />
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a6dace]">Assalamu alaikum</p>
        <h2 id="development-welcome-title" className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">
          Welcome to DarsLearn
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/75">We’re glad you’re here and excited to share this learning journey with you.</p>
      </div>
      <div className="px-6 py-7 sm:px-9 sm:py-8">
        <span className="inline-flex rounded-full border border-[#ead69c] bg-[#fff5d8] px-3 py-1 text-xs font-bold text-[#705315]">Website under development</span>
        <p id="development-welcome-description" className="mt-4 text-sm leading-7 text-[#53665e]">
          We’re still building and improving DarsLearn. You’re welcome to explore, but some features may be incomplete and some content is for demonstration. Things may change as we prepare for launch.
        </p>
        <p className="mt-5 flex items-start gap-2.5 text-sm font-semibold leading-7 text-[#234b40]">
          <Heart className="mt-1 size-5 shrink-0" aria-hidden="true" />
          Thank you for visiting, and for your patience and support as we bring DarsLearn to life.
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => dialogRef.current.close()}
          className="mt-7 min-h-12 w-full rounded-xl bg-[#174d42] px-5 text-sm font-bold text-white transition hover:bg-[#103c33] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#174d42]"
        >
          Thank you - let’s explore
        </button>
      </div>
    </dialog>
  );
}
