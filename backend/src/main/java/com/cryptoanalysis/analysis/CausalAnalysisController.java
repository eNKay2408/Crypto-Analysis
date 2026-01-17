package com.cryptoanalysis.analysis;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cryptoanalysis.common.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller for Causal Analysis endpoints
 */
@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
@Tag(name = "Causal Analysis", description = "AI-powered news impact analysis")
@CrossOrigin(origins = "http://localhost:5173")
public class CausalAnalysisController {

  private final CausalAnalysisService causalAnalysisService;

  @Operation(summary = "Analyze news impact", description = "Get AI-generated causal analysis for a news article")
  @GetMapping("/{newsId}")
  public ResponseEntity<ApiResponse<CausalAnalysisDTO>> analyzeNews(
      @PathVariable String newsId) {

    CausalAnalysisDTO analysis = causalAnalysisService.analyzeNewsImpact(newsId);

    return ResponseEntity.ok(ApiResponse.success(analysis, "Analysis completed successfully"));
  }

  @Operation(summary = "Batch analyze news", description = "Analyze multiple news articles at once")
  @PostMapping("/batch")
  public ResponseEntity<ApiResponse<java.util.List<CausalAnalysisDTO>>> batchAnalyze(
      @RequestBody java.util.List<String> newsIds) {

    java.util.List<CausalAnalysisDTO> analyses = causalAnalysisService.batchAnalyze(newsIds);

    return ResponseEntity.ok(ApiResponse.success(analyses,
        "Batch analysis completed for " + analyses.size() + " articles"));
  }
}
