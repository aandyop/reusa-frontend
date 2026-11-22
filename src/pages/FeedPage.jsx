import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  PackageOpen,
  HeartHandshake,
  Calendar,
  BookOpen,
  Users,
  Layers,
  MapPin,
  Sparkles,
  ShieldCheck,
  Plus,
  Tag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { publicationsService } from "../services/publicationsService";
import {
  donationCentersService,
  eventsService,
  blogService,
} from "../services/centersEventsBlogService";
import FeedFilterBar from "../components/feed/FeedFilterBar";
import PublicationCard from "../components/feed/PublicationCard";
import PublicationDetailView from "../components/feed/PublicationDetailView";
import EventDetailView from "../components/events/EventDetailView";
import CreateEventForm from "../components/events/CreateEventForm";
import BlogDetailView from "../components/blog/BlogDetailView";
import CreateBlogForm from "../components/blog/CreateBlogForm";
import ProximitySidebar from "../components/sidebar/ProximitySidebar";

const PRIMARY_GREEN = "#2d6a4f";
const TERRACOTTA_BADGE = "#E76F51";

const INITIAL_FILTERS = {
  search: "",
  category: "",
  modality: "",
  condition: "",
  sizeScale: "",
  onlyStreetItems: false,
};

const STORAGE_KEYS = {
  publications: "reusa_publications_cache",
  centers: "reusa_centers_cache",
  events: "reusa_events_cache",
  blog: "reusa_blog_cache",
  users: "reusa_users_cache",
  favorites: "reusa_favorites_cache",
};

const FALLBACK_USERS = [
  {
    id: "usr-001",
    nickname: "NomadaVerde",
    role: "user",
    is_verified: true,
    re_points: 120,
    zone_name: "Campo Alegre · Valera",
  },
  {
    id: "usr-002",
    nickname: "LiderSostenible",
    role: "releader",
    is_verified: true,
    re_points: 340,
    zone_name: "Centro de Valera",
  },
  {
    id: "usr-003",
    nickname: "TallerRaiz",
    role: "releader",
    is_verified: true,
    re_points: 275,
    zone_name: "La Beatriz · Valera",
  },
  {
    id: "usr-005",
    nickname: "HogarSegundoCiclo",
    role: "user",
    is_verified: true,
    re_points: 185,
    zone_name: "El Country · Valera",
  },
];

// Publicaciones iniciales ubicadas en Valera, Estado Trujillo
const FALLBACK_PUBLICATIONS = [
  {
    id: "pub-101",
    author_id: "usr-002",
    author_nickname: "LiderSostenible",
    author_role: "releader",
    author_is_verified: true,
    author_re_points: 340,
    title: "Sofá de dos puestos en tela gris",
    description:
      "Sofá cómodo de sala, estructura firme y tapizado limpio. Se entrega por mudanza a piso más pequeño en Valera.",
    images: [],
    category: "Mobiliario",
    item_condition: "Buen estado",
    modality: "Donación",
    trade_preference: null,
    size_scale: "XL",
    availability: "Hora y fecha por acordar",
    tags: ["Transporte necesario"],
    status: "DISPONIBLE",
    zone_name: "Centro de Valera · Av. Bolívar",
    lat: 9.3188,
    lng: -70.6042,
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
    author_re_points: 120,
    title: "Mesa auxiliar de madera y lámpara de pie",
    description:
      "Ideal para rincón de lectura en Valera. La lámpara solo necesita cambiar el bombillo; la mesa está lista.",
    images: [],
    category: "Decoración y Hogar",
    item_condition: "Requiere reparación menor",
    modality: "Trueque",
    trade_preference: "Macetas de barro o plantas de interior",
    size_scale: "M",
    availability: "Horario flexible",
    tags: ["Traer cajas o bolsas"],
    status: "DISPONIBLE",
    zone_name: "Urb. Las Acacias · Valera",
    lat: 9.3154,
    lng: -70.6078,
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
    author_re_points: 275,
    title: "Tablones de pino y bisagras para restaurar",
    description:
      "Lote de madera recuperada de una estantería antigua en Valera, excelente para proyectos de carpintería o repisas.",
    images: [],
    category: "Para Restaurar / Materiales",
    item_condition: "Solo para piezas / Restauración",
    modality: "Donación",
    trade_preference: null,
    size_scale: "L",
    availability: "Tardes (1:00 PM - 6:00 PM)",
    tags: ["Está en la calle", "Transporte necesario"],
    status: "DISPONIBLE",
    zone_name: "Sector La Beatriz · Valera",
    lat: 9.3119,
    lng: -70.6132,
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
    author_re_points: 185,
    title: "Microondas doméstico funcional",
    description:
      "Calienta rápido, plato giratorio intacto y luz interior operativa. Se entrega con bandeja en Valera.",
    images: [],
    category: "Electrodomésticos y Línea Blanca",
    item_condition: "Como nuevo",
    modality: "Donación",
    trade_preference: null,
    size_scale: "M",
    availability: "Hora y fecha por acordar",
    tags: ["Traer cajas o bolsas"],
    status: "RESERVADO",
    approved_applicant_id: "usr-001",
    zone_name: "El Country · Valera",
    lat: 9.3221,
    lng: -70.5998,
    radius_meters: 300,
    re_points_reward: 35,
    pending_requests_count: 0,
    created_at: "2026-11-19T11:40:00Z",
  },
];

