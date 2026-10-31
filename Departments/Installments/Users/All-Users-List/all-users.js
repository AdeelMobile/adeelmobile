let allUsersData = []; 
let currentVerificationUserId = null;
let currentFilter = 'overall'; 

document.addEventListener("DOMContentLoaded", () => {
    if (typeof db === "undefined") {
        document.getElementById("usersTableBody").innerHTML = 
            '<tr><td colspan="10" style="text-align:center;color:red;">Error: Database connection failed. Please refresh.</td></tr>';
        return;
    }
    
    loadUsers();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            applyFilters();
        });
    }
});

function setFilter(filter, element) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    currentFilter = filter;
    applyFilters();
}

async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  try {
    const { data, error } = await db.from("users").select("*").order("id", { ascending: false });
    
    if (error) throw error;
    
    allUsersData = data || []; 
    
    if(allUsersData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No users found in database.</td></tr>';
        return;
    }

    applyFilters();
  } catch (err) {
    console.error("Load Users Error:", err);
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red;">Error: ${err.message}</td></tr>`;
  }
}

function applyFilters() {
    const searchInput = document.getElementById("searchInput");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    
    let filtered = allUsersData;
    
    if (currentFilter !== 'overall') {
        const now = new Date();
        let compareDate = new Date();
        if (currentFilter === 'week') compareDate.setDate(now.getDate() - 7);
        if (currentFilter === 'month') compareDate.setMonth(now.getMonth() - 1);

        filtered = filtered.filter(user => {
            if (!user.created_at) return false;
            return new Date(user.created_at) >= compareDate;
        });
    }
    
    if (searchTerm !== "") {
        filtered = filtered.filter(user => {
            return (user.name || "").toLowerCase().includes(searchTerm) || 
                   (user.whatsapp || "").toLowerCase().includes(searchTerm) ||
                   (user.address || "").toLowerCase().includes(searchTerm);
        });
    }
    
    renderTable(filtered);
}

function renderTable(data) {
    const tbody = document.getElementById("usersTableBody");
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No users found matching your search.</td></tr>';
      return;
    }

    let html = "";
    data.forEach(user => {
      let statusText = "Active";
      let statusClass = "status-active";
      if (user.status && user.status.toLowerCase() === 'inactive') {
          statusText = "Inactive";
          statusClass = "status-inactive";
      }
      
      const target = user.sale_target ? Number(user.sale_target).toLocaleString() : '0';
      const sale = user.total_sales ? Number(user.total_sales).toLocaleString() : '0';
      const wallet = user.wallet_balance ? Number(user.wallet_balance).toLocaleString() : '0';
      const incentive = user.pending_incentive ? Number(user.pending_incentive).toLocaleString() : '0';

      const formsIconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;

      const editIconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px; height:18px; margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

      const deleteIconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#b00020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px; height:18px; margin-right:4px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

      html += `
        <tr class="user-row">
          <td><span class="user-name">${user.name || 'Unknown'}</span></td>
          <td>${user.address || 'N/A'}</td>
          <td>${user.whatsapp || 'N/A'}</td>
          <td>${target}</td>
          <td>${sale}</td>
          <td>${wallet}</td>
          <td>${incentive}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          
          <td>
            <button class="btn-image-style" onclick="openVerificationModal(${user.id}, '${user.name}', 'pending')">
                ${formsIconSvg} Forms
            </button>
          </td>

          <td style="display: flex; gap: 8px; justify-content: center; border-bottom: none;">
            <!-- EDIT BUTTON -->
            <button class="btn-image-style" onclick="window.location.href='../Edit-User/edit-user.html?id=${user.id}'" style="padding: 8px 12px; font-size: 13px;">
                ${editIconSvg} Edit
            </button>
            
            <!-- DELETE BUTTON -->
            <button class="btn-image-style" onclick="deleteUser(${user.id}, '${user.name}')" style="padding: 8px 12px; font-size: 13px; color: #b00020; background: #fff5f5; border-color: #f8d7da;">
                ${deleteIconSvg} Delete
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
}

/* ==========================================
   DELETE USER LOGIC
   ========================================== */
async function deleteUser(userId, userName) {
    const confirmDelete = confirm(`Kya aap waqai "${userName}" ko delete karna chahte hain? Ye wapas nahi aayega.`);
    if (!confirmDelete) return;

    try {
        const { error } = await db.from("users").delete().eq("id", userId);
        if (error) throw error;
        
        alert("✅ User successfully delete ho gaya!");
        loadUsers(); // List refresh karein
        
    } catch (err) {
        console.error("Delete Error:", err);
        alert("❌ User delete nahi ho saka. Error: " + err.message);
    }
}

/* ==========================================
   VERIFICATION MODAL LOGIC
   ========================================== */
function openVerificationModal(userId, userName, defaultTab = 'pending') {
    currentVerificationUserId = userId;
    document.getElementById("modalUserName").innerText = "Verifications - " + userName;
    document.getElementById("verificationModal").style.display = "flex";
    
    const tabs = document.querySelectorAll('.v-tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    
    if (defaultTab === 'pending') tabs[0].classList.add('active');
    else if (defaultTab === 'approved') tabs[1].classList.add('active');
    else if (defaultTab === 'rejected') tabs[2].classList.add('active');
    
    loadUserVerifications(defaultTab);
}

function closeVerificationModal() {
    document.getElementById("verificationModal").style.display = "none";
}

async function loadUserVerifications(status, btnElement) {
    if (btnElement) {
        document.querySelectorAll('.v-tab-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const listArea = document.getElementById("modalListArea");
    listArea.innerHTML = "<p style='text-align:center; color:#666;'>Loading forms...</p>";

    try {
        const { data, error } = await db
            .from("verifications")
            .select("*")
            .eq("user_id", currentVerificationUserId)
            .eq("status", status)
            .order("id", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            listArea.innerHTML = `<p style='text-align:center; color:#999; margin-top:20px;'>No ${status} forms found.</p>`;
            return;
        }

        let html = "";
        data.forEach(form => {
            const dateStr = form.created_at ? new Date(form.created_at).toLocaleDateString() : '-';
            
            html += `
                <div class="form-card" style="background:#fff; border:1px solid #eee; border-radius:12px; padding:16px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
                        <div>
                            <strong style="font-size:16px; font-family: 'Inter', sans-serif;">${form.name || 'Unknown'}</strong><br>
                            <span style="font-size:13px; color:#666;">Contact: ${form.contact || 'N/A'} | Date: ${dateStr}</span>
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:8px; justify-content:flex-end;">
                        <button class="btn-image-style" style="padding:8px 12px; font-size:13px;" onclick="alert('My Profits for Form ID: ${form.id}')">My Profits</button>
                        <button class="btn-image-style" style="padding:8px 12px; font-size:13px;" onclick="alert('Opening Website for Form ID: ${form.id}')">Open Website</button>
                    </div>
                </div>
            `;
        });
        listArea.innerHTML = html;

    } catch (err) {
        listArea.innerHTML = `<p style='color:red; text-align:center;'>Error: ${err.message}</p>`;
    }
}