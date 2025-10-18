import { DataUtils } from '../../../lib/data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'ID пользователя обязателен'
      });
    }

    // Обновляем статус пользователя как оффлайн
    const users = DataUtils.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].isOnline = false;
      users[userIndex].lastSeen = new Date();
      DataUtils.saveUsers(users);
    }

    res.status(200).json({
      message: 'Успешный выход из системы'
    });

  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}