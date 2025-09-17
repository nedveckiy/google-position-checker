const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// 293 ключових слова для України
const UKRAINE_QUERIES = [
    'кредит онлайн', 'онлайн кредит', 'взять кредит онлайн', 'онлайн кредит на карту', 'кредит на карту онлайн',
    'деньги в кредит онлайн', 'кредит онлайн на карту', 'займ на карту', 'займы', 'займы онлайн',
    'займ онлайн на карту', 'онлайн займ', 'онлайн займ на карту', 'микро займ онлайн', 'мини займ',
    'микрозаймы', 'микрозайм', 'микрозайм онлайн', 'микрозайм на карту', 'все микрозаймы украины',
    'микрозайм онлайн на карту', 'все микрозаймы', 'микрозайм в украине', 'взять микрозайм', 'получить микрозайм',
    'мфо', 'все мфо', 'мфо укр', 'мфо украины', 'все мфо украины',
    'все мфо украины список', 'микрофинансовые организации список', 'перечень мфо украины', 'полный список мфо украины', 'микрофинансовые организации украины',
    'микрокредит', 'микрокредиты', 'микрокредит онлайн', 'микрокредиты онлайн на карту', 'взять микрокредит',
    'онлайн микрокредиты на карту', 'микрокредит онлайн на карту', 'кредит под 0', 'кредит под 0 процентов', 'кредит онлайн без процентов',
    'микрозайм без процентов', 'займ под 0 процентов', 'микрозайм под 0', 'микрозайм под 0 процентов', 'кредиты онлайн на карту без процентов',
    'онлайн кредит без процентов', 'кредит онлайн на карту без отказа срочно', 'кредит без отказа', 'кредит онлайн без отказа', 'кредиты онлайн без отказов',
    'кредит на карту без отказа', 'кредит без отказов на карту', 'микрозайм на карту без отказов', 'микрокредит на карту без отказа', 'кредит на карту без отказа без проверки мгновенно',
    'микрозайм без отказа', 'займ без отказа', 'быстрый кредит на карту без отказа', 'кредит на карту онлайн без отказа', 'кредит срочно без отказов',
    'кредит 24 7', 'кредит онлайн на карту без отказа срочно 24 7', 'кредит без звонков и проверок 24 7', 'кредит 24 7 без отказа', 'кредит 24 7 на карту',
    'кредит онлайн 24 7 без отказа', 'кредит 24 7 онлайн', 'кредит круглосуточно', 'кредит на карту 24 7', 'круглосуточный кредит на карту',
    'займ 24 7', 'микро займ 24 7', 'микрокредит 24 7', 'долгосрочный займ на карту онлайн с ежемесячным погашением', 'долгосрочный кредит',
    'долгосрочные кредиты', 'долгосрочный кредит для погашения микрозаймов с просрочками', 'кредит на долгий срок', 'кредит онлайн на долгий срок', 'кредит онлайн на карту на долгий срок',
    'онлайн кредит на долгий срок', 'займ онлайн долгосрочный', 'долгосрочный микрозайм', 'долгосрочный микрокредит', 'новые мфо', 'новое мфо',
    'новые кредиты онлайн без отказа', 'кредит онлайн новые мфо', 'новые кредиты онлайн', 'новые микрозаймы украины', 'новые микрозаймы', 'новые онлайн кредиты',
    'кредит онлайн на карту новые мфо', 'новые мфо украины', 'самые новые мфо украины', 'малоизвестные мфо', 'все малоизвестные микрозаймы украины список',
    'малоизвестные микрозаймы', 'займ онлайн малоизвестные мфо', 'неизвестные мфо', 'неизвестные мфо без отказа', 'новые малоизвестные мфо украины',
    'самые новые малоизвестные мфо', 'кредит с плохой кредитной историей и просрочками в украине 24 7', 'кредиты онлайн на карту с плохой кредитной историей', 'кредит 24 7 на карту с плохой кредитной историей',
    'кредит онлайн без отказов с плохой кредитной историей', 'кредиты с очень плохой кредитной историей', 'кредит с очень плохой кредитной историей', 'взять кредит на карту с плохой кредитной историей',
    'кредит на карту мгновенно с плохой кредитной историей', 'займ онлайн с плохой кредитной историей', 'кредит робот за минуту', 'кредит бот', 'кредит бот без отказа',
    'робот кредит', 'кредит онлайн автоматически', 'кредит робот', 'чат бот кредит', 'кредит робот бот', 'бот кредит',
    'кредит бот на карту', 'автоматические кредиты на карту', 'кредит на карту с автоматическим решением', 'денег в долг', 'деньги в долг круглосуточно на карту',
    'деньги в долг на карту срочно без проверки кредитной истории', 'деньги в долг на карту', 'деньги в долг онлайн', 'деньги до зарплаты', 'кредит до зарплати на карту',
    'деньги до зарплаты на карту онлайн', 'микрозайм до зарплаты', 'деньги до зарплаты на карту круглосуточно', 'деньги до зарплаты на карту', 'кредит до зарплаты',
    'кредиты онлайн на карту без звонков', 'кредит онлайн без фото', 'кредит на карту без звонков', 'кредит онлайн без звонков и фото', 'кредит онлайн без звонков и фотографий',
    'кредиты без звонков и фото', 'онлайн кредит без звонка', 'кредит без звонков и фото', 'кредит с просрочками', 'кредиты с просрочками',
    'кредит с просрочками по микрозаймам', 'взять кредит с большими просрочками', 'кредит должникам с просрочками', 'кредит онлайн с просрочкой', 'кредит на карту с большими просрочками',
    'кредит без отказа с просрочками', 'займ с просрочкой', 'кредит онлайн 24 7 через bankid', 'кредит через банк id без звонков и фото', 'кредит через банк id',
    'кредиты через банк id', 'кредит через банк айди', 'кредит через bankid', 'кредит онлайн через банк id', 'микрозайм через bankid', 'кредит через дию',
    'взять кредит через дию', 'кредит онлайн через дию', 'онлайн кредит через дию', 'оформить кредит через дию', 'кредит через дию быстро', 'займ через дию',
    'топ мфо', 'топ мфо украины', 'рейтинг мфо', 'мфо рейтинг', 'рейтинг мфо украины', 'рейтинг микрофинансовых организаций',
    'лучшие мфо', 'лучшие мфо рейтинг', 'рейтинг кредитов онлайн', 'рейтинг микрозаймов', 'рейтинг лучших микрозаймов', 'кредит онлайн на карту приватбанка',
    'кредит онлайн на карту приватбанка с плохой кредитной историей', 'онлайн кредит на карту приватбанка срочно', 'деньги в кредит на карту приватбанка', 'мгновенный кредит на карту приватбанка', 'кредит на карту приватбанка онлайн',
    'быстрый займ', 'быстрый кредит', 'быстрый кредит на карту', 'кредит быстро', 'быстрый займ онлайн', 'займ на карту срочно',
    'кредит на карту срочно', 'займ срочно', 'кредиты срочно на карту', 'кредит срочно на карту', 'кредит онлайн срочно', 'срочно нужны деньги',
    'где срочно взять денег', 'где срочно взять деньги без отказа без проверки мгновенно', 'где взять денег срочно с плохой кредитной историей', 'срочно нужны деньги на карту', 'срочно нужны деньги на карту без отказа',
    'займ кредит с 18 лет', 'взять кредит без отказа с 18 лет', 'взять кредит с 18 лет по паспорту', 'срочный кредит с 18 лет', 'кредит с 18 лет онлайн на карту',
    'кредит с 18 лет без справки о доходах', 'кредит на 12 месяцев с 18 лет', 'кредит с 18 лет онлайн заявка', 'промокоды мфо', 'промокоды на кредиты',
    'промокоды на микрозаймы', 'промокоды микрозаймы', 'промокоды на кредиты действующие', 'кредит без справки о доходах', 'кредит без справки о доходе', 'долгосрочный кредит на карту без справки о доходах',
    'займ без справки о доходах', 'онлайн кредит без справки о доходах', 'кредит студенту', 'кредиты студентам', 'кредит для студентов', 'кредит для студента',
    'кредит студентам без отказа', 'кредит пенсионеру', 'кредит пенсионерам', 'кредит пенсионерам без отказа', 'кредит для пенсионеров', 'кредит пенсионеру без отказа',
    'кредиты онлайн для пенсионеров', 'где точно дадут кредит', 'где точно дадут кредит с просрочками', 'кредит 100 процентов', 'кредиты 100 процентов одобрение',
    'кредит онлайн 100 процентов одобрения', 'кредит 100 процентов одобрения', 'кредит ночью', 'кредиты ночью', 'кредит ночью на карту', 'кредит ночью без отказа',
    'кредит онлайн ночью на карту', 'кредит онлайн ночью', 'займ ночью', 'мфо которые дают всем', 'мфо которое дает всем', 'микрозайм который дает всем',
    'микрозаймы которые дают всем', 'кредит который дают всем', 'какие микрозаймы дают всем'
];

