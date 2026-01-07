const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadHome();

    // Search Listener (Debounce)
    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (e.target.value.length > 2) loadSearch(e.target.value);
            else if (e.target.value.length === 0) loadHome();
        }, 600);
    });
});

// --- Functions ---

function showLoading() {
    mainContent.innerHTML = '<div class="loading-spinner"></div>';
}

async function loadHome() {
    showLoading();
    try {
        const res = await fetch('/api/home');
        const data = await res.json();
        
        // Viu home data structure varies, we assume standard lists
        renderGrid(data.spotlight || [], "Spotlight");
        // Combine other sections if available
    } catch (err) {
        console.error(err);
        mainContent.innerHTML = '<p style="text-align:center; padding:20px;">Gagal memuat data.</p>';
    }
}

async function loadSearch(query) {
    showLoading();
    try {
        const res = await fetch(`/api/search?q=${query}`);
        const data = await res.json();
        renderGrid(data, `Hasil pencarian: ${query}`);
    } catch (err) {
        mainContent.innerHTML = '<p style="text-align:center;">Tidak ditemukan.</p>';
    }
}

function renderGrid(items, title) {
    if (!items || items.length === 0) {
        mainContent.innerHTML = '<p style="text-align:center; padding:20px;">Data kosong.</p>';
        return;
    }

    let html = `<h2 class="section-title">${title}</h2><div class="grid-container">`;
    
    items.forEach(item => {
        // Handle variations in API response keys
        const img = item.image_url || item.img_url || 'https://via.placeholder.com/150x225?text=No+Img';
        const title = item.title || item.name || 'Untitled';
        const id = item.product_id || item.id;
        
        if(id) {
            html += `
            <div class="card" onclick="loadDetail('${id}')">
                <img src="${img}" loading="lazy" alt="${title}">
                <div class="card-content">
                    <div class="card-title">${title}</div>
                    <div class="card-sub">${item.synopsis ? item.synopsis.substring(0, 20)+'...' : 'Viu'}</div>
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
        const meta = data.metadata;
        const eps = data.product_list || [];

        let html = `
        <div class="detail-hero">
            <img src="${meta.cover_image_url || meta.image_url}" alt="cover">
            <div style="position:absolute; bottom:0; left:0; width:100%; background:linear-gradient(to top, #121212, transparent); padding:20px;">
                <h1>${meta.title}</h1>
            </div>
        </div>
        <div class="detail-info">
            <p style="color:#ccc; font-size:0.9rem; margin-bottom:15px;">${meta.synopsis || 'Tidak ada sinopsis.'}</p>
            <button class="btn-play" onclick="playVideo('${meta.product_id}', '${meta.ccs_product_id}')">
                <i class="fas fa-play"></i> Putar Film/Eps 1
            </button>
        </div>
        <h3 class="section-title">Episode / Terkait</h3>
        <div class="episodes-list">`;

        // Render episodes if available
        if(eps.length > 0) {
            eps.forEach(ep => {
                html += `
                <div class="episode-item" onclick="playVideo('${ep.product_id}', '${ep.ccs_product_id}')">
                    <img src="${ep.image_url}" class="ep-thumb">
                    <div>
                        <div style="color:white; font-size:0.9rem;">${ep.number ? 'Eps '+ep.number : ''} ${ep.title}</div>
                        <div style="color:#777; font-size:0.7rem;">${ep.time_duration ? Math.floor(ep.time_duration/60)+' min' : ''}</div>
                    </div>
                </div>`;
            });
        } else {
             // If movie, just show play button logic above
             html += `<p style="padding:15px; color:#666;">Ini adalah film (Single Video).</p>`;
        }

        html += `</div>`; // Close list
        mainContent.innerHTML = html;
        window.scrollTo(0,0);

    } catch (err) {
        console.error(err);
    }
}

async function playVideo(productId, ccsId) {
    if(!ccsId) { alert("Video ID tidak ditemukan"); return; }
    
    // UI Loading
    const btn = document.querySelector('.btn-play');
    if(btn) btn.innerText = 'Memuat...';

    try {
        const res = await fetch(`/api/stream?id=${ccsId}`);
        const data = await res.json();
        
        if(data && data.url) {
            openPlayer(data.url);
        } else {
            alert('Gagal mendapatkan link stream.');
        }
    } catch(err) {
        alert('Error saat load stream.');
    }
    
    if(btn) btn.innerHTML = '<i class="fas fa-play"></i> Putar';
}

// --- Player Logic ---
const modal = document.getElementById('playerModal');
const video = document.getElementById('videoPlayer');

function openPlayer(url) {
    modal.style.display = 'block';
    
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', function() {
            video.play();
        });
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
