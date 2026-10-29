import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { isHLSProvider } from "@vidstack/react";
import { LockKeyhole } from "lucide-react";
import instructorCoursesApi from "@/services/api/instructor/recordedCoursesApi.js";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import { userMessage } from "@/lib/user-messages.js";
import { lessonPlaybackSource, renewLessonRequest } from "@/lib/lesson-playback.js";
const VideoPlayer = lazy(() => import("@/components/video-player/VideoPlayer.jsx"));

export default function ProtectedLessonVideo({ target, title = "Lesson preview", poster }) {
  const query = instructorCoursesApi.endpoints.getLessonPlayback.useQuery(target, {
    pollingInterval: 120_000, refetchOnFocus: true, refetchOnReconnect: true, refetchOnMountOrArgChange: true,
  });
  const grant = useRef(null);
  const firstSource = useRef(null);
  const player = useRef(null);
  const position = useRef({ time: 0, playing: false });
  const [native, setNative] = useState(false);
  const [expired, setExpired] = useState(false);
  const source = lessonPlaybackSource(query.currentData);
  grant.current = source?.src || null;
  if (source && (!firstSource.current || new URL(firstSource.current.src).pathname !== new URL(source.src).pathname || new URL(firstSource.current.src).origin !== new URL(source.src).origin)) firstSource.current = source;
  useEffect(() => {
    setExpired(false);
    if (!query.currentData) return;
    const timer = setTimeout(() => setExpired(true), Math.max(0, Date.parse(query.currentData.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [query.currentData]);
  const configure = useCallback((provider) => {
    if (!provider) return;
    const hls = isHLSProvider(provider);
    setNative(!hls);
    if (hls) provider.config = {
      ...provider.config,
      xhrSetup: (xhr, url) => xhr.open("GET", renewLessonRequest(url, grant.current), true),
      fetchSetup: (context, init) => new Request(renewLessonRequest(context.url, grant.current), init),
    };
  }, []);
  const denied = query.error && [401, 403, 404].includes(query.error.status);
  if (query.isLoading) return <div className="cw-preview-placeholder"><LoadingState label="Checking video access" /></div>;
  if (!source || expired || denied) return <div className="cw-preview-placeholder" role={query.error ? "alert" : "status"}><LockKeyhole size={28} aria-hidden="true" /><strong>{denied ? "Lesson access required" : "Playback unavailable"}</strong><p>{query.error ? userMessage(query.error) : "Your playback session has expired. Refresh to check your access again."}</p><button type="button" className="cw-button" disabled={query.isFetching} onClick={query.refetch}>{query.isFetching ? "Checking access…" : "Refresh playback"}</button></div>;
  return <div className="protected-lesson-video"><Suspense fallback={<div className="cw-preview-placeholder"><LoadingState label="Opening lesson" /></div>}><VideoPlayer src={native ? source : firstSource.current} title={title} poster={poster} className="cw-preview-player" playerRef={player} onProviderSetup={configure}
    onTimeUpdate={() => { if (player.current?.currentTime > 0) position.current.time = player.current.currentTime; }}
    onPlay={() => { position.current.playing = true; }} onPause={() => { if (player.current?.canPlay) position.current.playing = false; }}
    onCanPlay={() => { if (player.current && position.current.time > 0 && player.current.currentTime < 1) { player.current.currentTime = position.current.time; if (position.current.playing) player.current.play().catch(() => {}); } }}
    onRetry={query.refetch} errorMessage="Your video could not load. Try again to refresh your secure playback session." /></Suspense></div>;
}
