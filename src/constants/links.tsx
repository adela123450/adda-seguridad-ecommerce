import { FaFacebook, FaSquareXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";

export const navbarLinks = [
    {
        id:1,
        title: "Inicio",
        href: "/"
    },
    {
        id:2,
        title: "Equipos de seguridad",
        href: "/equipos"
    },
    {
        id:3,
        title: "Nosotros",
        href: "/nosotros"
    }
];

export const socialLinks = [
  {
    id:1,
    title: "Facebook",
    href: "https://www.facebook.com/ADDAseguridad",
    icon: FaFacebook
  },
  {
    id:2,
    title: "Instagram",
    href: "https://www.instagram.com/ADDAseguridad",
    icon: RiInstagramFill
  },
  {
    id:3,
    title: "Twitter",
    href: "https://www.twitter.com/ADDAseguridad",
    icon: FaSquareXTwitter
  }
];