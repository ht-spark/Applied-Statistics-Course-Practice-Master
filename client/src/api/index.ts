import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';

axiosForBackend.interceptors.response.use(
  (response) => {
    if (response.status === 403) {
      logger.warn('Permission denied:', response.config.url);
      const error = new Error('Permission denied') as Error & { response: typeof response };
      error.response = response;
      return Promise.reject(error);
    }
    return response;
  },
  (error) => Promise.reject(error),
);

export * as auth from './auth';
export * as university from './university';
export * as question from './question';
export * as order from './order';
export * as study from './study';
export * as admin from './admin';

export default axiosForBackend;
