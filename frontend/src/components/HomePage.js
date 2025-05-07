import React from 'react';
import '../styles/styles.css';

const HomePage = () => {
  return (
    <main>
      <section className="about-section">
        <img
          src={`${process.env.PUBLIC_URL}/images/landing/M-img.png`}
          alt="M-img"
          className="about-image"
        />
        <article className="about-content">
          <h1 className="about-title">О Mergius</h1>
          <p className="about-description">
            Mergius – это современное решение для управления электронной почтой, которое позволяет подключить почтовые аккаунты из таких сервисов, как Gmail, Яндекс.Почта, Mail.ru, Yahoo и других, и управлять ими через единое окно. Мы стремимся сделать ваш почтовый опыт проще, быстрее и безопаснее.
          </p>
        </article>
      </section>

      <section className="features-section">
        <h2 className="section-title">Преимущества</h2>
        <div className="features-grid">
          <article className="feature-card">
            <img
              src={`${process.env.PUBLIC_URL}/images/landing/no-ad.png`}
              alt="No Ads"
              className="feature-icon"
            />
            <h3 className="feature-title">Отсутствие рекламы</h3>
          </article>
          <article className="feature-card">
            <img
              src={`${process.env.PUBLIC_URL}/images/landing/send-mail.png`}
              alt="Flexible Messaging"
              className="feature-icon"
            />
            <h3 className="feature-highlight">Гибкая отправка сообщений</h3>
          </article>
        </div>
        <img
          src={`${process.env.PUBLIC_URL}/images/landing/shield-security.png`}
          alt="Privacy"
          className="feature-image"
        />
        <h3 className="feature-highlight">Приватность и безопасность</h3>
        <div className="features-grid">
          <article className="feature-card">
            <img
              src={`${process.env.PUBLIC_URL}/images/landing/control-mail.png`}
              alt="Email Management"
              className="feature-icon"
            />
            <h3 className="feature-highlight">Удобное управление почтой</h3>
          </article>
          <article className="feature-card">
            <img
              src={`${process.env.PUBLIC_URL}/images/landing/custom-folder.png`}
              alt="Customization"
              className="feature-icon"
            />
            <h3 className="feature-title">Кастомизация тем и папок</h3>
          </article>
        </div>
      </section>

      <section className="email-services">
        <h1 className="title">Почтовые сервисы</h1>
        <p className="description">
          Mergius интегрируется с популярными почтовыми сервисами, обеспечивая синхронизацию и управление вашей электронной корреспонденцией через единый интерфейс.
        </p>
        <div className="services-grid">
          <article className="service-card service-card--offset">
            <div className="service-icon service-icon--red">
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/google-logo.png`}
                alt="Gmail icon"
                className="icon-image"
              />
            </div>
            <h2 className="service-name service-name--red">Gmail</h2>
          </article>
          <article className="service-card">
            <div className="service-icon service-icon--blue">
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/yahoo-logo.png`}
                alt="Yahoo icon"
                className="icon-image"
              />
            </div>
            <h2 className="service-name service-name--blue">Yahoo</h2>
          </article>
          <article className="service-card service-card--offset">
            <div className="service-icon service-icon--blue">
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/mail-logo.png`}
                alt="Mail.ru icon"
                className="icon-image"
              />
            </div>
            <h2 className="service-name service-name--blue">Mail.ru</h2>
          </article>
          <article className="service-card">
            <div className="service-icon service-icon--red">
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/google-logo.png`}
                alt="Gmail icon"
                className="icon-image"
              />
            </div>
            <h2 className="service-name service-name--red">Gmail</h2>
          </article>
          <article className="service-card service-card--offset">
            <div className="service-icon service-icon--red">
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/yahoo-logo.png`}
                alt="Yahoo icon"
                className="icon-image"
              />
            </div>
            <h2 className="service-name service-name--red">Yahoo</h2>
          </article>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
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
            <button className="pricing-button pricing-button--basic">Выбрать</button>
            <button className="pricing-button pricing-button--premium">Выбрать</button>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <h2 className="section-title">Вопрос-Ответ</h2>
        <div className="faq-list">
          <details className="faq-item faq-item--blue">
            <summary className="faq-question">
              <span>Как зарегистрироваться?</span>
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/check-mark-blue.png`}
                alt="Toggle"
                className="faq-toggle"
              />
            </summary>
            <div className="faq-answer">
              Нажмите «Регистрация», выберите способ регистрации, по номеру телефона или с помощью почты, подтвердите почту или телефон
            </div>
          </details>
          <details className="faq-item faq-item--red">
            <summary className="faq-question">
              <span>Как добавить почту?</span>
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/check-mark-red.png`}
                alt="Toggle"
                className="faq-toggle"
              />
            </summary>
            <div className="faq-answer">
              На главной странице почты нажмите на круг со знком «+», выберите сервис (Gmail, Яндекс и т.д.), войдите через OAuth и подтвердите доступ.
            </div>
          </details>
          <details className="faq-item faq-item--blue">
            <summary className="faq-question">
              <span>Почему не отправляется письмо?</span>
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/check-mark-blue.png`}
                alt="Toggle"
                className="faq-toggle"
              />
            </summary>
            <div className="faq-answer">
              Это может быть связано с: Неправильным адресом получателя, Переполненным ящиком, Проблемами с подключением к почтовому серверу. Попробуйте проверить настройки аккаунта и повторить попытку.
            </div>
          </details>
          <details className="faq-item faq-item--red">
            <summary className="faq-question">
              <span>Как перейти на другой тариф?</span>
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/check-mark-red.png`}
                alt="Toggle"
                className="faq-toggle"
              />
            </summary>
            <div className="faq-answer">
              Нажмите на кнопку «Тарифы», выберите нужный пакет (обычный или премиум) и нажмите «Выбрать», следуя дальнейшим инструкциям.
            </div>
          </details>
          <details className="faq-item faq-item--blue">
            <summary className="faq-question">
              <span>Почему не создается временная почта?</span>
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/check-mark-blue.png`}
                alt="Toggle"
                className="faq-toggle"
              />
            </summary>
            <div className="faq-answer">
              Проверьте, не исчерпан ли лимит временных ящиков для вашего аккаунта. Также убедитесь, что у вас есть тариф «Премиум».
            </div>
          </details>
        </div>
      </section>

      <section className="contact-section">
        <h2 className="section-title">Контакты</h2>
        <div className="social-links">
          <a href="#" className="social-link">
            <img
              src={`${process.env.PUBLIC_URL}/images/landing/vc-logo.png`}
              alt="VC"
              className="social-icon"
            />
            <span className="social-name">VC</span>
          </a>
          <a href="#" className="social-link">
            <div className="social-icon-wrapper">
              <img
                src={`${process.env.PUBLIC_URL}/images/landing/vk-logo.png`}
                alt="VK"
                className="social-icon"
              />
            </div>
            <span className="social-name">VK</span>
          </a>
          <a href="#" className="social-link">
            <img
              src={`${process.env.PUBLIC_URL}/images/landing/tg-logo.png`}
              alt="Telegram"
              className="social-icon"
            />
            <span className="social-name">TG</span>
          </a>
        </div>
      </section>
    </main>
  );
};

export default HomePage;