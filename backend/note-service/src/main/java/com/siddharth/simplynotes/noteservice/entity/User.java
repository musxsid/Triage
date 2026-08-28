package com.siddharth.simplynotes.noteservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    private String password;
    private String firstName;
    private String lastName;
    private String email;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Workspace> workspaces;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore 
    private List<Note> notes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore 
    private List<Folder> folders;

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public List<Workspace> getWorkspaces() { return workspaces; }
    public List<Note> getNotes() { return notes; }
    public List<Folder> getFolders() { return folders; }

    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setEmail(String email) { this.email = email; }
    public void setWorkspaces(List<Workspace> workspaces) { this.workspaces = workspaces; }
    public void setNotes(List<Note> notes) { this.notes = notes; }
    public void setFolders(List<Folder> folders) { this.folders = folders; }
}
