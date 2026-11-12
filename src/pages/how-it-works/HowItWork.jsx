import { faUser, faFileAlt, faComments, faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
export default function HowItWorks() {
  return (
    <div>

      <section>
        <div>
          <h1>Learn Islam the Right Way</h1>
          <p>Start your Islamic learning journey in 4 simple steps</p>
        </div>
      </section>

   
      <section>
        <div>
          
          <div>
            <div>
              <FontAwesomeIcon icon={faUser} />
            </div>
            <h3>1. Create Account</h3>
            <p>Register using your email or social media accounts. It takes less than 2 minutes to set up your student profile.</p>
          </div>


          <div>
            <div>
              <FontAwesomeIcon icon={faFileAlt} />
            </div>
            <h3>2. Admission Form</h3>
            <p>Complete our detailed admission form to help us understand your learning goals and current knowledge level.</p>
          </div>

          <div>
            <div>
              <FontAwesomeIcon icon={faComments} />
            </div>
            <h3>3. Coordinator Contact</h3>
            <p>Our admission coordinator will contact you within 24 hours to finalize your learning plan and schedule.</p>
          </div>

          <div>
            <div>
              <FontAwesomeIcon icon={faBookOpen} />
            </div>
            <h3>4. Start Classes</h3>
            <p>Begin your classes within 48 hours with qualified teachers through our interactive online platform.</p>
          </div>
        </div>
      </section>

      <section>
        <div>
          <h2>Why Choose Us</h2>
          <div>
            <div>
              <h3>Qualified Teachers</h3>
              <p>All our instructors are certified with Ijazah and years of teaching experience.</p>
            </div>
            <div>
              <h3>Flexible Schedule</h3>
              <p>Choose class timings that work best for you, 24/7 availability.</p>
            </div>
            <div>
              <h3>Progress Tracking</h3>
              <p>Regular assessments and progress reports to ensure effective learning.</p>
            </div>
          </div>
        </div>
      </section>

  
      <section>
        <h2>Ready to Start Your Learning Journey</h2>
        <Link to={'/register'}>
          Get Started Now
        </Link>
      </section>

      <section>
        <div>
          <h2>Frequently Asked Questions</h2>
          <div>
            <div>
              <h3>What are the technical requirements</h3>
              <p>You just need a stable internet connection, Zoom installed, and a webcam.</p>
            </div>
            <div>
              <h3>Can I choose my teacher</h3>
              <p>Yes, we&apos;ll match you with suitable teachers based on your needs and preferences.</p>
            </div>
            <div>
              <h3>What payment methods do you accept</h3>
              <p>We accept all major credit cards and PayPal. We also offer scholarships.</p>
            </div>
          </div>
        </div>
      </section>
    </div>);

}
