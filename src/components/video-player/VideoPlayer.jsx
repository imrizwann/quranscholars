import { CaptionButton, Captions, Controls, FullscreenButton, Gesture, MediaPlayer, MediaProvider, PIPButton, Poster, SeekButton, Spinner, Time, Track, useMediaState } from "@vidstack/react";
import { Captions as CaptionsIcon, Maximize, Minimize, PictureInPicture, RotateCcw, RotateCw, Subtitles } from "lucide-react";
import PlayerPlayButton from "./controls/PlayerPlayButton";
import PlayerSettings from "./controls/PlayerSettings";
import PlayerTimeSlider from "./controls/PlayerTimeSlider";
import PlayerVolumeControl from "./controls/PlayerVolumeControl";
import "./video-player.css";

const PlayerStatus = ({ errorMessage }) => {
  const waiting = useMediaState("waiting");
  const canPlay = useMediaState("canPlay");
  const error = useMediaState("error");
  if (error) return <div className="player-message" role="alert"><strong>Video unavailable</strong><span>{errorMessage || error.message || "Please refresh the page or try again later."}</span></div>;
  if (!canPlay || waiting) return <div className="player-buffering" aria-label="Video is loading"><Spinner.Root className="player-spinner"><Spinner.Track className="player-spinner-track" /><Spinner.TrackFill className="player-spinner-fill" /></Spinner.Root></div>;
  return null;
};

const PlayerCenterControl = () => {
  const canPlay = useMediaState("canPlay");
  const waiting = useMediaState("waiting");
  const error = useMediaState("error");
  if (!canPlay || waiting || error) return null;
  return <div className="player-center-controls"><PlayerPlayButton large /></div>;
};

const VideoPlayer = ({ src, title = "Course lesson", poster, tracks = [], thumbnails, className = "", autoPlay = false, muted = false, loop = false, playsInline = true, crossOrigin = "anonymous", onEnded, onTimeUpdate, aspectRatio = "16 / 9", errorMessage }) => {
  return (
    <MediaPlayer
      className={`qs-video-player ${className}`}
      style={{ aspectRatio }}
      title={title}
      src={src}
      autoPlay={autoPlay} muted={muted} loop={loop} playsInline={playsInline} crossOrigin={crossOrigin}
      keyShortcuts={{ togglePaused: "k Space", toggleMuted: "m", toggleFullscreen: "f", seekBackward: "ArrowLeft", seekForward: "ArrowRight", toggleCaptions: "c" }}
      onEnded={onEnded} onTimeUpdate={onTimeUpdate}
    >
      <MediaProvider>
        {poster && <Poster src={poster} alt={`${title} poster`} className="player-poster" />}
        {tracks.map((track) => <Track key={`${track.src}-${track.srclang || track.language}`} {...track} />)}
      </MediaProvider>
      <Captions className="player-captions" />
      <PlayerStatus errorMessage={errorMessage} />
      <Gesture className="absolute inset-0" event="pointerup" action="toggle:paused" />
      <Gesture className="absolute inset-0" event="dblpointerup" action="toggle:fullscreen" />
      <Controls.Root className="player-controls">
        <Controls.Group className="player-top-controls"><span className="player-title">{title}</span></Controls.Group>
        <PlayerCenterControl />
        <Controls.Group className="player-bottom-controls">
          <PlayerTimeSlider thumbnails={thumbnails} />
          <div className="player-control-row"><div className="player-control-cluster"><PlayerPlayButton /><SeekButton seconds={-10} className="player-control-button player-skip-button" aria-label="Rewind 10 seconds"><RotateCcw /><span>10</span></SeekButton><SeekButton seconds={10} className="player-control-button player-skip-button" aria-label="Forward 10 seconds"><RotateCw /><span>10</span></SeekButton><PlayerVolumeControl /><div className="player-time"><Time type="current" /><span>/</span><Time type="duration" /></div></div><div className="player-control-cluster"><CaptionButton className="player-control-button player-caption-button" aria-label="Toggle captions"><CaptionsIcon className="caption-off" /><Subtitles className="caption-on" /></CaptionButton><PlayerSettings /><PIPButton className="player-control-button player-pip-button" aria-label="Picture in picture"><PictureInPicture /></PIPButton><FullscreenButton className="player-control-button" aria-label="Toggle fullscreen"><Maximize className="fullscreen-enter" /><Minimize className="fullscreen-exit" /></FullscreenButton></div></div>
        </Controls.Group>
      </Controls.Root>
    </MediaPlayer>
  );
};

export default VideoPlayer;
