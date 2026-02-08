const wolvesInput = document.getElementById("wolves");
const sheepInput = document.getElementById("sheep");
const speedInput = document.getElementById("speed");
const solveButton = document.getElementById("solve");
const resetButton = document.getElementById("reset");
const leftPopulation = document.getElementById("leftPopulation");
const rightPopulation = document.getElementById("rightPopulation");
const boat = document.getElementById("boat");
const boatSeat = document.getElementById("boatSeat");
const stepList = document.getElementById("stepList");
const statusBox = document.getElementById("status");

let animationTimer = null;
let currentPlan = [];
let isAnimating = false;

const createCharacter = (type) => {
  const character = document.createElement("div");
  character.className = `character ${type}`;
  character.textContent = type === "wolf" ? "W" : "S";
  return character;
};

const renderPopulation = (container, wolves, sheep) => {
  container.innerHTML = "";
  for (let i = 0; i < wolves; i += 1) {
    container.appendChild(createCharacter("wolf"));
  }
  for (let i = 0; i < sheep; i += 1) {
    container.appendChild(createCharacter("sheep"));
  }
};

const updateStatus = (message) => {
  statusBox.textContent = message;
};

const isSafe = (wolves, sheep) => {
  if (sheep === 0) {
    return true;
  }
  return wolves <= sheep;
};

const solveCrossing = (totalWolves, totalSheep) => {
  const start = { w: totalWolves, s: totalSheep, boat: "left" };
  const target = { w: 0, s: 0, boat: "right" };
  const queue = [{ state: start, path: [] }];
  const visited = new Set();

  const encode = (state) => `${state.w},${state.s},${state.boat}`;
  visited.add(encode(start));

  while (queue.length) {
    const { state, path } = queue.shift();
    if (
      state.w === target.w &&
      state.s === target.s &&
      state.boat === target.boat
    ) {
      return path;
    }

    const direction = state.boat === "left" ? -1 : 1;
    const nextBoat = state.boat === "left" ? "right" : "left";

    const moves = [
      { w: 2, s: 0 },
      { w: 0, s: 2 },
      { w: 1, s: 1 },
      { w: 1, s: 0 },
      { w: 0, s: 1 },
    ];

    moves.forEach((move) => {
      const nextW = state.w + direction * move.w;
      const nextS = state.s + direction * move.s;

      if (nextW < 0 || nextS < 0 || nextW > totalWolves || nextS > totalSheep) {
        return;
      }

      const leftW = nextW;
      const leftS = nextS;
      const rightW = totalWolves - nextW;
      const rightS = totalSheep - nextS;

      if (!isSafe(leftW, leftS) || !isSafe(rightW, rightS)) {
        return;
      }

      const nextState = { w: nextW, s: nextS, boat: nextBoat };
      const key = encode(nextState);
      if (visited.has(key)) {
        return;
      }

      visited.add(key);
      queue.push({
        state: nextState,
        path: [
          ...path,
          {
            move,
            boatFrom: state.boat,
            boatTo: nextBoat,
            left: { w: nextW, s: nextS },
          },
        ],
      });
    });
  }

  return null;
};

const resetScene = () => {
  const wolves = Number(wolvesInput.value);
  const sheep = Number(sheepInput.value);
  renderPopulation(leftPopulation, wolves, sheep);
  renderPopulation(rightPopulation, 0, 0);
  boatSeat.innerHTML = "";
  boat.style.transform = "translateX(0)";
  stepList.innerHTML = "";
  updateStatus("Ready to solve.");
};

const describeMove = (move) => {
  const parts = [];
  if (move.w) {
    parts.push(`${move.w} wolf${move.w > 1 ? "ves" : ""}`);
  }
  if (move.s) {
    parts.push(`${move.s} sheep`);
  }
  return parts.join(" & ");
};

const animatePlan = (plan, totalWolves, totalSheep) => {
  let index = 0;
  let leftW = totalWolves;
  let leftS = totalSheep;
  let boatSide = "left";

  const runStep = () => {
    if (index >= plan.length) {
      isAnimating = false;
      updateStatus("All animals have crossed safely! 🎉");
      return;
    }

    const step = plan[index];
    boatSeat.innerHTML = "";

    for (let i = 0; i < step.move.w; i += 1) {
      boatSeat.appendChild(createCharacter("wolf"));
    }
    for (let i = 0; i < step.move.s; i += 1) {
      boatSeat.appendChild(createCharacter("sheep"));
    }

    boatSide = step.boatTo;
    boat.style.transform = boatSide === "right" ? "translateX(140px)" : "translateX(0)";

    leftW = step.left.w;
    leftS = step.left.s;
    renderPopulation(leftPopulation, leftW, leftS);
    renderPopulation(rightPopulation, totalWolves - leftW, totalSheep - leftS);

    updateStatus(`Step ${index + 1}: Move ${describeMove(step.move)} to the ${boatSide} bank.`);
    index += 1;
    animationTimer = setTimeout(runStep, Number(speedInput.value));
  };

  runStep();
};

const buildStepList = (plan) => {
  stepList.innerHTML = "";
  plan.forEach((step, idx) => {
    const li = document.createElement("li");
    li.textContent = `Step ${idx + 1}: ${describeMove(step.move)} cross to the ${
      step.boatTo
    } bank.`;
    stepList.appendChild(li);
  });
};

const stopAnimation = () => {
  if (animationTimer) {
    clearTimeout(animationTimer);
  }
  isAnimating = false;
};

solveButton.addEventListener("click", () => {
  if (isAnimating) {
    return;
  }
  const wolves = Number(wolvesInput.value);
  const sheep = Number(sheepInput.value);

  if (Number.isNaN(wolves) || Number.isNaN(sheep) || wolves < 0 || sheep < 0) {
    updateStatus("Please enter valid non-negative numbers.");
    return;
  }

  if (!isSafe(wolves, sheep)) {
    updateStatus("The starting bank is unsafe. Reduce wolves or add more sheep.");
    return;
  }

  const plan = solveCrossing(wolves, sheep);
  if (!plan) {
    updateStatus("No valid solution found for these numbers.");
    stepList.innerHTML = "";
    return;
  }

  currentPlan = plan;
  buildStepList(plan);
  resetScene();
  updateStatus("Solution found. Animating now...");
  isAnimating = true;
  animatePlan(plan, wolves, sheep);
});

resetButton.addEventListener("click", () => {
  stopAnimation();
  resetScene();
});

resetScene();
