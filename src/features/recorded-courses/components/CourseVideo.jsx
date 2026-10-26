import VideoPlayer from "@/components/video-player/VideoPlayer.jsx";
import { VideoOff } from "lucide-react";

// A missing playback URL is an unavailable state, not a loading video.
const CourseVideo = ({ src, poster, title, unavailableTitle = "Preview unavailable", unavailableMessage = "Video preview is not available yet." }) => (
  src ? <VideoPlayer key={typeof src === "string" ? src : src.src} src={src} poster={poster} title={title} /> : (
    <div className="relative grid aspect-video place-items-center overflow-hidden bg-[#061f1c] text-white" role="status">
      {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-contain p-8 opacity-30" />}
      <div className="relative flex max-w-sm flex-col items-center gap-3 px-6 py-5 text-center">
        <VideoOff className="size-8 text-white/70" aria-hidden="true" />
        <p className="text-base font-bold">{unavailableTitle}</p>
        <p className="text-sm leading-6 text-white/75">{unavailableMessage}</p>
      </div>
    </div>
  )
);

export default CourseVideo;
