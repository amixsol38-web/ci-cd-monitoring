import React, { useEffect, useState } from "react";
import ProductList from "../components/ProductList";
import { TextField, Container, Typography } from "@mui/material";

function Home() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = searchTerm.trim();
    const url = query
      ? `/api/products/search?query=${encodeURIComponent(query)}`
      : "/api/products/";

    const timeoutId = setTimeout(() => {
      fetch(url, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setProducts(data);
          setError("");
        })
        .catch((fetchError) => {
          if (fetchError.name === "AbortError") {
            return;
          }
          console.error("Error loading products:", fetchError);
          setError("Couldn't load products right now.");
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <Container>
      <TextField
        label="Search products"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {error ? <Typography color="error">{error}</Typography> : null}
      <ProductList products={products} />
    </Container>
  );
}

export default Home;
