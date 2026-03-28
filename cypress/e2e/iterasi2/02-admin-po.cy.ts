describe('Iterasi 2 - Skenario 2: Admin PO (Pelaporan & Manajemen Tiket)', () => {
  const adminEmail = 'cuikmah123@gmail.com'; 
  const adminPassword = 'Password123!';

  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.viewport(1280, 720);
    
    // Login hanya dilakukan sekali karena sekarang hanya ada 1 blok "it"
    cy.visit('/login');
    cy.get('input[placeholder="admin@email.com"]').type(adminEmail);
    cy.get('input[placeholder="********"]').type(adminPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();

    cy.url({ timeout: 15000 }).should('include', '/admin-po/dashboard');
  });

  // ✅ KEDUA TES DIGABUNG MENJADI SATU AGAR TIDAK PERLU LOGIN ULANG
  it('Harus berhasil memantau laporan keuangan dan menghapus tiket penumpang', () => {
    
    // ==========================================
    // FASE 1: DASHBOARD
    // ==========================================
    cy.contains('Ringkasan Bisnis', { timeout: 10000 }).should('be.visible');

    // ==========================================
    // FASE 2: LAPORAN KEUANGAN
    // ==========================================
    cy.visit('/admin-po/finance');
    cy.contains('Laporan Transaksi').should('be.visible');
    
    cy.contains('Total Pendapatan (Periode Ini)').should('be.visible');
    cy.get('.animate-spin').should('not.exist');

    // Coba fitur pencarian (Mencari nama penumpang dari tes sebelumnya)
    cy.get('input[placeholder="Cari Kode Booking atau Nama Customer..."]').type('Nengah'); 
    cy.wait(500); 

    // Coba filter status
    cy.get('select').select('SUCCESS');
    cy.wait(500);

    // Kembalikan filter ke normal
    cy.get('select').select('ALL');
    cy.get('input[placeholder="Cari Kode Booking atau Nama Customer..."]').clear();
    cy.get('tbody').should('be.visible');

    // ==========================================
    // FASE 3: MANAJEMEN MANIFES
    // ==========================================
    cy.visit('/admin-po/tickets');
    cy.contains('button', 'Jadwal & Manifes').click();

    // Tunggu tulisan loading hilang dari tabel
    cy.contains('Sinkronisasi Jadwal...', { timeout: 15000 }).should('not.exist');

    // Klik data perjalanan
    cy.get('table tbody tr.cursor-pointer').should('have.length.at.least', 1).first().click();

    // Tunggu sidebar manifes muncul
    cy.get('#manifest-content', { timeout: 10000 }).should('be.visible');
    cy.contains('Detail & Manifes').should('be.visible');
    cy.contains('Memuat Data...').should('not.exist');

    // ✅ PERBAIKAN: Gunakan scrollIntoView() agar Cypress menggulir ke bawah 
    // pada elemen yang tertutup karena overflow/max-height CSS.
    cy.contains('Daftar Penumpang Manifes').scrollIntoView().should('be.visible');

    // Hapus Tiket: Gunakan scrollIntoView() juga untuk memastikan tombol bisa dijangkau
    cy.get('button[title="Kosongkan Kursi"]')
      .first()
      .scrollIntoView()
      .click({ force: true });

    // Konfirmasi dialog browser (Konfirmasi Void)
    cy.on('window:confirm', (txt) => {
      expect(txt).to.contains('Kosongkan kursi ini');
      return true; // Menekan "OK"
    });

    // Beri jeda 1 detik agar UI selesai memperbarui daftar
    cy.wait(1000);

    cy.log('✅ ITERASI 2: ALUR ADMIN PO SELESAI!');
  });
});