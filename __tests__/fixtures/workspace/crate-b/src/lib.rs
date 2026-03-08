pub use publish_crates_test_crate_a::hello;

pub fn world() -> &'static str {
    "world from crate-b"
}
