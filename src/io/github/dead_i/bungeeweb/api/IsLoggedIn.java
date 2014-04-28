package io.github.dead_i.bungeeweb.api;

import io.github.dead_i.bungeeweb.APICommand;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;

public class IsLoggedIn extends APICommand {

    public IsLoggedIn() {
        super("isloggedin", 1);
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException {
        int out = 0;
        if (hasPermission(req)) out = 1;
        res.getWriter().print("{ \"result\": \"" + out + "\" }");
    }
}
