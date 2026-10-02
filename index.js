let players = [];
let saveTimeInterval = null;
let allVideosData = [];

// --- ÉTATS LOCALSTORAGE ---
let isDarkMode = localStorage.getItem('os_darkMode') === 'true';
let favoritesList = JSON.parse(localStorage.getItem('os_favorites')) || [];
let videoPositions = JSON.parse(localStorage.getItem('os_video_positions')) || {};
let customBgImage = localStorage.getItem('os_wallpaper') || null;
let userName = localStorage.getItem('os_user_name') || null;
let userAvatar = localStorage.getItem('os_user_avatar') || null;
let isFavFilterActive = false;

// 3. Modèle Principal & Rendu Vidéos
async function template() {
    try {
        const eglise = await fetch('index.json');
        allVideosData = await eglise.json();
        renderVideos(allVideosData);
        loadYouTubeScript();
    } catch (err) {
        console.error("Erreur de chargement du fichier JSON:", err);
    } finally {
        hidePageLoader();
    }
}

function hidePageLoader() {
    const pageLoader = document.getElementById('pageLoader');
    if (!pageLoader) return;

    pageLoader.classList.add('is-hidden');
    pageLoader.addEventListener('transitionend', () => pageLoader.remove(), { once: true });
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
                        <a href="mailto:${element.son_adresse}">  <i class="fa-solid fa-envelope"></i> Mailbox</a>
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

// 5. Wallpaper
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

    let inputName = userName || 'Invité';
    if (typeof window.prompt === 'function') {
        inputName = window.prompt("Entrez votre nom / pseudo :", userName || "") || userName || 'Invité';
    }

    if (inputName && inputName.trim() !== "") {
        userName = inputName.trim();
        localStorage.setItem('os_user_name', userName);
        nameDisplay.textContent = userName;
        if (modalUserName) modalUserName.textContent = userName;

        if (!userAvatar) {
            const nameQuery = encodeURIComponent(userName);
            avatarImg.src = `https://ui-avatars.com/api/?name=${nameQuery}&background=2563eb&color=fff`;
        }
    } else {
        userName = 'Invité';
        localStorage.setItem('os_user_name', userName);
        nameDisplay.textContent = userName;
        if (modalUserName) modalUserName.textContent = userName;
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
    initUserProfile();

    if (isDarkMode) {
        document.body.classList.add('sombre');
        document.getElementById('modeText').textContent = "Sun";
    }

    applyWallpaper(customBgImage);
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
