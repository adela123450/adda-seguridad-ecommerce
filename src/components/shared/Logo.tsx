import { Link } from "react-router-dom";
import logo from "../../../../brands/logo-adda.jpg";

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <img
        src={logo}
        alt="ADDA Seguridad"
        className="h-25 object-contain"
      />
    </Link>
  );
};