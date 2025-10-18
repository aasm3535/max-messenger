import { useState, useEffect } from 'react';
import AuthForm from '../components/AuthForm';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import ActiveUsers from '../components/ActiveUsers';
import styles from '../styles/messenger.module.css';

export default function Home() {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);

  // Загружаем пользователя из localStorage при монтировании
  useEffect(() => {
    const savedUser = localStorage.getItem('messenger_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('messenger_user');
      }
    }
  }, []);

  const handleAuth = (userData) => {
    setUser(userData);
    localStorage.setItem('messenger_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (error) {
      console.error('Ошибка выхода:', error);
    } finally {
      setUser(null);
      setSelectedChat(null);
      localStorage.removeItem('messenger_user');
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleSendMessage = (message) => {
    // Обновляем чаты после отправки сообщения
    // В реальном приложении лучше использовать WebSocket или polling
  };

  if (!user) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <div className={styles.messenger}>
      <div className={styles.header}>
        <h1>Мессенджер</h1>
        <div className={styles.userInfo}>
          <span>Привет, {user.username}!</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Выйти
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <ChatList
          user={user}
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChat?.id}
        />
        <ChatWindow
          chat={selectedChat}
          user={user}
          onSendMessage={handleSendMessage}
        />
        <ActiveUsers
          user={user}
          onUserSelect={handleChatSelect}
        />
      </div>
    </div>
  );
}
