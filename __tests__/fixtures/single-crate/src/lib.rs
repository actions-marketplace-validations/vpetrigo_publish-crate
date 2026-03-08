pub fn hello() -> &'static str {
    "hello"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(hello(), "hello");
    }
}
