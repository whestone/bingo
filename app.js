// ========================================
// Bingo App - Main Application Logic
// ========================================

class BingoApp {
    constructor() {
        this.gridSize = 5;
        this.jokerCount = 1;
        this.cells = [];
        this.markedCells = new Set();
        this.currentEditCell = null;
        this.bingoCount = 0;
        this.currentBingoStates = new Set();
        this.fieldPool = [];
        this.presets = []; // { name: string, fields: string[] }
        this.currentPresetName = "";

        this.initializeElements();
        this.attachEventListeners();
        this.loadFromStorage();
        this.generateBoard();
        this.checkViewMode();
    }

    // ========================================
    // Initialization
    // ========================================
    initializeElements() {
        // Settings
        this.gridSizeSelect = document.getElementById('gridSize');
        this.jokerCountInput = document.getElementById('jokerCount');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.toggleSettingsBtn = document.getElementById('toggleSettings');

        // Control buttons
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.bulkEditBtn = document.getElementById('bulkEditBtn');

        // Board
        this.bingoBoard = document.getElementById('bingoBoard');

        // Stats
        this.markedCountEl = document.getElementById('markedCount');
        this.totalCountEl = document.getElementById('totalCount');
        this.bingoCountEl = document.getElementById('bingoCount');

        // Edit Modal
        this.editModal = document.getElementById('editModal');
        this.cellTextarea = document.getElementById('cellText');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelEditBtn = document.getElementById('cancelEdit');
        this.saveEditBtn = document.getElementById('saveEdit');

        // Bulk Edit Modal
        this.bulkEditModal = document.getElementById('bulkEditModal');
        this.bulkEditText = document.getElementById('bulkEditText');
        this.closeBulkEditBtn = document.getElementById('closeBulkEdit');
        this.cancelBulkEditBtn = document.getElementById('cancelBulkEdit');
        this.saveBulkEditBtn = document.getElementById('saveBulkEdit');
        this.saveDefaultBtn = document.getElementById('saveDefaultBtn');
        this.loadDefaultBtn = document.getElementById('loadDefaultBtn');
        this.bulkLineCount = document.getElementById('bulkLineCount');
        this.bulkRequired = document.getElementById('bulkRequired');

        // Presets & XML
        this.presetSelect = document.getElementById('presetSelect');
        this.saveNewPresetBtn = document.getElementById('saveNewPresetBtn');
        this.deletePresetBtn = document.getElementById('deletePresetBtn');
        this.importXmlBtn = document.getElementById('importXmlBtn');
        this.exportXmlBtn = document.getElementById('exportXmlBtn');
        this.xmlFileInput = document.getElementById('xmlFileInput');

        // Bingo Modal
        this.bingoModal = document.getElementById('bingoModal');
        this.closeBingoBtn = document.getElementById('closeBingo');
        this.copyBoardUrlBtn = document.getElementById('copyBoardUrlBtn');
    }

