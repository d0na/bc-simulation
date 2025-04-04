const express = require("express");
const { exec } = require("child_process");

const app = express();
const PORT = 3001;

// Endpoint per eseguire il JAR
app.get("/simulation", (req, res) => {
    exec("java -jar ./libs/NMTSimulation.jar", (error, stdout, stderr) => {
        if (error) {
            console.error(`Errore: ${error.message}`);
            return res.status(500).json({ success: false, error: error.message });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ success: false, error: stderr });
        }

        console.log(`Output: ${stdout}`);
        res.json({ success: true, output: stdout });
    });
});

app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
});

