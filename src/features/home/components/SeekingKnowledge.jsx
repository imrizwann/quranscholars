import SeekingKnowledgeImg from "@/assets/images/seeking-knowledge.svg";

import { seekingKnowledge } from "@/data/seekingKnowledge.js";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SeekingKnowledge = () => {
  return (
    <section>
      <div>
        <div>
          <div>
            <span />
            Seeking Knowledge
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>

            
            Learn with <span>ihsan</span>, act with
            humility, and pass it on.
          </motion.h1>

          <p>
            The first command revealed was{" "}
            <strong>&quot;Iqra&quot; (Read)</strong>. The
            Qur&apos;an and Sunnah call every believer to pursue knowledge that
            illuminates the heart and benefits creation. Join live circles,
            reflect with mentors, and serve by teaching what you learn.
          </p>

          <div>
            <p>
              Prophetic Guidance
            </p>
            <p>
              &quot;Seeking knowledge is an obligation upon every Muslim.&quot; - Hadith
              (Ibn Majah)
            </p>
            <p>
              We weave every module around actionable sunnahs, adab of
              learning, and daily adhkar.
            </p>
          </div>

          <div>
            {seekingKnowledge.map((item) =>
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.42, ease: "easeOut" }}>

              
                <p>
                  {item.title}
                </p>
                <p>{item.body}</p>
              </motion.div>
            )}
          </div>

          <div>
            <Link to="/register">
              Start Learning
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>

          
          <div>
            <div>
              IQRA
            </div>
            <div>
              <p>
                Live & Guided
              </p>
              <p>
                Knowledge Capsule
              </p>
            </div>
          </div>

          <img

            src={SeekingKnowledgeImg}
            alt="Interactive learning illustration" />
          
        </motion.div>
      </div>
    </section>);

};

export default SeekingKnowledge;
