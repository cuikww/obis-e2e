describe('Iterasi 1 - Skenario Super Admin (Kelola Akun PO)', () => {
  // Variabel dinamis agar data PO selalu unik tiap kali test dijalankan
  const ts = Date.now();
  const dynPhone = `0812${ts.toString().slice(-8)}`;
  const poName = `PO Lalo Cypress ${ts}`;
  const poNameEdited = `${poName} Edited`;
  
  // Kredensial Super Admin dari seeder Anda
  const superAdminEmail = 'cuikww19@gmail.com';
  const superAdminPassword = 'Cuikww2023';

  beforeEach(() => {
    // Membersihkan sesi sebelumnya agar tidak bentrok
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('Harus berhasil login dan melakukan siklus CRUD Mitra PO', () => {
    // Mencegah Cypress berhenti jika ada alert/confirm dari browser
    cy.on('window:confirm', () => true);
    cy.on('window:alert', () => true);

    // ==========================================
    // 1. FASE LOGIN
    // ==========================================
    cy.visit('/login');
    
    // Intercept API Login untuk memastikan respon sukses dari backend
    cy.intercept('POST', '**/auth/login').as('loginApi');

    cy.get('input[placeholder="admin@email.com"]').clear().type(superAdminEmail);
    cy.get('input[placeholder="********"]').clear().type(superAdminPassword); 
    cy.get('button').contains('MASUK KE DASHBOARD').click();
    
    // Tunggu backend memproses login
    cy.wait('@loginApi').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    // Verifikasi diarahkan ke dashboard Super Admin
    cy.location('pathname', { timeout: 15000 }).should('include', '/admin-super/dashboard');

    // ==========================================
    // 2. FASE CREATE PO
    // ==========================================
    cy.visit('/admin-super/po-accounts/add');
    
    // Mengisi form registrasi PO menggunakan selector yang presisi sesuai FE Anda
    cy.get('input[placeholder="CONTOH: PO SINAR JAYA"]').clear().type(poName);
    cy.get('input[placeholder="081234567890"]').clear().type(dynPhone);
    cy.get('textarea[placeholder="JL. RAYA MANDALIKA NO. 100, MATARAM..."]').clear().type('Jl. Majapahit No. 10, Mataram');
    
    // Intercept API Create PO
    cy.intercept('POST', '**/po-bus').as('createPoApi'); // Sesuaikan endpoint jika berbeda
    cy.get('button').contains('Simpan & Terbitkan Secret Key').click();
    
    // Verifikasi kembali ke halaman list PO dan data muncul
    cy.location('pathname', { timeout: 15000 }).should('include', '/admin-super/po-accounts');
    cy.wait(1500); 
    cy.reload(); // Memastikan data terbaru ditarik dari DB
    cy.contains(poName, { timeout: 10000 }).should('be.visible');

    // ==========================================
    // 3. FASE UPDATE PO
    // ==========================================
    // Cari baris tabel yang mengandung nama PO yang baru dibuat, lalu klik tombol Edit
    cy.contains(poName).parents('tr').find('a').contains('Edit').click();
    
    // Pastikan masuk ke halaman edit (URL mengandung /edit/)
    cy.location('pathname', { timeout: 10000 }).should('include', '/edit/');
    
    // Tunggu form terisi data lama, lalu ubah
    cy.get('input[placeholder="CONTOH: PO JAYA UTAMA"]', { timeout: 10000 }).should('not.have.value', '');
    cy.get('input[placeholder="CONTOH: PO JAYA UTAMA"]').clear().type(poNameEdited);
    
    cy.get('button').contains('SIMPAN PERUBAHAN PROFIL').click();
    
    // Verifikasi kembali ke list PO dan nama sudah berubah
    cy.location('pathname', { timeout: 15000 }).should('include', '/admin-super/po-accounts');
    cy.wait(1500); 
    cy.reload();
    cy.contains(poNameEdited, { timeout: 10000 }).should('be.visible');

    // ==========================================
    // 4. FASE DELETE PO
    // ==========================================
    // Cari baris PO yang sudah di-edit, lalu klik Hapus
    cy.contains(poNameEdited).parents('tr').find('button').contains('Hapus').click();
    
    // Verifikasi nama PO sudah hilang dari DOM tabel
    cy.contains(poNameEdited, { timeout: 10000 }).should('not.exist');
  });
});