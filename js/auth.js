
// Adeel Mobile - Shared Authentication

const SITE_ROOT = new URL('../', document.currentScript.src).href;

const LOGIN_PAGE = SITE_ROOT + 'index.html';

const ADMIN_HOME_PAGE =
  SITE_ROOT + 'Departments/Main-Dashboard/main-dashboard.html';

const USER_HOME_PAGE =
  SITE_ROOT + 'Departments/User-App/index.html';

const EMAIL_DOMAIN = '@adeelmobile.app';

function usernameToEmail(username) {
  return username.trim().toLowerCase() + EMAIL_DOMAIN;
}

function isAppUser(user) {
  return !!(
    user &&
    user.app_metadata &&
    user.app_metadata.role === 'user'
  );
}

async function loginUser(username, password) {
  if (typeof db === 'undefined' || !db?.auth) {
    return {
      ok: false,
      message: 'Database connection is unavailable.'
    };
  }

  const { data, error } = await db.auth.signInWithPassword({
    email: usernameToEmail(username),
    password: password
  });

  if (error || !data?.user) {
    return {
      ok: false,
      message: 'Username or password is incorrect.'
    };
  }

  return {
    ok: true,
    user: data.user,
    redirect: isAppUser(data.user)
      ? USER_HOME_PAGE
      : ADMIN_HOME_PAGE
  };
}

async function logoutUser() {
  if (typeof db !== 'undefined' && db?.auth) {
    await db.auth.signOut();
  }

  window.location.href = LOGIN_PAGE;
}

async function getSession() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

async function redirectIfLoggedIn() {
  if (typeof db === 'undefined' || !db?.auth) {
    return;
  }

  try {
    const session = await getSession();

    if (session?.user) {
      const destination = isAppUser(session.user)
        ? USER_HOME_PAGE
        : ADMIN_HOME_PAGE;

      window.location.replace(destination);
    }
  } catch (error) {
    console.error('Session check error:', error);
  }
}

// Admin pages par User accounts ko access nahi milega.
async function requireLogin() {
  const session = await getSession();

  if (!session || isAppUser(session.user)) {
    if (session) {
      await db.auth.signOut();
    }

    window.location.replace(LOGIN_PAGE);
    return null;
  }

  return session;
}
