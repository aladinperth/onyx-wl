const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const API_SECRET = process.env.API_SECRET || "onyx_default_secret";
const LINKVERTISE_USER_ID = "1237995";

const validKeys = new Map();
const keyDatabase = new Map();

function generateSignature(data, timestamp) {
    let hash = 0;
    const toHash = data + timestamp + API_SECRET;
    for (let i = 0; i < toHash.length; i++) {
        hash += toHash.charCodeAt(i) * (i + 1);
    }
    return hash.toString();
}

function validateSignature(data, timestamp, signature) {
    const expectedSig = generateSignature(data, timestamp);
    return expectedSig === signature;
}

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'ONYX';
    for (let i = 0; i < 16; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

function isValidKey(key) {
    return key.length >= 8 && key.startsWith('ONYX');
}

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Onyx Key System</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                overflow-x: hidden;
            }
            
            .container {
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 48px;
                max-width: 520px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }
            
            .container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            }
            
            .header {
                margin-bottom: 40px;
            }
            
            .title {
                font-size: 2.8rem;
                font-weight: 700;
                margin-bottom: 8px;
                background: linear-gradient(135deg, #fff 0%, #e0e7ff 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                letter-spacing: -0.02em;
            }
            
            .subtitle {
                font-size: 1.1rem;
                font-weight: 400;
                opacity: 0.8;
                color: #e0e7ff;
            }
            
            .card {
                background: rgba(255, 255, 255, 0.06);
                border-radius: 16px;
                padding: 24px;
                margin: 20px 0;
                border: 1px solid rgba(255, 255, 255, 0.08);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }
            
            .card:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-2px);
            }
            
            .card-title {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 12px;
                color: #a5b4fc;
            }
            
            .hwid-display {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 12px;
                padding: 16px;
                margin: 16px 0;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                font-size: 14px;
                word-break: break-all;
                border: 1px solid rgba(255, 255, 255, 0.1);
                letter-spacing: 0.5px;
            }
            
            .button {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                padding: 14px 28px;
                border: none;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin: 8px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                font-family: inherit;
            }
            
            .button:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
                background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            }
            
            .button:active {
                transform: translateY(-1px);
            }
            
            .button-secondary {
                background: rgba(255, 255, 255, 0.1);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .button-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
            }
            
            .result {
                margin-top: 20px;
                padding: 20px;
                border-radius: 12px;
                animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .result.success {
                background: rgba(16, 185, 129, 0.15);
                border: 1px solid rgba(16, 185, 129, 0.3);
                color: #6ee7b7;
            }
            
            .result.error {
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #fca5a5;
            }
            
            .key-display {
                background: rgba(0, 0, 0, 0.3);
                padding: 16px;
                border-radius: 8px;
                font-family: 'SF Mono', Monaco, monospace;
                font-size: 16px;
                font-weight: 600;
                margin: 16px 0;
                word-break: break-all;
                letter-spacing: 1px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin: 16px 0;
                font-size: 14px;
            }
            
            .info-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 12px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            
            .warning {
                background: rgba(245, 158, 11, 0.15);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 24px 0;
                color: #fbbf24;
            }
            
            .footer {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                opacity: 0.7;
                font-size: 14px;
                color: #c7d2fe;
            }
            
            .loading {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @media (max-width: 640px) {
                .container {
                    padding: 32px 24px;
                    margin: 20px;
                }
                
                .title {
                    font-size: 2.2rem;
                }
                
                .info-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">🔑 Onyx</h1>
                <p class="subtitle">HWID-Locked Key System</p>
            </div>
            
            <div class="card">
                <h3 class="card-title">Hardware ID</h3>
                <div class="hwid-display" id="hwid-display">Generating HWID...</div>
                <button class="button button-secondary" onclick="generateNewHWID()">
                    🔄 Regenerate
                </button>
            </div>
            
            <div class="card">
                <h3 class="card-title">Get Access Key</h3>
                <p style="margin-bottom: 16px; opacity: 0.8;">Complete verification to generate your key</p>
                <a href="#" class="button" id="linkvertise-link" target="_blank">
                    🔗 Complete Verification
                </a>
                <button class="button" onclick="requestKey()">
                    ✨ Generate Key
                </button>
                <div id="key-result"></div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Key Information</strong><br>
                Keys are HWID-locked and valid for 40 hours after activation. Each key works on one device only.
            </div>
            
            <div class="footer">
                🛡️ Secure • 🔒 Hardware Protected • ⏱️ 40 Hour Duration
            </div>
        </div>

        <script>
            let currentHWID = localStorage.getItem('onyx_hwid') || generateHWID();
            
            function generateHWID() {
                const chars = '0123456789ABCDEF';
                let hwid = '';
                for (let i = 0; i < 32; i++) {
                    hwid += chars.charAt(Math.floor(Math.random() * chars.length));
                    if (i % 4 === 3 && i < 31) hwid += '-';
                }
                localStorage.setItem('onyx_hwid', hwid);
                return hwid;
            }
            
            function generateNewHWID() {
                currentHWID = generateHWID();
                updateHWIDDisplay();
                updateLinkVertiseLink();
            }
            
            function updateHWIDDisplay() {
                document.getElementById('hwid-display').textContent = currentHWID;
            }
            
            function updateLinkVertiseLink() {
                const baseUrl = 'https://linkvertise.com/1237995/onyx-verification';
                document.getElementById('linkvertise-link').href = baseUrl;
            }
            
            async function requestKey() {
                const resultDiv = document.getElementById('key-result');
                resultDiv.innerHTML = '<div class="result"><div class="loading"></div> Generating secure key...</div>';
                
                try {
                    const response = await fetch('/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            hwid: currentHWID,
                            timestamp: Date.now()
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultDiv.innerHTML = \`
                            <div class="result success">
                                <h4 style="margin-bottom: 12px;">✅ Key Generated</h4>
                                <div class="key-display">\${data.key}</div>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <strong>HWID</strong><br>
                                        \${currentHWID.substring(0, 12)}...
                                    </div>
                                    <div class="info-item">
                                        <strong>Duration</strong><br>
                                        40 Hours
                                    </div>
                                </div>
                                <button class="button" onclick="copyKey('\${data.key}')">
                                    📋 Copy Key
                                </button>
                            </div>
                        \`;
                    } else {
                        resultDiv.innerHTML = \`
                            <div class="result error">
                                <h4>❌ Generation Failed</h4>
                                <p>\${data.message || 'Please try again'}</p>
                            </div>
                        \`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            <h4>❌ Network Error</h4>
                            <p>Connection failed. Please check your internet and try again.</p>
                        </div>
                    \`;
                }
            }
            
            function copyKey(key) {
                navigator.clipboard.writeText(key).then(() => {
                    const button = event.target;
                    const original = button.textContent;
                    button.textContent = '✅ Copied!';
                    button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    setTimeout(() => {
                        button.textContent = original;
                        button.style.background = '';
                    }, 2000);
                }).catch(() => {
                    prompt('Copy this key:', key);
                });
            }
            
            updateHWIDDisplay();
            updateLinkVertiseLink();
        </script>
    </body>
    </html>
    `);
});

app.post('/generate', (req, res) => {
    try {
        const { hwid } = req.body;
        
        if (!hwid || hwid.length < 10) {
            return res.json({
                success: false,
                message: 'Invalid HWID format'
            });
        }
        
        const key = generateKey();
        const now = Date.now();
        
        keyDatabase.set(key, {
            hwid: hwid,
            created_at: now,
            used: false,
            player_id: null,
            expires_at: null,
            duration: 40 * 60 * 60 * 1000
        });
        
        console.log(`Generated key ${key} for HWID: ${hwid.substring(0, 8)}...`);
        
        res.json({
            success: true,
            key: key,
            hwid: hwid.substring(0, 8) + '...',
            duration: '40 hours'
        });
        
    } catch (error) {
        console.error('Key generation error:', error);
        res.json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

app.post('/validate', (req, res) => {
    try {
        const { key, player_id, hwid } = req.body;
        const timestamp = req.headers['x-timestamp'];
        const signature = req.headers['x-signature'];
        
        if (!validateSignature(key, timestamp, signature)) {
            return res.status(401).json({ 
                valid: false, 
                error: 'Invalid signature' 
            });
        }
        
        const now = Date.now();
        if (Math.abs(now / 1000 - parseFloat(timestamp)) > 30) {
            return res.status(401).json({ 
                valid: false, 
                error: 'Request expired' 
            });
        }
        
        if (!keyDatabase.has(key)) {
            return res.json({ 
                valid: false, 
                error: 'Invalid key' 
            });
        }
        
        const keyData = keyDatabase.get(key);
        
        if (keyData.hwid !== hwid) {
            return res.json({ 
                valid: false, 
                error: 'HWID mismatch - key locked to different device' 
            });
        }
        
        if (validKeys.has(key)) {
            const activeKeyData = validKeys.get(key);
            if (now < activeKeyData.expires_at) {
                const remaining = Math.floor((activeKeyData.expires_at - now) / 1000 / 3600);
                return res.json({ 
                    valid: true, 
                    message: 'Access granted',
                    hours_remaining: remaining,
                    hwid_locked: true
                });
            } else {
                validKeys.delete(key);
            }
        }
        
        if (!keyData.used) {
            keyData.used = true;
            keyData.player_id = player_id;
            keyData.expires_at = now + keyData.duration;
            
            validKeys.set(key, {
                player_id,
                hwid,
                created_at: now,
                expires_at: keyData.expires_at
            });
            
            console.log(`Activated key ${key} for player ${player_id}`);
            
            return res.json({ 
                valid: true, 
                message: 'Access granted - key activated',
                hours_remaining: 40,
                hwid_locked: true
            });
        } else if (keyData.player_id === player_id) {
            const remaining = Math.floor((keyData.expires_at - now) / 1000 / 3600);
            if (remaining > 0) {
                validKeys.set(key, {
                    player_id,
                    hwid,
                    created_at: keyData.created_at,
                    expires_at: keyData.expires_at
                });
                
                return res.json({ 
                    valid: true, 
                    message: 'Welcome back',
                    hours_remaining: remaining,
                    hwid_locked: true
                });
            } else {
                return res.json({ 
                    valid: false, 
                    error: 'Key has expired' 
                });
            }
        } else {
            return res.json({ 
                valid: false, 
                error: 'Key already used by different player' 
            });
        }
        
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({ 
            valid: false, 
            error: 'Server error' 
        });
    }
});

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        service: 'Onyx HWID System',
        active_keys: validKeys.size,
        total_generated: keyDatabase.size,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

setInterval(() => {
    const now = Date.now();
    let expired = 0;
    
    for (const [key, data] of validKeys.entries()) {
        if (now > data.expires_at) {
            validKeys.delete(key);
            expired++;
        }
    }
    
    if (expired > 0) {
        console.log(`Cleaned ${expired} expired keys`);
    }
}, 60000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔑 Onyx System running on port ${PORT}`);
    console.log(`🔗 LinkVertise ID: ${LINKVERTISE_USER_ID}`);
});
