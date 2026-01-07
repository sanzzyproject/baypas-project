const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simpan token di memori sementara (Global variable untuk serverless caching)
let cachedToken = null;

class Viu {
    constructor() {
        this.inst = axios.create({
            baseURL: 'https://api-gateway-global.viu.com/api',
            timeout: 9000, // Timeout 9 detik agar tidak hang di Vercel
            headers: {
                'accept-encoding': 'gzip',
                'content-type': 'application/x-www-form-urlencoded',
                platform: 'android',
                'user-agent': 'okhttp/4.12.0'
            }
        });
    }

    getToken = async function () {
        // Gunakan cached token jika ada
        if (cachedToken) {
            this.inst.defaults.headers.common['Authorization'] = `Bearer ${cachedToken}`;
            return cachedToken;
        }

        try {
            const { data } = await this.inst.post('/auth/token', {
                countryCode: 'ID',
                platform: 'android',
                platformFlagLabel: 'phone',
                language: '8',
                deviceId: uuidv4(),
                dataTrackingDeviceId: uuidv4(),
                osVersion: '28',
                appVersion: '2.21.0',
                carrierName: 'Telkomsel',
                deviceBrand: 'vivo',
                deviceModel: 'V2242A'
            });
            
            cachedToken = data.token; // Simpan ke cache
            this.inst.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            return data.token;
        } catch (error) {
            console.error("Token Error:", error.message);
            throw new Error('Gagal mendapatkan akses token Viu.');
        }
    }

    home = async function () {
        try {
            await this.getToken();
            const { data } = await this.inst.get('/mobile', {
                params: {
                    r: '/home/index',
                    platform_flag_label: 'phone',
                    area_id: '1000',
                    language_flag_id: '8',
                    countryCode: 'ID',
                    ut: '0'
                }
            });
            return data.data; // Pastikan return data.data
        } catch (error) {
            console.error("Home Error:", error.message);
            throw new Error('Gagal mengambil data Home.');
        }
    }

    search = async function (query) {
        try {
            await this.getToken();
            const { data } = await this.inst.get('/mobile', {
                params: {
                    r: '/search/video',
                    limit: '18',
                    page: '1',
                    'keyword[]': query,
                    platform_flag_label: 'phone',
                    area_id: '1000',
                    countryCode: 'ID'
                }
            });
            return data.data;
        } catch (error) {
            throw new Error('Gagal mencari video.');
        }
    }

    detail = async function (productId) {
        try {
            await this.getToken();
            const { data } = await this.inst.get('/mobile', {
                params: { r: '/vod/detail', product_id: productId, platform_flag_label: 'phone', area_id: '1000', countryCode: 'ID' }
            });
            
            let productList = [];
            if(data.data && data.data.series && data.data.series.series_id) {
                 try {
                     const { data: ep } = await this.inst.get('/mobile', {
                        params: { r: '/vod/product-list', product_id: productId, series_id: data.data.series.series_id, platform_flag_label: 'phone', area_id: '1000', countryCode: 'ID' }
                    });
                    productList = ep.data.product_list;
                 } catch (e) { console.log("Ep error", e.message); }
            }
            return { metadata: data.data, product_list: productList };
        } catch (error) { throw new Error('Gagal mengambil detail.'); }
    }

    stream = async function (ccsProductId) {
        try {
            await this.getToken();
            const { data } = await this.inst.get('/playback/distribute', {
                params: { ccs_product_id: ccsProductId, platform_flag_label: 'phone', area_id: '1000', countryCode: 'ID' }
            });
            return data.data;
        } catch (error) { throw new Error('Gagal mengambil link stream.'); }
    }
}

const viu = new Viu();

// --- API ROUTES ---
app.get('/api/home', async (req, res) => {
    try {
        const data = await viu.home();
        res.json(data);
    } catch (e) {
        // Return JSON error agar frontend bisa baca
        res.status(500).json({ error: true, message: e.message });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const data = await viu.search(q);
        res.json(data);
    } catch (e) { res.status(500).json({ error: true, message: e.message }); }
});

app.get('/api/detail', async (req, res) => {
    try {
        const { id } = req.query;
        const data = await viu.detail(id);
        res.json(data);
    } catch (e) { res.status(500).json({ error: true, message: e.message }); }
});

app.get('/api/stream', async (req, res) => {
    try {
        const { id } = req.query;
        const data = await viu.stream(id);
        res.json(data);
    } catch (e) { res.status(500).json({ error: true, message: e.message }); }
});

module.exports = app;
