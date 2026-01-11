package com.cryptoanalysis.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI cryptoAnalysisOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Crypto Analysis API")
                        .description(
                                "Real-time cryptocurrency analysis platform with WebSocket support for live market data")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Crypto Analysis Team")
                                .email("support@cryptoanalysis.com")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Development Server"),
                        new Server()
                                .url("https://api.cryptoanalysis.com")
                                .description("Production Server")));
    }
}
