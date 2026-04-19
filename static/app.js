const trayListEl = document.getElementById("tray-list");
const statusEl = document.getElementById("status");
const formEl = document.getElementById("add-tray-form");
const formErrorEl = document.getElementById("form-error");
const trayTemplate = document.getElementById("tray-card-template");

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function setStatus(message) {
  statusEl.textContent = message;
}

function debounce(fn, delayMs) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

function isOlderThanWeek(dateString) {
  if (!dateString) {
    return false;
  }

  const inputDate = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(inputDate.getTime())) {
    return false;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = now.getTime() - inputDate.getTime();
  return diffMs > 7 * 24 * 60 * 60 * 1000;
}

function updateWarningState(cardEl) {
  const scoopedDate = cardEl.querySelector('[data-field="last_scooped_date"]').value;
  const warningEl = cardEl.querySelector(".warning");

  if (isOlderThanWeek(scoopedDate)) {
    cardEl.classList.add("is-warning");
    warningEl.textContent = "Warning: last scooped over a week ago.";
  } else {
    cardEl.classList.remove("is-warning");
    warningEl.textContent = "";
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Keep the default message when response has no JSON body.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function trayPayloadFromCard(cardEl) {
  const get = (field) => cardEl.querySelector(`[data-field="${field}"]`).value;
  return {
    description: get("description").trim(),
    litter_type_description: get("litter_type_description").trim(),
    last_scooped_date: get("last_scooped_date"),
    last_changed_date: get("last_changed_date"),
    notes: get("notes").trim(),
  };
}

function createTrayCard(tray) {
  const node = trayTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.id = String(tray.id);
  node.querySelector(".tray-id").textContent = `Tray #${tray.id}`;

  const saveStateEl = node.querySelector(".save-state");

  const setField = (field, value) => {
    node.querySelector(`[data-field="${field}"]`).value = value ?? "";
  };

  setField("description", tray.description);
  setField("litter_type_description", tray.litter_type_description);
  setField("last_scooped_date", tray.last_scooped_date);
  setField("last_changed_date", tray.last_changed_date);
  setField("notes", tray.notes);
  updateWarningState(node);

  const saveCard = debounce(async () => {
    saveStateEl.textContent = "Saving...";
    try {
      const payload = trayPayloadFromCard(node);
      const updated = await api(`/api/trays/${tray.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setField("description", updated.description);
      setField("litter_type_description", updated.litter_type_description);
      setField("last_scooped_date", updated.last_scooped_date);
      setField("last_changed_date", updated.last_changed_date);
      setField("notes", updated.notes);
      updateWarningState(node);
      saveStateEl.textContent = "Saved";
      setTimeout(() => {
        if (saveStateEl.textContent === "Saved") {
          saveStateEl.textContent = "";
        }
      }, 1000);
    } catch (error) {
      saveStateEl.textContent = error.message;
    }
  }, 350);

  const changedDateInput = node.querySelector('[data-field="last_changed_date"]');
  const scoopedDateInput = node.querySelector('[data-field="last_scooped_date"]');

  changedDateInput.addEventListener("change", () => {
    scoopedDateInput.value = changedDateInput.value;
    updateWarningState(node);
    saveCard();
  });

  scoopedDateInput.addEventListener("change", () => {
    updateWarningState(node);
  });

  node.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("input", saveCard);
    input.addEventListener("change", saveCard);
  });

  node.querySelector(".danger").addEventListener("click", async () => {
    const confirmed = window.confirm("Remove this litter tray?");
    if (!confirmed) return;
    try {
      await api(`/api/trays/${tray.id}`, { method: "DELETE" });
      node.remove();
      setStatus("Tray removed.");
      if (!trayListEl.children.length) {
        trayListEl.innerHTML = "<p>No litter trays yet. Add one above.</p>";
      }
    } catch (error) {
      setStatus(error.message);
    }
  });

  return node;
}

async function loadTrays() {
  setStatus("Loading trays...");
  try {
    const trays = await api("/api/trays");
    trayListEl.innerHTML = "";
    if (!trays.length) {
      trayListEl.innerHTML = "<p>No litter trays yet. Add one above.</p>";
      setStatus("Ready");
      return;
    }

    trays.forEach((tray, index) => {
      const card = createTrayCard(tray);
      card.style.animationDelay = `${index * 40}ms`;
      trayListEl.appendChild(card);
    });

    setStatus(`Loaded ${trays.length} tray(s).`);
  } catch (error) {
    setStatus(error.message);
  }
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  formErrorEl.textContent = "";
  const formData = new FormData(formEl);
  const payload = {
    description: String(formData.get("description") ?? "").trim(),
    litter_type_description: String(formData.get("litter_type_description") ?? "").trim(),
    last_scooped_date: String(formData.get("last_scooped_date") ?? todayDateString()),
    last_changed_date: String(formData.get("last_changed_date") ?? todayDateString()),
    notes: String(formData.get("notes") ?? "").trim(),
  };

  if (!payload.description || !payload.litter_type_description) {
    formErrorEl.textContent = "Description and litter type are required.";
    return;
  }

  try {
    const tray = await api("/api/trays", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const emptyHint = trayListEl.querySelector("p");
    if (emptyHint) {
      trayListEl.innerHTML = "";
    }

    const card = createTrayCard(tray);
    trayListEl.prepend(card);
    formEl.reset();
    formEl.last_scooped_date.value = todayDateString();
    formEl.last_changed_date.value = todayDateString();
    setStatus("Tray added.");
  } catch (error) {
    formErrorEl.textContent = error.message;
  }
});

formEl.last_changed_date.addEventListener("change", () => {
  formEl.last_scooped_date.value = formEl.last_changed_date.value;
});

formEl.last_scooped_date.value = todayDateString();
formEl.last_changed_date.value = todayDateString();
loadTrays();
