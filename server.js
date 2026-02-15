const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const DATA_FOLDER = path.join(__dirname, "data");
const BANS_FILE = path.join(DATA_FOLDER, "rsb_bans.json");

// garante que a pasta existe
if (!fs.existsSync(DATA_FOLDER)) fs.mkdirSync(DATA_FOLDER);

// garante que o arquivo existe
if (!fs.existsSync(BANS_FILE)) fs.writeFileSync(BANS_FILE, "{}");

// ===============================
// READ BANS (GET /read_instant)
// ===============================
app.get("/read_instant", (req, res) => {
  try {
    const raw = fs.readFileSync(BANS_FILE, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.send(raw);
  } catch (err) {
    res.status(500).json({});
  }
});

// ===============================
// QUEUE LUA (POST /q_lua)
// ===============================

// fila de scripts em memória
let queue = [];

/*
Exemplo de job:
{
  interactionid: "123456",
  source: "print('oi')",
  ServerID: "ABC123"
}
*/

app.post("/q_lua", (req, res) => {
  const serverID = req.body.ServerID;
  if (!serverID) return res.status(400).send("Missing ServerID.");

  // procura o primeiro job destinado a esse ServerID
  const index = queue.findIndex(job => job.ServerID === serverID);
  if (index === -1) return res.status(204).send(""); // nada pra executar

  const job = queue.splice(index, 1)[0];
  res.json(job);
});

// ===============================
// RECEIVE EXECUTION RESPONSE (POST /q_responses)
// ===============================
app.post("/q_responses", (req, res) => {
  console.log("Execution Response:", req.body);
  res.sendStatus(200);
});

// ===============================
// (OPCIONAL) PUSH SCRIPT PARA TESTE
// ===============================
app.get("/push", (req, res) => {
  const source = req.query.code;
  const serverID = req.query.server; // pode passar ?code=...&server=ABC123

  if (!source) return res.send("Use ?code=");
  if (!serverID) return res.send("Use &server=SERVERID");

  queue.push({
    interactionid: Date.now().toString(),
    source,
    ServerID: serverID
  });

  res.send("queued.");
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});