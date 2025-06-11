import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/styles.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ru');

  // Переводы
  const translations = {
    ru: {
      tariffs: 'Тарифы',
      profile: 'Профиль',
      mail: 'Почта',
      register: 'Регистрация',
      login: 'Войти',
      language: 'RU',
    },
    en: {
      tariffs: 'Tariffs',
      profile: 'Profile',
      mail: 'Mail',
      register: 'Register',
      login: 'Login',
      language: 'EN',
    },
  };

  // Handle language change
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && savedLanguage !== language) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleLoginClick = () => navigate('/auth');
  const handleRegisterClick = () => navigate('/register');
  const handleProfileClick = () => navigate('/profile');
  const handleMailClick = () => navigate('/mail');
  const handleTariffsClick = () => navigate('/tarifs');

  const internalPages = [
    '/mail',
    '/email-view',
    '/calendar',
    '/compose',
    '/categories',
    '/profile',
    '/account',
    '/themes',
    '/security',
    '/faq',
    '/tarifs',
  ];
  const isInternalPage = internalPages.includes(location.pathname);

  const isAuthPage = ['/auth', '/confirm-auth'].includes(location.pathname);
  const isRegisterPage = ['/register', '/confirm-reg', '/register-final'].includes(location.pathname);
  const isMailPage = ['/mail', '/email-view', '/calendar', '/compose'].includes(location.pathname);
  const isProfilePage = ['/profile', '/account', '/themes', '/security', '/categories', '/faq'].includes(location.pathname);
  const isTariffsPage = location.pathname === '/tarifs';

  const handleLogoClick = () => {
    if (isAuthenticated) {
      navigate('/mail');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="main-header">
      <div className="logo-container">
        <Link to="#" onClick={handleLogoClick}>
          <img
            src={`${process.env.PUBLIC_URL}/images/header/Logo.png`}
            alt="Mergius Logo"
            className="logo"
          />
        </Link>
      </div>
      <nav className="nav-container">
        {isAuthenticated ? (
          <>
            <button
              className={`nav-button border-button tariffs-btn ${isTariffsPage ? 'active-tariffs' : ''}`}
              onClick={handleTariffsClick}
            >
              {translations[language].tariffs}
            </button>
            <button
              className={`nav-button border-button ${isProfilePage ? 'active-register' : ''}`}
              onClick={handleProfileClick}
            >
              {translations[language].profile}
            </button>
            <button
              className={`nav-button mail-button ${isMailPage ? 'active' : ''}`}
              onClick={handleMailClick}
            >
              {translations[language].mail}
            </button>
          </>
        ) : (
          <>
            <button
              className={`nav-button border-button tariffs-btn ${isTariffsPage ? 'active-tariffs' : ''}`}
              onClick={handleTariffsClick}
            >
              {translations[language].tariffs}
            </button>
            <button
              className={`nav-button border-button ${isRegisterPage ? 'active-register' : ''}`}
              onClick={handleRegisterClick}
            >
              {translations[language].register}
            </button>
            <button
              className={`nav-button login-button ${isAuthPage ? 'active-login' : ''}`}
              onClick={handleLoginClick}
            >
              {translations[language].login}
            </button>
          </>
        )}
        <div className="language-dropdown">
          <button className="language-selector">
            <img
              src={`${process.env.PUBLIC_URL}/images/header/${language === 'ru' ? 'ru-flag' : 'en-flag'}.png`}
              alt={`${language === 'ru' ? 'Russia' : 'UK'} flag`}
              className="flag-icon"
            />
            <span className="language-text">{translations[language].language}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          <div className="dropdown-content">
            <a
              href="#"
              className="language-option"
              data-lang="ru"
              onClick={(e) => {
                e.preventDefault();
                handleLanguageChange('ru');
              }}
            >
              <img
                src={`${process.env.PUBLIC_URL}/images/header/ru-flag.png`}
                alt="Russia flag"
                className="flag-icon"
              />
              RU
            </a>
            <a
              href="#"
              className="language-option"
              data-lang="en"
              onClick={(e) => {
                e.preventDefault();
                handleLanguageChange('en');
              }}
            >
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