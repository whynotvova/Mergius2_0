import React, { useState } from 'react';
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

  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [openingEmailId, setOpeningEmailId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  const categoryImages = [
    `${process.env.PUBLIC_URL}/images/mail/bubble-chat.png`,
    `${process.env.PUBLIC_URL}/images/mail/social-media-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/delete-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/shopping-cart-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/anonymous-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/news-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/console-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/ticket-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/briefcase-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/sex-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/google-logo.png`,
    `${process.env.PUBLIC_URL}/images/mail/mail-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/yandex-red.png`,
    `${process.env.PUBLIC_URL}/images/mail/email-blue.png`,
    `${process.env.PUBLIC_URL}/images/mail/yahoo-logo.png`,
  ];

  const handleSideNavClick = (itemNumber) => {
    console.log(`Side-nav item ${itemNumber} clicked`);
    if (itemNumber === 5) {
      setIsCategoriesOpen(true);
    }
  };

  const handlePanelIconClick = (iconNumber) => {
    console.log(`Panel icon ${iconNumber} clicked`);
  };

  const handleCheckboxChange = (id) => {
    setEmails(emails.map(email =>
      email.id === id ? { ...email, isChecked: !email.isChecked } : email
    ));
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
    setSelectedCategory(null);
  };

  const handleComposeClick = () => {
    navigate('/compose');
  };

  const handleSearchChange = (e) => {
    console.log('Search input:', e.target.value);
  };

  const handleSelectAll = () => {
    setEmails(emails.map(email => ({ ...email, isChecked: !emails.every(e => e.isChecked) })));
  };

  const handleReload = () => {
    console.log('Reloading emails...');
    setEmails([...emails]);
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  const handleCategoryClick = (index) => {
    setSelectedCategory(index);
    console.log(`Category ${index + 1} clicked`);
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
          <div className="navigation-container">
            <div className="navigation-icons">
              <svg
                width="32"
                height="20"
                viewBox="0 0 32 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="menu-icon"
                onClick={handleSelectAll}>
                <rect width="20" height="20" fill="#D9D9D9" />
                <path d="M28.5 14L31.5311 8.75H25.4689L28.5 14Z" fill="#D9D9D9" />
              </svg>
              <img
                src={`${process.env.PUBLIC_URL}/images/mail/reload.png`}
                alt="Reload icon"
                className="reload-icon"
                onClick={handleReload}
              />
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
            <h2 className="categories-title">Категории</h2>
            <div className="categories-grid">
              {categoryImages.map((image, index) => (
                <div className="category-item" key={index}>
                  <button
                    className={`category-button ${selectedCategory === index ? 'chat-border' : ''}`}
                    onClick={() => handleCategoryClick(index)}
                  >
                    <img
                      src={image}
                      alt={`Category ${index + 1}`}
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