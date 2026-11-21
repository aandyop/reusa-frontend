import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { publicationsService } from "../services/publicationsService";
import { centersService } from "../services/centersEventsBlogService";
import FeedFilterBar from "../components/feed/FeedFilterBar";
import PublicationCard from "../components/feed/PublicationCard";
import ProximitySidebar from "../components/sidebar/ProximitySidebar";

const INITIAL_FILTERS = {
  q: "",
  category: "",
  modality: "",
  condition: "",
  sizeScale: "",
  tag: "",
};

// Datos de respaldo alineados con seed.sql mientras el backend termina de desplegarse
const FALLBACK_PUBLICATIONS = [
  {
    id: "pub-101",
    author_id: "usr-002",
    author_nickname: "LiderSostenible",
    author_role: "releader",
    author_is_verified: true,
    title: "Sofá de dos puestos en tela gris",
    description:
      "Sofá cómodo de sala, estructura firme y tapizado limpio. Se entrega por mudanza a piso más pequeño.",
    images: [],
    category: "Mobiliario",
    item_condition: "Buen estado",
    modality: "Donación",
    trade_preference: null,
    size_scale: "XL",
    tags: ["Transporte necesario"],
    status: "DISPONIBLE",
    zone_name: "Centro Histórico",
    lat: 8.6131,
    lng: -70.6054,
    radius_meters: 350,
    re_points_reward: 50,
    pending_requests_count: 2,
    created_at: "2026-11-20T14:20:00Z",
  },
  {
    id: "pub-102",
    author_id: "usr-001",
    author_nickname: "NomadaVerde",
    author_role: "user",
    author_is_verified: true,
    title: "Mesa auxiliar de madera y lámpara de pie",
    description:
      "Ideal para rincón de lectura. La lámpara solo necesita cambiar el bombillo; la mesa está lista.",
    images: [],
    category: "Decoración y Hogar",
    item_condition: "Requiere reparación menor",
    modality: "Trueque",
    trade_preference: "Macetas de barro o plantas de interior",
    size_scale: "M",
    tags: ["Traer cajas o bolsas"],
    status: "DISPONIBLE",
    zone_name: "Sector El Mirador",
    lat: 8.6098,
    lng: -70.6085,
    radius_meters: 300,
    re_points_reward: 30,
    pending_requests_count: 0,
    created_at: "2026-11-20T18:05:00Z",
  },
  {
    id: "pub-103",
    author_id: "usr-003",
    author_nickname: "TallerRaiz",
    author_role: "releader",
    author_is_verified: true,
    title: "Tablones de pino y bisagras para restaurar",
    description:
      "Lote de madera recuperada de una estantería antigua, excelente para proyectos de carpintería o repisas.",
    images: [],
    category: "Para Restaurar / Materiales",
    item_condition: "Solo para piezas / Restauración",
    modality: "Donación",
    trade_preference: null,
    size_scale: "L",
    tags: ["Está en la calle", "Transporte necesario"],
    status: "DISPONIBLE",
    zone_name: "La Hoyada",
    lat: 8.6056,
    lng: -70.6141,
    radius_meters: 400,
    re_points_reward: 40,
    pending_requests_count: 1,
    created_at: "2026-11-21T09:15:00Z",
  },
  {
    id: "pub-104",
    author_id: "usr-005",
    author_nickname: "HogarSegundoCiclo",
    author_role: "user",
    author_is_verified: true,
    title: "Microondas doméstico funcional",
    description:
      "Calienta rápido, plato giratorio intacto y luz interior operativa. Se entrega con bandeja.",
    images: [],
    category: "Electrodomésticos y Línea Blanca",
    item_condition: "Como nuevo",
    modality: "Donación",
    trade_preference: null,
    size_scale: "M",
    tags: ["Traer cajas o bolsas"],
    status: "RESERVADO",
    approved_applicant_id: "usr-001",
    zone_name: "Santa Rosa",
    lat: 8.6081,
    lng: -70.6029,
    radius_meters: 300,
    re_points_reward: 35,
    pending_requests_count: 0,
    created_at: "2026-11-19T11:40:00Z",
  },
];

const FALLBACK_CENTERS = [
  {
    id: "dc-01",
    name: "Centro de Acopio El Bosque",
    center_type: "Centro Comunitario",
    schedule_hours: "Lun a Vie · 08:30 AM - 04:00 PM",
    accepted_categories: "Mobiliario, Decoración y Hogar, Ropa y Textiles",
    zone_name: "El Bosque",
    lat: 8.6112,
    lng: -70.6075,
  },
  {
    id: "dc-02",
    name: "Fundación Hogar Digno",
    center_type: "Fundación Social",
    schedule_hours: "Mar a Sáb · 09:00 AM - 03:00 PM",
    accepted_categories: "Electrodomésticos, Juguetes, Tecnología y Oficina",
    zone_name: "Santa Rosa",
    lat: 8.6072,
    lng: -70.6041,
  },
  {
    id: "dc-03",
    name: "Taller Comunitario La Madera",
    center_type: "Taller de Restauración",
    schedule_hours: "Mié a Dom · 10:00 AM - 05:00 PM",
    accepted_categories: "Para Restaurar / Materiales, Mobiliario",
    zone_name: "La Hoyada",
    lat: 8.6061,
    lng: -70.6128,
  },
];

