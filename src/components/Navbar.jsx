import './Navbar.css';

const Navbar = ({ setActiveTab, onOpenAuth, isAdmin = false }) => {
  return (
    <nav className="navbar">

      <div
        className="logo"
        onClick={() => setActiveTab('home')}
        style={{ cursor: 'pointer' }}
      >
        <div className="logo-icon">R</div>
        RankWorld AI
      </div>

      <ul className="nav-links">

        <li
          onClick={() => setActiveTab('home')}
          style={{ cursor: 'pointer' }}
        >
          Home
        </li>

        <li
          onClick={() => setActiveTab('mock-tests')}
          style={{ cursor: 'pointer' }}
        >
          Mock Tests
        </li>

        <li
          onClick={() => setActiveTab('pricing')}
          style={{ cursor: 'pointer' }}
        >
          Pricing
        </li>

        <li
          onClick={() => setActiveTab('about')}
          style={{ cursor: 'pointer' }}
        >
          About
        </li>

        {isAdmin && <li onClick={() => setActiveTab('admin')} style={{ cursor: 'pointer' }}>Admin Panel</li>}

        <li
          onClick={() => setActiveTab('contact')}
          style={{ cursor: 'pointer' }}
        >
          Contact Us
        </li>

      </ul>

      <div className="nav-actions">

        <span
          className="login-link"
          onClick={onOpenAuth}
          style={{ cursor: 'pointer' }}
        >
          Login
        </span>

        <button
          className="get-started-btn"
          onClick={onOpenAuth}
        >
          Get Started
        </button>

      </div>

    </nav>
  );
};

export default Navbar;