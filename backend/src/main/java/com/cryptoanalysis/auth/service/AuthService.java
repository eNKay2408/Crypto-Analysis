package com.cryptoanalysis.auth.service;

import java.util.ArrayList;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cryptoanalysis.auth.dto.AuthResponse;
import com.cryptoanalysis.auth.dto.LoginRequest;
import com.cryptoanalysis.auth.dto.RegisterRequest;
import com.cryptoanalysis.auth.model.User;
import com.cryptoanalysis.auth.repository.UserRepository;
import com.cryptoanalysis.auth.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService implements UserDetailsService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenProvider jwtTokenProvider;
  private final AuthenticationManager authenticationManager;

  /**
   * Register new user
   */
  @Transactional
  public AuthResponse register(RegisterRequest request) {
    try {
      // Check if email exists
      if (userRepository.existsByEmail(request.getEmail())) {
        return AuthResponse.builder()
            .success(false)
            .message("Email already exists")
            .build();
      }

      // Check if username exists
      if (userRepository.existsByUsername(request.getUsername())) {
        return AuthResponse.builder()
            .success(false)
            .message("Username already exists")
            .build();
      }

      // Create new user
      User user = User.builder()
          .username(request.getUsername())
          .email(request.getEmail())
          .passwordHash(passwordEncoder.encode(request.getPassword()))
          .fullName(request.getFullName())
          .role("USER")
          .build();

      user = userRepository.save(user);
      log.info("User registered successfully: {}", user.getEmail());

      // Generate token
      UserDetails userDetails = loadUserByUsername(user.getEmail());
      String token = jwtTokenProvider.generateToken(userDetails);

      return AuthResponse.builder()
          .success(true)
          .message("Registration successful")
          .token(token)
          .user(convertToUserDTO(user))
          .build();

    } catch (Exception e) {
      log.error("Registration error: ", e);
      return AuthResponse.builder()
          .success(false)
          .message("Registration failed: " + e.getMessage())
          .build();
    }
  }

  /**
   * Login user
   */
  public AuthResponse login(LoginRequest request) {
    try {
      // Authenticate
      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

      // Get user
      User user = userRepository.findByEmail(request.getEmail())
          .orElseThrow(() -> new UsernameNotFoundException("User not found"));

      // Generate token
      UserDetails userDetails = (UserDetails) authentication.getPrincipal();
      String token = jwtTokenProvider.generateToken(userDetails);

      log.info("User logged in successfully: {}", user.getEmail());

      return AuthResponse.builder()
          .success(true)
          .message("Login successful")
          .token(token)
          .user(convertToUserDTO(user))
          .build();

    } catch (Exception e) {
      log.error("Login error: ", e);
      return AuthResponse.builder()
          .success(false)
          .message("Invalid email or password")
          .build();
    }
  }

  /**
   * Load user by email (username in Spring Security context)
   */
  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    return new org.springframework.security.core.userdetails.User(
        user.getEmail(),
        user.getPasswordHash(),
        new ArrayList<>() // Authorities - can be extended later
    );
  }

  /**
   * Convert User entity to DTO
   */
  private AuthResponse.UserDTO convertToUserDTO(User user) {
    return AuthResponse.UserDTO.builder()
        .id(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole())
        .build();
  }
}
