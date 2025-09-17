const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Список запитів для України
const UKRAINE_QUERIES = [
    'кредити онлайн',
    'нові мфо',
    'маловідомі мфо',
    'кредит через дію',
    'мфо україни',
    'всі мфо',
    'долгосрочный кредит на карту',
    'онлайн кредит на карту',
    'кредит без звонков',
    'кредит без отказа и проверок',
    'микрозаймы',
    'микрокредиты',
    'онлайн позики',
    'мікрокредит онлайн',
    'мікрокредит на картку',
    'займи онлайн',
    'мікропозика',
    'кредит плюс',
    'манівео',
    'старфін'
];

// Глобальні змінні для контролю тестування
let bulkTestRunning = false;
let currentTestResults = [];

async function getCurrentIP() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', {
            timeout: 5000
        });
        return response.data.ip;
    } catch (error) {
        return 'Unknown';
    }
}

async function logResult(logEntry) {
    const logLine = `${new Date().toISOString()} | ${JSON.stringify(logEntry)}\n`;
    
    try {
        await fs.appendFile('bulk_test_log.txt', logLine);
        console.log('Logged:', logEntry);
    } catch (error) {
        console.error('Log error:', error.message);
    }
}

// Простий парсинг топ результатів
function parseSimpleResults(html) {
    const results = [];
    
    // Простий regex для знаходження заголовків і URL
    const titleUrlPattern = /<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a><\/h3>/gi;
    
    let match;
    let position = 1;
    
    while ((match = titleUrlPattern.exec(html)) !== null && position <= 20) {
        let url = match[1];
        let title = match[2];
        
        // Очищення URL
        if (url.startsWith('/url?q=')) {
            url = decodeURIComponent(url.split('/url?q=')[1].split('&')[0]);
        }
        
        // Витягнення домену
        let domain = '';
        try {
            if (url.startsWith('http')) {
                domain = new URL(url).hostname.replace('www.', '');
            }
        } catch (e) {
            domain = url;
        }
        
        if (title && url.startsWith('http')) {
            results.push({
                position: position,
                title: title.trim(),
                url: url,
                domain: domain
            });
            position++;
        }
    }
    
    return results;
}