export default function FeedPage({
  externalNewPublication = null,
  onRequestItem,
  onInspectRequests,
  onOpenChat,
  onOpenAuthModal,
}) {
  const { token, user } = useAuth();

  const [publications, setPublications] = useState([]);
  const [donationCenters, setDonationCenters] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [hoveredPublicationId, setHoveredPublicationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const cardRefs = useRef({});

  const loadFeedData = useCallback(async () => {
    setLoading(true);
    try {
      const [pubsRes, centersRes] = await Promise.all([
        publicationsService.getFeed({}, token),
        centersService.getAll(token),
      ]);

      const rawPubs = Array.isArray(pubsRes) ? pubsRes : pubsRes?.publications || [];
      const rawCenters = Array.isArray(centersRes)
        ? centersRes
        : centersRes?.centers || [];

      // Garantiza que nunca se muestren artículos ENTREGADO en el feed principal
      setPublications(rawPubs.filter((item) => item.status !== "ENTREGADO"));
      setDonationCenters(rawCenters);
      setUsingFallback(false);
    } catch {
      setPublications(
        FALLBACK_PUBLICATIONS.filter((item) => item.status !== "ENTREGADO")
      );
      setDonationCenters(FALLBACK_CENTERS);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFeedData();
  }, [loadFeedData]);

  // Si se crea una publicación nueva desde el modal en App.jsx, se inserta al inicio del feed
  useEffect(() => {
    if (!externalNewPublication) return;
    setPublications((prev) => {
      if (prev.some((p) => p.id === externalNewPublication.id)) return prev;
      return [externalNewPublication, ...prev];
    });
  }, [externalNewPublication]);

  // Filtrado reactivo en cliente
  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      if (pub.status === "ENTREGADO") return false;

      if (filters.q) {
        const query = filters.q.toLowerCase().trim();
        const matchesTitle = pub.title?.toLowerCase().includes(query);
        const matchesDesc = pub.description?.toLowerCase().includes(query);
        const matchesZone = pub.zone_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesZone) return false;
      }

      if (filters.category && pub.category !== filters.category) return false;
      if (filters.modality && pub.modality !== filters.modality) return false;
      if (filters.condition && pub.item_condition !== filters.condition) {
        return false;
      }
      if (filters.sizeScale && pub.size_scale !== filters.sizeScale) return false;

      if (filters.tag) {
        const tagLabels = (pub.tags || []).map((t) =>
          typeof t === "string" ? t : t.tag_name
        );
        if (!tagLabels.includes(filters.tag)) return false;
      }

      return true;
    });
  }, [publications, filters]);

  // Al hacer clic en un círculo rojo del mapa, desplaza suavemente hacia su tarjeta y la resalta
  const handleSelectPublicationFromMap = useCallback((publication) => {
    if (!publication?.id) return;
    setHoveredPublicationId(publication.id);

    const targetNode = cardRefs.current[publication.id];
    if (targetNode) {
      targetNode.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const userApproxLocation =
    user?.approx_lat && user?.approx_lng
      ? { lat: Number(user.approx_lat), lng: Number(user.approx_lng) }
      : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Banner poético y de privacidad con Nicknames */}
      <div className="mb-5 flex flex-col justify-between gap-2 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-[#FAF9F6] to-amber-50/60 px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6A4F]" />
          <p className="text-xs leading-relaxed text-stone-700 sm:text-sm">
            <span className="font-semibold text-[#2D6A4F]">
              Comunidad protegida por Nicknames:
            </span>{" "}
            “La verdadera generosidad no lleva firma; basta con saber que algo útil
            vuelve a tener vida.”
          </p>
        </div>

        {usingFallback && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
            <AlertCircle className="h-3.5 w-3.5" />
            Modo vista previa local
          </span>
        )}
      </div>

      {/* Layout de 2 columnas: Feed Social (izquierda) + Sidebar de Mapa y Centros (derecha) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Filtros superiores + Tarjetas tipo red social */}
        <div className="space-y-4 lg:col-span-7 xl:col-span-8">
          <FeedFilterBar
            filters={filters}
            onChangeFilters={setFilters}
            onResetFilters={() => setFilters(INITIAL_FILTERS)}
          />

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-64 animate-pulse rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <div className="h-4 w-1/3 rounded bg-stone-200" />
                  <div className="mt-4 h-36 rounded-xl bg-stone-100" />
                </div>
              ))}
            </div>
          ) : filteredPublications.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
              <p className="text-base font-bold text-stone-800">
                No encontramos publicaciones con esos filtros
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Prueba limpiar los filtros superiores o ampliar el radio de búsqueda.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilters(INITIAL_FILTERS)}
                  className="rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#245640]"
                >
                  Mostrar todas las publicaciones
                </button>
                <button
                  type="button"
                  onClick={loadFeedData}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Recargar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPublications.map((publication) => (
                <div
                  key={publication.id}
                  ref={(el) => {
                    cardRefs.current[publication.id] = el;
                  }}
                >
                  <PublicationCard
                    publication={publication}
                    isHighlighted={hoveredPublicationId === publication.id}
                    onHoverPublication={setHoveredPublicationId}
                    onRequestItem={onRequestItem}
                    onInspectRequests={onInspectRequests}
                    onOpenChat={onOpenChat}
                    onOpenAuthModal={onOpenAuthModal}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Sidebar de Proximidad (Mapa con círculos rojos + Centros de Donación) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <ProximitySidebar
            publications={filteredPublications}
            donationCenters={donationCenters}
            hoveredPublicationId={hoveredPublicationId}
            onSelectPublication={handleSelectPublicationFromMap}
            userApproxLocation={userApproxLocation}
          />
        </div>
      </div>
    </main>
  );
}