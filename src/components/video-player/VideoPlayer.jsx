import { useState } from "react";
import { CaptionButton, Captions, Controls, FullscreenButton, Gesture, isHLSProvider, MediaPlayer, MediaProvider, PIPButton, Poster, SeekButton, Spinner, Time, Track, useMediaState } from "@vidstack/react";
import { Captions as CaptionsIcon, Maximize, Minimize, PictureInPicture, RotateCcw, RotateCw, Subtitles } from "lucide-react";
import PlayerPlayButton from "./controls/PlayerPlayButton";
import PlayerSettings from "./controls/PlayerSettings";
import PlayerTimeSlider from "./controls/PlayerTimeSlider";
import PlayerVolumeControl from "./controls/PlayerVolumeControl";
import "./video-player.css";

const configureProvider = (provider) => {
  if (isHLSProvider(provider)) {
    // Ship the installed version with the app instead of loading a runtime CDN script.
    provider.library = () => import("hls.js");
  }
};

const PlayerStatus = ({ errorMessage, onRetry }) => {
  const waiting = useMediaState("waiting");
  const canPlay = useMediaState("canPlay");
  const error = useMediaState("error");
  if (error) return <div className="player-message" role="alert"><strong>Video unavailable</strong><span>{errorMessage || "We could not play this video. Check your connection and try again."}</span><button type="button" className="player-retry-button" onClick={onRetry}>Try again</button></div>;
  if (!canPlay || waiting) return <div className="player-buffering" role="status" aria-label="Video is loading"><Spinner.Root className="player-spinner" aria-hidden="true"><Spinner.Track className="player-spinner-track" /><Spinner.TrackFill className="player-spinner-fill" /></Spinner.Root></div>;
  return null;
};

const PlayerCenterControl = () => {
  const canPlay = useMediaState("canPlay");
  const waiting = useMediaState("waiting");
  const error = useMediaState("error");
  if (!canPlay || waiting || error) return null;
  return <div className="player-center-controls"><PlayerPlayButton large /></div>;
};

const VideoPlayer = ({ src, title = "Course lesson", poster, tracks = [], thumbnails, className = "", autoPlay = false, muted = false, loop = false, playsInline = true, crossOrigin = "anonymous", onEnded, onTimeUpdate, aspectRatio = "16 / 9", errorMessage, playerRef, onProviderSetup, onCanPlay, onPlay, onPause, onRetry }) => {
  const [attempt, setAttempt] = useState(0);
  const sourceKey = typeof src === "string" ? src : src?.src;
  return (
    <MediaPlayer
      ref={playerRef}
      key={`${sourceKey}-${attempt}`}
      className={`qs-video-player ${className}`}
      style={{ "--player-aspect-ratio": aspectRatio }}
      title={title}
      src={src}
      viewType="video"
      streamType="on-demand"
      load="visible"
      preload="metadata"
      onProviderChange={(provider) => { configureProvider(provider); onProviderSetup?.(provider); }}
      autoPlay={autoPlay} muted={muted} loop={loop} playsInline={playsInline} crossOrigin={crossOrigin}
      keyShortcuts={{ togglePaused: "k Space", toggleMuted: "m", toggleFullscreen: "f", seekBackward: "ArrowLeft", seekForward: "ArrowRight", toggleCaptions: "c" }}
      onEnded={onEnded} onTimeUpdate={onTimeUpdate}
      onCanPlay={onCanPlay} onPlay={onPlay} onPause={onPause}
    >
      <MediaProvider>
        {poster && <Poster src={poster} alt={`${title} poster`} className="player-poster" />}
        {tracks.map((track) => <Track key={`${track.src}-${track.srclang || track.language}`} {...track} />)}
      </MediaProvider>
      <Captions className="player-captions" />
      <PlayerStatus errorMessage={errorMessage} onRetry={() => { onRetry?.(); setAttempt((value) => value + 1); }} />
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
