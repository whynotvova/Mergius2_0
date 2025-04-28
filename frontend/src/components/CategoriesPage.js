import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Box, TextField, Button } from '@mui/material';
import '../styles/styles.css';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([
    { id: 1, name: 'Входящие', locked: true },
    { id: 2, name: 'Отмеченное', locked: true },
    { id: 3, name: 'Черновики', locked: true },
    { id: 4, name: 'Отправленное', locked: true },
  ]);
  const [openModal, setOpenModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
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
          const fetchedFolders = data.map(folder => ({
            id: folder.folder_id,
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
        } else if (response.status === 401) {
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
      } catch (error) {
        console.error('Error fetching folders:', error);
        setError('Ошибка подключения к серверу');
        setFolders([
          { id: 1, name: 'Входящие', locked: true },
          { id: 2, name: 'Отмеченное', locked: true },
          { id: 3, name: 'Черновики', locked: true },
          { id: 4, name: 'Отправленное', locked: true },
        ]);
      }
    };
    fetchFolders();
  }, [navigate]);

  const handleAddCategory = async (category) => {
    if (folders.some(f => f.name === category.name)) {
      setError('Эта категория уже существует');
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
        }),
      });
      if (response.ok) {
        const newFolder = await response.json();
        setFolders([...folders, {
          id: newFolder.folder_id,
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

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setNewFolderName('');
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Название папки не может быть пустым');
      return;
    }
    if (folders.some(f => f.name === newFolderName)) {
      setError('Папка с таким именем уже существует');
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
          folder_name: newFolderName,
          folder_icon: '/images/mail/folder-active.png',
          sort_order: folders.length + 1,
        }),
      });
      if (response.ok) {
        const newFolder = await response.json();
        setFolders([...folders, {
          id: newFolder.folder_id,
          name: newFolder.folder_name,
          locked: false,
        }]);
        handleCloseModal();
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

  const handleEditFolder = async (id) => {
    const newName = prompt('Введите новое название папки:');
    if (newName && newName.trim()) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/profile/folders/${id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folder_name: newName,
          }),
        });
        if (response.ok) {
          setFolders(
            folders.map((folder) =>
              folder.id === id ? { ...folder, name: newName } : folder
            )
          );
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Не удалось обновить папку');
        }
      } catch (error) {
        console.error('Error updating folder:', error);
        setError('Ошибка подключения к серверу');
      }
    }
  };

  const handleDeleteFolder = async (id) => {
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
                    src={`${process.env.PUBLIC_URL}/images/profile/edit.png`}
                    alt="Edit icon"
                    className="edit-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditFolder(folder.id);
                    }}
                  />
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

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: '#fff',
            borderRadius: '20px',
            boxShadow: 24,
            p: 4,
          }}
        >
          <h2>Добавить новую папку</h2>
          <TextField
            fullWidth
            label="Название папки"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            margin="normal"
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={handleAddFolder}>
              Добавить
            </Button>
            <Button variant="outlined" onClick={handleCloseModal}>
              Отмена
            </Button>
          </Box>
        </Box>
      </Modal>

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
    </div>
  );
};

export default CategoriesPage;