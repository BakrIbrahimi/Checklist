// Données des halls et désignations
const hallsData = {
    "HE06 JFC4/107D": {
        "Circuit de stockage": [
            "SC03 + Jetée",
            "SD02 + Jetée",
            "SE02 + Jetée",
            "AAT02 + Jetée",
            "ABT03 + Jetée"
        ],
        "Circuit de chargement": [
            "ABT05",
            "Jetée ABT05/ABT01",
            "Bâtiment de vente locale",
            "Gratteur"
        ],
        "Hall de stockage": [
            "Les couloirs",
            "Extra Hall"
        ]
    },
    "HE06 JFC2/107E": {
        "Circuit de stockage": [
            "SC02 + Jetée",
            "SD01 + Jetée",
            "SE01 + Jetée",
            "AAT02 + Jetée",
            "ABT03 + Jetée"
        ],
        "Circuit de chargement": [
            "ABT05",
            "Jetée ABT05/ABT01",
            "Bâtiment de vente locale",
            "Gratteur"
        ],
        "Hall de stockage": [
            "Les couloirs",
            "Extra Hall"
        ]
    },
    "HE03/107F": {
        "Circuit de stockage": [
            "SC01 + Jetée",
            "SD03 + Jetée",
            "SJ01 + Jetée"
        ],
        "Circuit de chargement": [
            "ABT03 + Jetée",
            "Bâtiment de vente locale",
            "Gratteur"
        ],
        "Hall de stockage": [
            "Les couloirs",
            "Extra Hall"
        ]
    }
};

// État de l'application
const appState = {
    currentHall: "HE06 JFC4/107D",
    checklistData: [],
    tasksPlanned: 0,
    tasksDone: 0,
    totalTasks: 0,
    currentPhotoTask: null,
    currentPhotoType: null,
    photoData: {} // Stockage des photos en base64
};

// Éléments DOM
const DOM = {
    storageHallSelect: document.getElementById('storage-hall'),
    dateInput: document.getElementById('date'),
    currentDateElement: document.getElementById('current-date'),
    responsibleInput: document.getElementById('responsible'),
    staffCountInput: document.getElementById('staff-count'),
    startTimeInput: document.getElementById('start-time'),
    endTimeInput: document.getElementById('end-time'),
    planningRateElement: document.getElementById('planning-rate'),
    tasksDoneElement: document.getElementById('tasks-done'),
    tasksPlannedElement: document.getElementById('tasks-planned'),
    checklistBody: document.getElementById('checklist-body'),
    resetAllButton: document.getElementById('reset-all'),
    saveLocalButton: document.getElementById('save-local'),
    loadLocalButton: document.getElementById('load-local'),
    shareWhatsAppButton: document.getElementById('share-whatsapp'),
    exportExcelButton: document.getElementById('export-excel'),
    exportCSVButton: document.getElementById('export-csv'),
    exportPDFButton: document.getElementById('export-pdf'),
    exportWordButton: document.getElementById('export-word'),
    currentYearElement: document.getElementById('current-year'),
    photoInput: document.getElementById('photo-input')
};

// Variables pour la gestion des photos
let currentPhotoTask = null;
let currentPhotoType = null;

// Initialisation de l'application
function initApp() {
    // Définir la date d'aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    DOM.dateInput.value = today;
    
    // Mettre à jour l'affichage de la date
    updateCurrentDate();
    
    // Mettre à jour l'année en cours dans le footer
    DOM.currentYearElement.textContent = new Date().getFullYear();
    
    // Charger les halls dans le sélecteur
    setupHallSelector();
    
    // Générer le tableau initial
    generateChecklistTable();
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
    
    // Mettre à jour les statistiques
    updateStats();
    
    // Charger les données sauvegardées si elles existent
    loadFromLocalStorage();
    
    // Configurer l'input file pour les photos
    setupPhotoInput();
}

// Mettre à jour la date actuelle
function updateCurrentDate() {
    const dateDisplay = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    DOM.currentDateElement.textContent = dateDisplay;
}

