package com.maka.stock.controller;

import com.maka.stock.core.ApiResponse;
import com.maka.stock.dto.CreateArticleDto;
import com.maka.stock.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    /** GET /api/stock/articles?search=cable&page=1&size=10 */
    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(articleService.getAll(search, page, size)));
    }

    /** GET /api/stock/articles/alertes — Articles sous le seuil minimum */
    @GetMapping("/alertes")
    public ResponseEntity<ApiResponse<?>> getAlertes() {
        return ResponseEntity.ok(ApiResponse.ok(
                articleService.getAlertes(), "Articles en alerte de rupture de stock"));
    }

    /** GET /api/stock/articles/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(articleService.getById(id)));
    }

    /** GET /api/stock/articles/{id}/stocks — Stock détaillé par dépôt */
    @GetMapping("/{id}/stocks")
    public ResponseEntity<ApiResponse<?>> getStockByDepot(@PathVariable Long id) {
        // On récupère directement via le repo pour cet exemple
        return ResponseEntity.ok(ApiResponse.ok(articleService.getStockByDepot(id)));
    }

    /** POST /api/stock/articles */
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@Valid @RequestBody CreateArticleDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(articleService.create(dto), "Article créé avec succès"));
    }

    /** PUT /api/stock/articles/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateArticleDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                articleService.update(id, dto), "Article mis à jour"));
    }

    /** DELETE /api/stock/articles/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long id) {
        articleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Article supprimé avec succès"));
    }
}
