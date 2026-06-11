
document.addEventListener("DOMContentLoaded", async () => {

    console.log("map.js loaded");

    const locationName = window.locationName;
    console.log("Location:", locationName);

    if (!locationName) {
        console.log("No location found");
        return;
    }

    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`
    );

    const data = await res.json();
    console.log("Geo Data:", data);

    if (data.length === 0) {
        console.log("No coordinates found");
        return;
    }

    const lat = data[0].lat;
    const lon = data[0].lon;

    console.log("Lat:", lat);
    console.log("Lon:", lon);

    const map = L.map('map').setView([lat, lon], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

    L.marker([lat, lon]).addTo(map);

});
