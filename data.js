// Базова топологія графа метро (вузли та ребра)
const metroData = {
    nodes: [
        { id: "st_uni", name: "Університет", x: 0, y: 0, z: 0, baseFlow: 45, transfers: 2, disabled: false },
        { id: "st_centr", name: "Центральна", x: -2, y: 0, z: -3, baseFlow: 65, transfers: 1, disabled: false },
        { id: "st_vokzal", name: "Вокзальна", x: -4, y: 0, z: -1, baseFlow: 80, transfers: 3, disabled: false },
        { id: "st_teatr", name: "Театральна", x: 2, y: 0, z: -2, baseFlow: 35, transfers: 1, disabled: false },
        { id: "st_polytech", name: "Політехнічна", x: -1, y: 0, z: 4, baseFlow: 50, transfers: 0, disabled: false },
        { id: "st_prospekt", name: "Проспект", x: 3, y: 0, z: 3, baseFlow: 25, transfers: 0, disabled: false },
        { id: "st_solar", name: "Сонячна", x: 5, y: 0, z: 0, baseFlow: 15, transfers: 0, disabled: false }
    ],
    edges: [
        { source: "st_vokzal", target: "st_centr", weight: 3 },
        { source: "st_centr", target: "st_uni", weight: 2 },
        { source: "st_uni", target: "st_teatr", weight: 2 },
        { source: "st_teatr", target: "st_solar", weight: 4 },
        { source: "st_uni", target: "st_polytech", weight: 3 },
        { source: "st_polytech", target: "st_prospekt", weight: 4 },
        { source: "st_prospekt", target: "st_teatr", weight: 3 }
    ]
};

// Коефіцієнти зміни пасажиропотоку залежно від часу доби
const timeFactors = {
    morning: 1.8,  // Час пік (ранок)
    day: 1.0,      // Стандартний денний режим
    evening: 1.6,  // Другий пік (повернення додому)
    night: 0.2     // Мінімальний трафік
};
