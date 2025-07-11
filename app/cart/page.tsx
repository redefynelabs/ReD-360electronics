'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserLayout from '@/components/Layouts/UserLayout';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import toast from 'react-hot-toast';
import { CartItemComponent } from '@/components/Cart/CartItem';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useCheckoutStore } from '@/store/checkout-store';
import { useCartStore } from '@/store/cart-store';

type CartOfferProduct = {
  id: string;
  productName: string;
  productImage: string;
  range: string;
  ourPrice: string;
  quantity: number;
};

const CartPage: React.FC = () => {
  const {
    cartItems,
    coupon,
    couponStatus,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    addOfferProductToCart,
    getCartSubtotal,
    getCartTotal,
    getItemCount,
    getSavings,
  } = useCartStore();
  const { isLoggedIn, isLoading, user } = useAuthStore();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const { addToCheckout } = useCheckoutStore();
  const [offerProducts, setOfferProducts] = useState<CartOfferProduct[]>([]);
  const [isFetchingOffers, setIsFetchingOffers] = useState(false);
  const [effectiveRange, setEffectiveRange] = useState<string | null>(null);

  // Calculate totals including offer products
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      const itemPrice = Number(item.variant.ourPrice) || 0;
      const offerPrice = item.cartOfferProductId ? Number(item.offerProduct?.ourPrice) || 0 : 0;
      return sum + (itemPrice + offerPrice) * item.quantity;
    }, 0);

    const savings = cartItems.reduce((sum, item) => {
      const originalPrice = Number(item.variant.mrp) || 0;
      const ourPrice = Number(item.variant.ourPrice) || 0;
      return sum + (originalPrice - ourPrice) * item.quantity;
    }, 0);

    const discountAmount = coupon && couponStatus === 'applied'
      ? coupon.type === 'amount'
        ? coupon.value || 0
        : (subtotal * (coupon.value || 0)) / 100
      : 0;

    const shippingAmount = subtotal > 500 ? 0 : cartItems.reduce((sum, item) => sum + 50 * item.quantity, 0);
    const grandTotal = subtotal - discountAmount;

    return { subtotal, savings, discountAmount, shippingAmount, grandTotal };
  };

  const { subtotal, savings, discountAmount, shippingAmount, grandTotal } = calculateTotals();

  // Format numbers safely
  const formatCurrency = (value: number | null | undefined): string => {
    return (value ?? 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    });
  };

  // Determine eligible range based on cart subtotal
  const getEligibleRange = (subtotal: number): string | null => {
    if (subtotal >= 25000) return '25000';
    if (subtotal >= 10000) return '10000';
    if (subtotal >= 5000) return '5000';
    if (subtotal >= 1000) return '1000';
    return null;
  };

  const eligibleRange = getEligibleRange(subtotal);

  // Check if cart has at least one regular product
  const hasRegularProduct = cartItems.some((item) => !item.cartOfferProductId);
  const hasOfferProductInCart = cartItems.some((item) => item.cartOfferProductId);

  // Fetch offer products with fallback to lower ranges
  useEffect(() => {
    const fetchOfferProducts = async () => {
      if (!eligibleRange || !hasRegularProduct) {
        setOfferProducts([]);
        setEffectiveRange(null);
        return;
      }

      setIsFetchingOffers(true);
      try {
        const ranges = ['25000', '10000', '5000', '1000'];
        let products: CartOfferProduct[] = [];
        let selectedRange: string | null = null;

        for (const range of ranges) {
          if (ranges.indexOf(range) >= ranges.indexOf(eligibleRange)) {
            const response = await fetch(`/api/cart/range-offers?range=${range}`);
            if (!response.ok) {
              console.error(`Failed to fetch offer products for range ${range}`);
              continue;
            }
            const fetchedProducts: CartOfferProduct[] = await response.json();
            if (fetchedProducts.length > 0) {
              products = fetchedProducts;
              selectedRange = range;
              break;
            }
          }
        }

        setOfferProducts(products);
        setEffectiveRange(selectedRange);
      } catch (error) {
        console.error('Error fetching offer products:', error);
        toast.error('Failed to load offer products');
        setOfferProducts([]);
        setEffectiveRange(null);
      } finally {
        setIsFetchingOffers(false);
      }
    };

    fetchOfferProducts();
  }, [eligibleRange, hasRegularProduct]);

  // Handle adding an offer product
  const handleAddOfferProduct = async (offerProduct: CartOfferProduct) => {
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to add offer products');
      return;
    }

    if (!hasRegularProduct) {
      toast.error('Add a regular product to your cart first');
      return;
    }

   
    // Select the first regular cart item
    const regularItem = cartItems.find((item) => !item.cartOfferProductId);
    if (!regularItem) {
      toast.error('No regular product found in cart');
      return;
    }

    try {
      await addOfferProductToCart(regularItem.id, offerProduct.id, offerProduct.ourPrice);
      toast.success(`${offerProduct.productName} added to cart!`);
    } catch (error) {
      console.error('Error adding offer product:', error);
      toast.error('Failed to add offer product');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      toast.error('Please enter a coupon code');
      return;
    }
    await applyCoupon(couponCode);
    const { couponStatus: status, coupon } = useCartStore.getState();
    if (status === 'applied' && coupon) {
      toast.success(`Coupon ${coupon.code} applied (${coupon.type === 'amount' ? formatCurrency(coupon.value) : `${coupon.value}%`})`);
    } else if (status === 'invalid') {
      toast.error('Invalid coupon code');
    } else if (status === 'invalid_amount') {
      toast.error('Coupon has an invalid discount value');
    } else if (status === 'expired') {
      toast.error('Coupon has expired');
    } else if (status === 'used') {
      toast.error('Coupon has already been used');
    }
    setCouponCode('');
  };

  const handleCheckout = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to proceed to checkout');
      router.push('/signin');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      for (const item of cartItems) {
        const itemPrice = Number(item.variant.ourPrice) || 0;
        const offerPrice = item.cartOfferProductId ? Number(item.offerProduct?.ourPrice) || 0 : 0;
        const totalPrice = (itemPrice + offerPrice) * item.quantity;
        if (isNaN(totalPrice)) {
          throw new Error(`Invalid price for item ${item.productId}`);
        }
        await addToCheckout({
          userId: user.id,
          productId: item.productId,
          variantId: item.variantId,
          totalPrice,
          quantity: item.quantity,
          cartOfferProductId: item.cartOfferProductId,
        });
      }

      toast.success('Items added to checkout');
      router.push(
        coupon && couponStatus === 'applied' && coupon.value != null
          ? `/checkout?coupon=${coupon.code}&discountType=${coupon.type}&discountValue=${coupon.value}`
          : '/checkout'
      );
      await clearCart();
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to proceed to checkout. Please try again.');
    }
  };

  const handleRemoveFromCart = async (productId: string, variantId: string) => {
    setIsUpdating(variantId);
    try {
      await removeFromCart(productId, variantId);
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    setIsUpdating(cartItemId);
    try {
      await updateQuantity(cartItemId, quantity);
      toast.success('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdating(null);
    }
  };

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Cart', path: '/cart' },
  ];

  // Map range to display name
  const rangeDisplayNames: Record<string, string> = {
    '1000': 'Above ₹1,000',
    '5000': 'Above ₹5,000',
    '10000': 'Above ₹10,000',
    '25000': 'Above ₹25,000',
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="mx-auto">
          <p className="text-center text-gray-600 text-lg">Loading cart...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="mx-auto ">
        <Breadcrumbs breadcrumbs={breadcrumbItems} />
        <h1 className="text-2xl font-bold text-gray-900 my-6 nohemi-bold">
          Shopping Cart ({getItemCount()} {getItemCount() === 1 ? 'item' : 'items'})
        </h1>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven’t added any items yet.</p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors text-base font-medium"
              aria-label="Continue shopping"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items and Offer Products */}
            <div className="flex-1">
              {/* Cart Items */}
              <div className="space-y-4 mb-8">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <CartItemComponent
                      item={item}
                      isUpdating={isUpdating}
                      handleUpdateQuantity={handleUpdateQuantity}
                      handleRemoveFromCart={handleRemoveFromCart}
                    />
                    {item.cartOfferProductId && item.offerProduct && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Included Offer Product:</h4>
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20">
                            <Image
                              src={item.offerProduct.productImage || '/placeholder.png'}
                              alt={item.offerProduct.productName}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.offerProduct.productName}</p>
                            <p className="text-sm text-gray-600">Price: {formatCurrency(Number(item.offerProduct.ourPrice))}</p>
                            <p className="text-sm text-green-600">Offer Product</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Offer Products Section */}
              {effectiveRange && hasRegularProduct && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 nohemi-bold">
                    Eligible Offer Products ({rangeDisplayNames[effectiveRange] || 'Offers'} - Cart Value: {formatCurrency(subtotal)})
                  </h2>
                  {isFetchingOffers ? (
                    <p className="text-gray-600">Loading offer products...</p>
                  ) : offerProducts.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600 mb TWITTER_X_ID mb-4">
                        Add an offer product to your cart:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {offerProducts.map((product) =>(
                          <div
                            key={product.id}
                            className="relative bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="relative w-full aspect-square mb-2">
                              <Image
                                src={product.productImage || '/placeholder.png'}
                                alt={product.productName}
                                fill
                                className="object-cover rounded-md"
                              />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                              {product.productName}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Price: {formatCurrency(Number(product.ourPrice))}
                            </p>
                            <Button
                              onClick={() => handleAddOfferProduct(product)}
                              className="w-full bg-blue-600 text-white hover:bg-blue-700"
                              disabled={hasOfferProductInCart || !hasRegularProduct}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">No offer products available for this cart value.</p>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 nohemi-bold">
                  Order Summary
                </h2>
                <div className="space-y-4">
                  {/* Coupon Section */}
                  <div>
                    <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-1">
                      Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={couponStatus === 'applied'}
                      />
                      {coupon && couponStatus === 'applied' ? (
                        <button
                          onClick={removeCoupon}
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={handleApplyCoupon}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {couponStatus === 'applied' && coupon && (
                      <p className="text-sm text-green-600 mt-2">
                        Coupon {coupon.code} applied (
                        {coupon.type === 'amount'
                          ? formatCurrency(coupon.value)
                          : coupon.value != null
                          ? `${coupon.value}%`
                          : 'Invalid discount'}
                        )
                      </p>
                    )}
                    {couponStatus === 'invalid' && (
                      <p className="text-sm text-red-600 mt-2">Invalid coupon code</p>
                    )}
                    {couponStatus === 'invalid_amount' && (
                      <p className="text-sm text-red-600 mt-2">Coupon has an invalid discount value</p>
                    )}
                    {couponStatus === 'used' && (
                      <p className="text-sm text-red-600 mt-2">Coupon has already been used</p>
                    )}
                    {couponStatus === 'expired' && (
                      <p className="text-sm text-red-600 mt-2">Coupon has expired</p>
                    )}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price ({getItemCount()} items)</span>
                      <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    {cartItems.some(item => item.cartOfferProductId) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Offer Products</span>
                        <span className="text-gray-900">
                          {formatCurrency(cartItems.reduce((sum, item) => 
                            item.cartOfferProductId ? sum + (Number(item.offerProduct?.ourPrice) || 0) * item.quantity : sum, 
                            0
                          ))}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Charges</span>
                      <span className="text-gray-900">{formatCurrency(shippingAmount)}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">You Save</span>
                        <span className="text-green-600">{formatCurrency(savings)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Coupon Discount ({coupon?.code})</span>
                        <span className="text-green-600">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>{formatCurrency(grandTotal + shippingAmount)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 text-base font-medium"
                  disabled={cartItems.length === 0 || isUpdating !== null}
                  aria-label="Proceed to checkout"
                >
                  Proceed to Checkout
                </button>
                <Link
                  href="/"
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-4"
                  aria-label="Continue shopping"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default CartPage;