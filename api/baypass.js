// api/bypass.js
const axios = require('axios');

async function bypassLogic(url) {
    // Validasi URL sederhana
    if (!url || !url.startsWith('http')) {
        throw new Error('URL tidak valid. Pastikan menyertakan http:// atau https://');
    }

    try {
        // Step 1: Get Turnstile Token
        // Kita gunakan try-catch terpisah agar tau errornya di step mana
        let cfToken;
        try {
            const cfResponse = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
                url: `https://bypass.city/bypass?bypass=${encodeURIComponent(url)}`,
                siteKey: '0x4AAAAAAAGzw6rXeQWJ_y2P'
            });
            
            if (!cfResponse.data || !cfResponse.data.result) {
                throw new Error('Gagal mendapatkan token Turnstile (CF Token null).');
            }
            cfToken = cfResponse.data.result;
        } catch (err) {
            console.error("Error Step 1 (Token):", err.response?.data || err.message);
            throw new Error('Gagal menghubungi server token. Coba lagi nanti.');
        }

        // Step 2: Bypass Request
        try {
            const bypassResponse = await axios.post('https://api2.bypass.city/bypass', {
                url: url
            }, {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'origin': 'https://bypass.city',
                    'referer': 'https://bypass.city/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
                    'token': cfToken,
                    'x-captcha-provider': 'TURNSTILE'
                }
            });

            return bypassResponse.data;
        } catch (err) {
            console.error("Error Step 2 (Bypass):", err.response?.data || err.message);
            throw new Error(err.response?.data?.message || 'Gagal memproses bypass pada server tujuan.');
        }

    } catch (error) {
        throw error; // Lempar ke handler utama
    }
}

// Handler utama Vercel
module.exports = async (req, res) => {
    // Handle CORS (Pre-flight request)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Pastikan request method adalah POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, message: 'URL parameter is missing' });
    }

    try {
        const result = await bypassLogic(url);
        
        // Cek apakah hasil bypass valid
        if (result && (result.destination || result.success === true)) {
            return res.status(200).json({
                success: true,
                destination: result.destination || result.url || result.result, // Handle variasi respon
                original_response: result
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: result.message || 'Bypass gagal, tidak ada link tujuan ditemukan.' 
            });
        }

    } catch (error) {
        console.error("Server Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
