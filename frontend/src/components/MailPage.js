import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/styles.css';

const MailPage = () => {
  const [emails, setEmails] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMailServicesOpen, setIsMailServicesOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFolderFilterOpen, setIsFolderFilterOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [mailServices, setMailServices] = useState([]);
  const [userEmailAccounts, setUserEmailAccounts] = useState([]);
  const [openingEmailId, setOpeningEmailId] = useState(null);
  const [error, setError] = useState(null);
  const [showActionIcons, setShowActionIcons] = useState(false);
  const [hoveredService, setHoveredService] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadCountsByService, setUnreadCountsByService] = useState({});
  const [unreadCountsByFolder, setUnreadCountsByFolder] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState(null);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [userAccountType, setUserAccountType] = useState('Персональный');
  const emailsPerPage = 20;
  const navigate = useNavigate();
  const location = useLocation();
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://mergius.ru';
  const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'https://mergius.ru';

  const contentCategories = [
    { name: 'Чаты', icon: '/images/mail/bubble-chat.png' },
    { name: 'Социальные сети', icon: '/images/mail/social-media-blue.png' },
    { name: 'Удаленные', icon: '/images/mail/delete-blue.png' },
    { name: 'Покупки', icon: '/images/mail/shopping-cart-blue.png' },
    { name: 'Анонимные', icon: '/images/mail/anonymous-blue.png' },
    { name: 'Новости', icon: '/images/mail/news-blue.png' },
    { name: 'Игры', icon: '/images/mail/console-blue.png' },
    { name: 'Билеты', icon: '/images/mail/ticket-blue.png' },
    { name: 'Работа', icon: '/images/mail/briefcase-blue.png' },
    { name: 'Личное', icon: '/images/mail/sex-blue.png' },
  ];

  const emailServices = [
    { name: 'Gmail', icon: '/images/mail/account-gmail.png' },
    { name: 'Mail.ru', icon: '/images/mail/account-mail-ru.png' },
    { name: 'Yandex', icon: '/images/mail/account-yandex.png' },
    { name: 'Outlook', icon: '/images/mail/account-outlook.png' },
    { name: 'Yahoo', icon: '/images/mail/account-yahoo.png' },
    { name: 'AOL', icon: '/images/mail/account-aol.png' },
  ];

  const filterOptions = [
    { name: 'Сортировать A-Я', action: 'sort-az', icon: '/images/mail/filter-a-z.png' },
    { name: 'Сортировать по дате', action: 'sort-date', icon: '/images/mail/filter-date.png' },
    { name: 'Фильтр по папке', action: 'folder', icon: '/images/mail/filter-folder.png' },
  ];

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

  const categoryRules = {
    'Чаты': [
      'чат', 'сообщение', 'диалог', 'переписка', 'мессенджер', 'message',
      'conversation', 'messenger', 'group chat', 'групповой чат',
      'instant message', 'им', 'dm', 'direct message', 'прямое сообщение'
    ],
    'Социальные сети': [
      'вк', 'вконтакте', 'instagram', 'facebook', 'twitter', 'x.com', 'одноклассники',
      'linkedin', 'tiktok', 'snapchat', 'pinterest', 'reddit', 'whatsapp', 'telegram',
      'viber', 'signal', 'social', 'discord', 'slack', 'skype', 'zoom', 'teams',
      'социальная сеть', 'профиль', 'пост', 'post', 'like', 'лайк', 'follow',
      'подписка', 'share', 'поделиться', 'comment', 'комментарий', 'hashtag',
      'хэштег', 'story', 'история', 'reels', 'видео', 'network', 'сеть',
      'friend request', 'запрос в друзья'
    ],
    'Удаленные': [
      'удален', 'удалено', 'удаление', 'deleted', 'delete', 'trash', 'корзина',
      'spam', 'спам', 'unsubscribe', 'отписаться', 'archive', 'архив', 'clean',
      'очистка', 'junk', 'мусор', 'remove', 'удалить', 'clear', 'очистить',
      'unwanted', 'нежелательный'
    ],
    'Покупки': [
      'покупка', 'заказ', 'доставка', 'чек', 'оплата', 'инвойс', 'purchase',
      'order', 'delivery', 'receipt', 'payment', 'invoice', 'shop', 'магазин',
      'cart', 'корзина', 'sale', 'распродажа', 'discount', 'скидка', 'amazon',
      'ebay', 'aliexpress', 'ozon', 'wildberries', 'coupon', 'купон', 'promo',
      'промокод', 'checkout', 'оформление заказа', 'refund', 'возврат', 'deal',
      'сделка'
    ],
    'Анонимные': [
      'аноним', 'анонимный', 'anonymous', 'privacy', 'приватность', 'vpn', 'tor',
      'secure', 'безопасность', 'encrypt', 'шифрование', 'hidden', 'скрытый',
      'incognito', 'инкогнито', 'proxy', 'прокси', 'dark web', 'темный веб',
      'pseudonym', 'псевдоним', 'burner email', 'одноразовый email'
    ],
    'Новости': [
      'новости', 'новость', 'обзор', 'статья', 'репортаж', 'news', 'article',
      'report', 'update', 'обновление', 'breaking', 'срочные', 'newsletter',
      'рассылка', 'press', 'пресса', 'headline', 'заголовок', 'journal', 'журнал',
      'editorial', 'редакция', 'bulletin', 'бюллетень', 'digest', 'дайджест'
    ],
    'Игры': [
      'игра', 'игры', 'гейминг', 'game', 'gaming', 'gamer', 'steam', 'playstation',
      'xbox', 'nintendo', 'esports', 'квест', 'quest', 'multiplayer',
      'многопользовательский', 'battle', 'битва', 'fortnite', 'minecraft', 'roblox',
      'twitch', 'stream', 'стрим', 'tournament', 'турнир', 'mod', 'мод', 'patch',
      'патч'
    ],
    'Билеты': [
      'билет', 'билеты', 'ticket', 'tickets', 'booking', 'бронирование',
      'reservation', 'перелет', 'рейс', 'flight', 'train', 'поезд', 'bus',
      'автобус', 'event', 'мероприятие', 'concert', 'концерт', 'theater', 'театр',
      'cinema', 'кино', 'festival', 'фестиваль', 'show', 'шоу', 'pass', 'пропуск',
      'boarding', 'посадка'
    ],
    'Работа': [
      'работа', 'вакансия', 'резюме', 'собеседование', 'job', 'vacancy', 'resume',
      'interview', 'career', 'карьера', 'employment', 'трудоустройство', 'salary',
      'зарплата', 'freelance', 'фриланс', 'project', 'проект', 'promotion',
      'повышение', 'recruitment', 'наем', 'hiring', 'найм', 'contract', 'контракт',
      'internship', 'стажировка'
    ],
    'Личное': [
      'личное', 'персональное', 'семья', 'друг', 'любовь', 'personal', 'family',
      'friend', 'love', 'birthday', 'день рождения', 'wedding', 'свадьба',
      'invitation', 'приглашение', 'hobby', 'хобби', 'photo', 'фото', 'memory',
      'воспоминание', 'gift', 'подарок', 'anniversary', 'годовщина', 'attachment',
      'вложение', 'greeting', 'поздравление'
    ],
    'Gmail': ['gmail'],
    'Mail.ru': ['mail.ru'],
    'Yandex': ['yandex'],
    'Outlook': ['outlook'],
    'Yahoo': ['yahoo'],
    'AOL': ['aol']
  };

  const defaultFolders = ['Входящие', 'Отмеченное', 'Черновики', 'Отправленное', 'Спам'];
  const serviceFolders = ['Gmail', 'Mail.ru', 'Yandex', 'Outlook', 'Yahoo', 'AOL'];

  const isCategoryFolder = (folderName) => {
    return (
      contentCategories.some(category => category.name.toLowerCase() === folderName.toLowerCase()) &&
      !defaultFolders.includes(folderName) &&
      !serviceFolders.includes(folderName)
    );
  };

  const createFolder = async (emailAccountId, folderConfig, token) => {
    try {
      const response = await fetch(`${BASE_URL}/api/mail/folders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_account: emailAccountId,
          folder_name: folderConfig.name,
          folder_icon: folderConfig.icon,
          sort_order: folderConfig.sort_order,
          locked: folderConfig.locked,
        }),
      });
      if (response.ok) {
        const newFolder = await response.json();
        return {
          id: newFolder.id,
          name: newFolder.folder_name,
          icon: newFolder.folder_icon,
          locked: newFolder.locked,
        };
      } else {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.statusText}`
        }));
        console.error(`Failed to create folder ${folderConfig.name}:`, errorData);
        return null;
      }
    } catch (error) {
      console.error(`Error creating folder ${folderConfig.name}:`, error);
      return null;
    }
  };

  const ensureMarkedFolder = async (emailAccountId, token) => {
    const markedFolder = folders.find(f => f.name.toLowerCase() === 'отмеченное' && f.email_account === emailAccountId);
    if (!markedFolder) {
      const folderConfig = {
        name: 'Отмеченное',
        icon: '/images/mail/folder-marked.png',
        sort_order: 2,
        locked: true,
      };
      const newFolder = await createFolder(emailAccountId, folderConfig, token);
      if (newFolder) {
        setFolders(prev => [...prev, newFolder]);
        return newFolder;
      }
    }
    return markedFolder;
  };

  const ensureSpamFolder = async (emailAccountId, token) => {
    const spamFolder = folders.find(f => f.name.toLowerCase() === 'спам' && f.email_account === emailAccountId);
    if (!spamFolder) {
      const folderConfig = {
        name: 'Спам',
        icon: '/images/mail/folder-spam.png',
        sort_order: 5,
        locked: true,
      };
      const newFolder = await createFolder(emailAccountId, folderConfig, token);
      if (newFolder) {
        setFolders(prev => [...prev, newFolder]);
        return newFolder;
      }
    }
    return spamFolder;
  };

  const categorizeEmail = (email) => {
    const assignments = [];
    const content = `${email.subject || ''} ${email.body || ''}`.toLowerCase();
    const serviceName = email.serviceName ? email.serviceName.toLowerCase() : '';

    Object.keys(categoryRules).forEach(folderName => {
      const keywords = categoryRules[folderName];
      const folder = folders.find(f => f.name.toLowerCase() === folderName.toLowerCase());
      if (folder && email.id && Number.isInteger(folder.id)) {
        if (['Gmail', 'Mail.ru', 'Yandex', 'Outlook', 'Yahoo', 'AOL'].includes(folderName)) {
          if (keywords.includes(serviceName)) {
            assignments.push({ email_id: email.id, folder_id: folder.id });
          }
        } else {
          if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
            assignments.push({ email_id: email.id, folder_id: folder.id });
          }
        }
      }
    });

    return assignments;
  };

  const assignEmailCategories = async (assignments) => {
    if (assignments.length === 0) return;

    const validAssignments = assignments.filter(
      assignment => Number.isInteger(assignment.email_id) && Number.isInteger(assignment.folder_id)
    );
    const uniqueAssignments = Array.from(
      new Map(
        validAssignments.map(a => [`${a.email_id}-${a.folder_id}`, a])
      ).values()
    );

    if (uniqueAssignments.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/mail/emails/assign-categories/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uniqueAssignments),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.statusText}`
        }));
        console.error('Failed to assign categories:', errorData);
        setError(errorData.error || 'Не удалось назначить категории писем');
      }
    } catch (error) {
      console.error('Error assigning categories:', error);
      setError('Ошибка подключения к серверу при назначении категорий');
    }
  };

  const fetchEmailsForAccounts = async (page = 1, forceRefresh = false, search = '', serviceName = null, filter = '', folderName = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }

      for (const account of userEmailAccounts) {
        await ensureMarkedFolder(account.email_account_id, token);
        await ensureSpamFolder(account.email_account_id, token);
      }

      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const serviceParam = serviceName ? `&service_name=${encodeURIComponent(serviceName)}` : '';
      const filterParam = filter ? `&filter=${encodeURIComponent(filter)}` : '';
      const folderParam = folderName ? `&folder_name=${encodeURIComponent(folderName)}` : '';
      const url = `${BASE_URL}/api/mail/fetch/?page=${page}&page_size=${emailsPerPage}${forceRefresh ? '&force_refresh=true' : ''}${searchParam}${serviceParam}${filterParam}${folderParam}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const emailAccountMap = userEmailAccounts.reduce((map, account) => {
          map[account.email_account_id] = account;
          return map;
        }, {});
        const formattedEmails = data.emails.map(email => {
          const account = emailAccountMap[email.email_account] || {};
          const existingEmail = emails.find(e => e.id === email.email_id) || {};
          return {
            id: email.email_id,
            isChecked: existingEmail.isChecked || false,
            isStarred: existingEmail.isStarred || false,
            senderAvatar: account.avatar || '/images/mail/default-avatar.png',
            title: email.subject || 'Без темы',
            preview: email.body?.substring(0, 50) || 'Нет текста',
            body: email.body || 'Нет содержимого',
            date: email.sent_date
              ? new Date(email.sent_date).toLocaleString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Дата неизвестна',
            sentDate: email.sent_date ? new Date(email.sent_date) : null,
            unread: email.status === 'unread',
            email_account: email.email_account,
            serviceName: account.service?.service_name || 'Unknown',
            sender: email.sender || 'Неизвестный отправитель',
            recipients: email.recipients || [],
            subject: email.subject,
            folders: email.folder_assignments ? email.folder_assignments.map(f => f.folder_name) : [],
          };
        });
        setEmails(formattedEmails);
        setTotalEmails(data.total_emails || 0);
        setUnreadCount(data.unread_count || 0);
        setUnreadCountsByService(data.unread_counts_by_service || {});
        setUnreadCountsByFolder(data.unread_counts_by_folder || {});
        setFolders(data.folders.map(folder => ({
          id: folder.id,
          name: folder.folder_name,
          icon: folder.folder_icon || '/images/mail/folder-active.png',
          locked: defaultFolders.includes(folder.folder_name),
        })));

        const assignments = formattedEmails
          .filter(email => !email.folders || email.folders.length === 0)
          .flatMap(email => categorizeEmail(email))
          .filter(assignment => assignment.email_id && assignment.folder_id);
        if (assignments.length > 0) {
          await assignEmailCategories(assignments);
        }
      } else {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.statusText}`
        }));
        console.error('Failed to fetch emails:', errorData);
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_id');
          navigate('/auth');
        } else if (folderName && errorData.error === 'Invalid page number') {
          setError(`Папка "${folderName}" не найдена или пуста`);
        } else {
          setError(errorData.error || 'Ошибка загрузки писем');
        }
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (emailAccountId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/mail/email-accounts/${emailAccountId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok || response.status === 204) {
        const deletedAccount = userEmailAccounts.find(account => account.email_account_id === emailAccountId);
        const updatedAccounts = userEmailAccounts.filter(account => account.email_account_id !== emailAccountId);
        setUserEmailAccounts(updatedAccounts);

        if (deletedAccount && selectedServiceFilter === deletedAccount.service.service_name) {
          const remainingAccounts = updatedAccounts.filter(account => account.service.service_name === deletedAccount.service.service_name);
          setSelectedServiceFilter(remainingAccounts.length > 0 ? deletedAccount.service.service_name : null);
        }

        setIsLoading(true);
        await fetchEmailsForAccounts(currentPage, true, searchQuery, selectedServiceFilter, selectedFilter, selectedFolderFilter);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.statusText}`
        }));
        console.error('Failed to delete email account:', errorData);
        setError(errorData.error || 'Не удалось удалить почтовый аккаунт');
      }
    } catch (error) {
      console.error('Error deleting email account:', error);
      setError('Ошибка подключения к серверу');
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const servicesResponse = await fetch(`${BASE_URL}/api/mail/email-services/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setMailServices(servicesData.map(service => ({
            name: service.service_name,
            icon: service.service_icon || '/images/mail/default-service.png',
          })));
        } else {
          const errorData = await servicesResponse.json().catch(() => ({
            error: `Server error: ${servicesResponse.statusText}`
          }));
          console.error('Failed to fetch services:', errorData);
          setError(errorData.error || 'Не удалось загрузить почтовые сервисы');
        }

        const accountsResponse = await fetch(`${BASE_URL}/api/profile/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setUserEmailAccounts(accountsData.email_accounts || []);
          setUserAccountType(accountsData.account_type || 'Персональный');
          await fetchEmailsForAccounts(currentPage, true, searchQuery, selectedServiceFilter, selectedFilter, selectedFolderFilter);
        } else {
          const errorData = await accountsResponse.json().catch(() => ({
            error: `Server error: ${accountsResponse.statusText}`
          }));
          console.error('Failed to fetch accounts:', errorData);
          setError(errorData.error || 'Не удалось загрузить почтовые аккаунты пользователя');
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Ошибка подключения к серверу');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    const pollInterval = setInterval(() => {
      fetchEmailsForAccounts(currentPage, false, searchQuery, selectedServiceFilter, selectedFilter, selectedFolderFilter);
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [navigate, currentPage, searchQuery, selectedServiceFilter, selectedFilter, selectedFolderFilter]);

  useEffect(() => {
    const images = document.querySelectorAll('.product-image.stack-spacing');
    images.forEach(img => {
      img.removeEventListener('click', () => {});
    });
  }, [folders]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= Math.ceil(totalEmails / emailsPerPage)) {
      setCurrentPage(page);
      setIsLoading(true);
      fetchEmailsForAccounts(page, false, searchQuery, selectedServiceFilter, selectedFilter, selectedFolderFilter);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1);
    setIsLoading(true);
    fetchEmailsForAccounts(1, false, query, selectedServiceFilter, selectedFilter, selectedFolderFilter);
  };

  const handleFolderFilterClick = (folderName) => {
    setSelectedFolderFilter(folderName);
    setCurrentPage(1);
    setIsLoading(true);
    fetchEmailsForAccounts(1, false, searchQuery, selectedServiceFilter, selectedFilter, folderName);
  };

  const handleSideNavClick = (itemNumber, folder = null) => {
    setCurrentPage(1);
    let folderName = null;
    if (itemNumber === 1) {
      folderName = null;
    } else if (itemNumber === 2) {
      folderName = 'Отмеченное';
    } else if (itemNumber === 3) {
      folderName = 'Черновики';
    } else if (itemNumber === 4) {
      folderName = 'Отправленное';
    } else if (itemNumber === 5) {
      setIsCategoriesOpen(true);
      return;
    } else if (itemNumber === 6) {
      folderName = 'Спам';
    } else if (folder) {
      folderName = folder.name;
    }
    handleFolderFilterClick(folderName);
  };

  const handlePanelIconClick = (iconNumber) => {
    if (iconNumber === 1) {
      setSelectedServiceFilter(null);
      setCurrentPage(1);
      setIsLoading(true);
      fetchEmailsForAccounts(1, false, searchQuery, null, selectedFilter, selectedFolderFilter);
    } else if (iconNumber === 2) {
      setIsMailServicesOpen(true);
    }
  };

  const handleServiceFilterClick = (serviceName) => {
    setSelectedServiceFilter(serviceName);
    setCurrentPage(1);
    setIsLoading(true);
    fetchEmailsForAccounts(1, false, searchQuery, serviceName, selectedFilter, selectedFolderFilter);
  };

  const handleCheckboxChange = (id) => {
    const updatedEmails = emails.map(email =>
      email.id === id ? { ...email, isChecked: !email.isChecked } : email
    );
    setEmails(updatedEmails);
    const hasCheckedEmails = updatedEmails.some(email => email.isChecked);
    setShowActionIcons(hasCheckedEmails);
  };

  const handleStarClick = async (id) => {
    const email = emails.find(e => e.id === id);
    if (!email) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const newStarredStatus = !email.isStarred;
    let markedFolder = folders.find(folder => folder.name.toLowerCase() === 'отмеченное');

    if (!markedFolder) {
      markedFolder = await ensureMarkedFolder(email.email_account, token);
      if (!markedFolder) {
        setError('Не удалось создать папку "Отмеченное". Попробуйте позже.');
        return;
      }
    }

    try {
      setEmails(emails.map(e =>
        e.id === id ? { ...e, isStarred: newStarredStatus } : e
      ));

      if (newStarredStatus) {
        await handleAssignToFolder(markedFolder, [id]);
      } else {
        await handleRemoveFromFolder(markedFolder, [id]);
      }

      await fetchEmailsForAccounts(currentPage, false, searchQuery, selectedServiceFilter, selectedFilter, selectedFolderFilter);
    } catch (error) {
      console.error('Error updating star status:', error);
      setError('Ошибка при обновлении статуса отметки');
      setEmails(emails.map(e =>
        e.id === id ? { ...e, isStarred: email.isStarred } : e
      ));
    }
  };

  const handleRemoveFromFolder = async (folder, emailIds) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    if (emailIds.length === 0) {
      setError('Нет писем для удаления из папки');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/mail/emails/remove-folder/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_ids: emailIds,
          folder_id: folder.id,
        }),
      });

      if (response.ok) {
        const updatedEmails = emails.map(email =>
          emailIds.includes(email.id)
            ? { ...email, folders: email.folders.filter(f => f !== folder.name) }
            : email
        );
        setEmails(updatedEmails);
        setUnreadCountsByFolder(prev => ({
          ...prev,
          [folder.name]: Math.max(0, (prev[folder.name] || 0) - emailIds.length),
        }));
      } else {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.statusText}`
        }));
        console.error('Failed to remove emails from folder:', errorData);
        setError(errorData.error || 'Не удалось удалить письма из папки');
      }
    } catch (error) {
      console.error('Error removing emails from folder:', error);
      setError('Ошибка подключения к серверу');
    }
  };

  const handleEmailClick = async (email) => {
    setOpeningEmailId(email.id);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch(`${BASE_URL}/api/mail/emails/${email.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'read' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.statusText}`
        }));
        throw new Error(errorData.error || 'Failed to mark email as read');
      }
      setTimeout(() => {
        const updatedEmails = emails.map(e =>
          e.id === email.id ? { ...e, unread: false } : e
        );
        setEmails(updatedEmails);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setUnreadCountsByService(prev => ({
          ...prev,
          [email.serviceName]: Math.max(0, (prev[email.serviceName] || 0) - 1),
        }));
        setUnreadCountsByFolder(prev => {
          const newCounts = { ...prev };
          email.folders.forEach(folderName => {
            newCounts[folderName] = Math.max(0, (newCounts[folderName] || 0) - 1);
          });
          return newCounts;
        });
        navigate('/email-view', { state: { email } });
        setOpeningEmailId(null);
      }, 500);
    } catch (error) {
      console.error('Error marking email as read:', error);
      setError('Ошибка при обновлении статуса письма');
      setOpeningEmailId(null);
    }
  };

  const closeCategories = () => {
    setIsCategoriesOpen(false);
    setError(null);
  };

  const closeMailServices = () => {
    setIsMailServicesOpen(false);
    setError(null);
  };

  const closeAddAccount = () => {
    setIsAddAccountOpen(false);
    setSelectedService(null);
    setEmailAddress('');
    setPassword('');
    setError(null);
  };

  const closeFilter = () => {
    setIsFilterOpen(false);
    setError(null);
  };

  const closeFolderFilter = () => {
    setIsFolderFilterOpen(false);
    setError(null);
  };

  const handleComposeClick = () => {
    navigate('/compose');
  };

  const handleSelectAll = () => {
    const allChecked = emails.every(e => e.isChecked);
    const updatedEmails = emails.map(email => ({ ...email, isChecked: !allChecked }));
    setEmails(updatedEmails);
    setShowActionIcons(!allChecked);
  };

  const handleReload = async () => {
    setIsLoading(true);
    try {
      await fetchEmailsForAccounts(currentPage, true, searchQuery, selectedServiceFilter, selectedFilter, selectedFolderFilter);
    } catch (error) {
      console.error('Error reloading emails:', error);
      setError('Ошибка перезагрузки писем');
    }
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  const handleAddCategory = async (category) => {
    if (['отмеченное', 'спам'].includes(category.name.toLowerCase())) {
      setError(`Папка "${category.name}" не может быть добавлена вручную`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!userEmailAccounts.length) {
        setError('Нет доступных почтовых аккаунтов для создания папки');
        return;
      }
      const emailAccount = userEmailAccounts[0];

      const existingFolder = folders.find(f => f.name.toLowerCase() === category.name.toLowerCase());
      if (existingFolder) {
        setError(`Папка "${category.name}" уже существует`);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/mail/folders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_account: emailAccount.email_account_id,
          folder_name: category.name,
          folder_icon: category.icon,
          sort_order: 1000,
          locked: false,
        }),
      });
      if (response.ok) {
        const newFolder = await response.json();
        setFolders([...folders, {
          id: newFolder.id,
          name: newFolder.folder_name,
          icon: newFolder.folder_icon,
          locked: false,
        }]);
        setIsCategoriesOpen(false);
        setError(null);
        setCurrentPage(1);
        handleFolderFilterClick(newFolder.folder_name);
      } else {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.statusText}`
        }));
        console.error('Failed to add folder:', errorData);
        setError(errorData.error || 'Не удалось добавить папку');
      }
    } catch (error) {
      console.error('Error adding folder:', error);
      setError('Ошибка подключения к серверу');
    }
  };

  const handleSelectMailService = (service) => {
    setSelectedService(service);
    setIsMailServicesOpen(false);
    setIsAddAccountOpen(true);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddMailService = async () => {
    // Validate email format
    if (!validateEmail(emailAddress)) {
      setError('Пожалуйста, введите действительный email адрес');
      return;
    }

    // For Gmail, require an application-specific password
    if (selectedService.name === 'Gmail' && !password) {
      setError(
        <span>
          Для Gmail требуется пароль приложения.{' '}
          <a
            href="https://myaccount.google.com/security#signin"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            Создайте пароль приложения
          </a>{' '}
          в настройках Google Account.
        </span>
      );
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch(`${BASE_URL}/api/mail/email-accounts/add/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_name: selectedService.name,
          email_address: emailAddress,
          password: password || null,
        }),
      });
      if (response.ok) {
        const newAccount = await response.json();
        const emailAccountId = newAccount.email_account_id;

        const defaultFolderConfigs = [
          { name: 'Входящие', icon: '/images/mail/folder-inbox-active.png', sort_order: 1, locked: true },
          { name: 'Отмеченное', icon: '/images/mail/folder-marked.png', sort_order: 2, locked: true },
          { name: 'Черновики', icon: '/images/mail/folder-drafts.png', sort_order: 3, locked: true },
          { name: 'Отправленное', icon: '/images/mail/folder-sender.png', sort_order: 4, locked: true },
          { name: 'Спам', icon: '/images/mail/folder-spam.png', sort_order: 5, locked: true },
        ];

        for (const folderConfig of defaultFolderConfigs) {
          const existingFolder = folders.find(f => f.name.toLowerCase() === folderConfig.name.toLowerCase() && f.email_account === emailAccountId);
          if (!existingFolder) {
            const newFolder = await createFolder(emailAccountId, folderConfig, token);
            if (newFolder) {
              setFolders(prev => [...prev, newFolder]);
            }
          }
        }

        const serviceFolder = emailServices.find(s => s.name === selectedService.name);
        if (serviceFolder) {
          const folderConfig = {
            name: selectedService.name,
            icon: serviceFolder.icon,
            sort_order: 1000,
            locked: false,
          };
          const existingFolder = folders.find(f => f.name.toLowerCase() === selectedService.name.toLowerCase() && f.email_account === emailAccountId);
          if (!existingFolder) {
            const newFolder = await createFolder(emailAccountId, folderConfig, token);
            if (newFolder) {
              setFolders(prev => [...prev, newFolder]);
            }
          }
        }

        setIsAddAccountOpen(false);
        setEmailAddress('');
        setPassword('');
        setSelectedService(null);
        setError(null);

        const updatedResponse = await fetch(`${BASE_URL}/api/profile/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (updatedResponse.ok) {
          const accountsData = await updatedResponse.json();
          setUserEmailAccounts(accountsData.email_accounts || []);
          setUserAccountType(accountsData.account_type || 'Персональный');
          setIsLoading(true);
          await fetchEmailsForAccounts(currentPage, true, searchQuery, selectedServiceFilter, selectedFilter, selectedFolderFilter);
        } else {
          const errorData = await updatedResponse.json().catch(() => ({
            error: `Server error: ${updatedResponse.statusText}`
          }));
          console.error('Failed to fetch updated accounts:', errorData);
          setError(errorData.error || 'Не удалось обновить список аккаунтов');
        }
      } else {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.statusText}`
        }));
        console.error('Failed to add email account:', errorData);
        let errorMessage = errorData.error || 'Не удалось добавить почтовый аккаунт';
        if (errorMessage.includes('Invalid email or password') && selectedService.name === 'Gmail') {
          errorMessage = (
            <span>
              Неверный email или пароль для {emailAddress}. Для Gmail используйте{' '}
              <a
                href="https://myaccount.google.com/security#signin"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#007bff', textDecoration: 'underline' }}
              >
                пароль приложения
              </a>{' '}
              или OAuth токен.
            </span>
          );
        } else if (errorMessage.includes('You cannot add more than 2 email accounts') && userAccountType !== 'Премиум') {
          errorMessage = `Нельзя добавить больше 2 почтовых аккаунтов для ${selectedService.name}. Обновите до премиум-аккаунта для снятия ограничений.`;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error adding mail service:', error);
      setError('Ошибка подключения к серверу');
    }
  };

  const handleMarkAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const checkedEmails = emails.filter(email => email.isChecked && email.unread);
    if (checkedEmails.length === 0) {
      return;
    }

    try {
      const updatePromises = checkedEmails.map(email =>
        fetch(`${BASE_URL}/api/mail/emails/${email.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'read' }),
        }).then(async response => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              error: `Server error: ${response.statusText}`
            }));
            throw new Error(`Failed to mark email ${email.id} as read: ${errorData.error}`);
          }
          return email;
        })
      );

      await Promise.all(updatePromises);

      const updatedEmails = emails.map(email =>
        email.isChecked && email.unread ? { ...email, unread: false } : email
      );
      const unreadChangesByService = {};
      const unreadChangesByFolder = {};
      checkedEmails.forEach(email => {
        unreadChangesByService[email.serviceName] =
          (unreadChangesByService[email.serviceName] || 0) + 1;
        email.folders.forEach(folderName => {
          unreadChangesByFolder[folderName] =
            (unreadChangesByFolder[folderName] || 0) + 1;
        });
      });

      setEmails(updatedEmails);
      setUnreadCount(prev => Math.max(0, prev - checkedEmails.length));
      setUnreadCountsByService(prev => {
        const newCounts = { ...prev };
        Object.keys(unreadChangesByService).forEach(service => {
          newCounts[service] = Math.max(0, (newCounts[service] || 0) - unreadChangesByService[service]);
        });
        return newCounts;
      });
      setUnreadCountsByFolder(prev => {
        const newCounts = { ...prev };
        Object.keys(unreadChangesByFolder).forEach(folder => {
          newCounts[folder] = Math.max(0, (newCounts[folder] || 0) - unreadChangesByFolder[folder]);
        });
        return newCounts;
      });
      setShowActionIcons(updatedEmails.some(email => email.isChecked));
    } catch (error) {
      console.error('Error marking emails as read:', error);
      setError('Ошибка при обновлении статуса писем');
    }
  };

  const handleMarkAsSpam = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const checkedEmails = emails.filter(email => email.isChecked);
    if (checkedEmails.length === 0) {
      setError('Выберите хотя бы одно письмо');
      return;
    }

    const emailIds = checkedEmails.map(email => email.id);
    let spamFolder = folders.find(folder => folder.name.toLowerCase() === 'спам');

    if (!spamFolder) {
      const emailAccountId = checkedEmails[0].email_account;
      spamFolder = await ensureSpamFolder(emailAccountId, token);
      if (!spamFolder) {
        setError('Не удалось создать папку "Спам". Попробуйте позже.');
        return;
      }
    }

    try {
      await handleAssignToFolder(spamFolder, emailIds);
      await fetchEmailsForAccounts(currentPage, false, searchQuery, selectedServiceFilter, selectedFilter, selectedFolderFilter);
    } catch (error) {
      console.error('Error marking emails as spam:', error);
      setError('Ошибка при перемещении писем в спам');
    }
  };

  const handleFilterEmails = () => {
    setIsFilterOpen(true);
  };

  const handleFilterAction = (action) => {
    if (action === 'sort-az' || action === 'sort-date') {
      setSelectedFilter(action);
      setCurrentPage(1);
      setIsLoading(true);
      fetchEmailsForAccounts(1, false, searchQuery, selectedServiceFilter, action, selectedFolderFilter);
      setIsFilterOpen(false);
    } else if (action === 'folder') {
      setIsFilterOpen(false);
      setIsFolderFilterOpen(true);
    }
  };

  const handleAssignToFolder = async (folder, emailIds = null) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const ids = emailIds || emails.filter(email => email.isChecked).map(email => email.id);
    if (ids.length === 0) {
      setError('Выберите хотя бы одно письмо');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/mail/emails/assign-folder/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_ids: ids,
          folder_id: folder.id,
        }),
      });

      if (response.ok) {
        const updatedEmails = emails.map(email =>
          ids.includes(email.id)
            ? { ...email, isChecked: false, folders: [...(email.folders || []), folder.name] }
            : email
        );
        const unreadChangesByFolder = {};
        emails.filter(email => ids.includes(email.id) && email.unread).forEach(email => {
          unreadChangesByFolder[folder.name] = (unreadChangesByFolder[folder.name] || 0) + 1;
        });

        setEmails(updatedEmails);
        setUnreadCountsByFolder(prev => ({
          ...prev,
          [folder.name]: (prev[folder.name] || 0) + Object.values(unreadChangesByFolder).reduce((sum, count) => sum + count, 0),
        }));
        setIsFolderFilterOpen(false);
        setError(null);
        setShowActionIcons(false);
      } else {
        const errorData = await response.json().catch(() => ({
          error: `Server error: ${response.statusText}`
        }));
        console.error('Failed to assign emails to folder:', errorData);
        setError(errorData.error || 'Не удалось добавить письма в папку');
      }
    } catch (error) {
      console.error('Error assigning emails to folder:', error);
      setError('Ошибка подключения к серверу');
    }
  };

  const handleDeleteEmails = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const checkedEmails = emails.filter(email => email.isChecked);
    if (checkedEmails.length === 0) {
      return;
    }

    try {
      const deletePromises = checkedEmails.map(email =>
        fetch(`${BASE_URL}/api/mail/emails/${email.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`,
          },
        }).then(async response => {
          if (!response.ok && response.status !== 204) {
            const errorData = await response.json().catch(() => ({
              error: `Server error: ${response.statusText}`
            }));
            throw new Error(`Failed to delete email ${email.id}: ${errorData.error}`);
          }
          return email;
        })
      );

      await Promise.all(deletePromises);

      const unreadChangesByService = {};
      const unreadChangesByFolder = {};
      checkedEmails.forEach(email => {
        if (email.unread) {
          unreadChangesByService[email.serviceName] =
            (unreadChangesByService[email.serviceName] || 0) + 1;
          email.folders.forEach(folderName => {
            unreadChangesByFolder[folderName] =
              (unreadChangesByFolder[folderName] || 0) + 1;
          });
        }
      });

      const updatedEmails = emails.filter(email => !email.isChecked);
      setEmails(updatedEmails);
      setTotalEmails(prev => Math.max(0, prev - checkedEmails.length));
      setUnreadCount(prev => Math.max(0, prev - Object.values(unreadChangesByService).reduce((sum, count) => sum + count, 0)));
      setUnreadCountsByService(prev => {
        const newCounts = { ...prev };
        Object.keys(unreadChangesByService).forEach(service => {
          newCounts[service] = Math.max(0, (newCounts[service] || 0) - unreadChangesByService[service]);
        });
        return newCounts;
      });
      setUnreadCountsByFolder(prev => {
        const newCounts = { ...prev };
        Object.keys(unreadChangesByFolder).forEach(folder => {
          newCounts[folder] = Math.max(0, (newCounts[folder] || 0) - unreadChangesByFolder[folder]);
        });
        return newCounts;
      });
      setShowActionIcons(false);
    } catch (error) {
      console.error('Error deleting emails:', error);
      setError('Ошибка при удалении писем');
    }
  };

  const isServiceAdded = (serviceName) => {
    return userEmailAccounts.some(account => account.service.service_name === serviceName);
  };

  const isServiceLimitReached = (serviceName) => {
    if (userAccountType === 'Премиум') {
      return false;
    }
    const accountCount = userEmailAccounts.filter(
      account => account.service.service_name === serviceName
    ).length;
    return accountCount >= 2;
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

  const totalPages = Math.ceil(totalEmails / emailsPerPage);

  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    range.push(1);

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    range.forEach((i, index) => {
      if (index > 0 && i - range[index - 1] > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
    });

    return rangeWithDots;
  };

  return (
    <div className="mail-body mail-page">
      <main className="mail-content">
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

        <section className="email-section">
          {error && <div className="error-message">{error}</div>}
          <div className="navigation-container">
            <div className="navigation-icons">
              <svg
                width="32"
                height="20"
                viewBox="0 0 32 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="menu-icon"
                onClick={handleSelectAll}
              >
                <rect width="20" height="20" fill="#D9D9D9" />
                <path d="M28.5 14L31.5311 8.75H25.4689L28.5 14Z" fill="#D9D9D9" />
              </svg>
              <div className="reload-container">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/reload.png`}
                  alt="Reload icon"
                  className="reload-icon"
                  onClick={handleReload}
                />
              </div>
              {showActionIcons && (
                <>
                  <img
                    src={`${process.env.PUBLIC_URL}/images/mail/view.png`}
                    alt="Mark as read icon"
                    className="action-icon"
                    onClick={handleMarkAsRead}
                  />
                  <img
                    src={`${process.env.PUBLIC_URL}/images/mail/filter.png`}
                    alt="Filter icon"
                    className="action-icon"
                    onClick={handleFilterEmails}
                  />
                  <img
                    src={`${process.env.PUBLIC_URL}/images/mail/spam.png`}
                    alt="Spam icon"
                    className="action-icon"
                    onClick={handleMarkAsSpam}
                  />
                  <img
                    src={`${process.env.PUBLIC_URL}/images/mail/delete.png`}
                    alt="Delete icon"
                    className="action-icon"
                    onClick={handleDeleteEmails}
                  />
                </>
              )}
              <span className="email-count">{totalEmails} писем</span>
            </div>
            <div className="email-controls">
              <button className="calendar-button">
                <img
                  src={`${process.env.PUBLIC_URL}/images/mail/calendar.png`}
                  alt="Calendar icon"
                  className="calendar-icon"
                  onClick={handleCalendarClick}
                />
              </button>
              <input
                type="text"
                className="search-button-container"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Загрузка...</p>
            </div>
          ) : (
            <>
              {emails.length > 0 ? (
                emails.map(email => (
                  <article
                    key={`${email.id}-${email.email_account}`}
                    className={`email-item ${email.unread ? 'email-item-unread' : ''} ${openingEmailId === email.id ? 'opening' : ''}`}
                    onClick={() => handleEmailClick(email)}
                  >
                    <div className="checkbox-group">
                      <div
                        className={`checkbox ${email.isChecked ? 'checkbox-checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckboxChange(email.id);
                        }}
                      />
                      <img
                        src={email.isStarred
                          ? `${process.env.PUBLIC_URL}/images/mail/star-marked.png`
                          : `${process.env.PUBLIC_URL}/images/mail/star.png`}
                        alt="Star"
                        className="email-status"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarClick(email.id);
                        }}
                      />
                    </div>
                    <div className="avatar-group">
                      <img src={email.senderAvatar} alt="Sender Avatar" className="avatar" />
                    </div>
                    <div className="email-text">
                      <h3 className="email-title">{email.title}</h3>
                      <p className="email-preview">{email.preview}</p>
                      {email.folders && email.folders.length > 0 && (
                        <p className="email-categories">
                          Категории: {email.folders.join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="email-date">{email.date}</p>
                  </article>
                ))
              ) : (
                <p>Нет писем для отображения</p>
              )}

              {totalEmails > 0 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    Назад
                  </button>
                  {getPaginationNumbers().map((item, index) => (
                    <button
                      key={index}
                      onClick={() => typeof item === 'number' && handlePageChange(item)}
                      className={`pagination-button ${currentPage === item ? 'active' : ''} ${typeof item === 'string' ? 'ellipsis' : ''}`}
                      disabled={typeof item === 'string'}
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                  >
                    Вперед
                  </button>
                </div>
              )}
            </>
          )}
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
                          <div key={idx} className="avatar-circle-wrapper">
                            <img
                              src={`${process.env.PUBLIC_URL}${account.avatar}`}
                              className="avatar-circle-button"
                              alt={`Avatar for ${account.email_address}`}
                            />
                            <span
                              className="close-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAccount(account.email_account_id);
                              }}
                              title={`Удалить ${account.email_address}`}
                            >
                              ✕
                            </span>
                          </div>
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

      {isCategoriesOpen && (
        <div className="modal-overlay" onClick={closeCategories}>
          <section className="categories-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="categories-title">Выберите категорию</h2>
            <div className="categories-grid">
              {contentCategories.filter(category => !['отмеченное', 'спам'].includes(category.name.toLowerCase())).map((item, index) => (
                <div className="category-item" key={index}>
                  <button
                    className="category-button"
                    onClick={() => handleAddCategory(item)}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${item.icon}`}
                      alt={item.name}
                      className="category-icon"
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {isMailServicesOpen && (
        <div className="modal-overlay" onClick={closeMailServices}>
          <section className="categories-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="categories-title">Выберите почтовый сервис</h2>
            <div className="categories-grid">
              {mailServices.map((service, index) => (
                <div className="category-item" key={index}>
                  <button
                    className="category-button"
                    onClick={() => handleSelectMailService(service)}
                    disabled={isServiceLimitReached(service.name)}
                    style={{ opacity: isServiceLimitReached(service.name) ? 0.5 : 1 }}
                    title={isServiceLimitReached(service.name) ? `Достигнут лимит в 2 аккаунта для ${service.name}. Обновите до премиум-аккаунта.` : ''}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${service.icon}`}
                      alt={service.name}
                      className="category-icon"
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {isAddAccountOpen && (
        <div className="modal-overlay" onClick={closeAddAccount}>
          <section className="categories-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="categories-title">Добавить аккаунт {selectedService?.name}</h2>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label htmlFor="emailAddress">Email</label>
              <input
                type="email"
                id="emailAddress"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Введите ваш email"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">
                {selectedService?.name === 'Gmail' ? 'Пароль приложения' : 'Пароль'}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={selectedService?.name === 'Gmail' ? 'Введите пароль приложения' : 'Введите ваш пароль (опционально)'}
                className="form-input"
              />
              {selectedService?.name === 'Gmail' && (
                <p className="help-text">
                  Для Gmail используйте{' '}
                  <a
                    href="https://myaccount.google.com/security#signin"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#007bff', textDecoration: 'underline' }}
                  >
                    пароль приложения
                  </a>
                  . Обычный пароль не подойдет, если включена двухфакторная аутентификация.
                </p>
              )}
            </div>
            <div className="form-actions">
              <button
                className="mail-add-button"
                onClick={handleAddMailService}
                disabled={!emailAddress || (selectedService?.name === 'Gmail' && !password)}
              >
                Добавить
              </button>
              <button className="mail-cancel-button" onClick={closeAddAccount}>
                Отмена
              </button>
            </div>
          </section>
        </div>
      )}

      {isFilterOpen && (
        <div className="modal-overlay" onClick={closeFilter}>
          <section className="categories-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="categories-title">Выберите фильтр</h2>
            <div className="categories-grid">
              {filterOptions.map((option, index) => (
                <div className="category-item" key={index}>
                  <button
                    className="category-button"
                    onClick={() => handleFilterAction(option.action)}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${option.icon}`}
                      alt={option.name}
                      className="category-icon"
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {isFolderFilterOpen && (
        <div className="modal-overlay" onClick={closeFolderFilter}>
          <section className="categories-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="categories-title">Выберите папку</h2>
            <div className="categories-grid">
              {folders.filter(folder => !folder.locked).map((folder, index) => (
                <div className="category-item" key={index}>
                  <button
                    className="category-button"
                    onClick={() => handleAssignToFolder(folder)}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}${folder.icon}`}
                      alt={folder.name}
                      className="category-icon"
                    />
                    <span className="category-label">{folder.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <button className="compose-button" onClick={handleComposeClick}>
        Написать
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

export default MailPage;