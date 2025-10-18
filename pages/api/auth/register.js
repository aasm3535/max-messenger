import { DataUtils } from '../../../lib/data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    const { username, email, password } = req.body;

    // Валидация данных
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Необходимо заполнить все поля'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Пароль должен содержать минимум 6 символов'
      });
    }

    // Проверка существования пользователя
    const existingUser = DataUtils.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Создание нового пользователя
    const newUser = DataUtils.createUser({
      username,
      email,
      password, // В продакшене пароль нужно хешировать
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    });

    // Возвращаем данные пользователя без пароля
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера'
    });
  }
}