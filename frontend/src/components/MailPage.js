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
  const [openingEmailId, setOpeningEmailId] = useState(null);
  const [error, setError] = useState(null);
  const [showActionIcons, setShowActionIcons] = useState(false);
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
    { name: 'Google', icon: '/images/mail/google-logo.png' },
    { name: 'Mail.ru', icon: '/images/mail/mail-blue.png' },
    { name: 'Yandex', icon: '/images/mail/yandex-red.png' },
    { name: 'Email', icon: '/images/mail/email-blue.png' },
    { name: 'Yahoo', icon: '/images/mail/yahoo-logo.png' },
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
    fetchFolders();
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
  };

  const handleCheckboxChange = (id) => {
    const updatedEmails = emails.map(email =>
      email.id === id ? { ...email, isChecked: !email.isChecked } : email
    );
    setEmails(updatedEmails);
    // Show action icons if at least one email is checked
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
    // Show action icons if emails are selected, hide if all are deselected
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

  const handleMarkAsRead = () => {
    console.log('Marking selected emails as read...');
    const updatedEmails = emails.map(email =>
      email.isChecked ? { ...email, unread: false } : email
    );
    setEmails(updatedEmails);
    // Check if any emails are still checked after the action
    const hasCheckedEmails = updatedEmails.some(email => email.isChecked);
    setShowActionIcons(hasCheckedEmails);
  };

  const handleFilterEmails = () => {
    console.log('Filtering emails...');
    // Add filtering logic here (e.g., show only unread emails)
  };

  const handleDeleteEmails = () => {
    console.log('Deleting selected emails...');
    const updatedEmails = emails.filter(email => !email.isChecked);
    setEmails(updatedEmails);
    // After deletion, no emails should be checked, so hide action icons
    setShowActionIcons(false);
  };

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
                  alt=""
                />
              </button>
              <button className="panel-button" onClick={() => handlePanelIconClick(2)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/account-add.png`}
                  className="gallery-image gallery-image-bottom"
                  alt=""
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

      <button className="compose-button" onClick={handleComposeClick}>
        Написать
      </button>
    </div>
  );
};

export default MailPage;