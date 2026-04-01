(async function() {
  const session = await requireAuth("admin");
  if (!session) return;
  wireLogoutButton();
  const form = document.getElementById("createUserForm");
  const tbody = document.getElementById("usersTableBody");
  const statusBox = document.getElementById("userStatus");
  renderUsers();
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value;
    const role = document.getElementById("newRole").value;
    if (!username || !password) { setStatus("Username and password are required.", true); return; }
    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) { setStatus("That username already exists.", true); return; }
    users.push({ username, passwordHash: await hashPassword(password), role, createdAt:new Date().toISOString() });
    saveUsers(users);
    form.reset(); document.getElementById("newRole").value = "staff"; renderUsers(); setStatus(`Created user ${username}.`, false, true);
  });
  function renderUsers() {
    const users = getUsers(); tbody.innerHTML = "";
    users.forEach((user) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(user.username)}</td>
        <td><select data-user="${escapeHtml(user.username)}" data-action="role"><option value="staff" ${user.role === "staff" ? "selected" : ""}>Staff</option><option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option></select></td>
        <td><input type="password" data-user="${escapeHtml(user.username)}" data-action="password" placeholder="Enter new password" /></td>
        <td><div class="row-actions"><button class="btn" data-user="${escapeHtml(user.username)}" data-action="reset">Save Changes</button><button class="btn btn-danger" data-user="${escapeHtml(user.username)}" data-action="delete">Delete User</button></div></td>
      `;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("button[data-action='reset']").forEach(btn => btn.addEventListener("click", async () => {
      const username = btn.dataset.user;
      const roleInput = tbody.querySelector(`select[data-user="${cssEscape(username)}"][data-action="role"]`);
      const passwordInput = tbody.querySelector(`input[data-user="${cssEscape(username)}"][data-action="password"]`);
      const users = getUsers(), user = users.find(u => u.username === username); if (!user) return;
      user.role = roleInput.value;
      if (passwordInput.value.trim()) user.passwordHash = await hashPassword(passwordInput.value);
      saveUsers(users); renderUsers(); setStatus(`Updated user ${username}.`, false, true);
    }));
    tbody.querySelectorAll("button[data-action='delete']").forEach(btn => btn.addEventListener("click", () => {
      const username = btn.dataset.user;
      if (username === "admin") { setStatus("The default admin account cannot be deleted.", true); return; }
      saveUsers(getUsers().filter(u => u.username !== username)); renderUsers(); setStatus(`Deleted user ${username}.`, false, true);
    }));
  }
  function cssEscape(value) { return String(value).replace(/"/g, '\\"'); }
  function setStatus(message, isError = false, isSuccess = false) {
    statusBox.textContent = message;
    statusBox.classList.remove("error", "success");
    if (isError) statusBox.classList.add("error");
    if (isSuccess) statusBox.classList.add("success");
  }
  function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
})();