"use strict";

(function () {
  var TABLE = "users";
  var BRAND_INCENTIVE_TABLE = "user_brand_incentives";
  var isSaving = false;
  var brandsData = []; // Database se brands yahan aayenge

  function $(id) { return document.getElementById(id); }

  function showMessage(message, isError) {
    var box = $("formMessage");
    if (!box) return;
    box.textContent = message;
    box.style.color = isError ? "#b00020" : "#176b36";
  }

  function makeCode(name) {
    var letters = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3);
    while (letters.length < 3) letters += "X";
    return letters + Math.floor(100 + Math.random() * 900);
  }

  // Brands fetch karne ka function
  async function loadBrands() {
    var container = $("brandListContainer");
    try {
        var { data, error } = await db.from("brands").select("id, brand").order("brand");
        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = "<p style='font-size:12px;color:#999;'>No brands found in database.</p>";
            return;
        }

        brandsData = data;
        var html = "";
        data.forEach(function(brand) {
            html += `
            <div class="brand-row">
                <label>${brand.brand}</label>
                <input type="number" class="brand-percent-input" data-brand-id="${brand.id}" min="0" max="100" step="0.1" value="0" placeholder="0">
            </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = "<p style='font-size:12px;color:#b00020;'>Failed to load brands: " + err.message + "</p>";
    }
  }

  async function saveUser(event) {
    event.preventDefault();
    if (isSaving) return;

    var name = $("fName").value.trim();
    var father = $("fFather").value.trim();
    var whatsapp = $("fWhatsapp").value.trim();
    var address = $("fAddress").value.trim();
    var username = $("fUsername").value.trim().toLowerCase();
    var password = $("fPassword").value;
    var target = Number($("fTarget").value);

    if (!name || !father || !whatsapp || !username || !password) {
      return showMessage("Please fill all required fields (*).", true);
    }

    // Har brand ka percentage collect karein
    var brandIncentivesToSave = [];
    var percentInputs = document.querySelectorAll(".brand-percent-input");
    percentInputs.forEach(function(input) {
        var percent = Number(input.value);
        if (percent > 0) {
            brandIncentivesToSave.push({
                brand_id: Number(input.dataset.brandId),
                percentage: percent
            });
        }
    });

    var btn = $("saveBtn");
    isSaving = true;
    btn.disabled = true;
    btn.textContent = "Creating User...";
    $("resultBox").hidden = true;

    try {
      // 1. User save karein
      var inserted = await db.from(TABLE).insert({
          name: name,
          father_name: father,
          whatsapp: whatsapp,
          address: address,
          percentage: 0, // Ab overall percentage nahi, brand-wise hoga
          sale_target: target,
          status: "active",
          referral_code: makeCode(name)
        }).select("id").single();

      if (inserted.error) throw new Error("Profile save failed: " + inserted.error.message);
      var userId = inserted.data.id;

      // 2. Brand wise incentives save karein (Agar koi set kiya hai)
      if (brandIncentivesToSave.length > 0) {
          var brandPayloads = brandIncentivesToSave.map(function(item) {
              return {
                  user_id: userId,
                  brand_id: item.brand_id,
                  percentage: item.percentage
              };
          });
          var brandInsert = await db.from(BRAND_INCENTIVE_TABLE).insert(brandPayloads);
          if (brandInsert.error) {
              console.error("Brand Incentives Error:", brandInsert.error);
              // Yahan hum error throw nahi karenge taake user create ho jaye, lekin console mein dikhayenge
          }
      }

      // 3. User ka Secure Login Account banayein
      showMessage("Creating secure login...", false);
      var result = await db.functions.invoke("manage-user-login", {
        body: {
          action: "create",
          user_id: userId,
          username: username,
          password: password
        }
      });

      if (result.error || !result.data || !result.data.ok) {
        throw new Error("Login creation failed. Check Edge Function.");
      }

      // 4. Login Link
      var loginUrl = new URL("../../../index.html", window.location.href).href;
      $("loginLinkInput").value = loginUrl;
      $("resultBox").hidden = false;
      
      $("userForm").reset();
      // Reset brands to 0
      document.querySelectorAll(".brand-percent-input").forEach(function(input) { input.value = 0; });
      
      showMessage("User created successfully! Copy the link below.", false);

    } catch (error) {
      console.error(error);
      showMessage(error.message, true);
    } finally {
      isSaving = false;
      btn.disabled = false;
      btn.textContent = "Create User";
    }
  }

  function copyLoginLink() {
    var copyText = $("loginLinkInput");
    copyText.select();
    copyText.setSelectionRange(0, 99999); 
    
    navigator.clipboard.writeText(copyText.value).then(function() {
        alert("✅ Link Copy ho gaya! Ab aap isay user ko bhej sakte hain.");
    }).catch(function() {
        alert("Copy nahi ho saka. Please manually copy karein.");
    });
  }

  function start() {
    var form = $("userForm");
    if (!form) return;

    form.addEventListener("submit", saveUser);
    
    var copyBtn = $("copyLinkBtn");
    if(copyBtn) copyBtn.addEventListener("click", copyLoginLink);

    if (typeof db === "undefined" || !db) {
      showMessage("Database connection failed.", true);
      return;
    }

    // Brands load karein
    loadBrands();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();