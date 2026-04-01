const STORAGE_KEY = "catering-menu-manager-v1";

const starterItems = [
  { id: "hot-dog", name: "Hot Dog", price: "$5.00" },
  { id: "pretzel", name: "Soft Pretzel", price: "$6.00" },
  { id: "soda", name: "Fountain Soda", price: "$4.00" }
];

const state = loadState();

const els = {
  menuTableBody: document.getElementById("menuTableBody"),
  addItemBtn: document.getElementById("addItemBtn"),
  publishBtn: document.getElementById("publishBtn"),
  exportBtn: document.getElementById("exportBtn"),
  statusBox: document.getElementById("statusBox"),
  searchInput: document.getElementById("searchInput"),
  githubOwner: document.getElementById("githubOwner"),
  githubRepo: document.getElementById("githubRepo"),
  githubBranch: document.getElementById("githubBranch"),
  siteBaseUrl: document.getElementById("siteBaseUrl"),
  githubToken: document.getElementById("githubToken")
};

bindAdminSettings();
bindTopActions();
renderTable();
setStatus("Ready.");

function defaultState() {
  return {
    items: structuredClone(starterItems),
    removedItems: [],
    settings: {
      githubOwner: "",
      githubRepo: "",
      githubBranch: "main",
      siteBaseUrl: "",
      githubToken: ""
    }
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const sessionToken = sessionStorage.getItem("githubToken") || "";
  if (!raw) {
    const fresh = defaultState();
    fresh.settings.githubToken = sessionToken;
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw);
    parsed.items = Array.isArray(parsed.items) ? parsed.items : structuredClone(starterItems);
    parsed.removedItems = Array.isArray(parsed.removedItems) ? parsed.removedItems : [];
    parsed.settings = parsed.settings || defaultState().settings;
    parsed.settings.githubToken = sessionToken;
    return parsed;
  } catch (error) {
    const fresh = defaultState();
    fresh.settings.githubToken = sessionToken;
    return fresh;
  }
}

function saveState() {
  sessionStorage.setItem("githubToken", state.settings.githubToken || "");
  const copy = JSON.parse(JSON.stringify(state));
  copy.settings.githubToken = "";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
}

function bindAdminSettings() {
  els.githubOwner.value = state.settings.githubOwner || "";
  els.githubRepo.value = state.settings.githubRepo || "";
  els.githubBranch.value = state.settings.githubBranch || "main";
  els.siteBaseUrl.value = state.settings.siteBaseUrl || "";
  els.githubToken.value = state.settings.githubToken || "";

  [
    ["githubOwner", els.githubOwner],
    ["githubRepo", els.githubRepo],
    ["githubBranch", els.githubBranch],
    ["siteBaseUrl", els.siteBaseUrl],
    ["githubToken", els.githubToken]
  ].forEach(([key, input]) => {
    input.addEventListener("input", (e) => {
      state.settings[key] = e.target.value.trim();
      saveState();
      renderTable();
    });
  });
}

