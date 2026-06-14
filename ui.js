let scene, camera, renderer, controls;
let graphProcessor;
let currentTimeMode = 'morning';
let activePath = [];
let nodeObjects = {};
let edgeObjects = [];
let trainMarkers = [];

// Ініціалізація графічного середовища
function init() {
    const container = document.getElementById('ar-container');
    
    scene = new THREE.Scene();
    // Футуристичний колір неба для десктопного прев'ю
    scene.background = new THREE.Color(0x0a0a14); 

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 8, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Додаємо світло
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 15, 5);
    scene.add(directionalLight);

    // Налаштування десктопного керування (мишкою)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Ініціалізація логіки графа
    graphProcessor = new GraphProcessor(metroData);

    // Спроба активації WebXR (AR-режим)
    if ('xr' in navigator) {
        navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
            if (supported) {
                // Якщо браузер підтримує реальну AR, налаштовуємо WebXR контекст
                renderer.xr.enabled = true;
                setupARButton();
            }
        });
    }

    // Побудова початкової 3D сцени
    rebuild3DGraph();
    populateDropdowns();
    updateAIAnalytics();

    // Запуск головного циклу рендерингу
    window.addEventListener('resize', onWindowResize);
    setupRaycaster();
    animate();
}

// Функція перемальовування 3D елементів
async function rebuild3DGraph() {
    // Очищення старих об'єктів
    Object.values(nodeObjects).forEach(obj => scene.remove(obj));
    edgeObjects.forEach(obj => scene.remove(obj));
    trainMarkers.forEach(t => scene.remove(t.mesh));
    nodeObjects = {};
    edgeObjects = [];
    trainMarkers = [];

    // Отримання AI прогнозу навантаження від GNN
    const gnnPredictions = await graphProcessor.runGNNInference(currentTimeMode);

    // Малюємо Станції (Вершини)
    metroData.nodes.forEach(node => {
        if (node.disabled) return;

        const pred = gnnPredictions.find(p => p.id === node.id) || { overloadProb: 0.1 };
        
        // Теплова карта за кольорами на основі виходу GNN
        let color = 0x00ff00; // Низьке навантаження (Зелений)
        if (pred.overloadProb > 0.4 && pred.overloadProb <= 0.7) color = 0xffff00; // Середнє (Жовтий)
        if (pred.overloadProb > 0.7) color = 0xff0055; // Високе (Червоний/Рожевий)

        // Якщо станція входить в обраний маршрут, додаємо неонове підсвічування
        if (activePath.includes(node.id)) color = 0x00f3ff; 

        const geometry = new THREE.SphereGeometry(0.35, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: color, 
            roughness: 0.2, 
            metalness: 0.5,
            emissive: color,
            emissiveIntensity: activePath.includes(node.id) ? 0.8 : 0.2
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(node.x, node.y, node.z);
        sphere.userData = { id: node.id, name: node.name, rawData: node, prediction: pred };

        scene.add(sphere);
        nodeObjects[node.id] = sphere;
    });

    // Малюємо Колії (Ребра)
    metroData.edges.forEach(edge => {
        const srcNode = metroData.nodes.find(n => n.id === edge.source);
        const trgNode = metroData.nodes.find(n => n.id === edge.target);

        if (srcNode.disabled || trgNode.disabled) return;

        // Визначаємо, чи є колія частиною активного маршруту
        let isPathEdge = false;
        for (let i = 0; i < activePath.length - 1; i++) {
            if ((activePath[i] === edge.source && activePath[i+1] === edge.target) ||
                (activePath[i] === edge.target && activePath[i+1] === edge.source)) {
                isPathEdge = true;
                break;
            }
        }

        const startPt = new THREE.Vector3(srcNode.x, srcNode.y, srcNode.z);
        const endPt = new THREE.Vector3(trgNode.x, trgNode.y, trgNode.z);
        
        const distance = startPt.distanceTo(endPt);
        const geometry = new THREE.CylinderGeometry(0.06, 0.06, distance, 8);
        
        const edgeColor = isPathEdge ? 0x00f3ff : 0x555577;
        const material = new THREE.MeshStandardMaterial({ 
            color: edgeColor,
            emissive: edgeColor,
            emissiveIntensity: isPathEdge ? 1.0 : 0.0
        });

        const cylinder = new THREE.Mesh(geometry, material);
        
        // Позиціонування та орієнтація циліндра вздовж ребра
        cylinder.position.copy(startPt).add(endPt).multiplyScalar(0.5);
        cylinder.lookAt(endPt);
        cylinder.rotateX(Math.PI / 2);

        scene.add(cylinder);
        edgeObjects.push(cylinder);

        // Створюємо 3D маркери поїздів, що рухаються коліями
        createTrainMarker(startPt, endPt);
    });

    graphProcessor.calculateMetrics();
}

// Анімація руху маленьких 3D поїздів
function createTrainMarker(start, end) {
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.25);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    trainMarkers.push({ mesh, start, end, progress: Math.random() });
}

