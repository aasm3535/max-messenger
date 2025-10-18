import { useState, useEffect } from 'react';
import styles from './ActiveUsers.module.css';

export default function ActiveUsers({ user, onUserSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();

    // Обновляем список пользователей каждые 30 секунд
    const interval = setInterval(loadUsers, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (selectedUser) => {
    if (selectedUser.id === user.id) return;

    try {
      // Проверяем, существует ли уже приватный чат с этим пользователем
      const chatsResponse = await fetch(`/api/chats?userId=${user.id}`);
      const chatsData = await chatsResponse.json();

      if (chatsResponse.ok) {
        const existingChat = chatsData.chats.find(chat =>
          chat.type === 'private' &&
          chat.participants.includes(selectedUser.id) &&
          chat.participants.includes(user.id)
        );

        if (existingChat) {
          onUserSelect(existingChat);
          return;
        }
      }

      // Создаем новый приватный чат
      const chatResponse = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedUser.username,
          type: 'private',
          participants: [user.id, selectedUser.id],
          createdBy: user.id
        }),
      });

      const chatData = await chatResponse.json();

      if (chatResponse.ok) {
        onUserSelect(chatData.chat);
      } else {
        setError(chatData.message);
      }
    } catch (error) {
      setError('Ошибка создания чата');
    }
  };

  const getStatusColor = (isOnline, lastSeen) => {
    if (isOnline) return '#28a745';

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = (now - lastSeenDate) / (1000 * 60);

    if (diffMinutes < 5) return '#ffc107'; // Желтый - был недавно
    if (diffMinutes < 60) return '#fd7e14'; // Оранжевый - был в течение часа
    return '#6c757d'; // Серый - был давно
  };

  const getStatusText = (isOnline, lastSeen) => {
    if (isOnline) return 'Онлайн';

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = (now - lastSeenDate) / (1000 * 60);

    if (diffMinutes < 1) return 'Был только что';
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)}м назад`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}ч назад`;
    return `${Math.floor(diffMinutes / 1440)}д назад`;
  };

  if (loading) {
    return (
      <div className={styles.activeUsers}>
        <div className={styles.header}>
          <h3>Пользователи</h3>
        </div>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.activeUsers}>
      <div className={styles.header}>
        <h3>Пользователи ({users.length})</h3>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.usersList}>
        {users.length === 0 ? (
          <div className={styles.empty}>Нет пользователей</div>
        ) : (
          users.map((userItem) => (
            <div
              key={userItem.id}
              className={`${styles.userItem} ${
                userItem.id === user.id ? styles.currentUser : styles.otherUser
              }`}
              onClick={() => handleUserClick(userItem)}
            >
              <div className={styles.userAvatar}>
                <img
                  src={userItem.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userItem.username}`}
                  alt={userItem.username}
                />
                <div
                  className={styles.statusIndicator}
                  style={{
                    backgroundColor: getStatusColor(userItem.isOnline, userItem.lastSeen)
                  }}
                />
              </div>
              <div className={styles.userInfo}>
                <div className={styles.username}>
                  {userItem.username}
                  {userItem.id === user.id && ' (вы)'}
                </div>
                <div className={styles.userStatus}>
                  {getStatusText(userItem.isOnline, userItem.lastSeen)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}