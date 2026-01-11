package com.cryptoanalysis.websocket.model;

import com.cryptoanalysis.core.model.AbstractEntity;
import com.cryptoanalysis.websocket.enums.SymbolStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "symbols")
@Data
@EqualsAndHashCode(callSuper = true)
public class Symbol extends AbstractEntity {
    private String symbol;
    private String baseAsset;
    private String quoteAsset;

    @Enumerated(EnumType.STRING)
    private SymbolStatus status;

    private Integer pricePrecision;
    private Integer quantityPrecision;
}