// Configurer le sélecteur de hall
function setupHallSelector() {
    DOM.storageHallSelect.addEventListener('change', function() {
        const hallCode = this.value;
        const hallSuffix = hallCode === "HE03" ? "107F" : 
                          hallCode === "HE06 JFC2" ? "107E" : "107D";
        appState.currentHall = `${hallCode}/${hallSuffix}`;
        generateChecklistTable();
    });
}

// Configurer l'input file pour les photos
function setupPhotoInput() {
    DOM.photoInput.addEventListener('change', handlePhotoUpload);
}

// Générer le tableau de checklist
function generateChecklistTable() {
    const hall = appState.currentHall;
    const hallData = hallsData[hall];
    DOM.checklistBody.innerHTML = '';
    
    // Réinitialiser l'état
    appState.checklistData = [];
    appState.tasksPlanned = 0;
    appState.tasksDone = 0;
    appState.totalTasks = 0;
    
    // Parcourir chaque circuit et ses désignations
    for (const [circuit, designations] of Object.entries(hallData)) {
        // Ajouter une ligne d'en-tête pour le circuit
        const circuitRow = document.createElement('tr');
        circuitRow.className = 'hall-header';
        circuitRow.innerHTML = `
            <td colspan="7">${circuit}</td>
        `;
        DOM.checklistBody.appendChild(circuitRow);
        
        // Ajouter chaque désignation
        designations.forEach((designation, index) => {
            const taskId = `${hall}-${circuit.replace(/\s+/g, '-')}-${index}`;
            appState.totalTasks++;
            
            const row = document.createElement('tr');
            row.dataset.taskId = taskId;
            
            // Récupérer les données sauvegardées pour cette tâche
            const savedTask = appState.checklistData.find(t => t.id === taskId) || {};
            const hasBeforePhoto = appState.photoData[`${taskId}-before`];
            const hasAfterPhoto = appState.photoData[`${taskId}-after`];
            
            row.innerHTML = `
                <td>${hall}</td>
                <td>${designation}</td>
                <td>
                    <select class="planned-select" data-task="${taskId}">
                        <option value="non" ${savedTask.planned === 'non' ? 'selected' : ''}>Non</option>
                        <option value="oui" ${savedTask.planned === 'oui' ? 'selected' : ''}>Oui</option>
                    </select>
                </td>
                <td>
                    <div class="status-options">
                        <div class="status-option">
                            <input type="radio" name="status-${taskId}" class="status-checkbox done" value="fait" data-task="${taskId}" id="fait-${taskId}" ${savedTask.status === 'fait' ? 'checked' : ''}>
                            <label class="status-label done" for="fait-${taskId}">Fait</label>
                        </div>
                        <div class="status-option">
                            <input type="radio" name="status-${taskId}" class="status-checkbox not-done" value="non-fait" data-task="${taskId}" id="non-fait-${taskId}" ${savedTask.status === 'non-fait' ? 'checked' : ''}>
                            <label class="status-label not-done" for="non-fait-${taskId}">Non fait</label>
                        </div>
                        <div class="status-option">
                            <input type="radio" name="status-${taskId}" class="status-checkbox partial" value="partiel" data-task="${taskId}" id="partiel-${taskId}" ${savedTask.status === 'partiel' ? 'checked' : ''}>
                            <label class="status-label partial" for="partiel-${taskId}">Partiel</label>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="photo-upload">
                        <button type="button" class="photo-btn ${hasBeforePhoto ? 'has-photo' : ''}" data-task="${taskId}" data-type="before">
                            <i class="fas ${hasBeforePhoto ? 'fa-check-circle' : 'fa-camera'}"></i> 
                            ${hasBeforePhoto ? 'Voir photo' : 'Ajouter'}
                        </button>
                        <span class="photo-name" id="photo-before-${taskId}">${hasBeforePhoto ? 'Photo ajoutée' : ''}</span>
                    </div>
                </td>
                <td>
                    <div class="photo-upload">
                        <button type="button" class="photo-btn ${hasAfterPhoto ? 'has-photo' : ''}" data-task="${taskId}" data-type="after">
                            <i class="fas ${hasAfterPhoto ? 'fa-check-circle' : 'fa-camera'}"></i> 
                            ${hasAfterPhoto ? 'Voir photo' : 'Ajouter'}
                        </button>
                        <span class="photo-name" id="photo-after-${taskId}">${hasAfterPhoto ? 'Photo ajoutée' : ''}</span>
                    </div>
                </td>
                <td>
                    <textarea class="comment-input" placeholder="Ajouter un commentaire..." data-task="${taskId}">${savedTask.comment || ''}</textarea>
                </td>
            `;
            
            DOM.checklistBody.appendChild(row);
            
            // Ajouter la tâche à l'état de l'application
            appState.checklistData.push({
                id: taskId,
                hall: hall,
                circuit: circuit,
                designation: designation,
                planned: savedTask.planned || 'non',
                status: savedTask.status || null,
                photoBefore: hasBeforePhoto ? 'oui' : 'non',
                photoAfter: hasAfterPhoto ? 'oui' : 'non',
                comment: savedTask.comment || ''
            });
        });
    }
    
    // Ajouter les écouteurs d'événements aux éléments dynamiques
    addDynamicEventListeners();
    updateStats();
}

