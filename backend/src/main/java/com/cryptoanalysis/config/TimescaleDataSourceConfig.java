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
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import com.zaxxer.hikari.HikariDataSource;

import jakarta.persistence.EntityManagerFactory;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = "com.cryptoanalysis.sentiment.repository", // TimescaleDB repositories
    entityManagerFactoryRef = "timescaleEntityManagerFactory", transactionManagerRef = "timescaleTransactionManager")
public class TimescaleDataSourceConfig {

  @Bean(name = "timescaleDataSourceProperties")
  @ConfigurationProperties("spring.datasource.timescale")
  public DataSourceProperties timescaleDataSourceProperties() {
    return new DataSourceProperties();
  }

  @Bean(name = "timescaleDataSource")
  public DataSource timescaleDataSource(@Qualifier("timescaleDataSourceProperties") DataSourceProperties properties) {
    // Manually build HikariDataSource because ConfigurationProperties doesn't work
    // with nested timescale config
    HikariDataSource dataSource = properties.initializeDataSourceBuilder()
        .type(HikariDataSource.class)
        .build();
    return dataSource;
  }

  @Bean(name = "timescaleEntityManagerFactory")
  public LocalContainerEntityManagerFactoryBean timescaleEntityManagerFactory(
      EntityManagerFactoryBuilder builder,
      @Qualifier("timescaleDataSource") DataSource dataSource) {

    Map<String, String> properties = new HashMap<>();
    properties.put("hibernate.hbm2ddl.auto", "update"); // Auto-create/update tables for TimescaleDB
    properties.put("hibernate.physical_naming_strategy",
        "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy");

    return builder
        .dataSource(dataSource)
        .packages("com.cryptoanalysis.sentiment.model")
        .persistenceUnit("timescale")
        .properties(properties)
        .build();
  }

  @Bean(name = "timescaleTransactionManager")
  public PlatformTransactionManager timescaleTransactionManager(
      @Qualifier("timescaleEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new JpaTransactionManager(entityManagerFactory);
  }
}
