// Конфигурация Telegram Bot API
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN' // Замените на ваш токен бота
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID' // Замените на ваш chat_id
const DIPSY_CHAT_ID = 'DIPSY_CHAT_ID' // Опционально: chat_id для Дипсика

export const sendToTelegram = async (question, userAnswer, correctAnswer, isCorrect) => {
  const status = isCorrect ? 'Правильно' : 'Неправильно'
  const message = `Вопрос: ${question}\nОтвет: ${userAnswer}\nВерный ответ: ${correctAnswer}\nСтатус: ${status}`
  
  try {
    // Отправка вам
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
        }),
      })
    }

    // Опциональная отправка Дипсику
    if (DIPSY_CHAT_ID && TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: DIPSY_CHAT_ID,
          text: message,
        }),
      })
    }
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error)
    // Не показываем ошибку пользователю, чтобы не портить опыт
  }
}



