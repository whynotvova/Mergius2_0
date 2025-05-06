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

  // Process email from state and mark as read
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
        // Mark email as read
        await fetch(`http://localhost:8000/api/mail/emails/${emailData.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'read' }),
        });

        // Format recipients by type
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

  // Fetch folders
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
          setFolders(
            data.map(folder => ({
              id: folder.folder_id,
              name: folder.folder_name,
              icon: folder.folder_icon || '/images/mail/folder-active.png',
              locked: ['Входящие', 'Отмеченное', 'Черновики', 'Отправленное'].includes(folder.folder_name),
            }))
          );
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

  if (loading) {
    return <div className="email-view-body">Загрузка...</div>;
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
              <button className="side-nav-button" onClick={() => handleSideNavClick(1)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-inbox-active.png`}
                  alt="Входящие"
                  className="product-image"
                />
              </button>
              <button className="side-nav-button" onClick={() => handleSideNavClick(2)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-marked.png`}
                  alt="Отмеченное"
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button" onClick={() => handleSideNavClick(3)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-drafts.png`}
                  alt="Черновики"
                  className="product-image stack-spacing"
                />
              </button>
              <button className="side-nav-button" onClick={() => handleSideNavClick(4)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-sender.png`}
                  alt="Отправленное"
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
                  alt="Добавить папку"
                  className="product-image stack-spacing"
                />
              </button>
              <div className="blue-divider"></div>
            </section>
            <section className="bottom-section">
              <button className="side-nav-button" onClick={() => handleSideNavClick(6)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/folder-spam.png`}
                  alt="Спам"
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
          <h2 className="email-sender">
            От кого: <img src={email.senderAvatar} alt="Sender Avatar" className="inline w-6 h-6 mr-2" /> {email.sender}
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
          <section className="email-content">
            <header className="email-content-header">
              <p className="email-text" dangerouslySetInnerHTML={{ __html: email.content }} />
              <img
                src={`${process.env.PUBLIC_URL}/images/mail/translation.png`}
                alt="Перевести"
                className="translation-icon"
              />
            </header>
          </section>
          <footer className="email-actions">
            <button className="action-button">Ответить</button>
            <button className="action-button">Переслать</button>
            <button className="back-button" onClick={handleBackClick}>
              Назад
            </button>
          </footer>
        </section>

        <aside className="side-panel">
          <main className="gallery-container">
            <section className="gallery-content">
              <button className="panel-button" onClick={() => handleSideNavClick(7)}>
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/account-all.png`}
                  className="gallery-image"
                  alt="Все аккаунты"
                />
              </button>
              <button className="panel-button" onClick={() => handleSideNavClick(8)}>
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
    </div>
  );
};

export default EmailViewPage;