document.addEventListener("DOMContentLoaded", () => {
  // --- EVENT DATABASE ---
  const events = {
    hackathon: {
      name: "Dev_Hack",
      description:
        "This is a 2-phase national event. Phase 1 (Online Idea Submission): Teams submit solutions based on provided domains. Phase 2 (On-Campus Grand Finale): Shortlisted teams will develop working prototypes over a 24-hour period to solve real-world problems.",
      maxMembers: 4,
      fee: 600,
      rulebookUrl: "./assets/pdf/Hackathon.pdf",
      registrationClosed: true,
    },
    ideacraft: {
      name: "Ideacraft",
      description:
        "An event where participants generate, develop, and pitch innovative ideas to solve a specific problem or challenge.",
      maxMembers: 4,
      fee: 400,
      rulebookUrl: "./assets/pdf/Ideacraft.pdf",
      registrationClosed: false,
    },
    gameathon: {
      name: "Gameathon",
      description:
        "A competitive gaming showdown! Form your squad and battle it out in the campus premier esports tournament.",
      maxMembers: 4,
      fee: 600,
      rulebookUrl: "./assets/pdf/Gameathon.pdf",
      games: ["BGMI", "Free Fire"],
      registrationClosed: false,
    },
    default: {
      name: "HackMCE Event",
      description:
        "You are registering for one of the premier events of Hack MCE 5.0. Please fill out the form to secure your spot.",
      maxMembers: 4,
      fee: 600,
      rulebookUrl: null,
      registrationClosed: false,
    },
  };

  // --- CONFIGURATION ---
  const GOOGLE_SCRIPT_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbyXwQeFyiCLIl6H1EP55RcjKNxzPQqLaW2V9c2oUOfGLghoF5EmMs0UqFMK-_14aJ_v/exec";
  const UPI_ID = "kushgowda1432@oksbi";

  // --- DOM ELEMENTS ---
  const eventTitleEl = document.getElementById("details-event-title");
  const eventDescEl = document.getElementById("details-event-desc");
  const eventPriceEl = document.getElementById("details-event-price");
  const eventRulebookBtn = document.getElementById("details-event-rulebook");
  const formContainer = document.getElementById("registration-form-container");
  const addMemberBtn = document.getElementById("add-member-btn");
  const submitButton = document.getElementById("submit-button");
  const membersListEl = document.getElementById("members-list");
  const registrationForm = document.getElementById("registration-form");
  const loaderContainer = document.getElementById("loader-container");
  const loaderText = document.getElementById("loader-text");
  const confirmationContainer = document.getElementById(
    "confirmation-container"
  );
  const gameSelectionContainer = document.getElementById(
    "game-selection-container"
  );

  // Payment Modal Elements
  const paymentModal = document.getElementById("payment-modal");
  const paymentModalAmount = document.getElementById("payment-amount");
  const qrCodeImg = document.getElementById("qr-code");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const confirmPaymentBtn = document.getElementById("confirm-payment-btn");
  const transactionIdInput = document.getElementById("transaction-id");

  // --- STATE ---
  let currentEvent;
  let memberCount = 0;

  // --- INITIALIZE PAGE ---
  function initializePage() {
    const params = new URLSearchParams(window.location.search);
    const eventKey = params.get("event") || "default";
    currentEvent = events[eventKey] || events["default"];
    displayEventDetails();
    setupMemberButton();
  }

  // --- DISPLAY EVENT DETAILS ---
  function displayEventDetails() {
    if (eventTitleEl) eventTitleEl.textContent = currentEvent.name;
    if (eventDescEl) eventDescEl.textContent = currentEvent.description;
    if (eventPriceEl) eventPriceEl.textContent = `₹${currentEvent.fee}`;
    if (submitButton)
      submitButton.textContent = `Register & Pay ₹${currentEvent.fee}`;

    if (eventRulebookBtn) {
      if (currentEvent.rulebookUrl) {
        eventRulebookBtn.href = currentEvent.rulebookUrl;
        eventRulebookBtn.style.display = "inline-flex";
      } else {
        eventRulebookBtn.style.display = "none";
      }
    }

    // ✅ Handle Registration Closed
    if (currentEvent.registrationClosed) {
      const formColumn = formContainer?.closest(".w-full.h-full");
      if (formColumn) formColumn.style.display = "none";

      const gridWrapper = document.querySelector(".max-w-6xl.grid");
      if (gridWrapper) {
        gridWrapper.classList.remove("lg:grid-cols-2");
        gridWrapper.classList.add("grid-cols-1");
      }

      const container = document.querySelector(".container");
      if (container) {
        container.classList.add("flex", "items-center", "justify-center");
      }

      const rulebookSection = eventRulebookBtn?.closest("div.mt-6");
      const feeSection = document
        .querySelector("#details-event-price")
        ?.closest("div.mt-8.pt-6");
      const accommodationSection = document
        .querySelector("h3.text-lg.font-semibold.text-white")
        ?.closest("div.mt-8.pt-6");
      const pleaseReadLine = document.querySelector(
        "p.text-red-400.font-semibold"
      );

      if (rulebookSection) rulebookSection.style.display = "none";
      if (feeSection) feeSection.style.display = "none";
      if (accommodationSection) accommodationSection.style.display = "none";
      if (pleaseReadLine) pleaseReadLine.style.display = "none";

      const closedNotice = document.createElement("div");
      closedNotice.className = `
        mt-8 w-full p-8 border border-[#d30000]/40 rounded-2xl
        bg-gradient-to-br from-black/60 via-[#2b0000]/60 to-black/60
        text-center shadow-[0_0_40px_rgba(211,0,0,0.3)]
        transition-all duration-500 hover:shadow-[0_0_60px_rgba(211,0,0,0.5)]
        hover:scale-[1.01]
    `;

      closedNotice.innerHTML = `
        <div class="flex flex-col items-center justify-center space-y-6 w-full">
          <div class="flex items-center gap-3 justify-center text-[#d30000] text-3xl font-semibold animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-[#d30000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 11-12.728 12.728A9 9 0 0118.364 5.636zm-12.728 0L18.364 18.364" />
            </svg>
            <span>Registrations Closed</span>
          </div>

          <p class="text-slate-300 text-base max-w-3xl leading-relaxed text-center">
            Registrations for <span class="text-white font-medium">${currentEvent.name}</span> are now closed.<br>
            Thank you for your interest! Stay tuned for upcoming events.
          </p>

          <div class="mt-6 text-center text-slate-300">
            <p class="text-white font-semibold text-lg mb-2">For more details, contact:</p>
            <ul class="space-y-1">
              <li>
                <span class="font-medium text-white">Mohammed Aazam</span><br>
                <a href="tel:+917022669921" class="text-[#d30000] hover:text-[#a10000] transition-colors">+91 702 266 9921</a>
              </li>
              <li class="mt-3">
                <span class="font-medium text-white">Jnanavi Venugopal</span><br>
                <a href="tel:+918217648083" class="text-[#d30000] hover:text-[#a10000] transition-colors">+91 821 764 8083</a>
              </li>
            </ul>
          </div>
        </div>
      `;
      eventDescEl.insertAdjacentElement("afterend", closedNotice);
      return;
    }

    createGameSelectionUI();
  }

  // --- GAME SELECTION ---
  function createGameSelectionUI() {
    if (!gameSelectionContainer) return;
    gameSelectionContainer.innerHTML = "";
    gameSelectionContainer.style.display = "none";
    if (currentEvent.games && currentEvent.games.length > 0) {
      gameSelectionContainer.style.display = "block";
      let selectHTML = `
        <label for="game-selection" class="block text-sm font-medium text-slate-300">Select Game</label>
        <select id="game-selection" name="game-selection" required class="mt-1 block w-full px-4 py-3 text-white border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition">
          <option value="" disabled selected>--Please choose a game--</option>`;
      currentEvent.games.forEach((game) => {
        selectHTML += `<option value="${game}">${game}</option>`;
      });
      selectHTML += `</select>`;
      gameSelectionContainer.innerHTML = selectHTML;
    }
  }

  // --- ADD/REMOVE MEMBERS ---
  function setupMemberButton() {
    if (!addMemberBtn) return;
    if (currentEvent.maxMembers <= 1) {
      addMemberBtn.style.display = "none";
    } else {
      addMemberBtn.style.display = "block";
      addMemberBtn.textContent = `+ Add Member (Max ${
        currentEvent.maxMembers - 1
      })`;
    }
  }

  addMemberBtn?.addEventListener("click", () => {
    if (memberCount < currentEvent.maxMembers - 1) {
      memberCount++;
      const memberInputContainer = document.createElement("div");
      memberInputContainer.classList.add(
        "flex",
        "items-center",
        "space-x-2",
        "mt-2"
      );
      memberInputContainer.innerHTML = `
        <input type="text" name="member-${memberCount}" placeholder="Member ${
        memberCount + 1
      } Name" required class="block w-full px-4 py-3 text-white border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition">
        <button type="button" class="text-red-500 text-2xl font-bold hover:text-red-400 remove-member-btn">&times;</button>
      `;
      membersListEl?.appendChild(memberInputContainer);
      if (memberCount >= currentEvent.maxMembers - 1)
        addMemberBtn.disabled = true;
    }
  });

  membersListEl?.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-member-btn")) {
      e.target.parentElement.remove();
      memberCount--;
      addMemberBtn.disabled = false;
    }
  });


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
    paymentModal.classList.add("hidden");
    paymentModal.classList.remove("flex");
  }

  registrationForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (registrationForm.checkValidity()) showPaymentModal();
    else registrationForm.reportValidity();
  });

  closeModalBtn?.addEventListener("click", hidePaymentModal);
  confirmPaymentBtn?.addEventListener("click", handleFormSubmission);

  // --- FORM SUBMISSION ---
  async function handleFormSubmission() {
    const transactionId = transactionIdInput.value.trim();
    if (!transactionId) {
      alert("Please enter the Transaction ID.");
      return;
    }

    hidePaymentModal();
    formContainer.classList.add("hidden");
    loaderContainer.classList.remove("hidden");
    loaderContainer.classList.add("flex");
    loaderText.textContent = "Submitting registration...";

    const form = new FormData(registrationForm);
    const members = Array.from(document.querySelectorAll("#members-list input"))
      .map((input) => input.value.trim())
      .filter((name) => name);

    const registrationData = {
      eventName: currentEvent.name,
      teamName: form.get("team-name")?.toString().trim() || "",
      leaderName: form.get("team-leader-name")?.toString().trim() || "",
      leaderEmail: form.get("team-leader-email")?.toString().trim() || "",
      leaderPhone: form.get("team-leader-mobile")?.toString().trim() || "",
      collegeName: form.get("college-name")?.toString().trim() || "",
      selectedGame: form.get("game-selection")?.toString().trim() || "N/A",
      members: members.join(", "),
      transactionId: transactionId,
      fee: currentEvent.fee,
    };

    try {
      await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(registrationData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      showSuccessMessage();
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Network error occurred. Please try again.");
      loaderContainer.classList.add("hidden");
      formContainer.classList.remove("hidden");
    }
  }

  // --- SUCCESS MESSAGE ---
  function showSuccessMessage() {
    loaderContainer.classList.add("hidden");
    confirmationContainer.classList.remove("hidden");
    confirmationContainer.classList.add(
      "flex",
      "flex-col",
      "items-center",
      "justify-center"
    );

    const downloadBtn = document.getElementById("download-ticket-btn");
    if (downloadBtn) {
      downloadBtn.textContent = "Back to Home";
      downloadBtn.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }
  }

  initializePage();
});
