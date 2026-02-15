const express = require("express");
const app = express();

app.use(express.json());

let queue = [];

app.post("/q_lua", (req, res) => {
    if (queue.length === 0) {
        return res.status(204).end();
    }

    const item = queue.shift();

    res.json({
        interactionid: item.id,
        source: item.source
    });
});

app.post("/q_responses", (req, res) => {
    console.log("Response:", req.body);
    res.sendStatus(200);
});

app.post("/send", (req, res) => {
    const { source } = req.body;

    if (!source) return res.status(400).send("missing source");

    queue.push({
        id: Date.now().toString(),
        source
    });

    res.send("queued");
});

app.get("/", (req, res) => {
    res.send("backend running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