// Ajouter les écouteurs d'événements aux éléments dynamiques
function addDynamicEventListeners() {
    // Écouteurs pour les sélecteurs "Planifié"
    document.querySelectorAll('.planned-select').forEach(select => {
        select.addEventListener('change', function() {
            const taskId = this.dataset.task;
            const task = appState.checklistData.find(t => t.id === taskId);
            if (task) {
                task.planned = this.value;
                updateStats();
                saveToLocalStorage();
            }
        });
    });
    
    // Écouteurs pour les boutons radio de statut
    document.querySelectorAll('.status-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskId = this.dataset.task;
            const task = appState.checklistData.find(t => t.id === taskId);
            if (task) {
                task.status = this.value;
                updateStats();
                saveToLocalStorage();
            }
        });
    });
    
    // Écouteurs pour les boutons de photo
    document.querySelectorAll('.photo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = this.dataset.task;
            const type = this.dataset.type;
            
            // Si une photo existe déjà, l'afficher
            if (appState.photoData[`${taskId}-${type}`]) {
                showPhotoModal(taskId, type);
            } else {
                // Sinon, ouvrir le sélecteur de fichiers
                openPhotoSelector(taskId, type);
            }
        });
    });
    
    // Écouteurs pour les commentaires
    document.querySelectorAll('.comment-input').forEach(textarea => {
        const taskId = textarea.dataset.task;
        const task = appState.checklistData.find(t => t.id === taskId);
        
        if (task) {
            textarea.value = task.comment || '';
        }
        
        textarea.addEventListener('input', function() {
            const taskId = this.dataset.task;
            const task = appState.checklistData.find(t => t.id === taskId);
            if (task) {
                task.comment = this.value;
                saveToLocalStorage();
            }
        });
    });
}

// Ouvrir le sélecteur de fichiers pour les photos
function openPhotoSelector(taskId, type) {
    currentPhotoTask = taskId;
    currentPhotoType = type;
    DOM.photoInput.click();
}

// Gérer l'upload de photo
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showNotification('Veuillez sélectionner une image valide', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoData = e.target.result;
        const photoKey = `${currentPhotoTask}-${currentPhotoType}`;
        
        // Stocker la photo dans l'état
        appState.photoData[photoKey] = photoData;
        
        // Mettre à jour la tâche
        const task = appState.checklistData.find(t => t.id === currentPhotoTask);
        if (task) {
            if (currentPhotoType === 'before') {
                task.photoBefore = 'oui';
            } else {
                task.photoAfter = 'oui';
            }
        }
        
        // Mettre à jour l'interface
        updatePhotoButton(currentPhotoTask, currentPhotoType, true);
        
        // Sauvegarder
        saveToLocalStorage();
        
        // Réinitialiser l'input file
        DOM.photoInput.value = '';
        
        showNotification('Photo ajoutée avec succès!', 'success');
    };
    
    reader.readAsDataURL(file);
}

