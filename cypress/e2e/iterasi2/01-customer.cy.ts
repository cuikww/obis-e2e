describe('Iterasi 2 - Skenario 1: Customer (Booking Integration)', () => {
  const validCustomerEmail = 'f1d022049@student.unram.ac.id';
  const validCustomerPassword = 'password123';
  
  const origin = 'KOTA MATARAM';
  const destination = 'KOTA BIMA';
  const searchDate = '2026-03-30';
  const poName = 'PO Update Auto';

  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[placeholder="admin@email.com"]').type(validCustomerEmail);
    cy.get('input[placeholder="********"]').type(validCustomerPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();
    cy.url({ timeout: 15000 }).should('eq', Cypress.config().baseUrl + '/');
  });

  it('Harus berhasil membuat pesanan nyata dan diarahkan ke riwayat', () => {
    // --- 1. PROSES PENCARIAN ---
    cy.get('select').eq(0).select(origin);
    cy.get('select').eq(1).select(destination);
    cy.get('input[type="date"]').clear().type(searchDate);
    
    cy.intercept('GET', '**/trips/search*').as('apiSearch');
    cy.get('button').contains('Cari Tiket').click();
    cy.wait('@apiSearch');

    cy.contains(poName, { timeout: 15000 }).should('be.visible').parents('.group').click();
    cy.get('button').contains('Lanjutkan Pilih Kursi').click();

    // --- 2. PENGISIAN DATA BOOKING ---
    cy.url().should('include', '/booking/');
    
    // Pilih kursi yang tersedia (Contoh: 3A & 3B)
    cy.get('button').contains('4D').click();
    cy.get('button').contains('4E').click();

    cy.get('input[placeholder="08xx-xxxx-xxxx"]').type('081234567890');
    const pNames = ['Nengah Dwi', 'Putra Witarsana'];
    cy.get('input[placeholder="Nama Lengkap Penumpang"]').each(($el, index) => {
      cy.wrap($el).type(pNames[index]);
    });
    cy.get('input[placeholder="Umur"]').each(($el) => { cy.wrap($el).type('22'); });

    // --- 3. INTERCEPT UNTUK MENGALIHKAN REDIRECT ---
    // Kita biarkan request pergi ke server nyata (Integration), 
    // tapi kita ubah response agar tidak benar-benar pergi ke Midtrans.
    cy.intercept('POST', '**/bookings', (req) => {
      req.continue((res) => {
        // Ubah redirect_url ke /history agar Cypress tetap di domain lokal
        res.body.redirect_url = Cypress.config().baseUrl + '/history';
        res.send();
      });
    }).as('submitBooking');

    // --- 4. EKSEKUSI PEMBAYARAN ---
    cy.get('button').contains('LANJUT PEMBAYARAN').click();

    // Pastikan request berhasil dikirim ke Backend Anda
    cy.wait('@submitBooking').its('response.statusCode').should('be.oneOf', [200, 201]);

    // --- 5. VERIFIKASI AKHIR ---
    // Aplikasi akan melakukan window.location.href ke /history (karena sudah kita manipulasi)
    cy.url({ timeout: 20000 }).should('include', '/history');
    cy.contains('Pesanan Saya').should('be.visible');
    
    // Pastikan status tiket yang baru dibuat adalah PENDING (Menunggu pembayaran asli)
    cy.contains('PENDING', { timeout: 10000 }).should('be.visible');
  });
});