// api/bypass.js
const axios = require('axios');

module.exports = async (req, res) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Validasi URL Input
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
    }

    try {
        // --- STEP 1: Get Token ---
        const cfResponse = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: `https://bypass.city/bypass?bypass=${encodeURIComponent(url)}`,
            siteKey: '0x4AAAAAAAGzw6rXeQWJ_y2P'
        });

        if (!cfResponse.data || !cfResponse.data.result) {
            throw new Error('Gagal mendapatkan Token Turnstile.');
        }

        const turnstileToken = cfResponse.data.result;

        // --- STEP 2: Bypass Request ---
        const bypassResponse = await axios.post('https://api2.bypass.city/bypass', {
            url: url
        }, {
            headers: {
                'accept': '*/*',
                'content-type': 'application/json',
                'origin': 'https://bypass.city',
                'referer': 'https://bypass.city/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
                'token': turnstileToken,
                'x-captcha-provider': 'TURNSTILE'
            }
        });

        // --- STEP 3: Return Result ---
        const resultData = bypassResponse.data;

        // Cek apakah ada hasil yang valid
        if (resultData.destination || resultData.success === true) {
            return res.status(200).json({
                success: true,
                destination: resultData.destination || resultData.url || "Link berhasil di-bypass (Cek original response)",
                original_response: resultData
            });
        } else {
            // Jika API bypass.city merespon 200 OK tapi isinya error/gagal
            return res.status(400).json({
                success: false,
                message: resultData.message || 'Gagal bypass link ini.',
                debug: resultData
            });
        }

    } catch (error) {
        // Log error di dashboard Vercel (Function logs)
        console.error("SERVER ERROR LOG:", error.message);
        if (error.response) {
            console.error("External API Data:", error.response.data);
            console.error("External API Status:", error.response.status);
        }

        // Return JSON Error ke Frontend (Bukan HTML crash)
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error',
            details: error.response?.data || 'No details'
        });
    }
};
