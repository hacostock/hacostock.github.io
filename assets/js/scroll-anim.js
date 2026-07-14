// HacoStock — Framer-style scroll reveals (progressive enhancement).
// Adds data-anim to content blocks and toggles .in-view as they enter the
// viewport, with a small stagger inside each group. No-JS pages render
// normally because the hidden state is only applied via [data-anim].
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  var GROUPS = [
    ".section-head",
    ".concept-copy",
    ".steps .step",
    ".scenario-list .scenario",
    ".feature-grid .feature",
    ".plan-grid .plan",
    ".faq-list .faq-item",
    ".cta-bottom .section-title",
    ".cta-bottom .section-lead",
    ".cta-bottom .cta-group",
  ];

  function reveal(node) {
    node.classList.add("in-view");
    observer.unobserve(node);
    // Once the reveal transition is done, hand the element back to its own
    // hover transitions (theme cards re-declare `transition`).
    var delay = parseInt(node.style.getPropertyValue("--anim-delay"), 10) || 0;
    setTimeout(function () {
      node.removeAttribute("data-anim");
      node.classList.remove("in-view");
      node.style.removeProperty("--anim-delay");
    }, delay + 950);
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        // Also reveal anything already scrolled past (fast scrolling can jump
        // over the intersection window and would leave content invisible).
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          reveal(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );

  GROUPS.forEach(function (selector) {
    var nodes = document.querySelectorAll(selector);
    nodes.forEach(function (node, i) {
      // Don't re-animate the hero (it has its own load-in reveal).
      if (node.closest(".hero")) return;
      node.setAttribute("data-anim", "");
      node.style.setProperty("--anim-delay", Math.min(i, 5) * 90 + "ms");
      observer.observe(node);
    });
  });
})();
