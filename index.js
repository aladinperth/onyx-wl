const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const API_SECRET = process.env.API_SECRET || "onyx_default_secret";
const LINKVERTISE_USER_ID = "1237995"; // Your LinkVertise ID

// Storage for keys with HWID binding
const validKeys = new Map();
const keyDatabase = new Map(); // Persistent key storage

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
    for (let i = 0; i < 12; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

function generateHWID() {
    // Generate a fake HWID for demonstration
    return crypto.randomBytes(16).toString('hex').toUpperCase();
}

function isValidKey(key) {
    return key.length >= 8 && key.startsWith('ONYX');
}

// Main page with LinkVertise integration
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🔑 Onyx Key System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .container { 
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            h1 { 
                font-size: 2.5em; 
                margin-bottom: 10px;
                background: linear-gradient(45deg, #fff, #f0f0f0);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .subtitle { 
                font-size: 1.1em; 
                margin-bottom: 30px; 
                opacity: 0.9;
            }
            .step {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #4facfe;
            }
            .step h3 { margin-bottom: 10px; color: #4facfe; }
            .button {
                background: linear-gradient(45deg, #4facfe, #00f2fe);
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 25px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin: 10px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
            }
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(79, 172, 254, 0.6);
            }
            .hwid-info {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                font-family: monospace;
                font-size: 14px;
            }
            .warning {
                background: rgba(255, 193, 7, 0.2);
                border: 1px solid rgba(255, 193, 7, 0.5);
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔑 Onyx Key System</h1>
            <p class="subtitle">Secure HWID-Locked Whitelist Access</p>
            
            <div class="step">
                <h3>Step 1: Get Your HWID</h3>
                <p>Your Hardware ID (required for key binding):</p>
                <div class="hwid-info" id="hwid-display">Loading HWID...</div>
                <button class="button" onclick="generateNewHWID()">🔄 Generate New HWID</button>
            </div>
            
            <div class="step">
                <h3>Step 2: Complete LinkVertise</h3>
                <p>Complete the LinkVertise link to get your key:</p>
                <a href="#" class="button" id="linkvertise-link" target="_blank">
                    🔗 Complete LinkVertise
                </a>
            </div>
            
            <div class="step">
                <h3>Step 3: Get Your Key</h3>
                <button class="button" onclick="requestKey()">🔑 Generate Onyx Key</button>
                <div id="key-result" style="margin-top: 15px;"></div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> Keys are HWID-locked and expire after 32 seconds of use. 
                Each key can only be used on one device.
            </div>
            
            <div style="margin-top: 30px; opacity: 0.7; font-size: 14px;">
                <p>🛡️ Secure • 🔒 HWID Protected • ⏱️ Time Limited</p>
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
            }
            
            function updateHWIDDisplay() {
                document.getElementById('hwid-display').textContent = currentHWID;
            }
            
            function updateLinkVertiseLink() {
                const baseUrl = 'https://linkvertise.com/1237995/onyx-key-system';
                const linkElement = document.getElementById('linkvertise-link');
                linkElement.href = baseUrl + '?hwid=' + encodeURIComponent(currentHWID);
            }
            
            async function requestKey() {
                const resultDiv = document.getElementById('key-result');
                resultDiv.innerHTML = '<div style="color: #4facfe;">🔄 Generating key...</div>';
                
                try {
                    const response = await fetch('/generate-key', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            hwid: currentHWID,
                            timestamp: Date.now()
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultDiv.innerHTML = \`
                            <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); border-radius: 10px; padding: 15px; margin-top: 15px;">
                                <h4 style="color: #10b981; margin-bottom: 10px;">✅ Key Generated Successfully!</h4>
                                <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">
                                    <strong>\${data.key}</strong>
                                </div>
                                <p style="margin-top: 10px; font-size: 14px;">
                                    🔒 HWID: \${currentHWID.substring(0, 8)}...<br>
                                    ⏱️ Valid for 32 seconds after first use
                                </p>
                                <button class="button" onclick="copyToClipboard('\${data.key}')" style="margin-top: 10px; font-size: 14px; padding: 10px 20px;">
                                    📋 Copy Key
                                </button>
                            </div>
                        \`;
                    } else {
                        resultDiv.innerHTML = \`
                            <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 10px; padding: 15px; margin-top: 15px;">
                                <h4 style="color: #ef4444;">❌ Error</h4>
                                <p>\${data.message}</p>
                            </div>
                        \`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`
                        <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 10px; padding: 15px; margin-top: 15px;">
                            <h4 style="color: #ef4444;">❌ Network Error</h4>
                            <p>Failed to generate key. Please try again.</p>
                        </div>
                    \`;
                }
            }
            
            function copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(() => {
                    alert('Key copied to clipboard!');
                }).catch(() => {
                    prompt('Copy this key:', text);
                });
            }
            
            // Initialize
            updateHWIDDisplay();
            updateLinkVertiseLink();
        </script>
    </body>
    </html>
    `);
});

// Generate key endpoint with HWID binding
app.post('/generate-key', (req, res) => {
    try {
        const { hwid, timestamp } = req.body;
        
        if (!hwid) {
            return res.json({
                success: false,
                message: 'HWID is required'
            });
        }
        
        // Generate new key
        const key = generateKey();
        
        // Store key with HWID binding
        keyDatabase.set(key, {
            hwid: hwid,
            created_at: Date.now(),
            used: false,
            player_id: null,
            expires_at: null
        });
        
        console.log(`Generated key ${key} for HWID: ${hwid}`);
        
        res.json({
            success: true,
            key: key,
            hwid: hwid,
            message: 'Key generated successfully'
        });
        
    } catch (error) {
        console.error('Key generation error:', error);
        res.json({
            success: false,
            message: 'Failed to generate key'
        });
    }
});

// Validate key with HWID check
app.post('/validate', (req, res) => {
    try {
        const { key, player_id, hwid } = req.body;
        const timestamp = req.headers['x-timestamp'];
        const signature = req.headers['x-signature'];
        
        // Validate signature
        if (!validateSignature(key, timestamp, signature)) {
            return res.status(401).json({ 
                valid: false, 
                error: 'Invalid signature' 
            });
        }
        
        // Check timestamp
        const now = Date.now() / 1000;
        if (Math.abs(now - parseFloat(timestamp)) > 30) {
            return res.status(401).json({ 
                valid: false, 
                error: 'Request expired' 
            });
        }
        
        // Check if key exists in database
        if (!keyDatabase.has(key)) {
            return res.json({ 
                valid: false, 
                error: 'Invalid key' 
            });
        }
        
        const keyData = keyDatabase.get(key);
        
        // Check HWID binding
        if (keyData.hwid !== hwid) {
            return res.json({ 
                valid: false, 
                error: 'HWID mismatch - key is locked to another device' 
            });
        }
        
        // Check if key is currently active and not expired
        if (validKeys.has(key)) {
            const activeKeyData = validKeys.get(key);
            if (now < activeKeyData.expires_at) {
                return res.json({ 
                    valid: true, 
                    message: 'Key still valid',
                    expires_in: Math.round(activeKeyData.expires_at - now),
                    hwid_locked: true
                });
            } else {
                validKeys.delete(key);
            }
        }
        
        // Activate key for first time use
        if (!keyData.used) {
            keyData.used = true;
            keyData.player_id = player_id;
            keyData.expires_at = now + 32; // 32 seconds from now
            
            validKeys.set(key, {
                player_id,
                hwid,
                created_at: now,
                expires_at: now + 32
            });
            
            console.log(`Activated key ${key} for player ${player_id} on HWID ${hwid}`);
            
            return res.json({ 
                valid: true, 
                expires_in: 32,
                message: 'Onyx access granted',
                hwid_locked: true
            });
        } else {
            // Key was already used
            return res.json({ 
                valid: false, 
                error: 'Key has already been used' 
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

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        service: 'Onyx HWID-Locked Whitelist',
        active_keys: validKeys.size,
        total_generated: keyDatabase.size,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Admin endpoint to view keys (remove in production)
app.get('/admin/keys', (req, res) => {
    const keys = Array.from(keyDatabase.entries()).map(([key, data]) => ({
        key: key,
        hwid: data.hwid.substring(0, 8) + '...',
        used: data.used,
        created: new Date(data.created_at).toISOString()
    }));
    
    res.json({
        total_keys: keys.length,
        keys: keys
    });
});

// Cleanup expired keys
setInterval(() => {
    const now = Date.now() / 1000;
    const expiredKeys = [];
    
    for (const [key, data] of validKeys.entries()) {
        if (now > data.expires_at) {
            expiredKeys.push(key);
        }
    }
    
    expiredKeys.forEach(key => validKeys.delete(key));
    
    if (expiredKeys.length > 0) {
        console.log(`Cleaned up ${expiredKeys.length} expired keys`);
    }
}, 5000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔑 Onyx HWID-Locked Key System running on port ${PORT}`);
    console.log(`🔗 LinkVertise User ID: ${LINKVERTISE_USER_ID}`);
    console.log(`🛡️ Features: HWID Locking, Time Expiry, Signature Validation`);
});
