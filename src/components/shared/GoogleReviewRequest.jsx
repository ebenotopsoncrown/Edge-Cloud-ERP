import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";
import { useCompany } from "../auth/CompanyContext";

export default function GoogleReviewRequest() {
  const { currentCompany } = useCompany();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!currentCompany) return;

    // Check if review has already been requested
    const reviewRequested = localStorage.getItem(`review_requested_${currentCompany.id}`);
    if (reviewRequested) return;

    // Check if this is an evaluation account
    if (!currentCompany.is_evaluation) return;

    // Check if company was created recently (within last 7 days)
    const companyCreatedDate = new Date(currentCompany.created_date);
    const daysSinceCreation = Math.floor((Date.now() - companyCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Show dialog if company is between 1-7 days old
    if (daysSinceCreation >= 1 && daysSinceCreation <= 7) {
      // Delay showing the dialog by 2 seconds to let user settle in
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentCompany]);

  const handleLeaveReview = () => {
    // Mark as review requested
    if (currentCompany) {
      localStorage.setItem(`review_requested_${currentCompany.id}`, 'true');
    }
    
    // Open Google review link in new tab
    window.open('https://share.google/xMqrkuYpCED2cvJPl', '_blank');
    setShowDialog(false);
  };

  const handleMaybeLater = () => {
    setShowDialog(false);
    // Don't mark as permanently dismissed - dialog can show again on next login
  };

  const handleDismiss = () => {
    // Mark as permanently dismissed for this company
    if (currentCompany) {
      localStorage.setItem(`review_requested_${currentCompany.id}`, 'true');
    }
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-blue-600">
              🎉 Enjoying Edge Cloud ERP?
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-base pt-2">
            We're thrilled to have you using our platform! Your feedback helps us improve and helps others discover our solution.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-8 h-8 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
          <p className="text-center text-gray-700 font-medium">
            Would you mind taking a moment to leave us a review on Google?
          </p>
          <p className="text-center text-sm text-gray-500">
            It only takes 30 seconds and means the world to us!
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleLeaveReview}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            ⭐ Leave a Review on Google
          </Button>
          <Button
            onClick={handleMaybeLater}
            variant="outline"
            className="w-full"
          >
            Maybe Later
          </Button>
          <button
            onClick={handleDismiss}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Don't ask again
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}