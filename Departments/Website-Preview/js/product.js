let P = null, months = 6, img = '', imgs = [];
let USER_VIEW = false;
let USER_PROFIT = 0;
let USER_PROFIT_PERCENT = 0;

async function loadUserProfit(brandId, price) {
  USER_VIEW = false;
  USER_PROFIT = 0;
  USER_PROFIT_PERCENT = 0;

  // Profit ke liye explicit user view aur valid session dono zaroori hain.
  if (qs.get('mode') !== 'user') return;

  try {
    const { data: sessionData, error: sessionError } =
      await sb.auth.getSession();

    if (sessionError || !sessionData.session?.user) return;

    const user = sessionData.session.user;

    if (user.app_metadata?.role !== 'user') return;

    const { data: profile, error: profileError } = await sb
      .from('users')
      .select('id, auth_user_id, status')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) return;

    if (String(profile.status || 'active').toLowerCase() !== 'active') return;

    const { data: rules, error: rulesError } = await sb
      .from('user_brand_profit')
      .select('brand_id, percent')
      .eq('user_id', profile.id)
      .eq('brand_id', brandId)
      .maybeSingle();

    if (rulesError) {
      console.error('Brand profit loading error:', rulesError);
      return;
    }

    USER_PROFIT_PERCENT = Number(rules?.percent) || 0;
    USER_PROFIT = Math.round(price * USER_PROFIT_PERCENT / 100);
    USER_VIEW = true;
  } catch (error) {
    console.error('User profit loading error:', error);
    USER_VIEW = false;
    USER_PROFIT = 0;
    USER_PROFIT_PERCENT = 0;
  }
}

async function load() {
  const id = Number(qs.get('id'));

  if (!Number.isFinite(id) || id <= 0) {
    $('app').innerHTML = '<p class="muted">Product not found.</p>';
    return;
  }

  const { data, error } = await sb
    .from('variants')
    .select(`
      id,
      variant,
      price,
      discount_price,
      specs,
      image_link,
      gallery_images,
      models (
        model,
        show_inst_website,
        brands (
          id,
          brand,
          logo_url,
          show_inst_website
        )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !data || !data.models || !data.models.brands) {
    $('app').innerHTML = '<p class="muted">Product not found.</p>';
    return;
  }

  if (
    data.models.show_inst_website !== true ||
    data.models.brands.show_inst_website !== true
  ) {
    $('app').innerHTML = '<p class="muted">Product not available.</p>';
    return;
  }

  const pi = await sb
    .from('product_images')
    .select('image_url')
    .eq('variant_id', id)
    .order('is_cover', { ascending: false })
    .order('sort_order');

  imgs = (pi.data || []).map(row => row.image_url);

  if (!imgs.length) {
    imgs = (data.gallery_images || data.image_link || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
  }

  const brand = data.models.brands;
  const names = splitName(brand.brand, data.models.model, data.variant);
  const price = effPrice(data);

  P = {
    id,
    brand: brand.brand,
    brandId: brand.id,
    brandLogo: brand.logo_url,
    title: names.title,
    spec: names.spec,
    price,
    old: Number(data.price) || 0,
    specs: data.specs || {}
  };

  // Profit sirf authenticated user-view mein calculate hoga.
  await loadUserProfit(P.brandId, P.price);

  img = imgs[0] || '';
  draw();
}

function draw() {
  const sp = Object.entries(P.specs)
    .map(([key, value]) =>
      `<p><b>${esc(key)}:</b> ${esc(value)}</p>`
    )
    .join('') || '<p class="muted">Specs not available.</p>';

  const profitHTML = USER_VIEW
    ? `
      <section class="box user-profit-box">
        <span>Your Profit (${USER_PROFIT_PERCENT}%)</span>
        <strong>${rs(USER_PROFIT)}</strong>
      </section>
    `
    : '';

  $('app').innerHTML = `
    <div class="imgbox">${imgTag(img, 'id="main"')}</div>

    <div class="thumbs">
      ${imgs.map(url =>
        `<img src="${esc(url)}"
          class="${url === img ? 'on' : ''}"
          data-u="${esc(url)}">`
      ).join('')}
    </div>

    <h1>${esc(P.title)}</h1>
    <div class="spec">${esc(P.spec)}</div>

    <div class="price">
      ${rs(P.price)}
      ${P.old > P.price ? `<s>${rs(P.old)}</s>` : ''}
    </div>

    ${profitHTML}

    <button class="btn ghost" id="cp">Copy Link</button>
    <button class="btn" id="poster">Download Poster</button>

    <section class="box">
      <h2>Specifications</h2>
      ${sp}
    </section>

    <h2>Choose Installment Plan</h2>

    <div class="plans">
      ${[3, 6, 9].map(m => {
        const c = calcPlan(P.price, m);

        return `
          <div class="plan ${m === months ? 'on' : ''}" data-m="${m}">
            <div class="ph">${m} Months</div>
            <div class="pb">
              <span>Advance Payment</span>
              <b>${rs(c.advance)}</b>
              <span>Monthly Installment</span>
              <b>${rs(c.monthly)}</b>
              <span>Total Amount</span>
              <b>${rs(c.total)}</b>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <button class="btn" id="go">Verification Now</button>
  `;

  // Referral code current product URL se preserve karein.
  const referralCode = qs.get('referral');

  $('cp').onclick = () => {
    // Customer ke link mein mode=user ya profit kabhi share na karein.
    const publicURL = new URL('product.html', location.href);
    publicURL.searchParams.set('id', P.id);

    if (referralCode) {
      publicURL.searchParams.set('referral', referralCode);
    }

    copyText(shareText(P.title + ' ' + P.spec, publicURL.href));
  };

  $('poster').onclick = () => makePoster(P, img);

  $('go').onclick = () => {
    const verificationURL = new URL('verification.html', location.href);

    verificationURL.searchParams.set('id', P.id);
    verificationURL.searchParams.set('months', months);
    verificationURL.searchParams.set('img', img);

    if (referralCode) {
      verificationURL.searchParams.set('referral', referralCode);
    }

    location.href = verificationURL.href;
  };

  document.querySelectorAll('.thumbs img').forEach(thumb => {
    thumb.onclick = () => {
      img = thumb.dataset.u;
      draw();
    };
  });

  document.querySelectorAll('.plan').forEach(plan => {
    plan.onclick = () => {
      months = Number(plan.dataset.m);
      draw();
    };
  });
}

load();