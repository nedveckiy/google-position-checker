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

const TEST_CONFIG = {
    delayBetweenRequests: 3000,
    pauseAfterQueries: 25,
    pauseDuration: 30000,
    maxResultsPerQuery: 100
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
        console.log(`[LOG] Query ${logEntry.queryIndex || '?'}: ${logEntry.success ? 'OK' : 'FAIL'}`);
    } catch (error) {
        console.error('Log error:', error.message);
    }
}

// Покращені заголовки для обходу детекції
function getRandomHeaders() {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    return {
        'User-Agent': randomUA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'no-cache'
    };
}

// Парсинг результатів з regex
function parseGoogleResults(html) {
    const results = [];
    
    // Кілька паттернів для різних структур Google
    const patterns = [
        // Паттерн 1: основний
        /<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a><\/h3>/gi,
        // Паттерн 2: альтернативний
        /<a[^>]*href="([^"]*)"[^>]*><h3[^>]*>(.*?)<\/h3><\/a>/gi
    ];
    
    let position = 1;
    const foundUrls = new Set();
    
    for (let pattern of patterns) {
        let match;
        pattern.lastIndex = 0;
        
        while ((match = pattern.exec(html)) !== null && position <= 100) {
            try {
                let url = match[1];
                let title = match[2] ? match[2].replace(/<[^>]*>/g, '').trim() : '';
                
                // Очищуємо URL
                if (url.startsWith('/url?q=')) {
                    url = decodeURIComponent(url.split('/url?q=')[1].split('&')[0]);
                }
                
                if (!url.startsWith('http') || foundUrls.has(url)) continue;
                foundUrls.add(url);
                
                if (!title) continue;
                
                // Домен
                let domain = '';
                try {
                    domain = new URL(url).hostname.replace('www.', '');
                } catch (e) {
                    domain = url.substring(0, 50);
                }
                
                results.push({
                    position: position,
                    title: title.substring(0, 200),
                    url: url,
                    domain: domain,
                    snippet: ''
                });
                position++;
                
            } catch (error) {
                continue;
            }
        }
    }
    
    return results;
}

async function testSingleQuery(query, queryIndex) {
    // Спробуємо кілька варіантів локації
    const locations = [
        { hl: 'en', gl: 'us' },
        { hl: 'en', gl: 'gb' },
        { hl: 'en', gl: 'ca' }
    ];
    
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=50&hl=${randomLocation.hl}&gl=${randomLocation.gl}`;
    
    try {
        console.log(`[${queryIndex}/${UKRAINE_QUERIES.length}] Testing: "${query}"`);
        
        const startTime = Date.now();
        
        const response = await axios.get(searchUrl, {
            headers: getRandomHeaders(),
            timeout: 15000
        });
        
        const responseTime = Date.now() - startTime;
        const html = response.data;
        
        // Перевірка блокування
        const htmlLower = html.toLowerCase();
        const blocked = htmlLower.includes('unusual traffic') || 
                       htmlLower.includes('captcha') || 
                       htmlLower.includes('robots.txt') ||
                       htmlLower.includes('noscript') ||
                       htmlLower.includes('enablejs') ||
                       response.status === 429;
        
        if (blocked) {
            console.log(`[${queryIndex}] BLOCKED - IP needs rotation`);
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
        const results = parseGoogleResults(html);
        
        console.log(`[${queryIndex}] SUCCESS - ${results.length} results - ${responseTime}ms`);
        
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
        
        // Зберігаємо результати
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

// Збереження результатів
async function saveQueryResults(queryIndex, query, result) {
    try {
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
        
        if (result.success && !result.blocked && result.results.length > 0) {
            await appendToCSV(queryIndex, query, result.results);
        }
        
    } catch (error) {
        console.error(`Save error for query ${queryIndex}:`, error.message);
    }
}

async function appendToCSV(queryIndex, query, results) {
    try {
        let csvContent = '';
        
        try {
            await fs.access('all_results.csv');
        } catch {
            csvContent = 'QueryIndex,Query,Position,Title,URL,Domain\n';
        }
        
        for (let result of results) {
            const csvRow = [
                queryIndex,
                `"${query.replace(/"/g, '""')}"`,
                result.position,
                `"${result.title.replace(/"/g, '""')}"`,
                `"${result.url.replace(/"/g, '""')}"`,
                `"${result.domain.replace(/"/g, '""')}"`
            ].join(',') + '\n';
            
            csvContent += csvRow;
        }
        
        await fs.appendFile('all_results.csv', csvContent);
        
    } catch (error) {
        console.error('CSV append error:', error.message);
    }
}

