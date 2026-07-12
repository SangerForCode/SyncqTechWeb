// Define route paths mapping perfectly to our complex grid
// E (Entrance) = 500, 630
const routes = {
  "main-stage": {
    path: "M 500 630 L 500 280",
    color: "#eab308",
  },
  "food-zone": {
    path: "M 500 630 L 500 455",
    color: "#d97757",
  },
  refreshment: {
    path: "M 500 630 L 500 500 L 730 500",
    color: "#fbbf24",
  },
  workshops: {
    path: "M 500 630 L 500 440 L 270 440",
    color: "#60a5fa",
  },
  restrooms: {
    path: "M 500 630 L 500 380 L 730 380",
    color: "#86efac",
  },
};

let currentDestination = null;

function navigate(destinationId) {
  if (currentDestination === destinationId) return;
  currentDestination = destinationId;

  const routeData = routes[destinationId];

  // 1. Update Map UI Elements (Dim others, highlight active)
  document.querySelectorAll(".zone-card").forEach((el) => {
    el.classList.remove("active");
    el.style.borderColor = "#475569";
    el.style.opacity = "0.5";
  });

  const activeZone = document.getElementById("zone-" + destinationId);
  if (activeZone) {
    activeZone.classList.add("active");
    activeZone.style.borderColor = routeData.color;
    activeZone.style.opacity = "1";
  }

  // 2. Update Menu UI Elements
  document.querySelectorAll(".menu-item").forEach((el) => {
    el.classList.remove("active");
    el.style.borderColor = "transparent";
    const btn = el.querySelector("button");
    btn.innerText = "Route";
    btn.classList.replace("bg-green-600", "bg-[#0f172a]");
    btn.classList.replace("text-white", "text-slate-300");
    btn.classList.replace("border-green-500", "border-slate-600");
  });

  const activeMenu = document.getElementById("menu-" + destinationId);
  if (activeMenu) {
    activeMenu.classList.add("active");
    activeMenu.style.borderColor = routeData.color;
    const btn = activeMenu.querySelector("button");
    btn.innerText = "Routing...";
    btn.classList.replace("bg-[#0f172a]", "bg-green-600");
    btn.classList.replace("text-slate-300", "text-white");
    btn.classList.replace("border-slate-600", "border-green-500");
  }

  // 3. Update SVG Path and Animation
  const routePathElement = document.getElementById("active-route");
  const dotAnim1 = document.getElementById("dot-motion");
  const navDotGroup = document.getElementById("nav-dot");

  // Set colors and paths
  routePathElement.setAttribute("d", routeData.path);
  routePathElement.setAttribute("stroke", routeData.color);

  dotAnim1.setAttribute("path", routeData.path);

  // Set dot colors to match destination
  const dots = navDotGroup.querySelectorAll("circle");
  dots[0].setAttribute("fill", routeData.color);

  // Show elements
  routePathElement.style.opacity = "1";
  navDotGroup.style.display = "block";

  // Restart Animation
  dotAnim1.beginElement();
}
