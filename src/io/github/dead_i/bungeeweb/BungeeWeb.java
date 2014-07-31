package io.github.dead_i.bungeeweb;

import com.google.common.io.ByteStreams;
import io.github.dead_i.bungeeweb.listeners.*;
import net.md_5.bungee.api.connection.ProxiedPlayer;
import net.md_5.bungee.api.plugin.Plugin;
import net.md_5.bungee.config.Configuration;
import net.md_5.bungee.config.ConfigurationProvider;
import net.md_5.bungee.config.YamlConfiguration;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ContextHandler;
import org.eclipse.jetty.server.session.HashSessionIdManager;
import org.eclipse.jetty.server.session.HashSessionManager;
import org.eclipse.jetty.server.session.SessionHandler;
import org.eclipse.jetty.util.log.StdErrLog;
import org.eclipse.jetty.util.security.Password;
import org.mcstats.Metrics;

import javax.servlet.http.HttpServletRequest;
import javax.xml.bind.DatatypeConverter;
import java.io.*;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Properties;
import java.util.concurrent.TimeUnit;

public class BungeeWeb extends Plugin {
    private static Configuration config;
    private static DatabaseManager manager;

    public void onEnable() {
        // Run metrics
        final Plugin plugin = this;
        getProxy().getScheduler().runAsync(this, new Runnable() {
            @Override
            public void run() {
                try {
                    Metrics metrics = new Metrics(plugin);
                    metrics.start();
                } catch (IOException e) {
                    getLogger().info("Unable to connect to Metrics for plugin statistics.");
                }
            }
        });

        // Get configuration
        if (!getDataFolder().exists()) getDataFolder().mkdir();
        File configFile = new File(getDataFolder(), "config.yml");
        try {
            if (!configFile.exists()) {
                configFile.createNewFile();
                ByteStreams.copy(getResourceAsStream("config.yml"), new FileOutputStream(configFile));
                getLogger().warning("A new configuration file has been created. Please edit config.yml and restart BungeeCord.");
                return;
            }
            config = ConfigurationProvider.getProvider(YamlConfiguration.class).load(configFile);
        } catch (IOException e) {
            e.printStackTrace();
        }

        // Setup locales
        setupLocale("en");

        // Connect to the database
        manager = new DatabaseManager(this, "jdbc:mysql://" + getConfig().getString("database.host") + ":" + getConfig().getInt("database.port") + "/" + getConfig().getString("database.db") + "?useUnicode=true&characterEncoding=utf8", getConfig().getString("database.user"), getConfig().getString("database.pass"));
        Connection db = getDatabase();
        if (db == null) {
            getLogger().severe("BungeeWeb is disabling. Please check your database settings in your config.yml");
            return;
        }

        // Initial database table setup
        try {
            db.createStatement().executeUpdate("CREATE TABLE IF NOT EXISTS `" + getConfig().getString("database.prefix") + "log` (`id` int(16) NOT NULL AUTO_INCREMENT, `time` int(10) NOT NULL, `type` int(2) NOT NULL, `uuid` varchar(32) NOT NULL, `username` varchar(16) NOT NULL, `content` varchar(100) NOT NULL DEFAULT '', PRIMARY KEY (`id`)) CHARACTER SET utf8");
            db.createStatement().executeUpdate("CREATE TABLE IF NOT EXISTS `" + getConfig().getString("database.prefix") + "users` (`id` int(4) NOT NULL AUTO_INCREMENT, `user` varchar(16) NOT NULL, `pass` varchar(32) NOT NULL, `salt` varchar(16) NOT NULL, `group` int(1) NOT NULL DEFAULT '1', PRIMARY KEY (`id`)) CHARACTER SET utf8");
            db.createStatement().executeUpdate("CREATE TABLE IF NOT EXISTS `" + getConfig().getString("database.prefix") + "stats` (`id` int(16) NOT NULL AUTO_INCREMENT, `time` int(10) NOT NULL, `playercount` int(6) NOT NULL DEFAULT -1, `maxplayers` int(6) NOT NULL DEFAULT -1, `activity` int(12) NOT NULL DEFAULT -1, PRIMARY KEY (`id`)) CHARACTER SET utf8");

            ResultSet rs = db.createStatement().executeQuery("SELECT COUNT(*) FROM `" + getConfig().getString("database.prefix") + "users`");
            while (rs.next()) if (rs.getInt(1) == 0) {
                String salt = salt();
                db.createStatement().executeUpdate("INSERT INTO `" + getConfig().getString("database.prefix") + "users` (`user`, `pass`, `salt`, `group`) VALUES('admin', '" + encrypt("admin", salt) + "', '" + salt + "', 3)");
                getLogger().warning("A new admin account has been created.");
                getLogger().warning("Both the username and password is 'admin'. Please change the password after first logging in.");
            }
        } catch (SQLException e) {
            getLogger().severe("Unable to connect to the database. Disabling...");
            e.printStackTrace();
            return;
        }

        // Start automatic chunking
        //getProxy().getScheduler().schedule(this, new PurgeScheduler("log", 30), 10, 10, TimeUnit.MINUTES);
        //getProxy().getScheduler().schedule(this, new PurgeScheduler("stats", 30), 10, 10, TimeUnit.MINUTES);

        // Register listeners
        getProxy().getPluginManager().registerListener(this, new ChatListener());
        getProxy().getPluginManager().registerListener(this, new PlayerDisconnectListener());
        getProxy().getPluginManager().registerListener(this, new PostLoginListener());
        getProxy().getPluginManager().registerListener(this, new ServerConnectedListener());
        getProxy().getPluginManager().registerListener(this, new ServerKickListener());

        // Graph loops
        int inc = getConfig().getInt("server.statscheck");
        if (inc > 0) getProxy().getScheduler().schedule(this, new StatusCheck(this, inc), inc, inc, TimeUnit.SECONDS);

        // Setup logging
        org.eclipse.jetty.util.log.Log.setLog(new JettyLogger());
        Properties p = new Properties();
        p.setProperty("org.eclipse.jetty.LEVEL", "WARN");
        StdErrLog.setProperties(p);

        // Setup the context
        ContextHandler context = new ContextHandler("/");
        SessionHandler sessions = new SessionHandler(new HashSessionManager());
        sessions.setHandler(new WebHandler(this));
        context.setHandler(sessions);

        // Setup the server
        final Server server = new Server(getConfig().getInt("server.port"));
        server.setSessionIdManager(new HashSessionIdManager());
        server.setHandler(sessions);
        server.setStopAtShutdown(true);

        // Start listening
        getProxy().getScheduler().runAsync(this, new Runnable() {
            @Override
            public void run() {
                try {
                    server.start();
                } catch(Exception e) {
                    getLogger().warning("Unable to bind web server to port.");
                    e.printStackTrace();
                }
            }
        });
    }

