import React, { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import cartService from "../../services/CartServiceV2";
import wishlistService from "../../services/WishlistService";
import { productPublicService } from "../../services/ProductServiceV2";
import { Product as ProductType } from "../../services/ProductServiceV2";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import {
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiShoppingCart,
  FiInfo,
} from "react-icons/fi";
import ProductInfo from "./ProductInfo";
import ProductComments from "./ProductComments";
import ProductCard from "../ProductCard/ProductCard";
import toast from "react-hot-toast";

interface Brand {
  _id: string;
  name: string;
  logo?:
    | {
        url: string;
      }
    | string;
}

interface Category {
  _id: string;
  name: string;
}

interface Color {
  _id: string;
  name: string;
  code: string;
  type: "solid" | "gradient";
  colors?: string[];
}

interface Size {
  _id: string;
  value: string | number;
  description?: string;
}

interface Gender {
  id: string;
  name: string;
}

interface ProductImage {
  url: string;
  alt?: string;
}

interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    id?: string;
  };
  variant?: {
    _id: string;
  };
}

interface WishlistResponse {
  data: {
    data?: {
      wishlist: WishlistItem[];
    };
  };
}

interface AddToWishlistResponse {
  data: {
    data: {
      _id: string;
    };
  };
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
}

interface VariantSize {
  sizeId: string;
  sizeValue?: string | number;
  quantity: number;
  description?: string;
}

interface Variant {
  id: string;
  sizes?: VariantSize[];
  price?: number;
  priceFinal?: number;
  percentDiscount?: number;
}

interface Product {
  _id: string;
  id?: string;
  name: string;
  description: string;
  category?: Category;
  brand?: Brand;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  totalQuantity?: number;
  rating?: number;
  numReviews?: number;
  images?: ProductImage[];
  slug?: string;
  mainImage?: string;
  price?: number;
}

interface ProductAttributes {
  genders?: Gender[];
  colors?: Color[];
  sizes?: Size[];
  priceRange?: {
    min: number;
    max: number;
  };
  inventoryMatrix?: {
    summary?: {
      total: number;
    };
  };
}

