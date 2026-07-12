/**
 * ==========================================================
 * Spread Capital Graphics Engine v2
 * Foundation Layer
 * ==========================================================
 */

class RenderContext {

    constructor(payload){

        this.metadata=payload.metadata || {};

        this.brand=payload.brand || {};

        this.data=payload.data || {};

        this.components=payload.components || [];

        this.theme=payload.injectedTheme || {};

        this.layout=payload.injectedLayout || {};

        this.typography=payload.injectedTypography || {};

        this.config=payload.injectedConfig || {};

    }

}

/* ==========================================================
   THEME MANAGER
========================================================== */

class ThemeManager{

    apply(context){

        const root=document.documentElement;

        if(!context.theme.colors) return;

        Object.entries(context.theme.colors).forEach(([key,value])=>{

            root.style.setProperty(`--color-${key}`,value);

        });

    }

}

/* ==========================================================
   LAYOUT MANAGER
========================================================== */

class LayoutManager{

    apply(context){

        const root=document.documentElement;

        if(context.layout.width){

            root.style.setProperty(
                "--canvas-w",
                context.layout.width+"px"
            );

        }

        if(context.layout.height){

            root.style.setProperty(
                "--canvas-h",
                context.layout.height+"px"
            );

        }

        root.setAttribute(
            "data-profile",
            context.metadata.profile || "portrait"
        );

        root.setAttribute(
            "data-platform",
            context.metadata.platform || ""
        );

    }

}

/* ==========================================================
   ASSET MANAGER
========================================================== */

class AssetManager{

    apply(context){

        const bg=context.data.assets?.background?.src;

        if(bg){

            document
                .getElementById("background-layer")
                ?.style
                .setProperty(
                    "background-image",
                    `url('${bg}')`
                );

        }

    }

    async waitForAssets(){

        const images=[...document.images];

        await Promise.all(

            images.map(img=>{

                if(img.complete) return Promise.resolve();

                return new Promise(resolve=>{

                    img.onload=resolve;

                    img.onerror=resolve;

                });

            })

        );

        if(document.fonts){

            await document.fonts.ready;

        }

    }

}
/* ==========================================================
   COMPONENT REGISTRY
========================================================== */

const ComponentRegistry = {

    /* ------------------------------------------------------
       LOGO
    ------------------------------------------------------ */

    logo: {

        render(context) {

            const zone = document.getElementById("brand-zone");

            if (!zone) return;

            zone.innerHTML = "";

            if (!context.brand.logo) return;

            const img = document.createElement("img");

            img.src = context.brand.logo;
            img.alt = context.brand.name || "";
            img.className = "brand-logo-img";

            zone.appendChild(img);

        }

    },

    /* ------------------------------------------------------
       HEADLINE
    ------------------------------------------------------ */

    headline: {

        render(context) {

            const headline = document.getElementById("headline");
            const subheadline = document.getElementById("subheadline");
            const caption = document.getElementById("caption");

            if (headline)
                headline.textContent = context.data.headline || "";

            if (subheadline)
                subheadline.textContent = context.data.subHeadline || "";

            if (caption)
                caption.textContent = context.data.caption || "";

        }

    },

    /* ------------------------------------------------------
       FEATURES
    ------------------------------------------------------ */

    features: {

        render(context) {

            const list = document.getElementById("feature-list");

            if (!list) return;

            list.innerHTML = "";

            const features = context.data.features || [];

            features.forEach(feature => {

                const li = document.createElement("li");

                li.className = "feature-item";

                li.innerHTML = `
                    <span class="bullet">✔</span>
                    <span>${feature}</span>
                `;

                list.appendChild(li);

            });

        }

    },

    /* ------------------------------------------------------
       BUTTON
    ------------------------------------------------------ */

    button: {

        render(context) {

            const button = document.getElementById("cta-button");

            if (!button) return;

            button.textContent = context.data.cta || "";

        }

    },

    /* ------------------------------------------------------
       CONTACT
    ------------------------------------------------------ */

    contact: {

        render(context) {

            const grid = document.getElementById("contact-grid");

            if (!grid) return;

            grid.innerHTML = "";

            const contact = context.data.contact || {};

            const icons = {

                phone: "📞",
                whatsapp: "💬",
                website: "🌐",
                email: "✉"

            };

            Object.entries(contact).forEach(([key, value]) => {

                if (!value) return;

                const node = document.createElement("div");

                node.className = "contact-node";

                node.innerHTML = `
                    <span class="icon">${icons[key] || ""}</span>
                    <span>${value}</span>
                `;

                grid.appendChild(node);

            });

        }

    },

    /* ------------------------------------------------------
       FOOTER
    ------------------------------------------------------ */

    footer: {

        render(context, component) {

            const tag = document.getElementById("footer-tagline");

            if (!tag) return;

            tag.textContent =
                component?.props?.tagline ||
                "FINANCING YOUR GROWTH";

        }

    },

    /* ------------------------------------------------------
       HERO IMAGE
    ------------------------------------------------------ */

    hero: {

        render(context) {

            const zone = document.getElementById("hero-zone");

            if (!zone) return;

            zone.innerHTML = "";

            const src = context.data.assets?.hero?.src;

            if (!src) return;

            const img = document.createElement("img");

            img.src = src;
            img.className = "hero-image";

            zone.appendChild(img);

        }

    }

};
/* ==========================================================
   COMPONENT MANAGER
========================================================== */

class ComponentManager {

    render(context) {

        context.components.forEach(component => {

            if (component.visible === false) return;

            const renderer = ComponentRegistry[component.type];

            if (!renderer) {
                console.warn(`No renderer registered for component: ${component.type}`);
                return;
            }

            try {

                renderer.render(context, component);

            } catch (err) {

                console.error(
                    `Component "${component.type}" failed:`,
                    err
                );

            }

        });

    }

}

/* ==========================================================
   GRAPHICS RENDERER
========================================================== */

class GraphicsRenderer {

    constructor() {

        this.themeManager = new ThemeManager();

        this.layoutManager = new LayoutManager();

        this.assetManager = new AssetManager();

        this.componentManager = new ComponentManager();

    }

    async execute(payload) {

        try {

            const context = new RenderContext(payload);

            /* Apply Theme */

            this.themeManager.apply(context);

            /* Apply Layout */

            this.layoutManager.apply(context);

            /* Apply Background Assets */

            this.assetManager.apply(context);

            /* Render Components */

            this.componentManager.render(context);

            /* Wait for images + fonts */

            await this.assetManager.waitForAssets();

            this.complete();

        }

        catch (err) {

            this.fail(err);

        }

    }

    complete() {

        document.documentElement.classList.add(
            "render-engine-ready"
        );

        window.renderEngineStatus = "READY_TO_EXPORT";

        console.log("✓ Render Complete");

    }

    fail(err) {

        document.documentElement.classList.add(
            "render-engine-failed"
        );

        window.renderEngineStatus =
            "ENGINE_FAILURE: " + err.message;

        console.error(err);

    }

}
/* ==========================================================
   ENGINE BOOTSTRAP
========================================================== */

window.CompositorCore = new GraphicsRenderer();

document.addEventListener("DOMContentLoaded", () => {

    if (!window.RENDER_DATA) {

        console.error("No render payload received.");

        window.renderEngineStatus =
            "ENGINE_FAILURE: Missing render payload.";

        return;

    }

    window.CompositorCore.execute(window.RENDER_DATA);

});