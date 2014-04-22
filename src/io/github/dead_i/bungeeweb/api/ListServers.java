package io.github.dead_i.bungeeweb.api;

import com.google.gson.Gson;
import io.github.dead_i.bungeeweb.APICommand;
import net.md_5.bungee.api.config.ServerInfo;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;

public class ListServers extends APICommand {
    private Gson gson = new Gson();

    public ListServers() {
        super("listservers");
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException {
        HashMap<String, Integer> out = new HashMap<String, Integer>();
        for (ServerInfo info : plugin.getProxy().getServers().values()) out.put(info.getName(), info.getPlayers().size());
        res.getWriter().print(gson.toJson(out));
    }
}
