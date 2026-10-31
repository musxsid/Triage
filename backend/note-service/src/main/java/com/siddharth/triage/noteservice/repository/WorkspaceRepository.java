package com.siddharth.triage.noteservice.repository;

import com.siddharth.triage.noteservice.entity.User;
import com.siddharth.triage.noteservice.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    List<Workspace> findByUser(User user);
}
