const express = require("express");
const { exec } = require("child_process");

const app = express();

app.use(express.json({ limit: "20mb" }));

app.post("/render", async (req, res) => {
    try {

        const campaign = req.body;

        console.log("========== REQUEST ==========");
        console.dir(campaign, { depth: null });
        console.log("=============================");

        const safeFileName = campaign.metadata.campaignName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        exec(
            "node render.js",
            {
                env: {
                    ...process.env,
                    CAMPAIGN_JSON: JSON.stringify(campaign)
                }
            },
            (err, stdout, stderr) => {

                if (err) {
                    console.error(stderr);

                    return res.status(500).json({
                        success: false,
                        error: stderr
                    });
                }

                console.log(stdout);

                return res.json({
                    success: true,
                    campaignId: campaign.metadata.campaignId,
                    campaignName: campaign.metadata.campaignName,
                    output: `assets/generated/images/${safeFileName}.png`
                });

            }
        );

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }
});

app.listen(3001, "0.0.0.0", () => {

    console.log("");
    console.log("==================================");
    console.log("Spread Capital Render API Running");
    console.log("http://localhost:3001/render");
    console.log("==================================");
    console.log("");

});