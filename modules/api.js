let isProd =  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
// isProd = true
export const BASE_URL = isProd
    ? 'api/index.php'
    : 'api/index.php';

const tokenkey = "hnk-shop-token";

function joinUrl(base, path) {
  if (!base) return path;
  if (!path) return base;

  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function resolveUrl(endpoint) {
  const ep = String(endpoint ?? '').trim();
  if (ep === '') return BASE_URL;
  if (/^https?:\/\//i.test(ep)) return ep;
  return joinUrl(BASE_URL, ep);
}

function readTokenFromLocalStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(tokenkey);
  } catch {
    return null;
  }
}

export const getApiBaseUrl = () => {
  return BASE_URL.replace(/\/index\.php.*$/, '').replace(/\/pryss.*$/, '').replace(/\/$/, '');
};

function addQueryParams(url, params) {
  if (!params) return url;
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return url;

  const qs = new URLSearchParams();
  for (const [k, v] of entries) {
    qs.set(k, String(v));
  }

  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}${qs.toString()}`;
}

function isBodyJsonSerializable(body) {
  if (body === null || body === undefined) return false;
  if (typeof body === 'string') return false;

  if (typeof FormData !== 'undefined' && body instanceof FormData) return false;
  if (typeof Blob !== 'undefined' && body instanceof Blob) return false;
  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) return false;
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return false;

  return typeof body === 'object';
}

export async function apiRequest(endpoint, options = {}) {
  const url = addQueryParams(resolveUrl(endpoint), options.params);
  const token = readTokenFromLocalStorage();

  const headers = {
    ...(options.headers ?? {}),
  };

  let body;
  if (options.body !== undefined) {
    if (isBodyJsonSerializable(options.body)) {
      body = JSON.stringify(options.body);
      if (!('Content-Type' in headers)) {
        headers['Content-Type'] = 'application/json';
      }
    } else {
      body = options.body;
    }
  }

  if (token && !('TOKEN' in headers) && !('Authorization' in headers)) {
    headers['token'] = token;
  }

  const res = await fetch(url, {
    ...options,
    method: options.method ?? (body ? 'POST' : 'GET'),
    headers,
    body,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      json && typeof json === 'object' && 'message' in json
        ? String(json.message)
        : `HTTP ${res.status}`;
    throw new Error(message);
  }

  if (json && typeof json === 'object' && 'success' in json) {
    const ok = Boolean(json.success);
    if (!ok) {
      const msg = 'message' in json ? String(json.message) : 'Request failed';
      throw new Error(msg);
    }
    if ('data' in json) {
      return json.data;
    }
  }

  return json;
}

export const get = (url, params = {}, headers = {}) => apiRequest(url, { method: 'GET', params, headers });
export const post = (url, body = {}, params = {}, headers = {}) => apiRequest(url, { method: 'POST', body, params, headers });
export const del = (url, params = {}, headers = {}) => apiRequest(url, { method: 'DELETE', params, headers });

export default { get, post, del };
