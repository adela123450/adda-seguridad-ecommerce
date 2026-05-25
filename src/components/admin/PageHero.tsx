type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export const PageHero = ({ eyebrow, title, description }: PageHeroProps) => {
  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] px-8 py-7 text-white shadow-[0_18px_42px_rgba(15,35,95,0.22)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
        {eyebrow}
      </p>

      <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl">
        {title}
      </h1>

      <p className="mt-3 max-w-4xl text-sm leading-6 text-white/82 md:text-base">
        {description}
      </p>
    </section>
  );
};