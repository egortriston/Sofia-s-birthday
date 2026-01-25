const DEEPSEEK_API_KEY = 'sk-768c02dbd25f407a874fa717e4950840'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

export async function checkAnswerWithAI(question, userAnswer, correctAnswer) {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты Софья - милая и веселая девушка из мира Звездных Войн. Ты проверяешь ответы девушки (пользователя). Обращайся к ней на "ты". Ты должна ЧЕТКО и ТОЧНО определить, правильный ли ответ. Отвечай ТОЛЬКО в формате JSON: {"isCorrect": true/false, "message": "твое сообщение"}. Если ответ правильный - поздравь ее. Если неправильный - вырази недовольство кратко. Будь лаконичной и четкой.'
                    },
                    {
                        role: 'user',
                        content: `Вопрос: "${question}"\n\nПравильный ответ: "${correctAnswer}"\n\nОтвет пользователя: "${userAnswer}"\n\nЧЕТКО проверь ответ пользователя. КРИТЕРИИ ПРИНЯТИЯ:\n✅ Принимай как правильный ТОЛЬКО если:\n- Ответ ПОЛНОСТЬЮ совпадает с правильным (игнорируй регистр, пробелы, опечатки в 1-2 буквы)\n- Ответ является ТОЧНЫМ синонимом или альтернативным названием (например, "кофе" = "кофе", но НЕ "кофейный напиток")\n\n❌ НЕ принимай как правильный:\n- Сокращения (например, "Вольпер" вместо "вольпертингер" - это РАЗНЫЕ слова)\n- Неполные ответы (если правильный ответ "вольпертингер", то "вольпер" - НЕПРАВИЛЬНО)\n- Частичные совпадения (если правильный ответ состоит из нескольких слов, все слова должны быть)\n- Слова, которые только начинаются как правильный ответ\n\nПРИМЕРЫ:\n- Правильный: "вольпертингер", ответ: "вольпер" → НЕПРАВИЛЬНО (сокращение)\n- Правильный: "кофе", ответ: "кофе" → ПРАВИЛЬНО\n- Правильный: "кофе", ответ: "коффе" → ПРАВИЛЬНО (опечатка 1 буква)\n- Правильный: "13", ответ: "тринадцать" → ПРАВИЛЬНО (синоним)\n\nБудь СТРОГИМ и ТОЧНЫМ. Ответь в формате JSON: {"isCorrect": true/false, "message": "твое сообщение"}.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 250
            })
        })

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content || '{"isCorrect": false, "message": "Ой, что-то пошло не так!"}'

        try {
            const parsed = JSON.parse(content)
            return parsed
        } catch {
            // Если не JSON, пытаемся извлечь информацию из текста
            const isCorrect = content.toLowerCase().includes('правильно') ||
                content.toLowerCase().includes('верно') ||
                content.toLowerCase().includes('молодец')
            return {
                isCorrect: isCorrect,
                message: content
            }
        }
    } catch (error) {
        console.error('DeepSeek API error:', error)
        return {
            isCorrect: false,
            message: 'Ой, что-то пошло не так! Попробуй еще раз 🌟'
        }
    }
}

export async function getAngryMessage(question, userAnswer, correctAnswer) {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты Софья - милая и веселая девушка из мира Звездных Войн, но сейчас ты ЗЛИШЬСЯ! Девушка (пользователь) дала неправильный ответ. Обращайся к ней на "ты". Ты должна РУГАТЬСЯ, выражать недовольство, но оставаться в характере - милая, но расстроенная. Используй эмодзи, выражай эмоции. Будь лаконичной.'
                    },
                    {
                        role: 'user',
                        content: `Вопрос: "${question}"\n\nПравильный ответ: "${correctAnswer}"\n\nНеправильный ответ пользователя: "${userAnswer}"\n\nВНИМАТЕЛЬНО проанализируй ответ пользователя. Определи, ЧТО КОНКРЕТНО было неверно: может быть неправильное слово, неправильная часть ответа, неполный ответ, или ответ вообще не по теме. На основе этого анализа зло вырази свое недовольство, указав на конкретную ошибку, но НЕ раскрывай правильный ответ полностью.`
                    }
                ],
                temperature: 0.8,
                max_tokens: 150
            })
        })

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        return data.choices[0]?.message?.content || 'Нет, это неправильно! 😤'
    } catch (error) {
        console.error('DeepSeek API error:', error)
        return 'Нет, это неправильно! 😤'
    }
}

export async function getHintFromAI(question, correctAnswer, previousAnswer = null) {
    try {
        const previousAnswerText = previousAnswer
            ? `\n\nПредыдущий неправильный ответ пользователя: "${previousAnswer}"\n\nПроанализируй, что было неверно в предыдущем ответе и оттолкнись от этого, чтобы дать подсказку.`
            : ''

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты Софья - милая и веселая девушка из мира Звездных Войн. Ты даешь ПРЯМЫЕ и ПОНЯТНЫЕ подсказки девушке (пользователю). Обращайся к ней на "ты". Подсказки должны быть ЯСНЫМИ и КОНКРЕТНЫМИ, чтобы после 1-2 подсказок она точно поняла правильный ответ. НЕ используй сложные загадки или метафоры. Будь ПРЯМОЙ и ПОМОГАЮЩЕЙ. Будь лаконичной.'
                    },
                    {
                        role: 'user',
                        content: `Вопрос: "${question}"\n\nПравильный ответ: "${correctAnswer}"${previousAnswerText}\n\nДай ПРЯМУЮ и ПОНЯТНУЮ подсказку, которая поможет пользователю найти правильный ответ. Подсказка должна быть:\n- КОНКРЕТНОЙ (укажи на ключевые слова, характеристики, контекст)\n- ПРЯМОЙ (не загадочной, не метафорической)\n- ПОМОГАЮЩЕЙ (чтобы после этой подсказки или следующей она точно поняла)\n\nМожешь:\n- Указать на ключевые слова из вопроса\n- Назвать категорию или тип ответа\n- Дать подсказку о первой букве или количестве букв\n- Упомянуть контекст или связанные понятия\n\nНЕ используй сложные загадки, метафоры или намеки. Будь ПРЯМОЙ и ПОЛЕЗНОЙ.`
                    }
                ],
                temperature: 0.9,
                max_tokens: 200
            })
        })

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        return data.choices[0]?.message?.content || 'Попробуй подумать еще раз! 🌟'
    } catch (error) {
        console.error('DeepSeek API error:', error)
        return 'Ой, что-то пошло не так! Попробуй еще раз 🌟'
    }
}
