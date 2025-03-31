import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/styles.css';

const RegisterForm = () => {
  return (
    <main className="main-content">
      <h1 className="auth-title">Регистрация</h1>
      <div className="social-auth-primary">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/090a9bb37754e6fc3efa4c045f97b18c8ea0e2b0?placeholderIfAbsent=true"
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
        <Link to="/confirm-reg">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/0e98c47756e127da5079bd71a0c8883592d97627?placeholderIfAbsent=true"
            alt="Social Auth"
            className="social-icon"
          />
        </Link>
      </div>
      <div className="social-auth-row">
        <button className="social-auth-button">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/4818a2c41d90a52a2ee0c6818a9b679025e888db?placeholderIfAbsent=true"
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/d15071ff97a80422f74cb14ebebf7a646e928b74?placeholderIfAbsent=true"
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/fe20e9cfe9b4a3f27051c01c1a773cc4a8766ffb?placeholderIfAbsent=true"
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/0f4db307e336379c5b4834aa4fb97fe9827b2eaf?placeholderIfAbsent=true"
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
      </div>
      <div className="social-auth-row secondary">
        <button className="social-auth-button">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/0ce3317620581bf8b6b71b5c31660c2f5726ee2e?placeholderIfAbsent=true"
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/dabe30cc72ee1909fae7799f1c1d0eb84fe934a6?placeholderIfAbsent=true"
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/35c80b4a3ced40000cccbcdfc32d7e07c3bdfce2?placeholderIfAbsent=true"
            alt="Social Auth"
            className="social-button-icon"
          />
        </button>
      </div>
    </main>
  );
};

export default RegisterForm;