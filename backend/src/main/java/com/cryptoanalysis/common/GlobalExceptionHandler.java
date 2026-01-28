package com.cryptoanalysis.common;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  /**
   * Handle validation errors
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidationExceptions(
      MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();

    // Get all field errors
    ex.getBindingResult()
        .getAllErrors()
        .forEach(
            error -> {
              String fieldName = ((FieldError) error).getField();
              String errorMessage = error.getDefaultMessage();
              errors.put(fieldName, errorMessage);
            });

    // Create response
    Map<String, Object> response = new HashMap<>();
    response.put("success", false);
    response.put("message", "Validation failed");
    response.put("errors", errors);
    response.put("timestamp", System.currentTimeMillis());

    return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
  }

  /**
   * Handle general exceptions
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleGeneralExceptions(Exception ex) {
    Map<String, Object> response = new HashMap<>();
    response.put("success", false);
    response.put("message", ex.getMessage() != null ? ex.getMessage() : "An error occurred");
    response.put("timestamp", System.currentTimeMillis());

    return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
