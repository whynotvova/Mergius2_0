import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/styles.css';

const RegisterForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://backend:8000';
  const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'https://mergius.ru';

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }

    try {
      if (window.MR) {
        window.MR.init({
          clientId: 'e42f6a45b608469a8baa432e4b96f803',
          onlogin: (state) => {
            if (state.user) {
              console.info('MR.login:', state);
              handleSocialCallback('mailru', state);
            } else {
              setError('Ошибка авторизации Mail.ru');
            }
          },
          onlogout: () => {
            console.info('MR.logout');
          },
        });
      } else {
        console.warn('Mail.ru SDK not loaded');
      }
    } catch (err) {
      console.error('Mail.ru SDK error:', err);
      setError('Не удалось загрузить Mail.ru SDK');
    }

    try {
      if (window.YaAuthSuggest) {
        window.YaAuthSuggest.init(
          {
            client_id: '44396cc4dfe94deabbb7f0292b8f156d',
            response_type: 'token',
            redirect_uri: `${BASE_URL}/complete/yandex-oauth2/`,
          },
          FRONTEND_URL,
          { view: 'button' }
        )
          .then(({ handler }) => handler())
          .then((data) => {
            console.log('Yandex token:', data);
            handleSocialCallback('yandex', data);
          })
          .catch((error) => {
            console.error('Yandex SDK error:', error);
            setError('Ошибка Яндекс авторизации');
          });
      } else {
        console.warn('Yandex SDK not loaded');
      }
    } catch (err) {
      console.error('Yandex SDK error:', err);
      setError('Не удалось загрузить Яндекс SDK');
    }
  }, [location]);

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.match(/^\+7\d{10}$/)) {
      setError('Введите корректный номер телефона (+7XXXXXXXXXX)');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/auth/phone/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Server response:', data);
        throw new Error(data.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.info('Phone auth success:', data);
      navigate('/otp', { state: { phoneNumber, type: 'register' } });
    } catch (err) {
      console.error('Phone auth error:', err.message, err.stack);
      if (err.message.includes('Failed to fetch')) {
        setError('Не удалось подключиться к серверу. Проверьте, что сервер работает, и попробуйте снова.');
      } else {
        setError(`Не удалось подключиться к серверу: ${err.message}`);
      }
    }
  };

  const handleSocialAuth = (provider) => {
    setError('');
    try {
      if (provider === 'mailru') {
        if (window.MR) {
          window.MR.login();
        } else {
          setError('Mail.ru SDK не загружен');
        }
      } else if (provider === 'yandex') {
        if (window.YaAuthSuggest) {
          window.YaAuthSuggest.init(
            {
              client_id: '44396cc4dfe94deabbb7f0292b8f156d',
              response_type: 'token',
              redirect_uri: `${BASE_URL}/complete/yandex-oauth2/`,
            },
            FRONTEND_URL,
            { view: 'button' }
          )
            .then(({ handler }) => handler())
            .catch((error) => {
              console.error('Yandex error:', error);
              setError('Ошибка Яндекс авторизации');
            });
        } else {
          setError('Yandex SDK не загружен');
        }
      } else {
        window.location.href = `${BASE_URL}/auth/login/${provider}/`;
      }
    } catch (err) {
      console.error('Social auth error:', err);
      setError(`Ошибка авторизации через ${provider}`);
    }
  };

  const handleSocialCallback = async (provider, state) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/social/${provider}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Social auth response:', data);
        throw new Error(data.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.info('Social auth success:', data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', data.user_id);
      navigate('/social-phone');
    } catch (err) {
      console.error('Social callback error:', err.message, err.stack);
      if (err.message.includes('Failed to fetch')) {
        setError('Не удалось подключиться к серверу. Проверьте, что сервер работает, и попробуйте снова.');
      } else {
        setError(err.message.includes('email') ? err.message : `Ошибка авторизации: ${err.message}`);
      }
    }
  };

  return (
    <main className="main-content">
      <h1 className="auth-title">Регистрация</h1>
      <div className="social-auth-primary">
        <img
          src={`${process.env.PUBLIC_URL}/images/register/phone-white.png`}
          alt="Phone Auth"
          className="social-icon-phone"
        />
        <input
          type="text"
          id="phone"
          name="phone"
          placeholder="+7 (___)-___-__-__"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="phone-input"
          maxLength="20"
          required
        />
        <button onClick={handlePhoneAuth} className="social-icon-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/register/next-white.png`}
            alt="Submit"
            className="social-icon"
          />
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="social-auth-row">
        <button className="social-auth-button" onClick={() => handleSocialAuth('google-oauth2')}>
          <img
            src={`${process.env.PUBLIC_URL}/images/register/google-logo.png`}
            alt="Google Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button" onClick={() => handleSocialAuth('yandex')}>
          <img
            src={`${process.env.PUBLIC_URL}/images/register/yandex-logo.png`}
            alt="Yandex Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button" onClick={() => handleSocialAuth('mailru')}>
          <img
            src={`${process.env.PUBLIC_URL}/images/register/mail-logo.png`}
            alt="Mail.ru Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button" onClick={() => handleSocialAuth('apple-id')}>
          <img
            src={`${process.env.PUBLIC_URL}/images/register/apple-logo.png`}
            alt="Apple Auth"
            className="social-button-icon"
          />
        </button>
      </div>
      <div className="social-auth-row secondary">
        <button className="social-auth-button" onClick={() => handleSocialAuth('yahoo')}>
          <img
            src={`${process.env.PUBLIC_URL}/images/register/yahoo-logo.png`}
            alt="Yahoo Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button" onClick={() => handleSocialAuth('vk-oauth2')}>
          <img
            src={`${process.env.PUBLIC_URL}/images/register/vk-logo.png`}
            alt="VK Auth"
            className="social-button-icon"
          />
        </button>
        <button className="social-auth-button" onClick={() => handleSocialAuth('facebook')}>
          <img
            src={`${process.env.PUBLIC_URL}/images/register/facebook-logo.png`}
            alt="Meta Auth"
            className="social-button-icon"
          />
        </button>
      </div>
      <a href="https://t.me/mergius_support_bot" target="_blank" rel="noopener noreferrer" className="support-button">
        <img
          src={`${process.env.PUBLIC_URL}/images/mail/customer-support.png`}
          alt="Customer Support"
          className="support-icon"
        />
      </a>
    </main>
  );
};

export default RegisterForm;