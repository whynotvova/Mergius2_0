import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/styles.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginClick = () => navigate('/auth');
  const handleRegisterClick = () => navigate('/register');
  const handleProfileClick = () => navigate('/profile');
  const handleMailClick = () => navigate('/mail');

  const internalPages = ['/mail', '/email-view', '/calendar', '/compose', '/categories', '/profile', '/account', '/themes', '/security'];
  const isInternalPage = internalPages.includes(location.pathname);

  const isAuthPage = ['/auth', '/confirm-auth'].includes(location.pathname);
  const isRegisterPage = ['/register', '/confirm-reg', '/register-final'].includes(location.pathname);
  const isMailPage = ['/mail', '/email-view', '/calendar', '/compose'].includes(location.pathname);
  const isProfilePage = ['/profile', '/account', '/themes', '/security', '/categories'].includes(location.pathname);

  return (
    <header className="main-header">
      <div className="logo-container">
        <Link to="/">
          <img
            src={`${process.env.PUBLIC_URL}/images/header/Logo.png`}
            alt="Mergius Logo"
            className="logo"
          />
        </Link>
      </div>
      <nav className="nav-container">
        {isInternalPage ? (
          <>
            <button className="nav-button border-button tariffs-btn">Тарифы</button>
            <button
              className={`nav-button border-button ${isProfilePage ? 'active-register' : ''}`}
              onClick={handleProfileClick}
            >
              Профиль
            </button>
            <button
              className={`nav-button mail-button ${isMailPage ? 'active' : ''}`}
              onClick={handleMailClick}
            >
              Почта
            </button>
          </>
        ) : (
          <>
            <button className="nav-button border-button tariffs-btn">Тарифы</button>
            <button
              className={`nav-button border-button ${isRegisterPage ? 'active-register' : ''}`}
              onClick={handleRegisterClick}
            >
              Регистрация
            </button>
            <button
              className={`nav-button login-button ${isAuthPage ? 'active-login' : ''}`}
              onClick={handleLoginClick}
            >
              Войти
            </button>
          </>
        )}
        <div className="language-dropdown">
          <button className="language-selector">
            <img
              src={`${process.env.PUBLIC_URL}/images/header/ru-flag.png`}
              alt="Russia flag"
              className="flag-icon"
            />
            <span className="language-text">RU</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          <div className="dropdown-content">
            <a href="#" className="language-option" data-lang="ru">
              <img
                src={`${process.env.PUBLIC_URL}/images/header/ru-flag.png`}
                alt="Russia flag"
                className="flag-icon"
              />
              RU
            </a>
            <a href="#" className="language-option" data-lang="en">
              <img
                src={`${process.env.PUBLIC_URL}/images/header/en-flag.png`}
                alt="UK flag"
                className="flag-icon"
              />
              EN
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;