// Centros de donación en Valera, Estado Trujillo (incluyendo Centro de Acopio para La Guaira)
const FALLBACK_CENTERS = [
  {
    id: "dc-01",
    name: "Centro de Acopio para La Guaira",
    center_type: "Centro de Acopio",
    schedule_hours: "Lun a Vie · 08:30 AM - 04:00 PM",
    accepted_categories: "Mobiliario, Decoración y Hogar, Ropa y Textiles",
    zone_name: "Centro de Valera",
    lat: 9.3181,
    lng: -70.6039,
  },
  {
    id: "dc-02",
    name: "Fundación Hogar Trujillo · Valera",
    center_type: "Fundación Social",
    schedule_hours: "Mar a Sáb · 09:00 AM - 03:00 PM",
    accepted_categories: "Electrodomésticos, Juguetes, Tecnología y Oficina",
    zone_name: "Las Acacias · Valera",
    lat: 9.3162,
    lng: -70.6064,
  },
  {
    id: "dc-03",
    name: "Taller Comunitario La Beatriz · Valera",
    center_type: "Taller de Restauración",
    schedule_hours: "Mié a Dom · 10:00 AM - 05:00 PM",
    accepted_categories: "Para Restaurar / Materiales, Mobiliario",
    zone_name: "La Beatriz · Valera",
    lat: 9.3128,
    lng: -70.6118,
  },
];

const FALLBACK_EVENTS = [
  {
    id: "evt-201",
    title: "Jornada de Clasificación y Empaque Solidario",
    description:
      "Organización de ropa, calzado, abrigo y artículos para el hogar destinados a familias afectadas y puntos de apoyo.",
    content:
      "Nos reuniremos en el punto de encuentro para revisar prendas limpias, emparejar calzado, etiquetar cajas por tamaño y preparar los lotes para su traslado. Si puedes, lleva cinta de embalaje, marcadores o bolsas resistentes.",
    cover_image: null,
    organizer_nickname: "LiderSostenible",
    zone_name: "Centro de Valera",
    lat: 9.3188,
    lng: -70.6042,
    event_date: "2026-11-26T10:00:00Z",
    event_time: "10:00",
    expected_attendance: 25,
    participants_count: 14,
  },
  {
    id: "evt-202",
    title: "Taller de Reparación y Segundo Ciclo de Muebles",
    description:
      "Encuentro vecinal para lijar, encolar y recuperar sillas, mesas y piezas de madera antes de entregarlas.",
    content:
      "Compartiremos técnicas básicas de restauración de madera, ajuste de bisagras y acabado protector para dar una segunda vida útil a muebles comunitarios. Habrá herramientas básicas disponibles y espacio para trabajar en equipo.",
    cover_image: null,
    organizer_nickname: "TallerRaiz",
    zone_name: "La Beatriz · Valera",
    lat: 9.3119,
    lng: -70.6132,
    event_date: "2026-11-29T14:00:00Z",
    event_time: "14:00",
    expected_attendance: 18,
    participants_count: 9,
  },
];

