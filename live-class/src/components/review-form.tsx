"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitReview } from "@/app/actions/reviewActions";

interface ReviewFormProps {
    courseId: string;
    existingReview?: {
        rating: number;
        comment: string | null;
    };
}

export function ReviewForm({ courseId, existingReview }: ReviewFormProps) {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState(existingReview?.comment || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a rating");
            return;
        }

        setLoading(true);
        setError("");

        const result = await submitReview(courseId, rating, comment);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setError(result.error || "Failed to submit review");
        }
        setLoading(false);
    };

    return (
        <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">
                {existingReview ? "Update Your Review" : "Write a Review"}
            </h3>

            {/* Star Rating */}
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                    >
                        <Star
                            className={`w-8 h-8 ${star <= (hoverRating || rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-600"
                                }`}
                        />
                    </button>
                ))}
                <span className="ml-2 text-sm text-gray-400">
                    {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""}` : "Click to rate"}
                </span>
            </div>

            {/* Comment */}
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this course (optional)"
                className="w-full h-24 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
            />

            {/* Error/Success */}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">Review submitted successfully!</p>}

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
                {loading ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
            </Button>
        </div>
    );
}

// Star display component for showing average ratings
export function StarRating({ rating, count }: { rating: number; count?: number }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : star <= rating + 0.5
                                ? "fill-yellow-400/50 text-yellow-400"
                                : "text-gray-600"
                        }`}
                />
            ))}
            {count !== undefined && (
                <span className="ml-1 text-sm text-gray-400">({count})</span>
            )}
        </div>
    );
}
