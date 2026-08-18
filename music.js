/* ==========================================
   LECTEUR DE MUSIQUE D'ÉTUDE (AVEC PERSISTANCE IndexedDB)
   ========================================== */
const musicStudyBtn = document.getElementById('musicStudyBtn');
const musicModal = document.getElementById('musicModal');
const closeMusicModalBtn = document.getElementById('closeMusicModalBtn');
const musicModalBackdrop = document.getElementById('musicModalBackdrop');

const musicInput = document.getElementById('musicInput');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevTrackBtn = document.getElementById('prevTrackBtn');
const nextTrackBtn = document.getElementById('nextTrackBtn');

const playlistView = document.getElementById('playlistView');
const currentTrackTitle = document.getElementById('currentTrackTitle');
const cdIcon = document.getElementById('cdIcon');

let playlist = []; // Contient { id, title, url }
let currentIndex = 0;
let db = null;

// 1. Initialisation de la base de données IndexedDB
function initMusicDB() {
    const request = indexedDB.open('StudyMusicDB', 1);

    request.onupgradeneeded = (e) => {
        db = e.target.result;
        if (!db.objectStoreNames.contains('tracks')) {
            db.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
        }
    };

    request.onsuccess = (e) => {
        db = e.target.result;
        loadTracksFromDB(); // Charge les musiques sauvegardées au démarrage
    };

    request.onerror = (e) => {
        console.error('Erreur IndexedDB:', e.target.error);
    };
}

// Charger les musiques stockées au rechargement de la page
function loadTracksFromDB() {
    if (!db) return;
    const tx = db.transaction('tracks', 'readonly');
    const store = tx.objectStore('tracks');
    const request = store.getAll();

    request.onsuccess = () => {
        const savedTracks = request.result;
        playlist = savedTracks.map(item => ({
            id: item.id,
            title: item.title,
            url: URL.createObjectURL(item.fileBlob)
        }));

        renderPlaylist();
        if (playlist.length > 0) {
            loadTrack(0);
        }
    };
}

// Enregistrer un fichier audio dans IndexedDB
function saveTrackToDB(file) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('tracks', 'readwrite');
        const store = tx.objectStore('tracks');
        const trackData = {
            title: file.name.replace(/\.[^/.]+$/, ""),
            fileBlob: file
        };
        const request = store.add(trackData);

        request.onsuccess = (e) => {
            const newId = e.target.result;
            resolve({
                id: newId,
                title: trackData.title,
                url: URL.createObjectURL(file)
            });
        };

        request.onerror = () => reject(request.error);
    });
}

// Supprimer définitivement la musique du stockage
function deleteTrackFromDB(id) {
    if (!db) return;
    const tx = db.transaction('tracks', 'readwrite');
    const store = tx.objectStore('tracks');
    store.delete(id);
}

// Lancement de IndexedDB
initMusicDB();

// 2. Ouverture et fermeture de la modale
if (musicStudyBtn && musicModal) {
    musicStudyBtn.addEventListener('click', () => musicModal.classList.add('active'));
}

const closeMusicModal = () => musicModal && musicModal.classList.remove('active');
if (closeMusicModalBtn) closeMusicModalBtn.addEventListener('click', closeMusicModal);
if (musicModalBackdrop) musicModalBackdrop.addEventListener('click', closeMusicModal);

// 3. Ajout des fichiers audio
if (musicInput) {
    musicInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const wasEmpty = playlist.length === 0;

        for (const file of files) {
            try {
                const newTrack = await saveTrackToDB(file);
                playlist.push(newTrack);
            } catch (err) {
                console.error("Erreur lors de la sauvegarde :", err);
            }
        }

        renderPlaylist();

        if (wasEmpty && playlist.length > 0) {
            loadTrack(0);
        }

        musicInput.value = '';
    });
}

// 4. Affichage de la playlist avec bouton de suppression
function renderPlaylist() {
    if (!playlistView) return;
    playlistView.innerHTML = '';

    playlist.forEach((track, idx) => {
        const li = document.createElement('li');
        if (idx === currentIndex && playlist.length > 0) {
            li.classList.add('active');
        }

        const trackSpan = document.createElement('span');
        trackSpan.className = 'track-name';
        trackSpan.textContent = track.title;
        trackSpan.addEventListener('click', () => {
            loadTrack(idx);
            playTrack();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-track-btn';
        deleteBtn.title = 'Supprimer de la liste';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeTrack(idx);
        });

        li.appendChild(trackSpan);
        li.appendChild(deleteBtn);
        playlistView.appendChild(li);
    });
}

// 5. Suppression d'une piste
function removeTrack(index) {
    const trackToRemove = playlist[index];
    if (!trackToRemove) return;

    deleteTrackFromDB(trackToRemove.id);
    URL.revokeObjectURL(trackToRemove.url);

    playlist.splice(index, 1);

    if (playlist.length === 0) {
        pauseTrack();
        if (audioPlayer) audioPlayer.src = '';
        if (currentTrackTitle) currentTrackTitle.textContent = 'Aucune musique chargée';
        currentIndex = 0;
    } else {
        if (index === currentIndex) {
            currentIndex = currentIndex % playlist.length;
            loadTrack(currentIndex);
            playTrack();
        } else if (index < currentIndex) {
            currentIndex--;
        }
    }

    renderPlaylist();
}

// 6. Charger une piste
function loadTrack(index) {
    if (!playlist[index]) return;
    currentIndex = index;
    if (audioPlayer) audioPlayer.src = playlist[currentIndex].url;
    if (currentTrackTitle) currentTrackTitle.textContent = playlist[currentIndex].title;
    renderPlaylist();
}

// 7. Lancer la lecture
function playTrack() {
    if (!audioPlayer || !audioPlayer.src) return;
    audioPlayer.play();
    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    if (cdIcon) cdIcon.classList.add('playing');
}

// 8. Mettre en pause
function pauseTrack() {
    if (!audioPlayer) return;
    audioPlayer.pause();
    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    if (cdIcon) cdIcon.classList.remove('playing');
}

// 9. Événements des boutons de contrôle
if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
        if (!audioPlayer || !audioPlayer.src) return;
        if (audioPlayer.paused) playTrack();
        else pauseTrack();
    });
}

if (nextTrackBtn) {
    nextTrackBtn.addEventListener('click', () => {
        if (!playlist.length) return;
        currentIndex = (currentIndex + 1) % playlist.length;
        loadTrack(currentIndex);
        playTrack();
    });
}

if (prevTrackBtn) {
    prevTrackBtn.addEventListener('click', () => {
        if (!playlist.length) return;
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        loadTrack(currentIndex);
        playTrack();
    });
}

// Enchaînement automatique des morceaux
if (audioPlayer) {
    audioPlayer.addEventListener('ended', () => {
        if (nextTrackBtn) nextTrackBtn.click();
    });
}
