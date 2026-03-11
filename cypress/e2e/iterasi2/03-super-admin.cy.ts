describe('Iterasi 2 - Skenario 3: Super Admin (Dashboard Sistem Pusat)', () => {
  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.visit('/login');
    cy.get('input[type="email"]').type('cuikww19@gmail.com'); 
    cy.get('input[type="password"]').type('Cuikww2023'); 
    cy.get('button').contains('MASUK').click();
    cy.url({ timeout: 10000 }).should('include', '/admin-super/dashboard');
  });

  it('Harus berhasil memantau agregasi seluruh metrik operasional LaloBus', () => {
    // ==========================================
    // MEMANTAU DASHBOARD SISTEM (SA-US-02)
    // ==========================================
    cy.contains('Statistik Pusat', { timeout: 15000 }).should('be.visible');
    cy.contains('SUPER ADMIN').should('be.visible');

    // Validasi Kartu Metrik Utama
    cy.contains('Perputaran Dana (GMV)').should('be.visible');
    cy.contains('Total PO Terdaftar').should('be.visible');
    cy.contains('Total Pengguna').should('be.visible');
    cy.contains('Tiket Terjual Lunas').should('be.visible');

    // Validasi Grafik dan Log
    cy.contains('Volume Transaksi').should('be.visible');
    cy.contains('Log Aktivitas').should('be.visible');
  });
});