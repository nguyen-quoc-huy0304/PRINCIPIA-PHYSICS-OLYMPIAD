"use strict";
/** 80 deterministic economic models for simulations and learning. */
const MODELS=Object.freeze([
  {
    "id": "micro.consumer_spending",
    "category": "micro",
    "name": "consumer_spending"
  },
  {
    "id": "micro.price_elasticity",
    "category": "micro",
    "name": "price_elasticity"
  },
  {
    "id": "micro.income_elasticity",
    "category": "micro",
    "name": "income_elasticity"
  },
  {
    "id": "micro.cross_price_elasticity",
    "category": "micro",
    "name": "cross_price_elasticity"
  },
  {
    "id": "micro.consumer_surplus",
    "category": "micro",
    "name": "consumer_surplus"
  },
  {
    "id": "micro.producer_surplus",
    "category": "micro",
    "name": "producer_surplus"
  },
  {
    "id": "micro.market_equilibrium_gap",
    "category": "micro",
    "name": "market_equilibrium_gap"
  },
  {
    "id": "micro.deadweight_loss",
    "category": "micro",
    "name": "deadweight_loss"
  },
  {
    "id": "micro.marginal_utility",
    "category": "micro",
    "name": "marginal_utility"
  },
  {
    "id": "micro.utility_net",
    "category": "micro",
    "name": "utility_net"
  },
  {
    "id": "macro.nominal_gdp",
    "category": "macro",
    "name": "nominal_gdp"
  },
  {
    "id": "macro.real_gdp",
    "category": "macro",
    "name": "real_gdp"
  },
  {
    "id": "macro.gdp_growth",
    "category": "macro",
    "name": "gdp_growth"
  },
  {
    "id": "macro.gdp_per_capita",
    "category": "macro",
    "name": "gdp_per_capita"
  },
  {
    "id": "macro.cpi_inflation",
    "category": "macro",
    "name": "cpi_inflation"
  },
  {
    "id": "macro.ppi_inflation",
    "category": "macro",
    "name": "ppi_inflation"
  },
  {
    "id": "macro.unemployment_rate",
    "category": "macro",
    "name": "unemployment_rate"
  },
  {
    "id": "macro.labor_participation",
    "category": "macro",
    "name": "labor_participation"
  },
  {
    "id": "macro.output_gap",
    "category": "macro",
    "name": "output_gap"
  },
  {
    "id": "macro.cycle_deviation",
    "category": "macro",
    "name": "cycle_deviation"
  },
  {
    "id": "monetary.money_multiplier",
    "category": "monetary",
    "name": "money_multiplier"
  },
  {
    "id": "monetary.money_velocity",
    "category": "monetary",
    "name": "money_velocity"
  },
  {
    "id": "monetary.quantity_theory_price",
    "category": "monetary",
    "name": "quantity_theory_price"
  },
  {
    "id": "monetary.real_interest_rate",
    "category": "monetary",
    "name": "real_interest_rate"
  },
  {
    "id": "monetary.fisher_rate",
    "category": "monetary",
    "name": "fisher_rate"
  },
  {
    "id": "monetary.loan_payment",
    "category": "monetary",
    "name": "loan_payment"
  },
  {
    "id": "monetary.compound_interest",
    "category": "monetary",
    "name": "compound_interest"
  },
  {
    "id": "monetary.deposit_growth",
    "category": "monetary",
    "name": "deposit_growth"
  },
  {
    "id": "monetary.credit_growth",
    "category": "monetary",
    "name": "credit_growth"
  },
  {
    "id": "monetary.liquidity_ratio",
    "category": "monetary",
    "name": "liquidity_ratio"
  },
  {
    "id": "fiscal.tax_revenue",
    "category": "fiscal",
    "name": "tax_revenue"
  },
  {
    "id": "fiscal.progressive_tax_estimate",
    "category": "fiscal",
    "name": "progressive_tax_estimate"
  },
  {
    "id": "fiscal.budget_balance",
    "category": "fiscal",
    "name": "budget_balance"
  },
  {
    "id": "fiscal.primary_balance",
    "category": "fiscal",
    "name": "primary_balance"
  },
  {
    "id": "fiscal.debt_gdp_ratio",
    "category": "fiscal",
    "name": "debt_gdp_ratio"
  },
  {
    "id": "fiscal.debt_service_ratio",
    "category": "fiscal",
    "name": "debt_service_ratio"
  },
  {
    "id": "fiscal.fiscal_multiplier",
    "category": "fiscal",
    "name": "fiscal_multiplier"
  },
  {
    "id": "fiscal.government_spending_share",
    "category": "fiscal",
    "name": "government_spending_share"
  },
  {
    "id": "fiscal.deficit_financing_gap",
    "category": "fiscal",
    "name": "deficit_financing_gap"
  },
  {
    "id": "fiscal.debt_projection",
    "category": "fiscal",
    "name": "debt_projection"
  },
  {
    "id": "markets.supply_curve",
    "category": "markets",
    "name": "supply_curve"
  },
  {
    "id": "markets.demand_curve",
    "category": "markets",
    "name": "demand_curve"
  },
  {
    "id": "markets.equilibrium_price",
    "category": "markets",
    "name": "equilibrium_price"
  },
  {
    "id": "markets.equilibrium_quantity",
    "category": "markets",
    "name": "equilibrium_quantity"
  },
  {
    "id": "markets.price_floor_gap",
    "category": "markets",
    "name": "price_floor_gap"
  },
  {
    "id": "markets.price_ceiling_gap",
    "category": "markets",
    "name": "price_ceiling_gap"
  },
  {
    "id": "markets.shortage",
    "category": "markets",
    "name": "shortage"
  },
  {
    "id": "markets.surplus",
    "category": "markets",
    "name": "surplus"
  },
  {
    "id": "markets.hhi_concentration",
    "category": "markets",
    "name": "hhi_concentration"
  },
  {
    "id": "markets.competition_score",
    "category": "markets",
    "name": "competition_score"
  },
  {
    "id": "trade.comparative_advantage_ratio",
    "category": "trade",
    "name": "comparative_advantage_ratio"
  },
  {
    "id": "trade.trade_balance",
    "category": "trade",
    "name": "trade_balance"
  },
  {
    "id": "trade.currency_conversion",
    "category": "trade",
    "name": "currency_conversion"
  },
  {
    "id": "trade.real_exchange_rate",
    "category": "trade",
    "name": "real_exchange_rate"
  },
  {
    "id": "trade.terms_of_trade",
    "category": "trade",
    "name": "terms_of_trade"
  },
  {
    "id": "trade.tariff_price",
    "category": "trade",
    "name": "tariff_price"
  },
  {
    "id": "trade.import_ratio",
    "category": "trade",
    "name": "import_ratio"
  },
  {
    "id": "trade.export_ratio",
    "category": "trade",
    "name": "export_ratio"
  },
  {
    "id": "trade.trade_openness",
    "category": "trade",
    "name": "trade_openness"
  },
  {
    "id": "trade.currency_change_pct",
    "category": "trade",
    "name": "currency_change_pct"
  },
  {
    "id": "business.revenue",
    "category": "business",
    "name": "revenue"
  },
  {
    "id": "business.gross_profit",
    "category": "business",
    "name": "gross_profit"
  },
  {
    "id": "business.operating_profit",
    "category": "business",
    "name": "operating_profit"
  },
  {
    "id": "business.net_profit",
    "category": "business",
    "name": "net_profit"
  },
  {
    "id": "business.break_even_units",
    "category": "business",
    "name": "break_even_units"
  },
  {
    "id": "business.break_even_sales",
    "category": "business",
    "name": "break_even_sales"
  },
  {
    "id": "business.roi",
    "category": "business",
    "name": "roi"
  },
  {
    "id": "business.roa",
    "category": "business",
    "name": "roa"
  },
  {
    "id": "business.roe",
    "category": "business",
    "name": "roe"
  },
  {
    "id": "business.cash_flow",
    "category": "business",
    "name": "cash_flow"
  },
  {
    "id": "risk.value_at_risk",
    "category": "risk",
    "name": "value_at_risk"
  },
  {
    "id": "risk.expected_return",
    "category": "risk",
    "name": "expected_return"
  },
  {
    "id": "risk.portfolio_variance",
    "category": "risk",
    "name": "portfolio_variance"
  },
  {
    "id": "risk.sharpe_ratio",
    "category": "risk",
    "name": "sharpe_ratio"
  },
  {
    "id": "risk.drawdown_pct",
    "category": "risk",
    "name": "drawdown_pct"
  },
  {
    "id": "risk.risk_adjusted_return",
    "category": "risk",
    "name": "risk_adjusted_return"
  },
  {
    "id": "risk.weighted_scenario_value",
    "category": "risk",
    "name": "weighted_scenario_value"
  },
  {
    "id": "risk.sensitivity_value",
    "category": "risk",
    "name": "sensitivity_value"
  },
  {
    "id": "risk.scenario_delta",
    "category": "risk",
    "name": "scenario_delta"
  },
  {
    "id": "risk.stress_index",
    "category": "risk",
    "name": "stress_index"
  }
]);
function n(i,k,d=0){const v=i[k]??d;if(typeof v!=="number"||!Number.isFinite(v))throw new TypeError(k+" must be finite");return v;}
function ratio(a,b){if(b===0)throw new RangeError("division by zero");return a/b;}
function calc(id,i={}) {
 if(!i||typeof i!=="object"||Array.isArray(i))throw new TypeError("inputs must be object");
 const x=(k,d=0)=>n(i,k,d);
 let y;
 switch(id){
  case "micro.consumer_spending": y=x('quantity')*x('price'); break;
 case "micro.price_elasticity": y=ratio(x('quantityChangePct'),x('priceChangePct')); break;
 case "micro.income_elasticity": y=ratio(x('quantityChangePct'),x('incomeChangePct')); break;
 case "micro.cross_price_elasticity": y=ratio(x('quantityChangePct'),x('otherPriceChangePct')); break;
 case "micro.consumer_surplus": y=0.5*(x('reservationPrice')-x('price'))*x('quantity'); break;
 case "micro.producer_surplus": y=0.5*(x('price')-x('minimumPrice'))*x('quantity'); break;
 case "micro.market_equilibrium_gap": y=x('demand')-x('supply'); break;
 case "micro.deadweight_loss": y=0.5*Math.abs(x('quantityGap')*x('priceGap')); break;
 case "micro.marginal_utility": y=ratio(x('utilityChange'),x('quantityChange')); break;
 case "micro.utility_net": y=x('utility')-x('price')*x('quantity'); break;
 case "macro.nominal_gdp": y=x('quantity')*x('price'); break;
 case "macro.real_gdp": y=ratio(x('nominalGDP'),x('priceIndex',100))*100; break;
 case "macro.gdp_growth": y=ratio(x('currentGDP')-x('previousGDP'),x('previousGDP'))*100; break;
 case "macro.gdp_per_capita": y=ratio(x('gdp'),x('population')); break;
 case "macro.cpi_inflation": y=ratio(x('currentCPI')-x('previousCPI'),x('previousCPI'))*100; break;
 case "macro.ppi_inflation": y=ratio(x('currentPPI')-x('previousPPI'),x('previousPPI'))*100; break;
 case "macro.unemployment_rate": y=ratio(x('unemployed'),x('laborForce'))*100; break;
 case "macro.labor_participation": y=ratio(x('laborForce'),x('workingAgePopulation'))*100; break;
 case "macro.output_gap": y=ratio(x('actualGDP')-x('potentialGDP'),x('potentialGDP'))*100; break;
 case "macro.cycle_deviation": y=x('growthRate')-x('trendGrowth'); break;
 case "monetary.money_multiplier": y=ratio(1,x('reserveRatio')); break;
 case "monetary.money_velocity": y=ratio(x('nominalGDP'),x('moneySupply')); break;
 case "monetary.quantity_theory_price": y=ratio(x('moneySupply')*x('velocity'),x('realOutput')); break;
 case "monetary.real_interest_rate": y=x('nominalRate')-x('inflationRate'); break;
 case "monetary.fisher_rate": y=(1+x('nominalRate'))/(1+x('inflationRate'))-1; break;
 case "monetary.loan_payment": y=(()=>{const r=x('annualRate')/x('periodsPerYear',12),t=x('periods');return r===0?ratio(x('principal'),t):ratio(x('principal')*r*(1+r)**t,(1+r)**t-1)})(); break;
 case "monetary.compound_interest": y=x('principal')*(1+x('rate')/x('frequency',1))**(x('years')*x('frequency',1))-x('principal'); break;
 case "monetary.deposit_growth": y=ratio(x('current')-x('previous'),x('previous'))*100; break;
 case "monetary.credit_growth": y=ratio(x('currentCredit')-x('previousCredit'),x('previousCredit'))*100; break;
 case "monetary.liquidity_ratio": y=ratio(x('liquidAssets'),x('shortTermLiabilities'))*100; break;
 case "fiscal.tax_revenue": y=x('taxBase')*x('taxRate'); break;
 case "fiscal.progressive_tax_estimate": y=x('income')*x('rate')-x('deduction'); break;
 case "fiscal.budget_balance": y=x('revenue')-x('spending'); break;
 case "fiscal.primary_balance": y=x('revenue')-x('spending')+x('interest'); break;
 case "fiscal.debt_gdp_ratio": y=ratio(x('debt'),x('gdp'))*100; break;
 case "fiscal.debt_service_ratio": y=ratio(x('debtService'),x('revenue'))*100; break;
 case "fiscal.fiscal_multiplier": y=ratio(x('outputChange'),x('spendingChange')); break;
 case "fiscal.government_spending_share": y=ratio(x('governmentSpending'),x('gdp'))*100; break;
 case "fiscal.deficit_financing_gap": y=x('deficit')-x('newDebt')-x('moneyFinancing'); break;
 case "fiscal.debt_projection": y=x('debt')*(1+x('interestRate'))+x('primaryDeficit'); break;
 case "markets.supply_curve": y=x('intercept')+x('slope')*x('price'); break;
 case "markets.demand_curve": y=x('intercept')-x('slope')*x('price'); break;
 case "markets.equilibrium_price": y=ratio(x('demandIntercept')-x('supplyIntercept'),x('demandSlope')+x('supplySlope')); break;
 case "markets.equilibrium_quantity": y=(()=>{const p=ratio(x('demandIntercept')-x('supplyIntercept'),x('demandSlope')+x('supplySlope'));return x('supplyIntercept')+x('supplySlope')*p})(); break;
 case "markets.price_floor_gap": y=Math.max(0,x('floorPrice')-x('equilibriumPrice')); break;
 case "markets.price_ceiling_gap": y=Math.max(0,x('equilibriumPrice')-x('ceilingPrice')); break;
 case "markets.shortage": y=Math.max(0,x('demand')-x('supply')); break;
 case "markets.surplus": y=Math.max(0,x('supply')-x('demand')); break;
 case "markets.hhi_concentration": y=(i.shares||[]).reduce((s,v)=>s+v*v,0); break;
 case "markets.competition_score": y=1-Math.min(1,Math.max(0,x('hhi')/10000)); break;
 case "trade.comparative_advantage_ratio": y=ratio(x('domesticOpportunityCost'),x('foreignOpportunityCost')); break;
 case "trade.trade_balance": y=x('exports')-x('imports'); break;
 case "trade.currency_conversion": y=x('amount')*x('exchangeRate'); break;
 case "trade.real_exchange_rate": y=x('nominalRate')*ratio(x('foreignPriceIndex'),x('domesticPriceIndex')); break;
 case "trade.terms_of_trade": y=ratio(x('exportPriceIndex'),x('importPriceIndex'))*100; break;
 case "trade.tariff_price": y=x('worldPrice')*(1+x('tariffRate')); break;
 case "trade.import_ratio": y=ratio(x('imports'),x('gdp'))*100; break;
 case "trade.export_ratio": y=ratio(x('exports'),x('gdp'))*100; break;
 case "trade.trade_openness": y=ratio(x('exports')+x('imports'),x('gdp'))*100; break;
 case "trade.currency_change_pct": y=ratio(x('newRate')-x('oldRate'),x('oldRate'))*100; break;
 case "business.revenue": y=x('price')*x('unitsSold'); break;
 case "business.gross_profit": y=x('revenue')-x('costOfGoodsSold'); break;
 case "business.operating_profit": y=x('grossProfit')-x('operatingExpenses'); break;
 case "business.net_profit": y=x('revenue')-x('costs')-x('taxes'); break;
 case "business.break_even_units": y=ratio(x('fixedCosts'),x('price')-x('variableCost')); break;
 case "business.break_even_sales": y=ratio(x('fixedCosts'),1-ratio(x('variableCosts'),x('revenue'))); break;
 case "business.roi": y=ratio(x('netGain'),x('investment'))*100; break;
 case "business.roa": y=ratio(x('netIncome'),x('assets'))*100; break;
 case "business.roe": y=ratio(x('netIncome'),x('equity'))*100; break;
 case "business.cash_flow": y=x('inflows')-x('outflows'); break;
 case "risk.value_at_risk": y=x('portfolioValue')*x('zScore')*x('volatility'); break;
 case "risk.expected_return": y=(i.returns||[]).reduce((s,r,k)=>s+r*(i.probabilities?.[k]||0),0); break;
 case "risk.portfolio_variance": y=(i.weights||[]).reduce((s,w,k)=>s+w*w*(i.variances?.[k]||0),0)+2*(i.covarianceTerms||[]).reduce((s,c)=>s+c,0); break;
 case "risk.sharpe_ratio": y=ratio(x('return')-x('riskFreeRate'),x('volatility')); break;
 case "risk.drawdown_pct": y=ratio(x('peak')-x('current'),x('peak'))*100; break;
 case "risk.risk_adjusted_return": y=ratio(x('return'),x('risk')); break;
 case "risk.weighted_scenario_value": y=(i.values||[]).reduce((s,v,k)=>s+v*(i.probabilities?.[k]||0),0); break;
 case "risk.sensitivity_value": y=x('baseValue')*(1+x('changePct')/100); break;
 case "risk.scenario_delta": y=x('scenario')-x('baseline'); break;
 case "risk.stress_index": y=x('inflationStress')+x('unemploymentStress')+x('rateStress')+x('growthStress); break;
 default:throw new Error("Unknown economic model id: "+id);
 }
 if(!Number.isFinite(y))throw new RangeError("Model result must be finite");
 return y;
}
function getModel(id){return MODELS.find(m=>m.id===id)||null;}
function listModels(category){return MODELS.filter(m=>!category||m.category===category);}
module.exports={MODELS,calc,getModel,listModels};
