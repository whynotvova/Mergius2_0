import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const RegisterFinal = () => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate('/mail');
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
          <input type="text" placeholder="Nickname" className="registration__field" />
        </div>
        <div className="social-login">
          <img
            src={`${process.env.PUBLIC_URL}/images/register/birthday-white.png`}
            alt="Social Login Option 2"
            className="social-login__icon"
          />
          <input type="date" className="registration__field" />
        </div>
        <div className="social-login">
          <img
            src={`${process.env.PUBLIC_URL}/images/register/geo-white.png`}
            alt="Social Login Option 3"
            className="social-login__icon"
          />
          <input type="text" placeholder="Страна" className="registration__field" />
        </div>
        <button className="registration__submit" onClick={handleSubmit}>
          Завершить
        </button>
      </div>
    </main>
  );
};

export default RegisterFinal;