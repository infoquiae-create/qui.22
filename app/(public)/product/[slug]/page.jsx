"use client"
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import ProductCard from "@/components/ProductCard";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

export default function ProductBySlug() {
    const { slug } = useParams();
    const [product, setProduct] = useState();
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const products = useSelector(state => state.product.list);

    const fetchProduct = async () => {
        setLoading(true);
        let found = products.find((product) => product.slug === slug);
        if (!found) {
            // Fetch from backend if not in Redux
            try {
                const { data } = await axios.get(`/api/products/by-slug?slug=${encodeURIComponent(slug)}`);
                found = data.product || null;
            } catch {
                found = null;
            }
        }
        setProduct(found);
        // Get related products from Redux if available
        if (found && products.length > 0) {
            const related = products
                .filter(p => p.slug !== slug && p.category === found.category && p.inStock)
                .slice(0, 5);
            setRelatedProducts(related);
        } else {
            setRelatedProducts([]);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchProduct();
        scrollTo(0, 0);
    }, [slug, products]);

    return (
        <div className="lg:mx-6">
            <div className="max-w-7xl mx-auto pb-24 lg:pb-0">
                {/* Product Details */}
                {loading ? (
                    <div className="text-center py-16 text-gray-400">Loading product…</div>
                ) : product ? (
                    <>
                        <ProductDetails product={product} />
                        <ProductDescription product={product} />
                        {/* Related Products */}
                        {relatedProducts.length > 0 && (
                            <div className="px-4 mt-12 mb-16">
                                <h2 className="text-2xl font-semibold text-slate-800 mb-6">Related Products</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                                    {relatedProducts.map((prod) => (
                                        <ProductCard key={prod.id} product={prod} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 text-gray-400">Product not found.</div>
                )}
            </div>
        </div>
    );
}
