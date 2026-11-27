# PRINCIPIA Live Market Data

Standalone Go service. It does not modify the physics, learning, progression, or economy simulation engines.

## Providers

- Stocks: SSI FastConnect intraday OHLC (requires licensed SSI FastConnect credentials).
- FX: ExchangeRate-API Open Access latest reference rates. This is a periodically refreshed reference feed, not tick-by-tick interbank pricing.
- Real estate: BDS Chat listings API (requires API key). Listing timestamps are source timestamps; listing prices are asking prices, not verified transaction prices or a real-time appraisal.

## Configuration

Set server-side environment variables; never put provider secrets in browser JavaScript:

- `ADDR` (default `:8090`)
- `ALLOWED_ORIGIN` (exact PRINCIPIA origin)
- `SSI_CONSUMER_ID`
- `SSI_CONSUMER_SECRET`
- `BDS_CHAT_API_KEY`

## Endpoints

- `GET /healthz`
- `GET /v1/market/stocks?symbols=FPT,VCB`
- `GET /v1/market/fx?base=USD`
- `GET /v1/market/real-estate?district=...`

Stocks return provider intraday records when the exchange/provider has data. Outside trading sessions the last available records may be returned. FX is an updated reference rate. Real-estate results are listings, not continuous market ticks.

All upstream requests have an 8-second timeout and a 2 MiB response cap. CORS is restricted to the configured origin. No trading orders are sent and no real money is handled.
