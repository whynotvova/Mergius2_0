import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const SocialPhoneForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://backend:8000';

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.match(/^\+7\d{10}$/)) {
      setError('Введите корректный номер телефона (+7XXXXXXXXXX)');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует. Пожалуйста, авторизуйтесь снова.');
      navigate('/register');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/auth/phone-update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Server response:', data);
        throw new Error(data.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.info('Phone update success:', data);
      navigate('/otp', { state: { phoneNumber, type: 'social' } });
    } catch (err) {
      console.error('Phone update error:', err.message, err.stack);
      if (err.message.includes('Failed to fetch')) {
        setError('Не удалось подключиться к серверу. Проверьте, что сервер работает, и попробуйте снова.');
      } else {
        setError(`Не удалось обновить номер телефона: ${err.message}`);
      }
    }
  };

  return (
    <main className="main-content">
      <h1 className="auth-title">Введите номер телефона</h1>
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

export default SocialPhoneForm;