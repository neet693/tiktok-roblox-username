const { WebcastPushConnection } = require("tiktok-live-connector");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const path = require("path");

// Ganti ini dengan username TikTok kamu tanpa @
const TIKTOK_USERNAME = "itsmintzsu";

const OUTPUT_CSV = path.join(__dirname, "roblox_usernames.csv");

// Buat file CSV (kalau belum ada)
const csvWriter = createCsvWriter({
  path: OUTPUT_CSV,
  header: [
    { id: "timestamp", title: "Timestamp" },
    { id: "commenter", title: "TikTok_User" },
    { id: "roblox_username", title: "Roblox_Username" },
  ],
  append: fs.existsSync(OUTPUT_CSV),
});

// Pola username Roblox (3–20 huruf/angka/underscore)
const robloxRegex = /\b([A-Za-z0-9_]{3,20})\b/g;

// Mulai koneksi ke live TikTok
async function start() {
  console.log("🔄 Menghubungkan ke TikTok Live...");

  const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

  tiktok.on("connected", (roomInfo) => {
    console.log("✅ Terhubung ke Live Room ID:", roomInfo.roomId);
    console.log("Sekarang tunggu komentar...");
  });

  tiktok.on("chat", async (data) => {
    const message = data.comment;
    const commenter = data.uniqueId;

    // Cari kemungkinan username Roblox
    const matches = [...message.matchAll(robloxRegex)].map((m) => m[1]);

    // Filter username (hanya huruf/angka/underscore, panjang 3–20)
    const usernames = matches.filter((u) => /^[A-Za-z0-9_]{3,20}$/.test(u));

    if (usernames.length > 0) {
      const robloxName = usernames[0];
      const row = {
        timestamp: new Date().toISOString(),
        commenter,
        roblox_username: robloxName,
      };
      await csvWriter.writeRecords([row]);
      console.log(`💾 Disimpan: ${commenter} → ${robloxName}`);
    }
  });

  tiktok.connect();
}

start().catch(console.error);