// Головний цикл розрахунку кадрів
function animate() {
    if (renderer.xr.isPresenting) {
        // Логіка для AR сесії
    } else {
        controls.update();
    }

    // Рух поїздів за ребрами
    trainMarkers.forEach(train => {
        train.progress += 0.004;
        if (train.progress > 1) train.progress = 0;
        train.mesh.position.lerpVectors(train.start, train.end, train.progress);
        train.mesh.lookAt(train.end);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Кліки по 3D станціях (Raycasting)
function setupRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
        // Перевірка, щоб клік не припадав на UI інтерфейс
        if (event.target.closest('.ui-panel') || event.target.closest('.popup')) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(Object.values(nodeObjects));

        if (intersects.length > 0) {
            const clickedNode = intersects[0].object.userData;
            showPopup(clickedNode);
        }
    });
}

// Керування інформаційним вікном
function showPopup(nodeData) {
    const popup = document.getElementById('node-info-popup');
    document.getElementById('popup-title').innerText = nodeData.name;
    
    const currentFlow = (nodeData.rawData.baseFlow * timeFactors[currentTimeMode]).toFixed(1);
    document.getElementById('popup-flow').innerText = currentFlow;
    document.getElementById('popup-transfers').innerText = nodeData.rawData.transfers;
    
    const statusText = nodeData.prediction.overloadProb > 0.7 ? "🚨 ПЕРЕВАНТАЖЕННЯ" : "🟢 СТАБІЛЬНО";
    document.getElementById('popup-status').innerText = statusText;
    
    popup.classList.remove('hidden');
}

function closePopup() {
    document.getElementById('node-info-popup').add('hidden');
}

// Оновлення AI аналітики
async function updateAIAnalytics() {
    const predictions = await graphProcessor.runGNNInference(currentTimeMode);
    const aiBox = document.getElementById('ai-recommendations');
    
    let report = `🤖 <b>Аналіз GNN завершено для часу: ${currentTimeMode}</b>\n\n`;
    
    // Пошук критичних точок
    const overloaded = predictions.filter(p => p.overloadProb > 0.65);
    if (overloaded.length > 0) {
        report += `⚠️ <b>Прогноз перевантажень через 30 хв:</b>\n`;
        overloaded.forEach(p => {
            const name = metroData.nodes.find(n => n.id === p.id).name;
            report += `• Станція "${name}" ризик ${(p.overloadProb * 100).toFixed(0)}%\n`;
        });
    } else {
        report += `🟢 Мережа працює в межах норми.\n`;
    }

    // Рекомендації щодо нових ребер (Link Prediction за допомогою GNN)
    const topLink = predictions.sort((a,b) => b.linkDemand - a.linkDemand)[0];
    if (topLink) {
        const name = metroData.nodes.find(n => n.id === topLink.id).name;
        report += `\n💡 <b>Рекомендація інфраструктури:</b>\nНайвища потреба у будівництві додаткової колії зафіксована біля станції: <b>${name}</b>.`;
    }

    // Кількість незалежних кластерів
    const clusters = graphProcessor.detectCommunities();
    report += `\n\n🧩 Кількість виявлених кластерів мережі: <b>${clusters}</b>`;

    aiBox.innerHTML = report;
}

