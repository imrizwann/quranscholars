import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { isHLSProvider } from "@vidstack/react";
import { LockKeyhole } from "lucide-react";
import instructorCoursesApi from "@/services/api/instructor/recordedCoursesApi.js";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import { userMessage } from "@/lib/user-messages.js";
import { lessonPlaybackSource, createPlaybackSession } from "@/lib/lesson-playback.js";
const VideoPlayer = lazy(() => import("@/components/video-player/VideoPlayer.jsx"));

export default function ProtectedLessonVideo(props) {
  const { courseId, sectionId, lessonId } = props.target;
  return <LessonVideo key={`${courseId}/${sectionId}/${lessonId}`} {...props} />;
}

function LessonVideo({ target, title = "Lesson preview", poster, startTime = 0, onPlaybackProgress, onPlaybackPlay, onPlaybackPause, onPlaybackSeek, onEnded }) {
  const query = instructorCoursesApi.endpoints.getLessonPlayback.useQuery(target, {
    pollingInterval: 120_000, refetchOnFocus: true, refetchOnReconnect: true, refetchOnMountOrArgChange: true,
  });
  const grant = useRef(null);
  const source = useRef(null);
  const refresh = useRef(query.refetch);
  const session = useRef(null);
  const player = useRef(null);
  const position = useRef({ time: Number.isFinite(startTime) && startTime > 0 ? startTime : 0, playing: false });
  const restorePending = useRef(true);
  const [unsupported, setUnsupported] = useState(false);
  grant.current = query.currentData || null;
  refresh.current = query.refetch;
  const nextSource = lessonPlaybackSource(query.currentData);
  // Token rotation must not reload the media element or reset playback position.
  if (nextSource && source.current?.src !== nextSource.src) source.current = nextSource;
  const denied = query.error && [401, 403, 404].includes(query.error.status);
  const deniedRef = useRef(false);
  deniedRef.current = Boolean(denied);
  useEffect(() => () => { session.current?.dispose(); grant.current = null; }, []);
  const configure = useCallback((provider) => {
    if (!provider) return;
    restorePending.current = true;
    session.current?.dispose();
    if (!isHLSProvider(provider)) { setUnsupported(true); return; }
    const requests = createPlaybackSession({
      getGrant: () => deniedRef.current ? null : grant.current,
      refresh: async () => {
        const result = await refresh.current().unwrap();
        grant.current = result;
        return result;
      },
    });
    session.current = requests;
    provider.config = {
      ...provider.config,
      xhrSetup: async (xhr, url) => {
        const access = await requests.authorize(url);
        xhr.open("GET", access.url, true);
        xhr.withCredentials = false;
        xhr.setRequestHeader("Authorization", access.authorization);
      },
      fetchSetup: async (context, init) => {
        const access = await requests.authorize(context.url);
        const headers = new Headers(init.headers);
        headers.set("Authorization", access.authorization);
        return new Request(access.url, { ...init, headers, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer", cache: "no-store" });
      },
    };
  }, []);
  if (query.isLoading) return <div className="cw-preview-placeholder"><LoadingState label="Checking video access" /></div>;
  if (unsupported) return <div className="cw-preview-placeholder" role="status"><LockKeyhole size={28} aria-hidden="true" /><strong>Browser update needed</strong><p>Please use a current browser to watch this protected lesson.</p></div>;
  if (!source.current || denied) return <div className="cw-preview-placeholder" role={query.error ? "alert" : "status"}><LockKeyhole size={28} aria-hidden="true" /><strong>{denied ? "Lesson access required" : "Playback unavailable"}</strong><p>{query.error ? userMessage(query.error) : "Refresh to check your access to this lesson."}</p><button type="button" className="cw-button" disabled={query.isFetching} onClick={query.refetch}>{query.isFetching ? "Checking access…" : "Refresh playback"}</button></div>;
  return <div className="protected-lesson-video"><Suspense fallback={<div className="cw-preview-placeholder"><LoadingState label="Opening lesson" /></div>}><VideoPlayer src={source.current} crossOrigin="anonymous" title={title} poster={poster} className="cw-preview-player" playerRef={player} onProviderSetup={configure}
    onTimeUpdate={() => { if (player.current && !restorePending.current) { position.current.time = player.current.currentTime; onPlaybackProgress?.({ currentTime: player.current.currentTime, duration: player.current.duration }); } }}
    onPlay={() => { position.current.playing = true; onPlaybackPlay?.({ currentTime: player.current?.currentTime || 0 }); }} onPause={() => { if (player.current?.canPlay) position.current.playing = false; onPlaybackPause?.({ currentTime: player.current?.currentTime || 0 }); }}
    onSeeked={() => { onPlaybackSeek?.({ currentTime: player.current?.currentTime || 0 }); }}
    onCanPlay={() => { if (player.current && restorePending.current) { restorePending.current = false; const duration = player.current.duration; const time = Number.isFinite(duration) && duration > 0 && position.current.time >= duration - 2 ? 0 : position.current.time; if (time > 0) player.current.currentTime = time; if (position.current.playing) player.current.play().catch(() => {}); } }}
    onEnded={() => { position.current.time = 0; position.current.playing = false; onEnded?.({ currentTime: player.current?.duration || 0 }); }}
    onRetry={query.refetch} errorMessage="Your video could not load. Try again to refresh your playback access." /></Suspense></div>;
}
