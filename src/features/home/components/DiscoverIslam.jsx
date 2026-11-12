import { Link } from "react-router-dom";
import { highlights, milestones, stats } from "@/data/discoverIslam.js";
import { motion } from "framer-motion";

const revealUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

const DiscoverIslam = () => {
  return (
    <section>
      <div />

      <div>
        <div>
          <div>
            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.5 }}>

              
              <span />
              Illuminating hearts with authentic scholarship
            </motion.div>

            <div>
              <motion.h2
                variants={revealUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.45 }}>

                
                Discover Islam with depth, beauty, and practice.
              </motion.h2>
              <motion.p
                variants={revealUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.45 }}>

                
                Quran Scholar brings live, mentor-led learning that blends
                Qur&apos;an, Sunnah, adab, and spiritual refinement. Study in small
                cohorts, follow curated study plans, and witness your iman grow
                in community.
              </motion.p>
            </div>

            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}>

              
              <p>
                Qur&apos;an & Sunnah Spotlight
              </p>
              <p>
                &quot;The best among you are those who learn the Qur&apos;an and teach
                it.&quot; - Prophetic tradition (Bukhari)
              </p>
              <p>
                Weekly reflections on verses and hadith with practical action
                points for family, work, and community life.
              </p>
              <div>
                <Link
                  to="/courses">

                  
                  Explore Courses
                </Link>
                <Link
                  to="/register">

                  
                  Start My Plan
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={revealUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}>

            
            <div>
              {stats.map((stat) =>
              <div
                key={stat.label}>

                
                  <p>
                    {stat.value}
                  </p>
                  <p>
                    {stat.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p>
                Live & Guided
              </p>
              <p>
                Immersive Learning Capsule
              </p>

              <div>
                {milestones.map((step, idx) =>
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.36,
                    ease: [0.16, 1, 0.3, 1],
                    delay: idx * 0.04
                  }}>

                  
                    <div>
                      {idx + 1}
                    </div>
                    <div>
                      <p>
                        {step.label}
                      </p>
                      <p>
                        {step.detail}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div>
              {highlights.map((item) =>
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}>

                
                  <div>
                    <span />
                    <span>{item.title}</span>
                  </div>
                  <p>
                    {item.body}
                  </p>
                </motion.div>
              )}
            </div>

            <div>
              <p>
                Verse to Live By
              </p>
              <p>
                &quot;Indeed, in the remembrance of Allah do hearts find rest.&quot;
                (Qur&apos;an 13:28)
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>);

};

export default DiscoverIslam;
