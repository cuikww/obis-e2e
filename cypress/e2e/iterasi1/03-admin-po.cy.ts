describe('Iterasi 1 - Alur Terintegrasi: Super Admin ke Booking Kasir', () => {
  const ts = Date.now();
  const poName = `PO Lalo Cypress ${ts}`;
  const poEmail = 'cuikmah123@gmail.com'; 
  const poPhone = `0812${ts.toString().slice(-8)}`;
  const globalPassword = 'Password123!';

  const superAdminEmail = 'cuikww19@gmail.com';
  const superAdminPassword = 'Cuikww2023';

  const facilityName = `WiFi & Snack ${ts.toString().slice(-4)}`;
  const terminalName1 = `Terminal Asal ${ts.toString().slice(-4)}`;
  const terminalName2 = `Terminal Tujuan ${ts.toString().slice(-4)}`;
  const busName = `Bus Express ${ts.toString().slice(-4)}`;

  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('Siklus Hidup PO: Dari Registrasi SA sampai Kasir Offline', () => {
    cy.on('window:confirm', () => true);
    cy.on('window:alert', (txt) => {
      if (txt.includes('berhasil')) expect(txt).to.contains('berhasil');
    });

    // ==========================================
    // FASE 1: SUPER ADMIN DAFTARKAN MITRA PO
    // ==========================================
    cy.visit('/login');
    cy.intercept('POST', '**/auth/login').as('loginSA');
    
    cy.get('input[placeholder="admin@email.com"]').type(superAdminEmail);
    cy.get('input[placeholder="********"]').type(superAdminPassword);
    cy.get('button').contains('MASUK KE DASHBOARD').click();
    
    cy.wait('@loginSA');
    cy.location('pathname', { timeout: 15000 }).should('include', '/admin-super/dashboard');

    cy.visit('/admin-super/po-accounts/add');
    cy.get('input[placeholder="CONTOH: PO SINAR JAYA"]').type(poName);
    cy.get('input[placeholder="081234567890"]').type(poPhone);
    cy.get('textarea[placeholder="JL. RAYA MANDALIKA NO. 100, MATARAM..."]').type('Jl. Majapahit No. 10, Mataram');
    
    cy.intercept('POST', '**/po-bus').as('createPoApi');
    cy.get('button').contains('Simpan & Terbitkan Secret Key').click();
    
    cy.wait('@createPoApi').then((interception) => {
      const capturedSecretKey = interception.response?.body?.secretKey;
      cy.log('SECRET KEY TERDETEKSI:', capturedSecretKey);

      // Logout & Bersihkan Sesi Super Admin
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.wait(1000);

      // ==========================================
      // FASE 2: REGISTRASI ADMIN PO
      // ==========================================
      cy.visit('/register/admin-po'); 
      cy.url().should('include', '/register/admin-po');

      cy.get('input[placeholder="Masukkan kode unik dari Super Admin"]').type(capturedSecretKey);
      cy.get('input[placeholder="Ketik nama pengelola..."]').type('Admin ' + poName);
      cy.get('input[placeholder="Ketik no. handphone..."]').type(poPhone);
      cy.get('input[placeholder="Ketik email resmi..."]').type(poEmail);
      cy.get('input[placeholder="Ketik password..."]').type(globalPassword);

      cy.get('button').contains('AKTIFKAN AKUN MITRA').click();

      // ✅ AUTO-RESUME: Tunggu kamu input OTP secara manual.
      // Begitu sistem redirect ke /login, Cypress otomatis lanjut (Max tunggu 2 menit).
      cy.log('SILAKAN MASUKKAN KODE OTP MANUAL. CYPRESS AKAN LANJUT BEGITU MASUK HALAMAN LOGIN.');
      cy.url({ timeout: 120000 }).should('include', '/login'); 

      // ==========================================
      // FASE 3: LOGIN ADMIN PO (OTOMATIS LANJUT)
      // ==========================================
      cy.get('input[placeholder="admin@email.com"]').type(poEmail);
      cy.get('input[placeholder="********"]').type(globalPassword);
      cy.intercept('POST', '**/auth/login').as('loginAdminPo');
      cy.get('button').contains('MASUK KE DASHBOARD').click();
      cy.wait('@loginAdminPo');
      
      cy.url({ timeout: 15000 }).should('include', '/admin-po/dashboard');

      // --- KELOLA FASILITAS ---
      cy.visit('/admin-po/assets/facilities');
      cy.get('button').contains('Tambah Fasilitas').click();
      cy.get('input[placeholder="Contoh: Kursi Pijat"]').type(facilityName);
      cy.get('button').contains('SIMPAN FASILITAS').click();

      // --- KELOLA 2 TERMINAL (KOTA BERBEDA) ---
      cy.visit('/admin-po/assets/terminals');
      
      // Terminal 1
      cy.get('button').contains('Tambah Terminal').click();
      cy.get('div.fixed form').within(() => {
        cy.contains('label', 'Nama Terminal').next('input').type(terminalName1);
        cy.get('select').eq(0).select(1); 
        cy.wait(2000); 
        cy.get('select').eq(1).select(1); 
        cy.get('textarea').type('Jl. Alamat Terminal Asal No. 123'); // Input Alamat
        cy.get('button').contains('SIMPAN TERMINAL').click();
      });
      // ✅ TUNGGU MODAL TERTUTUP TOTAL agar tidak menghalangi klik berikutnya
      cy.get('div.fixed').should('not.exist');
      cy.wait(1000);

      // Terminal 2 (Beda Provinsi/Kota)
      cy.get('button').contains('Tambah Terminal').click();
      cy.get('div.fixed form').within(() => {
        cy.contains('label', 'Nama Terminal').next('input').type(terminalName2);
        cy.get('select').eq(0).select(2); 
        cy.wait(2000); 
        cy.get('select').eq(1).select(1); 
        cy.get('textarea').type('Jl. Alamat Terminal Tujuan No. 456'); // Input Alamat
        cy.get('button').contains('SIMPAN TERMINAL').click();
      });
      cy.get('div.fixed').should('not.exist');

      // --- KELOLA BUS ---
      cy.visit('/admin-po/assets/buses');
      cy.get('button').contains('Registrasi Bus').click();
      cy.get('input[placeholder="Nama Bus (Cth: Sinar Jaya 01)"]').type(busName);
      cy.get('select').eq(0).select(1); 
      cy.wait(2000); 
      cy.get('.min-w-62\\.5 .grid.gap-2').first().scrollIntoView();
      cy.get('.min-w-62\\.5 .grid.gap-2').first().children().then(($cells) => {
        for(let i = 0; i < 20; i++) {
          cy.wrap($cells).eq(i).click({ force: true });
        }
      });
      cy.get('button').contains('SIMPAN ARMADA').click();

      /// ==========================================
      // FASE 4: KELOLA JADWAL (REVISED)
      // ==========================================
      cy.visit('/admin-po/tickets');
      
      // Definisikan intercept di awal agar siap menangkap request
      cy.intercept('POST', '**/trips').as('saveTrip');

      cy.get('button').contains('Trip').click();
      
      // Tunggu modal muncul
      cy.get('div.fixed form').should('be.visible').within(() => {
        // 1. Pilih Bus
        cy.get('select').eq(0).find('option').then(($options) => {
          const optionsArray = $options.toArray() as HTMLOptionElement[];
          const target = optionsArray.find(opt => opt.text.includes(busName));
          cy.get('select').eq(0).select(target ? target.text : 1, { force: true });
        });

        // 2. Pilih Terminal Asal & Tujuan
        cy.get('select').eq(1).select(1, { force: true }); // Asal (Index 1)
        cy.get('select').eq(2).find('option').then(($options) => {
          const optionsArray = $options.toArray() as HTMLOptionElement[];
          const target = optionsArray.find(opt => opt.text.includes(terminalName2));
          cy.get('select').eq(2).select(target ? target.text : 2, { force: true });
        });

        // --- FIX: MENGISI KEDUA TANGGAL ---
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        const depTime = tomorrow.toISOString().slice(0, 16);
        
        const arrival = new Date(tomorrow);
        arrival.setHours(arrival.getHours() + 5); // Tiba 5 jam kemudian
        const arrTime = arrival.toISOString().slice(0, 16);

        // Pastikan kita mengisi index 0 DAN index 1
        cy.get('input[type="datetime-local"]').eq(0).should('be.visible').type(depTime);
        cy.get('input[type="datetime-local"]').eq(1).should('be.visible').type(arrTime);
        
        // 3. Input Harga
        cy.get('input[type="number"]').clear().type('150000');
        
        // 4. Submit
        cy.get('button[type="submit"]').contains('AKTIFKAN TRIP').click({ force: true });
      });

      // Sekarang wait pasti akan menangkap request karena form valid
      cy.wait('@saveTrip', { timeout: 15000 }).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      });

      // Pastikan modal tertutup
      cy.get('div.fixed').should('not.exist');

      // ==========================================
      // FASE 5: BOOKING OFFLINE (Lanjut Otomatis)
      // ==========================================
      cy.contains('button', 'Booking Offline (Kasir)').click({ force: true });

      // BOOKING OFFLINE (KASIR)
      cy.get('button').contains('Booking Offline (Kasir)').click();
      cy.get('select').last().select(1, { force: true });
      cy.get('input[placeholder="Nama Lengkap"]').type('Penumpang Cypress');
      cy.get('button.bg-white.border-black').first().click({ force: true });
      cy.get('button').contains('CETAK TIKET').click();

      cy.log('✅ ITERASI 1 BERHASIL SEPENUHNYA!');
    });
  });
});