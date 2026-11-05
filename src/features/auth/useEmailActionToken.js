import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useEmailActionToken() {
  const location = useLocation(), navigate = useNavigate();
  const [token, setToken] = useState(() => new URLSearchParams(location.hash.slice(1)).get("token") || "");
  useEffect(() => {
    // Email secrets use fragments so they do not reach server access logs.
    // Remove the fragment from browser history once captured in memory.
    if (location.hash) {
      setToken(new URLSearchParams(location.hash.slice(1)).get("token") || "");
      navigate({ pathname: location.pathname, search: location.search, hash: "" }, { replace: true, state: location.state });
    }
  }, [location.hash, location.pathname, location.search, location.state, navigate]);
  return { token, setToken, valid: /^[a-f0-9]{24}\.[A-Za-z0-9_-]{43}$/.test(token) };
}
