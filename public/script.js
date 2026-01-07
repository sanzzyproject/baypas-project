const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');

document.addEventListener('DOMContentLoaded', () => {
    loadHome();

    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (e.target.value.length > 2) loadSearch(e.target.value);
            else if (e.target.value.length === 0) loadHome();
        }, 800);
    });
});

function showLoading() {
    mainContent.innerHTML = '<div class="loading-spinner"></div>';
}

function stopLoading() {
    // Helper untuk memastikan spinner hilang jika error
    const spinner = document.querySelector('.loading-spinner');
    if(spinner) spinner.remove();
}

async function loadHome() {
    showLoading();
    try {
        // Ambil data dari API
        const res = await fetch('/api/home');
        
        if (!res.ok) throw new Error('Gagal terhubung ke server');
        
        const data = await res.json();
        
        if (data.error) throw new Error(data.message);

        // Cek variasi struktur data Viu (karena dinamis)
        // Kadang di 'spotlight', kadang di 'viuchannel_featured', dll
        let items = [];
        
        if (data.spotlight) items = [...items, ...data.spotlight];
        if (data.viuchannel_featured) items = [...items, ...data.viuchannel_featured];
        if (data.new_release) items = [...items, ...data.new_release];

        // Jika array kosong tapi tidak error, ambil sembarang array yg ada isinya
        if (items.length === 0) {
             Object.keys(data).forEach(key => {
                 if (Array.isArray(data[key]) && data[key].length > 0) {
                     items = [...items, ...data[key]];
                 }
             });
        }

        renderGrid(items, "Rekomendasi Untukmu");

    } catch (err) {
        console.error(err);
        mainContent.innerHTML = `
            <div style="text-align:center; padding:40px; color:#aaa;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom:10px; color: #ff5555;"></i>
                <p>Gagal memuat konten.</p>
                <small>${err.message}</small><br>
                <button onclick="loadHome()" style="margin-top:10px; padding:5px 15px; background:#333; color:white; border:none; border-radius:4px;">Coba Lagi</button>
            </div>`;
    }
}

async function loadSearch(query) {
    showLoading();
    try {
        const res = await fetch(`/api/search?q=${query}`);
        const data = await res.json();
        if(data.error) throw new Error(data.message);
        renderGrid(data, `Hasil: ${query}`);
    } catch (err) {
        mainContent.innerHTML = '<p style="text-align:center; padding:20px;">Pencarian gagal atau tidak ditemukan.</p>';
    }
}

function renderGrid(items, title) {
    if (!items || items.length === 0) {
        mainContent.innerHTML = '<p style="text-align:center; padding:20px;">Tidak ada konten ditemukan.</p>';
        return;
    }

    // Filter item yang tidak punya gambar agar rapi
    const validItems = items.filter(i => i.image_url || i.img_url);

    let html = `<h2 class="section-title">${title}</h2><div class="grid-container">`;
    
    validItems.forEach(item => {
        const img = item.image_url || item.img_url;
        const title = item.title || item.name || 'No Title';
        const id = item.product_id || item.id;
        
        if(id && img) {
            html += `
            <div class="card" onclick="loadDetail('${id}')">
                <img src="${img}" loading="lazy" alt="${title}" onerror="this.src='https://via.placeholder.com/150x225?text=Viu'">
                <div class="card-content">
                    <div class="card-title">${title}</div>
                    <div class="card-sub">${item.synopsis ? item.synopsis.substring(0, 20)+'...' : 'Viu Original'}</div>
                </div>
            </div>`;
        }
    });
    
    html += '</div>';
    mainContent.innerHTML = html;
}

async function loadDetail(id) {
    showLoading();
    try {
        const res = await fetch(`/api/detail?id=${id}`);
        const data = await res.json();
        
        if(data.error) throw new Error(data.message);

        const meta = data.metadata;
        const eps = data.product_list || [];

        let html = `
        <div class="detail-hero">
            <img src="${meta.cover_image_url || meta.image_url}" alt="cover">
            <div style="position:absolute; bottom:0; left:0; width:100%; background:linear-gradient(to top, #121212, transparent); padding:20px;">
                <h1 style="text-shadow: 2px 2px 4px black;">${meta.title}</h1>
            </div>
        </div>
        <div class="detail-info">
            <p style="color:#bbb; font-size:0.9rem; margin-bottom:15px; line-height:1.4;">${meta.synopsis || 'Sinopsis tidak tersedia.'}</p>
            <button class="btn-play" onclick="playVideo('${meta.product_id}', '${meta.ccs_product_id}')">
                <i class="fas fa-play"></i> Putar Sekarang
            </button>
        </div>
        <h3 class="section-title">Episode / Related</h3>
        <div class="episodes-list">`;

        if(eps.length > 0) {
            eps.forEach(ep => {
                html += `
                <div class="episode-item" onclick="playVideo('${ep.product_id}', '${ep.ccs_product_id}')">
                    <img src="${ep.image_url}" class="ep-thumb">
                    <div>
                        <div style="color:white; font-size:0.9rem;">${ep.number ? 'Eps '+ep.number : ''} ${ep.title}</div>
                        <div style="color:#777; font-size:0.7rem;">${ep.time_duration ? Math.floor(ep.time_duration/60)+' min' : 'Movie'}</div>
                    </div>
                </div>`;
            });
        } else {
             html += `<p style="padding:15px; color:#666;">Film Single (Langsung tekan putar).</p>`;
        }
        html += `</div>`;
        mainContent.innerHTML = html;
        window.scrollTo(0,0);
    } catch (err) {
        mainContent.innerHTML = `<p style="text-align:center; padding:20px;">Gagal memuat detail. <br> ${err.message}</p>`;
    }
}

// ... (Bagian Player di bawah tetap sama dengan sebelumnya)
async function playVideo(productId, ccsId) {
    if(!ccsId) { alert("Video ID tidak ditemukan"); return; }
    
    const btn = document.querySelector('.btn-play');
    const oriText = btn ? btn.innerHTML : '';
    if(btn) btn.innerText = 'Memuat Link...';

    try {
        const res = await fetch(`/api/stream?id=${ccsId}`);
        const data = await res.json();
        
        if(data && data.url) {
            openPlayer(data.url);
        } else {
            alert('Gagal: Link stream tidak ditemukan (Mungkin Premium/VIP).');
        }
    } catch(err) {
        alert('Error network saat load stream.');
    }
    
    if(btn) btn.innerHTML = oriText;
}

const modal = document.getElementById('playerModal');
const video = document.getElementById('videoPlayer');

function openPlayer(url) {
    modal.style.display = 'block';
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() { video.play(); });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', function() { video.play(); });
    }
}

function closePlayer() {
    modal.style.display = 'none';
    video.pause();
    video.src = '';
}

function focusSearch() {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item')[1].classList.add('active');
    searchInput.focus();
}
