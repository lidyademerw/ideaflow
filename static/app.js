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
const ideaDescriptionInput = document.getElementById("idea-description");
const submitBtn = document.getElementById("submit-btn");

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

function createActionButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-action";
  button.textContent = label;
  button.addEventListener("click", onClick);
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

  const badge = document.createElement("span");
  badge.className = `badge badge-${idea.status}`;
  badge.textContent = getStatusLabel(idea.status);

  top.appendChild(title);
  top.appendChild(badge);
  card.appendChild(top);

  if (idea.description && idea.description.trim() !== "") {
    const desc = document.createElement("p");
    desc.className = "card-description";
    desc.textContent = idea.description;
    card.appendChild(desc);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

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
  deleteBtn.addEventListener("click", () => deleteIdea(idea.id, card));

  actions.appendChild(actionGroup);
  actions.appendChild(deleteBtn);
  card.appendChild(actions);

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

ideaForm.addEventListener("submit", async event => {
  event.preventDefault();
  const title = ideaTitleInput.value.trim();
  const description = ideaDescriptionInput.value.trim();
  if (!title) return;

  submitBtn.disabled = true;

  try {
    const response = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description })
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
    ideaTitleInput.focus();
  } catch (error) {
    console.error("Error creating idea:", error);
  } finally {
    submitBtn.disabled = false;
  }
});

document.addEventListener("DOMContentLoaded", fetchIdeas);

