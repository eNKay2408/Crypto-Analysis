package com.cryptoanalysis.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api")
@Slf4j
@Tag(name = "Test API", description = "Test protected endpoints")
public class TestController {

  @GetMapping("/protected")
  @Operation(summary = "Test protected endpoint", description = "Requires JWT authentication")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<?> testProtected() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    log.info("Protected endpoint accessed by: {}", auth.getName());

    return ResponseEntity.ok(new TestResponse(
        true,
        "Access granted to protected resource",
        auth.getName()));
  }

  record TestResponse(boolean success, String message, String user) {
  }
}
