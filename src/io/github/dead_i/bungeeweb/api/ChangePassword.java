package io.github.dead_i.bungeeweb.api;

import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class ChangePassword extends APICommand {
    public ChangePassword() {
        super("changepassword", "settings.password");
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException {
        String current = req.getParameter("currentpass");
        String pass = req.getParameter("newpass");
        String confirm = req.getParameter("confirmpass");
        if (current != null && pass != null && confirm != null && pass.equals(confirm) && BungeeWeb.getLogin((String) req.getSession().getAttribute("user"), current) != null) {
            PreparedStatement st = BungeeWeb.getDatabase().prepareStatement("UPDATE `" + BungeeWeb.getConfig().getString("database.prefix") + "users` SET `pass`=?, `salt`=? WHERE `id`=?");
            String salt = BungeeWeb.salt();
            st.setString(1, BungeeWeb.encrypt(req.getParameter("newpass"), salt));
            st.setString(2, salt);
            st.setInt(3, Integer.parseInt((String) req.getSession().getAttribute("id")));
            st.executeUpdate();
            res.getWriter().print("{ \"status\": 1 }");
        }else{
            res.getWriter().print("{ \"status\": 0 }");
        }
    }
}
