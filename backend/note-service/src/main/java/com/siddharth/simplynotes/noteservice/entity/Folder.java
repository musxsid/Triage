package com.siddharth.simplynotes.noteservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
public class Folder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    @JsonIgnore
    private Workspace workspace;

    @OneToMany(mappedBy = "folder")
    @JsonIgnore 
    private List<Note> notes;

    public Long getId() { return id; }
    public String getName() { return name; }
    public User getUser() { return user; }
    public Workspace getWorkspace() { return workspace; }
    public List<Note> getNotes() { return notes; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setUser(User user) { this.user = user; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }
    public void setNotes(List<Note> notes) { this.notes = notes; }
}
