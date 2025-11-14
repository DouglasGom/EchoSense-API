const express = require("express");
const { db, admin } = require("../config/firebase-admin");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
const FieldValue = admin.firestore.FieldValue;

const checkDeviceOwnership = async (deviceId, userId) => {
  const deviceRef = db.collection("dispositivos").doc(deviceId);
  const docSnap = await deviceRef.get();

  if (!docSnap.exists) return { error: "Dispositivo não encontrado." };
  
  const deviceData = docSnap.data();

  if (!deviceData.usuarioId || !Array.isArray(deviceData.usuarioId) || !deviceData.usuarioId.includes(userId)) {
     console.warn(`[AUTH CHECK] Falha: UID ${userId} não está no array 'usuarioId' do dispositivo ${deviceId}.`);
     return { error: "Usuário não autorizado para este dispositivo." };
  }
  
  return { success: true, ref: deviceRef };
};


router.put("/:deviceId/battery", authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { batteryLevel } = req.body;
    
    if (req.user.role !== 'usuario') {
        return res.status(403).send({ message: "Apenas usuários de bengala podem reportar bateria." });
    }

    const { error, ref } = await checkDeviceOwnership(deviceId, req.user.uid);
    if (error) return res.status(403).send({ message: error });

    await ref.update({
      bateria: Number(batteryLevel),
      ultimaAtualizacaoBateria: FieldValue.serverTimestamp(),
    });

    res.status(200).send({ message: "Nível da bateria atualizado." });
  } catch (error) {
    console.error("Erro ao atualizar bateria:", error);
    res.status(500).send({ message: "Erro interno." });
  }
});

router.put("/:deviceId/status", authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { status } = req.body;

    const { error, ref } = await checkDeviceOwnership(deviceId, req.user.uid);
    if (error) return res.status(403).send({ message: error });

    await ref.update({
      status: status,
      ultimaAtualizacaoStatus: FieldValue.serverTimestamp(),
    });

    res.status(200).send({ message: "Status do dispositivo atualizado." });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    res.status(500).send({ message: "Erro interno." });
  }
});

router.post("/:deviceId/emergency", authMiddleware, async (req, res) => {
   try {
    const { deviceId } = req.params;

    const { error } = await checkDeviceOwnership(deviceId, req.user.uid);
    if (error) return res.status(403).send({ message: error });

    await db.collection("alertas").add({
        deviceId: deviceId,
        userId: req.user.uid,
        timestamp: FieldValue.serverTimestamp(),
        message: "Botão de emergência acionado!"
    });

    res.status(200).send({ message: "Alerta de emergência registrado." });
  } catch (error) {
    console.error("Erro ao registrar emergência:", error);
    res.status(500).send({ message: "Erro interno." });
  }
});

module.exports = router;