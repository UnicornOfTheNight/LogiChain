/**
 * Routeur maison minimaliste (remplace express.Router).
 * Convertit des patterns du type '/api/v1/events/:eventId/items'
 * en expressions regulieres et extrait les parametres nommes.
 * Chaque route accepte plusieurs handlers (middlewares + controller final) :
 * ils s'executent dans l'ordre, un middleware ne fait qu'enrichir ctx ou
 * lancer une erreur (401/403) ; seul le dernier handler ecrit la reponse.
 */
class Router {
  constructor() {
    this.routes = [];
  }

  add(method, pattern, ...handlers) {
    const paramNames = [];
    const regexPath = pattern
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) {
          paramNames.push(segment.slice(1));
          return '([^/]+)';
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    const regex = new RegExp(`^${regexPath}/?$`);
    this.routes.push({ method, regex, paramNames, handlers });
  }

  get(pattern, ...handlers) {
    this.add('GET', pattern, ...handlers);
  }

  post(pattern, ...handlers) {
    this.add('POST', pattern, ...handlers);
  }

  patch(pattern, ...handlers) {
    this.add('PATCH', pattern, ...handlers);
  }

  delete(pattern, ...handlers) {
    this.add('DELETE', pattern, ...handlers);
  }

  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const found = route.regex.exec(pathname);
      if (found) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(found[index + 1]);
        });
        return { handlers: route.handlers, params };
      }
    }
    return null;
  }
}

module.exports = Router;
