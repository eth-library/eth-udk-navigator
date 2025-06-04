// vector_query.js – Handles client-side logic for ETH-UDK Vector Query

// --- DOM Elements ---
const langSelect = document.getElementById("lang-select");
const langInput = document.getElementById("language-input");
const lookupBtn = document.getElementById("lookup-btn");
const mmsidInput = document.getElementById("mmsid");
const titleInput = document.getElementById("title");
const abstractInput = document.getElementById("abstract");
const tocInput = document.getElementById("toc");
const contentTextInput = document.getElementById("contenttext");
const subjectList = document.getElementById("subject-list");
const queryLoading = document.getElementById("query-loading");
const lookupLoading = document.getElementById("lookup-loading");
const resultBlock = document.getElementById("pinecone-results");
const vectorQueryContent = document.getElementById("vector-query-content");
const statusEl = document.getElementById("lookup-status");
const coverThumbnail = document.getElementById("cover-thumbnail");

const DUMMY_COVER_URL = "/static/img/dummy_cover.png"; // Add a placeholder image to your static folder

// --- Toggle Result Details ---
document.querySelectorAll(".toggle-details").forEach(button => {
  button.addEventListener("click", function () {
    const details = this.closest("li").querySelector(".details");
    const isVisible = details.style.display === "block";
    details.style.display = isVisible ? "none" : "block";
    this.textContent = isVisible ? "More" : "Less";
  });
});

// --- Language Switcher ---
langSelect.addEventListener("change", function () {
  const selectedLang = this.value;
  langInput.value = selectedLang;
  document.querySelectorAll(".result-title").forEach(titleEl => {
    titleEl.textContent = titleEl.dataset[selectedLang];
  });
});

window.addEventListener("DOMContentLoaded", function () {
  const selectedLang = langInput.value;
  document.querySelectorAll(".result-title").forEach(titleEl => {
    titleEl.textContent = titleEl.dataset[selectedLang];
  });

  addClearLinks();
});

// --- Slider Init ---
const slider = document.getElementById("level-slider");
const minInput = document.getElementById("level_min");
const maxInput = document.getElementById("level_max");
const minLabel = document.getElementById("level-min-label");
const maxLabel = document.getElementById("level-max-label");

const startMin = parseFloat(minInput.value || "0.0");
const startMax = parseFloat(maxInput.value || "22.0");

noUiSlider.create(slider, {
  start: [startMin, startMax],
  connect: true,
  step: 1,
  range: {
    min: 0,
    max: 22
  },
  pips: {
    mode: "steps",
    stepped: true,
    density: 4,
    format: {
      to: value => `${parseInt(value)}`,
      from: value => parseFloat(value)
    }
  }
});

slider.noUiSlider.on("update", (values) => {
  minInput.value = values[0];
  maxInput.value = values[1];
  minLabel.textContent = parseInt(values[0]);
  maxLabel.textContent = parseInt(values[1]);
});

// --- Query Spinner on Submit ---
document.querySelector("form").addEventListener("submit", function () {
  if (queryLoading) queryLoading.style.display = "block";
  if (vectorQueryContent) vectorQueryContent.classList.add("blurred");

  // Keep cover image src in hidden input (optional alternative: session/localStorage)
  if (coverThumbnail && coverThumbnail.src) {
    sessionStorage.setItem("coverThumbnailURL", coverThumbnail.src);
  }
});

// --- Add Clear Links Helper ---
function addClearLinks() {
  document.querySelectorAll(".clear-link").forEach(el => el.remove());
  [
    { field: titleInput, label: "Title" },
    { field: abstractInput, label: "Abstract" },
    { field: tocInput, label: "Table of Contents" },
    { field: contentTextInput, label: "Inhaltstext" }
  ].forEach(({ field, label }) => {
    if (field.value.trim()) {
      const clearLink = document.createElement("a");
      clearLink.href = "#";
      clearLink.className = "clear-link small text-danger ms-2";
      clearLink.textContent = "(Clear)";
      clearLink.addEventListener("click", (e) => {
        e.preventDefault();
        field.value = "";
        clearLink.remove();
      });
      const labelEl = field.closest(".mb-3")?.querySelector("label");
      if (labelEl) labelEl.appendChild(clearLink);
    }
  });
}

