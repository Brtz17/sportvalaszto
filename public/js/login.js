import { account } from '../lib/appwrite.js';

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

  // Email/Password login
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

      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Sikeres bejelentkezés:', session);
      //showMessage('Sikeres bejelentkezés!', 'success');
      
      setTimeout(() => {
        window.location.href = '/profile.html';
      }, 1000);

    } catch (error) {
      console.error('❌ Bejelentkezési hiba:', error);
      showMessage(`Hiba: ${error.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Google Login - Javított verzió
  googleBtn.addEventListener('click', function() {
    console.log('🚀 Google OAuth indítása...');
    
    // Jelenlegi domain meghatározása
    const currentDomain = window.location.origin;
    console.log('🌐 Current domain:', currentDomain);
    
    // Success URL - a jelenlegi domainre mutasson
    const successUrl = `${currentDomain}/profile.html`;
    const failureUrl = `${currentDomain}/login.html`;
    
    console.log('✅ Success URL:', successUrl);
    console.log('❌ Failure URL:', failureUrl);
    
    try {
      // OAuth2 session indítása
      account.createOAuth2Session('google', successUrl, failureUrl);
      
    } catch (error) {
      console.error('❌ Google OAuth hiba:', error);
      showMessage('Hiba a Google bejelentkezés indításakor', 'error');
    }
  });
});