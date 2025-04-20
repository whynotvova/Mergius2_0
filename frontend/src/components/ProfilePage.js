import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const ProfilePage = () => {
  const navigate = useNavigate();

  const handleMenuItemClick = (item) => {
    console.log(`${item} clicked`);
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
        navigate('/logout');
        break;
      default:
        break;
    }
  };

  const handleNavButtonClick = (path) => {
    console.log(`Navigating to ${path}`);
    navigate(path);
  };

  return (
    <div className="profile-body">
      <main className="profile-content">
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
            <li className="menu-item" onClick={() => handleMenuItemClick('Темы')}>
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
    </div>
  );
};

export default ProfilePage;