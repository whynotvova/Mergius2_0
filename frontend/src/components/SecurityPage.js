import React, { useState } from 'react';
import '../styles/styles.css';

const SettingsItem = ({ iconSrc, label, is2FA, isPassword }) => {
  const [isToggled, setIsToggled] = useState(false);

  const handleToggle = () => {
    setIsToggled(!isToggled);
    console.log(`2FA toggled to ${!isToggled}`);
  };

  const handleEditClick = () => {
    console.log('Edit password clicked');
  };

  return (
    <article className="settings-item">
      <div className="icon-container">
        <img src={iconSrc} alt={`${label} Icon`} />
      </div>
      {is2FA ? (
        <h2 className="settings-label">{label}</h2>
      ) : (
        <p className="settings-label">{label}</p>
      )}
      {is2FA && (
        <div className={`toggle-container ${isToggled ? 'active' : ''}`} onClick={handleToggle}>
          <div className="toggle-background"></div>
          <div>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="toggle-circle">
              <circle cx="15" cy="15" r="15" fill={isToggled ? '#5863f8' : '#FF0000'}></circle>
            </svg>
          </div>
        </div>
      )}
      {isPassword && (
        <button className="edit-icon" onClick={handleEditClick}>
          <img src={`${process.env.PUBLIC_URL}/images/profile/edit.png`} alt="Edit Icon" />
        </button>
      )}
    </article>
  );
};

const SecurityPage = () => {
  const handleDeleteClick = () => {
    console.log('Delete account clicked');
  };

  return (
    <div className="security-body">
      <main className="page-body">
        <section className="settings-container">
          <SettingsItem
            iconSrc={`${process.env.PUBLIC_URL}/images/profile/2fa.png`}
            label="2FA"
            is2FA={true}
          />
          <SettingsItem
            iconSrc={`${process.env.PUBLIC_URL}/images/profile/phone.png`}
            label="+79005553535"
          />
          <SettingsItem
            iconSrc={`${process.env.PUBLIC_URL}/images/profile/password-edit.png`}
            label="***********"
            isPassword={true}
          />
          <article className="settings-item" onClick={handleDeleteClick}>
            <div className="icon-container">
              <img src={`${process.env.PUBLIC_URL}/images/profile/delete.png`} alt="Delete Icon" />
            </div>
            <p className="settings-label">Удалить аккаунт</p>
          </article>
        </section>
      </main>
    </div>
  );
};

export default SecurityPage;