package io.github.dead_i.bungeeweb;

import com.google.common.io.ByteStreams;
import net.md_5.bungee.api.plugin.Plugin;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;

public class WebHandler extends AbstractHandler {
    Plugin plugin;

    public WebHandler(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public void handle(String target, Request baseReq, HttpServletRequest req, HttpServletResponse res) throws IOException, ServletException {
        res.setContentType("text/html;charset=utf-8");
        res.setStatus(HttpServletResponse.SC_OK);
        plugin.getLogger().info("Serving " + target);

        if (target.equals("/")) target = "/index.html";
        String[] path = target.split("/");

        if (target.startsWith("/api/")) {
            //TODO api
        }else{
            InputStream stream = plugin.getResourceAsStream("web/" + path[1]);
            if (stream != null) {
                baseReq.setHandled(true);
                ByteStreams.copy(stream, res.getOutputStream());
            }
        }
    }
}
