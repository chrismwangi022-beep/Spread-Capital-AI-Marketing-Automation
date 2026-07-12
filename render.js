/**
 * REUSABLE GRAPHICS LAYOUT ENGINE ENTRY POINT
 * Path: /render.js
 */

const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");

function parseCliFlags() {
    const flags = {};

    process.argv.slice(2).forEach(arg => {
        const [key, value] = arg.split("=");

        if (key.startsWith("--")) {
            flags[key.replace("--", "")] = value;
        }
    });

    return flags;
}

async function loadCampaign(flags) {

    // API Mode
    if (process.env.CAMPAIGN_JSON) {
        return JSON.parse(process.env.CAMPAIGN_JSON);
    }

    // CLI Mode
    const campaignPath =
        flags.campaign ||
        path.join(
            __dirname,
            "assets",
            "generated",
            "metadata",
            "campaign.json"
        );

    return JSON.parse(await fs.readFile(campaignPath, "utf8"));
}

(async () => {

    const flags = parseCliFlags();

    try {

        console.log("[Platform Core] Loading campaign...");

        const campaign = await loadCampaign(flags);
        await fs.writeFile(
    path.join(__dirname, "debug-campaign.json"),
    JSON.stringify(campaign, null, 2)
);
        console.log(JSON.stringify(campaign.brand, null, 2));

        const safeFileName = campaign.metadata.campaignName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const outputPath =
            flags.output ||
            path.join(
                __dirname,
                "assets",
                "generated",
                "images",
                `${safeFileName}.png`
            );

        const layouts = JSON.parse(
            await fs.readFile(
                path.join(__dirname, "assets", "branding", "layouts.json"),
                "utf8"
            )
        );

        const typography = JSON.parse(
            await fs.readFile(
                path.join(__dirname, "assets", "branding", "typography.json"),
                "utf8"
            )
        );

        const config = JSON.parse(
            await fs.readFile(
                path.join(__dirname, "assets", "templates", "renderer-config.json"),
                "utf8"
            )
        );

        const theme = JSON.parse(
            await fs.readFile(
                path.join(
                    __dirname,
                    "assets",
                    "branding",
                    "themes",
                    `${campaign.metadata.theme}.json`
                ),
                "utf8"
            )
        );

        const currentDimensions = layouts[campaign.metadata.profile];

        if (!currentDimensions) {
            throw new Error(
                `Unknown render profile: ${campaign.metadata.profile}`
            );
        }

        const executionContextPayload = {

            schemaVersion: "1.0.0",

            metadata: campaign.metadata,

            components: campaign.components,

            brand: campaign.brand,

            data: campaign.data,

            injectedLayout: currentDimensions,

            injectedTypography: typography,

            injectedTheme: theme,

            injectedConfig: config

        };

        const browser = await puppeteer.launch({

            headless: "new",

            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--allow-file-access-from-files"
            ]

        });

        const page = await browser.newPage();

        await page.setViewport({

            width: currentDimensions.width,

            height: currentDimensions.height,

            deviceScaleFactor:
                campaign.renderProfile?.dpi
                    ? campaign.renderProfile.dpi / 96
                    : 1

        });

        await page.evaluateOnNewDocument(payload => {

            window.RENDER_DATA = payload;

        }, executionContextPayload);

        await page.goto(
            `file://${path.join(
                __dirname,
                "assets",
                "templates",
                "poster.html"
            )}`,
            {
                waitUntil: "load"
            }
        );

        await page.waitForFunction(
            () => typeof window.renderEngineStatus !== "undefined",
            {
                timeout: 2000
            }
        );

        const status = await page.evaluate(
            () => window.renderEngineStatus
        );

        if (status.startsWith("ENGINE_FAILURE")) {
            throw new Error(status);
        }

        await page.waitForFunction(
            () => window.renderEngineStatus === "READY_TO_EXPORT",
            {
                timeout: config.engine?.waitTimeout || 5000
            }
        );
        // Give Chromium a moment to finish painting
await new Promise(resolve => setTimeout(resolve, 300));

        // --------------------------------------------------
// Verify the canvas exists and has a size
// --------------------------------------------------

const exists = await page.$("#canvas-viewport");

if (!exists) {
    throw new Error("canvas-viewport element was not found.");
}

const box = await page.$eval(
    "#canvas-viewport",
    el => ({
        width: el.offsetWidth,
        height: el.offsetHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight
    })
);

console.log("");
console.log("========== VIEWPORT ==========");
console.log(box);
console.log("==============================");
console.log("");

await fs.mkdir(path.dirname(outputPath), {
    recursive: true
});

try {

    await exists.screenshot({

        path: outputPath,

        type: campaign.renderProfile?.format || "png",

        omitBackground:
            campaign.renderProfile?.transparent || false

    });

}
catch(err){

    console.log("");
    console.log("========== PAGE HTML ==========");
    console.log(await page.content());
    console.log("===============================");
    console.log("");

    throw err;

}

        const manifest = {

            campaignId: campaign.metadata.campaignId,

            campaignName: campaign.metadata.campaignName,

            output: path.basename(outputPath),

            created: new Date().toISOString(),

            engineVersion: config.engine.version

        };

        await fs.writeFile(

            path.join(
                __dirname,
                "assets",
                "generated",
                "metadata",
                "manifest.json"
            ),

            JSON.stringify(manifest, null, 2)

        );

        console.log("");
        console.log("========================================");
        console.log("RENDER COMPLETE");
        console.log(outputPath);
        console.log("========================================");
        console.log("");

        await browser.close();

    }

    catch (err) {

        console.error(
            "\n[RENDER ERROR]",
            err.message,
            "\n"
        );

        process.exit(1);

    }

})();