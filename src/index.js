import { databases } from "./lib/appwrite.js";

const userCardTemplate = document.querySelector("[data-user-template]");
const userCardContainer = document.querySelector("[data-user-cards-container]");
const searchInput = document.querySelector("[data-search]");

let users = [];

// 🔍 Keresés funkció optimalizálva
searchInput.addEventListener("input", e => {
  const value = e.target.value.toLowerCase().trim();
  
  users.forEach(user => {
    const matchesNameOrEmail = 
      user.nev?.toLowerCase().includes(value) ||
      user.email?.toLowerCase().includes(value);
    
    const matchesTags = user.cimkek?.some(tag => 
      tag.toLowerCase().includes(value)
    );
    
    const isVisible = matchesNameOrEmail || matchesTags;
    user.element.classList.toggle("hide", !isVisible);
  });
});

// 🔽 Appwrite adatbázisból betöltés
async function loadUsers() {
  try {
    console.log("⏳ Adatok betöltése...");
    
    // Ellenőrizd a konfigurációt
    console.log("Database ID:", "68fe32ea0008ab84b709");
    console.log("Collection ID:", "csapatok");
    
    const response = await databases.listDocuments(
      "68fe32ea0008ab84b709",
      "csapatok"
    );

    console.log("✅ Sikeres válasz:", response);
    
    if (!response.documents || response.documents.length === 0) {
      console.log("ℹ️ Nincsenek dokumentumok a gyűjteményben");
      userCardContainer.innerHTML = '<div class="no-results">Nincsenek csapatok</div>';
      return;
    }

    userCardContainer.innerHTML = ''; // Töröljük a loading állapotot
    
    users = response.documents.map(doc => {
      const card = userCardTemplate.content.cloneNode(true).children[0];
      const header = card.querySelector("[data-header]");
      const body = card.querySelector("[data-body]");
      const image = card.querySelector("[data-image]");

      // Adatok beállítása
      header.textContent = doc.nev || "Név nélkül";
      body.textContent = `${doc.email || "Email nélkül"} | ${doc.cimkek?.join(", ") || "Nincsenek címkék"}`;
      
      console.log(doc.kep)

      // Kép kezelése
      if (doc.kep) {
        image.src = doc.kep;
        image.alt = `${doc.nev} logója`;
      } else {
        image.src = "placeholder.jpg";
        image.alt = "Alapértelmezett kép";
      }

      // Kattintható kártya (opcionális)
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        console.log("Kiválasztva:", doc.nev);
        // Ide jöhet részletes nézet vagy más művelet
      });

      userCardContainer.append(card);

      return { 
        nev: doc.nev, 
        email: doc.email, 
        cimkek: doc.cimkek || [], 
        element: card 
      };
    });

  } catch (error) {
    console.error("❌ Hiba az Appwrite adatok betöltésekor:", error);
    console.error("Hiba típusa:", error.type);
    console.error("Hiba kódja:", error.code);
    console.error("Hiba üzenet:", error.message);
    
    userCardContainer.innerHTML = `
      <div class="error">
        <h3>Hiba történt</h3>
        <p>${error.message}</p>
        <p>Ellenőrizd az adatbázis és gyűjtemény ID-kat!</p>
      </div>
    `;
}
}

// Betöltés indítása
loadUsers();