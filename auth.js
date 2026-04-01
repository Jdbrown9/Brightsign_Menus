const AUTH_USERS_KEY = "acwmc-users-v1";
const AUTH_SESSION_KEY = "acwmc-session-v1";

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function seedDefaultAdmin() {
  const users = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "[]");
  if (users.length > 0) return;
  const passwordHash = await hashPassword("ChangeMe123!");
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify([{ username:"admin", passwordHash, role:"admin", createdAt:new Date().toISOString() }]));
}
function getUsers() { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "[]"); }
function saveUsers(users) { localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users)); }
function getSession() { return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || "null"); }
function saveSession(session) { sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session)); }
function clearSession() { sessionStorage.removeItem(AUTH_SESSION_KEY); }
async function login(username, password) {
  await seedDefaultAdmin();
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return { ok:false, message:"Invalid username or password." };
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) return { ok:false, message:"Invalid username or password." };
  saveSession({ username:user.username, role:user.role, loginAt:new Date().toISOString() });
  return { ok:true, user };
}
function logout() { clearSession(); window.location.href = "login.html"; }
async function requireAuth(requiredRole = null) {
  await seedDefaultAdmin();
  const session = getSession();
  if (!session) { window.location.href = "login.html"; return null; }
  if (requiredRole && session.role !== requiredRole) { window.location.href = "index.html"; return null; }
  return session;
}
function wireLogoutButton() {
  const btn = document.getElementById("logoutBtn");
  if (btn) btn.addEventListener("click", logout);
}