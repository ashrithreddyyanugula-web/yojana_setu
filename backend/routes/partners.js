const express = require("express");

const router = express.Router();

const PLACES_API_URL = "https://places.googleapis.com/v1/places";
const SEARCH_RADIUS_METERS = 5000;
const MAX_RESULT_COUNT = 20;
const FIELD_MASK = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.googleMapsUri",
].join(",");

const SCHEME_CONFIG = Object.freeze({
    pmegp: {
        name: "Prime Minister's Employment Generation Programme",
        query: "PMEGP loan assistance bank CSC",
    },
    mudra: {
        name: "Pradhan Mantri MUDRA Yojana",
        query: "MUDRA loan assistance bank CSC",
    },
    "stand-up-india": {
        name: "Stand-Up India",
        query: "Stand-Up India loan assistance bank CSC",
    },
});

const isValidCoordinate = (value, minimum, maximum) => {
    const coordinate = Number(value);
    return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum;
};

const distanceInKm = (first, second) => {
    if (!first || !second) return null;

    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const latitudeDelta = toRadians(second.lat - first.lat);
    const longitudeDelta = toRadians(second.lng - first.lng);
    const latitudeOne = toRadians(first.lat);
    const latitudeTwo = toRadians(second.lat);
    const haversine = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(latitudeOne) * Math.cos(latitudeTwo) * Math.sin(longitudeDelta / 2) ** 2;

    return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const normalizePlace = (place, origin, scheme) => ({
    placeId: place.id,
    name: place.displayName?.text || null,
    formattedAddress: place.formattedAddress || null,
    location: place.location
        ? {
            lat: place.location.latitude,
            lng: place.location.longitude,
        }
        : null,
    googleMapsUri: place.googleMapsUri || null,
    distanceKm: place.location
        ? distanceInKm(origin, { lat: place.location.latitude, lng: place.location.longitude })
        : null,
    schemeSupport: scheme ? scheme.name : null,
});

const fetchPlaces = async (url, body) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
                "X-Goog-FieldMask": FIELD_MASK,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const googleMessage = data.error?.message || "Google Places request failed.";
            const error = new Error(googleMessage);
            error.statusCode = response.status >= 500 ? 502 : 400;
            throw error;
        }

        return Array.isArray(data.places) ? data.places : [];
    } finally {
        clearTimeout(timeout);
    }
};

router.get("/nearby", async (req, res) => {
    const { lat, lng, query, schemeId } = req.query;
    const searchQuery = String(query || "").trim();
    const hasQuery = Boolean(searchQuery);
    const hasCoordinates = isValidCoordinate(lat, -90, 90) && isValidCoordinate(lng, -180, 180);
    const scheme = schemeId ? SCHEME_CONFIG[String(schemeId)] : null;

    if (schemeId && !scheme) {
        return res.status(400).json({ error: "The selected scheme is not supported for partner assistance." });
    }

    if (scheme && !hasCoordinates) {
        return res.status(400).json({
            error: "Valid latitude and longitude are required for scheme-specific assistance.",
        });
    }

    if (!hasCoordinates && !hasQuery && !scheme) {
        return res.status(400).json({
            error: "Valid latitude and longitude or a search query is required.",
        });
    }

    if (query !== undefined && searchQuery.length > 200) {
        return res.status(400).json({ error: "The search query must be 200 characters or fewer." });
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
        return res.status(503).json({ error: "Partner search is not configured on the server." });
    }

    let url;
    let requestBody;

    if (scheme) {
        const center = {
            latitude: Number(lat),
            longitude: Number(lng),
        };
        url = `${PLACES_API_URL}:searchText`;
        requestBody = {
            textQuery: scheme.query,
            locationBias: {
                circle: {
                    center,
                    radius: SEARCH_RADIUS_METERS,
                },
            },
            maxResultCount: MAX_RESULT_COUNT,
        };
    } else if (hasQuery && hasCoordinates) {
        const center = {
            latitude: Number(lat),
            longitude: Number(lng),
        };
        url = `${PLACES_API_URL}:searchText`;
        requestBody = {
            textQuery: searchQuery,
            locationBias: {
                circle: {
                    center,
                    radius: SEARCH_RADIUS_METERS,
                },
            },
            maxResultCount: MAX_RESULT_COUNT,
        };
    } else if (hasQuery && !hasCoordinates) {
        url = `${PLACES_API_URL}:searchText`;
        requestBody = {
            textQuery: searchQuery,
            maxResultCount: MAX_RESULT_COUNT,
        };
    } else {
        const center = {
            latitude: Number(lat),
            longitude: Number(lng),
        };
        url = `${PLACES_API_URL}:searchNearby`;
        requestBody = {
            includedTypes: ["bank", "atm", "government_office", "post_office"],
            maxResultCount: MAX_RESULT_COUNT,
            locationRestriction: {
                circle: {
                    center,
                    radius: SEARCH_RADIUS_METERS,
                },
            },
        };
    }

    try {
        const places = await fetchPlaces(url, requestBody);

        const origin = {
            lat: Number(lat),
            lng: Number(lng),
        };

        const normalizedPlaces = places
            .map((place) => normalizePlace(place, origin, scheme))
            .filter(
                (place) =>
                    place.distanceKm !== null &&
                    place.distanceKm <= 25
            )
            .sort((first, second) => {
                return first.distanceKm - second.distanceKm;
            });

        return res.json({
            places: normalizedPlaces,
            scheme: scheme ? { id: schemeId, name: scheme.name } : null,
        });
    } catch (error) {
        if (error.name === "AbortError") {
            return res.status(504).json({ error: "Partner search timed out. Please try again." });
        }

        console.error("Partner search failed:", error.message);
        return res.status(error.statusCode || 502).json({
            error: "Unable to retrieve partner locations right now.",
        });
    }
});

module.exports = router;