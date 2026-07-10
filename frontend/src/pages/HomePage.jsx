import Header from '../components/Header/Header.jsx';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <main id="main-content" className="home-page__canvas" aria-label="People's Clinic home page content" />
    </div>
  );
}

export default HomePage;
