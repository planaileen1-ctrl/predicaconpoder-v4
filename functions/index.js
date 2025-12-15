const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const corsHandler = cors({ origin: true });

/* ================= CREATE PAYPHONE PAYMENT ================= */
exports.createPayphonePayment = onRequest(
  {
    secrets: ["PAYPHONE_TOKEN"], // 🔥 AQUÍ ESTABA EL ERROR
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { rifaId, numero, nombre, telefono, monto } = req.body;

        if (!rifaId || !numero || !monto) {
          return res.status(400).json({ error: "Datos incompletos" });
        }

        const PAYPHONE_TOKEN = process.env.PAYPHONE_TOKEN;

        if (!PAYPHONE_TOKEN) {
          return res.status(500).json({
            error: "Token PayPhone no configurado",
          });
        }

        const response = await axios.post(
          "https://pay.payphone.app/api/transaction",
          {
            amount: Math.round(Number(monto) * 100),
            amountWithoutTax: Math.round(Number(monto) * 100),
            tax: 0,
            currency: "USD",
            reference: `Rifa ${rifaId} Número ${numero}`,
          },
          {
            headers: {
              Authorization: `Bearer ${PAYPHONE_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        const { transactionId, paymentUrl } = response.data;

        await db
          .collection("rifas")
          .doc(rifaId)
          .collection("numeros")
          .doc(numero)
          .set(
            {
              estado: "pendiente_pago",
              nombre,
              telefono,
              payphoneTransactionId: transactionId,
              creadoAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        return res.json({ paymentUrl });
      } catch (error) {
        console.error(
          "❌ PayPhone ERROR:",
          error.response?.data || error.message
        );
        return res.status(500).json({
          error: "Error creando pago PayPhone",
          detail: error.response?.data || error.message,
        });
      }
    });
  }
);

/* ================= WEBHOOK ================= */
exports.payphoneWebhook = onRequest(async (req, res) => {
  try {
    const data = req.body;

    if (data?.status !== "APPROVED") {
      return res.status(200).send("IGNORED");
    }

    const ref = data.reference; // Rifa {id} Número {num}
    const match = ref.match(/Rifa (.+) Número (\d+)/);

    if (!match) {
      return res.status(400).send("Invalid reference");
    }

    const [, rifaId, numero] = match;

    await db
      .collection("rifas")
      .doc(rifaId)
      .collection("numeros")
      .doc(numero)
      .update({
        estado: "pagado",
        pagadoAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return res.status(200).send("OK");
  } catch (e) {
    console.error("Webhook error:", e);
    return res.status(500).send("ERROR");
  }
});
