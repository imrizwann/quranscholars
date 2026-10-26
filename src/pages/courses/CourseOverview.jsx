import { Link, useLocation, useParams } from "react-router-dom";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { SiLevelsdotfyi } from "react-icons/si";
import { MdOutlineWatchLater } from "react-icons/md";
import { MdOutlineStarPurple500 } from "react-icons/md";
import { FaArrowRight } from "react-icons/fa";
import { IoMdCheckbox } from "react-icons/io";
import { FaDesktop } from "react-icons/fa6";
import { motion } from "framer-motion";
import { useGetCourseBySlugQuery } from "@/services/api/courses/courses.api.js";
import AppLoader from "@/components/feedback/AppLoader.jsx";
import ServiceBreadcrumb from "@/components/navigation/ServiceBreadcrumb.jsx";
// import { useCoursePaymentMutation } from "@/services/api/user/paymentApi.js";
const CourseOverview = () => {
  const { slug } = useParams();
  const {
    data: course,
    isLoading,
    isError,
    refetch,
  } = useGetCourseBySlugQuery(slug, { skip: !slug });
  const { pathname } = useLocation();
  const isServicesView = pathname.startsWith("/services");


  if (isError || (!isLoading && !course)) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-background px-4 py-16">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black text-foreground">
            Course details are unavailable
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
            We couldn’t load this course. Please try again or return to the
            catalog.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              className="min-h-11 rounded-lg border-0 bg-primary px-5 text-sm font-black text-primary-foreground"
              type="button"
              onClick={refetch}
            >
              Try again
            </button>
            <Link
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-black text-foreground no-underline"
              to="/courses"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <div>
        <div>
          {isLoading ?
          <AppLoader label="Loading course details..." /> :

          <div>
              {isServicesView &&
            <ServiceBreadcrumb
              currentLabel={course?.title || "Course Details"} />

            }
              <div>
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}>

                
                  {!isServicesView &&
                <div>
                      <Link to={"/"}>
                        Home
                      </Link>
                      <span>/</span>
                      <Link to={"/courses"}>
                        Courses
                      </Link>
                      <span>/</span>
                      <Link to={"/live-classes"}>
                        Live classes
                      </Link>
                      <span>/</span>
                      <span>{course.title}</span>
                    </div>
                }

                  <div>
                    <span>
                      <SiLevelsdotfyi />
                      {course.level}
                    </span>
                    <span>
                      <MdOutlineWatchLater />
                      {`${course.duration.value} ${course.duration.unit}`}
                    </span>
                    <span>
                      <MdOutlineStarPurple500 />
                      {course.rating} rating
                    </span>
                  </div>

                  <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}>

                  
                    {course.title}
                  </motion.h1>

                  <p>
                    {course.overview.description ||
                  "Structured mentorship with live sessions, guided practice, and concise resources to master each concept with clarity."}
                  </p>

                  <div>
                    {[
                  {
                    label: "Live + Replay",
                    value: course.mode || "Blended"
                  },
                  { label: "Cohort Size", value: "12–18 learners" },
                  {
                    label: "Language",
                    value: course.language || "EN"
                  }].
                  map((item, idx) =>
                  <div
                    key={idx}>

                    
                        <p>
                          {item.label}
                        </p>
                        <p>
                          {item.value}
                        </p>
                      </div>
                  )}
                  </div>
                </motion.div>

                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}>

                
                  <div>
                    <div>
                      <img

                      src={course.thumbnail}
                      alt={course.title} />
                    
                      <div />
                      <div>
                        Guided by certified instructors
                      </div>
                    </div>
                    <div>
                      <div>
                        <div>
                          <p>
                            Limited offer
                          </p>
                          <div>
                            <span>
                              <LiaRupeeSignSolid />
                              {course.price.amount - course.price.discount}
                            </span>
                            <span>
                              <LiaRupeeSignSolid />
                              {course.price.amount}
                            </span>
                          </div>
                        </div>
                        <div>
                          Save {course.price.discount}
                        </div>
                      </div>

                      <div>
                        <IoMdCheckbox />
                        <span>Includes resources & recordings</span>
                      </div>
                      <div>
                        <IoMdCheckbox />
                        <span>Certificate on completion</span>
                      </div>

                      <Link
                      to="/contact">

                      
                        Ask about enrollment
                        <span>
                          <FaArrowRight />
                        </span>
                      </Link>
                      <p>
                        Secure checkout • Instant access after purchase
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          }
        </div>

        {isLoading ?
        "Loading..." :

        <div>
            <div>
              <p>
                Upcoming live session
              </p>
              <p>
                Next Q&A · Feb 18, 2026 — 8:00 PM
              </p>
              <p>
                Join live or watch the recording; submit questions in advance.
                Recording available within 24 hours.
              </p>
            </div>
          </div>
        }

        {isLoading ?
        "Loading..." :

        <div>
            <div>
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: "easeOut" }}>

              
                <h2>
                  What you will learn
                </h2>
                <ul>
                  {course.overview.whatYouWillLearn.map((wtl, index) =>
                <li
                  key={index}>

                  
                      <IoMdCheckbox />
                      <span>{wtl}</span>
                    </li>
                )}
                </ul>
              </motion.div>

              <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}>

              
                <div>
                  <FaDesktop />
                  <div>
                    <p>
                      Course format
                    </p>
                    <p>
                      Designed for immersion
                    </p>
                  </div>
                </div>
                <ul>
                  {course.overview.courseFormat.map((cf, index) =>
                <li
                  key={index}>

                  
                      <IoMdCheckbox />
                      <span>{cf}</span>
                    </li>
                )}
                </ul>
              </motion.div>
            </div>
          </div>
        }
      </div>
    </>);

};

export default CourseOverview;
