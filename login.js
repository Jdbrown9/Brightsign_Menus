(async function() {
  await seedDefaultAdmin();
  const session = getSession();
  if (session) { window.location.href = "index.html"; return; }
  const form = document.getElementById("loginForm");
  const status = document.getElementById("loginStatus");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Signing in...";
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const result = await login(username, password);
    if (!result.ok) { status.textContent = result.message; return; }
    status.textContent = "";
    window.location.href = "index.html";
  });
})();