// Mettre à jour le bouton photo
function updatePhotoButton(taskId, type, hasPhoto) {
    const button = document.querySelector(`.photo-btn[data-task="${taskId}"][data-type="${type}"]`);
    const span = document.getElementById(`photo-${type}-${taskId}`);
    
    if (button && span) {
        if (hasPhoto) {
            button.classList.add('has-photo');
            button.innerHTML = `<i class="fas fa-check-circle"></i> Voir photo`;
            span.textContent = 'Photo ajoutée';
        } else {
            button.classList.remove('has-photo');
            button.innerHTML = `<i class="fas fa-camera"></i> Ajouter`;
            span.textContent = '';
        }
    }
}

// Afficher la photo en modal
function showPhotoModal(taskId, type) {
    const photoKey = `${taskId}-${type}`;
    const photoData = appState.photoData[photoKey];
    
    if (!photoData) return;
    
    // Créer le modal s'il n'existe pas
    let modal = document.getElementById('photo-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photo-modal';
        modal.className = 'photo-modal';
        modal.innerHTML = `
            <div class="photo-modal-content">
                <button class="photo-modal-close">&times;</button>
                <img class="photo-modal-img" src="" alt="Photo">
                <div class="photo-modal-info">
                    <p id="photo-modal-task"></p>
                    <p id="photo-modal-type"></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Fermer le modal
        modal.querySelector('.photo-modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    // Mettre à jour le contenu
    modal.querySelector('.photo-modal-img').src = photoData;
    
    // Trouver la tâche correspondante
    const task = appState.checklistData.find(t => t.id === taskId);
    if (task) {
        const taskInfo = `${task.hall} - ${task.designation}`;
        const typeInfo = `Photo ${type === 'before' ? 'avant' : 'après'} nettoyage`;
        
        modal.querySelector('#photo-modal-task').textContent = taskInfo;
        modal.querySelector('#photo-modal-type').textContent = typeInfo;
    }
    
    // Afficher le modal
    modal.classList.add('active');
}

// Configurer tous les écouteurs d'événements
function setupEventListeners() {
    // Boutons d'action
    DOM.resetAllButton.addEventListener('click', resetAll);
    DOM.saveLocalButton.addEventListener('click', saveToLocalStorage);
    DOM.loadLocalButton.addEventListener('click', loadFromLocalStorage);
    DOM.shareWhatsAppButton.addEventListener('click', shareWhatsApp);
    
    // Boutons d'export
    DOM.exportExcelButton.addEventListener('click', exportExcel);
    DOM.exportCSVButton.addEventListener('click', exportCSV);
    DOM.exportPDFButton.addEventListener('click', exportPDF);
    DOM.exportWordButton.addEventListener('click', exportWord);
    
    // Mise à jour des statistiques en temps réel
    DOM.staffCountInput.addEventListener('input', () => saveToLocalStorage());
    DOM.dateInput.addEventListener('change', updateCurrentDate);
    DOM.responsibleInput.addEventListener('input', () => saveToLocalStorage());
    DOM.startTimeInput.addEventListener('change', () => saveToLocalStorage());
    DOM.endTimeInput.addEventListener('change', () => saveToLocalStorage());
}

// Sauvegarder dans le localStorage
function saveToLocalStorage() {
    try {
        const saveData = {
            formData: {
                date: DOM.dateInput.value,
                responsible: DOM.responsibleInput.value,
                staffCount: DOM.staffCountInput.value,
                startTime: DOM.startTimeInput.value,
                endTime: DOM.endTimeInput.value,
                hall: DOM.storageHallSelect.value
            },
            checklistData: appState.checklistData,
            photoData: appState.photoData,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('ocpChecklistData', JSON.stringify(saveData));
        showNotification('Données sauvegardées localement!', 'success');
        
        // Mettre à jour l'état de sauvegarde dans le bouton
        DOM.saveLocalButton.innerHTML = `<i class="fas fa-check"></i> Sauvegardé`;
        setTimeout(() => {
            DOM.saveLocalButton.innerHTML = `<i class="fas fa-save"></i> Sauvegarder`;
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
        return false;
    }
}

// Charger depuis le localStorage
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('ocpChecklistData');
        if (!savedData) {
            showNotification('Aucune sauvegarde trouvée', 'info');
            return false;
        }
        
        const data = JSON.parse(savedData);
        
        // Charger les données du formulaire
        if (data.formData) {
            DOM.dateInput.value = data.formData.date || '';
            DOM.responsibleInput.value = data.formData.responsible || '';
            DOM.staffCountInput.value = data.formData.staffCount || '1';
            DOM.startTimeInput.value = data.formData.startTime || '';
            DOM.endTimeInput.value = data.formData.endTime || '';
            DOM.storageHallSelect.value = data.formData.hall || 'HE06 JFC4';
            
            // Mettre à jour le hall courant
            const hallSuffix = data.formData.hall === "HE03" ? "107F" : 
                             data.formData.hall === "HE06 JFC2" ? "107E" : "107D";
            appState.currentHall = `${data.formData.hall || 'HE06 JFC4'}/${hallSuffix}`;
        }
        
        // Charger les données du checklist
        if (data.checklistData) {
            appState.checklistData = data.checklistData;
        }
        
        // Charger les photos
        if (data.photoData) {
            appState.photoData = data.photoData;
        }
        
        // Regénérer le tableau avec les données sauvegardées
        generateChecklistTable();
        
        showNotification('Données chargées avec succès!', 'success');
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showNotification('Erreur lors du chargement des données', 'error');
        return false;
    }
}

// Mettre à jour les statistiques
function updateStats() {
    // Compter les tâches planifiées
    appState.tasksPlanned = appState.checklistData.filter(task => task.planned === 'oui').length;
    
    // Compter les tâches faites parmi celles planifiées
    appState.tasksDone = appState.checklistData.filter(task => 
        task.planned === 'oui' && task.status === 'fait').length;
    
    // Calculer le taux de réalisation
    const planningRate = appState.tasksPlanned > 0 ? 
        Math.round((appState.tasksDone / appState.tasksPlanned) * 100) : 0;
    
    // Mettre à jour l'affichage
    DOM.planningRateElement.textContent = `${planningRate}%`;
    DOM.tasksDoneElement.textContent = `${appState.tasksDone}/${appState.tasksPlanned}`;
    DOM.tasksPlannedElement.textContent = appState.tasksPlanned;
    
    // Mettre à jour la couleur en fonction du taux
    if (planningRate >= 80) {
        DOM.planningRateElement.style.color = '#4caf50';
    } else if (planningRate >= 50) {
        DOM.planningRateElement.style.color = '#ff9800';
    } else {
        DOM.planningRateElement.style.color = '#f44336';
    }
}

// Réinitialiser toutes les données
function resetAll() {
    if (confirm('Êtes-vous sûr de vouloir tout réinitialiser? Toutes les données non sauvegardées seront perdues.')) {
        // Réinitialiser le formulaire
        const today = new Date().toISOString().split('T')[0];
        DOM.dateInput.value = today;
        DOM.responsibleInput.value = '';
        DOM.staffCountInput.value = '1';
        DOM.startTimeInput.value = '';
        DOM.endTimeInput.value = '';
        
        // Réinitialiser l'état
        appState.photoData = {};
        
        // Réinitialiser le tableau
        generateChecklistTable();
        
        // Mettre à jour la date affichée
        updateCurrentDate();
        
        // Effacer le localStorage
        localStorage.removeItem('ocpChecklistData');
        
        showNotification('Toutes les données ont été réinitialisées.', 'success');
    }
}

// Exporter en Excel
function exportExcel() {
    showNotification('Préparation de l\'export Excel...', 'info');
    
    // Simuler un délai de traitement
    setTimeout(() => {
        const data = prepareExportData();
        const fileName = `checklist_nettoyage_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Pour le moment, nous allons créer un CSV comme simulation
        exportCSV();
        
        showNotification('Export Excel simulé avec succès!', 'success');
    }, 1000);
}