// Головна функція тестування
async function runMegaBulkTest() {
    if (megaTestRunning) {
        return { success: false, error: 'Test already running' };
    }
    
    megaTestRunning = true;
    currentResults = [];
    currentQueryIndex = 0;
    
    const startIP = await getCurrentIP();
    const testStartTime = new Date().toISOString();
    
    console.log(`Starting test with ${UKRAINE_QUERIES.length} queries from IP: ${startIP}`);
    
    try {
        try {
            await fs.mkdir('results');
        } catch (e) {}
        
        for (let i = 0; i < UKRAINE_QUERIES.length; i++) {
            if (!megaTestRunning) break;
            
            currentQueryIndex = i + 1;
            const query = UKRAINE_QUERIES[i];
            
            const result = await testSingleQuery(query, currentQueryIndex);
            result.ip = startIP;
            
            currentResults.push(result);
            await logResult(result);
            
            if (result.blocked) {
                console.log('BLOCKED - Stopping test');
                await logResult({
                    type: 'test_blocked',
                    ip: startIP,
                    totalQueries: UKRAINE_QUERIES.length,
                    completedQueries: currentQueryIndex,
                    blockedAt: currentQueryIndex,
                    timestamp: new Date().toISOString()
                });
                break;
            }
            
            // Паузи
            if (currentQueryIndex % TEST_CONFIG.pauseAfterQueries === 0) {
                console.log(`Break for ${TEST_CONFIG.pauseDuration/1000}s after ${currentQueryIndex} queries...`);
                await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.pauseDuration));
            }
            
            if (i < UKRAINE_QUERIES.length - 1 && megaTestRunning) {
                console.log(`Waiting ${TEST_CONFIG.delayBetweenRequests/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delayBetweenRequests));
            }
        }
        
        // Звіт
        const summary = {
            type: 'test_completed',
            ip: startIP,
            startTime: testStartTime,
            endTime: new Date().toISOString(),
            totalQueries: UKRAINE_QUERIES.length,
            completedQueries: currentResults.length,
            successfulQueries: currentResults.filter(r => r.success && !r.blocked).length,
            blockedQueries: currentResults.filter(r => r.blocked).length,
            errorQueries: currentResults.filter(r => !r.success).length,
            totalResultsParsed: currentResults.reduce((sum, r) => sum + r.resultsFound, 0)
        };
        
        await logResult(summary);
        await fs.writeFile('test_summary.json', JSON.stringify(summary, null, 2));
        
        console.log('TEST COMPLETED:', summary);
        return { success: true, summary: summary, results: currentResults };
        
    } catch (error) {
        console.error('Test error:', error);
        return { success: false, error: error.message };
    } finally {
        megaTestRunning = false;
        currentQueryIndex = 0;
    }
}

// ROUTES
app.get('/', (req, res) => {
    const progress = megaTestRunning ? `${currentQueryIndex}/${UKRAINE_QUERIES.length}` : 'Ready';
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Google Scraper - ${UKRAINE_QUERIES.length} Queries</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 900px; margin: 20px auto; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .status { background: ${megaTestRunning ? '#fff3cd' : '#d4edda'}; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                .btn { display: inline-block; padding: 15px 25px; margin: 10px; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; cursor: pointer; border: none; }
                .btn-success { background: #28a745; }
                .btn-danger { background: #dc3545; }
                .btn-primary { background: #007bff; }
                .btn:hover { opacity: 0.9; }
            </style>
            <script>
                async function startTest() {
                    if (!confirm('Start testing ${UKRAINE_QUERIES.length} queries?')) return;
                    
                    const btn = document.getElementById('startBtn');
                    btn.textContent = 'Starting...';
                    btn.disabled = true;
                    
                    try {
                        const response = await fetch('/start-test');
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('Test started!');
                            location.reload();
                        } else {
                            alert('Error: ' + result.error);
                        }
                    } catch (error) {
                        alert('Error: ' + error.message);
                    }
                    
                    btn.disabled = false;
                    btn.textContent = 'START TEST';
                }
                
                async function stopTest() {
                    try {
                        const response = await fetch('/stop-test');
                        const result = await response.json();
                        alert(result.message);
                        location.reload();
                    } catch (error) {
                        alert('Error: ' + error.message);
                    }
                }
                
                if (${megaTestRunning}) {
                    setTimeout(() => location.reload(), 10000);
                }
            </script>
        </head>
        <body>
            <h1>Google SERP Scraper</h1>
            
            <div class="status">
                <h3>Status: ${megaTestRunning ? 'RUNNING' : 'READY'}</h3>
                <strong>Progress:</strong> ${progress}<br>
                <strong>Anti-Detection:</strong> Random headers, locations, delays<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}
            </div>

            <div style="text-align: center; margin: 30px 0;">
                ${megaTestRunning ? `
                    <button onclick="stopTest()" class="btn btn-danger">STOP TEST</button>
                    <p>Query ${currentQueryIndex}/${UKRAINE_QUERIES.length} running...</p>
                ` : `
                    <button id="startBtn" onclick="startTest()" class="btn btn-success">START TEST</button>
                `}
                
                <a href="/ip" class="btn btn-primary">Check IP</a>
