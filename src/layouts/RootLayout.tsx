import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "../components/shared/Navbar";
import { Footer } from "../components/shared/Footer";
import { Newsletter } from "../components/home/Newsletter";
import { Banner } from "../components/home/Banner";

export const RootLayout = () => {

  const {pathname}= useLocation();
  
  return (
    <div className="h-screen flex flex-col font-montserrat">
      <Navbar />
      {pathname === "/" && ( 
        <Banner />
      )}

      <main className="max-w-7xl mx-auto px-4 my-8 flex-1 w-full">
        <Outlet />
      </main>

      {pathname === "/" && (
       <Newsletter />
)}

      <Footer />
    </div>
  );
};
