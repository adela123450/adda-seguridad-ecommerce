import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "../components/shared/Navbar";
import { Footer } from "../components/shared/Footer";
import { Newsletter } from "../components/home/Newsletter";
import { Banner } from "../components/home/Banner";

export const RootLayout = () => {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col font-montserrat">
      {!isAdminRoute && <Navbar />}

      {!isAdminRoute && pathname === "/" && <Banner />}

      <main className={isAdminRoute ? "flex-1 w-full" : "max-w-7xl mx-auto px-4 my-8 flex-1 w-full"}>
        <Outlet />
      </main>

      {!isAdminRoute && pathname === "/" && <Newsletter />}

      {!isAdminRoute && <Footer />}
    </div>
  );
};