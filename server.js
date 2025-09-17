const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// 293 ключових слова для України (скорочено для прикладу)
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
let browser = null;

const TEST_CONFIG = {
    delayBetweenRequests: 5000,    // 5 секунд між запитами
    pauseAfterQueries: 15,         // Пауза кожні 15 запитів
    pauseDuration: 60000,          // 60 секунд пауза
    maxResultsPerQuery: 100        
};

// Ініціалізація браузера з анти-детекцією
async function initBrowser() {
    if (browser) return browser;
    
    console.log('Initializing Puppeteer browser...');
    
    browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript',
            '--disable-default-apps',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-field-trial-config'
        ]
    });
    
    return browser;
}

// Створення нової сторінки з анти-детекцією
async function createStealthPage() {
    const browser = await initBrowser();
    const page = await browser.newPage();
    
    // Встановлюємо viewport
    await page.setViewport({
        width: 1366,
        height: 768,
        deviceScaleFactor: 1
    });
    
    // Встановлюємо User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Встановлюємо додаткові заголовки
    await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,uk;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    });
    
    // Анти-детекція скрипти
    await page.evaluateOnNewDocument(() => {
        // Приховуємо webdriver
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
        
        // Перевизначаємо chrome property
        window.chrome = {
            runtime: {}
        };
        
        // Перевизначаємо plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });
        
        // Перевизначаємо languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en', 'uk']
        });
        
        // Приховуємо automation
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });
    
    return page;
}

