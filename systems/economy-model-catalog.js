"use strict";

/**
 * PRINCIPIA Virtual Economy — 70-model investment & market simulator catalog.
 * All models use simulated balances only; no real-money trading or execution.
 * Profiles are parameterized simulations, not individualized financial advice.
 */

const GROUPS = Object.freeze({
  trading: "Trading, Flipping & Arbitrage",
  digital: "Digital Assets, Crypto & Web3",
  funds: "Funds, Equity & Enterprise",
  passive: "Passive Income, Credit & Real Assets"
});

const raw = [
  // 27 Trading, flipping, arbitrage
  ["spot_trading","Spot Trading","trading","directional",0.18],
  ["day_trading","Day Trading","trading","directional",0.28],
  ["swing_trading","Swing Trading","trading","directional",0.22],
  ["position_trading","Position Trading","trading","directional",0.16],
  ["scalping","Scalping","trading","directional",0.35],
  ["momentum","Momentum Trading","trading","directional",0.24],
  ["mean_reversion","Mean Reversion","trading","mean_reversion",0.2],
  ["breakout","Breakout Trading","trading","directional",0.27],
  ["trend_following","Trend Following","trading","directional",0.2],
  ["contrarian","Contrarian Trading","trading","mean_reversion",0.26],
  ["pairs_trading","Pairs Trading","trading","spread",0.14],
  ["statistical_arbitrage","Statistical Arbitrage","trading","spread",0.17],
  ["triangular_arbitrage","Triangular Arbitrage","trading","arbitrage",0.06],
  ["cross_market_arbitrage","Cross-Market Arbitrage","trading","arbitrage",0.08],
  ["cross_exchange_arbitrage","Cross-Exchange Arbitrage","trading","arbitrage",0.12],
  ["merger_arbitrage","Merger Arbitrage","trading","event",0.15],
  ["index_arbitrage","Index Arbitrage","trading","arbitrage",0.1],
  ["futures_basis","Futures Basis Trading","trading","spread",0.13],
  ["options_directional","Directional Options","trading","options",0.4],
  ["options_spread","Options Spread Strategies","trading","options",0.22],
  ["covered_call","Covered Call","trading","options",0.12],
  ["cash_secured_put","Cash-Secured Put","trading","options",0.15],
  ["market_making","Market Making","trading","market_making",0.1],
  ["inventory_flipping","Inventory Flipping","trading","flipping",0.18],
  ["retail_resale","Retail Resale","trading","flipping",0.2],
  ["collectibles_flipping","Collectibles Flipping","trading","flipping",0.24],
  ["auction_flipping","Auction Flipping","trading","flipping",0.22],
  // 18 Digital assets, crypto, Web3
  ["crypto_spot","Crypto Spot","digital","directional",0.4],
  ["crypto_momentum","Crypto Momentum","digital","directional",0.48],
  ["crypto_swing","Crypto Swing","digital","directional",0.42],
  ["crypto_arbitrage","Crypto Arbitrage","digital","arbitrage",0.24],
  ["stablecoin_yield","Stablecoin Yield Simulation","digital","yield",0.12],
  ["staking","Proof-of-Stake Staking","digital","yield",0.22],
  ["liquid_staking","Liquid Staking","digital","yield",0.28],
  ["lending_borrowing","Crypto Lending & Borrowing","digital","credit",0.3],
  ["liquidity_provision","Liquidity Provision","digital","liquidity",0.35],
  ["amm_pool","AMM Pool Simulation","digital","liquidity",0.4],
  ["yield_farming","Yield Farming","digital","yield",0.5],
  ["yield_aggregation","Yield Aggregation","digital","yield",0.4],
  ["governance_tokens","Governance Tokens","digital","token",0.42],
  ["token_launch","Token Launch Simulation","digital","event",0.7],
  ["nft_market","NFT Market Simulation","digital","market",0.6],
  ["web3_projects","Web3 Project Investing","digital","venture",0.55],
  ["bridge_risk","Cross-Chain Bridge Risk","digital","risk",0.7],
  ["defi_risk","DeFi Protocol Risk","digital","risk",0.65],
  // 12 Funds, equity, enterprise
  ["index_fund","Index Fund","funds","portfolio",0.12],
  ["etf_portfolio","ETF Portfolio","funds","portfolio",0.14],
  ["stock_picking","Stock Selection","funds","portfolio",0.22],
  ["dividend_growth","Dividend Growth","funds","income",0.16],
  ["value_investing","Value Investing","funds","portfolio",0.18],
  ["growth_investing","Growth Investing","funds","portfolio",0.28],
  ["venture_capital","Venture Capital","funds","venture",0.55],
  ["private_equity","Private Equity","funds","enterprise",0.32],
  ["startup_investing","Startup Investing","funds","venture",0.65],
  ["hedge_fund","Hedge Fund Strategy","funds","portfolio",0.3],
  ["business_acquisition","Business Acquisition","funds","enterprise",0.35],
  ["small_business","Small Business Operations","funds","enterprise",0.3],
  // 13 Passive income, credit, real assets
  ["rental_property","Rental Property","passive","real_asset",0.22],
  ["reit","REIT Simulation","passive","real_asset",0.2],
  ["real_estate_flipping","Real Estate Flipping","passive","flipping",0.35],
  ["commercial_property","Commercial Property","passive","real_asset",0.3],
  ["land_investing","Land Investing","passive","real_asset",0.32],
  ["agriculture","Agriculture & Farmland","passive","real_asset",0.38],
  ["equipment_leasing","Equipment Leasing","passive","leasing",0.22],
  ["royalties","Royalties & Licensing","passive","income",0.24],
  ["digital_products","Digital Products","passive","income",0.32],
  ["content_business","Content Business","passive","enterprise",0.4],
  ["peer_lending","Peer-to-Peer Lending","passive","credit",0.4],
  ["bond_portfolio","Bond Portfolio","passive","fixed_income",0.1],
  ["treasury_bills","Treasury Bills","passive","fixed_income",0.04]
];

const MODELS = Object.freeze(raw.map(([id, name, group, mechanic, volatility]) => Object.freeze({
  id, name, group: GROUPS[group], mechanic, volatility, currency: "VIRTUAL",
  simulationOnly: true, leverageAllowed: false
})));

function getModel(id) {
  return MODELS.find(model => model.id === id) || null;
}

function simulateModel({ modelId, capital, periods = 1, expectedReturn = 0.05, seed = 1 } = {}) {
  const model = getModel(modelId);
  if (!model) throw new RangeError("Unknown economy model id");
  if (typeof capital !== "number" || !Number.isFinite(capital) || capital < 0 || capital > 1e12) throw new RangeError("capital must be finite and within 0..1e12");
  if (!Number.isInteger(periods) || periods < 1 || periods > 10000) throw new RangeError("periods must be an integer in 1..10000");
  if (typeof expectedReturn !== "number" || !Number.isFinite(expectedReturn) || expectedReturn < -1 || expectedReturn > 10) throw new RangeError("expectedReturn must be between -1 and 10");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError("seed must be an unsigned 32-bit integer");
  // Seeded PRNG for reproducible Monte-Carlo-style illustrative runs.
  let state = seed || 1;
  const random = () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
  let balance = capital;
  const trace = [];
  for (let i = 0; i < periods; i++) {
    const shock = (random() * 2 - 1) * model.volatility;
    const rate = Math.max(-1, Math.min(10, expectedReturn + shock));
    balance *= 1 + rate;
    if (!Number.isFinite(balance)) throw new RangeError("simulation overflow");
    trace.push(Object.freeze({ period: i + 1, rate, balance }));
  }
  return Object.freeze({ model, capital, finalBalance: balance, pnl: balance - capital, periods, seed, trace: Object.freeze(trace) });
}

module.exports = { GROUPS, MODELS, getModel, simulateModel };
