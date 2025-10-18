import { DataUtils } from '../../../lib/data';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetChats(req, res);
  } else if (req.method === 'POST') {
    return handleCreateChat(req, res);
  } else {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }
}

async function handleGetChats(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: 'ID пользователя обязателен'
      });
    }

    const chats = DataUtils.getChats();
    const messages = DataUtils.getMessages();

    // Фильтруем чаты, где пользователь является участником
    const userChats = chats.filter(chat =>
      chat.participants.includes(userId)
    ).map(chat => {
      // Получаем последнее сообщение для каждого чата
      const chatMessages = messages.filter(msg => msg.chatId === chat.id);
      const lastMessage = chatMessages.length > 0 ?
        chatMessages[chatMessages.length - 1] : null;

      return {
        ...chat,
        lastMessage,
        unreadCount: chatMessages.filter(msg =>
          msg.senderId !== userId && !msg.readBy.includes(userId)
        ).length
      };
    });

    res.status(200).json({
      chats: userChats
    });

  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}

async function handleCreateChat(req, res) {
  try {
    const { name, type, participants, createdBy } = req.body;

    // Валидация данных
    if (!name || !participants || !createdBy) {
      return res.status(400).json({
        message: 'Необходимо заполнить все обязательные поля'
      });
    }

    if (participants.length < 2) {
      return res.status(400).json({
        message: 'Чат должен содержать минимум 2 участников'
      });
    }

    // Проверяем, что пользователь создает чат с существующими пользователями
    const users = DataUtils.getUsers();
    const validParticipants = participants.filter(id =>
      users.some(user => user.id === id) || id === createdBy
    );

    if (validParticipants.length !== participants.length) {
      return res.status(400).json({
        message: 'Один или несколько участников не найдены'
      });
    }

    // Создаем новый чат
    const newChat = DataUtils.createChat({
      name,
      type: type || 'group',
      participants: [...new Set([...validParticipants, createdBy])], // Убираем дубликаты
      createdBy
    });

    res.status(201).json({
      message: 'Чат успешно создан',
      chat: newChat
    });

  } catch (error) {
    console.error('Ошибка создания чата:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}