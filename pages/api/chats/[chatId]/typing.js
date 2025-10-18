import { DataUtils } from '../../../../lib/data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    const { chatId } = req.query;
    const { userId, isTyping } = req.body;

    if (!chatId || !userId || typeof isTyping !== 'boolean') {
      return res.status(400).json({
        message: 'Необходимо указать chatId, userId и isTyping'
      });
    }

    // Проверяем, что чат существует
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

    // В реальном приложении здесь можно хранить состояние печати в памяти
    // или отправлять через WebSocket. Для простоты просто возвращаем успех
    res.status(200).json({
      message: 'Статус печати обновлен'
    });

  } catch (error) {
    console.error('Ошибка обновления статуса печати:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}