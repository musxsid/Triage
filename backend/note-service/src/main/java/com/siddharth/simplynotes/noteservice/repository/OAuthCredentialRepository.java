package com.siddharth.simplynotes.noteservice.repository;

import com.siddharth.simplynotes.noteservice.entity.OAuthCredential;
import com.siddharth.simplynotes.noteservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthCredentialRepository extends JpaRepository<OAuthCredential, Long> {
    Optional<OAuthCredential> findByUserAndProvider(User user, String provider);
}
