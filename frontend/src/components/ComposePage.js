import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const ComposePage = () => {
  const navigate = useNavigate();
  const editorRef = useRef(null);
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

  const handlePanelIconClick = (iconNumber) => {
    console.log(`Panel icon ${iconNumber} clicked`);
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    console.log("Send button clicked");
  };

  const handleScheduleClick = () => {
    console.log("Schedule button clicked");
  };

  const handleBackClick = () => {
    navigate('/mail');
  };

  const formatText = (command) => {
    document.execCommand(command, false, null);
    editorRef.current.focus();
  };

  const handleToolbarIconClick = (action) => {
    console.log(`${action} clicked`);
  };

  return (
    <div className="compose-body">
      <main className="compose-content">
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

        <section className="email-composer-section">
          {error && <div className="error-message">{error}</div>}
          <form className="email-composer">
            <header className="email-title">
              <input
                type="text"
                className="email-title-input"
                placeholder="Введите заголовок"
                defaultValue=""
              />
            </header>

            <label className="recipient-label">
              <input
                type="text"
                className="recipient-input"
                placeholder="Введите почту"
                defaultValue=""
              />
            </label>

            <section className="editor-container">
              <div className="toolbar">
                <div className="toolbar-group formatting-basic">
                  <button
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('Insert Link')}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/images/mail/arrow-left.png`}
                      alt="Insert Link"
                      className="toolbar-icon"
                    />
                  </button>
                  <button
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('Insert Image')}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/images/mail/arrow-right.png`}
                      alt="Insert Image"
                      className="toolbar-icon"
                    />
                  </button>
                </div>

                <div className="toolbar-group text-styling">
                  <button
                    className="format-btn bold"
                    onClick={() => formatText('bold')}
                  >
                    B
                  </button>
                  <button
                    className="format-btn italic"
                    onClick={() => formatText('italic')}
                  >
                    i
                  </button>
                  <button
                    className="format-btn underline"
                    onClick={() => formatText('underline')}
                  >
                    U
                  </button>
                  <button
                    className="format-btn strikethrough"
                    onClick={() => formatText('strikeThrough')}
                  >
                    C
                  </button>
                </div>

                <div className="toolbar-group formatting-advanced">
                  <button
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('Align Left')}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/images/mail/clip.png`}
                      alt="Align Left"
                      className="toolbar-icon"
                    />
                  </button>
                  <button
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('Align Center')}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/images/mail/smile.png`}
                      alt="Align Center"
                      className="toolbar-icon"
                    />
                  </button>
                  <button
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('Align Right')}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/images/mail/palette-black.png`}
                      alt="Align Right"
                      className="toolbar-icon"
                    />
                  </button>
                  <button
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('List')}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/images/mail/translation.png`}
                      alt="List"
                      className="toolbar-icon"
                    />
                  </button>
                </div>
              </div>

              <div
                className="editor-content"
                contentEditable="true"
                ref={editorRef}
              >
                Текст письма
              </div>
            </section>

            <section className="action-buttons">
              <button type="submit" className="nav-button send-button" onClick={handleSendClick}>
                Отправить
              </button>
              <button
                type="button"
                className="nav-button schedule-button"
                onClick={handleScheduleClick}
              >
                Отложенная отправка
              </button>
            </section>
          </form>
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
      <button className="back-button" onClick={handleBackClick}>
        Назад
      </button>
    </div>
  );
};

export default ComposePage;