// Глобальні змінні
let megaTestRunning = false;
let currentResults = [];
let currentQueryIndex = 0;

// Конфігурація тестування
const TEST_CONFIG = {
    delayBetweenRequests: 3000,  // 3 секунди між запитами
    pauseAfterQueries: 25,       // Пауза кожні 25 запитів
    pauseDuration: 30000,        // 30 секунд пауза
    maxResultsPerQuery: 100      // Топ-100 результатів
};

async function getCurrentIP() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
        return response.data.ip;
    } catch (error) {
        return 'Unknown';
    }
}

async function logResult(logEntry) {
    const logLine = `${new Date().toISOString()} | ${JSON.stringify(logEntry)}\n`;
    
    try {
        await fs.appendFile('mega_test_log.txt', logLine);
        console.log(`[LOG] Query ${logEntry.requestNumber || '?'}: ${logEntry.success ? 'OK' : 'FAIL'}`);
    } catch (error) {
        console.error('Log error:', error.message);
    }
}

// Оновлений парсер 2025 з актуальними селекторами
function parseTop100Results(html) {
    const results = [];
    let position = 1;
    const foundUrls = new Set();
    
    // Оновлені паттерни для Google 2025
    const patterns = [
        // Паттерн 1: data-ved атрибути (найновіший)
        /<div[^>]*data-ved[^>]*>[\s\S]*?<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a><\/h3>[\s\S]*?(?:<span[^>]*class="[^"]*(?:VwiC3b|s3v9rd|IsZvec)[^"]*"[^>]*>([\s\S]*?)<\/span>|<div[^>]*class="[^"]*(?:VwiC3b|s3v9rd)[^"]*"[^>]*>([\s\S]*?)<\/div>|$)/gi,
        
        // Паттерн 2: MjjYud клас wrapper
        /<div[^>]*class="[^"]*MjjYud[^"]*"[^>]*>[\s\S]*?<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>[\s\S]*?(?:<span[^>]*class="[^"]*(?:VwiC3b|s3v9rd|IsZvec)[^"]*"[^>]*>([\s\S]*?)<\/span>|<div[^>]*>([\s\S]*?)<\/div>|$)/gi,
        
        // Паттерн 3: jscontroller атрибути
        /<div[^>]*jscontroller[^>]*>[\s\S]*?<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a><\/h3>[\s\S]*?(?:<span[^>]*>([\s\S]*?)<\/span>|<div[^>]*>([\s\S]*?)<\/div>|$)/gi,
        
        // Паттерн 4: Класичний g клас (fallback)
        /<div[^>]*class="[^"]*\bg\b[^"]*"[^>]*>[\s\S]*?<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>[\s\S]*?(?:<span[^>]*class="[^"]*(?:VwiC3b|st|s3v9rd)[^"]*"[^>]*>([\s\S]*?)<\/span>|$)/gi,
        
        // Паттерн 5: Простий H3 + A (універсальний)
        /<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/gi
    ];
    
    for (let pattern of patterns) {
        let match;
        pattern.lastIndex = 0;
        
        while ((match = pattern.exec(html)) !== null && position <= TEST_CONFIG.maxResultsPerQuery) {
            try {
                let url = match[1];
                let title = match[2] ? match[2].replace(/<[^>]*>/g, '').trim() : '';
                let snippet = (match[3] || match[4] || '').replace(/<[^>]*>/g, '').trim();
                
                // Очищення URL від Google редиректів
                if (url.startsWith('/url?q=')) {
                    try {
                        url = decodeURIComponent(url.split('/url?q=')[1].split('&')[0]);
                    } catch (e) {
                        continue;
                    }
                }
                
                // Перевірка валідності URL
                if (!url.startsWith('http')) continue;
                if (foundUrls.has(url)) continue;
                foundUrls.add(url);
                
                // Витягнення домену
                let domain = '';
                try {
                    domain = new URL(url).hostname.replace('www.', '');
                } catch (e) {
                    domain = url.substring(0, 50);
                }
                
                if (title && url) {
                    results.push({
                        position: position,
                        title: title.substring(0, 200),
                        url: url,
                        domain: domain,
                        snippet: snippet.substring(0, 300)
                    });
                    position++;
                }
            } catch (error) {
                continue;
            }
        }
    }
    
    console.log(`Parsed ${results.length} results using 2025 patterns`);
    return results.slice(0, TEST_CONFIG.maxResultsPerQuery);
}

