package com.cryptoanalysis.websocket.model;

import com.cryptoanalysis.core.model.AbstractEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "watchlist")
@Data
@EqualsAndHashCode(callSuper = true)
public class Watchlist extends AbstractEntity {
    private Long userId;
    private String symbol;
    private Integer sortOrder;
}