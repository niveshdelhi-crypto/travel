import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    skipCsrf?: boolean;
    retry?: number;
    retryDelayMs?: number;
    __isRetryRequest?: boolean;
    __retryCount?: number;
  }

  export interface InternalAxiosRequestConfig {
    skipAuthRefresh?: boolean;
    skipCsrf?: boolean;
    retry?: number;
    retryDelayMs?: number;
    __isRetryRequest?: boolean;
    __retryCount?: number;
  }
}