function bindTopActions() {
  els.addItemBtn.addEventListener("click", addItem);
  els.publishBtn.addEventListener("click", publishChanges);
  els.exportBtn.addEventListener("click", exportUpdatePackage);
  els.searchInput.addEventListener("input", renderTable);
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function uniqueId(base) {
  const existing = new Set([
    ...state.items.map(x => x.id),
    ...state.removedItems.map(x => x.id)
  ]);

  let candidate = base || "menu-item";
  let i = 2;
  while (existing.has(candidate)) {
    candidate = `${base || "menu-item"}-${i}`;
    i += 1;
  }
  return candidate;
}

function getSiteBaseUrl() {
  return (state.settings.siteBaseUrl || "").replace(/\/+$/, "");
}

function getFeedUrl(itemId) {
  const base = getSiteBaseUrl();
  return base ? `${base}/feeds/${itemId}.xml` : "";
}

function renderTable() {
  const q = (els.searchInput.value || "").trim().toLowerCase();
  els.menuTableBody.innerHTML = "";

  state.items
    .filter(item => !q || item.name.toLowerCase().includes(q) || item.price.toLowerCase().includes(q))
    .forEach((item, idx) => {
      const tr = document.createElement("tr");
      const feedUrl = getFeedUrl(item.id);
      tr.innerHTML = `
        <td><input data-index="${idx}" data-field="name" type="text" value="${escapeHtml(item.name)}" /></td>
        <td><input data-index="${idx}" data-field="price" type="text" value="${escapeHtml(item.price)}" /></td>
        <td>
          <div class="feed-box">
            <input type="text" readonly value="${escapeHtml(feedUrl)}" />
            <span class="muted small">${feedUrl ? `Feed file: feeds/${escapeHtml(item.id)}.xml` : "Enter Site base URL in Admin setup to generate the feed link."}</span>
          </div>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn" data-action="copy" data-id="${escapeHtml(item.id)}">Copy Feed URL</button>
            <button class="btn btn-danger" data-action="remove" data-index="${idx}">Remove</button>
          </div>
        </td>
      `;
      els.menuTableBody.appendChild(tr);
    });

  els.menuTableBody.querySelectorAll("input[data-field]").forEach(input => {
    input.addEventListener("input", onItemEdit);
    input.addEventListener("change", onItemCommit);
  });

  els.menuTableBody.querySelectorAll("button[data-action='copy']").forEach(btn => {
    btn.addEventListener("click", () => copyFeedUrl(btn.dataset.id));
  });

  els.menuTableBody.querySelectorAll("button[data-action='remove']").forEach(btn => {
    btn.addEventListener("click", () => removeItem(Number(btn.dataset.index)));
  });
}

function onItemEdit(e) {
  const idx = Number(e.target.dataset.index);
  const field = e.target.dataset.field;
  state.items[idx][field] = e.target.value;
  saveState();
}

function onItemCommit(e) {
  const idx = Number(e.target.dataset.index);
  const field = e.target.dataset.field;
  const value = e.target.value.trim();

  if (field === "name") {
    const oldId = state.items[idx].id;
    const newName = value || "New Item";
    const newId = uniqueId(slugify(newName));
    if (newId !== oldId) {
      state.removedItems.push({ ...state.items[idx], id: oldId });
      state.items[idx].id = newId;
    }
    state.items[idx].name = newName;
  }

  if (field === "price") {
    state.items[idx].price = value || "$0.00";
  }

  saveState();
  renderTable();
}

function addItem() {
  const id = uniqueId("new-item");
  state.items.push({ id, name: "New Item", price: "$0.00" });
  saveState();
  renderTable();
  setStatus(`Added ${id}.`);
}

function removeItem(idx) {
  const removed = state.items.splice(idx, 1)[0];
  if (!removed) return;
  state.removedItems.push(removed);
  saveState();
  renderTable();
  setStatus(`Removed ${removed.name}. Its feed will be marked unavailable after publish.`);
}

async function copyFeedUrl(itemId) {
  const url = getFeedUrl(itemId);
  if (!url) {
    setStatus("Enter the Site base URL in Admin setup first.", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    setStatus("Feed URL copied.");
  } catch (error) {
    setStatus("Copy failed. Copy the URL manually from the box.", true);
  }
}

function menuJson() {
  return {
    generatedAt: new Date().toISOString(),
    items: state.items.map(item => ({
      id: item.id,
      name: item.name.trim(),
      price: item.price.trim(),
      feedPath: `feeds/${item.id}.xml`
    }))
  };
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildFeedXml(item, unavailable = false) {
  const title = `${item.name}`;
  const desc = unavailable ? `Unavailable` : `${item.price}`;
  const pubDate = new Date().toUTCString();
  const link = getFeedUrl(item.id) || `feeds/${item.id}.xml`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(item.name)} feed</title>
    <description>BrightSign menu text feed for ${xmlEscape(item.name)}</description>
    <link>${xmlEscape(link)}</link>
    <lastBuildDate>${xmlEscape(pubDate)}</lastBuildDate>
    <item>
      <title>${xmlEscape(title)}</title>
      <description>${xmlEscape(desc)}</description>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="false">${xmlEscape(item.id)}-${Date.now()}</guid>
      <pubDate>${xmlEscape(pubDate)}</pubDate>
    </item>
  </channel>
</rss>`;
}

async function exportUpdatePackage() {
  const files = {};
  files["menu.json"] = JSON.stringify(menuJson(), null, 2);

  state.items.forEach(item => {
    files[`feeds/${item.id}.xml`] = buildFeedXml(item, false);
  });

  state.removedItems.forEach(item => {
    files[`feeds/${item.id}.xml`] = buildFeedXml(item, true);
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    files
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, "brightsign-menu-update-package.json");
  setStatus("Downloaded update package.");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function publishChanges() {
  const { githubOwner, githubRepo, githubBranch, githubToken } = state.settings;
  if (!githubOwner || !githubRepo || !githubBranch || !githubToken) {
    setStatus("Publish is not set up on this computer. Use Download Update Package or ask an admin to finish Admin setup.", true);
    return;
  }

  try {
    els.publishBtn.disabled = true;
    els.publishBtn.textContent = "Publishing...";
    setStatus("Publishing changes...");

    await putFile("menu.json", JSON.stringify(menuJson(), null, 2), "Update menu.json");

    for (const item of state.items) {
      await putFile(`feeds/${item.id}.xml`, buildFeedXml(item, false), `Update ${item.id} feed`);
    }

    for (const item of state.removedItems) {
      await putFile(`feeds/${item.id}.xml`, buildFeedXml(item, true), `Mark ${item.id} unavailable`);
    }

    setStatus("Publish complete.", false, true);
  } catch (error) {
    console.error(error);
    setStatus(`Publish failed: ${error.message}`, true);
  } finally {
    els.publishBtn.disabled = false;
    els.publishBtn.textContent = "Publish Changes";
  }
}

async function putFile(path, content, message) {
  const { githubOwner, githubRepo, githubBranch, githubToken } = state.settings;
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(githubOwner)}/${encodeURIComponent(githubRepo)}/contents/${path}`;

  const readResp = await fetch(`${apiUrl}?ref=${encodeURIComponent(githubBranch)}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json"
    }
  });

  let sha;
  if (readResp.ok) {
    const existing = await readResp.json();
    sha = existing.sha;
  } else if (readResp.status !== 404) {
    throw new Error(`Could not read ${path}`);
  }

  const body = {
    message,
    branch: githubBranch,
    content: btoa(unescape(encodeURIComponent(content)))
  };
  if (sha) body.sha = sha;

  const writeResp = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!writeResp.ok) {
    const text = await writeResp.text();
    throw new Error(`Could not write ${path}: ${writeResp.status} ${text}`);
  }
}

function setStatus(message, isError = false, isSuccess = false) {
  els.statusBox.textContent = message;
  els.statusBox.classList.remove("error", "success");
  if (isError) els.statusBox.classList.add("error");
  if (isSuccess) els.statusBox.classList.add("success");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
