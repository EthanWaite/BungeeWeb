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
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;

public class WebHandler extends AbstractHandler {
    private Gson gson = new Gson();
    private Plugin plugin;

    public WebHandler(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public void handle(String target, Request baseReq, HttpServletRequest req, HttpServletResponse res) throws IOException, ServletException {
        res.setStatus(HttpServletResponse.SC_OK);
        plugin.getLogger().info("Serving " + target);

        if (target.equals("/")) target = "/index.html";
        String[] path = target.split("/");

        plugin.getLogger().info("Got request from ID " + req.getSession().getId());

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
                    } catch (NumberFormatException ignored) {}
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

                ArrayList<Object> out = new ArrayList<Object>();
                try {
                    PreparedStatement st = BungeeWeb.getDatabase().prepareStatement("SELECT * FROM `" + BungeeWeb.getConfig().getString("database.prefix") + "logs` " + cond + "LIMIT 50");
                    ResultSet rs = st.executeQuery();
                    while (rs.next()) {
                        HashMap<String, Object> record = new HashMap<String, Object>();
                        record.put("time", rs.getInt("time"));
                        record.put("type", rs.getInt("type"));
                        record.put("uuid", rs.getString("uuid"));
                        record.put("username", rs.getString("username"));
                        record.put("content", rs.getString("content"));
                        out.add(record);
                    }
                    st.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
                res.getWriter().print(gson.toJson(out));
            }
        }else if (path.length > 1 && path[1].equalsIgnoreCase("login")) {
            if (req.getMethod().equals("POST") && checkLogin(req.getParameter("user"), req.getParameter("pass"))) {
                req.getSession().setAttribute("user", req.getParameter("user"));
                res.setHeader("Location", "/?invalid");
            }else{
                res.setHeader("Location", "/");
            }
        }else{
            InputStream stream = plugin.getResourceAsStream("web" + target);
            if (stream != null) {
                baseReq.setHandled(true);
                ByteStreams.copy(stream, res.getOutputStream());
            }
        }
    }

    public boolean checkLogin(String user, String pass) {
        if (user == null || pass == null) return false;
        try {
            PreparedStatement st = BungeeWeb.getDatabase().prepareStatement("SELECT * FROM `" + BungeeWeb.getConfig().getString("database.prefix") + "users` WHERE `user`=?");
            st.setString(1, user);
            ResultSet rs = st.executeQuery();
            while (rs.next()) if (rs.getString("pass").equals(BungeeWeb.encrypt(pass + rs.getString("salt")))) return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
        return false;
    }
}
