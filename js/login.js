
"use strict";

// Adeel Mobile - Shared Login Form

const form = document.getElementById('loginForm');
const userInput = document.getElementById('username');
const passInput = document.getElementById('password');
const msgBox = document.getElementById('msg');
const loginBtn = document.getElementById('loginBtn');
const eyeBtn = document.getElementById('eyeBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

function showMsg(message) {
  msgBox.textContent = message || '';
  msgBox.classList.toggle('show', Boolean(message));
}

// Password show/hide
eyeBtn.addEventListener('click', () => {
  const show = passInput.type === 'password';

  passInput.type = show ? 'text' : 'password';
  eyeBtn.textContent = show ? 'Hide' : 'Show';

  eyeBtn.setAttribute(
    'aria-label',
    show ? 'Hide password' : 'Show password'
  );
});

// Forgot Password - Admin WhatsApp
forgotPasswordLink.addEventListener('click', (event) => {
  event.preventDefault();

  const username = userInput.value.trim().toLowerCase();

  if (!username) {
    showMsg('Please enter your username first.');
    userInput.focus();
    return;
  }

  const adminNumber = '923214744746';

  const message =
    'Assalam-o-Alaikum Admin,\n\n' +
    'Main Adeel Mobile ka user hoon. Main apne account ka password bhool gaya hoon.\n\n' +
    'Mera Username: ' + username + '\n\n' +
    'Meherbani karke mera password reset kar dein.\n\n' +
    'Shukriya.';

  const whatsappURL =
    'https://wa.me/' + adminNumber +
    '?text=' + encodeURIComponent(message);

  window.open(whatsappURL, '_blank');
});

// Login
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMsg('');

  const username = userInput.value.trim().toLowerCase();
  const password = passInput.value;

  if (!username || !password) {
    showMsg('Enter your username and password.');
    return;
  }

  if (username.includes('@')) {
    showMsg('Enter your username, not an email address.');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    const result = await loginUser(username, password);

    if (!result.ok) {
      showMsg(result.message);
      return;
    }

    // Role ke mutabiq dashboard open hoga.
    window.location.replace(result.redirect);

  } catch (error) {
    console.error('Login error:', error);
    showMsg('Unable to sign in. Please try again.');

  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
});

// Existing session check
redirectIfLoggedIn();
