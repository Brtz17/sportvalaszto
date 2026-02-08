import { databases } from './lib/appwrite.js';

const userCardTemplate = document.querySelector("[data-user-template]");
const userCardContainer = document.querySelector("[data-user-cards-container]");
let users = [];

function handleLayout() {
  const searchWrapper1 = document.getElementById('search-wrapper1');
  const searchWrapper2 = document.getElementById('search-wrapper2');
  let searchInput;
  
  if (searchWrapper1 && searchWrapper2) {
    const style1 = window.getComputedStyle(searchWrapper1);
    const style2 = window.getComputedStyle(searchWrapper2);
    
    
    if (style1.display !== 'none') {
      searchInput = searchWrapper1.querySelector('input[type="search"]');
    } else if (style2.display !== 'none') {
      searchInput = searchWrapper2.querySelector('input[type="search"]');
    }
  }
  
  if (searchInput) {
    searchInput.removeEventListener("input", handleSearch);
    searchInput.addEventListener("input", handleSearch);
  } else {
    console.log('No search input found!');
  }
}

function handleSearch(e) {
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
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedHandleLayout = debounce(handleLayout, 100);

// Appwrite adatbetöltés (a te kódod marad)
async function loadUsers() {
  try {
    
    // Ellenőrizd a konfigurációt    
    const response = await databases.listDocuments(
      "68fe32ea0008ab84b709",
      "csapatok"
    );
    
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
      
      // Kép kezelése
      if (doc.kep) {
        image.style.display = 'block';
        image.src = doc.kep;
        image.alt = `${doc.nev} logója`;
      } else {
        image.style.display = 'none';
      }

      // Kattintható kártya (opcionális)
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        console.log("Kiválasztva:", doc.nev);
        // Ide jöhet részletes nézet vagy más művelet
        window.location = `/csapat?${doc.$id}`;
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

// Inicializálás
document.addEventListener('DOMContentLoaded', function() {
  handleLayout();
  loadUsers();
});
window.addEventListener('resize', debouncedHandleLayout);