// Exporter en CSV
function exportCSV() {
    try {
        // Créer le contenu CSV
        let csvContent = "Hall,Lieu,Désignation,Planifié,Statut,Photo avant,Photo après,Commentaire\n";
        
        appState.checklistData.forEach(task => {
            const row = [
                `"${task.hall}"`,
                `"${task.circuit}"`,
                `"${task.designation}"`,
                `"${task.planned}"`,
                `"${task.status || 'Non défini'}"`,
                `"${task.photoBefore || 'Non'}"`,
                `"${task.photoAfter || 'Non'}"`,
                `"${task.comment.replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + '\n';
        });
        
        // Créer un blob et télécharger
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `checklist_nettoyage_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Export CSV réussi!', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'export CSV:', error);
        showNotification('Erreur lors de l\'export CSV', 'error');
    }
}

// Exporter en PDF
function exportPDF() {
    showNotification('Préparation de l\'export PDF...', 'info');
    
    // Simuler un délai de traitement
    setTimeout(() => {
        // Dans une application réelle, vous utiliseriez une bibliothèque comme jsPDF ou html2pdf
        showNotification('Export PDF simulé avec succès!', 'success');
    }, 1000);
}

// Exporter en Word
function exportWord() {
    showNotification('Préparation de l\'export Word...', 'info');
    
    // Simuler un délai de traitement
    setTimeout(() => {
        // Dans une application réelle, vous généreriez un document DOCX
        showNotification('Export Word simulé avec succès!', 'success');
    }, 1000);
}

// Partager via WhatsApp
function shareWhatsApp() {
    // Récupérer les informations du rapport
    const hall = DOM.storageHallSelect.value;
    const date = DOM.dateInput.value;
    const responsible = DOM.responsibleInput.value || 'Non spécifié';
    const planningRate = DOM.planningRateElement.textContent;
    const staffCount = DOM.staffCountInput.value;
    const startTime = DOM.startTimeInput.value || 'Non spécifiée';
    const endTime = DOM.endTimeInput.value || 'Non spécifiée';
    
    // Formater la date
    const formattedDate = new Date(date).toLocaleDateString('fr-FR');
    
    // Créer le message
    const message = `*Rapport de nettoyage OCP Group*
    
Hall: ${hall}
Date: ${formattedDate}
Responsable: ${responsible}
Effectif: ${staffCount} personne(s)
Heure de début: ${startTime}
Heure de fin: ${endTime}

*Statistiques:*
Taux de réalisation: ${planningRate}
Tâches planifiées: ${appState.tasksPlanned}
Tâches réalisées: ${appState.tasksDone}

*Détails des travaux:*
${generateTasksSummary()}

--- 
Rapport généré automatiquement par l'application OCP Checklist Nettoyage`;
    
    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // Ouvrir WhatsApp dans une nouvelle fenêtre
    window.open(whatsappUrl, '_blank');
    
    showNotification('Préparation du partage WhatsApp...', 'info');
}

// Préparer les données pour l'export
function prepareExportData() {
    return appState.checklistData.map(task => ({
        Hall: task.hall,
        Lieu: task.circuit,
        Désignation: task.designation,
        Planifié: task.planned === 'oui' ? 'Oui' : 'Non',
        Statut: task.status ? 
            (task.status === 'fait' ? 'Fait' : 
             task.status === 'non-fait' ? 'Non fait' : 'Partiel') : 'Non défini',
        'Photo avant': task.photoBefore ? 'Oui' : 'Non',
        'Photo après': task.photoAfter ? 'Oui' : 'Non',
        Commentaire: task.comment
    }));
}

// Générer un résumé des tâches pour le partage
function generateTasksSummary() {
    let summary = '';
    const plannedTasks = appState.checklistData.filter(task => task.planned === 'oui');
    
    if (plannedTasks.length === 0) {
        return 'Aucune tâche planifiée pour ce rapport.';
    }
    
    plannedTasks.forEach(task => {
        const status = task.status === 'fait' ? '✅' : 
                      task.status === 'non-fait' ? '❌' : 
                      task.status === 'partiel' ? '⚠️' : '⏳';
        summary += `${status} ${task.designation}\n`;
    });
    
    return summary;
}

// Afficher une notification
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Fermer la notification au clic
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Fermer automatiquement après 5 secondes
    document.body.appendChild(notification);
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Démarrer l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', initApp);