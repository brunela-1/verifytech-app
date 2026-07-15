import apiClient from './client';

export interface CreateReviewBody {
  service_id: string;
  rating: number;
  comment?: string;
}

export const createReview = (data: CreateReviewBody) => apiClient.post('/api/reviews/', data);
export const getTechReviews = (techId: string) => apiClient.get(`/api/reviews/tech/${techId}`);
