# MIREX Tracking Operativo

Prototipo funcional en React para centralizar el seguimiento de solicitudes de envio de documentos y paquetes oficiales del MIREX, gestionadas por Importadex / Flypack.

## Funcionalidades

- Panel operativo de ordenes con busqueda, filtros y metricas.
- Vista detalle con informacion de solicitud, destinatario, evidencia, comentarios e historial.
- Edicion de estado operativo y numero de tracking DHL.
- Simulacion de consulta DHL preparada para integracion real.
- Reportes ejecutivos por mes, tipo de solicitud, destino, oficina, estado e incidencias.
- Datos simulados realistas para presentar el flujo actual y su evolucion.

## Comandos

```bash
npm install
npm run dev
npm run build
```

## Demo gratuito

El proyecto esta preparado para publicarse con GitHub Pages mediante GitHub Actions.
Cuando Pages este activo para este repositorio, el demo quedara disponible en:

```text
https://legnarleunam.github.io/web-based-tracking-system-Importadex/
```

El prototipo no requiere backend. Los puntos de integracion futura estan comentados en el codigo.
