package tech.suchkov.onlineshop.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tech.suchkov.onlineshop.entity.Product;
import tech.suchkov.onlineshop.service.ProductService;

import java.util.Collection;

@RestController
@RequestMapping("/api/products")
public class ProductSearchController {

    @Autowired
    private ProductService productService;

    @GetMapping("/")
    public Collection<Product> home() {
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        return productService.getProduct(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public Collection<Product> search(@RequestParam String query) {
        return productService.searchProductsViaElastic(query);
    }
}
