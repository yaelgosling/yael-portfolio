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
  const frames = [...home.querySelectorAll(".home-frame")].map((element) => {
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

document.querySelectorAll(".home-frame--link").forEach((link) => {
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
