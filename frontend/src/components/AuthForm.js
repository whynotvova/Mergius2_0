import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/styles.css';

const AuthForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://mergius.ru';
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/get-csrf-token/`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        } else {
          console.error('Failed to fetch CSRF token');
          setError('Не удалось получить CSRF token');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
        setError('Ошибка подключения к серверу при получении CSRF token');
      }
    };

    fetchCsrfToken();
  }, []);

  useEffect(() => {
    if (location.state?.error && !error) {
      setError(location.state.error);
    }
  }, [location.state, error]);

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.match(/^\+7\d{10}$/)) {
      setError('Введите корректный номер телефона (+7XXXXXXXXXX)');
      return;
    }

    if (!csrfToken) {
      setError('CSRF token отсутствует. Попробуйте обновить страницу.');
      return;
    }

    console.log('Sending request to:', `${BASE_URL}/api/auth/phone/`);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/phone/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Server response:', data);
        throw new Error(data.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.info('Phone auth success:', data);
      navigate('/otp', { state: { phoneNumber, type: 'login' } });
    } catch (err) {
      console.error('Phone auth error:', err.message, err.stack);
      if (err.message.includes('Failed to fetch')) {
        setError('Не удалось подключиться к серверу. Проверьте, что сервер работает, и попробуйте снова.');
      } else {
        setError(`Не удалось отправить запрос: ${err.message}`);
      }
    }
  };

  return (
    <main className="main-content">
      <h1 className="auth-title">Авторизация</h1>
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
        <button
          onClick={handlePhoneAuth}
          className="social-icon-button"
          disabled={!csrfToken} // Disable button until CSRF token is fetched
        >
          <img
            src={`${process.env.PUBLIC_URL}/images/register/next-white.png`}
            alt="Submit"
            className="social-icon"
          />
        </button>
      </div>
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
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

export default AuthForm;