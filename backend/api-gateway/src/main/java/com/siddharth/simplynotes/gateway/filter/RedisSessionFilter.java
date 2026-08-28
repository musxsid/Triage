package com.siddharth.simplynotes.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RedisSessionFilter implements GlobalFilter, Ordered {

    private final ReactiveStringRedisTemplate redisTemplate;

    public RedisSessionFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // If Authorization header is already present, proceed as is
        if (request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            return chain.filter(exchange);
        }

        // Check for SESSIONID cookie
        HttpCookie sessionCookie = request.getCookies().getFirst("SESSIONID");
        if (sessionCookie != null && !sessionCookie.getValue().isEmpty()) {
            String sessionId = sessionCookie.getValue();
            return redisTemplate.opsForValue().get("session:" + sessionId)
                    .flatMap(jwtToken -> {
                        ServerHttpRequest mutatedRequest = request.mutate()
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                                .build();
                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
                    })
                    .switchIfEmpty(chain.filter(exchange));
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
