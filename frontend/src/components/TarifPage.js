import React, { useState } from 'react';
import '../styles/styles.css';

const Tarifs = () => {
  const [currentTariff, setCurrentTariff] = useState(null);

  const handleSelectTariff = (tariff) => {
    setCurrentTariff(tariff);
  };

  return (
    <main>
      <section className="pricing-section-page" id="pricing">
        <h2 className="section-title">Тарифы</h2>
        <div className="pricing-container">
          <div className="pricing-grid">
            <article className="pricing-card pricing-card--basic">
              <h3 className="pricing-title">Базовый</h3>
              <ul className="pricing-features">
                <li>Добавление почтовых сервисов(До 2-х)</li>
                <li>Календарный вид</li>
                <li>Папки по категориям</li>
                <li>Отправлять/удалять письма</li>
                <li>Изменение темы</li>
              </ul>
            </article>
            <article className="pricing-card pricing-card--premium">
              <h3 className="pricing-title">Премиум</h3>
              <ul className="pricing-features">
                <li>Все что включено в тариф "Базовый"</li>
                <li>Кастомизация темы</li>
                <li>Создание временной почты</li>
                <li>Перевод писем</li>
                <li>Убираются ограничения</li>
              </ul>
            </article>
          </div>
          <div className="pricing-actions">
            <button
              className={`pricing-button pricing-button--basic ${
                currentTariff === 'Персональный' ? 'pricing-button--selected' : ''
              }`}
              onClick={() => handleSelectTariff('Персональный')}
              disabled={currentTariff === 'Персональный'}
            >
              {currentTariff === 'Персональный' ? 'Выбрано' : 'Выбрать'}
            </button>
            <button
              className={`pricing-button pricing-button--premium ${
                currentTariff === 'Премиум' ? 'pricing-button--selected' : ''
              }`}
              onClick={() => handleSelectTariff('Премиум')}
              disabled={currentTariff === 'Премиум'}
            >
              {currentTariff === 'Премиум' ? 'Выбрано' : '399 ₽/мес'}
            </button>
          </div>
        </div>
      </section>
      <a href="https://t.me/mergius_support_bot" target="_blank" rel="noopener noreferrer" className="support-button">
        <img
          src={`${process.env.PUBLIC_URL}/images/mail/customer-support.png`}
          alt="Customer Support"
          className="support-icon"
        />
      </a>
    </main>
  );
};

export default Tarifs;