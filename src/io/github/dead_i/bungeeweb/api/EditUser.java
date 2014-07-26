package io.github.dead_i.bungeeweb.api;

import io.github.dead_i.bungeeweb.APICommand;
import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.plugin.Plugin;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;

public class EditUser extends APICommand {
    public EditUser() {
        super("edituser", 2);
    }

    @Override
    public void execute(Plugin plugin, HttpServletRequest req, HttpServletResponse res, String[] args) throws IOException, SQLException {
        ArrayList<String> conditions = new ArrayList<String>();
        ArrayList<Object> params = new ArrayList<Object>();

        String user = req.getParameter("user");
        if (user != null && !user.isEmpty() && user.length() <= 16) {
            conditions.add("user");
            params.add(user);
        }

        String pass = req.getParameter("pass");
        if (pass != null && !pass.isEmpty()) {
            String salt = BungeeWeb.salt();
            conditions.add("pass");
            params.add(BungeeWeb.encrypt(pass, salt));
            conditions.add("salt");
            params.add(salt);
        }

        String group = req.getParameter("group");
        int groupid = Integer.parseInt(group);
        if (group != null && !group.isEmpty() && BungeeWeb.isNumber(group)) {
            conditions.add("group");
            params.add(groupid);
        }

        String id = req.getParameter("id");
        if (id != null && !id.isEmpty() && BungeeWeb.isNumber(id) && conditions.size() > 0) {
            int power = BungeeWeb.getGroupPower(req);
            if (!conditions.contains("group") || groupid < power) {
                String cond = "";
                for (String s : conditions) {
                    cond += "`" + s + "`=?, ";
                }
                cond = cond.substring(0, cond.length() - 2);

                PreparedStatement st = BungeeWeb.getDatabase().prepareStatement("UPDATE `" + BungeeWeb.getConfig().getString("database.prefix") + "users` SET " + cond + " WHERE `id`=? AND `group`<?");

                int i = 0;
                for (Object o : params) {
                    i++;
                    st.setObject(i, o);
                }

                st.setInt(i + 1, Integer.parseInt(id));
                st.setInt(i + 2, power);
                st.executeUpdate();

                res.getWriter().print("{ \"status\": 1 }");
            }else{
                res.getWriter().print("{ \"status\": 0, \"error\": \"You do not have permission to edit a user to this group.\" }");
            }
        }else{
            res.getWriter().print("{ \"status\": 0, \"error\": \"Incorrect usage.\" }");
        }
    }
}
