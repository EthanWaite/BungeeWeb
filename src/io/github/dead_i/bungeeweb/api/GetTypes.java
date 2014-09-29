package io.github.dead_i.bungeeweb.api;

import com.google.gson.Gson;
import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;

public class GetTypes extends APICommand {
    private Gson gson = new Gson();

    public GetTypes() {
        super("gettypes", true);
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException {
        HashMap<Integer, String> out = new HashMap<Integer, String>();

        String[] types = {"chat", "command", "join", "quit", "kick", "serverchange"};
        int i = 1;
        for (String t : types) {
            if (BungeeWeb.getConfig().getBoolean("log." + t)) out.put(i, t);
            i++;
        }

        res.getWriter().print(gson.toJson(out));
    }
}
