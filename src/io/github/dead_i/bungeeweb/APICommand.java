package io.github.dead_i.bungeeweb;

import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;

public abstract class APICommand {
    private String name;
    private int permission = 1;

    public APICommand(String name) {
        this.name = name;
    }

    public APICommand(String name, int permission) {
        this.name = name;
        this.permission = permission;
    }

    public String getName() {
        return name;
    }

    public boolean hasPermission(HttpServletRequest req) {
        return hasPermission(req, permission);
    }

    public boolean hasPermission(HttpServletRequest req, int i) {
        Integer group = (Integer) req.getSession().getAttribute("group");
        if (group == null) group = 0;
        return (group >= i);
    }

    public abstract void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException;
}
