describe('Iterasi 3 (File 1) - Siklus Uang: Promo & Refund', () => {
  const adminEmail = 'cuikmah123@gmail.com'; 
  const adminPassword = 'Password123!';

  const customerEmail = 'f1d022049@student.unram.ac.id';
  const customerPassword = 'Password123!'; 

  const ts = Date.now();
  const promoCode = `MDK${ts.toString().slice(-4)}`; 
  
  // Sesuai dengan data JSON Trip yang diberikan
  const searchOrigin = 'KABUPATEN SIMEULUE'; 
  const searchDestination = 'KABUPATEN NIAS';
  const searchDate = '2026-03-14'; // Kunci ke tanggal keberangkatan data kamu

  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.viewport(1280, 720);
  });

  it('Estafet Promo & Refund: Admin PO -> Customer -> Admin PO', () => {
    cy.on('window:alert', () => true);
    cy.on('window:confirm', () => true);
    cy.on('uncaught:exception', () => false);

    // =========================================================
    // AKTOR 1: ADMIN PO (MEMBUAT PROMO BARU)
    // =========================================================
    cy.log('🔥 AKTOR 1: ADMIN PO LOGIN 🔥');
    cy.visit('/login');
    cy.get('input[placeholder="admin@email.com"]').clear().type(adminEmail);
    cy.get('input[placeholder="********"]').clear().type(adminPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();

    cy.url({ timeout: 15000 }).should('include', '/admin-po/dashboard');

    cy.visit('/admin-po/marketing');
    cy.contains('Marketing & Promosi').should('be.visible');

    cy.get('form').within(() => {
      cy.get('input[placeholder="MUDIK2026"]').clear().type(promoCode);
      
      // Biarkan default 10% dan 100 Kuota
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      cy.get('input[type="date"]').clear().type(nextWeek.toISOString().split('T')[0]);

      cy.intercept('POST', '**/promos').as('createPromo');
      cy.get('button[type="submit"]').contains('Terbitkan Promo').click();
    });

    cy.wait('@createPromo').its('response.statusCode').should('eq', 201);
    cy.contains('table tbody tr', promoCode).should('be.visible');

    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();


    // =========================================================
    // AKTOR 2: CUSTOMER (MENGGUNAKAN PROMO & MENGAJUKAN REFUND)
    // =========================================================
    cy.log('🔥 AKTOR 2: CUSTOMER LOGIN 🔥');
    cy.visit('/login');
    cy.get('input[placeholder="admin@email.com"]').clear().type(customerEmail);
    cy.get('input[placeholder="********"]').clear().type(customerPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();

    cy.location('pathname', { timeout: 15000 }).should('eq', '/');

    cy.get('form').within(() => {
      cy.get('select').eq(0).find('option').should('have.length.greaterThan', 1);
      cy.get('select').eq(0).select(searchOrigin);
      cy.get('select').eq(1).select(searchDestination);
      
      // Gunakan tanggal 14 Maret sesuai JSON
      cy.get('input[type="date"]').clear().type(searchDate);
      cy.get('select').eq(2).select('1 Kursi');
      
      cy.intercept('GET', '**/trips/search*').as('apiSearch');
      cy.get('button[type="submit"]').contains('Cari Tiket').click();
    });

    cy.wait('@apiSearch', { timeout: 15000 });
    
    // Pilih Trip Express 0184
    cy.get('main .cursor-pointer').first().click();
    cy.get('button').contains('Lanjutkan Pilih Kursi').click();

    cy.url({ timeout: 10000 }).should('include', '/booking');
    
    cy.get('button.bg-white.border-black')
      .not('.cursor-not-allowed')
      .first()
      .click({ force: true });

    cy.get('input[placeholder="0812xxxx"]').clear().type('081299998888');
    cy.get('input[placeholder="Nama Penumpang"]').first().clear().type('Nengah Refund Test');
    cy.get('input[placeholder="Thn"]').first().clear().type('25');

    // Aplikasikan Promo
    cy.get('input[placeholder="KODE"]').clear().type(promoCode);
    cy.intercept('GET', '**/promos/public').as('checkPromo');
    cy.get('button').contains('CEK').click();
    cy.wait('@checkPromo');
    cy.contains('Berhasil Dipasang!').should('be.visible');

    // Bayar Sekarang (Buka Midtrans Asli)
    cy.get('button').contains('BAYAR SEKARANG').click();

    // 🛑 CYPRESS BERHENTI SEMENTARA DI SINI 🛑
    cy.log('================================================================');
    cy.log('⚠️ PERHATIAN: SILAKAN LAKUKAN PEMBAYARAN DI POP-UP MIDTRANS ⚠️');
    cy.log('Setelah sukses dan kembali ke riwayat, KLIK TOMBOL PLAY (RESUME) DI ATAS!');
    cy.log('================================================================');
    cy.pause(); 

    // ==========================================
    // SETELAH RESUME (Berada di halaman History dengan tiket SUCCESS)
    // ==========================================
    cy.url({ timeout: 15000 }).should('include', '/history');
    cy.contains('button', 'Tiket Aktif').click();
    
    // Cari kartu tiket yang baru dibayar (SUCCESS), lalu klik tombol Refund
    cy.contains('SUCCESS', { timeout: 15000 })
      .parents('.bg-white')
      .within(() => {
        cy.contains('button', 'Refund').first().click();
      });
    
    // Mengisi Form Refund (Akan berhasil karena di DB sudah SUCCESS dan H-3)
    cy.url().should('include', '/refund/');
    cy.contains('Pengajuan Pembatalan').should('be.visible');

    cy.get('select').select('Sakit / Keadaan Darurat');
    cy.get('input[placeholder="Contoh: BCA / Mandiri / GoPay"]').clear().type('Bank BCA');
    cy.get('input[placeholder="1234567890"]').clear().type('1234567890');
    cy.get('input[placeholder="Sesuai nama di rekening"]').clear().type('Nengah Dwi');

    cy.intercept('POST', '**/bookings/refund-request/*').as('reqRefund');
    cy.get('button[type="submit"]').contains('AJUKAN REFUND').first().click({ force: true });
    
    cy.wait('@reqRefund').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.contains('Pengajuan Berhasil').should('be.visible');

    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();

    // =========================================================
    // AKTOR 3: ADMIN PO (MEMPROSES REFUND)
    // =========================================================
    cy.log('🔥 AKTOR 3: ADMIN PO LOGIN KEMBALI 🔥');
    cy.visit('/login');
    cy.get('input[placeholder="admin@email.com"]').clear().type(adminEmail);
    cy.get('input[placeholder="********"]').clear().type(adminPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();

    cy.url({ timeout: 15000 }).should('include', '/admin-po/dashboard');

    cy.visit('/admin-po/refunds');
    cy.contains('Manajemen Pembatalan').should('be.visible');
    cy.get('.animate-spin').should('not.exist');

    // Klik tombol Setujui
    cy.contains('button', 'Unggah Bukti & Setujui').first().click();
    cy.get('h3').contains('Lampirkan Bukti Transfer').should('be.visible');

    // 🛑 KITA PAUSE LAGI DI SINI AGAR KAMU BISA UPLOAD MANUAL 🛑
    cy.log('================================================================');
    cy.log('⚠️ SILAKAN UPLOAD BUKTI DAN KLIK "Selesaikan Refund" SECARA MANUAL ⚠️');
    cy.log('Setelah sukses dan modal tertutup, KLIK TOMBOL PLAY (RESUME) DI ATAS!');
    cy.log('================================================================');
    cy.pause();

    // ==========================================
    // SETELAH RESUME (Berada di halaman Refunds)
    // ==========================================
    
    // Pindah ke Tab Riwayat untuk memverifikasi refund berhasil
    cy.contains('button', 'Riwayat Proses').click();
    
    // Pastikan refund yang baru saja disetujui muncul di daftar Riwayat
    cy.contains('Disetujui').should('be.visible');
    cy.contains('Total Dikembalikan').should('be.visible');

    cy.log('✅ ITERASI 3 (FILE 1): ESTAFET PROMO & REFUND BERHASIL TOTAL!');
  });
});