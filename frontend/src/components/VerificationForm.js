import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const VerificationForm = ({ type }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach((input, index) => {
      input.addEventListener('input', function () {
        if (this.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
        const allFilled = Array.from(inputs).every((input) => input.value.length === 1);
        if (allFilled && type === 'register') {
          navigate('/register-final');
        } else if (allFilled && type === 'login') {
          navigate('/mail');
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });
  }, [navigate, type]);

  return (
    <main className="verification-container">
      <h1 className="verification-title">{type === 'login' ? 'Авторизация' : 'Регистрация'}</h1>
      <div className="verification-code-container">
        {[...Array(6)].map((_, index) => (
          <input
            key={index}
            type="number"
            className="code-input"
            maxLength="1"
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      <p className="verification-message">Код пришел вам на номер телефона, проверьте смс</p>
      <button className="resend-code">Прислать код еще раз</button>
    </main>
  );
};

export default VerificationForm;