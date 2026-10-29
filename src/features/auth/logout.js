import userAuthApi from "../../services/api/user/userAuthApis.js";
import fileUploadApi from "../../services/api/user/fileUploadApis.js";
import admissionApis from "../../services/api/user/admissionApis.js";
import adminAdmissionApis from "../../services/api/admin/adminAdmissionApis.js";
import { setUser } from "../../store/slices/userSlice.js";

export async function logoutSession(logout, dispatch) {
  // Keep the current session intact if the server cannot clear its cookie.
  await logout().unwrap();
  for (const api of [userAuthApi, fileUploadApi, admissionApis, adminAdmissionApis]) {
    dispatch(api.util.getRunningQueriesThunk()).forEach((request) => request.abort());
    dispatch(api.util.getRunningMutationsThunk()).forEach((request) => request.abort());
    dispatch(api.util.resetApiState());
  }
  // Existing session middleware also clears instructor and purchase data.
  dispatch(setUser(null));
}
