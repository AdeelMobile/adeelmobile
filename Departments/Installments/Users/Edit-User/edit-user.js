"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof db === "undefined") {
        alert("Database connection failed.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        alert("No user ID provided.");
        window.location.href = "../All-Users-List/all-users.html";
        return;
    }

    async function loadBrands() {
        var container = document.getElementById("brandListContainer");
        try {
            var { data, error } = await db.from("brands").select("id, brand").order("brand");
            if (error) throw error;
            if (!data || data.length === 0) return;

            var html = "";
            data.forEach(function(brand) {
                html += `
                <div class="brand-row">
                    <label>${brand.brand}</label>
                    <input type="number" class="brand-percent-input" data-brand-id="${brand.id}" min="0" max="100" step="0.1" value="0">
                </div>`;
            });
            container.innerHTML = html;
        } catch (err) {
            container.innerHTML = "<p>Failed to load brands.</p>";
        }
    }

    try {
        const { data: userData, error: userError } = await db.from("users").select("*").eq("id", userId).single();
        if (userError || !userData) throw new Error("User not found.");

        document.getElementById("editUserId").value = userData.id;
        document.getElementById("fName").value = userData.name || '';
        document.getElementById("fFather").value = userData.father_name || '';
        document.getElementById("fWhatsapp").value = userData.whatsapp || '';
        document.getElementById("fAddress").value = userData.address || '';
        document.getElementById("fTarget").value = userData.sale_target || 0;
        document.getElementById("fUsername").value = userData.login_username || userData.referral_code || '';

        await loadBrands();

        const { data: incentiveData } = await db.from("user_brand_incentives").select("*").eq("user_id", userId);
        if (incentiveData) {
            incentiveData.forEach(item => {
                const input = document.querySelector(`.brand-percent-input[data-brand-id="${item.brand_id}"]`);
                if (input) input.value = item.percentage;
            });
        }
    } catch (err) {
        alert(err.message);
        return;
    }

    document.getElementById("userForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("saveBtn");
        btn.disabled = true;
        btn.textContent = "Updating...";

        var brandIncentivesToSave = [];
        document.querySelectorAll(".brand-percent-input").forEach(function(input) {
            brandIncentivesToSave.push({
                brand_id: Number(input.dataset.brandId),
                percentage: Number(input.value)
            });
        });

        try {
            // Sirf Database Update (Bina kisi Edge Function ke)
            const { error: updateError } = await db.from("users").update({
                name: document.getElementById("fName").value.trim(),
                father_name: document.getElementById("fFather").value.trim(),
                whatsapp: document.getElementById("fWhatsapp").value.trim(),
                address: document.getElementById("fAddress").value.trim(),
                sale_target: Number(document.getElementById("fTarget").value),
                login_username: document.getElementById("fUsername").value.trim()
            }).eq("id", userId);

            if (updateError) throw updateError;

            await db.from("user_brand_incentives").delete().eq("user_id", userId);
            if (brandIncentivesToSave.length > 0) {
                var payloads = brandIncentivesToSave.map(function(item) {
                    return { user_id: parseInt(userId), brand_id: item.brand_id, percentage: item.percentage };
                });
                await db.from("user_brand_incentives").insert(payloads);
            }

            alert("✅ User updated successfully!");
            window.location.href = "../All-Users-List/all-users.html";

        } catch (err) {
            alert("Error: " + err.message);
            btn.disabled = false;
            btn.textContent = "Update User";
        }
    });
});