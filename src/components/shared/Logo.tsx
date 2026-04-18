import { Link } from "react-router-dom";
import logo from "../../../../brands/logo-adda.jpg";

type LogoProps = {
  compact?: boolean;
};

export const Logo = ({ compact = false }: LogoProps) => {
  if (compact) {
    return (
      <Link to="/" className="flex items-center justify-center">
        <img
          src={logo}
          alt="ADDA Seguridad"
          className="h-11 w-11 object-cover object-top"
        />
      </Link>
    );
  }

  return (
    <Link to="/" className="flex items-center justify-center">
      <img
        src={logo}
        alt="ADDA Seguridad"
        className="h-16 w-auto object-contain md:h-24"
      />
    </Link>
  );
};