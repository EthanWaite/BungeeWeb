package io.github.dead_i.bungeeweb.api;

import com.google.gson.Gson;
import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.config.ServerInfo;
import net.md_5.bungee.api.connection.ProxiedPlayer;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;

public class GetServers extends APICommand {
    private Gson gson = new Gson();

    public GetServers() {
        super("getservers", 1);
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException {
        HashMap<String, HashMap> out = new HashMap<String, HashMap>();
        for (ServerInfo info : plugin.getProxy().getServers().values()) {
            HashMap<String, String> players = new HashMap<String, String>();
            int i = 0;
            for (ProxiedPlayer p : info.getPlayers()) {
                players.put(BungeeWeb.getUUID(p), p.getName());
                i++;
                if (i > 50) break;
            }
            out.put(info.getName(), players);
        }
        res.getWriter().print(gson.toJson(out));
    }
}
