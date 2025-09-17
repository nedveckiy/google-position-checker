const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Функція для отримання поточного IP
async function getCurrentIP() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', {
            timeout: 5000
        });
        return response.data.ip;
    } catch (error) {
        console.error('Помилка отримання IP:', error.message);
        return 'Unknown';
    }
}

// Функція для логування
async function logResult(logEntry) {
    const logLine = `${new Date().toISOString()} | ${JSON.stringify(logEntry)}\n`;
    
    try {
        await fs.appendFile('google_position_log.txt', logLine);
        console.log('✅ Записано в лог:', logEntry);
    } catch (error) {
        console.error('❌ Помилка запису в лог:', error.message);
    }
}

// Google Position Checker
async function checkGooglePosition(query, targetDomain = null) {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=100&hl=uk&gl=ua&ie=UTF-8&oe=UTF-8`;

    try {
        console.log(`🔍 Google пошук: "${query}"`);
        if (targetDomain) {
            console.log(`🎯 Шукаємо домен: ${targetDomain}`);
        }

        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': randomUA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.google.com/',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 15000
        });

        // Перевірка на блокування
        const html = response.data.toLowerCase();
        if (html.includes('unusual traffic') || 
            html.includes('captcha') || 
            html.includes('robots.txt') ||
            response.status === 429) {
            
            return {
                success: false,
                blocked: true,
                error: 'Google заблокував запит - потрібна ротація IP'
            };
        }

        // Парсинг результатів
        const $ = cheerio.load(response.data);
        const results = [];
        let targetPosition = null;

        // Парсимо органічні результати
        $('div.g').each((index, element) => {
            const $el = $(element);
            const titleEl = $el.find('h3').first();
            const linkEl = $el.find('a').first();
            const snippetEl = $el.find('.VwiC3b, .s3v9rd, .st').first();

            if (titleEl.length && linkEl.length) {
                const title = titleEl.text().trim();
                let url = linkEl.attr('href');
                const snippet = snippetEl.text().trim();

                // Очищуємо URL від Google редиректів
                if (url && url.startsWith('/url?q=')) {
                    url = decodeURIComponent(url.split('/url?q=')[1].split('&')[0]);
                }

                if (title && url && url.startsWith('http')) {
                    const position = results.length + 1;
                    
                    // Витягуємо домен
                    let domain = '';
                    try {
                        domain = new URL(url).hostname.replace('www.', '');
                    } catch (e) {
                        domain = url;
                    }

                    const result = {
                        position: position,
                        title: title,
                        url: url,
                        domain: domain,
                        snippet: snippet.substring(0, 150) + '...'
                    };

                    results.push(result);

                    // Перевіряємо чи це наш сайт
                    if (targetDomain && domain.includes(targetDomain.replace('www.', ''))) {
                        if (targetPosition === null) {
                            targetPosition = position;
                            console.log(`🎯 Знайдено на позиції ${position}!`);
                        }
                    }
                }
            }
        });

        console.log(`✅ Знайдено ${results.length} результатів`);

        return {
            success: true,
            blocked: false,
            query: query,
            targetDomain: targetDomain,
            position: targetPosition,
            found: targetPosition !== null,
            total_results: results.length,
            top_10: results.slice(0, 10),
            all_results: results,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(`❌ Помилка Google пошуку: ${error.message}`);
        
        return {
            success: false,
            blocked: false,
            error: error.message,
            query: query,
            timestamp: new Date().toISOString()
        };
    }
}

// =============== ROUTES ===============

// Головна сторінка
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="uk">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🎯 Google Position Checker</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #333;
                    text-align: center;
                }
                .status {
                    text-align: center;
                    background: #e3f2fd;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .buttons {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 30px 0;
                }
                .btn {
                    padding: 15px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    text-decoration: none;
                    display: inline-block;
                    text-align: center;
                    transition: all 0.3s;
                }
                .btn-primary { background: #2196F3; color: white; }
                .btn-success { background: #4CAF50; color: white; }
                .btn-info { background: #17a2b8; color: white; }
                .btn-warning { background: #FF9800; color: white; }
                .btn:hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                }
                .google-form {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .form-group {
                    margin: 15px 0;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .form-group input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                }
                .warning {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #ffc107;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎯 Google Position Checker</h1>
                
                <div class="status">
                    <strong>🕐 Поточний час:</strong> ${new Date().toLocaleString('uk-UA')}<br>
                    <strong>🌐 Heroku IP ротація:</strong> <span style="color: green;">Активна</span>
                </div>

                <div class="buttons">
                    <a href="/ip" class="btn btn-primary">🌐 Перевірити IP</a>
                    <a href="/logs" class="btn btn-info">📋 Логи перевірок</a>
                </div>

                <div class="google-form">
                    <h3>🔍 Перевірка позиції в Google</h3>
                    <form action="/check-position" method="get">
                        <div class="form-group">
                            <label for="query">Ключове слово:</label>
                            <input type="text" id="query" name="query" placeholder="веб розробка київ" required>
                        </div>
                        <div class="form-group">
                            <label for="domain">Ваш домен (опціонально):</label>
                            <input type="text" id="domain" name="domain" placeholder="yoursite.com">
                        </div>
                        <button type="submit" class="btn btn-success">🎯 Перевірити позицію</button>
                    </form>
                </div>

                <div class="buttons">
                    <a href="/check-position?query=україна+новини&domain=google.com" class="btn btn-warning">🧪 Тестовий запит</a>
                </div>

                <div class="warning">
                    <strong>⚠️ Увага:</strong> Цей інструмент може порушувати Terms of Service Google. 
                    Використовуйте обережно і на власний ризик. При блокуванні IP - перезапустіть Heroku dyno для ротації.
                </div>
            </div>
        </body>
        </html>
    `);
});

