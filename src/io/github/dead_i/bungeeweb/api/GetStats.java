package io.github.dead_i.bungeeweb.api;

import com.google.gson.Gson;
import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class GetStats extends APICommand {
    private Gson gson = new Gson();

    public GetStats() {
        super("getstats", "stats");
    }


    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException {
        String since = req.getParameter("since");
        long current = System.currentTimeMillis() / 1000;
        long month = current - 2628000;
        long time = month;

        if (since != null && BungeeWeb.isNumber(since)) time = Integer.parseInt(since);

        if ((current - time) > month) {
            res.getWriter().print("{ \"error\": \"Attempted to fetch too many records. The number of records you request is capped at 1 month for security reasons.\" }");
            return;
        }

        ResultSet rs = BungeeWeb.getDatabase().createStatement().executeQuery("SELECT * FROM `" + BungeeWeb.getConfig().getString("database.prefix") + "stats` WHERE `time`>" + time);

        String[] types = { "playercount", "maxplayers", "activity" };
        HashMap<String, List<Object>> records = new HashMap<String, List<Object>>();
        for (String t : types) records.put(t, new ArrayList<Object>());
        while (rs.next()) for (String t : types) {
            List<Object> record = new ArrayList<Object>();
            record.add((long) rs.getInt("time") * 1000);
            record.add(rs.getInt(t));
            records.get(t).add(record);
        }

        HashMap<String, Object> out = new HashMap<String, Object>();
        out.put("increment", BungeeWeb.getConfig().getInt("server.statscheck"));
        out.put("data", records);

        res.getWriter().print(gson.toJson(out));
    }
}
