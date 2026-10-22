import instructorCoursesApi from "../../services/api/instructor/recordedCoursesApi.js";

// Do not let private cached data or in-flight responses cross account changes.
export const instructorSessionMiddleware =
  ({ getState, dispatch }) =>
  (next) =>
  (action) => {
    const previous = getState().user?.user;
    const result = next(action);
    if (action.type === "user/setUser") {
      const current = getState().user?.user;
      if (previous?._id !== current?._id || previous?.role !== current?.role) {
        dispatch(instructorCoursesApi.util.getRunningQueriesThunk()).forEach(
          (request) => request.abort(),
        );
        dispatch(instructorCoursesApi.util.getRunningMutationsThunk()).forEach(
          (request) => request.abort(),
        );
        dispatch(instructorCoursesApi.util.resetApiState());
      }
    }
    return result;
  };
