package com.cryptoanalysis.config;

import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import com.zaxxer.hikari.HikariDataSource;

import jakarta.persistence.EntityManagerFactory;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = {
    "com.cryptoanalysis.auth.repository",
    "com.cryptoanalysis.candle.repository" // Added for Kline repository
}, entityManagerFactoryRef = "primaryEntityManagerFactory", transactionManagerRef = "primaryTransactionManager")
public class PrimaryDataSourceConfig {

  @Primary
  @Bean(name = "primaryDataSourceProperties")
  @ConfigurationProperties("spring.datasource")
  public DataSourceProperties primaryDataSourceProperties() {
    return new DataSourceProperties();
  }

  @Primary
  @Bean(name = "primaryDataSource")
  @ConfigurationProperties("spring.datasource.configuration")
  public DataSource primaryDataSource(@Qualifier("primaryDataSourceProperties") DataSourceProperties properties) {
    return properties.initializeDataSourceBuilder()
        .type(HikariDataSource.class)
        .build();
  }

  @Primary
  @Bean(name = "primaryEntityManagerFactory")
  public LocalContainerEntityManagerFactoryBean primaryEntityManagerFactory(
      EntityManagerFactoryBuilder builder,
      @Qualifier("primaryDataSource") DataSource dataSource) {

    Map<String, String> properties = new HashMap<>();
    properties.put("hibernate.hbm2ddl.auto", "update");
    properties.put("hibernate.physical_naming_strategy",
        "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy");

    return builder
        .dataSource(dataSource)
        .packages("com.cryptoanalysis.auth.model",
            "com.cryptoanalysis.websocket.model")
        .persistenceUnit("primary")
        .properties(properties)
        .build();
  }

  @Primary
  @Bean(name = "primaryTransactionManager")
  public PlatformTransactionManager primaryTransactionManager(
      @Qualifier("primaryEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new JpaTransactionManager(entityManagerFactory);
  }
}
