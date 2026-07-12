/**
 * THE GRAPHICS RENDERING SYSTEM ENGINE PLATFORM
 * Core Engine Model: Unified Pure State Runtime Matrix
 */

class RenderContext {
  constructor(payload) {
    this.schemaVersion = payload.schemaVersion;
    this.metadata = payload.metadata;
    this.brand = payload.brand;
    this.theme = payload.injectedTheme;
    this.typography = payload.injectedTypography;
    this.layout = payload.injectedLayout;
    this.config = payload.injectedConfig;
    this.components = payload.components;
    this.data = payload.data;
  }
}

class ThemeManager {
  apply(context) {
    const root = document.documentElement;
    Object.keys(context.theme.colors).forEach(key => {
      root.style.setProperty(`--color-${key}`, context.theme.colors[key]);
    });
    Object.keys(context.typography).forEach(elementKey => {
      const styles = context.typography[elementKey];
      Object.keys(styles).forEach(cssProp => {
        root.style.setProperty(`--typo-${elementKey}-${cssProp}`, styles[cssProp]);
      });
    });
  }
}

class LayoutManager {
  apply(context) {
    const root = document.documentElement;
    root.style.setProperty('--canvas-w', `${context.layout.width}px`);
    root.style.setProperty('--canvas-h', `${context.layout.height}px`);
    root.setAttribute('data-profile', context.metadata.profile);
    root.setAttribute('data-platform', context.metadata.platform);

    if (context.config.engine?.safeZonePreview) {
      const sz = document.querySelector('.safe-zone-boundary');
      if (sz) sz.style.display = 'block';
    }
  }
}

// DECOUPLED INDEPENDENT COMPONENT COMPOSITORS
const ComponentRegistry = {
  logo: {
    render(container, compConfig, context) {
      const template = document.getElementById('tpl-logo');
      const clone = document.importNode(template.content, true);
      const img = clone.querySelector('.brand-logo-img');
      if (img && context.brand.logo) img.src = context.brand.logo;
      container.appendChild(clone);
    }
  },
  headline: {
    render(container, compConfig, context) {
      const template = document.getElementById('tpl-headline');
      const clone = document.importNode(template.content, true);
      clone.querySelector('.render-headline').textContent = context.data.headline || '';
      clone.querySelector('.render-subheadline').textContent = context.data.subHeadline || '';
      clone.querySelector('.render-caption').textContent = context.data.caption || '';
      container.appendChild(clone);
    }
  },
  features: {
    render(container, compConfig, context) {
      if (!context.data.features || context.data.features.length === 0) return;
      const template = document.getElementById('tpl-features');
      const clone = document.importNode(template.content, true);
      const ul = clone.querySelector('.feature-list');
      context.data.features.forEach(text => {
        const li = document.createElement('li');
        li.className = 'feature-item';
        li.innerHTML = `<span class="bullet">✔</span> <span class="text">${text}</span>`;
        ul.appendChild(li);
      });
      container.appendChild(clone);
    }
  },
  button: {
    render(container, compConfig, context) {
      if (!context.data.cta) return;
      const template = document.getElementById('tpl-button');
      const clone = document.importNode(template.content, true);
      clone.querySelector('.cta-button-element').textContent = context.data.cta;
      container.appendChild(clone);
    }
  },
  contact: {
    render(container, compConfig, context) {
      if (!context.data.contact) return;
      const template = document.getElementById('tpl-contact');
      const clone = document.importNode(template.content, true);
      const grid = clone.querySelector('.contact-grid');
      
      const icons = compConfig.props?.icons || { phone: '📞', whatsapp: '💬', website: '🌐', email: '✉' };
      Object.keys(context.data.contact).forEach(key => {
        if (icons[key] && context.data.contact[key]) {
          const div = document.createElement('div');
          div.className = 'contact-node';
          div.innerHTML = `<span class="icon">${icons[key]}</span> ${context.data.contact[key]}`;
          grid.appendChild(div);
        }
      });
      container.appendChild(clone);
    }
  },
  footer: {
    render(container, compConfig, context) {
      const template = document.getElementById('tpl-footer');
      const clone = document.importNode(template.content, true);
      clone.querySelector('.meta-branch-tag').textContent = context.data.contact?.branch ? `Branch: ${context.data.contact.branch}` : '';
      clone.querySelector('.meta-date-stamp').textContent = `System Code: ${context.metadata.date}`;
      clone.querySelector('.footer-corporate-tagline').textContent = compConfig.props?.tagline || 'SYSTEM VERIFIED';
      container.appendChild(clone);
    }
  }
};

class ComponentManager {
  assemble(context) {
    const surface = document.getElementById('composition-surface');
    surface.innerHTML = '';
    
    context.components.forEach(compConfig => {
      if (compConfig.visible === false) return;
      const handler = ComponentRegistry[compConfig.type];
      if (handler) {
        handler.render(surface, compConfig, context);
      } else {
        console.warn(`Render Subsystem Alert: Unknown type definition target: ${compConfig.type}`);
      }
    });
  }
}

class AssetResolver {
  resolve(context) {
    const root = document.documentElement;
    if (context.data.assets?.background?.src) {
      root.style.setProperty('--bg-image-url', `url('${context.data.assets.background.src}')`);
    }
    if (context.data.assets?.overlay) {
      root.style.setProperty('--gradient-overlay-override', context.data.assets.overlay);
    }
  }

  async verifyAllLoaded() {
    const images = Array.from(document.querySelectorAll('img'));
    const promises = images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    await document.fonts.ready;
    await Promise.all(promises);
  }
}

class PluginManager {
  constructor() {
    this.registry = {
      beforeThemeLoaded: [],
      beforeLayout: [],
      beforeRender: [],
      afterRender: [],
      beforeExport: []
    };
  }

  register(hook, fn) {
    if (this.registry[hook]) this.registry[hook].push(fn);
  }

  async trigger(hook, context) {
    for (const fn of this.registry[hook]) {
      await fn(context);
    }
  }
}

class GraphicsRenderer {
  constructor() {
    this.themeManager = new ThemeManager();
    this.layoutManager = new LayoutManager();
    this.componentManager = new ComponentManager();
    this.assetResolver = new AssetResolver();
    this.pluginManager = new PluginManager();
  }

  async execute(rawPayload) {
    try {
      const context = new RenderContext(rawPayload);

      // Programmatic Lifecycle Hooks Matrix Execution Loops
      await this.pluginManager.trigger('beforeThemeLoaded', context);
      this.themeManager.apply(context);

      await this.pluginManager.trigger('beforeLayout', context);
      this.layoutManager.apply(context);

      await this.pluginManager.trigger('beforeRender', context);
      this.componentManager.assemble(context);
      this.assetResolver.resolve(context);

      await this.pluginManager.trigger('afterRender', context);
      await this.assetResolver.verifyAllLoaded();

      await this.pluginManager.trigger('beforeExport', context);
      this.finalize();
    } catch (err) {
      this.fail(err);
    }
  }

  finalize() {
    document.documentElement.classList.add('render-engine-ready');
    window.renderEngineStatus = "READY_TO_EXPORT";
  }

  fail(err) {
    document.documentElement.classList.add('render-engine-failed');
    window.renderEngineStatus = `ENGINE_FAILURE: ${err.message}`;
    console.error("Critical Execution Context Aborted:", err);
  }
}

// Engine execution window instantiation bindings
window.CompositorCore = new GraphicsRenderer();

document.addEventListener('DOMContentLoaded', () => {
  if (window.RENDER_DATA) {
    window.CompositorCore.execute(window.RENDER_DATA);
  }
});
