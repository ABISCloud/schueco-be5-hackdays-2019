let map = {
    "room4th_blind_state": "47#product-7606d7eb-508f-40ce-a522-9b526ddc7201-body.entity.0.0",
    "room2nd_blind_state": "47#product-6b61ce71-1a7a-473c-8f87-4262e0bdb448-body.entity.0.0"
};

function selectionChanged(bimsurfer, id, Utils, dontSelect) {
    id = Utils.CompressGuid(id.split("#")[1].substr(8, 36).replace(/-/g, ""));
    if (id) {
        bimsurfer.viewFit({
            ids: [id],
            animate: true
        });
    }

    if (!dontSelect) {
        bimsurfer.setSelection({
            ids: [id],
            clear: true,
            selected: true
        });
    }

    return id;
}

function populateSensorList (bimSurfer, property, map, Utils) {
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
                selectionChanged(bimSurfer, id, Utils);
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
    "bimsurfer/lib/domReady!"
],
function (BimSurfer, StaticTreeRenderer, MetaDataRenderer, Request, Utils) {
    var bimSurfer = new BimSurfer({
        domNode: "viewerContainer"
    });

    let property = new Property(221);
    property.connect();

    property.connection.registerMessageCallback("", o => {
        populateSensorList(bimSurfer, property, map, Utils);
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

    var data = new MetaDataRenderer({
        domNode: "dataContainer"
    });
    data.addModel({id: 1, src: modelName + ".xml"});

    bimSurfer.on("selection-changed", function(selected) {
        data.setSelected(selected.objects.map(function(id) {
            console.log(id);
            return selectionChanged(bimSurfer, id, Utils, true);
        }));
    });
    
    // Lets us play with the Surfer in the console
    window.bimSurfer = bimSurfer;
});