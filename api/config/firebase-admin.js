const admin = require("firebase-admin");

let serviceAccount;
try {
  serviceAccount = require("../serviceAccountKey.json");

  console.log("[API-SERVER] Conteúdo do serviceAccountKey.json:", JSON.stringify(serviceAccount).substring(0, 100) + "...");

} catch (e) {
  console.error("[API-SERVER] CRÍTICO: Não foi possível encontrar o 'serviceAccountKey.json'. Verifique o caminho.");
  console.error(e);
  process.exit(1); 
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin };