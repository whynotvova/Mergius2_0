import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const RegisterFinal = () => {
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [accountType, setAccountType] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Введите имя пользователя');
      return;
    }

    if (!country.trim()) {
      setError('Введите страну');
      return;
    }

    if (!dateOfBirth) {
      setError('Введите дату рождения');
      return;
    }

    if (!accountType) {
      setError('Выберите тип аккаунта');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует. Пожалуйста, авторизуйтесь снова.');
      navigate('/register');
      return;
    }

    try {
      console.log('Token:', token);
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
          account_type_id: parseInt(accountType),
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
    <main className="main-content">
      <h1 className="auth-title">Завершение регистрации</h1>
      <div className="social-auth-primary">
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Введите имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="phone-input"
          maxLength="150"
          required
        />
        <input
          type="text"
          id="country"
          name="country"
          placeholder="Введите страну"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="phone-input"
          maxLength="100"
          required
        />
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="phone-input"
          required
        />
        <select
          id="accountType"
          name="accountType"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          className="phone-input"
          required
        >
          <option value="">Выберите тип аккаунта</option>
          <option value="2">Персональный</option>
          <option value="3">Бизнес</option>
        </select>
        <button onClick={handleSubmit} className="social-icon-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/auth/next-white.png`}
            alt="Submit"
            className="social-icon"
          />
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
    </main>
  );
};

export default RegisterFinal;