import { configureStore } from "@reduxjs/toolkit";
import { authSessionMiddleware } from "@/features/auth/sessionMiddleware.js";
import { setupListeners } from "@reduxjs/toolkit/query";
import instructorCoursesApi from "@/services/api/instructor/recordedCoursesApi.js";
import { instructorSessionMiddleware } from "@/features/instructor-courses/sessionMiddleware.js";
import courseReducer from "@/store/slices/courseSlice.js";
import userAuthApi from "@/services/api/user/userAuthApis.js";
import userSlice from "@/store/slices/userSlice.js";
import admissionApis from "@/services/api/user/admissionApis.js";
import fileUploadApi from "@/services/api/user/fileUploadApis.js";
import paymentApi from "@/services/api/user/paymentApi.js";
import { paymentSessionMiddleware } from "@/features/payments/paymentSessionMiddleware.js";
import courseApi from "@/services/api/courses/courses.api.js";
import adminAdmissionApis from "@/services/api/admin/adminAdmissionApis.js";
import instructorApplicationApi from "@/services/api/user/instructorApplicationApi.js";
import adminInstructorApplicationsApi from "@/services/api/admin/instructorApplicationsApi.js";
export const store = configureStore({
  reducer: {
    [adminInstructorApplicationsApi.reducerPath]: adminInstructorApplicationsApi.reducer,
    [instructorApplicationApi.reducerPath]: instructorApplicationApi.reducer,
    course: courseReducer,
    user: userSlice,
    [instructorCoursesApi.reducerPath]: instructorCoursesApi.reducer,
    [userAuthApi.reducerPath]: userAuthApi.reducer,
    [admissionApis.reducerPath]: admissionApis.reducer,
    [fileUploadApi.reducerPath]: fileUploadApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [courseApi.reducerPath]: courseApi.reducer,
    [adminAdmissionApis.reducerPath]: adminAdmissionApis.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authSessionMiddleware)
      .concat(adminInstructorApplicationsApi.middleware)
      .concat(instructorApplicationApi.middleware)
      .concat(instructorSessionMiddleware, instructorCoursesApi.middleware)
      .concat(userAuthApi.middleware)
      .concat(admissionApis.middleware)
      .concat(fileUploadApi.middleware)
      .concat(paymentSessionMiddleware, paymentApi.middleware)
      .concat(courseApi.middleware)
      .concat(adminAdmissionApis.middleware),
});

setupListeners(store.dispatch);

export default store;
