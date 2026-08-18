/* ==========================================
   SYSTÈME DE NOTIFICATION NOUVELLE VIDÉO
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const notifToggleBtn = document.getElementById('notifToggleBtn');
    const notifText = document.getElementById('notifText');

    // 1. Fonction pour mettre à jour le texte et l'état visuel du bouton
    function updateNotifUI(isEnabled) {
        if (notifText) {
            notifText.textContent = isEnabled ? 'Notifications: ON' : 'Notifications: OFF';
        }
        if (notifToggleBtn) {
            if (isEnabled) {
                notifToggleBtn.classList.add('active');
            } else {
                notifToggleBtn.classList.remove('active');
            }
        }
    }

    // 2. RESTAURATION DE L'ÉTAT AU CHARGEMENT DE LA PAGE (Fix du Refresh)
    function initNotifState() {
        const savedState = localStorage.getItem('notifsEnabled');
        
        // Si sauvegardé à 'true' ET que la permission du navigateur est toujours accordée
        if (savedState === 'true' && 'Notification' in window && Notification.permission === 'granted') {
            updateNotifUI(true);
        } else {
            // Sinon par défaut on laisse/met sur OFF
            localStorage.setItem('notifsEnabled', 'false');
            updateNotifUI(false);
        }
    }

    // On exécute immédiatement au chargement
    initNotifState();

    // 3. GESTION DU BASCULEMENT ON / OFF (Toggle)
    if (notifToggleBtn) {
        notifToggleBtn.addEventListener('click', async () => {
            if (!('Notification' in window)) {
                alert("Votre navigateur ne supporte pas les notifications.");
                return;
            }

            const isCurrentlyEnabled = localStorage.getItem('notifsEnabled') === 'true';

            // Si déjà activé -> ON LE DÉSACTIVE
            if (isCurrentlyEnabled) {
                localStorage.setItem('notifsEnabled', 'false');
                updateNotifUI(false);
            } 
            // Si désactivé -> ON L'ACTIVE
            else {
                let permission = Notification.permission;

                if (permission === 'default') {
                    permission = await Notification.requestPermission();
                }

                if (permission === 'granted') {
                    localStorage.setItem('notifsEnabled', 'true');
                    updateNotifUI(true);
                    
                    // Notification de confirmation d'activation
                    showHarmonyNotification({
                        id: 'test_welcome',
                        title: 'Notifications activées !',
                        auteur: 'Système',
                        date: 'Aujourd\'hui'
                    });
                } else {
                    // Si refusé ou bloqué par le navigateur
                    localStorage.setItem('notifsEnabled', 'false');
                    updateNotifUI(false);
                    if (permission === 'denied') {
                        alert("Les notifications sont bloquées dans les paramètres de votre navigateur.");
                    }
                }
            }
        });
    }
});

// 4. Création dynamique de la bannière Toast dans le DOM
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

// 5. Fonction pour afficher la notification (Bannière + Navigateur)
function showHarmonyNotification(videoData) {
    createNotificationBanner();

    const toast = document.getElementById('osNotifToast');
    const notifTitle = document.getElementById('notifTitle');
    const notifDesc = document.getElementById('notifDesc');

    if (notifTitle) notifTitle.textContent = videoData.title;
    if (notifDesc) notifDesc.textContent = `Par ${videoData.auteur || 'Inconnu'} • ${videoData.date || 'Récemment'}`;

    // Animation d'apparition de la bannière
    toast.classList.add('active');

    // Masquage automatique après 6 secondes
    setTimeout(() => {
        toast.classList.remove('active');
    }, 6000);

    // Notification système native (seulement si l'utilisateur l'a activée)
    if ('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('notifsEnabled') === 'true') {
        new Notification(`Nouvelle vidéo : ${videoData.title}`, {
            body: `Ajoutée par ${videoData.auteur || 'Inconnu'}\nDate: ${videoData.date || 'Récemment'}`,
            icon: 'icon.svg'
        });
    }
}

// 6. Vérification automatique des nouvelles vidéos
function checkForNewVideo(latestVideo) {
    const lastSeenId = localStorage.getItem('lastSeenVideoId');

    if (latestVideo && latestVideo.id !== lastSeenId) {
        showHarmonyNotification(latestVideo);
        localStorage.setItem('lastSeenVideoId', latestVideo.id);
    }
}