async function testSingleQuery(query, requestNumber) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=100&hl=uk&gl=ua&ie=UTF-8`;
    
    try {
        console.log(`[${requestNumber}] Testing: "${query}"`);
        
        const startTime = Date.now();
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
            },
            timeout: 15000
        });
        
        const responseTime = Date.now() - startTime;
        
        // Перевірка блокування
        const html = response.data;
        const htmlLower = html.toLowerCase();
        const blocked = htmlLower.includes('unusual traffic') || 
                       htmlLower.includes('captcha') || 
                       htmlLower.includes('robots.txt') ||
                       response.status === 429;
        
        // Парсинг результатів
        const results = blocked ? [] : parseSimpleResults(html);
        
        const result = {
            requestNumber: requestNumber,
            query: query,
            success: true,
            blocked: blocked,
            statusCode: response.status,
            responseTime: responseTime,
            htmlSize: html.length,
            resultsFound: results.length,
            results: results.slice(0, 10), // Топ-10
            timestamp: new Date().toISOString()
        };
        
        console.log(`[${requestNumber}] ${blocked ? 'BLOCKED' : 'OK'} - ${results.length} results - ${responseTime}ms`);
        
        return result;
        
    } catch (error) {
        console.log(`[${requestNumber}] ERROR: ${error.message}`);
        
        return {
            requestNumber: requestNumber,
            query: query,
            success: false,
            blocked: false,
            error: error.message,
            statusCode: error.response ? error.response.status : 'TIMEOUT',
            responseTime: 0,
            timestamp: new Date().toISOString()
        };
    }
}

// Послідовне тестування всіх запитів
async function runBulkTest() {
    if (bulkTestRunning) {
        console.log('Bulk test already running');
        return { error: 'Test already in progress' };
    }
    
    bulkTestRunning = true;
    currentTestResults = [];
    
    const startIP = await getCurrentIP();
    const testStartTime = new Date().toISOString();
    
    console.log(`Starting bulk test with IP: ${startIP}`);
    console.log(`Testing ${UKRAINE_QUERIES.length} queries`);
    
    try {
        for (let i = 0; i < UKRAINE_QUERIES.length; i++) {
            if (!bulkTestRunning) {
                console.log('Test stopped by user');
                break;
            }
            
            const query = UKRAINE_QUERIES[i];
            const requestNumber = i + 1;
            
            // Виконати запит
            const result = await testSingleQuery(query, requestNumber);
            
            // Додати IP інформацію
            result.ip = startIP;
            
            // Зберегти результат
            currentTestResults.push(result);
            
            // Записати в лог
            await logResult(result);
            
            // Перевірити чи заблоковано
            if (result.blocked) {
                console.log('BLOCKED detected! Stopping test.');
                await logResult({
                    type: 'bulk_test_blocked',
                    ip: startIP,
                    totalQueries: UKRAINE_QUERIES.length,
                    completedQueries: requestNumber,
                    blockedAt: requestNumber,
                    timestamp: new Date().toISOString()
                });
                break;
            }
            
            // Затримка 1 секунда між запитами (крім останнього)
            if (i < UKRAINE_QUERIES.length - 1 && bulkTestRunning) {
                console.log(`Waiting 1000ms... (${i + 1}/${UKRAINE_QUERIES.length})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Фінальний лог
        const summary = {
            type: 'bulk_test_completed',
            ip: startIP,
            startTime: testStartTime,
            endTime: new Date().toISOString(),
            totalQueries: UKRAINE_QUERIES.length,
            completedQueries: currentTestResults.length,
            successfulQueries: currentTestResults.filter(r => r.success && !r.blocked).length,
            blockedQueries: currentTestResults.filter(r => r.blocked).length,
            errorQueries: currentTestResults.filter(r => !r.success).length,
            averageResponseTime: Math.round(
                currentTestResults.filter(r => r.responseTime > 0)
                    .reduce((sum, r) => sum + r.responseTime, 0) / 
                Math.max(1, currentTestResults.filter(r => r.responseTime > 0).length)
            )
        };
        
        await logResult(summary);
        console.log('Bulk test completed:', summary);
        
        return {
            success: true,
            summary: summary,
            results: currentTestResults
        };
        
    } catch (error) {
        console.error('Bulk test error:', error);
        return {
            success: false,
            error: error.message,
            partialResults: currentTestResults
        };
    } finally {
        bulkTestRunning = false;
    }
}

