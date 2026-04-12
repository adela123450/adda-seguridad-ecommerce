export const initialData = {
  products: [
    {
      id: "1",
      name: "Cámara Domo Hikvision 2MP",
      brand: "Hikvision",
      price: 180000,
      slug: "camara-domo-hikvision-2mp",
      images: ["/img/camara-domo.jpg"],
      features: ["2MP", "IR nocturno", "Interior"],
      colors: [{ name: "Blanco", color: "#FFFFFF" }],
      variants: [
        {
          color: "#FFFFFF",
          stock: 10,
        },
      ],
      isNew: true,
      isFeatured: true,
    },

    {
      id: "2",
      name: "Cámara Bullet Dahua 5MP",
      brand: "Dahua",
      price: 250000,
      slug: "camara-bullet-dahua-5mp",
      images: ["/img/camara-bullet.jpg"],
      features: ["5MP", "Exterior", "IP67"],
      colors: [{ name: "Blanco", color: "#FFFFFF" }],
      variants: [
        {
          color: "#FFFFFF",
          stock: 8,
        },
      ],
      isNew: true,
      isFeatured: false,
    },

    {
      id: "3",
      name: "Cámara Solar Imou",
      brand: "Imou",
      price: 320000,
      slug: "camara-solar-imou",
      images: ["/img/camara-solar.jpg"],
      features: ["Panel solar", "WiFi", "Exterior"],
      colors: [{ name: "Blanco", color: "#FFFFFF" }],
      variants: [
        {
          color: "#FFFFFF",
          stock: 6,
        },
      ],
      isNew: false,
      isFeatured: true,
    },

    {
      id: "4",
      name: "Cámara Pinhole Espía",
      brand: "Genérico",
      price: 150000,
      slug: "camara-pinhole",
      images: ["/img/camara-pinhole.jpg"],
      features: ["Oculta", "Mini", "1080p"],
      colors: [{ name: "Negro", color: "#000000" }],
      variants: [
        {
          color: "#000000",
          stock: 5,
        },
      ],
      isNew: false,
      isFeatured: true,
    },

    {
      id: "5",
      name: "DVR Hikvision 8 Canales",
      brand: "Hikvision",
      price: 400000,
      slug: "dvr-hikvision-8ch",
      images: ["/img/dvr.jpg"],
      features: ["8 canales", "1080p", "HDMI"],
      colors: [{ name: "Negro", color: "#000000" }],
      variants: [
        {
          color: "#000000",
          stock: 7,
        },
      ],
      isNew: true,
      isFeatured: true,
    },

    {
      id: "6",
      name: "XVR Dahua 16 Canales",
      brand: "Dahua",
      price: 650000,
      slug: "xvr-dahua-16ch",
      images: ["/img/xvr.jpg"],
      features: ["16 canales", "4K", "H.265+"],
      colors: [{ name: "Negro", color: "#000000" }],
      variants: [
        {
          color: "#000000",
          stock: 4,
        },
      ],
      isNew: false,
      isFeatured: true,
    },

    {
      id: "7",
      name: "NVR Hikvision 8 Canales",
      brand: "Hikvision",
      price: 550000,
      slug: "nvr-hikvision-8ch",
      images: ["/img/nvr.jpg"],
      features: ["IP", "8 canales", "4K"],
      colors: [{ name: "Negro", color: "#000000" }],
      variants: [
        {
          color: "#000000",
          stock: 6,
        },
      ],
      isNew: true,
      isFeatured: false,
    },

    {
      id: "8",
      name: "Memoria Micro SD 128GB",
      brand: "Sandisk",
      price: 60000,
      slug: "micro-sd-128gb",
      images: ["/img/microsd.jpg"],
      features: ["128GB", "Clase 10"],
      colors: [{ name: "Negro", color: "#000000" }],
      variants: [
        {
          color: "#000000",
          stock: 20,
        },
      ],
      isNew: false,
      isFeatured: true,
    },

    {
      id: "9",
      name: "Disco Duro 1TB WD Purple",
      brand: "Western Digital",
      price: 220000,
      slug: "disco-duro-1tb-wd",
      images: ["/img/disco.jpg"],
      features: ["1TB", "Vigilancia", "24/7"],
      colors: [{ name: "Morado", color: "#800080" }],
      variants: [
        {
          color: "#800080",
          stock: 10,
        },
      ],
      isNew: true,
      isFeatured: true,
    },
  ],
};
