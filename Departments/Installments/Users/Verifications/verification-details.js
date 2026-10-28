let currentFormId = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof db === "undefined") return alert("Database connection failed.");

    const urlParams = new URLSearchParams(window.location.search);
    currentFormId = urlParams.get('id');

    if (!currentFormId) {
        alert("No form ID provided.");
        window.location.href = "verifications.html";
        return;
    }

    loadFormDetails(currentFormId);
});

async function getImageUrl(filePath) {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    try {
        const { data, error } = await db.storage.from('customer-docs').createSignedUrl(filePath, 3600);
        if (error) return null;
        return data.signedUrl;
    } catch (err) { return null; }
}

async function loadFormDetails(id) {
    try {
        const { data, error } = await db.from("verifications").select("*").eq("id", id).single();
        if (error || !data) throw new Error("Form not found.");

        // Data fill karein
        document.getElementById("dCustName").innerText = data.customer_name || data.name || '-';
        document.getElementById("dCnic").innerText = data.cnic || '-';
        document.getElementById("dPhone").innerText = data.phone || data.contact || '-';
        document.getElementById("dProdName").innerText = data.product_name || data.product || '-';
        document.getElementById("dImei").innerText = data.imei || '-';
        document.getElementById("dPrice").innerText = "Rs. " + (data.price ? data.price.toLocaleString() : 0);
        
        // Images
        let frontPath = data.cnic_front_img || data.id_front;
        let backPath = data.cnic_back_img || data.id_back;
        const imgFrontEl = document.getElementById("dImgFront");
        const linkFrontEl = document.getElementById("dImgFrontLink");
        const imgBackEl = document.getElementById("dImgBack");
        const linkBackEl = document.getElementById("dImgBackLink");

        if (frontPath) {
            const finalFrontUrl = await getImageUrl(frontPath);
            if (finalFrontUrl) {
                imgFrontEl.src = finalFrontUrl;
                if(linkFrontEl) { linkFrontEl.href = finalFrontUrl; linkFrontEl.style.display = 'block'; }
            } else { imgFrontEl.src = 'https://via.placeholder.com/300x200?text=Image+Error'; if(linkFrontEl) linkFrontEl.style.display = 'none'; }
        } else { imgFrontEl.src = 'https://via.placeholder.com/300x200?text=No+Image'; if(linkFrontEl) linkFrontEl.style.display = 'none'; }

        if (backPath) {
            const finalBackUrl = await getImageUrl(backPath);
            if (finalBackUrl) {
                imgBackEl.src = finalBackUrl;
                if(linkBackEl) { linkBackEl.href = finalBackUrl; linkBackEl.style.display = 'block'; }
            } else { imgBackEl.src = 'https://via.placeholder.com/300x200?text=Image+Error'; if(linkBackEl) linkBackEl.style.display = 'none'; }
        } else { imgBackEl.src = 'https://via.placeholder.com/300x200?text=No+Image'; if(linkBackEl) linkBackEl.style.display = 'none'; }

        // Status aur Rejection Reason update karein
        updateStatusUI(data.status, data.rejection_reason);

        document.getElementById("loading").style.display = "none";
        document.getElementById("detailsContainer").style.display = "block";

    } catch (err) {
        document.getElementById("loading").innerText = "Error: " + err.message;
    }
}

function updateStatusUI(status, reason) {
    const badge = document.getElementById("dStatusBadge");
    const actionBtns = document.getElementById("actionButtons");
    const rejectBox = document.getElementById("rejectionBox");

    if (status === 'pending') {
        badge.className = "status-badge sb-pending";
        badge.innerText = "Pending";
        actionBtns.style.display = "flex"; 
        rejectBox.style.display = "none";
    } 
    else if (status === 'approved') {
        badge.className = "status-badge sb-approved";
        badge.innerText = "Approved";
        actionBtns.style.display = "none"; 
        rejectBox.style.display = "none";
    } 
    else if (status === 'rejected') {
        badge.className = "status-badge sb-rejected";
        badge.innerText = "Rejected";
        actionBtns.style.display = "none"; 
        rejectBox.style.display = "block"; // Rejection box show karein
        
        // Agar wajah likhi hai to show karein, warna default
        document.getElementById("dRejectReason").innerText = reason || "No reason provided.";
    }
}

async function updateStatus(newStatus) {
    let reason = null;

    // Agar Reject kar rahe hain to wajah poochein
    if (newStatus === 'rejected') {
        reason = prompt("Reject karne ki wajah likhein (zaroori hai):");
        if (!reason || reason.trim() === "") {
            return alert("Reject karne ke liye wajah likhna zaroori hai.");
        }
    } else {
        if (!confirm(`Kya aap waqai is form ko ${newStatus} karna chahte hain?`)) return;
    }

    const btns = document.querySelectorAll(".vd-btn");
    btns.forEach(b => b.disabled = true);

    try {
        // Status aur reason update karein
        const { error } = await db.from("verifications").update({ 
            status: newStatus,
            rejection_reason: reason 
        }).eq("id", currentFormId);
        
        if (error) throw error;

        alert(`✅ Form ${newStatus} ho gaya hai.`);
        window.location.href = "verifications.html";

    } catch (err) {
        alert("Error updating status: " + err.message);
        btns.forEach(b => b.disabled = false);
    }
}