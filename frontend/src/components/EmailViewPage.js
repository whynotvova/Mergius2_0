import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const EmailViewPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmailAccounts, setUserEmailAccounts] = useState([]);
  const [hoveredService, setHoveredService] = useState(null);
  const [unreadCountsByService, setUnreadCountsByService] = useState({});
  const [unreadCountsByFolder, setUnreadCountsByFolder] = useState({});
  const [selectedServiceFilter, setSelectedServiceFilter] = useState(null);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState(null);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://mergius.ru';
  const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'https://mergius.ru';

  const folderIcons = {
    'Входящие': {
      active: '/images/mail/folder-inbox-active.png',
      inactive: '/images/mail/folder-inbox.png',
    },
    'Отмеченное': {
      active: '/images/mail/folder-marked-active.png',
      inactive: '/images/mail/folder-marked.png',
    },
    'Черновики': {
      active: '/images/mail/folder-draft-active.png',
      inactive: '/images/mail/folder-drafts.png',
    },
    'Отправленное': {
      active: '/images/mail/folder-sender-active.png',
      inactive: '/images/mail/folder-sender.png',
    },
    'Спам': {
      active: '/images/mail/folder-spam.png',
      inactive: '/images/mail/folder-spam.png',
    },
  };

  const emailServices = [
    { name: 'Gmail', icon: '/images/mail/account-gmail.png' },
    { name: 'Mail.ru', icon: '/images/mail/account-mail-ru.png' },
    { name: 'Yandex', icon: '/images/mail/account-yandex.png' },
    { name: 'Outlook', icon: '/images/mail/account-outlook.png' },
    { name: 'Yahoo', icon: '/images/mail/account-yahoo.png' },
    { name: 'AOL', icon: '/images/mail/account-aol.png' },
  ];

  const defaultFolders = ['Входящие', 'Отмеченное', 'Черновики', 'Отправленное', 'Спам'];

  const isCategoryFolder = (folderName) => {
    const contentCategories = [
      'Чаты', 'Социальные сети', 'Удаленные', 'Покупки', 'Анонимные',
      'Новости', 'Игры', 'Билеты', 'Работа', 'Личное'
    ];
    return (
      contentCategories.some(category => category.toLowerCase() === folderName.toLowerCase()) &&
      !defaultFolders.includes(folderName) &&
      !['Gmail', 'Mail.ru', 'Yandex', 'Outlook', 'Yahoo', 'AOL'].includes(folderName)
    );
  };

  const updateUnreadCount = (emailData) => {
    setUnreadCountsByService(prev => ({
      ...prev,
      [emailData.serviceName]: Math.max(0, (prev[emailData.serviceName] || 0) - 1),
    }));
  };

  const handleTranslate = async () => {
    if (!email || !email.content || isTranslating) return;

    setIsTranslating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/mail/translate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: email.content,
          target_language: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to translate email');
      }

      const data = await response.json();
      setTranslatedContent(data.translated_text);
    } catch (error) {
      console.error('Error translating email:', error);
      setError('Ошибка при переводе письма');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    const processEmail = async () => {
      if (!state?.email) {
        setError('Письмо не найдено');
        setLoading(false);
        return;
      }

      const emailData = state.email;
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/api/mail/emails/${emailData.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'read' }),
        });

        if (!response.ok) {
          throw new Error('Failed to mark email as read');
        }

        updateUnreadCount(emailData);

        const recipientsByType = {
          TO: emailData.recipients.filter(r => r.recipient_type === 'TO').map(r => r.recipient_address),
          CC: emailData.recipients.filter(r => r.recipient_type === 'CC').map(r => r.recipient_address),
          BCC: emailData.recipients.filter(r => r.recipient_type === 'BCC').map(r => r.recipient_address),
        };

        setEmail({
          id: emailData.id,
          title: emailData.title || 'Без темы',
          sender: emailData.sender || 'Неизвестный отправитель',
          recipients: recipientsByType,
          content: emailData.body || '',
          date: emailData.date || 'Дата неизвестна',
          senderAvatar: emailData.senderAvatar || '/images/mail/default-avatar.png',
          serviceName: emailData.serviceName || 'Unknown',
        });
      } catch (error) {
        console.error('Error marking email as read:', error);
        setError('Ошибка при обновлении статуса письма');
      } finally {
        setLoading(false);
      }
    };

    processEmail();
  }, [state, navigate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const foldersResponse = await fetch(`${BASE_URL}/api/mail/fetch/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (foldersResponse.ok) {
          const data = await foldersResponse.json();
          setFolders(
            data.folders.map(folder => ({
              id: folder.id,
              name: folder.folder_name,
              icon: folder.folder_icon || folderIcons[folder.folder_name]?.inactive || '/images/mail/folder-active.png',
              locked: defaultFolders.includes(folder.folder_name),
            }))
          );
          setUnreadCountsByFolder(data.unread_counts_by_folder || {});
        } else {
          const errorData = await foldersResponse.json().catch(() => ({
            error: `Server error: ${foldersResponse.statusText}`
          }));
          setError(errorData.error || 'Не удалось загрузить папки');
        }

        const accountsResponse = await fetch(`${BASE_URL}/api/profile/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setUserEmailAccounts(accountsData.email_accounts || []);
          setUnreadCountsByService(accountsData.unread_counts_by_service || {});
        } else {
          const errorData = await accountsResponse.json().catch(() => ({
            error: `Server error: ${accountsResponse.statusText}`
          }));
          setError(errorData.error || 'Не удалось загрузить почтовые аккаунты');
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Ошибка подключения к серверу');
      }
    };
    fetchInitialData();
  }, [navigate]);

  const handleSideNavClick = (itemNumber, folder = null) => {
    setSelectedFolderFilter(null);
    if (itemNumber === 5) {
      navigate('/mail', { state: { openCategories: true } });
    } else {
      const folderName = folder ? folder.name :
        itemNumber === 1 ? null :
        itemNumber === 2 ? 'Отмеченное' :
        itemNumber === 3 ? 'Черновики' :
        itemNumber === 4 ? 'Отправленное' :
        itemNumber === 6 ? 'Спам' : null;
      setSelectedFolderFilter(folderName);
      navigate('/mail', { state: { folderName } });
    }
  };

  const handlePanelIconClick = (iconNumber) => {
    if (iconNumber === 1) {
      setSelectedServiceFilter(null);
      navigate('/mail', { state: { serviceName: null } });
    } else if (iconNumber === 2) {
      navigate('/mail', { state: { openMailServices: true } });
    }
  };

  const handleServiceFilterClick = (serviceName) => {
    setSelectedServiceFilter(serviceName);
    navigate('/mail', { state: { serviceName } });
  };

  const handleBackClick = () => {
    navigate('/mail');
  };

  const handleReply = () => {
    navigate('/compose', { state: { replyTo: email } });
  };

  const handleForward = () => {
    navigate('/compose', { state: { forward: email } });
  };

  const addedServices = Array.from(new Set(userEmailAccounts.map(account => account.service.service_name)))
    .map(serviceName => {
      const service = emailServices.find(srv => srv.name === serviceName);
      return {
        name: serviceName,
        icon: service ? service.icon : '/images/mail/default-service.png',
      };
    });

  const servicesWithAvatars = ['Mail.ru', 'Gmail', 'Proton', 'AOL', 'Yahoo', 'Outlook', 'Yandex'];

  if (loading) {
    return (
      <div className="email-view-body">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="email-view-body">
        <div className="error-message">{error}</div>
        <button className="back-button" onClick={handleBackClick}>
          Назад
        </button>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="email-view-body">
        <div>Данные письма недоступны</div>
        <button className="back-button" onClick={handleBackClick}>
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="email-view-body">
      <main className="email-view-content">
        <nav className="side-nav">
          <section className="image-layout">
            <section className="image-stack">
              <button
                className={`side-nav-button ${selectedFolderFilter === null ? 'active' : ''}`}
                onClick={() => handleSideNavClick(1)}
              >
                <div className="mail-icon-container">
                  <img
                    src={`${process.env.PUBLIC_URL}${selectedFolderFilter === null ? folderIcons['Входящие'].active : folderIcons['Входящие'].inactive}`}
                    alt="Входящие"
                    className="product-image"
                  />
                  {unreadCountsByFolder['Входящие'] > 0 && (
                    <span className="unread-badge">{unreadCountsByFolder['Входящие']}</span>
                  )}
                </div>
                <span className="side-nav-text">Входящие</span>
              </button>
              <button
                className={`side-nav-button ${selectedFolderFilter === 'Отмеченное' ? 'active' : ''}`}
                onClick={() => handleSideNavClick(2)}
              >
                <div className="mail-icon-container">
                  <img
                    src={`${process.env.PUBLIC_URL}${selectedFolderFilter === 'Отмеченное' ? folderIcons['Отмеченное'].active : folderIcons['Отмеченное'].inactive}`}
                    className="product-image stack-spacing"
                    alt="Отмеченное"
                  />
                  {unreadCountsByFolder['Отмеченное'] > 0 && (
                    <span className="star-unread-badge">{unreadCountsByFolder['Отмеченное']}</span>
                  )}
                </div>
                <span className="side-nav-text">Отмеченное</span>
              </button>
              <button
                className={`side-nav-button ${selectedFolderFilter === 'Черновики' ? 'active' : ''}`}
                onClick={() => handleSideNavClick(3)}
              >
                <div className="mail-icon-container">
                  <img
                    src={`${process.env.PUBLIC_URL}${selectedFolderFilter === 'Черновики' ? folderIcons['Черновики'].active : folderIcons['Черновики'].inactive}`}
                    className="product-image stack-spacing"
                    alt="Черновики"
                  />
                  {unreadCountsByFolder['Черновики'] > 0 && (
                    <span className="unread-badge">{unreadCountsByFolder['Черновики']}</span>
                  )}
                </div>
                <span className="side-nav-text">Черновики</span>
              </button>
              <button
                className={`side-nav-button ${selectedFolderFilter === 'Отправленное' ? 'active' : ''}`}
                onClick={() => handleSideNavClick(4)}
              >
                <div className="mail-icon-container">
                  <img
                    src={`${process.env.PUBLIC_URL}${selectedFolderFilter === 'Отправленное' ? folderIcons['Отправленное'].active : folderIcons['Отправленное'].inactive}`}
                    className="product-image stack-spacing"
                    alt="Отправленное"
                  />
                  {unreadCountsByFolder['Отправленное'] > 0 && (
                    <span className="unread-badge">{unreadCountsByFolder['Отправленное']}</span>
                  )}
                </div>
                <span className="side-nav-text">Отправленное</span>
              </button>
              {folders
                .filter(
                  folder =>
                    !defaultFolders.includes(folder.name) &&
                    !emailServices.some(service => service.name === folder.name)
                )
                .map(folder => (
                  <button
                    key={folder.id}
                    className={`side-nav-button ${selectedFolderFilter === folder.name ? 'active' : ''}`}
                    onClick={() => handleSideNavClick(folder.id, folder)}
                  >
                    <div className="mail-icon-container">
                      <img
                        src={`${process.env.PUBLIC_URL}${selectedFolderFilter === folder.name ? (folderIcons[folder.name]?.active || folder.icon) : folder.icon}`}
                        alt={folder.name}
                        className="product-image stack-spacing"
                        data-folder-id={folder.id}
                      />
                      {unreadCountsByFolder[folder.name] > 0 && (
                        <span className={isCategoryFolder(folder.name) ? 'category-unread-badge' : 'unread-badge'}>
                          {unreadCountsByFolder[folder.name]}
                        </span>
                      )}
                    </div>
                    <span className="side-nav-text">{folder.name}</span>
                  </button>
                ))}
              <button className="side-nav-button" onClick={() => handleSideNavClick(5)}>
                <div className="mail-icon-container">
                  <img
                    src={`${process.env.PUBLIC_URL}/images/mail/folder-add.png`}
                    className="product-image stack-spacing"
                    alt="Добавить папку"
                  />
                </div>
                <span className="side-nav-text">Добавить папку</span>
              </button>
              <div className="blue-divider"></div>
            </section>
            <section className="bottom-section">
              <button
                className={`side-nav-button ${selectedFolderFilter === 'Спам' ? 'active' : ''}`}
                onClick={() => handleSideNavClick(6)}
              >
                <div className="mail-icon-container">
                  <img
                    src={`${process.env.PUBLIC_URL}${selectedFolderFilter === 'Спам' ? folderIcons['Спам'].active : folderIcons['Спам'].inactive}`}
                    alt="Спам"
                    className="product-image"
                  />
                  {unreadCountsByFolder['Спам'] > 0 && (
                    <span className="unread-badge">{unreadCountsByFolder['Спам']}</span>
                  )}
                </div>
                <span className="side-nav-text">Спам</span>
              </button>
            </section>
          </section>
        </nav>

        <section className="email-message">
          {error && <div className="error-message">{error}</div>}
          <header className="email-header">
            <div className="email-header-container">
              <h1 className="email-title">{email.title}</h1>
              <time className="email-date">{email.date}</time>
            </div>
          </header>
          <h2 className="email-sender">
            От кого: {email.sender}
          </h2>
          <h3 className="email-recipient">
            Кому: {email.recipients.TO.join(', ') || 'Не указан'}
          </h3>
          {email.recipients.CC.length > 0 && (
            <h3 className="email-recipient">
              Копия: {email.recipients.CC.join(', ')}
            </h3>
          )}
          {email.recipients.BCC.length > 0 && (
            <h3 className="email-recipient">
              Скрытая копия: {email.recipients.BCC.join(', ')}
            </h3>
          )}
          <section className="email-content" style={{
            width: '1240px',
            height: '500px',
            overflowY: 'auto',
            padding: '16px',
            boxSizing: 'border-box',
            margin: '0 0 20px 20px'
          }}>
            <header className="email-content-header">
              <p
                className="email-text"
                dangerouslySetInnerHTML={{ __html: translatedContent || email.content }}
              />
              <img
                src={`${process.env.PUBLIC_URL}/images/mail/translation.png`}
                alt="Перевести"
                className="translation-icon"
                onClick={handleTranslate}
                style={{ cursor: isTranslating ? 'not-allowed' : 'pointer', opacity: isTranslating ? 0.5 : 1 }}
              />
              {isTranslating && <span>Перевод...</span>}
            </header>
          </section>
          <footer className="email-actions">
            <button className="action-button" onClick={handleReply}>Ответить</button>
            <button className="back-button" onClick={handleBackClick}>
              Назад
            </button>
          </footer>
        </section>

        <aside className="side-panel">
          <main className="gallery-container">
            <section className="gallery-content">
              <button
                className={`panel-button ${selectedServiceFilter === null ? 'active' : ''}`}
                onClick={() => handlePanelIconClick(1)}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/account-all.png`}
                  className="gallery-image"
                  alt="Все аккаунты"
                />
              </button>
              {addedServices.map((service, index) => (
                <div key={index} className="panel-button-wrapper">
                  {servicesWithAvatars.includes(service.name) && hoveredService === service.name && (
                    <div className="avatar-container">
                      {userEmailAccounts
                        .filter(account => account.service.service_name === service.name)
                        .map((account, idx) => (
                          <img
                            key={idx}
                            src={`${process.env.PUBLIC_URL}${account.avatar}`}
                            className="avatar-circle-button"
                            alt={`Avatar for ${account.email_address}`}
                          />
                        ))}
                    </div>
                  )}
                  <button
                    className={`panel-button ${selectedServiceFilter === service.name ? 'active' : ''}`}
                    onClick={() => handleServiceFilterClick(service.name)}
                    onMouseEnter={() => setHoveredService(service.name)}
                    onMouseLeave={() => setHoveredService(null)}
                  >
                    <div className="service-icon-container">
                      <img
                        src={`${process.env.PUBLIC_URL}${service.icon}`}
                        className="gallery-image gallery-image-bottom"
                        alt={`${service.name} icon`}
                      />
                      {unreadCountsByService[service.name] > 0 && (
                        <span className="unread-badge">
                          {unreadCountsByService[service.name]}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              ))}
              <button className="panel-button" onClick={() => handlePanelIconClick(2)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/account-add.png`}
                  className="gallery-image gallery-image-bottom"
                  alt="Добавить аккаунт"
                />
              </button>
            </section>
          </main>
        </aside>
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

export default EmailViewPage;