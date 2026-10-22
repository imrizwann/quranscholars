import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import App from "@/app/App.jsx";
import "@/styles/globals.css";
import { store } from "@/app/store.js";
import ProtectedRoute from "@/components/guards/ProtectedRoute.jsx";
import AdminRoute from "@/components/guards/AdminRoute.jsx";
import InstructorCourseAccess from "@/features/instructor-courses/InstructorCourseAccess.jsx";
import NotLoggedIn from "@/components/guards/NotLoggedIn.jsx";
import CourseRouteRedirect from "@/components/navigation/CourseRouteRedirect.jsx";
import WebSocketClient from "@/realtime/WebSocketClient.jsx";
import BerrySandLmsDemo from "./assets/example themes/berry-sand-lms";
const Home = lazy(() => import("@/pages/home/Home.jsx"));
const Services = lazy(() => import("@/pages/services/Services.jsx"));
const ServicesList = lazy(() => import("@/pages/services/ServicesList.jsx"));
const About = lazy(() => import("@/pages/about/About.jsx"));
const Contact = lazy(() => import("@/pages/contact/Contact.jsx"));
const Donate = lazy(() => import("@/pages/donate/Donate.jsx"));
const Mission = lazy(() => import("@/pages/about/Mission.jsx"));
const Admission = lazy(() => import("@/pages/admissions/Admission.jsx"));
const Login = lazy(() => import("@/pages/auth/Login.jsx"));
const Register = lazy(() => import("@/pages/auth/Register.jsx"));

const RecordedCourses = lazy(
  () => import("@/pages/recorded-courses/RecordedCourses.jsx"),
);
const RecordedCourseDetails = lazy(
  () => import("@/pages/recorded-courses/RecordedCourseDetails.jsx"),
);
const RecordedCoursePlayer = lazy(
  () => import("@/pages/recorded-courses/RecordedCoursePlayer.jsx"),
);
const MyLearning = lazy(() => import("@/pages/account/MyLearning.jsx"));
const LiveClasses = lazy(() => import("@/pages/live-classes/LiveClasses.jsx"));
const LiveClassDetails = lazy(
  () => import("@/pages/live-classes/LiveClassDetails.jsx"),
);
const Classroom = lazy(() => import("@/pages/live-classes/Classroom.jsx"));
const Instructors = lazy(() => import("@/pages/instructors/Instructors.jsx"));
const InstructorProfile = lazy(
  () => import("@/pages/instructors/InstructorProfile.jsx"),
);
const GetStarted = lazy(() => import("@/pages/onboarding/GetStarted.jsx"));
const StudentStart = lazy(() =>
  import("@/pages/onboarding/GetStarted.jsx").then((m) => ({
    default: m.StudentStart,
  })),
);
const InstructorStart = lazy(() =>
  import("@/pages/onboarding/GetStarted.jsx").then((m) => ({
    default: m.InstructorStart,
  })),
);
const WorkspaceLayout = lazy(() => import("@/layouts/WorkspaceLayout.jsx"));
const StudentDashboard = lazy(
  () => import("@/pages/dashboard/StudentDashboard.jsx"),
);
const StudentSectionPage = lazy(
  () => import("@/pages/dashboard/StudentSectionPage.jsx"),
);
const InstructorDashboard = lazy(() =>
  import("@/pages/instructor/InstructorPages.jsx").then((m) => ({
    default: m.InstructorDashboard,
  })),
);
const InstructorSectionPage = lazy(() =>
  import("@/pages/instructor/InstructorPages.jsx").then((m) => ({
    default: m.InstructorSectionPage,
  })),
);
const CreationWizard = lazy(() =>
  import("@/pages/instructor/InstructorPages.jsx").then((m) => ({
    default: m.CreationWizard,
  })),
);
const InstructorApplication = lazy(
  () => import("@/pages/instructor/InstructorApplication.jsx"),
);
const InstructorCourses = lazy(
  () => import("@/pages/instructor/InstructorCourses.jsx"),
);
const CreateRecordedCourse = lazy(
  () => import("@/pages/instructor/CreateRecordedCourse.jsx"),
);
const RecordedCourseWorkspace = lazy(
  () => import("@/pages/instructor/RecordedCourseWorkspace.jsx"),
);
const VideoDeletionStatus = lazy(
  () => import("@/pages/instructor/VideoDeletionStatus.jsx"),
);
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy.jsx"));
const Profile = lazy(() => import("@/pages/account/Profile.jsx"));
const TestPage = lazy(() => import("@/pages/dev/TestPage.jsx"));
const NotFound = lazy(() => import("@/pages/errors/NotFound.jsx"));

