const liveSockets = new Map();
const watchPolygonTrucksData = new Set();

const socketEvent = {
    SENSORS_DATA: "SENSORS_DATA",
    WANT_TRACKING_DATA: "WANT_TRACKING_DATA",
    GEOFENCE_TRUCKS_DATA: "GEOFENCE_TRUCKS_DATA",
};

export { liveSockets, watchPolygonTrucksData, socketEvent };
