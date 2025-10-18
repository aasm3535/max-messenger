import { DataUtils } from '../../../../lib/data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    const { messageId } = req.query;
    const { userId } = req.body;

    if (!messageId || !userId) {
      return res.status(400).json({
        message: 'ID сообщения и пользователя обязательны'
      });
    }

    // Проверяем, что сообщение существует
    const messages = DataUtils.getMessages();
    const message = messages.find(msg => msg.id === messageId);

    if (!message) {
      return res.status(404).json({
        message: 'Сообщение не найдено'
      });
    }

    // Проверяем, что пользователь является участником чата
    const chat = DataUtils.findChatById(message.chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({
        message: 'Доступ запрещен'
      });
    }

    // Отмечаем сообщение как прочитанное
    DataUtils.markMessageAsRead(messageId, userId);

    res.status(200).json({
      message: 'Сообщение отмечено как прочитанное'
    });

  } catch (error) {
    console.error('Ошибка отметки сообщения как прочитанного:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}