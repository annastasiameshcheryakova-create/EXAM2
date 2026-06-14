const GraphData = {
  nodes: [
    { id: 1, name: "Central", features: [1, 0.8, 0.2] },
    { id: 2, name: "Park", features: [0.6, 0.2, 0.1] },
    { id: 3, name: "University", features: [0.9, 0.5, 0.7] },
    { id: 4, name: "Station A", features: [0.3, 0.1, 0.4] },
    { id: 5, name: "Station B", features: [0.4, 0.6, 0.2] }
  ],

  edges: [
    [1, 2],
    [1, 3],
    [2, 4],
    [3, 4],
    [4, 5]
  ]
};
