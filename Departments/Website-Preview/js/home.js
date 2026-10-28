let ALL = [];
let USER_VIEW = false;
let CURRENT_PROFILE = null;
let PROFIT_BY_BRAND = {};

const S = {
  brand: qs.get('brand') || 'All',
  sort: qs.get('sort') === 'high' ? 'high' : 'low',
  min: +qs.get('min') || 0,
  max: +qs.get('max') || 0,
  mmin: +qs.get('mmin') || 0,
  mmax: +qs.get('mmax') || 0
};

const mo = p => calcPlan(p, 9).monthly;
const nf = x => Number(x || 0).toLocaleString('en-US');

const rg = (a, b, pre) =>
  a && b ? `${pre}${nf(a)} to ${pre}${nf(b)}` :
  b ? `Up to ${pre}${nf(b)}` :
  `Above ${pre}${nf(a)}`;

function fTitle() {
  const t = [];
  if (S.brand !== 'All') t.push(S.brand);
  if (S.min || S.max) t.push(rg(S.min, S.max, 'Rs. '));
  if (S.mmin || S.mmax) {
    t.push('Monthly ' + rg(S.mmin, S.mmax, 'Rs. '));
  }
  return t.join(' - ');
}

function fLink() {
  const u = new URL(location.href);
  const existingReferral = u.searchParams.get('referral');

  u.search = '';
  const p = u.searchParams;

  if (S.brand !== 'All') p.set('brand', S.brand);

  ['min', 'max', 'mmin', 'mmax'].forEach(k => {
    if (S[k]) p.set(k, S[k]);
  });

  p.set('sort', S.sort);

  if (existingReferral) {
    p.set('referral', existingReferral);
  } else if (CURRENT_PROFILE?.referral_code) {
    p.set('referral', CURRENT_PROFILE.referral_code);
  }

  return u.toString();
}

async function loadUserProfit() {
  USER_VIEW = false;
  CURRENT_PROFILE = null;
  PROFIT_BY_BRAND = {};

  if (qs.get('mode') !== 'user' || typeof sb === 'undefined') {
    return;
  }

  try {
    const { data: sessionData, error: sessionError } =
      await sb.auth.getSession();

    if (sessionError || !sessionData.session?.user) return;

    const user = sessionData.session.user;

    if (user.app_metadata?.role !== 'user') return;

    const { data: profile, error: profileError } = await sb
      .from('users')
      .select('id, auth_user_id, status, referral_code')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) return;

    if (String(profile.status || 'active').toLowerCase() !== 'active') {
      return;
    }

    const { data: rules, error: rulesError } = await sb
      .from('user_brand_profit')
      .select('brand_id, percent')
      .eq('user_id', profile.id);

    if (rulesError) return;

    (rules || []).forEach(rule => {
      PROFIT_BY_BRAND[String(rule.brand_id)] =
        Number(rule.percent) || 0;
    });

    CURRENT_PROFILE = profile;
    USER_VIEW = true;
  } catch (error) {
    console.error('User profit loading error:', error);
    USER_VIEW = false;
    CURRENT_PROFILE = null;
    PROFIT_BY_BRAND = {};
  }
}

/* Live Prices Ticker */
function renderLivePrices() {
  const track = $('live-prices-track');
  if (!track) return;

  if (!ALL.length) {
    track.textContent = 'No mobile prices available.';
    return;
  }

  const itemsHTML = ALL.map(product => {
    const plan3 = calcPlan(product.price, 3);
    const plan6 = calcPlan(product.price, 6);
    const plan9 = calcPlan(product.price, 9);

    return `
      <span class="ticker-item">
        <strong>${esc(product.brand)} ${esc(product.model)}</strong>
        <span>Cash: Rs. ${nf(product.price)}</span>
        <span>3M: Rs. ${nf(plan3.monthly)}/mo</span>
        <span>6M: Rs. ${nf(plan6.monthly)}/mo</span>
        <span>9M: Rs. ${nf(plan9.monthly)}/mo</span>
        <span>Advance: Rs. ${nf(plan9.advance)}</span>
      </span>
      <span class="ticker-separator">◆</span>
    `;
  }).join('');

  track.innerHTML = itemsHTML + itemsHTML;
}

/* Featured Mobile Banner Slider */
let promoSlideIndex = 0;
let promoSlideTimer = null;

