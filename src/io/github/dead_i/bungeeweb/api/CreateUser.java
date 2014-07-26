package io.github.dead_i.bungeeweb.api;

import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class CreateUser extends APICommand {
    public CreateUser() {
        super("createuser", 2);
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException {
        String user = req.getParameter("user");
        String pass = req.getParameter("pass");
        String group = req.getParameter("group");
        String salt = BungeeWeb.salt();

        if (user != null && !user.isEmpty() && pass != null && !pass.isEmpty() && group != null && BungeeWeb.isNumber(group)) {
            if (user.length() <= 16) {
                int groupid = Integer.parseInt(group);
                if (groupid < (Integer) req.getSession().getAttribute("group")) {
                    PreparedStatement st = BungeeWeb.getDatabase().prepareStatement("INSERT INTO `" + BungeeWeb.getConfig().getString("database.prefix") + "users` (`user`, `pass`, `salt`, `group`) VALUES(?, ?, ?, ?)");
                    st.setString(1, user);
                    st.setString(2, BungeeWeb.encrypt(pass, salt));
                    st.setString(3, salt);
                    st.setInt(4, groupid);
                    st.executeUpdate();

                    res.getWriter().print("{ \"status\": 1 }");
                }else{
                    res.getWriter().print("{ \"status\": 0, \"error\": \"You do not have permission to create a user of this group.\" }");
                }
            }else{
                res.getWriter().print("{ \"status\": 0, \"error\": \"The username provided is too long.\" }");
            }
        }else{
            res.getWriter().print("{ \"status\": 0, \"error\": \"Incorrect usage.\" }");
        }
    }
}
