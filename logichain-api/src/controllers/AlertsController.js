const realtimeHub = require('../lib/realtime');

class AlertsController {
  // Flux Server-Sent Events : notifications critiques push vers les agents de terrain
  async stream(ctx, res) {
    const { eventId } = ctx.params;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff'
    });
    res.write(`: connecte au flux d'alertes de l'evenement ${eventId}\n\n`);

    const onAlert = (alert) => {
      res.write(`event: alert\ndata: ${JSON.stringify(alert)}\n\n`);
    };
    realtimeHub.on(`alert:${eventId}`, onAlert);

    // Garde la connexion ouverte (certains proxys ferment les connexions inactives)
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000);

    ctx.req.on('close', () => {
      clearInterval(heartbeat);
      realtimeHub.off(`alert:${eventId}`, onAlert);
    });
  }
}

module.exports = new AlertsController();
