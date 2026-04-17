import { Link } from "react-router-dom";
import logo from "../../../../brands/logo-adda.jpg";

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center overflow-hidden">
      <img
        src={logo}
        alt="ADDA Seguridad"
        className="h-14 w-24 object-cover object-center md:h-24 md:w-auto"
      />
    </Link>
  );
};