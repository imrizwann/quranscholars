import { userMessage } from "./user-messages.js";
import { enrollmentFailureMessage } from "../features/payments/enrollment-feedback.js";

const feedback = (pending, title, description) => ({ pending, success: () => ({ title, description, type: "success" }) });
const studio = {
  updateAvailability: feedback("Updating course availability…", "Course availability updated", "Existing learners keep their access and progress."),
  createCourse: feedback("Creating course…", "Course created", "Your draft is ready. Add sections, lessons, and videos in Course Studio."),
  createSection: feedback("Adding section…", "Section added", "You can now add lessons to this section."),
  createLesson: feedback("Adding lesson…", "Lesson added", "Add a video and review the lesson before publishing."),
  updateCourse: feedback("Saving course details…", "Course details saved"),
  updateSection: feedback("Saving section…", "Section updated"),
  updateLesson: feedback("Saving lesson…", "Lesson updated"),
  updatePricing: feedback("Saving pricing…", "Pricing updated"),
  uploadThumbnail: feedback("Uploading course cover…", "Course cover updated"),
  saveSectionQuiz: feedback("Saving quiz…", "Quiz saved"),
  publishCourse: feedback("Publishing course…", "Course published", "Your course is available in the catalogue. Enrolled learners can access its lessons."),
  deleteCourse: feedback("Starting course deletion…", "Course deletion started", "Follow the deletion page for the final status."),
  deleteSection: feedback("Removing section…", "Section removal started", "Its lessons and files are being removed."),
  deleteLesson: feedback("Removing lesson…", "Lesson removal started", "Its video files are being removed."),
  deleteVideo: feedback("Removing video…", "Video removal started"),
};
const actions = {
  instructorCoursesApi: studio,
  instructorApplicationApi: {
    submitInstructorApplication: { pending: "Submitting your application…", success: data => data.application?.status === "pending"
      ? { type: "success", title: data.application.revision > 1 ? "Application resubmitted" : "Application submitted", description: "Your teaching details and certificates are saved for review. You can continue learning while you wait." }
      : { type: "info", title: "Application status updated", description: "Check your application for the latest review decision." } },
  },
  adminInstructorApplicationsApi: {
    reviewInstructorApplication: { pending: "Saving review decision…", success: data => ({ type: "success", title: data.application?.status === "approved" ? "Instructor approved" : "Review decision saved", description: "The applicant can see the decision and feedback in their account." }) },
  },
  learnerApi: {
    updateLearningLibrary: { pending: "Updating your library…", success: data => ({ type: "success", title: { hide: "Course hidden", restore: "Course restored", leave: "You left the course" }[data.action], description: data.action === "leave" ? "Your progress is saved. Rejoining depends on course availability and current enrollment options." : "Your course access and learning progress are unchanged." }) },
    enrollFreeCourse: { pending: "Enrolling in course…", error: enrollmentFailureMessage, success: data => data.status === "ACTIVE" ? { type: "success", title: "You're enrolled", description: "Your course is ready in My learning." } : { type: "info", title: "Enrollment status updated", description: "Check your course access before starting a lesson." } },
    updateLearnerProfile: feedback("Saving profile…", "Learning profile updated"),
    submitSectionQuiz: feedback("Submitting answers…", "Quiz submitted", "Your results are ready to review."),
  },
  paymentApi: {
    verifyCourseCheckout: { pending: "Confirming your payment…", error: () => "Your payment is awaiting confirmation. Check payment status before paying again.", success: data => data.state === "paid"
      ? { type: "success", title: "Payment confirmed", description: "Your course is ready in My learning." }
      : null },
    createCourseCheckout: { pending: "Preparing your checkout…", error: enrollmentFailureMessage, success: data => data.state === "paid"
      ? { type: "success", title: "Payment confirmed", description: "Your course access is being checked. Open My learning when enrollment is confirmed." }
      : data.state === "pending" ? { type: "info", title: "Checkout prepared", description: "Complete payment to enroll. Course access starts after payment is confirmed." }
      : { type: "info", title: "Payment status updated", description: "Check the payment details on this page before trying again." } },
  },
  fileUploadApi: { uploadAvatar: feedback("Updating profile photo…", "Profile photo updated") },
};

export function actionFeedback(api, endpoint) { return actions[api]?.[endpoint]; }
export function actionFailure(config, error) { return { type: "error", title: `${config.pending.replace(/…$/, "")} failed`, description: (config.error || userMessage)(error) }; }