interface ProductDetailProps {
  product: Product;
  attributes?: ProductAttributes;
  variants?: Record<string, Variant>;
  images?: Record<string, ProductImage[]>;
  similarProducts?: Product[];
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  attributes,
  variants,
  images,
  similarProducts,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("details");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingBuyNow, setLoadingBuyNow] = useState(false);
  const [displayedImages, setDisplayedImages] = useState<ProductImage[]>([]);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Wishlist state
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Stock information for selected variant and size
  const [availableStock, setAvailableStock] = useState(0);
  const [selectedSizeInfo, setSelectedSizeInfo] = useState<VariantSize | null>(
    null
  );

  // Fetch related products
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product?._id && !product?.id) return;

      setLoadingRelated(true);
      try {
        const response = await productPublicService.getRelatedProducts(
          product._id || product.id || "",
          { limit: 8 }
        );

        if (response.data.success && response.data.data) {
          setRelatedProducts(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
        // Fallback to similar products from props
        setRelatedProducts([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedProducts();
  }, [product?._id, product?.id]);

  // Cập nhật hiển thị ảnh theo variant được chọn
  useEffect(() => {
    if (!images) {
      if (product?.images?.length) {
        setDisplayedImages(product.images);
      }
      return;
    }

    if (selectedGender && selectedColorId) {
      const key = `${selectedGender}-${selectedColorId}`;
      if (images[key] && images[key].length > 0) {
        setDisplayedImages(images[key]);
        setCurrentImageIndex(0);
        return;
      }
    }

    if (product?.images?.length) {
      setDisplayedImages(product.images);
    }
  }, [images, product?.images, selectedGender, selectedColorId]);

  // Fetch stock information when variant or size changes
  useEffect(() => {
    const fetchStockInfo = () => {
      if (!variants || !selectedGender || !selectedColorId) {
        setAvailableStock(0);
        setSelectedSizeInfo(null);
        return;
      }

      const variantKey = `${selectedGender}-${selectedColorId}`;
      const variant = variants[variantKey];

      if (variant && variant.sizes) {
        if (selectedSizeId) {
          const sizeInfo = variant.sizes.find(
            (size) => size.sizeId === selectedSizeId
          );
          setAvailableStock(sizeInfo?.quantity || 0);
          setSelectedSizeInfo(sizeInfo || null);
        }
      }
    };

    fetchStockInfo();
  }, [variants, selectedGender, selectedColorId, selectedSizeId]);

  // Tự động chọn gender và color mặc định khi tải sản phẩm
  useEffect(() => {
    if (attributes?.genders?.length && !selectedGender) {
      setSelectedGender(attributes.genders[0].id);
    }

    if (attributes?.colors?.length && selectedGender && !selectedColorId) {
      for (const color of attributes.colors) {
        const variantKey = `${selectedGender}-${color._id}`;
        if (variants && variants[variantKey]) {
          setSelectedColorId(color._id);
          break;
        }
      }
    }
  }, [attributes, variants, selectedGender, selectedColorId]);

  // Fetch related products
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product || relatedProducts.length > 0) return;

      setLoadingRelated(true);
      try {
        const response = await productPublicService.getRelatedProducts(
          product._id || product.id || "",
          { limit: 8 }
        );
        if (response.data.success && response.data.products) {
          setRelatedProducts(response.data.products);
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedProducts();
  }, [product, relatedProducts.length]);

  // Reset quantity when size changes
  useEffect(() => {
    setSelectedQuantity(1);
  }, [selectedSizeId, selectedColorId]);
  // Kiểm tra sản phẩm đã yêu thích chưa
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) return;

      try {
        const res =
          (await wishlistService.getUserWishlist()) as WishlistResponse;
        const foundItem = res.data.data?.wishlist.find(
          (item: WishlistItem) =>
            (item.product._id === (product._id || product.id) ||
              item.product.id === (product._id || product.id)) &&
            item.variant?._id === getVariantId()
        );
        setIsLiked(!!foundItem);
        setWishlistItemId(foundItem ? foundItem._id : null);
      } catch {
        setIsLiked(false);
        setWishlistItemId(null);
      }
    };

    const getVariantId = () => {
      if (!variants || !selectedGender || !selectedColorId) return null;
      const variantKey = `${selectedGender}-${selectedColorId}`;
      return variants[variantKey]?.id || null;
    };

    if (product && getVariantId()) fetchWishlist();
  }, [product, selectedGender, selectedColorId, isAuthenticated, variants]);

  if (!product) {
    return (
      <div className="text-center text-gray-500 mt-10">
        Không tìm thấy sản phẩm.
      </div>
    );
  }

  const currentImage = displayedImages[currentImageIndex];

  // Tìm variantId theo gender và color
  const getVariantId = () => {
    if (!variants || !selectedGender || !selectedColorId) return null;
    const variantKey = `${selectedGender}-${selectedColorId}`;
    return variants[variantKey]?.id || null;
  };

  // Tìm variant hiện tại
  const getCurrentVariant = () => {
    if (!variants || !selectedGender || !selectedColorId) return null;
    const variantKey = `${selectedGender}-${selectedColorId}`;
    return variants[variantKey] || null;
  };

  // Lấy thông tin size từ attributes
  const getSizeDetails = (sizeId: string): Size | null => {
    return attributes?.sizes?.find((size) => size._id === sizeId) || null;
  };
  // Xử lý thêm vào giỏ hàng - Cập nhật với error handling tốt hơn
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      // Lưu URL hiện tại để quay lại sau khi đăng nhập
      navigate(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    if (!selectedGender || !selectedColorId || !selectedSizeId) {
      toast.error("Vui lòng chọn đầy đủ thông tin sản phẩm");
      return;
    }

    if (availableStock < selectedQuantity) {
      toast.error("Số lượng vượt quá tồn kho");
      return;
    }

    const variantId = getVariantId();
    if (!variantId) {
      toast.error("Không tìm thấy thông tin sản phẩm");
      return;
    }

    setLoadingAdd(true);
    try {
      const response = await cartService.addToCart({
        variantId,
        sizeId: selectedSizeId,
        quantity: selectedQuantity,
      });

      if (response.data.success) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng");
        setSelectedQuantity(1);
      }
    } catch (error: unknown) {
      console.error("Add to cart error:", error);
      const apiError = error as ApiError;

      // Nếu lỗi xác thực, hướng đến trang đăng nhập
      if (apiError.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        // Không redirect ngay lập tức vì axios interceptor sẽ xử lý
      } else {
        const errorMessage =
          apiError?.response?.data?.message ||
          apiError?.response?.data?.error ||
          "Có lỗi xảy ra khi thêm vào giỏ hàng";
        toast.error(errorMessage);
      }
    } finally {
      setLoadingAdd(false);
    }
  };

  // Xử lý mua ngay - Cập nhật với error handling tốt hơn
  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để mua hàng");
      navigate(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    if (!selectedGender || !selectedColorId || !selectedSizeId) {
      toast.error("Vui lòng chọn đầy đủ thông tin sản phẩm");
      return;
    }

    if (availableStock < selectedQuantity) {
      toast.error("Số lượng vượt quá tồn kho");
      return;
    }

    setLoadingBuyNow(true);
    try {
      const variantId = getVariantId();
      if (!variantId) {
        toast.error("Không tìm thấy thông tin sản phẩm");
        return;
      }

      const response = await cartService.addToCart({
        variantId,
        sizeId: selectedSizeId,
        quantity: selectedQuantity,
      });

      if (response.data.success) {
        navigate("/cart?checkout=true");
        toast.success("Đã thêm sản phẩm vào giỏ hàng, chuyển đến thanh toán");
      }
    } catch (error: unknown) {
      console.error("Buy now error:", error);
      const apiError = error as ApiError;

      if (apiError.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      } else {
        const errorMessage =
          apiError?.response?.data?.message || "Có lỗi xảy ra khi mua ngay";
        toast.error(errorMessage);
      }
    } finally {
      setLoadingBuyNow(false);
    }
  }; // Xử lý yêu thích
  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
      // Lưu URL hiện tại để redirect sau khi đăng nhập
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    const variantId = getVariantId();
    if (!variantId) {
      toast.error("Vui lòng chọn màu sắc");
      return;
    }

    setLikeLoading(true);
    try {
      if (isLiked && wishlistItemId) {
        await wishlistService.removeFromWishlist(wishlistItemId);
        setIsLiked(false);
        setWishlistItemId(null);
        toast.success("Đã xóa khỏi danh sách yêu thích");
      } else {
        const response = (await wishlistService.addToWishlist(
          product._id || product.id || "",
          variantId
        )) as AddToWishlistResponse;
        setIsLiked(true);
        setWishlistItemId(response.data.data._id);
        toast.success("Đã thêm vào danh sách yêu thích");
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error(apiError?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <img
              src={currentImage?.url || "/placeholder.jpg"}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/placeholder.jpg";
              }}
            />
          </div>

          {/* Thumbnail images */}
          {displayedImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {displayedImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-md border-2 ${
                    currentImageIndex === index
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/placeholder.jpg";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title and price */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3">
              <p className="text-3xl font-bold text-gray-900">
                {getCurrentVariant()?.priceFinal?.toLocaleString() ||
                  getCurrentVariant()?.price?.toLocaleString() ||
                  "Liên hệ"}
                đ
              </p>

              {getCurrentVariant()?.percentDiscount &&
                (getCurrentVariant()?.percentDiscount ?? 0) > 0 && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg text-gray-500 line-through">
                      {getCurrentVariant()?.price?.toLocaleString()}đ
                    </span>
                    <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                      -{getCurrentVariant()?.percentDiscount}%
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Rating and reviews */}
          {product.rating && product.rating > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating || 0)
                        ? "text-yellow-400"
                        : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating.toFixed(1)} ({product.numReviews || 0} đánh giá)
              </span>
            </div>
          )}

          {/* Gender selection */}
          {attributes?.genders && attributes.genders.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Giới tính:</h3>
              <div className="flex gap-2">
                {attributes.genders.map((gender) => (
                  <button
                    key={gender.id}
                    onClick={() => {
                      setSelectedGender(gender.id);
                      setSelectedColorId(null);
                      setSelectedSizeId(null);
                    }}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      selectedGender === gender.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {gender.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color selection */}
          {selectedGender && attributes?.colors && (
            <div>
              <h3 className="text-lg font-medium mb-3">Màu sắc:</h3>
              <div className="flex flex-wrap gap-2">
                {attributes.colors
                  .filter((color) => {
                    const variantKey = `${selectedGender}-${color._id}`;
                    return variants && variants[variantKey];
                  })
                  .map((color) => (
                    <button
                      key={color._id}
                      onClick={() => {
                        setSelectedColorId(color._id);
                        setSelectedSizeId(null);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                        selectedColorId === color._id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {color.type === "solid" ? (
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color.code }}
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full border relative overflow-hidden">
                          <div
                            style={{
                              backgroundColor: color.colors?.[0] || "#fff",
                              width: "100%",
                              height: "100%",
                              position: "absolute",
                              left: 0,
                              top: 0,
                              clipPath: "inset(0 50% 0 0)",
                            }}
                          />
                          <div
                            style={{
                              backgroundColor: color.colors?.[1] || "#fff",
                              width: "100%",
                              height: "100%",
                              position: "absolute",
                              right: 0,
                              top: 0,
                              clipPath: "inset(0 0 0 50%)",
                            }}
                          />
                        </div>
                      )}
                      <span>{color.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Size selection với size description */}
          {selectedGender && selectedColorId && getCurrentVariant() && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Kích thước:</h3>
                <button
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <FiInfo size={14} />
                  Hướng dẫn chọn size
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {getCurrentVariant()?.sizes?.map((sizeInfo) => {
                  const sizeDetails = getSizeDetails(sizeInfo.sizeId);
                  return (
                    <div key={sizeInfo.sizeId} className="relative group">
                      <button
                        onClick={() => setSelectedSizeId(sizeInfo.sizeId)}
                        disabled={sizeInfo.quantity === 0}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          selectedSizeId === sizeInfo.sizeId
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : sizeInfo.quantity === 0
                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {sizeInfo.sizeValue}
                        {sizeInfo.quantity === 0 && (
                          <span className="block text-xs">Hết hàng</span>
                        )}
                      </button>

                      {/* Size description tooltip */}
                      {sizeDetails?.description && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {sizeDetails.description}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected size description */}
              {selectedSizeInfo &&
                getSizeDetails(selectedSizeInfo.sizeId)?.description && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiInfo className="text-blue-600" size={16} />
                      <span className="text-sm font-medium text-blue-900">
                        Size {selectedSizeInfo.sizeValue}:
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 mt-1">
                      {getSizeDetails(selectedSizeInfo.sizeId)?.description}
                    </p>
                  </div>
                )}

              {/* Size guide */}
              {showSizeGuide && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">Hướng dẫn chọn size giày</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Đo chiều dài bàn chân từ gót đến ngón cái dài nhất</p>
                    <p>• Nên đo vào buổi chiều khi bàn chân hơi phù</p>
                    <p>• Chọn size lớn hơn 0.5-1cm so với chiều dài bàn chân</p>
                    <p>• Tham khảo bảng size cụ thể của từng thương hiệu</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity selection */}
          {selectedSizeId && availableStock > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Số lượng:</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                  }
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FiMinus />
                </button>
                <span className="px-4 py-2 border border-gray-300 rounded-lg">
                  {selectedQuantity}
                </span>
                <button
                  onClick={() =>
                    setSelectedQuantity(
                      Math.min(availableStock, selectedQuantity + 1)
                    )
                  }
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FiPlus />
                </button>
                <span className="text-sm text-gray-500">
                  Còn {availableStock} sản phẩm
                </span>
              </div>
            </div>
          )}

          {/* Add to cart & buy now buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={
                loadingAdd ||
                !selectedSizeId ||
                availableStock < selectedQuantity
              }
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${
                loadingAdd ||
                !selectedSizeId ||
                availableStock < selectedQuantity
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
              }`}
            >
              {loadingAdd ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <FiShoppingCart size={20} />
                  <span>Thêm vào giỏ hàng</span>
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={
                loadingBuyNow ||
                !selectedSizeId ||
                availableStock < selectedQuantity
              }
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${
                loadingBuyNow ||
                !selectedSizeId ||
                availableStock < selectedQuantity
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700 transform hover:scale-105 transition-all duration-200"
              }`}
            >
              {loadingBuyNow ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <FiShoppingBag size={20} />
                  <span>Mua ngay</span>
                </>
              )}
            </button>

            <button
              onClick={handleToggleWishlist}
              disabled={likeLoading || !selectedColorId}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-medium ${
                likeLoading || !selectedColorId
                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                  : isLiked
                  ? "border-red-500 text-red-500 hover:bg-red-50"
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
            >
              {likeLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
              ) : isLiked ? (
                <AiFillHeart size={20} className="text-red-500" />
              ) : (
                <AiOutlineHeart size={20} />
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-t pt-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "details"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Chi tiết sản phẩm
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "reviews"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Đánh giá
              </button>
            </div>
            <div className="py-4">
              {activeTab === "details" && <ProductInfo product={product} />}
              {activeTab === "reviews" && (
                <ProductComments productId={product._id || product.id || ""} />
              )}
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Related Products Section */}
      {(relatedProducts.length > 0 ||
        (similarProducts && similarProducts.length > 0)) && (
        <div className="mt-16 border-t pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Sản phẩm liên quan
            </h2>
            <span className="text-sm text-gray-500">
              {loadingRelated
                ? "Đang tải..."
                : `${
                    relatedProducts.length || similarProducts?.length || 0
                  } sản phẩm được đề xuất`}
            </span>
          </div>

          {loadingRelated ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                  <div className="p-3 md:p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {" "}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {(relatedProducts.length > 0
                  ? relatedProducts
                  : similarProducts || []
                )
                  .slice(0, 10)
                  .map((relatedProduct, index) => (
                    <ProductCard
                      key={
                        relatedProduct._id ||
                        relatedProduct.id ||
                        `product-${index}`
                      }
                      product={relatedProduct as ProductType}
                      onClick={() =>
                        navigate(
                          `/product/${
                            relatedProduct.slug || relatedProduct._id
                          }`
                        )
                      }
                    />
                  ))}
              </div>
              {/* View all button */}
              {(relatedProducts.length > 10 ||
                (similarProducts && similarProducts.length > 10)) && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => {
                      const categoryId =
                        product.category?._id ||
                        (product.category as { id?: string })?.id;
                      navigate(`/products?category=${categoryId}`);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Xem tất cả sản phẩm cùng loại
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
