package ma.doctorek.doctorek.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
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
public class CacheConfig {

    @Value("${spring.cache.redis.ttl-minutes.medecins:10}")
    private long medecinsTtlMinutes;

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
                "creneaux", defaults.entryTtl(Duration.ofMinutes(creneauxTtlMinutes))
        );

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(perCache)
                .build();
    }
}
