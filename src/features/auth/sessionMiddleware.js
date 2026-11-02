import fileUploadApi from "../../services/api/user/fileUploadApis.js";
import learnerApi from "../../services/api/user/learnerApi.js";
import admissionApis from "../../services/api/user/admissionApis.js";
import adminAdmissionApis from "../../services/api/admin/adminAdmissionApis.js";
import instructorApplicationApi from "../../services/api/user/instructorApplicationApi.js";
import adminInstructorApplicationsApi from "../../services/api/admin/instructorApplicationsApi.js";
import notificationsApi from "../../services/api/user/notificationsApi.js";

// Instructor and purchase caches have their own matching session middleware.
export const authSessionMiddleware = ({ getState, dispatch }) => (next) => (action) => {
  const previous = getState().user?.user;
  const result = next(action);
  if (action.type === "user/setUser") {
    const current = getState().user?.user;
    if (previous?._id !== current?._id || previous?.role !== current?.role) {
      dispatch({ type: "realtime/setRealtimeConnected", payload: false });
      for (const api of [notificationsApi, learnerApi, fileUploadApi, admissionApis, adminAdmissionApis, instructorApplicationApi, adminInstructorApplicationsApi]) {
        dispatch(api.util.getRunningQueriesThunk()).forEach((request) => request.abort());
        dispatch(api.util.getRunningMutationsThunk()).forEach((request) => request.abort());
        dispatch(api.util.resetApiState());
      }
    }
  }
  return result;
};
