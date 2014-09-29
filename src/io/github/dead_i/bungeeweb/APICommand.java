package io.github.dead_i.bungeeweb;

import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;

public abstract class APICommand {
    private String name;
    private String permission = "";
    private boolean login = false;

    public APICommand(String name) {
        this.name = name;
    }

    public APICommand(String name, String permission) {
        this.name = name;
        this.permission = permission;
    }

    public APICommand(String name, boolean login) {
        this.name = name;
        this.login = login;
    }

    public String getName() {
        return name;
    }

    public boolean hasPermission(HttpServletRequest req) {
        return !login || hasPermission(req, permission);
    }

    public boolean hasPermission(HttpServletRequest req, String i) {
        Integer group = (Integer) req.getSession().getAttribute("group");
        if (group == null) {
            group = 0;
        }

        return group > 0 && (i.isEmpty() || BungeeWeb.getGroupPermissions(group).contains(permission));
    }

    public abstract void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException;
}
