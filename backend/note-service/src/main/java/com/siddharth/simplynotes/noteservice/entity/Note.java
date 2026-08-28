package com.siddharth.simplynotes.noteservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "folder_id")
    private Folder folder;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    @JsonIgnore
    private Workspace workspace;
    
    @Column(name = "is_favorite")
    private Boolean isFavorite = false;

    @Column(name = "is_public")
    private Boolean isPublic = false;

    @Column(name = "share_token", unique = true)
    private String shareToken;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public User getUser() { return user; }
    public Folder getFolder() { return folder; }
    public Workspace getWorkspace() { return workspace; }
    public Boolean getIsFavorite() { return isFavorite == null ? false : isFavorite; }
    public Boolean getIsPublic() { return isPublic == null ? false : isPublic; }
    public String getShareToken() { return shareToken; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void setUser(User user) { this.user = user; }
    public void setFolder(Folder folder) { this.folder = folder; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }
    public void setIsFavorite(Boolean favorite) { this.isFavorite = favorite; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    public void setShareToken(String shareToken) { this.shareToken = shareToken; }
}
