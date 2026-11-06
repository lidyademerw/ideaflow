const columns = {
  "todo": document.getElementById("list-todo"),
  "in-progress": document.getElementById("list-in-progress"),
  "completed": document.getElementById("list-completed")
};

const counts = {
  "todo": document.getElementById("count-todo"),
  "in-progress": document.getElementById("count-in-progress"),
  "completed": document.getElementById("count-completed")
};

const ideaForm = document.getElementById("idea-form");
const ideaTitleInput = document.getElementById("idea-title");
const ideaDescInput = document.getElementById("idea-desc");
const ideaStartDateInput = document.getElementById("idea-start-date");
const ideaEndDateInput = document.getElementById("idea-end-date");
const submitBtn = document.getElementById("submit-btn");

const titleError = document.getElementById("title-error");
const titleCharCount = document.getElementById("title-char-count");
const descCharCount = document.getElementById("desc-char-count");
const MAX_TITLE_LENGTH = 60;
const MAX_DESC_LENGTH = 500;

const aiFixTitleBtn = document.getElementById("ai-fix-title");
const aiFixDescBtn = document.getElementById("ai-fix-desc");

const ideaModal = document.getElementById("idea-modal");
const modalCloseBtn = document.getElementById("modal-close");
const modalTitle = document.getElementById("modal-title");
const modalStatus = document.getElementById("modal-status");
const modalDate = document.getElementById("modal-date");
const modalStartDate = document.getElementById("modal-start-date");
const modalEndDate = document.getElementById("modal-end-date");
const modalCountdownWrap = document.getElementById("modal-countdown-wrap");
const modalDescription = document.getElementById("modal-description");

function normalizeStatus(status) {
  if (status === "in_progress" || status === "in-progress") return "in-progress";
  if (status === "completed" || status === "done") return "completed";
  return "todo";
}

function getStatusLabel(status) {
  if (status === "in-progress") return "In Progress";
  if (status === "completed") return "Completed";
  return "Idea";
}

