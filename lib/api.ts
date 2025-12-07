import axios, { AxiosError } from 'axios';

const API_URL = 'https://subtext-backend-f8ci.vercel.app/api';

// Local storage keys
const TOKEN_KEY = 'userToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRES_AT_KEY = 'tokenExpiresAt';
const USER_DATA_KEY = 'userData';
const SUBSCRIPTION_KEY = 'hasSubscription';
const ONBOARDING_KEY = 'hasSeenOnboarding';

// ============= Token Management =============
export const saveToken = (token: string, refreshToken?: string, expiresAt?: number): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (expiresAt) {
      localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(expiresAt));
    }
    console.log('Token saved');
  }
};

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
};

export const getTokenExpiresAt = (): number | null => {
  if (typeof window !== 'undefined') {
    const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
    return expiresAt ? parseInt(expiresAt, 10) : null;
  }
  return null;
};

export const isTokenExpired = (): boolean => {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return true;
  // Check if token expires in less than 5 minutes (buffer time)
  return Date.now() / 1000 > expiresAt - 300;
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  }
};

// ============= User Data Management =============
export const saveUserData = (userData: any): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }
};

export const getUserData = (): any | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
};

export const removeUserData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_DATA_KEY);
  }
};

// ============= Subscription Status =============
export const saveSubscriptionStatus = (hasSubscription: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUBSCRIPTION_KEY, String(hasSubscription));
  }
};

export const getLocalSubscriptionStatus = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SUBSCRIPTION_KEY) === 'true';
  }
  return false;
};

export const removeSubscriptionStatus = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SUBSCRIPTION_KEY);
  }
};

// ============= Onboarding Status =============
export const hasSeenOnboarding = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  }
  return false;
};

export const markOnboardingComplete = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }
};

export const resetOnboarding = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ONBOARDING_KEY);
  }
};

// ============= Clear All Data =============
export const clearAllData = (): void => {
  removeToken();
  removeUserData();
  removeSubscriptionStatus();
  if (typeof window !== 'undefined') {
    localStorage.clear();
  }
};

// ============= Token Refresh =============
export const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.warn('No refresh token found');
      return null;
    }

    console.log('Refreshing token...');
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    });

    const { session } = response.data;
    if (session?.accessToken) {
      saveToken(session.accessToken, session.refreshToken, session.expiresAt);
      console.log('Token refreshed successfully');
      return session.accessToken;
    }

    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear invalid tokens
    removeToken();
    return null;
  }
};

// ============= API Helper =============
const getAuthHeaders = async () => {
  let token = getToken();

  // Check if token is expired or about to expire
  if (token && isTokenExpired()) {
    console.log('Token expired or expiring soon, refreshing...');
    token = await refreshAuthToken();

    if (!token) {
      console.warn('Failed to refresh token');
      return {};
    }
  }

  if (!token) {
    console.warn('No auth token found');
    return {};
  }

  return { Authorization: `Bearer ${token}` };
};

// ============= Auth APIs =============
export const signup = async (email: string, password: string, fullName: string) => {
  try {
    console.log('Signing up user:', email);
    const response = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password,
      fullName,
    });

    const { session, user } = response.data;

    // Save token and user data with refresh token and expiration
    if (session?.accessToken) {
      saveToken(session.accessToken, session.refreshToken, session.expiresAt);
    }
    if (user) {
      saveUserData(user);
    }

    console.log('Signup successful');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    console.error('Signup error:', axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.error || 'Signup failed');
  }
};

export const login = async (email: string, password: string) => {
  try {
    console.log('Logging in user:', email);
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    const { session, user } = response.data;

    // Save token and user data with refresh token and expiration
    if (session?.accessToken) {
      saveToken(session.accessToken, session.refreshToken, session.expiresAt);
    }
    if (user) {
      saveUserData(user);
    }

    console.log('Login successful');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    console.error('Login error:', axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.error || 'Login failed');
  }
};

export const logout = async () => {
  try {
    const headers = await getAuthHeaders();
    await axios.post(`${API_URL}/auth/logout`, {}, { headers });
    clearAllData();
    console.log('Logout successful');
  } catch (error) {
    // Clear data even if logout fails
    clearAllData();
    throw error;
  }
};

// ============= OCR API =============
export const uploadImageForOCR = async (imageFile: File) => {
  try {
    console.log('Uploading image for OCR...', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    const formData = new FormData();
    formData.append('image', imageFile);

    const authHeaders = await getAuthHeaders();
    const headers = {
      ...authHeaders,
      'Content-Type': 'multipart/form-data',
    };

    const response = await axios.post(`${API_URL}/ocr`, formData, { headers });
    console.log('OCR response received:', response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    console.error('OCR error:', axiosError.response?.data || axiosError.message);

    // Extract meaningful error message
    const errorMessage = axiosError.response?.data?.message ||
                        axiosError.response?.data?.error ||
                        'OCR processing failed';

    throw new Error(errorMessage);
  }
};

// ============= Analysis API =============
export const analyzeMessages = async (messages: string[]) => {
  try {
    console.log('Analyzing messages...');
    const response = await axios.post(`${API_URL}/analyze`, { messages });
    console.log('Analysis response received');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    console.error('Analysis error:', axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.error || 'Analysis failed');
  }
};

// ============= Subscription APIs =============
export const getSubscriptionPlans = async () => {
  try {
    console.log('Fetching subscription plans...');
    const response = await axios.get(`${API_URL}/subscriptions/plans`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    console.error('Get plans error:', axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.error || 'Failed to fetch plans');
  }
};

export const getSubscriptionStatus = async () => {
  try {
    const headers = await getAuthHeaders();
    console.log('Fetching subscription status...');
    const response = await axios.get(`${API_URL}/subscription/status`, { headers });
    console.log('Subscription status:', response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    console.error('Get subscription status error:', axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.error || 'Failed to fetch subscription status');
  }
};

export const createSubscription = async (subscriptionId: string, tier: string) => {
  try {
    const headers = await getAuthHeaders();
    console.log('Creating subscription...', { subscriptionId, tier });

    const response = await axios.post(
      `${API_URL}/subscriptions/create`,
      { subscriptionId, tier },
      { headers }
    );

    console.log('Subscription created:', response.data);

    // Update local subscription status
    if (response.data.success) {
      saveSubscriptionStatus(true);
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    console.error('Create subscription error:', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message,
    });

    // Extract the most useful error message
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'Failed to create subscription';

    throw new Error(errorMessage);
  }
};

export const cancelSubscription = async (reason?: string) => {
  try {
    const headers = await getAuthHeaders();
    console.log('Cancelling subscription...');

    const response = await axios.post(
      `${API_URL}/subscriptions/cancel`,
      { reason },
      { headers }
    );

    console.log('Subscription cancelled:', response.data);

    // Update local subscription status
    if (response.data.success) {
      saveSubscriptionStatus(false);
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    console.error('Cancel subscription error:', axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.error || 'Failed to cancel subscription');
  }
};
