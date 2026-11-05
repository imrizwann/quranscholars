import { useEffect } from "react";
import { useRouteError } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { isModuleLoadError, recoverModuleLoad } from "@/lib/module-load-recovery.js";

export default function RouteErrorPage() {
  const error = useRouteError();
  const moduleError = isModuleLoadError(error);
  const offline = navigator.onLine === false;
  useEffect(() => { recoverModuleLoad(error); }, [error]);
  return <main className="public-access grid min-h-dvh place-items-center px-4 py-10">
    <section className="public-panel w-full max-w-lg" aria-labelledby="route-error-title">
      <div className="public-icon mb-5"><RefreshCw size={22} aria-hidden="true" /></div>
      <div className="public-heading mb-0"><h1 id="route-error-title">{offline ? "You’re offline" : "This page couldn’t load"}</h1>
        <p role="alert">{offline ? "Reconnect to the internet, then refresh this page to continue." : moduleError ? "The site may have been updated. Refresh this page to continue." : "Please refresh the page and try again. If the problem continues, contact our team."}</p>
      </div>
      <div className="public-actions"><button type="button" className="cw-button cw-primary" onClick={() => window.location.reload()}><RefreshCw size={16} aria-hidden="true" />Refresh page</button><a className="cw-button" href="/">Go to home</a></div>
    </section>
  </main>;
}
