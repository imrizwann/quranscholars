import VideoPlayer from "@/components/video-player/VideoPlayer.jsx";

// A missing playback URL is an unavailable state, not a loading video.
const CourseVideo = ({ src, poster, title, unavailableMessage = "Video preview is not available yet." }) => (
  src ? <VideoPlayer key={src} src={src} poster={poster} title={title} /> : (
    <div className="relative grid aspect-video place-items-center overflow-hidden bg-[#061f1c] text-white" role="status">
      {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-contain p-8 opacity-30" />}
      <p className="relative px-6 text-center text-sm font-semibold">{unavailableMessage}</p>
    </div>
  )
);

export default CourseVideo;