// =============== ROUTES ===============

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Ukraine MFO Queries Bulk Tester</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .status { background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                .queries-list { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .btn { display: inline-block; padding: 15px 30px; margin: 10px; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
                .btn-success { background: #28a745; }
                .btn-danger { background: #dc3545; }
                .btn-primary { background: #007bff; }
                .btn-info { background: #17a2b8; }
                .btn:hover { opacity: 0.9; transform: translateY(-1px); }
                .running { background: #fff3cd; border-left: 4px solid #ffc107; }
                .warning { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px; }
            </style>
            <script>
                async function startBulkTest() {
                    const btn = document.getElementById('startBtn');
                    btn.textContent = 'Starting...';
                    btn.disabled = true;
                    
                    try {
                        const response = await fetch('/start-bulk-test');
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('Bulk test started! Check logs for progress.');
                            location.reload();
                        } else {
                            alert('Error: ' + result.error);
                        }
                    } catch (error) {
                        alert('Error: ' + error.message);
                    }
                    
                    btn.disabled = false;
                    btn.textContent = 'START BULK TEST';
                }
                
                async function stopBulkTest() {
                    try {
                        const response = await fetch('/stop-bulk-test');
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
            <h1>Ukraine MFO Queries Bulk Tester</h1>
            
            <div class="status">
                <strong>Current Status:</strong> ${bulkTestRunning ? 'Test Running...' : 'Ready'}<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}<br>
                <strong>Queries to test:</strong> ${UKRAINE_QUERIES.length}<br>
                <strong>Delay between queries:</strong> 1 second
            </div>

            <div style="text-align: center; margin: 30px 0;">
                ${bulkTestRunning ? `
                    <button onclick="stopBulkTest()" class="btn btn-danger">STOP TEST</button>
                    <p class="running">Test in progress... Check logs for updates</p>
                ` : `
                    <button id="startBtn" onclick="startBulkTest()" class="btn btn-success">START BULK TEST</button>
                `}
                
                <a href="/ip" class="btn btn-info">Check IP</a>
                <a href="/logs" class="btn btn-primary">View Logs</a>
                <a href="/results" class="btn btn-primary">Last Results</a>
            </div>

            <div class="queries-list">
                <h3>Queries to test (${UKRAINE_QUERIES.length}):</h3>
                <ol>
                    ${UKRAINE_QUERIES.map(q => `<li>${q}</li>`).join('')}
                </ol>
            </div>

            <div class="warning">
                <strong>Warning:</strong> This will make ${UKRAINE_QUERIES.length} requests to Google with 1-second delays. 
                May trigger blocking. Use for testing IP rotation and Google's anti-bot measures.
            </div>
        </body>
        </html>
    `);
});

app.get('/ip', async (req, res) => {
    const ip = await getCurrentIP();
    res.json({ 
        ip: ip,
        timestamp: new Date().toISOString(),
        heroku_dyno: process.env.DYNO || 'local'
    });
});

app.get('/start-bulk-test', async (req, res) => {
    if (bulkTestRunning) {
        return res.json({ success: false, error: 'Test already running' });
    }
    
    // Запуск асинхронно
    runBulkTest().then(result => {
        console.log('Bulk test finished:', result);
    }).catch(error => {
        console.error('Bulk test failed:', error);
        bulkTestRunning = false;
    });
    
    res.json({ success: true, message: 'Bulk test started' });
});

app.get('/stop-bulk-test', (req, res) => {
    bulkTestRunning = false;
    res.json({ message: 'Test stopped' });
});

app.get('/logs', async (req, res) => {
    try {
        const logs = await fs.readFile('bulk_test_log.txt', 'utf-8');
        res.type('text/plain');
        res.send(logs);
    } catch (error) {
        res.status(404).send('No logs found');
    }
});

app.get('/results', (req, res) => {
    if (currentTestResults.length === 0) {
        return res.send('<h2>No test results yet</h2><a href="/">Home</a>');
    }
    
    const successful = currentTestResults.filter(r => r.success && !r.blocked);
    const blocked = currentTestResults.filter(r => r.blocked);
    const errors = currentTestResults.filter(r => !r.success);
    
    res.send(`
        <h1>Last Test Results</h1>
        <p><strong>Total queries:</strong> ${currentTestResults.length}</p>
        <p><strong>Successful:</strong> ${successful.length}</p>
        <p><strong>Blocked:</strong> ${blocked.length}</p>
        <p><strong>Errors:</strong> ${errors.length}</p>
        
        <h2>Details:</h2>
        ${currentTestResults.map(r => `
            <div style="background: ${r.blocked ? '#f8d7da' : r.success ? '#d4edda' : '#fff3cd'}; padding: 10px; margin: 5px 0; border-radius: 5px;">
                <strong>#${r.requestNumber}</strong> ${r.query} - 
                ${r.blocked ? 'BLOCKED' : r.success ? `OK (${r.resultsFound} results, ${r.responseTime}ms)` : `ERROR: ${r.error}`}
            </div>
        `).join('')}
        
        <br><a href="/">Home</a> | <a href="/logs">Logs</a>
    `);
});

app.listen(PORT, () => {
    console.log(`Bulk tester running on port ${PORT}`);
    console.log(`Ready to test ${UKRAINE_QUERIES.length} Ukraine MFO queries`);
});

process.on('SIGTERM', () => {
    bulkTestRunning = false;
    console.log('Server shutting down...');
    process.exit(0);
});
