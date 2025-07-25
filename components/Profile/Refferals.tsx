'use client';

import { useAuthStore } from '@/store/auth-store';
import { useProfileStore } from '@/store/profile-store';
import { useState } from 'react';
import { AlertCircle, Gift, Users, Award, Loader2, ExternalLink, Check, Copy } from 'lucide-react';
import Image from 'next/image';
import SkeletonLoader from '../Reusable/SkeletonLoader';

export default function Referrals() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { referrals, loadingStates, isRefetching, errors, shareCurrentPage } = useProfileStore();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    shareCurrentPage('referrals');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error(e);
      return dateString;
    }
  };

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'email') => {
    const message = `Join me on our platform using my referral link and we both get benefits!`;
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referrals.referralLink)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          message
        )}&url=${encodeURIComponent(referrals.referralLink)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + referrals.referralLink)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(
          'Join me using my referral link'
        )}&body=${encodeURIComponent(message + '\n\n' + referrals.referralLink)}`;
        break;
    }
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  if (authLoading || loadingStates.referrals) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonLoader count={4} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" />
        <SkeletonLoader count={2} className="space-y-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Authentication required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please log in to access your referral program.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 nohemi-bold">
          Referral <span className="border-b-3 border-primary text-primary">Program</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{referrals.stats.totalReferrals}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Successful Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{referrals.stats.completedReferrals}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <Gift className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Coupons</p>
              <p className="text-2xl font-bold text-gray-900">{referrals.stats.totalCoupons}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <Gift className="h-8 w-8 text-indigo-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available Coupons</p>
              <p className="text-2xl font-bold text-gray-900">{referrals.stats.availableCoupons}</p>
            </div>
          </div>
        </div>
      </div>

      {errors.referrals && (
        <div className="bg-red-50 border border-yellow-200 rounded-md p-4 my-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{errors.referrals?.message || String(errors.referrals)}</p>
            </div>
          </div>
        </div>
      )}

      {!errors.referrals && (
        <>
          <div className="bg-white sm:rounded-lg overflow-hidden border border-gray-200 mb-8">
            <div className="px-4 py-5 sm:px-6 bg-orange-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Referral Link</h3>
              <p className="mt-1 text-sm text-gray-600">
                Share this link with friends. When they sign up, you&apos;ll both receive rewards!
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  className="flex-1 block w-full min-w-0 border px-2 border-gray-300 rounded-md -sm "
                  value={referrals.referralLink}
                  readOnly
                />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center px-4 py-2 border border-transparent -sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover "
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">Share via:</p>
                <div className="flex space-x-2">
                  {['facebook', 'twitter', 'whatsapp', 'email'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => handleShare(platform as 'facebook' | 'twitter' | 'whatsapp' | 'email')}
                      className="inline-flex items-center text-sm font-medium rounded-md text-gray-700 cursor-pointer "
                      aria-label={`Share referral link on ${platform}`}
                    >
                      <Image
                        src={`https://img.icons8.com/?size=100&id=${
                          platform === 'facebook' ? 'uLWV5A9vXIPu' :
                          platform === 'twitter' ? 'phOKFKYpe00C' :
                          platform === 'whatsapp' ? '16713' : 'P7UIlhbpWzZm'
                        }&format=png&color=000000`}
                        alt={platform}
                        width={40}
                        height={40}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
              <div className="text-sm">
                <p className="text-gray-500">
                  Earn a ₹100 coupon for each friend who signs up and places their first order.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white sm:rounded-lg overflow-hidden border border-gray-200 mb-8">
            <div className="px-4 py-5 sm:px-6 bg-green-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Coupons</h3>
              <p className="mt-1 text-sm text-gray-600">
                Coupons you&apos;ve earned from successful referrals
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {referrals.coupons.length > 0 ? (
                <div className="space-y-4">
                  {referrals.coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className={`border ${
                        coupon.isUsed ? 'border-gray-200 bg-gray-50' : 'border-green-200 bg-green-50'
                      } rounded-lg p-4 flex justify-between items-center`}
                    >
                      <div>
                        <div className="flex items-center">
                          <Gift
                            className={`h-5 w-5 ${coupon.isUsed ? 'text-gray-400' : 'text-green-500'} mr-2`}
                          />
                          <span className="font-medium">{coupon.code}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">₹{coupon.discount} discount</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {coupon.isUsed
                            ? 'Used on ' + formatDate(coupon.createdAt.toString())
                            : 'Expires on ' + formatDate(coupon.expiryDate.toString())}
                        </p>
                      </div>
                      {!coupon.isUsed && (
                        <a
                          href="/shop"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover "
                        >
                          Use Now
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No coupons yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start sharing your referral link to earn coupons!
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white sm:rounded-lg overflow-hidden border border-gray-200">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Referral History</h3>
              <p className="mt-1 text-sm text-gray-600">
                Track the status of people you&apos;ve referred
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {referrals.referrals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          User
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Reward
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {referrals.referrals.map((referral) => (
                        <tr key={referral.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {referral.referredUserId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(referral.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                referral.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {referral.status === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {referral.couponGenerated ? (
                              <span className="text-green-600 font-medium">₹100 Coupon Issued</span>
                            ) : referral.status === 'completed' ? (
                              <span className="text-yellow-600">Processing</span>
                            ) : (
                              <span className="text-gray-500">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No referrals yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Share your referral link to start earning rewards!
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-orange-50 rounded-lg p-6 border border-orange-100">
            <h3 className="text-lg font-medium text-orange-900">How Our Referral Program Works</h3>
            <div className="mt-4 space-y-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-200 text-orange-600 font-medium">
                    1
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-900">Share your unique referral link</p>
                  <p className="mt-1 text-sm text-orange-700">
                    Copy your personal referral link and share it with friends and family.
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-200 text-orange-600 font-medium">
                    2
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-900">Friends sign up using your link</p>
                  <p className="mt-1 text-sm text-orange-700">
                    When someone uses your link to create an account, they&apos;re added to your referrals.
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-200 text-orange-600 font-medium">
                    3
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-900">
                    Earn rewards when they complete a purchase
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    After your referred friend makes their first purchase, you&apos;ll receive a ₹100 coupon.
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-200 text-orange-600 font-medium">
                    4
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-900">Use your coupons on your next purchase</p>
                  <p className="mt-1 text-sm text-orange-700">
                    Apply your earned coupons during checkout for a ₹100 discount.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <a
                href="/referral-terms"
                className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-500"
              >
                View full terms and conditions
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}