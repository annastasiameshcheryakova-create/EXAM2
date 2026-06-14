class Graph {
  constructor(data) {
    this.nodes = data.nodes;
    this.edges = data.edges;
  }

  getNeighbors(id) {
    return this.edges
      .filter(e => e[0] === id || e[1] === id)
      .map(e => (e[0] === id ? e[1] : e[0]));
  }

  // 🔵 BFS shortest path
  shortestPath(start, end) {
    let queue = [[start]];
    let visited = new Set();

    while (queue.length) {
      let path = queue.shift();
      let node = path[path.length - 1];

      if (node === end) return path;

      if (!visited.has(node)) {
        visited.add(node);

        for (let n of this.getNeighbors(node)) {
          queue.push([...path, n]);
        }
      }
    }

    return [];
  }

  // 🔴 centrality (простий варіант)
  centrality() {
    return this.nodes.map(n => ({
      id: n.id,
      score: this.getNeighbors(n.id).length
    })).sort((a, b) => b.score - a.score);
  }

  // 🟢 COMMUNITY (дуже простий кластер)
  clusters() {
    let visited = new Set();
    let clusters = [];

    const dfs = (node, cluster) => {
      visited.add(node);
      cluster.push(node);

      for (let n of this.getNeighbors(node)) {
        if (!visited.has(n)) dfs(n, cluster);
      }
    };

    for (let n of this.nodes) {
      if (!visited.has(n.id)) {
        let cluster = [];
        dfs(n.id, cluster);
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  // 🤖 SIMPLE GNN (імітація)
  // (реально спрощений message passing)
  predictLoad() {
    return this.nodes.map(n => {
      let neigh = this.getNeighbors(n.id);

      let avg = neigh.reduce((sum, id) => {
        let node = this.nodes.find(x => x.id === id);
        return sum + node.features[0];
      }, 0) / (neigh.length || 1);

      return {
        id: n.id,
        load: (n.features[0] * 0.6 + avg * 0.4).toFixed(2)
      };
    });
  }
}

const graph = new Graph(GraphData);