const FALLBACK_BLOGS = [
  {
    id: "blg-301",
    title: "Cómo preparar un artículo para donación o trueque seguro",
    excerpt:
      "Revisa limpieza, piezas completas, medidas aproximadas y coordinación responsable por chat para que cada entrega llegue lista a su próximo hogar.",
    content:
      "Antes de publicar un artículo en ReUsa, dedica unos minutos a limpiarlo, verificar que incluya sus piezas o accesorios esenciales y tomar fotos claras con buena luz.\n\nIndicar las medidas aproximadas, el estado real y la disponibilidad horaria evita malentendidos y agiliza la coordinación con la persona interesada.\n\nPor último, acuerda siempre los detalles de entrega dentro del chat de la plataforma y prioriza puntos de encuentro seguros o áreas de referencia.",
    cover_image: null,
    tags: ["Donaciones", "Trueque", "Hogar"],
    author_nickname: "NomadaVerde",
    created_at: "2026-11-18T16:00:00Z",
  },
  {
    id: "blg-302",
    title: "Reutilización local y apoyo comunitario en momentos críticos",
    excerpt:
      "Clasificar lo que ya no usas y canalizarlo a través de centros verificados y redes vecinales acelera la ayuda donde más se necesita.",
    content:
      "Cuando ocurre una emergencia o una familia atraviesa un cambio repentino de vivienda, la solidaridad local marca una diferencia inmediata.\n\nRevisar el hogar para separar mobiliario funcional, ropa de abrigo en buen estado, utensilios y materiales útiles permite canalizar recursos reales sin generar saturación innecesaria.\n\nAl trabajar de forma organizada entre vecinos y centros de acopio, cada entrega se vuelve más rápida, trazable y humana.",
    cover_image: null,
    tags: ["Comunidad", "Reutilización", "Sostenibilidad"],
    author_nickname: "HogarSegundoCiclo",
    created_at: "2026-11-20T09:30:00Z",
  },
];

function readLocalArray(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (Array.isArray(parsed?.data) && parsed.data.length > 0)
      return parsed.data;
    return fallback;
  } catch {
    return fallback;
  }
}

function writeLocalArray(key, value) {
  try {
    if (Array.isArray(value)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignorar errores de cuota o almacenamiento privado
  }
}

function extractList(res, nestedKey) {
  if (Array.isArray(res)) return res;
  if (nestedKey && Array.isArray(res?.[nestedKey])) return res[nestedKey];
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.publications)) return res.publications;
  if (Array.isArray(res?.centers)) return res.centers;
  if (Array.isArray(res?.events)) return res.events;
  if (Array.isArray(res?.posts)) return res.posts;
  if (Array.isArray(res?.blog)) return res.blog;
  if (Array.isArray(res?.users)) return res.users;
  return [];
}

