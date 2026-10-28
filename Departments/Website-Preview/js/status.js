
const statusForm = document.getElementById('find');
const phoneInput = document.getElementById('num');
const resultBox = document.getElementById('res');

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function showMessage(message) {
  resultBox.hidden = false;
  resultBox.innerHTML = `
    <div style="padding:12px;border:1px solid #d5d5d5;border-radius:8px;background:#f1f1f1;color:#222">
      ${escapeHTML(message)}
    </div>
  `;
}

function showApplication(row) {
  const status = String(row.status || 'pending');
  const rejection = status.toLowerCase() === 'rejected'
    ? `<div style="margin-top:12px"><strong>Reason:</strong> ${escapeHTML(row.rejection_reason || 'Please contact support.')}</div>`
    : '';

  resultBox.hidden = false;
  resultBox.innerHTML = `
    <div style="padding:16px;border:1px solid #d8d8d8;border-radius:9px;background:#fff;color:#222">
      <h3 style="margin:0 0 14px;font-size:20px">Application Status</h3>
      <p><strong>Application ID:</strong> ${escapeHTML(row.id)}</p>
      <p><strong>Name:</strong> ${escapeHTML(row.name || '—')}</p>
      <p><strong>Product:</strong> ${escapeHTML(row.product || '—')}</p>
      <p><strong>Variant:</strong> ${escapeHTML(row.variant || '—')}</p>
      <p><strong>Plan:</strong> ${escapeHTML(row.plan || '—')}</p>
      <p><strong>Status:</strong> ${escapeHTML(status.charAt(0).toUpperCase() + status.slice(1))}</p>
      ${rejection}
    </div>
  `;
}

function setupApplicationIdField() {
  let idInput = document.getElementById('application-id');

  if (!idInput) {
    const label = document.createElement('label');
    label.htmlFor = 'application-id';
    label.textContent = 'Application ID';

    idInput = document.createElement('input');
    idInput.id = 'application-id';
    idInput.name = 'application_id';
    idInput.type = 'number';
    idInput.min = '1';
    idInput.step = '1';
    idInput.required = true;
    idInput.placeholder = 'Enter application ID';
    idInput.autocomplete = 'off';
    idInput.style.width = '100%';
    idInput.style.marginBottom = '12px';

    statusForm.insertBefore(label, statusForm.firstChild);
    statusForm.insertBefore(idInput, label.nextSibling);
  }

  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('id');

  if (requestedId && /^\d+$/.test(requestedId)) {
    idInput.value = requestedId;
  }

  statusForm.hidden = false;
  return idInput;
}

async function checkApplication(idInput) {
  const id = idInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!id || !phone) {
    showMessage('Enter your application ID and the phone number used in the application.');
    return;
  }

  if (!window.db || !db.functions) {
    showMessage('The status service is unavailable. Please try again later.');
    return;
  }

  const submitButton = statusForm.querySelector('[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Checking...';
  }

  showMessage('Checking your application...');

  try {
    const { data, error } = await db.functions.invoke('verification-status', {
      body: {
        id: Number(id),
        phone
      }
    });

    if (error || data?.error) {
      showMessage(data?.error || 'Unable to verify the details. Please check and try again.');
      return;
    }

    if (!data?.application) {
      showMessage('Application details could not be found.');
      return;
    }

    showApplication(data.application);
  } catch (error) {
    console.error('Status lookup error:', error);
    showMessage('Unable to check the application right now. Please try again.');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Check Status';
    }
  }
}

if (statusForm && phoneInput && resultBox) {
  const idInput = setupApplicationIdField();

  statusForm.addEventListener('submit', (event) => {
    event.preventDefault();
    checkApplication(idInput);
  });

  const params = new URLSearchParams(window.location.search);

  if (!params.get('id')) {
    resultBox.hidden = true;
  } else {
    showMessage('Enter the phone number used in your application, then check your status.');
  }
}
