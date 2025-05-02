import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const MailPage = () => {
  const [emails, setEmails] = useState([
    {
      id: 1,
      isChecked: false,
      isStarred: false,
      senderAvatar: 'https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/8ae3f093eabf8b5a51c987337fc769cfae4e8b74?placeholderIfAbsent=true',
      title: 'Welcome to Our Service',
      preview: 'We are excited to have you on board...',
      date: 'Apr 09, 2025',
      unread: true,
    },
    {
      id: 2,
      isChecked: false,
      isStarred: false,
      senderAvatar: 'https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/8ae3f093eabf8b5a51c987337fc769cfae4e8b74?placeholderIfAbsent=true',
      title: 'Your Subscription Details',
      preview: 'Here are the details of your plan...',
      date: 'Apr 08, 2025',
      unread: false,
    },
    {
      id: 3,
      isChecked: false,
      isStarred: false,
      senderAvatar: 'https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/8ae3f093eabf8b5a51c987337fc769cfae4e8b74?placeholderIfAbsent=true',
      title: 'Update Your Profile',
      preview: 'Please update your information...',
      date: 'Apr 07, 2025',
      unread: true,
    },
  ]);

  const [folders, setFolders] = useState([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMailServicesOpen, setIsMailServicesOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [mailServices, setMailServices] = useState([]);
  const [userEmailAccounts, setUserEmailAccounts] = useState([]);
  const [openingEmailId, setOpeningEmailId] = useState(null);
  const [error, setError] = useState(null);
  const [showActionIcons, setShowActionIcons] = useState(false);
  const [hoveredService, setHoveredService] = useState(null);
  const navigate = useNavigate();

  const predefinedCategories = [
    { name: 'Чаты', icon: '/images/mail/bubble-chat.png' },
    { name: 'Социальные сети', icon: '/images/mail/social-media-blue.png' },
    { name: 'Удаленные', icon: '/images/mail/delete-blue.png' },
    { name: 'Покупки', icon: '/images/mail/shopping-cart-blue.png' },
    { name: 'Анонимные', icon: '/images/mail/anonymous-blue.png' },
    { name: 'Новости', icon: '/images/mail/news-blue.png' },
    { name: 'Консоль', icon: '/images/mail/console-blue.png' },
    { name: 'Билеты', icon: '/images/mail/ticket-blue.png' },
    { name: 'Работа', icon: '/images/mail/briefcase-blue.png' },
    { name: 'Личное', icon: '/images/mail/sex-blue.png' },
    { name: 'Google', icon: '/images/mail/account-google.png' },
    { name: 'Mail.ru', icon: '/images/mail/account-mail-ru.png' },
    { name: 'Yandex', icon: '/images/mail/account-yandex.png' },
    { name: 'Outlook', icon: '/images/mail/account-outlook.png' },
    { name: 'Yahoo', icon: '/images/mail/account-yahoo.png' },
    { name: 'AOL', icon: '/images/mail/account-aol.png' },
  ];

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }
        const response = await fetch('http://localhost:8000/api/profile/folders/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setFolders(data.map(folder => ({
            id: folder.folder_id,
            name: folder.folder_name,
            icon: folder.folder_icon || '/images/mail/folder-active.png',
            locked: ['Входящие', 'Отмеченное', 'Черновики', 'Отправленное'].includes(folder.folder_name),
          })));
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_id');
          navigate('/auth');
        } else {
          setError('Не удалось загрузить папки');
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
        setError('Ошибка подключения к серверу');
      }
    };

    const fetchMailServices = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }
        const response = await fetch('http://localhost:8000/api/mail/email-services/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMailServices(data.map(service => ({
            name: service.service_name,
            icon: service.service_icon,
          })));
        } else {
          setError('Не удалось загрузить почтовые сервисы');
        }
      } catch (error) {
        console.error('Error fetching mail services:', error);
        setError('Ошибка подключения к серверу');
      }
    };

    const fetchUserEmailAccounts = async () => {
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
          setUserEmailAccounts(data.email_accounts || []);
        } else {
          setError('Не удалось загрузить почтовые аккаунты пользователя');
        }
      } catch (error) {
        console.error('Error fetching user email accounts:', error);
        setError('Ошибка подключения к серверу');
      }
    };

    fetchFolders();
    fetchMailServices();
    fetchUserEmailAccounts();
  }, [navigate]);

  const handleSideNavClick = (itemNumber, folder = null) => {
    console.log(`Side-nav item ${itemNumber} clicked`);
    if (itemNumber === 5) {
      setIsCategoriesOpen(true);
    } else if (folder) {
      navigate(`/mail/${folder.name.toLowerCase()}`);
    }
  };

  const handlePanelIconClick = (iconNumber) => {
    console.log(`Panel icon ${iconNumber} clicked`);
    if (iconNumber === 2) {
      setIsMailServicesOpen(true);
    }
  };

  const handleCheckboxChange = (id) => {
    const updatedEmails = emails.map(email =>
      email.id === id ? { ...email, isChecked: !email.isChecked } : email
    );
    setEmails(updatedEmails);
    const hasCheckedEmails = updatedEmails.some(email => email.isChecked);
    setShowActionIcons(hasCheckedEmails);
  };

  const handleStarClick = (id) => {
    setEmails(emails.map(email =>
      email.id === id ? { ...email, isStarred: !email.isStarred } : email
    ));
  };

  const handleEmailClick = (email) => {
    setOpeningEmailId(email.id);
    setTimeout(() => {
      setEmails(emails.map(e =>
        e.id === email.id ? { ...e, unread: false } : e
      ));
      navigate('/email-view', { state: { email } });
      setOpeningEmailId(null);
    }, 500);
  };

  const closeCategories = () => {
    setIsCategoriesOpen(false);
    setError(null);
  };

  const closeMailServices = () => {
    setIsMailServicesOpen(false);
    setError(null);
  };

  const closeAddAccount = () => {
    setIsAddAccountOpen(false);
    setSelectedService(null);
    setEmailAddress('');
    setPassword('');
    setError(null);
  };

  const handleComposeClick = () => {
    navigate('/compose');
  };

  const handleSearchChange = (e) => {
    console.log('Search input:', e.target.value);
  };

  const handleSelectAll = () => {
    const allChecked = emails.every(e => e.isChecked);
    const updatedEmails = emails.map(email => ({ ...email, isChecked: !allChecked }));
    setEmails(updatedEmails);
    setShowActionIcons(!allChecked);
  };

  const handleReload = () => {
    console.log('Reloading emails...');
    setEmails([...emails]);
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  const handleAddCategory = async (category) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/profile/folders/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_name: category.name,
          folder_icon: category.icon,
          sort_order: 1000,
        }),
      });
      if (response.ok) {
        const newFolder = await response.json();
        setFolders([...folders, {
          id: newFolder.folder_id,
          name: newFolder.folder_name,
          icon: newFolder.folder_icon,
          locked: false,
        }]);
        setIsCategoriesOpen(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Не удалось добавить папку');
      }
    } catch (error) {
      console.error('Error adding folder:', error);
      setError('Ошибка подключения к серверу');
    }
  };

  const handleSelectMailService = (service) => {
    setSelectedService(service);
    setIsMailServicesOpen(false);
    setIsAddAccountOpen(true);
  };

  const handleAddMailService = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch('http://localhost:8000/api/mail/email-accounts/add/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_name: selectedService.name,
          email_address: emailAddress,
          password: password || null,
        }),
      });
      if (response.ok) {
        setIsAddAccountOpen(false);
        setEmailAddress('');
        setPassword('');
        setSelectedService(null);
        setError(null);
        console.log(`Added mail service: ${selectedService.name}`);
        const updatedResponse = await fetch('http://localhost:8000/api/profile/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (updatedResponse.ok) {
          const data = await updatedResponse.json();
          setUserEmailAccounts(data.email_accounts || []);
        }
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Не удалось добавить почтовый аккаунт';
        if (errorMessage.includes('You cannot add more than 2 email accounts for')) {
          errorMessage = `Нельзя добавить больше 2 почтовых аккаунтов для ${selectedService.name}`;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error adding mail service:', error);
      setError('Ошибка подключения к серверу');
    }
  };

  const handleMarkAsRead = () => {
    console.log('Marking selected emails as read...');
    const updatedEmails = emails.map(email =>
      email.isChecked ? { ...email, unread: false } : email
    );
    setEmails(updatedEmails);
    const hasCheckedEmails = updatedEmails.some(email => email.isChecked);
    setShowActionIcons(hasCheckedEmails);
  };

  const handleFilterEmails = () => {
    console.log('Filtering emails...');
  };

  const handleDeleteEmails = () => {
    console.log('Deleting selected emails...');
    const updatedEmails = emails.filter(email => !email.isChecked);
    setEmails(updatedEmails);
    setShowActionIcons(false);
  };

  const isServiceAdded = (serviceName) => {
    return userEmailAccounts.some(account => account.service.service_name === serviceName);
  };

  const isServiceLimitReached = (serviceName) => {
    const accountCount = userEmailAccounts.filter(
      account => account.service.service_name === serviceName
    ).length;
    return accountCount >= 2;
  };

  const addedServices = Array.from(new Set(userEmailAccounts.map(account => account.service.service_name)))
    .map(serviceName => {
      const category = predefinedCategories.find(cat => cat.name === serviceName);
      return {
        name: serviceName,
        icon: category ? category.icon : '/images/mail/default-service.png',
      };
    });

  const servicesWithAvatars = ['Mail.ru', 'Gmail', 'Proton', 'AOL', 'Yahoo', 'Outlook', 'Yandex'];

  return (
    <div className="mail-body">
      <main className="mail-content">
        <nav className="side-nav">
          <section className="image-layout">
            <section className="image-stack">
              <button className="side-nav-button" onClick={() => handleSideNavClick(1)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-inbox-active.png`}
                  alt="Product image 1"
                  className="product-image"
                />
              </button>
              <button className="side-nav-button" onClick={() => handleSideNavClick(2)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-marked.png`}
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button" onClick={() => handleSideNavClick(3)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-drafts.png`}
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button" onClick={() => handleSideNavClick(4)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-sender.png`}
                  className="product-image stack-spacing"
                />
              </button>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  className="side-nav-button"
                  onClick={() => handleSideNavClick(folder.id, folder)}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}${folder.icon}`}
                    alt={folder.name}
                    className="product-image stack-spacing"
                  />
                </button>
              ))}
              <button className="side-nav-button" onClick={() => handleSideNavClick(5)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-add.png`}
                  className="product-image stack-spacing"
                />
              </button>
              <div className="blue-divider"></div>
            </section>
            <section className="bottom-section">
              <button className="side-nav-button" onClick={() => handleSideNavClick(6)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-spam.png`}
                  alt="Bottom product image"
                  className="product-image"
                />
              </button>
            </section>
          </section>
        </nav>

        <section className="email-section">
          {error && <div className="error-message">{error}</div>}
          <div className="navigation-container">
            <div className="navigation-icons">
              <svg
                width="32"
                height="20"
                viewBox="0 0 32 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="menu-icon"
                onClick={handleSelectAll}
              >
                <rect width="20" height="20" fill="#D9D9D9" />
                <path d="M28.5 14L31.5311 8.75H25.4689L28.5 14Z" fill="#D9D9D9" />
              </svg>
              <img
                src={`${process.env.PUBLIC_URL}/images/mail/reload.png`}
                alt="Reload icon"
                className="reload-icon"
                onClick={handleReload}
              />
              {showActionIcons && (
                <>
                  <img
                    src={`${process.env.PUBLIC_URL}/images/mail/view.png`}
                    alt="Mark as read icon"
                    className="action-icon"
                    onClick={handleMarkAsRead}
                  />
                  <img
                    src={`${process.env.PUBLIC_URL}/images/mail/filter.png`}
                    alt="Filter icon"
                    className="action-icon"
                    onClick={handleFilterEmails}
                  />
                  <img
                    src={`${process.env.PUBLIC_URL}/images/mail/delete.png`}
                    alt="Delete icon"
                    className="action-icon"
                    onClick={handleDeleteEmails}
                  />
                </>
              )}
            </div>
            <div className="email-controls">
              <button className="calendar-button">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/calendar.png`}
                  alt="Calendar icon"
                  className="calendar-icon"
                  onClick={handleCalendarClick}
                />
              </button>
              <input
                type="text"
                className="search-button-container"
                placeholder="Поиск..."
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {emails.map(email => (
            <article
              key={email.id}
              className={`email-item ${email.unread ? 'email-item-unread' : ''} ${openingEmailId === email.id ? 'opening' : ''}`}
              onClick={() => handleEmailClick(email)}
            >
              <div className="checkbox-group">
                <div
                  className={`checkbox ${email.isChecked ? 'checkbox-checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckboxChange(email.id);
                  }}
                />
                <img
                  src={email.isStarred
                    ? `${process.env.PUBLIC_URL}/images/mail/star-marked.png`
                    : `${process.env.PUBLIC_URL}/images/mail/star.png`}
                  alt="Star"
                  className="email-status"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarClick(email.id);
                  }}
                />
              </div>
              <div className="avatar-group">
                <img src={email.senderAvatar} alt="Sender Avatar" className="avatar" />
              </div>
              <div className="email-text">
                <h3 className="email-title">{email.title}</h3>
                <p className="email-preview">{email.preview}</p>
              </div>
              <p className="email-date">{email.date}</p>
            </article>
          ))}
        </section>

        <aside className="side-panel">
          <main className="gallery-container">
            <section className="gallery-content">
              <button className="panel-button" onClick={() => handlePanelIconClick(1)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/account-all.png`}
                  className="gallery-image"
                  alt="All Accounts"
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
                    className="panel-button"
                    onClick={() => console.log(`Clicked on ${service.name} service`)}
                    onMouseEnter={() => setHoveredService(service.name)}
                    onMouseLeave={() => setHoveredService(null)}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${service.icon}`}
                      className="gallery-image gallery-image-bottom"
                      alt={`${service.name} icon`}
                    />
                  </button>
                </div>
              ))}
              <button className="panel-button" onClick={() => handlePanelIconClick(2)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/account-add.png`}
                  className="gallery-image gallery-image-bottom"
                  alt="Add Account"
                />
              </button>
            </section>
          </main>
        </aside>
      </main>

      {isCategoriesOpen && (
        <div className="modal-overlay" onClick={closeCategories}>
          <section className="categories-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="categories-title">Выберите категорию</h2>
            <div className="categories-grid">
              {predefinedCategories.map((category, index) => (
                <div className="category-item" key={index}>
                  <button
                    className="category-button"
                    onClick={() => handleAddCategory(category)}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${category.icon}`}
                      alt={category.name}
                      className="category-icon"
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {isMailServicesOpen && (
        <div className="modal-overlay" onClick={closeMailServices}>
          <section className="categories-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="categories-title">Выберите почтовый сервис</h2>
            <div className="categories-grid">
              {mailServices.map((service, index) => (
                <div className="category-item" key={index}>
                  <button
                    className="category-button"
                    onClick={() => handleSelectMailService(service)}
                    disabled={isServiceLimitReached(service.name)}
                    style={{ opacity: isServiceLimitReached(service.name) ? 0.5 : 1 }}
                    title={isServiceLimitReached(service.name) ? `Достигнут лимит в 2 аккаунта для ${service.name}` : ''}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${service.icon}`}
                      alt={service.name}
                      className="category-icon"
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {isAddAccountOpen && (
        <div className="modal-overlay" onClick={closeAddAccount}>
          <section className="categories-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="categories-title">Добавить аккаунт {selectedService?.name}</h2>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label htmlFor="emailAddress">Email</label>
              <input
                type="email"
                id="emailAddress"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Введите ваш email"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите ваш пароль (опционально)"
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button
                className="mail-add-button"
                onClick={handleAddMailService}
                disabled={!emailAddress}
              >
                Добавить
              </button>
              <button className="mail-cancel-button" onClick={closeAddAccount}>
                Отмена
              </button>
            </div>
          </section>
        </div>
      )}

      <button className="compose-button" onClick={handleComposeClick}>
        Написать
      </button>
    </div>
  );
};

export default MailPage;