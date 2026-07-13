package ma.doctorek.doctorek.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.SimpleCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.Map;

@Configuration
public class CacheConfig implements CachingConfigurer {

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    @Value("${spring.cache.redis.ttl-minutes.medecins:10}")
    private long medecinsTtlMinutes;

    @Value("${spring.cache.redis.ttl-minutes.medecins-search:3}")
    private long medecinsSearchTtlMinutes;

    @Value("${spring.cache.redis.ttl-minutes.creneaux:5}")
    private long creneauxTtlMinutes;

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        var jsonSerializer = new GenericJackson2JsonRedisSerializer();
        var valueSerializer = RedisSerializationContext.SerializationPair
                .fromSerializer(jsonSerializer);

        var defaults = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(valueSerializer)
                .disableCachingNullValues()
                .entryTtl(Duration.ofMinutes(10));

        var perCache = Map.of(
                "medecins", defaults.entryTtl(Duration.ofMinutes(medecinsTtlMinutes)),
                "medecins-search", defaults.entryTtl(Duration.ofMinutes(medecinsSearchTtlMinutes)),
                "creneaux", defaults.entryTtl(Duration.ofMinutes(creneauxTtlMinutes))
        );

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(perCache)
                .build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new SimpleCacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException e, Cache cache, Object key) {
                log.warn("Cache GET error [{}] key={}: {}", cache.getName(), key, e.getMessage());
            }
            @Override
            public void handleCachePutError(RuntimeException e, Cache cache, Object key, Object value) {
                log.warn("Cache PUT error [{}] key={}: {}", cache.getName(), key, e.getMessage());
            }
            @Override
            public void handleCacheEvictError(RuntimeException e, Cache cache, Object key) {
                log.warn("Cache EVICT error [{}] key={}: {}", cache.getName(), key, e.getMessage());
            }
        };
    }
}
