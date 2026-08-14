let players = [];
let globalNetInterval = null;
let saveTimeInterval = null;
let allVideosData = [];

// --- ÉTATS LOCALSTORAGE ---
let isDarkMode = localStorage.getItem('os_darkMode') === 'true';
let isNetMonitorEnabled = localStorage.getItem('os_netMonitor') === 'true';
let favoritesList = JSON.parse(localStorage.getItem('os_favorites')) || [];
let videoPositions = JSON.parse(localStorage.getItem('os_video_positions')) || {};
let customBgImage = localStorage.getItem('os_wallpaper') || null;
let userName = localStorage.getItem('os_user_name') || null;
let userAvatar = localStorage.getItem('os_user_avatar') || null;
let isFavFilterActive = false;

// --- GESTION DE LA DATA QUOTIDIENNE ---
function getTodayKey() {
    const today = new Date();
    return `os_data_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

let currentDataKey = getTodayKey();
let totalDataBytes = parseInt(localStorage.getItem(currentDataKey)) || 0;

// 1. Horloge OS & Reset quotidien de la data
function startClock() {
    const clockEl = document.getElementById('osClock');
    setInterval(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}`;

        const newKey = getTodayKey();
        if (newKey !== currentDataKey) {
            currentDataKey = newKey;
            totalDataBytes = 0;
            localStorage.setItem(currentDataKey, 0);
            document.getElementById('totalDataUsage').textContent = formatTotalData(0);
        }
    }, 1000);
}

// 2. Formatage Data
function formatBytes(bytesSpeed) {
    if (bytesSpeed < 1024) return `${Math.round(bytesSpeed)} o/s`;
    else if (bytesSpeed < 1024 * 1024) return `${(bytesSpeed / 1024).toFixed(1)} Ko/s`;
    else return `${(bytesSpeed / (1024 * 1024)).toFixed(2)} Mo/s`;
}