function formatDate(dateString) {
  if (!dateString) return "";
  const isoFormatted = dateString.includes("T") ? dateString : dateString.replace(" ", "T") + "Z";
  const date = new Date(isoFormatted);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDisplayDate(dateString) {
  if (!dateString) return "—";
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getCountdownBadge(endDateString) {
  if (!endDateString) return null;

  const [year, month, day] = endDateString.split("-").map(Number);
  if (!year || !month || !day) return null;

  const targetDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((targetDate - today) / msPerDay);

  const badge = document.createElement("span");
  badge.className = "badge countdown-badge";

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    badge.classList.add("countdown-overdue");
    badge.textContent = `🔴 Overdue by ${daysOverdue}d`;
  } else if (diffDays === 0) {
    badge.classList.add("countdown-due-soon");
    badge.textContent = "⚠️ Due today";
  } else if (diffDays === 1) {
    badge.classList.add("countdown-due-soon");
    badge.textContent = "⚠️ Due tomorrow";
  } else if (diffDays <= 3) {
    badge.classList.add("countdown-due-soon");
    badge.textContent = `⚠️ ${diffDays} days left`;
  } else {
    badge.classList.add("countdown-on-track");
    badge.textContent = `⏳ ${diffDays} days left`;
  }

  return badge;
}

function openModal(idea) {
  modalTitle.textContent = idea.title;

  const normalizedStatus = normalizeStatus(idea.status);
  modalStatus.className = `badge badge-${normalizedStatus}`;
  modalStatus.textContent = getStatusLabel(normalizedStatus);

  modalDate.textContent = formatDate(idea.created_at);
  modalStartDate.textContent = formatDisplayDate(idea.start_date);
  modalEndDate.textContent = formatDisplayDate(idea.end_date);

  modalCountdownWrap.innerHTML = "";
  if (idea.end_date) {
    const countdownBadge = getCountdownBadge(idea.end_date);
    if (countdownBadge) {
      modalCountdownWrap.appendChild(countdownBadge);
    }
  }

  if (idea.description && idea.description.trim() !== "") {
    modalDescription.textContent = idea.description;
    modalDescription.classList.remove("empty");
  } else {
    modalDescription.textContent = "No description provided.";
    modalDescription.classList.add("empty");
  }

  ideaModal.showModal();
}

function createActionButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-action";
  button.textContent = label;
  button.addEventListener("click", event => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function createCardElement(idea) {
  const card = document.createElement("article");
  card.className = "idea-card";
  card.dataset.id = idea.id;
  card.dataset.status = idea.status;

  const top = document.createElement("div");
  top.className = "card-top";

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = idea.title;

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const badge = document.createElement("span");
  badge.className = `badge badge-${idea.status}`;
  badge.textContent = getStatusLabel(idea.status);
  meta.appendChild(badge);

  if (idea.end_date) {
    const countdownBadge = getCountdownBadge(idea.end_date);
    if (countdownBadge) {
      meta.appendChild(countdownBadge);
    }
  }

  top.appendChild(title);
  top.appendChild(meta);
  card.appendChild(top);

  if (idea.description && idea.description.trim() !== "") {
    const desc = document.createElement("p");
    desc.className = "card-description";
    desc.textContent = idea.description;
    card.appendChild(desc);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.addEventListener("click", event => event.stopPropagation());

  const actionGroup = document.createElement("div");
  actionGroup.className = "action-group";

  if (idea.status === "todo") {
    actionGroup.appendChild(createActionButton("Start ⚡", () => updateStatus(idea.id, "in-progress")));
  } else if (idea.status === "in-progress") {
    actionGroup.appendChild(createActionButton("← Ideas", () => updateStatus(idea.id, "todo")));
    actionGroup.appendChild(createActionButton("Done ✅", () => updateStatus(idea.id, "completed")));
  } else if (idea.status === "completed") {
    actionGroup.appendChild(createActionButton("← Reopen", () => updateStatus(idea.id, "in-progress")));
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-delete";
  deleteBtn.textContent = "🗑 Delete";
  deleteBtn.addEventListener("click", event => {
    event.stopPropagation();
    deleteIdea(idea.id, card);
  });

  actions.appendChild(actionGroup);
  actions.appendChild(deleteBtn);
  card.appendChild(actions);

  card.addEventListener("click", event => {
    if (event.target.closest("button") || event.target.closest(".card-actions")) {
      return;
    }
    openModal(idea);
  });

  return card;
}

function updateColumnStates() {
  Object.keys(columns).forEach(status => {
    const list = columns[status];
    const cards = list.querySelectorAll(".idea-card");
    counts[status].textContent = cards.length;

    let empty = list.querySelector(".empty-state");
    if (cards.length === 0) {
      if (!empty) {
        empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = status === "todo" ? "No ideas yet" : status === "in-progress" ? "Nothing in progress" : "No completed ideas";
        list.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  });
}

async function fetchIdeas() {
  try {
    const response = await fetch("/api/ideas");
    if (!response.ok) throw new Error("Failed to fetch ideas");
    const ideas = await response.json();

    Object.values(columns).forEach(list => {
      list.innerHTML = "";
    });

    ideas.forEach(idea => {
      const normalizedStatus = normalizeStatus(idea.status);
      const card = createCardElement({ ...idea, status: normalizedStatus });
      columns[normalizedStatus].appendChild(card);
    });

    updateColumnStates();
  } catch (error) {
    console.error("Error fetching ideas:", error);
  }
}

async function updateStatus(id, newStatus) {
  try {
    const response = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error("Failed to update status");
    const updatedIdea = await response.json();
    const normalizedStatus = normalizeStatus(updatedIdea.status);

    const existingCard = document.querySelector(`.idea-card[data-id="${id}"]`);
    if (existingCard) {
      existingCard.remove();
    }

    const newCard = createCardElement({ ...updatedIdea, status: normalizedStatus });
    columns[normalizedStatus].prepend(newCard);
    updateColumnStates();
  } catch (error) {
    console.error("Error updating idea status:", error);
  }
}

async function deleteIdea(id, card) {
  try {
    const response = await fetch(`/api/ideas/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Failed to delete idea");
    card.classList.add("card-removing");
    card.addEventListener("transitionend", () => {
      card.remove();
      updateColumnStates();
    }, { once: true });
  } catch (error) {
    console.error("Error deleting idea:", error);
  }
}

function updateCharCounts() {
  if (ideaTitleInput && titleCharCount) {
    const titleLen = ideaTitleInput.value.length;
    titleCharCount.textContent = `${titleLen}/${MAX_TITLE_LENGTH}`;
    if (titleLen > MAX_TITLE_LENGTH) {
      ideaTitleInput.classList.add("input-over-limit");
      titleCharCount.classList.add("count-over-limit");
      if (titleError) titleError.style.display = "block";
      if (submitBtn) submitBtn.disabled = true;
    } else {
      ideaTitleInput.classList.remove("input-over-limit");
      titleCharCount.classList.remove("count-over-limit");
      if (titleError) titleError.style.display = "none";
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  if (ideaDescInput && descCharCount) {
    const descLen = ideaDescInput.value.length;
    descCharCount.textContent = `${descLen}/${MAX_DESC_LENGTH}`;
  }
}

if (ideaTitleInput) {
  ideaTitleInput.addEventListener("input", updateCharCounts);
}

if (ideaDescInput) {
  ideaDescInput.addEventListener("input", updateCharCounts);
}

async function handleAiFix(input, btn, target) {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    input.classList.add("input-shake");
    setTimeout(() => input.classList.remove("input-shake"), 1000);
    return;
  }

  btn.textContent = "⏳";
  btn.disabled = true;

  try {
    const response = await fetch("/api/ai/fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target })
    });

    const data = await response.json();
    if (response.ok && data.fixed_text) {
      input.value = data.fixed_text;
      updateCharCounts();
      input.classList.add("input-glow");
      setTimeout(() => input.classList.remove("input-glow"), 1200);
    }
  } catch (error) {
    console.error(`AI fix failed for ${target}:`, error);
  } finally {
    btn.textContent = "✦Ai";
    btn.disabled = false;
  }
}

if (aiFixTitleBtn && ideaTitleInput) {
  aiFixTitleBtn.addEventListener("click", () => handleAiFix(ideaTitleInput, aiFixTitleBtn, "title"));
}

if (aiFixDescBtn && ideaDescInput) {
  aiFixDescBtn.addEventListener("click", () => handleAiFix(ideaDescInput, aiFixDescBtn, "desc"));
}

ideaForm.addEventListener("submit", async event => {
  event.preventDefault();
  const title = ideaTitleInput.value.trim();
  const description = ideaDescInput ? ideaDescInput.value.trim() : "";
  const startDate = ideaStartDateInput.value || null;
  const endDate = ideaEndDateInput.value || null;
  if (!title || title.length > MAX_TITLE_LENGTH) return;

  submitBtn.disabled = true;

  try {
    const response = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        start_date: startDate,
        end_date: endDate
      })
    });

    if (!response.ok) throw new Error("Failed to create idea");
    const newIdea = await response.json();
    const normalizedStatus = normalizeStatus(newIdea.status);
    const card = createCardElement({ ...newIdea, status: normalizedStatus });

    const list = columns[normalizedStatus];
    const emptyState = list.querySelector(".empty-state");
    if (emptyState) emptyState.remove();

    list.prepend(card);
    updateColumnStates();

    ideaForm.reset();
    updateCharCounts();
    ideaTitleInput.focus();
  } catch (error) {
    console.error("Error creating idea:", error);
  } finally {
    submitBtn.disabled = false;
  }
});

modalCloseBtn.addEventListener("click", () => {
  ideaModal.close();
});

ideaModal.addEventListener("click", event => {
  const rect = ideaModal.getBoundingClientRect();
  const isInDialog = (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
  if (!isInDialog) {
    ideaModal.close();
  }
});

ideaModal.addEventListener("cancel", () => {
  ideaModal.close();
});

document.addEventListener("DOMContentLoaded", fetchIdeas);