export default function FeedPage({
  externalNewPublication = null,
  unreadChatCount = 0,
  onRequestItem,
  onInspectRequests,
  onOpenChat,
  onOpenAuthModal,
  onOpenDonorProfile,
}) {
  const { token, user, isAuthenticated } = useAuth();

  const [feedTab, setFeedTab] = useState("all"); // "all" | "publications" | "events" | "blog" | "users"
  const [publications, setPublications] = useState(() =>
    readLocalArray(STORAGE_KEYS.publications, FALLBACK_PUBLICATIONS)
  );
  const [donationCenters, setDonationCenters] = useState(() =>
    readLocalArray(STORAGE_KEYS.centers, FALLBACK_CENTERS)
  );
  const [events, setEvents] = useState(() =>
    readLocalArray(STORAGE_KEYS.events, FALLBACK_EVENTS)
  );
  const [blogPosts, setBlogPosts] = useState(() =>
    readLocalArray(STORAGE_KEYS.blog, FALLBACK_BLOGS)
  );
  const [communityUsers, setCommunityUsers] = useState(() =>
    readLocalArray(STORAGE_KEYS.users, FALLBACK_USERS)
  );
  const [favoriteIds, setFavoriteIds] = useState(() =>
    readLocalArray(STORAGE_KEYS.favorites, [])
  );

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [hoveredPubId, setHoveredPubId] = useState(null);
  const [selectedPubId, setSelectedPubId] = useState(null);

  // Vistas individuales normales
  const [activePublicationId, setActivePublicationId] = useState(null);
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeBlogId, setActiveBlogId] = useState(null);

  // Formularios integrados para crear evento o artículo desde sus pestañas
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [showCreateBlogForm, setShowCreateBlogForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    const localPubs = readLocalArray(
      STORAGE_KEYS.publications,
      FALLBACK_PUBLICATIONS
    );
    const localCenters = readLocalArray(
      STORAGE_KEYS.centers,
      FALLBACK_CENTERS
    );
    const localEvents = readLocalArray(STORAGE_KEYS.events, FALLBACK_EVENTS);
    const localBlog = readLocalArray(STORAGE_KEYS.blog, FALLBACK_BLOGS);
    const localUsers = readLocalArray(STORAGE_KEYS.users, FALLBACK_USERS);

    const [pubsSettled, centersSettled, eventsSettled, blogSettled] =
      await Promise.allSettled([
        publicationsService.getFeed({}, token),
        donationCentersService.getAll(token),
        eventsService.getAll(token),
        blogService.getAll(token),
      ]);

    let fallbackTriggered = false;

    const apiPubs =
      pubsSettled.status === "fulfilled"
        ? extractList(pubsSettled.value, "publications")
        : [];
    if (pubsSettled.status === "rejected" || apiPubs.length === 0) {
      fallbackTriggered = true;
    }
    const finalPubs = apiPubs.length > 0 ? apiPubs : localPubs;
    setPublications(finalPubs);
    writeLocalArray(STORAGE_KEYS.publications, finalPubs);

    const apiCenters =
      centersSettled.status === "fulfilled"
        ? extractList(centersSettled.value, "centers")
        : [];
    if (centersSettled.status === "rejected" || apiCenters.length === 0) {
      fallbackTriggered = true;
    }
    const finalCenters = apiCenters.length > 0 ? apiCenters : localCenters;
    setDonationCenters(finalCenters);
    writeLocalArray(STORAGE_KEYS.centers, finalCenters);

    const apiEvents =
      eventsSettled.status === "fulfilled"
        ? extractList(eventsSettled.value, "events")
        : [];
    if (eventsSettled.status === "rejected" || apiEvents.length === 0) {
      fallbackTriggered = true;
    }
    const finalEvents = apiEvents.length > 0 ? apiEvents : localEvents;
    setEvents(finalEvents);
    writeLocalArray(STORAGE_KEYS.events, finalEvents);

    const apiBlog =
      blogSettled.status === "fulfilled"
        ? extractList(blogSettled.value, "posts")
        : [];
    if (blogSettled.status === "rejected" || apiBlog.length === 0) {
      fallbackTriggered = true;
    }
    const finalBlog = apiBlog.length > 0 ? apiBlog : localBlog;
    setBlogPosts(finalBlog);
    writeLocalArray(STORAGE_KEYS.blog, finalBlog);

    const userMap = new Map();
    [...localUsers, ...FALLBACK_USERS].forEach((u) => {
      const key = u.nickname || u.id;
      if (key) {
        userMap.set(key, {
          id: u.id || key,
          nickname: u.nickname || key,
          role: u.role || "user",
          is_verified: u.is_verified !== false,
          re_points: u.re_points ?? u.rePoints ?? 50,
          zone_name: u.zone_name || u.approx_zone_name || "Valera, Trujillo",
        });
      }
    });

    finalPubs.forEach((p) => {
      const nick = p.author_nickname;
      if (nick && !userMap.has(nick)) {
        userMap.set(nick, {
          id: p.author_id || nick,
          nickname: nick,
          role: p.author_role || "user",
          is_verified: p.author_is_verified !== false,
          re_points: p.author_re_points ?? 100,
          zone_name: p.zone_name || "Valera, Trujillo",
        });
      }
    });

    if (user?.nickname) {
      userMap.set(user.nickname, {
        id: user.id || user.nickname,
        nickname: user.nickname,
        role: user.role || "user",
        is_verified: Boolean(user.is_verified),
        re_points: user.re_points ?? user.rePoints ?? 0,
        zone_name: user.approx_zone_name || user.zone_name || "Valera, Trujillo",
      });
    }

    const finalUsers = Array.from(userMap.values());
    setCommunityUsers(finalUsers);
    writeLocalArray(STORAGE_KEYS.users, finalUsers);

    setUsingFallback(fallbackTriggered);
    setLoading(false);
  }, [token, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!externalNewPublication) return;
    setPublications((prev) => {
      const exists = prev.some((item) => item.id === externalNewPublication.id);
      const next = exists ? prev : [externalNewPublication, ...prev];
      writeLocalArray(STORAGE_KEYS.publications, next);
      return next;
    });
    setSelectedPubId(externalNewPublication.id);
  }, [externalNewPublication]);

  const activePublication = useMemo(() => {
    if (!activePublicationId) return null;
    return publications.find((p) => p.id === activePublicationId) || null;
  }, [activePublicationId, publications]);

  const activeEvent = useMemo(() => {
    if (!activeEventId) return null;
    return events.find((e) => e.id === activeEventId) || null;
  }, [activeEventId, events]);

  const activeBlog = useMemo(() => {
    if (!activeBlogId) return null;
    return blogPosts.find((b) => b.id === activeBlogId) || null;
  }, [activeBlogId, blogPosts]);

  const clearIndividualViews = useCallback(() => {
    setActivePublicationId(null);
    setActiveEventId(null);
    setActiveBlogId(null);
  }, []);

  const handleSelectFeedTab = useCallback(
    (tabId) => {
      clearIndividualViews();
      setFeedTab(tabId);
      if (tabId !== "events") setShowCreateEventForm(false);
      if (tabId !== "blog") setShowCreateBlogForm(false);
    },
    [clearIndividualViews]
  );

  const handleToggleFavorite = useCallback((pub) => {
    if (!pub?.id) return;
    setFavoriteIds((prev) => {
      const exists = prev.includes(pub.id);
      const next = exists
        ? prev.filter((itemId) => itemId !== pub.id)
        : [...prev, pub.id];
      writeLocalArray(STORAGE_KEYS.favorites, next);
      return next;
    });
  }, []);

  const handleOpenPublicationDetail = useCallback((pub) => {
    if (!pub?.id) return;
    setActiveEventId(null);
    setActiveBlogId(null);
    setSelectedPubId(pub.id);
    setActivePublicationId(pub.id);
  }, []);

  const handleOpenEventDetail = useCallback((evt) => {
    if (!evt?.id) return;
    setActivePublicationId(null);
    setActiveBlogId(null);
    setShowCreateEventForm(false);
    setActiveEventId(evt.id);
  }, []);

  const handleOpenBlogDetail = useCallback((post) => {
    if (!post?.id) return;
    setActivePublicationId(null);
    setActiveEventId(null);
    setShowCreateBlogForm(false);
    setActiveBlogId(post.id);
  }, []);

  const handleEventCreated = useCallback((newEvt) => {
    setEvents((prev) => {
      const next = [newEvt, ...prev];
      writeLocalArray(STORAGE_KEYS.events, next);
      return next;
    });
    setShowCreateEventForm(false);
    setActiveEventId(newEvt.id);
  }, []);

  const handleBlogCreated = useCallback((newPost) => {
    setBlogPosts((prev) => {
      const next = [newPost, ...prev];
      writeLocalArray(STORAGE_KEYS.blog, next);
      return next;
    });
    setShowCreateBlogForm(false);
    setActiveBlogId(newPost.id);
  }, []);

  const handleJoinEvent = useCallback((joinedEvt) => {
    if (!joinedEvt?.id) return;
    setEvents((prev) => {
      const next = prev.map((item) =>
        item.id === joinedEvt.id
          ? { ...item, participants_count: (item.participants_count || 1) + 1 }
          : item
      );
      writeLocalArray(STORAGE_KEYS.events, next);
      return next;
    });
  }, []);

  const matchesSearch = useCallback(
    (texts = []) => {
      const query = filters.search.trim().toLowerCase();
      if (!query) return true;
      return texts.some(
        (t) => typeof t === "string" && t.toLowerCase().includes(query)
      );
    },
    [filters.search]
  );

  // Filtrado reactivo y exclusión estricta de artículos ENTREGADO en el feed principal
  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      if (pub.status === "ENTREGADO") return false;

      if (
        !matchesSearch([
          pub.title,
          pub.description,
          pub.zone_name,
          pub.author_nickname,
        ])
      ) {
        return false;
      }

      if (filters.category && pub.category !== filters.category) {
        return false;
      }

      if (filters.modality && pub.modality !== filters.modality) {
        return false;
      }

      if (filters.condition && pub.item_condition !== filters.condition) {
        return false;
      }

      if (filters.sizeScale && pub.size_scale !== filters.sizeScale) {
        return false;
      }

      if (filters.onlyStreetItems) {
        const tags = Array.isArray(pub.tags) ? pub.tags : [];
        if (!tags.includes("Está en la calle")) return false;
      }

      return true;
    });
  }, [publications, filters, matchesSearch]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) =>
      matchesSearch([
        evt.title,
        evt.description,
        evt.content,
        evt.zone_name,
        evt.organizer_nickname,
      ])
    );
  }, [events, matchesSearch]);

  const filteredBlogs = useMemo(() => {
    return blogPosts.filter((post) =>
      matchesSearch([
        post.title,
        post.excerpt,
        post.content,
        post.author_nickname,
      ])
    );
  }, [blogPosts, matchesSearch]);

  const filteredUsers = useMemo(() => {
    return communityUsers.filter((u) =>
      matchesSearch([u.nickname, u.zone_name, u.role])
    );
  }, [communityUsers, matchesSearch]);

  const totalVisibleItems = useMemo(() => {
    if (feedTab === "publications") return filteredPublications.length;
    if (feedTab === "events") return filteredEvents.length;
    if (feedTab === "blog") return filteredBlogs.length;
    if (feedTab === "users") return filteredUsers.length;
    return (
      filteredPublications.length +
      filteredEvents.length +
      filteredBlogs.length +
      filteredUsers.length
    );
  }, [
    feedTab,
    filteredPublications.length,
    filteredEvents.length,
    filteredBlogs.length,
    filteredUsers.length,
  ]);

  const handleSelectPublicationFromMap = useCallback(
    (pub) => {
      if (!pub?.id) return;
      handleOpenPublicationDetail(pub);
    },
    [handleOpenPublicationDetail]
  );

  const userApproxLocation = useMemo(() => {
    if (user?.approx_lat && user?.approx_lng) {
      return {
        lat: Number(user.approx_lat),
        lng: Number(user.approx_lng),
      };
    }
    return null;
  }, [user]);

  const showPublications = feedTab === "all" || feedTab === "publications";
  const showEvents = feedTab === "all" || feedTab === "events";
  const showBlogs = feedTab === "all" || feedTab === "blog";
  const showUsers = feedTab === "all" || feedTab === "users";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Mensaje solidario de los afectados por el terremoto del 24 de junio en color terracota (#E76F51) */}
      <div
        style={{
          borderColor: "rgba(231, 111, 81, 0.35)",
          backgroundColor: "rgba(231, 111, 81, 0.10)",
        }}
        className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border px-4 py-3.5 text-xs leading-relaxed text-stone-700 sm:flex-row sm:items-center"
      >
        <div className="flex items-start gap-2.5">
          <HeartHandshake
            style={{ color: TERRACOTTA_BADGE }}
            className="mt-0.5 h-5 w-5 shrink-0"
          />
          <div>
            <p
              style={{ color: TERRACOTTA_BADGE }}
              className="text-sm font-extrabold"
            >
              Dona a las víctimas del terremoto del 24 de Junio.
            </p>
            <p className="mt-0.5 text-xs text-stone-700">
              Súmate a la solidaridad comunitaria aportando mobiliario, ropa en
              buen estado, abrigo, utensilios o artículos útiles que hoy pueden
              aliviar a las familias afectadas y ayudar a reconstruir sus
              hogares. Todo se coordina bajo tu{" "}
              <strong className="font-semibold text-stone-900">
                @nickname
              </strong>{" "}
              y con ubicaciones aproximadas en el mapa para proteger la
              privacidad de cada vecino.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {unreadChatCount > 0 && onOpenChat && (
            <button
              type="button"
              style={{ backgroundColor: PRIMARY_GREEN }}
              onClick={onOpenChat}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold text-white transition hover:opacity-90"
            >
              <span>Chat</span>
              <span
                style={{ backgroundColor: TERRACOTTA_BADGE }}
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold text-white"
              >
                {unreadChatCount}
              </span>
            </button>
          )}

          {usingFallback && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
              Datos locales / respaldo
            </span>
          )}
        </div>
      </div>

      {/* Vistas individuales normales para Publicación, Evento o Artículo de Blog */}
      {activePublication ? (
        <PublicationDetailView
          publication={activePublication}
          allPublications={publications}
          currentUser={user}
          isFavorite={favoriteIds.includes(activePublication.id)}
          onToggleFavorite={handleToggleFavorite}
          onSelectPublication={handleOpenPublicationDetail}
          onOpenDonorProfile={onOpenDonorProfile}
          onRequestItem={onRequestItem}
          onInspectRequests={onInspectRequests}
          onOpenChat={onOpenChat}
          onBackToFeed={clearIndividualViews}
        />
      ) : activeEvent ? (
        <EventDetailView
          eventItem={activeEvent}
          allEvents={events}
          onSelectEvent={handleOpenEventDetail}
          onJoinEvent={handleJoinEvent}
          onBack={() => {
            setActiveEventId(null);
            setFeedTab("events");
          }}
        />
      ) : activeBlog ? (
        <BlogDetailView
          post={activeBlog}
          allPosts={blogPosts}
          onSelectPost={handleOpenBlogDetail}
          onBack={() => {
            setActiveBlogId(null);
            setFeedTab("blog");
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section
            aria-label="Feed de publicaciones comunitarias"
            className="space-y-4 lg:col-span-8"
          >
            {/* Pestañas integradas para ver todo o filtrar Publicaciones, Eventos, Blog y Usuarios */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200/90 bg-white p-2 shadow-2xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  {
                    id: "all",
                    label: "Todo el Feed",
                    icon: Layers,
                    count:
                      filteredPublications.length +
                      filteredEvents.length +
                      filteredBlogs.length +
                      filteredUsers.length,
                  },
                  {
                    id: "publications",
                    label: "Publicaciones",
                    icon: PackageOpen,
                    count: filteredPublications.length,
                  },
                  {
                    id: "events",
                    label: "Eventos",
                    icon: Calendar,
                    count: filteredEvents.length,
                  },
                  {
                    id: "blog",
                    label: "Blog",
                    icon: BookOpen,
                    count: filteredBlogs.length,
                  },
                  {
                    id: "users",
                    label: "Comunidad",
                    icon: Users,
                    count: filteredUsers.length,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = feedTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSelectFeedTab(tab.id)}
                      style={{ backgroundColor: PRIMARY_GREEN }}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition ${
                        active
                          ? "shadow-xs ring-2 ring-emerald-200"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] text-white">
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Acciones rápidas según pestaña de Eventos o Blog */}
              <div className="flex items-center gap-1.5">
                {feedTab === "events" && (
                  <button
                    type="button"
                    style={{ backgroundColor: PRIMARY_GREEN }}
                    onClick={() => setShowCreateEventForm((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-extrabold text-white transition hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      {showCreateEventForm ? "Ocultar" : "Crear evento"}
                    </span>
                  </button>
                )}

                {feedTab === "blog" && (
                  <button
                    type="button"
                    style={{ backgroundColor: PRIMARY_GREEN }}
                    onClick={() => setShowCreateBlogForm((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-extrabold text-white transition hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      {showCreateBlogForm ? "Ocultar" : "Nuevo artículo"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {feedTab === "events" && showCreateEventForm && (
              <CreateEventForm
                currentUser={user}
                onCancel={() => setShowCreateEventForm(false)}
                onEventCreated={handleEventCreated}
              />
            )}

            {feedTab === "blog" && showCreateBlogForm && (
              <CreateBlogForm
                currentUser={user}
                onCancel={() => setShowCreateBlogForm(false)}
                onBlogCreated={handleBlogCreated}
              />
            )}

            <FeedFilterBar
              filters={filters}
              onChangeFilters={setFilters}
              onResetFilters={() => setFilters(INITIAL_FILTERS)}
              totalResults={totalVisibleItems}
            />

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="h-52 animate-pulse rounded-2xl border border-stone-200 bg-white p-5"
                  >
                    <div className="h-4 w-1/3 rounded-md bg-stone-200" />
                    <div className="mt-3 h-5 w-2/3 rounded-md bg-stone-200" />
                    <div className="mt-2 h-16 w-full rounded-xl bg-stone-100" />
                  </div>
                ))}
              </div>
            ) : totalVisibleItems === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
                <PackageOpen className="h-10 w-10 text-stone-400" />
                <h3 className="mt-3 text-base font-bold text-stone-900">
                  No hay elementos que coincidan con estos filtros
                </h3>
                <p className="mt-1 max-w-md text-xs text-stone-500">
                  Prueba limpiando algún filtro, cambiando de pestaña o
                  recargando el feed.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    style={{ backgroundColor: PRIMARY_GREEN }}
                    onClick={() => {
                      setFeedTab("all");
                      setFilters(INITIAL_FILTERS);
                    }}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    Limpiar filtros
                  </button>
                  <button
                    type="button"
                    style={{ backgroundColor: PRIMARY_GREEN }}
                    onClick={loadData}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Recargar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Publicaciones */}
                {showPublications && filteredPublications.length > 0 && (
                  <div className="space-y-4">
                    {feedTab === "all" && (
                      <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-stone-700">
                        <PackageOpen
                          style={{ color: PRIMARY_GREEN }}
                          className="h-4 w-4"
                        />
                        Publicaciones disponibles y reservadas
                      </h2>
                    )}

                    {filteredPublications.map((pub) => (
                      <div key={pub.id} id={`publication-card-${pub.id}`}>
                        <PublicationCard
                          publication={pub}
                          currentUser={user}
                          isHighlighted={
                            hoveredPubId === pub.id || selectedPubId === pub.id
                          }
                          onHoverChange={setHoveredPubId}
                          onSelectPublication={handleOpenPublicationDetail}
                          onRequestItem={onRequestItem}
                          onInspectRequests={onInspectRequests}
                          onOpenChat={onOpenChat}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Eventos comunitarios (con imagen principal y clic a vista individual) */}
                {showEvents && filteredEvents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-stone-700">
                        <Calendar
                          style={{ color: PRIMARY_GREEN }}
                          className="h-4 w-4"
                        />
                        Eventos comunitarios
                      </h2>
                      {feedTab === "all" && (
                        <button
                          type="button"
                          onClick={() => handleSelectFeedTab("events")}
                          className="text-xs font-bold text-[#2d6a4f] hover:underline"
                        >
                          Ver sección de eventos →
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {filteredEvents.map((evt) => (
                        <article
                          key={evt.id}
                          onClick={() => handleOpenEventDetail(evt)}
                          className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs transition hover:border-[#2d6a4f] hover:shadow-sm"
                        >
                          {evt.cover_image && (
                            <div className="h-36 w-full bg-stone-100">
                              <img
                                src={evt.cover_image}
                                alt={evt.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
                              <span
                                style={{ color: PRIMARY_GREEN }}
                                className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold"
                              >
                                Evento
                              </span>
                              <span>
                                {evt.event_date
                                  ? new Date(
                                      evt.event_date
                                    ).toLocaleDateString("es-VE", {
                                      day: "numeric",
                                      month: "short",
                                    })
                                  : "Próximamente"}
                              </span>
                            </div>

                            <h3 className="mt-2 text-sm font-extrabold text-stone-900">
                              {evt.title}
                            </h3>

                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
                              {evt.description}
                            </p>

                            <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
                              <span className="inline-flex items-center gap-1">
                                <MapPin
                                  style={{ color: PRIMARY_GREEN }}
                                  className="h-3 w-3"
                                />
                                {evt.zone_name || "Valera"}
                              </span>
                              <span className="font-bold text-[#2d6a4f]">
                                Ver evento →
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Artículos del Blog (con imagen principal, etiquetas en terracota y clic a vista individual) */}
                {showBlogs && filteredBlogs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-stone-700">
                        <BookOpen
                          style={{ color: PRIMARY_GREEN }}
                          className="h-4 w-4"
                        />
                        Blog y guías de reutilización
                      </h2>
                      {feedTab === "all" && (
                        <button
                          type="button"
                          onClick={() => handleSelectFeedTab("blog")}
                          className="text-xs font-bold text-[#2d6a4f] hover:underline"
                        >
                          Ir al blog →
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {filteredBlogs.map((post) => (
                        <article
                          key={post.id}
                          onClick={() => handleOpenBlogDetail(post)}
                          className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs transition hover:border-[#2d6a4f] hover:shadow-sm"
                        >
                          {post.cover_image && (
                            <div className="h-36 w-full bg-stone-100">
                              <img
                                src={post.cover_image}
                                alt={post.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}

                          <div className="p-4">
                            <span
                              style={{ color: PRIMARY_GREEN }}
                              className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase"
                            >
                              Blog
                            </span>

                            <h3 className="mt-2 text-sm font-extrabold text-stone-900">
                              {post.title}
                            </h3>

                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
                              {post.excerpt || post.content}
                            </p>

                            {Array.isArray(post.tags) && post.tags.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {post.tags.slice(0, 3).map((tagItem) => (
                                  <span
                                    key={tagItem}
                                    style={{
                                      backgroundColor:
                                        "rgba(231, 111, 81, 0.14)",
                                      color: TERRACOTTA_BADGE,
                                      borderColor: "rgba(231, 111, 81, 0.35)",
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                                  >
                                    <Tag className="h-2.5 w-2.5" />
                                    {tagItem}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] text-stone-500">
                              <span>
                                Por @{post.author_nickname || "editor_reusa"}
                              </span>
                              <span className="font-bold text-[#2d6a4f]">
                                Leer artículo →
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Usuarios / Comunidad */}
                {showUsers && filteredUsers.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-stone-700">
                      <Users
                        style={{ color: PRIMARY_GREEN }}
                        className="h-4 w-4"
                      />
                      Miembros activos de la comunidad
                    </h2>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {filteredUsers.map((member) => (
                        <div
                          key={member.id || member.nickname}
                          className="flex items-center justify-between rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              style={{ color: PRIMARY_GREEN }}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold"
                            >
                              {String(member.nickname)
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-stone-900">
                                  @{member.nickname}
                                </span>
                                {member.is_verified && (
                                  <ShieldCheck
                                    style={{ color: PRIMARY_GREEN }}
                                    className="h-3.5 w-3.5"
                                  />
                                )}
                                {member.role === "releader" && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-stone-900 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    ReLeader
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-500">
                                {member.zone_name}
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-stone-800 ring-1 ring-amber-200">
                            {member.re_points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="lg:col-span-4">
            <ProximitySidebar
              publications={filteredPublications}
              donationCenters={donationCenters}
              hoveredPublicationId={hoveredPubId}
              onSelectPublication={handleSelectPublicationFromMap}
              userApproxLocation={userApproxLocation}
            />
          </div>
        </div>
      )}
    </main>
  );
}