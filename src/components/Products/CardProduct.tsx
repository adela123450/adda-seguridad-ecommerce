import { useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  img: string;
  name: string;
  price: number;
  slug: string;
  colors: { name: string; color: string }[];
  variants: any[];
}

export const CardProduct = ({
  img,
  name,
  price,
  slug,
  colors,
  variants,
}: Props) => {
  const [activeColor] = useState<{
    name: string;
    color: string;
  }>(colors?.[0] || { name: "Default", color: "#000000" });

  const selectedVariant = variants?.find(
    (variant) => variant.color === activeColor.color
  );

  const stock = selectedVariant?.stock || 0;

  return (
    <div className="relative flex flex-col gap-6 group">
      <Link to={`/product/${slug}`}>
        <div className="flex h-[350px] w-full items-center justify-center py-2 lg:h-[250px]">
          <img
            src={img}
            alt={name}
            className="h-full w-full object-contain"
          />
        </div>
      </Link>

      <div className="flex flex-col gap-1 items-center">
        <p className="text-[15px] font-medium">{name}</p>
        <p className="text-[15px] font-medium">${price}</p>

        <div className="flex gap-3">
          {colors.map((color) => (
            <span
              key={color.color}
              className="grid place-items-center w-5 h-5 rounded-full cursor-pointer"
            >
              <span
                className="w-[14px] h-[14px] rounded-full"
                style={{ backgroundColor: color.color }}
              />
            </span>
          ))}
        </div>

        <div className="absolute top-2 left-2">
          {stock === 0 && <span>Agotado</span>}
        </div>
      </div>
    </div>
  );
};