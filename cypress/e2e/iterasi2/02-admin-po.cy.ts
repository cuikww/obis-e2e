describe('Iterasi 2 - Skenario 2: Admin PO (Pelaporan & Kasir Offline)', () => {
  const adminEmail = 'admin1.sinar_terang@example.com';
  const adminPassword = 'passwordAdmin123';

  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.visit('/login');

    cy.get('input[placeholder="admin@email.com"]').type(adminEmail);
    cy.get('input[placeholder="********"]').type(adminPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();

    cy.url({ timeout: 15000 }).should('include', '/admin-po/dashboard');
  });

  it('Harus berhasil memantau dashboard, memfilter laporan, dan booking offline', () => {
    // --- FASE 1: DASHBOARD ---
    // FIX: Judul di PODashboard.tsx adalah "Ringkasan Bisnis", bukan "Statistik PO"
    cy.contains('Ringkasan Bisnis', { timeout: 10000 }).should('be.visible');
    cy.contains('Total Pendapatan').should('be.visible');
    cy.contains('Tiket Terjual').should('be.visible');

    // --- FASE 2: LAPORAN KEUANGAN ---
    cy.visit('/admin-po/finance');
    cy.contains('Laporan Transaksi').should('be.visible');
    cy.get('table tbody tr').should('have.length.at.least', 1);

    // --- FASE 3: BOOKING OFFLINE (KASIR) ---
    cy.visit('/admin-po/tickets');
    cy.contains('button', 'Booking Offline (Kasir)').click();

    // 1. Pilih Trip (Gunakan selector yang lebih stabil)
    cy.get('select').first().select(1); // Pilih opsi pertama setelah placeholder

    // 2. Tunggu Seat Map selesai loading (Check Loader2)
    cy.get('.animate-spin').should('not.exist');

    // 3. Isi Data Penumpang
    cy.get('input[placeholder="Nama Lengkap"]').type('Admin Offline Test');
    cy.get('input[placeholder="0812..."]').type('081234567890');

    // 4. Pilih Kursi dari Map (Cari yang warna putih/tersedia)
    // Sesuai kode Anda: kursi putih adalah button tanpa class bg-zinc-200
    cy.get('button').contains('1A').click();
    cy.contains('Kursi Dipilih:').parent().should('contain', '1A');

    // 5. Submit
    cy.get('button').contains('CETAK TIKET').click();

    // Verifikasi sukses (Alert)
    cy.on('window:alert', (str) => {
      expect(str).to.equal('✅ Booking Kasir (Offline) berhasil dicetak!');
    });
  });

  it('Harus bisa menghapus/void tiket penumpang offline', () => {
    cy.visit('/admin-po/tickets');
    
    // Pastikan Tab "Jadwal & Manifes" aktif
    cy.contains('button', 'Jadwal & Manifes').click();

    // 1. Klik baris pertama di tabel trip
    cy.get('table tbody tr').first().click();

    // 2. Tunggu manifes dimuat
    cy.get('#manifest-content').should('be.visible');
    cy.contains('Daftar Penumpang Manifes').should('be.visible');

    // 3. Hapus Tiket
    // Karena tombol hapus ada di dalam 'group-hover', kita bisa langsung force click 
    // atau gunakan invoke('show') jika realHover tidak terpasang
    cy.get('button[title="Kosongkan Kursi"]').first().click({ force: true });

    // 4. Konfirmasi dialog browser
    cy.on('window:confirm', () => true);

    // Verifikasi data berkurang atau loader muncul sebentar
    cy.contains('Kosongkan kursi ini').should('not.exist');
  });
});