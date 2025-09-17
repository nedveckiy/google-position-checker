const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Функція для отримання IP
async function getCurrentIP() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', {
            timeout: 5000
        });
        return response.data.ip;
    } catch (error) {
        console.error('IP Error:', error.message);
        return 'Unknown';
    }
}

// Простий Google тест
async function testGoogle(query, domain = null) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20&hl=uk&gl=ua`;
    
    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        const html = response.data.toLowerCase();
        const blocked = html.includes('unusual traffic') || html.includes('captcha');
        
        let found = false;
        if (domain && !blocked) {
            found = html.includes(domain.replace('www.', '').toLowerCase());
        }

        return {
            success: true,
            blocked: blocked,
            found: found,
            html_size: response.data.length
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// =============== ROUTES ===============

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Google Position Checker</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .btn { display: inline-block; padding: 15px 25px; margin: 10px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                .btn:hover { background: #0056b3; }
                .form { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                input { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; }
                button { width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 16px; }
            </style>
        </head>
        <body>
            <h1>🎯 Google Position Checker</h1>
            
            <p><strong>Status:</strong> Running ✅</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            
            <div>
                <a href="/ip" class="btn">🌐 Check IP</a>
                <a href="/test?query=ukraine&domain=bbc.com" class="btn">🧪 Test Google</a>
            </div>

            <div class="form">
                <h3>🔍 Test Google Search</h3>
                <form action="/test" method="get">
                    <input type="text" name="query" placeholder="Enter keyword (e.g., ukraine news)" required>
                    <input type="text" name="domain" placeholder="Your domain (optional, e.g., bbc.com)">
                    <button type="submit">🚀 TEST SEARCH</button>
                </form>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <strong>⚠️ Warning:</strong> This tool may violate Google's ToS. Use at your own risk.
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

app.get('/test', async (req, res) => {
    const { query, domain } = req.query;
    
    if (!query) {
        return res.json({ error: 'Missing query parameter' });
    }

    try {
        const currentIP = await getCurrentIP();
        const result = await testGoogle(query, domain);
        
        const response = {
            ip: currentIP,
            query: query,
            domain: domain || 'not specified',
            timestamp: new Date().toISOString(),
            ...result
        };
        
        // HTML response
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Test Results</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
                    .result { background: ${result.success ? '#d4edda' : '#f8d7da'}; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 5px; }
                </style>
            </head>
            <body>
                <h1>🎯 Test Results</h1>
                
                <div class="result">
                    <h3>${result.success ? '✅ Success' : '❌ Error'}</h3>
                    <p><strong>Query:</strong> "${query}"</p>
                    <p><strong>Domain:</strong> ${domain || 'not specified'}</p>
                    <p><strong>IP:</strong> ${currentIP}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    
                    ${result.success ? `
                        <p><strong>Blocked:</strong> ${result.blocked ? '🚫 YES' : '✅ NO'}</p>
                        <p><strong>Domain Found:</strong> ${result.found ? '✅ YES' : '❌ NO'}</p>
                        <p><strong>HTML Size:</strong> ${result.html_size} chars</p>
                    ` : `
                        <p><strong>Error:</strong> ${result.error}</p>
                    `}
                </div>
                
                <a href="/" class="btn">🏠 Home</a>
                <a href="/ip" class="btn">🌐 Check IP</a>
                <a href="/test?query=${encodeURIComponent(query)}&domain=${domain || ''}" class="btn">🔄 Test Again</a>
            </body>
            </html>
        `);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Server shutting down...');
    process.exit(0);
});
