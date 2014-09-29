package io.github.dead_i.bungeeweb.api;

import com.google.common.io.ByteStreams;
import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.sql.SQLException;

public class GetLang extends APICommand {
    public GetLang() {
        super("getlang");
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException {
        String fallback = BungeeWeb.getConfig().getString("server.language");
        String lang = req.getParameter("lang");

        if (lang == null) lang = fallback;

        File file = new File(plugin.getDataFolder(), "lang/" + lang + ".json");
        InputStream stream;
        if (file.exists()) {
            stream = new FileInputStream(file);
        }else{
            stream = plugin.getResourceAsStream("lang/en.json");
        }

        ByteStreams.copy(stream, res.getOutputStream());
    }
}