// --- MMS-ID Lookup ---
lookupBtn.addEventListener("click", async function () {
  const mmsid = mmsidInput.value.trim();
  if (!mmsid) {
    statusEl.textContent = "Please enter an MMS-ID.";
    return;
  }

  // Clear fields before lookup
  titleInput.value = "";
  abstractInput.value = "";
  tocInput.value = "";
  contentTextInput.value = "";
  subjectList.innerHTML = "";
  if (resultBlock) resultBlock.innerHTML = "";
  if (coverThumbnail) {
    coverThumbnail.src = "";
    coverThumbnail.classList.add("d-none");
  }

  // Remove all existing clear-links
  document.querySelectorAll(".clear-link").forEach(el => el.remove());

  if (lookupLoading) lookupLoading.style.display = "block";
  if (vectorQueryContent) vectorQueryContent.classList.add("blurred");
  statusEl.innerHTML = "";

  let statusMessages = [];

  try {
    const apiUrl = `https://api.library.ethz.ch/discovery/v1/resources/${mmsid}?avail=true&apikey=hquDAxpA66K0QV5ewlTTJS0nmRRGlVnX6021RniPoKyUQKZk`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const doc = data.docs[0]?.pnx?.display;
    const links = data.docs[0]?.delivery?.link || [];

    if (!doc) throw new Error("Invalid MMS-ID or missing data.");

    // Fill title
    titleInput.value = doc.title?.[0] || "";

    // Fill subjects (uppercase only)
    const subjects = (doc.subject || []).filter(s => s === s.toUpperCase());
    subjects.forEach(subj => {
      const span = document.createElement("span");
      span.textContent = subj;
      span.className = "badge bg-secondary";
      subjectList.appendChild(span);

      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "subjects";
      hidden.value = subj;
      subjectList.appendChild(hidden);
    });

    // Handle enriched links
    for (const link of links) {
      const { linkType, displayLabel, linkURL } = link;

      if (linkType === "linktorsrc" && displayLabel === "Abstract / Autoreninformation") {
        const res = await fetch("/extract-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkURL })
        });
        const result = await res.json();
        abstractInput.value = result.text?.slice(0, 5000) || "";
        statusMessages.push(`<a href='${linkURL}' target='_blank'>Abstract / Autoreninformation</a> (MARC 856 - toc.library.ethz.ch) has been added to the 'Abstract' field.`);
      }

      if (linkType === "linktorsrc" && displayLabel === "Titelblatt und Inhaltsverzeichnis") {
        const res = await fetch("/extract-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkURL })
        });
        const result = await res.json();
        tocInput.value = result.text?.slice(0, 5000) || "";
        statusMessages.push(`<a href='${linkURL}' target='_blank'>Titelblatt und Inhaltsverzeichnis</a> (MARC 856 - toc.library.ethz.ch) has been added to the 'Table of Contents' field.`);
      }

      if (linkType === "addlink" && displayLabel === "Inhaltstext") {
        const res = await fetch("/extract-abstract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkURL })
        });
        const result = await res.json();
        contentTextInput.value = result.text?.slice(0, 5000) || "";
        statusMessages.push(`<a href='${linkURL}' target='_blank'>Inhaltstext</a> (MARC 856 - deposit.dnb.de) has been added to the 'Inhaltstext' field.`);
      }

      if (linkType === "thumbnail" && displayLabel === "thumbnail" && linkURL.startsWith("https://portal.dnb.de")) {
        if (coverThumbnail) {
          const testImg = new Image();
          testImg.onload = () => {
            coverThumbnail.src = linkURL;
            coverThumbnail.classList.remove("d-none");
            sessionStorage.setItem("coverThumbnailURL", linkURL);
          };
          testImg.onerror = () => {
            coverThumbnail.src = DUMMY_COVER_URL;
            coverThumbnail.classList.remove("d-none");
            sessionStorage.setItem("coverThumbnailURL", DUMMY_COVER_URL);
          };
          testImg.src = linkURL;
        }
      }
    }

    statusEl.innerHTML = statusMessages.join("<br>");
    addClearLinks();
  } catch (err) {
    statusEl.textContent = "Error loading data. Check the MMS-ID.";
    console.error(err);
  } finally {
    if (lookupLoading) lookupLoading.style.display = "none";
    if (vectorQueryContent) vectorQueryContent.classList.remove("blurred");
  }
});

// --- Restore cover after POST (if needed) ---
window.addEventListener("load", () => {
  const savedCover = sessionStorage.getItem("coverThumbnailURL");
  if (savedCover && coverThumbnail) {
    coverThumbnail.src = savedCover;
    coverThumbnail.classList.remove("d-none");
  }
});
