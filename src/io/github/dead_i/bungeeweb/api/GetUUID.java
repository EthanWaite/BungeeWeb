package io.github.dead_i.bungeeweb.api;

import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class GetUUID extends APICommand {
    public GetUUID() {
        super("getuuid", null);
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException {
        String user = req.getParameter("username");
        if (user == null) {
            res.getWriter().print("{ \"error\": \"A username was not provided.\" }");
            return;
        }

        ResultSet rs = getByUsername(user, false);
        boolean matched = rs.next();
        if (!matched) {
            rs = getByUsername(user, true);
            matched = rs.next();
        }

        if (matched) {
            res.getWriter().print("{ \"uuid\": \"" + rs.getString("uuid") + "\" }");
        }else{
            res.getWriter().print("{ \"error\": \"No such username exists in the database.\" }");
        }
    }

    private ResultSet getByUsername(String search, boolean partial) throws SQLException {
        PreparedStatement st = BungeeWeb.getDatabase().prepareStatement("SELECT * FROM `" + BungeeWeb.getConfig().getString("database.prefix") + "log` WHERE `username` LIKE ? ORDER BY `id` DESC LIMIT 1");
        st.setString(1, partial ? "%" + search + "%" : search);
        return st.executeQuery();
    }
}
