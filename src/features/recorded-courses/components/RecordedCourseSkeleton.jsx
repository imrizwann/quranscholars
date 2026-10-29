const RecordedCourseSkeleton = () => (
  <div
    className="overflow-hidden rounded-2xl border border-border bg-white"
    aria-hidden="true"
  >
    <div className="aspect-video animate-pulse motion-reduce:animate-none bg-[#e8efeb]" />
    <div className="space-y-3 p-5">
      <div className="h-3 w-24 animate-pulse motion-reduce:animate-none rounded bg-[#e8efeb]" />
      <div className="h-6 w-full animate-pulse motion-reduce:animate-none rounded bg-[#e8efeb]" />
      <div className="h-4 w-2/3 animate-pulse motion-reduce:animate-none rounded bg-[#e8efeb]" />
      <div className="h-4 w-full animate-pulse motion-reduce:animate-none rounded bg-[#eef2f0]" />
      <div className="h-4 w-5/6 animate-pulse motion-reduce:animate-none rounded bg-[#eef2f0]" />
    </div>
  </div>
);

export default RecordedCourseSkeleton;
