import { motion } from "framer-motion";
import { services } from "@/data/services.js";
import Service from "@/features/home/components/Service.jsx";

const ServicesSection = () => {
  return (
    <section>
      <div>
        <div>
          <div>
            <span />
            Our Services
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>

            
            Guided pathways for every seeker.
          </motion.h2>
          <p>
            Build your journey with Qur&apos;an-first learning, live mentorship,
            family programs, and community khidmah.
          </p>
        </div>

        <div>
          {services.map((service, index) =>
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
              delay: index * 0.05
            }}>
            
              <Service service={service} />
            </motion.div>
          )}
        </div>
      </div>
    </section>);

};

export default ServicesSection;
