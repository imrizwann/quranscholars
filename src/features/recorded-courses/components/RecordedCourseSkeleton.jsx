const RecordedCourseSkeleton = ({ featured = false }) => (
  <div
    className={`overflow-hidden rounded-xl border border-border bg-surface${featured ? " recorded-course-skeleton--featured" : ""}`}
    aria-hidden="true"
  >
    <div className="recorded-course-skeleton-media aspect-video animate-pulse motion-reduce:animate-none bg-[#e8efeb]" />
    <div className="recorded-course-skeleton-content space-y-3 p-5">
      <div className="h-3 w-24 animate-pulse motion-reduce:animate-none rounded bg-[#e8efeb]" />
      <div className="h-6 w-full animate-pulse motion-reduce:animate-none rounded bg-[#e8efeb]" />
      <div className="h-4 w-2/3 animate-pulse motion-reduce:animate-none rounded bg-[#e8efeb]" />
      <div className="h-4 w-full animate-pulse motion-reduce:animate-none rounded bg-[#eef2f0]" />
      <div className="h-4 w-5/6 animate-pulse motion-reduce:animate-none rounded bg-[#eef2f0]" />
      {featured && <>
        <div className="h-4 w-1/2 animate-pulse motion-reduce:animate-none rounded bg-[#eef2f0]" />
        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <div className="h-6 w-20 animate-pulse motion-reduce:animate-none rounded bg-[#e8efeb]" />
          <div className="h-11 w-28 animate-pulse motion-reduce:animate-none rounded bg-[#e8efeb]" />
        </div>
      </>}
    </div>
  </div>
);

export default RecordedCourseSkeleton;
