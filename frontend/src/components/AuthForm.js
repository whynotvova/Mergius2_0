import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/styles.css';

const AuthForm = () => {
  return (
    <main className="main-content">
      <h1 className="auth-title">Авторизация</h1>
      <div className="social-auth-primary">
        <img
          src={`${process.env.PUBLIC_URL}/images/auth/phone-white.png`}
          alt="Social Auth"
          className="social-icon-phone"
        />
        <input
          type="number"
          id="phone"
          name="phone"
          placeholder="+7 (___)-___-__-__"
          pattern="\+7\s?[\(][0-9]{3}[\)]\s?[0-9]{3}-[0-9]{2}-[0-9]{2}"
          className="phone-input"
          maxLength="20"
          required
        />
        <Link to="/confirm-auth">
          <img
            src={`${process.env.PUBLIC_URL}/images/auth/next-white.png`}
            alt="Social Auth"
            className="social-icon"
          />
        </Link>
      </div>
      <div className="social-auth-row">
        <button className="social-auth-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/auth/google-logo.png`}
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/auth/yandex-logo.png`}
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/auth/mail-logo.png`}
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/auth/apple-logo.png`}
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
      </div>
      <div className="social-auth-row secondary">
        <button className="social-auth-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/auth/yahoo-logo.png`}
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/auth/vk-logo.png`}
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/auth/meta-logo.png`}
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
      </div>
    </main>
  );
};

export default AuthForm;