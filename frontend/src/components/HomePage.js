import React from 'react';
import '../styles/styles.css';

const HomePage = () => {
  return (
    <main>
      <section className="about-section">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/b43f423379edb45e66dc112c7103b563f42970d5"
          alt="Group 2"
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
              src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/291a4aeacecab31aa0fd265832f88ac1841c37bc?placeholderIfAbsent=true"
              alt="No Ads"
              className="feature-icon"
            />
            <h3 className="feature-title">Отсутствие рекламы</h3>
          </article>
          <article className="feature-card">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/490c7d65f53d121e2c6fc870d0ad02eee6966852?placeholderIfAbsent=true"
              alt="Flexible Messaging"
              className="feature-icon"
            />
            <h3 className="feature-highlight">Гибкая отправка сообщений</h3>
          </article>
        </div>
        <img
          src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/0250a57406f5302862c312c1bce462077a4b2707?placeholderIfAbsent=true"
          alt="Privacy"
          className="feature-image"
        />
        <h3 className="feature-highlight">Приватность и безопасность</h3>
        <div className="features-grid">
          <article className="feature-card">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/e884f0f52f5e99fcb46ff3d854f6cd46399d5a57?placeholderIfAbsent=true"
              alt="Email Management"
              className="feature-icon"
            />
            <h3 className="feature-highlight">Удобное управление почтой</h3>
          </article>
          <article className="feature-card">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/1083f9b1ec1a508a943f264f41ee8180e13181da?placeholderIfAbsent=true"
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
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/e9135778c4b782adb8586a4f39ec7e027cb23885?placeholderIfAbsent=true"
                alt="Gmail icon"
                className="icon-image"
              />
            </div>
            <h2 className="service-name service-name--red">Gmail</h2>
          </article>
          <article className="service-card">
            <div className="service-icon service-icon--blue">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/fee9730c98ea2da16104cfa540d2b615e401441f?placeholderIfAbsent=true"
                alt="Yahoo icon"
                className="icon-image"
              />
            </div>
            <h2 className="service-name service-name--blue">Yahoo</h2>
          </article>
          <article className="service-card service-card--offset">
            <div className="service-icon service-icon--blue">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/c8d3c858ec23ad31265a9d7157e0d4771c44c101?placeholderIfAbsent=true"
                alt="Mail.ru icon"
                className="icon-image"
              />
            </div>
            <h2 className="service-name service-name--blue">Mail.ru</h2>
          </article>
          <article className="service-card">
            <div className="service-icon service-icon--red">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/e9135778c4b782adb8586a4f39ec7e027cb23885?placeholderIfAbsent=true"
                alt="Gmail icon"
                className="icon-image"
              />
            </div>
            <h2 className="service-name service-name--red">Gmail</h2>
          </article>
          <article className="service-card service-card--offset">
            <div className="service-icon service-icon--red">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/fee9730c98ea2da16104cfa540d2b615e401441f?placeholderIfAbsent=true"
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
                <li>Добавление почтовых сервисов(До 3-х)</li>
                <li>Календарный вид</li>
                <li>Перевод писем</li>
                <li>Папки по категориям</li>
                <li>Редактирование письма</li>
                <li>Общий доступ к письму</li>
                <li>Изменение темы</li>
                <li>Диалоговая система</li>
              </ul>
            </article>
            <article className="pricing-card pricing-card--premium">
              <h3 className="pricing-title">Премиум</h3>
              <ul className="pricing-features">
                <li>Все что включено в тариф "Базовый"</li>
                <li>Кастомизация темы, папок</li>
                <li>Создание временной почты</li>
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
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/5c04037d380842db706614fea1a5e48fdbd0b9f3?placeholderIfAbsent=true"
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
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/f8de3a37ac097df0f98fdbd3a172a2846116430b?placeholderIfAbsent=true"
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
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/7df3584b63edef5aac8bc0aa2130ae2329dcce8d?placeholderIfAbsent=true"
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
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/f8de3a37ac097df0f98fdbd3a172a2846116430b?placeholderIfAbsent=true"
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
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/7df3584b63edef5aac8bc0aa2130ae2329dcce8d?placeholderIfAbsent=true"
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
              src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/5754efa1f4129b51ea20d65af08cce95b697f5c3?placeholderIfAbsent=true"
              alt="VC"
              className="social-icon"
            />
            <span className="social-name">VC</span>
          </a>
          <a href="#" className="social-link">
            <div className="social-icon-wrapper">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/20c74088640d4ca4961eb9996ca340f39a966ae7?placeholderIfAbsent=true"
                alt="VK"
                className="social-icon"
              />
            </div>
            <span className="social-name">VK</span>
          </a>
          <a href="#" className="social-link">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/28e1f6bb570943708910f922cccb8970/32faebae267c139dde767168e952619421e2fc01?placeholderIfAbsent=true"
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