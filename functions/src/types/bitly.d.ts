declare module "bitly" {
  export class BitlyClient {
    constructor(accessToken: string, options?: { domain?: string });
    shorten(longUrl: string): Promise<{ url: string }>;
    expand(shortUrl: string): Promise<{ long_url: string }>;
    // You can add more methods if you need
  }
}
