const brands = [
  {
    image: "/brands/Logo-hikvision.png",
    alt: "hikvision",
  },
  {
    image: "/brands/Logo-dahua.png",
    alt: "dahua",
  },
  {
    image: "/brands/Logo-imou.png",
    alt: "imou",
  },
  {
    image: "/brands/Logo-hiklook.png",
    alt: "hiklook",
  },
  {
    image: "/brands/Logo-ezviz.png",
    alt: "ezviz",
  },
  {
    image: "/brands/Logo-tenda.png",
    alt: "tenda",
  },
];

export const Brands = () => {
  return (
    <div className="flex flex-col items-center gap-3 pt-16 pb-12">
      <h2 className="text-2xl font-bold">
        Marcas disponibles
      </h2>

      <p className="w-2/3 text-center text-sm md:text-base">
        Trabajamos con las mejores marcas del mercado para ofrecer productos de la más alta calidad.
      </p>

      <div className="mt-8 grid grid-cols-3 items-center gap-6 md:grid-cols-6">
        {brands.map((brand, index) => (
          <div key={index} className="flex justify-center items-center">
            <img
              src={brand.image}
              alt={brand.alt}
              className="h-16 w-28 object-contain md:h-20 md:w-32"
            />
          </div>
        ))}
      </div>
    </div>
  );
};