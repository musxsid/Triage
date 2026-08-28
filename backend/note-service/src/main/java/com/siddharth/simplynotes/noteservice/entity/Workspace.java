package com.siddharth.simplynotes.noteservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "workspaces")
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String icon; 
    private String coverImage;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Folder> folders;

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Note> notes;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getIcon() { return icon; }
    public User getUser() { return user; }
    public List<Folder> getFolders() { return folders; }
    public List<Note> getNotes() { return notes; }
    public String getCoverImage() { return coverImage; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setIcon(String icon) { this.icon = icon; }
    public void setUser(User user) { this.user = user; }
    public void setFolders(List<Folder> folders) { this.folders = folders; }
    public void setNotes(List<Note> notes) { this.notes = notes; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
}