    attachEventListeners() {
        // Settings
        this.gridSizeSelect.addEventListener('change', () => this.handleGridSizeChange());
        this.jokerCountInput.addEventListener('change', () => this.handleJokerCountChange());
        this.toggleSettingsBtn.addEventListener('click', () => this.toggleSettings());

        // Control buttons
        this.shuffleBtn.addEventListener('click', () => this.shuffleCells());
        this.resetBtn.addEventListener('click', () => this.resetBoard());
        this.bulkEditBtn.addEventListener('click', () => this.openBulkEditModal());

        // Edit Modal
        this.closeModalBtn.addEventListener('click', () => this.closeEditModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());

        // Bulk Edit Modal
        this.closeBulkEditBtn.addEventListener('click', () => this.closeBulkEditModal());
        this.cancelBulkEditBtn.addEventListener('click', () => this.closeBulkEditModal());
        this.saveBulkEditBtn.addEventListener('click', () => this.saveBulkEdit());

        // Presets & XML
        this.presetSelect.addEventListener('change', () => this.handlePresetChange());
        this.saveNewPresetBtn.addEventListener('click', () => this.saveCurrentAsPreset());
        this.deletePresetBtn.addEventListener('click', () => this.deleteCurrentPreset());
        this.exportXmlBtn.addEventListener('click', () => this.exportPresetsToXML());
        this.importXmlBtn.addEventListener('click', () => this.xmlFileInput.click());
        this.xmlFileInput.addEventListener('change', (e) => this.handleXmlImport(e));

        this.bulkEditText.addEventListener('input', () => this.updateBulkLineCount());

        // Bingo Modal
        this.closeBingoBtn.addEventListener('click', () => this.closeBingoModal());
        this.copyBoardUrlBtn.addEventListener('click', () => this.copyBoardUrl());

        // Close modals on outside click
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeEditModal();
        });

        this.bulkEditModal.addEventListener('click', (e) => {
            if (e.target === this.bulkEditModal) this.closeBulkEditModal();
        });

        this.bingoModal.addEventListener('click', (e) => {
            if (e.target === this.bingoModal) this.closeBingoModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditModal();
                this.closeBulkEditModal();
                this.closeBingoModal();
            }
        });

        // Listen for storage changes to sync OBS/Browser
        window.addEventListener('storage', (e) => {
            if (e.key === 'bingoApp') {
                this.loadFromStorage();
            }
        });
    }

    // ========================================
    // Board Generation
    // ========================================
    generateBoard() {
        this.bingoBoard.innerHTML = '';
        this.bingoBoard.style.gridTemplateColumns = `auto repeat(${this.gridSize}, minmax(0, 1fr))`;
        this.bingoBoard.style.gridTemplateRows = `auto repeat(${this.gridSize}, minmax(0, 1fr))`;

        const totalCells = this.gridSize * this.gridSize;

        // Initialize cells if needed
        if (this.cells.length !== totalCells) {
            this.cells = Array(totalCells).fill('').map((_, i) => ({
                text: `Feld ${i + 1}`,
                isJoker: false,
                isMarked: false
            }));
            this.assignJokers();
        }

        // Add top-left corner (empty)
        const cornerCell = document.createElement('div');
        cornerCell.className = 'board-label corner-label';
        this.bingoBoard.appendChild(cornerCell);

        // Add column labels (A, B, C, ...)
        for (let col = 0; col < this.gridSize; col++) {
            const colLabel = document.createElement('div');
            colLabel.className = 'board-label col-label';
            colLabel.textContent = String.fromCharCode(65 + col); // A, B, C, ...
            this.bingoBoard.appendChild(colLabel);
        }

        // Add rows with row labels and cells
        for (let row = 0; row < this.gridSize; row++) {
            // Add row label (1, 2, 3, ...)
            const rowLabel = document.createElement('div');
            rowLabel.className = 'board-label row-label';
            rowLabel.textContent = (row + 1).toString();
            this.bingoBoard.appendChild(rowLabel);

            // Add cells for this row
            for (let col = 0; col < this.gridSize; col++) {
                const index = row * this.gridSize + col;
                const cell = this.cells[index];
                const cellEl = document.createElement('div');
                cellEl.className = 'bingo-cell';
                cellEl.dataset.index = index;

                if (cell.isJoker) {
                    cellEl.classList.add('joker');
                    cellEl.innerHTML = `
                        <div class="cell-content">
                            <i class="fas fa-star joker-icon"></i>
                        </div>
                    `;
                } else {
                    cellEl.innerHTML = `
                        <div class="cell-content">
                            <span class="cell-text">${cell.text}</span>
                        </div>
                    `;
                }

                if (cell.isMarked) {
                    cellEl.classList.add('marked');
                }

                // The 'empty' class logic was removed in the provided snippet, so I'm omitting it.
                // if (!cell.text.trim()) {
                //     cellEl.classList.add('empty');
                // }

                // Event listeners
                cellEl.addEventListener('click', () => this.toggleCell(index));
                cellEl.addEventListener('dblclick', (e) => {
                    e.preventDefault();
                    if (!cell.isJoker) {
                        this.openEditModal(index);
                    }
                });

                this.bingoBoard.appendChild(cellEl);
            }
        }

        this.updateStats();
    }

    assignJokers() {
        // Save all current non-joker texts
        const savedTexts = this.cells.map((cell, index) => ({
            index,
            text: cell.text,
            wasJoker: cell.isJoker
        }));

        // Reset all jokers and marked status
        this.cells.forEach(cell => {
            cell.isJoker = false;
            cell.isMarked = false;
        });

        // Assign new jokers randomly
        const totalCells = this.cells.length;
        const jokerIndices = new Set();

        while (jokerIndices.size < Math.min(this.jokerCount, totalCells)) {
            const randomIndex = Math.floor(Math.random() * totalCells);
            jokerIndices.add(randomIndex);
        }

        // Restore non-joker texts and set joker cells
        this.cells.forEach((cell, index) => {
            if (jokerIndices.has(index)) {
                // This is a joker cell
                cell.isJoker = true;
                cell.isMarked = true;
                cell.text = 'JOKER';
            } else {
                // This is a normal cell - restore its text if it wasn't a joker before
                const saved = savedTexts[index];
                if (!saved.wasJoker && saved.text !== 'JOKER') {
                    cell.text = saved.text;
                } else {
                    // If it was a joker or had JOKER text, give it a default name
                    cell.text = `Feld ${index + 1}`;
                }
            }
        });

        this.markedCells.clear();
        jokerIndices.forEach(index => this.markedCells.add(index));
    }

    // ========================================
    // Cell Interaction
    // ========================================
    toggleCell(index) {
        const cell = this.cells[index];

        // Jokers are always marked
        if (cell.isJoker) return;

        cell.isMarked = !cell.isMarked;

        const cellEl = this.bingoBoard.querySelector(`[data-index="${index}"]`); // Use data-index for selection
        cellEl.classList.toggle('marked');

        if (cell.isMarked) {
            this.markedCells.add(index);
        } else {
            this.markedCells.delete(index);
        }

        this.handleBingoCheck(); // Call new bingo check handler
        this.saveToStorage();
    }

    openEditModal(index) {
        this.currentEditCell = index;
        const cell = this.cells[index];
        this.cellTextarea.value = cell.text === `Feld ${index + 1}` ? '' : cell.text;
        this.editModal.classList.add('active');
        this.cellTextarea.focus();
    }

    closeEditModal() {
        this.editModal.classList.remove('active');
        this.currentEditCell = null;
        this.cellTextarea.value = '';
    }

    saveEdit() {
        if (this.currentEditCell === null) return;

        const newText = this.cellTextarea.value.trim();
        const cell = this.cells[this.currentEditCell];

        cell.text = newText || `Feld ${this.currentEditCell + 1}`;

        const cellEl = this.bingoBoard.querySelector(`[data-index="${this.currentEditCell}"]`);
        cellEl.querySelector('.cell-text').textContent = cell.text; // Update span inside cell-content

        // The 'empty' class logic was removed in the provided snippet, so I'm omitting it.
        // if (!newText) {
        //     cellEl.classList.add('empty');
        // } else {
        //     cellEl.classList.remove('empty');
        // }

        this.closeEditModal();
        this.saveToStorage();
    }

    // ========================================
    // Bulk Edit
    // ========================================
    openBulkEditModal() {
        // If pool is empty, initialize it from current cells
        if (this.fieldPool.length === 0) {
            this.fieldPool = this.cells
                .filter(cell => !cell.isJoker)
                .map(cell => cell.text);
        }

        this.bulkEditText.value = this.fieldPool.join('\n');
        this.renderPresetOptions();
        this.updateBulkLineCount();
        this.bulkEditModal.classList.add('active');
        this.bulkEditText.focus();
    }

    closeBulkEditModal() {
        this.bulkEditModal.classList.remove('active');
        this.bulkEditText.value = '';
    }

    updateBulkLineCount() {
        const lines = this.bulkEditText.value.split('\n').filter(line => line.trim());
        const required = this.gridSize * this.gridSize - this.jokerCount;

        this.bulkLineCount.innerHTML = `<i class="fas fa-list-ol"></i> ${lines.length} Zeilen`;
        this.bulkRequired.innerHTML = `<i class="fas fa-exclamation-circle"></i> Benötigt: ${required}`;

        if (lines.length === required) {
            this.bulkLineCount.style.color = 'var(--color-success)';
        } else if (lines.length > required) {
            this.bulkLineCount.style.color = 'var(--color-warning)';
        } else {
            this.bulkLineCount.style.color = 'var(--color-text-secondary)';
        }
    }

    saveBulkEdit() {
        const lines = this.bulkEditText.value.split('\n').map(line => line.trim()).filter(line => line);
        const required = this.gridSize * this.gridSize - this.jokerCount;

        if (lines.length < required) {
            alert(`Bitte bieten Sie mindestens ${required} Zeilen an. Aktuell: ${lines.length}`);
            return;
        }

        // Keep ALL lines in the pool
        this.fieldPool = lines;

        // Shuffle and pick for current board
        const shuffled = [...this.fieldPool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selected = shuffled.slice(0, required);

        // Apply to cells
        let lineIndex = 0;
        this.cells.forEach(cell => {
            if (!cell.isJoker) {
                cell.text = selected[lineIndex++] || `Feld ${lineIndex}`;
                cell.isMarked = false; // Reset marked status when fields change
            }
        });

        this.currentBingoStates.clear();
        this.generateBoard();
        this.closeBulkEditModal();
        this.saveToStorage();
        this.showNotification('Pool gespeichert und Grid neu gewürfelt! ✅');
    }

    // ========================================
    // Preset Management
    // ========================================
    handlePresetChange() {
        const selectedName = this.presetSelect.value;
        if (!selectedName) return;

        const preset = this.presets.find(p => p.name === selectedName);
        if (preset) {
            if (this.bulkEditText.value.trim() && !confirm(`Aktuelle Änderungen verwerfen und Preset "${selectedName}" laden?`)) {
                this.presetSelect.value = this.currentPresetName || "";
                return;
            }
            this.bulkEditText.value = preset.fields.join('\n');
            this.currentPresetName = selectedName;
            this.updateBulkLineCount();
        }
    }

    saveCurrentAsPreset() {
        const content = this.bulkEditText.value.trim();
        if (!content) {
            this.showNotification('Kein Inhalt zum Speichern vorhanden! ❌');
            return;
        }

        const name = prompt("Name für das Preset:", this.currentPresetName || "");
        if (!name) return;

        const fields = content.split('\n').map(f => f.trim()).filter(f => f);
        const existingIndex = this.presets.findIndex(p => p.name === name);

        if (existingIndex >= 0) {
            if (!confirm(`Preset "${name}" existiert bereits. Überschreiben?`)) return;
            this.presets[existingIndex].fields = fields;
        } else {
            this.presets.push({ name, fields });
        }

        this.currentPresetName = name;
        this.renderPresetOptions();
        this.presetSelect.value = name;
        this.saveToStorage();
        this.showNotification(`Preset "${name}" gespeichert! 💾`);
    }

    deleteCurrentPreset() {
        const name = this.presetSelect.value;
        if (!name) {
            this.showNotification('Bitte wählen Sie ein Preset zum Löschen aus! ❌');
            return;
        }

        if (!confirm(`Möchten Sie das Preset "${name}" wirklich löschen?`)) return;

        this.presets = this.presets.filter(p => p.name !== name);
        this.currentPresetName = "";
        this.renderPresetOptions();
        this.saveToStorage();
        this.showNotification(`Preset "${name}" gelöscht! �️`);
    }

    renderPresetOptions() {
        const currentValue = this.presetSelect.value;
        this.presetSelect.innerHTML = '<option value="">-- Preset wählen --</option>';

        // Sort presets by name
        this.presets.sort((a, b) => a.name.localeCompare(b.name));

        this.presets.forEach(p => {
            const option = document.createElement('option');
            option.value = p.name;
            option.textContent = p.name;
            this.presetSelect.appendChild(option);
        });

        if (currentValue && this.presets.some(p => p.name === currentValue)) {
            this.presetSelect.value = currentValue;
        }
    }

    // ========================================
    // XML Export / Import
    // ========================================
    exportPresetsToXML() {
        if (this.presets.length === 0) {
            this.showNotification('Keine Presets zum Exportieren vorhanden! ❌');
            return;
        }

        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<Presets>\n';

        this.presets.forEach(preset => {
            xmlContent += `    <Preset name="${this.escapeXml(preset.name)}">\n`;
            preset.fields.forEach(field => {
                xmlContent += `        <Field>${this.escapeXml(field)}</Field>\n`;
            });
            xmlContent += '    </Preset>\n';
        });

        xmlContent += '</Presets>';

        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bingo_presets.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Presets als XML exportiert! 📤');
    }

    handleXmlImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.parsePresetsFromXml(content, false); // Manual import -> ask questions if needed
            this.xmlFileInput.value = ''; // Reset for same file re-import
        };
        reader.readAsText(file);
    }

    parsePresetsFromXml(xmlString, isInitialLoad = true) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");

            // Check for parse errors
            const parseError = xmlDoc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                throw new Error("Fehler beim Parsen der XML-Datei.");
            }

            const presetNodes = xmlDoc.getElementsByTagName("Preset");
            if (presetNodes.length === 0) {
                throw new Error("Keine Presets in der XML-Datei gefunden.");
            }

            const newPresets = [];
            for (let i = 0; i < presetNodes.length; i++) {
                const name = presetNodes[i].getAttribute("name");
                const fieldNodes = presetNodes[i].getElementsByTagName("Field");
                const fields = [];
                for (let j = 0; j < fieldNodes.length; j++) {
                    fields.push(fieldNodes[j].textContent);
                }
                newPresets.push({ name, fields });
            }

            // Logic for merging/overwriting
            if (this.presets.length === 0 || isInitialLoad) {
                // Background load or empty list: just add them
                newPresets.forEach(np => {
                    const idx = this.presets.findIndex(p => p.name === np.name);
                    if (idx === -1) {
                        this.presets.push(np);
                    }
                });
            } else if (confirm(`${newPresets.length} Presets gefunden. Bestehende Presets überschreiben? (Abbrechen fügt sie hinzu)`)) {
                this.presets = newPresets;
            } else {
                // Merge without duplicates (by name)
                newPresets.forEach(np => {
                    const idx = this.presets.findIndex(p => p.name === np.name);
                    if (idx >= 0) {
                        this.presets[idx].fields = np.fields;
                    } else {
                        this.presets.push(np);
                    }
                });
            }

            this.renderPresetOptions();
            this.saveToStorage();
            if (!isInitialLoad) {
                this.showNotification('Presets erfolgreich importiert! 📥');
            }
        } catch (error) {
            console.error(error);
            if (!isInitialLoad) {
                alert("Fehler beim Importieren der XML: " + error.message);
            }
        }
    }

    async fetchInitialPresets() {
        try {
            // Add timestamp to bypass cache
            const response = await fetch(`presets.xml?t=${Date.now()}`);
            if (response.ok) {
                const xmlString = await response.text();
                this.parsePresetsFromXml(xmlString, true); // Silent load
            }
        } catch (e) {
            console.warn("Konnte initial presets.xml nicht laden (normal bei lokalem Dateizugriff ohne Webserver).", e);
        }
    }

    escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    // ========================================
    // Game Logic
    // ========================================
    checkBingo() {
        const bingoLines = [];

        // Check rows
        for (let row = 0; row < this.gridSize; row++) {
            const rowCells = [];
            for (let col = 0; col < this.gridSize; col++) {
                rowCells.push(row * this.gridSize + col);
            }
            if (rowCells.every(i => this.cells[i].isMarked)) {
                bingoLines.push({ type: 'row', index: row, cells: rowCells });
            }
        }

        // Check columns
        for (let col = 0; col < this.gridSize; col++) {
            const colCells = [];
            for (let row = 0; row < this.gridSize; row++) {
                colCells.push(row * this.gridSize + col);
            }
            if (colCells.every(i => this.cells[i].isMarked)) {
                bingoLines.push({ type: 'col', index: col, cells: colCells });
            }
        }

        // Check diagonal (top-left to bottom-right)
        const diag1Cells = [];
        for (let i = 0; i < this.gridSize; i++) {
            diag1Cells.push(i * this.gridSize + i);
        }
        if (diag1Cells.every(i => this.cells[i].isMarked)) {
            bingoLines.push({ type: 'diag1', cells: diag1Cells });
        }

        // Check diagonal (top-right to bottom-left)
        const diag2Cells = [];
        for (let i = 0; i < this.gridSize; i++) {
            diag2Cells.push(i * this.gridSize + (this.gridSize - 1 - i));
        }
        if (diag2Cells.every(i => this.cells[i].isMarked)) {
            bingoLines.push({ type: 'diag2', cells: diag2Cells });
        }

        return bingoLines;
    }

    handleBingoCheck() {
        const bingoLines = this.checkBingo();
        const newActiveBingoStates = new Set();
        let newBingoAchieved = false;

        bingoLines.forEach(line => {
            const lineKey = `${line.type}-${line.index !== undefined ? line.index : ''}`;
            newActiveBingoStates.add(lineKey);
            if (!this.currentBingoStates.has(lineKey)) {
                newBingoAchieved = true;
            }
        });

        this.currentBingoStates = newActiveBingoStates;

        if (newBingoAchieved) {
            this.showBingoModal();
        }

        this.updateStats();
    }

    showBingoModal() {
        if (this.bingoModal.classList.contains('active')) return;
        this.bingoModal.classList.add('active');
        this.createConfetti();
        this.saveToStorage();
    }

    closeBingoModal() {
        if (!this.bingoModal.classList.contains('active')) return;
        this.bingoModal.classList.remove('active');
        this.saveToStorage();
    }

    createConfetti() {
        const confettiContainer = this.bingoModal.querySelector('.confetti');
        confettiContainer.innerHTML = '';

        const colors = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171'];

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = -10 + 'px';
            confetti.style.borderRadius = '50%';
            confetti.style.animation = `fall ${2 + Math.random() * 3}s linear infinite`;
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confettiContainer.appendChild(confetti);
        }

        // Add animation
        if (!document.getElementById('confetti-animation')) {
            const style = document.createElement('style');
            style.id = 'confetti-animation';
            style.textContent = `
                @keyframes fall {
                    to {
                        transform: translateY(600px) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ========================================
    // Actions
    // ========================================
    copyBoardUrl() {
        const url = new URL(window.location.href);
        url.search = '?view=board';
        url.hash = '';
        const boardUrl = url.toString();

        navigator.clipboard.writeText(boardUrl).then(() => {
            this.showNotification('Board-URL in die Zwischenablage kopiert! 📋');
        }).catch(err => {
            console.error('Fehler beim Kopieren der URL: ', err);
            // Fallback for older browsers or if permissions fail
            alert('Kopieren fehlgeschlagen. Bitte kopieren Sie die URL aus der Adresszeile und fügen Sie "?view=board" am Ende hinzu.');
        });
    }

    shuffleCells() {
        // Ensure we have a pool
        if (this.fieldPool.length === 0) {
            this.fieldPool = this.cells
                .filter(cell => !cell.isJoker)
                .map(cell => cell.text);
        }

        const required = this.gridSize * this.gridSize - this.jokerCount;

        // Pick random items from pool
        const shuffledPool = [...this.fieldPool];
        for (let i = shuffledPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
        }
        const selected = shuffledPool.slice(0, required);

        // Reassign jokers to new random positions
        this.assignJokers();

        // Apply selected texts to non-joker cells
        let textIndex = 0;
        this.cells.forEach(cell => {
            if (!cell.isJoker && textIndex < selected.length) {
                cell.text = selected[textIndex++];
                cell.isMarked = false;
            } else if (cell.isJoker) {
                cell.isMarked = true;
            }
        });

        this.currentBingoStates.clear();
        this.generateBoard();
        this.saveToStorage();

        this.showNotification('Felder wurden aus dem Pool neu gewürfelt! 🎲');
    }

    resetBoard() {
        if (!confirm('Möchten Sie wirklich alle Markierungen zurücksetzen?')) {
            return;
        }

        this.cells.forEach(cell => {
            if (!cell.isJoker) {
                cell.isMarked = false;
            }
        });

        this.markedCells.clear();
        this.cells.forEach((cell, index) => {
            if (cell.isJoker) {
                this.markedCells.add(index);
            }
        });

        this.currentBingoStates.clear();

        this.generateBoard();
        this.saveToStorage();
        this.showNotification('Board wurde zurückgesetzt! 🔄');
    }

    // ========================================
    // Settings
    // ========================================
    handleGridSizeChange() {
        const newSize = parseInt(this.gridSizeSelect.value);

        if (newSize !== this.gridSize) {
            if (!confirm('Das Ändern der Größe erstellt ein neues Board. Fortfahren?')) {
                this.gridSizeSelect.value = this.gridSize;
                return;
            }

            this.gridSize = newSize;
            const totalCells = this.gridSize * this.gridSize;
            const required = totalCells - this.jokerCount;

            // Ensure we have a pool to pick from
            if (this.fieldPool.length === 0) {
                this.fieldPool = this.cells
                    .filter(cell => !cell.isJoker)
                    .map(cell => cell.text);
            }

            // Shuffle and pick from pool
            const shuffled = [...this.fieldPool];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const selected = shuffled.slice(0, required);

            this.cells = Array(totalCells).fill('').map((_, i) => ({
                text: selected[i] || `Feld ${i + 1}`,
                isJoker: false,
                isMarked: false
            }));

            // Adjust joker count if necessary
            if (this.jokerCount > totalCells) {
                this.jokerCount = Math.floor(totalCells / 5);
                this.jokerCountInput.value = this.jokerCount;
            }

            this.assignJokers();
            this.generateBoard();
            this.saveToStorage();

            this.showNotification(`Größe auf ${this.gridSize}x${this.gridSize} geändert! 📏`);
        }
    }

    handleJokerCountChange() {
        const newCount = parseInt(this.jokerCountInput.value);
        const totalCells = this.gridSize * this.gridSize;

        if (newCount < 0) {
            this.jokerCountInput.value = 0;
            return;
        }

        if (newCount > totalCells) {
            this.jokerCountInput.value = totalCells;
            this.jokerCount = totalCells;
        } else {
            this.jokerCount = newCount;
        }

        this.assignJokers();
        this.generateBoard();
        this.saveToStorage();
    }

    toggleSettings() {
        this.settingsPanel.classList.toggle('hidden');

        if (this.settingsPanel.classList.contains('hidden')) {
            this.toggleSettingsBtn.innerHTML = '<i class="fas fa-cog btn-icon"></i> Einstellungen anzeigen';
        } else {
            this.toggleSettingsBtn.innerHTML = '<i class="fas fa-cog btn-icon"></i> Einstellungen ausblenden';
        }
    }

    // ========================================
    // Storage
    // ========================================
    saveToStorage() {
        const data = {
            gridSize: this.gridSize,
            jokerCount: this.jokerCount,
            cells: this.cells,
            fieldPool: this.fieldPool,
            presets: this.presets,
            currentPresetName: this.currentPresetName,
            // bingoCount: this.bingoCount,
            currentBingoStates: [...this.currentBingoStates],
            isBingoModalOpen: this.bingoModal.classList.contains('active')
        };

        localStorage.setItem('bingoApp', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('bingoApp');

        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.gridSize = data.gridSize || 5;
                this.jokerCount = data.jokerCount || 1;
                this.cells = data.cells || [];
                this.fieldPool = data.fieldPool || [];
                this.presets = data.presets || [];
                this.currentPresetName = data.currentPresetName || "";

                // this.bingoCount = data.bingoCount || 0; // No longer loaded as cumulative
                this.currentBingoStates = new Set(data.currentBingoStates || []);
                const isBingoModalOpen = data.isBingoModalOpen || false;

                this.gridSizeSelect.value = this.gridSize;
                this.jokerCountInput.value = this.jokerCount;

                // Clean up any cells that have JOKER text but aren't actually jokers
                this.cells.forEach((cell, index) => {
                    if (!cell.isJoker && cell.text === 'JOKER') {
                        cell.text = `Feld ${index + 1}`;
                    }
                });

                // Rebuild marked cells set
                this.markedCells.clear();
                this.cells.forEach((cell, index) => {
                    if (cell.isMarked) {
                        this.markedCells.add(index);
                    }
                });

                this.generateBoard();

                if (isBingoModalOpen) {
                    this.bingoModal.classList.add('active');
                    this.createConfetti();
                } else {
                    this.bingoModal.classList.remove('active');
                }
            } catch (e) {
                console.error('Fehler beim Laden:', e);
            }
        }

        // Always try to load initial presets if none are present
        if (this.presets.length === 0) {
            this.fetchInitialPresets();
        }

        this.renderPresetOptions();
    }

    // ========================================
    // Stats
    // ========================================
    updateStats() {
        const markedCount = this.cells.filter(cell => cell.isMarked).length;
        this.markedCountEl.textContent = markedCount;
        this.totalCountEl.textContent = this.cells.length;

        // Count active bingos (not cumulative)
        const activeBingos = this.checkBingo().length;
        this.bingoCountEl.textContent = activeBingos;
    }

    // ========================================
    // Notifications
    // ========================================
    showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            font-weight: 600;
            z-index: 2000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Add animations if not exists
        if (!document.getElementById('notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ========================================
    // View Modes
    // ========================================
    checkViewMode() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'board') {
            document.body.classList.add('board-only-view');
        }
    }
}

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    new BingoApp();
});
