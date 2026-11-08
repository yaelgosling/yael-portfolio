/* =========================================
   Home page: the frames follow the mouse
   Like guillaumetomasi.com: everything drifts slowly away from the mouse,
   and frames further from the middle move more, which gives a feeling of depth.
   ========================================= */
const home = document.querySelector(".home");

// Only with a real mouse, and not for people who asked their computer for less motion
const canMove =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (home && canMove) {
  const STAGE_WIDTH = 1440;    // the "Home New" frame, in Figma pixels
  const STAGE_HEIGHT = 768;
  const MAX_MOVE = 160;        // how far (Figma pixels) a frame at the edge can move
  const EASING = 0.04;         // how quickly frames catch up with the mouse (smaller = smoother)

  // A random number between min and max
  const between = (min, max) => min + Math.random() * (max - min);

  // How much each frame moves: more for frames further from the middle, with a bit of randomness
  const frames = [...home.querySelectorAll(".home__frames .home-frame")].map((element) => {
    const read = (name) => parseFloat(element.style.getPropertyValue(name));
    const middleX = read("--x") + read("--w") / 2;
    const middleY = read("--y") + read("--h") / 2;
    const distanceX = Math.abs(middleX - STAGE_WIDTH / 2) / (STAGE_WIDTH / 2);
    const distanceY = Math.abs(middleY - STAGE_HEIGHT / 2) / (STAGE_HEIGHT / 2);
    return {
      element,
      strengthX: Math.max(0.3, distanceX) * between(0.5, 1.2),
      strengthY: Math.max(0.3, distanceY) * between(0.5, 1.2),
      moveX: 0,
      moveY: 0,
    };
  });

  // Where the mouse is: from -0.5 (left/top) to 0.5 (right/bottom)
  let mouseX = 0;
  let mouseY = 0;
  let isAnimating = false;

  // Every screen refresh, move each frame a small step towards where it should be
  function animate() {
    let stillMoving = false;

    frames.forEach((frame) => {
      const targetX = -mouseX * 2 * MAX_MOVE * frame.strengthX;
      const targetY = -mouseY * 2 * MAX_MOVE * frame.strengthY;
      frame.moveX += (targetX - frame.moveX) * EASING;
      frame.moveY += (targetY - frame.moveY) * EASING;
      frame.element.style.setProperty("--move-x", frame.moveX.toFixed(2));
      frame.element.style.setProperty("--move-y", frame.moveY.toFixed(2));
      if (Math.abs(targetX - frame.moveX) > 0.05 || Math.abs(targetY - frame.moveY) > 0.05) {
        stillMoving = true;
      }
    });

    // Stop when everything has arrived, so the page rests when the mouse is still
    isAnimating = stillMoving;
    if (isAnimating) requestAnimationFrame(animate);
  }

  function startAnimating() {
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(animate);
    }
  }

  window.addEventListener("pointermove", (event) => {
    if (document.body.matches(".is-index-open, .is-hi-open")) return;   // the frames stay still behind the index or the Hi page
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
    startAnimating();
  });

  // When the mouse leaves the window, the frames drift back to their places
  document.documentElement.addEventListener("mouseleave", () => {
    mouseX = 0;
    mouseY = 0;
    startAnimating();
  });
}


/* =========================================
   Home page: clicking a frame opens its project page.
   The project page waits (already loaded) below the screen, slides up over the
   home page while the bar stays where it is, and then the browser opens it.
   ========================================= */
const PAGE_CHANGE_TIME = 900;  // the same as --page-change-time in styles.css

document.querySelectorAll(".home__frames .home-frame--link").forEach((link) => {
  let slide = null;

  // Load the project page below the screen (as soon as the mouse is over the frame)
  function prepareSlide() {
    if (slide) return slide;
    slide = document.createElement("iframe");
    slide.className = "page-slide";
    slide.src = link.href;
    slide.tabIndex = -1;
    slide.setAttribute("aria-hidden", "true");
    slide.ready = new Promise((resolve) => slide.addEventListener("load", resolve, { once: true }));
    document.body.appendChild(slide);
    return slide;
  }

  link.addEventListener("pointerenter", prepareSlide);
  link.addEventListener("focus", prepareSlide);

  link.addEventListener("click", async (event) => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || event.metaKey || event.ctrlKey) return;   // open normally

    event.preventDefault();
    const page = prepareSlide();
    await page.ready;
    page.classList.add("is-sliding");
    home.classList.add("is-leaving");     // the bar moves up to its spot on the project page
    setTimeout(() => {
      sessionStorage.setItem("page-slid-in", "yes");   // the project page doesn't need to slide again
      window.location.href = link.href;
    }, PAGE_CHANGE_TIME);
  });
});

// Coming back with the browser's back button: put the waiting page away again
window.addEventListener("pageshow", () => {
  document.querySelectorAll(".page-slide").forEach((page) => page.classList.remove("is-sliding"));
  if (home) home.classList.remove("is-leaving");
});


