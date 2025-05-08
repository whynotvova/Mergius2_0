import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import '../styles/styles.css';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([
    { id: 1, name: 'Входящие', locked: true },
    { id: 2, name: 'Отмеченное', locked: true },
    { id: 3, name: 'Черновики', locked: true },
    { id: 4, name: 'Отправленное', locked: true },
  ]);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [selectedEmailAccount, setSelectedEmailAccount] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [error, setError] = useState(null);
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
  ];

  useEffect(() => {
    const fetchFoldersAndAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const folderResponse = await fetch('http://localhost:8000/api/profile/folders/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (folderResponse.ok) {
          const data = await folderResponse.json();
          const fetchedFolders = data.map(folder => ({
            id: folder.id,
            name: folder.folder_name,
            locked: ['Входящие', 'Отмеченное', 'Черновики', 'Отправленное'].includes(folder.folder_name),
          }));
          const defaultFolders = [
            { id: 1, name: 'Входящие', locked: true },
            { id: 2, name: 'Отмеченное', locked: true },
            { id: 3, name: 'Черновики', locked: true },
            { id: 4, name: 'Отправленное', locked: true },
          ];
          const combinedFolders = [
            ...defaultFolders,
            ...fetchedFolders.filter(f => !defaultFolders.some(df => df.name === f.name)),
          ];
          setFolders(combinedFolders);
        } else if (folderResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_id');
          navigate('/auth');
        } else {
          setError('Не удалось загрузить папки');
          setFolders([
            { id: 1, name: 'Входящие', locked: true },
            { id: 2, name: 'Отмеченное', locked: true },
            { id: 3, name: 'Черновики', locked: true },
            { id: 4, name: 'Отправленное', locked: true },
          ]);
        }

        const accountResponse = await fetch('http://localhost:8000/api/mail/email-accounts/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (accountResponse.ok) {
          const accounts = await accountResponse.json();
          setEmailAccounts(accounts);
          if (accounts.length > 0) {
            setSelectedEmailAccount(accounts[0].email_account_id);
          }
        } else {
          setError('Не удалось загрузить почтовые аккаунты');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Ошибка подключения к серверу');
        setFolders([
          { id: 1, name: 'Входящие', locked: true },
          { id: 2, name: 'Отмеченное', locked: true },
          { id: 3, name: 'Черновики', locked: true },
          { id: 4, name: 'Отправленное', locked: true },
        ]);
      }
    };
    fetchFoldersAndAccounts();
  }, [navigate]);

  const handleAddCategory = async (category) => {
    if (folders.some(f => f.name === category.name)) {
      setError('Эта категория уже существует');
      return;
    }
    if (!selectedEmailAccount) {
      setError('Выберите почтовый аккаунт');
      return;
    }
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
          sort_order: folders.length + 1,
          email_account: selectedEmailAccount,
        }),
      });
      if (response.ok) {
        const newFolder = await response.json();
        setFolders([...folders, {
          id: newFolder.id,
          name: newFolder.folder_name,
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

  const handleDeleteFolder = async (id) => {
    if (!id || id === 'undefined') {
      setError('Недопустимый идентификатор папки');
      return;
    }
    if (window.confirm('Вы уверены, что хотите удалить эту папку?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/profile/folders/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          setFolders(folders.filter((folder) => folder.id !== id));
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Не удалось удалить папку');
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        setError('Ошибка подключения к серверу');
      }
    }
  };

  const handleFolderClick = (folder) => {
    if (!folder.locked) {
      navigate(`/mail/${folder.name.toLowerCase()}`);
    }
  };

  return (
    <div className="categories-body">
      <main className="container">
        {error && <div className="error-message">{error}</div>}
        <section className="folder-list">
          {folders.map((folder) => (
            <article
              key={folder.id}
              className="folder-card"
              onClick={() => handleFolderClick(folder)}
              style={{ cursor: folder.locked ? 'default' : 'pointer' }}
            >
              <div className="folder-icon-container">
                <div>
                  <img
                    src={`${process.env.PUBLIC_URL}/images/profile/folder-active.png`}
                    alt="Folder"
                    className="folder-icon"
                  />
                </div>
              </div>
              <h2 className="folder-title">{folder.name}</h2>
              {folder.locked ? (
                <img
                  src={`${process.env.PUBLIC_URL}/images/profile/lock.png`}
                  alt="Lock icon"
                  className="lock-icon"
                />
              ) : (
                <div className="action-buttons">
                  <img
                    src={`${process.env.PUBLIC_URL}/images/profile/delete.png`}
                    alt="Delete icon"
                    className="delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                  />
                </div>
              )}
            </article>
          ))}
          <article className="folder-card add-folder" onClick={() => setIsCategoriesOpen(true)}>
            <img
              src={`${process.env.PUBLIC_URL}/images/profile/add.png`}
              alt="Add new folder"
              className="plus-icon"
            />
          </article>
        </section>
      </main>

      {isCategoriesOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoriesOpen(false)}>
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

export default CategoriesPage;