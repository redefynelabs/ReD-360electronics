'use client';

import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useCheckoutStore } from '@/store/checkout-store';
import { useHomeStore } from '@/store/home-store';
import { useProfileStore } from '@/store/profile-store';
import { logError } from '@/store/store-utils';
import { useWishlistAuthSync, useWishlistStore } from '@/store/wishlist-store';
import { useEffect, useRef, type ReactNode } from 'react';

export const refetchWishlist = async () => {
  const { isLoggedIn, user } = useAuthStore.getState();
  const { fetchWishlist } = useWishlistStore.getState();
  try {
    if (isLoggedIn && user?.id) {
      await fetchWishlist(true);
    }
  } catch (error) {
    logError('refetchWishlist', error);
  }
};

export const refetchCart = async () => {
  const { isLoggedIn, user } = useAuthStore.getState();
  const { fetchCart } = useCartStore.getState();
  try {
    if (isLoggedIn && user?.id) {
      await fetchCart();
      console.log("refetch success for cart")
    }
  } catch (error) {
    logError('refetchCart', error);
  }
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { fetchAuthStatus, isLoggedIn, user } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchCheckoutItems } = useCheckoutStore();
  const { fetchHomeData } = useHomeStore();
  const { fetchProfileData, fetchOrders, fetchReferrals, fetchTickets } = useProfileStore();
  const { fetchWishlist } = useWishlistStore();

  useWishlistAuthSync();

  useEffect(() => {
    const initializeStores = async () => {
      abortControllerRef.current = new AbortController();
      try {
        await fetchAuthStatus();

        if (isLoggedIn && user?.id) {
          const results = await Promise.allSettled([
            fetchCart(),
            fetchCheckoutItems(user.id),
            fetchProfileData(user.id, true, abortControllerRef.current.signal),
            fetchOrders(user.id, true, abortControllerRef.current.signal),
            fetchReferrals(user.id, true, abortControllerRef.current.signal),
            fetchTickets(user.id, true, abortControllerRef.current.signal),
            fetchWishlist(true),
          ]);

          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              logError(`initializeStores[${index}]`, result.reason);
            }
          });
        }

        // Fetch home data only if on home page
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
          await fetchHomeData();
        }
      } catch (error) {
        logError('initializeStores', error);
      }
    };

    initializeStores();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchAuthStatus, fetchCart, fetchCheckoutItems, fetchHomeData, fetchProfileData, fetchOrders, fetchReferrals, fetchTickets, fetchWishlist, isLoggedIn, user?.id]);

  return <>{children}</>;
};