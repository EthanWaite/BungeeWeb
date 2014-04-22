package io.github.dead_i.bungeeweb.api;

import com.google.gson.Gson;
import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;

public class GetPlayers extends APICommand {
    private Gson gson = new Gson();

    public GetPlayers() {
        super("getplayers");
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException {
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
}