// Перевірка IP
app.get('/ip', async (req, res) => {
    const ip = await getCurrentIP();
    res.json({ 
        ip: ip,
        timestamp: new Date().toISOString(),
        heroku_dyno: process.env.DYNO || 'local',
        location: 'EU (Ireland)'
    });
});

// Головний ендпоінт для перевірки позицій
app.get('/check-position', async (req, res) => {
    const { query, domain } = req.query;
    
    if (!query) {
        return res.status(400).json({ 
            error: 'Потрібен параметр query',
            example: '/check-position?query=ключове_слово&domain=yoursite.com'
        });
    }

    try {
        const currentIP = await getCurrentIP();
        console.log(`🌐 Поточний IP: ${currentIP}`);
        
        const result = await checkGooglePosition(query, domain);
        
        // Логуємо результат
        await logResult({
            type: 'google_position_check',
            ip: currentIP,
            query: query,
            domain: domain,
            position: result.position,
            found: result.found,
            blocked: result.blocked,
            success: result.success,
            timestamp: result.timestamp
        });

        if (result.success) {
            // Повертаємо красивий HTML результат
            res.send(`
                <!DOCTYPE html>
                <html lang="uk">
                <head>
                    <meta charset="UTF-8">
                    <title>Результат перевірки позиції</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; }
                        .result { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
                        .success { border-left: 4px solid #4CAF50; background: #f1f8e9; }
                        .not-found { border-left: 4px solid #ff9800; background: #fff3e0; }
                        .blocked { border-left: 4px solid #f44336; background: #ffebee; }
                        .position { font-size: 24px; font-weight: bold; color: #4CAF50; }
                        .serp-result { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 3px solid #007bff; }
                        .btn { padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px 0 0; }
                        h1 { color: #333; }
                        h3 { color: #666; margin-top: 30px; }
                    </style>
                </head>
                <body>
                    <div class="result ${result.found ? 'success' : 'not-found'}">
                        <h1>🎯 Результат перевірки позиції</h1>
                        <p><strong>Запит:</strong> "${result.query}"</p>
                        <p><strong>Домен:</strong> ${result.targetDomain || 'не вказано'}</p>
                        <p><strong>IP адреса:</strong> ${currentIP}</p>
                        <p><strong>Час:</strong> ${new Date(result.timestamp).toLocaleString('uk-UA')}</p>
                        
                        ${result.found ? 
                            `<p><strong>Позиція:</strong> <span class="position">#${result.position}</span> з ${result.total_results}</p>` :
                            `<p><strong>Результат:</strong> Не знайдено в топ-${result.total_results}</p>`
                        }
                    </div>

                    <h3>🔝 Топ-10 результатів пошуку:</h3>
                    ${result.top_10.map(item => `
                        <div class="serp-result">
                            <strong>#${item.position}</strong>
                            <h4><a href="${item.url}" target="_blank">${item.title}</a></h4>
                            <p style="color: green; margin: 5px 0;">${item.domain}</p>
                            <p style="color: #666; font-size: 14px;">${item.snippet}</p>
                        </div>
                    `).join('')}

                    <a href="/" class="btn">🏠 На головну</a>
                    <a href="/check-position?query=${encodeURIComponent(result.query)}&domain=${result.targetDomain || ''}" class="btn">🔄 Перевірити знову</a>
                    <a href="/logs" class="btn">📋 Переглянути логи</a>
                </body>
                </html>
            `);
        } else {
            // Помилка або блокування
            res.send(`
                <!DOCTYPE html>
                <html lang="uk">
                <head>
                    <meta charset="UTF-8">
                    <title>Помилка перевірки</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
                        .error { background: #ffebee; border-left: 4px solid #f44336; padding: 20px; border-radius: 5px; }
                        .btn { padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h2>${result.blocked ? '🚫 Запит заблоковано' : '❌ Помилка'}</h2>
                        <p><strong>Помилка:</strong> ${result.error}</p>
                        <p><strong>Запит:</strong> "${result.query}"</p>
                        <p><strong>IP:</strong> ${currentIP}</p>
                        
                        ${result.blocked ? `
                            <h3>Що робити:</h3>
                            <ol>
                                <li>Зачекайте 5-10 хвилин</li>
                                <li>Перезапустіть Heroku dyno для зміни IP</li>
                                <li>Спробуйте знову</li>
                            </ol>
                        ` : ''}
                    </div>
                    
                    <a href="/" class="btn">🏠 На головну</a>
                    <a href="/ip" class="btn">🌐 Перевірити IP</a>
                </body>
                </html>
            `);
        }

    } catch (error) {
        console.error('💥 Критична помилка:', error.message);
        res.status(500).json({ 
            error: 'Критична помилка сервера', 
            details: error.message 
        });
    }
});

// Логи
app.get('/logs', async (req, res) => {
    try {
        const logs = await fs.readFile('google_position_log.txt', 'utf-8');
        res.type('text/plain');
        res.send(logs);
    } catch (error) {
        res.status(404).send('Логи поки що порожні');
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🌐 Google Position Checker запущений на порту ${PORT}`);
    console.log(`🎯 Дашборд: http://localhost:${PORT}/`);
    console.log(`🔍 Приклад: http://localhost:${PORT}/check-position?query=test&domain=google.com`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Сервер зупиняється...');
    process.exit(0);
});
