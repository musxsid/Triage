package com.siddharth.triage.noteservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.siddharth.triage.noteservice.util.CryptoConverter;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "oauth_credentials")
public class OAuthCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String provider = "google";

    @Column(columnDefinition = "TEXT")
    private String accessToken;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = CryptoConverter.class)
    private String refreshToken;

    private Instant tokenExpiry;

    @Column(columnDefinition = "TEXT")
    private String scope;

    private String email;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public Instant getTokenExpiry() { return tokenExpiry; }
    public void setTokenExpiry(Instant tokenExpiry) { this.tokenExpiry = tokenExpiry; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
