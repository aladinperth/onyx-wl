const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const API_SECRET = process.env.API_SECRET || "onyx_default_secret";
const validKeys = new Map();

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

function isValidKey(key) {
    return key.length >= 8 && (key.startsWith('ONYX') || key.startsWith('WL'));
}

app.get('/', (req, res) => {
    res.json({ 
        status: 'Onyx Whitelist API',
        version: '1.0.0',
        endpoints: ['/validate', '/generate', '/status']
    });
});

app.post('/validate', (req, res) => {
    try {
        const { key, player_id } = req.body;
        const timestamp = req.headers['x-timestamp'];
        const signature = req.headers['x-signature'];
        
        if (!validateSignature(key, timestamp, signature)) {
            return res.status(401).json({ 
                valid: false, 
                error: 'Invalid signature' 
            });
        }
        
        const now = Date.now() / 1000;
        if (Math.abs(now - parseFloat(timestamp)) > 30) {
            return res.status(401).json({ 
                valid: false, 
                error: 'Request expired' 
            });
        }
        
        if (validKeys.has(key)) {
            const keyData = validKeys.get(key);
            if (now < keyData.expires_at) {
                return res.json({ 
                    valid: true, 
                    message: 'Key still valid',
                    expires_in: Math.round(keyData.expires_at - now)
                });
            } else {
                validKeys.delete(key);
            }
        }
        
        if (isValidKey(key)) {
            validKeys.set(key, {
                player_id,
                created_at: now,
                expires_at: now + 32
            });
            
            return res.json({ 
                valid: true, 
                expires_in: 32,
                message: 'Onyx access granted'
            });
        } else {
            return res.json({ 
                valid: false, 
                error: 'Invalid key format' 
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

app.post('/generate', (req, res) => {
    try {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = 'ONYX';
        for (let i = 0; i < 10; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        res.json({ 
            key,
            message: 'Test key generated'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Generation failed' 
        });
    }
});

app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        service: 'Onyx Whitelist',
        active_keys: validKeys.size,
        timestamp: new Date().toISOString()
    });
});

setInterval(() => {
    const now = Date.now() / 1000;
    const expiredKeys = [];
    
    for (const [key, data] of validKeys.entries()) {
        if (now > data.expires_at) {
            expiredKeys.push(key);
        }
    }
    
    expiredKeys.forEach(key => validKeys.delete(key));
}, 10000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔑 Onyx Whitelist API running on port ${PORT}`);
});
