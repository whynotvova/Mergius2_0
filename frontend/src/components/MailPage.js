import React from 'react';
import '../styles/styles.css';

const MailPage = () => {
  return (
    <main className="content-wrapper">
      <nav className="folder-sidebar">
        <button className="folder-item">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/cbd440625c0ec2fb4185c7a2e34560e79ab69d21"
            alt="Folder"
            className="folder-icon"
          />
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/8f299f1edaad71760e9d41ee8048af6806e0e845"
            alt="Inbox"
            className="folder-inner-icon"
          />
        </button>
        <button className="folder-item">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/f185b1e68e162fe4785a96ef52bc07e134a9631e"
            alt="Folder"
            className="folder-icon"
          />
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/f3617be7da56271756a628ea917e3b327c8c1ebe"
            alt="Draft"
            className="folder-inner-icon"
          />
        </button>
        <button className="folder-item">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/f185b1e68e162fe4785a96ef52bc07e134a9631e"
            alt="Folder"
            className="folder-icon"
          />
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/f3617be7da56271756a628ea917e3b327c8c1ebe"
            alt="Draft"
            className="folder-inner-icon"
          />
        </button>
        <button className="folder-item">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/f185b1e68e162fe4785a96ef52bc07e134a9631e"
            alt="Folder"
            className="folder-icon"
          />
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/149baaac8a66f7e9ab15e85c7b012a3caad7aeaa"
            alt="Sent"
            className="folder-inner-icon"
          />
        </button>
        <button className="folder-item">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/f185b1e68e162fe4785a96ef52bc07e134a9631e"
            alt="Folder"
            className="folder-icon"
          />
          <span className="add-folder">+</span>
        </button>
        <div className="folder-separator"></div>
        <button className="folder-item">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/d04a64f136c8fa5ea71f331b59f154ed7f402302"
            alt="Folder"
            className="folder-icon"
          />
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/841e19ec8129e92dd5d0468083f441056b1225f9"
            alt="Spam"
            className="folder-inner-icon"
          />
        </button>
      </nav>
      <section className="email-content">
        <div className="toolbar">
          <div className="toolbar-left">
            <svg
              width="32"
              height="20"
              viewBox="0 0 32 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="menu-icon"
            >
              <rect width="20" height="20" fill="#D9D9D9" />
              <path d="M28.5 14L31.5311 8.75H25.4689L28.5 14Z" fill="#D9D9D9" />
            </svg>
            <button className="toolbar-button">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/e0b276179018729da9741bbd74a9a2ddb1b85b9c"
                alt="Reload"
                className="toolbar-icon"
              />
            </button>
            <button className="toolbar-button">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/0867799c2e74234d6aadf89495522eaaf9b5224e"
                alt="Calendar"
                className="toolbar-icon calendar"
              />
            </button>
          </div>
          <div className="search-bar">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/62a82e94625a3010f508fe6972c48dd351f4c119"
              alt="Search"
              className="search-icon"
            />
          </div>
        </div>
        <div className="email-list">
          <article className="email-item">
            <input type="checkbox" className="email-checkbox" />
            <input type="checkbox" className="email-checkbox" />
            <div className="sender-avatar"></div>
            <div className="recipient-avatar"></div>
            <div className="email-details">
              <h3>Заголовок</h3>
              <p>Текст письма</p>
              <time>Дата письма</time>
            </div>
          </article>
          <article className="email-item selected">
            <input type="checkbox" className="email-checkbox" />
            <input type="checkbox" className="email-checkbox" />
            <div className="sender-avatar"></div>
            <div className="recipient-avatar"></div>
            <div className="email-details">
              <h3>Заголовок</h3>
              <p>Текст письма</p>
              <time>Дата письма</time>
            </div>
          </article>
        </div>
      </section>
      <aside className="action-sidebar">
        <button className="action-button">
          <div className="action-circle">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/8f299f1edaad71760e9d41ee8048af6806e0e845"
              alt="Action"
              className="action-icon"
            />
          </div>
        </button>
        <button className="action-button">
          <div className="action-circle">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/f3617be7da56271756a628ea917e3b327c8c1ebe"
              alt="Action"
              className="action-icon"
            />
          </div>
        </button>
      </aside>
    </main>
  );
};

export default MailPage;