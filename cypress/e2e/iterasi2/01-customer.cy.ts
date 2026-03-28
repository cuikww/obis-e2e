describe('Iterasi 2 - Skenario Customer: Cari Tiket hingga Pembayaran', () => {
  const customerEmail = 'f1d022049@student.unram.ac.id';
  const customerPassword = 'Password123!'; 

  const searchOrigin = 'KABUPATEN SIMEULUE'; 
  const searchDestination = 'KABUPATEN NIAS';

  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.viewport(1280, 720);
  });

  it('Alur Penuh: Login -> Cari -> Pesan -> Bayar (Intercept) -> History', () => {
    cy.on('window:alert', () => true);
    cy.on('uncaught:exception', () => false); 

    // ==========================================
    // FASE 1: LOGIN CUSTOMER
    // ==========================================
    cy.visit('/login');
    cy.get('input[placeholder="admin@email.com"]').clear().type(customerEmail);
    cy.get('input[placeholder="********"]').clear().type(customerPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();

    cy.location('pathname', { timeout: 15000 }).should('eq', '/');
    cy.contains('nav', 'Tiket Saya').should('be.visible'); 

    // ==========================================
    // FASE 2: MENCARI TIKET (HOME PAGE)
    // ==========================================
    cy.get('form').within(() => {
      cy.get('select').eq(0).find('option').should('have.length.greaterThan', 1);

      cy.get('select').eq(0).select(searchOrigin);
      cy.get('select').eq(1).select(searchDestination);

      // Kunci ke tanggal 11 Maret 2026 sesuai data API kamu
      const searchDate = '2026-03-11'; 
      cy.get('input[type="date"]').clear().type(searchDate);

      cy.get('select').eq(2).select('1 Kursi');

      cy.intercept('GET', '**/trips/search*').as('apiSearch');
      cy.get('button[type="submit"]').contains('Cari Tiket').click();
    });

    // ==========================================
    // FASE 3: HASIL PENCARIAN & DETAIL
    // ==========================================
    cy.wait('@apiSearch', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 304]);
    cy.url({ timeout: 10000 }).should('include', '/search');
    
    // Pastikan angka bukan 0
    cy.contains(/Ditemukan [1-9]\d* Perjalanan/i).should('be.visible');

    // Klik kartu
    cy.get('main .cursor-pointer').first().click();

    // Modal
    cy.get('div.fixed').should('be.visible');
    cy.contains('h3', 'Detail Armada').should('be.visible');
    
    // Klik Lanjutkan 
    cy.get('button').contains('Lanjutkan Pilih Kursi').click();

    // ==========================================
    // FASE 4: BOOKING PAGE (PILIH 1 KURSI)
    // ==========================================
    // Tadi gagal di sini karena tendangan React. Sekarang pasti tembus!
    cy.url({ timeout: 10000 }).should('include', '/booking');
    cy.contains('1. Pilih Kursi').should('be.visible');

    cy.get('button.bg-white.border-black')
      .not('.cursor-not-allowed') 
      .first() 
      .click({ force: true });

    cy.contains('Kursi Terpilih (1)').should('be.visible');

    cy.get('input[placeholder="0812xxxx"]').clear().type('081299998888');

    cy.get('input[placeholder="Nama Penumpang"]').first().clear().type('Nengah Dwi');
    cy.get('input[placeholder="Thn"]').first().clear().type('22');

    cy.intercept('POST', '**/bookings', (req) => {
      req.continue((res) => {
        if(res.body && res.body.redirect_url) {
            res.body.redirect_url = Cypress.config().baseUrl + '/history';
        }
        res.send();
      });
    }).as('submitBooking');

    cy.get('button').contains('BAYAR SEKARANG').click();
    cy.wait('@submitBooking').its('response.statusCode').should('be.oneOf', [200, 201]);

    // ==========================================
    // FASE 5: VERIFIKASI HISTORY
    // ==========================================
    cy.url({ timeout: 15000 }).should('include', '/history');
    cy.contains('h2', 'Pesanan Saya').should('be.visible');
    
    cy.contains('button', 'Tiket Aktif').click();
    
    cy.contains('Order ID').should('be.visible');
    cy.contains('PENDING').should('be.visible');

    cy.log('✅ YAY! ITERASI 2: ALUR CUSTOMER BERHASIL DIBUAT!');
  });
});