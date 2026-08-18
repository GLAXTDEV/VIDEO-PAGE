document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. MODE ZEN / FULL FOCUS
       ========================================== */
    const zenModeToggle = document.getElementById('zenModeToggle');
    const zenText = document.getElementById('zenText');
    const exitZenBtn = document.getElementById('exitZenBtn');

    const isZen = localStorage.getItem('zenMode') === 'true';
    if (isZen) {
        document.body.classList.add('zen-mode');
        if (zenText) zenText.textContent = 'Mode Zen: ON';
    }

    function toggleZen() {
        const active = document.body.classList.toggle('zen-mode');
        localStorage.setItem('zenMode', active);
        if (zenText) zenText.textContent = active ? 'Mode Zen: ON' : 'Mode Zen: OFF';
    }

    if (zenModeToggle) zenModeToggle.addEventListener('click', toggleZen);
    if (exitZenBtn) exitZenBtn.addEventListener('click', toggleZen);


    /* ==========================================
       2. COMPTEUR DE TEMPS D'ÉTUDE & SYSTÈME D'ÉTOILES
       ========================================== */
    const studyTimeDisplay = document.getElementById('studyTimeDisplay');
    const starsDisplay = document.getElementById('starsDisplay');
    const todayStr = new Date().toISOString().split('T')[0];

    // Temps du jour
    let savedDate = localStorage.getItem('studyTimeDate');
    let studySeconds = parseInt(localStorage.getItem('studyTimeSeconds') || '0', 10);

    // Étoiles et progression (15 min = 900 secondes)
    let totalStars = parseInt(localStorage.getItem('totalUserStars') || '0', 10);
    let starProgress = parseInt(localStorage.getItem('starProgressSeconds') || '0', 10);

    // Réinitialisation du temps du jour si la date a changé
    if (savedDate !== todayStr) {
        studySeconds = 0;
        localStorage.setItem('studyTimeDate', todayStr);
        localStorage.setItem('studyTimeSeconds', '0');
    }

    function updateDisplay() {
        // Affichage du temps
        const hours = Math.floor(studySeconds / 3600);
        const minutes = Math.floor((studySeconds % 3600) / 60);
        if (studyTimeDisplay) {
            studyTimeDisplay.textContent = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
        }

        // Affichage des étoiles
        if (starsDisplay) {
            starsDisplay.textContent = `${totalStars} ⭐`;
        }
    }

    // Incrémentation chaque seconde
    setInterval(() => {
        studySeconds++;
        starProgress++;

        // Sauvegarde du temps du jour
        localStorage.setItem('studyTimeSeconds', studySeconds);

        // Déblocage d'une étoile toutes les 15 minutes (900s)
        if (starProgress >= 900) {
            totalStars++;
            starProgress = 0; // Réinitialise la tranche de 15 minutes

            localStorage.setItem('totalUserStars', totalStars);
            localStorage.setItem('starProgressSeconds', starProgress);

            // Message de félicitations
            alert(`🎉 Félicitations ! Vous avez étudié pendant 15 minutes et gagné 1 nouvelle étoile ! (Total : ${totalStars} ⭐)`);
        } else {
            localStorage.setItem('starProgressSeconds', starProgress);
        }

        updateDisplay();
    }, 1000);

    updateDisplay();


    /* ==========================================
       3. BLOC-NOTES INTELLIGENT
       ========================================== */
    const notesBtn = document.getElementById('notesBtn');
    const notesModal = document.getElementById('notesModal');
    const closeNotesModalBtn = document.getElementById('closeNotesModalBtn');
    const notesModalBackdrop = document.getElementById('notesModalBackdrop');
    const studyNotesArea = document.getElementById('studyNotesArea');

    if (notesBtn && notesModal) {
        notesBtn.addEventListener('click', () => notesModal.classList.add('active'));
    }

    const closeNotes = () => notesModal && notesModal.classList.remove('active');
    if (closeNotesModalBtn) closeNotesModalBtn.addEventListener('click', closeNotes);
    if (notesModalBackdrop) notesModalBackdrop.addEventListener('click', closeNotes);

    if (studyNotesArea) {
        studyNotesArea.value = localStorage.getItem('savedStudyNotes') || '';
        studyNotesArea.addEventListener('input', (e) => {
            localStorage.setItem('savedStudyNotes', e.target.value);
        });
    }


    /* ==========================================
       4. CARTES DE RÉVISION (FLASHCARDS)
       ========================================== */
    const flashcardsBtn = document.getElementById('flashcardsBtn');
    const flashcardsModal = document.getElementById('flashcardsModal');
    const closeFlashcardsModalBtn = document.getElementById('closeFlashcardsModalBtn');
    const flashcardsModalBackdrop = document.getElementById('flashcardsModalBackdrop');

    const flashcardBox = document.getElementById('flashcardBox');
    const cardInner = document.getElementById('cardInner');
    const cardFront = document.getElementById('cardFront');
    const cardBack = document.getElementById('cardBack');

    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    const cardCounter = document.getElementById('cardCounter');

    const cardQuestionInput = document.getElementById('cardQuestionInput');
    const cardAnswerInput = document.getElementById('cardAnswerInput');
    const addCardBtn = document.getElementById('addCardBtn');

    let flashcards = JSON.parse(localStorage.getItem('savedFlashcards') || '[]');
    let currentCardIndex = 0;

    if (flashcardsBtn && flashcardsModal) {
        flashcardsBtn.addEventListener('click', () => flashcardsModal.classList.add('active'));
    }

    const closeFlashcards = () => flashcardsModal && flashcardsModal.classList.remove('active');
    if (closeFlashcardsModalBtn) closeFlashcardsModalBtn.addEventListener('click', closeFlashcards);
    if (flashcardsModalBackdrop) flashcardsModalBackdrop.addEventListener('click', closeFlashcards);

    if (flashcardBox) {
        flashcardBox.addEventListener('click', () => {
            cardInner.classList.toggle('flipped');
        });
    }

    function renderCard() {
        if (cardInner) cardInner.classList.remove('flipped');

        if (flashcards.length === 0) {
            cardFront.textContent = 'Ajoutez une carte pour commencer !';
            cardBack.textContent = "La réponse s'affichera ici.";
            cardCounter.textContent = '0 / 0';
            return;
        }

        const card = flashcards[currentCardIndex];
        cardFront.textContent = card.question;
        cardBack.textContent = card.answer;
        cardCounter.textContent = `${currentCardIndex + 1} / ${flashcards.length}`;
    }

    if (addCardBtn) {
        addCardBtn.addEventListener('click', () => {
            const q = cardQuestionInput.value.trim();
            const a = cardAnswerInput.value.trim();

            if (q && a) {
                flashcards.push({ question: q, answer: a });
                localStorage.setItem('savedFlashcards', JSON.stringify(flashcards));
                cardQuestionInput.value = '';
                cardAnswerInput.value = '';
                currentCardIndex = flashcards.length - 1;
                renderCard();
            }
        });
    }

    if (prevCardBtn) {
        prevCardBtn.addEventListener('click', () => {
            if (flashcards.length === 0) return;
            currentCardIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
            renderCard();
        });
    }

    if (nextCardBtn) {
        nextCardBtn.addEventListener('click', () => {
            if (flashcards.length === 0) return;
            currentCardIndex = (currentCardIndex + 1) % flashcards.length;
            renderCard();
        });
    }

    renderCard();
});
