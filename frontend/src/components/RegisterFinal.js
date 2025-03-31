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
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/0a0629ee19ccdb0d72fd24e245780e16a4bf262e"
            alt="Social Login Option 1"
            className="social-login__icon"
          />
          <input type="text" placeholder="Nickname" className="registration__field" />
        </div>
        <div className="social-login">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/9131ab6aabbd8801b3e74668ebdc5b8afe36307e"
            alt="Social Login Option 2"
            className="social-login__icon"
          />
          <input type="date" className="registration__field" />
        </div>
        <div className="social-login">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/827f73382d6cb744582ed9a97bf4677c424ec199"
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