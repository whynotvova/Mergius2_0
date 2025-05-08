import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

// List of countries for the dropdown
const countries = [
  'Russia',
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Canada',
  'Australia',
  'Japan',
  'China',
  'India',
  'Brazil',
  'South Africa',
  'Mexico',
  'South Korea',
  'Argentina',
  'Netherlands',
  'Sweden',
  'Switzerland'
];

const RegisterFinal = () => {
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const checkUsernameAvailability = async (username) => {
    try {
      const response = await fetch(`http://localhost:8000/api/auth/username/check/?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data.available; // true if username is available, false if taken
    } catch (err) {
      console.error('Username check error:', err.message, err.stack);
      throw new Error('Не удалось проверить имя пользователя');
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!isPrivacyAgreed) {
      setError('Вы должны согласиться с политикой конфиденциальности и условиями использования');
      return;
    }

    if (!username.trim()) {
      setError('Введите имя пользователя');
      return;
    }

    if (!country) {
      setError('Выберите страну');
      return;
    }

    if (!dateOfBirth) {
      setError('Введите дату рождения');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует. Пожалуйста, авторизуйтесь снова.');
      navigate('/register');
      return;
    }

    try {
      // Check username availability
      const isUsernameAvailable = await checkUsernameAvailability(username);
      if (!isUsernameAvailable) {
        setError('Это имя пользователя уже занято');
        return;
      }

      const response = await fetch('http://localhost:8000/api/auth/profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          username,
          country,
          date_of_birth: dateOfBirth,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Server response:', data);
        throw new Error(data.detail || `HTTP error ${response.status}`);
      }

      console.info('Profile update success');
      navigate('/mail');
    } catch (err) {
      console.error('Profile update error:', err.message, err.stack);
      setError(`Не удалось обновить профиль: ${err.message}`);
      if (err.message.includes('Учетные данные не были предоставлены')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        navigate('/register', { state: { error: 'Сессия истекла. Пожалуйста, авторизуйтесь снова.' } });
      }
    }
  };

  return (
    <main className="registration">
      <h1 className="registration__title">Регистрация</h1>
      <div className="registration__form">
        <div className="social-login">
          <img
            src={`${process.env.PUBLIC_URL}/images/register/user-white.png`}
            alt="Social Login Option 1"
            className="social-login__icon"
          />
          <input
            type="text"
            placeholder="Введите имя пользователя"
            className="registration__field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength="150"
            required
          />
        </div>
        <div className="social-login">
          <img
            src={`${process.env.PUBLIC_URL}/images/register/birthday-white.png`}
            alt="Social Login Option 2"
            className="social-login__icon"
          />
          <input
            type="date"
            className="registration__field"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>
        <div className="social-login">
          <img
            src={`${process.env.PUBLIC_URL}/images/register/geo-white.png`}
            alt="Social Login Option 3"
            className="social-login__icon"
          />
          <select
            className="registration__field"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          >
            <option value="">Выберите страну</option>
            {countries.map((countryName) => (
              <option key={countryName} value={countryName}>
                {countryName}
              </option>
            ))}
          </select>
        </div>
        <div className="social-login">
          <input
            type="checkbox"
            id="privacy-agreement"
            checked={isPrivacyAgreed}
            onChange={(e) => setIsPrivacyAgreed(e.target.checked)}
            className="registration__checkbox"
          />
          <label htmlFor="privacy-agreement" className="registration__checkbox-label">
            Я подтверждаю и согласен с{' '}
            <a
              href={`${process.env.PUBLIC_URL}/documents/privacy-policy.pdf`}
              download="privacy-policy.pdf"
              className="registration__policy-link"
              onClick={(e) => e.stopPropagation()}
            >
              политикой конфиденциальности
            </a>{' '}
            и условиями использования
          </label>
        </div>
        <button
          className="registration__submit"
          onClick={handleSubmit}
          disabled={!isPrivacyAgreed}
        >
          Завершить
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

export default RegisterFinal;