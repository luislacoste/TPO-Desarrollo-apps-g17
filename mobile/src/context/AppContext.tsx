import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  AuthResponse,
  BackendAuction,
  BackendMe,
  BackendMetrics,
  BackendNotification,
  BackendPaymentMethod,
  BackendCategory,
} from "../lib/api";

export type UiCategory = BackendCategory;

export interface UiAuction {
  id: string;
  title: string;
  description: string;
  category: UiCategory;
  startDate: string;
  endDate: string;
  status: "live" | "upcoming" | "ended";
  currency: "ARS" | "USD";
  itemCount: number;
  startingPrice: number;
  auctioneer: string;
}

export interface UiNotification {
  id: string;
  type: "bid" | "auction" | "payment" | "system";
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface UiPaymentMethod {
  id: string;
  type: "bank_account" | "credit_card" | "certified_check";
  name: string;
  lastFour?: string;
  bank?: string;
  verified: boolean;
  expiryDate?: string;
}

type Session = AuthResponse | null;

type AppContextValue = {
  session: Session;
  me: BackendMe | null;
  metrics: BackendMetrics | null;
  activeAuctions: UiAuction[];
  upcomingAuctions: UiAuction[];
  allAuctions: UiAuction[];
  notifications: UiNotification[];
  paymentMethods: UiPaymentMethod[];
  loading: boolean;
  authLoading: boolean;
  error: string | null;
  loginError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshPublicData: () => Promise<void>;
  refreshPrivateData: () => Promise<void>;
  registerStart: typeof api.registerStart;
  registerDocument: typeof api.registerDocument;
  registerComplete: typeof api.registerComplete;
};

const AppContext = createContext<AppContextValue | null>(null);

function formatAuctionDate(fecha: string, hora: string): Date {
  // iOS is strict with date string parsing — build from numeric parts to avoid RangeError
  const [year, month, day] = (fecha ?? "").split("-").map(Number);
  const [hours, minutes, seconds = 0] = (hora ?? "00:00").split(":").map(Number);
  const d = new Date(year, month - 1, day, hours, minutes, seconds);
  return isNaN(d.getTime()) ? new Date() : d;
}

function mapAuction(
  row: BackendAuction,
  source: "active" | "upcoming" | "list",
): UiAuction {
  const date = formatAuctionDate(row.fecha, row.hora);
  const now = new Date();
  const live = source === "active" || (row.estado === "abierta" && date <= now);
  const status =
    row.estado === "cerrada" ? "ended" : live ? "live" : "upcoming";
  const category = (row.categoria ?? "bronce") as BackendCategory;
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const descriptionParts = [
    row.subastador_nombre ? `Subastador: ${row.subastador_nombre}` : null,
    row.ubicacion ? row.ubicacion : null,
  ].filter(Boolean);

  return {
    id: String(row.id),
    title: `Subasta ${categoryLabel} #${row.id}`,
    description:
      descriptionParts.join(" · ") || "Subasta disponible en SubastAR",
    category,
    startDate: date.toISOString(),
    endDate: date.toISOString(),
    status,
    currency: row.moneda,
    itemCount: row.items_count,
    startingPrice: 0,
    auctioneer: row.subastador_nombre ?? "N/D",
  };
}

function mapNotification(row: BackendNotification): UiNotification {
  return {
    id: String(row.id),
    type: row.tipo,
    title: row.titulo ?? "Notificación",
    message: row.mensaje ?? "",
    read: row.leida,
    timestamp: row.createdAt,
  };
}

function mapPaymentMethod(row: BackendPaymentMethod): UiPaymentMethod {
  return {
    id: String(row.id),
    type: row.tipo,
    name: row.holder ?? row.bankName ?? row.checkNumber ?? "Medio de pago",
    lastFour: row.last4,
    bank: row.bankName,
    verified: row.verificado,
    expiryDate:
      row.expMonth && row.expYear
        ? `${String(row.expMonth).padStart(2, "0")}/${String(row.expYear).slice(-2)}`
        : undefined,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [me, setMe] = useState<BackendMe | null>(null);
  const [metrics, setMetrics] = useState<BackendMetrics | null>(null);
  const [activeAuctions, setActiveAuctions] = useState<UiAuction[]>([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState<UiAuction[]>([]);
  const [allAuctions, setAllAuctions] = useState<UiAuction[]>([]);
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<UiPaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const refreshPublicData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [active, upcoming, all] = await Promise.all([
        api.getActiveAuctions(),
        api.getUpcomingAuctions(),
        api.listAuctions(),
      ]);
      setActiveAuctions(active.map((row) => mapAuction(row, "active")));
      setUpcomingAuctions(upcoming.map((row) => mapAuction(row, "upcoming")));
      setAllAuctions(all.items.map((row) => mapAuction(row, "list")));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las subastas",
      );
      setActiveAuctions([]);
      setUpcomingAuctions([]);
      setAllAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrivateData = async () => {
    if (!session?.accessToken) {
      setMe(null);
      setMetrics(null);
      setNotifications([]);
      setPaymentMethods([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [user, metricsData, notificationsData, paymentMethodsData] =
        await Promise.all([
          api.getMe(session.accessToken),
          api.getMyMetrics(session.accessToken),
          api.getNotifications(session.accessToken),
          api.getPaymentMethods(session.accessToken),
        ]);
      setMe(user);
      setMetrics(metricsData);
      setNotifications(notificationsData.map(mapNotification));
      setPaymentMethods(paymentMethodsData.map(mapPaymentMethod));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los datos de tu cuenta",
      );
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    setLoginError(null);
    try {
      const auth = await api.login(email, password);
      setSession(auth);

      const [user, metricsData, notificationsData, paymentMethodsData] =
        await Promise.all([
          api.getMe(auth.accessToken),
          api.getMyMetrics(auth.accessToken),
          api.getNotifications(auth.accessToken),
          api.getPaymentMethods(auth.accessToken),
        ]);

      setMe(user);
      setMetrics(metricsData);
      setNotifications(notificationsData.map(mapNotification));
      setPaymentMethods(paymentMethodsData.map(mapPaymentMethod));
      await refreshPublicData();
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión",
      );
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setSession(null);
    setMe(null);
    setMetrics(null);
    setNotifications([]);
    setPaymentMethods([]);
    setLoginError(null);
  };

  useEffect(() => {
    refreshPublicData();
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      session,
      me,
      metrics,
      activeAuctions,
      upcomingAuctions,
      allAuctions,
      notifications,
      paymentMethods,
      loading,
      authLoading,
      error,
      loginError,
      login,
      logout,
      refreshPublicData,
      refreshPrivateData,
      registerStart: api.registerStart,
      registerDocument: api.registerDocument,
      registerComplete: api.registerComplete,
    }),
    [
      session,
      me,
      metrics,
      activeAuctions,
      upcomingAuctions,
      allAuctions,
      notifications,
      paymentMethods,
      loading,
      authLoading,
      error,
      loginError,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppData must be used inside AppProvider");
  return value;
}
