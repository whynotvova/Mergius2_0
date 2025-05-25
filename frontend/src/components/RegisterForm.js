import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/styles.css';

const RegisterForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState(null);
  const [isLoadingCsrf, setIsLoadingCsrf] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://mergius.ru';
  const vkOneTapRef = useRef(null);

  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
  };

  const generateCodeChallenge = async (verifier) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const fetchCsrfToken = async (retries = 5, delay = 1000) => {
    setIsLoadingCsrf(true);
    for (let i = 0; i < retries; i++) {
      try {
        console.debug(`Attempt ${i + 1} to fetch CSRF token`);
        const response = await fetch(`${BASE_URL}/api/get-csrf-token/`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          const token = data.csrfToken;
          console.debug('Fetched CSRF token:', token, 'Length:', token?.length);
          if (token && token.length >= 32) {
            setCsrfToken(token);
            setIsLoadingCsrf(false);
            return;
          } else {
            console.error('Invalid CSRF token length:', token?.length);
            setError('Получен некорректный CSRF token');
          }
        } else {
          console.error('Failed to fetch CSRF token, status:', response.status, 'Response:', await response.text());
        }
      } catch (error) {
        console.error(`Error fetching CSRF token (attempt ${i + 1}):`, error);
      }
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    setError('Не удалось получить CSRF token после нескольких попыток');
    setIsLoadingCsrf(false);
  };

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userId = params.get('user_id');
    if (token && userId) {
      localStorage.setItem('token', token);
      localStorage.setItem('user_id', userId);
      sessionStorage.removeItem('vk_code_verifier');
      navigate('/mail');
    }

    if (location.state?.error && !error) {
      setError(location.state.error);
    }
  }, [location.state, location.search, error, navigate]);

  useEffect(() => {
    if (isLoadingCsrf || !csrfToken) {
      console.debug('Skipping VK OneTap render: CSRF token not ready');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    script.async = true;
    script.onload = async () => {
      if ('VKIDSDK' in window) {
        const VKID = window.VKIDSDK;
        let codeVerifier = sessionStorage.getItem('vk_code_verifier');
        if (!codeVerifier) {
          codeVerifier = generateCodeVerifier();
          sessionStorage.setItem('vk_code_verifier', codeVerifier);
        }
        console.debug('Code Verifier:', codeVerifier);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        console.debug('Code Challenge:', codeChallenge);

        VKID.Config.init({
          app: 53611641,
          redirectUrl: 'https://mergius.ru/vk/callback/',
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope: 'phone first_name birthday country',
          codeChallengeMethod: 'S256',
          codeChallenge: codeChallenge,
        });

        const oneTap = new VKID.OneTap();
        if (vkOneTapRef.current) {
          oneTap.render({
            container: vkOneTapRef.current,
            fastAuthEnabled: false,
            showAlternativeLogin: true,
            oauthList: ['ok_ru'],
            styles: {
              width: 465,
              height: 56,
            },
          })
            .on(VKID.WidgetEvents.ERROR, (error) => {
              console.error('VK OneTap error:', error);
              setError('Ошибка авторизации через VK: ' + (error.message || 'Неизвестная ошибка'));
            })
            .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload) => {
              const { code, device_id } = payload;
              const codeVerifier = sessionStorage.getItem('vk_code_verifier');
              if (!codeVerifier) {
                setError('Ошибка: code_verifier отсутствует');
                return;
              }
              if (!csrfToken) {
                setError('CSRF token отсутствует. Попробуйте обновить страницу.');
                return;
              }

              try {
                console.debug('Sending VK callback request with CSRF token:', csrfToken);
                const response = await fetch(`${BASE_URL}/api/auth/vk/callback/`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                  },
                  credentials: 'include',
                  body: JSON.stringify({ code, device_id, code_verifier: codeVerifier }),
                });

                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.detail || 'Ошибка сервера');
                }

                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user_id', data.user_id);
                sessionStorage.removeItem('vk_code_verifier');
                navigate('/mail');
              } catch (err) {
                console.error('VK auth error:', err);
                setError(`Не удалось авторизоваться через VK: ${err.message}`);
              }
            });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [csrfToken, isLoadingCsrf, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.match(/^\+7\d{10}$/)) {
      setError('Введите корректный номер телефона (+7XXXXXXXXXX)');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }

    if (!csrfToken) {
      setError('CSRF token отсутствует. Попробуйте обновить страницу.');
      return;
    }

    console.log('Sending request to:', `${BASE_URL}/api/auth/register/`);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ phone_number: phoneNumber, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Server response:', data);
        throw new Error(data.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.info('Registration success:', data);
      navigate('/otp', { state: { phoneNumber, type: 'register' } });
    } catch (err) {
      console.error('Registration error:', err.message, err.stack);
      if (err.message.includes('Failed to fetch')) {
        setError('Не удалось подключиться к серверу. Проверьте, что сервер работает, и попробуйте снова.');
      } else {
        setError(`Не удалось отправить запрос: ${err.message}`);
      }
    }
  };

  return (
    <main className="main-content">
      <h1 className="auth-title">Регистрация</h1>
      <div className="social-auth-primary">
        <img
          src={`${process.env.PUBLIC_URL}/images/register/phone-white.png`}
          alt="Phone Registration"
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
          onClick={handleRegister}
          className="social-icon-button"
          disabled={!csrfToken || isLoadingCsrf}
        >
          <img
            src={`${process.env.PUBLIC_URL}/images/register/next-white.png`}
            alt="Submit"
            className="social-icon"
          />
        </button>
      </div>
      {isLoadingCsrf ? (
        <p>Загрузка...</p>
      ) : (
        <div ref={vkOneTapRef} className="vk-one-tap-button" style={{ marginTop: '10px' }}></div>
      )}
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

export default RegisterForm;