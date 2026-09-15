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
        String path = request.getURI().getPath();

        // Bypass session injection on public auth routes and strip any stale authorization
        if (path.startsWith("/api/auth/google/login") || path.startsWith("/api/auth/google/callback") || path.startsWith("/api/notes/public/")) {
            ServerHttpRequest cleanRequest = request.mutate()
                    .headers(h -> h.remove(HttpHeaders.AUTHORIZATION))
                    .build();
            return chain.filter(exchange.mutate().request(cleanRequest).build());
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // If Authorization header is already a valid JWT (contains dots)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (token.contains(".")) {
                return chain.filter(exchange);
            }
            // If token is a sessionId (UUID), resolve from Redis
            return redisTemplate.opsForValue().get("session:" + token)
                    .flatMap(jwtToken -> {
                        ServerHttpRequest mutatedRequest = request.mutate()
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                                .build();
                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
                    })
                    .switchIfEmpty(chain.filter(exchange));
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
