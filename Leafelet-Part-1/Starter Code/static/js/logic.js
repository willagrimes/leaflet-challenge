// Step 1: Create the 'basemap' tile layer
var streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
});

// Optional Step 2: Create the 'satellite' tile layer as a second background
var satelliteMap = L.tileLayer('https://{s}.tile.satellite/tiles/{z}/{x}/{y}.jpg', {
    attribution: '&copy; Satellite imagery from XYZ'
});

// Step 3: Create the map object with center and zoom options.
var map = L.map('map', {
    center: [37.7749, -122.4194], // San Francisco's coordinates
    zoom: 5,
    layers: [streetMap] // Set default basemap
});

// Step 4: Add the 'basemap' tile layer to the map
streetMap.addTo(map);

// Optional Step 2: Add layer control for base maps and overlays
var baseMaps = {
    "Street": streetMap,
    "Satellite": satelliteMap
};

// Create earthquake and tectonic plate layers
var earthquakeLayer = new L.LayerGroup();
var tectonicLayer = new L.LayerGroup();

// Add overlays
var overlays = {
    "Earthquakes": earthquakeLayer,
    "Tectonic Plates": tectonicLayer
};

L.control.layers(baseMaps, overlays).addTo(map);

// Step 5: Make a request to retrieve the earthquake GeoJSON data
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {

    // Step 6: Define styleInfo function for earthquake markers
    function styleInfo(feature) {
        return {
            radius: getRadius(feature.properties.mag),
            fillColor: getColor(feature.geometry.coordinates[2]),
            color: "#000000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.7
        };
    }

    // Step 7: Define getColor function based on earthquake depth
    function getColor(depth) {
        if (depth <= 10) return "#00FF00"; // Green
        if (depth <= 30) return "#FFFF00"; // Yellow
        if (depth <= 50) return "#FFA500"; // Orange
        return "#FF0000"; // Red
    }

    // Step 8: Define getRadius function based on earthquake magnitude
    function getRadius(magnitude) {
        if (magnitude === 0) return 1;
        return magnitude * 4; // Scale the radius
    }

    // Step 9: Add GeoJSON data to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng);
        },
        style: styleInfo,
        onEachFeature: function (feature, layer) {
            layer.bindPopup(`
                <h3>Magnitude: ${feature.properties.mag}</h3>
                <p>Location: ${feature.properties.place}</p>
                <p>Depth: ${feature.geometry.coordinates[2]} km</p>
            `);
        }
    }).addTo(earthquakeLayer);

    // Add earthquake layer to map
    earthquakeLayer.addTo(map);

    // Step 10: Create the legend
    let legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
        let div = L.DomUtil.create("div", "info legend");
        const depths = [0, 10, 30, 50]; // Depth intervals
        const colors = ["#00FF00", "#FFFF00", "#FFA500", "#FF0000"]; // Corresponding colors

        // Loop through depth intervals and generate the labels for the legend
        for (let i = 0; i < depths.length; i++) {
            div.innerHTML += 
                `<i style="background: ${colors[i]}"></i> ${depths[i]}${depths[i + 1] ? "&ndash;" + depths[i + 1] + " km" : "+"} <br>`;
        }
        return div;
    };

    legend.addTo(map);

    // Optional Step 2: Load Tectonic Plates GeoJSON data
    d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plateData) {
        L.geoJson(plateData, {
            style: { color: "#FF5733", weight: 2, opacity: 0.5 }
        }).addTo(tectonicLayer);

        // Add tectonic plates layer to map
        tectonicLayer.addTo(map);
    });
});