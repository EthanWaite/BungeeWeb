package io.github.dead_i.bungeeweb;

import com.google.common.io.ByteStreams;
import com.google.gson.Gson;
import net.md_5.bungee.api.plugin.Plugin;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;

public class WebHandler extends AbstractHandler {
    private Plugin plugin;

    public WebHandler(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public void handle(String target, Request baseReq, HttpServletRequest req, HttpServletResponse res) throws IOException, ServletException {
        res.setContentType("text/html;charset=utf-8");
        res.setStatus(HttpServletResponse.SC_OK);
        plugin.getLogger().info("Serving " + target);

        if (target.equals("/")) target = "/index.html";
        String[] path = target.split("/");

        if (path.length > 2 && path[1].equalsIgnoreCase("api")) {
            baseReq.setHandled(true);
            if (path[2].equalsIgnoreCase("getplayer")) {
                ArrayList<String> conditions = new ArrayList<String>();

                String player = req.getParameter("uuid");
                if (player == null) conditions.add("`uuid`=?");

                String from = req.getParameter("time");
                if (from != null) {
                    int time = 0;
                    try {
                        time = Integer.parseInt(from);
                    }catch (NumberFormatException ignored) {}
                    if (time != 0) conditions.add("`time`=?");
                }

                String cond = "";
                if (conditions.size() > 0) {
                    cond = "WHERE ";
                    for (String s : conditions) {
                        cond += s + " AND ";
                    }
                    cond = cond.substring(0, cond.length() - 4);
                }

                try {
                    BungeeWeb.getDatabase().prepareStatement("SELECT * FROM `" + BungeeWeb.getConfig().getString("database.prefix") + "logs` " + cond + "LIMIT 50");
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }else{
            InputStream stream = plugin.getResourceAsStream("web/" + path[1]);
            if (stream != null) {
                baseReq.setHandled(true);
                ByteStreams.copy(stream, res.getOutputStream());
            }
        }
    }
}
