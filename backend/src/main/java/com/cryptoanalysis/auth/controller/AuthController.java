package com.cryptoanalysis.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cryptoanalysis.auth.dto.AuthResponse;
import com.cryptoanalysis.auth.dto.LoginRequest;
import com.cryptoanalysis.auth.dto.RegisterRequest;
import com.cryptoanalysis.auth.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "APIs for user authentication and registration")
@CrossOrigin(origins = "*")
public class AuthController {

  private final AuthService authService;

  @PostMapping("/register")
  @Operation(summary = "Register new user", description = "Create a new user account")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    log.info("POST /auth/register - username: {}, email: {}", request.getUsername(), request.getEmail());

    AuthResponse response = authService.register(request);

    return ResponseEntity.ok(response);
  }

  @PostMapping("/login")
  @Operation(summary = "Login user", description = "Authenticate user and return JWT token")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    log.info("POST /auth/login - email: {}", request.getEmail());

    AuthResponse response = authService.login(request);

    return ResponseEntity.ok(response);
  }
}
