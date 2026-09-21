import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users, restaurants, subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const COOKIE_NAME = "wasteflow_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "wasteflow-production-session-secret-key-998877665544332211"
);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "staff";
  canManageChecklists?: boolean;
  restaurantId?: string;
  businessName?: string;
  isImpersonating?: boolean;
  impersonatorAdminId?: string;
}

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: "superadmin" | "admin" | "staff";
    canManageChecklists?: boolean;
  };
  restaurant?: {
    id: string;
    businessName: string;
    accountStatus: string;
    onboardingCompleted: boolean;
    shiftsEnabled: boolean;
    shiftNames: string[];
    responsibleAreas: string[];
    currency: string;
    timezone: string;
  };
  subscription?: {
    id: string;
    status: string;
    planType: string;
    amount: string;
    currentPeriodEnd: Date;
  };
  isDeactivated: boolean;
  isSubscriptionActive: boolean;
  canAccessApp: boolean;
  blockReason?: "deactivated" | "subscription_inactive";
  isImpersonating?: boolean;
  impersonatorAdminId?: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch (err) {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // Ensures session works reliably on http/localhost and https
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60, // 365 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const session = await getSession();
    if (!session) return null;

    // Super Admin bypass
    if (session.role === "superadmin") {
      return {
        user: {
          id: session.userId,
          email: session.email,
          name: session.name,
          role: "superadmin",
        },
        isDeactivated: false,
        isSubscriptionActive: true,
        canAccessApp: true,
      };
    }

    // Fetch full live user state
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!userRecord || userRecord.status !== "active" || !userRecord.restaurantId) {
      return null;
    }

    // Fetch restaurant details
    const [restaurantRecord] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, userRecord.restaurantId))
      .limit(1);

    if (!restaurantRecord) {
      return null;
    }

    // Fetch active subscription
    const [latestSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.restaurantId, restaurantRecord.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const isDeactivated = restaurantRecord.accountStatus === "manually_deactivated";
    
    // Active if not deactivated and either active account or active subscription
    const isSubscriptionActive = !isDeactivated && (
      restaurantRecord.accountStatus === "active" ||
      (latestSub &&
        (latestSub.status === "active" || latestSub.status === "authenticated" || latestSub.status === "created") &&
        (!latestSub.currentPeriodEnd || new Date(latestSub.currentPeriodEnd) > new Date()))
    );

    let blockReason: "deactivated" | "subscription_inactive" | undefined;
    if (isDeactivated) {
      blockReason = "deactivated";
    } else if (!isSubscriptionActive) {
      blockReason = "subscription_inactive";
    }

    return {
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role as "admin" | "staff",
        canManageChecklists: userRecord.canManageChecklists ?? true,
      },
      restaurant: {
        id: restaurantRecord.id,
        businessName: restaurantRecord.businessName,
        accountStatus: restaurantRecord.accountStatus,
        onboardingCompleted: restaurantRecord.onboardingCompleted,
        shiftsEnabled: restaurantRecord.shiftsEnabled,
        shiftNames: (restaurantRecord.shiftNames as string[]) || ["Morning", "Evening"],
        responsibleAreas: (restaurantRecord.responsibleAreas as string[]) || [
          "Kitchen",
          "Bar",
          "Bakery",
          "Service",
          "Storage",
          "Other",
        ],
        currency: restaurantRecord.currency,
        timezone: restaurantRecord.timezone,
      },
      subscription: latestSub
        ? {
            id: latestSub.id,
            status: latestSub.status,
            planType: latestSub.planType,
            amount: latestSub.amount,
            currentPeriodEnd: latestSub.currentPeriodEnd,
          }
        : undefined,
      isDeactivated,
      isSubscriptionActive,
      canAccessApp: session.isImpersonating ? true : (!isDeactivated && isSubscriptionActive),
      blockReason: session.isImpersonating ? undefined : blockReason,
      isImpersonating: Boolean(session.isImpersonating),
      impersonatorAdminId: session.impersonatorAdminId,
    };
  } catch (err) {
    console.error("getAuthContext error:", err);
    return null;
  }
}