/* =========================================
   Project page: the page slides up when it opens (unless it already slid up over the
   home page). Inside the waiting copy on the home page, nothing moves and the bar is hidden.
   ========================================= */
if (document.body.classList.contains("project-page")) {
  if (window.frameElement) {
    document.documentElement.classList.add("is-preview");
  } else if (sessionStorage.getItem("page-slid-in")) {
    sessionStorage.removeItem("page-slid-in");
  } else {
    document.body.classList.add("is-sliding-in");
  }
}


/* =========================================
   Home and project pages: the mouse dot is always the same size as one dot of the four
   circles index button (5 Figma pixels), which grows and shrinks with the window
   ========================================= */
if (document.body.matches(".home-page, .project-page")) {
  function sizeCursorDot() {
    const figmaPixel = Math.min(window.innerWidth / 1440, window.innerHeight / 800);
    const size = Math.max(5, Math.round(5 * figmaPixel));
    const middle = size / 2;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${middle}' cy='${middle}' r='${middle}' fill='black'/></svg>`;
    const cursor = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${Math.floor(middle)} ${Math.floor(middle)}, auto`;
    document.documentElement.style.setProperty("--cursor-dot", cursor);
  }
  window.addEventListener("resize", sizeCursorDot);
  sizeCursorDot();
}


/* =========================================
   Project page: click the animation to play or pause it
   ========================================= */
document.querySelectorAll(".project-video").forEach((video) => {
  video.addEventListener("click", () => {
    if (video.paused) video.play();
    else video.pause();
  });

  // Hide the play symbol while the video plays, show it again when it stops
  video.addEventListener("play", () => video.classList.add("is-playing"));
  video.addEventListener("pause", () => video.classList.remove("is-playing"));
  video.addEventListener("ended", () => video.classList.remove("is-playing"));
});


/* =========================================
   The index: clicking INDEX opens the list and blurs everything else.
   Clicking on the blur (or pressing Escape) closes it.
   ========================================= */
const indexButton = document.querySelector(".site-bar__index");

if (indexButton) {
  const blur = document.createElement("div");
  blur.className = "site-index-blur";
  document.body.appendChild(blur);

  function setIndexOpen(open) {
    if (open) {                                         // close the Hi page first
      document.body.classList.remove("is-hi-open");
      document.documentElement.classList.remove("is-hi-open-page");
    }
    document.body.classList.toggle("is-index-open", open);
    document.documentElement.classList.toggle("is-index-open-page", open);   // the page can't scroll
    indexButton.setAttribute("aria-expanded", open);
  }

  indexButton.addEventListener("click", () => {
    setIndexOpen(!document.body.classList.contains("is-index-open"));
  });
  blur.addEventListener("click", () => setIndexOpen(false));

  // The two buttons in the band switch between the list and the photos
  const panel = document.querySelector(".site-index");
  panel.querySelectorAll(".site-index__view").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.classList.contains("site-index__view--photos") ? "photos" : "list";
      panel.dataset.view = view;
      panel.querySelectorAll(".site-index__view").forEach((other) => {
        const chosen = other === button;
        other.classList.toggle("is-active", chosen);
        other.setAttribute("aria-pressed", chosen);
      });
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setIndexOpen(false);
  });
}


/* =========================================
   The Hi page: clicking HI slides it up from the bottom, clicking HI again
   (or pressing Escape) slides it back down
   ========================================= */
const hiButton = document.querySelector(".site-bar__hi");
const hiPage = document.querySelector(".hi-page");

if (hiButton && hiPage) {
  function setHiOpen(open) {
    if (open) document.body.classList.remove("is-index-open");   // close the index first
    document.body.classList.toggle("is-hi-open", open);
    document.documentElement.classList.toggle("is-hi-open-page", open);
    document.documentElement.classList.toggle("is-index-open-page", false);
    hiButton.setAttribute("aria-expanded", open);
    hiPage.setAttribute("aria-hidden", !open);
  }

  hiButton.addEventListener("click", () => {
    setHiOpen(!document.body.classList.contains("is-hi-open"));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setHiOpen(false);
  });

  // "Email me" is a link: a click opens a new email straight away and also copies the address.
  // "Let's talk": a click copies the number.
  async function copy(reveal) {
    reveal.classList.add("is-showing");
    const value = reveal.querySelector(".hi-page__reveal-value").textContent;
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      // Copying isn't allowed here: it can still be selected and copied by hand
    }
  }

  hiPage.querySelectorAll(".hi-page__reveal").forEach((reveal) => {
    reveal.addEventListener("click", () => copy(reveal));
    reveal.addEventListener("mouseleave", () => reveal.classList.remove("is-showing"));
  });
}


/* =========================================
   Process page: click a date tab to open or close its card
   ========================================= */
document.querySelectorAll(".card__tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const card = tab.closest(".card");
    const isOpen = card.classList.toggle("is-open");
    tab.setAttribute("aria-expanded", isOpen);
    card.querySelector(".card__content").hidden = !isOpen;
  });
});
