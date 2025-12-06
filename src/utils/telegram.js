// Конфигурация Telegram Bot API
const TELEGRAM_BOT_TOKEN = '7948394824:AAHuh_71TCCtHNL0gPw5YFXfh0VvvU7QNtc'
const TELEGRAM_CHAT_ID = '5882350650'

export const sendToTelegram = async (question, userAnswer, correctAnswer, isCorrect) => {
  const status = isCorrect ? '✅ Принят' : '❌ Отклонен'
  const emoji = isCorrect ? '✅' : '❌'
  
  const message = `${emoji} <b>Новый ответ на вопрос</b>\n\n` +
    `<b>Вопрос:</b> ${question}\n\n` +
    `<b>Ответ пользователя:</b> ${userAnswer}\n\n` +
    `<b>Правильный ответ:</b> ${correctAnswer}\n\n` +
    `<b>Статус:</b> ${status}`
  
  try {
    // Отправка вам
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID') {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      })
      
      if (!response.ok) {
        console.error('Ошибка отправки в Telegram:', await response.text())
      }
    } else {
      console.log('Telegram не настроен. Сообщение:', message)
    }
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error)
    // Не показываем ошибку пользователю, чтобы не портить опыт
  }
}



