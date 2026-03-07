"use client";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  VIRTUES, STRUGGLES_MAP, READING_LEVELS, getVirtueParent, getSubVirtue,
  getDefaultReadingLevel, getRecommendedBooks, type AppData, type ChildProfile,
} from "@/lib/data";
import { loadData, saveData, isPremium, setPremium, getMonthlyStoryCount } from "@/lib/storage";
import { T, VC, PLANS } from "@/lib/tokens";
import LandingPage, { type DemoScenario } from "./landing/LandingPage";
import AppNav from "./app/AppNav";
import Dashboard from "./app/Dashboard";
import BookExplorer from "./app/BookExplorer";
import StoryForge from "./app/StoryForge";
import ShieldTracker from "./app/ShieldTracker";
import VirtueSelector from "./app/VirtueSelector";
import ChildManager from "./app/ChildManager";
import PricingPage from "./app/PricingPage";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";

type AppPage = "landing" | "dashboard" | "virtues" | "children" | "books" | "stories" | "shield" | "pricing" | "privacy" | "terms";

export default function VirtueForgeApp() {
  const [page, setPage] = useState<AppPage>("landing");
  const [appData, setAppData] = useState<AppData>({ children: [], familyVirtues: [], setupComplete: false });
  const [loaded, setLoaded] = useState(false);
  const [premium, setPremiumState] = useState(false);
  const [selChild, setSelChild] = useState(0);
  const [demoScenario, setDemoScenario] = useState<DemoScenario | null>(null);
  const [pendingDest, setPendingDest] = useState<AppPage | null>(null);

  useEffect(() => {
    const data = loadData();
    setAppData(data);
    setPremiumState(isPremium());
    setLoaded(true);
    // If returning user with setup done, go to dashboard
    if (data.setupComplete && data.children.length > 0) {
      setPage("dashboard");
    }
  }, []);

  useEffect(() => {
    if (loaded) saveData(appData);
  }, [appData, loaded]);

  const upd = useCallback((u: Partial<AppData>) => {
    setAppData((p) => ({ ...p, ...u }));
  }, []);

  const handleUpgrade = () => {
    setPremium(true);
    setPremiumState(true);
  };

  const markRead = (ci: number, title: string, vids: string[]) => {
    const ch = [...appData.children];
    const c = { ...ch[ci] };
    const was = c.readBooks.includes(title);
    c.readBooks = was ? c.readBooks.filter((b) => b !== title) : [...c.readBooks, title];
    const p = { ...c.virtueProgress };
    vids.forEach((v) => { p[v] = was ? Math.max(0, (p[v] || 0) - 15) : (p[v] || 0) + 15; });
    c.virtueProgress = p;
    ch[ci] = c;
    upd({ children: ch });
  };

  const logTime = (ci: number, vid: string, min: number) => {
    const ch = [...appData.children];
    const c = { ...ch[ci] };
    c.virtueProgress = { ...c.virtueProgress, [vid]: (c.virtueProgress[vid] || 0) + min };
    ch[ci] = c;
    upd({ children: ch });
  };

  const removeChild = (i: number) => {
    upd({ children: appData.children.filter((_, idx) => idx !== i) });
    if (selChild >= appData.children.length - 1) setSelChild(Math.max(0, appData.children.length - 2));
  };

  const addChild = (child: ChildProfile) => {
    upd({ children: [...appData.children, child], setupComplete: true });
  };

  const startJourney = () => {
    if (appData.setupComplete && appData.children.length > 0) {
      setPage("dashboard");
    } else {
      setPage("virtues");
    }
  };

  const handleDemo = (scenario: DemoScenario) => {
    // Create a temporary child profile for the demo
    const demoChild: ChildProfile = {
      name: scenario.childName,
      age: scenario.age,
      sex: scenario.sex,
      readingLevel: getDefaultReadingLevel(scenario.age),
      struggles: [],
      readBooks: [],
      virtueProgress: {},
    };
    // Add the demo child if no children exist yet
    if (appData.children.length === 0) {
      upd({ children: [demoChild], setupComplete: true });
      setSelChild(0);
    }
    setDemoScenario(scenario);
    setPage("stories");
  };

  if (!loaded) {
    return (
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: "100vh", background: T.bg,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: `3px solid ${T.gray200}`, borderTopColor: T.navy,
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Landing page for new/non-setup users
  if (page === "landing") {
    return (
      <LandingPage
        onStart={startJourney}
        onPricing={() => setPage("pricing")}
        onDemo={handleDemo}
        onNavigate={(p: string) => {
          if (!appData.setupComplete || appData.children.length === 0) {
            // Track where the user wants to go after setup
            setPendingDest(p as AppPage);
            startJourney();
          } else {
            setPage(p as AppPage);
          }
        }}
        hasAccount={appData.setupComplete}
      />
    );
  }

  // Pricing standalone page
  if (page === "pricing") {
    return (
      <PricingPage
        premium={premium}
        onUpgrade={handleUpgrade}
        onBack={() => setPage(appData.setupComplete ? "dashboard" : "landing")}
      />
    );
  }

  // Legal pages
  if (page === "privacy") {
    return <PrivacyPolicy onBack={() => setPage(appData.setupComplete ? "dashboard" : "landing")} />;
  }

  if (page === "terms") {
    return <TermsOfService onBack={() => setPage(appData.setupComplete ? "dashboard" : "landing")} />;
  }

  // App pages (post-setup)
  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <AppNav
        currentPage={page}
        onNavigate={setPage}
        premium={premium}
        onPricing={() => setPage("pricing")}
      />

      <main className="px-5 md:px-6 pt-6 md:pt-8 pb-16 md:pb-20" style={{ maxWidth: 960, margin: "0 auto", overflowX: "hidden" }}>
        <AnimatePresence mode="wait">
          {page === "dashboard" && (
            <Dashboard
              key="dashboard"
              appData={appData}
              selChild={selChild}
              setSelChild={setSelChild}
              onNavigate={setPage}
              premium={premium}
            />
          )}

          {page === "virtues" && (
            <VirtueSelector
              key="virtues"
              familyVirtues={appData.familyVirtues}
              onUpdate={(v) => upd({ familyVirtues: v })}
              onNext={() => {
                if (appData.children.length > 0) {
                  // Setup already done — go to intended destination or books
                  const dest = pendingDest || "books";
                  setPendingDest(null);
                  setPage(dest);
                } else {
                  setPage("children");
                }
              }}
            />
          )}

          {page === "children" && (
            <ChildManager
              key="children"
              children={appData.children}
              onAdd={addChild}
              onRemove={removeChild}
              premium={premium}
              onNext={() => {
                const dest = pendingDest || "books";
                setPendingDest(null);
                setPage(dest);
              }}
              onPricing={() => setPage("pricing")}
            />
          )}

          {page === "books" && (
            <BookExplorer
              key="books"
              appData={appData}
              selChild={selChild}
              setSelChild={setSelChild}
              onMarkRead={markRead}
            />
          )}

          {page === "stories" && (
            <StoryForge
              key="stories"
              appData={appData}
              selChild={selChild}
              setSelChild={setSelChild}
              premium={premium}
              onPricing={() => setPage("pricing")}
              demoScenario={demoScenario}
              onDemoConsumed={() => setDemoScenario(null)}
            />
          )}

          {page === "shield" && (
            <ShieldTracker
              key="shield"
              appData={appData}
              selChild={selChild}
              setSelChild={setSelChild}
              onLogTime={logTime}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
