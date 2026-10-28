let allVerifications = [];
let allUsersData = [];
let currentFilter = 'pending'; // By default Pending show hoga

document.addEventListener("DOMContentLoaded", () => {
    if (typeof db === "undefined") {
        document.getElementById("verificationList").innerHTML = "<p style='color:red;text-align:center;'>Database connection failed.</p>";
        return;
    }
    
    // Page load hone par Pending card ko active (blue) dikhayein
    const cards = document.querySelectorAll('.v-card');
    if (cards.length > 0) {
        cards[0].style.borderColor = '#2563eb';
    }

    loadData();

    // Search Bar
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            applyFilter();
        });
    }
});

async function loadData() {
    const listArea = document.getElementById("verificationList");
    try {
        // 1. Saare users fetch karein
        const { data: usersData } = await db.from("users").select("id, name");
        allUsersData = usersData || [];

        // 2. Saari verifications fetch karein
        const { data, error } = await db
            .from("verifications")
            .select("*")
            .order("id", { ascending: false });

        if (error) throw error;

        allVerifications = data || [];
        
        updateCounts();
        applyFilter();

    } catch (err) {
        console.error(err);
        listArea.innerHTML = `<p style='color:red;text-align:center;'>Error: ${err.message}</p>`;
    }
}

function updateCounts() {
    let pending = 0, approved = 0, rejected = 0;
    
    allVerifications.forEach(v => {
        if (v.status === 'pending') pending++;
        else if (v.status === 'approved') approved++;
        else if (v.status === 'rejected') rejected++;
    });

    document.getElementById("countPending").innerText = pending;
    document.getElementById("countApproved").innerText = approved;
    document.getElementById("countRejected").innerText = rejected;
}

function filterByStatus(status, element) {
    // Sab cards ka border reset karein
    document.querySelectorAll('.v-card').forEach(card => card.style.borderColor = '#e1e5eb');
    
    // Jo click hua hai usko blue border dein
    if (element) element.style.borderColor = '#2563eb';

    // Filter update karein
    currentFilter = status;

    applyFilter();
}

function applyFilter() {
    const searchInput = document.getElementById("searchInput");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    // Sirf currentFilter (Pending, Approved, Rejected) wale forms uthayein
    let filtered = allVerifications.filter(v => v.status === currentFilter);

    // Search ke mutabiq filter
    if (searchTerm !== "") {
        filtered = filtered.filter(v => {
            const cName = v.customer_name || v.name || "";
            const pName = v.product_name || v.product || "";
            const uName = getUserName(v.user_id).toLowerCase();
            
            return cName.toLowerCase().includes(searchTerm) || 
                   pName.toLowerCase().includes(searchTerm) ||
                   uName.includes(searchTerm);
        });
    }

    renderList(filtered);
}

function getUserName(userId) {
    if (!userId) return "Adeel Mobile";
    const user = allUsersData.find(u => String(u.id) === String(userId));
    return user ? user.name : "Adeel Mobile";
}

function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleString('en-PK', options);
}

function renderList(data) {
    const listArea = document.getElementById("verificationList");
    
    if (!data || data.length === 0) {
        listArea.innerHTML = `<p style='text-align:center; color:#999; margin-top:20px;'>No ${currentFilter} forms found.</p>`;
        return;
    }

    let html = "";
    data.forEach(form => {
        let badgeClass = "badge-pending";
        let statusText = "Pending";
        if (form.status === 'approved') { badgeClass = "badge-approved"; statusText = "Approved"; }
        if (form.status === 'rejected') { badgeClass = "badge-rejected"; statusText = "Rejected"; }

        const userName = getUserName(form.user_id);
        const productName = form.product_name || form.product || "Unknown Product";
        const variant = form.variant || ""; 
        const price = form.price || 0;
        const plan = form.plan || "";
        const imgUrl = form.cnic_front_img || form.id_front || 'https://via.placeholder.com/100?text=No+Img';
        const dateStr = formatDateTime(form.created_at);

        html += `
            <div class="v-item" onclick="window.location.href='verification-details.html?id=${form.id}'">
                
                <div style="width: 45px; height: 45px; background: #e0e7ff; color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; flex-shrink: 0; margin-right: 12px;">
                    ${userName.charAt(0).toUpperCase()}
                </div>

                <div class="v-item-info">
                    <div style="font-size: 16px; color: #111; font-weight: 700; margin-bottom: 2px;">${userName}</div>
                    <div class="v-item-title">${productName} ${variant ? '('+variant+')' : ''}</div>
                    <div class="v-item-sub">Rs. ${price.toLocaleString()} ${plan ? '| '+plan : ''}</div>
                    <div style="font-size: 11px; color: #888; margin-top: 4px;">📅 ${dateStr}</div>
                </div>

                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px; margin-left: 10px;">
                    <img src="${imgUrl}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid #eee;" alt="product" onerror="this.src='https://via.placeholder.com/40?text=Img'">
                    <span class="v-status-badge ${badgeClass}">${statusText}</span>
                </div>
            </div>
        `;
    });
    listArea.innerHTML = html;
}