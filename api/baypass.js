// api/bypass.js
const axios = require('axios');

// Fungsi utama bypass (logic dari request kamu)
async function bypassLogic(url) {
    try {
        if (!url) throw new Error('Url is required.');
        
        // Step 1: Get Turnstile Token
        const { data: cf } = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: `https://bypass.city/bypass?bypass=${encodeURIComponent(url)}`,
            siteKey: '0x4AAAAAAAGzw6rXeQWJ_y2P'
        });
        
        if (!cf?.result) throw new Error('Failed to get cf token.');
        
        // Step 2: Bypass Request
        const { data } = await axios.post('https://api2.bypass.city/bypass', {
            url: url
        }, {
            headers: {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'content-type': 'application/json',
                'origin': 'https://bypass.city',
                'referer': 'https://bypass.city/',
                'sec-ch-ua': '"Chromium";v="137", "Not(A)Brand";v="24"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'token': cf.result,
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
                'x-captcha-provider': 'TURNSTILE'
            }
        });
        
        return data;
    } catch (error) {
        console.error("Bypass Error:", error.message);
        throw new Error(error.message || 'Internal Server Error');
    }
}

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.body || req.query;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL parameter is missing' });
    }

    try {
        const result = await bypassLogic(url);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
