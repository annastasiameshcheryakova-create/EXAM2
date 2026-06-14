let network;
let currentData;

function drawGraph(data){

    currentData = data;

    const container =
        document.getElementById("network");

    const graphData = {
        nodes:new vis.DataSet(data.nodes),
        edges:new vis.DataSet(data.edges)
    };

    const options = {

        nodes:{
            shape:"dot",
            size:20,
            font:{
                size:18
            }
        },

        physics:{
            enabled:true
        }
    };

    network =
        new vis.Network(
            container,
            graphData,
            options
        );
}
