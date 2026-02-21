import Navbar from '../components/navbar';
import Hero from '../components/hero';
import About from '../components/about';
import Experience from '../components/experience';
import Education from '../components/education';
import ProjectsSection from '../components/projects-section';
import CertificationsSection from '../components/certifications-section';
import Contact from '../components/contact';
import ToastContainer from '../components/toast';
import './Portfolio.css';

export default function Portfolio() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Experience />
      <Education />
      <ProjectsSection />
      <CertificationsSection />
      <Contact />
      <footer className="portfolio-footer">
        <p>© {new Date().getFullYear()} Ahed Abu Shahen.</p>
      </footer>
      <ToastContainer />
    </>
  );
}
