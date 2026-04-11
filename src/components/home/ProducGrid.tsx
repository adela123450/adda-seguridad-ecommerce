interface Props {
    title: string;
    products: any[];
}

export const ProductGrid = ({title, products}: Props) => {
  return (
    <div className="my-32">
        <h2 className="text-3xl font-semibold text-center mb-8 md:text-4x1 lg:text-5x1">
            {title}
        </h2>
        <div className="grid grid-cols-1 gap-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
                
                <div 
                    className="flex flex-col gap-6 relative"
                    key={product.id} 
                    >
                    <h3>{product.title}</h3>
                </div>
            ))}
        </div>
    </div>
    );
};