import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapPin,
  Navigation,
  Building2,
  Clock,
  Layers,
  Crosshair,
} from "lucide-react";

const DEFAULT_COORDS = { lat: 8.6095, lng: -70.6082 };

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ProximitySidebar({
  publications = [],
  donationCenters = [],
  hoveredPublicationId = null,
  onSelectPublication,
  userApproxLocation = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  const [radiusKm, setRadiusKm] = useState(5);
  const [userCoords, setUserCoords] = useState(
    userApproxLocation || DEFAULT_COORDS
  );
  const [selectedPinLabel, setSelectedPinLabel] = useState(null);

  // Obtener ubicación actual del navegador si el usuario lo autoriza
  useEffect(() => {
    if (userApproxLocation?.lat && userApproxLocation?.lng) {
      setUserCoords(userApproxLocation);
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Si rechaza o no está disponible, conserva coordenadas por defecto
        },
        { enableHighAccuracy: false, timeout: 6000 }
      );
    }
  }, [userApproxLocation]);

  // Publicaciones filtradas por radio de cercanía (excluye ENTREGADO)
  const nearbyPublications = useMemo(() => {
    return publications
      .filter((pub) => pub.status !== "ENTREGADO" && pub.lat && pub.lng)
      .map((pub) => ({
        ...pub,
        distanceKm: calculateDistanceKm(
          userCoords.lat,
          userCoords.lng,
          Number(pub.lat),
          Number(pub.lng)
        ),
      }))
      .filter((pub) => pub.distanceKm <= radiusKm);
  }, [publications, userCoords, radiusKm]);

  // Inicializar mapa Leaflet una sola vez
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userCoords.lat, userCoords.lng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    layersGroupRef.current = layersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersGroupRef.current = null;
    };
  }, []);

  // Actualizar marcadores: Ubicación actual, Círculos Rojos y Centros de Donación
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();

    // 1. Marcador de ubicación actual (punto azul)
    const userMarker = L.circleMarker([userCoords.lat, userCoords.lng], {
      radius: 8,
      color: "#FFFFFF",
      weight: 2.5,
      fillColor: "#2563EB",
      fillOpacity: 1,
    }).bindTooltip("Tu ubicación actual", { direction: "top" });

    userMarker.addTo(layersGroup);

    // 2. Círculos rojos de publicaciones cercanas (zona aproximada por privacidad)
    nearbyPublications.forEach((pub) => {
      const isHovered = hoveredPublicationId === pub.id;
      const circle = L.circle([Number(pub.lat), Number(pub.lng)], {
        radius: Number(pub.radius_meters) || 320,
        color: isHovered ? "#991B1B" : "#DC2626",
        weight: isHovered ? 3 : 1.8,
        fillColor: "#EF4444",
        fillOpacity: isHovered ? 0.45 : 0.24,
      });

      circle.bindTooltip(
        `${pub.title} (${pub.distanceKm.toFixed(1)} km)`,
        { direction: "top" }
      );

      circle.on("click", () => {
        setSelectedPinLabel(`${pub.title} · ${pub.zone_name}`);
        onSelectPublication?.(pub);
      });

      circle.addTo(layersGroup);
    });

    // 3. Marcadores de Centros de Donación Aliados (verde bosque)
    donationCenters.forEach((center) => {
      if (!center.lat || !center.lng) return;

      const centerMarker = L.circleMarker(
        [Number(center.lat), Number(center.lng)],
        {
          radius: 7,
          color: "#FFFFFF",
          weight: 2,
          fillColor: "#2D6A4F",
          fillOpacity: 1,
        }
      ).bindTooltip(`Centro aliado: ${center.name}`, { direction: "top" });

      centerMarker.on("click", () => {
        setSelectedPinLabel(`Centro aliado: ${center.name}`);
      });

      centerMarker.addTo(layersGroup);
    });
  }, [
    userCoords,
    nearbyPublications,
    donationCenters,
    hoveredPublicationId,
    onSelectPublication,
  ]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 14, {
      animate: true,
    });
    setSelectedPinLabel(null);
  };

  const handleFocusCenter = (center) => {
    if (!mapInstanceRef.current || !center.lat || !center.lng) return;
    mapInstanceRef.current.setView([Number(center.lat), Number(center.lng)], 15, {
      animate: true,
    });
    setSelectedPinLabel(`Centro aliado: ${center.name}`);
  };

  return (
    <aside
      aria-label="Mapa de cercanía y centros de donación"
      className="space-y-4 lg:sticky lg:top-20"
    >
      {/* Tarjeta 1: Mapa de Proximidad con Círculos Rojos */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-[#2D6A4F]" />
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Radar Comunitario
              </h2>
              <p className="text-[11px] text-stone-500">
                {nearbyPublications.length} publicaciones a menos de {radiusKm} km
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRecenter}
            title="Centrar en mi ubicación actual"
            className="rounded-lg border border-stone-200 bg-[#FAF9F6] p-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        </div>

        {/* Selector de Radio (1 km, 3 km, 5 km) */}
        <div className="flex items-center justify-between bg-[#FAF9F6] px-4 py-2 text-xs">
          <span className="font-medium text-stone-600">Radio de búsqueda:</span>
          <div className="flex gap-1">
            {[1, 3, 5].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadiusKm(km)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  radiusKm === km
                    ? "bg-[#2D6A4F] text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>

        {/* Contenedor del Mapa Leaflet */}
        <div className="relative h-64 w-full bg-stone-100">
          <div ref={mapContainerRef} className="h-full w-full z-0" />
        </div>

        {/* Leyenda de Privacidad y Marcadores */}
        <div className="border-t border-stone-100 px-4 py-2.5 text-[11px] text-stone-600">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200" />
              Tu ubicación
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70 ring-1 ring-red-600" />
              Publicación cercana (área aprox.)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2D6A4F]" />
              Centro de donación
            </span>
          </div>

          {selectedPinLabel && (
            <p className="mt-1.5 truncate rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-[#2D6A4F]">
              Seleccionado: {selectedPinLabel}
            </p>
          )}
        </div>
      </div>

      {/* Tarjeta 2: Centros de Donación Aliados Destacados */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 to-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2D6A4F] text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Centros de Donación Aliados
            </h2>
            <p className="text-[11px] text-stone-600">
              Puntos físicos verificados para entregas directas
            </p>
          </div>
        </div>

        {donationCenters.length === 0 ? (
          <p className="mt-3 rounded-xl bg-white/80 p-3 text-xs text-stone-500">
            No hay centros de donación registrados en esta zona todavía.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {donationCenters.map((center) => (
              <li
                key={center.id}
                className="rounded-xl border border-emerald-200/70 bg-white p-3 transition hover:border-[#2D6A4F]/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2D6A4F]">
                      {center.center_type}
                    </span>
                    <h3 className="mt-1 text-xs font-bold text-stone-900">
                      {center.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFocusCenter(center)}
                    title="Ver centro en el mapa"
                    className="shrink-0 rounded-lg bg-[#FAF9F6] p-1.5 text-[#2D6A4F] ring-1 ring-stone-200 transition hover:bg-emerald-50"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 space-y-1 text-[11px] text-stone-600">
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 shrink-0 text-stone-400" />
                    <span>{center.schedule_hours}</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <Layers className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" />
                    <span className="line-clamp-2">
                      Recibe: {center.accepted_categories}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}