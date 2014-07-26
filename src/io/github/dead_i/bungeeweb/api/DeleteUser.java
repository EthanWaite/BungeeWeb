package io.github.dead_i.bungeeweb.api;

import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class DeleteUser extends APICommand {
    public DeleteUser() {
        super("deleteuser", 2);
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException {
        String id = req.getParameter("id");
        if (id != null && !id.isEmpty() && BungeeWeb.isNumber(id)) {
            PreparedStatement st = BungeeWeb.getDatabase().prepareStatement("DELETE FROM `" + BungeeWeb.getConfig().getString("database.prefix") + "users` WHERE `id`=? AND `group`<=?");
            st.setInt(1, Integer.parseInt(id));
            st.setInt(2, (Integer) req.getSession().getAttribute("group"));
            st.executeUpdate();
            res.getWriter().print("{ \"status\": 1 }");
        }else{
            res.getWriter().print("{ \"status\": 0, \"error\": \"Incorrect usage.\" }");
        }
    }
}
