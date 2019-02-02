function highlight(selected) {
    // Clicking an explorer node fits the view to its object and selects
    if (selected.length) {
        bimSurfer.viewFit({
            ids: selected,
            animate: true
        });
    }
    bimSurfer.setSelection({
        ids:selected,
        clear:true,
        selected:true
    });
}

function getModelEntities () {
    var scene = bimSurfer.viewer.scene;
    return Object.keys(scene.entities).filter(o => o.length > 10);
}

function populateSensorList (property, map, selectedPart, Utils) {
    let reveseMap ={};
    Object.keys(map).forEach(key => {
        let value = map[key];
        reveseMap[value] = key;
    });

    let sensorList = document.getElementById("sensorList");
    if (sensorList) {
        sensorList.innerHTML = Object.keys(property.sensors).map(o => {
            if (o === reveseMap[selectedPart]) {
                return "<li><b>" + o + "</b></li>"
            } else{
                return "<li>" + o + "</li>"
            }
        }).join("");
    }
    sensorList.childNodes.forEach(o => {
        o.onclick = (e) => {
            if (!map[o.innerText]) {
                return;
            }
            let id = map[o.innerText];
            selectedPart = id;
            highlight([Utils.CompressGuid(id.split("#")[1].substr(8, 36).replace(/-/g, ""))])
            populateSensorList(property, map, selectedPart, Utils);
        };
    });
};
require([
    "bimsurfer/src/BimSurfer",
    "bimsurfer/src/StaticTreeRenderer",
    "bimsurfer/src/MetaDataRenderer",
    "bimsurfer/src/Request",
    "bimsurfer/src/Utils",
    "examples/lib/Chart",
    "examples/lib/Property",
    "examples/lib/PropertyConnection",
    "examples/lib/Sensor",
    "bimsurfer/lib/domReady!",
    "examples/application"
],
function (BimSurfer, StaticTreeRenderer, MetaDataRenderer, Request, Utils) {
    var bimSurfer = new BimSurfer({
        domNode: "viewerContainer"
    });

    let map = {
        "room4th_blind_state": "47#product-6b61ce71-1a7a-473c-8f87-4262e0bdc858-body.entity.0.0",
        "room2nd_blind_state": "47#product-6b61ce71-1a7a-473c-8f87-4262e0bdb1c2-body.entity.0.0"
    };

    let property = new Property(221);
    property.connect();

    let selectedPart = null;

    property.connection.registerMessageCallback("", o => {
        populateSensorList(property, map, selectedPart, Utils);
    });

    
    var modelName = window.location.hash;
    if (modelName.length < 1) {
        modelName = "Duplex_A_20110907_optimized";
    } else {
        modelName = modelName.substr(1);
    }
    modelName = "models/" + modelName;
    
    var tree = new StaticTreeRenderer({
        domNode: "treeContainer"
    });
    tree.addModel({id: 1, src: modelName + ".xml"});
    tree.build();
    
    tree.on("click", highlight);

    var data = new MetaDataRenderer({
        domNode: "dataContainer"
    });
    data.addModel({id: 1, src: modelName + ".xml"});
    
    bimSurfer.load({
        src: modelName + ".gltf"
    }).then(function (model) {
        
        var scene = bimSurfer.viewer.scene;

        var aabb = scene.worldBoundary.aabb;
        var diag = xeogl.math.subVec3(aabb.slice(3), aabb, xeogl.math.vec3());
        var modelExtent = xeogl.math.lenVec3(diag);
    
        scene.camera.project.near = modelExtent / 1000.;
        scene.camera.project.far = modelExtent * 100.;
       
        scene.camera.view.eye = [-1,-1,5];
        scene.camera.view.up = [0,0,1];
        bimSurfer.viewFit({centerModel:true});
        
        bimSurfer.viewer.scene.canvas.canvas.style.display = 'block';
    });

    bimSurfer.on("selection-changed", function(selected) {
        data.setSelected(selected.objects.map(function(id) {
            selectedPart = id;
            populateSensorList(property, map, selectedPart, Utils);
            return Utils.CompressGuid(id.split("#")[1].substr(8, 36).replace(/-/g, ""));
        }));
    });
    
    // Lets us play with the Surfer in the console
    window.bimSurfer = bimSurfer;
});