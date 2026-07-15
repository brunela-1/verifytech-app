import apiClient from './client';

export type EventType =
  | 'page_view'
  | 'page_abandon'
  | 'history_view'
  | 'file_upload_start'
  | 'file_upload_abandon'
  | 'profile_comparison'
  | 'registration_start'
  | 'registration_complete'
  | 'proposal_view'
  | 'proposal_abandon'
  | 'proposal_accepted_notification';

export type ReferralSource =
  | 'friend_family'
  | 'social_media'
  | 'hardware_store'
  | 'google_search';

/** Registra un evento de actividad/navegación. */
export const trackEvent = (
  event_type: EventType,
  page_name?: string,
  metadata?: Record<string, unknown>,
) =>
  apiClient
    .post('/api/metrics/event', { event_type, page_name, metadata })
    .catch(() => {}); // silencioso, no bloquea UX

/** Registra fuente de referral al completar el registro. */
export const trackReferral = (source: ReferralSource) =>
  apiClient
    .post('/api/metrics/referral', { source })
    .catch(() => {});

/** Retorna el dashboard de métricas agregadas. */
export const getDashboard = () => apiClient.get('/api/metrics/dashboard');
