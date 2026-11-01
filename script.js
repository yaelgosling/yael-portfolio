/* =========================================
   Home page: pull the wall of frames around
   ========================================= */
const comingSoon = document.querySelector(".coming-soon");

if (comingSoon) {
  const wall = comingSoon.querySelector(".coming-soon__wall");

  // The wall's size and how far it reaches past the Figma frame's corner (Figma pixels)
  const WALL_WIDTH = 2007.702;
  const WALL_HEIGHT = 1477;
  const WALL_LEFT = 276;
  const WALL_TOP = 179;

  // How far the mouse must move before a press counts as pulling and not as a click
  const DRAG_START_DISTANCE = 5;

  let panX = 0;
  let panY = 0;
  let press = null;            // where the current press started
  let hasDragged = false;

  // Size of one Figma pixel on this screen
  function figmaPixel() {
    return wall.offsetWidth / WALL_WIDTH;
  }

  // Move the wall, but never so far that its edge comes into the window
  function moveWall(x, y) {
    const windowWidth = comingSoon.clientWidth / figmaPixel();
    const windowHeight = comingSoon.clientHeight / figmaPixel();
    panX = Math.min(WALL_LEFT, Math.max(windowWidth + WALL_LEFT - WALL_WIDTH, x));
    panY = Math.min(WALL_TOP, Math.max(windowHeight + WALL_TOP - WALL_HEIGHT, y));
    wall.style.setProperty("--pan-x", panX);
    wall.style.setProperty("--pan-y", panY);
  }

  comingSoon.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    press = { mouseX: event.clientX, mouseY: event.clientY, panX, panY };
    hasDragged = false;
  });

  comingSoon.addEventListener("pointermove", (event) => {
    if (!press) return;
    const movedX = event.clientX - press.mouseX;
    const movedY = event.clientY - press.mouseY;

    if (!hasDragged) {
      if (Math.hypot(movedX, movedY) < DRAG_START_DISTANCE) return;
      hasDragged = true;
      comingSoon.setPointerCapture(event.pointerId);
      comingSoon.classList.add("is-dragging");
    }

    moveWall(press.panX + movedX / figmaPixel(), press.panY + movedY / figmaPixel());
  });

  function endPress() {
    press = null;
    comingSoon.classList.remove("is-dragging");
  }
  comingSoon.addEventListener("pointerup", endPress);
  comingSoon.addEventListener("pointercancel", endPress);

  // After pulling, letting go must not open the Process link
  comingSoon.addEventListener("click", (event) => {
    if (hasDragged) event.preventDefault();
  }, true);

  // Stop the browser from dragging the link or image as a file
  comingSoon.addEventListener("dragstart", (event) => event.preventDefault());

  // Scrolling with a trackpad or wheel also moves the wall
  comingSoon.addEventListener("wheel", (event) => {
    event.preventDefault();
    moveWall(panX - event.deltaX / figmaPixel(), panY - event.deltaY / figmaPixel());
  }, { passive: false });

  // Keep the wall inside its limits when the page opens and when the window changes size
  moveWall(panX, panY);
  window.addEventListener("resize", () => moveWall(panX, panY));
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
