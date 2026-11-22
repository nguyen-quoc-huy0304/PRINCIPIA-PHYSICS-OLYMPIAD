//! Lightweight repeatable microbenchmark for the native C++ kernel through Rust FFI.
use std::hint::black_box;
use std::time::Instant;

fn measure(label: &str, mut f: impl FnMut(usize) -> f64, iterations: usize) {
    let start = Instant::now();
    let mut checksum = 0.0;
    for i in 0..iterations {
        checksum += black_box(f(black_box(i)));
    }
    let elapsed = start.elapsed();
    let ns_per_op = elapsed.as_nanos() as f64 / iterations as f64;
    println!("{label}: {ns_per_op:.2} ns/op ({iterations} iterations, checksum={checksum:.3})");
}

fn main() {
    const N: usize = 2_000_000;
    measure("native C++ via Rust FFI", |i| {
        principia_core::cpp_physics::velocity(black_box(12.0), black_box(9.81), black_box(i as f64 * 1e-6)).unwrap()
    }, N);
    measure("pure Rust baseline", |i| {
        black_box(12.0) + black_box(9.81) * black_box(i as f64 * 1e-6)
    }, N);
}
