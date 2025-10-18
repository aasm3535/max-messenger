import { DataUtils } from '../../../lib/data';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    const users = DataUtils.getUsers();

    // Возвращаем пользователей без паролей
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    res.status(200).json({
      users: usersWithoutPasswords
    });

  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}