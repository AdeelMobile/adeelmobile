const id = +qs.get('id');
const months = +qs.get('months') || 6;
const sel = qs.get('img') || '';
const referralCode = qs.get('referral') || '';

let V = null;

const backURL = new URL('product.html', location.href);
backURL.searchParams.set('id', id);

if (referralCode) {
  backURL.searchParams.set('referral', referralCode);
}

$('back').href = backURL.href;

async function load() {
  const { data, error } = await sb
    .from('variants')
    .select('id,variant,price,discount_price,image_link,models(model,brands(brand))')
    .eq('id', id)
    .single();

  if (error || !data) {
    $('sum').innerHTML = '<p>Product not found.</p>';
    $('f').hidden = true;
    return;
  }

  V = {
    name: fullName(
      data.models.brands.brand,
      data.models.model,
      data.variant
    ),
    brand: data.models.brands.brand,
    model: data.models.model,
    variant: data.variant,
    price: effPrice(data),
    img: sel || data.image_link
  };

  const c = calcPlan(V.price, months);

  $('sum').innerHTML = `
    <div class="plan">
      <div class="ph">${months} Months</div>
      <div class="pb sum">
        ${imgTag(V.img)}
        <div>
          <b>${esc(V.name)}</b><br>
          Advance ${rs(c.advance)}<br>
          Monthly ${rs(c.monthly)}
        </div>
      </div>
    </div>
  `;
}

/* Convert compressed JPEG image to Base64 for secure server upload */
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('CNIC image read nahi ho saki.'));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('CNIC image read nahi ho saki.'));
    };

    reader.readAsDataURL(blob);
  });
}

/* Images are now sent to the Edge Function, not uploaded directly */
async function up(file) {
  if (!file) {
    throw new Error('Please select both CNIC images.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('CNIC ke liye image select karein.');
  }

  const blob = await shrink(file);

  if (!blob || !blob.size) {
    throw new Error('CNIC image compress nahi ho saki.');
  }

  return await blobToDataURL(blob);
}

function whatsappNumber(value) {
  let number = String(value || '').replace(/\D/g, '');

  if (number.startsWith('03') && number.length === 11) {
    number = '92' + number.slice(1);
  } else if (number.startsWith('3') && number.length === 10) {
    number = '92' + number;
  }

  return number;
}

function showSuccess(verificationId, customerWhatsapp) {
  const statusUrl = new URL(
    'status.html?id=' + encodeURIComponent(verificationId),
    location.href
  ).href;

  const productName = V.brand + ' ' + V.model;
  const planName = months + ' Months';

  const message = [
    'Adeel Mobile - Verification Received',
    '',
    'Dear ' + $('name').value.trim() + ',',
    'Your verification has been submitted successfully.',
    '',
    'Verification ID: ' + verificationId,
    'Product: ' + productName,
    'Variant: ' + V.variant,
    'Installment Plan: ' + planName,
    'Verification Status: Pending Verification',
    '',
    'Check your verification status here:',
    statusUrl,
    '',
    'Use the same mobile number provided in your verification form to check your status.',
    '',
    'Thank you for choosing Adeel Mobile.'
  ].join('\n');

  const box = document.createElement('div');
  box.className = 'plan';
  box.style.marginTop = '16px';
  box.style.padding = '16px';

  const heading = document.createElement('h3');
  heading.textContent = 'Verification Submitted Successfully';

  const details = document.createElement('p');
  details.textContent =
    'Verification ID: ' + verificationId +
    '. Your verification status is Pending Verification.';

  const waButton = document.createElement('button');
  waButton.type = 'button';
  waButton.textContent = 'Send WhatsApp Status';
  waButton.style.width = '100%';
  waButton.style.marginTop = '10px';

  waButton.addEventListener('click', () => {
    const number = whatsappNumber(customerWhatsapp);

    if (!/^92\d{10}$/.test(number)) {
      alert('WhatsApp number sahi nahi hai. Form mein diya gaya number check karein.');
      return;
    }

    const waUrl =
      'https://wa.me/' + number +
      '?text=' + encodeURIComponent(message);

    window.open(waUrl, '_blank');
  });

  const statusLink = document.createElement('a');
  statusLink.href = statusUrl;
  statusLink.textContent = 'Check Verification Status';
  statusLink.style.display = 'block';
  statusLink.style.marginTop = '14px';

  box.appendChild(heading);
  box.appendChild(details);
  box.appendChild(waButton);
  box.appendChild(statusLink);

  $('f').hidden = true;
  $('sum').insertAdjacentElement('afterend', box);
}

$('f').onsubmit = async e => {
  e.preventDefault();
  $('err').textContent = '';

  if (!V) {
    $('err').textContent =
      'Product information is not ready. Please try again.';
    return;
  }

  const contact = $('contact').value.replace(/\D/g, '');
  const whatsapp = $('wapp').value.replace(/\D/g, '');

  const validPhone = n => /^03\d{9}$/.test(n);

  if (!validPhone(contact) || !validPhone(whatsapp)) {
    $('err').textContent =
      'Mobile number sahi likhein (03XXXXXXXXX).';
    return;
  }

  $('sub').disabled = true;
  $('sub').textContent = 'Submitting...';

  try {
    const front = await up($('front').files[0]);
    const back = await up($('back2').files[0]);

    const payload = {
      name: $('name').value.trim(),
      father_name: $('father').value.trim(),
      contact,
      whatsapp,
      id_front: front,
      id_back: back,
      product: V.brand + ' ' + V.model,
      variant: V.variant,
      plan: months + ' Months',
      months,
      has_loan: $('loan').value,
      variant_id: id,
      selected_image: V.img,
      referral_code: referralCode || null
    };

    const { data, error } = await sb.functions.invoke(
      'submit-verification',
      { body: payload }
    );

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    if (!data?.id) {
      throw new Error('Verification ID was not returned.');
    }

    showSuccess(data.id, whatsapp);

  } catch (x) {
    $('err').textContent =
      'Error: ' + (x.message || 'Verification submit nahi ho saki.');

    $('sub').disabled = false;
    $('sub').textContent = 'Submit for Verification';
  }
};

load();