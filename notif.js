/* ==========================================
   SYSTÈME DE NOTIFICATION NOUVELLE VIDÉO
   ========================================== */
const notifToggleBtn = document.getElementById('notifToggleBtn');
const notifText = document.getElementById('notifText');

// 1. Demande de permission pour les notifications navigateur
if (notifToggleBtn) {
    notifToggleBtn.addEventListener('click', async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                localStorage.setItem('notifsEnabled', 'true');
                if (notifText) notifText.textContent = 'Notifications: ON';
                showHarmonyNotification({
                    id: 'test',
                    title: 'Notifications activées !',
                    auteur: 'Système',
                    date: 'Aujourd\'hui'
                });
            } else {
                localStorage.setItem('notifsEnabled', 'false');
                if (notifText) notifText.textContent = 'Notifications: OFF';
            }
        }
    });
}

// 2. Création dynamique de la bannière Toast dans le DOM
function createNotificationBanner() {
    if (document.getElementById('osNotifToast')) return;

    const toast = document.createElement('div');
    toast.id = 'osNotifToast';
    toast.className = 'os-notification-toast';
    toast.innerHTML = `
        <div class="notif-icon"><i class="fa-solid fa-film"></i></div>
        <div class="notif-content">
            <div class="notif-header">
                <span class="notif-tag">Nouveauté</span>
                <span class="notif-time" id="notifTime">À l'instant</span>
            </div>
            <div class="notif-title" id="notifTitle">Titre vidéo</div>
            <div class="notif-desc" id="notifDesc">Par Auteur • Date</div>
        </div>
        <button class="notif-close" id="closeNotifBtn"><i class="fa-solid fa-xmark"></i></button>
    `;
    document.body.appendChild(toast);

    document.getElementById('closeNotifBtn').addEventListener('click', () => {
        toast.classList.remove('active');
    });
}

// 3. Fonction pour afficher la notification (Bannière + Navigateur)
function showHarmonyNotification(videoData) {
    createNotificationBanner();

    const toast = document.getElementById('osNotifToast');
    const notifTitle = document.getElementById('notifTitle');
    const notifDesc = document.getElementById('notifDesc');

    if (notifTitle) notifTitle.textContent = videoData.title;
    if (notifDesc) notifDesc.textContent = `Par ${videoData.auteur || 'Inconnu'} • ${videoData.date || 'Récemment'}`;

    // Animation d'apparition
    toast.classList.add('active');

    // Masquage automatique après 6 secondes
    setTimeout(() => {
        toast.classList.remove('active');
    }, 6000);

    // Notification système native si autorisée
    if (Notification.permission === 'granted' && localStorage.getItem('notifsEnabled') === 'true') {
        new Notification(`Nouvelle vidéo : ${videoData.title}`, {
            body: `Ajoutée par ${videoData.auteur || 'Inconnu'}\nDate: ${videoData.date || 'Récemment'}`,
            icon: 'icon.svg'
        });
    }
}

// 4. Vérification automatique lors du chargement de la page
function checkForNewVideo(latestVideo) {
    // latestVideo doit contenir : { id, title, auteur, date }
    const lastSeenId = localStorage.getItem('lastSeenVideoId');

    if (latestVideo && latestVideo.id !== lastSeenId) {
        // Nouvelle vidéo détectée !
        showHarmonyNotification(latestVideo);
        // Mise à jour du dernier identifiant vu
        localStorage.setItem('lastSeenVideoId', latestVideo.id);
    }
}

// EXEMPLE D'UTILISATION :
// Appelle cette fonction lorsque tes cartes vidéos sont générées depuis ton script principal (ex: bar.js)
/*
checkForNewVideo({
    id: "vid_2026_01",
    title: "Documentaire : Les Mystères de l'Océan",
    auteur: "Jean Dupont",
    date: "18/08/2026"
});
*/
