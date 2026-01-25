package com.cryptoanalysis.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.netty.http.client.HttpClient;

/**
 * Application-wide configuration beans
 */
@Configuration
public class AppConfig {

  /**
   * RestTemplate bean for HTTP requests (used by Causal Analysis Service)
   */
  @Bean
  public RestTemplate restTemplate(RestTemplateBuilder builder) {
    return builder.build();
  }

  /**
   * WebClient.Builder with increased buffer size for large Binance API responses
   */
  @Bean
  public WebClient.Builder webClientBuilder() {
    // Increase buffer size to 16MB for large API responses
    ExchangeStrategies strategies = ExchangeStrategies.builder()
        .codecs(configurer -> configurer
            .defaultCodecs()
            .maxInMemorySize(16 * 1024 * 1024)) // 16MB
        .build();

    HttpClient httpClient = HttpClient.create()
        .responseTimeout(java.time.Duration.ofSeconds(30));

    return WebClient.builder()
        .exchangeStrategies(strategies)
        .clientConnector(new ReactorClientHttpConnector(httpClient));
  }
}
