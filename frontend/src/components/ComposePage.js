import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const ComposePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [userEmailAccounts, setUserEmailAccounts] = useState([]);
  const [selectedEmailAccountId, setSelectedEmailAccountId] = useState(null);
  const [hoveredService, setHoveredService] = useState(null);
  const [unreadCountsByService, setUnreadCountsByService] = useState({});
  const [unreadCountsByFolder, setUnreadCountsByFolder] = useState({});
  const [selectedServiceFilter, setSelectedServiceFilter] = useState(null);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [files, setFiles] = useState([]);
  const [activeIcons, setActiveIcons] = useState({
    'Undo': false,
    'Redo': false,
    'Attach File': false,
    'Emoji': false,
    'Text Color': false,
  });

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

  const toolbarIcons = {
    'Undo': {
      default: '/images/mail/arrow-left.png',
      active: '/images/mail/arrow-left-blue-hover.png',
    },
    'Redo': {
      default: '/images/mail/arrow-right.png',
      active: '/images/mail/arrow-right-blue-hover.png',
    },
    'Attach File': {
      default: '/images/mail/clip.png',
      active: '/images/mail/clip-blue.png',
    },
    'Emoji': {
      default: '/images/mail/smile.png',
      active: '/images/mail/smile-blue.png',
    },
    'Text Color': {
      default: '/images/mail/palette-black.png',
      active: '/images/mail/palette-black-blue.png',
    },
    'List': {
      default: '/images/mail/translation.png',
      active: '/images/mail/translation.png',
    },
  };

  const defaultFolders = ['Входящие', 'Отмеченное', 'Черновики', 'Отправленное', 'Спам'];

  const emojis = [
    '😊', '😂', '😍', '😢', '😡', '👍', '👎', '🙌', '🎉', '🚀',
    '❤️', '💔', '⭐', '🔥', '🌟', '🍎', '🍕', '☕', '🌈', '⚽',
    '😎', '🥳', '😺', '🐶', '🦁', '🍉', '🍔', '🍦', '🌻', '🎸',
    '🎤', '🎨', '📚', '✈️', '🌍', '💡', '🔮', '🦋', '🐝', '🍒',
    '😜', '😇', '🤓', '😈', '👻', '🎃', '🎄', '🎁', '🎂', '🍰',
    '🍓', '🍍', '🥐', '🥑', '🍜', '🍣', '🍷', '🍺', '🥤', '🍫',
    '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸', '🐵', '🦒', '🦓',
    '🦄', '🐉', '🐍', '🐢', '🐘', '🦏', '🦒', '🐳', '🐬', '🦑',
    '🌸', '🌺', '🌹', '🌷', '🌼', '🌴', '🌵', '🌾', '🍁', '🍂',
    '⛄', '☃️', '🌙', '☀️', '⭐', '☁️', '⚡', '🌪️', '🌊', '💧',
    '💥', '💫', '🎆', '🎇', '🎈', '🎀', '🎗️', '🎟️', '🎮', '🎲',
    '🏀', '🏈', '🎾', '🏓', '🏸', '🥊', '⛸️', '🏄', '🏂', '🚴',
    '🚗', '🚒', '🚀', '🛸', '🚢', '⛵', '🛶', '🚁', '🚜', '🛵'
  ];

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#800000', '#008000', '#000080',
    '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
    '#FFA500', '#FFD700', '#FF4500', '#DA70D6', '#7FFF00',
    '#20B2AA', '#FF69B4', '#00CED1', '#9932CC', '#ADFF2F',
    '#F08080', '#4682B4', '#9ACD32', '#BA55D3', '#7B68EE',
    '#FF6347', '#6A5ACD', '#32CD32', '#FF1493', '#00FA9A',
    '#1E90FF', '#FFDAB9', '#98FB98', '#FF00FF', '#40E0D0',
    '#DC143C', '#7CFC00', '#9932CC', '#F0E68C', '#00B7EB',
    '#FF4500', '#6B8E23', '#FF8C00', '#483D8B', '#20B2AA',
    '#B22222', '#66CDAA', '#FF69B4', '#228B22', '#CD5C5C',
    '#00FF7F', '#4169E1', '#FA8072', '#3CB371', '#FFA07A',
    '#8A2BE2', '#5F9EA0', '#DAA520', '#7FFFD4', '#B0C4DE',
    '#90EE90', '#FF7F50', '#ADD8E6', '#F0F8FF', '#E6E6FA',
    '#FFF0F5', '#FFE4E1', '#F5F5DC', '#FFE4B5', '#FFFACD'
  ];

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

  const removeFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const foldersResponse = await fetch('http://localhost:8000/api/mail/fetch/', {
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

        const accountsResponse = await fetch('http://localhost:8000/api/profile/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setUserEmailAccounts(accountsData.email_accounts || []);
          setUnreadCountsByService(accountsData.unread_counts_by_service || {});
          // Set default email account for new emails
          if (accountsData.email_accounts?.length > 0 && !location.state?.replyTo) {
            setSelectedEmailAccountId(accountsData.email_accounts[0].email_account_id);
          }
        } else {
          const errorData = await accountsResponse.json().catch(() => ({
            error: `Server error: ${foldersResponse.statusText}`
          }));
          setError(errorData.error || 'Не удалось загрузить почтовые аккаунты');
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Ошибка подключения к серверу');
      }
    };

    fetchInitialData();

    if (location.state?.replyTo?.sender) {
      setRecipient(location.state.replyTo.sender);
      setSubject(`Re: ${location.state.replyTo.subject || ''}`);
      if (location.state.replyTo.email_account?.email_account_id) {
        setSelectedEmailAccountId(location.state.replyTo.email_account.email_account_id);
      }
    }
  }, [navigate, location.state]);

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

  const handleSendClick = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Вы не авторизованы');
      navigate('/auth');
      return;
    }

    if (!selectedEmailAccountId) {
      setError('Выберите почтовый аккаунт для отправки');
      return;
    }

    const recipientEmail = recipient.trim();
    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      setError('Введите корректный адрес получателя');
      return;
    }

    const formData = new FormData();
    formData.append('email_account_id', selectedEmailAccountId);
    formData.append('recipient', recipientEmail);
    formData.append('subject', subject || 'Без темы');
    formData.append('body', editorRef.current.innerHTML || '');
    files.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file);
    });

    try {
      const response = await fetch('http://localhost:8000/api/mail/send/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось отправить письмо');
      }

      setSuccess('Письмо успешно отправлено');
      setFiles([]);
      setTimeout(() => navigate('/mail'), 2000);
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error.message || 'Ошибка при отправке письма');
    }
  };

  const handleScheduleClick = () => {
    console.log("Schedule button clicked");
  };

  const handleBackClick = () => {
    navigate('/mail');
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const setTextColor = (color) => {
    formatText('foreColor', color);
    setShowColorPicker(false);
    setActiveIcons(prev => ({ ...prev, 'Text Color': false }));
  };

  const insertEmoji = (emoji) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(emoji));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    setShowEmojiPicker(false);
    setActiveIcons(prev => ({ ...prev, 'Emoji': false }));
    editorRef.current.focus();
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB limit per file
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        setError(`Файл "${file.name}" превышает лимит в 10 МБ`);
        return false;
      }
      return true;
    });
    setFiles(prevFiles => [...prevFiles, ...validFiles]);
    setActiveIcons(prev => ({ ...prev, 'Attach File': false }));
    e.target.value = '';
  };

  const handleToolbarIconClick = (action) => {
    setActiveIcons(prev => ({ ...prev, [action]: !prev[action] }));
    if (action === 'Emoji') {
      setShowEmojiPicker(!showEmojiPicker);
      setShowColorPicker(false);
    } else if (action === 'Text Color') {
      setShowColorPicker(!showColorPicker);
      setShowEmojiPicker(false);
    } else if (action === 'Attach File') {
      fileInputRef.current.click();
    } else {
      console.log(`${action} clicked`);
    }
  };

  const handleUndoRedoClick = (action, command) => {
    formatText(command);
    setActiveIcons(prev => ({ ...prev, [action]: true }));
    setTimeout(() => {
      setActiveIcons(prev => ({ ...prev, [action]: false }));
    }, 500);
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

  return (
    <div className="compose-body">
      <main className="compose-content">
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
              </button>
              {folders.filter(folder => !defaultFolders.includes(folder.name)).map(folder => (
                <button
                  key={folder.id}
                  className={`side-nav-button ${selectedFolderFilter === folder.name ? 'active' : ''}`}
                  onClick={() => handleSideNavClick(folder.id, folder)}
                >
                  <div className="mail-icon-container">
                    <img
                      src={`${process.env.PUBLIC_URL}${folder.icon}`}
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
              </button>
            </section>
          </section>
        </nav>

        <section className="email-composer-section">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form className="email-composer">
            <header className="email-title">
              <input
                type="text"
                className="email-title-input"
                placeholder="Введите заголовок"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </header>

            <label className="from-label">
              От:
              <select
                className="from-select"
                value={selectedEmailAccountId || ''}
                onChange={(e) => setSelectedEmailAccountId(e.target.value)}
              >
                {userEmailAccounts.length === 0 ? (
                  <option value="">Нет доступных аккаунтов</option>
                ) : (
                  userEmailAccounts.map(account => (
                    <option key={account.email_account_id} value={account.email_account_id}>
                      {account.email_address}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="recipient-label">
              Кому:
              <input
                type="text"
                className="recipient-input"
                placeholder="Введите почту"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </label>

            <section className="editor-container">
              <div className="toolbar">
                <div className="toolbar-group formatting-basic">
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => handleUndoRedoClick('Undo', 'undo')}
                    title="Отменить"
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${activeIcons['Undo'] ? toolbarIcons['Undo'].active : toolbarIcons['Undo'].default}`}
                      alt="Undo"
                      className="toolbar-icon"
                    />
                  </button>
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => handleUndoRedoClick('Redo', 'redo')}
                    title="Повторить"
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${activeIcons['Redo'] ? toolbarIcons['Redo'].active : toolbarIcons['Redo'].default}`}
                      alt="Redo"
                      className="toolbar-icon"
                    />
                  </button>
                </div>

                <div className="toolbar-group text-styling">
                  <button
                    type="button"
                    className="format-btn bold"
                    onClick={() => formatText('bold')}
                    title="Жирный"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="format-btn italic"
                    onClick={() => formatText('italic')}
                    title="Курсив"
                  >
                    i
                  </button>
                  <button
                    type="button"
                    className="format-btn underline"
                    onClick={() => formatText('underline')}
                    title="Подчеркнутый"
                  >
                    U
                  </button>
                  <button
                    type="button"
                    className="format-btn strikethrough"
                    onClick={() => formatText('strikeThrough')}
                    title="Зачеркнутый"
                  >
                    S
                  </button>
                </div>

                <div className="toolbar-group formatting-advanced">
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('Attach File')}
                    title="Прикрепить файл"
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${activeIcons['Attach File'] ? toolbarIcons['Attach File'].active : toolbarIcons['Attach File'].default}`}
                      alt="Attach File"
                      className="toolbar-icon"
                    />
                  </button>
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('Emoji')}
                    title="Вставить эмодзи"
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${activeIcons['Emoji'] ? toolbarIcons['Emoji'].active : toolbarIcons['Emoji'].default}`}
                      alt="Emoji"
                      className="toolbar-icon"
                    />
                  </button>
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('Text Color')}
                    title="Цвет текста"
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${activeIcons['Text Color'] ? toolbarIcons['Text Color'].active : toolbarIcons['Text Color'].default}`}
                      alt="Text Color"
                      className="toolbar-icon"
                    />
                  </button>
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => handleToolbarIconClick('List')}
                    title="Список"
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${toolbarIcons['List'].default}`}
                      alt="List"
                      className="toolbar-icon"
                    />
                  </button>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                multiple
              />

              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      className="emoji-button"
                      onClick={() => insertEmoji(emoji)}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {showColorPicker && (
                <div className="color-picker">
                  {colors.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      className="color-button"
                      style={{ backgroundColor: color }}
                      onClick={() => setTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              )}

              <div
                className="editor-content"
                contentEditable="true"
                ref={editorRef}
                onInput={() => editorRef.current.innerHTML}
              >
              </div>

              {files.length > 0 && (
                <div className="attached-files">
                  <h4>Прикрепленные файлы:</h4>
                  <ul>
                    {files.map((file, index) => (
                      <li key={index} className="attached-file-item">
                        <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} МБ)</span>
                        <button
                          type="button"
                          className="remove-file-button"
                          onClick={() => removeFile(index)}
                          title="Удалить файл"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="action-buttons">
              <button type="submit" className="nav-button send-button" onClick={handleSendClick}>
                Отправить
              </button>
            </section>
          </form>
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
      <button className="back-button" onClick={handleBackClick}>
        Назад
      </button>
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

export default ComposePage;