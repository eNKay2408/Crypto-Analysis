package com.cryptoanalysis.candle.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.cryptoanalysis.candle.dto.CandleDTO;
import com.cryptoanalysis.websocket.model.Kline;

@Component
public class CandleMapper {
    
    /**
     * Convert DTO to Entity
     */
    public Kline toEntity(CandleDTO dto, String symbol, String interval) {
        return Kline.builder()
            .symbol(symbol)
            .interval(interval)
            .openTime(dto.getTime() * 1000) // Convert seconds to milliseconds
            .closeTime(dto.getTime() * 1000 + getIntervalMillis(interval))
            .openPrice(dto.getOpen())
            .highPrice(dto.getHigh())
            .lowPrice(dto.getLow())
            .closePrice(dto.getClose())
            .volume(dto.getVolume())
            .build();
    }
    
    /**
     * Convert Entity to DTO
     */
    public CandleDTO toDTO(Kline entity) {
        return CandleDTO.builder()
            .time(entity.getOpenTime() / 1000) // Convert milliseconds to seconds
            .open(entity.getOpenPrice())
            .high(entity.getHighPrice())
            .low(entity.getLowPrice())
            .close(entity.getClosePrice())
            .volume(entity.getVolume())
            .build();
    }
    
    /**
     * Convert list of entities to DTOs
     */
    public List<CandleDTO> toDTOList(List<Kline> entities) {
        return entities.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Convert list of DTOs to entities
     */
    public List<Kline> toEntityList(List<CandleDTO> dtos, String symbol, String interval) {
        return dtos.stream()
            .map(dto -> toEntity(dto, symbol, interval))
            .collect(Collectors.toList());
    }
    
    /**
     * Helper: Convert interval string to milliseconds
     */
    private long getIntervalMillis(String interval) {
        return switch (interval.toLowerCase()) {
            case "1m" -> 60 * 1000L;
            case "3m" -> 3 * 60 * 1000L;
            case "5m" -> 5 * 60 * 1000L;
            case "15m" -> 15 * 60 * 1000L;
            case "30m" -> 30 * 60 * 1000L;
            case "1h" -> 60 * 60 * 1000L;
            case "2h" -> 2 * 60 * 60 * 1000L;
            case "4h" -> 4 * 60 * 60 * 1000L;
            case "6h" -> 6 * 60 * 60 * 1000L;
            case "8h" -> 8 * 60 * 60 * 1000L;
            case "12h" -> 12 * 60 * 60 * 1000L;
            case "1d" -> 24 * 60 * 60 * 1000L;
            case "3d" -> 3 * 24 * 60 * 60 * 1000L;
            case "1w" -> 7 * 24 * 60 * 60 * 1000L;
            case "1M" -> 30 * 24 * 60 * 60 * 1000L;
            default -> throw new IllegalArgumentException("Invalid interval: " + interval);
        };
    }
}
