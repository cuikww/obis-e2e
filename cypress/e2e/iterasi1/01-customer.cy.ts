describe('Iterasi 1 - Skenario Customer (Registrasi & Login)', () => {
  // PENTING: Pastikan Anda menjalankan SQL TRUNCATE di pgAdmin 
  // sebelum menjalankan test ini agar email ini benar-benar bersih.
  const customerEmail = 'f1d022049@student.unram.ac.id';
  const password = 'Password123!';

  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('Harus bisa registrasi dan otomatis verifikasi setelah OTP diketik manual', () => {
    cy.on('window:alert', () => true); // Handle alert "Verifikasi Berhasil" otomatis
    
    cy.visit('/register');
    cy.get('input[placeholder="Ketik nama lengkap..."]').clear().type('Customer LaloBus');
    cy.get('input[placeholder="Ketik no. handphone..."]').clear().type('081234567890');
    cy.get('input[placeholder="Ketik email..."]').clear().type(customerEmail);
    cy.get('input[placeholder="Ketik password..."]').clear().type(password);
    
    // Tekan tombol daftar
    cy.get('button').contains('DAFTAR SEKARANG').click();

    // Pastikan masuk ke halaman OTP
    cy.location('pathname', { timeout: 15000 }).should('include', '/verify-otp');
    
    cy.log('⏳ SILAKAN CEK EMAIL DAN KETIK 6 DIGIT OTP DI LAYAR BROWSER.');
    cy.log('⏳ Cypress akan otomatis menekan tombol Verifikasi setelah 6 angka terisi...');

    // MAGIC WAIT: Cypress akan menunggu maksimal 60 detik sampai Anda mengetik 6 digit di input OTP.
    // Anda TIDAK PERLU menekan tombol "Verifikasi" atau "Resume", cukup ketik angkanya saja!
    cy.get('input[placeholder="------"]', { timeout: 60000 })
      .should('have.length', 1)
      .invoke('val')
      .should('have.length', 6); 

    // Setelah 6 digit terdeteksi, Cypress yang akan klik tombol Verifikasi
    cy.get('button').contains('VERIFIKASI AKUN').click();

    // Cypress memastikan halaman otomatis berpindah ke /login (tanda verifikasi sukses)
    cy.location('pathname', { timeout: 15000 }).should('eq', '/login');
  });

  it('Harus berhasil Login dengan akun Customer yang sudah diverifikasi', () => {
    // Karena di it() sebelumnya kita sudah berada di /login, kita tinggal visit ulang untuk memastikan state bersih
    cy.visit('/login');
    
    cy.get('input[placeholder="admin@email.com"]').clear().type(customerEmail);
    cy.get('input[placeholder="********"]').clear().type(password);
    cy.get('button').contains('MASUK KE DASHBOARD').click();

    // Pengecekan URL Dashboard
    cy.location('pathname', { timeout: 15000 }).should('eq', '/');
    cy.get('nav').contains('LaloBus', { matchCase: false }).should('be.visible');
  });
});