function renderPromoSlide() {
  const windowElement = $('promo-slide-window');
  const countElement = $('promo-slide-count');

  if (!windowElement || !countElement) return;

  const products = ALL.filter(product =>
    Number(product.price) > 0
  );

  if (!products.length) {
    windowElement.innerHTML =
      '<p class="promo-banner-subtitle">No featured mobiles available.</p>';
    countElement.innerHTML = '';
    return;
  }

  if (promoSlideIndex >= products.length) {
    promoSlideIndex = 0;
  }

  const product = products[promoSlideIndex];

  const cleanModel = String(product.model || '').trim();
  const imageURL = String(product.img || '').trim();

  windowElement.innerHTML = `
    <div class="promo-slide">
      <div class="promo-slide-image">
        ${
          imageURL
            ? `<img src="${esc(imageURL)}"
                    alt="${esc(product.brand + ' ' + cleanModel)}"
                    loading="lazy"
                    onerror="this.style.display='none'">`
            : ''
        }
      </div>

      <div class="promo-slide-details">
        <span class="promo-slide-brand">${esc(product.brand)}</span>
        <strong class="promo-slide-model">${esc(cleanModel)}</strong>
        <span class="promo-slide-spec">${esc(product.spec || '')}</span>
        <span class="promo-slide-price">Rs. ${nf(product.price)}</span>
      </div>
    </div>
  `;

  countElement.innerHTML = products.map((_, index) => `
    <span class="promo-slide-dot ${
      index === promoSlideIndex ? 'active' : ''
    }"></span>
  `).join('');
}

function startPromoSlider() {
  if (promoSlideTimer) {
    clearInterval(promoSlideTimer);
  }

  promoSlideIndex = 0;
  renderPromoSlide();

  if (ALL.length > 1) {
    promoSlideTimer = setInterval(() => {
      promoSlideIndex = (promoSlideIndex + 1) % ALL.length;
      renderPromoSlide();
    }, 5000);
  }
}

async function load() {
  $('msg').textContent = 'Loading...';

  await loadUserProfit();

  const { data, error } = await sb
    .from('variants')
    .select(`
      id,
      variant,
      price,
      discount_price,
      image_link,
      models!inner (
        model,
        show_inst_website,
        brands!inner (
          id,
          brand,
          show_inst_website
        )
      )
    `)
    .eq('models.show_inst_website', true)
    .eq('models.brands.show_inst_website', true)
    .limit(1000);

  if (error) {
    $('msg').textContent = 'Error: ' + error.message;

    const ticker = $('live-prices-track');
    if (ticker) ticker.textContent = 'Prices could not be loaded.';

    const promo = $('promo-slide-window');
    if (promo) {
      promo.innerHTML =
        '<p class="promo-banner-subtitle">Mobiles could not be loaded.</p>';
    }

    return;
  }

  ALL = (data || []).map(v => {
    const brand = v.models.brands;
    const n = splitName(brand.brand, v.models.model, v.variant);
    const price = effPrice(v);

    const profitPercent = USER_VIEW
      ? Number(PROFIT_BY_BRAND[String(brand.id)] || 0)
      : 0;

    return {
      id: v.id,
      brand: brand.brand,
      brandId: brand.id,
      model: v.models.model,
      title: n.title,
      spec: n.spec,
      variant: v.variant,
      price,
      img: v.image_link,
      profit: Math.round(price * profitPercent / 100),
      profitPercent
    };
  });

  renderLivePrices();
  startPromoSlider();

  const brands = ['All', ...new Set(ALL.map(x => x.brand))];

  $('chips').innerHTML = brands.map(brand =>
    `<button class="chip ${brand === S.brand ? 'on' : ''}"
      data-b="${esc(brand)}">${esc(brand)}</button>`
  ).join('');

  render();
}

function productURL(product, includeUserMode = true) {
  const url = new URL('product.html', location.href);

  url.searchParams.set('id', product.id);

  if (includeUserMode && USER_VIEW) {
    url.searchParams.set('mode', 'user');
  }

  const referral =
    qs.get('referral') || CURRENT_PROFILE?.referral_code || '';

  if (referral) {
    url.searchParams.set('referral', referral);
  }

  return url;
}

