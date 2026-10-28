"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof db === "undefined") {
        alert("Database connection failed. Check supabase-config.js path.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        alert("No user ID provided.");
        window.location.href = "../All-Users-List/all-users.html";
        return;
    }

    // 1. Brands load karein
    async function loadBrands() {
        var container = document.getElementById("brandListContainer");
        try {
            var { data, error } = await db.from("brands").select("id, brand").order("brand");
            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = "<p style='font-size:12px;color:#999;'>No brands found.</p>";
                return;
            }

            var html = "";
            data.forEach(function(brand) {
                html += `
                <div class="brand-row">
                    <label>${brand.brand}</label>
                    <input type="number" class="brand-percent-input" data-brand-id="${brand.id}" min="0" max="100" step="0.1" value="0">
                </div>
                `;
            });
            container.innerHTML = html;
            return data; 
        } catch (err) {
            container.innerHTML = "<p style='font-size:12px;color:#b00020;'>Failed to load brands.</p>";
        }
    }

    // 2. User aur uski incentives load karein
    try {
        const { data: userData, error: userError } = await db.from("users").select("*").eq("id", userId).single();
        if (userError || !userData) throw new Error("User not found.");

        document.getElementById("editUserId").value = userData.id;
        document.getElementById("fName").value = userData.name || '';
        document.getElementById("fFather").value = userData.father_name || '';
        document.getElementById("fWhatsapp").value = userData.whatsapp || '';
        document.getElementById("fAddress").value = userData.address || '';
        document.getElementById("fTarget").value = userData.sale_target || 0;
        
        // Username set karein
        document.getElementById("fUsername").value = userData.username || userData.referral_code || '';

        // Brands load karein
        await loadBrands();

        // Incentives fetch karein
        const { data: incentiveData, error: incentiveError } = await db.from("user_brand_incentives").select("*").eq("user_id", userId);
        
        if (!incentiveError && incentiveData) {
            incentiveData.forEach(item => {
                const input = document.querySelector(`.brand-percent-input[data-brand-id="${item.brand_id}"]`);
                if (input) {
                    input.value = item.percentage;
                }
            });
        }

    } catch (err) {
        console.error(err);
        alert(err.message);
        return;
    }

    // 3. Form Submit (Update Logic)
    document.getElementById("userForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("saveBtn");
        btn.disabled = true;
        btn.textContent = "Updating...";

        const newUsername = document.getElementById("fUsername").value.trim();
        const newPassword = document.getElementById("fPassword").value;

        // Brands collect karein
        var brandIncentivesToSave = [];
        var percentInputs = document.querySelectorAll(".brand-percent-input");
        percentInputs.forEach(function(input) {
            var percent = Number(input.value);
            brandIncentivesToSave.push({
                brand_id: Number(input.dataset.brandId),
                percentage: percent
            });
        });

        try {
            // A. Users Table mein basic details update karein
            const { error: updateError } = await db.from("users").update({
                name: document.getElementById("fName").value.trim(),
                father_name: document.getElementById("fFather").value.trim(),
                whatsapp: document.getElementById("fWhatsapp").value.trim(),
                address: document.getElementById("fAddress").value.trim(),
                sale_target: Number(document.getElementById("fTarget").value),
                username: newUsername
            }).eq("id", userId);

            if (updateError) throw updateError;

            // B. Login Credentials Update Karein (Edge Function)
            // Sirf tab call karein agar password change hua hai ya username change hua hai
            // Lekin safe rehne ke liye hum hamesha call karenge, password khali ho to function skip kar dega
            showMessage("Updating login details...");
            
            const loginResult = await db.functions.invoke("manage-user-login", {
                body: {
                    action: "update_login", 
                    user_id: parseInt(userId), 
                    username: newUsername,
                    password: newPassword ? newPassword : undefined 
                }
            });

            if (loginResult.error) {
                console.error("Login update error:", loginResult.error);
                throw new Error("Login update failed: " + loginResult.error.message);
            }
            
            if (loginResult.data && !loginResult.data.ok) {
                throw new Error("Login update failed: " + loginResult.data.error);
            }

            // C. Update Incentives
            await db.from("user_brand_incentives").delete().eq("user_id", userId);

            if (brandIncentivesToSave.length > 0) {
                var payloads = brandIncentivesToSave.map(function(item) {
                    return {
                        user_id: parseInt(userId),
                        brand_id: item.brand_id,
                        percentage: item.percentage
                    };
                });
                await db.from("user_brand_incentives").insert(payloads);
            }

            alert("✅ User details and login updated successfully!");
            window.location.href = "../All-Users-List/all-users.html";

        } catch (err) {
            alert("Error: " + err.message);
            btn.disabled = false;
            btn.textContent = "Update User";
        }
    });
});

function showMessage(msg) {
    const el = document.getElementById("formMessage");
    if (el) el.innerText = msg;
}