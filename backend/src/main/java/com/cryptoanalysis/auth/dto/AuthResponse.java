package com.cryptoanalysis.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

  private boolean success;
  private String message;
  private String token;
  private UserDTO user;

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
  }
}
