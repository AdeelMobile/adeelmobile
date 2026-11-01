(() => {
  "use strict";

  const db = window.adeelDb;
  const LOGIN_PATH = "/pages/login/";
  const ADMIN_PATH = "/pages/admin/dashboard/";
  const USER_PATH = "/pages/user/";

  const getRole = async () => {
    const { data: { user }, error: userError } = await db.auth.getUser();
    if (userError || !user) return null;

    const { data: role, error } = await db.rpc("ims_whoami");
    if (error) throw error;
    return role;
  };

  const routeForRole = (role) => {
    if (role === "admin") return ADMIN_PATH;
    if (role === "user") return USER_PATH;
    return null;
  };

  const showMessage = (element, message) => {
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
  };

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    const message = document.getElementById("login-message");
    const submit = loginForm.querySelector('button[type="submit"]');

    db?.auth.getSession().then(async ({ data, error }) => {
      if (error || !data.session) return;
      try {
        const role = await getRole();
        const destination = routeForRole(role);
        if (destination) window.location.replace(destination);
        else await db.auth.signOut();
      } catch (e) {
        console.error("Existing session role check failed:", e);
        await db.auth.signOut();
      }
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!db) {
        showMessage(message, "Secure sign-in is temporarily unavailable. Please try again later.");
        return;
      }

      const loginInput = document.getElementById("email").value.trim().toLowerCase();
      const email = loginInput.includes("@") ? loginInput : `${loginInput}@adeelmobile.app`;
      const password = document.getElementById("password").value;
      if (!email || !password) {
        showMessage(message, "Enter your email address and password.");
        return;
      }

      if (message) {
        message.textContent = "";
        message.hidden = true;
      }
      submit.disabled = true;
      submit.textContent = "Signing in…";

      try {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const role = await getRole();
        const destination = routeForRole(role);
        if (!destination) {
          await db.auth.signOut();
          throw new Error("This account is not enabled for Adeel Mobile Installments.");
        }
        window.location.replace(destination);
      } catch (error) {
        console.error("Sign-in failed:", error);
        if (db) await db.auth.signOut();
        showMessage(
          message,
          error?.message === "This account is not enabled for Adeel Mobile Installments."
            ? error.message
            : "Sign-in failed. Check your email and password, then try again."
        );
      } finally {
        submit.disabled = false;
        submit.textContent = "Sign in";
      }
    });

    document.getElementById("password-toggle")?.addEventListener("click", () => {
      const input = document.getElementById("password");
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      document.getElementById("password-toggle").textContent = isPassword ? "Hide" : "Show";
    });
  }

  const protectedPage = document.body.dataset.requiredRole;
  if (protectedPage) {
    (async () => {
      try {
        if (!db) throw new Error("Database connection unavailable");
        const role = await getRole();
        if (role !== protectedPage) {
          await db.auth.signOut();
          window.location.replace(LOGIN_PATH);
          return;
        }
        document.body.hidden = false;
      } catch (error) {
        console.error("Protected page authorization failed:", error);
        await db?.auth.signOut();
        window.location.replace(LOGIN_PATH);
      }
    })();
  }

  document.getElementById("logout-button")?.addEventListener("click", async () => {
    if (db) await db.auth.signOut();
    window.location.replace(LOGIN_PATH);
  });
})();