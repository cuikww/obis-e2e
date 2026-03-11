import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://lalobus.online:3000/',
    chromeWebSecurity: false, // WAJIB
    experimentalModifyObstructiveThirdPartyCode: true, // WAJIB untuk Midtrans Snap
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 15000
  },
});