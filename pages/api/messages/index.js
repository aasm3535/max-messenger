import { DataUtils } from '../../../lib/data';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetMessages(req, res);
  } else if (req.method === 'POST') {
    return handleSendMessage(req, res);
  } else {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }
}

async function handleGetMessages(req, res) {
  try {
    const { chatId, userId } = req.query;

    if (!chatId || !userId) {
      return res.status(400).json({
        message: 'ID чата и пользователя обязательны'
      });
    }

    // Проверяем, что пользователь является участником чата
    const chat = DataUtils.findChatById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: 'Чат не найден'
      });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        message: 'Доступ запрещен'
      });
    }

    const messages = DataUtils.getMessagesByChatId(chatId);

    res.status(200).json({
      messages
    });

  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}

async function handleSendMessage(req, res) {
  try {
    const { chatId, senderId, content, type = 'text' } = req.body;

    // Валидация данных
    if (!chatId || !senderId || !content) {
      return res.status(400).json({
        message: 'Необходимо заполнить все обязательные поля'
      });
    }

    // Проверяем, что чат существует
    const chat = DataUtils.findChatById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: 'Чат не найден'
      });
    }

    // Проверяем, что отправитель является участником чата
    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({
        message: 'Доступ запрещен'
      });
    }

    // Создаем новое сообщение
    const newMessage = DataUtils.createMessage({
      chatId,
      senderId,
      content,
      type
    });

    res.status(201).json({
      message: 'Сообщение отправлено',
      message: newMessage
    });

  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}