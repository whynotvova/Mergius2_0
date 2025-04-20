import React, { useState } from 'react';
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

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setNewFolderName('');
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      setFolders([
        ...folders,
        { id: folders.length + 1, name: newFolderName, locked: false },
      ]);
      handleCloseModal();
    }
  };

  const handleEditFolder = (id) => {
    const newName = prompt('Введите новое название папки:');
    if (newName && newName.trim()) {
      setFolders(
        folders.map((folder) =>
          folder.id === id ? { ...folder, name: newName } : folder
        )
      );
    }
  };

  const handleDeleteFolder = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту папку?')) {
      setFolders(folders.filter((folder) => folder.id !== id));
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
          <article className="folder-card add-folder" onClick={handleOpenModal}>
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
    </div>
  );
};

export default CategoriesPage;