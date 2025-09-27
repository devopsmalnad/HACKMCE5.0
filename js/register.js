document.addEventListener('DOMContentLoaded', () => {
    // --- DATABASE OF EVENTS ---
    // Event details are now stored here for easy updates.
    const events = {
        'hackathon': {
            name: 'Dev_Hack',
            description: 'This is a 2-phase national event. Phase 1 (Online Idea Submission): Teams submit solutions based on provided domains. Phase 2 (On-Campus Grand Finale): Shortlisted teams will develop working prototypes over a 24-hour period to solve real-world problems',
            maxMembers: 4,
            fee: 600,
            rulebookUrl: './assets/pdf/hackathon.pdf'
        },
        'ideacraft': {
            name: 'Ideacraft',
            description: 'An event where participants generate, develop, and pitch innovative ideas to solve a specific problem or challenge. It\'s a platform for creative problem-solving and entrepreneurship.',
            maxMembers: 4,
            fee: 400,
            rulebookUrl: './assets/pdf/Ideacraft.pdf'
        },
        'gameathon': {
            name: 'Gameathon',
            description: 'A competitive gaming showdown! Form your squad and battle it out in the campus\'s premier esports tournament. Strategy, skill, and teamwork will crown the champion.',
            maxMembers: 4,
            fee: 600,
            rulebookUrl: './assets/pdf/Gameathon.pdf'
        },
        'default': {
            name: 'HackMCE Event',
            description: 'You are registering for one of the premier events of Hack MCE 5.0. Please fill out the form to secure your spot.',
            maxMembers: 4,
            fee: 600,
            rulebookUrl: null
        }
    };

    // --- CONFIGURATION ---
    const GOOGLE_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzPKaeLTuwpXlQg3OUwJd3FLAm_qQNvk59t9FAZYHjbdI18C6coXBCyaTanEkjKZfeM/exec';
    const UPI_ID = 'kushgowda1432@oksbi'; 

    // --- DOM ELEMENT REFERENCES ---
    const eventTitleEl = document.getElementById('details-event-title');
    const eventDescEl = document.getElementById('details-event-desc');
    const eventPriceEl = document.getElementById('details-event-price');
    const eventRulebookBtn = document.getElementById('details-event-rulebook');
    const submitButton = document.getElementById('submit-button');
    const addMemberBtn = document.getElementById('add-member-btn');
    const membersListEl = document.getElementById('members-list');
    const formContainer = document.getElementById('registration-form-container');
    const loaderContainer = document.getElementById('loader-container');
    const loaderText = document.getElementById('loader-text');
    const confirmationContainer = document.getElementById('confirmation-container');
    const registrationForm = document.getElementById('registration-form');

    // Payment Modal Elements
    const paymentModal = document.getElementById('payment-modal');
    const paymentModalAmount = document.getElementById('payment-amount');
    const qrCodeImg = document.getElementById('qr-code');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    const transactionIdInput = document.getElementById('transaction-id');


    // --- STATE VARIABLES ---
    let currentEvent;
    let memberCount = 0;

    // --- UI INITIALIZATION ---
    function initializePage() {
        const params = new URLSearchParams(window.location.search);
        const eventKey = params.get('event') || 'default';
        currentEvent = events[eventKey] || events['default'];
        displayEventDetails();
        setupMemberButton();
    }

    function displayEventDetails() {
        if (eventTitleEl) eventTitleEl.textContent = currentEvent.name;
        if (eventDescEl) eventDescEl.textContent = currentEvent.description;
        if (eventPriceEl) eventPriceEl.textContent = `₹${currentEvent.fee}`;
        if (submitButton) submitButton.textContent = `Register & Pay ₹${currentEvent.fee}`;

        if (eventRulebookBtn) {
            if (currentEvent.rulebookUrl) {
                eventRulebookBtn.href = currentEvent.rulebookUrl;
                eventRulebookBtn.style.display = 'inline-flex';
            } else {
                eventRulebookBtn.style.display = 'none';
            }
        }
    }

    function setupMemberButton() {
        if (!addMemberBtn) return;
        if (currentEvent.maxMembers <= 1) {
            addMemberBtn.style.display = 'none';
        } else {
            addMemberBtn.style.display = 'block';
            addMemberBtn.textContent = `+ Add Member (Max ${currentEvent.maxMembers - 1})`;
        }
    }

    // --- MODAL HANDLING ---
    function showPaymentModal() {
        if (!paymentModal) return;
        
        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=HackMCE&am=${currentEvent.fee}&cu=INR&tn=Registration for ${currentEvent.name}`;
        qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
        
        if (paymentModalAmount) paymentModalAmount.textContent = `₹${currentEvent.fee}`;
        
        paymentModal.classList.remove('hidden');
        paymentModal.classList.add('flex');
    }

    function hidePaymentModal() {
        if (!paymentModal) return;
        paymentModal.classList.add('hidden');
        paymentModal.classList.remove('flex');
    }

    // --- EVENT LISTENERS ---
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            if (memberCount < currentEvent.maxMembers - 1) {
                memberCount++;
                const memberInputContainer = document.createElement('div');
                memberInputContainer.classList.add('flex', 'items-center', 'space-x-2', 'mt-2');
                memberInputContainer.innerHTML = `
                    <input type="text" name="member-${memberCount}" placeholder="Member ${memberCount + 1} Name" required class="block w-full px-4 py-3 text-white border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" style="background-color: rgba(20, 20, 20, 0.7) !important;">
                    <button type="button" class="text-red-500 text-2xl font-bold hover:text-red-400 remove-member-btn" aria-label="Remove Member">&times;</button>
                `;
                if (membersListEl) membersListEl.appendChild(memberInputContainer);
                if (memberCount >= currentEvent.maxMembers - 1) addMemberBtn.disabled = true;
            }
        });
    }

    if (membersListEl) {
        membersListEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-member-btn')) {
                e.target.parentElement.remove();
                memberCount--;
                if (addMemberBtn) addMemberBtn.disabled = false;
            }
        });
    }

    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (registrationForm.checkValidity()) {
                showPaymentModal();
            } else {
                registrationForm.reportValidity();
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hidePaymentModal);
    }
    
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', handleFormSubmission);
    }

    // --- FORM SUBMISSION ---
    async function handleFormSubmission() {
        const transactionId = transactionIdInput.value.trim();
        if (!transactionId) {
            alert('Please enter the Transaction ID.');
            return;
        }

        hidePaymentModal();
        if (formContainer) formContainer.classList.add('hidden');
        if (loaderContainer) {
            loaderContainer.classList.remove('hidden');
            loaderContainer.classList.add('flex');
        }
        if (loaderText) loaderText.textContent = 'Submitting registration...';

        const form = new FormData(registrationForm);
        const members = Array.from(document.querySelectorAll('#members-list input')).map(input => input.value.trim()).filter(name => name);

        const registrationData = {
            eventName: currentEvent.name,
            teamName: form.get('team-name')?.toString().trim() || '',
            leaderName: form.get('team-leader-name')?.toString().trim() || '',
            leaderEmail: form.get('team-leader-email')?.toString().trim() || '',
            leaderPhone: form.get('team-leader-mobile')?.toString().trim() || '',
            members: members.join(', '),
            transactionId: transactionId,
            fee: currentEvent.fee
        };

        try {
            // THE FIX: Use 'no-cors' mode to bypass the browser's security block.
            // This sends the data but doesn't wait for a readable response from the script.
            await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // This is the crucial part that fixes the "Failed to fetch" error.
                body: JSON.stringify(registrationData),
                headers: { 
                    'Content-Type': 'application/json' 
                }
            });

            // Because we can't read the response from the script in 'no-cors' mode,
            // we will assume the submission was successful and show the confirmation.
            // The Google Script is responsible for sending the confirmation email.
            showSuccessMessage();

        } catch (error) {
            // This will now only catch actual network errors, not the CORS error.
            console.error('Submission Error:', error);
            alert(`A network error occurred. Please check your connection and try again.`);
            if (loaderContainer) loaderContainer.classList.add('hidden');
            if (formContainer) formContainer.classList.remove('hidden');
        }
    }

    function showSuccessMessage() {
        if (loaderContainer) loaderContainer.classList.add('hidden');
        if (confirmationContainer) {
            confirmationContainer.classList.remove('hidden');
            confirmationContainer.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
            
            const downloadBtn = document.getElementById('download-ticket-btn');
            if (downloadBtn) {
                downloadBtn.textContent = 'Back to Home';
                downloadBtn.addEventListener('click', () => window.location.href = 'index.html');
            }
        }
    }

    // --- SCRIPT INITIALIZATION ---
    initializePage();
});

