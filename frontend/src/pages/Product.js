import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Typography, Card, CardMedia, CardContent } from "@mui/material";

function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");

  const formatPrice = (price) => {
    const numericPrice = Number(price);
    return Number.isNaN(numericPrice) ? price : numericPrice.toFixed(2);
  };

  useEffect(() => {
    let ignore = false;
    setStatus("loading");

    fetch(`/api/products/${id}`)
      .then((response) => {
        if (response.status === 404) {
          if (!ignore) {
            setProduct(null);
            setStatus("not_found");
          }
          return null;
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        if (!ignore && data) {
          setProduct(data);
          setStatus("ready");
        }
      })
      .catch((error) => {
        if (ignore) {
          return;
        }
        console.error("Error fetching product:", error);
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (status === "loading") {
    return <Typography>Loading...</Typography>;
  }

  if (status === "not_found") {
    return <Typography>Product not found.</Typography>;
  }

  if (status === "error" || !product) {
    return <Typography>Couldn't load this product.</Typography>;
  }

  return (
    <Card sx={{ maxWidth: 600, margin: "2rem auto" }}>
      <CardMedia component="img" height="300" image={product.image} alt={product.name} />
      <CardContent>
        <Typography variant="h4" gutterBottom>
          {product.name}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {product.description}
        </Typography>
        <Typography variant="h5">${formatPrice(product.price)}</Typography>
      </CardContent>
    </Card>
  );
}

export default Product;