// --- ІНТЕРФЕЙСНІ ФУНКЦІЇ (КЕРУВАННЯ З HTML) ---

function setTimeMode(mode) {
    currentTimeMode = mode;
    document.querySelectorAll('.btn-group button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    rebuild3DGraph();
    updateAIAnalytics();
}

function findRoute() {
    const start = document.getElementById('start-node').value;
    const end = document.getElementById('end-node').value;
    
    if (start === end) return alert("Оберіть різні станції");

    // Одночасний запуск трьох алгоритмів для порівняння часу роботи в UI
    activePath = graphProcessor.dijkstra(start, end);
    graphProcessor.aStar(start, end);
    graphProcessor.bfs(start, end);

    rebuild3DGraph();
}

function clearRoute() {
    activePath = [];
    rebuild3DGraph();
}

function toggleAccident() {
    const isAccident = document.getElementById('accident-toggle').checked;
    // Вимикаємо "Центральну" станцію
    const targetNode = metroData.nodes.find(n => n.id === "st_centr");
    if (targetNode) {
        targetNode.disabled = isAccident;
        clearRoute();
        rebuild3DGraph();
        updateAIAnalytics();
    }
}

function addNewStation() {
    const name = document.getElementById('new-station-name').value.trim();
    if (!name) return alert("Введіть назву!");

    const id = "st_" + Date.now();
    // Генеруємо випадкові координати поблизу центру сцени
    const x = (Math.random() - 0.5) * 8;
    const z = (Math.random() - 0.5) * 8;

    metroData.nodes.push({ id, name, x, y: 0, z, baseFlow: 30, transfers: 0, disabled: false });
    
    // Автоматично з'єднуємо з випадковою робочою станцією, щоб граф не розривався
    const activeNodes = metroData.nodes.filter(n => n.id !== id && !n.disabled);
    if(activeNodes.length > 0) {
        const connectTo = activeNodes[Math.floor(Math.random() * activeNodes.length)].id;
        metroData.edges.push({ source: id, target: connectTo, weight: Math.floor(Math.random() * 4) + 2 });
    }

    document.getElementById('new-station-name').value = "";
    populateDropdowns();
    rebuild3DGraph();
    updateAIAnalytics();
}

function populateDropdowns() {
    const startDrop = document.getElementById('start-node');
    const endDrop = document.getElementById('end-node');
    
    startDrop.innerHTML = "";
    endDrop.innerHTML = "";

    metroData.nodes.forEach(node => {
        if (!node.disabled) {
            const opt1 = document.createElement('option');
            opt1.value = node.id; opt1.innerText = node.name;
            startDrop.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = node.id; opt2.innerText = node.name;
            endDrop.appendChild(opt2);
        }
    });
}

function onWindowResize() {
    const container = document.getElementById('ar-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function setupARButton() {
    const btn = document.createElement('button');
    btn.innerHTML = "УВІМКНУТИ AR РЕЖИМ";
    btn.style.position = 'absolute';
    btn.style.bottom = '20px';
    btn.style.left = '50%';
    btn.style.transform = 'translateX(-50%)';
    btn.style.zIndex = '999';
    btn.className = 'btn active';
    btn.style.width = '200px';
    
    btn.onclick = () => {
        navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor', 'hit-test'] }).then(session => {
            renderer.xr.setSession(session);
        });
    };
    document.body.appendChild(btn);
}

// Запуск усього проєкту після завантаження сторінки
window.onload = init;
