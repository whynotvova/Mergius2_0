import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const user_id = params.get('user_id');

    if (token && user_id) {
      localStorage.setItem('token', token);
      localStorage.setItem('user_id', user_id);
      navigate('/register-final');
    } else {
      navigate('/register', { state: { error: 'Ошибка авторизации: токен не получен' } });
    }
  }, [location, navigate]);

  return <div>Обработка авторизации...</div>;
};

export default Callback;