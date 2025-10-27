import { databases, storage } from "../lib/appwrite.js";

document.addEventListener('DOMContentLoaded', function() {

// DOM elemek
const form = document.getElementById("user-form");
const kepInput = document.getElementById("kepInput");
const kepPreview = document.getElementById("kepPreview");
const cimkekContainer = document.getElementById("cimkek-container");
const submitBtn = document.getElementById("submit-btn");
const messageContainer = document.getElementById("message-container");

//Telefon szóköz letiltása
document.getElementById("telefon").addEventListener("keydown", e => {
  if (e.key === " ") {
    e.preventDefault(); // megakadályozza, hogy szóközt írjon be
  }
});


// Appwrite konfiguráció
const DATABASE_ID = "68fe32ea0008ab84b709";
const COLLECTION_ID = "csapatok";
const BUCKET_ID = "68fe4c27001b6bb17091";  // Storage bucket ID - BE KELL ÁLLÍTANI!

// Kép előnézet
kepInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) {
    const reader = new FileReader();
    reader.onload = () => {
        kepPreview.src = reader.result;
        kepPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
    }
});

// Dinamikus címkék
cimkekContainer.addEventListener("input", () => {
    const inputs = cimkekContainer.querySelectorAll('input[name="cimkek[]"]');
    const last = inputs[inputs.length - 1];
    const secondLast = inputs[inputs.length - 2];
    
    if (last.value.trim() !== "") {
    const newInput = document.createElement("input");
    newInput.type = "text";
    newInput.name = "cimkek[]";
    newInput.placeholder = "Sport";
    cimkekContainer.appendChild(newInput);
    }

    if (inputs.length > 1 && last.value.trim() === "" && secondLast?.value.trim() === "") {
    cimkekContainer.removeChild(last);
    }
});

// Üzenet megjelenítése
function uzenetMegjelenitese(szoveg, tipus = 'success') {
    messageContainer.innerHTML = `<div class="message ${tipus}">${szoveg}</div>`;
    setTimeout(() => {
    messageContainer.innerHTML = '';
    }, 5000);
}

// Form elküldése
form.addEventListener("submit", async e => {
    e.preventDefault();

    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Küldés...";

    try {
    const formData = new FormData(form);
    const kepFile = formData.get("kep");
    
    // Címkék összegyűjtése
    const cimkek = formData.getAll("cimkek[]").map(v => v.trim()).filter(v => v);

    let kepUrl = "";

    // 1. KÉP FELTÖLTÉS (ha van)
    if (kepFile && kepFile.size > 0) {
        try {
        const fileResponse = await storage.createFile(
            BUCKET_ID,
            'unique()',
            kepFile
        );
        
        // Kép URL előállítása
        kepUrl = `https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileResponse.$id}/view?project=68fe2fae00030619f0a5`;
        console.log("✅ Kép feltöltve:", kepUrl);
        } catch (fileError) {
        console.error("❌ Kép feltöltés hiba:", fileError);
        uzenetMegjelenitese("Hiba a kép feltöltésekor", 'error');
        return;
        }
    }

    // 2. DOKUMENTUM LÉTREHOZÁS
    const dokumentumAdatok = {
        nev: formData.get("nev"),
        email: formData.get("email"),
        telefon: formData.get("telefon") || "",
        weboldal: formData.get("weboldal") || "",
        iranyitoszam: formData.get("iranyitoszam") || "",        
        varos: formData.get("varos") || "",
        utca: formData.get("utca") || "",
        hazszam: formData.get("hazszam") || "",
        cimkek: cimkek,
        kep: kepUrl,
    };

    console.log("📤 Küldött adatok:", dokumentumAdatok);

    // Appwrite dokumentum létrehozása
    const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        'unique()',
        dokumentumAdatok
    );

    console.log(`Sikeresen hozzáadva: ${dokumentumAdatok.nev}`, 'success');

    // Form reset
    form.reset();
    kepPreview.style.display = "none";
    cimkekContainer.innerHTML = `<input type="text" name="cimkek[]" placeholder="Sport">`;

    } catch (error) {
    console.error("❌ Hiba:", error);
    uzenetMegjelenitese(`Hiba: ${error.message}`, 'error');
    } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Hozzáadás";
    }
});

// Hibakezelés - ellenőrizzük a kapcsolatot
async function kapcsolatTeszt() {
    try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [], 1);
    console.log("✅ Appwrite kapcsolat működik");
    } catch (error) {
    console.error("❌ Appwrite kapcsolat hiba:", error);
    uzenetMegjelenitese(`Kapcsolat hiba: ${error.message}. Ellenőrizd az ID-kat!`, 'error');
    }
}

// Kapcsolat tesztelése oldal betöldésekor
kapcsolatTeszt();
});