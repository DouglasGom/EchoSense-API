const { admin } = require("../config/firebase-admin");

const authMiddleware = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).send({ message: "Token de autorização não informado." });
    }

    const token = authorization.split("Bearer ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log(`[AUTH] Verificando UID: ${uid}`);

    let userData = null;
    let role = "usuario";

    const adminRef = admin.firestore().collection("administradores").doc(uid);
    const adminDoc = await adminRef.get();

    if (adminDoc.exists) {
      userData = adminDoc.data();
      role = "admin";
      console.log(`[AUTH] ${uid} encontrado em 'administradores' (tipo: ${userData.tipo})`);
    } else {

      const userRef = admin.firestore().collection("usuarios").doc(uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        userData = userDoc.data();
        role = "usuario";
        console.log(`[AUTH] ${uid} encontrado em 'usuarios' (tipo: ${userData.tipo})`);
      } else {
        console.warn(`[AUTH] ${uid} não encontrado em 'administradores' nem em 'usuarios'`);
        return res.status(404).send({ message: "Perfil de usuário não encontrado." });
      }
    }

    req.user = {
      uid,
      email: decodedToken.email,
      tipo: userData.tipo || "USUARIO",
      instituicaoId: userData.instituicaoId || null,
      role,
      ...userData,
    };

    console.log(`[AUTH] Autenticado:
    - UID: ${uid}
    - Tipo: ${req.user.tipo}
    - Instituição: ${req.user.instituicaoId}
    - Email: ${req.user.email}
    - Role Interna: ${role}`);

    return next();
  } catch (error) {
    console.error("[AUTH ERROR]", error);
    return res.status(401).send({ message: "Token inválido ou expirado." });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.tipo === "ADMIN") {
    console.log(`[ADMIN CHECK] Acesso concedido:
    - UID: ${req.user.uid}
    - Tipo: ${req.user.tipo}
    - Instituição: ${req.user.instituicaoId}`);
    return next();
  }

  console.warn(`[ADMIN CHECK] Acesso negado:
  - UID: ${req.user?.uid}
  - Tipo: ${req.user?.tipo}
  - Instituição: ${req.user?.instituicaoId}`);

  return res.status(403).send({ message: "Acesso restrito a administradores." });
};

module.exports = { authMiddleware, isAdmin };
