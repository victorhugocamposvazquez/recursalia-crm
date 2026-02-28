export interface HotmartTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface HotmartCreateProductPayload {
  name: string;
  description: string;
  benefits?: string;
  price: number;
  category?: { id: number };
}

export interface HotmartProductResponse {
  id?: string;
  name?: string;
  price?: { value?: number };
  [key: string]: unknown;
}
