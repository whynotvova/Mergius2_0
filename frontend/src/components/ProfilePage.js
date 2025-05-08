import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userAccountType, setUserAccountType] = useState('Персональный');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserAccountType = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const response = await fetch('http://localhost:8000/api/profile/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserAccountType(data.account_type || 'Персональный');
        } else {
          const errorData = await response.json().catch(() => ({
            error: `Server error: ${response.statusText}`,
          }));
          console.error('Failed to fetch profile:', errorData);
          setError(errorData.error || 'Не удалось загрузить данные профиля');
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');
            navigate('/auth');
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Ошибка подключения к серверу');
      }
    };

    fetchUserAccountType();
  }, [navigate]);

  const handleMenuItemClick = (item) => {
    console.log(`${item} clicked`);
    if (item === 'Темы' && userAccountType !== 'Премиум') {
      setError('Доступ к темам возможен только для премиум-аккаунтов');
      return;
    }
    switch (item) {
      case 'Аккаунт':
        navigate('/account');
        break;
      case 'Категории':
        navigate('/categories');
        break;
      case 'Темы':
        navigate('/themes');
        break;
      case 'Безопасность':
        navigate('/security');
        break;
      case 'FAQ':
        navigate('/faq');
        break;
      case 'Выход':
        console.log('Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        navigate('/');
        break;
      default:
        break;
    }
  };

  return (
    <div className="profile-body">
      <main className="profile-content">
        {error && <div className="error-message">{error}</div>}
        <nav className="menu">
          <ul className="menu-list">
            <li className="menu-item" onClick={() => handleMenuItemClick('Аккаунт')}>
              <img
                src={`${process.env.PUBLIC_URL}/images/profile/user-blue.png`}
                alt="Account icon"
                className="menu-icon"
              />
              <span className="menu-text">Аккаунт</span>
            </li>
            <li className="menu-item" onClick={() => handleMenuItemClick('Категории')}>
              <img
                src={`${process.env.PUBLIC_URL}/images/profile/folder-active.png`}
                alt="Categories icon"
                className="menu-icon"
              />
              <span className="menu-text">Категории</span>
            </li>
            <li
              className={`menu-item ${userAccountType !== 'Премиум' ? 'disabled' : ''}`}
              onClick={() => handleMenuItemClick('Темы')}
              style={{ opacity: userAccountType !== 'Премиум' ? 0.5 : 1 }}
              title={userAccountType !== 'Премиум' ? 'Требуется премиум-аккаунт' : ''}
            >
              <img
                src={`${process.env.PUBLIC_URL}/images/profile/themes.png`}
                alt="Themes icon"
                className="menu-icon"
              />
              <span className="menu-text">Темы</span>
            </li>
            <li className="menu-item" onClick={() => handleMenuItemClick('Безопасность')}>
              <img
                src={`${process.env.PUBLIC_URL}/images/profile/shield-security.png`}
                alt="Security icon"
                className="menu-icon"
              />
              <span className="menu-text">Безопасность</span>
            </li>
            <li className="menu-item" onClick={() => handleMenuItemClick('FAQ')}>
              <img
                src={`${process.env.PUBLIC_URL}/images/profile/info.png`}
                alt="FAQ icon"
                className="menu-icon"
              />
              <span className="menu-text">FAQ</span>
            </li>
            <li className="menu-item" onClick={() => handleMenuItemClick('Выход')}>
              <img
                src={`${process.env.PUBLIC_URL}/images/profile/logout.png`}
                alt="Logout icon"
                className="menu-icon"
              />
              <span className="menu-text">Выход</span>
            </li>
          </ul>
        </nav>
      </main>
      <a href="https://t.me/mergius_support_bot" target="_blank" rel="noopener noreferrer" className="support-button">
        <img
          src={`${process.env.PUBLIC_URL}/images/mail/customer-support.png`}
          alt="Customer Support"
          className="support-icon"
        />
      </a>
    </div>
  );
};

export default ProfilePage;