package io.github.dead_i.bungeeweb;

import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

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
        return (Integer.parseInt(req.getParameter("group")) >= permission);
    }

    public boolean checkPermission(HttpServletRequest req, HttpServletResponse res) throws IOException {
        boolean has = hasPermission(req);
        if (!has) res.getWriter().print("{ \"error\": \"You do not have permission to perform this action.\" }");
        return has;
    }

    public abstract void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException;
}
