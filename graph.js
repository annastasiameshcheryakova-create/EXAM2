class GraphProcessor {
    constructor(data) {
        this.data = data;
    }

    // --- КЛАСИЧНІ АЛГОРИТМИ ПОШУКУ МАРШРУТУ ---

    // 1. Алгоритм Дейкстри (Dijkstra)
    dijkstra(startId, endId) {
        const start = performance.now();
        const distances = {};
        const prev = {};
        const queue = [];

        this.data.nodes.forEach(node => {
            if (!node.disabled) {
                distances[node.id] = Infinity;
                prev[node.id] = null;
                queue.push(node.id);
            }
        });
        distances[startId] = 0;

        while (queue.length > 0) {
            queue.sort((a, b) => distances[a] - distances[b]);
            const u = queue.shift();

            if (u === endId) break;
            if (distances[u] === Infinity) break;

            const neighbors = this.getNeighbors(u);
            for (let v in neighbors) {
                if (!queue.includes(v)) continue;
                const alt = distances[u] + neighbors[v];
                if (alt < distances[v]) {
                    distances[v] = alt;
                    prev[v] = u;
                }
            }
        }

        const path = this.reconstructPath(prev, endId);
        const end = performance.now();
        document.getElementById('time-dijkstra').innerText = (end - start).toFixed(2);
        return path;
    }

    // 2. Алгоритм A* (Евристичний пошук)
    aStar(startId, endId) {
        const start = performance.now();
        const endNode = this.data.nodes.find(n => n.id === endId);
        
        // Евристика: Евклідова відстань у 3D просторі
        const heuristic = (nodeId) => {
            const n = this.data.nodes.find(nd => nd.id === nodeId);
            return Math.sqrt(Math.pow(n.x - endNode.x, 2) + Math.pow(n.z - endNode.z, 2));
        };

        const gScore = {}, fScore = {}, prev = {};
        const openSet = [startId];

        this.data.nodes.forEach(n => {
            if (!n.disabled) {
                gScore[n.id] = Infinity;
                fScore[n.id] = Infinity;
            }
        });
        gScore[startId] = 0;
        fScore[startId] = heuristic(startId);

        while (openSet.length > 0) {
            openSet.sort((a, b) => fScore[a] - fScore[b]);
            const current = openSet.shift();

            if (current === endId) break;

            const neighbors = this.getNeighbors(current);
            for (let neighbor in neighbors) {
                const tentativeGScore = gScore[current] + neighbors[neighbor];
                if (tentativeGScore < (gScore[neighbor] || Infinity)) {
                    prev[neighbor] = current;
                    gScore[neighbor] = tentativeGScore;
                    fScore[neighbor] = gScore[neighbor] + heuristic(neighbor);
                    if (!openSet.includes(neighbor)) openSet.push(neighbor);
                }
            }
        }

        const path = this.reconstructPath(prev, endId);
        const end = performance.now();
        document.getElementById('time-astar').innerText = (end - start).toFixed(2);
        return path;
    }

    // 3. Пошук у ширину (BFS)
    bfs(startId, endId) {
        const start = performance.now();
        const queue = [startId];
        const visited = { [startId]: true };
        const prev = {};

        while (queue.length > 0) {
            const current = queue.shift();
            if (current === endId) break;

            const neighbors = Object.keys(this.getNeighbors(current));
            for (let neighbor of neighbors) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    prev[neighbor] = current;
                    queue.push(neighbor);
                }
            }
        }

        const path = this.reconstructPath(prev, endId);
        const end = performance.now();
        document.getElementById('time-bfs').innerText = (end - start).toFixed(2);
        return path;
    }

    // --- СЛУЖБОВІ МЕТОДИ ГРАФА ---

    getNeighbors(nodeId) {
        const neighbors = {};
        const activeNode = this.data.nodes.find(n => n.id === nodeId);
        if (activeNode && activeNode.disabled) return neighbors;

        this.data.edges.forEach(edge => {
            const srcD = this.data.nodes.find(n => n.id === edge.source).disabled;
            const trgD = this.data.nodes.find(n => n.id === edge.target).disabled;
            if (srcD || trgD) return;

            if (edge.source === nodeId) neighbors[edge.target] = edge.weight;
            if (edge.target === nodeId) neighbors[edge.source] = edge.weight;
        });
        return neighbors;
    }

    reconstructPath(prev, endId) {
        const path = [];
        let curr = endId;
        while (curr !== null && curr !== undefined) {
            path.unshift(curr);
            curr = prev[curr];
        }
        return path.length > 1 ? path : [];
    }

    // --- СТАТИСТИКА ТА МЕТРИКИ МЕРЕЖІ ---

    calculateMetrics() {
        const activeNodes = this.data.nodes.filter(n => !n.disabled);
        const activeEdges = this.data.edges.filter(e => 
            !this.data.nodes.find(n => n.id === e.source).disabled &&
            !this.data.nodes.find(n => n.id === e.target).disabled
        );

        const N = activeNodes.length;
        const E = activeEdges.length;
        
        // Щільність графа
        const density = N > 1 ? (2 * E) / (N * (N - 1)) : 0;

        // Наближений розрахунок Діаметра графа (максимальний найкоротший шлях)
        let maxPath = 0;
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const d = this.dijkstra(activeNodes[i].id, activeNodes[j].id).length;
                if (d > maxPath) maxPath = d;
            }
        }

        document.getElementById('stat-nodes').innerText = N;
        document.getElementById('stat-edges').innerText = E;
        document.getElementById('stat-density').innerText = density.toFixed(2);
        document.getElementById('stat-diameter').innerText = maxPath > 0 ? maxPath - 1 : 0;
    }

    // Ступінь центральності (Degree Centrality)
    getCentrality(nodeId) {
        return Object.keys(this.getNeighbors(nodeId)).length;
    }

    // Пошук кластерів / спільнот (Проста евристика за зв'язністю)
    detectCommunities() {
        const visited = {};
        let communityCount = 0;

        this.data.nodes.forEach(node => {
            if (!node.disabled && !visited[node.id]) {
                communityCount++;
                const queue = [node.id];
                while(queue.length > 0) {
                    const curr = queue.shift();
                    if (!visited[curr]) {
                        visited[curr] = true;
                        Object.keys(this.getNeighbors(curr)).forEach(nb => {
                            if (!visited[nb]) queue.push(nb);
                        });
                    }
                }
            }
        });
        return communityCount;
    }

    // --- РЕАЛІЗАЦІЯ GNN НА TENSORFLOW.JS ---

    async runGNNInference(timeMode) {
        const factor = timeFactors[timeMode];
        const nodes = this.data.nodes.filter(n => !n.disabled);
        const numNodes = nodes.length;
        if (numNodes === 0) return [];

        // Створення матриці суміжності A
        const adjMatrix = Array(numNodes).fill(0).map(() => Array(numNodes).fill(0));
        const nodeIndexMap = {};
        nodes.forEach((n, i) => nodeIndexMap[n.id] = i);

        this.data.edges.forEach(edge => {
            const sIdx = nodeIndexMap[edge.source];
            const tIdx = nodeIndexMap[edge.target];
            if (sIdx !== undefined && tIdx !== undefined) {
                adjMatrix[sIdx][tIdx] = 1;
                adjMatrix[tIdx][sIdx] = 1; // Неорієнтований граф
            }
        });

        // Створення матриці ознак X [Пасажиропотік, Кількість Пересадок, Центральність]
        const featureMatrix = nodes.map(n => [
            n.baseFlow * factor,
            n.transfers,
            this.getCentrality(n.id)
        ]);

        // Математичний рушій шару GNN через TF.js tensor
        return tf.tidy(() => {
            const A = tf.tensor2d(adjMatrix);
            const X = tf.tensor2d(featureMatrix);

            // Спрощена вага нейромережі W для визначення перевантаження (імітація навченого шару GCN)
            const W = tf.tensor2d([
                [0.012, 0.005],  // Вплив потоку
                [0.15,  0.08],   // Вплив пересадок
                [0.22,  0.12]    // Вплив структури графа
            ]);

            // Нормалізація матриці суміжності (додаємо self-loops: I + A)
            const I = tf.eye(numNodes);
            const A_hat = A.add(I);
            
            // Прохід шару графової мережі: Message Passing (A_hat x X) та агрегація ознак сусідів
            const messagePassing = tf.matMul(A_hat, X);
            
            // Лінійне перетворення вагами W
            const denseOutput = tf.matMul(messagePassing, W);
            
            // Активація Sigmoid для отримання ймовірності перевантаження вузла
            const prediction = tf.sigmoid(denseOutput);
            
            // Перетворення вихідного тензора в JavaScript масив
            const outputData = prediction.arraySync();
            
            return nodes.map((n, idx) => ({
                id: n.id,
                overloadProb: outputData[idx][0], // Ймовірність збою
                linkDemand: outputData[idx][1]   // Потенціал для нових зв'язків
            }));
        });
    }
}
