import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "../components/shared/Navbar";
import { Footer } from "../components/shared/Footer";
import { Newsletter } from "../components/home/Newsletter";
import { Banner } from "../components/home/banner";

export const RootLayout = () => {

  const {pathname}= useLocation();
  
  return (
    <div className="h-screen flex flex-col font-montserrat">
      <Navbar />
      {pathname === "/" && ( 
        <Banner />
      )}

      <main className="container my-8 flex-1">
        <Outlet />
      </main>

      {pathname === "/" && (
       <Newsletter />
)}

      <Footer />
    </div>
  );
};
