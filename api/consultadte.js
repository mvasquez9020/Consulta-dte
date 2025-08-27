import express from "express";
import serverless from "serverless-http";
import axios from "axios";
import https from "https";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// Variables desde entorno Vercel
const { KEY_PEM, CERT_PEM, NIT_EMISOR } = process.env;

async function generarTokenMH(keyPem, certPem) {
  // Aquí defines el JWT según lo que requiere MH
  return jwt.sign(
    { sub: NIT_EMISOR, aud: "https://servicios.minhacienda.gob.sv" },
    keyPem,
    { algorithm: "RS256", expiresIn: "5m" }
  );
}

app.post("/api/consultadte", async (req, res) => {
  try {
    const token = await generarTokenMH(KEY_PEM, CERT_PEM);

    const agente = new https.Agent({
      cert: CERT_PEM,
      key: KEY_PEM,
      rejectUnauthorized: false,
    });

    const respuesta = await axios.post(
      "https://api.mh.gob.sv/consulta-dte",
      req.body,
      {
        httpsAgent: agente,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(respuesta.data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default serverless(app);
