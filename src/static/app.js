document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants list with delete icon
        const participantsList = details.participants.length > 0
          ? details.participants.map(email => `
              <div class="participant-row">
                <span class="participant-email">${email}</span>
                <span class="delete-participant" title="Unregister">
                  <svg class="delete-icon" viewBox="0 0 20 20" width="18" height="18">
                    <circle cx="10" cy="10" r="9" fill="#f44336"/>
                    <line x1="6" y1="6" x2="14" y2="14" stroke="#fff" stroke-width="2"/>
                    <line x1="14" y1="6" x2="6" y2="14" stroke="#fff" stroke-width="2"/>
                  </svg>
                </span>
              </div>
            `).join("")
          : `<div class="participant-row"><em>No participants yet</em></div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            <div class="participants-list">
              ${participantsList}
            </div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Add delete event listeners for each participant
        const participantRows = activityCard.querySelectorAll(".participant-row");
        participantRows.forEach(row => {
          const deleteBtn = row.querySelector(".delete-participant");
          const emailSpan = row.querySelector(".participant-email");
          if (deleteBtn && emailSpan) {
            deleteBtn.addEventListener("click", async () => {
              await unregisterParticipant(name, emailSpan.textContent);
            });
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Unregister participant function
  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        setTimeout(() => { messageDiv.classList.add("hidden"); }, 3000);
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        setTimeout(() => { messageDiv.classList.add("hidden"); }, 3000);
      }
    } catch (error) {
      messageDiv.textContent = "Error unregistering participant.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 3000);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // <-- Refresh activities after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