function formatTotalData(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    else if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
    else return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

// 3. Modèle Principal & Rendu Vidéos
async function template() {
    try {
        const eglise = await fetch('index.json');
        allVideosData = await eglise.json();
        renderVideos(allVideosData);
        loadYouTubeScript();
    } catch (err) {
        console.error("Erreur de chargement du fichier JSON:", err);
    }
}

function renderVideos(data) {
    const Affichage = document.querySelector('#zoneMesses');
    Affichage.innerHTML = '';
    players = [];

    data.forEach((element, index) => {
        const playerId = `yt-player-${index}`;
        const urlIframe = `https://www.youtube.com/embed/${element.videoID}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1`;
        const isFav = favoritesList.includes(element.videoID);

        const cree = document.createElement('div');
        cree.className = "carte";
        cree.setAttribute('data-id', element.videoID);
        cree.innerHTML = `
            <iframe id="${playerId}" data-videoid="${element.videoID}" src="${urlIframe}" allow="autoplay; encrypted-media; picture-in-picture; gyroscope; accelerometer" allowfullscreen>
                ${element.titre}
            </iframe>
            <div class="point"><span>${element.number}</span></div>
            <div class="GRID_GEN">
                    <h2 class="titre">${element.titre}</h2> 
                    <p class="date">${element.date}</p>
                    <p class="auteur">${element.par}</p>
                    <div class="card-bottom-row">
                        <button class="btn-fav ${isFav ? 'active' : ''}" onclick="toggleFavorite('${element.videoID}', this)" title="Favori">
                            <i class="fa-solid fa-star"></i>
                        </button>
                        <a href="mailto:${element.son_adresse}">${element.son_adresse}</a>
                    </div>
            </div>
        `;
        Affichage.appendChild(cree);
    });

    if (window.YT && window.YT.Player) {
        initYoutubePlayers();
    }
}

function loadYouTubeScript() {
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

window.onYouTubeIframeAPIReady = function() {
    initYoutubePlayers();
};

function initYoutubePlayers() {
    document.querySelectorAll('.carte iframe').forEach(iframe => {
        const videoID = iframe.getAttribute('data-videoid');

        const p = new YT.Player(iframe.id, {
            events: {
                'onReady': (event) => onPlayerReady(event, videoID),
                'onStateChange': onPlayerStateChange
            }
        });
        players.push(p);
    });
}

// Reprise de lecture vidéo
function onPlayerReady(event, videoID) {
    const savedTime = videoPositions[videoID];
    if (savedTime && savedTime > 2) {
        event.target.seekTo(savedTime, true);
    }
}

function onPlayerStateChange(event) {
    checkAllPlayersState();

    let isAnyPlaying = false;
    players.forEach(p => {
        if (p && typeof p.getPlayerState === 'function' && p.getPlayerState() === 1) {
            isAnyPlaying = true;
        }
    });

    if (isAnyPlaying && !saveTimeInterval) {
        saveTimeInterval = setInterval(saveCurrentVideoPositions, 1000);
    } else if (!isAnyPlaying && saveTimeInterval) {
        clearInterval(saveTimeInterval);
        saveTimeInterval = null;
    }
}

function saveCurrentVideoPositions() {
    players.forEach(p => {
        if (p && typeof p.getPlayerState === 'function' && p.getPlayerState() === 1) {
            const currentTime = p.getCurrentTime();
            const iframe = p.getIframe();
            const videoID = iframe.getAttribute('data-videoid');
            if (videoID && currentTime > 0) {
                videoPositions[videoID] = Math.floor(currentTime);
            }
        }
    });
    localStorage.setItem('os_video_positions', JSON.stringify(videoPositions));
}

// 4. Favoris
window.toggleFavorite = function(videoID, btn) {
    if (favoritesList.includes(videoID)) {
        favoritesList = favoritesList.filter(id => id !== videoID);
        btn.classList.remove('active');
    } else {
        favoritesList.push(videoID);
        btn.classList.add('active');
    }
    localStorage.setItem('os_favorites', JSON.stringify(favoritesList));

    if (isFavFilterActive) {
        filterFavorites();
    }
};

// 5. Moniteur Réseau
function checkAllPlayersState() {
    if (!isNetMonitorEnabled) {
        stopGlobalMonitor();
        return;
    }

    let isAnyPlaying = false;
    players.forEach(p => {
        if (p && typeof p.getPlayerState === 'function') {
            if (p.getPlayerState() === 1) isAnyPlaying = true;
        }
    });

    if (isAnyPlaying) startGlobalMonitor();
    else stopGlobalMonitor();
}

function startGlobalMonitor() {
    if (globalNetInterval || !isNetMonitorEnabled) return;

    const monitor = document.getElementById('globalNetMonitor');
    const downBar = monitor.querySelector('.down-bar');
    const upBar = monitor.querySelector('.up-bar');
    const downVal = monitor.querySelector('.down-val');
    const upVal = monitor.querySelector('.up-val');
    const dataDisplay = document.getElementById('totalDataUsage');

    globalNetInterval = setInterval(() => {
        const bytesDown = Math.floor(Math.random() * (2500 * 1024 - 150 * 1024)) + (150 * 1024);
        const bytesUp = Math.floor(Math.random() * (100 * 1024 - 10 * 1024)) + (10 * 1024);

        totalDataBytes += bytesDown + bytesUp;
        localStorage.setItem(currentDataKey, totalDataBytes);
        dataDisplay.textContent = formatTotalData(totalDataBytes);

        const maxScale = 3 * 1024 * 1024;
        downBar.style.width = `${Math.min((bytesDown / maxScale) * 100, 100)}%`;
        upBar.style.width = `${Math.min((bytesUp / (200 * 1024)) * 100, 100)}%`;

        downVal.textContent = formatBytes(bytesDown);
        upVal.textContent = formatBytes(bytesUp);
    }, 600);
}

function stopGlobalMonitor() {
    clearInterval(globalNetInterval);
    globalNetInterval = null;

    const monitor = document.getElementById('globalNetMonitor');
    if (monitor) {
        monitor.querySelector('.down-bar').style.width = '0%';
        monitor.querySelector('.up-bar').style.width = '0%';
        monitor.querySelector('.down-val').textContent = '0 o/s';
        monitor.querySelector('.up-val').textContent = '0 o/s';
    }
}

// 6. Wallpaper
function applyWallpaper(bgData) {
    const resetBtn = document.getElementById('bgResetBtn');
    if (bgData) {
        document.body.style.backgroundImage = `url('${bgData}')`;
        document.body.classList.add('custom-bg');
        if (resetBtn) resetBtn.style.display = 'flex';
    } else {
        document.body.style.backgroundImage = 'none';
        document.body.classList.remove('custom-bg');
        if (resetBtn) resetBtn.style.display = 'none';
    }
}

// 7. Profil Utilisateur & Modal WhatsApp
function initUserProfile() {
    const nameDisplay = document.getElementById('userNameDisplay');
    const avatarImg = document.getElementById('profileAvatarImg');
    const modalUserName = document.getElementById('modalUserName');

    if (!userName) {
        promptForUserName();
    } else {
        nameDisplay.textContent = userName;
        if (modalUserName) modalUserName.textContent = userName;
    }

    if (userAvatar) {
        avatarImg.src = userAvatar;
    } else {
        const nameQuery = encodeURIComponent(userName || 'User');
        avatarImg.src = `https://ui-avatars.com/api/?name=${nameQuery}&background=2563eb&color=fff`;
    }
}

function promptForUserName() {
    const nameDisplay = document.getElementById('userNameDisplay');
    const modalUserName = document.getElementById('modalUserName');
    const avatarImg = document.getElementById('profileAvatarImg');
    
    const inputName = prompt("Entrez votre nom / pseudo :", userName || "");
    if (inputName !== null && inputName.trim() !== "") {
        userName = inputName.trim();
        localStorage.setItem('os_user_name', userName);
        nameDisplay.textContent = userName;
        if (modalUserName) modalUserName.textContent = userName;

        if (!userAvatar) {
            const nameQuery = encodeURIComponent(userName);
            avatarImg.src = `https://ui-avatars.com/api/?name=${nameQuery}&background=2563eb&color=fff`;
        }
    }
}

// GESTION MODAL AVATAR (STYLE WHATSAPP)
const profileAvatarBtn = document.getElementById('profileAvatarBtn');
const avatarModal = document.getElementById('avatarModal');
const modalAvatarImg = document.getElementById('modalAvatarImg');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const changeAvatarFromModalBtn = document.getElementById('changeAvatarFromModalBtn');
const avatarInput = document.getElementById('avatarInput');

function openAvatarModal() {
    const currentSrc = document.getElementById('profileAvatarImg').src;
    modalAvatarImg.src = currentSrc;
    avatarModal.classList.add('active');
}

function closeAvatarModal() {
    avatarModal.classList.remove('active');
}

profileAvatarBtn.addEventListener('click', openAvatarModal);
closeModalBtn.addEventListener('click', closeAvatarModal);
modalBackdrop.addEventListener('click', closeAvatarModal);

changeAvatarFromModalBtn.addEventListener('click', () => avatarInput.click());

avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Avatar = event.target.result;
            try {
                localStorage.setItem('os_user_avatar', base64Avatar);
                userAvatar = base64Avatar;
                document.getElementById('profileAvatarImg').src = base64Avatar;
                modalAvatarImg.src = base64Avatar;
            } catch (err) {
                alert("L'image est trop lourde pour être enregistrée.");
            }
        };
        reader.readAsDataURL(file);
    }
});

