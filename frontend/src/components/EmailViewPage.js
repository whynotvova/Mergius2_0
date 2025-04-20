import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const EmailViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};

  const handleBackClick = () => {
    navigate('/mail');
  };

  if (!email) {
    return <div>No email data available</div>;
  }

  return (
    <div className="email-view-body">
      <main className="email-view-content">
        <nav className="side-nav">
          <section className="image-layout">
            <section className="image-stack">
              <button className="side-nav-button">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-inbox-active.png`}
                  alt="Product image 1"
                  className="product-image"
                />
              </button>
              <button className="side-nav-button">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-marked.png`}
                  alt="Product image 2"
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-drafts.png`}
                  alt="Product image 3"
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-sender.png`}
                  alt="Product image 4"
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-add.png`}
                  alt="Product image 5"
                  className="product-image stack-spacing"
                />
              </button>
              <div className="blue-divider"></div>
            </section>
            <section className="bottom-section">
              <button className="side-nav-button">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-spam.png`}
                  alt="Bottom product image"
                  className="product-image"
                />
              </button>
            </section>
          </section>
        </nav>

        <section className="email-message">
          <header className="email-header">
            <div className="email-header-container">
              <h1 className="email-title">{email.title}</h1>
              <time className="email-date">{email.date}</time>
            </div>
          </header>
          <h2 className="email-sender">От кого: {email.sender}</h2>
          <h3 className="email-recipient">Кому: {email.recipient}</h3>
          <section className="email-content">
            <header className="email-content-header">
              <p className="email-text">{email.content}</p>
              <img
                src={`${process.env.PUBLIC_URL}/images/mail/translation.png`}
                alt="Translate"
                className="translation-icon"
              />
            </header>
          </section>
          <footer className="email-actions">
            <button className="action-button">Ответить</button>
            <button className="action-button">Переслать</button>
          </footer>
        </section>

        <aside className="side-panel">
          <main className="gallery-container">
            <section className="gallery-content">
              <button className="panel-button">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/account-all.png`}
                  className="gallery-image"
                  alt=""
                />
              </button>
              <button className="panel-button">
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

      <button className="back-button" onClick={handleBackClick}>
        Назад
      </button>
    </div>
  );
};

export default EmailViewPage;