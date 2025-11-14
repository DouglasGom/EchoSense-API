// firebase-admin.js
const admin = require("firebase-admin");
const path = require("path");

let serviceAccount;
const PROD_SECRET_PATH = "/etc/secrets/serviceAccountKey.json"; // Caminho no Render
const DEV_SECRET_PATH = path.join(__dirname, "../serviceAccountKey.json"); // Caminho no seu PC

// 1. Tenta carregar o "Secret File" (Produção no Render)
try {
  serviceAccount = require(PROD_SECRET_PATH);
  console.log("[API-SERVER] Chave de serviço carregada via Secret File (Produção).");
} catch (e) {
  // Se falhar (e.code === 'MODULE_NOT_FOUND'), tenta o caminho local
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log("[API-SERVER] Secret File de produção não encontrado. Tentando caminho de desenvolvimento...");
    
    // 2. Tenta carregar o arquivo local (Desenvolvimento)
    try {
      serviceAccount = require(DEV_SECRET_PATH);
      console.log("[API-SERVER] Chave de serviço carregada via arquivo local (Desenvolvimento).");
    } catch (e2) {
      console.error("[API-SERVER] CRÍTICO: Não foi possível encontrar a chave em NENHUM caminho (Prod ou Dev).");
      console.error("Erro Prod (ignorado):", e.message);
      console.error("Erro Dev:", e2.message);
      process.exit(1);
    }
  } else {
    // O arquivo existe mas é inválido
    console.error("[API-SERVER] CRÍTICO: Falha ao parsear o Secret File de produção.", e);
    process.exit(1);
  }
}

// 3. Inicializa o Firebase Admin (se não foi inicializado)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("[API-SERVER] Firebase Admin inicializado com sucesso.");
  } catch (e) {
    console.error("[API-SERVER] CRÍTICO: Falha ao inicializar o Firebase Admin.", e);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin };