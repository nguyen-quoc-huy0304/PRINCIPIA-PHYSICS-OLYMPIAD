# PRINCIPIA Experimental Data Lab

## Linear least-squares model

The lab fits the model `y = a x + b` using centered sums:

- `a = Σ((xᵢ − x̄)(yᵢ − ȳ)) / Σ((xᵢ − x̄)²)`
- `b = ȳ − a x̄`
- `RMSE = sqrt(Σ(yᵢ − (a xᵢ + b))² / n)`
- `R² = 1 − SSE/SST` when the response has nonzero variance.

The implementation uses centered values to reduce cancellation when x values have a large common offset. Desktop requests use the Rust core; browser-only use has a matching JavaScript fallback.

## Input and validation

- Each row is one finite numeric pair `x,y`.
- At least two points are required.
- Up to 10,000 points are accepted.
- All x values must not be effectively identical.
- The fit is ordinary unweighted least squares.

## Interpretation and limits

R² is a goodness-of-fit statistic, not proof of causality or proof that a linear model is physically correct. RMSE is expressed in the y variable's units. The model does not account for measurement uncertainty, correlated errors, outliers, or errors in x. Select a physically justified model and inspect residuals before drawing scientific conclusions.