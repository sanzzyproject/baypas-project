// public/script.js
// ... (Bagian supportedSites sama seperti sebelumnya) ...

    bypassBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            alert('Mohon masukkan URL.');
            return;
        }

        resultArea.classList.add('hidden');
        errorArea.classList.add('hidden');
        loadingArea.classList.remove('hidden');
        bypassBtn.disabled = true;

        try {
            // Panggil API
            const response = await fetch('/api/bypass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const rawText = await response.text(); // Baca sebagai text mentah dulu

            let data;
            try {
                data = JSON.parse(rawText); // Coba ubah ke JSON
            } catch (e) {
                // Jika gagal JSON parse, berarti Vercel mengirim HTML Error Page
                console.error("Vercel HTML Error:", rawText);
                throw new Error(`Server Error (${response.status}): Endpoint tidak ditemukan atau crash.`);
            }

            if (response.ok && data.success) {
                finalLink.href = data.destination;
                finalLink.textContent = data.destination;
                resultArea.classList.remove('hidden');
            } else {
                throw new Error(data.message || 'Gagal memproses link.');
            }

        } catch (err) {
            console.error(err);
            errorMsg.textContent = err.message;
            errorArea.classList.remove('hidden');
        } finally {
            loadingArea.classList.add('hidden');
            bypassBtn.disabled = false;
        }
    });
// ... (Sisa kode sama)
