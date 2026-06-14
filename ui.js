function showSocialGraph(){

    document.getElementById("description").innerHTML =
    `
    Соціальна мережа демонструє зв'язки між людьми.
    Кожна вершина є користувачем,
    а ребра показують взаємодію між ними.
    `;

    drawGraph(socialData);
}

function showTransportGraph(){

    document.getElementById("description").innerHTML =
    `
    Транспортний граф демонструє
    маршрути між містами.
    Використовується для логістики,
    навігації та оптимізації маршрутів.
    `;

    drawGraph(transportData);
}

function analyzeGraph(){

    if(!currentData){

        alert("Спочатку побудуйте граф");

        return;
    }

    const nodes =
        currentData.nodes.length;

    const edges =
        currentData.edges.length;

    const density =
        (2 * edges) /
        (nodes * (nodes - 1));

    document.getElementById("analysis").innerHTML =
    `
    <div class="card">
        Кількість вершин: ${nodes}
    </div>

    <div class="card">
        Кількість ребер: ${edges}
    </div>

    <div class="card">
        Щільність графа:
        ${density.toFixed(2)}
    </div>

    <div class="card">
        Граф може бути використаний
        як основа для Graph Neural Networks.
    </div>
    `;
}
