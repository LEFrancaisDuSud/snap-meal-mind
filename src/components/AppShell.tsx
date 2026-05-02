import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppShell({ hideNav = false }: { hideNav?: boolean }) {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="phone-shell">
        <div
          className={`absolute inset-0 ${hideNav ? "" : "pb-[80px]"}`}
          style={{ paddingBottom: hideNav ? 0 : "calc(80px + env(safe-area-inset-bottom))" }}
        >
          <Outlet />
        </div>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
