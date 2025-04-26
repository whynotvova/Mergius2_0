import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const Account = () => {
  const [userData, setUserData] = useState({
    username: 'Username',
    date_of_birth: 'Birthday',
    country: 'Country',
    audit_logs: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found, redirecting to login');
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
          setUserData({
            username: data.username || 'Username',
            date_of_birth: data.date_of_birth || 'Birthday',
            country: data.country || 'Country',
            audit_logs: data.audit_logs || [],
          });
        } else if (response.status === 401) {
          console.error('Unauthorized, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user_id');
          navigate('/auth');
        } else {
          console.error('Failed to fetch profile:', response.status);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();

    const update = () => {
      document.querySelectorAll(".profile-section").forEach((el) => {
        el.setAttribute("space", 50);
      });

      document.querySelectorAll(".history-section").forEach((el) => {
        el.setAttribute("space", 220);
      });
    };

    update();
  }, [navigate]);

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
                <img src={`${process.env.PUBLIC_URL}/images/profile/user-blue.png`} className="info-icon" alt="Username icon" />
                <p className="info-text">{userData.username}</p>
              </div>
              <div className="info-item">
                <img src={`${process.env.PUBLIC_URL}/images/profile/birthday-blue.png`} className="info-icon" alt="Birthday icon" />
                <p className="info-text">{userData.date_of_birth}</p>
              </div>
              <div className="info-item">
                <img src={`${process.env.PUBLIC_URL}/images/profile/geo-blue.png`} className="info-icon" alt="Country icon" />
                <p className="info-text">{userData.country}</p>
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
        {userData.audit_logs.length > 0 ? (
          <div className="history-table">
            <div className="ip-column">
              <div className="history-cell">
                <p>IP</p>
                {userData.audit_logs.map((log, index) => (
                  <p key={index} className="history-item">{log.ip_address}</p>
                ))}
              </div>
            </div>
            <div className="action-column">
              <div className="history-cell">
                <p>Действие</p>
                {userData.audit_logs.map((log, index) => (
                  <p key={index} className="history-item">{log.action}</p>
                ))}
              </div>
            </div>
            <div className="description-column">
              <div className="history-cell">
                <p>Описание</p>
                {userData.audit_logs.map((log, index) => (
                  <p key={index} className="history-item">{log.details}</p>
                ))}
              </div>
            </div>
            <div className="date-column">
              <div className="history-cell">
                <p>Дата</p>
                {userData.audit_logs.map((log, index) => (
                  <p key={index} className="history-item date">{log.timestamp}</p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="no-logs-message">Нет записей в истории</p>
        )}
      </section>
    </main>
  );
};

export default Account;