async function testSingleQueryMega(query, queryIndex) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=100&hl=uk&gl=ua&ie=UTF-8&start=0`;
    
    try {
        console.log(`[${queryIndex}/${UKRAINE_QUERIES.length}] Testing: "${query}"`);
        
        const startTime = Date.now();
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 20000
        });
        
        const responseTime = Date.now() - startTime;
        const html = response.data;
        
        // Оновлена перевірка блокування для 2025
        const htmlLower = html.toLowerCase();
        const blocked = htmlLower.includes('unusual traffic') || 
                       htmlLower.includes('captcha') || 
                       htmlLower.includes('robots.txt') ||
                       htmlLower.includes('verify you are human') ||
                       htmlLower.includes('our systems have detected') ||
                       htmlLower.includes('suspicious activity') ||
                       htmlLower.includes('automated queries') ||
                       response.status === 429 ||
                       response.status === 503 ||
                       response.status === 403;
        
        if (blocked) {
            console.log(`[${queryIndex}] *** BLOCKED DETECTED ***`);
            return {
                queryIndex: queryIndex,
                query: query,
                success: true,
                blocked: true,
                statusCode: response.status,
                responseTime: responseTime,
                htmlSize: html.length,
                resultsFound: 0,
                results: [],
                timestamp: new Date().toISOString()
            };
        }
        
        // Парсинг результатів
        const results = parseTop100Results(html);
        
        console.log(`[${queryIndex}] SUCCESS - ${results.length} results parsed - ${responseTime}ms`);
        
        const result = {
            queryIndex: queryIndex,
            query: query,
            success: true,
            blocked: false,
            statusCode: response.status,
            responseTime: responseTime,
            htmlSize: html.length,
            resultsFound: results.length,
            results: results,
            timestamp: new Date().toISOString()
        };
        
        // Зберегти результати окремо для кожного запиту
        await saveQueryResults(queryIndex, query, result);
        
        return result;
        
    } catch (error) {
        console.log(`[${queryIndex}] ERROR: ${error.message}`);
        
        return {
            queryIndex: queryIndex,
            query: query,
            success: false,
            blocked: false,
            error: error.message,
            statusCode: error.response ? error.response.status : 'TIMEOUT',
            responseTime: 0,
            resultsFound: 0,
            results: [],
            timestamp: new Date().toISOString()
        };
    }
}

// Збереження результатів для конкретного запиту
async function saveQueryResults(queryIndex, query, result) {
    try {
        // JSON файл для кожного запиту
        const jsonFilename = `results/query_${String(queryIndex).padStart(3, '0')}.json`;
        await fs.writeFile(jsonFilename, JSON.stringify({
            query: query,
            queryIndex: queryIndex,
            timestamp: result.timestamp,
            blocked: result.blocked,
            success: result.success,
            resultsFound: result.resultsFound,
            results: result.results
        }, null, 2));
        
        // Додавання в загальний CSV
        if (result.success && !result.blocked && result.results.length > 0) {
            await appendToCSV(queryIndex, query, result.results);
        }
        
    } catch (error) {
        console.error(`Save error for query ${queryIndex}:`, error.message);
    }
}

// Додавання в CSV файл
async function appendToCSV(queryIndex, query, results) {
    try {
        let csvContent = '';
        
        // Створення заголовків при першому записі
        try {
            await fs.access('all_results.csv');
        } catch {
            csvContent = 'QueryIndex,Query,Position,Title,URL,Domain,Snippet\n';
        }
        
        // Додавання результатів
        for (let result of results) {
            const csvRow = [
                queryIndex,
                `"${query.replace(/"/g, '""')}"`,
                result.position,
                `"${result.title.replace(/"/g, '""')}"`,
                `"${result.url.replace(/"/g, '""')}"`,
                `"${result.domain.replace(/"/g, '""')}"`,
                `"${result.snippet.replace(/"/g, '""')}"`
            ].join(',') + '\n';
            
            csvContent += csvRow;
        }
        
        await fs.appendFile('all_results.csv', csvContent);
        
    } catch (error) {
        console.error('CSV append error:', error.message);
    }
}

