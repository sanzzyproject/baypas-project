const supportedSites = [
    "Linkvertise", "Sub2Get", "Lootlinks", "AdFoc.us", "Boost.ink", 
    "BoostFusedGT", "leasurepartment.xyz", "LetsBoost", "mboost.me", 
    "Rekonise", "shorte.st", "Sub2Unlock.com", "Sub2Unlock.net", "v.gd", 
    "dragonslayer", "tinyurl.com", "bit.ly", "is.gd", "rebrand.ly", 
    "empebau.eu", "socialwolvez.com", "sub1s.com", "tinylink.onl", 
    "google-url", "Justpaste.it Redirect", "SubFinal", "Location Redirect", 
    "Ad-Maven", "BaseResolver", "ParamsResolver"
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Render Supported Sites List
    const listContainer = document.getElementById('supportedList');
    supportedSites.forEach(site => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = site;
        listContainer.appendChild(span);
    });

    // 2. Handle Bypass
    const urlInput = document.getElementById('urlInput');
    const bypassBtn = document.getElementById('bypassBtn');
    const resultArea = document.getElementById('resultArea');
    const loadingArea = document.getElementById('loadingArea');
    const errorArea = document.getElementById('errorArea');
    const finalLink = document.getElementById('finalLink');
    const errorMsg = document.getElementById('errorMsg');
    const copyBtn = document.getElementById('copyBtn');

    bypassBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            alert('Mohon masukkan URL terlebih dahulu.');
            return;
        }

        // Reset UI
        resultArea.classList.add('hidden');
        errorArea.classList.add('hidden');
        loadingArea.classList.remove('hidden');
        bypassBtn.disabled = true;

        try {
            // Panggil API Vercel (Path relatif)
            const response = await fetch('/api/bypass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (data.success && data.destination) {
                // Sukses
                finalLink.href = data.destination;
                finalLink.textContent = data.destination;
                resultArea.classList.remove('hidden');
            } else {
                // Gagal dari logic bypass
                throw new Error(data.message || 'Gagal memproses link.');
            }
        } catch (err) {
            // Error network atau lainnya
            errorMsg.textContent = err.message || 'Terjadi kesalahan server.';
            errorArea.classList.remove('hidden');
        } finally {
            loadingArea.classList.add('hidden');
            bypassBtn.disabled = false;
        }
    });

    // Copy Button Logic
    copyBtn.addEventListener('click', () => {
        const text = finalLink.href;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        });
    });
});
