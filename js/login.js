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
        'Password must be at least 8 characters': 'A jelszónak legalább 8 karakter hosszúnak kell lennie',
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
        'OAuth provider not supported': 'Az OAuth szolgáltató nem támogatott',
        'OAuth session not found': 'OAuth munkamenet nem található',
        'Missing required payload data': 'Hiányzó kötelező adatok',
        'User (role: guests) missing scope (account)': 'Hozzáférés megtagadva. Nincs jogosultságod.'
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
  const form = document.getElementById('login-form');
  const messageContainer = document.getElementById('message-container');
  const googleBtn = document.getElementById('google');

  function showMessage(text, type = 'success') {
    messageContainer.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => {
      messageContainer.innerHTML = '';
    }, 5000);
  }

  // Email/Password login - FRISSÍTVE FORDÍTÁSSAL
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Bejelentkezés...';

    try {
      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');

      // Ellenőrzés, hogy minden mező ki van-e töltve
      if (!email || !password) {
        showMessage('Kérjük, töltsd ki mindkét mezőt!', 'error');
        return;
      }

      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Sikeres bejelentkezés:', session);
      
      // Sikeres üzenet
      console.log('Sikeres bejelentkezés! Átirányítás...', 'success');
      
      setTimeout(() => {
        window.location.href = '/profile.html';
      }, 100);

    } catch (error) {
      console.error('❌ Bejelentkezési hiba:', error);
      
      // Automatikus fordítás
      const translatedMessage = await translateErrorMessage(error);
      showMessage(`Hiba: ${translatedMessage}`, 'error');
      
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Google Login - FRISSÍTVE FORDÍTÁSSAL
  googleBtn.addEventListener('click', async function() {
    console.log('🚀 Google OAuth indítása...');
    
    // Loading state a Google gombhoz
    const originalText = googleBtn.textContent;
    googleBtn.disabled = true;
    googleBtn.textContent = 'Csatlakozás...';
    
    try {
        // Jelenlegi domain meghatározása
        const currentDomain = window.location.origin;
        console.log('🌐 Current domain:', currentDomain);
        
        // Success URL - a jelenlegi domainre mutasson
        const successUrl = `${currentDomain}/profile.html`;
        const failureUrl = `${currentDomain}/login.html`;
        
        console.log('✅ Success URL:', successUrl);
        console.log('❌ Failure URL:', failureUrl);
        
        // OAuth2 session indítása
        account.createOAuth2Session('google', successUrl, failureUrl);
        
    } catch (error) {
        console.error('❌ Google OAuth hiba:', error);
        
        // Automatikus fordítás
        const translatedMessage = await translateErrorMessage(error);
        showMessage(`Google bejelentkezési hiba: ${translatedMessage}`, 'error');
        
    } finally {
        // Visszaállítás
        googleBtn.disabled = false;
        googleBtn.textContent = originalText;
    }
  });
});