// Функція для парсингу Google SERP з Puppeteer
async function scrapeGoogleWithPuppeteer(query, queryIndex) {
    let page = null;
    
    try {
        console.log(`[${queryIndex}] Opening browser page for: "${query}"`);
        
        page = await createStealthPage();
        const startTime = Date.now();
        
        // Формуємо URL
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=100&hl=en&gl=us`;
        
        console.log(`[${queryIndex}] Navigating to: ${searchUrl}`);
        
        // Переходимо на Google
        const response = await page.goto(searchUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        const responseTime = Date.now() - startTime;
        
        // Перевіряємо чи заблоковані
        const title = await page.title();
        const url = page.url();
        
        if (title.includes('unusual traffic') || url.includes('sorry') || url.includes('captcha')) {
            console.log(`[${queryIndex}] *** BLOCKED DETECTED ***`);
            await page.close();
            return {
                queryIndex: queryIndex,
                query: query,
                success: true,
                blocked: true,
                statusCode: response.status(),
                responseTime: responseTime,
                resultsFound: 0,
                results: [],
                timestamp: new Date().toISOString()
            };
        }
        
        // Чекаємо завантаження результатів
        await page.waitForSelector('h3', { timeout: 10000 }).catch(() => {
            console.log(`[${queryIndex}] No h3 elements found, continuing...`);
        });
        
        // Парсимо результати
        console.log(`[${queryIndex}] Parsing results...`);
        
        const results = await page.evaluate(() => {
            const results = [];
            let position = 1;
            
            // Шукаємо всі результати через різні селектори
            const selectors = [
                'div[data-ved] h3 a',
                'div.g h3 a', 
                'div.MjjYud h3 a',
                'div[jscontroller] h3 a'
            ];
            
            const foundUrls = new Set();
            
            for (let selector of selectors) {
                const elements = document.querySelectorAll(selector);
                
                elements.forEach(link => {
                    if (position > 100) return;
                    
                    let url = link.href;
                    if (!url || !url.startsWith('http')) return;
                    if (foundUrls.has(url)) return;
                    foundUrls.add(url);
                    
                    const title = link.textContent.trim();
                    if (!title) return;
                    
                    // Шукаємо snippet
                    let snippet = '';
                    const parent = link.closest('div');
                    if (parent) {
                        const snippetEl = parent.querySelector('.VwiC3b, .s3v9rd, .st, .IsZvec');
                        if (snippetEl) {
                            snippet = snippetEl.textContent.trim();
                        }
                    }
                    
                    // Витягуємо домен
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
                        snippet: snippet.substring(0, 300)
                    });
                    
                    position++;
                });
            }
            
            return results;
        });
        
        await page.close();
        
        console.log(`[${queryIndex}] SUCCESS - ${results.length} results parsed - ${responseTime}ms`);
        
        const result = {
            queryIndex: queryIndex,
            query: query,
            success: true,
            blocked: false,
            statusCode: response.status(),
            responseTime: responseTime,
            htmlSize: 0, // Puppeteer не дає HTML розмір
            resultsFound: results.length,
            results: results,
            timestamp: new Date().toISOString()
        };
        
        // Зберігаємо результати
        await saveQueryResults(queryIndex, query, result);
        
        return result;
        
    } catch (error) {
        if (page) await page.close();
        
        console.log(`[${queryIndex}] ERROR: ${error.message}`);
        
        return {
            queryIndex: queryIndex,
            query: query,
            success: false,
            blocked: false,
            error: error.message,
            responseTime: 0,
            resultsFound: 0,
            results: [],
            timestamp: new Date().toISOString()
        };
    }
}

// Збереження результатів (та же функція)
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

// CSV функція (та же)
async function appendToCSV(queryIndex, query, results) {
    try {
        let csvContent = '';
        
        try {
            await fs.access('all_results.csv');
        } catch {
            csvContent = 'QueryIndex,Query,Position,Title,URL,Domain,Snippet\n';
        }
        
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

// Функція логування
async function logResult(logEntry) {
    const logLine = `${new Date().toISOString()} | ${JSON.stringify(logEntry)}\n`;
    
    try {
        await fs.appendFile('puppeteer_test_log.txt', logLine);
        console.log(`[LOG] Query ${logEntry.queryIndex || '?'}: ${logEntry.success ? 'OK' : 'FAIL'}`);
    } catch (error) {
        console.error('Log error:', error.message);
    }
}

// Головна функція тестування
async function runPuppeteerBulkTest() {
    if (megaTestRunning) {
        return { success: false, error: 'Puppeteer test already running' };
    }
    
    megaTestRunning = true;
    currentResults = [];
    currentQueryIndex = 0;
    
    const testStartTime = new Date().toISOString();
    console.log(`Starting Puppeteer bulk test with ${UKRAINE_QUERIES.length} queries`);
    
    try {
        // Створюємо папку для результатів
        try {
            await fs.mkdir('results');
        } catch (e) {}
        
        for (let i = 0; i < UKRAINE_QUERIES.length; i++) {
            if (!megaTestRunning) {
                console.log('Test stopped by user');
                break;
            }
            
            currentQueryIndex = i + 1;
            const query = UKRAINE_QUERIES[i];
            
            // Виконати запит через Puppeteer
            const result = await scrapeGoogleWithPuppeteer(query, currentQueryIndex);
            
            currentResults.push(result);
            await logResult(result);
            
            // Перевірка блокування
            if (result.blocked) {
                console.log('*** GOOGLE BLOCKED - STOPPING TEST ***');
                await logResult({
                    type: 'puppeteer_test_blocked',
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
        
        // Закриваємо браузер
        if (browser) {
            await browser.close();
            browser = null;
        }
        
        // Фінальний звіт
        const summary = {
            type: 'puppeteer_test_completed',
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
        await fs.writeFile('puppeteer_summary.json', JSON.stringify(summary, null, 2));
        
        console.log('PUPPETEER TEST COMPLETED:', summary);
        return { success: true, summary: summary, results: currentResults };
        
    } catch (error) {
        console.error('Puppeteer test critical error:', error);
        return { success: false, error: error.message };
    } finally {
        megaTestRunning = false;
        currentQueryIndex = 0;
        
        if (browser) {
            await browser.close();
            browser = null;
        }
    }
}

// =============== ROUTES ===============

app.get('/', (req, res) => {
    const progress = megaTestRunning ? `${currentQueryIndex}/${UKRAINE_QUERIES.length}` : 'Ready';
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Puppeteer Google SERP Scraper</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .status { background: ${megaTestRunning ? '#fff3cd' : '#d4edda'}; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                .btn { display: inline-block; padding: 15px 30px; margin: 10px; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; cursor: pointer; border: none; }
                .btn-success { background: #28a745; }
                .btn-danger { background: #dc3545; }
                .btn-primary { background: #007bff; }
                .btn:hover { opacity: 0.9; }
                .features { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
            </style>
            <script>
                async function startPuppeteerTest() {
                    if (!confirm('Start Puppeteer test? This uses a real browser and may take 30+ minutes.')) return;
                    
                    const btn = document.getElementById('startBtn');
                    btn.textContent = 'Starting...';
                    btn.disabled = true;
                    
                    try {
                        const response = await fetch('/start-puppeteer-test');
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('Puppeteer test started!');
                            location.reload();
                        } else {
                            alert('Error: ' + result.error);
                        }
                    } catch (error) {
                        alert('Error: ' + error.message);
                    }
                    
                    btn.disabled = false;
                    btn.textContent = 'START PUPPETEER TEST';
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
            </script>
        </head>
        <body>
            <h1>Puppeteer Google SERP Scraper</h1>
            
            <div class="status">
                <h3>Status: ${megaTestRunning ? 'RUNNING' : 'READY'}</h3>
                <strong>Progress:</strong> ${progress}<br>
                <strong>Mode:</strong> Full Browser (Puppeteer)<br>
                <strong>Anti-Detection:</strong> Enabled
            </div>

            <div class="features">
                <h3>Anti-Detection Features:</h3>
                <ul>
                    <li>Real Chrome browser rendering</li>
                    <li>Stealth user agent & headers</li>
                    <li>JavaScript execution</li>
                    <li>WebDriver property hiding</li>
                    <li>Realistic viewport & plugins</li>
                    <li>Network idle waiting</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                ${megaTestRunning ? `
                    <button onclick="stopTest()" class="btn btn-danger">STOP TEST</button>
                    <p>Query ${currentQueryIndex}/${UKRAINE_QUERIES.length} running...</p>
                ` : `
                    <button id="startBtn" onclick="startPuppeteerTest()" class="btn btn-success">START PUPPETEER TEST</button>
                `}
                
                <a href="/logs" class="btn btn-primary">View Logs</a>
                <a href="/results-summary" class="btn btn-primary">Results Summary</a>
            </div>
        </body>
        </html>
    `);
});

