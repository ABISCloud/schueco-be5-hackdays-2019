let map = {
    "room4th_blind_state": "47#product-6b61ce71-1a7a-473c-8f87-4262e0bdc858-body.entity.0.0",
    "room2nd_blind_state": "47#product-6b61ce71-1a7a-473c-8f87-4262e0bdb1c2-body.entity.0.0"
};

function selectionChanged(id) {
    bimSurfer.viewFit({
        ids: [id],
        animate: true
    });

    bimSurfer.setSelection({
        ids:[id],
        clear:true,
        selected:true
    });
}

function populateSensorList (property, map, Utils) {
    let sensorList = document.getElementById("sensorList");
    if (sensorList) {
        sensorList.innerHTML = Object.keys(property.sensors).map(o => {
            if (map[o]) {
                return "<li><b>" + o + "</b></li>"
            } else{
                return "<li>" + o + "</li>"
            }
        }).join("");

        sensorList.childNodes.forEach(o => {
            o.onclick = (e) => {
                let id = map[o.innerText];
                if (!id) {
                    return;
                }
                selectionChanged(id, Utils);
            };
        });
    }
}
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

    let property = new Property(221);
    property.connect();

    property.connection.registerMessageCallback("", o => {
        populateSensorList(property, map, Utils);
    });
    
    var modelName = window.location.hash;
    if (modelName.length < 1) {
        modelName = "Duplex_A_20110907_optimized";
    } else {
        modelName = modelName.substr(1);
    }
    modelName = "models/" + modelName;

    
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
            selectionChanged(id, Utils);
            return Utils.CompressGuid(id.split("#")[1].substr(8, 36).replace(/-/g, ""));
        }));
    });
    
    // Lets us play with the Surfer in the console
    window.bimSurfer = bimSurfer;
});