// 8. Application de l'état initial
function applyInitialState() {
    startClock();
    initUserProfile();
    document.getElementById('totalDataUsage').textContent = formatTotalData(totalDataBytes);

    if (isDarkMode) {
        document.body.classList.add('sombre');
        document.getElementById('modeText').textContent = "Sun";
    }

    applyWallpaper(customBgImage);

    const monitorElement = document.getElementById('globalNetMonitor');
    const header = document.getElementById('mainHeader');
    const netText = document.getElementById('netText');

    if (isNetMonitorEnabled) {
        monitorElement.classList.add('visible');
        header.classList.add('net-active');
        netText.textContent = "Réseau: ON";
    } else {
        monitorElement.classList.remove('visible');
        header.classList.remove('net-active');
        netText.textContent = "Réseau: OFF";
    }
}

// Événements
const MENU = document.querySelector('.menu');
const SOUS_MENU = document.querySelector('.sous_menu');

MENU.addEventListener('click', () => SOUS_MENU.classList.toggle('active'));
SOUS_MENU.addEventListener('click', (e) => e.stopPropagation());

const btnMode = document.querySelector('#modeBouton');
btnMode.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('sombre');
    document.getElementById('modeText').textContent = isDarkMode ? "Sun" : "Moon";
    localStorage.setItem('os_darkMode', isDarkMode);
});

const netBtn = document.querySelector('#netMonitorToggle');
netBtn.addEventListener('click', () => {
    isNetMonitorEnabled = !isNetMonitorEnabled;
    localStorage.setItem('os_netMonitor', isNetMonitorEnabled);

    const monitorElement = document.getElementById('globalNetMonitor');
    const header = document.getElementById('mainHeader');
    const netText = document.getElementById('netText');

    if (isNetMonitorEnabled) {
        monitorElement.classList.add('visible');
        header.classList.add('net-active');
        netText.textContent = "Réseau: ON";
        checkAllPlayersState();
    } else {
        monitorElement.classList.remove('visible');
        header.classList.remove('net-active');
        netText.textContent = "Réseau: OFF";
        stopGlobalMonitor();
    }
});

const favBtn = document.querySelector('#favFilterToggle');
favBtn.addEventListener('click', () => {
    isFavFilterActive = !isFavFilterActive;
    filterFavorites();
});

function filterFavorites() {
    const favText = document.getElementById('favText');
    if (isFavFilterActive) {
        favText.textContent = "Voir Tout";
        const filtered = allVideosData.filter(v => favoritesList.includes(v.videoID));
        renderVideos(filtered);
    } else {
        favText.textContent = "Voir Favoris";
        renderVideos(allVideosData);
    }
}

// Événements Profil Utilisateur
const editNameBtn = document.getElementById('editNameBtn');
editNameBtn.addEventListener('click', () => promptForUserName());

// Événements Wallpaper
const bgPickerBtn = document.getElementById('bgPickerBtn');
const bgInput = document.getElementById('bgInput');
const bgResetBtn = document.getElementById('bgResetBtn');

bgPickerBtn.addEventListener('click', () => bgInput.click());

bgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Image = event.target.result;
            try {
                localStorage.setItem('os_wallpaper', base64Image);
                customBgImage = base64Image;
                applyWallpaper(base64Image);
            } catch (err) {
                alert("Image trop volumineuse pour le stockage local.");
            }
        };
        reader.readAsDataURL(file);
    }
});

bgResetBtn.addEventListener('click', () => {
    localStorage.removeItem('os_wallpaper');
    customBgImage = null;
    applyWallpaper(null);
    bgInput.value = '';
});

// Recherche
document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allVideosData.filter(v => 
        v.titre.toLowerCase().includes(query) || 
        v.par.toLowerCase().includes(query)
    );
    renderVideos(filtered);
});

applyInitialState();
template();