app.get('/start-puppeteer-test', async (req, res) => {
    if (megaTestRunning) {
        return res.json({ success: false, error: 'Test already running' });
    }
    
    runPuppeteerBulkTest().then(result => {
        console.log('Puppeteer test finished:', result.success);
    }).catch(error => {
        console.error('Puppeteer test failed:', error);
        megaTestRunning = false;
    });
    
    res.json({ success: true, message: 'Puppeteer test started' });
});

app.get('/stop-test', (req, res) => {
    megaTestRunning = false;
    res.json({ message: 'Test stopped' });
});

app.get('/logs', async (req, res) => {
    try {
        const logs = await fs.readFile('puppeteer_test_log.txt', 'utf-8');
        const lines = logs.split('\n').slice(-50);
        
        res.send(`
            <h1>Puppeteer Logs</h1>
            <pre style="background:#000; color:#0f0; padding:20px; overflow:auto; max-height:600px;">
                ${lines.join('\n')}
            </pre>
            <br><a href="/">Home</a>
        `);
    } catch (error) {
        res.send('<h2>No logs found</h2><a href="/">Home</a>');
    }
});

app.get('/results-summary', (req, res) => {
    if (currentResults.length === 0) {
        return res.send('<h2>No results yet</h2><a href="/">Home</a>');
    }
    
    const successful = currentResults.filter(r => r.success && !r.blocked);
    const totalResults = currentResults.reduce((sum, r) => sum + r.resultsFound, 0);
    
    res.send(`
        <h1>Puppeteer Results</h1>
        <p>Total: ${currentResults.length}</p>
        <p>Successful: ${successful.length}</p>
        <p>Results parsed: ${totalResults}</p>
        <br><a href="/">Home</a>
    `);
});

app.listen(PORT, () => {
    console.log(`Puppeteer SERP scraper running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
    megaTestRunning = false;
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});
