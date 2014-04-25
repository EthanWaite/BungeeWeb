package io.github.dead_i.bungeeweb;

import com.google.common.io.ByteStreams;
import io.github.dead_i.bungeeweb.api.*;
import net.md_5.bungee.api.plugin.Plugin;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;

public class WebHandler extends AbstractHandler {
    private HashMap<String, APICommand> commands = new HashMap<String, APICommand>();
    private Plugin plugin;

    public WebHandler(Plugin plugin) {
        this.plugin = plugin;
        registerCommand(new GetLogs());
        registerCommand(new GetStats());
        registerCommand(new ListServers());
    }

    @Override
    public void handle(String target, Request baseReq, HttpServletRequest req, HttpServletResponse res) throws IOException, ServletException {
        res.setStatus(HttpServletResponse.SC_OK);
        plugin.getLogger().info("Serving " + target);

        if (target.equals("/")) target = "/index.html";
        String[] path = target.split("/");

        plugin.getLogger().info("Got request from ID " + req.getSession().getId());

        if (path.length > 2 && path[1].equalsIgnoreCase("api")) {
            if (commands.containsKey(path[2])) {
                try {
                    commands.get(path[2]).execute(plugin, req, res, path);
                } catch (SQLException e) {
                    plugin.getLogger().warning("A MySQL database error occurred.");
                    e.printStackTrace();
                }
                baseReq.setHandled(true);
            }
        }else if (path.length > 1 && path[1].equalsIgnoreCase("login")) {
            int group = getLogin(req.getParameter("user"), req.getParameter("pass"));
            if (req.getMethod().equals("POST") && group != -1) {
                req.getSession().setAttribute("user", req.getParameter("user"));
                req.getSession().setAttribute("group", group);
                res.getWriter().print("{ \"status\": 1 }");
            }else{
                res.getWriter().print("{ \"status\": 0 }");
            }
            baseReq.setHandled(true);
        }else{
            InputStream stream = plugin.getResourceAsStream("web" + target);
            if (stream != null) {
                baseReq.setHandled(true);
                ByteStreams.copy(stream, res.getOutputStream());
            }
        }
    }

    public void registerCommand(APICommand command) {
        commands.put(command.getName().toLowerCase(), command);
    }

    public int getLogin(String user, String pass) {
        if (user == null || pass == null) return -1;
        try {
            PreparedStatement st = BungeeWeb.getDatabase().prepareStatement("SELECT * FROM `" + BungeeWeb.getConfig().getString("database.prefix") + "users` WHERE `user`=?");
            st.setString(1, user);
            ResultSet rs = st.executeQuery();
            while (rs.next()) if (rs.getString("pass").equals(BungeeWeb.encrypt(pass + rs.getString("salt")))) return rs.getInt("group");
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }
}
