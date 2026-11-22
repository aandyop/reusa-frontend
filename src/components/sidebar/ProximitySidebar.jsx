import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapPin,
  Navigation,
  Building2,
  Clock,
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
} from "lucide-react";

// 9°18'13.6"N 70°36'44.3"W convertido a coordenadas decimales
const FIXED_UNREGISTERED_COORDS = {
  lat: 9.3037778,
  lng: -70.6123056,
};

const GREEN_PUBLICATION_COLOR = "#2D6A4F";
const GREEN_PUBLICATION_HOVER = "#1B4332";
const TERRACOTTA_COLOR = "#E76F51";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [userCoords, setUserCoords] = useState(
    userApproxLocation?.lat && userApproxLocation?.lng
      ? {
          lat: Number(userApproxLocation.lat),
          lng: Number(userApproxLocation.lng),
        }
      : FIXED_UNREGISTERED_COORDS
  );
  const [selectedPin, setSelectedPin] = useState(null);

  useEffect(() => {
    if (userApproxLocation?.lat && userApproxLocation?.lng) {
      setUserCoords({
        lat: Number(userApproxLocation.lat),
        lng: Number(userApproxLocation.lng),
      });
      return;
    }

    setUserCoords(FIXED_UNREGISTERED_COORDS);
  }, [userApproxLocation]);

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

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => clearTimeout(timer);
  }, [isExpanded]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([userCoords.lat, userCoords.lng], 14, { animate: true });
  }, [userCoords.lat, userCoords.lng]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();

    // 1. Ubicación fija / usuario (punto azul)
    const userMarker = L.circleMarker([userCoords.lat, userCoords.lng], {
      radius: 8,
      color: "#FFFFFF",
      weight: 2.5,
      fillColor: "#2563EB",
      fillOpacity: 1,
    }).bindTooltip(
      `Ubicación: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`,
      { direction: "top" }
    );

    userMarker.addTo(layersGroup);

    // 2. Círculos verdes de publicaciones cercanas (área aproximada por privacidad)
    nearbyPublications.forEach((pub) => {
      const isHovered = hoveredPublicationId === pub.id;
      const circle = L.circle([Number(pub.lat), Number(pub.lng)], {
        radius: Number(pub.radius_meters) || 320,
        color: isHovered ? GREEN_PUBLICATION_HOVER : GREEN_PUBLICATION_COLOR,
        weight: isHovered ? 3 : 1.8,
        fillColor: GREEN_PUBLICATION_COLOR,
        fillOpacity: isHovered ? 0.45 : 0.24,
      });

      circle.bindTooltip(
        `${pub.title} (${pub.distanceKm.toFixed(1)} km)`,
        { direction: "top" }
      );

      circle.on("click", () => {
        setSelectedPin({
          type: "publication",
          label: `${pub.title} · ${pub.zone_name}`,
        });
        onSelectPublication?.(pub);
      });

      circle.addTo(layersGroup);
    });

    // 3. Marcadores de Centros de Acopio / Donación en rojo terracota (#E76F51)
    donationCenters.forEach((center) => {
      if (!center.lat || !center.lng) return;

      const centerMarker = L.circleMarker(
        [Number(center.lat), Number(center.lng)],
        {
          radius: 7.5,
          color: "#FFFFFF",
          weight: 2,
          fillColor: TERRACOTTA_COLOR,
          fillOpacity: 1,
        }
      ).bindTooltip(`Centro de acopio: ${center.name}`, { direction: "top" });

      centerMarker.on("click", () => {
        setSelectedPin({
          type: "center",
          label: `Centro de acopio: ${center.name}`,
        });
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
    setSelectedPin(null);
  };

  const handleFocusCenter = (center) => {
    if (!mapInstanceRef.current || !center.lat || !center.lng) return;
    mapInstanceRef.current.setView([Number(center.lat), Number(center.lng)], 15, {
      animate: true,
    });
    setSelectedPin({
      type: "center",
      label: `Centro de acopio: ${center.name}`,
    });
  };

  return (
    <aside
      aria-label="Mapa de cercanía y centros de donación"
      className="space-y-4 lg:sticky lg:top-20"
    >
      {/* Tarjeta 1: Mapa de Proximidad con Publicaciones Verdes y Centros en Rojo Terracota */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Navigation
              className="h-4 w-4"
              style={{ color: GREEN_PUBLICATION_COLOR }}
            />
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Radar de Proximidad
              </h2>
              <p className="text-[11px] text-stone-500">
                {nearbyPublications.length} publicaciones a menos de {radiusKm} km
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRecenter}
              title="Centrar en ubicación 9°18'13.6&quot;N 70°36'44.3&quot;W"
              className="rounded-lg border border-stone-200 bg-[#FAF9F6] p-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <Crosshair className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? "Reducir tamaño del mapa" : "Agrandar mapa"}
              aria-label={isExpanded ? "Reducir mapa" : "Agrandar mapa"}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                isExpanded
                  ? "border-[#2D6A4F] bg-emerald-50 text-[#2D6A4F]"
                  : "border-stone-200 bg-[#FAF9F6] text-stone-700 hover:bg-stone-100"
              }`}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Reducir</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Agrandar</span>
                </>
              )}
            </button>
          </div>
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
        <div
          className={`relative w-full bg-stone-100 transition-all duration-300 ${
            isExpanded ? "h-[28rem]" : "h-64"
          }`}
        >
          <div ref={mapContainerRef} className="z-0 h-full w-full" />
        </div>

        {/* Leyenda: Publicaciones en Verde (#2D6A4F) y Centros de Acopio en Rojo Terracota (#E76F51) */}
        <div className="border-t border-stone-100 px-4 py-2.5 text-[11px] text-stone-600">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200" />
              Ubicación base (9°18&apos;13.6&quot;N 70°36&apos;44.3&quot;W)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full ring-1"
                style={{
                  backgroundColor: "rgb(45, 106, 79)",
                  borderColor: GREEN_PUBLICATION_COLOR,
                }}
              />
              Publicación cercana (área aprox.)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: TERRACOTTA_COLOR }}
              />
              Centro de acopio
            </span>
          </div>

          {selectedPin && (
            <p
              style={
                selectedPin.type === "center"
                  ? {
                      backgroundColor: "rgba(231, 111, 81, 0.14)",
                      color: TERRACOTTA_COLOR,
                    }
                  : undefined
              }
              className={`mt-1.5 truncate rounded-lg px-2.5 py-1 font-semibold ${
                selectedPin.type === "publication"
                  ? "bg-emerald-50 text-[#2D6A4F]"
                  : ""
              }`}
            >
              Seleccionado: {selectedPin.label}
            </p>
          )}
        </div>
      </div>

      {/* Tarjeta 2: Centros de Donación Aliados en Terracota (#E76F51) */}
      <div
        style={{
          borderColor: "rgba(231, 111, 81, 0.35)",
          backgroundImage:
            "linear-gradient(to bottom, rgba(231, 111, 81, 0.10), #ffffff)",
        }}
        className="rounded-2xl border p-4 shadow-xs"
      >
        <div className="flex items-center gap-2">
          <div
            style={{ backgroundColor: TERRACOTTA_COLOR }}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
          >
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Centros de Donación Aliados
            </h2>
            <p className="text-[11px] text-stone-600">
              Puntos físicos verificados para entregar artículos
            </p>
          </div>
        </div>

        {donationCenters.length === 0 ? (
          <p className="mt-3 rounded-xl bg-white/80 p-3 text-xs text-stone-500">
            No hay centros de donación registrados todavía.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {donationCenters.map((center) => (
              <li
                key={center.id}
                style={{ borderColor: "rgba(231, 111, 81, 0.28)" }}
                className="rounded-xl border bg-white p-3 transition hover:border-[#E76F51]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      style={{
                        backgroundColor: "rgba(231, 111, 81, 0.14)",
                        color: TERRACOTTA_COLOR,
                      }}
                      className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    >
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
                    style={{ color: TERRACOTTA_COLOR }}
                    className="shrink-0 rounded-lg bg-[#FAF9F6] p-1.5 ring-1 ring-stone-200 transition hover:bg-[#E76F51]/10"
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