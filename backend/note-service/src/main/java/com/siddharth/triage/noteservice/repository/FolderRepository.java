package com.siddharth.triage.noteservice.repository;

import com.siddharth.triage.noteservice.entity.Folder;
import com.siddharth.triage.noteservice.entity.User;
import com.siddharth.triage.noteservice.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByUser(User user);
    List<Folder> findByWorkspace(Workspace workspace);
}