    public void setupLocale(String lang) {
        File langs = new File(getDataFolder(), "lang");
        try {
            if (!langs.exists()) {
                langs.mkdir();
                File readme = new File(langs, "REAMDE.md");
                readme.createNewFile();
                ByteStreams.copy(getResourceAsStream("lang/README.md"), new FileOutputStream(readme));
            }

            File file = new File(langs, lang + ".json");
            if (!file.exists()) file.createNewFile();
            ByteStreams.copy(getResourceAsStream("lang/" + lang + ".json"), new FileOutputStream(file));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static Configuration getConfig() {
        return config;
    }

    public static Connection getDatabase() {
        return manager.getConnection();
    }

    public static void log(ProxiedPlayer player, int type) {
        log(player, type, "");
    }

    public static void log(ProxiedPlayer player, int type, String content) {
        try {
            PreparedStatement st = getDatabase().prepareStatement("INSERT INTO `" + getConfig().getString("database.prefix") + "log` (`time`, `type`, `uuid`, `username`, `content`) VALUES(?, ?, ?, ?, ?)");
            st.setLong(1, System.currentTimeMillis() / 1000);
            st.setInt(2, type);
            st.setString(3, getUUID(player));
            st.setString(4, player.getName());
            st.setString(5, content);
            st.executeUpdate();
            st.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static String getUUID(ProxiedPlayer p) {
        return p.getUniqueId().toString().replace("-", "");
    }

    public static ResultSet getLogin(String user, String pass) {
        if (user == null || pass == null) return null;
        try {
            PreparedStatement st = getDatabase().prepareStatement("SELECT * FROM `" + BungeeWeb.getConfig().getString("database.prefix") + "users` WHERE `user`=?");
            st.setString(1, user);
            ResultSet rs = st.executeQuery();
            while (rs.next()) if (rs.getString("pass").equals(BungeeWeb.encrypt(pass + rs.getString("salt")))) return rs;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static int getGroupPower(HttpServletRequest req) {
        int group = (Integer) req.getSession().getAttribute("group");
        if (group >= 3) group++;
        return group;
    }

    public static String encrypt(String pass) {
        return Password.MD5.digest(pass).split(":")[1];
    }

    public static String encrypt(String pass, String salt) {
        return encrypt(pass + salt);
    }

    public static String salt() {
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        return DatatypeConverter.printBase64Binary(salt).substring(0, 16);
    }

    public static boolean isNumber(String number) {
        int o;
        try {
            o = Integer.parseInt(number);
        } catch (NumberFormatException ignored) {
            return false;
        }
        return o >= 0;
    }
}
