'use client';

import React, { Suspense } from 'react';
import UserLayout from '@/components/Layouts/UserLayout';
import ProductListing from '@/components/Listing/ProductListing';
import { useSearchParams } from 'next/navigation';

const SearchPageLoading = () => (
    <UserLayout>
        <div className="mx-auto py-6">
            <div className="w-full h-48 bg-gray-100 rounded-lg mb-8 animate-pulse">
                <div className="p-8">
                    <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full max-w-md"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
                        <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                        <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        </div>
    </UserLayout>
);

function SearchPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    return (
        <UserLayout>
            <div className="mx-auto pt-4 pb-10">
                {/* <div className="w-full h-48 bg-gray-100 rounded-lg mb-8 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                        <div className="px-8 text-white">
                            <h2 className="text-2xl font-bold mb-2">
                                {query ? `Search Results for "${query}"` : 'Search Products'}
                            </h2>
                            <p className="text-sm text-gray-200 max-w-md">
                                {query
                                    ? `Browse our products matching your search for "${query}"`
                                    : "Find exactly what you're looking for in our extensive catalog"}
                            </p>
                        </div>
                    </div>
                </div> */}
                <ProductListing searchQuery={query} />
            </div>
        </UserLayout>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchPageLoading />}>
            <SearchPageContent />
        </Suspense>
    );
}