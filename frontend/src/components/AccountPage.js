import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const Account = () => {
  const [userData, setUserData] = useState({
    username: 'Username',
    date_of_birth: 'Birthday',
    country: 'Country',
    audit_logs: [],
    account_type: 'Не указан',
    email_accounts: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://backend:8000';
  const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost';
  const serviceIcons = {
    gmail: 'google-logo.png',
    mailru: 'mail-logo.png',
    yahoo: 'yahoo-logo.png',
    yandex: 'yandex-logo.png',
  };
  const truncateText = (text, maxLength = 40) => {
    if (!text) return 'Unknown';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  const totalPages = Math.ceil(userData.audit_logs.length / logsPerPage);
  const currentLogs = userData.audit_logs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    range.push(1);

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    range.forEach((i, index) => {
      if (index > 0 && i - range[index - 1] > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
    });

    return rangeWithDots;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found, redirecting to login');
          navigate('/auth');
          return;
        }
        const response = await fetch(`${BASE_URL}/api/profile/`, {
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
            account_type: data.account_type || 'Не указан',
            email_accounts: data.email_accounts || [],
          });
          setCurrentPage(1);
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
                <img
                  src={`${process.env.PUBLIC_URL}/images/profile/user-blue.png`}
                  className="info-icon"
                  alt="Username icon"
                />
                <p className="info-text">{userData.username}</p>
              </div>
              <div className="info-item">
                <img
                  src={`${process.env.PUBLIC_URL}/images/profile/birthday-blue.png`}
                  className="info-icon"
                  alt="Birthday icon"
                />
                <p className="info-text">{userData.date_of_birth}</p>
              </div>
              <div className="info-item">
                <img
                  src={`${process.env.PUBLIC_URL}/images/profile/geo-blue.png`}
                  className="info-icon"
                  alt="Country icon"
                />
                <p className="info-text">{userData.country}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="action-buttons">
        <div className="default-button">
          <img
            src={`${process.env.PUBLIC_URL}/images/profile/free.png`}
            className="info-icon"
            alt="Account type icon"
          />
          <p className="button-text">{userData.account_type}</p>
        </div>
        <div className="icon-button">
          <img src={`${process.env.PUBLIC_URL}/images/profile/mail-logo.png`} className="button-icon" alt="Icon button" />
          {userData.email_accounts.length > 0 ? (
            userData.email_accounts.map((account, index) => (
              <img
                key={index}
                src={`${process.env.PUBLIC_URL}${
                  account.service.service_icon ||
                  `/images/landing/${
                    serviceIcons[account.service.service_name] || 'default-logo.png'
                  }`
                }`}
                className="button-icon"
                alt={`${account.service.service_name} icon`}
              />
            ))
          ) : (
            <p className="no-services-message">Нет подключенных сервисов</p>
          )}
        </div>
      </section>
      <header className="history-header">История</header>
      <section className="history-section">
        {userData.audit_logs.length > 0 ? (
          <>
            <div className="history-table">
              <div className="ip-column">
                <div className="history-cell">
                  <p>IP</p>
                  {currentLogs.map((log, index) => (
                    <p key={index} className="history-item">
                      {truncateText(log.ip_address || 'Unknown')}
                    </p>
                  ))}
                </div>
              </div>
              <div className="action-column">
                <div className="history-cell">
                  <p>Действие</p>
                  {currentLogs.map((log, index) => (
                    <p key={index} className="history-item">
                      {truncateText(log.action)}
                    </p>
                  ))}
                </div>
              </div>
              <div className="description-column">
                <div className="history-cell">
                  <p>Описание</p>
                  {currentLogs.map((log, index) => (
                    <p key={index} className="history-item">
                      {truncateText(log.details)}
                    </p>
                  ))}
                </div>
              </div>
              <div className="date-column">
                <div className="history-cell">
                  <p>Дата</p>
                  {currentLogs.map((log, index) => (
                    <p key={index} className="history-item date">
                      {truncateText(log.timestamp)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            {totalPages > 0 && (
              <div className="pagination">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="pagination-button"
                  aria-label="Previous page"
                >
                  Назад
                </button>
                {getPaginationNumbers().map((item, index) => (
                  <button
                    key={index}
                    onClick={() => typeof item === 'number' && handlePageChange(item)}
                    className={`pagination-button ${currentPage === item ? 'active' : ''} ${typeof item === 'string' ? 'ellipsis' : ''}`}
                    disabled={typeof item === 'string'}
                    aria-label={typeof item === 'number' ? `Page ${item}` : undefined}
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                  aria-label="Next page"
                >
                  Вперед
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="no-logs-message">Нет записей в истории</p>
        )}
      </section>

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

export default Account;