// Головна функція мега-тестування
async function runMegaBulkTest() {
    if (megaTestRunning) {
        return { success: false, error: 'Mega test already running' };
    }
    
    megaTestRunning = true;
    currentResults = [];
    currentQueryIndex = 0;
    
    const startIP = await getCurrentIP();
    const testStartTime = new Date().toISOString();
    
    console.log(`Starting MEGA bulk test with ${UKRAINE_QUERIES.length} queries`);
    console.log(`IP: ${startIP}, Delay: ${TEST_CONFIG.delayBetweenRequests}ms`);
    
    try {
        // Створюємо папку для результатів
        try {
            await fs.mkdir('results');
        } catch (e) { /* папка вже існує */ }
        
        for (let i = 0; i < UKRAINE_QUERIES.length; i++) {
            if (!megaTestRunning) {
                console.log('Test stopped by user');
                break;
            }
            
            currentQueryIndex = i + 1;
            const query = UKRAINE_QUERIES[i];
            
            // Виконати запит
            const result = await testSingleQueryMega(query, currentQueryIndex);
            result.ip = startIP;
            
            currentResults.push(result);
            await logResult(result);
            
            // Перевірка блокування
            if (result.blocked) {
                console.log('*** GOOGLE BLOCKED - STOPPING TEST ***');
                await logResult({
                    type: 'mega_test_blocked',
                    ip: startIP,
                    totalQueries: UKRAINE_QUERIES.length,
                    completedQueries: currentQueryIndex,
                    blockedAt: currentQueryIndex,
                    timestamp: new Date().toISOString()
                });
                break;
            }
            
            // Пауза кожні N запитів
            if (currentQueryIndex % TEST_CONFIG.pauseAfterQueries === 0) {
                console.log(`Taking ${TEST_CONFIG.pauseDuration/1000}s break after ${currentQueryIndex} queries...`);
                await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.pauseDuration));
            }
            
            // Основна затримка між запитами
            if (i < UKRAINE_QUERIES.length - 1 && megaTestRunning) {
                console.log(`Waiting ${TEST_CONFIG.delayBetweenRequests/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delayBetweenRequests));
            }
        }
        
        // Фінальний звіт
        const summary = {
            type: 'mega_test_completed',
            ip: startIP,
            startTime: testStartTime,
            endTime: new Date().toISOString(),
            totalQueries: UKRAINE_QUERIES.length,
            completedQueries: currentResults.length,
            successfulQueries: currentResults.filter(r => r.success && !r.blocked).length,
            blockedQueries: currentResults.filter(r => r.blocked).length,
            errorQueries: currentResults.filter(r => !r.success).length,
            totalResultsParsed: currentResults.reduce((sum, r) => sum + r.resultsFound, 0),
            averageResponseTime: Math.round(
                currentResults.filter(r => r.responseTime > 0)
                    .reduce((sum, r) => sum + r.responseTime, 0) / 
                Math.max(1, currentResults.filter(r => r.responseTime > 0).length)
            )
        };
        
        await logResult(summary);
        await fs.writeFile('mega_test_summary.json', JSON.stringify(summary, null, 2));
        
        console.log('MEGA TEST COMPLETED:', summary);
        return { success: true, summary: summary, results: currentResults };
        
    } catch (error) {
        console.error('Mega test critical error:', error);
        return { success: false, error: error.message };
    } finally {
        megaTestRunning = false;
        currentQueryIndex = 0;
    }
}

// =============== ROUTES ===============

app.get('/', (req, res) => {
    const progress = megaTestRunning ? `${currentQueryIndex}/${UKRAINE_QUERIES.length}` : 'Ready';
    const eta = megaTestRunning ? Math.round((UKRAINE_QUERIES.length - currentQueryIndex) * TEST_CONFIG.delayBetweenRequests / 1000 / 60) : 0;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>MEGA Bulk Tester - ${UKRAINE_QUERIES.length} Queries</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .status { background: ${megaTestRunning ? '#fff3cd' : '#d4edda'}; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                .config { background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .btn { display: inline-block; padding: 15px 30px; margin: 10px; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; cursor: pointer; border: none; }
                .btn-success { background: #28a745; }
                .btn-danger { background: #dc3545; }
                .btn-primary { background: #007bff; }
                .btn-info { background: #17a2b8; }
                .btn:hover { opacity: 0.9; }
                .progress-bar { width: 100%; background: #e9ecef; border-radius: 10px; margin: 10px 0; }
                .progress-fill { height: 20px; background: #28a745; border-radius: 10px; transition: width 0.5s; }
                .warning { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .results-info { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 5px; }
            </style>
            <script>
                async function startMegaTest() {
                    if (!confirm('Start testing 293 queries? This may take 20+ minutes and will make many requests to Google.')) return;
                    
                    const btn = document.getElementById('startBtn');
                    btn.textContent = 'Starting...';
                    btn.disabled = true;
                    
                    try {
                        const response = await fetch('/start-mega-test');
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('MEGA test started! Monitor progress in logs.');
                            location.reload();
                        } else {
                            alert('Error: ' + result.error);
                        }
                    } catch (error) {
                        alert('Error: ' + error.message);
                    }
                    
                    btn.disabled = false;
                    btn.textContent = 'START MEGA TEST';
                }
                
                async function stopMegaTest() {
                    try {
                        const response = await fetch('/stop-mega-test');
                        const result = await response.json();
                        alert(result.message);
                        location.reload();
                    } catch (error) {
                        alert('Error: ' + error.message);
                    }
                }
                
                // Auto-refresh during test
                if (${megaTestRunning}) {
                    setTimeout(() => location.reload(), 10000); // Refresh every 10s
                }
            </script>
        </head>
        <body>
            <h1>MEGA Bulk Tester</h1>
            <h2>${UKRAINE_QUERIES.length} Ukraine MFO/Credit Queries</h2>
            
            <div class="status">
                <h3>Status: ${megaTestRunning ? 'RUNNING' : 'READY'}</h3>
                <strong>Progress:</strong> ${progress}<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}<br>
                ${megaTestRunning ? `<strong>ETA:</strong> ~${eta} minutes remaining<br>` : ''}
                <strong>Total Results Expected:</strong> ~${UKRAINE_QUERIES.length * 50} records
                
                ${megaTestRunning ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(currentQueryIndex/UKRAINE_QUERIES.length*100)}%"></div>
                    </div>
                ` : ''}
            </div>

            <div class="config">
                <h3>Configuration</h3>
                <strong>Queries:</strong> ${UKRAINE_QUERIES.length}<br>
                <strong>Delay between requests:</strong> ${TEST_CONFIG.delayBetweenRequests/1000} seconds<br>
                <strong>Pause every:</strong> ${TEST_CONFIG.pauseAfterQueries} queries<br>
                <strong>Pause duration:</strong> ${TEST_CONFIG.pauseDuration/1000} seconds<br>
                <strong>Results per query:</strong> Top-${TEST_CONFIG.maxResultsPerQuery}
            </div>

            <div style="text-align: center; margin: 30px 0;">
                ${megaTestRunning ? `
                    <button onclick="stopMegaTest()" class="btn btn-danger">STOP MEGA TEST</button>
                    <p><strong>Test in progress...</strong> Query ${currentQueryIndex}/${UKRAINE_QUERIES.length}</p>
                ` : `
                    <button id="startBtn" onclick="startMegaTest()" class="btn btn-success">START MEGA TEST</button>
                `}
                
                <a href="/ip" class="btn btn-info">Check IP</a>
                <a href="/logs" class="btn btn-primary">Live Logs</a>
                <a href="/debug-search?query=кредит+онлайн" class="btn btn-info">Debug Parser</a>
                <a href="/results-summary" class="btn btn-primary">Results Summary</a>
                <a href="/download-results" class="btn btn-info">Download Data</a>
            </div>

            <div class="results-info">
                <h3>Results Storage</h3>
                <p><strong>JSON Files:</strong> Each query → separate file in /results/ folder</p>
                <p><strong>CSV File:</strong> All results combined in all_results.csv</p>
                <p><strong>Summary:</strong> mega_test_summary.json with statistics</p>
                <p><strong>Logs:</strong> mega_test_log.txt with all requests</p>
            </div>

            <div class="warning">
                <h3>Important Notes</h3>
                <ul>
                    <li>This will make <strong>${UKRAINE_QUERIES.length} requests</strong> to Google</li>
                    <li>Expected duration: <strong>15-25 minutes</strong></li>
                    <li>Google may block after 50-100 queries</li>
                    <li>If blocked, restart Heroku dyno for new IP</li>
                    <li>Results saved automatically, recoverable after crash</li>
                </ul>
            </div>

            <details style="margin: 20px 0;">
                <summary><strong>All ${UKRAINE_QUERIES.length} Queries to Test</strong></summary>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; max-height: 300px; overflow-y: auto;">
                    <ol>
                        ${UKRAINE_QUERIES.map((q, i) => `<li>${q}</li>`).join('')}
                    </ol>
                </div>
            </details>
        </body>
        </html>
    `);
});

app.get('/ip', async (req, res) => {
    const ip = await getCurrentIP();
    res.json({ 
        ip: ip,
        timestamp: new Date().toISOString(),
        heroku_dyno: process.env.DYNO || 'local',
        test_running: megaTestRunning,
        current_progress: megaTestRunning ? `${currentQueryIndex}/${UKRAINE_QUERIES.length}` : 'idle'
    });
});

app.get('/start-mega-test', async (req, res) => {
    if (megaTestRunning) {
        return res.json({ success: false, error: 'MEGA test already running' });
    }
    
    // Запуск асинхронно
    runMegaBulkTest().then(result => {
        console.log('MEGA test finished:', result.success);
    }).catch(error => {
        console.error('MEGA test failed:', error);
        megaTestRunning = false;
    });
    
    res.json({ success: true, message: 'MEGA bulk test started' });
});

app.get('/stop-mega-test', (req, res) => {
    megaTestRunning = false;
    res.json({ message: `MEGA test stopped at query ${currentQueryIndex}` });
});

app.get('/logs', async (req, res) => {
    try {
        const logs = await fs.readFile('mega_test_log.txt', 'utf-8');
        const lines = logs.split('\n').slice(-100); // Останні 100 рядків
        
        res.send(`
            <html>
            <head><title>Live Logs</title>
            <meta http-equiv="refresh" content="5">
            <style>
                body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
                .log-line { margin: 2px 0; }
                .error { color: #f00; }
                .success { color: #0f0; }
                .blocked { color: #ff0; background: #440; }
            </style>
            </head>
            <body>
                <h2>Live Logs (auto-refresh every 5s)</h2>
                <p>Progress: ${currentQueryIndex}/${UKRAINE_QUERIES.length} | Running: ${megaTestRunning}</p>
                <div>
                    ${lines.map(line => {
                        const className = line.includes('BLOCKED') ? 'blocked' : 
                                         line.includes('ERROR') ? 'error' : 'success';
                        return `<div class="log-line ${className}">${line}</div>`;
                    }).join('')}
                </div>
                <br><a href="/" style="color: #0ff;">Home</a>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(404).send('<h2>No logs found yet</h2><a href="/">Home</a>');
    }
});

app.get('/results-summary', async (req, res) => {
    if (currentResults.length === 0) {
        return res.send('<h2>No test results yet</h2><a href="/">Home</a>');
    }
    
    const successful = currentResults.filter(r => r.success && !r.blocked);
    const blocked = currentResults.filter(r => r.blocked);
    const errors = currentResults.filter(r => !r.success);
    const totalResults = currentResults.reduce((sum, r) => sum + r.resultsFound, 0);
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MEGA Test Results Summary</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
                .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                .stat-box { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; border-left: 4px solid #007bff; }
                .query-result { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; }
                .success { border-left: 4px solid #28a745; }
                .blocked { border-left: 4px solid #dc3545; background: #f8d7da; }
                .error { border-left: 4px solid #ffc107; background: #fff3cd; }
                .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 5px; }
            </style>
        </head>
        <body>
            <h1>MEGA Test Results Summary</h1>
            
            <div class="summary">
                <div class="stat-box">
                    <h3>${currentResults.length}</h3>
                    <p>Total Queries</p>
                </div>
                <div class="stat-box">
                    <h3>${successful.length}</h3>
                    <p>Successful</p>
                </div>
                <div class="stat-box">
                    <h3>${blocked.length}</h3>
                    <p>Blocked</p>
                </div>
                <div class="stat-box">
                    <h3>${errors.length}</h3>
                    <p>Errors</p>
                </div>
                <div class="stat-box">
                    <h3>${totalResults}</h3>
                    <p>Total Results Parsed</p>
                </div>
                <div class="stat-box">
                    <h3>${Math.round(totalResults/Math.max(1,successful.length))}</h3>
                    <p>Avg Results/Query</p>
                </div>
            </div>
            
            <h2>Query Details (Last 50)</h2>
            <div>
                ${currentResults.slice(-50).reverse().map(r => `
                    <div class="query-result ${r.blocked ? 'blocked' : r.success ? 'success' : 'error'}">
                        <strong>#${r.queryIndex}</strong> ${r.query} - 
                        ${r.blocked ? `BLOCKED` : r.success ? `OK (${r.resultsFound} results, ${r.responseTime}ms)` : `ERROR: ${r.error}`}
                    </div>
                `).join('')}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="/" class="btn">Home</a>
                <a href="/logs" class="btn">Logs</a>
                <a href="/download-results" class="btn">Download Data</a>
            </div>
        </body>
        </html>
    `);
});

app.get('/download-results', async (req, res) => {
    try {
        // Перевіряємо які файли доступні
        const files = [];
        
        try {
            await fs.access('all_results.csv');
            files.push({ name: 'all_results.csv', desc: 'All results in CSV format' });
        } catch {}
        
        try {
            await fs.access('mega_test_summary.json');
            files.push({ name: 'mega_test_summary.json', desc: 'Test summary statistics' });
        } catch {}
        
        try {
            await fs.access('mega_test_log.txt');
            files.push({ name: 'mega_test_log.txt', desc: 'Complete test logs' });
        } catch {}
        
        res.send(`
            <h1>Download Results</h1>
            <p>Available files for download:</p>
            <ul>
                ${files.map(f => `<li><a href="/download/${f.name}">${f.name}</a> - ${f.desc}</li>`).join('')}
            </ul>
            <p><strong>Individual Query Results:</strong> JSON files are stored in /results/ folder</p>
            <br><a href="/">Home</a>
        `);
        
    } catch (error) {
        res.status(500).send('Error accessing files: ' + error.message);
    }
});

app.get('/download/:filename', async (req, res) => {
    const filename = req.params.filename;
    const allowedFiles = ['all_results.csv', 'mega_test_summary.json', 'mega_test_log.txt'];
    
    if (!allowedFiles.includes(filename)) {
        return res.status(404).send('File not allowed');
    }
    
    try {
        const content = await fs.readFile(filename, 'utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'text/plain');
        res.send(content);
    } catch (error) {
        res.status(404).send('File not found');
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        test_running: megaTestRunning,
        progress: megaTestRunning ? `${currentQueryIndex}/${UKRAINE_QUERIES.length}` : 'idle'
    });
});

// Debug ендпоінт для діагностики парсингу
app.get('/debug-search', async (req, res) => {
    const query = req.query.query || 'кредит онлайн';
    
    try {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=uk&gl=ua`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });
        
        const html = response.data;
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Debug Google Response</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
                    .section { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #007bff; }
                    .good { border-left-color: #28a745; }
                    .bad { border-left-color: #dc3545; }
                    .warning { border-left-color: #ffc107; }
                    pre { background: #f0f0f0; padding: 10px; max-height: 400px; overflow: auto; font-size: 10px; }
                    .tag-sample { border: 1px solid #ccc; margin: 5px; padding: 5px; background: #fff; font-size: 12px; }
                    .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 5px; }
                </style>
            </head>
            <body>
                <h1>🔍 Debug Google Response</h1>
                
                <div class="section">
                    <h3>Request Info</h3>
                    <p><strong>Query:</strong> "${query}"</p>
                    <p><strong>URL:</strong> ${searchUrl}</p>
                    <p><strong>Status:</strong> ${response.status}</p>
                    <p><strong>HTML Size:</strong> ${html.length} chars</p>
                </div>
                
                <div class="section ${html.toLowerCase().includes('unusual traffic') || html.toLowerCase().includes('captcha') ? 'bad' : 'good'}">
                    <h3>🚫 Blocking Detection</h3>
                    <p><strong>unusual traffic:</strong> ${html.toLowerCase().includes('unusual traffic')}</p>
                    <p><strong>captcha:</strong> ${html.toLowerCase().includes('captcha')}</p>
                    <p><strong>robots.txt:</strong> ${html.toLowerCase().includes('robots.txt')}</p>
                    <p><strong>verify you are human:</strong> ${html.toLowerCase().includes('verify you are human')}</p>
                </div>
                
                <div class="section ${html.includes('<h3') ? 'good' : 'bad'}">
                    <h3>🏗️ HTML Structure Check</h3>
                    <p><strong>Contains &lt;h3&gt;:</strong> ${html.includes('<h3')} (${(html.match(/<h3/gi) || []).length} found)</p>
                    <p><strong>Contains data-ved:</strong> ${html.includes('data-ved')} (${(html.match(/data-ved/gi) || []).length} found)</p>
                    <p><strong>Contains class="g":</strong> ${html.includes('class="g"')} (${(html.match(/class="[^"]*\bg\b[^"]*"/gi) || []).length} found)</p>
                    <p><strong>Contains MjjYud:</strong> ${html.includes('MjjYud')} (${(html.match(/MjjYud/gi) || []).length} found)</p>
                    <p><strong>Contains jscontroller:</strong> ${html.includes('jscontroller')} (${(html.match(/jscontroller/gi) || []).length} found)</p>
                    <p><strong>Contains VwiC3b:</strong> ${html.includes('VwiC3b')} (${(html.match(/VwiC3b/gi) || []).length} found)</p>
                </div>
                
                <div class="section">
                    <h3>📝 Parse Test</h3>
                    <p>Running parseTop100Results() on this HTML...</p>
                    <div style="background: #e9ecef; padding: 10px; border-radius: 3px;">
                        ${(() => {
                            try {
                                const testResults = parseTop100Results(html);
                                return `<strong>Results found:</strong> ${testResults.length}<br>` +
                                       testResults.slice(0, 3).map((r, i) => 
                                           `${i+1}. <a href="${r.url}" target="_blank">${r.title}</a> (${r.domain})`
                                       ).join('<br>');
                            } catch (error) {
                                return `<strong style="color: red;">Parser error:</strong> ${error.message}`;
                            }
                        })()}
                    </div>
                </div>
                
                <div class="section">
                    <h3>📄 Raw HTML Sample (first 3000 chars)</h3>
                    <pre>${html.substring(0, 3000).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </div>
                
                <div class="section">
                    <h3>🏷️ All H3 tags found (first 10)</h3>
                    <div style="max-height: 400px; overflow: auto;">
                        ${(html.match(/<h3[^>]*>[\s\S]*?<\/h3>/gi) || ['<div style="color:red;">NONE FOUND!</div>']).slice(0, 10).map((tag, i) => 
                            `<div class="tag-sample"><strong>#${i+1}:</strong> ${tag.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="section">
                    <h3>🔗 All A tags with href (first 10)</h3>
                    <div style="max-height: 300px; overflow: auto;">
                        ${(html.match(/<a[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>/gi) || ['<div style="color:red;">NONE FOUND!</div>']).slice(0, 10).map((tag, i) => 
                            `<div class="tag-sample"><strong>#${i+1}:</strong> ${tag.substring(0, 200).replace(/</g, '&lt;').replace(/>/g, '&gt;')}...</div>`
                        ).join('')}
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="/" class="btn">🏠 Home</a>
                    <a href="/debug-search?query=test" class="btn">🧪 Test English</a>
                    <a href="/debug-search?query=ukraine+news" class="btn">🌍 Test Ukraine</a>
                    <a href="/debug-search?query=кредит" class="btn">🏦 Test Credit</a>
                </div>
            </body>
            </html>
        `);
        
    } catch (error) {
        res.send(`
            <h1>❌ Debug Error</h1>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Status:</strong> ${error.response ? error.response.status : 'No response'}</p>
            <br><a href="/" class="btn">🏠 Home</a>
        `);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`MEGA Bulk Tester running on port ${PORT}`);
    console.log(`Ready to test ${UKRAINE_QUERIES.length} Ukraine queries`);
    console.log(`Expected ~${UKRAINE_QUERIES.length * 50} total results`);
});

process.on('SIGTERM', () => {
    megaTestRunning = false;
    console.log('Server shutting down...');
    process.exit(0);
});
