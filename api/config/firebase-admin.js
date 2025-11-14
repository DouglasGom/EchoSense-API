const admin = require("firebase-admin");

let serviceAccount;

// 1. Tenta carregar da Variável de Ambiente (para o Render/Produção)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    // Parseia o JSON que veio da variável de ambiente
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("[API-SERVER] Chave de serviço carregada via Environment Variable (Produção).");
  } catch (e) {
    console.error("[API-SERVER] CRÍTICO: Falha ao parsear 'FIREBASE_SERVICE_ACCOUNT'. Verifique o JSON no Render.");
    console.error(e);
    process.exit(1); // Para a API se a chave estiver mal formatada
  }
} 
// 2. Se não achar, tenta carregar do arquivo local (para Desenvolvimento)
else {
  try {
    serviceAccount = require("../serviceAccountKey.json");
    console.log("[API-SERVER] Chave de serviço carregada via arquivo local (Desenvolvimento).");
  } catch (e) {
    console.error("[API-SERVER] CRÍTICO: Não foi possível encontrar 'serviceAccountKey.json' (Desenvolvimento). Verifique o caminho.");
    console.error(e);
    process.exit(1); // Para a API se não encontrar a chave
  }
}

// 3. Inicializa o Firebase Admin (apenas se não foi inicializado)
// Isso evita o crash de "duplicate-app" durante o hot-reload
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