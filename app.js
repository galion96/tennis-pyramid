// Tennis Pyramid Application
class TennisPyramid {
    constructor() {
        this.rows = 4; // Default number of rows
        this.players = []; // Array of player names indexed by position
        this.pyramidEl = document.getElementById('pyramid');
        this.draggedBlock = null;
        this.draggedPosition = null;
        this.isSharing = false; // Prevent multiple share attempts
        this.contacts = this.loadContacts(); // Load saved contacts
        this.pendingImageBlob = null; // Store image for sharing

        this.init();
        this.setupEventListeners();
    }

    loadContacts() {
        const saved = localStorage.getItem('pyramidContacts');
        return saved ? JSON.parse(saved) : [];
    }

    saveContacts() {
        localStorage.setItem('pyramidContacts', JSON.stringify(this.contacts));
    }

    addContact(name, phone) {
        // Clean phone number (remove spaces, dashes)
        phone = phone.replace(/[\s\-\(\)]/g, '');
        if (!phone.startsWith('+')) {
            phone = '+' + phone;
        }
        this.contacts.push({ name, phone, id: Date.now() });
        this.saveContacts();
    }

    deleteContact(id) {
        this.contacts = this.contacts.filter(c => c.id !== id);
        this.saveContacts();
    }

    init() {
        // Initialize players array with default names
        const totalPositions = this.getTotalPositions();
        for (let i = 0; i < totalPositions; i++) {
            if (!this.players[i]) {
                this.players[i] = `Player ${i + 1}`;
            }
        }
        this.renderPyramid();
    }

    getTotalPositions() {
        // Sum of 1 + 2 + 3 + ... + rows
        return (this.rows * (this.rows + 1)) / 2;
    }

    renderPyramid() {
        this.pyramidEl.innerHTML = '';
        let position = 1;

        for (let row = 1; row <= this.rows; row++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'pyramid-row';

            for (let col = 0; col < row; col++) {
                const block = this.createBlock(position, this.players[position - 1]);
                rowEl.appendChild(block);
                position++;
            }

            this.pyramidEl.appendChild(rowEl);
        }
    }

    createBlock(position, playerName) {
        const block = document.createElement('div');
        block.className = 'block';
        block.draggable = true;
        block.dataset.position = position;

        const positionEl = document.createElement('div');
        positionEl.className = 'block-position';
        positionEl.textContent = position;

        const nameEl = document.createElement('div');
        nameEl.className = 'block-name';
        nameEl.contentEditable = true;
        nameEl.textContent = playerName;
        nameEl.dataset.pos = position;

        // Prevent drag when editing name
        nameEl.addEventListener('mousedown', (e) => e.stopPropagation());
        nameEl.addEventListener('touchstart', (e) => e.stopPropagation());

        // Save name on blur
        nameEl.addEventListener('blur', (e) => {
            const pos = parseInt(block.dataset.position);
            this.players[pos - 1] = e.target.textContent || `Player ${pos}`;
        });

        // Prevent newlines in name
        nameEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameEl.blur();
            }
        });

        block.appendChild(positionEl);
        block.appendChild(nameEl);

        // Drag events
        block.addEventListener('dragstart', (e) => this.handleDragStart(e, block));
        block.addEventListener('dragend', (e) => this.handleDragEnd(e, block));
        block.addEventListener('dragover', (e) => this.handleDragOver(e));
        block.addEventListener('dragenter', (e) => this.handleDragEnter(e, block));
        block.addEventListener('dragleave', (e) => this.handleDragLeave(e, block));
        block.addEventListener('drop', (e) => this.handleDrop(e, block));

        // Touch events for mobile
        block.addEventListener('touchstart', (e) => this.handleTouchStart(e, block));
        block.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        block.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        return block;
    }

    // Drag handlers
    handleDragStart(e, block) {
        this.draggedBlock = block;
        this.draggedPosition = parseInt(block.dataset.position);
        block.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', block.dataset.position);
    }

    handleDragEnd(e, block) {
        block.classList.remove('dragging');
        this.draggedBlock = null;
        this.draggedPosition = null;

        // Remove drag-over class from all blocks
        document.querySelectorAll('.block').forEach(b => b.classList.remove('drag-over'));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e, block) {
        e.preventDefault();
        if (block !== this.draggedBlock) {
            block.classList.add('drag-over');
        }
    }

    handleDragLeave(e, block) {
        block.classList.remove('drag-over');
    }

    handleDrop(e, targetBlock) {
        e.preventDefault();
        targetBlock.classList.remove('drag-over');

        if (!this.draggedBlock || targetBlock === this.draggedBlock) return;

        const fromPosition = this.draggedPosition;
        const toPosition = parseInt(targetBlock.dataset.position);

        this.swapPositions(fromPosition, toPosition);
    }

    // Touch handlers for mobile
    handleTouchStart(e, block) {
        // Don't start drag if touching the name input
        if (e.target.classList.contains('block-name')) return;

        this.draggedBlock = block;
        this.draggedPosition = parseInt(block.dataset.position);
        block.classList.add('dragging');

        // Store initial touch position
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    handleTouchMove(e) {
        if (!this.draggedBlock) return;
        e.preventDefault();

        const touch = e.touches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);

        // Remove drag-over from all blocks
        document.querySelectorAll('.block').forEach(b => b.classList.remove('drag-over'));

        // Find the block element
        const targetBlock = elementBelow?.closest('.block');
        if (targetBlock && targetBlock !== this.draggedBlock) {
            targetBlock.classList.add('drag-over');
            this.touchTargetBlock = targetBlock;
        } else {
            this.touchTargetBlock = null;
        }
    }

    handleTouchEnd(e) {
        if (!this.draggedBlock) return;

        this.draggedBlock.classList.remove('dragging');

        if (this.touchTargetBlock) {
            this.touchTargetBlock.classList.remove('drag-over');
            const fromPosition = this.draggedPosition;
            const toPosition = parseInt(this.touchTargetBlock.dataset.position);
            this.swapPositions(fromPosition, toPosition);
        }

        this.draggedBlock = null;
        this.draggedPosition = null;
        this.touchTargetBlock = null;
    }

    // Position swap logic
    swapPositions(fromPosition, toPosition) {
        if (fromPosition === toPosition) return;

        // Determine direction and range
        const minPos = Math.min(fromPosition, toPosition);
        const maxPos = Math.max(fromPosition, toPosition);

        // Create new players array
        const newPlayers = [...this.players];

        if (fromPosition < toPosition) {
            // Moving down: player at fromPosition goes to toPosition
            // Everyone between shifts up
            const movingPlayer = this.players[fromPosition - 1];
            for (let i = fromPosition - 1; i < toPosition - 1; i++) {
                newPlayers[i] = this.players[i + 1];
            }
            newPlayers[toPosition - 1] = movingPlayer;
        } else {
            // Moving up: player at fromPosition goes to toPosition
            // Everyone between shifts down
            const movingPlayer = this.players[fromPosition - 1];
            for (let i = fromPosition - 1; i > toPosition - 1; i--) {
                newPlayers[i] = this.players[i - 1];
            }
            newPlayers[toPosition - 1] = movingPlayer;
        }

        this.players = newPlayers;
        this.renderPyramid();

        // Animate changed positions
        for (let i = minPos; i <= maxPos; i++) {
            const block = document.querySelector(`.block[data-position="${i}"]`);
            if (block) {
                block.classList.add('position-changed');
                setTimeout(() => block.classList.remove('position-changed'), 300);
            }
        }
    }

    setupEventListeners() {
        // Add row button
        document.getElementById('addRow').addEventListener('click', () => {
            if (this.rows < 10) {
                this.rows++;
                this.init();
            }
        });

        // Remove row button
        document.getElementById('removeRow').addEventListener('click', () => {
            if (this.rows > 1) {
                this.rows--;
                // Trim players array
                const totalPositions = this.getTotalPositions();
                this.players = this.players.slice(0, totalPositions);
                this.renderPyramid();
            }
        });

        // Share to WhatsApp button
        document.getElementById('shareWhatsApp').addEventListener('click', () => {
            this.shareToWhatsApp();
        });
    }

    async shareToWhatsApp() {
        // Prevent multiple simultaneous share attempts
        if (this.isSharing) {
            console.log('Share already in progress');
            return;
        }

        this.isSharing = true;
        const shareBtn = document.getElementById('shareWhatsApp');
        shareBtn.disabled = true;
        shareBtn.textContent = 'Preparing...';

        try {
            // Check if html2canvas is loaded
            if (typeof html2canvas === 'undefined') {
                throw new Error('Screenshot library not loaded. Please refresh the page.');
            }

            // Capture the pyramid as an image
            const canvas = await html2canvas(this.pyramidEl, {
                backgroundColor: '#2d8b4e',
                scale: 2,
                useCORS: true,
                logging: false
            });

            // Convert to blob
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Failed to create image'));
                }, 'image/png');
            });

            // Check if on mobile with native share support
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile && navigator.share && navigator.canShare) {
                const file = new File([blob], 'tennis-pyramid.png', { type: 'image/png' });
                const shareData = {
                    title: 'Tennis Pyramid',
                    text: 'Check out my Tennis Pyramid!',
                    files: [file]
                };

                if (navigator.canShare(shareData)) {
                    try {
                        await navigator.share(shareData);
                        return;
                    } catch (shareError) {
                        if (shareError.name === 'AbortError') {
                            return; // User cancelled
                        }
                    }
                }
            }

            // Desktop flow: Show contact picker modal
            this.pendingImageBlob = blob;
            this.showShareModal();

        } catch (error) {
            console.error('Error sharing:', error);
            alert(error.message || 'Could not share. Please try again or take a screenshot manually.');
        } finally {
            this.isSharing = false;
            shareBtn.disabled = false;
            shareBtn.innerHTML = `
                <svg class="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share to WhatsApp
            `;
        }
    }

    showShareModal() {
        // Remove existing modal
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <button class="modal-close">&times;</button>
                <h2>Share to WhatsApp</h2>
                <p>Select a contact or enter a phone number</p>

                <div class="add-contact-section">
                    <label>Add new contact:</label>
                    <div class="contact-input-group">
                        <input type="text" id="newContactName" placeholder="Name (e.g. John)">
                        <input type="tel" id="newContactPhone" placeholder="Phone (e.g. +385991234567)">
                        <button id="addContactBtn">Save</button>
                    </div>
                </div>

                <label>Your contacts:</label>

                <div class="contacts-list" id="contactsList">
                    ${this.renderContactsList()}
                </div>

                <div class="divider">or</div>

                <button class="share-direct-btn" id="openWhatsAppBtn">
                    Open WhatsApp Web (paste image manually)
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close modal on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Close button
        overlay.querySelector('.modal-close').addEventListener('click', () => {
            overlay.remove();
        });

        // Add contact
        overlay.querySelector('#addContactBtn').addEventListener('click', () => {
            const nameInput = overlay.querySelector('#newContactName');
            const phoneInput = overlay.querySelector('#newContactPhone');
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();

            if (name && phone) {
                this.addContact(name, phone);
                nameInput.value = '';
                phoneInput.value = '';
                overlay.querySelector('#contactsList').innerHTML = this.renderContactsList();
                this.attachContactListeners(overlay);
            }
        });

        // Open WhatsApp Web directly
        overlay.querySelector('#openWhatsAppBtn').addEventListener('click', async () => {
            await this.copyImageAndOpen();
            overlay.remove();
        });

        // Attach listeners to contact items
        this.attachContactListeners(overlay);
    }

    renderContactsList() {
        if (this.contacts.length === 0) {
            return '<div class="no-contacts">No contacts saved yet</div>';
        }

        return this.contacts.map(contact => `
            <div class="contact-item" data-phone="${contact.phone}" data-id="${contact.id}">
                <div class="contact-info">
                    <span class="contact-name">${contact.name}</span>
                    <span class="contact-phone">${contact.phone}</span>
                </div>
                <button class="contact-delete" data-id="${contact.id}">&times;</button>
            </div>
        `).join('');
    }

    attachContactListeners(overlay) {
        // Click on contact to share
        overlay.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (e.target.classList.contains('contact-delete')) return;
                const phone = item.dataset.phone;
                await this.shareToContact(phone);
                overlay.remove();
            });
        });

        // Delete contact
        overlay.querySelectorAll('.contact-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.deleteContact(id);
                overlay.querySelector('#contactsList').innerHTML = this.renderContactsList();
                this.attachContactListeners(overlay);
            });
        });
    }

    async shareToContact(phone) {
        try {
            // Copy image to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': this.pendingImageBlob })
            ]);

            // Open WhatsApp with specific contact
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}`, '_blank');

            this.showNotification('Image copied! Paste with Cmd+V (or Ctrl+V) in WhatsApp');

        } catch (error) {
            console.error('Clipboard failed:', error);
            // Fallback: download and open
            await this.downloadAndOpen(phone);
        }
    }

    async copyImageAndOpen(phone = null) {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': this.pendingImageBlob })
            ]);

            if (phone) {
                const cleanPhone = phone.replace(/[^0-9]/g, '');
                window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}`, '_blank');
            } else {
                window.open('https://web.whatsapp.com/', '_blank');
            }

            this.showNotification('Image copied! Paste with Cmd+V (or Ctrl+V) in WhatsApp');

        } catch (error) {
            await this.downloadAndOpen(phone);
        }
    }

    async downloadAndOpen(phone = null) {
        const url = URL.createObjectURL(this.pendingImageBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'tennis-pyramid.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);

        if (phone) {
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}`, '_blank');
        } else {
            window.open('https://web.whatsapp.com/', '_blank');
        }

        this.showNotification('Image downloaded! Drag it into the WhatsApp chat');
    }

    showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TennisPyramid();
});
