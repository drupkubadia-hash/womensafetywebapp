// public/convao-tools.js
// ElevenLabs convai widget loader — safe to load multiple times (guarded)

/* eslint-disable no-unused-vars */
(function () {
  // Guard: if already loaded, skip re-initialization
  if (window.__CONVAI_WIDGET_LOADED__) {
    console.debug("[convao-tools] already loaded — skipping.");
    return;
  }
  window.__CONVAI_WIDGET_LOADED__ = true;

  // Default values (fallbacks)
  const DEFAULT_AGENT_ID = 'agent_9201kpfjz7hvfyastdwv6mx3r4bj';
  
  const DEFAULT_OPEN_IN_NEW_TAB = true;
  const DEFAULT_WIDGET_POSITION = 'bottom-right';
  const DEFAULT_BASE_URL = '';

  // Read runtime config if provided (set window.CONVAI_CONFIG before loading the script)
  const runtimeConfig = window.CONVAI_CONFIG || {};
  const AGENT_ID = runtimeConfig.agentId || DEFAULT_AGENT_ID;
  const OPEN_IN_NEW_TAB = typeof runtimeConfig.openInNewTab === 'boolean' ? runtimeConfig.openInNewTab : DEFAULT_OPEN_IN_NEW_TAB;
  const WIDGET_POSITION = runtimeConfig.widgetPosition || DEFAULT_WIDGET_POSITION;
  const BASE_URL = runtimeConfig.baseUrl || DEFAULT_BASE_URL;

  // ID used for the injected custom element wrapper
  const ID = 'elevenlabs-convai-widget';

  // If wrapper already present in the DOM, bail out
  if (document.getElementById(ID)) {
    console.debug("[convao-tools] element with id already exists — skipping append.");
    return;
  }

  // Load the convai embed script only if it hasn't been loaded by the page yet.
  // We don't check for the unpkg global itself because that dependency is a custom element and may not export a stable global var.
  (function loadEmbedScriptIfNeeded() {
    // Check if the script tag is already present
    const existing = Array.from(document.getElementsByTagName('script')).find((s) =>
      s.src && s.src.includes('@elevenlabs/convai-widget-embed')
    );
    if (existing) {
      console.debug("[convao-tools] embed script already present.");
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    script.onload = function () {
      console.debug("[convao-tools] embed script loaded.");
    };
    script.onerror = function (e) {
      console.error("[convao-tools] failed to load embed script", e);
    };
    document.head.appendChild(script);
  })();

  // Create wrapper and widget element
  try {
    const wrapper = document.createElement('div');
    wrapper.className = `convai-widget ${WIDGET_POSITION || DEFAULT_WIDGET_POSITION}`;
    wrapper.style.zIndex = 9999;

    const widget = document.createElement('elevenlabs-convai');
    widget.id = ID;
    widget.setAttribute('agent-id', AGENT_ID);
    widget.setAttribute('variant', 'full');

    // When the widget dispatches a call event, attach clientTools config
    widget.addEventListener('elevenlabs-convai:call', (event) => {
      try {
        // Ensure event.detail and config exist
        if (!event || !event.detail) return;
        const cfg = event.detail.config || {};

        cfg.clientTools = {
          redirectToExternalURL: ({ url }) => {
            try {
              // Build full URL - handle relative and absolute paths
              let fullUrl = url || '';
              if (!fullUrl.startsWith('http')) {
                const base = BASE_URL || (window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, ''));
                fullUrl = `${base}${url && url.startsWith('/') ? '' : '/'}${url}`;
              }

              if (OPEN_IN_NEW_TAB) {
                window.open(fullUrl, '_blank', 'noopener,noreferrer');
              } else {
                window.location.href = fullUrl;
              }
            } catch (err) {
              console.error('[convao-tools] redirectToExternalURL error', err);
            }
          },
        };

        // Reassign config back if widget expects mutated object
        event.detail.config = cfg;
      } catch (err) {
        console.warn('[convao-tools] error handling elevenlabs-convai:call event', err);
      }
    });

    // Attach and append
    wrapper.appendChild(widget);
    document.body.appendChild(wrapper);

    // Helpful debug log
    console.debug("[convao-tools] widget injected with agent:", AGENT_ID);
  } catch (err) {
    console.error("[convao-tools] failed to inject widget", err);
  }

  // OPTIONAL: expose some helper events/functions for programmatic control
  // (these are no-ops unless you modify the embed to listen for them)
  window.convaiTools = window.convaiTools || {};
  window.convaiTools.agentId = AGENT_ID;
  window.convaiTools.start = function () {
    try {
      window.dispatchEvent(new CustomEvent('convai:start-call'));
    } catch (e) {}
  };
  window.convaiTools.end = function () {
    try {
      window.dispatchEvent(new CustomEvent('convai:end-call'));
    } catch (e) {}
  };

  // finished initialization
})();
