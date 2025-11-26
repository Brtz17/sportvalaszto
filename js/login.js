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

  // MOST MÁR A DOMContentLoaded BELSŐJÉBEN VAN
  setupPasswordChangeHandlers();
});

function setupPasswordChangeHandlers() {
  const passwordInput = document.getElementById('password');
  
  // Ellenőrizzük, hogy az elemek léteznek-e (csak a profile.html-en)
  if (!passwordInput) {
      console.log('Jelszó mező nem található');
      return;
  }
  
  // SAJÁT TOGGLE GOMBOK KEZELÉSE
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', function() {
          const targetId = this.getAttribute('data-target');
          const input = document.getElementById(targetId);
          if (input) {
              const type = input.type === 'password' ? 'text' : 'password';
              input.type = type;
              
              // SVG ikonok innerHTML-lel
              if (type === 'password') {
                  this.innerHTML = `
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Mutasd a jelszót">
                          <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                              d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z"/>
                          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                      </svg>
                      `;
              } else {
                  this.innerHTML = `
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Rejtsd a jelszót">
                          <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                              d="M1.5 12s4.5-7.5 10.5-7.5 10.5 7.5 10.5 7.5-1.8 3-5.7 4.8M3 3l18 18"/>
                          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                      </svg>                        
                  `;
              }
          }
      });
  });
}

// Segédfüggvény a jelszóváltoztatáshoz
function showMessage(text, type = 'success') {
    // Használd a meglévő message containert, vagy hozz létre újat
    const messageContainer = document.getElementById('message-container') || 
                           document.querySelector('.message-container') ||
                           createMessageContainer();
    
    messageContainer.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.className = 'message-container';
    document.body.prepend(container);
    return container;
}