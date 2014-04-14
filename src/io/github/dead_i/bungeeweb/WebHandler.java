package io.github.dead_i.bungeeweb;

import net.md_5.bungee.api.plugin.Plugin;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class WebHandler extends AbstractHandler {
    Plugin plugin;

    public WebHandler(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public void handle(String target, Request baseReq, HttpServletRequest req, HttpServletResponse res) throws IOException, ServletException {
        res.setContentType("text/html;charset=utf-8");
        res.setStatus(HttpServletResponse.SC_OK);
    }
}
