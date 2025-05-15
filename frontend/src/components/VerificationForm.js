import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/styles.css';

const VerificationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState(null);
  const { phoneNumber, type } = location.state || {};
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
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach((input, index) => {
      input.addEventListener('input', function () {
        if (this.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
        const newOtp = [...otpCode];
        newOtp[index] = this.value.slice(-1);
        setOtpCode(newOtp);
        const allFilled = newOtp.every((digit) => digit.length === 1);
        if (allFilled) {
          handleOTPSubmit(newOtp.join(''));
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
          inputs[index - 1].focus();
          const newOtp = [...otpCode];
          newOtp[index - 1] = '';
          setOtpCode(newOtp);
        }
      });
    });

    if (!phoneNumber) {
      setError('Номер телефона не передан');
      setTimeout(() => navigate('/register'), 2000);
    }

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', () => {});
        input.removeEventListener('keydown', () => {});
      });
    };
  }, [navigate, otpCode, phoneNumber]);

  const handleOTPSubmit = async (code) => {
    setError('');
    if (!phoneNumber) {
      setError('Номер телефона не передан');
      navigate('/register');
      return;
    }

    if (!csrfToken) {
      setError('CSRF token отсутствует. Попробуйте обновить страницу.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/auth/otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ phone_number: phoneNumber, otp_code: code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', data.user_id);
      console.info('OTP verification success:', data);
      const isProfileComplete = data.is_phone_verified && data.username && data.country && data.date_of_birth;
      if (isProfileComplete) {
        navigate('/mail');
      } else {
        navigate('/register-final');
      }
    } catch (err) {
      console.error('OTP verification error:', err.message, err.stack);
      setError('Неверный OTP код или ошибка сервера: ' + err.message);
    }
  };

  const handleResendCode = async () => {
    setError('');
    if (!phoneNumber) {
      setError('Номер телефона не передан');
      navigate('/register');
      return;
    }

    if (!csrfToken) {
      setError('CSRF token отсутствует. Попробуйте обновить страницу.');
      return;
    }

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
        throw new Error(data.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.info('OTP resent success:', data);
      setError('Код отправлен повторно');
    } catch (err) {
      console.error('Resend OTP error:', err.message, err.stack);
      setError('Не удалось отправить код: ' + err.message);
    }
  };

  const isVerificationPage = ['/confirm-auth', '/confirm-reg'].includes(location.pathname);

  return (
    <main className="verification-container">
      <h1 className="verification-title">{type === 'login' ? 'Авторизация' : 'Регистрация'}</h1>
      <div className="verification-code-container">
        {otpCode.map((digit, index) => (
          <input
            key={index}
            type="text"
            className="code-input"
            maxLength="1"
            value={digit}
            onChange={(e) => {
              const newOtp = [...otpCode];
              newOtp[index] = e.target.value.slice(-1);
              setOtpCode(newOtp);
            }}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      <p className="verification-message">Код пришел вам на номер телефона, проверьте смс</p>
      <button
        className={`resend-code ${isVerificationPage ? 'active-login' : ''}`}
        onClick={handleResendCode}
        disabled={!csrfToken}
      >
        Прислать код еще раз
      </button>
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

export default VerificationForm;