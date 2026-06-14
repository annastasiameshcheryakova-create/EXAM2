const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // edges
  ctx.strokeStyle = "#888";
  graph.edges.forEach(e => {
    let a = graph.nodes.find(n => n.id === e[0]);
    let b = graph.nodes.find(n => n.id === e[1]);

    ctx.beginPath();
    ctx.moveTo(a.id * 100, a.id * 80);
    ctx.lineTo(b.id * 100, b.id * 80);
    ctx.stroke();
  });

  // nodes
  graph.nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.id * 100, n.id * 80, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#00aaff";
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.fillText(n.name, n.id * 100 - 20, n.id * 80 - 25);
  });
}

draw();

// UI actions
const GraphUI = {

  findPath() {
    let path = graph.shortestPath(1, 5);

    document.getElementById("info").innerHTML =
      "Shortest path: " + path.join(" → ");
  },

  showCentral() {
    let c = graph.centrality();

    document.getElementById("info").innerHTML =
      "Central nodes: " + JSON.stringify(c);
  },

  simulateLoad() {
    let res = graph.predictLoad();

    document.getElementById("info").innerHTML =
      "GNN load prediction: " + JSON.stringify(res);
  }
};

// click interaction
canvas.addEventListener("click", (e) => {
  let x = e.clientX;
  let y = e.clientY;

  graph.nodes.forEach(n => {
    let nx = n.id * 100;
    let ny = n.id * 80;

    let dist = Math.hypot(x - nx, y - ny);

    if (dist < 25) {
      document.getElementById("info").innerHTML =
        "Station: " + n.name;
    }
  });
});
