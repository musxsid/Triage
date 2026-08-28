package com.siddharth.simplynotes.noteservice.repository;

import com.siddharth.simplynotes.noteservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}
