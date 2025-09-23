document.addEventListener('DOMContentLoaded', () => {
    // --- DATABASE OF EVENTS ---
    const events = {
        'hackathon': {
            name: 'Hackathon',
            description: 'A dynamic 24-hour event where innovation meets impact. This state-level hackathon is a space where creativity, technology, and collaboration come together to solve real-world problems.',
            price: 600,
            maxMembers: 4,
        },
        'ideacraft': {
            name: 'Ideacraft',
            description: 'An event where participants generate, develop, and pitch innovative ideas to solve a specific problem or challenge. It\'s a platform for creative problem-solving and entrepreneurship.',
            price: 400,
            maxMembers: 4,
        },
        'gameathon': {
            name: 'Gameathon',
            description: 'A competitive gaming showdown! Form your squad and battle it out in the campus\'s premier esports tournament. Strategy, skill, and teamwork will crown the champion.',
            price: 500,
            maxMembers: 4,
        },
        'combo': {
            name: 'Combo (Hackathon & Ideacraft)',
            description: 'Get the best of both worlds! This combo pass gives your team full access to both the Hackathon and Ideacraft events at a discounted price.',
            price: 899,
            maxMembers: 4,
        },
        'default': {
            name: 'HackMCE Event',
            description: 'You are registering for one of the premier events of Hack MCE 5.0. Please fill out the form to secure your spot.',
            price: 0,
            maxMembers: 4,
        }
    };

    // --- CONFIGURATION ---
    const RAZORPAY_KEY_ID = 'rzp_test_R6sM0xqBd22SgS';
    // IMPORTANT: Make sure this is your DEPLOYED Apps Script URL
    const GOOGLE_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwK79Kz-Jzrv_CZcumql9_6hqqbWbsYzFFjpgFlTHTRlLIjVnev-2BbAdMSMKKad7EK/exec';

    // --- DOM ELEMENT REFERENCES ---
    const eventTitleEl = document.getElementById('details-event-title');
    const eventDescEl = document.getElementById('details-event-desc');
    const eventPriceEl = document.getElementById('details-event-price');
    const submitButton = document.getElementById('submit-button');
    const addMemberBtn = document.getElementById('add-member-btn');
    const membersListEl = document.getElementById('members-list');
    const formContainer = document.getElementById('registration-form-container');
    const loaderContainer = document.getElementById('loader-container');
    const loaderText = document.getElementById('loader-text');
    const confirmationContainer = document.getElementById('confirmation-container');
    const downloadBtn = document.getElementById('download-ticket-btn');
    const registrationForm = document.getElementById('registration-form');
    const accommodationRadios = document.querySelectorAll('input[name="accommodation"]');

    // --- STATE VARIABLES ---
    let currentEvent;
    let memberCount = 0;
    let baseEventPrice = 0;
    let currentTotalCost = 0;
    let lastGeneratedPdfUri = null; // To hold PDF data for download

    // --- UTILITY FUNCTIONS ---
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    function validateRequiredLibraries() {
        const issues = [];
        if (typeof window.Razorpay === 'undefined') issues.push('Razorpay payment library is not loaded');
        if (typeof window.jsPDF === 'undefined') issues.push('jsPDF library is not loaded correctly');
        if (issues.length > 0) {
            console.error('Library issues:', issues);
            alert('Some required libraries are not loaded properly. Please refresh the page and try again.');
            return false;
        }
        return true;
    }

    // --- SAFE DATA URL VALIDATOR ---
    function isValidDataURL(dataUrl) {
        if (!dataUrl || typeof dataUrl !== 'string') return false;
        // BUGFIX: Allow an optional "filename" parameter in the data URI, which older jsPDF versions can add.
        const dataUrlRegex = /^data:application\/pdf(?:;filename=.*)?;base64,([A-Za-z0-9+/]+=*)$/;
        return dataUrlRegex.test(dataUrl) && dataUrl.length > 100;
    }

    // --- UI INITIALIZATION ---
    function initializePage() {
        if (!validateRequiredLibraries()) {
            if (submitButton) submitButton.disabled = true;
            if (addMemberBtn) addMemberBtn.disabled = true;
            return;
        }
        const params = new URLSearchParams(window.location.search);
        const eventKey = params.get('event') || 'default';
        currentEvent = events[eventKey] || events['default'];
        displayEventDetails();
        setupMemberButton();
        updateTotalPrice();
    }

    function displayEventDetails() {
        if (eventTitleEl) eventTitleEl.textContent = currentEvent.name;
        if (eventDescEl) eventDescEl.textContent = currentEvent.description;
        baseEventPrice = currentEvent.price;
    }

    function updateTotalPrice() {
        const selectedAccom = document.querySelector('input[name="accommodation"]:checked');
        if (!selectedAccom) return;
        const accommodationCost = parseInt(selectedAccom.value, 10) || 0;
        currentTotalCost = baseEventPrice + accommodationCost;
        if (eventPriceEl) eventPriceEl.textContent = `Rs. ${currentTotalCost}`;
        if (submitButton) submitButton.textContent = `Register & Pay Rs. ${currentTotalCost}`;
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

    // --- EVENT LISTENERS ---
    if (accommodationRadios.length > 0) {
        accommodationRadios.forEach(radio => radio.addEventListener('change', updateTotalPrice));
    }
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            if (memberCount < currentEvent.maxMembers - 1) {
                memberCount++;
                const memberInputContainer = document.createElement('div');
                memberInputContainer.classList.add('flex', 'items-center', 'space-x-2', 'mt-2');
                memberInputContainer.innerHTML = `
                    <input type="text" name="member-${memberCount}" placeholder="Member ${memberCount + 1} Name" required class="block w-full px-4 py-3 bg-slate-800 text-white border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition">
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
            handleFormSubmission();
        });
    }
    // Note: The download button listener is set dynamically.

    // --- FORM SUBMISSION HANDLER ---
    function handleFormSubmission() {
        if (!validateRequiredLibraries()) return;
        const form = new FormData(registrationForm);
        const members = Array.from(document.querySelectorAll('#members-list input')).map(input => input.value.trim()).filter(name => name);
        const selectedAccomRadio = document.querySelector('input[name="accommodation"]:checked');
        if (!selectedAccomRadio) {
            alert('Please select an accommodation option.');
            return;
        }
        let accomText = 'Not specified';
        try {
            const accomLabel = selectedAccomRadio.closest('label');
            if (accomLabel && accomLabel.textContent) {
                accomText = accomLabel.textContent.replace(/Rs\.\s*\d+/g, '').replace(/\(.*\)/g, '').trim();
            }
        } catch (error) {
            console.warn('Could not extract accommodation text cleanly:', error);
        }
        const accomValue = parseInt(selectedAccomRadio.value, 10) || 0;
        const eventKey = new URLSearchParams(window.location.search).get('event') || 'default';
        const registrationData = {
            teamName: form.get('team-name')?.toString().trim() || '',
            leaderName: form.get('team-leader-name')?.toString().trim() || '',
            leaderEmail: form.get('team-leader-email')?.toString().trim() || '',
            leaderPhone: form.get('team-leader-phone')?.toString().trim() || '',
            members: members,
            accommodation: accomText
        };
        if (!registrationData.teamName || !registrationData.leaderName || !registrationData.leaderEmail) {
            alert('Please fill in all required fields (Team Name, Leader Name, and Email).');
            return;
        }
        const pendingData = {
            formData: registrationData,
            eventKey: eventKey,
            pricing: {
                baseFee: baseEventPrice,
                accomFee: accomValue,
                total: currentTotalCost
            }
        };
        try {
            sessionStorage.setItem('pendingRegistration', JSON.stringify(pendingData));
            startPaymentProcess();
        } catch (error) {
            console.error('Failed to save pending registration:', error);
            alert('Error preparing registration. Please try again.');
        }
    }

    // --- PAYMENT PROCESS ---
    function startPaymentProcess() {
        if (typeof window.Razorpay === 'undefined') {
            alert('Payment system is not available. Please refresh the page.');
            return;
        }
        const pendingDataString = sessionStorage.getItem('pendingRegistration');
        if (!pendingDataString) {
            alert('Registration session expired. Please fill the form again.');
            resetToForm();
            return;
        }
        const pendingData = JSON.parse(pendingDataString);
        const { formData, pricing } = pendingData;
        if (formContainer) formContainer.classList.add('hidden');
        if (loaderContainer) {
            loaderContainer.classList.remove('hidden');
            loaderContainer.classList.add('flex');
        }
        if (loaderText) loaderText.textContent = 'Initializing Payment...';
        const options = {
            "key": RAZORPAY_KEY_ID,
            "amount": pricing.total * 100,
            "currency": "INR",
            "name": "HackMCE 5.0",
            "description": `Registration for ${currentEvent.name}`,
            "handler": (response) => handlePaymentSuccess(response.razorpay_payment_id),
            "prefill": {
                "name": formData.leaderName || '',
                "email": formData.leaderEmail || '',
                "contact": formData.leaderPhone || ''
            },
            "theme": { "color": "#d30000" },
            "modal": { "ondismiss": () => resetToForm() }
        };
        if (isMobileDevice()) {
            const eventKey = new URLSearchParams(window.location.search).get('event') || 'default';
            options.callback_url = `${window.location.origin}${window.location.pathname}?event=${eventKey}&payment_redirect=true`;
        }
        try {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                console.error('Payment Failed:', response.error);
                alert(`Payment Failed: ${response.error?.description || 'Unknown error'}`);
                resetToForm();
            });
            rzp.open();
        } catch (error) {
            console.error('Razorpay initialization error:', error);
            alert('Error initializing payment system. Please try again.');
            resetToForm();
        }
    }

    function resetToForm() {
        if (loaderContainer) loaderContainer.classList.add('hidden');
        if (formContainer) formContainer.classList.remove('hidden');
        sessionStorage.removeItem('pendingRegistration');
    }

    // --- PAYMENT SUCCESS HANDLER ---
    async function handlePaymentSuccess(paymentId) {
        lastGeneratedPdfUri = null; // Reset before trying
        const pendingDataString = sessionStorage.getItem('pendingRegistration');
        if (!pendingDataString) {
            alert('Registration session expired. Please fill the form again.');
            resetToForm();
            return;
        }
        
        const pendingData = JSON.parse(pendingDataString);
        currentEvent = events[pendingData.eventKey] || events['default'];
        if (loaderText) loaderText.textContent = 'Payment successful! Generating ticket...';

        try {
            const pdfDataUri = await generateTicketPDF(pendingData.formData, currentEvent, paymentId, pendingData.pricing);
            lastGeneratedPdfUri = pdfDataUri; // Store PDF data as soon as it's generated

            if (!isValidDataURL(pdfDataUri)) throw new Error('PDF generation produced invalid data.');

            if (GOOGLE_SCRIPT_WEB_APP_URL) {
                if (loaderText) loaderText.textContent = 'Finalizing registration...';

                // **FIX:** Create a simple JSON object for the Apps Script
                const postData = {
                  eventName: currentEvent.name,
                  teamName: pendingData.formData.teamName,
                  leaderName: pendingData.formData.leaderName,
                  leaderEmail: pendingData.formData.leaderEmail,
                  leaderPhone: pendingData.formData.leaderPhone,
                  members: pendingData.formData.members.join(', '), // Send as a single string
                  accommodation: pendingData.formData.accommodation,
                  paymentId: paymentId,
                  eventFee: pendingData.pricing.baseFee,
                  accommodationFee: pendingData.pricing.accomFee,
                  totalPaid: pendingData.pricing.total,
                  pdfBase64: pdfDataUri.split(',')[1],
                  fileName: `${pendingData.formData.teamName}-Ticket.pdf`
                };

                // **FIX:** Send JSON and remove 'mode: "no-cors"' to read the response
                const response = await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
                  method: 'POST',
                  body: JSON.stringify(postData),
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });

                if (!response.ok) {
                    // Try to get error message from Apps Script, or use default
                    let errorMsg = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorJson = await response.json();
                        errorMsg = errorJson.message || 'Failed to finalize registration.';
                    } catch (e) {
                        // Response wasn't JSON
                    }
                    throw new Error(errorMsg);
                }

                // Check for success status from our Apps Script
                const result = await response.json();
                if (result.status === "success") {
                    showSuccessMessage(pendingData.formData.leaderEmail, paymentId);
                } else {
                    // Apps Script reported an error (e.g., email failed to send)
                    throw new Error(result.message || 'An unknown error occurred on the server.');
                }

            } else {
                // If no URL is configured, just show the success message.
                showSuccessMessage(pendingData.formData.leaderEmail, paymentId);
            }
        } catch (finalizingError) {
            // This block now catches PDF generation, network, or Apps Script errors
            console.error('Registration processing error after payment:', finalizingError);
            // Pass the error message to be displayed
            showErrorMessage(paymentId, finalizingError.message);
        } finally {
            sessionStorage.removeItem('pendingRegistration');
        }
    }

    function showSuccessMessage(email, paymentId) {
        if (loaderContainer) loaderContainer.classList.add('hidden');
        if (confirmationContainer) {
            confirmationContainer.classList.remove('hidden');
            confirmationContainer.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
            const messageEl = confirmationContainer.querySelector('p');
            if (messageEl) {
                messageEl.textContent = `Registration successful! Your ticket has been sent to ${email}.`;
            }
        }
        if (downloadBtn && lastGeneratedPdfUri) {
            const newDownloadBtn = downloadBtn.cloneNode(true);
            downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
            newDownloadBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = lastGeneratedPdfUri;
                link.download = `HackMCE-Ticket-${paymentId.slice(-6)}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
    }

    // **MODIFIED:** Added 'customError' parameter for better feedback
    function showErrorMessage(paymentId, customError = null) {
        if (loaderContainer) loaderContainer.classList.add('hidden');
        if (confirmationContainer) {
            confirmationContainer.classList.remove('hidden');
            confirmationContainer.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
            const messageEl = confirmationContainer.querySelector('p');
            const h2El = confirmationContainer.querySelector('h2');
            const svgEl = confirmationContainer.querySelector('svg');

            if (svgEl) svgEl.style.display = 'none'; // Hide success checkmark
            if (h2El) h2El.textContent = 'Registration Error';

            const newDownloadBtn = downloadBtn.cloneNode(true);
            downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);

            if (lastGeneratedPdfUri && isValidDataURL(lastGeneratedPdfUri)) {
                if (messageEl) messageEl.textContent = customError || 'Payment successful, but there was an error sending the confirmation. Please download your ticket manually.';
                newDownloadBtn.textContent = 'Download Ticket Manually';
                newDownloadBtn.addEventListener('click', () => {
                    const link = document.createElement('a');
                    link.href = lastGeneratedPdfUri;
                    link.download = `HackMCE-Ticket-Manual-${paymentId.slice(-6)}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            } else {
                if (messageEl) messageEl.textContent = customError || `Payment was successful, but an error occurred generating your ticket. Please contact support with your Payment ID: ${paymentId}`;
                newDownloadBtn.textContent = 'Back to Home';
                newDownloadBtn.addEventListener('click', () => {
                    window.location.href = 'index.html';
                });
            }
        }
    }

    // --- SAFE PDF GENERATION ---
    async function generateTicketPDF(formData, event, paymentId, pricing) {
        try {
            if (typeof window.jsPDF === 'undefined') throw new Error('PDF library (jsPDF) not available');
            if (loaderText) loaderText.textContent = 'Creating PDF document...';

            const doc = new jsPDF();
            doc.setFillColor(10, 10, 10);
            doc.rect(0, 0, 210, 297, 'F');
            doc.setTextColor(211, 0, 0);
            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text("HackMCE 5.0 - OFFICIAL TICKET", 105, 30, { align: 'center' });
            doc.setTextColor(226, 232, 240);
            doc.setFontSize(22);
            doc.text(event.name.toUpperCase(), 105, 60, { align: 'center' });

            let yPos = 90;
            const addDetail = (label, value) => {
                if (value && String(value).trim().length > 0) {
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(211, 0, 0);
                    doc.text(label, 30, yPos);
                    doc.setTextColor(226, 232, 240);
                    const text = String(value).trim();
                    const splitText = doc.splitTextToSize(text, 100);
                    doc.text(splitText, 75, yPos);
                    yPos += (splitText.length * 5) + 5;
                }
            };
            addDetail('Team Name:', formData.teamName);
            addDetail('Team Leader:', formData.leaderName);
            addDetail('Email:', formData.leaderEmail);
            if (formData.leaderPhone) addDetail('Phone:', formData.leaderPhone);
            if (formData.members && formData.members.length > 0) addDetail('Team Members:', formData.members.join(', '));
            yPos += 5;
            addDetail('Accommodation:', formData.accommodation);
            yPos += 5;
            addDetail('Event Fee:', `Rs. ${pricing.baseFee}`);
            addDetail('Accommodation Fee:', `Rs. ${pricing.accomFee}`);
            doc.setFont('helvetica', 'bold');
            addDetail('TOTAL PAID:', `Rs. ${pricing.total}`);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text(`Payment ID: ${paymentId}`, 105, 260, { align: 'center' });
            doc.text("Present this ticket at the event registration desk.", 105, 270, { align: 'center' });
            doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });

            return doc.output('datauristring');
        } catch (error) {
            console.error('PDF generation failed:', error);
            throw new Error('Failed to generate ticket PDF: ' + error.message);
        }
    }

    // --- SCRIPT INITIALIZATION ---
    const redirectParams = new URLSearchParams(window.location.search);
    const redirectPaymentId = redirectParams.get('razorpay_payment_id');
    if (redirectPaymentId) {
        const pendingRegJSON = sessionStorage.getItem('pendingRegistration');
        if (pendingRegJSON) {
            try {
                if (formContainer) formContainer.classList.add('hidden');
                if (loaderContainer) {
                    loaderContainer.classList.remove('hidden');
                    loaderContainer.classList.add('flex');
                }
                handlePaymentSuccess(redirectPaymentId);
                const pendingData = JSON.parse(pendingRegJSON);
                const originalEventKey = pendingData.eventKey || 'default';
                window.history.replaceState(null, '', `${window.location.pathname}?event=${originalEventKey}`);
            } catch (error) {
                console.error('Error handling payment redirect:', error);
                initializePage();
            }
        } else {
            console.warn('Payment ID found in URL, but no session data.');
            initializePage();
        }
    } else {
        initializePage();
    }
});