const InteractiveLesson = lazy(
  () => import("@/pages/services/InteractiveLesson.jsx"),
);
const EducationalResources = lazy(
  () => import("@/pages/services/EducationalResources.jsx"),
);
const SpiritualDevelopment = lazy(
  () => import("@/pages/services/SpiritualDevelopment.jsx"),
);
const CommunityEngagements = lazy(
  () => import("@/pages/services/CommunityEngagements.jsx"),
);
const PersonalGuidance = lazy(
  () => import("@/pages/services/PersonalGuidance.jsx"),
);
const LanguageSupport = lazy(
  () => import("@/pages/services/LanguageSupport.jsx"),
);
const FamilyFocused = lazy(() => import("@/pages/services/FamilyFocused.jsx"));
const IslamicEvents = lazy(() => import("@/pages/services/IslamicEvents.jsx"));
const YouthPrograms = lazy(() => import("@/pages/services/YouthPrograms.jsx"));
const AccountDeleted = lazy(() => import("@/pages/account/AccountDeleted.jsx"));
const Blogs = lazy(() => import("@/pages/blog/Blogs.jsx"));

const AdminAdmissions = lazy(
  () => import("@/pages/admissions/AdminAdmissions.jsx"),
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        index: true,
        element: <Home />,
      },
      {
        path: "example-theme",
        element: <BerrySandLmsDemo />,
      },
      {
        path: "courses",
        element: <RecordedCourses />,
      },
      {
        path: "courses/self-paced",
        element: <CourseRouteRedirect basePath="/courses" />,
      },
      {
        path: "courses/self-paced/:slug",
        element: <CourseRouteRedirect basePath="/courses" includeSlug />,
      },
      {
        path: "courses/live",
        element: <CourseRouteRedirect basePath="/live-classes" />,
      },
      {
        path: "courses/live/:slug",
        element: <CourseRouteRedirect basePath="/live-classes" includeSlug />,
      },
      {
        path: "recorded-courses",
        element: <CourseRouteRedirect basePath="/courses" />,
      },
      {
        path: "recorded-courses/:slug",
        element: <CourseRouteRedirect basePath="/courses" includeSlug />,
      },
      { path: "courses/:slug", element: <RecordedCourseDetails /> },
      { path: "live-classes", element: <LiveClasses /> },
      { path: "live-classes/:slug", element: <LiveClassDetails /> },
      { path: "instructors", element: <Instructors /> },
      { path: "instructors/:slug", element: <InstructorProfile /> },
      { path: "get-started", element: <GetStarted /> },
      { path: "get-started/student", element: <StudentStart /> },
      { path: "get-started/instructor", element: <InstructorStart /> },
      {
        path: "my-learning",
        element: (
          <ProtectedRoute>
            <CourseRouteRedirect basePath="/dashboard/learning" />
          </ProtectedRoute>
        ),
      },
      {
        path: "learn/:courseSlug/:lessonId",
        element: <ProtectedRoute>{<RecordedCoursePlayer />}</ProtectedRoute>,
      },
      {
        path: "learn/:courseSlug/lesson/:lessonId",
        element: <ProtectedRoute>{<RecordedCoursePlayer />}</ProtectedRoute>,
      },
      { path: "classroom/:liveClassSlug", element: <Classroom /> },
      {
        path: "dashboard",
        element: <WorkspaceLayout type="student" />,
        children: [
          { index: true, element: <StudentDashboard /> },
          { path: "learning", element: <MyLearning /> },
          { path: "assignments", element: <StudentSectionPage /> },
          { path: "wishlist", element: <StudentSectionPage /> },
          { path: "purchases", element: <StudentSectionPage /> },
          { path: "profile", element: <StudentSectionPage /> },
          { path: "settings", element: <StudentSectionPage /> },
        ],
      },
      { path: "instructor/application", element: <InstructorApplication /> },
      {
        path: "instructor",
        element: <WorkspaceLayout type="instructor" />,
        children: [
          { index: true, element: <InstructorDashboard /> },
          { path: "dashboard", element: <InstructorDashboard /> },
          {
            path: "courses",
            element: (
              <InstructorCourseAccess>
                <InstructorCourses />
              </InstructorCourseAccess>
            ),
          },
          {
            path: "courses/new",
            element: (
              <InstructorCourseAccess>
                <CreateRecordedCourse />
              </InstructorCourseAccess>
            ),
          },
          {
            path: "courses/deletions/:deletionId",
            element: (
              <InstructorCourseAccess>
                <VideoDeletionStatus />
              </InstructorCourseAccess>
            ),
          },
          {
            path: "courses/:courseId",
            element: (
              <InstructorCourseAccess>
                <RecordedCourseWorkspace />
              </InstructorCourseAccess>
            ),
          },
          { path: "live-classes", element: <InstructorSectionPage /> },
          { path: "live-classes/new", element: <CreationWizard type="live" /> },
          { path: "students", element: <InstructorSectionPage /> },
          { path: "assignments", element: <InstructorSectionPage /> },
          { path: "resources", element: <InstructorSectionPage /> },
          { path: "earnings", element: <InstructorSectionPage /> },
          { path: "analytics", element: <InstructorSectionPage /> },
          { path: "reviews", element: <InstructorSectionPage /> },
          { path: "profile", element: <InstructorSectionPage /> },
          { path: "settings", element: <InstructorSectionPage /> },
        ],
      },
      {
        path: "services",
        element: <Services />,
        children: [
          { index: true, element: <ServicesList /> },
          {
            path: "courses",
            element: <CourseRouteRedirect basePath="/live-classes" />,
          },
          {
            path: "courses/:slug",
            element: (
              <CourseRouteRedirect basePath="/live-classes" includeSlug />
            ),
          },
          {
            path: "interactive-lessons",
            element: <InteractiveLesson />,
          },
          {
            path: "educational-resources",
            element: <EducationalResources />,
          },
          {
            path: "spiritual-development",
            element: <SpiritualDevelopment />,
          },
          {
            path: "community-engagement",
            element: <CommunityEngagements />,
          },
          {
            path: "personal-guidance",
            element: <PersonalGuidance />,
          },
          {
            path: "language-support",
            element: <LanguageSupport />,
          },
          {
            path: "family-focused-services",
            element: <FamilyFocused />,
          },
          {
            path: "islamic-events",
            element: <IslamicEvents />,
          },
          {
            path: "youth-programs",
            element: <YouthPrograms />,
          },
        ],
      },
      {
        path: "websocket-test",
        element: <WebSocketClient />,
      },
      {
        path: "blogs",
        element: <Blogs />,
      },
      { path: "about", element: <About /> },
      { path: "mission", element: <Mission /> },
      { path: "contact", element: <Contact /> },
      { path: "donate", element: <Donate /> },
      {
        path: "account-deleted",
        element: <AccountDeleted />,
      },
      {
        path: "admission",
        element: <ProtectedRoute>{<Admission />}</ProtectedRoute>,
      },
      {
        path: "login",
        element: <NotLoggedIn>{<Login />}</NotLoggedIn>,
      },
      {
        path: "register",
        element: <NotLoggedIn>{<Register />}</NotLoggedIn>,
      },

      { path: "/privacy", element: <PrivacyPolicy /> },
      {
        path: "/profile",
        element: <ProtectedRoute>{<Profile />}</ProtectedRoute>,
      },
      {
        path: "/admin/admissions",
        element: <AdminRoute><WorkspaceLayout type="admin" /></AdminRoute>,
        children: [{ index: true, element: <AdminAdmissions /> }],
      },
      { path: "/test", element: <TestPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router}>
        <App />
      </RouterProvider>
    </Provider>
  </React.StrictMode>,
);
