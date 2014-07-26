package io.github.dead_i.bungeeweb;

import com.google.common.io.ByteStreams;
import io.github.dead_i.bungeeweb.api.*;
import net.md_5.bungee.api.plugin.Plugin;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

import javax.activation.MimetypesFileTypeMap;
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
        registerCommand(new ChangePassword());
        registerCommand(new EditUser());
        registerCommand(new GetLogs());
        registerCommand(new GetServers());
        registerCommand(new GetStats());
        registerCommand(new GetTypes());
        registerCommand(new GetUsers());
        registerCommand(new GetUUID());
        registerCommand(new IsLoggedIn());
        registerCommand(new ListServers());
    }

    @Override
    public void handle(String target, Request baseReq, HttpServletRequest req, HttpServletResponse res) throws IOException, ServletException {
        res.setStatus(HttpServletResponse.SC_OK);

        if (target.equals("/")) target = "/index.html";
        String[] path = target.split("/");

        if (path.length > 2 && path[1].equalsIgnoreCase("api")) {
            if (commands.containsKey(path[2])) {
                try {
                    APICommand command = commands.get(path[2]);
                    if (command.hasPermission(req)) {
                        command.execute(plugin, req, res, path);
                    }else{
                        res.getWriter().print("{ \"error\": \"You do not have permission to perform this action.\" }");
                    }
                } catch (SQLException e) {
                    plugin.getLogger().warning("A MySQL database error occurred.");
                    e.printStackTrace();
                }
                baseReq.setHandled(true);
            }
        }else if (path.length > 1 && path[1].equalsIgnoreCase("login")) {
            ResultSet rs = BungeeWeb.getLogin(req.getParameter("user"), req.getParameter("pass"));
            if (req.getMethod().equals("POST") && rs != null) {
                try {
                    req.getSession().setAttribute("id", rs.getString("id"));
                    req.getSession().setAttribute("user", rs.getString("user"));
                    req.getSession().setAttribute("group", rs.getInt("group"));
                    res.getWriter().print("{ \"status\": 1 }");
                } catch(SQLException e) {
                    plugin.getLogger().warning("A MySQL database error occurred.");
                    e.printStackTrace();
                }
            }else{
                res.getWriter().print("{ \"status\": 0 }");
            }
            baseReq.setHandled(true);
        }else if (path.length > 1 && path[1].equalsIgnoreCase("logout")) {
            req.getSession().invalidate();
            res.sendRedirect("/");
            baseReq.setHandled(true);
        }else{
            String file = "web" + target;
            res.setContentType(getContentType(file));
            InputStream stream = plugin.getResourceAsStream(file);
            if (stream != null) {
                baseReq.setHandled(true);
                ByteStreams.copy(stream, res.getOutputStream());
            }
        }
    }

    public void registerCommand(APICommand command) {
        commands.put(command.getName().toLowerCase(), command);
    }

    public String getContentType(String filename) {
        MimetypesFileTypeMap map = new MimetypesFileTypeMap();
        map.addMimeTypes("text/html html htm");
        map.addMimeTypes("text/javascript js json");
        map.addMimeTypes("text/css css");
        map.addMimeTypes("image/jpeg jpg jpeg");
        map.addMimeTypes("image/gif gif");
        map.addMimeTypes("image/png png");
        return map.getContentType(filename.toLowerCase());
    }
}
