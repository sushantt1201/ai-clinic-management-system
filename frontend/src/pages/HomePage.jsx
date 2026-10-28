
import Header from '../components/Header/Header.jsx';
import Hero from '../components/Hero/Hero.jsx';
import About from '../components/About/About.jsx';
import Stats from '../components/Stats/Stats.jsx';
import Services from '../components/Services/Services.jsx';
import Doctors from '../components/Doctors/Doctors.jsx';
import News from '../components/News/News.jsx';
import Newsletter from '../components/Newsletter/Newsletter.jsx';
import Footer from '../components/Footer/Footer.jsx';
import AdSenseAd from '../components/AdSenseAd.jsx';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page" id="home">
      <Header />

      {/* Google AdSense - Top of Home Page */}
      <section className="homepage-ad" aria-label="Advertisement">
        <div className="homepage-ad__container">
          <p className="homepage-ad__label">Advertisement</p>
          <AdSenseAd />
        </div>
      </section>

      <main
        id="main-content"
        className="home-page__canvas"
        aria-label="People's Clinic home page content"
      >
        <Hero />
        <About />
        <Stats />
        <Services />
        <Doctors />
        <News />
        <Newsletter />
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
