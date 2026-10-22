import { useCallback } from "react";
import { useSelector } from "react-redux";
import instructorCoursesApi from "@/services/api/instructor/recordedCoursesApi.js";

export function pollingInterval(data, error, shouldPoll) {
  if (!shouldPoll) return 0;
  if (error) {
    // Authorization, missing resources and invalid requests need user action.
    if (
      typeof error.status === "number" &&
      error.status >= 400 &&
      error.status < 500 &&
      error.status !== 429
    )
      return 0;
    return 30_000;
  }
  return shouldPoll(data) ? 15_000 : 0;
}

// RTK Query owns requests, cache, deduplication and polling. This adapter keeps
// the existing loading UI consistent and never exposes a previous page's data.
export default function useCourseQuery(
  endpoint,
  args,
  shouldPoll,
  skip = false,
) {
  const { useQuery, useQueryState } = instructorCoursesApi.endpoints[endpoint];
  const canPoll = useSelector((store) => {
    const config = store[instructorCoursesApi.reducerPath].config;
    return config.focused && config.online;
  });
  const state = useQueryState(args, { skip });
  const interval = pollingInterval(state.currentData, state.error, shouldPoll);
  const query = useQuery(args, {
    skip,
    pollingInterval: canPoll ? interval : 0,
    skipPollingIfUnfocused: true,
    refetchOnFocus: interval > 0,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const { isUninitialized, refetch } = query;
  const refresh = useCallback(() => {
    if (!isUninitialized) return refetch();
  }, [isUninitialized, refetch]);
  return {
    data: query.currentData,
    error: query.error,
    loading: !skip && (query.isLoading || query.isFetching),
    refresh,
  };
}
