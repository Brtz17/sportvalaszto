import { account } from "./lib/appwrite.js";

// VALÓS IDEJŰ FORDÍTÁS GOOGLE TRANSLATE API-VAL
async function translateText(text, targetLang = 'hu') {
    try {
        // Ingyenes Google Translate API
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
        
        if (!response.ok) {
            throw new Error('Fordítási hiba');
        }
        
        const data = await response.json();
        
        // A válasz struktúrája: [[["fordított szöveg", "eredeti szöveg", null, null]], null, "auto"]
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            return data[0][0][0];
        }
        
        return text; // Ha nem sikerül, visszaadjuk az eredetit
        
    } catch (error) {
        console.error('Fordítási hiba:', error);
        return text;
    }
}

// HIBÁK FORDÍTÁSA AUTOMATIKUSAN
async function translateErrorMessage(error) {
    const originalMessage = error.message || error.toString();
    
    // Először próbáljuk a beépített fordítást
    const builtInTranslation = translateCommonErrors(originalMessage);
    if (builtInTranslation !== originalMessage) {
        return builtInTranslation;
    }
    
    // Ha nincs beépített fordítás, használjuk a Google Translate API-t
    try {
        const translated = await translateText(originalMessage, 'hu');
        return translated;
    } catch {
        return originalMessage; // Ha nem sikerül, az eredeti üzenet
    }
}

// BEPÉTETT GYAKORI HIBÁK (biztonsági tartalék)
function translateCommonErrors(message) {
    const commonErrors = {
        'Invalid credentials': 'Érvénytelen hitelesítési adatok',
        'User not found': 'Felhasználó nem található',
        'Email already exists': 'Ez az email cím már regisztrálva van',
        'User already exists': 'Ez a felhasználó már létezik',
        'Password must be at least 8 characters': 'A jelszónak legalább 8 karakter hosszúnak kell lennie',
        'Password must contain at least one uppercase letter': 'A jelszónak tartalmaznia kell legalább egy nagybetűt',
        'Password must contain at least one lowercase letter': 'A jelszónak tartalmaznia kell legalább egy kisbetűt',
        'Password must contain at least one number': 'A jelszónak tartalmaznia kell legalább egy számot',
        'Password must contain at least one special character': 'A jelszónak tartalmaznia kell legalább egy speciális karaktert',
        'Weak password': 'Túl gyenge jelszó',
        'Passwords do not match': 'A jelszavak nem egyeznek',
        'Invalid email': 'Érvénytelen email cím',
        'Access denied': 'Hozzáférés megtagadva',
        'Session expired': 'A munkamenet lejárt',
        'Network error': 'Hálózati hiba',
        'Service unavailable': 'A szolgáltatás nem elérhető',
        'Too many requests': 'Túl sok kérés',
        'Internal server error': 'Belső szerverhiba',
        'User blocked': 'A felhasználó blokkolva van',
        'Invalid origin': 'Érvénytelen eredet',
        'Missing required payload data': 'Hiányzó kötelező adatok',
        'User (role: guests) missing scope (account)': 'Hozzáférés megtagadva. Nincs jogosultságod.',
        'Rate limit exceeded': 'Túl sok próbálkozás. Várj egy kicsit.',
        'Account already exists': 'A fiók már létezik'
    };
    
    const lowerMessage = message.toLowerCase();
    for (const [key, value] of Object.entries(commonErrors)) {
        if (lowerMessage.includes(key.toLowerCase())) {
            return value;
        }
    }
    
    return message; // Vissza az eredetit, ha nincs beépített fordítás
}

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('signup-form');
  const messageContainer = document.getElementById('message-container');
  const button = document.getElementById('button');

  function showMessage(text, type = 'success') {
    // Előző üzenetek eltávolítása
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Új üzenet hozzáadása
    button.insertAdjacentHTML('afterend', `<div class="message ${type}">${text}</div>`);
    
    // Automatikus eltávolítás sikeres üzeneteknél
    if (type === 'success') {
      setTimeout(() => {
        const message = document.querySelector('.message');
        if (message) message.remove();
      }, 3000);
    }
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Előző üzenetek eltávolítása
    const message = document.querySelector('.message');
    if (message) message.remove();    

    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Regisztráció...';

    // Jelszó ellenőrzés
    if (password !== confirmPassword) {
      showMessage('A jelszavak nem egyeznek!', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    if (password.length < 8) {
      showMessage('A jelszónak legalább 8 karakter hosszúnak kell lennie!', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    // Jelszó erősség ellenőrzés
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      showMessage('A jelszónak tartalmaznia kell nagybetűt, kisbetűt és számot!', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    try {
      // Regisztráció Appwrite-ban
      const user = await account.create(
        'unique()', // Auto-generált ID
        email,
        password,
        name
      );

      console.log('✅ Sikeres regisztráció:', user);
      showMessage('Sikeres regisztráció! Átirányítás...', 'success');
      
      // Automatikus bejelentkezés
      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Automatikus bejelentkezés:', session);
      
      // Átirányítás a profil oldalra
      setTimeout(() => {
        window.location.href = '/profile.html';
      }, 2000);

    } catch (error) {
      console.error('❌ Regisztrációs hiba:', error);
      
      // Automatikus fordítás
      const translatedMessage = await translateErrorMessage(error);
      showMessage(`Hiba: ${translatedMessage}`, 'error');
      
    } finally {
      // Visszaállítás
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
});