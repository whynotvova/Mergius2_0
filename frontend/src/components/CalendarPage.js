import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const generateEmailsForDate = (date) => {
  const dateString = date.toISOString().split('T')[0];
  return [
    {
      id: `${dateString}-1`,
      senderAvatar: 'https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/8ae3f093eabf8b5a51c987337fc769cfae4e8b74?placeholderIfAbsent=true',
      sender: 'Иванов Иван',
      subject: `Конференция ${dateString}`,
      preview: 'Что-то когда-то куда-то надо...',
      date: dateString,
      isUnread: Math.random() > 0.5,
    },
    {
      id: `${dateString}-2`,
      senderAvatar: 'https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/8ae3f093eabf8b5a51c987337fc769cfae4e8b74?placeholderIfAbsent=true',
      sender: 'Петров Петр',
      subject: `Изменения ${dateString}`,
      preview: 'Посмотри последнее изменение...',
      date: dateString,
      isUnread: Math.random() > 0.5,
    },
  ];
};

const CalendarPage = () => {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    return new Date(today.setDate(today.getDate() - (day === 0 ? 6 : day - 1)));
  });

  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [openingEmailId, setOpeningEmailId] = useState(null);

  const [emailStates, setEmailStates] = useState({});

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

  const navigate = useNavigate();
  const handleNextWeek = () => {
    setStartDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handlePrevWeek = () => {
    setStartDate((prev) => {
      const prevWeek = new Date(prev);
      prevWeek.setDate(prev.getDate() - 7);
      return prevWeek;
    });
  };
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 8; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  const getEmailsForDate = (date) => {
    const emails = generateEmailsForDate(date);
    return emails.map((email) => ({
      ...email,
      isChecked: emailStates[email.id]?.isChecked || false,
      isStarred: emailStates[email.id]?.isStarred || Math.random() > 0.5,
    }));
  };

  // Handlers for MailPage-like functionality
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
    setEmailStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isChecked: !prev[id]?.isChecked,
        isStarred: prev[id]?.isStarred || Math.random() > 0.5,
      },
    }));
    console.log(`Checkbox toggled for email ${id}`);
  };

  const handleStarClick = (id) => {
    setEmailStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isChecked: prev[id]?.isChecked || false,
        isStarred: !prev[id]?.isStarred,
      },
    }));
    console.log(`Star toggled for email ${id}`);
  };

  const handleEmailClick = (email) => {
    setOpeningEmailId(email.id);
    setTimeout(() => {
      console.log('Navigating to email-view with email:', email);
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
    const allEmails = dates.flatMap((date) => getEmailsForDate(date));
    const allChecked = allEmails.every((email) => email.isChecked);
    const newEmailStates = {};
    allEmails.forEach((email) => {
      newEmailStates[email.id] = {
        isChecked: !allChecked,
        isStarred: emailStates[email.id]?.isStarred || email.isStarred,
      };
    });
    setEmailStates(newEmailStates);
    console.log('Select all toggled');
  };

  const handleReload = () => {
    console.log('Reloading emails...');
  };

  const handleCalendarClick = () => {
    console.log('Navigating to MailPage');
    navigate('/mail');
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
                  alt="Product image 2"
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button" onClick={() => handleSideNavClick(3)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-drafts.png`}
                  alt="Product image 3"
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button" onClick={() => handleSideNavClick(4)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-sender.png`}
                  alt="Product image 4"
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button" onClick={() => handleSideNavClick(5)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-add.png`}
                  alt="Product image 5"
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
              <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="menu-icon" onClick={handleSelectAll}>
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
              <button className="calendar-button" onClick={handleCalendarClick} aria-label="Go to Mail Page">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/burger-bar.png`}
                  alt="Calendar icon"
                  className="calendar-icon"
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

          <div className="email-list">
            <div className="email-columns">
              {dates.slice(0, 4).map((date, index) => {
                const emails = getEmailsForDate(date);
                const columnClass = `column column-${
                  index === 0 ? 'first' :
                  index === 1 ? 'second' :
                  index === 2 ? 'third' : 'fourth'
                }`;
                return (
                  <div
                    key={date.toISOString()}
                    className={columnClass}
                    onClick={index === 0 ? handleNextWeek : null}
                  >
                    <div className="column-content">
                      <div className="email-container">
                        <div className="date-label">
                          {formatDate(date)}
                        </div>
                        <div className="email-list-container">
                          {emails.length > 0 ? (
                            emails.map((email) => (
                              <article
                                key={email.id}
                                className={`email-item ${email.isUnread ? 'email-item-unread' : ''} ${
                                  openingEmailId === email.id ? 'opening' : ''
                                }`}
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
                                    src={
                                      email.isStarred
                                        ? `${process.env.PUBLIC_URL}/images/mail/star-marked.png`
                                        : `${process.env.PUBLIC_URL}/images/mail/star.png`
                                    }
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
                                <div className="email-content">
                                  <h3 className="email-header">{email.subject}</h3>
                                  <p className="email-text">{email.preview}</p>
                                </div>
                              </article>
                            ))
                          ) : (
                            <div className="date-label empty-column">No emails</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="email-columns">
              {dates.slice(4, 8).map((date, index) => {
                const emails = getEmailsForDate(date);
                const columnClass = `column column-${
                  index === 0 ? 'second' :
                  index === 1 ? 'third' :
                  index === 2 ? 'fourth' : 'first'
                }`;
                return (
                  <div
                    key={date.toISOString()}
                    className={columnClass}
                    onClick={index === 3 ? handlePrevWeek : null}
                  >
                    <div className="column-content">
                      <div className="email-container">
                        <div className="date-label">
                          {formatDate(date)}
                        </div>
                        <div className="email-list-container">
                          {emails.length > 0 ? (
                            emails.map((email) => (
                              <article
                                key={email.id}
                                className={`email-item ${email.isUnread ? 'email-item-unread' : ''} ${
                                  openingEmailId === email.id ? 'opening' : ''
                                }`}
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
                                    src={
                                      email.isStarred
                                        ? `${process.env.PUBLIC_URL}/images/mail/star-marked.png`
                                        : `${process.env.PUBLIC_URL}/images/mail/star.png`
                                    }
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
                                <div className="email-content">
                                  <h3 className="email-header">{email.subject}</h3>
                                  <p className="email-text">{email.preview}</p>
                                </div>
                              </article>
                            ))
                          ) : (
                            <div className="date-label empty-column">No emails</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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

export default CalendarPage;