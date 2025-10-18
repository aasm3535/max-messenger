import { useState, useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';

export default function ChatWindow({ chat, user, onSendMessage }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (chat) {
      loadMessages();
      // Автоматически отмечаем сообщения как прочитанные при открытии чата
      markMessagesAsRead();

      // Автоматическое обновление сообщений каждые 5 секунды
      const interval = setInterval(loadMessages, 5000);

      return () => clearInterval(interval);
    }
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!chat) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/messages?chatId=${chat.id}&userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Ошибка загрузки сообщений');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!chat) return;

    try {
      const unreadMessages = messages.filter(msg =>
        msg.senderId !== user.id && !msg.readBy.includes(user.id)
      );

      for (const message of unreadMessages) {
        await fetch(`/api/messages/${message.id}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });
      }
    } catch (error) {
      console.error('Ошибка отметки сообщений как прочитанных:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Останавливаем индикатор печати
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chat.id,
          senderId: user.id,
          content: newMessage,
          type: 'text'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewMessage('');
        // Обновляем локальный список сообщений
        setMessages(prev => [...prev, data.message]);
        onSendMessage(data.message);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Ошибка отправки сообщения');
    }
  };

  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      try {
        await fetch(`/api/chats/${chat.id}/typing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            isTyping: true
          }),
        });
      } catch (error) {
        console.error('Ошибка отправки статуса печати:', error);
      }
    }

    // Сбрасываем таймер
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      fetch(`/api/chats/${chat.id}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          isTyping: false
        }),
      }).catch(error => console.error('Ошибка:', error));
    }, 2000);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!chat) {
    return (
      <div className={styles.chatWindow}>
        <div className={styles.emptyChat}>
          Выберите чат для начала общения
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.chatInfo}>
          <div className={styles.chatAvatar}>
            {chat.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={styles.chatName}>{chat.name}</div>
            <div className={styles.chatParticipants}>
              {chat.participants?.length} участников
            </div>
          </div>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {loading ? (
          <div className={styles.loading}>Загрузка сообщений...</div>
        ) : (
          <div className={styles.messages}>
            {messages.length === 0 ? (
              <div className={styles.emptyMessages}>
                Нет сообщений. Начните разговор!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.message} ${
                    message.senderId === user.id ? styles.own : styles.other
                  }`}
                >
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>
                      {message.content}
                    </div>
                    <div className={styles.messageTime}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Индикатор печати */}
      {typingUsers.length > 0 && (
        <div className={styles.typingIndicator}>
          {typingUsers.length === 1
            ? `${typingUsers[0]} печатает...`
            : `${typingUsers.slice(0, -1).join(', ')} и ${typingUsers[typingUsers.length - 1]} печатают...`
          }
        </div>
      )}

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Напишите сообщение..."
          className={styles.messageInput}
          disabled={loading}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!newMessage.trim() || loading}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}