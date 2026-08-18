/* ==========================================
   PERSISTANCE DU VOLUME (VIDÉO & MUSIQUE)
   ========================================== */
const musicVolumeSlider = document.getElementById('musicVolumeSlider');
const videoVolumeSlider = document.getElementById('videoVolumeSlider');
const musicVolPercent = document.getElementById('musicVolPercent');
const videoVolPercent = document.getElementById('videoVolPercent');

// 1. Récupération des valeurs sauvegardées (ou valeurs par défaut : 100% vidéo, 50% musique)
const savedVideoVol = localStorage.getItem('savedVideoVolume') !== null 
    ? localStorage.getItem('savedVideoVolume') 
    : 100;

const savedMusicVol = localStorage.getItem('savedMusicVolume') !== null 
    ? localStorage.getItem('savedMusicVolume') 
    : 50;

// 2. Application initiale au chargement de la page
if (videoVolumeSlider && videoVolPercent) {
    videoVolumeSlider.value = savedVideoVol;
    videoVolPercent.textContent = `${savedVideoVol}%`;
}

if (musicVolumeSlider && musicVolPercent) {
    musicVolumeSlider.value = savedMusicVol;
    musicVolPercent.textContent = `${savedMusicVol}%`;
}

if (audioPlayer) {
    audioPlayer.volume = savedMusicVol / 100;
}

// 3. Gestion et sauvegarde du volume Musique
if (musicVolumeSlider && audioPlayer) {
    musicVolumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        audioPlayer.volume = val / 100;
        if (musicVolPercent) musicVolPercent.textContent = `${val}%`;
        
        // Sauvegarde immédiate
        localStorage.setItem('savedMusicVolume', val);
    });
}

// 4. Gestion et sauvegarde du volume Vidéo
if (videoVolumeSlider) {
    videoVolumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        const volumeFactor = val / 100;

        if (videoVolPercent) videoVolPercent.textContent = `${val}%`;
        
        // Sauvegarde immédiate
        localStorage.setItem('savedVideoVolume', val);

        // Application aux éléments vidéo HTML5
        document.querySelectorAll('video').forEach(video => {
            video.volume = volumeFactor;
        });

        // Application à l'API YouTube Player si présent
        if (window.ytPlayers && Array.isArray(window.ytPlayers)) {
            window.ytPlayers.forEach(player => {
                if (player && typeof player.setVolume === 'function') {
                    player.setVolume(val);
                }
            });
        }
    });
}
