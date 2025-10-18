import { useState, useEffect } from 'react';
import styles from './ChatList.module.css';

export default function ChatList({ user, onChatSelect, selectedChatId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadChats();
    loadUsers();

    // Автоматическое обновление чатов каждые 10 секунд
    const interval = setInterval(loadChats, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chats?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setChats(data.chats);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users.filter(u => u.id !== user.id));
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!newChatName.trim()) return;

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newChatName,
          type: 'group',
          participants: [user.id],
          createdBy: user.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewChatName('');
        setShowCreateChat(false);
        loadChats();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Ошибка создания чата');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}м назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}ч назад`;
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка чатов...</div>;
  }

  return (
    <div className={styles.chatList}>
      <div className={styles.header}>
        <h2>Чаты</h2>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateChat(true)}
        >
          + Создать чат
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showCreateChat && (
        <form onSubmit={handleCreateChat} className={styles.createChatForm}>
          <input
            type="text"
            placeholder="Название чата"
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            className={styles.chatNameInput}
          />
          <div className={styles.formButtons}>
            <button type="submit" className={styles.submitButton}>
              Создать
            </button>
            <button
              type="button"
              onClick={() => setShowCreateChat(false)}
              className={styles.cancelButton}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className={styles.chats}>
        {chats.length === 0 ? (
          <div className={styles.empty}>Нет чатов</div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${
                selectedChatId === chat.id ? styles.selected : ''
              }`}
              onClick={() => onChatSelect(chat)}
            >
              <div className={styles.chatAvatar}>
                {chat.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.chatInfo}>
                <div className={styles.chatName}>{chat.name}</div>
                {chat.lastMessage && (
                  <div className={styles.lastMessage}>
                    {chat.lastMessage.content}
                  </div>
                )}
              </div>
              <div className={styles.chatMeta}>
                {chat.lastMessage && (
                  <div className={styles.chatTime}>
                    {formatTime(chat.lastMessage.createdAt)}
                  </div>
                )}
                {chat.unreadCount > 0 && (
                  <div className={styles.unreadBadge}>
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}