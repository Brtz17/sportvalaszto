import { account } from './lib/appwrite.js';

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('signup-form');
  const messageContainer = document.getElementById('message-container');

const button = document.getElementById('button');

function showMessage(text, type = 'success') {
  button.insertAdjacentHTML('afterend', `<div class="message ${type}">${text}</div>`);
  const message = document.querySelector('.message');
}


  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const message = document.querySelector('.message');
    if (message) message.remove();    


    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Jelszó ellenőrzés
    if (password !== confirmPassword) {
      showMessage('A jelszavak nem egyeznek!', 'error');
      return;
    }

    if (password.length < 8) {
      showMessage('A jelszónak legalább 8 karakter hosszúnak kell lennie!', 'error');
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
      showMessage('Sikeres regisztráció!', 'success');
      const message = document.querySelector('.message');
      message.style.color = '#17771f';
      
      // Automatikus bejelentkezés
      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Automatikus bejelentkezés:', session);
      
      // Átirányítás a profil oldalra
      setTimeout(() => {
        window.location.href = '/profile.html';
      }, 2000);

    } catch (error) {
      console.error('❌ Regisztrációs hiba:', error);
      showMessage(`Hiba: ${error.message}`, 'error');
    }
  });
});