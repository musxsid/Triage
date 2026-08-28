package com.siddharth.simplynotes.noteservice.repository;

import com.siddharth.simplynotes.noteservice.entity.Folder;
import com.siddharth.simplynotes.noteservice.entity.User;
import com.siddharth.simplynotes.noteservice.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByUser(User user);
    List<Folder> findByWorkspace(Workspace workspace);
}
