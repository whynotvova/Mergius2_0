import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const Header = ({ isMailPage = false }) => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/auth');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <header className="main-header">
      <div className="logo-container">
        <Link to="/">
          <svg
            width="268"
            height="47"
            viewBox="0 0 268 47"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="logo"
          >
            <path
              d="M0 36.432V0.720002H15.552L26.064 22.944L36.816 0.720002H51.6V36.432H40.368V13.632L29.664 36.432H21.696L11.04 13.632V36.432H0Z"
              fill="#5863F8"
            />
            <path
              d="M76.0309 15.552C71.6629 15.552 70.0309 17.28 69.5029 19.92H82.4629C82.4629 17.904 81.3589 15.552 76.0309 15.552ZM82.6069 27.888H93.9829C93.7909 30.576 91.9669 37.104 77.4229 37.104H75.4549C61.3909 37.104 58.1749 29.568 58.1749 23.424V22.752C58.1749 16.608 61.2469 9.072 74.8309 9.072H76.9429C91.5349 9.072 94.0789 16.656 94.0789 24.192V25.152H69.3589C69.8869 28.128 71.7109 30.192 76.7989 30.192C81.6949 30.192 82.3669 28.368 82.6069 27.888Z"
              fill="#5863F8"
            />
            <path
              d="M111.01 36.432H100.114V9.696H110.914V14.064C111.682 12.768 114.274 9.12 119.986 9.12H120.322C127.234 9.12 129.634 13.776 129.634 19.68C129.634 21.168 129.586 22.032 129.538 23.136H118.546V22.32C118.546 19.056 117.682 17.28 114.994 17.28C112.306 17.28 111.01 19.2 111.01 22.464V36.432Z"
              fill="#5863F8"
            />
            <path
              d="M152.499 16.56H152.067C146.787 16.56 145.395 19.728 145.395 22.272V22.368C145.395 24.864 146.883 28.128 152.067 28.128H152.547C157.539 28.128 159.171 25.008 159.171 22.464V22.272C159.171 19.728 157.491 16.56 152.499 16.56ZM153.459 46.272H151.923C137.187 46.272 135.651 40.608 135.651 37.44V37.248H147.459C147.699 37.872 148.467 39.024 152.643 39.024H153.123C157.491 39.024 159.123 36.864 159.123 33.84V31.968C158.115 32.976 155.331 35.52 148.995 35.52H148.323C137.523 35.52 134.115 28.752 134.115 22.704V21.888C134.115 15.6 137.715 9.168 148.083 9.168H148.611C155.043 9.168 157.923 11.424 159.075 12.336V9.696H169.923V33.408C169.923 40.704 165.987 46.272 153.459 46.272Z"
              fill="#5863F8"
            />
            <path
              d="M188.355 0V7.008H177.363V0H188.355ZM188.307 9.696V36.432H177.411V9.696H188.307Z"
              fill="#5863F8"
            />
            <path
              d="M229.194 9.696V36.432H218.394V32.208C217.242 33.744 213.546 37.104 207.402 37.104H206.922C199.05 37.104 195.69 31.968 195.69 27.024V9.696H206.586V23.328C206.586 26.256 208.122 28.848 212.298 28.848C216.282 28.848 218.298 26.16 218.298 22.944V9.696H229.194Z"
              fill="#5863F8"
            />
            <path
              d="M251.733 37.056H250.437C236.181 37.056 235.077 30.912 235.077 28.224V28.032H246.741C246.885 28.848 247.365 30.576 251.541 30.576H251.637C255.381 30.576 256.293 29.52 256.293 28.368C256.293 27.024 255.621 26.352 251.541 26.112L247.557 25.824C238.149 25.296 235.413 21.792 235.413 17.568V17.28C235.413 12.816 238.245 9.12 250.341 9.12H251.541C265.125 9.12 267.093 13.632 267.093 17.472V17.568H255.765C255.525 16.656 255.141 15.216 251.109 15.216H250.917C247.317 15.216 246.405 16.032 246.405 17.232C246.405 18.528 247.365 19.296 250.917 19.44L254.805 19.584C264.933 19.968 267.573 23.04 267.573 27.6V28.032C267.573 32.448 265.557 37.056 251.733 37.056Z"
              fill="#5863F8"
            />
          </svg>
        </Link>
      </div>
      <nav className="nav-container">
        <button className="nav-button border-button tariffs-btn">Тарифы</button>
        {isMailPage ? (
          <>
            <button className="nav-button border-button profile-btn" onClick={handleProfileClick}>
              Профиль
            </button>
            <button className="nav-button settings-button" onClick={handleSettingsClick}>
              Настройки
            </button>
          </>
        ) : (
          <>
            <button className="nav-button border-button register-btn" onClick={handleRegisterClick}>
              Регистрация
            </button>
            <button className="nav-button login-button" onClick={handleLoginClick}>
              Войти
            </button>
          </>
        )}
        <div className="language-dropdown">
          <button className="language-selector">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/cc751f74dc7742e93ae9e6aa1f7c4713ca3ed208"
              alt="Russia flag"
              className="flag-icon"
            />
            <span className="language-text">RU</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          <div className="dropdown-content">
            <a href="#" className="language-option" data-lang="ru">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/cc751f74dc7742e93ae9e6aa1f7c4713ca3ed208"
                alt="Russia flag"
                className="flag-icon"
              />
              RU
            </a>
            <a href="#" className="language-option" data-lang="en">
              <img
                src="/static/landing/css/img/united-kingdom_1.png"
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