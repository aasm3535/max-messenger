import { DataUtils } from '../../../lib/data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    const { email, password } = req.body;

    // Валидация данных
    if (!email || !password) {
      return res.status(400).json({
        message: 'Необходимо заполнить все поля'
      });
    }

    // Поиск пользователя
    const user = DataUtils.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: 'Неверный email или пароль'
      });
    }

    // Проверка пароля (в продакшене нужно сравнивать хеши)
    if (user.password !== password) {
      return res.status(401).json({
        message: 'Неверный email или пароль'
      });
    }

    // Обновляем статус пользователя как онлайн
    const users = DataUtils.getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].isOnline = true;
      users[userIndex].lastSeen = new Date();
      DataUtils.saveUsers(users);
    }

    // Возвращаем данные пользователя без пароля
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Успешный вход в систему',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}