const express = require("express");
const { db, admin } = require("../config/firebase-admin");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const FieldValue = admin.firestore.FieldValue;

router.use(authMiddleware, isAdmin);

// ======================
// 📦 LISTAR DISPOSITIVOS
// ======================
router.get("/devices", async (req, res) => {
  const { uid: adminId, instituicaoId } = req.user;

  console.log("[DEBUG /admin/devices] UID:", adminId);
  console.log("[DEBUG /admin/devices] Instituição:", instituicaoId);

  try {
    const devicesRef = db.collection("dispositivos");

    const snapshot = await devicesRef
      .where("instituicaoId", "==", instituicaoId)
      .where("adminId", "array-contains", adminId)
      .get();

    if (snapshot.empty) {
      console.log("[DEBUG /admin/devices] Nenhum dispositivo encontrado.");
      return res.status(200).json([]);
    }

    const deviceList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("[DEBUG /admin/devices] Dispositivos encontrados:", deviceList.length);
    res.status(200).json(deviceList);
  } catch (error) {
    console.error("❌ Erro ao buscar dispositivos:", error);
    res.status(500).send({ message: "Erro ao buscar dispositivos." });
  }
});

// ======================
// 📡 LISTAR BEACONS
// ======================
router.get("/beacons", async (req, res) => {
  try {
    const adminId = req.user.uid;
    const beaconsRef = db.collection("beacons");

    const snapshot = await beaconsRef
      .where("adminId", "array-contains", adminId)
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const beaconList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(beaconList);
  } catch (error) {
    console.error("❌ Erro ao buscar beacons:", error);
    res.status(500).send({ message: "Erro ao buscar beacons." });
  }
});

// ======================
// ➕ CADASTRAR DISPOSITIVO
// ======================
router.post("/devices", async (req, res) => {
  try {
    const { nome, deviceId } = req.body;
    const { uid: adminId, instituicaoId } = req.user;

    if (!nome || !deviceId || !instituicaoId) {
      return res
        .status(400)
        .send({ message: "Campos 'nome', 'deviceId' e 'instituicaoId' são obrigatórios." });
    }

    const docRef = db.collection("dispositivos").doc(deviceId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return res.status(409).send({ message: "Este dispositivo já está cadastrado." });
    }

    const dataToSave = {
      nome: nome.trim(),
      bateria: 100,
      adminId: [adminId],
      instituicaoId,
      createdAt: FieldValue.serverTimestamp(),
      usuarioId: null,
      status: "Inativo",
    };

    await docRef.set(dataToSave);
    res.status(201).send({ id: deviceId, ...dataToSave });
  } catch (error) {
    console.error("❌ Erro ao salvar dispositivo:", error);
    res.status(500).send({ message: "Erro interno." });
  }
});

// ======================
// ➕ CADASTRAR BEACON
// ======================
router.post("/beacons", async (req, res) => {
  try {
    const { nome, deviceId } = req.body;
    const { uid: adminId, instituicaoId } = req.user;

    if (!nome || !deviceId) {
      return res.status(400).send({
        message: "Campos 'nome' e 'deviceId' são obrigatórios.",
      });
    }

    if (!instituicaoId) {
      return res.status(400).send({
        message: "O administrador não está associado a nenhuma instituição.",
      });
    }

    const docRef = db.collection("beacons").doc(deviceId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return res.status(409).send({ message: "Este beacon já foi registrado." });
    }

    const dataToSave = {
      nome: nome.trim(),
      bateria: 100,
      adminId: [adminId],
      instituicaoId,
      createdAt: FieldValue.serverTimestamp(),
    };

    await docRef.set(dataToSave);
    res.status(201).send({ id: deviceId, ...dataToSave });
  } catch (error) {
    console.error("❌ Erro ao salvar beacon:", error);
    res.status(500).send({ message: "Erro interno ao salvar beacon." });
  }
});

module.exports = router;
