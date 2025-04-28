import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const EmailViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState(null);
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
    if (folder) {
      navigate(`/mail/${folder.name.toLowerCase()}`);
    }
  };

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

        <section className="email-message">
          {error && <div className="error-message">{error}</div>}
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
              <button className="panel-button" onClick={() => handleSideNavClick(7)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/account-all.png`}
                  className="gallery-image"
                  alt=""
                />
              </button>
              <button className="panel-button" onClick={() => handleSideNavClick(8)}>
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