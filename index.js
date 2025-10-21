// ====== TikTok Roblox Username Logger (Versi Aman) ======

require("dotenv").config(); // 👉 untuk membaca file .env
const { WebcastPushConnection } = require("tiktok-live-connector");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const path = require("path");

// Ambil username dari file .env
const TIKTOK_USERNAME = process.env.MY_TIKTOK_USERNAME;

// Validasi: pastikan username ada
if (!TIKTOK_USERNAME) {
  console.error("❌ Error: MY_TIKTOK_USERNAME belum diset di file .env");
  console.error("Buat file .env dan isi seperti ini:");
  console.error("MY_TIKTOK_USERNAME=namatiktokmu");
  process.exit(1);
}

// Pastikan tidak bisa dijalankan untuk username lain via CLI
const userInput = process.argv[2];
if (userInput && userInput !== TIKTOK_USERNAME) {
  console.error(
    "❌ Tidak boleh connect ke username lain selain milik pribadi!"
  );
  process.exit(1);
}

// Lokasi file CSV output
const OUTPUT_CSV = path.join(__dirname, "roblox_usernames.csv");

// Buat CSV writer (kalau belum ada, buat baru)
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

// ====== Fungsi utama ======
async function start() {
  console.log(`🔄 Menghubungkan ke TikTok Live @${TIKTOK_USERNAME}...`);

  const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

  // Event: berhasil terhubung
  tiktok.on("connected", (roomInfo) => {
    console.log("✅ Terhubung ke Live Room ID:", roomInfo.roomId);
    console.log("💬 Menunggu komentar dari penonton...");
  });

  // Event: ada komentar
  tiktok.on("chat", async (data) => {
    const message = data.comment.trim();
    const commenter = data.uniqueId;

    // Cari kemungkinan username Roblox
    const matches = [...message.matchAll(robloxRegex)].map((m) => m[1]);

    // Filter hasil agar valid
    const usernames = matches.filter((u) => /^[A-Za-z0-9_]{3,20}$/.test(u));

    if (usernames.length > 0) {
      const robloxName = usernames[0];

      // Simpan ke CSV
      const row = {
        timestamp: new Date().toISOString(),
        commenter,
        roblox_username: robloxName,
      };

      await csvWriter.writeRecords([row]);
      console.log(`💾 Disimpan: ${commenter} → ${robloxName}`);
    }
  });

  // Event: error koneksi
  tiktok.on("disconnected", () => {
    console.warn("⚠️ Terputus dari live. Mencoba ulang dalam 10 detik...");
    setTimeout(() => start(), 10000);
  });

  // Mulai koneksi
  try {
    await tiktok.connect();
  } catch (err) {
    console.error("❌ Gagal menghubungkan:", err);
  }
}

// Jalankan
start();
