document.addEventListener('DOMContentLoaded', function() {
    // Configuration de la synthèse vocale
    const synth = window.speechSynthesis;
    let voice = null;

    // Sélection de la voix française masculine
    function setVoice() {
        const voices = synth.getVoices();
        voice = voices.find(v => v.lang.startsWith('fr') && v.name.toLowerCase().includes('male')) ||
               voices.find(v => v.lang.startsWith('fr')) ||
               voices[0];
    }

    speechSynthesis.onvoiceschanged = setVoice;
    setVoice();

    // Fonction pour faire parler
    function speak(text) {
        if (synth.speaking) {
            synth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        synth.speak(utterance);
    }

    // Afficher la date actuelle
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDate = new Date().toLocaleDateString('fr-FR', options);
    dateElement.textContent = currentDate;

    // Gestion des événements de la timeline
    const timelineItems = document.querySelectorAll('.timeline-item');
    const currentEventOverlay = document.getElementById('current-event-overlay');
    const currentEventContent = document.getElementById('current-event-content');
    const participantsModal = document.getElementById('participants-modal');
    const participantsList = document.querySelector('.participants-list');
    const modalContent = document.querySelector('.modal-content');
    const tickerContent = document.getElementById('ticker-content');
    
    function showParticipants(item) {
        const participants = JSON.parse(item.dataset.participants);
        const room = item.dataset.room;
        const subject = item.dataset.subject;
        const time = item.dataset.time;

        // Mise à jour du titre et des informations de la réunion
        modalContent.querySelector('.meeting-title').textContent = `Réunion de ${time}`;
        modalContent.querySelector('.meeting-room').textContent = room;
        modalContent.querySelector('.meeting-subject').textContent = subject;

        // Mise à jour de la liste des participants
        participantsList.innerHTML = '';
        participants.forEach(participant => {
            const div = document.createElement('div');
            div.className = 'participant';
            div.textContent = participant;
            participantsList.appendChild(div);
        });

        // Affichage de la modale avec animation
        participantsModal.classList.add('visible');
        modalContent.classList.add('animate__animated', 'animate__zoomIn');

        // Fermer la modale après 5 secondes
        setTimeout(() => {
            modalContent.classList.remove('animate__zoomIn');
            modalContent.classList.add('animate__zoomOut');
            setTimeout(() => {
                participantsModal.classList.remove('visible');
                modalContent.classList.remove('animate__zoomOut');
            }, 500);
        }, 5000);

        // Mise à jour du bandeau défilant
        updateTicker(item);
    }

    function updateTicker(item) {
        const time = item.dataset.time;
        const subject = item.dataset.subject;
        const room = item.dataset.room;
        
        const tickerText = `🕒 ${time} | 📝 ${subject} | 📍 ${room}`;
        tickerContent.textContent = tickerText + ' '.repeat(50) + tickerText;
    }
    
    function updateCurrentEvent() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();

        let currentEventFound = false;
        
        timelineItems.forEach(item => {
            const timeStr = item.dataset.time;
            const [hours, minutes] = timeStr.split(':').map(Number);
            const description = item.dataset.description;
            
            if ((currentHour === hours && currentMinutes >= minutes) || 
                (currentHour > hours && (currentHour < hours + 2))) {
                
                if (!item.classList.contains('active')) {
                    // Désactive tous les autres éléments
                    timelineItems.forEach(i => i.classList.remove('active'));
                    
                    // Active l'élément courant
                    item.classList.add('active');
                    
                    // Affiche les informations
                    currentEventOverlay.classList.remove('hidden');
                    currentEventContent.textContent = description;
                    speak(description);
                    showParticipants(item);

                    // Pause l'animation de défilement
                    document.querySelector('.timeline').style.animationPlayState = 'paused';
                    
                    // Centre l'élément actif dans la vue après un court délai
                    setTimeout(() => {
                        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Reprend l'animation après le centrage
                        setTimeout(() => {
                            document.querySelector('.timeline').style.animationPlayState = 'running';
                        }, 1000);
                    }, 100);
                }
                
                currentEventFound = true;
            } else {
                item.classList.remove('active');
            }
        });

        if (!currentEventFound) {
            currentEventOverlay.classList.add('hidden');
            tickerContent.textContent = "Aucune réunion en cours";
            // Reprend l'animation si aucun événement n'est actif
            document.querySelector('.timeline').style.animationPlayState = 'running';
        }
    }

    // Ajoute des événements pour le défilement
    const timeline = document.querySelector('.timeline');
    
    timeline.addEventListener('mouseenter', () => {
        timeline.style.animationPlayState = 'paused';
    });

    timeline.addEventListener('mouseleave', () => {
        // Ne reprend l'animation que s'il n'y a pas d'événement actif
        if (!document.querySelector('.timeline-item.active')) {
            timeline.style.animationPlayState = 'running';
        }
    });

    // Permet de cliquer sur un événement pour le voir en détail
    timelineItems.forEach(item => {
        item.addEventListener('click', () => {
            timelineItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const description = item.dataset.description;
            currentEventOverlay.classList.remove('hidden');
            currentEventContent.textContent = description;
            speak(description);
            showParticipants(item);
            
            // Pause l'animation et centre l'élément
            timeline.style.animationPlayState = 'paused';
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Animation des éléments au survol
    timelineItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const description = item.dataset.description;
            speak(description);
        });
    });

    // Mettre à jour l'événement en cours toutes les minutes
    updateCurrentEvent();
    setInterval(updateCurrentEvent, 60000);
});