function render() {
  const query = $('q').value.toLowerCase().trim();

  const list = ALL
    .filter(x =>
      (S.brand === 'All' || x.brand === S.brand) &&
      (x.title + ' ' + x.spec).toLowerCase().includes(query) &&
      (!S.min || x.price >= S.min) &&
      (!S.max || x.price <= S.max) &&
      (!S.mmin || mo(x.price) >= S.mmin) &&
      (!S.mmax || mo(x.price) <= S.mmax)
    )
    .sort((a, b) =>
      (S.sort === 'low' ? a.price - b.price : b.price - a.price) ||
      a.title.localeCompare(b.title)
    );

  $('grid').innerHTML = list.map(product => {
    const profitHTML = USER_VIEW
      ? `<span class="user-profit">
           Your Profit: <b>Rs. ${nf(product.profit)}</b>
         </span>`
      : '';

    const detailURL = productURL(product, true);
    const advance = calcPlan(product.price, 9).advance;

    let cleanModel = String(product.model || '').trim();
    const variant = String(product.variant || '').trim();

    if (variant && cleanModel.endsWith(variant)) {
      cleanModel = cleanModel
        .slice(0, -variant.length)
        .trim();
    }

    const detailHref = esc(
      detailURL.pathname + detailURL.search
    );

    return `
      <article class="card">
        <a class="card-main" href="${detailHref}">

          ${imgTag(product.img, 'loading="lazy"')}

          <span class="product-brand">${esc(product.brand)}</span>
          <b class="product-model">${esc(cleanModel)}</b>
          <span class="v">${esc(product.spec)}</span>

          <span class="p">${rs(product.price)}</span>

          <span class="product-advance">
            Advance: ${rs(advance)}
          </span>

          ${profitHTML}
        </a>

        <div class="product-actions">
          <button type="button"
            class="icon-action"
            data-action="poster"
            data-id="${esc(product.id)}"
            aria-label="Download poster"
            title="Download Poster">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12m-5-5 5 5 5-5M5 17v3h14v-3"
                fill="none" stroke="currentColor"
                stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round"/>
            </svg>
          </button>

          <button type="button"
            class="icon-action"
            data-action="share"
            data-id="${esc(product.id)}"
            aria-label="Share product on WhatsApp"
            title="Share Product Link">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="18" cy="5" r="3"
                fill="none" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="6" cy="12" r="3"
                fill="none" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="18" cy="19" r="3"
                fill="none" stroke="currentColor" stroke-width="1.8"/>
              <path d="m8.7 10.7 6.6-4.4m-6.6 9 6.6 4.1"
                fill="none" stroke="currentColor" stroke-width="1.8"/>
            </svg>
          </button>
        </div>

        <a class="book-now"
          href="${detailHref}"
          style="
            display:block;
            width:100%;
            box-sizing:border-box;
            margin-top:5px;
            padding:10px 8px;
            text-align:center;
            text-decoration:none;
            font:inherit;
            font-weight:600;
            color:#777;
            background:#f1f1f1;
            border:1px solid #e5e5e5;
            border-radius:9px;
          ">Book Now</a>
      </article>
    `;
  }).join('');

  $('msg').textContent = list.length ? '' : 'No phones found.';
  $('sort').textContent =
    'Sort: ' + (S.sort === 'low' ? 'Low to High' : 'High to Low');

  const filters = [];

  if (S.min || S.max) {
    filters.push('Price ' + rg(S.min, S.max, 'Rs. '));
  }

  if (S.mmin || S.mmax) {
    filters.push('Monthly ' + rg(S.mmin, S.mmax, 'Rs. '));
  }

  $('info').hidden = !filters.length;
  $('info').innerHTML = filters.length
    ? `<span>${esc(filters.join(' | '))}</span>
       <button class="ghost" id="clr">Clear</button>`
    : '';
}

$('chips').onclick = event => {
  const chip = event.target.closest('[data-b]');
  if (!chip) return;

  S.brand = chip.dataset.b;

  document.querySelectorAll('.chip').forEach(item => {
    item.classList.toggle('on', item.dataset.b === S.brand);
  });

  render();
};

$('sort').onclick = () => {
  S.sort = S.sort === 'low' ? 'high' : 'low';
  render();
};

$('copy').onclick = () => {
  const url = new URL(fLink());
  url.searchParams.delete('mode');
  copyText(shareText(fTitle(), url.toString()));
};

$('info').onclick = event => {
  if (event.target.id === 'clr') {
    S.min = S.max = S.mmin = S.mmax = 0;
    render();
  }
};

$('q').oninput = render;

$('grid').addEventListener('click', async event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  event.preventDefault();
  event.stopPropagation();

  const product = ALL.find(
    item => String(item.id) === String(button.dataset.id)
  );

  if (!product) {
    toast('Product not found');
    return;
  }

  if (button.dataset.action === 'share') {
    const url = productURL(product, false);
    const message = shareText(product.title, url.toString());
    const whatsappURL =
      'https://wa.me/?text=' + encodeURIComponent(message);

    window.open(whatsappURL, '_blank', 'noopener');
    return;
  }

  if (button.dataset.action === 'poster') {
    if (typeof makePoster !== 'function') {
      toast('Poster feature is not loaded yet');
      return;
    }

    if (typeof qrcode !== 'function') {
      toast('QR code feature is not loaded yet');
      return;
    }

    let posterButton = $('poster');
    let temporaryButton = false;

    if (!posterButton) {
      posterButton = document.createElement('button');
      posterButton.id = 'poster';
      posterButton.type = 'button';
      posterButton.hidden = true;
      document.body.appendChild(posterButton);
      temporaryButton = true;
    }

    posterButton.disabled = false;

    try {
      await makePoster({
        id: product.id,
        brand: product.brand,
        title: product.title,
        spec: product.spec,
        price: product.price
      }, product.img);
    } catch (error) {
      console.error('Poster download error:', error);
      toast('Poster download failed');
    } finally {
      if (temporaryButton) posterButton.remove();
    }
  }
});

load();