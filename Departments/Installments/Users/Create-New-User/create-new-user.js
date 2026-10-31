"use strict";

(function () {
  var TABLE = "users";

  // Correct existing database table
  var BRAND_INCENTIVE_TABLE = "user_brand_profit";

  var isSaving = false;
  var brandsData = [];

  function $(id) {
    return document.getElementById(id);
  }

  function showMessage(message, isError) {
    var box = $("formMessage");
    if (!box) return;

    box.textContent = message;
    box.style.color = isError ? "#b00020" : "#176b36";
  }

  function makeCode(name) {
    var letters = name
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 3);

    while (letters.length < 3) letters += "X";

    return letters + Math.floor(100 + Math.random() * 900);
  }

  // Load brands
  async function loadBrands() {
    var container = $("brandListContainer");

    try {
      var result = await db
        .from("brands")
        .select("id, brand")
        .order("brand");

      if (result.error) throw result.error;

      if (!result.data || result.data.length === 0) {
        container.innerHTML =
          "<p style='font-size:12px;color:#999;'>No brands found in database.</p>";
        return;
      }

      brandsData = result.data;

      var html = "";

      brandsData.forEach(function (brand) {
        html += `
          <div class="brand-row">
            <label>${brand.brand}</label>
            <input
              type="number"
              class="brand-percent-input"
              data-brand-id="${brand.id}"
              min="0"
              max="100"
              step="0.1"
              value="0"
              placeholder="0"
            >
          </div>
        `;
      });

      container.innerHTML = html;

    } catch (err) {
      container.innerHTML =
        "<p style='font-size:12px;color:#b00020;'>Failed to load brands: " +
        err.message +
        "</p>";
    }
  }

  // Save new user
  async function saveUser(event) {
    event.preventDefault();

    if (isSaving) return;

    var name = $("fName").value.trim();
    var father = $("fFather").value.trim();
    var whatsapp = $("fWhatsapp").value.trim();
    var address = $("fAddress").value.trim();
    var username = $("fUsername").value.trim().toLowerCase();
    var password = $("fPassword").value;
    var target = Number($("fTarget").value) || 0;

    if (!name || !father || !whatsapp || !username || !password) {
      return showMessage("Please fill all required fields (*).", true);
    }

    // Collect brand percentages
    var brandIncentivesToSave = [];
    var percentInputs = document.querySelectorAll(
      ".brand-percent-input"
    );

    var invalidPercent = false;

    percentInputs.forEach(function (input) {
      var percent = Number(input.value);

      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        invalidPercent = true;
        return;
      }

      if (percent > 0) {
        brandIncentivesToSave.push({
          brand_id: input.dataset.brandId,
          percent: percent
        });
      }
    });

    if (invalidPercent) {
      return showMessage(
        "Brand percentage 0 se 100 ke darmiyan honi chahiye.",
        true
      );
    }

    if (brandsData.length === 0) {
      return showMessage(
        "Brands load nahi hue. Dobara page open karein.",
        true
      );
    }

    var btn = $("saveBtn");

    isSaving = true;

    btn.disabled = true;
    btn.textContent = "Creating User...";

    $("resultBox").hidden = true;

    var userId = null;

    try {

      // 1. Save user profile
      var inserted = await db
        .from(TABLE)
        .insert({
          name: name,
          father_name: father,
          whatsapp: whatsapp,
          address: address,
          percentage: 0,
          sale_target: target,
          status: "active",
          login_username: username,
          referral_code: makeCode(name)
        })
        .select("id")
        .single();

      if (inserted.error) {
        throw new Error(
          "Profile save failed: " + inserted.error.message
        );
      }

      userId = inserted.data.id;

      // 2. Save brand-wise profit
      if (brandIncentivesToSave.length > 0) {

        var brandPayloads = brandIncentivesToSave.map(function (item) {
          return {
            user_id: userId,
            brand_id: item.brand_id,
            percent: item.percent
          };
        });

        var brandInsert = await db
          .from(BRAND_INCENTIVE_TABLE)
          .insert(brandPayloads);

        if (brandInsert.error) {
          throw new Error(
            "User profile save ho gaya, lekin Brand Profit save nahi hua: " +
            brandInsert.error.message +
            ". User ID: " + userId
          );
        }
      }

      // 3. Create secure login
      showMessage("Creating secure login...", false);

      var result = await db.functions.invoke(
        "manage-user-login",
        {
          body: {
            action: "create",
            user_id: userId,
            username: username,
            password: password
          }
        }
      );

      if (
        result.error ||
        !result.data ||
        !result.data.ok
      ) {
        throw new Error(
          "User aur Brand Profit save ho gaye, lekin Login creation fail hua. User ID: " +
          userId +
          ". " +
          (result.error
            ? result.error.message
            : (result.data && result.data.error
              ? result.data.error
              : "Check Edge Function."))
        );
      }

      // 4. Show login link
      var loginUrl = window.location.origin + "/index.html";

      $("loginLinkInput").value = loginUrl;
      $("resultBox").hidden = false;

      $("userForm").reset();

      document
        .querySelectorAll(".brand-percent-input")
        .forEach(function (input) {
          input.value = 0;
        });

      showMessage(
        "User created successfully! Copy the link below.",
        false
      );

    } catch (error) {
      console.error(error);

      showMessage(error.message, true);

    } finally {
      isSaving = false;

      btn.disabled = false;
      btn.textContent = "Create User";
    }
  }

  // Copy login link
  function copyLoginLink() {
    var copyText = $("loginLinkInput");

    copyText.select();
    copyText.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(copyText.value)
      .then(function () {
        alert("Link Copy ho gaya! Ab aap isay user ko bhej sakte hain.");
      })
      .catch(function () {
        alert("Copy nahi ho saka. Please manually copy karein.");
      });
  }

  // Start module
  function start() {
    var form = $("userForm");

    if (!form) return;

    form.addEventListener("submit", saveUser);

    var copyBtn = $("copyLinkBtn");

    if (copyBtn) {
      copyBtn.addEventListener("click", copyLoginLink);
    }

    if (typeof db === "undefined" || !db) {
      showMessage("Database connection failed.", true);
      return;
    }

    loadBrands();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();