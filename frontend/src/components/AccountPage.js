import React, { useEffect } from 'react';
import '../styles/styles.css';

const Account = () => {
  useEffect(() => {
    const update = () => {
      document.querySelectorAll(".profile-section").forEach((el) => {
        el.setAttribute("space", 50);
      });

      document.querySelectorAll(".history-section").forEach((el) => {
        el.setAttribute("space", 220);
      });
    };

    update();
  }, []);

  return (
    <main className="profile-container">
      <section className="profile-section">
        <div className="profile-layout">
          <div className="avatar-column">
            <div className="avatar-circle"></div>
          </div>
          <div className="info-column">
            <div className="user-info">
              <div className="info-item">
                <img src={`${process.env.PUBLIC_URL}/images/profile/user-blue.png`} className="info-icon" alt="Nickname icon" />
                <p className="info-text">Nickname</p>
              </div>
              <div className="info-item">
                <img src={`${process.env.PUBLIC_URL}/images/profile/birthday-blue.png`} className="info-icon" alt="Birthday icon" />
                <p className="info-text">Birthday</p>
              </div>
              <div className="info-item">
                <img src={`${process.env.PUBLIC_URL}/images/profile/geo-blue.png`} className="info-icon" alt="Country icon" />
                <p className="info-text">Country</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="action-buttons">
        <div className="default-button">
          <img src={`${process.env.PUBLIC_URL}/images/profile/free.png`} className="info-icon" alt="Default action icon" />
          <p className="button-text">Default</p>
        </div>
        <div className="icon-button">
          <img src={`${process.env.PUBLIC_URL}/images/profile/mail-logo.png`} className="button-icon" alt="Icon button" />
        </div>
      </section>
      <header className="history-header">История</header>
      <section className="history-section">
        <div className="history-table">
          <div className="ip-column">
            <div className="history-cell">
              <p>127.0.0.0</p>
              <p className="history-item">127.0.0.0</p>
              <p className="history-item">127.0.0.0</p>
              <p className="history-item">127.0.0.0</p>
            </div>
          </div>
          <div className="action-column">
            <div className="history-cell">
              <p>Вход</p>
              <p className="history-item">Вход</p>
              <p className="history-item">Аккаунт</p>
              <p className="history-item">Вход</p>
            </div>
          </div>
          <div className="description-column">
            <div className="history-cell">
              <p>Вход в аккаунт</p>
              <p className="history-item">Вход в аккаунт</p>
              <p className="history-item">Добавление Gmail</p>
              <p className="history-item">Вход в аккаунт</p>
            </div>
          </div>
          <div className="date-column">
            <div className="history-cell">
              <p className="date">10.01.2022</p>
              <p className="history-item date">10.01.2020</p>
              <p className="history-item date">08.01.2020</p>
              <p className="history-item date">08.01.2020</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Account;