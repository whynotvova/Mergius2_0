import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';

const SettingsItem = ({ iconSrc, label }) => {
  return (
    <article className="settings-item">
      <div className="icon-container">
        <img src={iconSrc} alt={`${label} Icon`} />
      </div>
      <p className="settings-label">{label}</p>
    </article>
  );
};

const SecurityPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('Не указан');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/profile/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Profile fetched:', data);
          setPhoneNumber(data.phone_number || 'Не указан');
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch profile:', response.status, errorData);
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching profile:', error.message);
        navigate('/login');
      }
    };
    if (token) {
      fetchProfile();
    } else {
      console.error('No auth token found');
      navigate('/login');
    }
  }, [navigate, token]);

  const handleDeleteClick = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/profile/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });
      if (response.ok) {
        console.log('Account deleted successfully');
        localStorage.removeItem('authToken');
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete account:', response.status, errorData);
        alert(`Ошибка при удалении аккаунта: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error.message);
      alert('Ошибка при удалении аккаунта.');
    }
  };

  return (
    <div className="security-body">
      <main className="page-body">
        <section className="settings-container">
          <SettingsItem
            iconSrc={`${process.env.PUBLIC_URL}/images/profile/phone.png`}
            label={phoneNumber}
          />
          <article className="settings-item" onClick={handleDeleteClick}>
            <div className="icon-container">
              <img src={`${process.env.PUBLIC_URL}/images/profile/delete.png`} alt="Delete Icon" />
            </div>
            <p className="settings-label">Удалить аккаунт</p>
          </article>
        </section>
      </main>
    </div>
  );
};

export default SecurityPage;