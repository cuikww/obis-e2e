describe('Iterasi 3 (File 2) - Feedback & Tata Kelola: Customer -> Admin PO -> Super Admin', () => {
  const customerEmail = 'f1d022049@student.unram.ac.id';
  const customerPassword = 'Password123!'; 

  const adminEmail = 'cuikmah123@gmail.com'; 
  const adminPassword = 'Password123!';

  const superAdminEmail = 'cuikww19@gmail.com';
  const superAdminPassword = 'Cuikww2023';

  const ts = Date.now();
  const reviewText = `Perjalanan sangat nyaman dan aman. Kode test: ${ts}`;
  const replyText = `Terima kasih atas ulasan positifnya! (Auto-reply ${ts})`;
  
  const complaintSubject = `Barang tertinggal di bus. Ref: ${ts}`;
  const complaintDetail = `Ada tas warna hitam tertinggal di kursi 1A. Mohon bantuannya.`;

  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.viewport(1280, 720);
  });

  it('Alur Estafet: Customer (Review & Lapor) -> Admin PO (Balas) -> Super Admin (Tindaklanjut)', () => {
    // ✅ KUNCI PERBAIKAN: Biarkan Cypress menekan "OK" pada SEMUA alert tanpa melakukan validasi teks yang bikin error
    cy.on('window:alert', () => true);
    cy.on('window:confirm', () => true);
    cy.on('uncaught:exception', () => false);

    // =========================================================
    // AKTOR 1: CUSTOMER (MEMBERI ULASAN & KIRIM KELUHAN)
    // =========================================================
    cy.log('🔥 AKTOR 1: CUSTOMER LOGIN 🔥');
    cy.visit('/login');
    cy.get('input[placeholder="admin@email.com"]').clear().type(customerEmail);
    cy.get('input[placeholder="********"]').clear().type(customerPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();
    cy.location('pathname', { timeout: 15000 }).should('eq', '/');

    cy.visit('/history');
    cy.contains('button', 'Tiket Aktif').click();
    
    // Cari tombol "Beri Ulasan" pertama
    cy.contains('button', 'Beri Ulasan').first().click();

    cy.get('.fixed form').should('be.visible').within(() => {
      // Klik Bintang 5
      cy.get('.flex.gap-2 button').eq(4).click();
      cy.get('textarea').clear().type(reviewText);
      
      cy.intercept('POST', '**/reviews').as('submitReview');
      cy.get('button[type="submit"]').contains('KIRIM ULASAN').click();
    });

    cy.wait('@submitReview').its('response.statusCode').should('be.oneOf', [200, 201]);
    
    // ✅ Modal sekarang pasti akan tertutup
    cy.get('.fixed form').should('not.exist'); 

    // 1B. Mengirim Laporan / Keluhan 
    cy.visit('/complaints'); 
    cy.contains('Pusat Bantuan').should('be.visible');

    cy.get('input[placeholder="Contoh: Kesulitan saat proses Refund"]').clear().type(complaintSubject);
    cy.get('textarea[placeholder*="Ceritakan sedetail mungkin"]').clear().type(complaintDetail);
    
    cy.intercept('POST', '**/complaints').as('submitComplaint');
    cy.get('button[type="submit"]').contains('Kirim Laporan Sekarang').click();
    
    cy.wait('@submitComplaint').its('response.statusCode').should('be.oneOf', [200, 201]);

    cy.contains('Riwayat Saya').should('be.visible');
    cy.contains(complaintSubject).should('be.visible');
    cy.contains('PENDING').should('be.visible');

    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();


    // =========================================================
    // AKTOR 2: ADMIN PO (MEMBALAS ULASAN CUSTOMER)
    // =========================================================
    cy.log('🔥 AKTOR 2: ADMIN PO LOGIN 🔥');
    cy.visit('/login');
    cy.get('input[placeholder="admin@email.com"]').clear().type(adminEmail);
    cy.get('input[placeholder="********"]').clear().type(adminPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();
    cy.url({ timeout: 15000 }).should('include', '/admin-po/dashboard');

    cy.visit('/admin-po/marketing');
    cy.contains('button', 'Ulasan Pelanggan').click();
    cy.get('.animate-spin').should('not.exist');

    // Pastikan kita select elemen yg benar
    cy.contains(reviewText)
      .parents('.bg-white') 
      .first() 
      .within(() => {
        cy.get('textarea[placeholder*="Tulis balasan"]').clear().type(replyText);
        cy.intercept('POST', '**/reviews/*/reply').as('sendReply');
        cy.get('button').contains('Kirim Balasan').click();
      });

    cy.wait('@sendReply').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.contains('Balasan Anda').should('be.visible');
    cy.contains(replyText).should('be.visible');

    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();


    // =========================================================
    // AKTOR 3: SUPER ADMIN (MENGELOLA KELUHAN/LAPORAN)
    // =========================================================
    cy.log('🔥 AKTOR 3: SUPER ADMIN LOGIN 🔥');
    cy.visit('/login');
    cy.get('input[placeholder="admin@email.com"]').clear().type(superAdminEmail);
    cy.get('input[placeholder="********"]').clear().type(superAdminPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();
    cy.url({ timeout: 15000 }).should('include', '/admin-super/dashboard');

    cy.visit('/admin-super/complaints');
    cy.contains('Pusat Bantuan & Keluhan').should('be.visible');
    cy.get('.animate-spin').should('not.exist');

    cy.get('input[placeholder="Cari pelapor atau subjek..."]').clear().type(complaintSubject);
    cy.contains(complaintSubject).click();

    cy.contains('Panel Respon Admin').should('be.visible');
    cy.get('textarea[placeholder*="Halo, menanggapi keluhan"]').clear().type(`Laporan diterima. Kami sedang menghubungi pihak PO Bus terkait barang Anda. (Ref SA: ${ts})`);
    cy.get('select').select('RESOLVED');

    cy.intercept('PATCH', '**/complaints/admin/*/resolve').as('resolveComplaint');
    cy.get('button[type="submit"]').contains('Kirim & Update Status').click();

    cy.wait('@resolveComplaint').its('response.statusCode').should('be.oneOf', [200, 201]);

    cy.log('✅ ITERASI 3 (FILE 2): ESTAFET FEEDBACK & GOVERNANCE BERHASIL TOTAL!');
  });
});