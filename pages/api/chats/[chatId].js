import { DataUtils } from '../../../lib/data';

export default async function handler(req, res) {
  const { chatId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: 'ID пользователя обязателен'
      });
    }

    const chat = DataUtils.findChatById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: 'Чат не найден'
      });
    }

    // Проверяем, что пользователь является участником чата
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        message: 'Доступ запрещен'
      });
    }

    // Получаем информацию об участниках чата
    const users = DataUtils.getUsers();
    const chatParticipants = users.filter(user =>
      chat.participants.includes(user.id)
    ).map(({ password, ...user }) => user);

    // Получаем сообщения чата
    const messages = DataUtils.getMessagesByChatId(chatId);

    res.status(200).json({
      chat: {
        ...chat,
        participants: chatParticipants
      },
      messages
    });

  } catch (error) {
    console.error('Ошибка получения чата:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}